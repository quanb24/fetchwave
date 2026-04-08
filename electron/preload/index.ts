import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../ipc/channels';
import type { ApiSurface } from '../ipc/channels';

const api: ApiSurface = {
  detect: () => ipcRenderer.invoke(IPC.ytdlpDetect),
  analyze: (req) => ipcRenderer.invoke(IPC.ytdlpAnalyze, req),
  diagnostics: () => ipcRenderer.invoke(IPC.diagnosticsRun),
  updater: {
    check: () => ipcRenderer.invoke(IPC.updaterCheck),
    getState: () => ipcRenderer.invoke(IPC.updaterGetState),
    quitAndInstall: () => ipcRenderer.invoke(IPC.updaterQuitAndInstall),
  },
  repair: {
    run: () => ipcRenderer.invoke(IPC.repairRun),
    reset: () => ipcRenderer.invoke(IPC.repairReset),
  },
  logs: {
    getPath: () => ipcRenderer.invoke(IPC.logsGetPath),
    export: () => ipcRenderer.invoke(IPC.logsExport),
    write: (level, tag, msg) => ipcRenderer.invoke(IPC.logsWrite, level, tag, msg),
    reveal: () => ipcRenderer.invoke(IPC.logsReveal),
  },
  queue: {
    add: (req) => ipcRenderer.invoke(IPC.queueAdd, req),
    list: () => ipcRenderer.invoke(IPC.queueList),
    cancel: (id) => ipcRenderer.invoke(IPC.queueCancel, id),
    remove: (id) => ipcRenderer.invoke(IPC.queueRemove, id),
    pause: (id) => ipcRenderer.invoke(IPC.queuePause, id),
    resume: (id) => ipcRenderer.invoke(IPC.queueResume, id),
    clearCompleted: () => ipcRenderer.invoke(IPC.queueClearCompleted),
    setPriority: (id, priority) => ipcRenderer.invoke(IPC.queueSetPriority, id, priority),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch) => ipcRenderer.invoke(IPC.settingsUpdate, patch),
  },
  system: {
    pickFolder: () => ipcRenderer.invoke(IPC.systemPickFolder),
    pickFile: () => ipcRenderer.invoke(IPC.systemPickFile),
    readClipboard: () => ipcRenderer.invoke(IPC.systemReadClipboard),
    revealFile: (p) => ipcRenderer.invoke(IPC.systemRevealFile, p),
    openFile: (p) => ipcRenderer.invoke(IPC.systemOpenFile, p),
    getVersion: () => ipcRenderer.invoke(IPC.systemGetVersion),
    restart: () => ipcRenderer.invoke(IPC.systemRestart),
  },
  on: {
    jobUpdated: (cb) => {
      const h = (_: unknown, j: any) => cb(j);
      ipcRenderer.on(IPC.evtJobUpdated, h);
      return () => ipcRenderer.removeListener(IPC.evtJobUpdated, h);
    },
    jobAdded: (cb) => {
      const h = (_: unknown, j: any) => cb(j);
      ipcRenderer.on(IPC.evtJobAdded, h);
      return () => ipcRenderer.removeListener(IPC.evtJobAdded, h);
    },
    jobRemoved: (cb) => {
      const h = (_: unknown, id: string) => cb(id);
      ipcRenderer.on(IPC.evtJobRemoved, h);
      return () => ipcRenderer.removeListener(IPC.evtJobRemoved, h);
    },
    updateState: (cb) => {
      const h = (_: unknown, s: any) => cb(s);
      ipcRenderer.on(IPC.evtUpdateState, h);
      return () => ipcRenderer.removeListener(IPC.evtUpdateState, h);
    },
    repairProgress: (cb) => {
      const h = (_: unknown, p: any) => cb(p);
      ipcRenderer.on(IPC.evtRepairProgress, h);
      return () => ipcRenderer.removeListener(IPC.evtRepairProgress, h);
    },
  },
};

contextBridge.exposeInMainWorld('api', api);
