/* =====================================================================
   بناء ملف البوربوينت لأي دورة في منصة جذور من ملفات محتواها نفسها
   التشغيل: node shared/build-pptx.js <مجلد الدورة>   (يحتاج pptxgenjs و jszip)
   للأدوات التفاعلية: شغّل أولًا shared/capture-pptx.js لتصويرها
   الناتج: «<اسم الدورة>.pptx» داخل مجلد الدورة

   - كل النصوص قابلة للتعديل داخل البوربوينت
   - ملاحظات المدرب تحت كل شريحة
   - العناصر تظهر بالنقر بالترتيب نفسه الذي تظهر به في منصة جذور
   - صور المواقف في الأغلفة تتحرك ببطء (تقريب سينمائي)
   ===================================================================== */
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const JSZip = require('jszip');
const DIR = path.resolve(process.argv[2] || '.');
const C = require(path.join(DIR, 'content.js'));
C.parts.forEach(p => require(path.join(DIR, 'parts', p + '.js')));
const NATIVE = require('./pptx-native.json');
const CACHE = path.join(DIR, '.pptx-cache');
const SHOTS = fs.existsSync(path.join(CACHE, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(CACHE, 'manifest.json'))) : {};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.333 × 7.5 بوصة (16:9)
pres.title = C.title;
pres.author = C.author;
pres.rtlMode = true;

/* الألوان (نفس هوية جذور) */
const K = {
  navy900: '0A1230', navy800: '101B45', navy600: '22346F', gold: 'D9AE4B', goldDark: 'B08A2E', goldLight: 'F0CC7A',
  cream: 'FBF7EE', ink: '131B34', muted: '5E6782', line: 'E4DCC8', white: 'FFFFFF', body: '3B4460',
  bad: 'D64545', badBg: 'FBECEC', badInk: '8E2A2A', ok: '2E9E6B', okBg: 'E6F4EC', okInk: '1D5E40',
  chip: 'F6EBCF', whoBg: 'E9EDF9', soft: 'C9CFE6', iconBg: 'F7E6BC',
};
const F = { body: 'Cairo', heavy: 'Cairo Black', naskh: 'Amiri' };
const A = f => path.join(DIR, f);                          // ملفات الدورة (الصور)
const SA = f => path.join(__dirname, 'assets', f);         // ملفات مشتركة (الخلفيات)
const BG = { dark: SA('bg-dark.jpg'), light: SA('bg-light.jpg') };
const W = 13.333, M = 0.9;                // عرض الشريحة والهامش الجانبي
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];
const DARK = ['cover', 'section', 'hadith', 'ayah', 'statement', 'prophet', 'activity', 'mcover', 'end'];
// نسخة جديدة في كل مرة: المكتبة تعدّل كائن الظل نفسه، فلو تكرر استخدامه فسد الملف
const CLEAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAADklEQVR4nGNgGAWgEAAAAQgAAaUERR4AAAAASUVORK5CYII=';   // غلاف شفاف لأيقونة الصوت
const SHADOW = () => ({ type: 'outer', color: '101B45', blur: 12, offset: 3, angle: 90, opacity: 0.08 });

/* ---------- أدوات الرسم ----------
   الخاصية g = رقم «نقرة» الظهور (مثل حركات البوربوينت). بدونها يظهر العنصر مع الشريحة. */
let uid = 0;
const nm = g => (g ? { objectName: `anim-g${g}-${++uid}` } : {});
function T(s, text, o = {}) {
  const { g, ...rest } = o;
  // أحجام الخط أرقام صحيحة دائمًا (الكسور العشرية تُفسد الملف)
  if (rest.fontSize) rest.fontSize = Math.round(rest.fontSize);
  if (Array.isArray(text)) text.forEach(r => { if (r.options && r.options.fontSize) r.options.fontSize = Math.round(r.options.fontSize); });
  s.addText(text, { fontFace: F.body, color: K.ink, align: 'right', valign: 'middle', rtlMode: true, lang: 'ar-SA',
    margin: 0, paraSpaceAfter: 0, fit: 'shrink', ...rest, ...nm(g) });
}
function box(s, o = {}) {
  const { g, ...rest } = o;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { rectRadius: 0.18, line: { type: 'none' }, ...rest, ...nm(g) });
}
function shape(s, kind, o = {}) {
  const { g, ...rest } = o;
  s.addShape(pres.shapes[kind], { line: { type: 'none' }, ...rest, ...nm(g) });
}
function circleNum(s, n, x, y, d, o = {}) {
  shape(s, 'OVAL', { x, y, w: d, h: d, fill: { color: o.fill || K.gold }, g: o.g });
  T(s, AR(n), { x, y, w: d, h: d, align: 'center', fontSize: o.size || d * 30, fontFace: F.heavy, color: o.color || K.navy900, g: o.g });
}
function kicker(s, text, dark, y = 0.5, center = false) {
  const w = Math.min(9, text.length * 0.16 + 0.8);
  const x = center ? (W - w) / 2 : W - M - w;
  box(s, { x, y, w, h: 0.5, rectRadius: 0.25, fill: { color: dark ? '3A3A45' : K.chip, transparency: dark ? 40 : 0 },
    line: dark ? { color: K.gold, width: 1, transparency: 40 } : { type: 'none' } });
  T(s, text, { x, y, w, h: 0.5, align: 'center', fontSize: 18, bold: true, color: dark ? K.goldLight : K.goldDark });
}
function title(s, text, y = 1.1, o = {}) {
  T(s, text, { x: M, y, w: W - 2 * M, h: 0.95, fontSize: text.length > 32 ? 32 : 38, fontFace: F.heavy, color: K.navy800, ...o });
}
function goldRule(s, y) {
  shape(s, 'RECTANGLE', { x: (W - 2) / 2, y, w: 2, h: 0.035, fill: { color: K.gold } });
}
function footer(s, sl, n, dark) {
  if (sl.t === 'cover' || sl.t === 'end') return;
  const col = dark ? K.soft : K.muted;
  T(s, [{ text: '🌳 ' }, { text: 'جذور', options: { color: K.gold, bold: true } }, { text: ' · ' + C.title }],
    { x: W - M - 4, y: 6.95, w: 4, h: 0.35, fontSize: 12, bold: true, color: col });
  T(s, C.modules[sl.mi].name + '  ·  ' + AR(n), { x: M, y: 6.95, w: 5, h: 0.35, fontSize: 12, bold: true, color: col, align: 'left' });
}
/* أعمدة من اليمين لليسار: موضع العمود رقم i من n */
function colX(i, n, gap, left = M, right = W - M) {
  const cw = (right - left - gap * (n - 1)) / n;
  return { x: right - cw - i * (cw + gap), w: cw };
}
function card(s, x, y, w, h, c, g, o = {}) {
  box(s, { x, y, w, h, fill: { color: K.white }, line: { color: K.line, width: 1 }, shadow: SHADOW(), g });
  const ic = o.ic || 0.8;
  box(s, { x: x + w - ic - 0.3, y: y + 0.28, w: ic, h: ic, rectRadius: 0.2, fill: { color: K.iconBg }, g });
  T(s, c.icon, { x: x + w - ic - 0.3, y: y + 0.28, w: ic, h: ic, align: 'center', fontSize: ic * 36, g });
  T(s, c.h, { x: x + 0.3, y: y + ic + 0.4, w: w - 0.6, h: 0.6, fontSize: o.hs || 23, fontFace: F.heavy, color: K.navy800, g });
  T(s, c.b, { x: x + 0.3, y: y + ic + 1.0, w: w - 0.6, h: h - ic - 1.15, fontSize: o.bs || 21, bold: true, color: K.body, valign: 'top', lineSpacingMultiple: 1.15, g });
}

/* ========== رسم كل نوع ========== */
const R = {
  cover(s) {
    box(s, { x: (W - 1.05) / 2, y: 0.8, w: 1.05, h: 1.05, rectRadius: 0.28, fill: { color: K.gold },
      shadow: { type: 'outer', color: 'D9AE4B', blur: 20, offset: 0, opacity: 0.45 } });
    T(s, '🌳', { x: (W - 1.05) / 2, y: 0.8, w: 1.05, h: 1.05, align: 'center', fontSize: 44 });
    T(s, C.tag, { x: 0, y: 2.1, w: W, h: 0.5, align: 'center', fontSize: 20, bold: true, color: K.goldLight });
    T(s, C.title, { x: 0, y: 2.55, w: W, h: 1.6, align: 'center', fontSize: 96, fontFace: F.heavy, color: 'FFF3D6' });
    T(s, C.subtitle, { x: 0, y: 4.15, w: W, h: 0.7, align: 'center', fontSize: 28, bold: true, color: K.white });
    shape(s, 'RECTANGLE', { x: (W - 1.6) / 2, y: 5.05, w: 1.6, h: 0.04, fill: { color: K.gold } });
    T(s, [{ text: 'إعداد وتقديم: ' }, { text: C.author, options: { color: K.gold } }],
      { x: 0, y: 5.5, w: W, h: 0.5, align: 'center', fontSize: 20, bold: true, color: K.soft });
  },
  end(s, d) {
    box(s, { x: (W - 1.05) / 2, y: 1.0, w: 1.05, h: 1.05, rectRadius: 0.28, fill: { color: K.gold } });
    T(s, '🌳', { x: (W - 1.05) / 2, y: 1.0, w: 1.05, h: 1.05, align: 'center', fontSize: 44 });
    T(s, d.title, { x: 0, y: 2.4, w: W, h: 1.4, align: 'center', fontSize: 80, fontFace: F.heavy, color: 'FFF3D6' });
    T(s, d.sub, { x: 0, y: 3.9, w: W, h: 0.7, align: 'center', fontSize: 28, bold: true, color: K.white });
    shape(s, 'RECTANGLE', { x: (W - 1.6) / 2, y: 4.85, w: 1.6, h: 0.04, fill: { color: K.gold } });
    T(s, `${C.title} · إعداد وتقديم: ${C.author}`, { x: 0, y: 5.3, w: W, h: 0.5, align: 'center', fontSize: 18, bold: true, color: K.soft });
  },

  bio(s, d) {
    kicker(s, 'مقدّم الدورة', false);
    title(s, d.name, 1.05);
    T(s, d.role, { x: M, y: 1.95, w: W - 2 * M, h: 0.5, fontSize: 20, bold: true, color: K.navy600 });
    d.facts.forEach((f, i) => {
      const c = colX(i, 3, 0.35), g = i + 1;
      box(s, { x: c.x, y: 2.8, w: c.w, h: 2.5, fill: { color: K.white }, line: { color: K.line, width: 1 }, shadow: SHADOW(), g });
      T(s, f.big, { x: c.x, y: 3.0, w: c.w, h: 1.2, align: 'center', fontSize: /[٠-٩\d]/.test(f.big) ? 56 : 36, fontFace: F.heavy, color: K.goldDark, g });
      T(s, f.small, { x: c.x + 0.2, y: 4.25, w: c.w - 0.4, h: 0.8, align: 'center', fontSize: 20, bold: true, color: K.navy800, g });
    });
    T(s, d.line, { x: M, y: 5.75, w: W - 2 * M, h: 0.5, align: 'center', fontSize: 18, bold: true, color: K.muted, g: 4 });
  },

  cards(s, d) {
    if (d.kicker) kicker(s, d.kicker, false);
    title(s, d.title);
    if (d.cols) {                      // شبكة صفّين
      const rows = Math.ceil(d.cards.length / d.cols), top = 2.2, gap = 0.25, h = (4.4 - gap * (rows - 1)) / rows;
      d.cards.forEach((c, i) => {
        const p = colX(i % d.cols, d.cols, 0.3), y = top + Math.floor(i / d.cols) * (h + gap);
        card(s, p.x, y, p.w, h, c, i + 1, { ic: 0.62, hs: 22, bs: 19 });
      });
    } else {
      d.cards.forEach((c, i) => { const p = colX(i, d.cards.length, 0.3); card(s, p.x, 2.35, p.w, 3.9, c, i + 1); });
    }
  },

  section(s, d) {
    shape(s, 'OVAL', { x: 1.2, y: 2.3, w: 2.9, h: 2.9, fill: { color: K.gold, transparency: 88 }, line: { color: K.gold, width: 5, transparency: 40 } });
    T(s, d.num, { x: 1.2, y: 2.3, w: 2.9, h: 2.9, align: 'center', fontSize: 120, fontFace: F.heavy, color: K.goldLight });
    T(s, (C.sectionLabel || 'المحطة') + ' ' + d.num, { x: 4.6, y: 2.0, w: W - M - 4.6, h: 0.5, fontSize: 20, bold: true, color: K.gold });
    T(s, d.title, { x: 4.6, y: 2.5, w: W - M - 4.6, h: 1.5, fontSize: 56, fontFace: F.heavy, color: K.white });
    T(s, d.sub, { x: 4.6, y: 4.1, w: W - M - 4.6, h: 0.9, fontSize: 22, bold: true, color: K.soft });
  },

  hadith(s, d) {
    kicker(s, d.kicker, true, 1.2, true);
    goldRule(s, 2.3);
    T(s, d.text, { x: 1.3, y: 2.5, w: W - 2.6, h: 2.6, align: 'center', fontSize: 40, fontFace: F.naskh, bold: true, color: K.white, lineSpacingMultiple: 1.25 });
    goldRule(s, 5.25);
    T(s, d.src, { x: 0, y: 5.5, w: W, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.gold, g: 1 });
  },

  ayah(s, d) {
    kicker(s, 'قال تعالى', true, 1.3, true);
    T(s, [{ text: '﴿ ', options: { color: K.gold } }, { text: d.text }, { text: ' ﴾', options: { color: K.gold } }],
      { x: 1.0, y: 2.1, w: W - 2.0, h: 3.0, align: 'center', fontSize: 44, fontFace: F.naskh, bold: true, color: K.white, lineSpacingMultiple: 1.3 });
    T(s, d.src, { x: 0, y: 5.3, w: W, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.gold });
  },

  statement(s, d) {
    kicker(s, d.kicker, true, 1.3, true);
    const parts = d.text.split('…');
    const runs = parts.length > 1 && !d.src
      ? [{ text: parts[0] + '…', options: { breakLine: true } }, { text: parts.slice(1).join('…'), options: { color: K.goldLight } }]
      : d.text;
    T(s, runs, { x: 1.0, y: 2.1, w: W - 2.0, h: 3.0, align: 'center', fontSize: d.src ? 42 : 44,
      fontFace: d.src ? F.naskh : F.heavy, bold: !!d.src, color: K.white, lineSpacingMultiple: 1.15 });
    if (d.src) T(s, d.src, { x: 0, y: 5.3, w: W, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.gold });
  },

  script(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    const n = d.lines.length, top = 2.25, avail = d.warn ? 3.65 : 4.3, rh = avail / n;
    d.lines.forEach((l, i) => {
      const y = top + i * rh, h = rh - 0.16, g = i + 1;
      box(s, { x: W - M - 1.75, y: y + 0.08, w: 1.75, h: h - 0.16, rectRadius: 0.15, fill: { color: K.whoBg }, g });
      T(s, l.who, { x: W - M - 1.7, y: y + 0.08, w: 1.65, h: h - 0.16, align: 'center', fontSize: 18, bold: true, color: K.navy600, g });
      box(s, { x: M, y, w: W - 2 * M - 2.0, h, rectRadius: 0.22, fill: { color: K.navy800 }, g });
      T(s, [{ text: '« ', options: { color: K.gold } }, { text: l.say }, { text: ' »', options: { color: K.gold } }],
        { x: M + 0.3, y, w: W - 2 * M - 2.6, h, fontSize: l.say.length > 70 ? 20 : l.say.length > 50 ? 22 : 24, bold: true, color: K.white, g });
    });
    if (d.warn) {
      const g = n + 1;
      box(s, { x: M, y: 6.05, w: W - 2 * M, h: 0.6, rectRadius: 0.12, fill: { color: K.badBg }, g });
      shape(s, 'RECTANGLE', { x: W - M - 0.08, y: 6.05, w: 0.08, h: 0.6, fill: { color: K.bad }, g });
      T(s, '⚠️ ' + d.warn, { x: M + 0.2, y: 6.05, w: W - 2 * M - 0.5, h: 0.6, fontSize: 19, bold: true, color: K.badInk, g });
    }
  },

  activity(s, d) {
    kicker(s, d.kicker, true);
    title(s, d.title, 1.1, { color: K.goldLight });
    d.steps.forEach((t, i) => {
      const y = 2.5 + i * 1.2, g = i + 1;
      circleNum(s, i + 1, W - M - 0.8, y, 0.8, { size: 24, g });
      T(s, t, { x: 4.4, y: y - 0.1, w: W - M - 1.1 - 4.4, h: 1.0, fontSize: 22, bold: true, color: K.white, g });
    });
    shape(s, 'OVAL', { x: M, y: 2.4, w: 3.1, h: 3.1, fill: { color: K.white, transparency: 95 }, line: { color: K.gold, width: 7, transparency: 50 } });
    T(s, `${Math.floor(d.timer / 60)}:${String(d.timer % 60).padStart(2, '0')}`, { x: M, y: 3.1, w: 3.1, h: 1.2, align: 'center', fontSize: 60, fontFace: F.heavy, color: K.goldLight, rtlMode: false });
    T(s, AR(Math.round(d.timer / 60)) + ' دقائق', { x: M, y: 4.2, w: 3.1, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.soft });
  },

  prophet(s, d) {
    kicker(s, d.kicker, true);
    title(s, d.title, 1.1, { color: K.white });
    const rx = 6.1;
    T(s, d.story, { x: rx, y: 2.3, w: W - M - rx, h: 1.6, fontSize: 21, bold: true, color: 'D9DEF0', valign: 'top', lineSpacingMultiple: 1.25 });
    shape(s, 'RECTANGLE', { x: W - M - 0.06, y: 4.05, w: 0.06, h: 2.0, fill: { color: K.gold }, g: 1 });
    T(s, '«' + d.quote + '»', { x: rx, y: 4.0, w: W - M - rx - 0.3, h: 1.6, fontSize: 24, fontFace: F.naskh, bold: true, color: K.goldLight, valign: 'top', lineSpacingMultiple: 1.2, g: 1 });
    T(s, d.src, { x: rx, y: 5.65, w: W - M - rx - 0.3, h: 0.4, fontSize: 18, bold: true, color: K.gold, g: 1 });
    box(s, { x: M, y: 2.3, w: 4.8, h: 3.9, rectRadius: 0.25, fill: { color: K.white, transparency: 94 }, line: { color: K.gold, width: 1.5, transparency: 50 }, g: 2 });
    T(s, 'كيف تصرّف ﷺ؟', { x: M + 0.3, y: 2.5, w: 4.2, h: 0.55, fontSize: 21, fontFace: F.heavy, color: K.gold, g: 2 });
    d.lessons.forEach((l, i) => {
      const y = 3.2 + i * 0.95;
      circleNum(s, i + 1, M + 4.05, y + 0.08, 0.42, { size: 14, g: 2 });
      T(s, l, { x: M + 0.25, y, w: 3.7, h: 0.85, fontSize: 20, bold: true, color: K.white, valign: 'top', g: 2 });
    });
  },

  puzzle(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    let x = W - M;
    const ww = (W - 2 * M - 0.1 * (d.words.length - 1)) / d.words.length;
    d.words.forEach(w => {
      box(s, { x: x - ww, y: 2.2, w: ww, h: 0.55, rectRadius: 0.12, fill: { color: K.chip } });
      T(s, w, { x: x - ww, y: 2.2, w: ww, h: 0.55, align: 'center', fontSize: 16, bold: true, color: K.goldDark });
      x -= ww + 0.1;
    });
    box(s, { x: M, y: 3.05, w: W - 2 * M, h: 3.5, rectRadius: 0.2, fill: { color: K.white }, line: { color: K.line, width: 1.5, dashType: 'dash' } });
    T(s, d.text.replace(/____/g, '________'), { x: M + 0.4, y: 3.15, w: W - 2 * M - 0.8, h: 3.3, fontSize: 21, bold: true, lineSpacingMultiple: 1.45 });
    // الحل يظهر فوق النص بنقرة
    box(s, { x: M, y: 2.1, w: W - 2 * M, h: 4.5, rectRadius: 0.25, fill: { color: K.navy800 }, g: 1 });
    T(s, [{ text: 'الحل: ', options: { color: K.goldLight } }, { text: d.answer }],
      { x: M + 0.5, y: 2.2, w: W - 2 * M - 1, h: 4.3, fontSize: 23, bold: true, color: K.white, lineSpacingMultiple: 1.45, g: 1 });
  },

  vote(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    const n = d.options.length, top = 2.25, gap = 0.16, h = (4.35 - gap * (n - 1)) / n;
    const L = (h - 0.3), tx = { x: M + 0.3, w: W - 2 * M - h - 0.4 };
    d.options.forEach((o, i) => {
      const y = top + i * (h + gap), ok = i === d.correct;
      box(s, { x: M, y, w: W - 2 * M, h, rectRadius: 0.16, fill: { color: K.white }, line: { color: K.line, width: 1.5 } });
      box(s, { x: W - M - 0.2 - L, y: y + 0.15, w: L, h: L, rectRadius: 0.12, fill: { color: K.navy800 } });
      T(s, LETTERS[i], { x: W - M - 0.2 - L, y: y + 0.15, w: L, h: L, align: 'center', fontSize: n > 3 ? 20 : 24, fontFace: F.heavy, color: K.white });
      T(s, o, { ...tx, y, h, fontSize: n > 3 ? 22 : 25, bold: true });
      // الكشف (نقرة واحدة): الصحيح يتلوّن بالأخضر، والبقية تخفت، ويظهر سبب كل خيار
      // طبقة الكشف تغطي الخيار كاملًا: الصحيح بالأخضر، والبقية باهتة، ومع كل خيار سببه
      box(s, { x: M, y, w: W - 2 * M, h, rectRadius: 0.16, fill: { color: ok ? K.okBg : 'F7F7F9' }, line: { color: ok ? K.ok : K.line, width: ok ? 2.5 : 1.5 }, g: 1 });
      box(s, { x: W - M - 0.2 - L, y: y + 0.15, w: L, h: L, rectRadius: 0.12, fill: { color: ok ? K.ok : 'A3A9BA' }, g: 1 });
      T(s, ok ? '✓' : LETTERS[i], { x: W - M - 0.2 - L, y: y + 0.15, w: L, h: L, align: 'center', fontSize: n > 3 ? 20 : 24, fontFace: F.heavy, color: K.white, g: 1 });
      if (d.why) {
        T(s, o, { ...tx, y: y + 0.04, h: h * 0.5, fontSize: n > 3 ? 22 : 24, bold: true, color: ok ? K.ink : '8A90A3', g: 1 });
        T(s, d.why[i], { ...tx, y: y + h * 0.54, h: h * 0.42, fontSize: 18, bold: true, color: ok ? K.okInk : '9A4A4A', g: 1 });
      } else {
        T(s, o, { ...tx, y, h, fontSize: n > 3 ? 22 : 25, bold: true, color: ok ? K.ink : '8A90A3', g: 1 });
      }
    });
  },

  chart(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    const colors = { bad: 'C94040', mid: '6E7BA6', base: 'C6CBDB', good: '2E9E6B', best: 'D9AE4B' };
    const n = d.bars.length, base = 5.55, maxH = 2.9, left = M + 0.2, right = W - M - 0.2, gap = 0.5;
    const bw = (right - left - gap * (n - 1)) / n;
    d.bars.forEach((b, i) => {
      const x = left + i * (bw + gap), h = Math.max(0.05, b.v / 100 * maxH);
      shape(s, 'RECTANGLE', { x, y: base - h, w: bw, h, fill: { color: colors[b.tone] } });
      T(s, AR(b.v), { x, y: base - h - 0.6, w: bw, h: 0.55, align: 'center', fontSize: 30, fontFace: F.heavy, color: b.tone === 'base' ? K.muted : colors[b.tone] });
      T(s, b.label.replace('\n', ' '), { x: x - 0.1, y: base + 0.1, w: bw + 0.2, h: 0.75, align: 'center', fontSize: 18, bold: true, color: K.navy800, valign: 'top' });
    });
    s.addShape(pres.shapes.LINE, { x: M, y: base, w: W - 2 * M, h: 0, line: { color: K.navy800, width: 2 } });
    T(s, `المحور الرأسي: ${d.unit} · المصدر: ${d.src}`, { x: M, y: 6.45, w: W - 2 * M, h: 0.35, fontSize: 16, bold: true, color: K.muted });
  },

  map(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title, 1.05);
    const cols = d.stops.length > 9 ? 4 : 3, rh = d.stops.length > 9 ? 1.05 : 1.2, gapY = d.stops.length > 9 ? 0.18 : 0.25;
    d.stops.forEach((p, i) => {
      const r = Math.floor(i / cols), c = colX(i % cols, cols, 0.25), y = 2.15 + r * (rh + gapY), ic = rh - 0.35;
      box(s, { x: c.x, y, w: c.w, h: rh, rectRadius: 0.18, fill: { color: K.white }, line: { color: K.line, width: 1 } });
      box(s, { x: c.x + c.w - ic - 0.18, y: y + 0.175, w: ic, h: ic, rectRadius: 0.16, fill: { color: K.navy800 } });
      T(s, p.icon, { x: c.x + c.w - ic - 0.18, y: y + 0.175, w: ic, h: ic, align: 'center', fontSize: 24 });
      T(s, (C.sectionLabel || 'المحطة') + ' ' + AR(i + (C.mapStart ?? 1)), { x: c.x + 0.15, y: y + 0.1, w: c.w - ic - 0.45, h: 0.32, fontSize: 14, bold: true, color: K.goldDark });
      T(s, p.name, { x: c.x + 0.15, y: y + 0.4, w: c.w - ic - 0.45, h: rh - 0.48, fontSize: cols === 4 ? 18 : 22, fontFace: F.heavy, color: K.navy800 });
    });
  },

  hero(s, d) {
    s.addImage({ path: A(d.img), x: 0, y: 0, w: W, h: 7.5, objectName: `kb-${++uid}` });
    s.addImage({ path: SA('mcover-overlay.png'), x: 0, y: 0, w: W, h: 7.5 });
    const x0 = 5.6;
    if (d.cat) T(s, d.cat, { x: x0, y: 1.8, w: W - M - x0, h: 0.55, fontSize: 22, bold: true, color: K.gold });
    T(s, d.title, { x: x0 - 0.6, y: 2.4, w: W - M - x0 + 0.6, h: 1.9, fontSize: d.title.length > 16 ? 48 : 60, fontFace: F.heavy, color: K.white, lineSpacingMultiple: 1.1 });
    if (d.sub) T(s, d.sub, { x: x0 - 0.6, y: 4.4, w: W - M - x0 + 0.6, h: 1.2, fontSize: 22, bold: true, color: K.soft });
  },

  mcover(s, d) {
    if (d.img) {
      s.addImage({ path: A(d.img), x: 0, y: 0, w: W, h: 7.5, objectName: `kb-${++uid}` });
      s.addImage({ path: SA('mcover-overlay.png'), x: 0, y: 0, w: W, h: 7.5 });
    } else {
      T(s, d.icon, { x: 1.0, y: 1.8, w: 3.4, h: 3.4, align: 'center', fontSize: 170, rotate: -8 });
    }
    const x0 = 6.2;
    T(s, d.cat, { x: x0, y: 1.9, w: W - M - x0, h: 0.55, fontSize: 22, bold: true, color: K.gold });
    T(s, 'الموقف ' + d.num, { x: x0, y: 2.5, w: W - M - x0, h: 0.6, fontSize: 26, bold: true, color: K.soft });
    T(s, d.title, { x: x0 - 1.2, y: 3.1, w: W - M - x0 + 1.2, h: 1.3, fontSize: d.title.length > 14 ? 50 : 60, fontFace: F.heavy, color: K.white });
    const flow = ['🎬 القصة', '🗳️ تصويت', '🔍 لماذا؟', '⏱️ أول خطوة', '💬 ماذا تقول؟'];
    let x = W - M;
    flow.forEach(f => {
      const w = f.length * 0.12 + 0.4;
      box(s, { x: x - w, y: 4.9, w, h: 0.5, rectRadius: 0.25, fill: { color: K.white, transparency: 88 }, line: { color: K.white, width: 1, transparency: 75 } });
      T(s, f, { x: x - w, y: 4.9, w, h: 0.5, align: 'center', fontSize: 15, bold: true, color: K.white });
      x -= w + 0.1;
    });
  },

  story(s, d) {
    if (d.img) {
      s.addImage({ path: A(d.img), x: 0, y: 0, w: W, h: 7.5, objectName: `kb-${++uid}` });
      s.addImage({ path: SA('story-overlay.png'), x: 0, y: 0, w: W, h: 7.5 });
      const k = '🎬 القصة · ' + d.title, kw = k.length * 0.16 + 0.8;
      box(s, { x: W - 0.6 - kw, y: 0.4, w: kw, h: 0.55, rectRadius: 0.27, fill: { color: K.navy900, transparency: 20 }, line: { color: K.gold, width: 1, transparency: 40 } });
      T(s, k, { x: W - 0.6 - kw, y: 0.4, w: kw, h: 0.55, align: 'center', fontSize: 18, bold: true, color: K.goldLight });
      d.paras.forEach((p, i) => {
        const last = i === d.paras.length - 1, g = i ? i : undefined;
        box(s, { x: 0.75, y: 4.55, w: W - 1.5, h: 2.05, rectRadius: 0.22, fill: { color: K.navy900 }, line: { color: K.gold, width: 1.2, transparency: 50 }, g });
        T(s, p, { x: 1.05, y: 4.6, w: W - 2.1, h: 1.95, fontSize: last ? 26 : 24, bold: true, color: last ? K.goldLight : K.white, lineSpacingMultiple: 1.2, g });
      });
      return;
    }
    kicker(s, '🎬 القصة', false);
    title(s, d.title, 1.05);
    const n = d.paras.length, top = 2.1, h = 4.5 / n;
    d.paras.forEach((p, i) => {
      const last = i === n - 1, y = top + i * h, g = i + 1;
      shape(s, 'RECTANGLE', { x: W - M - 0.05, y: y + 0.1, w: 0.05, h: h - 0.2, fill: { color: last ? K.bad : K.line }, g });
      T(s, p, { x: M, y, w: W - 2 * M - 0.3, h, fontSize: last ? 25 : 22, bold: true, color: last ? K.bad : K.ink, lineSpacingMultiple: 1.2, g });
    });
  },

  why(s, d) {
    kicker(s, '🔍 ' + d.sub, false);
    title(s, d.title);
    const n = d.causes.length;
    d.causes.forEach((c, i) => {
      const p = colX(i, n, 0.25), g = i + 1;
      box(s, { x: p.x, y: 2.2, w: p.w, h: 2.75, fill: { color: K.white }, line: { color: K.line, width: 1 }, g });
      box(s, { x: p.x + (p.w - 0.7) / 2, y: 2.4, w: 0.7, h: 0.7, rectRadius: 0.18, fill: { color: K.iconBg }, g });
      T(s, c.icon, { x: p.x + (p.w - 0.7) / 2, y: 2.4, w: 0.7, h: 0.7, align: 'center', fontSize: 26, g });
      T(s, c.h, { x: p.x + 0.15, y: 3.2, w: p.w - 0.3, h: 0.55, align: 'center', fontSize: 22, fontFace: F.heavy, color: K.navy800, g });
      T(s, c.b, { x: p.x + 0.15, y: 3.75, w: p.w - 0.3, h: 1.15, align: 'center', fontSize: 19, bold: true, color: K.body, valign: 'top', g });
    });
    const [a, b] = d.key.split('…'), g = n + 1;
    box(s, { x: M, y: 5.2, w: W - 2 * M, h: 1.15, rectRadius: 0.2, fill: { color: K.navy800 }, g });
    T(s, [{ text: '💡 ' + a + '…', options: { breakLine: true } }, { text: b || '', options: { color: K.goldLight } }],
      { x: M + 0.3, y: 5.2, w: W - 2 * M - 0.6, h: 1.15, align: 'center', fontSize: 22, bold: true, color: K.white, g });
  },

  first10(s, d) {
    kicker(s, '⏱️ ' + d.sub, false);
    const cl = '⏱ ' + (d.clock || '١٠ ثوانٍ'), cw = cl.length * 0.13 + 0.6;
    box(s, { x: M, y: 0.5, w: cw, h: 0.5, rectRadius: 0.25, fill: { color: K.badBg } });
    T(s, cl, { x: M, y: 0.5, w: cw, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.bad });
    title(s, d.title);
    d.steps.forEach((x, i) => {
      const p = colX(i, 4, 0.25), g = i + 1;
      box(s, { x: p.x, y: 2.35, w: p.w, h: 3.7, fill: { color: K.white }, line: { color: K.line, width: 1 }, g });
      circleNum(s, i + 1, p.x + (p.w - 0.85) / 2, 2.65, 0.85, { size: 28, g });
      T(s, x.h, { x: p.x + 0.15, y: 3.7, w: p.w - 0.3, h: 0.7, align: 'center', fontSize: 25, fontFace: F.heavy, color: K.navy800, g });
      T(s, x.b, { x: p.x + 0.2, y: 4.45, w: p.w - 0.4, h: 1.4, align: 'center', fontSize: 20, bold: true, color: K.body, valign: 'top', g });
    });
  },

  ladder(s, d) {
    kicker(s, '🪜 ' + d.sub, false);
    title(s, d.title, 1.05);
    const cols = ['2E9E6B', '5A9E4B', 'B7A034', 'D99A2B', 'D9722B', 'C94040'];
    const n = d.steps.length, top = 2.1, rh = 4.5 / n;
    d.steps.forEach((t, i) => {
      const y = top + (n - 1 - i) * rh, inset = i * 0.5, g = i + 1;
      box(s, { x: M, y, w: W - 2 * M - inset, h: rh - 0.1, rectRadius: 0.14, fill: { color: cols[i] }, g });
      circleNum(s, i + 1, W - M - inset - 0.62, y + (rh - 0.1 - 0.45) / 2, 0.45, { fill: 'FFFFFF', color: cols[i], size: 15, g });
      T(s, t, { x: M + 0.2, y, w: W - 2 * M - inset - 1.0, h: rh - 0.1, fontSize: 21, bold: true, color: K.white, g });
    });
  },

  dodont(s, d) {
    title(s, d.title, 0.6);
    const cw = (W - 2 * M - 0.7) / 2, xr = W - M - cw, xl = M;
    T(s, '❌ الخطأ الشائع', { x: xr, y: 1.75, w: cw, h: 0.5, align: 'center', fontSize: 21, fontFace: F.heavy, color: K.bad });
    T(s, '✅ البديل', { x: xl, y: 1.75, w: cw, h: 0.5, align: 'center', fontSize: 21, fontFace: F.heavy, color: K.ok });
    d.rows.forEach((r, i) => {
      const y = 2.4 + i * 1.05, gx = 2 * i + 1, gv = 2 * i + 2;
      box(s, { x: xr, y, w: cw, h: 0.88, rectRadius: 0.14, fill: { color: K.badBg }, g: gx });
      T(s, r[0], { x: xr + 0.25, y, w: cw - 0.5, h: 0.88, fontSize: 22, bold: true, color: K.badInk, g: gx });
      // مكان البديل ينتظر النقاش
      box(s, { x: xl, y, w: cw, h: 0.88, rectRadius: 0.14, fill: { color: K.white }, line: { color: 'BFD9CB', width: 1.5, dashType: 'dash' }, g: gx });
      T(s, '💬 ناقشوا… ما البديل؟', { x: xl, y, w: cw, h: 0.88, align: 'center', fontSize: 19, bold: true, color: '8FB5A2', g: gx });
      T(s, '←', { x: xl + cw, y, w: 0.7, h: 0.88, align: 'center', fontSize: 26, bold: true, color: K.goldDark, g: gv });
      box(s, { x: xl, y, w: cw, h: 0.88, rectRadius: 0.14, fill: { color: K.okBg }, g: gv });
      T(s, r[1], { x: xl + 0.25, y, w: cw - 0.5, h: 0.88, fontSize: 22, bold: true, color: K.okInk, g: gv });
    });
  },

  myth(s, d) {
    kicker(s, `صح أم خطأ؟ · ${AR(d.n)} من ${AR(d.of)}`, false);
    box(s, { x: M, y: 1.5, w: W - 2 * M, h: 2.3, rectRadius: 0.25, fill: { color: K.white }, line: { color: K.line, width: 2 }, shadow: SHADOW() });
    T(s, '❝', { x: W - M - 1.0, y: 1.05, w: 0.8, h: 0.8, align: 'center', fontSize: 54, color: K.gold });
    T(s, d.text, { x: M + 0.5, y: 1.6, w: W - 2 * M - 1, h: 2.1, fontSize: 32, fontFace: F.heavy, color: K.navy800, lineSpacingMultiple: 1.2 });
    box(s, { x: M + 0.2, y: 1.0, w: 2.9, h: 1.0, rectRadius: 0.15, fill: { color: K.white, transparency: 10 }, line: { color: K.bad, width: 5 }, rotate: -10, g: 1 });
    T(s, '✗ خطأ', { x: M + 0.2, y: 1.0, w: 2.9, h: 1.0, align: 'center', fontSize: 40, fontFace: F.heavy, color: K.bad, rotate: -10, g: 1 });
    box(s, { x: M, y: 4.25, w: W - 2 * M, h: 2.0, rectRadius: 0.22, fill: { color: K.okBg }, g: 2 });
    shape(s, 'RECTANGLE', { x: W - M - 0.12, y: 4.25, w: 0.12, h: 2.0, fill: { color: K.ok }, g: 2 });
    T(s, [{ text: 'الصحيح: ', options: { color: K.ok, fontFace: F.heavy } }, { text: d.fix }],
      { x: M + 0.4, y: 4.3, w: W - 2 * M - 0.9, h: 1.9, fontSize: 23, bold: true, color: K.okInk, lineSpacingMultiple: 1.25, g: 2 });
  },

  table(s, d) {
    if (d.kicker) kicker(s, d.kicker, false);
    title(s, d.title, 1.05);
    const fr = (d.widths || d.head.map(() => '1fr')).map(v => parseFloat(v));
    const total = fr.reduce((a, b) => a + b, 0), gap = 0.12, avail = W - 2 * M - gap * (fr.length - 1);
    const ws = fr.map(f => f / total * avail);
    const xs = []; let x = W - M; ws.forEach(w => { xs.push(x - w); x -= w + gap; });
    const top = 2.05, hh = 0.6, rows = d.rows.length, rh = Math.min(1.35, (6.6 - top - hh - 0.1 - 0.12 * (rows - 1)) / rows);
    d.head.forEach((h, j) => {
      box(s, { x: xs[j], y: top, w: ws[j], h: hh, rectRadius: 0.12, fill: { color: K.navy800 } });
      T(s, h, { x: xs[j], y: top, w: ws[j], h: hh, align: 'center', fontSize: 19, fontFace: F.heavy, color: K.white });
    });
    d.rows.forEach((r, i) => {
      const y = top + hh + 0.1 + i * (rh + 0.12), g = i + 1, last = r.length - 1;
      r.forEach((c, j) => {
        const fill = j === 0 ? 'FBF3DF' : j === last ? K.okBg : K.white;
        box(s, { x: xs[j], y, w: ws[j], h: rh, rectRadius: 0.12, fill: { color: fill }, line: { color: j === 0 ? 'EFDDAF' : j === last ? 'CDE9D9' : K.line, width: 1 }, g });
        T(s, c, { x: xs[j] + 0.15, y, w: ws[j] - 0.3, h: rh, fontSize: 21, bold: true, fontFace: j === 0 ? F.heavy : F.body,
          color: j === 0 ? K.navy800 : j === last ? K.okInk : K.ink, g });
      });
    });
  },

  quad(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title, 1.05);
    const ax = 0.55, gap = 0.18, top = 2.05, bottom = 6.2, cw = (W - 2 * M - ax - gap * 2) / 2, ch = (bottom - top - gap - 0.35) / 2;
    const xR = W - M - ax - gap - cw, xL = xR - gap - cw;
    T(s, d.yHigh, { x: W - M - ax, y: top, w: ax, h: ch, align: 'center', fontSize: 18, bold: true, color: K.muted, rotate: 270 });
    T(s, d.yLow, { x: W - M - ax, y: top + ch + gap, w: ax, h: ch, align: 'center', fontSize: 18, bold: true, color: K.muted, rotate: 270 });
    T(s, d.xRight, { x: xR, y: bottom - 0.3, w: cw, h: 0.35, align: 'center', fontSize: 18, bold: true, color: K.muted });
    T(s, d.xLeft, { x: xL, y: bottom - 0.3, w: cw, h: 0.35, align: 'center', fontSize: 18, bold: true, color: K.muted });
    d.cells.forEach((c, i) => {
      const x = i % 2 === 0 ? xR : xL, y = top + Math.floor(i / 2) * (ch + gap), g = i + 1;
      box(s, { x, y, w: cw, h: ch, rectRadius: 0.2, fill: { color: c.best ? 'FBEBC0' : K.white }, line: { color: c.best ? K.gold : K.line, width: c.best ? 2.5 : 1.5 }, g });
      T(s, c.icon, { x: x + cw - 0.9, y: y + 0.15, w: 0.7, h: 0.6, align: 'center', fontSize: 26, g });
      T(s, c.name + (c.best ? ' ⭐' : ''), { x: x + 0.3, y: y + 0.15, w: cw - 1.2, h: 0.6, fontSize: 24, fontFace: F.heavy, color: K.navy800, g });
      T(s, c.desc, { x: x + 0.3, y: y + 0.8, w: cw - 0.6, h: ch - 0.95, fontSize: 20, bold: true, color: K.body, valign: 'top', g });
    });
  },

  numlist(s, d) {
    if (d.kicker) kicker(s, d.kicker, false);
    title(s, d.title, 1.05);
    const n = d.items.length, top = 2.1, gap = 0.12, rh = (4.5 - gap * (n - 1)) / n;
    d.items.forEach((it, i) => {
      const y = top + i * (rh + gap), g = i + 1, dd = Math.min(0.62, rh - 0.2);
      box(s, { x: M, y, w: W - 2 * M, h: rh, rectRadius: 0.16, fill: { color: K.white }, line: { color: K.line, width: 1 }, g });
      circleNum(s, i + 1, W - M - 0.25 - dd, y + (rh - dd) / 2, dd, { size: 20, g });
      const runs = [{ text: it.h, options: { fontFace: F.heavy, color: K.navy800, fontSize: n > 4 ? 22 : 24 } }];
      if (it.b) runs.push(n > 4 ? { text: '   — ' + it.b, options: { color: K.body, fontSize: 18 } }
                                : { text: it.b, options: { breakLine: false, color: K.body, fontSize: 20 } });
      if (it.b && n <= 4) runs[0].options.breakLine = true;
      T(s, runs, { x: M + 0.3, y, w: W - 2 * M - dd - 0.8, h: rh, bold: true, g });
    });
  },
};

/* ========== حركات البوربوينت (تُضاف إلى ملف الشريحة بعد البناء) ========== */
function timingXml(groups, kb, pics = new Set(), audios = []) {
  let id = 2;
  const nid = () => ++id;
  const entr = (spid, nodeType) => {
    const a = nid(), b = nid(), c = nid();
    return `<p:par><p:cTn id="${a}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="${nodeType}">` +
      `<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      `<p:set><p:cBhvr><p:cTn id="${b}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>` +
      `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>` +
      `<p:to><p:strVal val="visible"/></p:to></p:set>` +
      `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${c}" dur="400"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr></p:animEffect>` +
      `</p:childTnLst></p:cTn></p:par>`;
  };
  const zoom = spid => {
    const a = nid(), b = nid();
    return `<p:par><p:cTn id="${a}" presetID="6" presetClass="emph" presetSubtype="0" fill="hold" nodeType="afterEffect">` +
      `<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      `<p:animScale><p:cBhvr><p:cTn id="${b}" dur="16000" fill="hold"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr>` +
      `<p:by x="112000" y="112000"/></p:animScale></p:childTnLst></p:cTn></p:par>`;
  };
  let seq = '';
  if (kb.length) {
    const a = nid(), b = nid();
    seq += `<p:par><p:cTn id="${a}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
      `<p:par><p:cTn id="${b}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      kb.map(zoom).join('') + `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`;
  }
  groups.forEach(ids => {
    const a = nid(), b = nid();
    seq += `<p:par><p:cTn id="${a}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>` +
      `<p:par><p:cTn id="${b}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      ids.map((spid, k) => entr(spid, k === 0 ? 'clickEffect' : 'withEffect')).join('') +
      `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>`;
  });
  // كل صوت: تسلسل تفاعلي يبدأ بالنقر على أيقونته (تشغيل/إيقاف) + عقدة الوسائط
  const trig = audios.map(spid => { const a = nid(), b = nid(), c = nid(), d = nid(), e = nid();
    return `<p:seq concurrent="1" nextAc="seek"><p:cTn id="${a}" restart="whenNotActive" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq">` +
      `<p:stCondLst><p:cond evt="onClick" delay="0"><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cond></p:stCondLst>` +
      `<p:endSync evt="end" delay="0"><p:rtn val="all"/></p:endSync><p:childTnLst>` +
      `<p:par><p:cTn id="${b}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      `<p:par><p:cTn id="${c}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      `<p:par><p:cTn id="${d}" presetID="2" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` +
      `<p:cmd type="call" cmd="togglePause"><p:cBhvr><p:cTn id="${e}" dur="1" fill="hold"/><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cBhvr></p:cmd>` +
      `</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>` +
      `</p:childTnLst></p:cTn><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>`; }).join('');
  const media = audios.map(spid => `<p:audio><p:cMediaNode vol="80000"><p:cTn id="${nid()}" fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst>` +
    `<p:endCondLst><p:cond evt="onStopAudio" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:endCondLst></p:cTn><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cMediaNode></p:audio>`).join('');
  const bld = groups.flat().filter(spid => !pics.has(spid)).map(spid => `<p:bldP spid="${spid}" grpId="0" animBg="1"/>`).join('');
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    (seq ? `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${seq}</p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` : '') +
    trig + media + `</p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ''}</p:timing>`;
}
async function addAnimations(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const slides = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  let animated = 0;
  for (const f of slides) {
    let xml = await zip.file(f).async('string');
    const groups = {}, kb = [];
    for (const m of xml.matchAll(/<p:cNvPr id="(\d+)" name="anim-g(\d+)-\d+"/g)) (groups[m[2]] ||= []).push(m[1]);
    const pics = new Set([...xml.matchAll(/<p:nvPicPr>\s*<p:cNvPr id="(\d+)"/g)].map(m => m[1]));
    for (const m of xml.matchAll(/<p:cNvPr id="(\d+)" name="kb-\d+"/g)) kb.push(m[1]);
    const audios = [];   // مشغّلات الصوت بالنقر يضيفها PowerPoint نفسه: shared/pptx-audio-triggers.ps1
    const order = Object.keys(groups).map(Number).sort((a, b) => a - b).map(k => groups[k]);
    if (!order.length && !kb.length && !audios.length) continue;
    xml = xml.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + timingXml(order, kb, pics, audios));
    zip.file(f, xml);
    animated++;
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return animated;
}

/* ========== البناء ========== */
let n = 0;
C.modules.forEach((m, mi) => m.slides.forEach(raw => {
  const sl = { ...raw, mi };
  n++;
  if (process.env.TYPES && !process.env.TYPES.split(',').includes(sl.t)) return;   // للاختبار فقط
  const dark = DARK.includes(sl.t) || (sl.t === 'story' && sl.img);
  const s = pres.addSlide();
  if (R[sl.t] && NATIVE.includes(sl.t)) {             // شريحة نصية قابلة للتعديل
    s.background = { path: dark ? BG.dark : BG.light };
    R[sl.t](s, sl);
    footer(s, sl, n, dark);
    if (sl.notes) s.addNotes(sl.notes);
  } else {                                             // أداة تفاعلية: صورة من المنصة، وخطواتها تظهر بالنقر
    const shot = SHOTS[n - 1];
    if (!shot) throw new Error(`الشريحة ${n} (${sl.t}) لم تُصوَّر بعد: شغّل capture-pptx.js أولًا`);
    s.addImage({ path: path.join(CACHE, shot.base), x: 0, y: 0, w: W, h: 7.5 });
    shot.layers.forEach((f, k) => s.addImage({ path: path.join(CACHE, f), x: 0, y: 0, w: W, h: 7.5, objectName: `anim-g${k + 1}-${++uid}` }));
    // أصوات: ملف صوتي شفاف فوق زر ▶ في الصورة، يعمل بالنقر عليه أثناء العرض
    (shot.audio || []).forEach(a => s.addMedia({ type: 'audio', path: path.join(DIR, a.src), x: a.x * W, y: a.y * 7.5, w: a.w * W, h: a.h * 7.5, cover: CLEAR, objectName: `audio-${++uid}` }));
    const tip = shot.layers.length ? '🖱️ اضغط للانتقال بين الخطوات.' : '💡 هذه الأداة تفاعلية بالكامل في منصة جذور، فاعرضها من المنصة إن أمكن.';
    s.addNotes(((sl.notes || '') + '\n\n' + tip).trim());
  }
}));

const out = path.join(DIR, `${C.title}.pptx`);
pres.writeFile({ fileName: out }).then(async f => {
  const a = process.env.NOANIM ? 0 : await addAnimations(f);
  console.log('✓ تم البناء:', f, '— الشرائح:', n, '— شرائح فيها حركات:', a);
});
