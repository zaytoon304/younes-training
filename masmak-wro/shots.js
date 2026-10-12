/* لقطات «لمسة تراث WRO» للبوربوينت: كل شريحة بكل خطواتها (s<رقم>-<خطوة>.png) + meta.json
   التشغيل: node masmak-wro/shots.js <مجلد العرض> <مجلد الناتج>   (يحتاج puppeteer-core وكروم) */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const [DIR, OUT] = process.argv.slice(2).map(p => path.resolve(p));
const CHROME = process.env.CHROME || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--mute-audio'] });
  const pg = await b.newPage(); await pg.setViewport({ width: 1600, height: 900 });
  await pg.goto('file:///' + path.join(DIR, 'index.html').split(path.sep).join('/').replace(/^\//, ''), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const meta = await pg.evaluate(() => SLIDES.map(s => ({ t: s.t, say: s.say || null, notes: s.notes || '' })));
  for (let i = 0; i < meta.length; i++) {
    await pg.evaluate(i => { document.body.classList.add('capture'); cur = i; render(); document.getElementById('bar').classList.add('hide');
      const hb = document.getElementById('barbtn'); if (hb) hb.style.display = 'none'; }, i);
    meta[i].steps = await pg.evaluate(() => frags().length);
    for (let k = 0; k <= meta[i].steps; k++) {
      await pg.evaluate(k => { step = k; applySteps(); }, k);
      await new Promise(r => setTimeout(r, 900));
      await pg.screenshot({ path: path.join(OUT, `s${i}-${k}.png`) });
    }
    process.stdout.write(`\r${i + 1}/${meta.length}`);
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
  console.log('\n✓ صُوّرت', meta.length, 'شرائح');
  await b.close();
})();
