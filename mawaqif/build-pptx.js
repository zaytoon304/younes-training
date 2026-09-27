/* =====================================================================
   بناء ملف البوربوينت من ملف المحتوى نفسه (content.js)
   التشغيل: node build-pptx.js
   الناتج: «مواقف صفية.pptx» بجانب هذا الملف
   كل النصوص قابلة للتعديل داخل البوربوينت، وملاحظات المدرب تحت كل شريحة.
   ===================================================================== */
const path = require('path');
const pptxgen = require('pptxgenjs');
const C = require('./content.js');

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.333 × 7.5 بوصة (16:9)
pres.title = C.title;
pres.author = C.author;
pres.rtlMode = true;

/* الألوان (نفس هوية جذور) */
const K = {
  navy900: '0A1230', navy800: '101B45', navy600: '22346F', gold: 'D9AE4B', goldDark: 'B08A2E', goldLight: 'F0CC7A',
  cream: 'FBF7EE', ink: '131B34', muted: '5E6782', line: 'E4DCC8', white: 'FFFFFF',
  bad: 'D64545', badBg: 'FBECEC', badInk: '8E2A2A', ok: '2E9E6B', okBg: 'E6F4EC', okInk: '1D5E40',
  chip: 'F6EBCF', whoBg: 'E9EDF9', soft: 'C9CFE6',
};
const F = { body: 'Cairo', heavy: 'Cairo Black', naskh: 'Amiri' };
const BG = { dark: path.join(__dirname, 'assets/bg-dark.png'), light: path.join(__dirname, 'assets/bg-light.png') };
const W = 13.333, M = 0.9;                // عرض الشريحة والهامش الجانبي
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];
const DARK = ['cover', 'section', 'hadith', 'ayah', 'statement', 'prophet', 'activity', 'mcover'];

/* نص عربي من اليمين لليسار */
function T(s, text, o) {
  s.addText(text, {
    fontFace: F.body, color: K.ink, align: 'right', valign: 'middle', rtlMode: true, lang: 'ar-SA',
    margin: 0, paraSpaceAfter: 0, fit: 'shrink', ...o,
  });
}
/* مستطيل بزوايا دائرية */
function box(s, o) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { rectRadius: 0.18, line: { type: 'none' }, ...o });
}
/* شارة صغيرة أعلى الشريحة */
function kicker(s, text, dark, y = 0.5, center = false) {
  const w = Math.min(9, text.length * 0.16 + 0.8);
  const x = center ? (W - w) / 2 : W - M - w;
  box(s, { x, y, w, h: 0.5, rectRadius: 0.25, fill: { color: dark ? '3A3A45' : K.chip, transparency: dark ? 40 : 0 },
    line: dark ? { color: K.gold, width: 1, transparency: 40 } : { type: 'none' } });
  T(s, text, { x, y, w, h: 0.5, align: 'center', fontSize: 16, bold: true, color: dark ? K.goldLight : K.goldDark });
}
function title(s, text, y = 1.1, o = {}) {
  T(s, text, { x: M, y, w: W - 2 * M, h: 0.95, fontSize: text.length > 32 ? 32 : 38, fontFace: F.heavy, color: K.navy800, ...o });
}
function footer(s, sl, n, dark) {
  if (sl.t === 'cover') return;
  const col = dark ? K.soft : K.muted;
  T(s, [{ text: '🌳 ' }, { text: 'جذور', options: { color: K.gold, bold: true } }, { text: ' · ' + C.title }],
    { x: W - M - 4, y: 6.95, w: 4, h: 0.35, fontSize: 12, bold: true, color: col });
  T(s, C.modules[sl.mi].name + '  ·  ' + AR(n), { x: M, y: 6.95, w: 5, h: 0.35, fontSize: 12, bold: true, color: col, align: 'left' });
}
/* شبكة أعمدة من اليمين لليسار: تُرجع موضع العمود رقم i */
function colX(i, n, w, gap, left = M, right = W - M) {
  const total = right - left, cw = (total - gap * (n - 1)) / n;
  return { x: right - cw - i * (cw + gap), w: cw };
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
    s.addShape(pres.shapes.RECTANGLE, { x: (W - 1.6) / 2, y: 5.05, w: 1.6, h: 0.04, fill: { color: K.gold }, line: { type: 'none' } });
    T(s, [{ text: 'إعداد وتقديم: ' }, { text: C.author, options: { color: K.gold } }],
      { x: 0, y: 5.5, w: W, h: 0.5, align: 'center', fontSize: 20, bold: true, color: K.soft });
  },

  bio(s, d) {
    kicker(s, 'مقدّم الدورة', false);
    title(s, d.name, 1.05);
    T(s, d.role, { x: M, y: 1.95, w: W - 2 * M, h: 0.5, fontSize: 20, bold: true, color: K.navy600 });
    d.facts.forEach((f, i) => {
      const c = colX(i, 3, 0, 0.35);
      box(s, { x: c.x, y: 2.8, w: c.w, h: 2.5, fill: { color: K.white }, line: { color: K.line, width: 1 },
        shadow: { type: 'outer', color: '101B45', blur: 12, offset: 3, angle: 90, opacity: 0.08 } });
      T(s, f.big, { x: c.x, y: 3.0, w: c.w, h: 1.2, align: 'center', fontSize: /[٠-٩\d]/.test(f.big) ? 56 : 36, fontFace: F.heavy, color: K.goldDark });
      T(s, f.small, { x: c.x + 0.2, y: 4.25, w: c.w - 0.4, h: 0.8, align: 'center', fontSize: 20, bold: true, color: K.navy800 });
    });
    T(s, d.line, { x: M, y: 5.75, w: W - 2 * M, h: 0.5, align: 'center', fontSize: 18, bold: true, color: K.muted });
  },

  cards(s, d) {
    if (d.kicker) kicker(s, d.kicker, false);
    title(s, d.title);
    const n = d.cards.length;
    d.cards.forEach((c, i) => {
      const p = colX(i, n, 0, 0.3);
      box(s, { x: p.x, y: 2.35, w: p.w, h: 3.9, fill: { color: K.white }, line: { color: K.line, width: 1 },
        shadow: { type: 'outer', color: '101B45', blur: 12, offset: 3, angle: 90, opacity: 0.08 } });
      box(s, { x: p.x + p.w - 1.1, y: 2.65, w: 0.8, h: 0.8, rectRadius: 0.2, fill: { color: 'F7E6BC' } });
      T(s, c.icon, { x: p.x + p.w - 1.1, y: 2.65, w: 0.8, h: 0.8, align: 'center', fontSize: 30 });
      T(s, c.h, { x: p.x + 0.3, y: 3.6, w: p.w - 0.6, h: 0.6, fontSize: 24, fontFace: F.heavy, color: K.navy800 });
      T(s, c.b, { x: p.x + 0.3, y: 4.25, w: p.w - 0.6, h: 1.8, fontSize: 19, bold: true, color: '3B4460', valign: 'top', lineSpacingMultiple: 1.2 });
    });
  },

  section(s, d) {
    s.addShape(pres.shapes.OVAL, { x: 1.2, y: 2.3, w: 2.9, h: 2.9, fill: { color: K.gold, transparency: 88 }, line: { color: K.gold, width: 5, transparency: 40 } });
    T(s, d.num, { x: 1.2, y: 2.3, w: 2.9, h: 2.9, align: 'center', fontSize: 120, fontFace: F.heavy, color: K.goldLight });
    T(s, 'المحطة ' + d.num, { x: 4.6, y: 2.2, w: W - M - 4.6, h: 0.5, fontSize: 20, bold: true, color: K.gold });
    T(s, d.title, { x: 4.6, y: 2.7, w: W - M - 4.6, h: 1.4, fontSize: 60, fontFace: F.heavy, color: K.white });
    T(s, d.sub, { x: 4.6, y: 4.2, w: W - M - 4.6, h: 0.8, fontSize: 24, bold: true, color: K.soft });
  },

  hadith(s, d) {
    kicker(s, d.kicker, true, 1.2, true);
    goldRule(s, 2.3);
    T(s, d.text, { x: 1.3, y: 2.5, w: W - 2.6, h: 2.6, align: 'center', fontSize: 40, fontFace: F.naskh, bold: true, color: K.white, lineSpacingMultiple: 1.25 });
    goldRule(s, 5.25);
    T(s, d.src, { x: 0, y: 5.5, w: W, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.gold });
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
    T(s, runs, { x: 1.0, y: 2.1, w: W - 2.0, h: 3.0, align: 'center', fontSize: d.src ? 42 : 46,
      fontFace: d.src ? F.naskh : F.heavy, bold: !!d.src, color: K.white, lineSpacingMultiple: 1.15 });
    if (d.src) T(s, d.src, { x: 0, y: 5.3, w: W, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.gold });
  },

  script(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    const n = d.lines.length, top = 2.3, avail = d.warn ? 3.6 : 4.3, rh = avail / n;
    d.lines.forEach((l, i) => {
      const y = top + i * rh, h = rh - 0.18;
      box(s, { x: W - M - 1.75, y: y + 0.1, w: 1.75, h: h - 0.2, rectRadius: 0.15, fill: { color: K.whoBg } });
      T(s, l.who, { x: W - M - 1.7, y: y + 0.1, w: 1.65, h: h - 0.2, align: 'center', fontSize: 15, bold: true, color: K.navy600 });
      box(s, { x: M, y, w: W - 2 * M - 2.0, h, rectRadius: 0.22, fill: { color: K.navy800 } });
      T(s, [{ text: '« ', options: { color: K.gold } }, { text: l.say }, { text: ' »', options: { color: K.gold } }],
        { x: M + 0.3, y, w: W - 2 * M - 2.6, h, fontSize: l.say.length > 55 ? 18 : 21, bold: true, color: K.white });
    });
    if (d.warn) {
      box(s, { x: M, y: 6.05, w: W - 2 * M, h: 0.6, rectRadius: 0.12, fill: { color: K.badBg } });
      s.addShape(pres.shapes.RECTANGLE, { x: W - M - 0.08, y: 6.05, w: 0.08, h: 0.6, fill: { color: K.bad }, line: { type: 'none' } });
      T(s, '⚠️ ' + d.warn, { x: M + 0.2, y: 6.05, w: W - 2 * M - 0.5, h: 0.6, fontSize: 17, bold: true, color: K.badInk });
    }
  },

  activity(s, d) {
    kicker(s, d.kicker, true);
    title(s, d.title, 1.1, { color: K.goldLight });
    d.steps.forEach((t, i) => {
      const y = 2.5 + i * 1.2;
      s.addShape(pres.shapes.OVAL, { x: W - M - 0.8, y, w: 0.8, h: 0.8, fill: { color: K.gold }, line: { type: 'none' } });
      T(s, AR(i + 1), { x: W - M - 0.8, y, w: 0.8, h: 0.8, align: 'center', fontSize: 24, fontFace: F.heavy, color: K.navy900 });
      T(s, t, { x: 4.4, y: y - 0.1, w: W - M - 1.1 - 4.4, h: 1.0, fontSize: 23, bold: true, color: K.white });
    });
    s.addShape(pres.shapes.OVAL, { x: M, y: 2.4, w: 3.1, h: 3.1, fill: { color: K.white, transparency: 95 }, line: { color: K.gold, width: 7, transparency: 50 } });
    T(s, `${Math.floor(d.timer / 60)}:${String(d.timer % 60).padStart(2, '0')}`, { x: M, y: 3.1, w: 3.1, h: 1.2, align: 'center', fontSize: 60, fontFace: F.heavy, color: K.goldLight, rtlMode: false });
    T(s, 'دقيقتان', { x: M, y: 4.2, w: 3.1, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.soft });
  },

  prophet(s, d) {
    kicker(s, d.kicker, true);
    title(s, d.title, 1.1, { color: K.white });
    const rx = 6.1;
    T(s, d.story, { x: rx, y: 2.3, w: W - M - rx, h: 1.6, fontSize: 19, bold: true, color: 'D9DEF0', valign: 'top', lineSpacingMultiple: 1.25 });
    s.addShape(pres.shapes.RECTANGLE, { x: W - M - 0.06, y: 4.05, w: 0.06, h: 2.0, fill: { color: K.gold }, line: { type: 'none' } });
    T(s, '«' + d.quote + '»', { x: rx, y: 4.0, w: W - M - rx - 0.3, h: 1.6, fontSize: 25, fontFace: F.naskh, bold: true, color: K.goldLight, valign: 'top', lineSpacingMultiple: 1.2 });
    T(s, d.src, { x: rx, y: 5.65, w: W - M - rx - 0.3, h: 0.4, fontSize: 14, bold: true, color: K.gold });
    box(s, { x: M, y: 2.3, w: 4.8, h: 3.9, rectRadius: 0.25, fill: { color: K.white, transparency: 94 }, line: { color: K.gold, width: 1.5, transparency: 50 } });
    T(s, 'كيف تصرّف ﷺ؟', { x: M + 0.3, y: 2.5, w: 4.2, h: 0.55, fontSize: 21, fontFace: F.heavy, color: K.gold });
    d.lessons.forEach((l, i) => {
      const y = 3.2 + i * 0.95;
      s.addShape(pres.shapes.OVAL, { x: M + 4.5 - 0.45, y: y + 0.08, w: 0.42, h: 0.42, fill: { color: K.gold }, line: { type: 'none' } });
      T(s, AR(i + 1), { x: M + 4.5 - 0.45, y: y + 0.08, w: 0.42, h: 0.42, align: 'center', fontSize: 14, fontFace: F.heavy, color: K.navy900 });
      T(s, l, { x: M + 0.25, y, w: 3.7, h: 0.85, fontSize: 18, bold: true, color: K.white, valign: 'top' });
    });
  },

  puzzle(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    // الكلمات في صف من اليمين
    let x = W - M;
    const ww = (W - 2 * M - 0.1 * (d.words.length - 1)) / d.words.length;
    d.words.forEach(w => {
      box(s, { x: x - ww, y: 2.2, w: ww, h: 0.55, rectRadius: 0.12, fill: { color: K.chip } });
      T(s, w, { x: x - ww, y: 2.2, w: ww, h: 0.55, align: 'center', fontSize: 16, bold: true, color: K.goldDark });
      x -= ww + 0.1;
    });
    if (x < M - 0.2) throw new Error('كلمات اللغز أعرض من الشريحة');
    box(s, { x: M, y: 3.05, w: W - 2 * M, h: 3.5, rectRadius: 0.2, fill: { color: K.white }, line: { color: K.line, width: 1.5, dashType: 'dash' } });
    T(s, d.text.replace(/____/g, '________'), { x: M + 0.4, y: 3.15, w: W - 2 * M - 0.8, h: 3.3, fontSize: 21, bold: true, lineSpacingMultiple: 1.45 });
  },
  /* شريحة الحل تُضاف بعد اللغز مباشرة (البوربوينت لا يدعم الكشف التفاعلي بسهولة) */
  puzzleAnswer(s, d) {
    kicker(s, 'الحل', false);
    title(s, d.title);
    box(s, { x: M, y: 2.3, w: W - 2 * M, h: 4.1, rectRadius: 0.25, fill: { color: K.navy800 } });
    T(s, d.answer, { x: M + 0.5, y: 2.4, w: W - 2 * M - 1, h: 3.9, fontSize: 23, bold: true, color: K.white, lineSpacingMultiple: 1.45 });
  },

  vote(s, d, reveal) {
    kicker(s, reveal ? 'الإجابة' : d.kicker, false);
    title(s, d.title);
    const n = d.options.length, top = 2.25, gap = 0.16, h = (4.35 - gap * (n - 1)) / n;
    d.options.forEach((o, i) => {
      const y = top + i * (h + gap), ok = reveal && i === d.correct, dim = reveal && !ok;
      box(s, { x: M, y, w: W - 2 * M, h, rectRadius: 0.16, fill: { color: ok ? K.okBg : K.white },
        line: { color: ok ? K.ok : K.line, width: ok ? 2.5 : 1.5 } });
      box(s, { x: W - M - 0.2 - (h - 0.3), y: y + 0.15, w: h - 0.3, h: h - 0.3, rectRadius: 0.12, fill: { color: ok ? K.ok : dim ? '8A91A8' : K.navy800 } });
      T(s, LETTERS[i], { x: W - M - 0.2 - (h - 0.3), y: y + 0.15, w: h - 0.3, h: h - 0.3, align: 'center', fontSize: n > 3 ? 20 : 24, fontFace: F.heavy, color: K.white });
      const tx = { x: M + 0.3, w: W - 2 * M - h - 0.4 };
      if (reveal && d.why) {
        T(s, o, { ...tx, y: y + 0.06, h: h * 0.5, fontSize: n > 3 ? 17 : 21, bold: true, color: dim ? '7A8096' : K.ink });
        T(s, d.why[i], { ...tx, y: y + h * 0.54, h: h * 0.4, fontSize: 13, bold: true, color: ok ? K.okInk : '7A3434' });
      } else {
        T(s, o, { ...tx, y, h, fontSize: n > 3 ? 20 : 24, bold: true, color: dim ? '7A8096' : K.ink });
      }
    });
  },

  chart(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title);
    const colors = { bad: 'C94040', mid: '6E7BA6', base: 'C6CBDB', good: '2E9E6B', best: 'D9AE4B' };
    const n = d.bars.length, base = 5.55, maxH = 2.9, left = M + 0.2, right = W - M - 0.2, gap = 0.5;
    const bw = (right - left - gap * (n - 1)) / n;
    // الأعمدة من اليسار لليمين تصاعديًا (قراءة الرسم البياني عالميًا)
    d.bars.forEach((b, i) => {
      const x = left + i * (bw + gap), h = Math.max(0.05, b.v / 100 * maxH);
      s.addShape(pres.shapes.RECTANGLE, { x, y: base - h, w: bw, h, fill: { color: colors[b.tone] }, line: { type: 'none' } });
      T(s, AR(b.v), { x, y: base - h - 0.6, w: bw, h: 0.55, align: 'center', fontSize: 30, fontFace: F.heavy, color: colors[b.tone] === 'C6CBDB' ? K.muted : colors[b.tone] });
      T(s, b.label.replace('\n', ' '), { x: x - 0.1, y: base + 0.1, w: bw + 0.2, h: 0.75, align: 'center', fontSize: 15, bold: true, color: K.navy800, valign: 'top' });
    });
    s.addShape(pres.shapes.LINE, { x: M, y: base, w: W - 2 * M, h: 0, line: { color: K.navy800, width: 2 } });
    T(s, `المحور الرأسي: ${d.unit} · المصدر: ${d.src}`, { x: M, y: 6.45, w: W - 2 * M, h: 0.35, fontSize: 13, bold: true, color: K.muted });
  },

  map(s, d) {
    kicker(s, d.kicker, false);
    title(s, d.title, 1.05);
    d.stops.forEach((p, i) => {
      const r = Math.floor(i / 3), c = colX(i % 3, 3, 0, 0.3), y = 2.2 + r * 1.45;
      box(s, { x: c.x, y, w: c.w, h: 1.2, rectRadius: 0.18, fill: { color: K.white }, line: { color: K.line, width: 1 } });
      box(s, { x: c.x + c.w - 1.05, y: y + 0.2, w: 0.8, h: 0.8, rectRadius: 0.18, fill: { color: K.navy800 } });
      T(s, p.icon, { x: c.x + c.w - 1.05, y: y + 0.2, w: 0.8, h: 0.8, align: 'center', fontSize: 26 });
      T(s, 'المحطة ' + AR(i + 1), { x: c.x + 0.2, y: y + 0.15, w: c.w - 1.4, h: 0.35, fontSize: 13, bold: true, color: K.goldDark });
      T(s, p.name, { x: c.x + 0.2, y: y + 0.45, w: c.w - 1.4, h: 0.6, fontSize: 19, fontFace: F.heavy, color: K.navy800 });
    });
  },

  mcover(s, d) {
    T(s, d.icon, { x: 1.0, y: 1.8, w: 3.4, h: 3.4, align: 'center', fontSize: 170, rotate: -8 });
    T(s, d.cat, { x: 4.6, y: 1.9, w: W - M - 4.6, h: 0.55, fontSize: 22, bold: true, color: K.gold });
    T(s, 'الموقف ' + d.num, { x: 4.6, y: 2.5, w: W - M - 4.6, h: 0.6, fontSize: 26, bold: true, color: K.soft });
    T(s, d.title, { x: 4.6, y: 3.1, w: W - M - 4.6, h: 1.3, fontSize: 64, fontFace: F.heavy, color: K.white });
    const flow = ['🎬 القصة', '🗳️ تصويت', '🔍 لماذا؟', '⏱️ أول ١٠ ثوانٍ', '💬 ماذا تقول؟', '🪜 سلّم التدخّل'];
    let x = W - M;
    flow.forEach(f => {
      const w = f.length * 0.12 + 0.4;
      box(s, { x: x - w, y: 4.9, w, h: 0.5, rectRadius: 0.25, fill: { color: K.white, transparency: 90 }, line: { color: K.white, width: 1, transparency: 80 } });
      T(s, f, { x: x - w, y: 4.9, w, h: 0.5, align: 'center', fontSize: 13, bold: true, color: K.white });
      x -= w + 0.1;
    });
    if (x < 0.3) throw new Error('أزرار غلاف الموقف أعرض من الشريحة');
  },

  story(s, d) {
    kicker(s, '🎬 القصة', false);
    title(s, d.title, 1.05);
    const n = d.paras.length, top = 2.15, h = 4.4 / n;
    d.paras.forEach((p, i) => {
      const last = i === n - 1, y = top + i * h;
      s.addShape(pres.shapes.RECTANGLE, { x: W - M - 0.05, y: y + 0.1, w: 0.05, h: h - 0.2, fill: { color: last ? K.bad : K.line }, line: { type: 'none' } });
      T(s, p, { x: M, y, w: W - 2 * M - 0.3, h, fontSize: last ? 25 : 22, bold: true, color: last ? K.bad : K.ink, lineSpacingMultiple: 1.2 });
    });
  },

  why(s, d) {
    kicker(s, '🔍 ' + d.sub, false);
    title(s, d.title);
    d.causes.forEach((c, i) => {
      const p = colX(i, 4, 0, 0.25);
      box(s, { x: p.x, y: 2.2, w: p.w, h: 2.75, fill: { color: K.white }, line: { color: K.line, width: 1 } });
      box(s, { x: p.x + (p.w - 0.7) / 2, y: 2.4, w: 0.7, h: 0.7, rectRadius: 0.18, fill: { color: 'F7E6BC' } });
      T(s, c.icon, { x: p.x + (p.w - 0.7) / 2, y: 2.4, w: 0.7, h: 0.7, align: 'center', fontSize: 26 });
      T(s, c.h, { x: p.x + 0.15, y: 3.2, w: p.w - 0.3, h: 0.55, align: 'center', fontSize: 22, fontFace: F.heavy, color: K.navy800 });
      T(s, c.b, { x: p.x + 0.2, y: 3.8, w: p.w - 0.4, h: 1.05, align: 'center', fontSize: 16, bold: true, color: '3B4460', valign: 'top' });
    });
    const [a, b] = d.key.split('…');
    box(s, { x: M, y: 5.2, w: W - 2 * M, h: 1.15, rectRadius: 0.2, fill: { color: K.navy800 } });
    T(s, [{ text: '💡 ' + a + '…', options: { breakLine: true } }, { text: b || '', options: { color: K.goldLight } }],
      { x: M + 0.3, y: 5.2, w: W - 2 * M - 0.6, h: 1.15, align: 'center', fontSize: 21, bold: true, color: K.white });
  },

  first10(s, d) {
    kicker(s, '⏱️ ' + d.sub, false);
    box(s, { x: M, y: 0.5, w: 1.9, h: 0.5, rectRadius: 0.25, fill: { color: K.badBg } });
    T(s, '⏱ ١٠ ثوانٍ', { x: M, y: 0.5, w: 1.9, h: 0.5, align: 'center', fontSize: 16, bold: true, color: K.bad });
    title(s, d.title);
    d.steps.forEach((x, i) => {
      const p = colX(i, 4, 0, 0.25);
      box(s, { x: p.x, y: 2.35, w: p.w, h: 3.7, fill: { color: K.white }, line: { color: K.line, width: 1 } });
      s.addShape(pres.shapes.OVAL, { x: p.x + (p.w - 0.85) / 2, y: 2.65, w: 0.85, h: 0.85, fill: { color: K.gold }, line: { type: 'none' } });
      T(s, AR(i + 1), { x: p.x + (p.w - 0.85) / 2, y: 2.65, w: 0.85, h: 0.85, align: 'center', fontSize: 28, fontFace: F.heavy, color: K.navy900 });
      T(s, x.h, { x: p.x + 0.15, y: 3.7, w: p.w - 0.3, h: 0.7, align: 'center', fontSize: 28, fontFace: F.heavy, color: K.navy800 });
      T(s, x.b, { x: p.x + 0.25, y: 4.45, w: p.w - 0.5, h: 1.3, align: 'center', fontSize: 18, bold: true, color: '3B4460', valign: 'top' });
    });
  },

  ladder(s, d) {
    kicker(s, '🪜 ' + d.sub, false);
    title(s, d.title, 1.05);
    const cols = ['2E9E6B', '5A9E4B', 'B7A034', 'D99A2B', 'D9722B', 'C94040'];
    const n = d.steps.length, top = 2.1, rh = 4.5 / n;
    d.steps.forEach((t, i) => {
      const y = top + (n - 1 - i) * rh, inset = i * 0.5;
      box(s, { x: M, y, w: W - 2 * M - inset, h: rh - 0.1, rectRadius: 0.14, fill: { color: cols[i] } });
      s.addShape(pres.shapes.OVAL, { x: W - M - inset - 0.62, y: y + (rh - 0.1 - 0.45) / 2, w: 0.45, h: 0.45, fill: { color: K.white, transparency: 75 }, line: { type: 'none' } });
      T(s, AR(i + 1), { x: W - M - inset - 0.62, y: y + (rh - 0.1 - 0.45) / 2, w: 0.45, h: 0.45, align: 'center', fontSize: 15, fontFace: F.heavy, color: K.white });
      T(s, t, { x: M + 0.2, y, w: W - 2 * M - inset - 1.0, h: rh - 0.1, fontSize: 18, bold: true, color: K.white });
    });
  },

  dodont(s, d) {
    title(s, d.title, 0.6);
    const cw = (W - 2 * M - 0.7) / 2, xr = W - M - cw, xl = M;
    T(s, '❌ الخطأ الشائع', { x: xr, y: 1.75, w: cw, h: 0.5, align: 'center', fontSize: 21, fontFace: F.heavy, color: K.bad });
    T(s, '✅ البديل', { x: xl, y: 1.75, w: cw, h: 0.5, align: 'center', fontSize: 21, fontFace: F.heavy, color: K.ok });
    d.rows.forEach((r, i) => {
      const y = 2.4 + i * 1.05;
      box(s, { x: xr, y, w: cw, h: 0.88, rectRadius: 0.14, fill: { color: K.badBg } });
      T(s, r[0], { x: xr + 0.25, y, w: cw - 0.5, h: 0.88, fontSize: 19, bold: true, color: K.badInk });
      T(s, '←', { x: xl + cw, y, w: 0.7, h: 0.88, align: 'center', fontSize: 26, bold: true, color: K.goldDark });
      box(s, { x: xl, y, w: cw, h: 0.88, rectRadius: 0.14, fill: { color: K.okBg } });
      T(s, r[1], { x: xl + 0.25, y, w: cw - 0.5, h: 0.88, fontSize: 19, bold: true, color: K.okInk });
    });
  },
};
function goldRule(s, y) {
  s.addShape(pres.shapes.RECTANGLE, { x: (W - 2) / 2, y, w: 2, h: 0.035, fill: { color: K.gold }, line: { type: 'none' } });
}

/* ========== البناء ========== */
let n = 0;
function add(sl, fn, extraNotes) {
  n++;
  const dark = DARK.includes(sl.t);
  const s = pres.addSlide();
  s.background = { path: dark ? BG.dark : BG.light };
  fn(s);
  footer(s, sl, n, dark);
  if (sl.notes || extraNotes) s.addNotes((extraNotes || sl.notes));
}
C.modules.forEach((m, mi) => m.slides.forEach(raw => {
  const sl = { ...raw, mi };
  if (!R[sl.t]) throw new Error('نوع شريحة غير معروف: ' + sl.t);
  if (sl.t === 'vote') {
    add(sl, s => R.vote(s, sl, false));
    add(sl, s => R.vote(s, sl, true), 'كشف الإجابة: ' + (sl.notes || ''));
  } else if (sl.t === 'puzzle') {
    add(sl, s => R.puzzle(s, sl));
    add(sl, s => R.puzzleAnswer(s, sl), 'الحل: ' + sl.answer);
  } else add(sl, s => R[sl.t](s, sl));
}));

const out = path.join(__dirname, `${C.title}.pptx`);
pres.writeFile({ fileName: out }).then(f => console.log('✓ تم البناء:', f, '— عدد الشرائح:', n));
