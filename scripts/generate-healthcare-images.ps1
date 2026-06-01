param(
  [string]$OutputDir = "C:\Users\samuelitwaru\Pictures\images"
)

Add-Type -AssemblyName System.Drawing

function New-Brush($hex) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function New-Pen($hex, [float]$width = 4) {
  $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($hex), $width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  return $pen
}

function Fill-RoundRect($g, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $path.Dispose()
}

function Stroke-RoundRect($g, $pen, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.DrawPath($pen, $path)
  $path.Dispose()
}

function Draw-Plus($g, $brush, [int]$cx, [int]$cy, [int]$size) {
  $bar = [int]($size / 3)
  Fill-RoundRect $g $brush ($cx - $bar / 2) ($cy - $size / 2) $bar $size 8
  Fill-RoundRect $g $brush ($cx - $size / 2) ($cy - $bar / 2) $size $bar 8
}

function Draw-Heart($g, $brush, [int]$cx, [int]$cy, [int]$scale) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddBezier($cx, $cy + $scale, $cx - 2 * $scale, $cy - $scale, $cx - $scale, $cy - 2 * $scale, $cx, $cy - $scale)
  $path.AddBezier($cx, $cy - $scale, $cx + $scale, $cy - 2 * $scale, $cx + 2 * $scale, $cy - $scale, $cx, $cy + $scale)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-Stethoscope($g, $pen, $accentBrush) {
  $g.DrawArc($pen, 175, 185, 170, 170, 15, 150)
  $g.DrawLine($pen, 260, 330, 260, 430)
  $g.DrawLine($pen, 260, 430, 365, 430)
  $g.DrawArc($pen, 345, 392, 76, 76, 0, 360)
  $g.FillEllipse($accentBrush, 371, 418, 24, 24)
  $g.FillEllipse($accentBrush, 175, 238, 22, 22)
  $g.FillEllipse($accentBrush, 322, 238, 22, 22)
}

function Draw-Pill($g, [int]$x, [int]$y, [int]$w, [int]$h, $a, $b) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x, $y, $h, $h, 90, 180)
  $path.AddArc($x + $w - $h, $y, $h, $h, 270, 180)
  $path.CloseFigure()
  $g.FillPath($a, $path)
  $clip = New-Object System.Drawing.Region($path)
  $g.SetClip($clip, [System.Drawing.Drawing2D.CombineMode]::Replace)
  $g.FillRectangle($b, $x + $w / 2, $y, $w / 2, $h)
  $g.ResetClip()
  $clip.Dispose()
  $path.Dispose()
}

function Draw-Scene($index, $path) {
  $bmp = New-Object System.Drawing.Bitmap(1024, 1024)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bg = @("#eaf7f3", "#f5eef8", "#edf4ff", "#fff6e8", "#eef8fb", "#f0f8ef", "#f7f2ec", "#eef1ff", "#f7eef0", "#edf7f6")[$index - 1]
  $primary = @("#2f9e8f", "#7c4dff", "#2878d7", "#e88b2d", "#1791a6", "#4f9a3d", "#9b6b43", "#5865c8", "#d84a6a", "#2b9a78")[$index - 1]
  $secondary = @("#f86f61", "#00a6a6", "#54a7ff", "#4e9f70", "#ffb84d", "#e05a73", "#4aa3df", "#f08d49", "#4d9f8c", "#ff7f50")[$index - 1]

  $bgBrush = New-Brush $bg
  $white = New-Brush "#ffffff"
  $ink = New-Brush "#22313f"
  $muted = New-Brush "#6d7d8b"
  $pBrush = New-Brush $primary
  $sBrush = New-Brush $secondary
  $line = New-Pen $primary 12
  $thin = New-Pen "#22313f" 5

  $g.FillRectangle($bgBrush, 0, 0, 1024, 1024)
  Fill-RoundRect $g $white 132 120 760 784 44
  Stroke-RoundRect $g (New-Pen "#d8e7e3" 4) 132 120 760 784 44

  switch ($index) {
    1 {
      Draw-Stethoscope $g $line $sBrush
      Draw-Heart $g $sBrush 645 340 58
      $g.DrawLines((New-Pen "#22313f" 7), @(
        [System.Drawing.Point]::new(520, 555), [System.Drawing.Point]::new(580, 555),
        [System.Drawing.Point]::new(610, 500), [System.Drawing.Point]::new(660, 640),
        [System.Drawing.Point]::new(700, 555), [System.Drawing.Point]::new(760, 555)
      ))
    }
    2 {
      Fill-RoundRect $g $pBrush 275 250 474 520 38
      Fill-RoundRect $g $white 323 298 378 424 24
      Draw-Plus $g $sBrush 512 420 180
      $g.FillEllipse($pBrush, 420, 615, 184, 50)
    }
    3 {
      $g.FillEllipse((New-Brush "#d8f2ef"), 302, 232, 420, 420)
      Draw-Heart $g $pBrush 512 440 115
      Draw-Plus $g $white 512 430 110
      $g.DrawArc((New-Pen $secondary 16), 272, 590, 480, 120, 185, 170)
    }
    4 {
      Draw-Pill $g 245 320 530 190 $pBrush $sBrush
      Draw-Pill $g 355 565 310 110 (New-Brush "#ffffff") (New-Brush "#f1b2bd")
      Stroke-RoundRect $g $thin 355 565 310 110 55
      $g.DrawLine((New-Pen "#ffffff" 8), 510, 328, 510, 500)
    }
    5 {
      Fill-RoundRect $g (New-Brush "#d9f1f5") 268 275 488 350 30
      Stroke-RoundRect $g (New-Pen $primary 8) 268 275 488 350 30
      $g.FillEllipse($sBrush, 420, 360, 184, 184)
      Draw-Plus $g $white 512 452 118
      Fill-RoundRect $g $pBrush 330 650 365 74 18
    }
    6 {
      $g.DrawEllipse((New-Pen $primary 16), 288, 265, 448, 448)
      $g.DrawLine((New-Pen $primary 16), 512, 215, 512, 310)
      $g.DrawLine((New-Pen $primary 16), 512, 710, 512, 805)
      $g.DrawLine((New-Pen $secondary 12), 355, 512, 465, 512)
      $g.DrawLine((New-Pen $secondary 12), 560, 512, 670, 512)
      $g.FillEllipse($pBrush, 456, 456, 112, 112)
    }
    7 {
      Fill-RoundRect $g (New-Brush "#f6dcc9") 330 280 365 430 80
      $g.FillEllipse((New-Brush "#f6dcc9"), 358, 210, 310, 310)
      $g.FillEllipse($ink, 425, 345, 20, 20)
      $g.FillEllipse($ink, 580, 345, 20, 20)
      Fill-RoundRect $g (New-Brush "#aee0e2") 382 420 260 115 28
      Stroke-RoundRect $g (New-Pen "#22313f" 4) 382 420 260 115 28
      Draw-Plus $g $pBrush 512 612 95
    }
    8 {
      Fill-RoundRect $g (New-Brush "#ffffff") 275 250 474 545 30
      Stroke-RoundRect $g (New-Pen $primary 8) 275 250 474 545 30
      Draw-Plus $g $sBrush 512 355 120
      foreach ($y in @(505, 585, 665)) {
        $g.FillEllipse($pBrush, 342, $y, 28, 28)
        Fill-RoundRect $g (New-Brush "#d9ddfb") 395 $y 255 28 14
      }
    }
    9 {
      $g.FillEllipse((New-Brush "#fde3e8"), 282, 250, 460, 460)
      Draw-Heart $g $sBrush 512 465 120
      $g.DrawArc((New-Pen "#ffffff" 18), 375, 335, 274, 210, 200, 140)
      $g.DrawLine((New-Pen "#ffffff" 18), 512, 285, 512, 380)
      Draw-Plus $g $pBrush 512 720 90
    }
    10 {
      Fill-RoundRect $g (New-Brush "#dff3ef") 315 270 395 430 36
      Stroke-RoundRect $g (New-Pen $primary 8) 315 270 395 430 36
      $g.FillEllipse($white, 405, 350, 214, 214)
      Draw-Plus $g $sBrush 512 457 128
      $g.DrawLine((New-Pen $primary 11), 380, 735, 645, 735)
      $g.DrawLine((New-Pen $primary 11), 410, 785, 615, 785)
    }
  }

  $font = New-Object System.Drawing.Font("Segoe UI", 38, [System.Drawing.FontStyle]::Bold)
  $caption = @(
    "Clinical Care", "First Aid", "Heart Health", "Medication", "Telehealth",
    "Wellness", "Protective Care", "Patient Chart", "Compassion", "Diagnostics"
  )[$index - 1]
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($caption, $font, $ink, [System.Drawing.RectangleF]::new(132, 805, 760, 70), $fmt)
  $smallFont = New-Object System.Drawing.Font("Segoe UI", 19, [System.Drawing.FontStyle]::Regular)
  $g.DrawString("Healthcare illustration", $smallFont, $muted, [System.Drawing.RectangleF]::new(132, 858, 760, 40), $fmt)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $smallFont.Dispose()
  $font.Dispose()
  $fmt.Dispose()
  $line.Dispose()
  $thin.Dispose()
  $bgBrush.Dispose()
  $white.Dispose()
  $ink.Dispose()
  $muted.Dispose()
  $pBrush.Dispose()
  $sBrush.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

for ($i = 1; $i -le 10; $i++) {
  $baseName = "healthcare-{0:D2}.png" -f $i
  $target = Join-Path $OutputDir $baseName
  if (Test-Path -LiteralPath $target) {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $target = Join-Path $OutputDir ("healthcare-{0:D2}-{1}.png" -f $i, $stamp)
  }
  Draw-Scene $i $target
  Write-Output $target
}
