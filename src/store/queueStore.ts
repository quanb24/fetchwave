import { create } from 'zustand';
import type { DownloadJob, JobPriority } from '../../electron/domain/job';

interface QueueState {
  jobs: Record<string, DownloadJob>;
  order: string[];
  error: string | null;
  bind: () => () => void;
  refresh: () => Promise<void>;
  add: (url: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  resume: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  setPriority: (id: string, p: JobPriority) => Promise<void>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  jobs: {},
  order: [],
  error: null,

  bind() {
    const offAdded = window.api.on.jobAdded((j) => {
      set((s) => ({
        jobs: { ...s.jobs, [j.id]: j },
        order: s.order.includes(j.id) ? s.order : [...s.order, j.id],
      }));
    });
    const offUpdated = window.api.on.jobUpdated((j) => {
      set((s) => ({ jobs: { ...s.jobs, [j.id]: j } }));
    });
    const offRemoved = window.api.on.jobRemoved((id) => {
      set((s) => {
        const { [id]: _removed, ...rest } = s.jobs;
        void _removed;
        return { jobs: rest, order: s.order.filter((x) => x !== id) };
      });
    });
    return () => { offAdded(); offUpdated(); offRemoved(); };
  },

  async refresh() {
    const r = await window.api.queue.list();
    if (r.ok) {
      const jobs: Record<string, DownloadJob> = {};
      const order: string[] = [];
      for (const j of r.data) { jobs[j.id] = j; order.push(j.id); }
      set({ jobs, order });
    } else set({ error: r.error.message });
  },

  async add(url) {
    const r = await window.api.queue.add({ url });
    if (!r.ok) set({ error: r.error.message });
  },
  async cancel(id) { await window.api.queue.cancel(id); },
  async remove(id) { await window.api.queue.remove(id); },
  async pause(id) { await window.api.queue.pause(id); },
  async resume(id) { await window.api.queue.resume(id); },
  async clearCompleted() { await window.api.queue.clearCompleted(); await get().refresh(); },
  async setPriority(id, p) { await window.api.queue.setPriority(id, p); },
}));
