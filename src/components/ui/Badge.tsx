import React from 'react';

type Tone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-bg-elevated text-fg border-bg-border',
  accent:  'bg-accent-soft text-accent border-accent/30',
  success: 'bg-success/10 text-success border-success/25',
  warn:    'bg-warn/10 text-warn border-warn/25',
  danger:  'bg-danger/10 text-danger border-danger/25',
  muted:   'bg-bg-soft text-fg-muted border-bg-border',
};

interface Props {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<Props> = ({ tone = 'neutral', dot, children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium tracking-wide ${tones[tone]} ${className}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);
