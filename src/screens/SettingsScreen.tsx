import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useDiagnosticsStore } from '../store/diagnosticsStore';
import { useUpdaterStore } from '../store/updaterStore';
import { useUiStore } from '../store/uiStore';
import { useToast } from '../components/ui/Toast';
import { Input, Select } from '../components/Input';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { Badge } from '../components/ui/Badge';
import { PRODUCT } from '../config/product';
import {
  Download, Subtitles, RefreshCw, Shield, Globe, Palette, Wrench,
  FileText, Info, ExternalLink, Code, Bug, BookOpen, HardDrive,
  RotateCcw, Upload, Activity, Zap,
} from 'lucide-react';
import type { AppSettings, CollisionStrategy, Container, QualityPreset, Theme } from '../../electron/domain/settings';
import type { BinaryStatus } from '../../electron/services/diagnostics';
import { DiskUsagePanel } from '../components/DiskUsagePanel';

/* ─── Local primitives ─── */

const Group: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <Card>
    <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
      {icon && <span className="text-fg-dim shrink-0">{icon}</span>}
      <div>
        <h2 className="text-[13px] font-semibold text-fg tracking-tight">{title}</h2>
        {description && <p className="text-[11px] text-fg-muted mt-0.5 leading-snug">{description}</p>}
      </div>
    </div>
    <CardBody className="!p-0 divide-y divide-bg-border">{children}</CardBody>
  </Card>
);

const Row: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
  stacked?: boolean;
}> = ({ label, description, children, stacked }) => (
  <div className={`px-6 py-3.5 ${stacked ? 'space-y-2.5' : 'flex items-center gap-6'} transition-colors duration-150 hover:bg-bg-elevated/40`}>
    <div className={stacked ? '' : 'flex-1 min-w-0'}>
      <div className="text-[13px] font-medium text-fg">{label}</div>
      {description && <div className="text-[11px] text-fg-muted mt-0.5 leading-snug">{description}</div>}
    </div>
    <div className={stacked ? '' : 'w-64 shrink-0'}>{children}</div>
  </div>
);

const ResourceRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  url: string;
}> = ({ icon, label, description, url }) => (
  <button
    onClick={() => window.open(url)}
    className="w-full px-6 py-4 flex items-center gap-4 transition-colors hover:bg-bg-soft/40 group text-left"
  >
    <span className="h-9 w-9 rounded-xl bg-bg-elevated border border-bg-border flex items-center justify-center text-fg-dim group-hover:text-accent group-hover:border-accent/30 transition-colors shrink-0">
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-fg group-hover:text-accent transition-colors">{label}</div>
      <div className="text-xs text-fg-muted mt-0.5">{description}</div>
    </div>
    <ExternalLink size={14} className="text-fg-faint group-hover:text-fg-dim transition-colors shrink-0" />
  </button>
);

const statusBadge = (s: BinaryStatus) => {
  switch (s.status) {
    case 'ok': return <Badge tone="success" dot>OK</Badge>;
    case 'missing': return <Badge tone="danger" dot>Missing</Badge>;
    case 'not_executable': return <Badge tone="warn" dot>Not executable</Badge>;
    case 'version_failed': return <Badge tone="danger" dot>Failed</Badge>;
  }
};

/* ─── Main component ─── */

export const SettingsScreen: React.FC = () => {
  const persisted = useSettingsStore((s) => s.settings);
  const persist = useSettingsStore((s) => s.update);
  const diag = useDiagnosticsStore((s) => s.report);
  const diagLoading = useDiagnosticsStore((s) => s.loading);
  const refreshDiag = useDiagnosticsStore((s) => s.refresh);
  const updateState = useUpdaterStore((s) => s.state);
  const checkForUpdates = useUpdaterStore((s) => s.check);
  const installUpdate = useUpdaterStore((s) => s.install);
  const toast = useToast();

  const [draft, setDraft] = useState<AppSettings | null>(persisted);
  useEffect(() => { setDraft(persisted); }, [persisted]);

  const settings = draft;
  const isDirty = !!persisted && !!draft && JSON.stringify(persisted) !== JSON.stringify(draft);

  const setSettingsDirty = useUiStore((s) => s.setSettingsDirty);
  useEffect(() => {
    setSettingsDirty(isDirty);
    return () => setSettingsDirty(false);
  }, [isDirty, setSettingsDirty]);

  const update = (patch: Partial<AppSettings>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const [runtimeVersion, setRuntimeVersion] = useState<string>(PRODUCT.version);
  useEffect(() => {
    void window.api.system.getVersion().then((r) => { if (r.ok) setRuntimeVersion(r.data); });
  }, []);

  const handleSave = async () => {
    if (!draft) return;
    await persist(draft);
    toast.success('Settings saved');
  };
  const handleDiscard = () => {
    setDraft(persisted);
    toast.info('Changes discarded');
  };

  const [repairing, setRepairing] = useState(false);
  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  useEffect(() => { void refreshDiag(); }, [refreshDiag]);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairMsg('Starting repair…');
    const off = window.api.on.repairProgress((p) => setRepairMsg(p.message));
    const r = await window.api.repair.run();
    off();
    setRepairing(false);
    if (r.ok) {
      setRepairMsg(r.data.message);
      if (r.data.phase === 'done') toast.success('Runtime repaired', 'Fetchwave is using the freshly downloaded yt-dlp.');
      else if (r.data.phase === 'error') toast.error('Repair failed', r.data.message);
      await refreshDiag();
    } else {
      toast.error('Repair failed', r.error.message);
    }
  };

  const handleExportLogs = async () => {
    const r = await window.api.logs.export();
    if (r.ok && r.data) toast.success('Logs exported', r.data);
    else if (r.ok && !r.data) {/* user cancelled */}
    else if (!r.ok) toast.error('Export failed', r.error.message);
  };

  const handleCheckUpdates = async () => {
    toast.info('Checking for updates…');
    await checkForUpdates();
  };

  const updateLabel = (() => {
    switch (updateState.phase) {
      case 'idle': return 'Idle';
      case 'checking': return 'Checking…';
      case 'available': return `Downloading ${updateState.version}`;
      case 'not-available': return 'Up to date';
      case 'downloading': return `Downloading… ${Math.round(updateState.percent)}%`;
      case 'ready': return `Update ${updateState.version} ready`;
      case 'error': return 'Check failed';
    }
  })();

  if (!settings) return <div className="p-8 text-fg-muted">Loading…</div>;

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => update({ [k]: v } as Partial<AppSettings>);

  const pickFolder = async (key: keyof AppSettings) => {
    const r = await window.api.system.pickFolder();
    if (r.ok && r.data) set(key, r.data as never);
  };
  const pickFile = async (key: keyof AppSettings) => {
    const r = await window.api.system.pickFile();
    if (r.ok && r.data) set(key, r.data as never);
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-10 space-y-8 animate-fade-in">
      {/* Sticky save bar */}
      {isDirty && (
        <div className="sticky top-0 z-10 -mx-2 px-4 py-3 rounded-xl border border-accent/40 bg-bg-card flex items-center justify-between animate-fade-in shadow-elevated">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-fg">Unsaved changes</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleDiscard}>Discard</Button>
            <Button size="sm" onClick={handleSave}>Save changes</Button>
          </div>
        </div>
      )}

      <Group title="Downloads" description="Where and how files are saved." icon={<Download size={16} />}>
        <Row label="Download folder" description="Destination for all completed files" stacked>
          <div className="flex gap-2">
            <Input value={settings.downloadPath} onChange={(e) => set('downloadPath', e.target.value)} />
            <Button variant="secondary" onClick={() => pickFolder('downloadPath')}>Browse</Button>
          </div>
          <DiskUsagePanel path={settings.downloadPath} className="mt-3" />
        </Row>
        <Row label="Preferred container" description="Output file format when merging streams">
          <Select value={settings.preferredContainer} onChange={(e) => set('preferredContainer', e.target.value as Container)}>
            {['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'opus', 'auto'].map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Row>
        <Row label="Default quality" description="Used by the quick Download button">
          <Select
            value={settings.qualityDefault}
            onChange={(e) => {
              const q = e.target.value as QualityPreset;
              const audioish = ['mp3','m4a','opus','aac','flac','wav'];
              if (q === 'audio-only') {
                update({ qualityDefault: q, preferredContainer: 'mp3' });
              } else if (audioish.includes(settings.preferredContainer)) {
                update({ qualityDefault: q, preferredContainer: 'mp4' });
              } else {
                update({ qualityDefault: q });
              }
            }}
          >
            {['best', '2160p', '1440p', '1080p', '720p', '480p', 'audio-only'].map((q) => <option key={q}>{q}</option>)}
          </Select>
        </Row>
        <Row label="Concurrent downloads" description="Number of jobs running in parallel">
          <Input type="number" min={1} max={16} value={settings.concurrency}
            onChange={(e) => set('concurrency', Math.max(1, Math.min(16, Number(e.target.value) || 1)))} />
        </Row>
        <Row label="Rate limit" description="Maximum bandwidth per job (KB/s, 0 = unlimited)">
          <Input type="number" min={0} value={settings.rateLimitKbps ?? 0}
            onChange={(e) => set('rateLimitKbps', Number(e.target.value) || null)} />
        </Row>
        <Row label="On filename collision" description="What to do when the output file already exists">
          <Select value={settings.collisionStrategy}
            onChange={(e) => set('collisionStrategy', e.target.value as CollisionStrategy)}>
            <option value="rename">Rename (suffix)</option>
            <option value="overwrite">Overwrite</option>
            <option value="skip">Skip</option>
          </Select>
        </Row>
        <Row label="Expand playlists" description="Automatically split playlists into individual jobs">
          <Toggle checked={settings.expandPlaylists} onChange={(v) => set('expandPlaylists', v)} />
        </Row>
      </Group>

      <Group title="Subtitles" description="Subtitle download and embedding." icon={<Subtitles size={16} />}>
        <Row label="Download subtitle files" description="Save .vtt/.srt files next to the video">
          <Toggle checked={settings.writeSubtitles} onChange={(v) => set('writeSubtitles', v)} />
        </Row>
        <Row label="Embed subtitles" description="Mux subtitles directly into the video container">
          <Toggle checked={settings.embedSubtitles} onChange={(v) => set('embedSubtitles', v)} />
        </Row>
        <Row label="Languages" description="Comma-separated language codes (e.g. en,es,ja)" stacked>
          <Input
            value={settings.subtitleLanguages.join(',')}
            onChange={(e) => set('subtitleLanguages', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          />
        </Row>
      </Group>

      <Group title="Retries" description="How failed downloads are retried automatically." icon={<RefreshCw size={16} />}>
        <Row label="Max retries per job" description="Attempts before marking a job as failed">
          <Input type="number" min={0} max={10} value={settings.maxRetries}
            onChange={(e) => set('maxRetries', Math.max(0, Math.min(10, Number(e.target.value) || 0)))} />
        </Row>
        <Row label="Retry base delay" description="Exponential backoff starting point (ms)">
          <Input type="number" min={100} max={60000} value={settings.retryBaseDelayMs}
            onChange={(e) => set('retryBaseDelayMs', Math.max(100, Math.min(60000, Number(e.target.value) || 2000)))} />
        </Row>
      </Group>

      <Group title="Network" description="Proxy and authentication." icon={<Globe size={16} />}>
        <Row label="Proxy URL" description="HTTP/SOCKS proxy (e.g. http://host:port)" stacked>
          <Input value={settings.proxy ?? ''} placeholder="http://host:port" onChange={(e) => set('proxy', e.target.value || null)} />
        </Row>
        <Row label="Cookies file" description="Netscape-format cookies for authenticated downloads" stacked>
          <div className="flex gap-2">
            <Input value={settings.cookiesPath ?? ''} onChange={(e) => set('cookiesPath', e.target.value || null)} />
            <Button variant="secondary" onClick={() => pickFile('cookiesPath')}>Browse</Button>
          </div>
        </Row>
      </Group>

      <Group title="Runtime status" description="Fetchwave bundles its own copies of yt-dlp and ffmpeg." icon={<Activity size={16} />}>
        {diag?.binaries.map((b) => (
          <div key={b.name} className="px-6 py-4 transition-colors hover:bg-bg-soft/40">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{b.name}</span>
                  <Badge tone="muted">{b.source}</Badge>
                  {statusBadge(b)}
                </div>
                <div className="text-xs text-fg-muted mt-0.5 truncate font-mono">{b.path}</div>
                {b.version && <div className="text-[11px] text-fg-dim mt-0.5">{b.version}</div>}
                {b.status !== 'ok' && (
                  <div className="text-xs text-danger mt-1">{b.message}</div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-fg-muted">
            Platform: <span className="text-fg font-mono">{diag?.platform}/{diag?.arch}</span>
            {diag?.packaged !== undefined && (
              <>{' · '}Mode: <span className="text-fg font-mono">{diag.packaged ? 'packaged' : 'dev'}</span></>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={() => refreshDiag()} loading={diagLoading}>
            Re-check
          </Button>
        </div>
      </Group>

      <Group title="Advanced binary overrides" description="Leave as 'bundled' to use the binaries shipped with Fetchwave." icon={<HardDrive size={16} />}>
        <Row label="yt-dlp executable" description="Use 'bundled' or an absolute path to a custom yt-dlp" stacked>
          <Input value={settings.ytdlpPath} placeholder="bundled" onChange={(e) => set('ytdlpPath', e.target.value)} />
        </Row>
        <Row label="ffmpeg executable" description="Use 'bundled' or an absolute path to a custom ffmpeg" stacked>
          <Input value={settings.ffmpegPath} placeholder="bundled" onChange={(e) => set('ffmpegPath', e.target.value)} />
        </Row>
        <Row label="ffprobe executable" description="Use 'bundled' or an absolute path to a custom ffprobe" stacked>
          <Input value={settings.ffprobePath} placeholder="bundled" onChange={(e) => set('ffprobePath', e.target.value)} />
        </Row>
        <div className="px-6 py-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              const reset = { ytdlpPath: 'bundled', ffmpegPath: 'bundled', ffprobePath: 'bundled' };
              await persist(reset);
              setDraft((d) => (d ? { ...d, ...reset } : d));
              setTimeout(() => refreshDiag(), 100);
              toast.success('Reset to bundled');
            }}
          >
            <RotateCcw size={13} /> Reset all to bundled
          </Button>
        </div>
      </Group>

      <Group title="Appearance" description="Visual preferences." icon={<Palette size={16} />}>
        <Row label="Theme" description="Application color scheme">
          <Select value={settings.theme} onChange={(e) => set('theme', e.target.value as Theme)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </Row>
        <Row label="Advanced mode" description="Show advanced format pickers and raw yt-dlp options">
          <Toggle checked={settings.advancedMode} onChange={(v) => set('advancedMode', v)} />
        </Row>
      </Group>

      {/* Updates */}
      <Group title="Updates" description="Fetchwave can update itself in the background." icon={<Zap size={16} />}>
        <Row label="Check for updates automatically" description="Run a check shortly after every launch">
          <Toggle checked={settings.autoCheckForUpdates} onChange={(v) => set('autoCheckForUpdates', v)} />
        </Row>
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200 ${
              updateState.phase === 'ready'
                ? 'bg-success/10 border-success/30 text-success'
                : updateState.phase === 'error'
                  ? 'bg-danger/10 border-danger/30 text-danger'
                  : updateState.phase === 'checking' || updateState.phase === 'downloading'
                    ? 'bg-accent-soft border-accent/30 text-accent'
                    : 'bg-bg-elevated border-bg-border text-fg-dim'
            }`}>
              <Zap size={16} className={updateState.phase === 'checking' ? 'animate-pulse' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-fg">v{runtimeVersion}</span>
                <Badge tone={PRODUCT.channel === 'stable' ? 'success' : 'accent'}>{PRODUCT.channel}</Badge>
              </div>
              <div className={`text-[11px] mt-0.5 ${
                updateState.phase === 'ready' ? 'text-success' :
                updateState.phase === 'error' ? 'text-danger' : 'text-fg-muted'
              }`}>
                {updateLabel}
              </div>
            </div>
            <div className="shrink-0">
              {updateState.phase === 'ready' ? (
                <Button size="sm" onClick={() => installUpdate()}>
                  <Zap size={13} /> Restart & install
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={handleCheckUpdates}
                  loading={updateState.phase === 'checking' || updateState.phase === 'downloading'}>
                  Check now
                </Button>
              )}
            </div>
          </div>
        </div>
      </Group>

      {/* Self-heal */}
      <Group title="Self-heal" description="If yt-dlp stops working, Fetchwave can re-download a fresh copy." icon={<Wrench size={16} />}>
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-fg">Repair runtime</div>
              <div className="text-xs text-fg-muted mt-0.5">Re-downloads yt-dlp and re-runs diagnostics.</div>
            </div>
            <Button variant="secondary" onClick={handleRepair} loading={repairing}>
              <Wrench size={13} /> Repair
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-fg">Reset to bundled</div>
              <div className="text-xs text-fg-muted mt-0.5">Wipes any repaired copy and forces bundled binaries.</div>
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                const r = await window.api.repair.reset();
                if (r.ok) {
                  toast.success('Reset to bundled', r.data.removed ? 'Repair layer cleared.' : 'Already using bundled binaries.');
                  await refreshDiag();
                } else {
                  toast.error('Reset failed', r.error.message);
                }
              }}
            >
              <RotateCcw size={13} /> Reset
            </Button>
          </div>
          {repairMsg && (
            <div className="text-xs text-fg-muted bg-bg-soft border border-bg-border rounded-lg px-3 py-2">
              {repairMsg}
            </div>
          )}
        </div>
      </Group>

      {/* Logs */}
      <Group title="Logs" description="Verbose log of every download, error, and diagnostic check." icon={<FileText size={16} />}>
        <div className="px-6 py-4 flex items-center justify-between transition-colors hover:bg-bg-soft/40">
          <div>
            <div className="text-sm text-fg">Reveal log file</div>
            <div className="text-xs text-fg-muted mt-0.5">Open the log folder in Finder / File Explorer.</div>
          </div>
          <Button variant="secondary" onClick={() => window.api.logs.reveal()}>Reveal</Button>
        </div>
        <div className="px-6 py-4 flex items-center justify-between transition-colors hover:bg-bg-soft/40">
          <div>
            <div className="text-sm text-fg">Export application log</div>
            <div className="text-xs text-fg-muted mt-0.5">Save a snapshot for support or debugging.</div>
          </div>
          <Button variant="secondary" onClick={handleExportLogs}>
            <Upload size={13} /> Export
          </Button>
        </div>
      </Group>

      {/* About */}
      <Card>
        <CardBody className="!p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-xl shadow-elevated shrink-0">
              F
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-fg">{PRODUCT.name}</h2>
                <Badge tone="muted">v{runtimeVersion}</Badge>
                <Badge tone="accent">{PRODUCT.channel}</Badge>
              </div>
              <p className="text-xs text-fg-muted mt-1">{PRODUCT.tagline}</p>
              <p className="text-[13px] text-fg-muted leading-relaxed mt-3">{PRODUCT.description}</p>
              <p className="text-[11px] text-fg-dim mt-4">{PRODUCT.copyright}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Support & Resources */}
      <Group title="Support & Resources" description="Documentation, issues, and project links." icon={<Shield size={16} />}>
        <ResourceRow
          icon={<Globe size={16} />}
          label="Website"
          description="Product home and downloads"
          url={PRODUCT.links.website}
        />
        <ResourceRow
          icon={<BookOpen size={16} />}
          label="Documentation"
          description="Setup, usage, and troubleshooting"
          url={PRODUCT.links.docs}
        />
        <ResourceRow
          icon={<Code size={16} />}
          label="Source code"
          description="GitHub repository"
          url={PRODUCT.links.repo}
        />
        <ResourceRow
          icon={<Bug size={16} />}
          label="Report an issue"
          description="File a bug or request a feature"
          url={PRODUCT.links.issues}
        />
      </Group>

      {/* Attribution */}
      <Group title="Acknowledgements" description="Open-source projects that power Fetchwave." icon={<Info size={16} />}>
        <Row label={PRODUCT.attribution.ytdlp.name} description={PRODUCT.attribution.ytdlp.note} stacked>
          <div className="flex items-center justify-between">
            <Badge tone="muted">{PRODUCT.attribution.ytdlp.license}</Badge>
            <Button size="sm" variant="ghost" onClick={() => window.open(PRODUCT.attribution.ytdlp.url)}>
              Visit project <ExternalLink size={12} />
            </Button>
          </div>
        </Row>
        <Row label={PRODUCT.attribution.ffmpeg.name} description={PRODUCT.attribution.ffmpeg.note} stacked>
          <div className="flex items-center justify-between">
            <Badge tone="muted">{PRODUCT.attribution.ffmpeg.license}</Badge>
            <Button size="sm" variant="ghost" onClick={() => window.open(PRODUCT.attribution.ffmpeg.url)}>
              Visit project <ExternalLink size={12} />
            </Button>
          </div>
        </Row>
      </Group>

      <div className="text-center text-[11px] text-fg-faint pt-2 pb-4">
        {PRODUCT.name} v{runtimeVersion} · {PRODUCT.copyright}
      </div>
    </div>
  );
};
