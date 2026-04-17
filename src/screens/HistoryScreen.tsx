import React, { useMemo, useState } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Thumbnail } from '../components/Thumbnail';
import { ArrowDown, ArrowUp } from 'lucide-react';

type SortField = 'date' | 'size';
type SortDir = 'desc' | 'asc';

function fmtBytes(b: number | null): string {
  if (!b) return '';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

export const HistoryScreen: React.FC = () => {
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const sign = sortDir === 'desc' ? -1 : 1;
    return [...entries].sort((a, b) => {
      if (sortField === 'size') {
        return ((a.bytes ?? 0) - (b.bytes ?? 0)) * sign;
      }
      return (a.finishedAt - b.finishedAt) * sign;
    });
  }, [entries, sortField, sortDir]);

  const toggle = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="Once a download finishes, it shows up here with its file path and size. Nothing has been completed yet."
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
          </svg>
        }
      />
    );
  }

  const SortButton: React.FC<{ field: SortField; label: string }> = ({ field, label }) => {
    const active = sortField === field;
    const Icon = active && sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <button
        onClick={() => toggle(field)}
        className={`flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] transition-colors ${
          active
            ? 'bg-accent-soft text-accent border border-accent/30'
            : 'text-fg-dim hover:text-fg hover:bg-bg-elevated border border-transparent'
        }`}
      >
        {label}
        <Icon size={11} className={active ? '' : 'opacity-50'} />
      </button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-8 py-8 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-fg">{entries.length} {entries.length === 1 ? 'download' : 'downloads'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-fg-dim mr-1">Sort by</span>
          <SortButton field="date" label="Date" />
          <SortButton field="size" label="Size" />
          <Button size="sm" variant="ghost" onClick={clear}>Clear history</Button>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((e) => (
          <Card key={e.id}>
            <CardBody className="!p-4 flex items-center gap-4">
              <Thumbnail title={e.title} status="completed" size={48} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-fg truncate">{e.title}</div>
                <div className="text-[11px] text-fg-dim truncate mt-0.5">{e.outputFile}</div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.api.system.openFile(e.outputFile)}>
                    Open file
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => window.api.system.revealFile(e.outputFile)}>
                    Show in Finder
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {e.bytes && <Badge tone="muted">{fmtBytes(e.bytes)}</Badge>}
                  <span className="text-[11px] text-fg-dim">{new Date(e.finishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};
