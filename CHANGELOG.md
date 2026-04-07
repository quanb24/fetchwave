# Changelog

All notable changes to **Fetchwave** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0-rc.1] — 2026-04-07

First public release candidate. The product is feature-complete; the remaining work is packaging, signing, and brand assets.

### Added
- **Product identity** — name, tagline, positioning, brand wiring across the app shell, sidebar, settings, packaging metadata
- **About panel** in Settings with version, channel, copyright, and full description
- **Support & Resources** section linking to website, docs, repo, and issues
- **Acknowledgements** for yt-dlp and FFmpeg with license badges
- **Release packaging config** for macOS (dmg + zip, arm64/x64), Windows (nsis + portable), and Linux (AppImage + deb)
- **Sidebar version + channel footer**
- Top-level docs: `README.md`, `CHANGELOG.md`, `RELEASE_CHECKLIST.md`, `BRANDING.md`, `LICENSE`

### Core capabilities (already shipped in pre-RC builds)
- Secure spawn-based yt-dlp orchestration (argv arrays only, sandboxed renderer, contextIsolation)
- Download queue with concurrency, priorities, pause/resume/cancel, persistence across restarts
- Playlist auto-expansion into parent + child jobs with grouped progress and expand/collapse
- Format picker modal with audio-only, container, and resolution selection
- Exponential-backoff retries with structured error classification (network, rate-limited, geo, age, private, format unavailable, disk full, permission)
- Resume support via `.part` continuation
- Subtitle write/embed with multi-language selection
- Proxy, cookies, rate limit, custom yt-dlp / ffmpeg paths
- Settings persistence with Zod validation
- Toast notifications for added / started / completed / failed
- Premium dark UI: Cards, Badges, Toggles, Modals, Toasts, Skeletons, animated transitions
- Keyboard shortcuts: ⌘1/⌘2/⌘3 navigation, ⌘, settings, ⌘V paste, ⌘↵ analyze, ↵ download

### Known limitations
- yt-dlp has no true pause — "pause" cancels and "resume" re-runs with `--continue`
- Code signing / notarization not yet configured
- Light theme is a placeholder
- No automated test suite in CI

---

## [Unreleased]

### Added
- **Auto updates** via electron-updater + GitHub Releases publish provider
- **First-launch welcome screen** with runtime verification and one-click repair
- **Self-heal: Repair runtime** — re-downloads yt-dlp into a writable user-data layer that the resolver checks before the bundled binary
- **Global React error boundary** with reload + log export
- **File logging** via electron-log; rolling 5 MB log under platform log paths
- **Settings → Updates / Self-heal / Logs** sections
- **Export logs** action

### Planned
- macOS notarization + Windows code signing
- System tray + global hotkey
- Per-job log drawer
