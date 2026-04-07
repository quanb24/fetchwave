import { create } from 'zustand';
import type { DiagnosticsReport } from '../../electron/services/diagnostics';

interface DiagState {
  report: DiagnosticsReport | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDiagnosticsStore = create<DiagState>((set) => ({
  report: null,
  loading: false,
  error: null,
  async refresh() {
    set({ loading: true, error: null });
    const r = await window.api.diagnostics();
    if (r.ok) set({ report: r.data, loading: false });
    else set({ error: r.error.message, loading: false });
  },
}));
