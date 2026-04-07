import { z } from 'zod';

export const QualityPresetSchema = z.enum(['best', '2160p', '1440p', '1080p', '720p', '480p', 'audio-only']);
export type QualityPreset = z.infer<typeof QualityPresetSchema>;

export const ContainerSchema = z.enum(['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'opus', 'auto']);
export type Container = z.infer<typeof ContainerSchema>;

export const ThemeSchema = z.enum(['dark', 'light', 'system']);
export type Theme = z.infer<typeof ThemeSchema>;

export const CollisionStrategySchema = z.enum(['rename', 'overwrite', 'skip']);
export type CollisionStrategy = z.infer<typeof CollisionStrategySchema>;

export const AppSettingsSchema = z.object({
  downloadPath: z.string().min(1),
  preferredContainer: ContainerSchema.default('mp4'),
  qualityDefault: QualityPresetSchema.default('1080p'),
  embedSubtitles: z.boolean().default(false),
  writeSubtitles: z.boolean().default(false),
  subtitleLanguages: z.array(z.string()).default(['en']),
  cookiesPath: z.string().nullable().default(null),
  proxy: z.string().nullable().default(null),
  rateLimitKbps: z.number().int().nonnegative().nullable().default(null),
  concurrency: z.number().int().min(1).max(16).default(2),
  ytdlpPath: z.string().default('bundled'),
  ffmpegPath: z.string().default('bundled'),
  ffprobePath: z.string().default('bundled'),
  theme: ThemeSchema.default('dark'),
  advancedMode: z.boolean().default(false),
  collisionStrategy: CollisionStrategySchema.default('rename'),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryBaseDelayMs: z.number().int().min(100).max(60_000).default(2000),
  expandPlaylists: z.boolean().default(true),
  firstLaunchCompleted: z.boolean().default(false),
  autoCheckForUpdates: z.boolean().default(true),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
