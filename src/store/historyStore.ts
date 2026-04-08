import { create } from 'zustand';
import type { HistoryEntry } from '../../electron/domain/media';
import type { DownloadJob } from '../../electron/domain/job';

interface HistoryState {
  entries: HistoryEntry[];
  recordIfCompleted: (j: DownloadJob) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'ytdlp-gui:history';

function load(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}
function save(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 500)));
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: load(),
  recordIfCompleted(j) {
    if (j.status !== 'completed' || !j.outputFile) return;
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
    save(next);
    set({ entries: next });
  },
  clear() {
    save([]);
    set({ entries: [] });
  },
}));
