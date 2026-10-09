# ==========================================================================
#  يضيف مشغّل «اضغط للتشغيل» لكل صوت في ملف بوربوينت بنته build-pptx.js
#  التشغيل: powershell -File shared/pptx-audio-triggers.ps1 "<مسار الملف.pptx>"
#  يحتاج PowerPoint مثبتًا على الجهاز (يستخدمه عبر COM ثم يحفظ الملف)
# ==========================================================================
param([Parameter(Mandatory = $true)][string]$File)
$File = (Resolve-Path -LiteralPath $File).Path
$tmp = Join-Path $env:TEMP ("jothoor_audio_" + [guid]::NewGuid().ToString("N") + ".pptx")
Copy-Item -LiteralPath $File -Destination $tmp -Force          # مسار بلا حروف عربية لتجنب مشكلات COM
$pp = New-Object -ComObject PowerPoint.Application
$added = 0
try {
  $p = $pp.Presentations.Open($tmp, $false, $false, $false)
  foreach ($s in $p.Slides) {
    # آمن عند التكرار: نحذف مشغّلات النقر القديمة أولًا حتى لا يتضاعف الصوت
    for ($i = $s.TimeLine.InteractiveSequences.Count; $i -ge 1; $i--) { $q = $s.TimeLine.InteractiveSequences.Item($i); for ($j = $q.Count; $j -ge 1; $j--) { $q.Item($j).Delete() } }
    foreach ($sh in @($s.Shapes)) {
      if ($sh.Type -eq 16 -and $sh.Name -like 'audio-*') {    # 16 = msoMedia
        $seq = $s.TimeLine.InteractiveSequences.Add()
        $null = $seq.AddTriggerEffect($sh, 83, 4, $sh)         # 83 = تشغيل الوسائط · 4 = عند النقر على الشكل
        $added++
      }
    }
  }
  $p.Save(); $p.Close()
  Copy-Item -LiteralPath $tmp -Destination $File -Force
  "audio triggers added: $added"
} catch { "ERROR: " + $_.Exception.Message; exit 1 } finally { $pp.Quit(); Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue }
