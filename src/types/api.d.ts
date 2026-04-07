import type { ApiSurface } from '../../electron/ipc/channels';

declare global {
  interface Window {
    api: ApiSurface;
  }
}

export {};
