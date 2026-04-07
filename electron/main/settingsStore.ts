import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { AppSettingsSchema, type AppSettings } from '../domain/settings';
import { defaultSettings } from '../config/defaults';
import { AppError } from '../domain/errors';

const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'settings.json');

let cache: AppSettings | null = null;

function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  // Pre-bundling defaults stored 'yt-dlp' and 'ffmpeg' as PATH lookups.
  // After bundling, those should become 'bundled' so the resolver picks the
  // shipped binary. Custom absolute paths are preserved untouched.
  if (out.ytdlpPath === 'yt-dlp') out.ytdlpPath = 'bundled';
  if (out.ffmpegPath === 'ffmpeg') out.ffmpegPath = 'bundled';
  if (out.ffprobePath == null) out.ffprobePath = 'bundled';
  return out;
}

export function loadSettings(): AppSettings {
  if (cache) return cache;
  const file = SETTINGS_FILE();
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      const parsed = AppSettingsSchema.safeParse({ ...defaultSettings(), ...migrate(raw) });
      if (parsed.success) {
        cache = parsed.data;
        return cache;
      }
    }
  } catch {
    // fall through to defaults
  }
  cache = defaultSettings();
  saveSettings(cache);
  return cache;
}

export function saveSettings(s: AppSettings): void {
  const parsed = AppSettingsSchema.safeParse(s);
  if (!parsed.success) {
    throw new AppError('SETTINGS_INVALID', 'Settings failed validation.', { detail: parsed.error.message });
  }
  cache = parsed.data;
  const file = SETTINGS_FILE();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(cache, null, 2), 'utf8');
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  return next;
}
