# Fetchwave Release Checklist

Run this checklist before tagging any public release.

---

## 1 · Pre-flight

- [ ] `package.json` `version` matches the intended tag
- [ ] `CHANGELOG.md` has an entry for this version
- [ ] `electron/config/product.ts` and `src/config/product.ts` `version` match `package.json`
- [ ] `git status` is clean on the release branch
- [ ] All dependencies installed: `npm ci`

## 2 · Bundled runtime verification

- [ ] `./scripts/fetch-binaries.sh` (or `.ps1`) ran successfully for the target platform
- [ ] `resources/bin/<os>/<arch>/` contains `yt-dlp`(.exe), `ffmpeg`(.exe), `ffprobe`(.exe)
- [ ] On macOS/Linux, the binaries have the executable bit set
- [ ] Running each binary manually with `--version` / `-version` reports a sane version string
- [ ] Packaged app's `Resources/bin/<os>/<arch>/` exists after `npm run package` (inspect the `.app` bundle or NSIS install dir)

## 3 · Build verification

- [ ] `npm run lint` passes (no TS errors)
- [ ] `npm run build:main` produces `dist-electron/`
- [ ] `npm run build:renderer` produces `dist/`
- [ ] No console errors when launching `npm run dev`
- [ ] Production build launches: `npm run package` then run the artifact

## 3 · Platform smoke tests

Run on each target platform with a real yt-dlp + ffmpeg installation.

### macOS
- [ ] `npm run package:mac` produces `.dmg` and `.zip` artifacts (arm64 + x64)
- [ ] DMG mounts and the app drags into `/Applications`
- [ ] App launches without Gatekeeper warning (signed builds only)
- [ ] Window chrome respects `hiddenInset` traffic lights
- [ ] Dark menu bar / system theme respected

### Windows
- [ ] `npm run package:win` produces `.exe` (NSIS) and portable `.exe`
- [ ] NSIS installer completes a per-user install
- [ ] Start Menu and desktop shortcuts created
- [ ] Uninstaller removes the app cleanly

### Linux
- [ ] `npm run package:linux` produces `.AppImage` and `.deb`
- [ ] AppImage launches with `chmod +x ./Fetchwave-*.AppImage`
- [ ] `.deb` installs cleanly: `sudo dpkg -i Fetchwave-*.deb`

## 4 · Functional smoke tests

Walk through the app on a fresh user profile.

- [ ] **Bundled runtime status** — Settings → Runtime status shows yt-dlp, ffmpeg, ffprobe all OK with `bundled` source
- [ ] **Test on a clean user account** with no yt-dlp / ffmpeg installed system-wide — the app still works
- [ ] **Re-check button** in Runtime status refreshes correctly
- [ ] **Reset to bundled** restores defaults and clears any user override
- [ ] **Simulated corruption** — temporarily rename one bundled binary inside the installed app, relaunch, confirm: clear in-app error toast + Runtime status shows `Missing` with a friendly message
- [ ] **yt-dlp detection** — Top bar shows green `yt-dlp <version>` badge
- [ ] **ffmpeg detection** — A merged-format download succeeds (e.g. 1080p mp4)
- [ ] **Audio extraction** — `audio-only` preset produces an `.mp3`/`.m4a`
- [ ] **Settings persistence** — Change download folder, restart app, value persists
- [ ] **Quick download** — Paste a URL, hit ↵, file lands in the configured folder
- [ ] **Format modal** — `Choose format` opens, audio-only toggle works, resolution buttons reflect actual formats, "Add to queue" enqueues with the selected format
- [ ] **Queue persistence** — Add a job, quit app mid-download, relaunch — job appears as queued
- [ ] **Playlist expansion** — Add a small playlist, parent + children appear, expand/collapse works, parent progress aggregates
- [ ] **Pause / resume** — Pause a running job, resume continues from `.part`
- [ ] **Cancel** — Cancel a running job, status flips to cancelled
- [ ] **Retry on network failure** — Disable network mid-download, observe retry countdown badge, re-enable network, job recovers
- [ ] **Failed download** — Use an invalid URL, error toast appears, error code visible on the card
- [ ] **History** — Completed downloads appear in History with file path and date
- [ ] **Toasts** — Added / Started / Completed / Failed all fire correctly without duplicates
- [ ] **Keyboard shortcuts** — ⌘1/⌘2/⌘3/⌘, navigation, ⌘V paste in input, ⌘↵ analyze, ↵ download

## 5 · Brand & metadata verification

- [ ] App window title reads "Fetchwave"
- [ ] Sidebar shows correct logo glyph + product name
- [ ] Sidebar footer shows correct version + channel
- [ ] Settings → About card shows correct version, tagline, copyright
- [ ] Settings → Support links open in the system browser
- [ ] `assets/icon.icns`, `assets/icon.ico`, `assets/icon.png` exist and render correctly in the dock / taskbar
- [ ] Installer artifact filename matches `Fetchwave-<version>-<os>-<arch>.<ext>`

## 6 · Documentation

- [ ] `README.md` screenshots updated under `assets/screenshots/`
- [ ] `README.md` install table reflects the actual artifact names
- [ ] `CHANGELOG.md` finalized for this version
- [ ] `RELEASE_CHECKLIST.md` reviewed (this file)
- [ ] `BRANDING.md` reflects current visual direction

## 6.5 · Maturity systems

- [ ] **First-launch screen** appears on a fresh user data folder, runtime check is shown
- [ ] **Continue button** in welcome screen sets `firstLaunchCompleted` and never reappears on next launch
- [ ] **Repair runtime** in Welcome and Settings re-downloads yt-dlp into `userData/runtime/bin/<os>/<arch>/`
- [ ] After Repair, the runtime resolver picks up the repaired binary (verify path in Settings → Runtime status)
- [ ] **Auto updates** — bump `version` in `package.json`, tag a GitHub pre-release, launch the older app, confirm the update banner appears, downloads, and "Restart & install" works
- [ ] **Manual Check now** in Settings → Updates triggers a check
- [ ] **Update toast** appears when an update is ready
- [ ] **Error boundary** — temporarily throw in a screen component, confirm fallback UI renders with Reload + Export logs
- [ ] **Logs file** exists at the documented path after launch
- [ ] **Export logs** writes a `.log` file to the chosen destination
- [ ] **Logs contain** startup line, diagnostics result, and any download errors

## 7 · Tag & publish

Version bumps go through the npm scripts so `package.json` and the git tag never drift.

- [ ] Working tree clean on `main`
- [ ] `CHANGELOG.md` finalized for this version
- [ ] Run the matching script:
      | Bump | Command |
      | --- | --- |
      | Patch (1.0.0 → 1.0.1) | `npm run release:patch` |
      | Minor (1.0.0 → 1.1.0) | `npm run release:minor` |
      | Major (1.0.0 → 2.0.0) | `npm run release:major` |
      | Pre-release (1.0.0 → 1.0.1-rc.0) | `npm run release:rc` |
- [ ] The tag push triggers `.github/workflows/release.yml`
- [ ] Workflow completes for both `macos-14` and `windows-latest` jobs
- [ ] GitHub Release exists with these assets attached:
  - `Fetchwave-<version>-mac-arm64.dmg` + `.zip` + `.blockmap`
  - `Fetchwave-<version>-mac-x64.dmg` + `.zip` + `.blockmap`
  - `Fetchwave-<version>-win-x64.exe` (NSIS) + `.blockmap`
  - `latest-mac.yml`
  - `latest.yml`
  - For pre-releases: `rc-mac.yml`, `rc.yml`
- [ ] Pre-releases are flagged as "Pre-release" on GitHub
- [ ] Website download links updated (stable releases only)

## 8 · Post-publish update verification

- [ ] Install the **previous** stable build on a clean machine (mac and win)
- [ ] Launch it — within ~3 s, the update banner appears
- [ ] Banner progresses through `Available → Downloading → Ready`
- [ ] Click **Restart & install** in Settings → Updates
- [ ] App relaunches on the new version (verify About card)
- [ ] Logs (`Settings → Logs → Export logs`) contain `[updater] update downloaded` for the new version
- [ ] For an `rc` build: confirm a stable user is **not** offered the `rc` (channel isolation)

---

**Sign-off:** _________ — _________
