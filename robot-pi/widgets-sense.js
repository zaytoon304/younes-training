/* =====================================================================
   أدوات الحواس (الوحدتان ٦ و٧):
   echolab (كيف يقيس الحساس المسافة) · divider (مقسّم الجهد) · avoidsim (نبيه يتجول وحده)
   pixels (الصورة أرقام) · colorlab (نبيه يبحث عن لون) · followsim (نبيه يلحق الكرة)
   القواعد هنا نفسها في nabeeh.py وبرامج الأمثلة: الحد ٢٠ سم، ونطاقات الألوان، وحدود ±٢٥ وحجم ٤٥
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]).replace('.', '٫');
const { pyBlock } = window.NB_CODE;
const SOUND = 343;   // سرعة الصوت: متر في الثانية

/* ---------- ١) مختبر الصدى ---------- */
function echoHTML() {
  return `<div class="nb-echo">
    <svg viewBox="0 0 1100 300" class="nb-echosvg">
      <rect x="0" y="250" width="1100" height="50" fill="#d9dde6"/>
      <g><rect x="20" y="120" width="150" height="130" rx="26" fill="#2E4288" stroke="#D9AE4B" stroke-width="5"/>
        <rect x="150" y="140" width="46" height="90" rx="8" fill="#2E6FD8"/><circle cx="173" cy="163" r="16" fill="#e4e8f2"/><circle cx="173" cy="207" r="16" fill="#e4e8f2"/>
        <text x="95" y="196" text-anchor="middle" class="nb-ewl">نبيه</text></g>
      <g class="nb-ewall"><rect x="0" y="40" width="70" height="210" fill="#8d5a3b"/><text x="35" y="30" text-anchor="middle" class="nb-ewl dark">جدار</text></g>
      <g class="nb-pulse go"><path d="M0 -30 a30 30 0 0 1 0 60" fill="none" stroke="#e67e22" stroke-width="7"/><path d="M14 -46 a46 46 0 0 1 0 92" fill="none" stroke="#e67e22" stroke-width="5" opacity=".6"/></g>
      <g class="nb-pulse back"><path d="M0 -30 a30 30 0 0 0 0 60" fill="none" stroke="#2E9E6B" stroke-width="7"/><path d="M-14 -46 a46 46 0 0 0 0 92" fill="none" stroke="#2E9E6B" stroke-width="5" opacity=".6"/></g>
    </svg>
    <div class="nb-ecalc">
      <div><span>⏱️ زمن الذهاب والعودة</span><b class="nb-et">—</b></div>
      <div><span>🧮 المسافة = الزمن × سرعة الصوت ÷ ٢</span><b class="nb-ed">—</b></div>
    </div>
    <div class="nb-ectl"><label class="nb-slider"><span>حرّك الجدار: <b class="nb-ev">٦٠</b> سم</span><input type="range" min="5" max="150" value="60"></label>
      <button class="nb-btn go">📢 أطلق الصوت</button></div>
  </div>`;
}
function bindEcho(sl) {
  const r = sl.querySelector('input'), wall = sl.querySelector('.nb-ewall'), go = sl.querySelector('.nb-pulse.go'), back = sl.querySelector('.nb-pulse.back');
  let timers = [];
  window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  const wx = () => 200 + (+r.value) * 5.6;          // كل سنتيمتر = ٥٫٦ نقطة في الرسمة
  const place = () => { wall.setAttribute('transform', `translate(${wx()},0)`); sl.querySelector('.nb-ev').textContent = AR(r.value);
    sl.querySelector('.nb-et').textContent = '—'; sl.querySelector('.nb-ed').textContent = '—'; [go, back].forEach(p => p.style.opacity = 0); };
  r.addEventListener('input', place); place();
  sl.querySelector('.go').onclick = () => {
    timers.forEach(clearTimeout); timers = [];
    const d = +r.value, ms = 2 * d / 100 / SOUND * 1000, x0 = 200, x1 = wx() - 10, dur = 600 + d * 6;
    const fly = (p, a, b, done) => { p.style.transition = 'none'; p.style.opacity = 1; p.setAttribute('transform', `translate(${a},185)`);
      timers.push(setTimeout(() => { p.style.transition = `transform ${dur}ms linear`; p.style.transform = ''; p.setAttribute('transform', `translate(${b},185)`); }, 30));
      timers.push(setTimeout(() => { p.style.opacity = 0; done && done(); }, dur + 40)); };
    fly(go, x0, x1, () => fly(back, x1, x0, () => {
      sl.querySelector('.nb-et').textContent = `${AR(ms.toFixed(2))} جزء من ألف من الثانية`;
      sl.querySelector('.nb-ed').textContent = `${AR(Math.round(ms / 1000 * SOUND * 100 / 2))} سم ✅`;
    }));
  };
}

/* ---------- ٢) مقسّم الجهد ---------- */
const dividerSVG = `<svg viewBox="0 -30 900 550" class="nb-divsvg">
  <rect x="40" y="40" width="180" height="90" rx="16" fill="#2E6FD8"/><text x="130" y="80" class="nb-dvt w" text-anchor="middle">ECHO</text><text x="130" y="112" class="nb-dvt w sm" text-anchor="middle">يخرج ٥ فولت</text>
  <path d="M220 85 H330" stroke="#e67e22" stroke-width="10"/>
  <g transform="translate(330,60)"><rect width="150" height="50" rx="20" fill="#d9c08a"/><rect x="34" width="12" height="50" fill="#7a4b30"/><rect x="58" width="12" height="50" fill="#1b1e27"/><rect x="82" width="12" height="50" fill="#c0392b"/>
    <text x="75" y="-14" class="nb-dvt" text-anchor="middle">١ كيلو أوم</text></g>
  <path d="M480 85 H600" stroke="#e67e22" stroke-width="10"/><circle cx="600" cy="85" r="16" fill="#D9AE4B"/>
  <path d="M600 85 H730" stroke="#2E9E6B" stroke-width="10"/>
  <rect x="720" y="40" width="170" height="90" rx="16" fill="#1f8a3c"/><text x="805" y="80" class="nb-dvt w" text-anchor="middle">GPIO24</text><text x="805" y="112" class="nb-dvt w sm" text-anchor="middle">يصله ٣٫٣ فولت</text>
  <path d="M600 85 V230" stroke="#e67e22" stroke-width="10"/>
  <g transform="translate(575,230)"><rect width="50" height="150" rx="20" fill="#d9c08a"/><rect y="34" width="50" height="12" fill="#c0392b"/><rect y="58" width="50" height="12" fill="#1b1e27"/><rect y="82" width="50" height="12" fill="#c0392b"/>
    <text x="70" y="82" class="nb-dvt">٢ كيلو أوم</text></g>
  <path d="M600 380 V440" stroke="#1b1e27" stroke-width="10"/><rect x="540" y="440" width="120" height="56" rx="12" fill="#1b1e27"/><text x="600" y="476" class="nb-dvt w" text-anchor="middle">GND</text>
  <g class="nb-dvnote"><rect x="40" y="220" width="420" height="200" rx="24" fill="#fff8e6" stroke="#D9AE4B" stroke-width="3"/>
    <text x="250" y="270" class="nb-dvt" text-anchor="middle">المقاومتان تقسمان الكهرباء:</text>
    <text x="250" y="320" class="nb-dvt big" text-anchor="middle">٥ × ٢ ÷ ٣ = ٣٫٣ فولت</text>
    <text x="250" y="380" class="nb-dvt sm" text-anchor="middle">مثل شلال: نصرف جزءًا من الماء جانبًا</text></g>
</svg>`;

/* ---------- ٣) نبيه يتجول وحده (محاكاة من الأعلى) ---------- */
const ROOM = { w: 300, h: 200, boxes: [[70, 50, 40, 40], [190, 110, 50, 35], [120, 150, 30, 30], [240, 30, 30, 30]] };   // بالسنتيمتر
const AVOID = `import nabeeh\n\nLIMIT = 20\n\nwhile True:\n    if nabeeh.distance() < LIMIT:\n        nabeeh.stop()\n        nabeeh.backward()\n        nabeeh.right()\n    else:\n        nabeeh.go()`;
function avoidHTML() {
  return `<div class="nb-avoid ix">
    <div class="nb-aside">
      <div class="codewrap"><div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">06_avoid.py</span></div><div class="nb-acode"></div></div>
      <label class="nb-slider"><span>حد الأمان LIMIT: <b class="nb-lv">٢٠</b> سم</span><input type="range" min="2" max="60" value="20"></label>
      <div class="nb-ctl"><button class="nb-btn go">▶ انطلق</button><button class="nb-btn ghost reset">↺ من جديد</button></div>
    </div>
    <div class="nb-amain"><canvas width="900" height="600"></canvas>
      <div class="nb-astats"><span>📏 المسافة: <b class="nb-ad">—</b></span><span>💥 الاصطدامات: <b class="nb-ac">٠</b></span><span>🧭 الحالة: <b class="nb-as">واقف</b></span></div></div>
  </div>`;
}
function bindAvoid(sl) {
  const cv = sl.querySelector('canvas'), ctx = cv.getContext('2d'), S = 3;   // ٣ نقاط لكل سنتيمتر
  const code = sl.querySelector('.nb-acode'), lim = sl.querySelector('input');
  let bot, timer = null, crashes = 0, trail = [];
  const R = 9;   // نصف قطر نبيه بالسنتيمتر
  window.DECK_CLEANUP.push(() => clearInterval(timer));
  const drawCode = () => { code.innerHTML = pyBlock(AVOID.replace('LIMIT = 20', `LIMIT = ${lim.value}`), 'nb-small'); };
  const mark = ns => code.querySelectorAll('.ln').forEach(l => l.classList.toggle('run', ns.includes(+l.dataset.n)));
  const inBox = (x, y) => x < 0 || y < 0 || x > ROOM.w || y > ROOM.h || ROOM.boxes.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh);
  const sense = () => { for (let d = 0; d < 200; d += 0.5) {   // نرسل «شعاع صوت» للأمام حتى يلمس شيئًا
      if (inBox(bot.x + Math.cos(bot.a) * (R + d), bot.y + Math.sin(bot.a) * (R + d))) return d; } return 200; };
  const reset = () => { clearInterval(timer); timer = null; bot = { x: 30, y: 170, a: -0.4, mode: 'go', t: 0 }; crashes = 0; trail = [];
    sl.querySelector('.nb-ac').textContent = AR(0); sl.querySelector('.go').textContent = '▶ انطلق'; sl.querySelector('.nb-as').textContent = 'واقف'; mark([]); draw(); };
  const draw = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#e9f2e6'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = '#8d5a3b'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, cv.width - 14, cv.height - 14);
    ROOM.boxes.forEach(([x, y, w, h]) => { ctx.fillStyle = '#b07a4f'; ctx.fillRect(x * S, y * S, w * S, h * S); ctx.fillStyle = '#8d5a3b'; ctx.fillRect(x * S, y * S, w * S, 8); });
    ctx.fillStyle = 'rgba(217,174,75,.35)'; trail.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * S, y * S, 4, 0, 7); ctx.fill(); });
    const d = sense();
    ctx.strokeStyle = d < +lim.value ? 'rgba(214,69,69,.8)' : 'rgba(46,111,216,.55)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo((bot.x + Math.cos(bot.a) * R) * S, (bot.y + Math.sin(bot.a) * R) * S);
    ctx.lineTo((bot.x + Math.cos(bot.a) * (R + d)) * S, (bot.y + Math.sin(bot.a) * (R + d)) * S); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(bot.x * S, bot.y * S); ctx.rotate(bot.a);
    ctx.fillStyle = '#1b1e27'; ctx.fillRect(-R * S, -R * S - 6, R * 2 * S * 0.8, 10); ctx.fillRect(-R * S, R * S - 4, R * 2 * S * 0.8, 10);
    ctx.fillStyle = bot.mode === 'crash' ? '#d64545' : '#2E4288'; ctx.beginPath(); ctx.arc(0, 0, R * S, 0, 7); ctx.fill();
    ctx.strokeStyle = '#D9AE4B'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; [[-9], [9]].forEach(([o]) => { ctx.beginPath(); ctx.arc(R * S * 0.55, o, 7, 0, 7); ctx.fill(); });
    ctx.restore();
    sl.querySelector('.nb-ad').textContent = `${AR(Math.round(d))} سم`;
  };
  const step = () => {
    const d = sense(), L = +lim.value, st = sl.querySelector('.nb-as');
    if (bot.mode === 'go') {
      if (d < L) { bot.mode = 'brake'; bot.t = 5; bot.v = 1.6; mark([6, 7, 8]); st.textContent = '🛑 قريب! أفرمل'; }
      else { const v = 1.6; bot.x += Math.cos(bot.a) * v; bot.y += Math.sin(bot.a) * v; mark([6, 11, 12]); st.textContent = '🚗 أمشي';
        if (trail.length % 3 === 0) trail.push([bot.x, bot.y]); else trail.push(null); trail = trail.filter(Boolean).slice(-400);
        if (sense() <= 0.5) { bot.mode = 'crash'; bot.t = 12; crashes++; sl.querySelector('.nb-ac').textContent = AR(crashes); st.textContent = '💥 اصطدمت!'; } }
    } else if (bot.mode === 'brake') {      // الروبوت الحقيقي لا يقف فجأة: يكمل قليلًا وهو يبطئ
      bot.v *= 0.7; bot.x += Math.cos(bot.a) * bot.v; bot.y += Math.sin(bot.a) * bot.v;
      if (sense() <= 0.5) { bot.mode = 'crash'; bot.t = 12; crashes++; sl.querySelector('.nb-ac').textContent = AR(crashes); st.textContent = '💥 اصطدمت! الحد صغير جدًّا'; }
      else if (--bot.t <= 0) { bot.mode = 'back'; bot.t = 10; st.textContent = '⬅️ أرجع'; }
    } else if (bot.mode === 'back') { bot.x -= Math.cos(bot.a) * 1; bot.y -= Math.sin(bot.a) * 1; if (--bot.t <= 0) { bot.mode = 'turn'; bot.t = 15; mark([9]); st.textContent = '↪️ ألف يمين'; } }
    else if (bot.mode === 'turn') { bot.a += Math.PI / 2 / 15; if (--bot.t <= 0) bot.mode = 'go'; }
    else if (bot.mode === 'crash') { bot.x -= Math.cos(bot.a) * 1.2; bot.y -= Math.sin(bot.a) * 1.2; if (--bot.t <= 0) { bot.mode = 'turn'; bot.t = 15; } }
    draw();
  };
  lim.addEventListener('input', () => { sl.querySelector('.nb-lv').textContent = AR(lim.value); drawCode(); });
  sl.querySelector('.go').onclick = e => { if (timer) { clearInterval(timer); timer = null; e.target.textContent = '▶ انطلق'; } else { timer = setInterval(step, 40); e.target.textContent = '⏸ توقف'; } };
  sl.querySelector('.reset').onclick = reset;
  drawCode(); reset();
}

/* ---------- ٤) مشهد الكاميرا: نرسمه بأنفسنا لنقرأ ألوانه ---------- */
function drawScene(ctx, w, h, o = {}) {
  const light = o.light ?? 1, bx = o.bx ?? 0.68, by = o.by ?? 0.62, br = o.br ?? 0.11;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, '#5aa7ff'); sky.addColorStop(1, '#bfe3ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.6);
  const grass = ctx.createLinearGradient(0, h * 0.6, 0, h); grass.addColorStop(0, '#5cbf5f'); grass.addColorStop(1, '#2f8f3f');
  ctx.fillStyle = grass; ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.arc(w * 0.12, h * 0.16, h * 0.08, 0, 7); ctx.fill();            // الشمس
  ctx.fillStyle = '#2E6FD8'; ctx.fillRect(w * 0.12, h * 0.52, w * 0.16, h * 0.22);                                // صندوق أزرق
  ctx.fillStyle = '#1f4fa8'; ctx.fillRect(w * 0.12, h * 0.52, w * 0.16, h * 0.04);
  if (br > 0) {                                                                                                   // الكرة الحمراء مع ظل وإضاءة
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(bx * w, by * h + br * h * 0.95, br * h * 0.9, br * h * 0.22, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(bx * w - br * h * 0.35, by * h - br * h * 0.35, br * h * 0.1, bx * w, by * h, br * h);
    g.addColorStop(0, '#ff8a80'); g.addColorStop(0.35, '#e53935'); g.addColorStop(1, '#8e1c1c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx * w, by * h, br * h, 0, 7); ctx.fill();
  }
  if (light < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - light})`; ctx.fillRect(0, 0, w, h); }                       // الإضاءة الضعيفة
}
/* تحويل لون إلى HSV بنفس مقياس OpenCV (اللون ٠–١٨٠، والباقي ٠–٢٥٥) */
function hsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hh = 0;
  if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hh = Math.round(((hh * 60) + 360) % 360 / 2);
  return [hh, mx ? Math.round(d / mx * 255) : 0, mx];
}
const RANGES = {   // نفس جدول COLORS في nabeeh.py
  red: [[[0, 120, 70], [8, 255, 255]], [[170, 120, 70], [180, 255, 255]]],
  yellow: [[[23, 100, 100], [34, 255, 255]]],
  green: [[[40, 70, 50], [85, 255, 255]]],
  blue: [[[95, 120, 50], [128, 255, 255]]],
};
const COLOR_AR = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', blue: 'أزرق' };
const match = (c, [h, s, v]) => RANGES[c].some(([lo, hi]) => h >= lo[0] && h <= hi[0] && s >= lo[1] && s <= hi[1] && v >= lo[2] && v <= hi[2]);

/* أكبر بقعة باللون: نحسب مركزها ونصف قطرها تقريبًا (مثل find_color) */
function findBlob(data, w, h, c, mask) {
  let n = 0, sx = 0, sy = 0, minx = w, maxx = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, on = match(c, hsv(data[i], data[i + 1], data[i + 2]));
    if (mask) { const v = on ? 255 : 0; mask[i] = mask[i + 1] = mask[i + 2] = v; mask[i + 3] = 255; }
    if (on) { n++; sx += x; sy += y; if (x < minx) minx = x; if (x > maxx) maxx = x; }
  }
  if (n < w * h * 0.002) return null;
  const cx = sx / n, cy = sy / n, rad = Math.sqrt(n / Math.PI);
  return { cx, cy, rad, x: Math.round((cx - w / 2) * 200 / w), y: Math.round((cy - h / 2) * 200 / h), size: Math.round(200 * rad / w) };
}

function bindPixels(sl) {
  const cv = sl.querySelector('.nb-pxcv'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const zoom = sl.querySelector('.nb-zoom'), zc = zoom.getContext('2d');
  drawScene(ctx, cv.width, cv.height);
  const show = (x, y) => {
    x = Math.max(4, Math.min(cv.width - 5, Math.round(x))); y = Math.max(4, Math.min(cv.height - 5, Math.round(y)));
    const d = ctx.getImageData(x - 4, y - 4, 9, 9).data;
    zc.clearRect(0, 0, zoom.width, zoom.height);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) { const k = (j * 9 + i) * 4;
      zc.fillStyle = `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`; zc.fillRect(i * 40, j * 40, 39, 39); }
    zc.strokeStyle = '#fff'; zc.lineWidth = 4; zc.strokeRect(160, 160, 40, 40);
    const c = (4 * 9 + 4) * 4;
    sl.querySelector('.nb-rgb').innerHTML = `<span class="r">أحمر <b>${AR(d[c])}</b></span><span class="g">أخضر <b>${AR(d[c + 1])}</b></span><span class="b">أزرق <b>${AR(d[c + 2])}</b></span>`;
    const lens = sl.querySelector('.nb-lens'); lens.style.left = (x / cv.width * 100) + '%'; lens.style.top = (y / cv.height * 100) + '%';
  };
  const at = e => { const r = cv.getBoundingClientRect(); show((e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height); };
  cv.addEventListener('pointermove', at); cv.addEventListener('pointerdown', at);
  sl._pxShow = show;
  show(cv.width * 0.68, cv.height * 0.62);
}
const PX_TOUR = [[0.68, 0.6, 'الكرة الحمراء: الأحمر كبير، والأخضر والأزرق صغيران'], [0.5, 0.2, 'السماء: الأزرق هو الأكبر'], [0.5, 0.85, 'العشب: الأخضر هو الأكبر'],
  [0.12, 0.16, 'الشمس الصفراء: أحمر وأخضر معًا يصنعان الأصفر!']];

function bindColor(sl) {
  const cv = sl.querySelector('.nb-ccv'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const mk = sl.querySelector('.nb-mcv'), mctx = mk.getContext('2d');
  let color = 'red', light = 1;
  const run = () => {
    drawScene(ctx, cv.width, cv.height, { light });
    const img = ctx.getImageData(0, 0, cv.width, cv.height), out = mctx.createImageData(cv.width, cv.height);
    const b = findBlob(img.data, cv.width, cv.height, color, out.data);
    mctx.putImageData(out, 0, 0);
    if (b) { [ctx, mctx].forEach(c => { c.strokeStyle = '#F0CC7A'; c.lineWidth = 5; c.beginPath(); c.arc(b.cx, b.cy, b.rad + 6, 0, 7); c.stroke(); }); }
    sl.querySelector('.nb-cres').innerHTML = b ? `✅ <code dir="ltr">Ball(x=${b.x}, size=${b.size})</code> · وجدت ${COLOR_AR[color]}!`
      : `❌ <code dir="ltr">None</code> · لا يوجد ${COLOR_AR[color]} ${light < 0.5 ? '(الإضاءة ضعيفة جدًّا!)' : ''}`;
    sl.querySelectorAll('.nb-cbtn').forEach(x => x.classList.toggle('on', x.dataset.c === color));
  };
  sl.querySelectorAll('.nb-cbtn').forEach(x => x.onclick = () => { color = x.dataset.c; run(); });
  sl.querySelector('input').addEventListener('input', e => { light = +e.target.value / 100; sl.querySelector('.nb-lt').textContent = AR(e.target.value) + '٪'; run(); });
  run();
}

const FOLLOW = `import nabeeh\n\nwhile True:\n    ball = nabeeh.find_color("red")\n    if ball is None:\n        nabeeh.right()\n    elif ball.size > 45:\n        nabeeh.stop()\n    elif ball.x < -25:\n        nabeeh.left()\n    elif ball.x > 25:\n        nabeeh.right()\n    else:\n        nabeeh.forward()`;
function bindFollow(sl) {
  const cv = sl.querySelector('.nb-fcv'), ctx = cv.getContext('2d', { willReadFrequently: true });
  const code = sl.querySelector('.nb-fcode'); code.innerHTML = pyBlock(FOLLOW, 'nb-small');
  let bx = 0.7, by = 0.6, br = 0.1, hidden = false;
  const decide = () => {
    drawScene(ctx, cv.width, cv.height, { bx, by, br: hidden ? 0 : br });
    const img = ctx.getImageData(0, 0, cv.width, cv.height), b = findBlob(img.data, cv.width, cv.height, 'red');
    const W = cv.width;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.setLineDash([12, 10]); ctx.lineWidth = 3;
    [-25, 25].forEach(v => { const x = W / 2 + v * W / 200; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke(); }); ctx.setLineDash([]);
    let lines, act, txt;
    if (!b) { lines = [4, 5, 6]; act = 'right'; txt = 'لا أرى الكرة… ألتفت لأبحث عنها'; }
    else if (b.size > 45) { lines = [4, 7, 8]; act = 'stop'; txt = `الكرة كبيرة (${AR(b.size)} > ٤٥)… وصلت! أتوقف`; }
    else if (b.x < -25) { lines = [4, 9, 10]; act = 'left'; txt = `الكرة على اليسار (x = ${AR(b.x)})… ألف يسارًا`; }
    else if (b.x > 25) { lines = [4, 11, 12]; act = 'right'; txt = `الكرة على اليمين (x = ${AR(b.x)})… ألف يمينًا`; }
    else { lines = [4, 13, 14]; act = 'forward'; txt = `الكرة أمامي (x = ${AR(b.x)})… أمشي نحوها`; }
    if (b) { ctx.strokeStyle = '#F0CC7A'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(b.cx, b.cy, b.rad + 6, 0, 7); ctx.stroke(); }
    code.querySelectorAll('.ln').forEach(l => l.classList.toggle('run', lines.includes(+l.dataset.n)));
    sl.querySelector('.nb-fact').innerHTML = `<span class="nb-fico">${{ right: '↪️', left: '↩️', stop: '⏹️', forward: '⬆️' }[act]}</span>${txt}`;
  };
  const move = e => { const r = cv.getBoundingClientRect(); bx = Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width)); by = Math.min(0.9, Math.max(0.15, (e.clientY - r.top) / r.height)); hidden = false; decide(); };
  let drag = false;
  cv.addEventListener('pointerdown', e => { drag = true; move(e); }); cv.addEventListener('pointermove', e => drag && move(e));
  ['pointerup', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => drag = false));
  sl.querySelector('input').addEventListener('input', e => { br = +e.target.value / 100; hidden = false; decide(); });
  sl.querySelector('.nb-hideb').onclick = () => { hidden = !hidden; decide(); };
  decide();
}

Object.assign(window.DECK_TYPES, {
  echolab: s => `<div class="slide light"><div class="kicker">${s.kicker || '🦇 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2><div class="ix nb-echowrap">${echoHTML()}</div></div>`,
  divider: s => `<div class="slide light"><div class="kicker">${s.kicker || '🛡️ حماية الـ Pi'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2><div class="nb-stage">${dividerSVG}</div></div>`,
  avoidsim: s => `<div class="slide light"><div class="kicker">${s.kicker || '🎮 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>${avoidHTML()}</div>`,
  pixels: s => `<div class="slide light"><div class="kicker">${s.kicker || '🔍 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="nb-px ix"><div class="nb-pxwrap"><canvas class="nb-pxcv" width="640" height="400"></canvas><div class="nb-lens"></div></div>
        <div class="nb-pxside"><canvas class="nb-zoom" width="360" height="360"></canvas><div class="nb-rgb"></div><div class="nb-pxnote">حرّك الماوس فوق الصورة 👆</div></div></div>
      ${PX_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,
  colorlab: s => `<div class="slide light"><div class="kicker">${s.kicker || '🎨 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="nb-color ix">
        <div class="nb-cview"><div><small>ما تراه الكاميرا</small><canvas class="nb-ccv" width="480" height="300"></canvas></div>
          <div><small>ما يراه نبيه بعد البحث عن اللون</small><canvas class="nb-mcv" width="480" height="300"></canvas></div></div>
        <div class="nb-cside">
          <div class="nb-cbtns">${Object.entries(COLOR_AR).map(([k, v]) => `<button class="nb-cbtn ${k}" data-c="${k}">${v}</button>`).join('')}</div>
          <label class="nb-slider"><span>💡 الإضاءة: <b class="nb-lt">١٠٠٪</b></span><input type="range" min="10" max="100" value="100"></label>
          <div class="nb-cres"></div>
        </div></div></div>`,
  followsim: s => `<div class="slide light"><div class="kicker">${s.kicker || '⚽ جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="nb-follow ix">
        <div class="nb-fview"><canvas class="nb-fcv" width="640" height="400"></canvas>
          <div class="nb-frow"><label class="nb-slider"><span>📏 اقترب من الكرة (حجمها)</span><input type="range" min="4" max="55" value="10"></label>
            <button class="nb-btn ghost nb-hideb">🙈 أخفِ الكرة</button></div>
          <div class="nb-fact"></div></div>
        <div class="codewrap"><div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">07_follow_ball.py</span></div><div class="nb-fcode"></div></div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, { echolab: bindEcho, avoidsim: bindAvoid, pixels: bindPixels, colorlab: bindColor, followsim: bindFollow });

const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (sl && s.t === 'pixels' && step > 0 && sl._pxShow) {
    const [x, y, t] = PX_TOUR[step - 1], cv = sl.querySelector('.nb-pxcv');
    sl._pxShow(x * cv.width, y * cv.height); sl.querySelector('.nb-pxnote').textContent = t;
  }
};

window.NB_SENSE = { hsv, RANGES, findBlob, drawScene, ROOM };
})();
