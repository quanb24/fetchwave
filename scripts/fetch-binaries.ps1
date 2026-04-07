# Fetch bundled binaries for Fetchwave on Windows.
# Run from the repo root in PowerShell.
$ErrorActionPreference = "Stop"

$Root = Resolve-Path "$PSScriptRoot\.."
$Bin  = Join-Path $Root "resources\bin\win\x64"
New-Item -ItemType Directory -Force -Path $Bin | Out-Null

$YtDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
# Gyan's "release essentials" build is small and includes ffmpeg + ffprobe.
$FfmpegZipUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

function Fetch($url, $out) {
  Write-Host "→ $out"
  Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
}

Write-Host "=== Fetching yt-dlp ==="
Fetch $YtDlpUrl (Join-Path $Bin "yt-dlp.exe")

Write-Host "=== Fetching ffmpeg + ffprobe ==="
$Tmp = New-Item -ItemType Directory -Force -Path (Join-Path $env:TEMP "fetchwave-bin")
$Zip = Join-Path $Tmp "ffmpeg.zip"
Fetch $FfmpegZipUrl $Zip
Expand-Archive -Path $Zip -DestinationPath $Tmp -Force
$Inner = Get-ChildItem -Path $Tmp -Directory | Where-Object { $_.Name -like "ffmpeg-*-essentials_build" } | Select-Object -First 1
if (-not $Inner) { throw "Could not locate ffmpeg build directory inside the archive." }
Copy-Item (Join-Path $Inner.FullName "bin\ffmpeg.exe")  -Destination (Join-Path $Bin "ffmpeg.exe")  -Force
Copy-Item (Join-Path $Inner.FullName "bin\ffprobe.exe") -Destination (Join-Path $Bin "ffprobe.exe") -Force
Remove-Item -Recurse -Force $Tmp

Write-Host ""
Write-Host "✓ Binaries fetched into $Bin"
