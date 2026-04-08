// Renderer mirror of electron/config/product.ts.
// Kept as a separate file so the renderer never imports from electron/* (which
// would pull node-only modules into the bundle).
export const PRODUCT = {
  name: 'Fetchwave',
  shortName: 'Fetchwave',
  tagline: 'A premium desktop downloader for the open web.',
  description:
    'Fetchwave turns the power of yt-dlp into a calm, beautiful desktop experience. Built for people who want professional-grade downloads — playlists, formats, retries, queues — without ever touching a terminal.',
  version: '1.0.0-rc.3',
  channel: 'release-candidate',
  copyright: '© 2026 Fetchwave',
  links: {
    website: 'https://fetchwave.app',
    repo: 'https://github.com/quanb24/fetchwave',
    issues: 'https://github.com/quanb24/fetchwave/issues',
    docs: 'https://github.com/quanb24/fetchwave#readme',
  },
  attribution: {
    ytdlp: {
      name: 'yt-dlp',
      url: 'https://github.com/yt-dlp/yt-dlp',
      license: 'Unlicense',
      note: 'Fetchwave orchestrates yt-dlp as an external process and is not affiliated with the yt-dlp project.',
    },
    ffmpeg: {
      name: 'FFmpeg',
      url: 'https://ffmpeg.org',
      license: 'LGPL/GPL',
      note: 'Used for muxing audio and video streams.',
    },
  },
} as const;
