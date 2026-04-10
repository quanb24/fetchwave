# Troubleshooting & FAQ

Solutions to common issues and answers to frequently asked questions.

---

## Common issues

### "Windows protected your PC" warning on install

This is Windows SmartScreen. It appears because Fetchwave is not code-signed (an annual fee the project hasn't purchased yet). The app is open source and safe.

**Fix:** Click **More info** → **Run anyway**.

---

### macOS says the app is from an "unidentified developer"

This is macOS Gatekeeper. It appears because the app is not notarized with Apple.

**Fix:** Right-click Fetchwave in your Applications folder → click **Open** → click **Open** in the dialog. You only need to do this once.

---

### Downloads fail or no video is found

This usually means yt-dlp needs to be updated. Websites change their format regularly, and yt-dlp releases updates to keep up.

**Fix:**
1. Go to **Settings → Updates → Check now** — install any available Fetchwave update
2. If no update is available, go to **Settings → Self-heal → Repair runtime** — this re-downloads the latest yt-dlp

---

### "yt-dlp not found" or "ffmpeg missing" on the Welcome screen

The bundled binaries didn't extract properly. This can happen on first launch or after a bad update.

**Fix:** Click **Repair runtime** on the Welcome screen. If that doesn't work:
1. Close Fetchwave
2. Reinstall from the [latest release](https://github.com/quanb24/fetchwave/releases/latest)

---

### Download starts but produces a corrupt or unplayable file

This usually means ffmpeg failed during the merge step (combining separate video and audio streams into one file).

**Fix:**
1. Go to **Settings → Self-heal → Repair runtime**
2. Try the download again
3. If it still fails, try a different container format (e.g. MKV instead of MP4)

---

### App opens but shows a blank white screen

This is rare and usually caused by a GPU rendering issue in Electron.

**Fix:**
1. Close and reopen Fetchwave
2. If it persists, try launching from the terminal with `--disable-gpu` flag
3. As a last resort, reinstall from the [latest release](https://github.com/quanb24/fetchwave/releases/latest)

---

### Restart button closes the app but it doesn't reopen (Windows)

This happened in older versions when the app was running from a temporary directory (e.g. launched directly from the installer's "Run after install" checkbox). It was fixed in v1.0.0-rc.9+.

**Fix:** Make sure you're running the installed version from the desktop shortcut or Start Menu, not from the temp extraction. If you installed recently and still see this, update to the latest version.

---

### Audio-only download produces `.webm` instead of `.mp3`

This happened in versions before rc.3 when the audio-only flag wasn't properly forwarded.

**Fix:** Update to the latest version. The current version produces real `.mp3` output when Audio Only is selected.

---

### Recent downloads reappear after I clear them

This was a bug in versions before rc.5 where the queue's recording effect would re-add entries that were removed from history.

**Fix:** Update to the latest version. This is fixed.

---

## FAQ

### What sites does Fetchwave support?

Fetchwave uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) under the hood, which supports thousands of sites including YouTube, Vimeo, Twitter/X, Reddit, TikTok, SoundCloud, Bandcamp, and many more. See the [full list of supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).

### Is Fetchwave free?

Yes. Fetchwave is free and open source under the MIT license.

### Does Fetchwave collect any data?

No. Fetchwave runs entirely on your computer. There are no accounts, no analytics, no telemetry, and no cloud services. The only network requests are: (1) downloading the video you asked for, and (2) checking for app updates from GitHub.

### Where are my downloaded files?

By default, in a folder called `Fetchwave` inside your Downloads directory:
- **macOS:** `~/Downloads/Fetchwave/`
- **Windows:** `C:\Users\<you>\Downloads\Fetchwave\`

You can change this in **Settings → Downloads → Download folder**.

### Can I download entire playlists?

Yes. Paste a playlist URL and Fetchwave will automatically expand it into individual downloads. Each video gets its own entry in the queue.

### Can I download private or age-restricted videos?

For age-restricted videos on YouTube, you may need to provide a cookies file. Export your browser cookies using a browser extension (such as "Get cookies.txt"), then set the path in **Settings → Network → Cookies file**.

### How do I get the audio only?

Two ways:
1. Click the **Audio** preset on the Home screen before downloading
2. Click **Choose format** → toggle **Audio Only** → confirm

Both produce an `.mp3` file.

### Can I change the download quality?

Yes. Either:
- Click a quality preset on the Home screen (Best, 1080p, 720p, Audio)
- Click **Choose format** for granular control over resolution and container

You can also set a default quality in **Settings → Downloads → Default quality**.

### How do I update Fetchwave?

Fetchwave updates itself automatically. When an update is ready, the **Restart Fetchwave** button in the sidebar pulses blue and changes to **Restart & install update**. Click it.

You can also check manually: **Settings → Updates → Check now**.

### The log file — where is it and when should I share it?

The log file records every action, download, and error. Share it when reporting a bug — it gives the developer everything needed to diagnose the problem.

- **macOS:** `~/Library/Logs/Fetchwave/main.log`
- **Windows:** `C:\Users\<you>\AppData\Roaming\Fetchwave\logs\main.log`

Or use **Settings → Logs → Export logs** to save a copy to your desktop.

### I found a bug. How do I report it?

Go to the [Issues page](https://github.com/quanb24/fetchwave/issues) and click **New issue**. The bug report template will guide you through what to include (version, OS, steps to reproduce, log file).
