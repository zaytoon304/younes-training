/* =====================================================================
   «ESP32 للمعلمين ٣ — أكاديمية الروبوت» · النواة + مختبرات السيارة الأولى
   ghero · gparts · gpower · gdiff · gjoy · gsonar
   فيزياء الدفع التفاضلي: سرعة كل عجلة من PWM (منطقة موت ٥٠، أقصى ٦٠ سم/ث) مع قصور محرك ٠٫١٥ ث
   الإحداثيات: المقدمة نحو +x، والزاوية th مع عقارب الساعة (لأن y للأسفل في SVG)، ويسار السيارة = −y في إطارها
   ===================================================================== */
(function () {
const { AR, codeBlock, highlight } = window.ARD;
const { clamp, raf, later, run, cap, st, rng, frame, beep } = window.FZ;

/* ================== النواة المشتركة GZ ================== */
const PX = 4, VMAX = 60, DEAD = 50, WB = 13, TAU = 0.15, SPIN = 0.55;   // SPIN: انزلاق العجلات عند الدوران في المكان
const wv = p => Math.abs(p) < DEAD ? 0 : clamp(p, -255, 255) / 255 * VMAX;
const VB = '0 0 1000 860', AW = 1000, AH = 860;
// خطوة فيزيائية: L وR قيم PWM، وk معامل ضعف المحرك الأيمن (للمعايرة)
function stepCar(c, L, R, dt, kR = 1) {
  const a = Math.min(1, dt / TAU);
  c.vl += (wv(L) - c.vl) * a; c.vr += (wv(R) * kR - c.vr) * a;
  const v = (c.vl + c.vr) / 2, opp = Math.sign(c.vl) !== Math.sign(c.vr) && c.vl && c.vr;
  const w = (c.vl - c.vr) / WB * (opp ? SPIN : 0.8);
  c.th += w * dt; c.x += Math.cos(c.th) * v * PX * dt; c.y += Math.sin(c.th) * v * PX * dt;
  return c;
}
const newCar = (x, y, th = 0) => ({ x, y, th, vl: 0, vr: 0 });
const place = (el, c, s = 1) => el.setAttribute('transform', `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${(c.th * 180 / Math.PI).toFixed(1)}) scale(${s})`);
// نقطة في إطار السيارة (fx للأمام، fy لليمين) ← إحداثيات المشهد
const at = (c, fx, fy) => [c.x + Math.cos(c.th) * fx - Math.sin(c.th) * fy, c.y + Math.sin(c.th) * fx + Math.cos(c.th) * fy];

/* سيارة من أعلى: o = { sonar, ir, blade, color, id } */
const carSvg = (o = {}) => `<g ${o.id ? `id="${o.id}"` : ''}>
  <rect x="-30" y="-46" width="30" height="14" rx="5" fill="#1b1b1b"/><rect x="-30" y="32" width="30" height="14" rx="5" fill="#1b1b1b"/>
  <g class="gzwl"><rect x="-27" y="-45" width="24" height="12" rx="3" fill="#3a3a3a"/></g><g class="gzwr"><rect x="-27" y="33" width="24" height="12" rx="3" fill="#3a3a3a"/></g>
  <rect x="-46" y="-33" width="88" height="66" rx="14" fill="${o.color || '#e0a526'}" stroke="#6b4a08" stroke-width="3"/>
  <rect x="-36" y="-22" width="30" height="44" rx="4" fill="#1f2a44"/><rect x="-30" y="-18" width="18" height="12" rx="2" fill="#c9ccd3"/>
  <rect x="0" y="-20" width="26" height="40" rx="4" fill="#c0392b"/>${[0, 1, 2].map(i => `<rect x="${4 + i * 7}" y="-17" width="3" height="20" fill="#7b241c"/>`).join('')}
  <circle cx="-40" cy="0" r="6" fill="#9aa1b3"/>
  ${o.sonar ? `<rect x="34" y="-20" width="12" height="40" rx="3" fill="#2b6fc0"/><circle cx="44" cy="-10" r="6" fill="#dfe3ea"/><circle cx="44" cy="10" r="6" fill="#dfe3ea"/>` : ''}
  ${o.ir ? [-14, 0, 14].map((y, i) => `<circle cx="40" cy="${y}" r="5.5" class="gzir" id="${o.id || 'c'}ir${i}" fill="#3b4256" stroke="#9aa1b3" stroke-width="2"/>`).join('') : ''}
  ${o.blade ? `<path d="M42 -36 L56 -30 L56 30 L42 36 Z" fill="#9aa1b3" stroke="#5b6383" stroke-width="2"/>` : ''}
</g>`;
// خلفية بلاط وأسوار
const floor = (id = 'gzf', inner = '') => `<defs><pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f4f0e6"/><path d="M40 0 L0 0 0 40" fill="none" stroke="#e3dccb" stroke-width="2"/></pattern></defs>
  <rect width="${AW}" height="${AH}" fill="url(#${id})"/><rect x="6" y="6" width="${AW - 12}" height="${AH - 12}" rx="14" fill="none" stroke="#8a6d47" stroke-width="10"/>${inner}`;
// مسارات خط مغلقة (معادلات بارامترية) + كاشف بكسلات على لوحة رسم مخفية
const TRACKS = [
  { n: '⭕ بيضاوي', f: t => [500 + 360 * Math.cos(t), 430 + 290 * Math.sin(t)] },
  { n: '∞ ثمانية', f: t => [500 + 380 * Math.sin(t), 430 + 260 * Math.sin(t) * Math.cos(t) * 1.9] },
  { n: '〰️ متعرج', f: t => [500 + 370 * Math.cos(t) + 40 * Math.cos(5 * t), 430 + 290 * Math.sin(t) + 60 * Math.sin(4 * t)] },
];
const trackPts = (ti, n = 900) => Array.from({ length: n }, (_, i) => TRACKS[ti].f(i / n * Math.PI * 2));
const pathD = P => 'M' + P.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z';
function lineMap(P, w = 22) {
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH; const g = cv.getContext('2d');
  g.lineWidth = w; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
  const D = g.getImageData(0, 0, AW, AH).data;
  return (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < AW && y < AH && D[(y * AW + x) * 4 + 3] > 100 ? 1 : 0; };
}
// شعاع الحساس: يتوقف عند الصناديق أو الأسوار. يعيد المسافة بالسنتيمتر من مقدمة الحساس
function sonarCm(c, boxes, max = 200) {
  let best = max;
  [-0.13, 0, 0.13].forEach(da => { const a = c.th + da, [sx, sy] = at(c, 46, 0);
    for (let d = 0; d < max * PX; d += 3) { const x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d;
      if (x < 12 || y < 12 || x > AW - 12 || y > AH - 12 || boxes.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh)) { best = Math.min(best, d / PX); break; } } });
  return best;
}
const hitsBox = (c, boxes) => [[46, 0], [40, -30], [40, 30], [-44, -30], [-44, 30]].some(([fx, fy]) => { const [x, y] = at(c, fx, fy);
  return x < 12 || y < 12 || x > AW - 12 || y > AH - 12 || boxes.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh); });
// سحب صناديق داخل SVG
function dragBoxes(svg, boxes, onMove) {
  let drag = null;
  const pt = e => { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return [(e.clientX - r.left) * vb.width / r.width, (e.clientY - r.top) * vb.height / r.height]; };
  svg.querySelectorAll('.gzbox').forEach((g, i) => g.addEventListener('pointerdown', e => { const [px, py] = pt(e); drag = { i, dx: px - boxes[i][0], dy: py - boxes[i][1] }; svg.setPointerCapture(e.pointerId); e.stopPropagation(); }));
  svg.addEventListener('pointermove', e => { if (!drag) return; const [px, py] = pt(e), b = boxes[drag.i];
    b[0] = clamp(px - drag.dx, 14, AW - 14 - b[2]); b[1] = clamp(py - drag.dy, 14, AH - 14 - b[3]);
    const r = svg.querySelectorAll('.gzbox')[drag.i].querySelector('rect'); r.setAttribute('x', b[0]); r.setAttribute('y', b[1]); onMove && onMove(); });
  svg.addEventListener('pointerup', () => drag = null);
}
const boxSvg = boxes => boxes.map(([x, y, w, h]) => `<g class="gzbox"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#a77a43" stroke="#5c4424" stroke-width="5"/></g>`).join('');
const trail = (pts, c, max = 260) => { pts.push([c.x, c.y]); if (pts.length > max) pts.shift(); return 'M' + pts.map(p => p.map(v => v.toFixed(0)).join(' ')).join(' L'); };
const sel = (sl, attr, v) => sl.querySelectorAll(`[data-${attr}]`).forEach(b => b.classList.toggle('on', b.dataset[attr] == v));
const f0 = v => Math.round(v);
// منفّذ «تسلسل» يحاكي سطور delay: كل خطوة { l, r, t (ث)، ln (أسطر الكود)، tx (وصف)، end (دالة) }
function Seq() { let Q = [], cur = null, t = 0;
  return { push(...s) { Q.push(...s); }, busy() { return !!cur || Q.length > 0; }, clear() { Q = []; cur = null; },
    step(dt) { if (!cur) { cur = Q.shift(); t = 0; if (!cur) return null; cur.begin && cur.begin(); } t += dt;
      const out = cur; if (cur.until ? cur.until() || (cur.t && t >= cur.t) : t >= cur.t) { cur.end && cur.end(); cur = null; } return out; } };
}
window.GZ = { PX, VMAX, DEAD, WB, wv, VB, AW, AH, stepCar, newCar, place, at, carSvg, floor, TRACKS, trackPts, pathD, lineMap, sonarCm, hitsBox, dragBoxes, boxSvg, trail, sel, f0, Seq };

/* ================== الأكواد المعروضة في المختبرات ================== */
const C = {
  diff: `void motors(int l, int r) { … }   // المحور ٢
void loop() {
  for (int i = 0; i < 4; i++) {
    forward(1000);
    stopCar(200);
    right(TURN90);
    stopCar(200);
  }
  stopCar(3000);
}`,
  joy: `server.on("/j", [] {
  jx = server.arg("x").toInt();
  jy = server.arg("y").toInt();
  lastCmd = millis();
});
void loop() {
  server.handleClient();
  if (millis() - lastCmd > 400) { jx = 0; jy = 0; }
  int l = (jy + jx) * 255 / 100;
  int r = (jy - jx) * 255 / 100;
  motors(l, r);
}`,
  sonar: `void loop() {
  float cm = readCm();
  if (cm > 60) motors(SPEED, SPEED);
  else if (cm > 25) {
    int s = map(cm, 25, 60, 120, SPEED);
    motors(s, s);
  } else {
    motors(-SPEED, -SPEED); delay(250);
    motors(SPEED, -SPEED); delay(TURN45);
    float right = readCm();
    motors(-SPEED, SPEED); delay(TURN45 * 2);
    float left = readCm();
    if (right > left) { motors(SPEED, -SPEED); delay(TURN45 * 2); }
  }
}`,
};
window.GZ.C = C;

/* ================== السلّم: سبعة روبوتات ================== */
const LADDER = [
  ['🚗', 'السيارة العادية', 'محركان + درايفر + بطارية'], ['🦇', 'السيارة التي ترى', '+ ألتراسونك'], ['〰️', 'متتبع الخط', '+ ٣ حساسات خط'],
  ['🔀', 'الروبوت المدمج', 'خط + عوائق'], ['🥋', 'السومو', '+ حافة + زر BOOT'], ['🧠', 'السيارة المتكاملة', 'كل شيء + الجوال'], ['⚽', 'روبوت كرة القدم', '٣ محركات أومني'],
];
const heroSvg = () => `<svg viewBox="0 0 1600 600">
  <rect width="1600" height="600" fill="#0b1230"/>
  ${Array.from({ length: 50 }, (_, i) => `<circle cx="${(i * 331) % 1600}" cy="${(i * 97) % 600}" r="${i % 3 ? 1 : 2}" fill="#7fa6ff" opacity=".35"/>`).join('')}
  ${LADDER.map(([e, n, p], i) => { const x = 40 + i * 222, y = 430 - i * 56; return `<g class="ghst" id="ghs${i}">
    <rect x="${x}" y="${y}" width="210" height="${600 - y}" rx="14" fill="#18224a" stroke="#2e4288" stroke-width="3"/>
    <text x="${x + 105}" y="${y + 52}" text-anchor="middle" font-size="44">${e}</text>
    <text x="${x + 105}" y="${y + 92}" text-anchor="middle" class="fza" style="font-size:22px">${n}</text>
    <text x="${x + 105}" y="${y + 122}" text-anchor="middle" class="fza ghp" style="font-size:17px">${p}</text>
    <text x="${x + 18}" y="${y + 30}" class="fzt" style="font-size:18px;fill:#8d9bd0">${i < 6 ? '🤖' + AR(i + 1) : '⚽٧'}</text></g>`; }).join('')}
  <g id="ghcar">${carSvg({ sonar: true, ir: true, id: 'ghc' })}</g>
  <g id="ghkiwi" opacity="0"><circle r="46" fill="#1f7a45" stroke="#9be7b4" stroke-width="4"/>${[60, -60, 180].map(a => `<rect x="-9" y="-58" width="18" height="24" rx="4" fill="#dfe3ea" transform="rotate(${90 - a})"/>`).join('')}<text y="12" text-anchor="middle" font-size="34">⚽</text></g>
</svg>`;

/* ================== المكونات واحدًا واحدًا ================== */
const PARTS = [
  { k: 'esp', s: 'ESP32', i: '🧠', n: 'ESP32 DevKit', what: 'الدماغ: يقرأ الحساسات ويقرر ويرسل الأوامر… ويصنع شبكة واي فاي للجوال', spec: '٣٫٣ فولت · ٢٤٠ ميغاهرتز · واي فاي + بلوتوث', pins: 'كل الأطراف', from: '🤖١' },
  { k: 'drv', s: 'الدرايفر', i: '🟥', n: 'الدرايفر L298N', what: 'العضلات: يأخذ أوامر ESP32 الضعيفة ويشغّل المحركين بقوة البطارية', spec: 'جسرا H · حتى ٢ أمبير لكل محرك · يفقد نحو ٢ فولت', pins: 'ENA 14 · IN1 16 · IN2 17 · ENB 32 · IN3 21 · IN4 22', from: '🤖١' },
  { k: 'mot', s: 'المحركان', i: '🟡', n: 'محركا TT بالتروس', what: 'يحوّلان الكهرباء إلى دوران قوي بطيء بفضل علبة التروس', spec: '٣–٦ فولت · تروس ١:٤٨ · نحو ٢٠٠ دورة/دقيقة', pins: 'OUT1/OUT2 و OUT3/OUT4 على الدرايفر', from: '🤖١' },
  { k: 'whl', s: 'العجلات', i: '⚫', n: 'العجلتان + العجلة الحرة', what: 'عجلتان تدفعان وعجلة كروية ثالثة تحفظ التوازن', spec: 'قطر ٦٥ مم · محيط ٢٠٫٤ سم', pins: '—', from: '🤖١' },
  { k: 'bat', s: 'البطاريات', i: '🔋', n: 'بطاريتا 18650 + مفتاح', what: 'خزان الطاقة: بطاريتان على التوالي = ٧٫٤ فولت للمحركات واللوحة', spec: '٣٫٧ فولت لكل خلية (٤٫٢ مشحونة) · ٢٠٠٠–٣٠٠٠ مللي أمبير·ساعة', pins: 'الدرايفر 12V و GND', from: '🤖١' },
  { k: 'son', s: 'الألتراسونك', i: '🦇', n: 'حساس المسافة HC-SR04', what: 'العين: يرسل صوتًا لا نسمعه ويقيس زمن الصدى', spec: '٢ سم إلى ٤ م · يعمل على ٥ فولت · Echo يحتاج مقسم جهد', pins: 'Trig 26 · Echo 27', from: '🤖٢' },
  { k: 'ir', s: 'حساسات الخط', i: '〰️', n: '٣ حساسات خط TCRT5000', what: 'تنظر إلى الأرض: الأبيض يعكس الأشعة تحت الحمراء والأسود يمتصها', spec: 'مسافة ٢–١٥ مم عن الأرض · مقاومة زرقاء لضبط الحساسية', pins: '34 · 35 · 39 (مداخل فقط)', from: '🤖٣' },
  { k: 'boot', s: 'BOOT والليد', i: '🔘', n: 'زر BOOT والليد الأزرق', what: 'موجودان على اللوحة أصلًا: زر لبدء نزال السومو وليد يعدّ الثواني', spec: 'BOOT = GPIO0 · الليد = GPIO2', pins: '0 · 2', from: '🤖٥' },
  { k: 'kiwi', s: 'روبوت الكرة', i: '⚽', n: '٣ محركات + عجلات أومني + درايفر ثانٍ', what: 'قاعدة ثلاثية تتحرك في كل اتجاه دون أن تستدير', spec: 'المحركات على ١٢٠° · اثنان أمام وواحد خلف', pins: 'M3: EN 25 · IN 33 · IN 19', from: '⚽٧' },
];
const partsSvg = () => `<svg viewBox="0 0 1000 860">
  <rect width="1000" height="860" fill="#0f1733"/>
  <defs><pattern id="gpg" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 L0 0 0 30" fill="none" stroke="rgba(126,226,168,.12)" stroke-width="1.5"/></pattern></defs><rect width="1000" height="860" fill="url(#gpg)"/>
  <g class="gpx" data-k="whl"><rect x="250" y="250" width="60" height="180" rx="18" fill="#222"/><rect x="690" y="250" width="60" height="180" rx="18" fill="#222"/>${Array.from({ length: 8 }, (_, i) => `<line x1="256" x2="304" y1="${266 + i * 20}" y2="${266 + i * 20}" stroke="#555" stroke-width="5"/><line x1="696" x2="744" y1="${266 + i * 20}" y2="${266 + i * 20}" stroke="#555" stroke-width="5"/>`).join('')}<circle cx="500" cy="740" r="30" fill="#9aa1b3"/><circle cx="500" cy="740" r="14" fill="#dfe3ea"/></g>
  <rect x="320" y="150" width="360" height="640" rx="40" fill="#3a2a10" stroke="#e0a526" stroke-width="5" opacity=".9"/>
  <g class="gpx" data-k="mot"><rect x="310" y="305" width="110" height="70" rx="10" fill="#f2c94c"/><rect x="580" y="305" width="110" height="70" rx="10" fill="#f2c94c"/><text x="365" y="348" text-anchor="middle" class="fzt" style="fill:#5a4410">TT</text><text x="635" y="348" text-anchor="middle" class="fzt" style="fill:#5a4410">TT</text></g>
  <g class="gpx" data-k="esp"><rect x="420" y="200" width="160" height="230" rx="12" fill="#1f2a44" stroke="#5a6aa0" stroke-width="4"/><rect x="455" y="214" width="90" height="34" rx="5" fill="#c9ccd3"/><text x="500" y="237" text-anchor="middle" class="fzt" style="fill:#1b2340;font-size:17px">ESP32</text>${Array.from({ length: 10 }, (_, i) => `<circle cx="430" cy="${270 + i * 15}" r="4" fill="#f0cc7a"/><circle cx="570" cy="${270 + i * 15}" r="4" fill="#f0cc7a"/>`).join('')}</g>
  <g class="gpx" data-k="boot"><rect x="456" y="398" width="24" height="18" rx="4" fill="#dfe3ea"/><rect x="520" y="398" width="24" height="18" rx="4" fill="#dfe3ea"/><circle cx="500" cy="380" r="7" fill="#4fc3f7"/></g>
  <g class="gpx" data-k="drv"><rect x="420" y="450" width="160" height="150" rx="10" fill="#c0392b"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${440 + i * 18}" y="466" width="9" height="80" fill="#7b241c"/>`).join('')}<text x="500" y="585" text-anchor="middle" class="fzt" style="font-size:18px">L298N</text></g>
  <g class="gpx" data-k="bat"><rect x="400" y="620" width="200" height="90" rx="12" fill="#2d6a4f"/><rect x="414" y="632" width="172" height="30" rx="15" fill="#52b788"/><rect x="414" y="670" width="172" height="30" rx="15" fill="#52b788"/><rect x="610" y="640" width="40" height="50" rx="8" fill="#555"/><rect x="620" y="648" width="20" height="18" rx="4" fill="#ffcf4a"/></g>
  <g class="gpx" data-k="son"><rect x="400" y="70" width="200" height="66" rx="8" fill="#2b6fc0"/><circle cx="445" cy="103" r="25" fill="#dfe3ea"/><circle cx="555" cy="103" r="25" fill="#dfe3ea"/></g>
  <g class="gpx" data-k="ir">${[400, 500, 600].map(x => `<rect x="${x - 26}" y="150" width="52" height="34" rx="5" fill="#1b5e20"/><circle cx="${x - 10}" cy="167" r="7" fill="#90caf9"/><circle cx="${x + 10}" cy="167" r="7" fill="#263238"/>`).join('')}</g>
  <g class="gpx" data-k="kiwi" transform="translate(860 140)"><circle r="78" fill="#14532d" stroke="#9be7b4" stroke-width="4"/>${[60, -60, 180].map(a => `<g transform="rotate(${-a})"><rect x="54" y="-26" width="22" height="52" rx="6" fill="#dfe3ea"/>${[-16, -5, 6, 17].map(y => `<rect x="50" y="${y - 3}" width="30" height="6" rx="3" fill="#5b6383"/>`).join('')}</g>`).join('')}<text y="14" text-anchor="middle" font-size="40">⚽</text></g>
  <text x="860" y="260" text-anchor="middle" class="fza" style="font-size:20px;fill:#9be7b4">قريبًا: المحور ١٠</text>
</svg>`;

/* ================== مسار الطاقة ================== */
const BAT = [['🔋 مشحونة', 8.4], ['🔋 عادية', 7.4], ['🪫 ضعيفة', 6.2]];

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  ghero: s => `<div class="slide dark fzhero ghero">
    <div class="kicker">${s.kicker}</div><h1 class="htitle">${s.title}</h1>
    <div class="fzhw">${heroSvg()}</div></div>`,

  gparts: s => frame(s, 'gparts', '0 0 1000 860', partsSvg().replace(/^<svg[^>]*>|<\/svg>$/g, ''),
    `<div class="gpbtns">${PARTS.map(p => `<button class="fzb" data-p="${p.k}">${p.i} ${p.s}</button>`).join('')}</div>
    <div class="gpcard"><div class="gpi" id="gpi">👆</div><h3 id="gpn">انقر أي قطعة</h3><p id="gpw">في الصورة أو في الأزرار: لكل قطعة وظيفة ومواصفات وأطراف</p>
      <div class="gprow"><b>📐 المواصفات</b><span id="gps">—</span></div><div class="gprow"><b>📍 الأطراف</b><span id="gpp" dir="ltr">—</span></div><div class="gprow"><b>🪜 تدخل في</b><span id="gpf">—</span></div></div>
    <div class="fzcap">ابدأ من «الدماغ» ثم «العضلات» ثم «الحواس»: هكذا نبني كل روبوت في الدورة</div>`),

  gpower: s => frame(s, 'gpower', '0 0 1000 860', `
      <rect width="1000" height="860" fill="#0f1733"/>
      <g transform="translate(70 120)"><rect width="220" height="150" rx="16" fill="#2d6a4f"/><rect x="16" y="20" width="188" height="46" rx="23" fill="#52b788"/><rect x="16" y="84" width="188" height="46" rx="23" fill="#52b788"/>
        <text x="110" y="52" text-anchor="middle" class="fzt" style="fill:#0b3d2a" id="pc1">4.2V</text><text x="110" y="116" text-anchor="middle" class="fzt" style="fill:#0b3d2a" id="pc2">4.2V</text>
        <text x="110" y="190" text-anchor="middle" class="fza">بطاريتان على التوالي</text></g>
      <g transform="translate(360 150)" id="psw" style="cursor:pointer"><rect width="90" height="90" rx="14" fill="#333"/><rect id="pswk" x="22" y="14" width="46" height="30" rx="8" fill="#ffcf4a"/><text x="45" y="125" text-anchor="middle" class="fza">المفتاح</text></g>
      <path d="M290 195 H360" class="fzw r" id="pw1"/><path d="M450 195 H560" class="fzw r" id="pw2"/>
      <g transform="translate(560 90)"><rect width="300" height="260" rx="16" fill="#c0392b"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${30 + i * 26}" y="20" width="12" height="110" fill="#7b241c"/>`).join('')}
        <text x="150" y="165" text-anchor="middle" class="fzt" style="font-size:24px">L298N</text>
        <text x="20" y="215" class="fzt" style="font-size:17px">12V</text><text x="120" y="215" class="fzt" style="font-size:17px">GND</text><text x="220" y="215" class="fzt" style="font-size:17px">5V</text>
        <g id="pjmp" style="cursor:pointer"><rect x="210" y="226" width="56" height="24" rx="5" fill="#111"/><text x="238" y="244" text-anchor="middle" class="fzt" style="font-size:13px" id="pjt">5V-EN</text></g></g>
      <path d="M780 350 V520 H600" class="fzw y" id="pw3"/>
      <g transform="translate(380 470)"><rect width="220" height="250" rx="16" fill="#1f2a44" stroke="#5a6aa0" stroke-width="4" id="pesp"/><rect x="60" y="18" width="100" height="40" rx="6" fill="#c9ccd3"/><text x="110" y="45" text-anchor="middle" class="fzt" style="fill:#1b2340">ESP32</text>
        <text x="200" y="56" text-anchor="end" class="fzt" style="font-size:16px">VIN</text><circle id="ppw" cx="40" cy="220" r="12" fill="#3a1010"/><text id="pst" x="110" y="150" text-anchor="middle" class="fza" style="font-size:24px">مطفأة</text></g>
      ${[0, 1].map(i => `<g transform="translate(${140 + i * 640} 640)"><circle r="70" fill="#222" stroke="#555" stroke-width="6"/><g class="pmot" id="pm${i}">${[0, 60, 120].map(a => `<rect x="-6" y="-62" width="12" height="124" rx="6" fill="#666" transform="rotate(${a})"/>`).join('')}</g><circle r="18" fill="#f2c94c"/><text y="105" text-anchor="middle" class="fza" style="font-size:19px">${i ? 'المحرك الأيمن' : 'المحرك الأيسر'}</text></g>`).join('')}
      <path d="M600 350 C 600 450, 210 470, 160 570" class="fzw o" id="pw4"/><path d="M820 350 C 820 450, 790 500, 780 570" class="fzw o" id="pw5"/>
      <text x="500" y="60" text-anchor="middle" class="fza" style="font-size:26px" id="pmsg">اضغط المفتاح</text>`,
    `<div class="fzrow"><label>البطارية</label>${BAT.map(([t], i) => `<button class="fzb${i === 1 ? ' on' : ''}" data-b="${i}">${t}</button>`).join('')}</div>
    <div class="fzrow"><label>الجسر</label><button class="fzb on" data-a="jmp">🔗 5V-EN موضوع</button><button class="fzb" data-a="usb">🔌 كابل USB</button></div>
    <div class="fzrow"><label>المحركات</label><button class="fzb go" data-a="go">⚡ انطلق بأقصى سرعة</button></div>
    <div class="fzstats s4">${st('pvb', 'البطارية')}${st('pvm', 'المحرك')}${st('pv5', '5V')}${st('pvl', 'ESP32')}</div>
    <div class="gpexp" id="pexp"></div><div class="fzcap"></div>`),

  gdiff: s => frame(s, 'gdiff', VB, `${floor('gdf')}
      <text x="880" y="90" font-size="56" id="dflag">🏁</text><path id="dtr" fill="none" stroke="#2b6fc0" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/>
      <g id="dcar">${carSvg()}</g><g id="dghost" opacity=".18"></g>`,
    `<div class="fzrow">${[['⬆️ أمام', 200, 200], ['↻ في المكان', 200, -200], ['↪ منعطف', 200, 110], ['↩ محور', 0, 200], ['⏹️ قف', 0, 0]].map(([t, l, r]) => `<button class="fzb" data-l="${l}" data-r="${r}">${t}</button>`).join('')}</div>
    ${rng('dl', 'motors(<b>l</b>)', -255, 255, 0, 5)}${rng('dr', 'motors(… <b>r</b>)', -255, 255, 0, 5)}
    <div class="fzrow"><button class="fzb go" data-a="sq">⬜ نفّذ المربع</button>${rng('dt', 'TURN90', 200, 600, 380, 10).replace('<div class="fzrow">', '').replace(/<\/div>$/, '')}</div>
    <div class="fzrow"><button class="fzb" data-a="weak">🪫 الأيمن أضعف ٨٪</button>${rng('dtr2', 'trimL', -30, 0, 0, 1).replace('<div class="fzrow">', '').replace(/<\/div>$/, '')}<button class="fzb" data-a="rs">↺</button></div>
    <div class="fzstats s4">${st('dvl', 'عجلة يسرى سم/ث')}${st('dvr', 'عجلة يمنى سم/ث')}${st('dv', 'السرعة')}${st('dw', 'الدوران °/ث')}</div>
    ${codeBlock(C.diff)}<div class="fzcap"></div>`),

  gjoy: s => frame(s, 'gjoy', VB, `${floor('gjf')}
      ${boxSvg([[380, 300, 110, 110], [700, 560, 120, 100], [200, 620, 100, 90]])}
      <path id="jtr" fill="none" stroke="#2b6fc0" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/><g id="jcar">${carSvg({ color: '#3fa7d6' })}</g>
      <g id="jlost" opacity="0"><rect x="250" y="40" width="500" height="70" rx="18" fill="#962d22"/><text x="500" y="88" text-anchor="middle" class="fza" style="font-size:28px">📵 انقطع الجوال!</text></g>`,
    `<div class="gjrow"><svg viewBox="0 0 300 300" class="gjpad ix" id="jpad"><circle cx="150" cy="150" r="140" fill="#2e4288" stroke="#8d9bd0" stroke-width="8"/><line x1="150" y1="20" x2="150" y2="280" stroke="#5a6aa0" stroke-width="2"/><line x1="20" y1="150" x2="280" y2="150" stroke="#5a6aa0" stroke-width="2"/>
        <text x="150" y="44" text-anchor="middle" class="fzt" style="font-size:18px">y+</text><text x="268" y="156" text-anchor="middle" class="fzt" style="font-size:18px">x+</text><circle id="jk" cx="150" cy="150" r="52" fill="#f0cc7a"/></svg>
      <div class="gjside"><div class="fzstats">${st('jx', 'jx', 0)}${st('jy', 'jy', 0)}</div><div class="fzstats">${st('jl', 'l', 0)}${st('jr', 'r', 0)}</div>
        <button class="fzb warn" data-a="cut">📵 اقطع الاتصال</button><button class="fzb on" data-a="fs">🛡️ الأمان (400ms): يعمل</button></div></div>
    ${codeBlock(C.joy)}<div class="fzcap"></div>`),

  gsonar: s => frame(s, 'gsonar', VB, `${floor('gsf')}
      ${boxSvg([[440, 120, 120, 120], [720, 430, 140, 120], [180, 520, 120, 140], [470, 640, 100, 100]])}
      <path id="sbeam" fill="#4fc3f7" opacity=".2"/><line id="sray" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="6 6"/>
      <path id="str" fill="none" stroke="#2b6fc0" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/><g id="scar">${carSvg({ sonar: true })}</g>
      <g id="sbang" opacity="0"><rect x="300" y="40" width="400" height="70" rx="18" fill="#962d22"/><text x="500" y="88" text-anchor="middle" class="fza" style="font-size:28px">💥 اصطدام!</text></g>`,
    `<div class="fzrow"><button class="fzb go" data-a="go">▶ شغّل</button><button class="fzb" data-a="rs">↺ من جديد</button><span class="rl" style="font-size:17px;font-weight:800;color:var(--muted)">اسحب الصناديق أمامها!</span></div>
    ${rng('ssp', 'SPEED', 120, 255, 200, 5)}
    <div class="fzrow"><label>المنطقة</label><button class="fzb on" data-a="slow">🐢 منطقة الحذر ٢٥–٦٠</button><button class="fzb" data-a="look">👀 تنظر قبل أن تستدير</button></div>
    <div class="fzstats">${st('scm', 'readCm()')}${st('sv', 'motors')}${st('sst', 'الحالة')}</div>
    ${codeBlock(C.sonar)}<div class="fzcap"></div>`),
});

/* ---------- الربط ---------- */
Object.assign(window.DECK_BIND, {
  ghero(sl) {
    const car = sl.querySelector('#ghcar'), kiwi = sl.querySelector('#ghkiwi'); let t = 0;
    raf(dt => { t += dt; const k = (t / 1.6) % 8.5, i = Math.min(6, Math.floor(k));
      sl.querySelectorAll('.ghst').forEach((g, j) => g.classList.toggle('on', j <= i));
      const x = 40 + i * 222 + 105, y = 430 - i * 56 - 50, bob = Math.sin(t * 6) * 3;
      if (i < 6) { car.setAttribute('transform', `translate(${x} ${y + bob}) scale(.8)`); car.setAttribute('opacity', 1); kiwi.setAttribute('opacity', 0); }
      else { car.setAttribute('opacity', 0); kiwi.setAttribute('opacity', 1); kiwi.setAttribute('transform', `translate(${x} ${y - 10}) rotate(${t * 90})`); }
      sl.querySelectorAll('.ghc ir, #ghcir0, #ghcir1, #ghcir2').forEach(e => e.setAttribute('fill', i >= 2 ? '#46d68c' : '#3b4256'));
    });
  },

  gparts(sl) {
    const show = k => { const p = PARTS.find(x => x.k === k); if (!p) return;
      sl.querySelector('#gpi').textContent = p.i; sl.querySelector('#gpn').textContent = p.n; sl.querySelector('#gpw').textContent = p.what;
      sl.querySelector('#gps').textContent = p.spec; sl.querySelector('#gpp').textContent = p.pins; sl.querySelector('#gpf').textContent = p.from;
      sl.querySelectorAll('.gpx').forEach(g => g.classList.toggle('on', g.dataset.k === k)); sel(sl, 'p', k);
      sl.querySelector('.gparts .fzsc').classList.add('pick');
      cap(sl, `<b>${p.n}</b> تظهر أول مرة في الروبوت ${p.from}. ${p.from === '🤖١' ? 'هذه من «الأساس» الذي لا يتغير حتى آخر روبوت' : 'قطعة تُضاف فوق السيارة العادية: لا نفك شيئًا مما بنيناه'}`, 'ok'); };
    sl.querySelectorAll('.gpx').forEach(g => g.onclick = e => { e.stopPropagation(); show(g.dataset.k); });
    sl.querySelectorAll('[data-p]').forEach(b => b.onclick = () => show(b.dataset.p));
  },

  gpower(sl) {
    const R = id => sl.querySelector('#' + id); let bat = 1, on = false, jmp = true, usb = false, go = false, reset = 0, ang = 0;
    sl.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { bat = +b.dataset.b; sel(sl, 'b', bat); });
    const tog = (a, v, t1, t0) => { const b = sl.querySelector(`[data-a=${a}]`); b.classList.toggle('on', v); if (t1) b.textContent = v ? t1 : t0; };
    R('psw').onclick = () => { on = !on; };
    sl.querySelector('[data-a=jmp]').onclick = R('pjmp').onclick = () => { jmp = !jmp; tog('jmp', jmp, '🔗 5V-EN موضوع', '⛓️‍💥 5V-EN منزوع'); };
    sl.querySelector('[data-a=usb]').onclick = () => { usb = !usb; tog('usb', usb); };
    sl.querySelector('[data-a=go]').onclick = () => { go = !go; tog('go', go, '⏹️ أوقف المحركات', '⚡ انطلق بأقصى سرعة'); if (go) reset = 0; };
    raf(dt => {
      const vb = BAT[bat][1], vin = on ? vb - (go ? 0.6 + (bat === 2 ? 0.9 : 0) : 0) : 0;   // الحِمل يخفض جهد البطارية (والضعيفة أكثر)
      const vm = on && go ? Math.max(0, vin - 2) : 0, v5 = on && jmp && vin > 6.5 ? 5 : on && jmp && vin > 0 ? Math.max(0, vin - 1.6) : 0;
      let vesp = usb ? 5 : v5, brown = !usb && on && jmp && go && v5 < 4.6;
      if (brown) { reset += dt; } else reset = 0;
      const alive = vesp >= 4.6 && !(brown && reset % 0.8 < 0.35);
      R('pc1').textContent = (vb / 2).toFixed(1) + 'V'; R('pc2').textContent = (vb / 2).toFixed(1) + 'V';
      R('pswk').setAttribute('x', on ? 22 : 22); R('pswk').setAttribute('y', on ? 46 : 14); R('pswk').setAttribute('fill', on ? '#46d68c' : '#ffcf4a');
      ['pw1'].forEach(i => R(i).setAttribute('class', 'fzw ' + (vb ? 'r' : 'k'))); R('pw2').setAttribute('class', 'fzw ' + (on ? 'r' : 'k'));
      R('pw3').setAttribute('class', 'fzw ' + (v5 ? 'y' : 'k')); R('pw4').setAttribute('class', 'fzw ' + (vm ? 'o' : 'k')); R('pw5').setAttribute('class', 'fzw ' + (vm ? 'o' : 'k'));
      R('pjmp').setAttribute('opacity', jmp ? 1 : .25);
      ang += vm * 60 * dt; [0, 1].forEach(i => R('pm' + i).setAttribute('transform', `rotate(${ang * (i ? -1 : 1)})`));
      R('ppw').setAttribute('fill', alive ? '#ff3b3b' : '#3a1010'); R('pst').textContent = alive ? (go ? '✅ تعمل' : '✅ جاهزة') : brown ? '🔄 تعيد التشغيل!' : 'مطفأة';
      R('pesp').setAttribute('stroke', brown ? '#ff5a5a' : '#5a6aa0');
      R('pvb').textContent = vin ? vin.toFixed(1) + 'V' : '0'; R('pvm').textContent = vm ? vm.toFixed(1) + 'V' : '0'; R('pv5').textContent = v5 ? v5.toFixed(1) + 'V' : '0'; R('pvl').textContent = alive ? '3.3V' : '0';
      R('pmsg').textContent = !on ? 'اضغط المفتاح في الصورة' : brown ? '⚠️ هبوط الجهد: الدماغ يُطفأ ويعود!' : go ? 'المحركات تأخذ ما بقي بعد خسارة الدرايفر' : 'كل شيء جاهز';
      R('pexp').innerHTML = `<b>الحساب:</b> البطارية ${vin.toFixed(1)} − خسارة L298N ≈ ٢ فولت = <b>${vm.toFixed(1)} فولت</b> للمحرك`;
      cap(sl, !on ? (usb ? 'كابل USB يشغّل ESP32 وحده، لكن المحركات لا تأخذ طاقتها من USB أبدًا: تحتاج البطارية' : 'المفتاح يفصل البطارية عن كل شيء: أطفئه قبل أي تعديل في الأسلاك') :
        brown ? 'بطارية ضعيفة + محركات بأقصى سرعة = الجهد يهبط تحت ما يحتاجه منظّم ٥ فولت، فيُعيد ESP32 التشغيل (Brownout). الحل: اشحن البطارية، أو ابدأ الحركة تدريجيًا' :
        !jmp && !usb ? 'نزعت جسر 5V-EN: المنظّم لا يعطي ٥ فولت فتبقى اللوحة مطفأة. ضعه إن كانت البطارية ١٢ فولت أو أقل' :
        go ? `البطارية ${vin.toFixed(1)} فولت لكن المحرك يأخذ ${vm.toFixed(1)} فقط: L298N يحوّل نحو ٢ فولت إلى حرارة. لذلك نستعمل خليتين (٧٫٤) لا خلية واحدة` : 'البطارية ← المفتاح ← L298N ← (١) المحركات و(٢) منظّم ٥ فولت ← VIN في ESP32. مسار واحد يشغّل كل السيارة',
        brown || (!jmp && !usb && on) ? 'bad' : 'ok');
    });
  },

  gdiff(sl) {
    const R = id => sl.querySelector('#' + id), car = R('dcar'), l = R('dl'), r = R('dr'), tr = R('dtr'), seq = Seq();
    let c = newCar(160, 700, -Math.PI / 2), pts = [], weak = false, mode = 'man', cmd = [0, 0], line = [];
    const reset = () => { c = newCar(160, 700, -Math.PI / 2); pts = []; seq.clear(); mode = 'man'; cmd = [0, 0]; l.value = r.value = 0; };
    const setLR = (a, b) => { seq.clear(); mode = 'man'; l.value = a; r.value = b; };
    sl.querySelectorAll('[data-l]').forEach(b => b.onclick = () => setLR(+b.dataset.l, +b.dataset.r));
    l.oninput = r.oninput = () => { seq.clear(); mode = 'man'; };
    sl.querySelector('[data-a=rs]').onclick = reset;
    sl.querySelector('[data-a=weak]').onclick = e => { weak = !weak; e.target.classList.toggle('on', weak); };
    const S = 200;
    sl.querySelector('[data-a=sq]').onclick = () => { reset(); mode = 'sq'; const T = +R('dt').value / 1000;
      for (let i = 0; i < 4; i++) seq.push({ l: S, r: S, t: 1, ln: [4] }, { l: 0, r: 0, t: .2, ln: [5] }, { l: S, r: -S, t: T, ln: [6] }, { l: 0, r: 0, t: .2, ln: [7] });
      seq.push({ l: 0, r: 0, t: 3, ln: [9] }); };
    raf(dt => {
      let L = +l.value, Rr = +r.value, ln = [];
      if (mode === 'sq') { const s = seq.step(dt); if (s) { const tl = +R('dtr2').value; L = s.l ? s.l + tl : 0; Rr = s.r; ln = s.ln; } else { mode = 'man'; L = Rr = 0; } }
      else ln = L || Rr ? [1] : [];
      R('dt').previousElementSibling.innerHTML = `TURN90 = ${R('dt').value}`; R('dtr2').previousElementSibling.innerHTML = `trimL = ${R('dtr2').value}`;
      l.previousElementSibling.innerHTML = `l = <b>${l.value}</b>`; r.previousElementSibling.innerHTML = `r = <b>${r.value}</b>`;
      stepCar(c, L, Rr, dt, weak ? 0.92 : 1);
      if (c.x < 40 || c.x > 960 || c.y < 40 || c.y > 820) { c.x = clamp(c.x, 40, 960); c.y = clamp(c.y, 40, 820); }
      place(car, c); tr.setAttribute('d', trail(pts, c, 600));
      const v = (c.vl + c.vr) / 2, w = (c.vl - c.vr) / WB * 57.3;
      R('dvl').textContent = c.vl.toFixed(0); R('dvr').textContent = c.vr.toFixed(0); R('dv').textContent = v.toFixed(0); R('dw').textContent = w.toFixed(0);
      run(sl, ln);
      const dead = (L && Math.abs(L) < DEAD) || (Rr && Math.abs(Rr) < DEAD);
      cap(sl, mode === 'sq' ? (weak && +R('dtr2').value === 0 ? 'المحرك الأيمن أضعف قليلًا (يحدث في كل سيارة حقيقية!) فلا يُغلق المربع. حرّك trimL إلى نحو −١٦ وأعد المربع' : `مربع بأربعة أضلاع: «أمام ثم يمين» × ٤. لو لم يُغلق المربع فاضبط TURN90 حتى تصبح الاستدارة ٩٠° تمامًا`) :
        dead ? `القيمة أقل من ${DEAD}: المحرك يطنّ ولا يدور (منطقة الموت). ابدأ من ٨٠ فما فوق` :
        !L && !Rr ? 'جرّب الأزرار أو المنزلقين: سرعة العجلتين وحدها تصنع كل الحركات، بلا مقود' :
        L === Rr ? 'العجلتان بالسرعة نفسها ← خط مستقيم' : L === -Rr ? 'عجلة للأمام وأخرى للخلف ← تدور في مكانها مثل الدبابة' :
        `الفرق بين العجلتين (${L} و${Rr}) يصنع منعطفًا: كلما كبر الفرق ضاق المنعطف. ${L > Rr ? 'اليسرى أسرع ← تنعطف يمينًا' : 'اليمنى أسرع ← تنعطف يسارًا'}`, dead || (mode === 'sq' && weak && +R('dtr2').value === 0) ? 'bad' : 'ok');
    });
  },

  gjoy(sl) {
    const R = id => sl.querySelector('#' + id), pad = R('jpad'), knob = R('jk'), boxes = [[380, 300, 110, 110], [700, 560, 120, 100], [200, 620, 100, 90]];
    let c = newCar(150, 200, 0), pts = [], jx = 0, jy = 0, on = false, cut = false, fs = true, last = 0, hold = [0, 0], now = 0;
    const mv = e => { const r = pad.getBoundingClientRect(); let dx = (e.clientX - r.left) * 300 / r.width - 150, dy = (e.clientY - r.top) * 300 / r.height - 150; const d = Math.hypot(dx, dy); if (d > 100) { dx *= 100 / d; dy *= 100 / d; }
      knob.setAttribute('cx', 150 + dx); knob.setAttribute('cy', 150 + dy); jx = Math.round(dx); jy = Math.round(-dy); };
    pad.onpointerdown = e => { on = true; pad.setPointerCapture(e.pointerId); mv(e); e.stopPropagation(); };
    pad.onpointermove = e => on && mv(e);
    pad.onpointerup = () => { on = false; jx = jy = 0; knob.setAttribute('cx', 150); knob.setAttribute('cy', 150); };
    sl.querySelector('[data-a=cut]').onclick = e => { cut = !cut; e.target.classList.toggle('on', cut); e.target.textContent = cut ? '📶 أعد الاتصال' : '📵 اقطع الاتصال'; if (cut) hold = [jx || 60, jy || 80]; };
    sl.querySelector('[data-a=fs]').onclick = e => { fs = !fs; e.target.classList.toggle('on', fs); e.target.textContent = fs ? '🛡️ الأمان (400ms): يعمل' : '⚠️ الأمان: معطّل'; };
    raf(dt => { now += dt;
      // ما يصل إلى السيارة: الجوال يرسل كل ١٠٠ مللي ثانية ما لم ينقطع
      let ex, ey; if (!cut) { last = now; ex = jx; ey = jy; } else { ex = hold[0]; ey = hold[1]; }
      const lost = now - last > 0.4;
      if (lost && fs) { ex = 0; ey = 0; }
      const L = Math.round((ey + ex) * 255 / 100), Rr = Math.round((ey - ex) * 255 / 100);
      stepCar(c, clamp(L, -255, 255), clamp(Rr, -255, 255), dt);
      if (hitsBox(c, boxes)) { c.x -= Math.cos(c.th) * 6 * Math.sign(c.vl + c.vr || 1); c.y -= Math.sin(c.th) * 6 * Math.sign(c.vl + c.vr || 1); c.vl = c.vr = 0; }
      place(R('jcar'), c); R('jtr').setAttribute('d', trail(pts, c, 400));
      R('jx').textContent = ex; R('jy').textContent = ey; R('jl').textContent = clamp(L, -255, 255); R('jr').textContent = clamp(Rr, -255, 255);
      R('jlost').setAttribute('opacity', cut ? 1 : 0);
      run(sl, lost && fs ? [7] : cut ? [6, 8, 9, 10] : [2, 3, 4, 8, 9, 10]);
      cap(sl, cut && !fs ? '⚠️ بلا أمان: آخر أمر وصل بقي «للأمام» إلى الأبد… السيارة هاربة! لهذا نكتب السطر ٧' :
        cut ? 'الجوال صامت أكثر من ٤٠٠ مللي ثانية ← السطر ٧ يصفّر العصا ← السيارة تقف وحدها. هذا «الأمان عند الفشل» (Failsafe)' :
        !jx && !jy ? 'اسحب الدائرة الصفراء: الأعلى = jy (أمام وخلف)، والجانب = jx (انعطاف)' :
        `المزج: l = (${ey} + ${ex}) × ٢٥٥ ÷ ١٠٠ = <b>${clamp(L, -255, 255)}</b> · r = (${ey} − ${ex}) × ٢٥٥ ÷ ١٠٠ = <b>${clamp(Rr, -255, 255)}</b>`, cut && !fs ? 'bad' : cut ? 'ok' : '');
    });
  },

  gsonar(sl) {
    const R = id => sl.querySelector('#' + id), svg = sl.querySelector('.fzsc svg'), boxes = [[440, 120, 120, 120], [720, 430, 140, 120], [180, 520, 120, 140], [470, 640, 100, 100]];
    const seq = Seq(); let c, pts, go = false, slow = true, look = false, st = 'قف', ln = [], cmd = [0, 0], right = 0, left = 0, bang = 0, cm = 200;
    const reset = () => { c = newCar(150, 200, 0); pts = []; seq.clear(); st = 'جاهز'; cmd = [0, 0]; bang = 0; };
    reset(); dragBoxes(svg, boxes);
    sl.querySelector('[data-a=go]').onclick = e => { go = !go; e.target.classList.toggle('on', go); e.target.textContent = go ? '⏸ أوقف' : '▶ شغّل'; };
    sl.querySelector('[data-a=rs]').onclick = reset;
    sl.querySelector('[data-a=slow]').onclick = e => { slow = !slow; e.target.classList.toggle('on', slow); };
    sl.querySelector('[data-a=look]').onclick = e => { look = !look; e.target.classList.toggle('on', look); };
    raf(dt => {
      const S = +R('ssp').value, T45 = 0.19; cm = sonarCm(c, boxes);
      if (go) {
        const s = seq.step(dt);
        if (s) { cmd = [s.l, s.r]; ln = s.ln; st = s.tx; }
        else if (cm > 60) { cmd = [S, S]; ln = [3]; st = '🟢 مفتوح'; }
        else if (cm > 25 && slow) { const v = Math.round(120 + (cm - 25) / 35 * (S - 120)); cmd = [v, v]; ln = [4, 5, 6]; st = '🟡 حذر'; }
        else if (cm > 25) { cmd = [S, S]; ln = [3]; st = '🟢 مفتوح'; }
        else if (look) seq.push({ l: -S, r: -S, t: .25, ln: [8], tx: '⬇ تراجع' }, { l: S, r: -S, t: T45, ln: [9], tx: '👉 انظر يمينًا' },
            { l: 0, r: 0, t: .1, ln: [10], tx: '📏 قِس اليمين', end: () => right = sonarCm(c, boxes) }, { l: -S, r: S, t: T45 * 2, ln: [11], tx: '👈 انظر يسارًا' },
            { l: 0, r: 0, t: .1, ln: [12], tx: '📏 قِس اليسار', end: () => { left = sonarCm(c, boxes); if (right > left) seq.push({ l: S, r: -S, t: T45 * 2, ln: [13], tx: '↪ عُد لليمين' }); } });
        else seq.push({ l: -S, r: -S, t: .25, ln: [8], tx: '⬇ تراجع' }, { l: S, r: -S, t: T45 * 2, ln: [9], tx: '↻ استدر يمينًا' });
      } else { cmd = [0, 0]; ln = []; }
      const prev = { ...c }; stepCar(c, cmd[0], cmd[1], dt);
      if (hitsBox(c, boxes)) { Object.assign(c, prev, { vl: 0, vr: 0 }); bang = 1; } else bang = Math.max(0, bang - dt);
      place(R('scar'), c); R('str').setAttribute('d', trail(pts, c, 500));
      const [sx, sy] = at(c, 46, 0), L = Math.min(cm, 200) * PX, a1 = c.th - .13, a2 = c.th + .13;
      R('sray').setAttribute('x1', sx); R('sray').setAttribute('y1', sy); R('sray').setAttribute('x2', sx + Math.cos(c.th) * L); R('sray').setAttribute('y2', sy + Math.sin(c.th) * L);
      R('sbeam').setAttribute('d', `M${sx} ${sy} L${sx + Math.cos(a1) * L} ${sy + Math.sin(a1) * L} L${sx + Math.cos(a2) * L} ${sy + Math.sin(a2) * L} Z`);
      R('sbeam').setAttribute('fill', cm < 25 ? '#ff5a5a' : cm < 60 ? '#ffcf4a' : '#4fc3f7'); R('sbang').setAttribute('opacity', bang > 0 ? 1 : 0);
      R('scm').textContent = cm >= 200 ? '200+' : cm.toFixed(0); R('sv').textContent = `${cmd[0]},${cmd[1]}`; R('sst').textContent = go ? st : '⏸';
      run(sl, ln);
      cap(sl, !go ? 'اضغط «شغّل» ثم اسحب صندوقًا أمام السيارة: راقب لون الشعاع (أزرق ← أصفر ← أحمر) والسطر الذي يضيء' :
        bang ? 'اصطدمت! غالبًا السرعة عالية جدًا فلم تكفِ المسافة للتوقف. خفّض SPEED أو فعّل منطقة الحذر' :
        st.includes('حذر') ? `على ${cm.toFixed(0)} سم: <code>map</code> تحوّل المسافة إلى سرعة بين ١٢٠ و${S}… تتباطأ بنعومة كالسائق الماهر` :
        st.includes('قِس') ? `يقيس… اليمين ${right ? right.toFixed(0) : '?'} سم · اليسار ${left ? left.toFixed(0) : '?'} سم ← يختار الأوسع` :
        seq.busy() ? `${st}: تسلسل حركات بـ delay. لاحظ أن السيارة «عمياء» أثناء delay` : 'الطريق مفتوح: سرعة كاملة، والحساس يقيس ٣٠ مرة في الثانية', bang ? 'bad' : 'ok');
    });
  },
});
})();
