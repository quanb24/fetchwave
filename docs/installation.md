# Installation

Fetchwave runs on macOS and Windows. It ships as a self-contained installer — you don't need to install Python, yt-dlp, ffmpeg, or anything else. Everything is bundled inside the app.

---

## Prerequisites

- **macOS 11+** (Big Sur or later) — Apple Silicon or Intel
- **Windows 10 or 11** — 64-bit (x64)
- An internet connection (to download videos)

That's it. No other software is required.

---

## Step 1: Download

Go to the **[Releases page](https://github.com/quanb24/fetchwave/releases/latest)** and download the file that matches your computer:

| Your computer | File to download |
|---|---|
| **Windows 10 / 11** | `Fetchwave-x.x.x-win-x64.exe` |
| **Mac with Apple Silicon** (M1, M2, M3, M4) | `Fetchwave-x.x.x-mac-arm64.dmg` |
| **Mac with Intel chip** | `Fetchwave-x.x.x-mac-x64.dmg` |

> **Not sure which Mac you have?** Click the Apple logo in the top-left corner of your screen → **About This Mac**. If it mentions "Apple M1" (or M2, M3, M4), download the **arm64** file. If it says "Intel", download the **x64** file.

---

## Step 2: Install

### On macOS

1. Open the downloaded `.dmg` file
2. Drag **Fetchwave** into your **Applications** folder
3. Open Applications and **right-click** Fetchwave → click **Open**
4. A dialog will appear saying the app is from an unidentified developer — click **Open**

> You only need to right-click → Open the first time. After that, Fetchwave opens normally like any other app. This warning appears because the app is not yet notarized with Apple — it is safe and open source.

### On Windows

1. Double-click the downloaded `.exe` file
2. If Windows shows **"Windows protected your PC"**, click **More info** → **Run anyway**
3. The NSIS installer will open — choose your install location (the default is fine) and click **Install**
4. After installation, Fetchwave will appear on your desktop and in the Start Menu

> The SmartScreen warning appears because the app is not code-signed. This is normal for open-source desktop apps. The warning only appears once during installation.

---

## Step 3: First launch

When you open Fetchwave for the first time, a Welcome screen will check that the bundled tools (yt-dlp, ffmpeg, ffprobe) are working correctly. All three should show a green **OK** status. Click **Get started** to continue.

If any tool shows a red status, click **Repair runtime** — Fetchwave will re-download the necessary files automatically.

---

## Updates

Fetchwave checks for updates automatically a few seconds after each launch. When an update is ready, the **Restart Fetchwave** button in the sidebar will pulse blue and change to **Restart & install update**. Click it, and the update is applied instantly.

You can also check manually in **Settings → Updates → Check now**.

---

## Uninstall

### macOS

1. Open **Applications** in Finder
2. Drag **Fetchwave** to the Trash
3. Optionally, delete app data at `~/Library/Application Support/Fetchwave/`

### Windows

1. Open **Settings → Apps → Installed apps**
2. Find **Fetchwave** and click **Uninstall**
3. Optionally, delete app data at `%APPDATA%\Fetchwave\`
