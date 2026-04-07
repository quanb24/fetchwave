import { create } from 'zustand';
import type { AppSettings } from '../../electron/domain/settings';

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    const r = await window.api.settings.get();
    if (r.ok) set({ settings: r.data, loading: false });
    else set({ error: r.error.message, loading: false });
  },
  async update(patch) {
    const r = await window.api.settings.update(patch);
    if (r.ok) set({ settings: r.data });
    else set({ error: r.error.message });
  },
}));
