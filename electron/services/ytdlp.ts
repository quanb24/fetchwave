import { spawn, ChildProcess } from 'node:child_process';
import { AppError, classifyYtdlpError } from '../domain/errors';
import { logger } from './logger';
import type { MediaInfo, FormatOption, SubtitleOption } from '../domain/media';
import type { AppSettings } from '../domain/settings';
import { buildAnalyzeArgs, buildDownloadArgs } from './argBuilder';
import { parseLine } from './progressParser';
import { resolveBinary, ensureExecutable } from './runtimePaths';

const URL_RE = /^https?:\/\/[^\s"']+$/i;

export function validateUrl(url: string): void {
  if (!URL_RE.test(url)) {
    throw new AppError('INVALID_URL', 'The URL provided is not valid.', { detail: url });
  }
}

function spawnDetachedCapture(bin: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (err: Error | null, val?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err); else resolve(val ?? '');
    };
    const timer = setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, 'SIGKILL');
      } catch { try { child.kill('SIGKILL'); } catch { /* ignore */ } }
      finish(new Error(`timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout?.on('data', (c) => { stdout += c.toString('utf8'); });
    child.stderr?.on('data', (c) => { stderr += c.toString('utf8'); });
    child.on('error', (e) => finish(e));
    child.on('exit', (code) => {
      if (code === 0) finish(null, stdout);
      else finish(new Error(`exit ${code}: ${stderr.slice(0, 500)}`));
    });
  });
}

export async function detect(settings: AppSettings): Promise<{ available: boolean; version: string | null; path: string }> {
  const resolved = resolveBinary('yt-dlp', settings.ytdlpPath);
  ensureExecutable(resolved);
  // Trust the bundled binary's presence — see diagnostics.ts for why we don't
  // run --version here. Real failures surface at the first actual download.
  const fs = require('node:fs') as typeof import('node:fs');
  if (fs.existsSync(resolved)) {
    return { available: true, version: 'bundled', path: resolved };
  }
  return { available: false, version: null, path: resolved };
}

export async function analyze(url: string, settings: AppSettings, allowPlaylist = true): Promise<MediaInfo> {
  validateUrl(url);
  const args = buildAnalyzeArgs(url, settings, allowPlaylist);
  const ytdlpBin = resolveBinary('yt-dlp', settings.ytdlpPath);
  ensureExecutable(ytdlpBin);
  try {
    const stdout = await spawnDetachedCapture(ytdlpBin, args, 90_000);
    const json = JSON.parse(stdout);
    return mapMediaInfo(url, json);
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new AppError('METADATA_FAILED', 'Failed to fetch video metadata.', { detail: msg, retryable: true });
  }
}

function mapMediaInfo(url: string, j: any): MediaInfo {
  const formats: FormatOption[] = Array.isArray(j.formats)
    ? j.formats.map((f: any) => ({
        formatId: String(f.format_id ?? ''),
        ext: String(f.ext ?? ''),
        resolution: f.resolution ?? (f.height ? `${f.width ?? '?'}x${f.height}` : null),
        fps: f.fps ?? null,
        vcodec: f.vcodec ?? null,
        acodec: f.acodec ?? null,
        filesize: f.filesize ?? f.filesize_approx ?? null,
        tbr: f.tbr ?? null,
        note: f.format_note ?? null,
      }))
    : [];

  const subtitles: SubtitleOption[] = [];
  const pushSubs = (obj: any, isAuto: boolean) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [lang, arr] of Object.entries<any[]>(obj)) {
      if (!Array.isArray(arr) || !arr.length) continue;
      const first = arr[0];
      subtitles.push({
        language: lang,
        name: first?.name ?? null,
        ext: String(first?.ext ?? 'vtt'),
        url: first?.url ?? null,
        isAutomatic: isAuto,
      });
    }
  };
  pushSubs(j.subtitles, false);
  pushSubs(j.automatic_captions, true);

  const isPlaylist = j._type === 'playlist' || Array.isArray(j.entries);
  const entries = Array.isArray(j.entries) ? j.entries : [];

  return {
    id: String(j.id ?? ''),
    url,
    title: String(j.title ?? 'Untitled'),
    uploader: j.uploader ?? j.channel ?? null,
    duration: typeof j.duration === 'number' ? j.duration : null,
    thumbnail: j.thumbnail ?? null,
    description: j.description ?? null,
    formats,
    subtitles,
    isPlaylist,
    playlistCount: isPlaylist ? (typeof j.playlist_count === 'number' ? j.playlist_count : entries.length) : null,
    entries: entries.map((e: any) => ({
      id: String(e.id ?? ''),
      title: String(e.title ?? 'Untitled'),
      url: String(e.url ?? e.webpage_url ?? ''),
      duration: typeof e.duration === 'number' ? e.duration : null,
    })),
  };
}

export interface DownloadHandle {
  child: ChildProcess;
  cancel(): void;
  stderrTail: () => string;
}

export interface DownloadCallbacks {
  onLine(line: string): void;
  onProgress(p: ReturnType<typeof parseLine>): void;
  onError(chunk: string): void;
  onExit(code: number | null, signal: NodeJS.Signals | null, classified: AppError | null): void;
}

export function startDownload(
  url: string,
  outputDir: string,
  settings: AppSettings,
  cbs: DownloadCallbacks,
  formatOverride?: string,
  playlistIndex: number | null = null,
  audioOnly = false,
): DownloadHandle {
  validateUrl(url);
  const args = buildDownloadArgs({ url, outputDir, settings, formatOverride, resume: true, playlistIndex, audioOnly });
  const ytdlpBin = resolveBinary('yt-dlp', settings.ytdlpPath);
  ensureExecutable(ytdlpBin);
  // Dump the full command line so any future argument bug is one log line away.
  logger.info(`[ytdlp] spawning: ${ytdlpBin}`);
  args.forEach((a, i) => logger.info(`[ytdlp]   argv[${i}] = ${JSON.stringify(a)}`));
  const child = spawn(ytdlpBin, args, {
    detached: true,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdoutBuf = '';
  let stderrTail = '';
  let cancelled = false;

  child.stdout!.on('data', (chunk: Buffer) => {
    stdoutBuf += chunk.toString('utf8');
    let idx: number;
    while ((idx = stdoutBuf.indexOf('\n')) >= 0) {
      const line = stdoutBuf.slice(0, idx);
      stdoutBuf = stdoutBuf.slice(idx + 1);
      cbs.onLine(line);
      const parsed = parseLine(line);
      if (parsed) cbs.onProgress(parsed);
    }
  });

  child.stderr!.on('data', (chunk: Buffer) => {
    const s = chunk.toString('utf8');
    stderrTail = (stderrTail + s).slice(-8000);
    cbs.onError(s);
  });

  child.on('exit', (code, signal) => {
    if (stdoutBuf) {
      cbs.onLine(stdoutBuf);
      const parsed = parseLine(stdoutBuf);
      if (parsed) cbs.onProgress(parsed);
    }
    let classified: AppError | null = null;
    if (cancelled) {
      classified = new AppError('CANCELLED', 'Download was cancelled.', { retryable: true });
    } else if (code !== 0) {
      classified = classifyYtdlpError(stderrTail, code);
    }
    cbs.onExit(code, signal, classified);
  });

  return {
    child,
    stderrTail: () => stderrTail,
    cancel() {
      cancelled = true;
      if (!child.killed && child.pid) {
        // detached: true makes the child its own process group leader, so we
        // signal the whole group via negative PID. This catches the
        // PyInstaller-spawned Python grandchild that yt-dlp re-execs into.
        const term = process.platform === 'win32' ? 'SIGTERM' : 'SIGINT';
        try { process.kill(-child.pid, term); }
        catch { try { child.kill(term); } catch { /* ignore */ } }
        setTimeout(() => {
          if (!child.killed && child.pid) {
            try { process.kill(-child.pid, 'SIGKILL'); }
            catch { try { child.kill('SIGKILL'); } catch { /* ignore */ } }
          }
        }, 3000);
      }
    },
  };
}
