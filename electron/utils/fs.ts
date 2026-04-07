import fs from 'node:fs';
import path from 'node:path';
import { AppError } from '../domain/errors';

export function ensureDir(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    throw new AppError('FS_ERROR', `Cannot create directory: ${dir}`, { detail: String(e) });
  }
}

export function uniquePath(target: string): string {
  if (!fs.existsSync(target)) return target;
  const ext = path.extname(target);
  const base = target.slice(0, target.length - ext.length);
  let i = 1;
  while (fs.existsSync(`${base} (${i})${ext}`)) i++;
  return `${base} (${i})${ext}`;
}

export function isLikelyIncomplete(file: string): boolean {
  return file.endsWith('.part') || file.endsWith('.ytdl');
}
