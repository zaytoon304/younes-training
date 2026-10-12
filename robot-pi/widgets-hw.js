/* =====================================================================
   أدوات القطع الحقيقية (الوحدات ٤–٦):
   pinout (دبابيس GPIO الأربعون) · wire (توصيل خطوة بخطوة) · gpiosim (محاكي الليد والزر)
   l298n (لوحة المحركات) · drivelab (مختبر القيادة)
   أرقام الدبابيس هنا هي نفسها في مكتبة nabeeh.py وبرامج الأمثلة.
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const { pyBlock } = window.NB_CODE;

/* ---------- الدبابيس الأربعون (الترقيم الفعلي ← الاسم) ---------- */
const GPIO_OF = { 3: 2, 5: 3, 7: 4, 8: 14, 10: 15, 11: 17, 12: 18, 13: 27, 15: 22, 16: 23, 18: 24, 19: 10, 21: 9, 22: 25, 23: 11, 24: 8,
  26: 7, 29: 5, 31: 6, 32: 12, 33: 13, 35: 19, 36: 16, 37: 26, 38: 20, 40: 21 };
const PIN_TYPE = n => [1, 17].includes(n) ? 'v3' : [2, 4].includes(n) ? 'v5' : [6, 9, 14, 20, 25, 30, 34, 39].includes(n) ? 'gnd'
  : [27, 28].includes(n) ? 'id' : 'gpio';
const PIN_LABEL = n => ({ v3: '3.3V', v5: '5V', gnd: 'GND', id: 'ID' })[PIN_TYPE(n)] || String(GPIO_OF[n]);
/* دبابيس نبيه: نفس أرقام nabeeh.py */
const NABEEH = {
  2: '5V للحساس', 6: 'GND للحساس', 9: 'GND لليد', 11: 'الليد', 13: 'الزر', 14: 'GND للزر', 16: 'TRIG', 18: 'ECHO',
  29: 'IN1', 31: 'IN2', 38: 'IN3', 40: 'IN4', 39: 'GND للمحركات',
};
const TYPE_INFO = {
  v5: { icon: '🔴', ar: 'دبوس 5 فولت', b: 'كهرباء ثابتة ٥ فولت لتغذية القطع، مثل حساس المسافة. لا نوصله بأي دبوس GPIO أبدًا!' },
  v3: { icon: '🟠', ar: 'دبوس 3.3 فولت', b: 'كهرباء ثابتة ٣٫٣ فولت. وهو الجهد الذي تتحمله دبابيس GPIO.' },
  gnd: { icon: '⚫', ar: 'الأرضي GND', b: 'السالب: كل دائرة تحتاج أن ترجع الكهرباء إليه. فيه ٨ دبابيس، وكلها متصلة ببعض.' },
  gpio: { icon: '🟢', ar: 'دبوس GPIO', b: 'دبوس نتحكم فيه بالبرمجة: نخرج منه كهرباء (لليد والمحرك)، أو نقرأ به (الزر والحساس). يتحمل ٣٫٣ فولت فقط.' },
  id: { icon: '⚪', ar: 'دبوس محجوز', b: 'خاص بالألواح الإضافية (HAT)، فلا نستعمله.' },
};
const PIN_TOUR = [
  { pins: [2, 4], icon: '🔴', ar: 'دبابيس 5 فولت', b: 'الأقوى! تغذّي القطع بالكهرباء، لكنها لا تُبرمج. ونوصل منها حساس المسافة.' },
  { pins: [1, 17], icon: '🟠', ar: 'دبابيس 3.3 فولت', b: 'كهرباء أخف. ودبابيس GPIO كلها تعمل على هذا الجهد.' },
  { pins: [6, 9, 14, 20, 25, 30, 34, 39], icon: '⚫', ar: 'الأرضي GND', b: 'السالب. كل قطعة نوصلها تحتاج سلكًا إلى أحد هذه الدبابيس.' },
  { pins: Object.keys(GPIO_OF).map(Number), icon: '🟢', ar: '٢٦ دبوس GPIO', b: 'الدبابيس الذكية: نتحكم فيها بالكود. نكتب رقمها في البرنامج، مثل LED(17).' },
  { pins: [11], icon: '⚠️', ar: 'انتبه لرقمين مختلفين!', b: 'هذا الدبوس رقم ١١ في الترتيب، لكن اسمه <b>GPIO17</b>. وفي الكود نكتب دائمًا رقم الاسم: <code>LED(17)</code>.' },
  { pins: Object.keys(NABEEH).map(Number), icon: '🤖', ar: 'دبابيس نبيه', b: 'هذه كل الدبابيس التي سيستعملها نبيه في الدورة: الليد، والزر، والمحركات، وحساس المسافة.' },
];

function pinoutHTML() {
  let cells = '';
  for (let c = 0; c < 20; c++) for (const r of [0, 1]) {      // الصف العلوي: الزوجية (حافة اللوحة)، والسفلي: الفردية
    const n = r ? c * 2 + 1 : c * 2 + 2, t = PIN_TYPE(n);
    cells += `<div class="nb-pin ${t} ${NABEEH[n] ? 'mine' : ''}" data-n="${n}" style="grid-column:${c + 1};grid-row:${r ? 3 : 2}">
      <i>${AR(n)}</i><b dir="ltr">${PIN_LABEL(n)}</b></div>`;
  }
  for (let c = 0; c < 20; c++) for (const r of [0, 1]) {
    const n = r ? c * 2 + 1 : c * 2 + 2;
    if (NABEEH[n]) cells += `<span class="nb-ptag ${r ? 'dn' : 'up'}" data-n="${n}" style="grid-column:${c + 1};grid-row:${r ? 4 : 1}">${NABEEH[n]}</span>`;
  }
  return `<div class="nb-header ix" dir="ltr">${cells}</div>
    <div class="nb-plegend"><span class="v5">5V</span><span class="v3">3.3V</span><span class="gnd">GND</span><span class="gpio">GPIO</span>
      <span class="mine">🤖 دبابيس نبيه</span></div>`;
}
function pinShow(sl, list, p) {
  sl.querySelectorAll('.nb-pin').forEach(e => e.classList.toggle('sel', list.includes(+e.dataset.n)));
  sl.querySelectorAll('.nb-ptag').forEach(e => e.classList.toggle('on', list.includes(+e.dataset.n) && list.length < 20));
  sl.querySelector('.nb-header').classList.toggle('has-sel', list.length > 0);
  const box = sl.querySelector('.nb-info');
  box.innerHTML = `<div class="nb-icon">${p.icon}</div><h3>${p.ar}</h3>${p.en ? `<div class="nb-en" dir="ltr">${p.en}</div>` : ''}<p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
function pinClick(sl, n) {
  const t = TYPE_INFO[PIN_TYPE(n)];
  pinShow(sl, [n], { icon: t.icon, ar: `الدبوس رقم ${AR(n)}`, en: PIN_TYPE(n) === 'gpio' ? `GPIO${GPIO_OF[n]}` : PIN_LABEL(n),
    b: t.b + (NABEEH[n] ? `<br><b class="nb-gold">🤖 في نبيه: ${NABEEH[n]}</b>` : '') });
}

/* ---------- مشاهد التوصيل: كل عنصر يظهر في خطوته (data-s) ---------- */
const PX = n => 130 + Math.floor((n - 1) / 2) * 38, PY = n => n % 2 ? 104 : 70;      // مكان الدبوس n في الشريط العلوي
const HOLE_X = k => 290 + k * 30;
function headerStrip(used) {
  let s = `<rect x="104" y="48" width="788" height="78" rx="10" fill="#1b1e27"/>`, k = { 0: 0, 1: 0 };
  for (let n = 1; n <= 40; n++) {
    const on = used[n];
    s += `<circle cx="${PX(n)}" cy="${PY(n)}" r="${on ? 11 : 8}" fill="${on ? '#F0CC7A' : '#c4a64a'}" ${on ? 'stroke="#fff" stroke-width="3"' : ''}/>`;
    if (on) { const odd = n % 2, lift = (k[odd]++ % 2) * 26;      // الأسماء المتجاورة: واحد أعلى وواحد أسفل
      s += `<text x="${PX(n)}" y="${odd ? 150 + lift : 34}" class="nb-wpin${odd ? '' : ' sm'}" text-anchor="middle">${on}</text>`; }
  }
  return s;
}
function breadboard(y0 = 250) {
  let s = `<rect x="262" y="${y0}" width="600" height="340" rx="16" fill="#f4f1e8" stroke="#d8d1bd" stroke-width="3"/>
    <rect x="262" y="${y0 + 160}" width="600" height="20" fill="#e6e0cf"/>`;
  for (let k = 0; k < 19; k++) for (let r = 0; r < 5; r++) {
    s += `<rect x="${HOLE_X(k) - 5}" y="${y0 + 26 + r * 28 - 5}" width="10" height="10" rx="2" fill="#bfb7a1"/>`;
    s += `<rect x="${HOLE_X(k) - 5}" y="${y0 + 196 + r * 28 - 5}" width="10" height="10" rx="2" fill="#bfb7a1"/>`;
  }
  return s;
}
const wire = (s, d, color) => `<g data-s="${s}"><path d="${d}" fill="none" stroke="#0005" stroke-width="13" stroke-linecap="round" transform="translate(3,4)"/>
  <path d="${d}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/></g>`;
const resistorH = (s, x1, x2, y) => `<g data-s="${s}"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#9aa1b3" stroke-width="5"/>
  <rect x="${(x1 + x2) / 2 - 38}" y="${y - 14}" width="76" height="28" rx="12" fill="#d9c08a"/>
  ${[0, 1, 2, 3].map(i => `<rect x="${(x1 + x2) / 2 - 26 + i * 14 + (i === 3 ? 8 : 0)}" y="${y - 14}" width="7" height="28" fill="${['#c0392b', '#c0392b', '#7a4b30', '#D9AE4B'][i]}"/>`).join('')}
  <text x="${(x1 + x2) / 2}" y="${y - 22}" class="nb-wl" text-anchor="middle">٢٢٠ أوم</text></g>`;

const SCENES = {
  led: {
    view: '0 0 1000 620',
    svg: () => `${headerStrip({ 9: 'GND', 11: 'GPIO17' })}${breadboard()}
      ${resistorH(1, HOLE_X(4), HOLE_X(8), 330)}
      <g data-s="2"><line x1="${HOLE_X(8)}" y1="330" x2="${HOLE_X(8)}" y2="250" stroke="#9aa1b3" stroke-width="5"/><line x1="${HOLE_X(10)}" y1="330" x2="${HOLE_X(10)}" y2="262" stroke="#9aa1b3" stroke-width="5"/>
        <circle class="nb-glow" cx="${HOLE_X(9)}" cy="215" r="70" fill="url(#nbLedGlow)"/>
        <path class="nb-ledbody" d="M${HOLE_X(9) - 26} 250 V205 a26 26 0 0 1 52 0 V250 Z" fill="#c0392b" stroke="#8e2a20" stroke-width="3"/></g>
      ${wire(3, `M${PX(11)} ${PY(11)} C ${PX(11)} 200, ${HOLE_X(4)} 200, ${HOLE_X(4)} 276`, '#e67e22')}
      ${wire(4, `M${PX(9)} ${PY(9)} C ${PX(9) - 60} 300, ${HOLE_X(10)} 420, ${HOLE_X(10)} 386`, '#1b1e27')}`,
    steps: [
      { h: 'المقاومة', b: 'نضع المقاومة (٢٢٠ أوم) في الصف العلوي. هي تحمي الليد من كهرباء زائدة تحرقه.' },
      { h: 'الليد', b: 'الساق <b>الطويلة (+)</b> في نفس عمود طرف المقاومة، والقصيرة في عمود آخر.' },
      { h: 'السلك البرتقالي', b: 'من الدبوس <b>١١ (GPIO17)</b> إلى عمود الطرف الثاني للمقاومة.' },
      { h: 'السلك الأسود', b: 'من الدبوس <b>٩ (GND)</b> إلى عمود الساق القصيرة. الآن الدائرة مكتملة!' },
      { h: 'شغّل البرنامج ✨', b: 'نكتب <code>LED(17)</code> في Python… فيضيء الليد!', glow: true },
    ],
  },
  button: {
    view: '0 0 1000 620',
    svg: () => `${headerStrip({ 9: 'GND', 11: 'GPIO17', 13: 'GPIO27', 14: 'GND' })}${breadboard()}
      ${resistorH(0, HOLE_X(4), HOLE_X(8), 330)}
      <g data-s="0"><line x1="${HOLE_X(8)}" y1="330" x2="${HOLE_X(8)}" y2="250" stroke="#9aa1b3" stroke-width="5"/><line x1="${HOLE_X(10)}" y1="330" x2="${HOLE_X(10)}" y2="262" stroke="#9aa1b3" stroke-width="5"/>
        <circle class="nb-glow" cx="${HOLE_X(9)}" cy="215" r="70" fill="url(#nbLedGlow)"/>
        <path class="nb-ledbody" d="M${HOLE_X(9) - 26} 250 V205 a26 26 0 0 1 52 0 V250 Z" fill="#c0392b" stroke="#8e2a20" stroke-width="3"/></g>
      ${wire(0, `M${PX(11)} ${PY(11)} C ${PX(11)} 200, ${HOLE_X(4)} 200, ${HOLE_X(4)} 276`, '#e67e22')}
      ${wire(0, `M${PX(9)} ${PY(9)} C ${PX(9) - 60} 300, ${HOLE_X(10)} 420, ${HOLE_X(10)} 386`, '#1b1e27')}
      <g data-s="1" class="nb-btnpart"><rect x="${HOLE_X(13) - 8}" y="440" width="${HOLE_X(15) - HOLE_X(13) + 16}" height="90" rx="10" fill="#2a2e3a"/>
        <circle class="nb-cap" cx="${(HOLE_X(13) + HOLE_X(15)) / 2}" cy="485" r="28" fill="#2E6FD8" stroke="#1b3f86" stroke-width="4"/>
        <text x="${HOLE_X(16) + 4}" y="492" class="nb-wl">الزر</text></g>
      ${wire(2, `M${PX(13)} ${PY(13)} C ${PX(13) + 40} 260, ${HOLE_X(13)} 560, ${HOLE_X(13)} 558`, '#f1c40f')}
      ${wire(3, `M${PX(14)} ${PY(14)} C ${PX(14) + 380} 60, ${HOLE_X(15) + 60} 600, ${HOLE_X(15)} 558`, '#1b1e27')}`,
    steps: [
      { h: 'الليد جاهز من قبل', b: 'نبقي دائرة الليد كما هي، ونضيف الزر في النصف السفلي.' },
      { h: 'الزر', b: 'نضع الزر فوق القناة الوسطى، فتكون كل ساقين في جهة.' },
      { h: 'السلك الأصفر', b: 'من الدبوس <b>١٣ (GPIO27)</b> إلى ساق الزر الأولى.' },
      { h: 'السلك الأسود', b: 'من الدبوس <b>١٤ (GND)</b> إلى ساق الزر الثانية. لا نحتاج مقاومة هنا، فالـ Pi فيه مقاومة داخلية!' },
      { h: 'اضغط الزر ✨', b: 'حين نضغط تتصل الساقان، فيعرف الـ Pi أن الزر مضغوط… ويضيء الليد.', glow: true, press: true },
    ],
  },
  motors: {
    view: '0 0 1000 700',
    svg: () => `${headerStrip({ 29: 'IN1', 31: 'IN2', 38: 'IN3', 39: 'GND', 40: 'IN4' })}
      <g><rect x="330" y="300" width="340" height="230" rx="14" fill="#c0392b"/>
        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${430 + i * 20}" y="330" width="12" height="90" rx="3" fill="#1b1e27"/>`).join('')}
        ${['ENA', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB'].map((t, i) => `<circle cx="${405 + i * 38}" cy="455" r="9" fill="#F0CC7A"/><text x="${405 + i * 38}" y="${i % 2 ? 488 : 482}" class="nb-wpin w" text-anchor="middle">${t}</text>`).join('')}
        <rect x="390" y="440" width="30" height="30" rx="4" fill="#1b1e27" opacity=".85"/><rect x="580" y="440" width="30" height="30" rx="4" fill="#1b1e27" opacity=".85"/>
        <rect x="290" y="350" width="40" height="80" rx="6" fill="#2E6FD8"/><rect x="670" y="350" width="40" height="80" rx="6" fill="#2E6FD8"/>
        <rect x="430" y="520" width="140" height="44" rx="6" fill="#2E6FD8"/>
        <text x="455" y="590" class="nb-wpin" text-anchor="middle">12V</text><text x="500" y="590" class="nb-wpin" text-anchor="middle">GND</text><text x="545" y="590" class="nb-wpin" text-anchor="middle">5V</text>
        <text x="500" y="320" class="nb-wpin w" text-anchor="middle">L298N</text></g>
      <g data-s="1"><rect x="70" y="350" width="130" height="80" rx="12" fill="#F0CC7A" stroke="#b08a2e" stroke-width="3"/><rect x="40" y="320" width="34" height="140" rx="10" fill="#1b1e27"/>
        <text x="135" y="472" class="nb-wl" text-anchor="middle">المحرك الأيسر</text>
        <rect x="800" y="350" width="130" height="80" rx="12" fill="#F0CC7A" stroke="#b08a2e" stroke-width="3"/><rect x="926" y="320" width="34" height="140" rx="10" fill="#1b1e27"/>
        <text x="865" y="472" class="nb-wl" text-anchor="middle">المحرك الأيمن</text>
        <path d="M200 375 H290 M200 405 H290 M800 375 H710 M800 405 H710" stroke="#c0392b" stroke-width="7"/></g>
      <g data-s="2"><rect x="380" y="620" width="240" height="60" rx="12" fill="#101B45"/><rect x="392" y="632" width="100" height="36" rx="16" fill="#2E9E6B"/><rect x="508" y="632" width="100" height="36" rx="16" fill="#2E9E6B"/>
        <text x="640" y="660" class="nb-wl">البطارية ٧٫٤ فولت</text>
        <path d="M400 620 C 400 600, 455 600, 455 564" stroke="#e74c3c" stroke-width="8" fill="none"/><path d="M600 620 C 600 598, 500 600, 500 564" stroke="#1b1e27" stroke-width="8" fill="none"/></g>
      ${wire(3, `M${PX(39)} ${PY(39)} C 960 200, 640 640, 512 566`, '#1b1e27')}
      ${wire(4, `M${PX(29)} ${PY(29)} C ${PX(29)} 260, 443 380, 443 448`, '#9b59b6')}
      ${wire(4, `M${PX(31)} ${PY(31)} C ${PX(31)} 280, 481 390, 481 448`, '#3498db')}
      ${wire(4, `M${PX(38)} ${PY(38)} C ${PX(38) + 30} 300, 519 390, 519 448`, '#2ecc71')}
      ${wire(4, `M${PX(40)} ${PY(40)} C ${PX(40) + 30} 320, 557 400, 557 448`, '#f1c40f')}`,
    steps: [
      { h: 'لوحة العضلات L298N', b: 'نثبّتها على هيكل نبيه. غطاءا <b>ENA</b> و <b>ENB</b> الأسودان يبقيان في مكانهما.' },
      { h: 'المحركان', b: 'سلكا المحرك الأيسر في المخرج الأيسر، وسلكا الأيمن في المخرج الأيمن. ونشدّ البراغي جيدًا.' },
      { h: 'البطارية (والمفتاح مطفأ!)', b: 'الأحمر (+) إلى <b>12V</b>، والأسود (−) إلى <b>GND</b>. هذه كهرباء المحركات وحدها.' },
      { h: 'الأرضي المشترك ⚠️', b: 'سلك من الدبوس <b>٣٩ (GND)</b> إلى نفس فتحة GND في اللوحة. بدونه لا تفهم اللوحة أوامر الـ Pi!' },
      { h: 'أسلاك الأوامر الأربعة', b: 'الدبابيس <b>٢٩ و٣١</b> إلى IN1 وIN2 (اليسار)، و<b>٣٨ و٤٠</b> إلى IN3 وIN4 (اليمين).' },
      { h: 'ارفع نبيه وشغّل ✨', b: 'نضع نبيه على علبة حتى لا تلمس العجلات الأرض، ثم نشغّل برنامج اختبار المحركات.', glow: true },
    ],
  },
};

/* ---------- محاكي الليد والزر ---------- */
const BLINK = s => `from gpiozero import LED\nfrom time import sleep\n\nled = LED(17)\n\nwhile True:\n    led.on()\n    sleep(${s})\n    led.off()\n    sleep(${s})`;
const BUTTON = `from gpiozero import LED, Button\nfrom signal import pause\n\nled = LED(17)\nbutton = Button(27)\n\nbutton.when_pressed = led.on\nbutton.when_released = led.off\n\npause()`;
const bigLed = `<svg viewBox="0 0 200 260" class="nb-bigled"><defs><radialGradient id="nbLedGlow2"><stop offset="0" stop-color="#ff5a5a" stop-opacity=".95"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient></defs>
  <circle class="nb-glow" cx="100" cy="90" r="100" fill="url(#nbLedGlow2)"/>
  <path class="nb-ledbody" d="M60 150 V90 a40 40 0 0 1 80 0 V150 Z" fill="#c0392b" stroke="#8e2a20" stroke-width="4"/>
  <rect x="52" y="148" width="96" height="14" rx="4" fill="#a83226"/><line x1="82" y1="162" x2="82" y2="250" stroke="#9aa1b3" stroke-width="6"/><line x1="118" y1="162" x2="118" y2="232" stroke="#9aa1b3" stroke-width="6"/></svg>`;

/* ---------- لوحة L298N ---------- */
const L298_PARTS = {
  heat:  { icon: '🌡️', ar: 'المشتت الحراري', en: 'Heat Sink', b: 'الزعانف السوداء تبرّد اللوحة، لأنها تسخن وهي تدفع الكهرباء للمحركات. لا نلمسها والمحركات تعمل.' },
  outa:  { icon: '⬅️', ar: 'مخرج المحرك الأيسر', en: 'OUT1 · OUT2', b: 'نربط هنا سلكي المحرك الأيسر.' },
  outb:  { icon: '➡️', ar: 'مخرج المحرك الأيمن', en: 'OUT3 · OUT4', b: 'نربط هنا سلكي المحرك الأيمن.' },
  power: { icon: '🔋', ar: 'مدخل الكهرباء', en: '12V · GND · 5V', b: 'البطارية تدخل من 12V و GND. ونوصل GND نفسه بالـ Pi أيضًا (الأرضي المشترك).' },
  ins:   { icon: '🎮', ar: 'دبابيس الأوامر', en: 'IN1 · IN2 · IN3 · IN4', b: 'هنا تصل أوامر الـ Pi: كل محرك له دبوسان، وهما يحددان الاتجاه.' },
  ens:   { icon: '🔌', ar: 'غطاءا التشغيل', en: 'ENA · ENB Jumpers', b: 'غطاءان صغيران يُبقيان المحركين جاهزين دائمًا. نتركهما في مكانهما.' },
};
const L298_TOUR = ['outa', 'outb', 'power', 'ins', 'ens', 'heat'];
function l298SVG() {
  return `<svg viewBox="0 0 700 560" class="nb-l298" xmlns="http://www.w3.org/2000/svg">
  <rect x="80" y="40" width="540" height="480" rx="22" fill="#c0392b"/>
  ${[[110, 70], [590, 70], [110, 490], [590, 490]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#7d241b"/>`).join('')}
  <g class="nb-part" data-p="heat"><rect x="230" y="60" width="240" height="190" rx="8" fill="#22252e"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${244 + i * 28}" y="70" width="14" height="170" rx="4" fill="#3a3f4f"/>`).join('')}</g>
  <g class="nb-part" data-p="outa"><rect x="40" y="150" width="90" height="150" rx="10" fill="#2E6FD8"/>${[0, 1].map(i => `<circle cx="85" cy="${190 + i * 70}" r="20" fill="#c4c9d4"/><line x1="72" y1="${190 + i * 70}" x2="98" y2="${190 + i * 70}" stroke="#5e6782" stroke-width="5"/>`).join('')}
    <text x="85" y="330" class="nb-wpin w" text-anchor="middle">OUT1·2</text></g>
  <g class="nb-part" data-p="outb"><rect x="570" y="150" width="90" height="150" rx="10" fill="#2E6FD8"/>${[0, 1].map(i => `<circle cx="615" cy="${190 + i * 70}" r="20" fill="#c4c9d4"/><line x1="602" y1="${190 + i * 70}" x2="628" y2="${190 + i * 70}" stroke="#5e6782" stroke-width="5"/>`).join('')}
    <text x="615" y="330" class="nb-wpin w" text-anchor="middle">OUT3·4</text></g>
  <g class="nb-part" data-p="power"><rect x="140" y="420" width="200" height="80" rx="10" fill="#2E6FD8"/>${[0, 1, 2].map(i => `<circle cx="${180 + i * 60}" cy="460" r="20" fill="#c4c9d4"/><text x="${180 + i * 60}" y="412" class="nb-wpin w" text-anchor="middle">${['12V', 'GND', '5V'][i]}</text>`).join('')}</g>
  <g class="nb-part" data-p="ins">${['IN1', 'IN2', 'IN3', 'IN4'].map((t, i) => `<rect x="${426 + i * 38}" y="440" width="22" height="22" rx="3" fill="#F0CC7A"/><text x="${437 + i * 38}" y="${490 + (i % 2) * 22}" class="nb-wpin w" text-anchor="middle">${t}</text>`).join('')}</g>
  <g class="nb-part" data-p="ens"><rect x="380" y="428" width="34" height="44" rx="5" fill="#1b1e27"/><rect x="580" y="428" width="34" height="44" rx="5" fill="#1b1e27"/>
    <text x="397" y="420" class="nb-wpin w" text-anchor="middle">ENA</text><text x="597" y="420" class="nb-wpin w" text-anchor="middle">ENB</text></g>
  <text x="350" y="300" class="nb-wpin w big" text-anchor="middle">L298N</text>
  <rect x="300" y="320" width="100" height="44" rx="6" fill="#1b1e27"/><circle cx="520" cy="300" r="10" fill="#ff4d4d"/>
</svg>`;
}

/* ---------- مختبر القيادة: أي دبوس يعمل مع كل اتجاه ---------- */
const DRIVE = {
  forward:  { icon: '⬆️', ar: 'للأمام', py: 'nabeeh.forward()', pins: [1, 0, 1, 0], l: 1, r: 1 },
  backward: { icon: '⬇️', ar: 'للخلف', py: 'nabeeh.backward()', pins: [0, 1, 0, 1], l: -1, r: -1 },
  left:     { icon: '↩️', ar: 'لف يسار', py: 'nabeeh.left()', pins: [0, 1, 1, 0], l: -1, r: 1 },
  right:    { icon: '↪️', ar: 'لف يمين', py: 'nabeeh.right()', pins: [1, 0, 0, 1], l: 1, r: -1 },
  stop:     { icon: '⏹️', ar: 'توقف', py: 'nabeeh.stop()', pins: [0, 0, 0, 0], l: 0, r: 0 },
};
const topBot = `<svg viewBox="0 0 300 340" class="nb-topbot">
  <rect class="nb-wheel L" x="10" y="60" width="60" height="150" rx="16"/><rect class="nb-wheel R" x="230" y="60" width="60" height="150" rx="16"/>
  <rect x="62" y="30" width="176" height="270" rx="40" fill="#2E4288" stroke="#D9AE4B" stroke-width="6"/>
  <circle cx="115" cy="78" r="20" fill="#fff"/><circle cx="185" cy="78" r="20" fill="#fff"/><circle cx="115" cy="72" r="9" fill="#0A1230"/><circle cx="185" cy="72" r="9" fill="#0A1230"/>
  <rect x="100" y="140" width="100" height="70" rx="8" fill="#1f8a3c"/><rect x="104" y="230" width="92" height="44" rx="8" fill="#c0392b"/>
  <text class="nb-warr L" x="40" y="250" text-anchor="middle"></text><text class="nb-warr R" x="260" y="250" text-anchor="middle"></text>
  <rect x="120" y="306" width="60" height="22" rx="8" fill="#2E9E6B"/></svg>`;

Object.assign(window.DECK_TYPES, {
  pinout: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '📍 خريطة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-pgrid"><div class="nb-panel"><div class="nb-info"><div class="nb-icon">👆</div><h3>اضغط أي دبوس</h3><p>أو «التالي» لنتعرّف على أنواعها</p></div></div>
        <div class="nb-pwrap">${pinoutHTML()}</div></div>${PIN_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  wire: s => { const S = SCENES[s.kind]; return `<div class="slide light">
      <div class="kicker">${s.kicker || '🔌 نوصّل خطوة بخطوة'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-wgrid"><div class="nb-panel"><div class="nb-info nb-winfo"><div class="nb-stepno">قبل أن نبدأ</div><h3>${s.intro || 'اضغط «التالي» لنوصّل قطعة قطعة'}</h3>
          <p>${s.need || ''}</p></div>
          <ol class="nb-wlist">${S.steps.map(x => `<li>${x.h}</li>`).join('')}</ol></div>
        <div class="nb-stage"><svg viewBox="${S.view}" class="nb-wsvg step0"><defs><radialGradient id="nbLedGlow"><stop offset="0" stop-color="#ff5a5a" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient></defs>${S.svg()}</svg></div>
      </div>${S.steps.map(() => '<i class="f"></i>').join('')}</div>`; },

  gpiosim: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '💡 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="nb-gsim ix ${s.mode}">
        <div class="codewrap"><div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">${s.mode === 'button' ? '04_button.py' : '04_blink.py'}</span>
          ${s.mode === 'button' ? '' : '<button class="nb-btn mini go">▶ شغّل</button>'}</div><div class="nb-gcode"></div></div>
        <div class="nb-gview">${bigLed}
          ${s.mode === 'button' ? `<button class="nb-push">اضغط<br>واستمر</button><div class="nb-gst">الزر غير مضغوط</div>`
          : `<label class="nb-slider"><span>مدة الانتظار: <b class="nb-sec">١</b> ثانية</span><input type="range" min="0.2" max="2" step="0.2" value="1"></label><div class="nb-gst">اضغط «شغّل»</div>`}
        </div>
      </div></div>`,

  l298n: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '🔍 لوحة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-grid"><div class="nb-panel"><div class="nb-info"><div class="nb-icon">💪</div><h3>لوحة العضلات</h3><p>اضغط أي جزء، أو «التالي» للجولة</p></div>
        <div class="nb-hint">👆 اضغط أي جزء · ⬅️ «التالي» (${AR(L298_TOUR.length)})</div></div>
        <div class="nb-stage ix">${l298SVG()}</div></div>${L298_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  drivelab: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '🎮 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:16px">${s.title}</h2>
      <div class="nb-drive ix">
        <div class="nb-dside">
          <div class="nb-dpad">${Object.entries(DRIVE).map(([k, d]) => `<button class="nb-card" data-k="${k}"><span>${d.icon}</span><b>${d.ar}</b></button>`).join('')}</div>
          <div class="nb-truth"><div class="nb-trow head"><span></span><span>IN1</span><span>IN2</span><span>IN3</span><span>IN4</span></div>
            <div class="nb-trow vals"><span>الكهرباء</span>${[0, 1, 2, 3].map(i => `<span class="nb-tv" data-i="${i}">٠</span>`).join('')}</div>
            <div class="nb-trow nb-tcap"><span></span><span class="w2">العجلة اليسرى</span><span class="w2">العجلة اليمنى</span></div></div>
          <div class="nb-dpy" dir="ltr">nabeeh.stop()</div>
        </div>
        <div class="nb-dview">${topBot}<div class="nb-dmsg">اختر اتجاهًا</div></div>
      </div></div>`,
});

function wireStep(sl, s, step) {
  const S = SCENES[s.kind], svg = sl.querySelector('.nb-wsvg');
  svg.querySelectorAll('[data-s]').forEach(e => { const k = +e.dataset.s;
    e.classList.toggle('nb-hide', k > step); e.classList.toggle('nb-now', k === step && k > 0); });
  const st = S.steps[step - 1];
  svg.classList.toggle('lit', !!(st && st.glow));
  svg.classList.toggle('pressed', !!(st && st.press));
  sl.querySelectorAll('.nb-wlist li').forEach((li, i) => { li.classList.toggle('done', i < step - 1); li.classList.toggle('now', i === step - 1); });
  const box = sl.querySelector('.nb-winfo');
  if (st) { box.innerHTML = `<div class="nb-stepno">الخطوة ${AR(step)} من ${AR(S.steps.length)}</div><h3>${st.h}</h3><p>${st.b}</p>`;
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); }
}

function bindGpio(sl, s) {
  const codeBox = sl.querySelector('.nb-gcode'), st = sl.querySelector('.nb-gst'), led = sl.querySelector('.nb-bigled');
  const lines = () => sl.querySelectorAll('.nb-gcode .ln');
  const mark = ns => lines().forEach(l => l.classList.toggle('run', ns.includes(+l.dataset.n)));
  if (s.mode === 'button') {
    codeBox.innerHTML = pyBlock(BUTTON, 'nb-small');
    const b = sl.querySelector('.nb-push');
    const set = on => { led.classList.toggle('on', on); b.classList.toggle('down', on); mark(on ? [7] : [8]);
      st.innerHTML = on ? '✅ الزر مضغوط ← <code>led.on</code>' : '⬜ الزر متروك ← <code>led.off</code>'; };
    b.addEventListener('pointerdown', e => { e.preventDefault(); set(true); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => b.classList.contains('down') && set(false)));
    mark([10]);
    return;
  }
  let sec = 1, t = null, on = false;
  const draw = () => { codeBox.innerHTML = pyBlock(BLINK(sec), 'nb-small'); sl.querySelector('.nb-sec').textContent = AR(sec).replace('.', '٫'); };
  const stopIt = () => { clearTimeout(t); t = null; };
  window.DECK_CLEANUP.push(stopIt);
  const tick = () => { on = !on; led.classList.toggle('on', on); mark(on ? [7, 8] : [9, 10]);
    st.textContent = on ? '💡 led.on() … الليد مضيء' : '⚫ led.off() … الليد مطفأ'; t = setTimeout(tick, sec * 1000); };
  sl.querySelector('.go').onclick = e => { if (t) { stopIt(); e.target.textContent = '▶ شغّل'; led.classList.remove('on'); mark([]); st.textContent = 'توقف البرنامج'; }
    else { e.target.textContent = '⏹ أوقف'; on = false; tick(); } };
  sl.querySelector('input[type=range]').addEventListener('input', e => { sec = +(+e.target.value).toFixed(1); const run = !!t; draw(); if (run) { mark(on ? [7, 8] : [9, 10]); } });
  draw();
}

function l298Show(sl, k) {
  sl.querySelectorAll('.nb-part').forEach(g => g.classList.toggle('sel', g.dataset.p === k));
  const p = L298_PARTS[k], box = sl.querySelector('.nb-info');
  box.innerHTML = `<div class="nb-icon">${p.icon}</div><h3>${p.ar}</h3><div class="nb-en" dir="ltr">${p.en}</div><p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}

function bindDrive(sl) {
  const view = sl.querySelector('.nb-topbot');
  const arrow = v => v > 0 ? '⬆' : v < 0 ? '⬇' : '';
  const set = k => {
    const d = DRIVE[k];
    sl.querySelectorAll('.nb-dpad .nb-card').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    sl.querySelectorAll('.nb-tv').forEach((e, i) => { e.textContent = AR(d.pins[i]); e.classList.toggle('hi', !!d.pins[i]); });
    sl.querySelector('.nb-dpy').textContent = d.py;
    ['L', 'R'].forEach(side => { const v = side === 'L' ? d.l : d.r;
      const w = view.querySelector('.nb-wheel.' + side); w.classList.toggle('fwd', v > 0); w.classList.toggle('back', v < 0);
      view.querySelector('.nb-warr.' + side).textContent = arrow(v); });
    view.classList.remove('turnL', 'turnR', 'goF', 'goB');
    view.classList.add({ forward: 'goF', backward: 'goB', left: 'turnL', right: 'turnR' }[k] || 'x');
    sl.querySelector('.nb-dmsg').innerHTML = k === 'stop' ? 'كل الدبابيس ٠… نبيه واقف' :
      d.l === d.r ? `العجلتان ${d.l > 0 ? 'للأمام' : 'للخلف'}… فيمشي نبيه ${d.ar}` : `عجلة للأمام وعجلة للخلف… فيلفّ نبيه حول نفسه!`;
  };
  sl.querySelectorAll('.nb-dpad .nb-card').forEach(b => b.onclick = () => set(b.dataset.k));
}

Object.assign(window.DECK_BIND, {
  pinout(sl) { sl.querySelectorAll('.nb-pin').forEach(p => p.addEventListener('click', () => pinClick(sl, +p.dataset.n))); },
  wire(sl, s) { wireStep(sl, s, 0); },
  gpiosim: bindGpio,
  l298n(sl) { sl.querySelectorAll('.nb-part').forEach(g => g.addEventListener('click', () => l298Show(sl, g.dataset.p))); },
  drivelab: bindDrive,
});

const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (!sl) return;
  if (s.t === 'pinout' && step > 0) { const p = PIN_TOUR[step - 1]; pinShow(sl, p.pins, p); }
  if (s.t === 'wire') wireStep(sl, s, step);
  if (s.t === 'l298n' && step > 0) l298Show(sl, L298_TOUR[step - 1]);
};

window.NB_HW = { GPIO_OF, PIN_TYPE, NABEEH, SCENES, DRIVE };
})();
