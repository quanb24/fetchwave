import type { AppSettings, QualityPreset } from '../domain/settings';
import { resolveBinary, isBundledSentinel } from './runtimePaths';
import path from 'node:path';

const AUDIO_FORMATS = ['mp3', 'm4a', 'opus', 'aac', 'flac', 'wav'];

/** Video container actually used for merging. If the saved container is an
 *  audio format but quality is video, fall back to mp4 silently. */
function effectiveVideoContainer(container: string): 'mp4' | 'mkv' | 'webm' {
  if (container === 'mkv') return 'mkv';
  if (container === 'webm') return 'webm';
  return 'mp4';
}

function qualityToFormat(q: QualityPreset, container: string): string {
  if (q === 'audio-only') return 'bestaudio/best';
  const vc = effectiveVideoContainer(container);
  if (q === 'best') {
    return vc === 'mp4'
      ? 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b'
      : 'bv*+ba/b';
  }
  const h = q.replace('p', '');
  return vc === 'mp4'
    ? `bv*[height<=${h}][ext=mp4]+ba[ext=m4a]/b[height<=${h}][ext=mp4]/b[height<=${h}]`
    : `bv*[height<=${h}]+ba/b[height<=${h}]`;
}

export interface BuildArgsInput {
  url: string;
  outputDir: string;
  settings: AppSettings;
  formatOverride?: string;
  resume?: boolean;
  playlistIndex?: number | null;
}

export function buildDownloadArgs({
  url,
  outputDir,
  settings,
  formatOverride,
  resume = true,
  playlistIndex = null,
}: BuildArgsInput): string[] {
  const args: string[] = [];

  const hasFormatOverride = !!(formatOverride && formatOverride.trim());
  const fmt = hasFormatOverride
    ? formatOverride!
    : qualityToFormat(settings.qualityDefault, settings.preferredContainer);
  args.push('-f', fmt);
  // When the caller provided an explicit format (Format Modal, playlist child,
  // etc.) that selector IS the source of truth. The "audio-only" setting and
  // merge-container logic below only apply when we derived the format from the
  // default quality preset.
  const isAudioOnly = !hasFormatOverride && settings.qualityDefault === 'audio-only';
  const isVideoDownload = hasFormatOverride || settings.qualityDefault !== 'audio-only';

  // Output template — stable across runs so resume finds its .part
  args.push('-o', `${outputDir}/%(title).200B [%(id)s].%(ext)s`);

  // Collision strategy
  switch (settings.collisionStrategy) {
    case 'overwrite':
      args.push('--force-overwrites');
      break;
    case 'skip':
      args.push('--no-overwrites');
      break;
    case 'rename':
      // yt-dlp lacks native rename; we post-process finished files in queue.ts
      args.push('--no-overwrites');
      break;
  }

  // Resume support — .part continuation
  if (resume) {
    args.push('--continue');
  } else {
    args.push('--no-continue');
  }

  // Container merge for video downloads. If the saved container is an audio
  // format (leftover from a previous audio-only session) we silently upgrade
  // to mp4 so yt-dlp doesn't try to merge video streams into an audio-only
  // container and fall back to audio-only output.
  if (isVideoDownload && settings.preferredContainer !== 'auto') {
    args.push('--merge-output-format', effectiveVideoContainer(settings.preferredContainer));
  }

  // Audio-only extraction — only when the user picked the audio-only preset
  // AND there's no explicit format override.
  if (isAudioOnly) {
    args.push('-x');
    const audioFormat = AUDIO_FORMATS.includes(settings.preferredContainer)
      ? settings.preferredContainer
      : 'mp3';
    args.push('--audio-format', audioFormat);
    args.push('--audio-quality', '0');
  }

  if (settings.writeSubtitles) {
    args.push('--write-subs', '--write-auto-subs');
    args.push('--sub-langs', settings.subtitleLanguages.join(','));
  }
  if (settings.embedSubtitles) {
    args.push('--embed-subs');
  }

  if (settings.cookiesPath) args.push('--cookies', settings.cookiesPath);
  if (settings.proxy) args.push('--proxy', settings.proxy);

  if (settings.rateLimitKbps && settings.rateLimitKbps > 0) {
    args.push('-r', `${settings.rateLimitKbps}K`);
  }

  // Always point yt-dlp at our resolved ffmpeg (bundled or custom). yt-dlp accepts
  // either the directory containing ffmpeg/ffprobe or the binary path itself; we
  // pass the directory so it picks up ffprobe alongside.
  const ffmpegResolved = resolveBinary('ffmpeg', settings.ffmpegPath);
  args.push('--ffmpeg-location', isBundledSentinel(settings.ffmpegPath) ? path.dirname(ffmpegResolved) : ffmpegResolved);

  // Playlist handling — we expand in service layer, so per-job we disable playlist expansion
  if (playlistIndex !== null) {
    args.push('--playlist-items', String(playlistIndex));
  } else {
    args.push('--no-playlist');
  }

  // Yt-dlp built-in retry for fragments/socket — orchestrator also retries at job level
  args.push('--retries', '10', '--fragment-retries', '10', '--retry-sleep', 'linear=1:5');

  // Deterministic progress output
  args.push('--newline', '--no-colors', '--progress');
  args.push(
    '--progress-template',
    'download:[PROGRESS] %(progress._percent_str)s %(progress._speed_str)s %(progress._eta_str)s %(progress.downloaded_bytes)s %(progress.total_bytes)s %(progress.fragment_index)s %(progress.fragment_count)s',
  );

  args.push('--', url);
  return args;
}

export function buildAnalyzeArgs(url: string, settings: AppSettings, allowPlaylist = true): string[] {
  const args = ['-J', '--no-warnings'];
  if (!allowPlaylist) args.push('--no-playlist');
  else args.push('--flat-playlist');
  if (settings.cookiesPath) args.push('--cookies', settings.cookiesPath);
  if (settings.proxy) args.push('--proxy', settings.proxy);
  args.push('--', url);
  return args;
}
