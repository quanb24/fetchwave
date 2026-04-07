import React, { useEffect, useState } from 'react';
import { Sidebar, type ScreenKey } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomeScreen } from './screens/HomeScreen';
import { QueueScreen } from './screens/QueueScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { useQueueStore } from './store/queueStore';
import { useSettingsStore } from './store/settingsStore';
import { useUpdaterStore } from './store/updaterStore';
import { useDiagnosticsStore } from './store/diagnosticsStore';
import { useUiStore } from './store/uiStore';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdateBanner } from './components/UpdateBanner';
import { log } from './lib/log';

const titles: Record<ScreenKey, { title: string; subtitle: string }> = {
  home:     { title: 'Home',     subtitle: 'Add a new download' },
  queue:    { title: 'Queue',    subtitle: 'Active and pending downloads' },
  history:  { title: 'History',  subtitle: 'Past downloads' },
  settings: { title: 'Settings', subtitle: 'App configuration' },
};

const shortcutMap: Record<string, ScreenKey> = {
  '1': 'home', '2': 'queue', '3': 'history',
};

const AppInner: React.FC = () => {
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [ytdlp, setYtdlp] = useState<{ available: boolean; version: string | null }>({ available: false, version: null });
  const [welcomeDone, setWelcomeDone] = useState(false);

  const bindQueue = useQueueStore((s) => s.bind);
  const refreshQueue = useQueueStore((s) => s.refresh);
  const queueOrder = useQueueStore((s) => s.order);
  const jobs = useQueueStore((s) => s.jobs);
  const settings = useSettingsStore((s) => s.settings);
  const loadSettings = useSettingsStore((s) => s.load);
  const refreshDiag = useDiagnosticsStore((s) => s.refresh);
  const settingsDirty = useUiStore((s) => s.settingsDirty);
  const bindUpdater = useUpdaterStore((s) => s.bind);
  const updateState = useUpdaterStore((s) => s.state);
  const toast = useToast();

  // Run startup tasks exactly once. Toast / store function refs are intentionally
  // NOT in the deps array — including them caused an infinite re-run loop that
  // spammed the diagnostics toast.
  const startedRef = React.useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    log.info('app', 'Renderer mounted, starting boot sequence');
    void loadSettings().then(() => log.info('app', 'Settings loaded'));
    void refreshQueue().then(() => log.info('app', 'Queue refreshed'));
    void refreshDiag().then(() => log.info('app', 'Diagnostics refreshed'));
    const unbindQueue = bindQueue();
    const unbindUpdater = bindUpdater();

    void window.api.detect().then((r) => {
      if (r.ok) {
        log.info('app', `yt-dlp detect → available=${r.data.available} version=${r.data.version ?? 'n/a'}`);
        setYtdlp({ available: r.data.available, version: r.data.version });
      } else {
        log.error('app', `yt-dlp detect failed: ${r.error.message}`);
      }
    });

    void window.api.diagnostics().then((r) => {
      if (!r.ok) {
        log.error('app', `Diagnostics call failed: ${r.error.message}`);
        return;
      }
      log.info('app', `Diagnostics → healthy=${r.data.healthy}`);
      for (const b of r.data.binaries) {
        log.info('app', `  ${b.name} [${b.source}] ${b.status} ${b.version ?? ''} @ ${b.path}`);
      }
      if (r.data.healthy) return;
      const broken = r.data.binaries.filter((b) => b.name !== 'ffprobe' && b.status !== 'ok');
      // Single, dismissible toast — never re-fired within this session.
      toast.error(
        'Bundled runtime issue',
        broken.length
          ? `${broken.map((b) => b.name).join(', ')} failed to start. Open Settings → Self-heal.`
          : 'Some bundled tools failed to launch. Open Settings → Self-heal.',
      );
    });

    return () => { unbindQueue(); unbindUpdater(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Status transitions to fire toasts
  const seenStatusRef = React.useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const offAdded = window.api.on.jobAdded((j) => {
      if (!j.isPlaylistParent) toast.info('Added to queue', j.title ?? j.url);
      seenStatusRef.current.set(j.id, j.status);
    });
    const offUpdated = window.api.on.jobUpdated((j) => {
      const prev = seenStatusRef.current.get(j.id);
      seenStatusRef.current.set(j.id, j.status);
      if (prev === j.status) return;
      if (j.status === 'running' && prev !== 'running') {
        toast.info('Download started', j.title ?? j.url);
      } else if (j.status === 'completed') {
        toast.success('Download complete', j.title ?? j.outputFile ?? '');
      } else if (j.status === 'failed' && j.error) {
        toast.error('Download failed', j.error.message);
      }
    });
    const offRemoved = window.api.on.jobRemoved((id) => {
      seenStatusRef.current.delete(id);
    });
    return () => { offAdded(); offUpdated(); offRemoved(); };
  }, [toast]);

  // Toast on update lifecycle
  useEffect(() => {
    if (updateState.phase === 'ready') {
      toast.success(`Update ${updateState.version} ready`, 'Open Settings → Updates to restart and install.');
    } else if (updateState.phase === 'available') {
      toast.info(`Update ${updateState.version} available`, 'Downloading in the background…');
    }
  }, [updateState.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
  useEffect(() => {
    const tryNav = (next: ScreenKey) => {
      if (screen === 'settings' && useUiStore.getState().settingsDirty && next !== 'settings') {
        const ok = window.confirm('You have unsaved settings changes.\n\nLeave this page anyway? Your edits will be lost.');
        if (!ok) return;
      }
      setScreen(next);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === ',') { e.preventDefault(); tryNav('settings'); return; }
      const target = shortcutMap[e.key];
      if (target) { e.preventDefault(); tryNav(target); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  // First-launch gate
  if (settings && !settings.firstLaunchCompleted && !welcomeDone) {
    return <WelcomeScreen onDone={() => setWelcomeDone(true)} />;
  }

  const activeCount = queueOrder
    .map((id) => jobs[id])
    .filter((j) => j && (j.status === 'queued' || j.status === 'running' || j.status === 'paused')).length;

  const t = titles[screen];

  return (
    <div className="flex h-full">
      <Sidebar
        current={screen}
        onChange={(next) => {
          if (screen === 'settings' && settingsDirty && next !== 'settings') {
            const ok = window.confirm(
              'You have unsaved settings changes.\n\nLeave this page anyway? Your edits will be lost.',
            );
            if (!ok) return;
          }
          setScreen(next);
        }}
        queueCount={activeCount}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={t.title} subtitle={t.subtitle} ytdlpStatus={ytdlp} />
        <UpdateBanner />
        <main className="flex-1 overflow-y-auto">
          {screen === 'home' && <HomeScreen />}
          {screen === 'queue' && <QueueScreen />}
          {screen === 'history' && <HistoryScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  </ErrorBoundary>
);

export default App;
