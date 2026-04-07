import React from 'react';

interface Props {
  title: string | null | undefined;
  status?: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  size?: number;
}

const palettes = [
  ['#6e8bff', '#a06bff'],
  ['#22c55e', '#0ea5e9'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#06b6d4', '#3b82f6'],
  ['#f97316', '#facc15'],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const Thumbnail: React.FC<Props> = ({ title, status, size = 56 }) => {
  const seed = title ?? 'untitled';
  const [a, b] = palettes[hash(seed) % palettes.length];
  const initial = (seed.trim()[0] ?? '?').toUpperCase();
  const dim = status === 'completed' || status === 'cancelled' || status === 'failed';

  return (
    <div
      className="relative shrink-0 rounded-xl overflow-hidden border border-bg-border"
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-0 ${dim ? 'opacity-50' : ''}`}
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-lg drop-shadow-sm">{initial}</span>
      </div>
      {status === 'running' && (
        <div className="absolute inset-0 ring-2 ring-accent/60 ring-inset rounded-xl animate-pulse" />
      )}
    </div>
  );
};
