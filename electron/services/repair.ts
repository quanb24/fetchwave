import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { platformKey, repairBinaryPath, repairRoot, ensureExecutable, type BinaryName } from './runtimePaths';
import { logger } from './logger';

const execFileP = promisify(execFile);

/**
 * Self-heal: re-download bundled binaries into userData/runtime/bin. This path
 * is always writable, so it works even when the app bundle is read-only.
 *
 * Only yt-dlp is fetched here — the official single-file yt-dlp builds are the
 * common point of failure (corruption, truncation, sandbox quarantine). ffmpeg
 * lives inside the signed bundle; if it's damaged, the user must reinstall the
 * app. We still verify it during repair and report status per binary.
 */

const YTDLP_URLS: Record<string, string> = {
  'win-x64':   'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  'mac-arm64': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
  'mac-x64':   'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
  'linux-x64': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
};

export type RepairPhase = 'idle' | 'downloading' | 'verifying' | 'done' | 'error';

export interface RepairProgress {
  phase: RepairPhase;
  binary: BinaryName | null;
  percent: number;
  message: string;
}

type ProgressCb = (p: RepairProgress) => void;

function download(url: string, dest: string, onProgress: (pct: number) => void, redirects = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirects < 0) return reject(new Error('Too many redirects'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const tmp = `${dest}.part`;
    const file = fs.createWriteStream(tmp);
    const req = https.get(url, { headers: { 'User-Agent': 'Fetchwave-Repair' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(tmp, () => {});
        return resolve(download(res.headers.location, dest, onProgress, redirects - 1));
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(tmp, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const total = Number(res.headers['content-length']) || 0;
      let received = 0;
      res.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (total) onProgress(Math.round((received / total) * 100));
      });
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          try {
            fs.renameSync(tmp, dest);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
    req.on('error', (e) => {
      file.close();
      fs.unlink(tmp, () => {});
      reject(e);
    });
    req.setTimeout(60_000, () => {
      req.destroy(new Error('Download timed out'));
    });
  });
}

/** Wipe the entire user-data repair layer so the resolver falls back to bundled. */
export function resetRepairLayer(): { removed: boolean; path: string } {
  const root = repairRoot();
  try {
    if (fs.existsSync(root)) {
      fs.rmSync(root, { recursive: true, force: true });
      logger.info(`[repair] reset repair layer at ${root}`);
      return { removed: true, path: root };
    }
    return { removed: false, path: root };
  } catch (e) {
    logger.error('[repair] reset failed', e);
    throw e;
  }
}

export async function repairRuntime(onProgress: ProgressCb): Promise<RepairProgress> {
  const { os, arch } = platformKey();
  const key = `${os}-${arch}`;
  const url = YTDLP_URLS[key];

  if (!url) {
    const result: RepairProgress = {
      phase: 'error', binary: null, percent: 0,
      message: `No repair source available for ${key}.`,
    };
    onProgress(result);
    return result;
  }

  try {
    logger.info(`[repair] downloading yt-dlp for ${key}`);
    onProgress({ phase: 'downloading', binary: 'yt-dlp', percent: 0, message: 'Downloading yt-dlp…' });
    const dest = repairBinaryPath('yt-dlp');
    await download(url, dest, (pct) => {
      onProgress({ phase: 'downloading', binary: 'yt-dlp', percent: pct, message: `Downloading yt-dlp… ${pct}%` });
    });
    ensureExecutable(dest);

    onProgress({ phase: 'verifying', binary: 'yt-dlp', percent: 100, message: 'Verifying…' });
    const st = fs.statSync(dest);
    if (st.size < 1024) throw new Error('Downloaded file is too small');

    // macOS: ad-hoc codesign so the binary can be spawned from inside an
    // unsigned Electron host without macOS blocking PyInstaller bootstrap.
    if (process.platform === 'darwin') {
      try {
        await execFileP('codesign', ['--sign', '-', '--force', dest], { timeout: 10_000, shell: false });
        logger.info('[repair] ad-hoc codesigned yt-dlp');
      } catch (signErr) {
        logger.warn('[repair] codesign failed (continuing):', signErr);
      }
    }

    // Sanity-check: actually run --version. If it fails, the repair file is
    // unusable from inside this app context — delete it so the next launch
    // falls back to the bundled binary instead of being permanently shadowed
    // by a broken file.
    try {
      const { stdout } = await execFileP(dest, ['--version'], { timeout: 10_000, shell: false });
      logger.info(`[repair] verified yt-dlp ${stdout.trim()} runs from repair layer`);
    } catch (verifyErr) {
      logger.error('[repair] verification failed, removing broken file', verifyErr);
      try { fs.unlinkSync(dest); } catch { /* ignore */ }
      throw new Error('The downloaded yt-dlp could not start on this Mac. The bundled copy will be used instead.');
    }

    const done: RepairProgress = {
      phase: 'done', binary: null, percent: 100,
      message: 'Runtime repaired. Fetchwave will now use the freshly downloaded yt-dlp.',
    };
    logger.info('[repair] done');
    onProgress(done);
    return done;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error('[repair] failed', msg);
    const result: RepairProgress = {
      phase: 'error', binary: 'yt-dlp', percent: 0,
      message: `Repair failed: ${msg}. Check your internet connection and try again.`,
    };
    onProgress(result);
    return result;
  }
}
