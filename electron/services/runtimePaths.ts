import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Resolution order for a binary:
 *   1. Explicit absolute path from settings (if not 'bundled')
 *   2. Repair override under userData/runtime/bin/<os>/<arch>/  (writable)
 *   3. Bundled binary under resourcesPath/bin/<os>/<arch>/      (read-only)
 *
 * Layer 2 lets the in-app Repair flow re-download a working binary even when
 * the app bundle is read-only (signed macOS .app, NSIS install dir, etc).
 */

export type BinaryName = 'yt-dlp' | 'ffmpeg' | 'ffprobe';

const BUNDLED_SENTINEL = 'bundled';

function platformDir(): 'win' | 'mac' | 'linux' {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'mac';
  return 'linux';
}

function archDir(): 'x64' | 'arm64' {
  return process.arch === 'arm64' ? 'arm64' : 'x64';
}

function binaryFile(name: BinaryName): string {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

function bundledRoot(): string {
  if (app.isPackaged) return process.resourcesPath;
  const candidates = [
    path.resolve(__dirname, '../../resources'),
    path.resolve(__dirname, '../../../resources'),
    path.resolve(process.cwd(), 'resources'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[0];
}

export function repairRoot(): string {
  return path.join(app.getPath('userData'), 'runtime');
}

export function bundledBinaryPath(name: BinaryName): string {
  return path.join(bundledRoot(), 'bin', platformDir(), archDir(), binaryFile(name));
}

export function repairBinaryPath(name: BinaryName): string {
  return path.join(repairRoot(), 'bin', platformDir(), archDir(), binaryFile(name));
}

export function resolveBinary(name: BinaryName, settingsValue: string | null | undefined): string {
  const v = (settingsValue ?? '').trim();
  if (v && v !== BUNDLED_SENTINEL) return v;
  const repaired = repairBinaryPath(name);
  if (fs.existsSync(repaired)) return repaired;
  return bundledBinaryPath(name);
}

export function isBundledSentinel(v: string | null | undefined): boolean {
  const t = (v ?? '').trim();
  return !t || t === BUNDLED_SENTINEL;
}

export const BUNDLED = BUNDLED_SENTINEL;

export function ensureExecutable(p: string): void {
  if (process.platform === 'win32') return;
  try {
    fs.accessSync(p, fs.constants.X_OK);
  } catch {
    try { fs.chmodSync(p, 0o755); } catch { /* non-fatal */ }
  }
}

export function describeRuntime() {
  return {
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    bundledRoot: bundledRoot(),
    repairRoot: repairRoot(),
    bundled: {
      'yt-dlp': bundledBinaryPath('yt-dlp'),
      ffmpeg: bundledBinaryPath('ffmpeg'),
      ffprobe: bundledBinaryPath('ffprobe'),
    },
  };
}

export function platformKey(): { os: 'win' | 'mac' | 'linux'; arch: 'x64' | 'arm64' } {
  return { os: platformDir(), arch: archDir() };
}

export function binaryFileName(name: BinaryName): string {
  return binaryFile(name);
}
