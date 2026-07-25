# Crop + upscale a region of a reference board so fine details can be inspected.
# usage: pwsh tools/crop.ps1 -Src UI/01.jpg -X 60 -Y 40 -W 200 -H 60 -Zoom 6 -Out .tmp/crop.png
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [Parameter(Mandatory = $true)][int]$X,
  [Parameter(Mandatory = $true)][int]$Y,
  [Parameter(Mandatory = $true)][int]$W,
  [Parameter(Mandatory = $true)][int]$H,
  [int]$Zoom = 4,
  [string]$Out = ".tmp/crop.png"
)

Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path $Src).Path
$outPath = Join-Path (Get-Location) $Out
$outDir = Split-Path $outPath -Parent
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$img = [System.Drawing.Image]::FromFile($srcPath)
try {
  $dest = New-Object System.Drawing.Bitmap(($W * $Zoom), ($H * $Zoom))
  $g = [System.Drawing.Graphics]::FromImage($dest)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.DrawImage($img,
    (New-Object System.Drawing.Rectangle(0, 0, ($W * $Zoom), ($H * $Zoom))),
    (New-Object System.Drawing.Rectangle($X, $Y, $W, $H)),
    [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $dest.Dispose()
  "size: $($img.Width)x$($img.Height) -> $outPath"
}
finally { $img.Dispose() }
