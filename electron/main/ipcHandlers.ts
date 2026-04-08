import { ipcMain, BrowserWindow, dialog, clipboard, app, shell } from 'electron';
import path from 'node:path';
import { IPC } from '../ipc/channels';
import { DownloadQueue } from '../services/queue';
import { detect, analyze } from '../services/ytdlp';
import { runDiagnostics } from '../services/diagnostics';
import { loadSettings, updateSettings } from './settingsStore';
import { loadQueue, saveQueue } from './queueStore';
import { AppError } from '../domain/errors';
import { checkForUpdates, getUpdateState, quitAndInstall } from '../services/updater';
import { repairRuntime, resetRepairLayer } from '../services/repair';
import { exportLogsTo, getLogPath, logger } from '../services/logger';
import type { IpcResult } from '../ipc/channels';
import type { JobPriority } from '../domain/job';

function ok<T>(data: T): IpcResult<T> { return { ok: true, data }; }
function fail(e: unknown): IpcResult<never> { return { ok: false, error: AppError.from(e).toJSON() }; }

export function registerIpc(getWindow: () => BrowserWindow | null): DownloadQueue {
  const queue = new DownloadQueue(() => loadSettings(), (jobs) => saveQueue(jobs));

  const broadcast = (channel: string, payload: unknown) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  };
  queue.on('jobAdded', (j) => broadcast(IPC.evtJobAdded, j));
  queue.on('jobUpdated', (j) => broadcast(IPC.evtJobUpdated, j));
  queue.on('jobRemoved', (id) => broadcast(IPC.evtJobRemoved, id));

  // Hydrate persisted queue
  queue.hydrate(loadQueue());

  ipcMain.handle(IPC.ytdlpDetect, async () => {
    try { return ok(await detect(loadSettings())); } catch (e) { return fail(e); }
  });

  ipcMain.handle(IPC.diagnosticsRun, async () => {
    try {
      logger.info('[ipc] diagnostics:run');
      const r = await runDiagnostics(loadSettings());
      logger.info(`[ipc] diagnostics:run → healthy=${r.healthy}`);
      for (const b of r.binaries) {
        logger.info(`[ipc]   ${b.name} [${b.source}] ${b.status} ${b.version ?? ''} @ ${b.path}`);
        if (b.status !== 'ok') logger.warn(`[ipc]     reason: ${b.message}`);
      }
      return ok(r);
    } catch (e) {
      logger.error('[ipc] diagnostics:run failed', e);
      return fail(e);
    }
  });

  ipcMain.handle(IPC.ytdlpAnalyze, async (_e, req: { url: string; allowPlaylist?: boolean }) => {
    try { return ok(await analyze(req.url, loadSettings(), req.allowPlaylist ?? true)); } catch (e) { return fail(e); }
  });

  ipcMain.handle(IPC.queueAdd, async (_e, req) => {
    try {
      logger.info(`[ipc] queue:add url=${req.url} format=${req.formatSelector ?? 'default'}`);
      const r = await queue.add(req);
      logger.info(`[ipc] queue:add → ${Array.isArray(r) ? `${r.length} jobs` : `1 job (${r.id})`}`);
      return ok(r);
    } catch (e) {
      logger.error('[ipc] queue:add failed', e);
      return fail(e);
    }
  });

  ipcMain.handle(IPC.queueList, async () => ok(queue.list()));
  ipcMain.handle(IPC.queueCancel, async (_e, id: string) => { queue.cancel(id); return ok(undefined); });
  ipcMain.handle(IPC.queueRemove, async (_e, id: string) => { queue.remove(id); return ok(undefined); });
  ipcMain.handle(IPC.queuePause, async (_e, id: string) => { queue.pause(id); return ok(undefined); });
  ipcMain.handle(IPC.queueResume, async (_e, id: string) => { queue.resume(id); return ok(undefined); });
  ipcMain.handle(IPC.queueClearCompleted, async () => { queue.clearCompleted(); return ok(undefined); });
  ipcMain.handle(IPC.queueSetPriority, async (_e, id: string, priority: JobPriority) => {
    queue.setPriority(id, priority);
    return ok(undefined);
  });

  ipcMain.handle(IPC.settingsGet, async () => ok(loadSettings()));
  ipcMain.handle(IPC.settingsUpdate, async (_e, patch) => {
    try { return ok(updateSettings(patch)); } catch (e) { return fail(e); }
  });

  ipcMain.handle(IPC.systemPickFolder, async () => {
    const win = getWindow();
    const r = await dialog.showOpenDialog(win!, { properties: ['openDirectory', 'createDirectory'] });
    return ok(r.canceled ? null : r.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.systemPickFile, async () => {
    const win = getWindow();
    const r = await dialog.showOpenDialog(win!, { properties: ['openFile'] });
    return ok(r.canceled ? null : r.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.systemReadClipboard, async () => ok(clipboard.readText()));

  ipcMain.handle(IPC.systemOpenFile, async (_e, p: string) => {
    try {
      if (!p) return fail(new Error('No file path is recorded for this download.'));
      const fs = await import('node:fs');
      if (!fs.existsSync(p)) return fail(new Error('File no longer exists at the recorded path.'));
      const err = await shell.openPath(p);
      if (err) return fail(new Error(err));
      return ok(undefined);
    } catch (e) { return fail(e); }
  });

  ipcMain.handle(IPC.systemGetVersion, async () => ok(app.getVersion()));

  ipcMain.handle(IPC.systemRestart, async () => {
    logger.info('[ipc] system:restart requested');
    app.relaunch();
    app.exit(0);
    return ok(undefined);
  });

  ipcMain.handle(IPC.systemRevealFile, async (_e, p: string) => {
    try {
      if (!p) return fail(new Error('No file path is recorded for this download.'));
      const fs = await import('node:fs');
      if (!fs.existsSync(p)) {
        // File was moved or deleted after the download. Open the parent
        // folder if it still exists, so the user lands somewhere useful.
        const path = await import('node:path');
        const parent = path.dirname(p);
        if (fs.existsSync(parent)) {
          shell.openPath(parent);
          return ok(undefined);
        }
        return fail(new Error('File no longer exists at the recorded path.'));
      }
      shell.showItemInFolder(p);
      return ok(undefined);
    } catch (e) { return fail(e); }
  });

  // ── Updater ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.updaterCheck, async () => {
    try { return ok(await checkForUpdates()); } catch (e) { return fail(e); }
  });
  ipcMain.handle(IPC.updaterGetState, async () => ok(getUpdateState()));
  ipcMain.handle(IPC.updaterQuitAndInstall, async () => { quitAndInstall(); return ok(undefined); });

  // ── Repair ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.repairReset, async () => {
    try {
      logger.info('[ipc] repair:reset');
      return ok(resetRepairLayer());
    } catch (e) { return fail(e); }
  });

  ipcMain.handle(IPC.repairRun, async () => {
    try {
      logger.info('[repair] user requested repair');
      const result = await repairRuntime((p) => {
        broadcast(IPC.evtRepairProgress, p);
      });
      return ok(result);
    } catch (e) {
      return fail(e);
    }
  });

  // ── Logs ────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.logsWrite, async (_e, level: 'info' | 'warn' | 'error' | 'debug', tag: string, msg: string) => {
    const fn = (logger as any)[level] ?? logger.info;
    fn(`[renderer/${tag}] ${msg}`);
    return ok(undefined);
  });
  ipcMain.handle(IPC.logsReveal, async () => {
    try { shell.showItemInFolder(getLogPath()); return ok(undefined); } catch (e) { return fail(e); }
  });
  ipcMain.handle(IPC.logsGetPath, async () => ok(getLogPath()));
  ipcMain.handle(IPC.logsExport, async () => {
    try {
      const win = getWindow();
      const r = await dialog.showSaveDialog(win!, {
        title: 'Export Fetchwave logs',
        defaultPath: path.join(app.getPath('desktop'), `fetchwave-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`),
        filters: [{ name: 'Log', extensions: ['log'] }],
      });
      if (r.canceled || !r.filePath) return ok(null);
      const dest = exportLogsTo(path.dirname(r.filePath));
      return ok(dest);
    } catch (e) {
      return fail(e);
    }
  });

  return queue;
}
