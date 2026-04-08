import React, { useMemo, useState } from 'react';
import type { MediaInfo, FormatOption } from '../../electron/domain/media';
import { Button } from './Button';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Toggle } from './ui/Toggle';

interface Props {
  info: MediaInfo | null;       // null while analyze is in flight
  loading?: boolean;
  onClose: () => void;
  onConfirm: (formatSelector: string, audioOnly: boolean) => void;
}

function fmtSize(b: number | null): string {
  if (!b) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}
function fmtDuration(sec: number | null): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

type Container = 'mp4' | 'mkv' | 'webm';

export const FormatModal: React.FC<Props> = ({ info, loading, onClose, onConfirm }) => {
  const [audioOnly, setAudioOnly] = useState(false);
  const [container, setContainer] = useState<Container>('mp4');
  const [height, setHeight] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const videoFormats = useMemo(
    () => (info ? info.formats.filter((f) => f.vcodec && f.vcodec !== 'none') : []),
    [info],
  );
  const audioFormats = useMemo(
    () => (info ? info.formats.filter((f) => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none')) : []),
    [info],
  );

  const resolutions = useMemo(() => {
    const set = new Set<number>();
    for (const f of videoFormats) {
      const r = f.resolution;
      if (!r) continue;
      const h = Number(r.split('x')[1]);
      if (Number.isFinite(h)) set.add(h);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [videoFormats]);

  const estimatedSize = useMemo(() => {
    if (audioOnly) {
      const best = audioFormats.find((f) => f.filesize);
      return best?.filesize ?? null;
    }
    if (height) {
      const match = videoFormats
        .filter((f) => f.resolution?.endsWith(`x${height}`) && f.filesize)
        .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];
      return match?.filesize ?? null;
    }
    const best = videoFormats.filter((f) => f.filesize).sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];
    return best?.filesize ?? null;
  }, [audioOnly, height, videoFormats, audioFormats]);

  const handleConfirm = () => {
    let selector: string;
    if (audioOnly) {
      selector = 'bestaudio/best';
      onConfirm(selector, true);
      return;
    }
    if (height) {
      // Prefer the actual requested resolution at ANY codec — YouTube only
      // ships H.264/mp4 up to 1080p, so 2160p/1440p must come from VP9/AV1
      // (webm). The container choice is honoured at remux time via
      // --merge-output-format, not by filtering source streams.
      selector = [
        `bv*[height=${height}]+ba/b[height=${height}]`,
        `bv*[height<=${height}]+ba/b[height<=${height}]`,
      ].join('/');
    } else {
      selector = 'bv*+ba/b';
    }
    onConfirm(selector, false);
  };

  const footer = (
    <>
      <div className="flex-1 text-xs text-fg-muted">
        Estimated size: <span className="text-fg font-medium">{fmtSize(estimatedSize)}</span>
      </div>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={handleConfirm}>Add to queue</Button>
    </>
  );

  const PillButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; full?: boolean }> = ({
    active, onClick, children, full,
  }) => (
    <button
      onClick={onClick}
      className={`
        h-10 rounded-lg border text-xs font-semibold transition-all
        ${full ? 'w-full' : ''}
        ${active
          ? 'bg-accent text-white border-accent shadow-[0_0_0_3px_rgba(110,139,255,0.18)]'
          : 'bg-bg-card border-bg-border text-fg-muted hover:text-fg hover:border-bg-border-strong'}
      `}
    >
      {children}
    </button>
  );

  if (loading || !info) {
    return (
      <Modal open onClose={onClose} title="Analyzing video…" subtitle="Fetching available formats">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-fg-muted">
            <span className="h-4 w-4 rounded-full border-2 border-accent border-r-transparent animate-spin" />
            yt-dlp is fetching metadata. This usually takes a few seconds.
          </div>
          <div className="space-y-2">
            <div className="h-12 rounded-lg bg-shimmer animate-shimmer" />
            <div className="h-10 rounded-lg bg-shimmer animate-shimmer" />
            <div className="h-10 rounded-lg bg-shimmer animate-shimmer" />
          </div>
        </div>
      </Modal>
    );
  }

  const isHighRes = height !== null && height >= 1440;

  return (
    <Modal
      open
      onClose={onClose}
      title={info.title}
      subtitle={[info.uploader, fmtDuration(info.duration)].filter(Boolean).join(' · ')}
      footer={footer}
    >
      <div className="p-6 space-y-7">
        {/* Header meta */}
        <div className="flex flex-wrap gap-2">
          <Badge tone="muted">{videoFormats.length} video</Badge>
          <Badge tone="muted">{audioFormats.length} audio</Badge>
          {info.subtitles.length > 0 && <Badge tone="muted">{info.subtitles.length} subs</Badge>}
          {info.isPlaylist && info.playlistCount && <Badge tone="accent">Playlist · {info.playlistCount}</Badge>}
        </div>

        {/* Mode toggle */}
        <div className="rounded-xl border border-bg-border bg-bg-card p-4">
          <Toggle
            checked={audioOnly}
            onChange={setAudioOnly}
            label="Audio only"
            description="Extract the best audio track and skip video"
          />
        </div>

        {!audioOnly && (
          <>
            <div>
              <div className="label mb-3">Container</div>
              <div className="grid grid-cols-3 gap-2">
                {(['mp4', 'mkv', 'webm'] as Container[]).map((c) => (
                  <PillButton key={c} active={container === c} onClick={() => setContainer(c)} full>
                    {c.toUpperCase()}
                  </PillButton>
                ))}
              </div>
            </div>

            <div>
              <div className="label mb-3">Resolution</div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <PillButton active={height === null} onClick={() => setHeight(null)} full>Best</PillButton>
                {resolutions.map((h) => (
                  <PillButton key={h} active={height === h} onClick={() => setHeight(h)} full>{h}p</PillButton>
                ))}
              </div>
              {isHighRes && (
                <p className="mt-3 text-[11px] text-fg-muted leading-snug">
                  4K and 1440p sources use VP9 or AV1 video. Fetchwave downloads them as
                  separate streams and remuxes them into your chosen container with
                  ffmpeg — no quality loss, just an extra few seconds at the end.
                </p>
              )}
            </div>
          </>
        )}

        {/* Advanced section */}
        <div>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-fg-muted hover:text-fg flex items-center gap-1.5 transition"
          >
            <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>›</span>
            All available formats
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {!audioOnly && (
                <div>
                  <div className="label mb-2">Video streams</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1 rounded-lg">
                    {videoFormats.map((f: FormatOption) => (
                      <div key={f.formatId} className="flex items-center gap-3 text-[11px] px-3 py-2 rounded-lg bg-bg-soft border border-bg-border">
                        <span className="font-mono text-fg-dim w-12">{f.formatId}</span>
                        <span className="flex-1 text-fg">{f.resolution ?? '—'} {f.fps ? `· ${f.fps}fps` : ''}</span>
                        <span className="text-fg-muted">{f.ext}</span>
                        <span className="font-mono text-fg-muted w-16 text-right">{fmtSize(f.filesize)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="label mb-2">Audio streams</div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 rounded-lg">
                  {audioFormats.map((f: FormatOption) => (
                    <div key={f.formatId} className="flex items-center gap-3 text-[11px] px-3 py-2 rounded-lg bg-bg-soft border border-bg-border">
                      <span className="font-mono text-fg-dim w-12">{f.formatId}</span>
                      <span className="flex-1 text-fg">{f.acodec ?? '—'}</span>
                      <span className="text-fg-muted">{f.ext}</span>
                      <span className="font-mono text-fg-muted w-16 text-right">{fmtSize(f.filesize)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
