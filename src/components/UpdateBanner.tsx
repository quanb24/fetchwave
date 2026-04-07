import React from 'react';
import { useUpdaterStore } from '../store/updaterStore';
import { Button } from './Button';

export const UpdateBanner: React.FC = () => {
  const state = useUpdaterStore((s) => s.state);
  const install = useUpdaterStore((s) => s.install);

  if (state.phase === 'idle' || state.phase === 'not-available' || state.phase === 'checking') return null;

  let body: React.ReactNode = null;
  let cta: React.ReactNode = null;
  let tone = 'border-accent/30 bg-accent-soft';

  switch (state.phase) {
    case 'available':
      body = <>Fetchwave <span className="font-semibold text-fg">{state.version}</span> is downloading…</>;
      break;
    case 'downloading':
      body = (
        <>
          Downloading update…{' '}
          <span className="font-mono text-fg">{Math.round(state.percent)}%</span>
        </>
      );
      break;
    case 'ready':
      body = <>Update <span className="font-semibold text-fg">{state.version}</span> is ready to install.</>;
      cta = <Button size="sm" onClick={() => install()}>Restart & install</Button>;
      tone = 'border-success/30 bg-success/10';
      break;
    case 'error':
      body = <>Update check failed: {state.message}</>;
      tone = 'border-danger/30 bg-danger/10';
      break;
  }

  return (
    <div className={`mx-8 mt-4 rounded-xl border ${tone} px-4 py-2.5 flex items-center gap-3 text-xs text-fg-muted animate-fade-in`}>
      <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
      <div className="flex-1">{body}</div>
      {cta}
    </div>
  );
};
