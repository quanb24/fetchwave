<div align="center">

# Fetchwave

**A premium desktop downloader for the open web.**

Fast, modern, and built on yt-dlp.

[Website](https://fetchwave.app) · [Releases](https://github.com/fetchwave/fetchwave/releases) · [Issues](https://github.com/fetchwave/fetchwave/issues) · [Releasing →](./RELEASING.md)

[![CI](https://github.com/fetchwave/fetchwave/actions/workflows/ci.yml/badge.svg)](https://github.com/fetchwave/fetchwave/actions/workflows/ci.yml)
[![Release](https://github.com/fetchwave/fetchwave/actions/workflows/release.yml/badge.svg)](https://github.com/fetchwave/fetchwave/actions/workflows/release.yml)

</div>

---

## What is Fetchwave?

Fetchwave turns the power of [yt-dlp](https://github.com/yt-dlp/yt-dlp) into a calm, beautiful desktop experience. It's built for people who want professional-grade downloads — playlists, formats, retries, queues — without ever touching a terminal.

Think of it as a polished shell around the most powerful video downloader in the world.

## Screenshots

> Screenshots will be added before the public release.

| Home | Queue | Format Picker |
| --- | --- | --- |
| `assets/screenshots/home.png` | `assets/screenshots/queue.png` | `assets/screenshots/format.png` |

## Features

- **Premium UI** — dark, minimal, card-based, designed like a paid utility
- **Smart queue** — concurrency control, priorities, pause / resume / cancel, persistent across restarts
- **Playlists** — automatic expansion into parent + child jobs with grouped progress
- **Format picker** — clean modal for resolution, container, audio-only
- **Retries** — exponential backoff with structured error classification
- **Resume support** — `.part` continuation, partial-file aware
- **Subtitles** — write or embed, multi-language
- **Network** — proxy, cookies, rate limit
- **Desktop-grade** — secure IPC, sandboxed renderer, single-instance lock, native window chrome

## Requirements

**For end users: nothing.** Fetchwave ships with its own copies of yt-dlp, ffmpeg, and ffprobe. Download the installer, run it, paste a link. No Python, no Node, no PATH setup.

**For developers building from source:**

- **Node.js** 18+
- A one-time run of `scripts/fetch-binaries.sh` (macOS/Linux) or `scripts/fetch-binaries.ps1` (Windows) to populate `resources/bin/<os>/<arch>/` with the binaries that get bundled into packaged builds.

## Install (end users)

Download the latest installer from the [Releases page](https://github.com/fetchwave/fetchwave/releases):

| Platform | Artifact |
| --- | --- |
| macOS (Apple Silicon / Intel) | `Fetchwave-<version>-mac-arm64.dmg` / `-x64.dmg` |
| Windows 10/11 | `Fetchwave-<version>-win-x64.exe` |
| Linux | `Fetchwave-<version>-linux-x64.AppImage` / `.deb` |

## Develop

```bash
git clone https://github.com/fetchwave/fetchwave
cd fetchwave
npm install
npm run dev
```

This launches Vite + Electron with hot reload.

## Package

Before packaging, fetch the bundled binaries for the target platform (one-time per machine):

```bash
./scripts/fetch-binaries.sh     # macOS / Linux
./scripts/fetch-binaries.ps1    # Windows (PowerShell)
```

Then:

```bash
npm run package           # current OS
npm run package:mac       # macOS dmg + zip (arm64 + x64)
npm run package:win       # Windows nsis installer + portable
npm run package:linux     # AppImage + deb
```

Output lands in `release/`.

### How bundling works

`electron-builder` copies `resources/bin/<os>/<arch>/` into the packaged app's `process.resourcesPath/bin/<os>/<arch>/` via `extraResources`. At runtime, `electron/services/runtimePaths.ts` resolves binary paths based on `app.isPackaged`, `process.platform`, and `process.arch`. Settings default to the sentinel value `'bundled'`, which the resolver translates into the real path. Advanced users can override with an absolute path in Settings → Advanced binary overrides.

See [`resources/README.md`](./resources/README.md) for the binary layout and sources.

> Code signing and notarization are not configured by default. Set up `electron-builder` `mac.identity`, `win.certificateFile`, and the relevant environment variables before producing public artifacts.

## Architecture

```
electron/
  main/        Electron main process, window, IPC wiring, persistence
  preload/     contextBridge surface (window.api)
  services/    yt-dlp execution, queue, arg builder, progress parser
  domain/      typed models (DownloadJob, MediaInfo, AppSettings, AppError)
  ipc/         IPC channel constants + ApiSurface contract
  config/      product identity + defaults
  utils/       fs, ids
src/
  screens/     Home, Queue, History, Settings
  components/  Sidebar, TopBar, primitives, ui/* (Card, Badge, Modal, Toast, Toggle)
  store/       Zustand stores (queue, settings, history)
  config/      product identity (renderer mirror)
assets/        icons, screenshots, brand assets
```

### Security model

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`
- All IPC goes through a typed `contextBridge` surface
- yt-dlp is spawned with `shell: false` and an argv array — no string concatenation
- URLs validated against a strict regex before spawn
- CSP set in `index.html`
- External links open in the system browser

## Self-maintenance

Fetchwave is designed to take care of itself.

### Auto updates

Configured via `electron-updater` against this repo's GitHub Releases. On launch (3 s after the window opens) Fetchwave checks for a newer release. If one exists it downloads in the background, shows a banner with progress, and waits for you to click **Restart & install** in Settings → Updates. You can disable the automatic check or trigger one manually from the same panel.

### Self-heal (Repair Runtime)

If the bundled `yt-dlp` ever stops working — corrupt download, antivirus quarantine, an upstream site change that needs the latest yt-dlp — open **Settings → Self-heal** and click **Repair runtime**. Fetchwave downloads a fresh `yt-dlp` from the official GitHub release into your user data folder (`runtime/bin/<os>/<arch>/`) and re-runs diagnostics. The repair layer is checked first by the runtime resolver, so the freshly downloaded binary takes precedence over the one in the app bundle without modifying the (potentially read-only) app package.

### Logs

Fetchwave writes a rolling log via `electron-log`:

| Platform | Path |
| --- | --- |
| macOS | `~/Library/Logs/Fetchwave/main.log` |
| Windows | `%USERPROFILE%\AppData\Roaming\Fetchwave\logs\main.log` |
| Linux | `~/.config/Fetchwave/logs/main.log` |

Click **Settings → Logs → Export logs** to save a snapshot to disk for support.

### First-launch experience

The first time Fetchwave runs, you see a welcome screen that verifies the bundled runtime, offers a one-click repair if anything's off, and drops you into the Home screen. The flag is stored in settings (`firstLaunchCompleted`) so it never appears again — unless you reset settings.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Bundled runtime issue" toast on launch | Open Settings → Self-heal → Repair runtime |
| Downloads fail with "format not available" on a site that worked yesterday | Run Repair runtime to pick up the latest yt-dlp |
| Updates never download | Check Settings → Updates status; check the log file (`Export logs`) for `[updater]` entries |
| App crashes to a fallback screen | Click **Reload window**; if it persists, click **Export logs** and file an issue |
| Antivirus flagged `yt-dlp.exe` | Common false positive on Windows; whitelist Fetchwave's install folder or run Repair runtime to fetch a fresh binary into your user data folder |
| Custom yt-dlp/ffmpeg path | Settings → Advanced binary overrides — set an absolute path, or click "Reset all to bundled" to revert |

## Project status

**Release candidate** — `1.0.0-rc.1`

The core experience is complete. We're hardening packaging, shipping icons, and collecting feedback before tagging `1.0.0`.

## Roadmap

- Code signing + notarization for macOS and Windows
- In-app yt-dlp auto-update
- System tray + global hotkey
- Per-job log drawer
- Light theme
- Localization

## Known limitations

- yt-dlp has no native pause; "pause" cancels the process and "resume" re-runs with `--continue`
- Code signing/notarization not configured out of the box
- Light theme is a placeholder — dark only for now
- Tests are not yet wired into CI

## Attribution

Fetchwave is built on top of these excellent open-source projects:

- [**yt-dlp**](https://github.com/yt-dlp/yt-dlp) — the engine that makes downloading possible. Fetchwave is not affiliated with the yt-dlp project.
- [**FFmpeg**](https://ffmpeg.org) — used to mux audio and video streams.

## Support

- **Bugs / feature requests:** [github.com/fetchwave/fetchwave/issues](https://github.com/fetchwave/fetchwave/issues)
- **Docs:** see this README and the in-app Settings → Support section

## License

MIT — see [LICENSE](./LICENSE).
