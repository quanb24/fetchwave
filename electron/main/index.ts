import { app, BrowserWindow } from 'electron';
import { createMainWindow, getMainWindow } from './windowManager';
import { registerIpc } from './ipcHandlers';
import { loadSettings } from './settingsStore';
import { runDiagnostics } from '../services/diagnostics';
import { initLogger, logger } from '../services/logger';
import { initUpdater, checkForUpdates } from '../services/updater';

initLogger();

process.on('uncaughtException', (e) => logger.error('[main] uncaughtException', e));
process.on('unhandledRejection', (e) => logger.error('[main] unhandledRejection', e));

// Single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    const settings = loadSettings(); // initialize / migrate
    registerIpc(getMainWindow);
    createMainWindow();
    initUpdater(getMainWindow);

    // Auto update check — 3s after launch so the UI is ready first
    if (settings.autoCheckForUpdates) {
      setTimeout(() => { void checkForUpdates(); }, 3000);
    }

    // Pre-warm yt-dlp so the first user-visible call (Choose Format / Download)
    // doesn't pay the 10–30 s PyInstaller cold-start cost. Fire-and-forget.
    setTimeout(() => {
      try {
        const { spawn } = require('node:child_process');
        const { resolveBinary, ensureExecutable } = require('../services/runtimePaths');
        const bin = resolveBinary('yt-dlp', settings.ytdlpPath);
        ensureExecutable(bin);
        logger.info('[prewarm] firing yt-dlp --version to warm PyInstaller cache');
        const c = spawn(bin, ['--version'], { detached: true, stdio: 'ignore', shell: false });
        c.unref();
        c.on('exit', (code: number) => logger.info(`[prewarm] yt-dlp warm exited code=${code}`));
        c.on('error', (e: Error) => logger.warn('[prewarm] yt-dlp warm error:', e.message));
      } catch (e) {
        logger.warn('[prewarm] failed', e);
      }
    }, 1500);

    // Run startup diagnostics for logs. Non-blocking; results are also
    // available on demand via diagnostics:run IPC.
    runDiagnostics(settings).then((report) => {
      const ok = report.healthy ? 'OK' : 'DEGRADED';
      console.log(`[fetchwave] runtime diagnostics: ${ok}`);
      for (const b of report.binaries) {
        console.log(`[fetchwave]   ${b.name} (${b.source}) → ${b.status}${b.version ? ` · ${b.version}` : ''}`);
      }
    }).catch((e) => console.error('[fetchwave] diagnostics failed', e));

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // Hardening: deny all permission requests by default
  app.on('web-contents-created', (_e, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', (e) => e.preventDefault());
  });
}
