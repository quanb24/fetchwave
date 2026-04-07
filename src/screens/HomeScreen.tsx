import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FormatModal } from '../components/FormatModal';
import { Card, CardBody } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Badge } from '../components/ui/Badge';
import { useSettingsStore } from '../store/settingsStore';
import { useHistoryStore } from '../store/historyStore';
import { useToast } from '../components/ui/Toast';
import type { MediaInfo } from '../../electron/domain/media';
import type { QualityPreset } from '../../electron/domain/settings';

const PRESETS: { quality: QualityPreset; label: string; sub: string }[] = [
  { quality: 'best',       label: 'Best',       sub: 'Highest available' },
  { quality: '1080p',      label: '1080p',      sub: 'Full HD · mp4' },
  { quality: '720p',       label: '720p',       sub: 'HD · smaller size' },
  { quality: 'audio-only', label: 'Audio only', sub: 'Extract audio' },
];

export const HomeScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<'idle' | 'analyzing' | 'adding'>('idle');
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const history = useHistoryStore((s) => s.entries).slice(0, 4);
  const toast = useToast();

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Keyboard shortcuts: ⌘V paste, ⌘Enter analyze, Enter quick download
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'v' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        handlePaste();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handlePaste = async () => {
    const r = await window.api.system.readClipboard();
    if (r.ok) setUrl(r.data.trim());
  };

  const [analyzing, setAnalyzing] = useState(false);
  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setBusy('analyzing');
    setAnalyzing(true);   // open modal in loading state immediately
    setInfo(null);
    const r = await window.api.analyze({ url: url.trim(), allowPlaylist: false });
    setBusy('idle');
    if (!r.ok) {
      setAnalyzing(false);
      toast.error('Analysis failed', r.error.message);
      return;
    }
    setInfo(r.data);
    setAnalyzing(false);
  };

  const handleQuickAdd = async () => {
    if (!url.trim()) return;
    setBusy('adding');
    const r = await window.api.queue.add({ url: url.trim() });
    setBusy('idle');
    if (!r.ok) { toast.error('Could not add', r.error.message); return; }
    toast.success('Added to queue', Array.isArray(r.data) ? `${r.data.length} items` : r.data.title ?? url);
    setUrl('');
  };

  const handleConfirmFormat = async (formatSelector: string) => {
    if (!info) return;
    setBusy('adding');
    const r = await window.api.queue.add({ url: info.url, formatSelector, title: info.title });
    setBusy('idle');
    if (!r.ok) { toast.error('Could not add', r.error.message); return; }
    toast.success('Added to queue', info.title);
    setInfo(null);
    setUrl('');
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-10 animate-fade-in">
      {/* Hero input card */}
      <Card elevated className="overflow-hidden">
        <CardBody className="!p-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge tone="accent" dot>Ready</Badge>
            <span className="text-xs text-fg-muted">Paste any supported video URL</span>
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              size="lg"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleAnalyze(); }
                else if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(); }
              }}
              disabled={busy !== 'idle'}
            />
            <Button size="lg" variant="secondary" onClick={handlePaste}>Paste</Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="secondary"
              onClick={handleAnalyze}
              disabled={busy !== 'idle' || !url.trim()}
              loading={busy === 'analyzing'}
            >
              Choose format
              <kbd className="ml-1 text-[10px] text-fg-dim font-mono">⌘↵</kbd>
            </Button>
            <Button
              onClick={handleQuickAdd}
              disabled={busy !== 'idle' || !url.trim()}
              loading={busy === 'adding'}
              className="flex-1"
            >
              Download
              <kbd className="ml-1 text-[10px] text-white/70 font-mono">↵</kbd>
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Quick presets */}
      <div className="mt-10">
        <SectionHeader title="Quality preset" description="Used for the quick Download button" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESETS.map((p) => {
            const active = settings?.qualityDefault === p.quality;
            return (
              <Card
                key={p.quality}
                interactive
                onClick={() => {
                  if (p.quality === 'audio-only') {
                    update({ qualityDefault: 'audio-only', preferredContainer: 'mp3' });
                  } else if (settings?.qualityDefault === 'audio-only') {
                    update({ qualityDefault: p.quality, preferredContainer: 'mp4' });
                  } else {
                    update({ qualityDefault: p.quality });
                  }
                }}
                className={`${active ? 'border-accent/60 bg-accent-soft' : ''}`}
              >
                <CardBody className="!p-4">
                  <div className={`text-sm font-semibold ${active ? 'text-accent' : 'text-fg'}`}>{p.label}</div>
                  <div className="text-xs text-fg-muted mt-1">{p.sub}</div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent downloads */}
      {history.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Recent downloads" description="Your last few completed files" />
          <div className="space-y-2">
            {history.map((e) => (
              <Card key={e.id} className="!rounded-xl">
                <CardBody className="!py-3 !px-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success text-xs">✓</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-fg truncate">{e.title}</div>
                    <div className="text-xs text-fg-dim truncate">{e.outputFile}</div>
                  </div>
                  <div className="text-[11px] text-fg-muted">{new Date(e.finishedAt).toLocaleDateString()}</div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Footer status */}
      <div className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-dim">
        <span>Saving to <span className="text-fg-muted">{settings?.downloadPath ?? '…'}</span></span>
        <span>·</span>
        <span>Concurrency <span className="text-fg-muted">{settings?.concurrency}</span></span>
        <span>·</span>
        <span>Retries <span className="text-fg-muted">{settings?.maxRetries}</span></span>
      </div>

      {(analyzing || info) && (
        <FormatModal
          info={info}
          loading={analyzing}
          onClose={() => { setInfo(null); setAnalyzing(false); }}
          onConfirm={handleConfirmFormat}
        />
      )}
    </div>
  );
};
