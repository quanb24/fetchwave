# Fetchwave — Brand Guide

This document is the source of truth for Fetchwave's visual and verbal identity. Anyone touching marketing surfaces, screenshots, the app icon, or the website should read this first.

---

## Product

| Field | Value |
| --- | --- |
| **Name** | Fetchwave |
| **Tagline** | A premium desktop downloader for the open web. |
| **Category** | Pro desktop utility |
| **App ID** | `app.fetchwave.desktop` |
| **Channel** | release-candidate |

## Voice

- **Calm, confident, technical.** We are not loud. We do not exclaim.
- **Pro tool, not a toy.** No emojis in product copy. No "awesome", no "🎉".
- **Direct.** Short sentences. Verbs first.
- **Respectful of the upstream.** yt-dlp is the engine; we are the cabin.

### Do
- "Add a URL to start your first download."
- "Resume continues from where the file left off."
- "Built on yt-dlp."

### Don't
- "🚀 Supercharge your downloads!"
- "The world's #1 video downloader app!"
- "We use yt-dlp under the hood (don't worry about it)."

## Color direction

Dark-first, deep-charcoal canvas with a single cool blue accent. No multi-color rainbow palettes.

| Token | Hex | Usage |
| --- | --- | --- |
| `bg.DEFAULT` | `#0a0b0f` | App background |
| `bg.soft` | `#0f1117` | Sidebar, top bar |
| `bg.card` | `#14161e` | Cards |
| `bg.elevated` | `#181b24` | Modals, hover states |
| `bg.border` | `#1f232e` | Hairlines |
| `fg.DEFAULT` | `#e6e8ee` | Primary text |
| `fg.muted` | `#8a91a3` | Secondary text |
| `fg.dim` | `#5b6275` | Tertiary text |
| `accent.DEFAULT` | `#6e8bff` | Single brand accent |
| `success` | `#22c55e` | Completed states |
| `warn` | `#f59e0b` | Paused / retry states |
| `danger` | `#ef4444` | Failed states |

The accent gradient `from-accent to-accent-hover` (`#6e8bff → #8aa3ff`) is reserved for the logo glyph and primary CTAs only.

## Typography

- **Display + UI:** system stack — `-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif`
- **Mono:** `SF Mono, JetBrains Mono, Menlo, monospace` — only for technical metadata (file IDs, percentages, speeds, ETAs)

Hierarchy:
- Screen titles: 15 px, semibold
- Section headers: 13 px, semibold
- Body: 13 px, regular
- Helper text: 11 px, muted
- Metadata: 11 px, mono

## Logo concept

A single rounded square (`rounded-2xl`, ~25% radius) with the accent gradient and a white **F** glyph centered. The shape evokes a wave catching a swell — speed, stability, and momentum without literalism.

For the favicon and small sizes, the **F** glyph alone on the gradient is enough. No outlines, no drop shadows.

## Icon direction

The actual binary icons live under `assets/`. Until a designer ships final assets, the placeholder is the in-app gradient F square. When commissioning the real icon:

- Single mark, no wordmark
- 1024×1024 source PNG, exported to `.icns` (macOS), `.ico` (Windows), `.png` (Linux)
- macOS: respect Apple's HIG icon grid and rounded square mask
- Windows: provide multi-resolution `.ico` with 16/24/32/48/64/128/256
- Linux: 512×512 PNG minimum

Required files in `assets/`:
- `icon.icns` — macOS bundle icon
- `icon.ico` — Windows installer + executable
- `icon.png` — Linux + electron-builder source

## Screenshots

Captured on macOS at 1280 × 820 logical pixels (the default window size), exported at 2× retina, saved as PNG under `assets/screenshots/`. Naming:

- `home.png`
- `queue.png`
- `format.png`
- `settings.png`

Screenshot guidance:
- Use real, well-known public videos (e.g. Big Buck Bunny, official Apple keynotes) — never copyrighted personal content
- Show the queue with **at least one running job** and one completed
- Show the format modal with the audio-only toggle off and 1080p selected
- Crop window chrome consistently — no desktop wallpaper bleed

## Naming consistency

Always:
- **Fetchwave** (one word, capital F)
- Never: "fetch wave", "FetchWave", "fetchwaveapp", "Fetchwave Desktop"
- File / package name: `fetchwave` (lowercase)
- App ID: `app.fetchwave.desktop`
- Window title: `Fetchwave`

## Positioning

> Fetchwave turns the power of yt-dlp into a calm, beautiful desktop experience. It's built for people who want professional-grade downloads — playlists, formats, retries, queues — without ever touching a terminal.

Use this paragraph (or a trimmed version) on the website hero, the GitHub README, the macOS App Store description if/when applicable, and any press copy.
