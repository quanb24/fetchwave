import type { AppErrorJSON } from './errors';

export type DownloadStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high';

export interface DownloadProgress {
  percent: number;
  speed: string | null;
  eta: string | null;
  downloadedBytes: number | null;
  totalBytes: number | null;
  fragment: { current: number; total: number } | null;
}

export interface DownloadJob {
  id: string;
  parentId: string | null;      // playlist parent linkage
  url: string;
  title: string | null;
  outputDir: string;
  formatSelector: string;       // explicit -f value, may be ''
  status: DownloadStatus;
  progress: DownloadProgress;
  priority: JobPriority;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  error: AppErrorJSON | null;
  errorRaw: string | null;      // raw stderr tail for debug
  outputFile: string | null;
  pid: number | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number | null;
  audioOnly: boolean;
  isPlaylistParent: boolean;
  playlistIndex: number | null;
  playlistCount: number | null;
}

export const initialProgress = (): DownloadProgress => ({
  percent: 0,
  speed: null,
  eta: null,
  downloadedBytes: null,
  totalBytes: null,
  fragment: null,
});

export const priorityRank: Record<JobPriority, number> = { high: 0, normal: 1, low: 2 };
