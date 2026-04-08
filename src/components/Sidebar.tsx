import React, { useEffect, useState } from 'react';
import { PRODUCT } from '../config/product';
import { useUpdaterStore } from '../store/updaterStore';

export type ScreenKey = 'home' | 'queue' | 'history' | 'settings';

interface Props {
  current: ScreenKey;
  onChange: (s: ScreenKey) => void;
  queueCount: number;
}

const items: { key: ScreenKey; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { key: 'home',     label: 'Home',     shortcut: '⌘1', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>
  )},
  { key: 'queue',    label: 'Queue',    shortcut: '⌘2', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v14"/><path d="M6 11l6 6 6-6"/><path d="M4 21h16"/></svg>
  )},
  { key: 'history',  label: 'History',  shortcut: '⌘3', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
  )},
  { key: 'settings', label: 'Settings', shortcut: '⌘,', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

export const Sidebar: React.FC<Props> = ({ current, onChange, queueCount }) => {
  // Live runtime version from app.getVersion(), so the displayed version
  // updates the moment the user installs an auto-update.
  const [version, setVersion] = useState<string>(PRODUCT.version);
  useEffect(() => {
    void window.api.system.getVersion().then((r) => {
      if (r.ok) setVersion(r.data);
    });
  }, []);

  const updateState = useUpdaterStore((s) => s.state);
  const installUpdate = useUpdaterStore((s) => s.install);
  const updateReady = updateState.phase === 'ready';

  const handleRestart = async () => {
    if (updateReady) {
      // Use the updater's quit-and-install path so the new version is applied.
      await installUpdate();
    } else {
      // Plain restart for cases where the user just wants to reload.
      const ok = window.confirm('Restart Fetchwave?\n\nAny in-progress downloads will be paused and resumed automatically.');
      if (!ok) return;
      await window.api.system.restart();
    }
  };

  return (
    <aside className="w-60 shrink-0 bg-bg-soft border-r border-bg-border flex flex-col">
      {/* Top padding clears the macOS traffic-light buttons (red/yellow/green)
          which sit inside the window on hiddenInset title bars. */}
      <div className="drag px-5 pt-11 pb-5">
        <div className="no-drag flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-sm shadow-sm">F</div>
          <div>
            <div className="text-sm font-semibold text-fg leading-none">{PRODUCT.name}</div>
            <div className="text-[10px] text-fg-dim mt-1 uppercase tracking-wider">Desktop</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {items.map((it) => {
          const active = current === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`
                group w-full flex items-center gap-3 rounded-lg px-3 h-9 text-sm transition
                ${active
                  ? 'bg-accent-soft text-accent'
                  : 'text-fg-muted hover:text-fg hover:bg-bg-card'}
              `}
            >
              <span className={active ? 'text-accent' : 'text-fg-dim group-hover:text-fg-muted'}>{it.icon}</span>
              <span className="flex-1 text-left font-medium">{it.label}</span>
              {it.key === 'queue' && queueCount > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold flex items-center justify-center">
                  {queueCount}
                </span>
              )}
              <span className="text-[10px] text-fg-faint font-mono tracking-tight">{it.shortcut}</span>
            </button>
          );
        })}
      </nav>

      {/* Restart button — pulses + changes copy when an update is downloaded
          and ready to install. Otherwise it's a quiet manual restart. */}
      <div className="px-3 pb-3">
        <button
          onClick={handleRestart}
          className={`
            w-full flex items-center justify-center gap-2 h-8 rounded-lg text-xs font-medium
            transition border
            ${updateReady
              ? 'bg-accent text-white border-accent shadow-[0_0_0_3px_rgba(110,139,255,0.18)] animate-pulse'
              : 'bg-bg-card border-bg-border text-fg-muted hover:text-fg hover:border-bg-border-strong'}
          `}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>
          </svg>
          {updateReady ? 'Restart & install update' : 'Restart Fetchwave'}
        </button>
      </div>

      <div className="px-4 py-3 border-t border-bg-border">
        <div className="text-[10px] text-fg-dim font-mono">v{version}</div>
        <div className="text-[10px] text-fg-faint uppercase tracking-wider mt-0.5">{PRODUCT.channel}</div>
      </div>
    </aside>
  );
};
