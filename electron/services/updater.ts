import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import { logger } from './logger';

export type UpdateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string; notes: string | null }
  | { phase: 'not-available' }
  | { phase: 'downloading'; percent: number; bytesPerSecond: number; transferred: number; total: number }
  | { phase: 'ready'; version: string }
  | { phase: 'error'; message: string };

let lastState: UpdateState = { phase: 'idle' };
const listeners = new Set<(s: UpdateState) => void>();

function emit(s: UpdateState) {
  lastState = s;
  for (const l of listeners) l(s);
}

export function getUpdateState(): UpdateState {
  return lastState;
}

export function onUpdateState(cb: (s: UpdateState) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function initUpdater(getWindow: () => BrowserWindow | null): void {
  autoUpdater.logger = logger as never;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // If the currently installed version is itself a pre-release (e.g. 1.0.0-rc.1),
  // opt that user into the rc channel automatically. Stable users only see stable.
  const isPreRelease = /-/.test(app.getVersion());
  autoUpdater.allowPrerelease = isPreRelease;
  autoUpdater.channel = isPreRelease ? 'rc' : 'latest';

  autoUpdater.on('checking-for-update', () => emit({ phase: 'checking' }));
  autoUpdater.on('update-available', (info) => {
    logger.info('[updater] update available', info.version);
    emit({ phase: 'available', version: info.version, notes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null });
  });
  autoUpdater.on('update-not-available', () => emit({ phase: 'not-available' }));
  autoUpdater.on('download-progress', (p) => {
    emit({
      phase: 'downloading',
      percent: p.percent,
      bytesPerSecond: p.bytesPerSecond,
      transferred: p.transferred,
      total: p.total,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    logger.info('[updater] update downloaded', info.version);
    emit({ phase: 'ready', version: info.version });
  });
  autoUpdater.on('error', (err) => {
    // Log it but don't surface 404s / network errors as a UI error banner —
    // they're noise (e.g. when the GitHub release feed isn't published yet).
    const msg = err?.message ?? String(err);
    logger.warn('[updater] check failed (suppressed in UI):', msg);
    emit({ phase: 'idle' });
  });

  // Hook for renderer broadcast
  onUpdateState((s) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) win.webContents.send('evt:updateState', s);
  });
}

export async function checkForUpdates(): Promise<UpdateState> {
  if (!app.isPackaged) {
    emit({ phase: 'not-available' });
    return lastState;
  }
  try {
    await autoUpdater.checkForUpdates();
  } catch (e) {
    // Swallow — autoUpdater also fires the 'error' event which is already
    // logged. Don't surface as a UI error state; the GitHub feed may simply
    // not exist yet for this app, which is not an actionable user error.
    logger.warn('[updater] checkForUpdates threw (suppressed):', e instanceof Error ? e.message : String(e));
    emit({ phase: 'idle' });
  }
  return lastState;
}

export function quitAndInstall(): void {
  if (lastState.phase !== 'ready') return;
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
}
