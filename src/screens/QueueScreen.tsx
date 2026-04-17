import React, { useEffect, useMemo, useState } from 'react';
import { useQueueStore } from '../store/queueStore';
import { useHistoryStore } from '../store/historyStore';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/Input';
import { Thumbnail } from '../components/Thumbnail';
import type { DownloadJob, DownloadStatus, JobPriority } from '../../electron/domain/job';

function fmtBytes(b: number | null | undefined): string {
  if (!b) return '';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

function parseSpeedBps(s: string | null | undefined): number {
  if (!s) return 0;
  const m = /^\s*([\d.]+)\s*([KMGT]?)(i?B)\/s\s*$/i.exec(s);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  const mul: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 };
  return n * (mul[m[2].toUpperCase()] ?? 0);
}

function fmtRate(bps: number): string {
  if (bps <= 0) return '—';
  const u = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let i = 0; let n = bps;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
}

const statusBadge: Record<DownloadStatus, { tone: 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'muted'; label: string }> = {
  queued:    { tone: 'muted',   label: 'Queued' },
  running:   { tone: 'accent',  label: 'Downloading' },
  paused:    { tone: 'warn',    label: 'Paused' },
  completed: { tone: 'success', label: 'Completed' },
  failed:    { tone: 'danger',  label: 'Failed' },
  cancelled: { tone: 'muted',   label: 'Cancelled' },
};

const JobCard: React.FC<{ job: DownloadJob; indent?: boolean }> = ({ job, indent }) => {
  const cancel = useQueueStore((s) => s.cancel);
  const remove = useQueueStore((s) => s.remove);
  const pause = useQueueStore((s) => s.pause);
  const resume = useQueueStore((s) => s.resume);
  const setPriority = useQueueStore((s) => s.setPriority);

  const retrying = job.status === 'queued' && job.nextRetryAt && job.nextRetryAt > Date.now();
  const badge = statusBadge[job.status];
  const displayTitle = job.title ?? job.outputFile?.split(/[\\/]/).pop() ?? job.url;

  return (
    <Card className={`${indent ? 'ml-10' : ''} animate-fade-in`}>
      <CardBody className="!p-5">
        <div className="flex items-start gap-4">
          <Thumbnail title={displayTitle} status={job.status} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {job.playlistIndex && (
                    <span className="text-[11px] font-mono text-fg-dim shrink-0">#{job.playlistIndex}</span>
                  )}
                  <div className="text-sm font-semibold text-fg truncate">{displayTitle}</div>
                </div>
                <div className="text-[11px] text-fg-dim truncate mt-0.5">{job.url}</div>
              </div>
              {retrying ? (
                <Badge tone="warn" dot>
                  Retry in {Math.max(0, Math.ceil((job.nextRetryAt! - Date.now()) / 1000))}s
                </Badge>
              ) : (
                <Badge tone={badge.tone} dot={job.status === 'running'}>{badge.label}</Badge>
              )}
            </div>

            <div className="mt-3">
              <ProgressBar value={job.progress.percent} status={job.status} />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-fg-muted gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-fg tabular-nums">
                  {job.status === 'completed'
                    ? fmtBytes(job.progress.totalBytes) || '100%'
                    : `${job.progress.percent.toFixed(1)}%`}
                </span>
                {job.progress.fragment && job.status !== 'completed' && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-bg-soft border border-bg-border text-fg-muted">
                    FRAG {job.progress.fragment.current} / {job.progress.fragment.total}
                  </span>
                )}
              </span>
              <span className="flex gap-4 shrink-0">
                {job.status !== 'completed' && job.progress.speed && <span className="font-mono">{job.progress.speed}</span>}
                {job.status !== 'completed' && job.progress.eta && <span>ETA <span className="font-mono">{job.progress.eta}</span></span>}
                {job.status === 'completed' && job.outputFile && (
                  <span className="text-success">Saved</span>
                )}
              </span>
            </div>

            {job.error && (job.status === 'failed' || retrying) && (
              <div className={`mt-3 text-[11px] px-3 py-2 rounded-lg border flex items-start gap-2 ${retrying ? 'border-warn/30 bg-warn/5 text-warn' : 'border-danger/30 bg-danger/5 text-danger'}`}>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${retrying ? 'border-warn/40 bg-warn/10' : 'border-danger/40 bg-danger/10'}`}>
                  {job.error.code}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block">{job.error.message}</span>
                  {!retrying && job.status === 'failed' && job.error.retryable && (
                    <span className="block mt-0.5 text-[10px] opacity-80">Press Resume to retry this download.</span>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-28">
            <Select
              value={job.priority}
              onChange={(e) => setPriority(job.id, e.target.value as JobPriority)}
              disabled={job.status === 'completed'}
              className="!h-8 !text-xs"
            >
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </Select>

            {job.status === 'running' && (
              <Button size="sm" variant="secondary" onClick={() => pause(job.id)}>Pause</Button>
            )}
            {job.status === 'queued' && !retrying && (
              <Button size="sm" variant="ghost" onClick={() => cancel(job.id)}>Cancel</Button>
            )}
            {(job.status === 'paused' || job.status === 'failed' || job.status === 'cancelled') && (
              <Button size="sm" onClick={() => resume(job.id)}>Resume</Button>
            )}
            {job.status === 'completed' && job.outputFile && (
              <>
                <Button size="sm" onClick={() => window.api.system.openFile(job.outputFile!)}>
                  Open file
                </Button>
                <Button size="sm" variant="secondary" onClick={() => window.api.system.revealFile(job.outputFile!)}>
                  Show in Finder
                </Button>
              </>
            )}
            {(job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed') && (
              <Button size="sm" variant="ghost" onClick={() => remove(job.id)}>Remove</Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const PlaylistGroup: React.FC<{ parent: DownloadJob; children: DownloadJob[] }> = ({ parent, children }) => {
  const remove = useQueueStore((s) => s.remove);
  const [expanded, setExpanded] = useState(true);
  const completed = children.filter((c) => c.status === 'completed').length;
  const running = children.some((c) => c.status === 'running');
  const failed = children.filter((c) => c.status === 'failed').length;
  const pct = children.length ? (completed / children.length) * 100 : 0;

  return (
    <div className="space-y-2 animate-fade-in">
      <Card elevated>
        <CardBody className="!p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="h-6 w-6 rounded-md hover:bg-bg-elevated flex items-center justify-center text-fg-muted transition shrink-0"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <span className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
            </button>
            <Thumbnail title={parent.title ?? 'Playlist'} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-fg truncate">{parent.title ?? 'Playlist'}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">
                {completed} of {children.length} completed{failed > 0 && ` · ${failed} failed`}
              </div>
            </div>
            {running && <Badge tone="accent" dot>Active</Badge>}
            {!running && completed === children.length && <Badge tone="success">Done</Badge>}
            <Button size="sm" variant="ghost" onClick={() => remove(parent.id)}>Remove all</Button>
          </div>
          <div className="mt-4 ml-10">
            <ProgressBar value={pct} status={completed === children.length ? 'completed' : 'running'} />
          </div>
        </CardBody>
      </Card>
      {expanded && children.map((c) => <JobCard key={c.id} job={c} indent />)}
    </div>
  );
};

export const QueueScreen: React.FC = () => {
  const order = useQueueStore((s) => s.order);
  const jobs = useQueueStore((s) => s.jobs);
  const clearCompleted = useQueueStore((s) => s.clearCompleted);
  const recordHistory = useHistoryStore((s) => s.recordIfCompleted);

  const [, force] = React.useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const t = setInterval(() => {
      const anyRetrying = order.some((id) => {
        const j = jobs[id];
        return j && j.status === 'queued' && j.nextRetryAt && j.nextRetryAt > Date.now();
      });
      if (anyRetrying) force();
    }, 1000);
    return () => clearInterval(t);
  }, [order, jobs]);

  useEffect(() => {
    for (const id of order) {
      const j = jobs[id];
      if (j) recordHistory(j);
    }
  }, [order, jobs, recordHistory]);

  const groups = useMemo(() => {
    const parents: DownloadJob[] = [];
    const standalone: DownloadJob[] = [];
    const childrenByParent = new Map<string, DownloadJob[]>();
    for (const id of order) {
      const j = jobs[id];
      if (!j) continue;
      if (j.isPlaylistParent) parents.push(j);
      else if (j.parentId) {
        const arr = childrenByParent.get(j.parentId) ?? [];
        arr.push(j);
        childrenByParent.set(j.parentId, arr);
      } else standalone.push(j);
    }
    return { parents, standalone, childrenByParent };
  }, [order, jobs]);

  const summary = useMemo(() => {
    const counts = { total: 0, running: 0, queued: 0, paused: 0, completed: 0, failed: 0, cancelled: 0 };
    let speedBps = 0;
    for (const id of order) {
      const j = jobs[id];
      if (!j || j.isPlaylistParent) continue;
      counts.total++;
      counts[j.status]++;
      if (j.status === 'running') speedBps += parseSpeedBps(j.progress.speed);
    }
    const terminal = counts.completed + counts.failed + counts.cancelled;
    return { ...counts, terminal, speedBps };
  }, [order, jobs]);

  const completed = summary.terminal;

  if (order.length === 0) {
    return (
      <EmptyState
        title="Queue is empty"
        description="Paste a URL on the Home screen to start your first download. Active jobs will appear here with live progress, speed, and ETA."
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v14"/><path d="M6 11l6 6 6-6"/><path d="M4 21h16"/>
          </svg>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-8 py-8 space-y-4 animate-fade-in">
      <Card>
        <CardBody className="!py-4 !px-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-fg mr-1">
                {summary.total} {summary.total === 1 ? 'item' : 'items'}
              </span>
              {summary.running > 0  && <Badge tone="accent"  dot>{summary.running} downloading</Badge>}
              {summary.queued > 0   && <Badge tone="muted">{summary.queued} queued</Badge>}
              {summary.paused > 0   && <Badge tone="warn">{summary.paused} paused</Badge>}
              {summary.failed > 0   && <Badge tone="danger">{summary.failed} failed</Badge>}
              {summary.completed > 0 && <Badge tone="success">{summary.completed} done</Badge>}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-fg-dim">Combined speed</div>
                <div className="text-sm font-mono text-fg tabular-nums">
                  {summary.running > 0 ? fmtRate(summary.speedBps) : '—'}
                </div>
              </div>
              {completed > 0 && (
                <Button size="sm" variant="ghost" onClick={() => clearCompleted()}>Clear completed</Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
      <div className="space-y-3">
        {groups.standalone.map((j) => <JobCard key={j.id} job={j} />)}
        {groups.parents.map((p) => (
          <PlaylistGroup key={p.id} parent={p} children={groups.childrenByParent.get(p.id) ?? []} />
        ))}
      </div>
    </div>
  );
};
