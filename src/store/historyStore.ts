import { create } from 'zustand';
import type { HistoryEntry } from '../../electron/domain/media';
import type { DownloadJob } from '../../electron/domain/job';

interface HistoryState {
  entries: HistoryEntry[];
  /** IDs the user explicitly removed — prevents re-recording from queue. */
  dismissed: Set<string>;
  recordIfCompleted: (j: DownloadJob) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'ytdlp-gui:history';
const DISMISSED_KEY = 'ytdlp-gui:history:dismissed';

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}
function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}
function save(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 500)));
}
function saveDismissed(dismissed: Set<string>) {
  // Only keep the last 1000 dismissed IDs to avoid unbounded growth.
  const arr = [...dismissed].slice(-1000);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: load(),
  dismissed: loadDismissed(),
  recordIfCompleted(j) {
    if (j.status !== 'completed' || !j.outputFile) return;
    if (get().dismissed.has(j.id)) return;
    if (get().entries.some((e) => e.id === j.id)) return;
    const entry: HistoryEntry = {
      id: j.id,
      url: j.url,
      title: j.title ?? j.outputFile.split(/[\\/]/).pop() ?? j.url,
      outputFile: j.outputFile,
      finishedAt: j.finishedAt ?? Date.now(),
      bytes: j.progress.totalBytes,
    };
    const next = [entry, ...get().entries];
    save(next);
    set({ entries: next });
  },
  remove(id) {
    const next = get().entries.filter((e) => e.id !== id);
    const dismissed = new Set(get().dismissed).add(id);
    save(next);
    saveDismissed(dismissed);
    set({ entries: next, dismissed });
  },
  clear() {
    const allIds = get().entries.map((e) => e.id);
    const dismissed = new Set([...get().dismissed, ...allIds]);
    save([]);
    saveDismissed(dismissed);
    set({ entries: [], dismissed });
  },
}));
