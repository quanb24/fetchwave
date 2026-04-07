import { create } from 'zustand';

/**
 * Cross-screen UI state. Currently just a "settings dirty" flag so the
 * sidebar / app shell can warn before navigating away from unsaved changes.
 */
interface UiState {
  settingsDirty: boolean;
  setSettingsDirty: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  settingsDirty: false,
  setSettingsDirty: (v) => set({ settingsDirty: v }),
}));
