import { app } from 'electron';
import path from 'node:path';
import type { AppSettings } from '../domain/settings';

export function defaultSettings(): AppSettings {
  return {
    downloadPath: path.join(app.getPath('downloads'), 'Fetchwave'),
    preferredContainer: 'mp4',
    qualityDefault: '1080p',
    embedSubtitles: false,
    writeSubtitles: false,
    subtitleLanguages: ['en'],
    cookiesPath: null,
    proxy: null,
    rateLimitKbps: null,
    concurrency: 2,
    ytdlpPath: 'bundled',
    ffmpegPath: 'bundled',
    ffprobePath: 'bundled',
    theme: 'dark',
    advancedMode: false,
    collisionStrategy: 'rename',
    maxRetries: 3,
    retryBaseDelayMs: 2000,
    expandPlaylists: true,
    firstLaunchCompleted: false,
    autoCheckForUpdates: true,
  };
}
