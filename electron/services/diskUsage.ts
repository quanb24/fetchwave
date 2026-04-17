import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface DiskUsage {
  path: string;
  total: number;
  free: number;
  used: number;
}

async function firstExistingAncestor(p: string): Promise<string | null> {
  let target = path.resolve(p);
  for (let i = 0; i < 40; i++) {
    try {
      await fs.access(target);
      return target;
    } catch {
      const parent = path.dirname(target);
      if (parent === target) return null;
      target = parent;
    }
  }
  return null;
}

export async function getDiskUsage(inputPath: string): Promise<DiskUsage | null> {
  if (!inputPath) return null;
  const target = await firstExistingAncestor(inputPath);
  if (!target) return null;
  try {
    const s = await fs.statfs(target);
    const bsize = Number(s.bsize);
    const total = Number(s.blocks) * bsize;
    const free = Number(s.bavail) * bsize;
    if (!Number.isFinite(total) || total <= 0) return null;
    return {
      path: target,
      total,
      free: Math.max(0, Math.min(total, free)),
      used: Math.max(0, total - Math.max(0, Math.min(total, free))),
    };
  } catch {
    return null;
  }
}
