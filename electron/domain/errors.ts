export type AppErrorCode =
  | 'YTDLP_NOT_FOUND'
  | 'INVALID_URL'
  | 'METADATA_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'CANCELLED'
  | 'FS_ERROR'
  | 'SETTINGS_INVALID'
  | 'NETWORK'
  | 'UNAVAILABLE_FORMAT'
  | 'GEO_BLOCKED'
  | 'AGE_RESTRICTED'
  | 'PRIVATE_OR_DELETED'
  | 'PERMISSION_DENIED'
  | 'DISK_FULL'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export interface AppErrorJSON {
  code: AppErrorCode;
  message: string;
  detail?: string;
  retryable: boolean;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly detail?: string;
  readonly retryable: boolean;

  constructor(code: AppErrorCode, message: string, opts: { detail?: string; retryable?: boolean } = {}) {
    super(message);
    this.code = code;
    this.detail = opts.detail;
    this.retryable = opts.retryable ?? false;
  }

  toJSON(): AppErrorJSON {
    return { code: this.code, message: this.message, detail: this.detail, retryable: this.retryable };
  }

  static from(e: unknown): AppError {
    if (e instanceof AppError) return e;
    if (e instanceof Error) return new AppError('UNKNOWN', e.message, { detail: e.stack });
    return new AppError('UNKNOWN', String(e));
  }
}

/** Classify yt-dlp stderr / exit output into a structured AppError. */
export function classifyYtdlpError(stderr: string, exitCode: number | null): AppError {
  const s = stderr.toLowerCase();

  if (/http error 429|too many requests|rate.?limit/.test(s)) {
    return new AppError('RATE_LIMITED', 'Rate limited by the server. Retrying will help.', { detail: stderr.slice(-2000), retryable: true });
  }
  if (/unable to download|http error 5\d\d|connection (reset|refused|timed out)|network is unreachable|temporary failure|ssl|eof occurred/.test(s)) {
    return new AppError('NETWORK', 'Network problem reaching the host.', { detail: stderr.slice(-2000), retryable: true });
  }
  if (/requested format (is )?not available|no video formats|no such format/.test(s)) {
    return new AppError('UNAVAILABLE_FORMAT', 'The requested format is not available for this video.', { detail: stderr.slice(-2000), retryable: false });
  }
  if (/video unavailable|private video|this video has been removed|has been terminated/.test(s)) {
    return new AppError('PRIVATE_OR_DELETED', 'Video is private, removed, or unavailable.', { detail: stderr.slice(-2000), retryable: false });
  }
  if (/geo.?restricted|not available in your country|blocked in your country/.test(s)) {
    return new AppError('GEO_BLOCKED', 'Video is geo-blocked in this region.', { detail: stderr.slice(-2000), retryable: false });
  }
  if (/age.?restricted|sign in to confirm your age|inappropriate for some users/.test(s)) {
    return new AppError('AGE_RESTRICTED', 'Age-restricted video — cookies required.', { detail: stderr.slice(-2000), retryable: false });
  }
  if (/permission denied|eacces|access is denied/.test(s)) {
    return new AppError('PERMISSION_DENIED', 'Permission denied writing to the download folder.', { detail: stderr.slice(-2000), retryable: false });
  }
  if (/no space left|enospc|disk full/.test(s)) {
    return new AppError('DISK_FULL', 'No space left on the destination disk.', { detail: stderr.slice(-2000), retryable: false });
  }
  if (exitCode === null) {
    return new AppError('CANCELLED', 'Download was cancelled.', { retryable: true });
  }
  return new AppError('DOWNLOAD_FAILED', `yt-dlp exited with code ${exitCode}.`, { detail: stderr.slice(-2000), retryable: true });
}
