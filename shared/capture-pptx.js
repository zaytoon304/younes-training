/* =====================================================================
   تصوير الشرائح التفاعلية لتضمينها في البوربوينت
   التشغيل: node shared/capture-pptx.js <مجلد الدورة>
   - الشرائح ذات الخطوات (بناء الدوائر، والكود سطرًا سطرًا، وصح أم خطأ) تُصوَّر خطوة خطوة
   - بقية الأدوات تُصوَّر في حالتها النهائية
   الناتج: <مجلد الدورة>/.pptx-cache/ + ملف manifest.json
   ===================================================================== */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const DIR = path.resolve(process.argv[2] || '.');
const NATIVE = require('./pptx-native.json');          // الأنواع التي يرسمها البوربوينت نصًا قابلًا للتعديل
const OUT = path.join(DIR, '.pptx-cache');
const STEPPED = ['build', 'build2', 'code', 'codecheck']; // تُصوَّر كل خطوة، وتظهر بالنقر في البوربوينت
const START = { board: 1, ide: 1, breadboard: 5 };       // خطوة مختارة لأدوات الجولات
const CHROME = process.env.CHROME || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const pg = await b.newPage(); await pg.setViewport({ width: 1600, height: 900 });
  pg.on('error', e => console.log('\n⚠️ تعطلت الصفحة:', e.message));
  await pg.goto('file:///' + path.join(DIR, 'index.html').replace(/\\/g, '/').replace(/^\//, ''), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const types = await pg.evaluate(() => SLIDES.map(s => s.t));
  const manifest = {};
  const shot = async (i, st, name) => {
    await pg.evaluate((i, st) => { if (cur !== i) { cur = i; render(); } step = st; applySteps(); document.getElementById('bar').classList.add('hide'); document.body.classList.add('capture'); const hb = document.getElementById('barbtn'); if (hb) hb.style.display = 'none'; }, i, st);
    await new Promise(r => setTimeout(r, 1100));
    await pg.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 80 });
    return name;
  };
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    if (NATIVE.includes(t)) continue;
    await pg.evaluate(i => { cur = i; render(); }, i);
    const n = await pg.evaluate(() => frags().length);
    if (STEPPED.includes(t) && n) {
      const base = await shot(i, 0, `s${i + 1}-0.jpg`), layers = [];
      for (let st = 1; st <= n; st++) layers.push(await shot(i, st, `s${i + 1}-${st}.jpg`));
      manifest[i] = { base, layers };
    } else {
      manifest[i] = { base: await shot(i, START[t] ?? n, `s${i + 1}.jpg`), layers: [] };
    }
    // أزرار الصوت ([data-audio]): نسجّل مواضعها ليضع البوربوينت فوقها ملفًا صوتيًا يعمل بالنقر
    const audio = await pg.evaluate(() => { const st = document.getElementById('stage').getBoundingClientRect();
      return [...document.querySelectorAll('#stage .slide [data-audio]')].map(e => { const r = e.getBoundingClientRect();
        return { src: e.dataset.audio, x: (r.left - st.left) / st.width, y: (r.top - st.top) / st.height, w: r.width / st.width, h: r.height / st.height }; }); });
    if (audio.length) manifest[i].audio = audio;
    // المشاهد المتحركة (window.DY_ANIM + عنصر .dygif): تُصوَّر إطارًا إطارًا وتصير صورة GIF تتحرك داخل البوربوينت
    const anim = await pg.evaluate(() => { const a = window.DY_ANIM, el = document.querySelector('#stage .dygif');
      if (!a || !el) return null; const st = document.getElementById('stage').getBoundingClientRect(), r = el.getBoundingClientRect();
      return { period: a.period, fps: SLIDES[cur].gifFps, clip: { x: r.left, y: r.top, width: r.width, height: r.height },
        x: (r.left - st.left) / st.width, y: (r.top - st.top) / st.height, w: r.width / st.width, h: r.height / st.height }; });
    if (anim && !process.env.NOGIF) {
      const fps = anim.fps || Math.min(10, Math.max(3, 180 / anim.period)), n = Math.round(anim.period * fps);
      const fdir = path.join(OUT, `f${i + 1}`); fs.mkdirSync(fdir, { recursive: true });
      await pg.evaluate(() => { window.DY_HOLD = true; });
      for (let k = 0; k < n; k++) {
        await pg.evaluate(t => window.DY_ANIM.draw(t), k / fps);
        await pg.screenshot({ path: path.join(fdir, String(k).padStart(4, '0') + '.png'), clip: anim.clip });
      }
      await pg.evaluate(() => { window.DY_HOLD = false; });
      const gif = `s${i + 1}.gif`;
      require('child_process').execFileSync(process.env.PYTHON || 'python', [path.join(__dirname, 'make-gif.py'), fdir, path.join(OUT, gif), String(fps), '960'], { stdio: 'inherit' });
      fs.rmSync(fdir, { recursive: true, force: true });
      manifest[i].gif = { file: gif, x: anim.x, y: anim.y, w: anim.w, h: anim.h };
    }
    process.stdout.write(`\r${i + 1}/${types.length}`);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  console.log('\n✓ صُوّرت', Object.keys(manifest).length, 'شريحة تفاعلية');
  await b.close();
})();
