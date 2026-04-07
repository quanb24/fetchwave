import type { DownloadProgress } from '../domain/job';

const PROGRESS_LINE = /^\[PROGRESS\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
const DESTINATION = /^\[download\] Destination:\s+(.+)$/;
const MERGER = /^\[Merger\] Merging formats into "(.+)"$/;
const ALREADY = /^\[download\]\s+(.+?) has already been downloaded/;
const EXTRACT_AUDIO = /^\[ExtractAudio\] Destination:\s+(.+)$/;
const FIXUP = /^\[FixupM4a\] (.+)$/;

export interface ParseResult {
  progress?: Partial<DownloadProgress>;
  outputFile?: string;
}

function num(s: string): number | null {
  if (!s || s === 'NA' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function nullable(s: string): string | null {
  return !s || s === 'NA' || s === 'N/A' ? null : s;
}

export function parseLine(line: string): ParseResult | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const m = trimmed.match(PROGRESS_LINE);
  if (m) {
    const percentStr = m[1].replace('%', '');
    const percent = Number(percentStr);
    const fi = num(m[6]);
    const fc = num(m[7]);
    return {
      progress: {
        percent: Number.isFinite(percent) ? percent : 0,
        speed: nullable(m[2]),
        eta: nullable(m[3]),
        downloadedBytes: num(m[4]),
        totalBytes: num(m[5]),
        fragment: fi !== null && fc !== null ? { current: fi, total: fc } : null,
      },
    };
  }

  const dest = trimmed.match(DESTINATION);
  if (dest) return { outputFile: dest[1] };

  const merger = trimmed.match(MERGER);
  if (merger) return { outputFile: merger[1] };

  const audio = trimmed.match(EXTRACT_AUDIO);
  if (audio) return { outputFile: audio[1] };

  const fix = trimmed.match(FIXUP);
  if (fix) return null;

  const already = trimmed.match(ALREADY);
  if (already) return { outputFile: already[1], progress: { percent: 100 } };

  return null;
}
