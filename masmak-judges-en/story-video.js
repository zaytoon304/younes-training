/* =====================================================================
   فيديو «القصة كاملة» بصوت الراوي، للبوربوينت (يعمل وحده عند فتح الشريحة)
   التشغيل: node masmak-judges-en/story-video.js <masmak-judges | masmak-judges-en>
   - يصوّر شريحة fullstory إطارًا إطارًا (window.DY_ANIM) ويدمج مقاطع audio/story_*.mp3
     كلٌّ في بداية جزئه (STORY_DUR + السكتة) ⇐ <مجلد العرض>/story.mp4
   - يحتاج puppeteer-core و imageio-ffmpeg (python) وكروم
   ===================================================================== */
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const DIR = path.resolve(process.argv[2] || 'masmak-judges-en');
const FPS = +(process.env.FPS || 12);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FF = execFileSync(process.env.PYTHON || 'python', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const pg = await b.newPage(); await pg.setViewport({ width: 1600, height: 900 });
  await pg.goto('file:///' + path.join(DIR, 'index.html').split(path.sep).join('/'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const idx = await pg.evaluate(() => SLIDES.findIndex(s => s.t === 'fullstory'));
  if (idx < 0) throw new Error('no fullstory slide');
  await pg.evaluate(i => { cur = i; render(); document.getElementById('bar').classList.add('hide'); document.body.classList.add('capture');
    const hb = document.getElementById('barbtn'); if (hb) hb.style.display = 'none'; document.getElementById('stsnd').style.visibility = 'hidden'; }, idx);
  await new Promise(r => setTimeout(r, 1000));
  // بدايات المقاطع بالزمن الحقيقي (من المشهد نفسه حتى يتطابق الصوت مع الصورة)
  const { total, starts, keys } = await pg.evaluate(() => ({ total: window.DY_ANIM.period, ...window.STORY_STARTS }));
  await pg.evaluate(() => { window.DY_HOLD = true; });
  const vid = path.join(DIR, 'story.mp4'), tmp = path.join(DIR, 'story-noaudio.mp4');
  const ff = spawn(FF, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'medium', '-r', String(FPS), tmp], { stdio: ['pipe', 'ignore', 'inherit'] });
  const n = Math.ceil(total * FPS);
  for (let k = 0; k < n; k++) {
    await pg.evaluate(t => window.DY_ANIM.draw(t), k / FPS);
    const jpg = await pg.screenshot({ type: 'jpeg', quality: 88 });
    if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once('drain', r));
    if (k % 60 === 0) process.stdout.write(`\r${k}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await b.close();
  // الصوت: كل مقطع يبدأ مع جزئه
  const ins = [], flt = [];
  keys.forEach((k, i) => { ins.push('-i', path.join(DIR, 'audio', `story_${k}.mp3`)); const ms = Math.round(starts[i] * 1000); flt.push(`[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`); });
  const mix = flt.join(';') + ';' + keys.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${keys.length}:normalize=0:duration=longest[aout]`;
  execFileSync(FF, ['-y', '-i', tmp, ...ins, '-filter_complex', mix, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-t', total.toFixed(2), vid], { stdio: ['ignore', 'ignore', 'inherit'] });
  fs.rmSync(tmp);
  console.log('\n✓', vid, (fs.statSync(vid).size / 1e6).toFixed(1), 'MB', total.toFixed(1), 's');
})();
