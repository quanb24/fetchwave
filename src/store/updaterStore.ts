import { create } from 'zustand';
import type { UpdateState } from '../../electron/services/updater';

interface S {
  state: UpdateState;
  bind: () => () => void;
  check: () => Promise<void>;
  install: () => Promise<void>;
  setState: (s: UpdateState) => void;
}

export const useUpdaterStore = create<S>((set) => ({
  state: { phase: 'idle' },
  bind() {
    return window.api.on.updateState((s) => set({ state: s }));
  },
  async check() {
    const r = await window.api.updater.check();
    if (r.ok) set({ state: r.data });
  },
  async install() {
    await window.api.updater.quitAndInstall();
  },
  setState(s) { set({ state: s }); },
}));
