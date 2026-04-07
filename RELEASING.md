# Releasing Fetchwave

The complete operator playbook for cutting a release. If you've never done this before, follow it top-to-bottom.

---

## Prerequisites (one-time)

1. You have **push access** to `github.com/fetchwave/fetchwave`.
2. The `GITHUB_TOKEN` secret is automatically present in Actions — no setup required for the workflow itself.
3. (Optional, for signed builds) The following secrets exist in the repo:
   - `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
   - `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`
   Uncomment the matching env blocks in `.github/workflows/release.yml` once they're populated.
4. Locally, you can lint and build: `npm ci && npm run build`.

## Versioning strategy

Fetchwave follows [Semantic Versioning](https://semver.org/).

| Type | When | Example | Channel |
| --- | --- | --- | --- |
| **Patch** | Bug fixes, no behavior change | `1.0.0 → 1.0.1` | `latest` |
| **Minor** | Backward-compatible features | `1.0.0 → 1.1.0` | `latest` |
| **Major** | Breaking changes | `1.0.0 → 2.0.0` | `latest` |
| **Pre-release** | Release candidates | `1.0.0 → 1.0.1-rc.0` | `rc` |

The auto-updater (`electron/services/updater.ts`) reads the **currently installed** version: pre-release users follow the `rc` channel, stable users follow `latest`. They never cross.

## Cutting a release

### 1 · Prep

```bash
git checkout main
git pull
npm ci
npm run lint
npm run build
```

Edit `CHANGELOG.md`: move `[Unreleased]` items into a new `[X.Y.Z] — YYYY-MM-DD` section.
Commit: `git commit -am "chore: changelog for X.Y.Z"`.

### 2 · Bump version + tag

Pick the right script:

```bash
npm run release:patch    # 1.0.0 → 1.0.1
npm run release:minor    # 1.0.0 → 1.1.0
npm run release:major    # 1.0.0 → 2.0.0
npm run release:rc       # 1.0.0 → 1.0.1-rc.0  (or bumps existing rc.N → rc.N+1)
```

Each script runs `npm version`, which:
- updates `package.json` and `package-lock.json`
- creates a commit `vX.Y.Z`
- creates an annotated tag `vX.Y.Z`
- pushes the commit and the tag

### 3 · Watch the workflow

The tag push fires `.github/workflows/release.yml`. Two jobs run in parallel:

| Job | Runner | Output |
| --- | --- | --- |
| `macos-14` | Apple Silicon | `Fetchwave-X.Y.Z-mac-arm64.dmg/zip` + `Fetchwave-X.Y.Z-mac-x64.dmg/zip` + `latest-mac.yml` |
| `windows-latest` | Windows Server | `Fetchwave-X.Y.Z-win-x64.exe` + `latest.yml` |

Each job:
1. Checks out the tag
2. Verifies `package.json` version matches the tag (fails the build if not)
3. Runs `scripts/fetch-binaries.{sh,ps1}` to download yt-dlp + ffmpeg + ffprobe into `resources/bin/<os>/<arch>/`
4. Builds the renderer + main process
5. Runs `electron-builder --publish always` — this packages **and** uploads to the matching GitHub Release in one shot

### 4 · Verify the GitHub Release

Open https://github.com/fetchwave/fetchwave/releases. Confirm:

- A draft (or published) release exists for your tag
- All artifacts are present (see § 7 of `RELEASE_CHECKLIST.md`)
- Pre-releases (`-rc`, `-beta`) are flagged "This is a pre-release"
- Edit the release notes from the matching `CHANGELOG.md` section
- Click **Publish release** (only if it's still a draft)

### 5 · Smoke-test the update flow

This is the only test that proves the new release actually delivers itself to users. **Do not skip it.**

1. Install the **previous** Fetchwave version on a clean machine (or a fresh user account)
2. Launch it
3. Within ~3 seconds the in-app banner shows the new version
4. Wait for `Downloading → Ready`
5. Click **Restart & install** in Settings → Updates
6. App relaunches on the new version — verify in Settings → About

If anything is off, see the troubleshooting table in `README.md` and the `[updater]` lines in the exported log.

## Updating the app (end-user side)

Users do nothing. The app:
- checks ~3 s after launch
- downloads in the background
- shows a banner when ready
- waits for the user to click **Restart & install**

If the user dismisses the prompt, electron-updater will install on the next quit (`autoInstallOnAppQuit: true`).

## Manual / hotfix release without a tag

```bash
# Local one-shot publish — requires GH_TOKEN in your environment
export GH_TOKEN=ghp_...
npm run publish:mac     # or publish:win, on the matching host
```

This is the escape hatch for hotfixes when CI is broken. Use sparingly.

## Yanking a bad release

1. **Unpublish** the release on GitHub (or mark it as draft)
2. Delete the `latest.yml` / `latest-mac.yml` / `rc*.yml` from a remaining release that should now be the newest — electron-updater picks the highest-version yml across **published** releases
3. Tag a new patch with the fix and run the normal flow

Never delete a tag that's already been published — it confuses installed clients holding a `.blockmap` reference.

## Channel summary

| Installed version | Channel watched | Will receive |
| --- | --- | --- |
| `1.0.0` | `latest` | `1.0.1`, `1.1.0`, `2.0.0` … |
| `1.0.1-rc.0` | `rc` | `1.0.1-rc.1`, `1.0.1-rc.2`, `1.0.1` (stable upgrades from rc) |
| `2.0.0-rc.0` | `rc` | `2.0.0-rc.1`, `2.0.0` |

Stable users **never** see RCs unless they manually install one.
