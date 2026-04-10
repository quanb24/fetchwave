# User Guide

This guide covers everything you can do with Fetchwave after it's installed.

---

## Overview

Fetchwave is a desktop app for downloading video and audio from the web. You paste a URL, choose a format, and click download. The app handles everything else — finding the best streams, merging video and audio, converting to MP3, managing a download queue, and keeping itself updated.

Under the hood, Fetchwave uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) (a powerful command-line downloader) and [FFmpeg](https://ffmpeg.org) (an audio/video processing tool). Both are bundled inside the app — you don't need to install or configure them separately.

---

## Who this is for

- **Anyone** who wants to save a video or song from the web without using a terminal
- **People who value simplicity** — Fetchwave does one thing well
- **Users on macOS or Windows** who want a native desktop experience

You do not need any technical knowledge to use Fetchwave.

---

## Downloading a video

1. Copy a video URL from your browser (YouTube, Vimeo, or [hundreds of other sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md))
2. Open Fetchwave
3. Paste the URL into the input field on the Home screen
4. Click **Download**

The video downloads at the best available quality and saves to your downloads folder. When it's done, click the file in History to open it.

---

## Choosing a format

If you want a specific resolution or format instead of the default:

1. Paste your URL
2. Click the **Choose format** button (instead of the quick Download button)
3. The Format Modal opens — here you can:
   - Pick a resolution: **2160p**, **1440p**, **1080p**, **720p**, **480p**
   - Pick a container: **MP4**, **MKV**, **WebM**
   - Toggle **Audio Only** to extract just the audio as MP3
4. Click **Add to queue**

---

## Downloading audio only (MP3)

1. Paste a URL
2. Either:
   - Click the **Audio** preset on the Home screen, or
   - Click **Choose format** → toggle **Audio Only** on
3. Click **Download**

The output file will be a real `.mp3` file.

---

## The download queue

Fetchwave can handle multiple downloads at once.

- **Queue screen** shows all active, pending, and completed downloads
- Downloads run in parallel (default: 2 at a time, configurable in Settings)
- You can **pause**, **resume**, **cancel**, or **remove** any download
- Failed downloads retry automatically (default: 3 retries)
- Your queue survives app restarts — unfinished downloads resume where they left off

---

## Playlists

If you paste a playlist URL, Fetchwave detects it and expands it into individual downloads automatically. Each video gets its own queue entry.

You can turn this off in **Settings → Downloads → Expand playlists**.

---

## History

The **History** screen shows your completed downloads. For each entry you can:

- **Open the file** — plays it in your default media player
- **Show in folder** — opens the containing folder in Finder / File Explorer
- **Remove** — removes the entry from history (does not delete the file)

---

## Settings

Open Settings from the sidebar (or press **⌘ ,** on Mac / **Ctrl + ,** on Windows).

### Downloads

| Setting | What it does | Default |
|---------|-------------|---------|
| Download folder | Where files are saved | `~/Downloads/Fetchwave` |
| Preferred container | Output format when merging streams | `mp4` |
| Default quality | Quality used by the quick Download button | `1080p` |
| Concurrent downloads | How many downloads run at the same time | `2` |
| Rate limit | Maximum bandwidth per download (KB/s, 0 = unlimited) | Unlimited |
| On filename collision | What happens when a file already exists | Rename with suffix |
| Expand playlists | Automatically split playlists into individual jobs | On |

### Subtitles

| Setting | What it does | Default |
|---------|-------------|---------|
| Download subtitle files | Save `.vtt` / `.srt` files alongside the video | Off |
| Embed subtitles | Mux subtitles directly into the video container | Off |
| Languages | Comma-separated language codes (e.g. `en,es,ja`) | `en` |

### Retries

| Setting | What it does | Default |
|---------|-------------|---------|
| Max retries per job | How many times a failed download retries | `3` |
| Retry base delay | Starting delay before retrying (ms) | `2000` |

### Network

| Setting | What it does | Default |
|---------|-------------|---------|
| Proxy URL | HTTP/SOCKS proxy for all downloads | None |
| Cookies file | Netscape-format cookies for authenticated downloads | None |

### Appearance

| Setting | What it does | Default |
|---------|-------------|---------|
| Theme | Dark, Light, or System | Dark |
| Advanced mode | Shows extra format pickers and raw yt-dlp options | Off |

### Updates

| Setting | What it does | Default |
|---------|-------------|---------|
| Check for updates automatically | Runs a check shortly after each launch | On |

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **⌘1** / **Ctrl+1** | Go to Home |
| **⌘2** / **Ctrl+2** | Go to Queue |
| **⌘3** / **Ctrl+3** | Go to History |
| **⌘,** / **Ctrl+,** | Go to Settings |
| **⌘V** / **Ctrl+V** | Paste URL (when Home screen input is focused) |
| **⌘Enter** / **Ctrl+Enter** | Start download |

---

## Best practices

1. **Use the default settings.** They work well for most people. Only change things if you have a specific need.
2. **Keep auto-updates on.** Fetchwave and the underlying yt-dlp tool evolve quickly. Updates fix site compatibility and bugs.
3. **If something breaks, use Self-heal.** Go to **Settings → Self-heal → Repair runtime**. This re-downloads yt-dlp and usually fixes the problem.
4. **Export logs before reporting a bug.** Go to **Settings → Logs → Export logs** and attach the file to your GitHub issue. This gives the developer everything needed to diagnose the problem.
5. **Don't change binary paths unless you know what you're doing.** The "Advanced binary overrides" section in Settings lets you point to custom yt-dlp/ffmpeg installs, but the bundled versions work out of the box.

---

## Where files are stored

| What | Location |
|------|----------|
| Downloaded files | `~/Downloads/Fetchwave/` (default, changeable in Settings) |
| App settings | macOS: `~/Library/Application Support/Fetchwave/config.json` |
| | Windows: `%APPDATA%\Fetchwave\config.json` |
| Log file | macOS: `~/Library/Logs/Fetchwave/main.log` |
| | Windows: `%APPDATA%\Fetchwave\logs\main.log` |
