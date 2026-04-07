import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { DownloadJob } from '../domain/job';

const FILE = () => path.join(app.getPath('userData'), 'queue.json');

export function loadQueue(): DownloadJob[] {
  try {
    const file = FILE();
    if (!fs.existsSync(file)) return [];
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw as DownloadJob[];
  } catch {
    return [];
  }
}

let writeTimer: NodeJS.Timeout | null = null;
let pending: DownloadJob[] | null = null;

export function saveQueue(jobs: DownloadJob[]): void {
  pending = jobs;
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    const toWrite = pending;
    writeTimer = null;
    pending = null;
    if (!toWrite) return;
    try {
      const file = FILE();
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(toWrite, null, 2), 'utf8');
    } catch { /* non-fatal */ }
  }, 300);
}
