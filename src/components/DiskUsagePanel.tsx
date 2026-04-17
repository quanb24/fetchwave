import React, { useEffect, useRef, useState } from 'react';
import { HardDrive } from 'lucide-react';
import type { DiskUsage } from '../../electron/services/diskUsage';

function fmt(b: number): string {
  if (!Number.isFinite(b) || b <= 0) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${u[i]}`;
}

interface Props {
  path?: string;
  variant?: 'full' | 'compact';
  className?: string;
}

const REFRESH_MS = 30_000;

export const DiskUsagePanel: React.FC<Props> = ({ path, variant = 'full', className = '' }) => {
  const [usage, setUsage] = useState<DiskUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const r = await window.api.system.diskUsage(path);
      if (cancelled || !mounted.current) return;
      setUsage(r.ok ? r.data : null);
      setLoading(false);
    };
    void run();
    const t = setInterval(run, REFRESH_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [path]);

  if (!usage) {
    return (
      <div className={`flex items-center gap-2 text-[11px] text-fg-dim ${className}`}>
        <HardDrive size={12} className="opacity-60" />
        <span>{loading ? 'Checking disk…' : 'Disk usage unavailable'}</span>
      </div>
    );
  }

  const pct = usage.total > 0 ? (usage.used / usage.total) * 100 : 0;
  const low = pct >= 90;
  const warn = pct >= 75 && !low;
  const barClass = low ? 'bg-danger' : warn ? 'bg-warn' : 'bg-gradient-to-r from-accent to-accent-hover';
  const labelClass = low ? 'text-danger' : warn ? 'text-warn' : 'text-fg';

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`} title={`${fmt(usage.used)} used / ${fmt(usage.total)} total · ${fmt(usage.free)} free`}>
        <HardDrive size={12} className="text-fg-dim shrink-0" />
        <div className="h-1 w-24 rounded-full bg-bg-soft overflow-hidden">
          <div className={`h-full ${barClass} transition-[width] duration-500`} style={{ width: `${pct.toFixed(1)}%` }} />
        </div>
        <span className={`text-[11px] font-mono ${labelClass}`}>{fmt(usage.free)} free</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2 text-fg-muted">
          <HardDrive size={13} />
          <span>Disk space</span>
        </div>
        <span className={`font-mono ${labelClass}`}>{fmt(usage.free)} free</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-bg-soft overflow-hidden">
        <div className={`h-full ${barClass} transition-[width] duration-500`} style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-fg-dim font-mono">
        <span>{fmt(usage.used)} used</span>
        <span>{pct.toFixed(0)}%</span>
        <span>{fmt(usage.total)} total</span>
      </div>
      {low && (
        <div className="text-[11px] text-danger mt-1">Low disk space — consider clearing room before large downloads.</div>
      )}
    </div>
  );
};
