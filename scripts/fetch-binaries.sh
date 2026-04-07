#!/usr/bin/env bash
# Fetch bundled binaries for Fetchwave.
# Run from the repo root. Requires: curl, unzip, tar.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/resources/bin"

YTDLP_URL_MAC="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
YTDLP_URL_LINUX="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"

FFMPEG_MAC_ARM64="https://www.osxexperts.net/ffmpeg71arm.zip"
FFMPEG_MAC_X64="https://www.osxexperts.net/ffmpeg71intel.zip"
FFPROBE_MAC_ARM64="https://www.osxexperts.net/ffprobe71arm.zip"
FFPROBE_MAC_X64="https://www.osxexperts.net/ffprobe71intel.zip"
FFMPEG_LINUX_X64="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"

fetch() {
  local url="$1" out="$2"
  echo "→ $out"
  mkdir -p "$(dirname "$out")"
  curl -fsSL "$url" -o "$out"
}

unzip_one() {
  local zip="$1" member="$2" dest="$3"
  mkdir -p "$(dirname "$dest")"
  unzip -p "$zip" "$member" > "$dest"
  chmod +x "$dest"
}

case "$(uname -s)" in
  Darwin)
    echo "=== macOS ==="
    for arch in arm64 x64; do
      fetch "$YTDLP_URL_MAC" "$BIN/mac/$arch/yt-dlp"
      chmod +x "$BIN/mac/$arch/yt-dlp"
      # Ad-hoc codesign so macOS lets a non-signed Electron host spawn it.
      # Without this, PyInstaller-built yt-dlp hangs on bootstrap when launched
      # from inside a .app bundle and times out.
      codesign --sign - --force "$BIN/mac/$arch/yt-dlp" 2>/dev/null || true
    done

    TMP=$(mktemp -d)
    fetch "$FFMPEG_MAC_ARM64" "$TMP/ff-arm.zip"
    unzip_one "$TMP/ff-arm.zip" "ffmpeg" "$BIN/mac/arm64/ffmpeg"
    fetch "$FFPROBE_MAC_ARM64" "$TMP/fp-arm.zip"
    unzip_one "$TMP/fp-arm.zip" "ffprobe" "$BIN/mac/arm64/ffprobe"

    fetch "$FFMPEG_MAC_X64" "$TMP/ff-x64.zip"
    unzip_one "$TMP/ff-x64.zip" "ffmpeg" "$BIN/mac/x64/ffmpeg"
    fetch "$FFPROBE_MAC_X64" "$TMP/fp-x64.zip"
    unzip_one "$TMP/fp-x64.zip" "ffprobe" "$BIN/mac/x64/ffprobe"

    # Ad-hoc sign all macOS binaries
    for arch in arm64 x64; do
      for bin in yt-dlp ffmpeg ffprobe; do
        codesign --sign - --force "$BIN/mac/$arch/$bin" 2>/dev/null || true
      done
    done

    rm -rf "$TMP"
    ;;
  Linux)
    echo "=== Linux x64 ==="
    fetch "$YTDLP_URL_LINUX" "$BIN/linux/x64/yt-dlp"
    chmod +x "$BIN/linux/x64/yt-dlp"

    TMP=$(mktemp -d)
    fetch "$FFMPEG_LINUX_X64" "$TMP/ffmpeg.tar.xz"
    tar -xJf "$TMP/ffmpeg.tar.xz" -C "$TMP"
    DIR=$(find "$TMP" -maxdepth 1 -type d -name "ffmpeg-*")
    cp "$DIR/ffmpeg"  "$BIN/linux/x64/ffmpeg"
    cp "$DIR/ffprobe" "$BIN/linux/x64/ffprobe"
    chmod +x "$BIN/linux/x64/ffmpeg" "$BIN/linux/x64/ffprobe"
    rm -rf "$TMP"
    ;;
  *)
    echo "Unsupported host OS for this script. Use scripts/fetch-binaries.ps1 on Windows."
    exit 1
    ;;
esac

echo
echo "✓ Binaries fetched into $BIN"
