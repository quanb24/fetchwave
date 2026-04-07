import log from 'electron-log/main';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Centralized logging via electron-log. Writes to:
 *   macOS:   ~/Library/Logs/Fetchwave/main.log
 *   Windows: %USERPROFILE%\AppData\Roaming\Fetchwave\logs\main.log
 *   Linux:   ~/.config/Fetchwave/logs/main.log
 */
export function initLogger(): void {
  log.initialize();
  // Verbose by default — captures every IPC call, download event, and runtime check.
  log.transports.file.level = 'debug';
  log.transports.file.maxSize = 10 * 1024 * 1024; // 10 MB rotation
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  log.transports.console.level = 'debug';
  log.info('==========================================================');
  log.info(`Fetchwave ${app.getVersion()} starting`);
  log.info(`Platform : ${process.platform} / ${process.arch}`);
  log.info(`Packaged : ${app.isPackaged}`);
  log.info(`Node     : ${process.versions.node}`);
  log.info(`Electron : ${process.versions.electron}`);
  log.info(`Chrome   : ${process.versions.chrome}`);
  log.info(`Log file : ${log.transports.file.getFile().path}`);
  log.info('==========================================================');
}

export function getLogPath(): string {
  return log.transports.file.getFile().path;
}

export function exportLogsTo(destDir: string): string {
  const src = getLogPath();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dst = path.join(destDir, `fetchwave-logs-${stamp}.log`);
  fs.copyFileSync(src, dst);
  return dst;
}

export const logger = {
  info:  (...a: unknown[]) => log.info(...a),
  warn:  (...a: unknown[]) => log.warn(...a),
  error: (...a: unknown[]) => log.error(...a),
  debug: (...a: unknown[]) => log.debug(...a),
};
