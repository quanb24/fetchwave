# Fetchwave Brand Assets

This directory holds all binary brand assets and is referenced by `electron-builder` as the build resources directory (see `package.json` → `build.directories.buildResources`).

## Required files

| File | Purpose | Status |
| --- | --- | --- |
| `icon.icns` | macOS app bundle icon | **placeholder — replace before public release** |
| `icon.ico` | Windows installer + executable icon | **placeholder — replace before public release** |
| `icon.png` | Linux + electron-builder source (1024×1024 PNG) | **placeholder — replace before public release** |

When generating real icons, source from a single 1024×1024 PNG and export with `electron-icon-builder` or equivalent. See `BRANDING.md` at the repo root for visual direction.

## Screenshots

`screenshots/` holds the marketing screenshots referenced by the README. Capture them following the guidance in `BRANDING.md`:

- 1280 × 820 logical, 2× retina
- macOS dark mode
- Real public-domain content only
- Naming: `home.png`, `queue.png`, `format.png`, `settings.png`

## Why are placeholders OK in source control?

The build will reference these paths even if the files do not exist yet. `electron-builder` will fall back to a default Electron icon — fine for internal builds, **not OK for public releases**. The release checklist (`RELEASE_CHECKLIST.md` § 5) gates public release on these files being present.
