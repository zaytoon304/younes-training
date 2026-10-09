/* =====================================================================
   «لمسات تراث: حراسة المصمك بالروبوتات الذكية» — أدوات المرحلتين 1 و2
   الأنواع: masmakhero · archlab · esp32lab · flamelab · mq2lab · stationlab
   دوائر البناء: stationwire (Safety station على ESP32)
   الأطراف من مشروع أ. محمد الحقيقي: لهب 32 · MQ-2 34 · LCD 21/22 · بازر 23 · أحمر 18 · أزرق 19
   ===================================================================== */
(function () {
const { highlight, codeBlock } = window.ARD; const AR = n => String(n);
const { B2, wire } = window.ARD2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const f0 = v => AR(Math.round(v));
let AC = null;
const beep = (f = 1200, ms = 120, v = .05) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0008, AC.currentTime + ms / 1000); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + ms / 1000); } catch (e) { } };
const lcdHTML = id => `<div class="lcd2"><div class="lcdglass lit" id="${id}">${Array.from({ length: 32 }, () => '<i></i>').join('')}</div></div>`;
const lcdSet = (el, a, b) => { const c = el.querySelectorAll('i'); (a.padEnd(16).slice(0, 16) + b.padEnd(16).slice(0, 16)).split('').forEach((ch, i) => c[i].textContent = ch === ' ' ? '' : ch); };
window.TUR = { beep, lcdHTML, lcdSet, clamp, f0 };

/* ---------- قصر المصمك (رسم مشترك) ---------- */
const crenel = (x, y, w) => Array.from({ length: Math.floor(w / 18) }, (_, i) => `<rect x="${x + i * 18}" y="${y - 12}" width="10" height="14" class="mk"/>`).join('');
const tower = (x, y, w, h) => `<path d="M${x} ${y + h} L${x + 6} ${y} L${x + w - 6} ${y} L${x + w} ${y + h} Z" class="mk"/>${crenel(x + 6, y, w - 12)}
  ${[0.35, 0.6].map(f => `<rect x="${x + w / 2 - 4}" y="${y + h * f}" width="8" height="18" rx="3" class="mkw"/>`).join('')}`;
const masmak = (x0 = 0, y0 = 0, s = 1) => `<g transform="translate(${x0} ${y0}) scale(${s})" class="masmak">
  <rect x="120" y="130" width="560" height="200" class="mk"/>${crenel(126, 130, 548)}
  ${tower(40, 80, 110, 250)}${tower(650, 80, 110, 250)}${tower(330, 60, 140, 270)}
  <path d="M370 330 L370 250 Q 400 210 430 250 L430 330 Z" class="gate"/>${[0, 1, 2, 3].map(i => `<line x1="${374 + i * 18}" y1="244" x2="${374 + i * 18}" y2="330" class="gatel"/>`).join('')}
  ${[180, 250, 550, 610].map(x => `<rect x="${x}" y="190" width="10" height="26" rx="4" class="mkw"/>`).join('')}
  ${[100, 220, 300, 500, 580, 700].map(x => `<polygon points="${x},${120 + (x % 3) * 4} ${x + 8},${108} ${x + 16},${120 + (x % 3) * 4}" class="mkt"/>`).join('')}</g>`;
const palm = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C 4 -40, -4 -80, 6 -120" class="trunk"/>${[-60, -25, 15, 50, 85].map(a => `<path d="M6 -120 C ${6 + Math.cos(a * Math.PI / 180) * 30} ${-130 + Math.sin(a * Math.PI / 180) * 10}, ${6 + Math.cos(a * Math.PI / 180) * 60} ${-110 + Math.sin(a * Math.PI / 180) * 30}, ${6 + Math.cos(a * Math.PI / 180) * 80} ${-90}" class="frond"/>`).join('')}</g>`;
const car4 = (id, cls = '') => `<g id="${id}" class="car4 ${cls}"><rect x="-34" y="-30" width="18" height="14" rx="4" class="tyre4"/><rect x="16" y="-30" width="18" height="14" rx="4" class="tyre4"/><rect x="-34" y="16" width="18" height="14" rx="4" class="tyre4"/><rect x="16" y="16" width="18" height="14" rx="4" class="tyre4"/>
  <rect x="-38" y="-20" width="76" height="40" rx="8" class="body4"/><rect x="-16" y="-14" width="22" height="28" rx="3" class="esp4"/><rect x="10" y="-12" width="20" height="24" rx="3" class="tank4"/>
  <g class="nozzle"><rect x="36" y="-5" width="16" height="10" rx="3" fill="#78909c"/></g></g>`;
window.TUR.masmak = masmak; window.TUR.palm = palm; window.TUR.car4 = car4;

/* ================== الافتتاح ================== */
const heroSVG = () => `<svg viewBox="0 0 1600 600" class="mhsvg">
  <defs><linearGradient id="mhsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a24"/><stop offset="1" stop-color="#1b2b5e"/></linearGradient></defs>
  <rect width="1600" height="600" fill="url(#mhsky)"/>${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 271) % 1600}" cy="${(i * 113) % 260}" r="${1 + i % 2}" fill="#fff" opacity="${.4 + (i % 5) / 8}"/>`).join('')}
  <circle cx="1380" cy="110" r="46" fill="#f4f1ea"/><circle cx="1400" cy="98" r="46" fill="#050a24" opacity=".0"/>
  <rect y="470" width="1600" height="130" fill="#c9a26b"/><rect y="470" width="1600" height="10" fill="#b08a55"/>
  ${palm(160, 480, 1.1)}${palm(1450, 480, 1.2)}${palm(1300, 485, .8)}
  ${masmak(400, 140, 1)}
  <g transform="translate(1030 330)"><rect x="-44" y="-30" width="88" height="70" rx="8" class="stbox"/><rect x="-34" y="-20" width="68" height="24" rx="3" class="stlcd"/><text x="0" y="-3" class="stlcdt" id="mhlcd">SAFE</text>
    <circle cx="-16" cy="22" r="7" class="ledr" id="mhr"/><circle cx="16" cy="22" r="7" class="ledb" id="mhb"/><text x="0" y="62" class="mhl">Safety station</text></g>
  <g id="mhfire" opacity="0" transform="translate(500 270)"><path d="M0 0 C -24 -40, 12 -70, 0 -110 C 40 -70, 34 -30, 0 0 Z" fill="#ff7043"/><path d="M0 -6 C -10 -30, 8 -44, 0 -66 C 18 -44, 16 -24, 0 -6 Z" fill="#ffd54f"/></g>
  <g id="mhgas" opacity="0">${[0, 1, 2, 3].map(i => `<circle cx="${1060 + i * 30}" cy="${400 - i * 18}" r="${30 + i * 8}" fill="#9ccc65" opacity=".35"/>`).join('')}</g>
  <g id="mhwater" opacity="0"><path d="M0 0 Q 60 -90 120 -60" fill="none" stroke="#4fc3f7" stroke-width="8" stroke-dasharray="10 8" class="spray"/></g>
  <g id="mhwind" opacity="0">${[0, 1, 2].map(i => `<path d="M0 ${-14 + i * 14} q 40 -10 80 0" fill="none" stroke="#e0f2f1" stroke-width="4" stroke-dasharray="8 8" class="spray"/>`).join('')}</g>
  <g id="mhcar2">${car4('mhc2', 'r2')}</g>${car4('mhcar')}<g id="mhwater2" opacity="0"></g><g id="mhwind2" opacity="0"></g>
  <g class="mhcap"><rect x="560" y="20" width="480" height="56" rx="28"/><text x="800" y="57" id="mhcapt"></text></g>
</svg>`;

/* ================== مخطط النظام ================== */
const ARCH = [
  { k: 'flame', x: 120, y: 120, i: '🔥', n: 'حساس اللهب', d: 'يرى الأشعة تحت الحمراء من النار. مخرجه DO على GPIO32: LOW عند رؤية اللهب.' },
  { k: 'mq2', x: 120, y: 250, i: '💨', n: 'حساس الغاز MQ-2', d: 'مخرجه التماثلي AO على GPIO34. يحتاج تسخينًا قبل القراءة الموثوقة.' },
  { k: 'st', x: 340, y: 185, i: '🧠', n: 'ESP32 المحطة', d: 'داخل نموذج المصمك: يقرأ الحساسين ويقرر ويرسل إلى السيارة.' },
  { k: 'out', x: 340, y: 360, i: '🚨', n: 'الإنذار', d: 'ليد أحمر للهب (18)، وأزرق للغاز (19)، وبازر (23)، وشاشة LCD (21 و22).' },
  { k: 'radio', x: 560, y: 185, i: '📡', n: 'ESP-NOW', d: 'اتصال لاسلكي مباشر بين لوحتي ESP32 بلا راوتر، برسالة قصيرة سريعة جدًا.' },
  { k: 'car', x: 780, y: 185, i: '🚙', n: 'الروبوت 1', d: 'القائد: يستقبل الرسالة ويقرر. اللهب له دائمًا: يذهب بنفسه ويطفئ ثم يعود للخلف بالاتجاه نفسه. والغاز يأمر به الروبوت 2 عبر ESP-NOW.' },
  { k: 'car2', x: 890, y: 100, i: '🚙', n: 'الروبوت 2', d: 'يحمل المروحة: لا يتحرك وحده، بل ينتظر إذن القائد ثم يذهب إلى الغاز ويعود إلى مكانه.' },
  { k: 'drive', x: 780, y: 360, i: '⚙️', n: 'L298N وأربعة محركات', d: 'ENA 33 · ENB 32 · IN1/IN2 27/26 · IN3/IN4 25/14 · والجانب الأيمن معكوس في الكود.' },
  { k: 'relay', x: 1000, y: 185, i: '🔌', n: 'ريليه مزدوج', d: 'يعمل على LOW: القناة الأولى (16) للمضخة، والثانية (17) للمروحة.' },
  { k: 'pump', x: 1000, y: 70, i: '💧', n: 'المضخة', d: 'تطفئ اللهب. موجب البطارية على COM، والمضخة على NO.' },
  { k: 'fan', x: 1000, y: 300, i: '🌀', n: 'المروحة', d: 'تبدد الغاز وتطرده من المكان.' },
];
const ARCH_LINKS = [['flame', 'st'], ['mq2', 'st'], ['st', 'out'], ['st', 'radio'], ['radio', 'car'], ['car', 'car2'], ['car', 'drive'], ['car', 'relay'], ['relay', 'pump'], ['relay', 'fan']];
const FLOW = [['flame', '1. حساس اللهب يرى نارًا'], ['st', '2. ESP32 المحطة يقرأ: GPIO32 = LOW'], ['out', '3. الليد الأحمر والبازر والشاشة: «FLAME!»'], ['radio', '4. رسالة لاسلكية تطير إلى السيارة'], ['car', '5. السيارة تقرر: اللهب أخطر حدث الآن'], ['drive', '6. المحركات الأربعة تقود السيارة إلى المكان'], ['relay', '7. الريليه يكتب LOW على القناة الأولى'], ['pump', '8. المضخة تطفئ النار… والمحطة تعود «آمنة»']];
const archSVG = () => { const P = Object.fromEntries(ARCH.map(a => [a.k, a]));
  return `<svg viewBox="0 0 1120 440" class="archsvg">
  <rect x="40" y="40" width="440" height="380" rx="24" class="zone1"/><text x="260" y="30" class="zt">Safety station (داخل المصمك)</text>
  <rect x="680" y="40" width="420" height="380" rx="24" class="zone2"/><text x="890" y="30" class="zt">روبوتا الإطفاء الذكيان</text>
  ${ARCH_LINKS.map(([a, b]) => `<line x1="${P[a].x}" y1="${P[a].y}" x2="${P[b].x}" y2="${P[b].y}" class="alink" data-l="${a}-${b}"/>`).join('')}
  ${ARCH.map(a => `<g class="anode" data-k="${a.k}" transform="translate(${a.x} ${a.y})"><circle r="44" class="acirc"/><text y="12" class="aico">${a.i}</text><text y="66" class="anm">${a.n}</text></g>`).join('')}
  </svg>`; };

/* ================== لوحة ESP32 ================== */
const LEFT = ['EN', 'VP 36', 'VN 39', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const RIGHT = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2 17', 'RX2 16', 'D4', 'D2', 'D15', 'GND', '3V3'];
const USE = {
  station: { 'D32': ['🔥 حساس اللهب DO', '#e74c3c'], 'D34': ['💨 MQ-2 AO', '#7cb342'], 'D21': ['📟 LCD SDA', '#2b6fc0'], 'D22': ['📟 LCD SCL', '#2b6fc0'], 'D23': ['🔊 البازر', '#8e44ad'], 'D18': ['🔴 الليد الأحمر', '#e74c3c'], 'D19': ['🔵 الليد الأزرق', '#1e88e5'] },
  table: { 'D26': ['STEP ← A4988', '#c0392b'], 'D25': ['DIR ← A4988', '#e67e22'], 'D27': ['EN ← A4988 (LOW = يعمل)', '#8e44ad'], 'D23': ['🌈 WS2812B', '#2ecc71'] },
  car: { 'D33': ['ENA (سرعة اليسار)', '#e0b400'], 'D32': ['ENB (سرعة اليمين)', '#e0b400'], 'D27': ['IN1', '#2e9e6b'], 'D26': ['IN2', '#2e9e6b'], 'D25': ['IN3', '#16a3b5'], 'D14': ['IN4', '#16a3b5'], 'RX2 16': ['💧 ريليه المضخة', '#2b6fc0'], 'TX2 17': ['🌀 ريليه المروحة', '#8e44ad'], 'D35': ['🔥 لهب السيارة (مدخل فقط)', '#e74c3c'] },
};
const PININFO = { 'VP 36': 'مدخل فقط · ADC', 'VN 39': 'مدخل فقط · ADC', 'D34': 'مدخل فقط · ADC: مثالي للحساسات التماثلية', 'D35': 'مدخل فقط · ADC', 'D12': '⚠️ طرف إقلاع: تجنّبه', 'D2': '⚠️ طرف إقلاع ومتصل بليد اللوحة', 'D15': '⚠️ طرف إقلاع', 'TX0': 'منفذ الحاسوب: لا تستخدمه', 'RX0': 'منفذ الحاسوب: لا تستخدمه', 'EN': 'زر إعادة التشغيل', '3V3': 'خرج 3.3 فولت', 'VIN': 'دخل 5 فولت', 'GND': 'الأرضي', 'D21': 'SDA الافتراضي لـ I2C', 'D22': 'SCL الافتراضي لـ I2C' };

/* ================== أكواد ================== */
const FLAME_CODE = `int flame = 32, red = 18, buzzer = 23;

void setup() {
  pinMode(flame, INPUT);
  pinMode(red, OUTPUT);
  pinMode(buzzer, OUTPUT);
}

void loop() {
  bool fire = digitalRead(flame) == LOW;
  digitalWrite(red, fire);
  digitalWrite(buzzer, fire);
}`;
const MQ2_CODE = `int mq2 = 34, blue = 19;
int limit = 1800;

void loop() {
  int gas = analogRead(mq2);
  Serial.println(gas);
  digitalWrite(blue, gas > limit);
  delay(200);
}`;
const STATION_CODE = `void loop() {
  int fireP = map(4095 - analogRead(32), 0, 4095, 0, 100);
  int gasP = constrain(map(analogRead(34), base, 4095, 0, 100), 0, 100);
  digitalWrite(18, fireP > 50);
  digitalWrite(19, gasP > 30);
  lcd.setCursor(0, 0); lcd.printf("Fire: %3d%%  ", fireP);
  lcd.setCursor(0, 1); lcd.printf("Gas:  %3d%%  ", gasP);
  if (fireP > 50 || gasP > 30) alertCar(fireP, gasP);
  if (fireP > 50) beepFast(); else if (gasP > 30) beepSlow();
}`;

/* ================== دائرة البناء: المحطة على ESP32 ================== */
const espBoard = (x, y) => `<g transform="translate(${x} ${y})"><rect width="150" height="340" rx="10" fill="#1f2a44"/><rect x="45" y="300" width="60" height="34" rx="4" fill="#c9ccd3"/><rect x="35" y="20" width="80" height="60" rx="4" fill="#c9ccd3"/><text x="75" y="56" class="lbl" style="font-size:13px">ESP32</text>
  ${LEFT.map((p, i) => `<circle cx="12" cy="${100 + i * 13.5}" r="4" fill="#f0cc7a"/>`).join('')}${RIGHT.map((p, i) => `<circle cx="138" cy="${100 + i * 13.5}" r="4" fill="#f0cc7a"/>`).join('')}</g>`;
const PR = n => 100 + RIGHT.indexOf(n) * 13.5, PL = n => 100 + LEFT.indexOf(n) * 13.5;
B2.stationwire = { flow: 7, steps: [
  { h: 'لوحة ESP32 ولوح التوصيل', b: 'لوحة ESP32 DevKit V1 بثلاثين طرفًا، وهي دماغ Safety station.' },
  { h: 'حساس اللهب ← GPIO32', b: 'VCC إلى 3V3، وGND إلى GND، وDO إلى D32.' },
  { h: 'حساس الغاز MQ-2 ← GPIO34', b: 'AO إلى D34 (مدخل تماثلي فقط). سخّانه يحتاج 5 فولت من VIN.' },
  { h: 'الليد الأحمر ← 18 · الأزرق ← 19', b: 'كل ليد مع مقاومة 220 أوم.' },
  { h: 'البازر ← 23', b: 'بازر نشط يصفّر بإشارة HIGH.' },
  { h: 'الشاشة: SDA ← 21 · SCL ← 22', b: 'طرفا I2C الافتراضيان في ESP32.' },
  { h: 'شغّل المحطة!', b: 'المصمك آمن… حتى يظهر لهب أو غاز.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 stw">
  <rect x="300" y="40" width="580" height="440" rx="16" fill="#f6f3ec" stroke="#e2dccd" stroke-width="3"/>
  <g class="bs" data-s="1">${espBoard(40, 90)}</g>
  <g class="bs" data-s="2"><rect x="360" y="70" width="110" height="60" rx="8" fill="#1f5fae"/><circle cx="385" cy="100" r="12" fill="#3a3f4d"/><text x="430" y="105" class="lbl" style="font-size:12px;fill:#fff">FLAME</text></g>
  ${wire(`M178 ${90 + PL('D32')} C 260 ${90 + PL('D32')}, 300 110, 360 110`, 2, '#e74c3c')}
  <g class="bs" data-s="3"><rect x="360" y="180" width="110" height="70" rx="8" fill="#1f5fae"/><circle cx="415" cy="215" r="24" fill="#c9ccd3" stroke="#78909c" stroke-width="4"/><circle cx="415" cy="215" r="12" fill="#9aa1b3"/><text x="415" y="270" class="lbl" style="font-size:13px">MQ-2</text></g>
  ${wire(`M178 ${90 + PL('D34')} C 270 ${90 + PL('D34')}, 300 230, 360 230`, 3, '#7cb342')}
  <g class="bs" data-s="4"><g transform="translate(560 120)"><circle r="16" class="ledr2"/><text y="40" class="lbl" style="font-size:12px">أحمر · لهب</text></g><g transform="translate(640 120)"><circle r="16" class="ledb2"/><text y="40" class="lbl" style="font-size:12px">أزرق · غاز</text></g></g>
  ${wire(`M28 ${90 + PR('D18')} C 0 ${90 + PR('D18')}, 0 20, 300 20 C 520 20, 560 60, 560 104`, 4, '#e74c3c')}${wire(`M28 ${90 + PR('D19')} C 10 ${90 + PR('D19')}, 10 30, 300 30 C 600 30, 640 60, 640 104`, 4, '#1e88e5')}
  <g class="bs" data-s="5"><g transform="translate(760 120)"><circle r="26" fill="#1c1f27"/><circle r="8" fill="#5b6275"/><text y="48" class="lbl" style="font-size:12px">بازر</text><g class="bzw"><path d="M32 -12 q 10 12 0 24 M42 -20 q 16 20 0 40" fill="none" stroke="#8e44ad" stroke-width="3"/></g></g></g>
  ${wire(`M28 ${90 + PR('D23')} C -10 ${90 + PR('D23')}, -10 8, 300 8 C 700 8, 760 60, 760 94`, 5, '#8e44ad')}
  <g class="bs" data-s="6"><rect x="520" y="300" width="320" height="130" rx="10" fill="#1f6b3a"/><rect x="540" y="320" width="280" height="90" rx="4" class="stlcd2"/><text x="560" y="355" class="stlcdt2">Masmak Safe :)</text><text x="560" y="392" class="stlcdt2">Gas: 640</text></g>
  ${wire(`M28 ${90 + PR('D21')} C 10 ${90 + PR('D21')}, 10 470, 300 470 C 480 470, 500 380, 520 380`, 6, '#2b6fc0')}${wire(`M28 ${90 + PR('D22')} C 18 ${90 + PR('D22')}, 18 480, 300 480 C 490 480, 505 400, 520 400`, 6, '#16a3b5')}
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  masmakhero: s => `<div class="slide dark mhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="htitle">${s.title}</h1>
      <div class="mhwrap">${heroSVG()}</div></div>`,

  archlab: s => `<div class="slide light">
      <div class="kicker">🗺️ المشروع من الأعلى</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="argrid">
        <div class="arleft ix">${archSVG()}<div class="arctl"><button class="clap" id="arplay">▶ شاهد رحلة الإنذار</button><div class="arcap" id="arcap">👆 انقر أي مكوّن لتتعرف عليه</div></div></div>
        <div class="arinfo" id="arinfo"><div class="xi0">كل دائرة جزء من المشروع الحقيقي. انقرها لتعرف دورها وطرفها في ESP32.</div></div>
      </div></div>`,

  esp32lab: s => `<div class="slide light">
      <div class="kicker">🧠 ESP32 DevKit V1</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="e3grid">
        <div class="e3board ix" dir="ltr"><div class="e3col">${LEFT.map(p => `<button class="e3pin" data-p="${p}"><span>${p}</span><i></i></button>`).join('')}</div>
          <div class="e3chip"><div class="e3can">ESP32<br><small>Wi-Fi · BT</small></div><div class="e3usb">USB</div></div>
          <div class="e3col r">${RIGHT.map(p => `<button class="e3pin" data-p="${p}"><i></i><span>${p}</span></button>`).join('')}</div></div>
        <div class="e3right ix"><div class="lseg"><span>اعرض أطراف</span><button class="lsb on" data-v="table">🎠 المنصة</button><button class="lsb" data-v="station">🛡️ المحطة</button><button class="lsb" data-v="car">🚙 السيارة</button><button class="lsb" data-v="rules">⚠️ قواعد</button></div>
          <div class="e3list" id="e3list"></div><div class="e3info" id="e3info">انقر أي طرف في اللوحة</div></div>
      </div></div>`,

  flamelab: s => `<div class="slide light">
      <div class="kicker">🔥 حساس اللهب</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="flgrid">
        <div class="flleft ix"><svg viewBox="0 0 760 360" class="flsvg"><rect width="760" height="360" fill="#1b2340"/>
            <g transform="translate(90 180)"><rect x="-50" y="-34" width="100" height="68" rx="8" fill="#1f5fae"/><circle cx="34" cy="0" r="14" fill="#3a3f4d" stroke="#8fb8ff" stroke-width="3"/><circle cx="-26" cy="-18" r="6" class="fld" id="fld"/><text y="56" class="mhl">حساس اللهب</text></g>
            <path id="flcone" d="M124 180 L700 40 L700 320 Z" class="flcone"/>
            <g id="flcandle"><rect x="-12" y="0" width="24" height="70" rx="4" fill="#f4f1ea"/><line x1="0" y1="0" x2="0" y2="-8" stroke="#1b2340" stroke-width="3"/><g class="flick"><path d="M0 -6 C -14 -28, 6 -44, 0 -66 C 20 -40, 16 -22, 0 -6 Z" fill="#ff7043"/><path d="M0 -10 C -6 -24, 4 -32, 0 -44 C 10 -30, 8 -20, 0 -10 Z" fill="#ffd54f"/></g><text y="100" class="mhl">↔ اسحب الشمعة</text></g>
            <text x="400" y="340" class="mhl" id="fldist"></text></svg>
          <label class="lsl"><span>🎚️ حساسية الحساس (المقبض الأزرق): <b id="flsv">5</b></span><input type="range" id="fls" min="1" max="9" value="5"></label></div>
        <div class="flright ix"><div class="sofacts"><div class="ac"><span>digitalRead(32)</span><b id="flr">HIGH</b></div><div class="ac gold"><span>الليد الأحمر 18</span><b id="flled">مطفأ</b></div><div class="ac"><span>البازر 23</span><b id="flbz">صامت</b></div></div>
          <div class="irbar"><span>شدة الأشعة تحت الحمراء</span><div class="btbar"><i id="flir"></i><em id="flth"></em></div></div>
          <button class="sndbtn" id="flsnd">🔇 تشغيل الصوت</button>
          ${codeBlock(FLAME_CODE, 'micro')}</div>
      </div></div>`,

  mq2lab: s => `<div class="slide light">
      <div class="kicker">💨 حساس الغاز MQ-2</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="flgrid">
        <div class="flleft ix"><svg viewBox="0 0 760 360" class="flsvg"><rect width="760" height="360" fill="#3e2f1f"/>${window.TUR.masmak(30, 20, .9)}
            <rect width="760" height="360" id="mqcloud" fill="#9ccc65" opacity="0"/>
            <g transform="translate(640 250)"><rect x="-46" y="-30" width="92" height="64" rx="8" fill="#1f5fae"/><circle cx="0" cy="0" r="20" fill="#c9ccd3" stroke="#78909c" stroke-width="4"/><circle cx="-34" cy="-20" r="6" class="ledb2" id="mqled"/><text y="56" class="mhl">MQ-2</text></g>
            <g transform="translate(120 300)"><rect x="-30" y="-20" width="60" height="40" rx="6" fill="#78909c"/><g id="mqknob"><rect x="-3" y="-18" width="6" height="16" fill="#c62828"/></g><text y="38" class="mhl">مصدر الغاز</text></g>
            <text x="380" y="40" class="mhl" id="mqwarm"></text></svg>
          <label class="lsl"><span>💨 تسرّب الغاز: <b id="mqlv">0</b></span><input type="range" id="mql" min="0" max="10" value="0"></label></div>
        <div class="flright ix"><div class="sofacts"><div class="ac"><span>analogRead(34)</span><b id="mqr">—</b></div><div class="ac gold"><span>الليد الأزرق 19</span><b id="mqb">مطفأ</b></div><div class="ac"><span>الحد</span><b>1800</b></div></div>
          <div class="plot4"><div class="plh"><i style="background:#9ccc65"></i>قراءة MQ-2 من 0 إلى 4095 <i style="background:#f0cc7a"></i>الحد</div><svg viewBox="0 0 600 170" class="chart4" id="mqch" preserveAspectRatio="none"><line x1="0" x2="600" class="cm" id="mqth"/><polyline class="cl" style="stroke:#9ccc65" id="mqpl" points=""/></svg></div>
          ${codeBlock(MQ2_CODE, 'micro')}</div>
      </div></div>`,

  stationlab: s => `<div class="slide light">
      <div class="kicker">🛡️ Safety station الحية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="stgrid2">
        <div class="stdev ix"><div class="stcase"><div class="stleds"><div><i class="lr" id="sr"></i><span>لهب</span></div><div><i class="lb" id="sb"></i><span>غاز</span></div><div><i class="bz" id="sz"></i><span>بازر</span></div></div>
            ${lcdHTML('stlcd')}<div class="stname">لمسات تراث · محطة المصمك</div></div>
          <div class="stctl"><button class="clap" id="stfire">🔥 لهب</button><label class="lsl"><span>💨 غاز: <b id="stgv">0%</b></span><input type="range" id="stg" min="0" max="4095" value="600" step="50"></label><button class="sndbtn" id="stsnd">🔇 الصوت</button></div></div>
        <div class="stcode2">${codeBlock(STATION_CODE, 'micro')}</div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  masmakhero(sl) {
    const $ = id => sl.querySelector('#' + id), car = $('mhcar'), car2 = $('mhcar2');
    const SCRIPT = [[0, 'patrol', '🌙 A quiet night… the station watches, two robots guard'], [5, 'alarm', '🔥💨 A flame at the tower and a gas leak at once!'], [7, 'decide', '🧠 Leader: the fire is mine → I go myself · 📡 robot 2: go to the gas'],
      [9.5, 'go', '🚙🚙 Both robots set off together'], [12, 'act', '💧 The pump puts out the fire… 🌀 the fan clears the gas'], [17, 'safe', '✅ Masmak is safe… each robot backs up to its place'], [21, 'patrol', '🛡️ Touch of Heritage: technology protecting history']];
    let raf = 0, t0 = 0, c1 = 300, c2 = 1300, th1 = 0, th2 = Math.PI;
    const loop = ts => {
      t0 = t0 || ts; const t = ((ts - t0) / 1000) % 24; const cur = [...SCRIPT].reverse().find(([s]) => t >= s), st = cur[1]; $('mhcapt').textContent = cur[2];
      const fire = ['alarm', 'decide', 'go'].includes(st) || (st === 'act' && t < 15.5), gas = fire;
      $('mhfire').setAttribute('opacity', fire ? 1 : 0); $('mhgas').setAttribute('opacity', st === 'act' ? Math.max(0, 1 - (t - 12) / 3.5) : fire ? 1 : 0);
      $('mhr').classList.toggle('on', fire); $('mhb').classList.toggle('on', gas); $('mhlcd').textContent = fire ? 'FIRE+GAS' : 'SAFE';
      let t1, t2; if (['go', 'act'].includes(st)) { t1 = 760; t2 = 1180; } else if (st === 'patrol' || st === 'safe') { t1 = 300 + 250 * (0.5 + 0.5 * Math.sin(t * 0.6)); t2 = 1250 + 120 * Math.sin(t * 0.5); } else { t1 = c1; t2 = c2; }
      const d1 = t1 - c1, d2 = t2 - c2; c1 += clamp(d1, -6, 6); c2 += clamp(d2, -6, 6); th1 = d1 > 1 ? 0 : d1 < -1 ? Math.PI : th1; th2 = d2 > 1 ? 0 : d2 < -1 ? Math.PI : th2;
      car.setAttribute('transform', `translate(${c1} 520) rotate(${th1 * 180 / Math.PI})`); car2.setAttribute('transform', `translate(${c2} 535) rotate(${th2 * 180 / Math.PI})`);
      $('mhwater').setAttribute('opacity', st === 'act' && t < 15.5 ? 1 : 0); $('mhwater').setAttribute('transform', `translate(${c1 - 30} 500) scale(-1.6 2.6)`);
      $('mhwind').setAttribute('opacity', st === 'act' ? 1 : 0); $('mhwind').setAttribute('transform', `translate(${c2 - 120} 505)`);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  archlab(sl) {
    const $ = id => sl.querySelector('#' + id), info = $('arinfo'); let timers = [];
    const pick = k => { const a = ARCH.find(x => x.k === k); sl.querySelectorAll('.anode').forEach(n => n.classList.toggle('sel', n.dataset.k === k));
      info.innerHTML = `<div class="xi1">${a.i}</div><h3>${a.n}</h3><p>${a.d}</p>`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); };
    sl.querySelectorAll('.anode').forEach(n => n.addEventListener('pointerdown', () => pick(n.dataset.k)));
    $('arplay').onclick = () => { timers.forEach(clearTimeout); timers = []; sl.querySelectorAll('.alink').forEach(l => l.classList.remove('hot'));
      FLOW.forEach(([k, cap], i) => timers.push(setTimeout(() => { pick(k); $('arcap').textContent = cap; const prev = i ? FLOW[i - 1][0] : null;
        sl.querySelectorAll('.alink').forEach(l => { if (prev && (l.dataset.l === `${prev}-${k}` || l.dataset.l === `${k}-${prev}` || (prev === 'out' && l.dataset.l === `st-${k}`))) l.classList.add('hot'); }); }, i * 1500))); };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  esp32lab(sl) {
    const $ = id => sl.querySelector('#' + id); let view = 'table';
    const show = () => {
      const U = USE[view] || {};
      sl.querySelectorAll('.e3pin').forEach(b => { const p = b.dataset.p, u = U[p]; b.classList.toggle('used', !!u); b.querySelector('i').style.background = u ? u[1] : (view === 'rules' && PININFO[p] && PININFO[p].startsWith('⚠️') ? '#e74c3c' : view === 'rules' && PININFO[p] && PININFO[p].includes('مدخل فقط') ? '#e0b400' : ''); });
      $('e3list').innerHTML = view === 'rules' ? `<div class="e3r"><b>3.3 فولت</b> منطق ESP32: لا تدخل 5 فولت على أي طرف</div><div class="e3r"><b style="color:#b8860b">34–39</b> مدخلات فقط، ممتازة للحساسات التماثلية</div><div class="e3r"><b style="color:#c0392b">0 و2 و12 و15</b> أطراف إقلاع: تجنّبها</div><div class="e3r"><b>ADC 12 بت</b> القراءة من 0 إلى 4095 لا 1023</div>`
        : Object.entries(U).map(([p, [n, c]]) => `<div class="e3r"><i style="background:${c}"></i><b dir="ltr">${p}</b><span>${n}</span></div>`).join('');
    };
    sl.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { view = b.dataset.v; sl.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); show(); });
    sl.querySelectorAll('.e3pin').forEach(b => b.onclick = () => { const p = b.dataset.p; $('e3info').innerHTML = `<b dir="ltr">${p}</b> — ${[USE.table[p] && 'المنصة: ' + USE.table[p][0], USE.station[p] && 'المحطة: ' + USE.station[p][0], USE.car[p] && 'السيارة: ' + USE.car[p][0], PININFO[p]].filter(Boolean).join(' · ') || 'طرف رقمي عام'}`; });
    show();
  },

  flamelab(sl) {
    const $ = id => sl.querySelector('#' + id), svg = sl.querySelector('.flsvg'), candle = $('flcandle');
    let x = 620, y = 220, sound = false, dn = false, raf = 0, bt = 0, last = 0;
    const drag = e => { const r = svg.getBoundingClientRect(); x = clamp((e.clientX - r.left) * 760 / r.width, 180, 730); y = clamp((e.clientY - r.top) * 360 / r.height, 90, 290); };
    svg.addEventListener('pointerdown', e => { dn = true; svg.setPointerCapture(e.pointerId); drag(e); }); svg.addEventListener('pointermove', e => dn && drag(e)); svg.addEventListener('pointerup', () => dn = false);
    $('fls').oninput = () => $('flsv').textContent = AR($('fls').value);
    $('flsnd').onclick = e => { sound = !sound; e.target.textContent = sound ? '🔊 إيقاف الصوت' : '🔇 تشغيل الصوت'; };
    const lines = sl.querySelectorAll('.flright .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      const dx = x - 124, dy = (y - 40) - 180, dist = Math.hypot(dx, dy), ang = Math.abs(Math.atan2(dy, dx)) * 180 / Math.PI;
      const ir = ang < 30 ? clamp(1 - dist / 700, 0, 1) * (1 - ang / 45) : 0;     // داخل زاوية الرؤية (نحو 60 درجة) وتضعف مع البعد
      const th = 1 - $('fls').value / 10, fire = ir > th;
      candle.setAttribute('transform', `translate(${x} ${y})`);
      $('flir').style.width = ir * 100 + '%'; $('flth').style.left = th * 100 + '%'; $('flcone').classList.toggle('hit', fire);
      $('fldist').textContent = `المسافة ≈ ${f0(dist / 7)} سم`;
      $('flr').textContent = fire ? 'LOW' : 'HIGH'; $('flr').classList.toggle('on', fire); $('flled').textContent = fire ? 'مضاء 🔴' : 'مطفأ'; $('flbz').textContent = fire ? 'يصفّر 🔊' : 'صامت'; $('fld').classList.toggle('on', fire);
      if (fire && sound) { bt -= dt; if (bt <= 0) { beep(1800, 120, .05); bt = .25; } }
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 11 || (fire && (n === 12 || n === 13))); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  mq2lab(sl) {
    const $ = id => sl.querySelector('#' + id), pl = $('mqpl'), buf = [];
    let raw = 600, warm = 6, raf = 0, last = 0; const Y = v => 160 - v / 4095 * 150; $('mqth').setAttribute('y1', Y(1800)); $('mqth').setAttribute('y2', Y(1800));
    $('mql').oninput = () => { $('mqlv').textContent = AR($('mql').value); };
    const lines = sl.querySelectorAll('.flright .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; warm = Math.max(0, warm - dt);
      raw = clamp(raw + (+$('mql').value * 140 - (raw - 600) * 0.35) * dt, 400, 4095);
      const read = warm > 0 ? Math.round(3500 * warm / 6) : Math.round(raw + (Math.random() - .5) * 60), leak = warm <= 0 && read > 1800;
      buf.push(read); while (buf.length > 160) buf.shift(); pl.setAttribute('points', buf.map((v, i) => `${i / 159 * 600},${Y(v)}`).join(' '));
      $('mqr').textContent = AR(read); $('mqb').textContent = leak ? 'مضاء 🔵' : 'مطفأ'; $('mqled').classList.toggle('on', leak);
      $('mqcloud').setAttribute('opacity', clamp((raw - 700) / 6000, 0, .45)); $('mqknob').setAttribute('transform', `rotate(${$('mql').value * 18})`);
      $('mqwarm').textContent = warm > 0 ? `♨️ تسخين الحساس… القراءة غير موثوقة (${AR(Math.ceil(warm))})` : '';
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 5 || n === 6 || (leak && n === 7)); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  stationlab(sl) {
    const $ = id => sl.querySelector('#' + id), lcd = $('stlcd');
    let fireT = 0, sound = false, last = 0, raf = 0, bt = 0;
    $('stfire').onclick = () => { fireT = fireT > 0 ? 0 : 8; $('stfire').textContent = fireT ? '🧯 أطفئ' : '🔥 لهب'; };
    $('stg').oninput = () => {};
    $('stsnd').onclick = e => { sound = !sound; e.target.textContent = sound ? '🔊 الصوت' : '🔇 الصوت'; };
    const lines = sl.querySelectorAll('.stcode2 .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; fireT = Math.max(0, fireT - dt); if (!fireT) $('stfire').textContent = '🔥 لهب';
      const gas = +$('stg').value, gasP = clamp(Math.round((gas - 600) * 100 / (4095 - 600)), 0, 100), fireP = fireT > 0 ? 78 + Math.round(Math.sin(ts / 300) * 6) : 2, fire = fireP > 50, leak = gasP > 30;
      $('stgv').textContent = AR(gasP) + '%';
      $('sr').classList.toggle('on', fire); $('sb').classList.toggle('on', leak);
      lcdSet(lcd, `Fire: ${String(fireP).padStart(3)}%${fire ? ' !!' : ''}`, `Gas:  ${String(gasP).padStart(3)}%${leak ? ' !!' : ''}`);
      bt -= dt; const per = fire ? .22 : leak ? .8 : 0; const buzz = per && bt <= 0;
      if (buzz) { bt = per; $('sz').classList.add('on'); setTimeout(() => $('sz').classList.remove('on'), 100); if (sound) beep(fire ? 2000 : 1200, 100, .05); }
      const ln = [2, 3, 4, 5, 6, 7, ...(fire || leak ? [8, 9] : [])];
      lines.forEach(l => l.classList.toggle('run', ln.includes(+l.dataset.n)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
