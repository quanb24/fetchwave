import type { DownloadJob, JobPriority } from '../domain/job';
import type { MediaInfo } from '../domain/media';
import type { AppSettings } from '../domain/settings';
import type { AppErrorJSON } from '../domain/errors';
import type { DiagnosticsReport } from '../services/diagnostics';
import type { UpdateState } from '../services/updater';
import type { RepairProgress } from '../services/repair';

export const IPC = {
  ytdlpDetect: 'ytdlp:detect',
  ytdlpAnalyze: 'ytdlp:analyze',
  diagnosticsRun: 'diagnostics:run',
  updaterCheck: 'updater:check',
  updaterGetState: 'updater:getState',
  updaterQuitAndInstall: 'updater:quitAndInstall',
  repairRun: 'repair:run',
  repairReset: 'repair:reset',
  logsGetPath: 'logs:getPath',
  logsExport: 'logs:export',
  logsWrite: 'logs:write',
  logsReveal: 'logs:reveal',
  evtUpdateState: 'evt:updateState',
  evtRepairProgress: 'evt:repairProgress',
  queueAdd: 'queue:add',
  queueList: 'queue:list',
  queueCancel: 'queue:cancel',
  queueRemove: 'queue:remove',
  queuePause: 'queue:pause',
  queueResume: 'queue:resume',
  queueClearCompleted: 'queue:clearCompleted',
  queueSetPriority: 'queue:setPriority',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  systemPickFolder: 'system:pickFolder',
  systemPickFile: 'system:pickFile',
  systemReadClipboard: 'system:readClipboard',
  systemRevealFile: 'system:revealFile',
  systemOpenFile: 'system:openFile',
  evtJobUpdated: 'evt:jobUpdated',
  evtJobAdded: 'evt:jobAdded',
  evtJobRemoved: 'evt:jobRemoved',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export interface DetectResult {
  available: boolean;
  version: string | null;
  path: string;
}

export interface AnalyzeRequest {
  url: string;
  allowPlaylist?: boolean;
}

export interface AddJobRequest {
  url: string;
  formatSelector?: string;
  outputDir?: string;
  priority?: JobPriority;
  title?: string | null;
  /** When true, force ffmpeg to extract/convert to MP3 even though the
   *  format selector points at a raw audio stream. */
  audioOnly?: boolean;
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: AppErrorJSON };

export interface ApiSurface {
  detect(): Promise<IpcResult<DetectResult>>;
  analyze(req: AnalyzeRequest): Promise<IpcResult<MediaInfo>>;
  diagnostics(): Promise<IpcResult<DiagnosticsReport>>;
  updater: {
    check(): Promise<IpcResult<UpdateState>>;
    getState(): Promise<IpcResult<UpdateState>>;
    quitAndInstall(): Promise<IpcResult<void>>;
  };
  repair: {
    run(): Promise<IpcResult<RepairProgress>>;
    reset(): Promise<IpcResult<{ removed: boolean; path: string }>>;
  };
  logs: {
    getPath(): Promise<IpcResult<string>>;
    export(): Promise<IpcResult<string | null>>;
    write(level: 'info' | 'warn' | 'error' | 'debug', tag: string, msg: string): Promise<IpcResult<void>>;
    reveal(): Promise<IpcResult<void>>;
  };
  queue: {
    add(req: AddJobRequest): Promise<IpcResult<DownloadJob | DownloadJob[]>>;
    list(): Promise<IpcResult<DownloadJob[]>>;
    cancel(id: string): Promise<IpcResult<void>>;
    remove(id: string): Promise<IpcResult<void>>;
    pause(id: string): Promise<IpcResult<void>>;
    resume(id: string): Promise<IpcResult<void>>;
    clearCompleted(): Promise<IpcResult<void>>;
    setPriority(id: string, priority: JobPriority): Promise<IpcResult<void>>;
  };
  settings: {
    get(): Promise<IpcResult<AppSettings>>;
    update(patch: Partial<AppSettings>): Promise<IpcResult<AppSettings>>;
  };
  system: {
    pickFolder(): Promise<IpcResult<string | null>>;
    pickFile(): Promise<IpcResult<string | null>>;
    readClipboard(): Promise<IpcResult<string>>;
    revealFile(p: string): Promise<IpcResult<void>>;
    openFile(p: string): Promise<IpcResult<void>>;
  };
  on: {
    jobUpdated(cb: (job: DownloadJob) => void): () => void;
    jobAdded(cb: (job: DownloadJob) => void): () => void;
    jobRemoved(cb: (id: string) => void): () => void;
    updateState(cb: (s: UpdateState) => void): () => void;
    repairProgress(cb: (p: RepairProgress) => void): () => void;
  };
}
