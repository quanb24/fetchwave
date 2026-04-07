# Bundled Runtime Binaries

Fetchwave ships **self-contained** on Windows and macOS. The end user does not install yt-dlp, ffmpeg, ffprobe, Python, or Node — they download the app and run it.

This directory holds the binaries that get copied into each packaged build. `electron-builder` is configured (in `package.json` → `build.extraResources`) to copy `resources/bin/<os>/<arch>` into `process.resourcesPath/bin/<os>/<arch>` for that build's target platform and architecture.

## Layout

```
resources/bin/
├── win/
│   └── x64/
│       ├── yt-dlp.exe
│       ├── ffmpeg.exe
│       └── ffprobe.exe
├── mac/
│   ├── arm64/
│   │   ├── yt-dlp
│   │   ├── ffmpeg
│   │   └── ffprobe
│   └── x64/
│       ├── yt-dlp
│       ├── ffmpeg
│       └── ffprobe
└── linux/
    └── x64/
        ├── yt-dlp
        ├── ffmpeg
        └── ffprobe
```

The runtime resolver lives in `electron/services/runtimePaths.ts` and is the **only** place that knows about this layout.

## Where to get the binaries

### yt-dlp (single-file builds — no Python required)

- **Windows x64:** https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
- **macOS:** https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos
  Rename to `yt-dlp` and place under both `mac/arm64/` and `mac/x64/` (the macOS build is universal).
- **Linux x64:** https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux

### ffmpeg + ffprobe (static builds)

- **Windows x64:** https://www.gyan.dev/ffmpeg/builds/ — "release essentials" zip → extract `ffmpeg.exe` and `ffprobe.exe`
- **macOS arm64:** https://evermeet.cx/ffmpeg/ → download `ffmpeg` and `ffprobe` (separate downloads)
- **macOS x64:** same source, x86_64 builds
- **Linux x64:** https://johnvansickle.com/ffmpeg/ → static build, extract `ffmpeg` and `ffprobe`

## Permissions

On macOS and Linux the binaries must be executable (`chmod +x`). The fetch scripts handle this. The runtime resolver also calls `chmod 0755` defensively on first launch in case file modes were lost during packaging.

## Automated fetch

Run **once** before your first packaged build, and any time you want to bump versions:

```bash
# macOS / Linux
./scripts/fetch-binaries.sh

# Windows (PowerShell)
./scripts/fetch-binaries.ps1
```

## Why this directory is .gitignored

Binaries are large and platform-specific. Each developer / CI runner pulls them locally before packaging. See `.gitignore`.

If you are publishing a release, your CI job must run the fetch script for the matching `${os}/${arch}` before invoking `electron-builder`.
