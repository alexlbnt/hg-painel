# Gera os ícones PNG do PWA a partir de assets/images/hg-logo.jpg (usa System.Drawing, nativo do Windows).
# Uso (na raiz do projeto): powershell -ExecutionPolicy Bypass -File scripts/generatePwaIcons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'assets/images/hg-logo.jpg'
$outDir = Join-Path $root 'public/icons'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$img = [System.Drawing.Image]::FromFile($src)
# Fundo usado nas margens do ícone "maskable" (mesmo preto do logo)
$bg = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)

function New-Icon([int]$size, [double]$logoScale, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'
  $g.Clear($bg)
  $d = [int]($size * $logoScale)
  $o = [int](($size - $d) / 2)
  $g.DrawImage($img, $o, $o, $d, $d)
  $g.Dispose()
  $bmp.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "ok $name ($size x $size)"
}

New-Icon 192 1.0 'icon-192.png'
New-Icon 512 1.0 'icon-512.png'
# Maskable: o conteúdo fica dentro da "zona segura" (80% central) para não ser cortado pelo formato do SO
New-Icon 512 0.78 'icon-maskable-512.png'
# iOS ignora transparência e arredonda sozinho
New-Icon 180 1.0 'apple-touch-icon.png'

$img.Dispose()
