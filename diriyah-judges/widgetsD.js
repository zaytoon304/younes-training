/* =====================================================================
   أدوات عرض «نبض الدرعية ولياليها» أمام لجنة التحكيم
   الأنواع: dyhero · dysystem · dycurtain · dyir · dyrgb · dynow · dydecision · dyevolve
   كل مشهد متحرك يُرسم بدالة draw(t) من الزمن وحده، فيمكن تصويره إطارًا إطارًا
   (window.DY_ANIM) ليصير صورة متحركة GIF داخل البوربوينت.
   البادئة dy لكل الأصناف حتى لا تتصادم مع أنماط الدورات الأخرى.
   ===================================================================== */
(function () {
const L = x => '⁦' + x + '⁩';   // عزل نص لاتيني داخل جملة عربية
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

/* ---------- حقائق المشروع من الكود الفعلي (smart-heritage-house) ---------- */
const ST = [
  { n: 'الطريف التاريخي', s: 'جذور الدولة السعودية الأولى', ir: 18, led: 25, ch: [2, 1, 0], trk: 2, x: 1470 },
  { n: 'حياة الناس في الدرعية', s: 'أسواق عامرة وحِرف تقليدية', ir: 19, led: 26, ch: [5, 4, 3], trk: 3, x: 1045 },
  { n: 'حماية التراث', s: 'كيف نحافظ عليه للأجيال؟', ir: 23, led: 27, ch: [8, 7, 6], trk: 4, x: 620 },
];
const BTN = [
  { n: 'الترحيب', c: '#f2c230', pin: 33, trk: 1, r: 'أهلًا بكم في ليالي الدرعية' },
  { n: 'التوعية', c: '#2e9e6b', pin: 26, trk: 5, r: 'نعرّف الناس بقيمة الدرعية' },
  { n: 'المشاركة', c: '#2f6fd0', pin: 27, trk: 6, r: 'كل زائر شريك في حمايتها' },
  { n: 'الابتكار', c: '#d64545', pin: 25, trk: 7, r: 'التقنية تحرس التراث' },
];
const TRACKS = ['الترحيب (تلقائي بعد ١٠ ث)', 'محطة الطريف', 'محطة حياة الناس', 'محطة حماية التراث', 'نتيجة التوعية', 'نتيجة المشاركة', 'نتيجة الابتكار', 'الخاتمة'];
const HOLD = 12;                 // HOLD_DURATION_MS = 12000
const HUE_MS = 15;               // rainbowHue + 1 كل 15 مللي ثانية

/* ---------- أدوات رسم عامة ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1);
const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
// نفس حساب setRGBHue في الكود (أعداد صحيحة)
function hueRGB(h) {
  h = ((Math.floor(h) % 360) + 360) % 360;
  const region = Math.floor(h / 60), rem = Math.floor((h % 60) * 255 / 60), F = 4095;
  const rising = rem * Math.floor(F / 255), falling = F - rising;
  return [[F, rising, 0], [falling, F, 0], [0, F, rising], [0, falling, F], [rising, 0, F], [F, 0, falling]][region].concat(region);
}
const css = ([r, g, b]) => `rgb(${Math.round(r / 16)},${Math.round(g / 16)},${Math.round(b / 16)})`;

const DEFS = `<defs>
  <linearGradient id="dyCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe29a" stop-opacity=".85"/><stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/></linearGradient>
  <radialGradient id="dyGlow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".4" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="dyMud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a868"/><stop offset="1" stop-color="#a8743f"/></linearGradient>
  <linearGradient id="dyMud2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98348"/><stop offset="1" stop-color="#8f5f30"/></linearGradient>
  <linearGradient id="dyCurt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a0d16"/><stop offset=".5" stop-color="#6b1a26"/><stop offset="1" stop-color="#3a0d16"/></linearGradient>
  <linearGradient id="dySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a1c"/><stop offset="1" stop-color="#18203f"/></linearGradient>
  <pattern id="dyFold" width="46" height="10" patternUnits="userSpaceOnUse"><rect width="46" height="10" fill="url(#dyCurt)"/></pattern>
</defs>`;
const stars = (n, w, h) => Array.from({ length: n }, (_, i) => `<circle cx="${(i * 397 + 53) % w}" cy="${(i * 131) % h + 8}" r="${i % 4 ? 1.3 : 2.2}" fill="#fff" opacity="${.3 + (i % 5) / 10}"/>`).join('');

/* القصر النجدي (الطريف): كتلة طينية بشرفات مسننة ونوافذ مثلثة */
function palace(cx, by, k = 1) {
  const w = 230 * k, h = 165 * k, x = cx - w / 2, y = by - h;
  const teeth = n => Array.from({ length: n }, (_, i) => `<path d="M${x + i * w / n + 4} ${y} l${w / n / 2 - 4} -${16 * k} l${w / n / 2 - 4} ${16 * k}z" fill="#c99556"/>`).join('');
  const tri = (tx, ty) => `<path d="M${tx} ${ty} l${11 * k} -${16 * k} l${11 * k} ${16 * k}z" fill="#3b2412"/>`;
  return `<g><rect x="${x - 60 * k}" y="${by - 105 * k}" width="${70 * k}" height="${105 * k}" fill="url(#dyMud2)"/>
    <rect x="${x + w - 10 * k}" y="${by - 215 * k}" width="${62 * k}" height="${215 * k}" fill="url(#dyMud2)"/>
    ${Array.from({ length: 3 }, (_, i) => `<path d="M${x + w - 6 * k + i * 19 * k} ${by - 215 * k} l${8 * k} -${13 * k} l${8 * k} ${13 * k}z" fill="#b98348"/>`).join('')}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dyMud)"/>${teeth(9)}
    ${[0, 1, 2].map(i => tri(x + 40 * k + i * 62 * k, y + 50 * k)).join('')}
    ${[0, 1, 2, 3].map(i => `<rect x="${x + 30 * k + i * 50 * k}" y="${y + 80 * k}" width="${10 * k}" height="${16 * k}" fill="#3b2412"/>`).join('')}
    <path d="M${cx - 22 * k} ${by} v-${50 * k} q${22 * k} -${22 * k} ${44 * k} 0 v${50 * k}z" fill="#4a2c14"/>
    <rect x="${x + w + 8 * k}" y="${by - 170 * k}" width="${9 * k}" height="${14 * k}" fill="#3b2412"/><rect x="${x + w + 28 * k}" y="${by - 120 * k}" width="${9 * k}" height="${14 * k}" fill="#3b2412"/></g>`;
}
/* حياة الناس: بيوت وسوق بمظلة ونخلة وجرار */
function market(cx, by, k = 1) {
  const house = (x, w, h) => `<rect x="${x}" y="${by - h}" width="${w}" height="${h}" fill="url(#dyMud)"/>
    ${Array.from({ length: Math.floor(w / 22) }, (_, i) => `<rect x="${x + 4 + i * 22}" y="${by - h - 9}" width="12" height="9" fill="#c99556"/>`).join('')}
    <rect x="${x + w / 2 - 7}" y="${by - h + 26}" width="14" height="18" fill="#3b2412"/>`;
  const palm = (x) => `<path d="M${x} ${by} q-6 -70 4 -140" stroke="#6b4a2a" stroke-width="9" fill="none"/>
    ${[-70, -35, 0, 35, 70, 110, -110].map(a => `<path d="M${x + 4} ${by - 140} q${Math.sin(a * Math.PI / 180) * 40} -30 ${Math.sin(a * Math.PI / 180) * 75} ${Math.cos(a * Math.PI / 180) * 18 + 12}" stroke="#3f7a3a" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')}`;
  return `<g>${house(cx - 170 * k, 110, 150)}${house(cx + 70 * k, 120, 120)}${palm(cx + 210 * k)}
    <path d="M${cx - 80} ${by - 98} h150 l22 32 h-194z" fill="#b5462e"/><path d="M${cx - 80} ${by - 98} h150 l22 32 h-194z" fill="none" stroke="#7e2c1c" stroke-width="3" stroke-dasharray="10 12"/>
    <line x1="${cx - 64}" y1="${by - 66}" x2="${cx - 64}" y2="${by}" stroke="#5b3a1c" stroke-width="5"/><line x1="${cx + 76}" y1="${by - 66}" x2="${cx + 76}" y2="${by}" stroke="#5b3a1c" stroke-width="5"/>
    <rect x="${cx - 60}" y="${by - 36}" width="132" height="36" fill="#8a5a2c"/>
    ${[0, 1, 2, 3].map(i => `<ellipse cx="${cx - 40 + i * 32}" cy="${by - 46}" rx="11" ry="12" fill="${['#c76b3a', '#9c4e28', '#d18a4a', '#a8743f'][i]}"/>`).join('')}
    ${person(cx - 120, by, '#e8dcc0', 0, .62)}${person(cx + 110, by, '#c9b28a', 0, .58)}</g>`;
}
/* حماية التراث: سور طيني به شق، ودرع ذهبي، ولوحة سؤال القرار */
function guard(cx, by, k = 1) {
  return `<g><rect x="${cx - 190}" y="${by - 130}" width="380" height="130" fill="url(#dyMud)"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${cx - 190 + i * 29.2} ${by - 130} l14.6 -18 l14.6 18z" fill="#c99556"/>`).join('')}
    <path d="M${cx + 90} ${by - 130} l-14 30 l12 18 l-16 34" stroke="#5a3518" stroke-width="4" fill="none"/>
    <rect x="${cx - 150}" y="${by - 220}" width="70" height="220" fill="url(#dyMud2)"/>
    ${[0, 1].map(i => `<path d="M${cx - 150 + i * 35} ${by - 220} l17.5 -18 l17.5 18z" fill="#b98348"/>`).join('')}
    <path d="M${cx + 10} ${by - 112} h64 v34 q0 34 -32 50 q-32 -16 -32 -50z" fill="#f0cc7a" stroke="#8a611f" stroke-width="4"/>
    <text x="${cx + 42}" y="${by - 66}" class="dyt" style="font-size:34px;fill:#5a3a0a">؟</text></g>`;
}
/* زائر بسيط يمشي (phase يحرك الساقين) */
function person(x, by, col = '#f6e7c9', phase = 0, k = 1) {
  const sw = Math.sin(phase) * 14 * k;
  return `<g transform="translate(${x} ${by})"><line x1="0" y1="${-46 * k}" x2="${sw}" y2="0" stroke="${col}" stroke-width="${9 * k}" stroke-linecap="round"/>
    <line x1="0" y1="${-46 * k}" x2="${-sw}" y2="0" stroke="${col}" stroke-width="${9 * k}" stroke-linecap="round"/>
    <path d="M${-17 * k} ${-46 * k} q0 ${-62 * k} ${17 * k} ${-62 * k} q${17 * k} 0 ${17 * k} ${62 * k}z" fill="${col}"/>
    <circle cy="${-122 * k}" r="${15 * k}" fill="${col}"/></g>`;
}
/* لوحة ESP32 صغيرة */
function esp(x, y, w, h, lbl, on) {
  return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10" fill="#14324f" stroke="${on ? '#7ee2a8' : '#3a5a7a'}" stroke-width="${on ? 5 : 3}"/>
    <rect x="${w / 2 - 32}" y="16" width="64" height="44" rx="4" fill="#1f2a36" stroke="#9aa8b8" stroke-width="2"/><text x="${w / 2}" y="44" class="dyt" style="font-size:15px;fill:#cfd8e3">ESP32</text>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${8 + i * (w - 16) / 9}" y="${h - 9}" width="6" height="9" fill="#d9ae4b"/>`).join('')}
    <circle cx="${w - 16}" cy="16" r="6" fill="${on ? '#7ee2a8' : '#34465a'}"/>
    <text x="${w / 2}" y="${h - 22}" class="dyt" style="font-size:17px;fill:#f0cc7a">${lbl}</text></g>`;
}
function speaker(x, y, on, t, k = 1) {
  const w = (i) => on ? (.25 + .75 * ((Math.sin(t * 7 - i) + 1) / 2)) : .12;
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-18" y="-16" width="16" height="32" fill="#c9cfe6"/><path d="M-2 -16 l24 -20 v72 l-24 -20z" fill="#c9cfe6"/>
    ${[0, 1, 2].map(i => `<path d="M${32 + i * 14} -${18 + i * 9} q${12 + i * 5} ${18 + i * 9} 0 ${36 + i * 18}" stroke="#f0cc7a" stroke-width="5" fill="none" opacity="${w(i)}" stroke-linecap="round"/>`).join('')}</g>`;
}
function irMod(x, y, hit, k = 1) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-30" y="-14" width="60" height="28" rx="5" fill="#1d5fa8" stroke="#9ec5f2" stroke-width="2"/>
    <circle cx="-12" cy="0" r="7" fill="#dfe6ef"/><circle cx="12" cy="0" r="7" fill="#222"/>
    <circle cx="24" cy="-8" r="3.5" fill="${hit ? '#ff4d4d' : '#4a2020'}"/></g>`;
}
/* الستارة: frac 0 مغلقة … 1 مفتوحة بالكامل */
function curtain(x0, x1, y0, y1, frac) {
  const half = (x1 - x0) / 2, w = Math.max(28, half * (1 - frac));
  const panel = (x, w2, flip) => `<rect x="${x}" y="${y0}" width="${w2}" height="${y1 - y0}" fill="url(#dyFold)"/>
    ${Array.from({ length: Math.max(2, Math.floor(w2 / 46)) }, (_, i) => `<line x1="${x + (i + .5) * w2 / Math.max(2, Math.floor(w2 / 46))}" y1="${y0}" x2="${x + (i + .5) * w2 / Math.max(2, Math.floor(w2 / 46))}" y2="${y1}" stroke="#1d050a" stroke-width="5" opacity=".55"/>`).join('')}
    <rect x="${flip ? x : x + w2 - 8}" y="${y0}" width="8" height="${y1 - y0}" fill="#d9ae4b" opacity=".75"/>`;
  return panel(x0, w, false) + panel(x1 - w, w, true) + `<rect x="${x0 - 10}" y="${y0 - 16}" width="${x1 - x0 + 20}" height="22" rx="6" fill="#2a1a0c"/>`;
}

/* ---------- الديوراما الكاملة (المشهد البطل) ---------- */
// الحالة الكاملة للعرض عند الزمن t (دورة ٤٠ ث)، تُحسب من t وحده
const HP = 40;
function heroState(t) {
  const ph = t % HP, loop = Math.floor(t / HP);
  const cur = ph < 3 ? 0 : ph < 7 ? (ph - 3) / 4 : ph < 36 ? 1 : ph < 39 ? 1 - (ph - 36) / 3 : 0;
  const win = [[9, 15], [17, 23], [25, 31]];
  let st = -1, since = 0;
  win.forEach(([a, b], i) => { if (ph >= a && ph < b) { st = i; since = ph - a; } });
  const path = [[7, 1760], [9, ST[0].x], [15, ST[0].x], [17, ST[1].x], [23, ST[1].x], [25, ST[2].x], [31, ST[2].x], [33, 250], [37, 250], [39.5, -80]];
  let vx = null, walking = false;
  if (ph >= 7 && ph < 39.5) for (let i = 0; i < path.length - 1; i++) {
    const [ta, xa] = path[i], [tb, xb] = path[i + 1];
    if (ph >= ta && ph < tb) { vx = lerp(xa, xb, ease((ph - ta) / (tb - ta))); walking = xa !== xb; }
  }
  const choice = 1 + loop % 3;
  const press = ph >= 33.5 && ph < 34.2;
  const result = ph >= 33.5 && ph < 37;
  let track = 0;
  if (ph < 3) track = 1;
  else if (st >= 0 && since > .8) track = ST[st].trk;
  else if (result) track = BTN[choice].trk;
  const pkt = st >= 0 && since < .8 ? since / .8 : -1;
  let cap;
  if (ph < 3) cap = ['🎙️', 'يبدأ النظام… وبعد ١٠ ثوانٍ من التشغيل يرحّب بالزوار تلقائيًا (' + L('0001.mp3') + ')'];
  else if (ph < 7) cap = ['⚙️', 'المحرك الخطوي 28BYJ-48 يفتح الستارة… والدرعية تنبض في الليل'];
  else if (st >= 0) cap = since < .8 ? ['📡', `حساس IR عند «${ST[st].n}» رأى الزائر ← لوحة الحساسات ترسل ${L("'" + ST[st].trk + "'")} لاسلكيًا عبر ESP-NOW`]
    : ['💡', `المحطة ${AR(st + 1)} · ${ST[st].n}: كشّاف يضيء + ألوان RGB تدور + الراوي يحكي (${L('000' + ST[st].trk + '.mp3')}) · تبقى ${AR(Math.ceil(HOLD - since * 2))} ث`];
  else if (ph >= 31 && ph < 33.5) cap = ['🤔', 'لحظة القرار: كيف نحافظ على تراث الدرعية للأجيال القادمة؟'];
  else if (result) cap = ['🗳️', `الزائر اختار «${BTN[choice].n}» ← يُشغَّل صوت النتيجة ${L('000' + BTN[choice].trk + '.mp3')}: ${BTN[choice].r}`];
  else if (ph >= 36) cap = ['🌙', 'الستارة تُغلق… وتنتظر الزائر التالي'];
  else cap = ['🚶', 'الزائر يتنقل… والنظام يراقب أين يقف'];
  return { ph, cur, st, since, vx, walking, choice, press, result, track, pkt, cap };
}
function heroSVG(t) {
  const S = heroState(t), hue = t * 1000 / HUE_MS;
  const by = 420;
  const stations = ST.map((s, i) => {
    const on = S.st === i, c = css(hueRGB(hue + i * 40));
    const art = i === 0 ? palace(s.x, by) : i === 1 ? market(s.x, by) : guard(s.x, by);
    return `<g>${on ? `<path d="M${s.x - 26} 92 L${s.x - 190} ${by + 10} L${s.x + 190} ${by + 10} L${s.x + 26} 92z" fill="url(#dyCone)"/>` : ''}
      ${art}
      <rect x="${s.x - 210}" y="70" width="420" height="${by - 66}" fill="#050713" opacity="${on ? 0 : .62}"/>
      <g transform="translate(${s.x} 82)"><path d="M-24 -12 h48 l-10 22 h-28z" fill="#2b2b33"/><circle cy="12" r="9" fill="${on ? '#fff3c4' : '#3a3a44'}"/></g>
      ${on ? `<circle cx="${s.x}" cy="${by + 8}" r="46" fill="${c}" opacity=".4"/><circle cx="${s.x}" cy="${by + 8}" r="14" fill="${c}"/>` : `<circle cx="${s.x}" cy="${by + 8}" r="10" fill="#2a2d3a"/>`}
      ${irMod(s.x, by + 52, on && S.since < 2)}
      ${on && S.since < 2 ? `<path d="M${s.x} ${by + 66} L${s.x - 46} 640 L${s.x + 46} 640z" fill="#ff4d4d" opacity=".22"/>` : ''}
      <rect x="${s.x - 120}" y="${by + 82}" width="240" height="44" rx="8" fill="${on ? '#f0cc7a' : '#2a2416'}" stroke="#8a611f" stroke-width="2"/>
      <text x="${s.x}" y="${by + 112}" class="dyt" style="font-size:22px;fill:${on ? '#2a1a05' : '#c9b48a'}">${AR(i + 1)}. ${s.n}</text>
      ${on ? `<rect x="${s.x - 120}" y="${by + 130}" width="${240 * (1 - S.since / 6)}" height="6" rx="3" fill="#7ee2a8"/>` : ''}</g>`;
  }).join('');
  const pk = S.pkt >= 0 ? (() => { const k = S.pkt, x = lerp(115, 290, k), y = 112 - Math.sin(k * Math.PI) * 70;
    return `<g transform="translate(${x} ${y})"><circle r="26" fill="#7ee2a8" opacity=".3"/><rect x="-18" y="-15" width="36" height="30" rx="6" fill="#7ee2a8"/><text y="9" class="dyt" style="font-size:22px;fill:#06301b;font-family:monospace;direction:ltr">'${ST[S.st].trk}'</text></g>`; })() : '';
  const btns = BTN.map((b, i) => { const lit = S.result && S.choice === i, down = S.press && S.choice === i;
    return `<g transform="translate(${70 + i * 80} 470)"><circle r="30" fill="#222" /><circle r="24" cy="${down ? 2 : -3}" fill="${b.c}" opacity="${lit || i === 0 && S.ph < 3 ? 1 : .55}"/>
      ${lit ? `<circle r="40" fill="none" stroke="${b.c}" stroke-width="4" opacity=".8"/>` : ''}<text y="60" class="dyt" style="font-size:16px;fill:#e9e2cf">${b.n}</text></g>`; }).join('');
  return `${DEFS}<rect width="1700" height="720" fill="url(#dySky)"/>${stars(60, 1700, 220)}
    <circle cx="1560" cy="52" r="30" fill="#f6e7b0"/><circle cx="1574" cy="44" r="27" fill="#0b1026"/>
    <rect x="0" y="612" width="1700" height="108" fill="#0e1430"/>
    <rect x="392" y="44" width="1300" height="560" rx="16" fill="#0a0c14" stroke="#2a2416" stroke-width="10"/>
    <rect x="410" y="${by}" width="1264" height="18" fill="#3a2a18"/>
    ${stations}
    ${curtain(410, 1674, 62, by + 18, S.cur)}
    <rect x="16" y="44" width="360" height="560" rx="16" fill="#0f1733" stroke="#2e4288" stroke-width="3"/>
    <text x="196" y="30" class="dyt" style="font-size:18px;fill:#9aa8d8">وحدة التحكم (خلف المجسّم)</text>
    ${esp(30, 60, 170, 120, 'الحساسات والإضاءة', S.st >= 0)}${esp(206, 60, 160, 120, 'الصوت', S.track > 0)}
    <path d="M115 112 Q 202 30 290 112" stroke="#7ee2a8" stroke-width="2" stroke-dasharray="6 8" fill="none" opacity=".5"/>
    <text x="202" y="${S.pkt >= 0 ? 214 : 214}" class="dyt" style="font-size:15px;fill:#7ee2a8">📶 ESP-NOW بلا أسلاك</text>
    ${pk}
    <g transform="translate(110 290)"><rect x="-80" y="-44" width="160" height="88" rx="10" fill="#1b2340" stroke="#3a4a80"/><text y="-14" class="dyt" style="font-size:16px;fill:#9aa8d8">DFPlayer · SD</text>
      <text y="22" class="dyt" style="font-size:26px;fill:${S.track ? '#f0cc7a' : '#56607e'};font-family:monospace;direction:ltr">${S.track ? '000' + S.track + '.mp3' : '— — —'}</text></g>
    ${speaker(262, 290, S.track > 0, t, 1.15)}
    <text x="196" y="398" class="dyt" style="font-size:18px;fill:#f0cc7a">أزرار القرار</text>
    ${btns}
    ${S.vx !== null ? person(S.vx, 712, '#f6e7c9', S.walking ? t * 9 : 0, .85) : ''}`;
}

/* ---------- مخطط المنظومة ---------- */
const SYS = [
  { k: 'ir', i: '👁️', n: 'حساسات IR ×٣', x: 150, y: 120, d: 'تكتشف وقوف الزائر أمام كل محطة. GPIO 18 و19 و23. القراءة LOW تعني «يوجد زائر».' },
  { k: 'a', i: '🧠', n: 'ESP32 · الحساسات والإضاءة', x: 470, y: 250, d: 'يقرأ الحساسات ويقرر المحطة النشطة (الأولوية للمحطة ١)، ويُبقيها ١٢ ثانية حتى يكتمل صوتها، ثم يرسل رقم المقطع لاسلكيًا.' },
  { k: 'pca', i: '🎛️', n: 'PCA9685', x: 150, y: 330, d: 'وحدة PWM بـ ١٦ قناة على I2C (SDA 21، SCL 22، العنوان 0x40). تقود ٣ ليدات RGB بتسع قنوات بدقة ٤٠٩٦ درجة.' },
  { k: 'rgb', i: '🌈', n: 'RGB ×٣', x: 150, y: 500, d: 'ضوء ملوّن يدور بألوان قوس قزح في المحطة النشطة فقط: درجة لونية جديدة كل ١٥ مللي ثانية.' },
  { k: 'spot', i: '🔦', n: 'كشافات ×٣', x: 470, y: 500, d: 'إضاءة بيضاء تكشف مجسّم المحطة النشطة. GPIO 25 و26 و27، والباقي يُطفأ.' },
  { k: 'now', i: '📶', n: 'ESP-NOW', x: 760, y: 250, d: 'اتصال لاسلكي مباشر بين اللوحتين بلا راوتر ولا أسلاك: بايت واحد (\'2\' أو \'3\' أو \'4\') يكفي.' },
  { k: 'b', i: '🧠', n: 'ESP32 · الصوت', x: 1050, y: 250, d: 'يستقبل رقم المحطة فيشغّل مقطعها، ويقرأ أزرار القرار محليًا، ويرحّب تلقائيًا بعد ١٠ ثوانٍ من التشغيل.' },
  { k: 'df', i: '🎵', n: 'DFPlayer + سماعة', x: 1050, y: 500, d: 'مشغّل MP3 من بطاقة SD: ٨ مقاطع مرقّمة 0001…0008. يتصل عبر UART2 (16 و17) مع مقاومة 1kΩ.' },
  { k: 'btn', i: '🔘', n: 'أزرار القرار ×٤', x: 1340, y: 250, d: 'أصفر 33 للترحيب، أخضر 26 للتوعية، أزرق 27 للمشاركة، أحمر 25 للابتكار. INPUT_PULLUP وضغطة واحدة = تشغيل واحد.' },
  { k: 'cur', i: '🎭', n: 'الستارة · 28BYJ-48', x: 1340, y: 500, d: 'محرك خطوي ودرايفر ULN2003 (IN1–IN4 = 14، 27، 26، 25): تتابع نصف الخطوة بثماني حالات، يفتح ١٠ ثوانٍ ويُغلق ١٠.' },
];
const SYS_L = [['ir', 'a'], ['a', 'pca'], ['pca', 'rgb'], ['a', 'spot'], ['a', 'now'], ['now', 'b'], ['b', 'df'], ['btn', 'b']];
const SYS_SEQ = ['ir', 'a', 'spot', 'pca', 'rgb', 'now', 'b', 'df', 'btn', 'cur'];
function sysSVG(t, sel) {
  const P = SYS_SEQ.length * 2.2, auto = SYS_SEQ[Math.floor((t % P) / 2.2)];
  const cur = sel || auto;
  const pos = k => SYS.find(s => s.k === k);
  return `${DEFS}<rect width="1490" height="620" rx="24" fill="#0d1430"/>
    <rect x="40" y="40" width="580" height="560" rx="22" fill="none" stroke="#2e4288" stroke-width="3" stroke-dasharray="10 8"/><text x="330" y="74" class="dyt" style="font-size:22px;fill:#9aa8d8">لوحة ١ · الحساسات والإضاءة</text>
    <rect x="900" y="40" width="300" height="560" rx="22" fill="none" stroke="#2e4288" stroke-width="3" stroke-dasharray="10 8"/><text x="1050" y="74" class="dyt" style="font-size:22px;fill:#9aa8d8">لوحة ٢ · الصوت والقرار</text>
    ${SYS_L.map(([a, b]) => { const A = pos(a), B = pos(b), hot = cur === a || cur === b;
      return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${hot ? '#f0cc7a' : '#34406e'}" stroke-width="${hot ? 7 : 4}" ${a === 'now' || b === 'now' ? 'stroke-dasharray="14 10"' : ''}/>`; }).join('')}
    ${(() => { const k = (t * .6) % 1, A = pos('a'), B = pos('b'); return `<circle cx="${lerp(A.x, B.x, k)}" cy="${A.y - Math.sin(k * Math.PI) * 60}" r="12" fill="#7ee2a8"/>`; })()}
    ${SYS.map(s => `<g class="dynode" data-k="${s.k}" transform="translate(${s.x} ${s.y})" style="cursor:pointer">
      <circle r="${cur === s.k ? 66 : 58}" fill="${cur === s.k ? '#f0cc7a' : '#1b2550'}" stroke="${cur === s.k ? '#fff3c4' : '#4a5a9a'}" stroke-width="4"/>
      <text y="16" class="dyt" style="font-size:46px">${s.i}</text>
      <text y="${cur === s.k ? 100 : 92}" class="dyt" style="font-size:21px;fill:${cur === s.k ? '#f0cc7a' : '#dfe4f5'};font-weight:800">${s.n}</text></g>`).join('')}`;
}

/* ---------- مختبر الستارة ---------- */
const SEQ = [[1, 0, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 1], [1, 0, 0, 1]];
const CP = 29;  // 3 ث جاهز، 10 فتح، 4 انتظار، 10 إغلاق، 2 تم
function curtainState(t, d) {
  const ph = t % CP, mul = 3 / d;    // المدة ثابتة ١٠ ث: التأخير يحدد كم تتحرك فعلًا
  let mode, el = 0, frac, dir = 0;
  if (ph < 3) { mode = 0; frac = 0; }
  else if (ph < 13) { mode = 1; el = ph - 3; frac = el / 10 * mul; dir = 1; }
  else if (ph < 17) { mode = 2; frac = mul; }
  else if (ph < 27) { mode = 3; el = ph - 17; frac = mul * (1 - el / 10); dir = -1; }
  else { mode = 4; frac = 0; }
  const steps = Math.floor(el * 1000 / d);
  const total = mode === 1 || mode === 3 ? steps : mode === 2 ? Math.floor(10000 / d) : 0;
  const vis = Math.floor(ph * 6) % 8, idx = dir > 0 ? vis : dir < 0 ? 7 - vis : -1;
  const ang = (mode === 1 ? steps : mode === 2 ? 10000 / d : mode === 3 ? 10000 / d - steps : 0) / 4096 * 360;
  return { ph, mode, frac, idx, ang, total, steps };
}
const SERIAL = ['SYSTEM READY', 'CURTAIN OPENING...', 'CURTAIN OPEN - DONE', 'CURTAIN CLOSING...', 'CURTAIN CLOSED - DONE'];
function curtainSVG(t, d) {
  const S = curtainState(t, d), f = Math.min(1, S.frac);
  return `${DEFS}<rect width="900" height="560" fill="url(#dySky)"/>${stars(25, 900, 120)}
    <rect x="40" y="40" width="560" height="380" rx="10" fill="#0a0c14" stroke="#2a2416" stroke-width="8"/>
    <g opacity="${.25 + .75 * f}">${palace(320, 400, .9)}</g>
    ${curtain(50, 590, 58, 410, f)}
    ${S.frac > 1.02 ? `<text x="320" y="250" class="dyt" style="font-size:30px;fill:#ff7b7b">⚠️ تجاوزت الستارة نهايتها!</text>` : ''}
    <g transform="translate(750 150)"><circle r="78" fill="#3b6fb0" stroke="#9ec5f2" stroke-width="5"/><circle r="46" fill="#9aa8b8"/>
      <g transform="rotate(${S.ang})"><rect x="-6" y="-60" width="12" height="40" rx="4" fill="#f0cc7a"/><circle r="14" fill="#f0cc7a"/></g>
      <text y="112" class="dyt" style="font-size:22px;fill:#dfe4f5">28BYJ-48</text></g>
    <path d="M672 150 Q 620 120 600 80" stroke="#c9b48a" stroke-width="3" fill="none" stroke-dasharray="6 6"/>
    <g transform="translate(640 330)"><rect width="230" height="150" rx="10" fill="#1d6b3a" stroke="#7ee2a8" stroke-width="3"/>
      <text x="115" y="30" class="dyt" style="font-size:20px;fill:#e9fbe9">ULN2003</text>
      ${[0, 1, 2, 3].map(i => { const on = S.idx >= 0 && SEQ[S.idx][i]; return `<circle cx="${40 + i * 50}" cy="72" r="15" fill="${on ? '#ff4d4d' : '#4a1f1f'}"/>${on ? `<circle cx="${40 + i * 50}" cy="72" r="26" fill="#ff4d4d" opacity=".3"/>` : ''}<text x="${40 + i * 50}" y="112" class="dyt" style="font-size:16px;fill:#e9fbe9;font-family:monospace;direction:ltr">IN${i + 1}</text><text x="${40 + i * 50}" y="134" class="dyt" style="font-size:15px;fill:#b7e8c4;font-family:monospace;direction:ltr">${[14, 27, 26, 25][i]}</text>`; }).join('')}</g>
    <text x="320" y="470" class="dyt" style="font-size:24px;fill:#f0cc7a">${['⏳ جاهز… ٣ ثوانٍ', '▶ تفتح: ١٠ ثوانٍ بالضبط', '⏸ مفتوحة: انتظار ٤ ثوانٍ', '◀ تُغلق: ١٠ ثوانٍ', '✓ أُغلقت'][S.mode]}</text>
    <rect x="50" y="490" width="540" height="14" rx="7" fill="#22284a"/><rect x="50" y="490" width="${540 * Math.min(1, S.frac)}" height="14" rx="7" fill="${S.frac > 1.02 ? '#ff7b7b' : '#7ee2a8'}"/>
    <text x="320" y="540" class="dyt" style="font-size:18px;fill:#9aa8d8">الإضاءات مُبطّأة لترى التتابع: الحقيقي ${AR(Math.round(1000 / d))} خطوة في الثانية</text>`;
}

/* ---------- مختبر الحساسات ---------- */
// محاكاة الخوارزمية نفسها: إن انتهت مدة البقاء → اكتشف → إن تغيّرت المحطة فعّلها وابدأ ١٢ ث
const IRP = 36;
function irPresence(ph) {
  const p = [false, false, false];
  const v1 = ph < 2 ? -1 : ph < 8 ? 1 : ph < 10 ? -1 : 2;     // الزائر الأول: محطة ٢ ثم ٣
  const v2 = ph < 20 ? -1 : 0;                                // الزائر الثاني يصل محطة ١ عند ٢٠ ث
  if (v1 >= 0) p[v1] = true; if (v2 >= 0) p[v2] = true;
  return { p, v1, v2 };
}
function irSim(ph, presFn) {
  let last = -1, hold = 0, log = [], act = 0, holdStart = 0;
  for (let x = 0; x <= ph + 1e-9; x += .05) {
    const p = presFn(x);
    if (x >= hold) {
      const s = p[0] ? 1 : p[1] ? 2 : p[2] ? 3 : 0;
      if (s !== last) { last = s; act = s; if (s) { hold = x + HOLD; holdStart = x; } log.push([x, s, p.slice()]); }
    }
  }
  return { act, hold, holdStart, log };
}
function irSVG(t, man) {
  const ph = man ? null : t % IRP;
  const pr = man ? { p: man.p, v1: -1, v2: -1 } : irPresence(ph);
  const sim = man ? man.sim : irSim(ph, x => irPresence(x).p);
  const now = man ? man.now : ph;
  const xs = [680, 420, 160];
  return `${DEFS}<rect width="840" height="520" fill="url(#dySky)"/>${stars(20, 840, 100)}
    <rect x="20" y="60" width="800" height="250" rx="12" fill="#0a0c14" stroke="#2a2416" stroke-width="6"/>
    ${ST.map((s, i) => { const on = sim.act === i + 1, hit = pr.p[i], c = css(hueRGB(now * 1000 / HUE_MS + i * 40));
      const art = i === 0 ? palace(xs[i], 290, .55) : i === 1 ? `<g transform="translate(${xs[i]} 290) scale(.55) translate(${-xs[i]} -290)">${market(xs[i], 290)}</g>` : `<g transform="translate(${xs[i]} 290) scale(.55) translate(${-xs[i]} -290)">${guard(xs[i], 290)}</g>`;
      return `<g>${on ? `<path d="M${xs[i] - 14} 74 L${xs[i] - 115} 300 L${xs[i] + 115} 300 L${xs[i] + 14} 74z" fill="url(#dyCone)"/>` : ''}${art}
        <rect x="${xs[i] - 128}" y="64" width="256" height="242" fill="#050713" opacity="${on ? 0 : .6}"/>
        ${on ? `<circle cx="${xs[i]}" cy="300" r="12" fill="${c}"/><circle cx="${xs[i]}" cy="300" r="40" fill="${c}" opacity=".3"/>` : ''}
        ${irMod(xs[i], 336, hit, 1.1)}${hit ? `<path d="M${xs[i]} 350 L${xs[i] - 34} 470 L${xs[i] + 34} 470z" fill="#ff4d4d" opacity=".25"/>` : ''}
        <text x="${xs[i]}" y="40" class="dyt" style="font-size:22px;fill:${on ? '#f0cc7a' : '#8f98b8'}">${AR(i + 1)}. ${s.n}</text>
        ${hit ? person(xs[i] + (pr.v2 === i ? -40 : 0), 505, pr.v2 === i ? '#cfe3ff' : '#f6e7c9', 0, .9) : ''}</g>`; }).join('')}`;
}

/* ---------- مختبر الإضاءة ---------- */
function rgbView(t, ms, st, frozen) {
  const hue = frozen != null ? frozen : Math.floor(t * 1000 / ms) % 360;
  const [r, g, b, reg] = hueRGB(hue);
  return { hue, r, g, b, reg };
}
function rgbSVG(V, st) {
  const c = css([V.r, V.g, V.b]);
  const chs = ST[st].ch;    // [R, G, B]
  const vals = {}; vals[chs[0]] = V.r; vals[chs[1]] = V.g; vals[chs[2]] = V.b;
  return `${DEFS}<rect width="820" height="520" fill="#0d1226"/>
    <g transform="translate(250 220)"><circle r="190" fill="${c}" opacity=".18"/><circle r="120" fill="${c}" opacity=".35"/>
      <path d="M-46 40 v-80 a46 46 0 0 1 92 0 v80z" fill="${c}" stroke="#fff" stroke-width="3" opacity=".95"/><rect x="-54" y="40" width="108" height="18" rx="4" fill="#ccc"/>
      ${[-33, -11, 11, 33].map((x, i) => `<line x1="${x}" y1="58" x2="${x}" y2="${i === 3 ? 150 : 135}" stroke="#bbb" stroke-width="5"/>`).join('')}
      <text y="200" class="dyt" style="font-size:22px;fill:#dfe4f5">RGB المحطة ${AR(st + 1)} · مهبط مشترك</text></g>
    <g transform="translate(520 40)"><rect width="270" height="440" rx="14" fill="#1d4f8a" stroke="#9ec5f2" stroke-width="3"/>
      <text x="135" y="36" class="dyt" style="font-size:22px;fill:#fff">PCA9685 · 0x40</text>
      ${Array.from({ length: 12 }, (_, i) => { const v = vals[i], on = v != null;
        return `<g transform="translate(24 ${62 + i * 31})"><text x="0" y="16" style="font:700 15px monospace;direction:ltr;fill:${on ? '#fff' : '#7f9cc4'}">CH${String(i).padStart(2, '0')}</text>
          <rect x="62" y="3" width="150" height="16" rx="8" fill="#123a66"/>${on ? `<rect x="62" y="3" width="${150 * v / 4095}" height="16" rx="8" fill="${i === chs[0] ? '#ff5a5a' : i === chs[1] ? '#3ddc84' : '#4f8dff'}"/>` : ''}
          <text x="222" y="16" style="font:700 13px monospace;direction:ltr;fill:${on ? '#fff' : '#5c7aa6'}">${on ? v : (i >= 9 ? '—' : '0')}</text></g>`; }).join('')}</g>`;
}

/* ---------- مختبر ESP-NOW ---------- */
const NP = 12;
function nowState(t, man) {
  if (man) { const k = (t - man.t0); return { st: man.st, k, ph: k }; }
  const ph = t % NP, st = Math.floor(ph / 4), k = ph % 4;
  return { st, k, ph };
}
function nowSVG(t, S) {
  const flying = S.k < .9, kk = S.k / .9, x = lerp(250, 610, kk), y = 200 - Math.sin(kk * Math.PI) * 120;
  const playing = S.k >= .9 && S.k < 3.8;
  return `${DEFS}<rect width="860" height="520" fill="#0d1226"/>
    ${esp(60, 140, 200, 140, 'الحساسات والإضاءة', true)}${esp(600, 140, 200, 140, 'الصوت', playing)}
    ${ST.map((s, i) => `${irMod(110 + i * 50, 340, S.st === i && S.k < 1.5, .7)}`).join('')}<text x="160" y="390" class="dyt" style="font-size:18px;fill:#9aa8d8">حساسات IR الثلاثة</text>
    <path d="M250 200 Q 430 60 610 200" stroke="#7ee2a8" stroke-width="3" stroke-dasharray="10 10" fill="none" opacity=".5"/>
    <text x="430" y="250" style="font:700 18px monospace;direction:ltr;fill:#7ee2a8;text-anchor:middle">broadcast FF:FF:FF:FF:FF:FF</text>
    ${flying ? `<g transform="translate(${x} ${y})"><circle r="40" fill="#7ee2a8" opacity=".25"/><rect x="-30" y="-24" width="60" height="48" rx="8" fill="#7ee2a8"/><text y="12" style="font:800 32px monospace;direction:ltr;fill:#06301b;text-anchor:middle">'${ST[S.st].trk}'</text></g>` : ''}
    ${speaker(700, 380, playing, t, 1.4)}
    <rect x="560" y="440" width="280" height="56" rx="10" fill="#1b2340" stroke="#3a4a80"/>
    <text x="700" y="477" style="font:800 26px monospace;direction:ltr;fill:${playing ? '#f0cc7a' : '#56607e'};text-anchor:middle">${playing ? '000' + ST[S.st].trk + '.mp3 ▶' : 'بانتظار…'}</text>
    <text x="160" y="470" class="dyt" style="font-size:20px;fill:#f0cc7a">activateStation(${S.st + 1})</text>`;
}

/* ---------- مختبر أزرار القرار ---------- */
// سيناريو تلقائي: كل عنصر [الزر، بداية الضغط، نهايته]
const DP = 14, DSCRIPT = [[1, 1, 3.2], [2, 5, 5.4], [3, 7.5, 9.5], [3, 9.9, 10.3], [0, 12, 12.4]];
function decSignal(btn, x, script) { return script.some(([b, a, z]) => b === btn && x >= a && x < z); }
function decSVG(t, sel, script, now) {
  const W = 760, span = 6;
  const pts = [], edges = [];
  for (let i = 0; i <= 240; i++) { const x = now - span + span * i / 240; const low = x >= 0 && decSignal(sel, x, script);
    pts.push(`${40 + (W - 150) * i / 240},${low ? 300 : 210}`); }
  script.forEach(([b, a]) => { if (b === sel && a > now - span && a <= now) edges.push(40 + (W - 150) * (a - now + span) / span); });
  return `<rect width="${W}" height="420" rx="16" fill="#0d1226"/>
    <text x="${W / 2}" y="44" class="dyt" style="font-size:24px;fill:#dfe4f5">إشارة GPIO${BTN[sel].pin} · زر ${BTN[sel].n}</text>
    <line x1="40" y1="210" x2="${W - 110}" y2="210" stroke="#2a3360" stroke-dasharray="4 6"/><line x1="40" y1="300" x2="${W - 110}" y2="300" stroke="#2a3360" stroke-dasharray="4 6"/>
    <text x="${W - 96}" y="216" style="font:700 20px monospace;direction:ltr;fill:#7f8bb8">HIGH</text><text x="${W - 96}" y="306" style="font:700 20px monospace;direction:ltr;fill:#7f8bb8">LOW</text>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${BTN[sel].c}" stroke-width="6" stroke-linejoin="round"/>
    ${edges.map(x => `<g transform="translate(${x} 300)"><circle r="12" fill="#f0cc7a"/><path d="M0 -24 v-50" stroke="#f0cc7a" stroke-width="3"/><text y="-84" style="font:800 20px monospace;direction:ltr;fill:#f0cc7a;text-anchor:middle">▶ 000${BTN[sel].trk}.mp3</text></g>`).join('')}
    <text x="${W / 2}" y="380" class="dyt" style="font-size:20px;fill:#9aa8d8">النقطة الذهبية = لحظة «ضغطة جديدة» فقط · الضغط المستمر لا يكرر التشغيل</text>`;
}

/* ---------- الأنواع ---------- */
const wrapCap = id => `<div class="dycap" id="${id}"><span class="i"></span><span class="tx"></span></div>`;
window.DECK_TYPES = Object.assign(window.DECK_TYPES || {}, {
  dyhero: s => `<div class="slide dark dyhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="dyh1">${s.title}</h1>
      <div class="dygif dyherow"><svg viewBox="0 0 1700 720" class="dysvg" id="dyhs"></svg>${wrapCap('dyhc')}</div></div>`,

  dysystem: s => `<div class="slide light">
      <div class="kicker">🧩 المكوّنات وكيف تتصل</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="dysys">
        <div class="dygif ix"><svg viewBox="0 0 1490 620" class="dysvg" id="dyss"></svg></div>
        <div class="dyinfo" id="dysi"></div>
      </div></div>`,

  dycurtain: s => `<div class="slide light">
      <div class="kicker">🎭 الستارة · محرك خطوي 28BYJ-48 + ULN2003</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="dylab">
        <div class="dygif ix"><svg viewBox="0 0 900 560" class="dysvg" id="dycs"></svg></div>
        <div class="dyside ix">
          <div class="dyseq" id="dyseq">${SEQ.map((r, i) => `<div class="r" data-i="${i}"><b>${AR(i + 1)}</b>${r.map(v => `<i class="${v ? 'on' : ''}">${v}</i>`).join('')}</div>`).join('')}</div>
          <label class="dysl"><span>⏱️ STEP_DELAY_MS = <b id="dycdv">3</b></span><input type="range" id="dycd" min="2" max="6" value="3" step="1"></label>
          <div class="dyfacts"><div><span>خطوات في ١٠ ث</span><b id="dycf1"></b></div><div class="g"><span>دورات المحور</span><b id="dycf2"></b></div></div>
          <div class="dyser" id="dycser"></div>
        </div></div></div>`,

  dyir: s => `<div class="slide light">
      <div class="kicker">👁️ كشف الزائر · ٣ حساسات IR</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="dylab">
        <div class="dygif ix"><svg viewBox="0 0 840 520" class="dysvg" id="dyis"></svg></div>
        <div class="dyside ix">
          <div class="dypins" id="dyip"></div>
          <div class="dydec" id="dyid"></div>
          <div class="dyhold"><span>مدة البقاء HOLD</span><div class="bar"><i id="dyih"></i></div><b id="dyihv"></b></div>
          <div class="dybtns">${ST.map((x, i) => `<button class="dyb" data-p="${i}">🚶 زائر عند ${AR(i + 1)}</button>`).join('')}<button class="dyb ghost" data-p="auto">▶ تلقائي</button></div>
          <div class="dylog" id="dyil"></div>
        </div></div></div>`,

  dyrgb: s => `<div class="slide light">
      <div class="kicker">🌈 الإضاءة · PCA9685 + RGB</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="dylab">
        <div class="dygif ix"><svg viewBox="0 0 820 520" class="dysvg" id="dyrs"></svg></div>
        <div class="dyside ix">
          <div class="dywheel"><div class="w"></div><div class="p" id="dyrp"></div><div class="c"><b id="dyrh"></b><span>درجة لونية</span></div></div>
          <div class="dyfacts"><div><span>القطاع region</span><b id="dyrr"></b></div><div class="g"><span>دورة كاملة</span><b id="dyrc"></b></div></div>
          <label class="dysl"><span>⏱️ كل <b id="dyrmv">15</b> مللي ثانية: درجة +١</span><input type="range" id="dyrm" min="5" max="40" value="15" step="1"></label>
          <div class="dybtns">${ST.map((x, i) => `<button class="dyb ${i ? '' : 'on'}" data-s="${i}">محطة ${AR(i + 1)}</button>`).join('')}<button class="dyb ghost" id="dyrf">⏸ تجميد</button></div>
        </div></div></div>`,

  dynow: s => `<div class="slide light">
      <div class="kicker">📶 لوحتان تتكلمان بلا أسلاك · ESP-NOW</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="dylab">
        <div class="dygif ix"><svg viewBox="0 0 860 520" class="dysvg" id="dyns"></svg></div>
        <div class="dyside ix">
          <div class="dytracks" id="dynt">${TRACKS.map((x, i) => `<div data-t="${i + 1}"><code>000${i + 1}.mp3</code><span>${x}</span></div>`).join('')}</div>
          <div class="dybtns">${ST.map((x, i) => `<button class="dyb" data-s="${i}">أرسل '${x.trk}'</button>`).join('')}</div>
          <div class="dyfacts"><div><span>حجم الرسالة</span><b>١ بايت</b></div><div class="g"><span>راوتر؟</span><b>لا يلزم</b></div></div>
        </div></div></div>`,

  dydecision: s => `<div class="slide light">
      <div class="kicker">🗳️ لحظة القرار · ٤ أزرار</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="dylab">
        <div class="dyside dyarc ix">
          <div class="dypanel">${BTN.map((b, i) => `<button class="dyarcade" data-b="${i}" style="--c:${b.c}"><i></i><b>${b.n}</b><small>GPIO ${b.pin}</small></button>`).join('')}</div>
          <div class="dyres" id="dyres"><code></code><span></span></div>
        </div>
        <div class="dygif ix"><svg viewBox="0 0 760 420" class="dysvg" id="dyds"></svg></div>
      </div></div>`,

  dyevolve: s => `<div class="slide light">
      <div class="kicker">🛠️ طريقة البناء · كيف وصلنا للتصميم النهائي</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="dyevo">${s.items.map((it, i) => `<div class="e f ${i === s.items.length - 1 ? 'fin' : ''}"><div class="n">${it.v}</div><h3>${it.h}</h3><p>${it.b}</p>${it.why ? `<div class="why">${it.why}</div>` : ''}</div>`).join('<div class="arr f">←</div>')}</div>
      ${s.img ? `<div class="dyimg f"><img src="${s.img}" alt=""><span>${s.cap}</span></div>` : ''}</div>`,
});

/* ---------- الربط والحركة ---------- */
function runLoop(draw, period) {
  let raf = 0, t0 = 0;
  const tick = now => { t0 = t0 || now; if (!window.DY_HOLD) draw((now - t0) / 1000); raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  window.DY_ANIM = { draw, period };
  window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); window.DY_ANIM = null; });
}
const setCap = (el, [i, tx]) => { el.querySelector('.i').textContent = i; el.querySelector('.tx').textContent = tx; };

window.DECK_BIND = Object.assign(window.DECK_BIND || {}, {
  dyhero(sl) {
    const svg = sl.querySelector('#dyhs'), cap = sl.querySelector('#dyhc');
    runLoop(t => { svg.innerHTML = heroSVG(t); setCap(cap, heroState(t).cap); }, HP);
  },
  dysystem(sl) {
    const svg = sl.querySelector('#dyss'), info = sl.querySelector('#dysi');
    let sel = null, lastK = '';
    const show = k => { if (k === lastK) return; lastK = k; const s = SYS.find(x => x.k === k);
      info.innerHTML = `<div class="ic">${s.i}</div><h3>${s.n}</h3><p>${s.d}</p>`; };
    svg.addEventListener('click', e => { const g = e.target.closest('.dynode'); if (g) { sel = g.dataset.k; } });
    runLoop(t => { const P = SYS_SEQ.length * 2.2; svg.innerHTML = sysSVG(t, sel); show(sel || SYS_SEQ[Math.floor((t % P) / 2.2)]); }, SYS_SEQ.length * 2.2);
  },
  dycurtain(sl) {
    const svg = sl.querySelector('#dycs'), rng = sl.querySelector('#dycd'), rows = sl.querySelectorAll('.dyseq .r'), ser = sl.querySelector('#dycser');
    let d = 3;
    const facts = () => { sl.querySelector('#dycdv').textContent = d; sl.querySelector('#dycf1').textContent = AR(Math.floor(10000 / d));
      sl.querySelector('#dycf2').textContent = AR((10000 / d / 4096).toFixed(2)) + ' دورة'; };
    rng.oninput = () => { d = +rng.value; facts(); }; facts();
    runLoop(t => { svg.innerHTML = curtainSVG(t, d); const S = curtainState(t, d);
      rows.forEach((r, i) => r.classList.toggle('now', i === S.idx));
      ser.innerHTML = SERIAL.slice(0, [1, 2, 3, 4, 5][S.mode]).map((l, i, a) => `<div class="${i === a.length - 1 ? 'last' : ''}">${l}</div>`).join(''); }, CP);
  },
  dyir(sl) {
    const svg = sl.querySelector('#dyis');
    let man = null, tNow = 0;
    const pins = sl.querySelector('#dyip'), dec = sl.querySelector('#dyid'), hb = sl.querySelector('#dyih'), hv = sl.querySelector('#dyihv'), lg = sl.querySelector('#dyil');
    sl.querySelectorAll('.dyb').forEach(b => b.onclick = () => {
      if (b.dataset.p === 'auto') { man = null; return; }
      if (!man) man = { p: [false, false, false], t0: tNow, events: [] };
      const i = +b.dataset.p; man.p[i] = !man.p[i]; man.events.push([tNow - man.t0, man.p.slice()]);
      b.classList.toggle('on', man.p[i]);
    });
    const presMan = x => { let p = [false, false, false]; man.events.forEach(([a, q]) => { if (x >= a) p = q; }); return p; };
    runLoop(t => {
      tNow = t;
      let view;
      if (man) { const now = t - man.t0; const sim = irSim(now, presMan); view = { p: presMan(now), sim, now }; svg.innerHTML = irSVG(t, view); }
      else { const ph = t % IRP; view = { p: irPresence(ph).p, sim: irSim(ph, x => irPresence(x).p), now: ph }; svg.innerHTML = irSVG(t); }
      if (!man) sl.querySelectorAll('.dyb[data-p]').forEach(b => b.classList.remove('on'));
      const { p, sim, now } = view, holding = now < sim.hold && sim.act;
      pins.innerHTML = ST.map((s, i) => `<div class="${p[i] ? 'lo' : ''}"><code>GPIO${s.ir}</code><b>${p[i] ? 'LOW' : 'HIGH'}</b><span>${p[i] ? 'زائر' : 'لا أحد'}</span></div>`).join('');
      const ignored = holding && p.some((v, i) => v && i + 1 !== sim.act);
      dec.innerHTML = sim.act ? `<b>المحطة النشطة: ${AR(sim.act)}</b><span>${ignored ? '🔒 حساس آخر رأى زائرًا… لكن المحطة لم تُكمل صوتها، فيُتجاهل مؤقتًا' : p.filter(Boolean).length > 1 ? '⚖️ أكثر من زائر: الأولوية للمحطة الأصغر رقمًا' : '✓ الكشاف + RGB + صوتها'}</span>` : '<b>لا محطة نشطة</b><span>كل الأضواء مطفأة… بانتظار زائر</span>';
      const left = holding ? Math.max(0, sim.hold - now) : 0;
      hb.style.width = (left / HOLD * 100) + '%'; hv.textContent = holding ? AR(left.toFixed(1)) + ' ث' : '—';
      lg.innerHTML = sim.log.slice(-4).map(([x, s]) => `<div><code>${AR(x.toFixed(1))} ث</code> ${s ? 'محطة نشطة: ' + AR(s) : 'لا زائر — الكل مطفأ'}</div>`).join('');
    }, IRP);
  },
  dyrgb(sl) {
    const svg = sl.querySelector('#dyrs'), rng = sl.querySelector('#dyrm'), fz = sl.querySelector('#dyrf');
    let ms = 15, st = 0, frozen = null, last = 0;
    rng.oninput = () => { ms = +rng.value; sl.querySelector('#dyrmv').textContent = ms; };
    sl.querySelectorAll('.dyb[data-s]').forEach(b => b.onclick = () => { st = +b.dataset.s; sl.querySelectorAll('.dyb[data-s]').forEach(x => x.classList.toggle('on', x === b)); });
    fz.onclick = () => { frozen = frozen == null ? last : null; fz.textContent = frozen == null ? '⏸ تجميد' : '▶ تشغيل'; };
    runLoop(t => { const V = rgbView(t, ms, st, frozen); last = V.hue; svg.innerHTML = rgbSVG(V, st);
      sl.querySelector('#dyrp').style.transform = `rotate(${V.hue}deg)`; sl.querySelector('#dyrh').textContent = AR(V.hue) + '°';
      sl.querySelector('#dyrr').textContent = AR(V.reg); sl.querySelector('#dyrc').textContent = AR((360 * ms / 1000).toFixed(1)) + ' ث'; }, 360 * 15 / 1000);
  },
  dynow(sl) {
    const svg = sl.querySelector('#dyns'), rows = sl.querySelectorAll('.dytracks div');
    let man = null, tNow = 0;
    sl.querySelectorAll('.dyb[data-s]').forEach(b => b.onclick = () => { man = { st: +b.dataset.s, t0: tNow }; });
    runLoop(t => { tNow = t; let S = nowState(t, man); if (man && S.k > 4) { man = null; S = nowState(t); }
      svg.innerHTML = nowSVG(t, S); const tr = S.k >= .9 && S.k < 3.8 ? ST[S.st].trk : 0;
      rows.forEach(r => r.classList.toggle('on', +r.dataset.t === tr)); }, NP);
  },
  dydecision(sl) {
    const svg = sl.querySelector('#dyds'), res = sl.querySelector('#dyres');
    let man = null, tNow = 0, sel = 1;
    const btns = sl.querySelectorAll('.dyarcade');
    btns.forEach(b => {
      const i = +b.dataset.b;
      const down = e => { e.preventDefault(); if (!man) man = { t0: tNow, script: [] }; sel = i; man.script.push([i, tNow - man.t0, 1e9]); };
      const up = () => { if (!man) return; const s = man.script.filter(x => x[0] === i && x[2] === 1e9).pop(); if (s) s[2] = tNow - man.t0; };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
    });
    runLoop(t => {
      tNow = t;
      let script, now;
      if (man) { script = man.script; now = t - man.t0; } else { script = DSCRIPT; now = t % DP; const cur = DSCRIPT.filter(x => now >= x[1]).pop(); sel = cur ? cur[0] : 1; }
      svg.innerHTML = decSVG(t, sel, script, now);
      btns.forEach((b, i) => b.classList.toggle('down', decSignal(i, now, script)));
      const lastPress = script.filter(x => now >= x[1]).pop();
      if (lastPress && now - lastPress[1] < 4) { const b = BTN[lastPress[0]]; res.style.setProperty('--c', b.c); res.classList.add('on');
        res.querySelector('code').textContent = `▶ 000${b.trk}.mp3`; res.querySelector('span').textContent = `${b.n}: ${b.r}`; }
      else { res.classList.remove('on'); res.querySelector('code').textContent = '…'; res.querySelector('span').textContent = 'اضغط زرًا (أو انتظر العرض التلقائي)'; }
    }, DP);
  },
});
})();
