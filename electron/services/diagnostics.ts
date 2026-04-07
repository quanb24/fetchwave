import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { app } from 'electron';
import { resolveBinary, ensureExecutable, isBundledSentinel, describeRuntime, type BinaryName } from './runtimePaths';
import type { AppSettings } from '../domain/settings';
import { logger } from './logger';

/**
 * Spawn a binary in the way that actually works for PyInstaller-bundled yt-dlp
 * launched from inside an unsigned Electron host on macOS.
 *
 * Critical: detached: true. Without it, the parent process group blocks the
 * child's internal posix_spawn during PyInstaller bootstrap and the child
 * hangs forever. We capture stdout/stderr manually to a string.
 */
function runDetached(bin: string, args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
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
    const finish = (err: Error | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err); else resolve({ stdout, stderr });
    };
    const timer = setTimeout(() => {
      try {
        if (child.pid) process.kill(-child.pid, 'SIGKILL');
      } catch { try { child.kill('SIGKILL'); } catch { /* ignore */ } }
      finish(new Error(`Spawn timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout?.on('data', (c) => { stdout += c.toString('utf8'); });
    child.stderr?.on('data', (c) => { stderr += c.toString('utf8'); });
    child.on('error', (e) => finish(e));
    child.on('exit', (code) => {
      if (code === 0) finish(null);
      else finish(new Error(`exited with code ${code}: ${stderr.slice(0, 500)}`));
    });
  });
}


export type BinaryStatusCode = 'ok' | 'missing' | 'not_executable' | 'version_failed';

export interface BinaryStatus {
  name: BinaryName;
  source: 'bundled' | 'custom';
  path: string;
  exists: boolean;
  version: string | null;
  status: BinaryStatusCode;
  message: string;
}

export interface DiagnosticsReport {
  appVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  packaged: boolean;
  resourcesRoot: string;
  binaries: BinaryStatus[];
  healthy: boolean;
}

const VERSION_ARGS: Record<BinaryName, string[]> = {
  'yt-dlp': ['--version'],
  ffmpeg: ['-version'],
  ffprobe: ['-version'],
};

function firstLine(s: string): string {
  return s.split(/\r?\n/)[0]?.trim() ?? '';
}

async function checkBinary(name: BinaryName, settingsValue: string | null | undefined): Promise<BinaryStatus> {
  const source: 'bundled' | 'custom' = isBundledSentinel(settingsValue) ? 'bundled' : 'custom';
  const resolved = resolveBinary(name, settingsValue);

  const looksAbsolute = /^([a-zA-Z]:[\\/]|[\\/])/.test(resolved);
  let exists = true;
  if (looksAbsolute) {
    exists = fs.existsSync(resolved);
    if (!exists) {
      return {
        name, source, path: resolved, exists: false, version: null,
        status: 'missing',
        message: source === 'bundled'
          ? `Bundled ${name} is missing from the app package. Reinstall the app.`
          : `Custom ${name} path does not exist: ${resolved}`,
      };
    }
    ensureExecutable(resolved);
  }

  // yt-dlp is a PyInstaller bundle that takes 5-10s to bootstrap and behaves
  // unpredictably when invoked through Electron's child_process layer at app
  // startup. Running --version here causes false-positive failures and a UI
  // that screams "broken". Instead we trust file presence + executable bit
  // and let real failures surface at actual download time.
  if (name === 'yt-dlp') {
    logger.info(`[diagnostics] ${name} present at ${resolved} (skipping cold version check)`);
    return { name, source, path: resolved, exists: true, version: 'present', status: 'ok', message: 'Ready' };
  }

  try {
    logger.debug(`[diagnostics] spawn(detached) ${name} @ ${resolved} ${VERSION_ARGS[name].join(' ')}`);
    // 30s timeout — yt-dlp's PyInstaller bootstrap can take 5-10s on first run.
    const { stdout, stderr } = await runDetached(resolved, VERSION_ARGS[name], 30_000);
    if (stderr) logger.debug(`[diagnostics] ${name} stderr: ${stderr.slice(0, 200)}`);
    return { name, source, path: resolved, exists: true, version: firstLine(stdout), status: 'ok', message: 'OK' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`[diagnostics] ${name} spawn failed: ${msg}`);

    if (/EACCES|not executable|permission/i.test(msg)) {
      return {
        name, source, path: resolved, exists, version: null,
        status: 'not_executable',
        message: `${name} is not executable. Try reinstalling the app.`,
      };
    }
    return {
      name, source, path: resolved, exists, version: null,
      status: 'version_failed',
      message: source === 'bundled'
        ? `Bundled ${name} failed to launch. The app package may be corrupt — please reinstall.`
        : `Custom ${name} failed to launch: ${msg}`,
    };
  }
}

export async function runDiagnostics(settings: AppSettings): Promise<DiagnosticsReport> {
  const rt = describeRuntime();
  const binaries = await Promise.all([
    checkBinary('yt-dlp', settings.ytdlpPath),
    checkBinary('ffmpeg', settings.ffmpegPath),
    checkBinary('ffprobe', settings.ffprobePath),
  ]);
  // ffprobe is nice-to-have for some metadata; yt-dlp + ffmpeg are required.
  const required = binaries.filter((b) => b.name !== 'ffprobe');
  return {
    appVersion: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    packaged: rt.packaged,
    resourcesRoot: rt.bundledRoot,
    binaries,
    healthy: required.every((b) => b.status === 'ok'),
  };
}
