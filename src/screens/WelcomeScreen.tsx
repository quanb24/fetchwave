import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useDiagnosticsStore } from '../store/diagnosticsStore';
import { useSettingsStore } from '../store/settingsStore';
import { PRODUCT } from '../config/product';
import type { BinaryStatus } from '../../electron/services/diagnostics';

interface Props {
  onDone: () => void;
}

const StatusRow: React.FC<{ b: BinaryStatus }> = ({ b }) => {
  const tone = b.status === 'ok' ? 'success' : b.status === 'missing' ? 'danger' : 'warn';
  const label = b.status === 'ok' ? 'Ready' : b.status === 'missing' ? 'Missing' : 'Issue';
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0">
        <div className="text-sm text-fg">{b.name}</div>
        {b.version && <div className="text-[11px] text-fg-dim font-mono mt-0.5">{b.version}</div>}
      </div>
      <Badge tone={tone} dot>{label}</Badge>
    </div>
  );
};

export const WelcomeScreen: React.FC<Props> = ({ onDone }) => {
  const diag = useDiagnosticsStore((s) => s.report);
  const refreshDiag = useDiagnosticsStore((s) => s.refresh);
  const update = useSettingsStore((s) => s.update);
  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  useEffect(() => { void refreshDiag(); }, [refreshDiag]);

  const required = diag?.binaries.filter((b) => b.name !== 'ffprobe') ?? [];
  const allOk = required.length > 0 && required.every((b) => b.status === 'ok');

  const handleRepair = async () => {
    setRepairing(true);
    setRepairMsg('Starting repair…');
    const off = window.api.on.repairProgress((p) => setRepairMsg(p.message));
    const r = await window.api.repair.run();
    off();
    setRepairing(false);
    if (r.ok) {
      setRepairMsg(r.data.message);
      await refreshDiag();
    } else {
      setRepairMsg(r.error.message);
    }
  };

  const handleContinue = async () => {
    await update({ firstLaunchCompleted: true });
    onDone();
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-bg flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-2xl shadow-elevated mb-5">
            F
          </div>
          <h1 className="text-2xl font-semibold text-fg">Welcome to {PRODUCT.name}</h1>
          <p className="text-sm text-fg-muted mt-2 max-w-md mx-auto">{PRODUCT.tagline}</p>
        </div>

        <Card elevated>
          <CardBody className="!p-6">
            <h2 className="text-sm font-semibold text-fg mb-1">Runtime check</h2>
            <p className="text-xs text-fg-muted mb-4">
              Fetchwave bundles its own copies of yt-dlp and ffmpeg. We just verified everything is working.
            </p>
            <div className="divide-y divide-bg-border">
              {diag?.binaries.map((b) => <StatusRow key={b.name} b={b} />) ?? (
                <div className="text-xs text-fg-muted py-4">Checking…</div>
              )}
            </div>

            {repairMsg && (
              <div className="mt-4 text-xs text-fg-muted bg-bg-soft border border-bg-border rounded-lg px-3 py-2">
                {repairMsg}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          {!allOk && (
            <Button variant="secondary" onClick={handleRepair} loading={repairing}>
              Repair runtime
            </Button>
          )}
          <Button onClick={handleContinue} className={allOk ? 'flex-1' : ''} disabled={repairing}>
            {allOk ? 'Get started →' : 'Continue anyway'}
          </Button>
        </div>

        <div className="text-center text-[11px] text-fg-dim mt-6">
          v{PRODUCT.version} · {PRODUCT.copyright}
        </div>
      </div>
    </div>
  );
};
