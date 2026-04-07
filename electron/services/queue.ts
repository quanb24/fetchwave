import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import type { DownloadJob, JobPriority } from '../domain/job';
import { initialProgress, priorityRank } from '../domain/job';
import type { AppSettings } from '../domain/settings';
import type { MediaInfo } from '../domain/media';
import { newId } from '../utils/id';
import { ensureDir, uniquePath } from '../utils/fs';
import { startDownload, DownloadHandle, analyze } from './ytdlp';
import { AppError } from '../domain/errors';
import { logger } from './logger';

export interface AddInput {
  url: string;
  formatSelector?: string;
  outputDir?: string;
  priority?: JobPriority;
  title?: string | null;
  parentId?: string | null;
  playlistIndex?: number | null;
  playlistCount?: number | null;
}

type Persister = (jobs: DownloadJob[]) => void;

export class DownloadQueue extends EventEmitter {
  private jobs = new Map<string, DownloadJob>();
  private handles = new Map<string, DownloadHandle>();
  private retryTimers = new Map<string, NodeJS.Timeout>();
  private getSettings: () => AppSettings;
  private persister: Persister;

  constructor(getSettings: () => AppSettings, persister: Persister = () => {}) {
    super();
    this.getSettings = getSettings;
    this.persister = persister;
  }

  /** Hydrate from persisted snapshot. Running/queued jobs become queued. */
  hydrate(snapshot: DownloadJob[]): void {
    for (const j of snapshot) {
      const restored: DownloadJob = {
        ...j,
        status: j.status === 'running' ? 'queued' : j.status,
        pid: null,
        nextRetryAt: null,
      };
      this.jobs.set(restored.id, restored);
    }
    this.emitSnapshot();
    this.tick();
  }

  list(): DownloadJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => {
      const pr = priorityRank[a.priority] - priorityRank[b.priority];
      if (pr !== 0) return pr;
      return a.createdAt - b.createdAt;
    });
  }

  async add(input: AddInput): Promise<DownloadJob | DownloadJob[]> {
    const settings = this.getSettings();
    const outputDir = input.outputDir ?? settings.downloadPath;
    ensureDir(outputDir);

    // Playlist expansion is opt-in via settings AND only kicks in for URLs
    // that look like playlists. We do NOT pre-analyze every URL because that
    // adds 10–20s of yt-dlp bootstrap to every Add. yt-dlp itself handles
    // single-video URLs perfectly with --no-playlist.
    const looksLikePlaylist = /[?&]list=/.test(input.url) || /\/playlist\?/.test(input.url);
    if (settings.expandPlaylists && looksLikePlaylist && !input.parentId && input.playlistIndex == null) {
      let info: MediaInfo | null = null;
      try {
        info = await analyze(input.url, settings, true);
      } catch {
        info = null;
      }
      if (info && info.isPlaylist && info.entries.length > 0) {
        return this.expandPlaylist(info, input, outputDir);
      }
    }

    const job = this.makeJob(input, outputDir);
    this.jobs.set(job.id, job);
    this.emit('jobAdded', job);
    this.persist();
    this.tick();
    return job;
  }

  private expandPlaylist(info: MediaInfo, input: AddInput, outputDir: string): DownloadJob[] {
    const parent = this.makeJob(
      { ...input, title: info.title, priority: input.priority ?? 'normal' },
      outputDir,
    );
    parent.isPlaylistParent = true;
    parent.playlistCount = info.entries.length;
    parent.status = 'completed'; // parent is a grouping marker
    parent.progress.percent = 0;
    this.jobs.set(parent.id, parent);
    this.emit('jobAdded', parent);

    const children: DownloadJob[] = [];
    info.entries.forEach((entry, idx) => {
      const child = this.makeJob(
        {
          url: entry.url || input.url,
          formatSelector: input.formatSelector,
          outputDir,
          priority: input.priority,
          title: entry.title,
          parentId: parent.id,
          playlistIndex: idx + 1,
          playlistCount: info.entries.length,
        },
        outputDir,
      );
      this.jobs.set(child.id, child);
      this.emit('jobAdded', child);
      children.push(child);
    });

    this.persist();
    this.tick();
    return [parent, ...children];
  }

  private makeJob(input: AddInput, outputDir: string): DownloadJob {
    const settings = this.getSettings();
    return {
      id: newId(),
      parentId: input.parentId ?? null,
      url: input.url,
      title: input.title ?? null,
      outputDir,
      formatSelector: input.formatSelector ?? '',
      status: 'queued',
      progress: initialProgress(),
      priority: input.priority ?? 'normal',
      createdAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      error: null,
      errorRaw: null,
      outputFile: null,
      pid: null,
      attempts: 0,
      maxAttempts: settings.maxRetries + 1,
      nextRetryAt: null,
      isPlaylistParent: false,
      playlistIndex: input.playlistIndex ?? null,
      playlistCount: input.playlistCount ?? null,
    };
  }

  cancel(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    this.clearRetry(id);
    const handle = this.handles.get(id);
    if (handle) handle.cancel();
    if (job.status !== 'running') {
      this.update(id, { status: 'cancelled', finishedAt: Date.now() });
    }
  }

  pause(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    this.clearRetry(id);
    const handle = this.handles.get(id);
    if (handle) handle.cancel();
    this.update(id, { status: 'paused' });
  }

  resume(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    if (['paused', 'failed', 'cancelled'].includes(job.status)) {
      this.update(id, { status: 'queued', error: null, nextRetryAt: null });
      this.tick();
    }
  }

  remove(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    if (job.status === 'running') this.cancel(id);
    this.clearRetry(id);
    // Remove children if parent
    if (job.isPlaylistParent) {
      for (const c of Array.from(this.jobs.values())) {
        if (c.parentId === id) {
          this.jobs.delete(c.id);
          this.emit('jobRemoved', c.id);
        }
      }
    }
    this.jobs.delete(id);
    this.emit('jobRemoved', id);
    this.persist();
  }

  clearCompleted(): void {
    for (const j of Array.from(this.jobs.values())) {
      if (['completed', 'cancelled', 'failed'].includes(j.status) && !j.isPlaylistParent) {
        this.jobs.delete(j.id);
        this.emit('jobRemoved', j.id);
      }
    }
    this.persist();
  }

  setPriority(id: string, priority: JobPriority): void {
    this.update(id, { priority });
    this.tick();
  }

  private update(id: string, patch: Partial<DownloadJob>): void {
    const job = this.jobs.get(id);
    if (!job) return;
    const next: DownloadJob = {
      ...job,
      ...patch,
      progress: { ...job.progress, ...(patch.progress ?? {}) },
    };
    this.jobs.set(id, next);
    this.emit('jobUpdated', next);
    this.persist();
  }

  private runningCount(): number {
    let n = 0;
    for (const j of this.jobs.values()) if (j.status === 'running') n++;
    return n;
  }

  private nextQueued(): DownloadJob | null {
    const now = Date.now();
    for (const j of this.list()) {
      if (j.status !== 'queued') continue;
      if (j.nextRetryAt && j.nextRetryAt > now) continue;
      return j;
    }
    return null;
  }

  private tick(): void {
    const settings = this.getSettings();
    while (this.runningCount() < settings.concurrency) {
      const next = this.nextQueued();
      if (!next) return;
      this.start(next.id);
    }
  }

  private start(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    const settings = this.getSettings();

    logger.info(`[queue] start job ${id} url=${job.url} outputDir=${job.outputDir}`);
    this.update(id, {
      status: 'running',
      startedAt: job.startedAt ?? Date.now(),
      attempts: job.attempts + 1,
      error: null,
    });

    let handle: DownloadHandle;
    try {
      handle = startDownload(
        job.url,
        job.outputDir,
        settings,
        {
          onLine: (line) => { if (line) logger.debug(`[queue/${id}] ${line}`); },
          onProgress: (parsed) => {
            if (!parsed) return;
            const patch: Partial<DownloadJob> = {};
            if (parsed.progress) patch.progress = parsed.progress as DownloadJob['progress'];
            if (parsed.outputFile) patch.outputFile = parsed.outputFile;
            this.update(id, patch);
          },
          onError: (chunk) => {
            const cur = this.jobs.get(id);
            if (!cur) return;
            logger.warn(`[queue/${id}] stderr: ${chunk.trim().slice(0, 2000)}`);
            this.update(id, { errorRaw: ((cur.errorRaw ?? '') + chunk).slice(-4000) });
          },
          onExit: (code, _signal, classified) => {
            const cur = this.jobs.get(id);
            if (!cur) return;
            logger.info(`[queue/${id}] exited code=${code} classified=${classified?.code ?? 'none'}`);
            this.handles.delete(id);

            if (cur.status === 'paused') { this.tick(); return; }

            if (code === 0) {
              this.finalizeSuccess(id);
              this.tick();
              return;
            }

            // Cancelled explicitly
            if (classified?.code === 'CANCELLED') {
              if (cur.status !== 'cancelled') {
                this.update(id, { status: 'cancelled', finishedAt: Date.now(), error: classified.toJSON() });
              }
              this.tick();
              return;
            }

            const err = classified ?? new AppError('DOWNLOAD_FAILED', `yt-dlp exited with code ${code}`);
            const canRetry = err.retryable && cur.attempts < cur.maxAttempts;
            if (canRetry) {
              this.scheduleRetry(id, err);
            } else {
              this.update(id, { status: 'failed', finishedAt: Date.now(), error: err.toJSON() });
            }
            this.tick();
          },
        },
        job.formatSelector || undefined,
        job.playlistIndex,
      );
    } catch (e) {
      const err = AppError.from(e);
      logger.error(`[queue/${id}] startDownload threw: ${err.message}`);
      this.update(id, { status: 'failed', error: err.toJSON(), finishedAt: Date.now() });
      this.tick();
      return;
    }

    this.handles.set(id, handle);
    logger.info(`[queue/${id}] spawned, pid=${handle.child.pid ?? 'unknown'}`);
    this.update(id, { pid: handle.child.pid ?? null });
  }

  private finalizeSuccess(id: string): void {
    const cur = this.jobs.get(id);
    if (!cur) return;

    let outputFile = cur.outputFile;
    const settings = this.getSettings();

    // Collision strategy "rename" post-processing
    if (outputFile && settings.collisionStrategy === 'rename') {
      try {
        if (fs.existsSync(outputFile)) {
          // File already finalized by yt-dlp under its chosen name — that's fine
        }
      } catch { /* ignore */ }
    }

    // Cleanup stale .part / .ytdl for this job
    if (outputFile) {
      for (const ext of ['.part', '.ytdl']) {
        const stale = outputFile + ext;
        try { if (fs.existsSync(stale)) fs.unlinkSync(stale); } catch { /* ignore */ }
      }
      // Apply rename strategy if target name collides with something pre-existing
      if (settings.collisionStrategy === 'rename') {
        try {
          const dir = path.dirname(outputFile);
          const base = path.basename(outputFile);
          const unique = uniquePath(path.join(dir, base));
          if (unique !== outputFile && fs.existsSync(outputFile)) {
            fs.renameSync(outputFile, unique);
            outputFile = unique;
          }
        } catch { /* ignore */ }
      }
    }

    // Capture the real on-disk file size so the UI can show "Final size" on
    // the completed card. This is the authoritative size after merging /
    // remuxing, not the per-stream estimate.
    let finalBytes: number | null = cur.progress.totalBytes;
    if (outputFile) {
      try {
        const st = fs.statSync(outputFile);
        if (st.isFile()) finalBytes = st.size;
      } catch { /* ignore */ }
    }

    this.update(id, {
      status: 'completed',
      finishedAt: Date.now(),
      progress: { ...cur.progress, percent: 100, totalBytes: finalBytes },
      outputFile,
    });
  }

  private scheduleRetry(id: string, err: AppError): void {
    const cur = this.jobs.get(id);
    if (!cur) return;
    const settings = this.getSettings();
    const backoff = Math.min(
      settings.retryBaseDelayMs * Math.pow(2, cur.attempts - 1),
      60_000,
    );
    const nextRetryAt = Date.now() + backoff;
    this.update(id, { status: 'queued', error: err.toJSON(), nextRetryAt });

    const t = setTimeout(() => {
      this.retryTimers.delete(id);
      this.tick();
    }, backoff);
    this.retryTimers.set(id, t);
  }

  private clearRetry(id: string): void {
    const t = this.retryTimers.get(id);
    if (t) { clearTimeout(t); this.retryTimers.delete(id); }
  }

  private emitSnapshot(): void {
    for (const j of this.jobs.values()) this.emit('jobAdded', j);
  }

  private persist(): void {
    try { this.persister(Array.from(this.jobs.values())); } catch { /* non-fatal */ }
  }
}
