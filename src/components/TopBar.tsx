import React from 'react';
import { Badge } from './ui/Badge';

interface Props {
  title: string;
  subtitle?: string;
  ytdlpStatus?: { available: boolean; version: string | null };
  right?: React.ReactNode;
}

export const TopBar: React.FC<Props> = ({ title, subtitle, ytdlpStatus, right }) => (
  <header className="drag h-16 shrink-0 border-b border-bg-border bg-bg/60 backdrop-blur-xl flex items-center px-8 glass">
    <div className="flex-1 min-w-0">
      <h1 className="text-[15px] font-semibold text-fg leading-tight">{title}</h1>
      {subtitle && <p className="text-xs text-fg-muted leading-tight mt-0.5">{subtitle}</p>}
    </div>
    <div className="no-drag flex items-center gap-3">
      {ytdlpStatus && (
        ytdlpStatus.available
          ? <Badge tone="success" dot>yt-dlp {ytdlpStatus.version ?? ''}</Badge>
          : <Badge tone="danger" dot>yt-dlp not found</Badge>
      )}
      {right}
    </div>
  </header>
);
