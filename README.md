<div align="center">

# Fetchwave

### A premium desktop downloader for the open web.

Save videos, playlists, and music from your favorite sites — without ever touching a terminal.

**[⬇ Download for Mac or Windows](https://github.com/quanb24/fetchwave/releases)**

[![Release](https://github.com/quanb24/fetchwave/actions/workflows/release.yml/badge.svg)](https://github.com/quanb24/fetchwave/actions/workflows/release.yml)
[![CI](https://github.com/quanb24/fetchwave/actions/workflows/ci.yml/badge.svg)](https://github.com/quanb24/fetchwave/actions/workflows/ci.yml)

</div>

---

## What it is

Fetchwave is a beautiful, calm desktop app for saving video and audio from the open web. You paste a link, click a button, and the file lands in your downloads folder. That's it.

It's built on the best video downloader in existence ([yt-dlp](https://github.com/yt-dlp/yt-dlp)) but wraps it in an interface that anyone can use. No commands. No Python. No setup. Just install the app and start downloading.

Whether you want a 4K music video, an entire playlist, or just the audio as an MP3 — Fetchwave handles it in three clicks.

---

## Key features

- **Works out of the box.** Install the app and you're ready. Nothing else to download or configure.
- **Real 4K downloads.** Get videos in their original 2160p quality, automatically merged into a clean MP4 file.
- **Audio extraction.** Convert any video to MP3 with one click.
- **Playlists.** Drop in a playlist link and Fetchwave queues every video for you.
- **Smart queue.** Pause, resume, cancel, and prioritize downloads. Your queue survives app restarts.
- **Format picker.** Choose exact resolution, container, or audio-only — or let Fetchwave pick the best.
- **Self-healing.** If something breaks, Fetchwave fixes itself with one click.
- **Auto-updates.** New versions install themselves in the background.
- **Calm, dark interface.** Designed to feel premium, not cluttered.
- **Your files stay yours.** Everything runs locally on your computer. No accounts, no cloud, no tracking.

---

## Screenshots

| | |
|---|---|
| ![Home screen](assets/screenshots/home.png) | ![Active downloads queue](assets/screenshots/queue.png) |
| **Home** — paste a link, pick a quality | **Queue** — watch your downloads in real time |
| ![Format selection modal](assets/screenshots/format.png) | ![Settings and runtime status](assets/screenshots/settings.png) |
| **Format picker** — choose exactly what you want | **Settings** — everything in one place |

---

## Download

**👉 [Get the latest version here](https://github.com/quanb24/fetchwave/releases/latest)**

Pick the file that matches your computer:

| Your computer | File to download |
|---|---|
| **Windows 10 or 11** | `Fetchwave-x.x.x-win-x64.exe` |
| **Mac with Apple Silicon** *(M1, M2, M3, M4)* | `Fetchwave-x.x.x-mac-arm64.dmg` |
| **Mac with Intel chip** | `Fetchwave-x.x.x-mac-x64.dmg` |

> **Not sure which Mac you have?** Click the Apple logo in the top-left of your screen → **About This Mac**. If it says "Apple M1, M2, M3, or M4" anywhere, choose the **arm64** file. If it says "Intel", choose the **x64** file.

---

## How it works

Three clicks. That's the entire app.

#### 1. Paste a link
Copy any video URL from your browser and paste it into Fetchwave.

#### 2. (Optional) Pick a format
Click **Choose format** if you want a specific resolution or audio-only. Otherwise just hit **Download** for the default.

#### 3. Download
The file lands in your downloads folder when it's done. Click **Open file** to play it, or **Show in Finder** to find it.

---

## A real example

Let's say you want to save a music video as an MP3:

1. Open the music video in your browser and copy the link
2. Open Fetchwave
3. Click the **Audio only** quality preset on the home screen
4. Paste the link and click **Download**
5. A few seconds later, your `.mp3` is in `~/Downloads/Fetchwave/`

Want the full 4K video instead? Click **Choose format**, pick **2160p**, then **Add to queue**. Same idea.

---

## First launch

Because Fetchwave is a brand-new independent app, your computer hasn't seen it before and will show a small one-time warning the first time you open it. This is normal — every new app gets this until it's been around long enough.

**On macOS:**
1. Drag Fetchwave from the DMG into your **Applications** folder
2. Open your Applications folder and **right-click** Fetchwave → **Open**
3. Click **Open** in the dialog that appears

You only do this once. From then on, Fetchwave opens like any other app.

**On Windows:**
1. Double-click the `.exe` installer
2. If you see *"Windows protected your PC"*, click **More info** → **Run anyway**
3. Click through the installer (Next → Install → Finish)

You only do this once. From then on, Fetchwave opens from your Start menu.

---

## Updates

Fetchwave checks for new versions a few seconds after launch and downloads them quietly in the background. When an update is ready, you'll see a small notification at the top of the app — click **Restart & install** and you're done.

You can also check manually anytime in **Settings → Updates**.

---

## Support

Something not working? Found a bug? Have an idea?

**[Open an issue on GitHub →](https://github.com/quanb24/fetchwave/issues)**

For technical issues, Fetchwave keeps a detailed log of everything that happens. Open **Settings → Logs → Export logs** and attach the file to your issue — that gives us everything we need to help you.

---

## For developers

If you want to build Fetchwave from source or contribute, here's the quick start.

### Requirements
- Node.js 20 or newer
- macOS, Windows, or Linux

### Setup
```bash
git clone https://github.com/quanb24/fetchwave.git
cd fetchwave
npm install
./scripts/fetch-binaries.sh        # macOS / Linux
.\scripts\fetch-binaries.ps1       # Windows PowerShell
npm run dev
```

### Build & release
```bash
npm run build              # type-check + build everything
npm run package:mac        # build a macOS .dmg locally
npm run package:win        # build a Windows .exe locally (must run on Windows)

npm run release:patch      # 1.0.0 → 1.0.1, push tag, CI ships installers
npm run release:rc         # cut a release candidate (rc channel)
```

Pushing a `vX.Y.Z` tag automatically triggers GitHub Actions, which builds Mac and Windows installers in parallel and publishes them to the [Releases](https://github.com/quanb24/fetchwave/releases) page.

### Architecture
```
electron/   Main process — window, IPC, queue, yt-dlp orchestration
src/        Renderer — React + TypeScript UI
resources/  Bundled binaries (yt-dlp, ffmpeg, ffprobe) per platform
assets/     Icons and screenshots
```

Built with **Electron**, **React**, **TypeScript**, **Vite**, **Tailwind**, and **Zustand**.

---

## Credits

Fetchwave is a polished interface around two extraordinary open-source projects:

- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — the engine that makes downloading possible. Fetchwave bundles and orchestrates yt-dlp; we are not affiliated with the yt-dlp project.
- **[FFmpeg](https://ffmpeg.org)** — used to merge video and audio streams into clean output files.

Huge thanks to the maintainers of both. Without them, Fetchwave would not exist.

---

## License

MIT — see [LICENSE](./LICENSE).

The bundled `yt-dlp` and `ffmpeg` binaries retain their original licenses (Unlicense and LGPL/GPL respectively).

---

<div align="center">

## ✨ One last thing

Fetchwave is meant to feel **simple and safe**. If you ever feel lost or stuck, the answer is almost always **Settings → Self-heal → Repair runtime**. That single button fixes most things.

If Fetchwave makes your life a little easier, **[give it a star on GitHub ⭐](https://github.com/quanb24/fetchwave)** — it genuinely helps the project grow.

**[⬇ Download Fetchwave](https://github.com/quanb24/fetchwave/releases/latest)** · **[Report an issue](https://github.com/quanb24/fetchwave/issues)** · **[Star on GitHub](https://github.com/quanb24/fetchwave)**

</div>
