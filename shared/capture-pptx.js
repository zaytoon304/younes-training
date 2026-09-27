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
const STEPPED = ['build', 'code', 'codecheck'];          // تُصوَّر كل خطوة، وتظهر بالنقر في البوربوينت
const START = { board: 1, ide: 1, breadboard: 5 };       // خطوة مختارة لأدوات الجولات

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const pg = await b.newPage(); await pg.setViewport({ width: 1600, height: 900 });
  await pg.goto('file://' + path.join(DIR, 'index.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  const types = await pg.evaluate(() => SLIDES.map(s => s.t));
  const manifest = {};
  const shot = async (i, st, name) => {
    await pg.evaluate((i, st) => { if (cur !== i) { cur = i; render(); } step = st; applySteps(); document.getElementById('bar').classList.add('hide'); }, i, st);
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
    process.stdout.write(`\r${i + 1}/${types.length}`);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  console.log('\n✓ صُوّرت', Object.keys(manifest).length, 'شريحة تفاعلية');
  await b.close();
})();
