/* =====================================================================
   «المزرعة الذكية والمنزل الذكي» — أدوات المرحلة الأولى
   الأنواع: farmhero (يوم حي في المزرعة والبيت) · relaylab (ريليه شفاف) · lcdlab (شاشة ١٦×٢)
   دوائر البناء: relaywire (ريليه ومضخة) · lcdwire (شاشة I2C)
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, col, pinX, botX, base, wire } = window.ARD2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const a = p(c1), b = p(c2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); };
const hhmm = h => { const H = Math.floor(h) % 24, M = Math.floor((h % 1) * 60); return AR(String(H).padStart(2, '0')) + ':' + AR(String(M).padStart(2, '0')); };

/* صوت نقرة قصيرة (الريليه) */
let AC = null;
const click = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const n = AC.createBuffer(1, 900, AC.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 90);
  const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = 0.35; s.buffer = n; s.connect(g).connect(AC.destination); s.start(); } catch (e) { } };

/* ================== الافتتاح: يوم حي ================== */
const FEATS = [['🌱', 'ري آلي'], ['🌡️', 'بيت محمي'], ['💧', 'خزان ذكي'], ['💡', 'إضاءة ذكية'], ['🚪', 'باب ذكي'], ['🔥', 'أمان'], ['☀️', 'طاقة شمسية'], ['📡', 'من الجوال']];
const farmSVG = () => `<svg viewBox="0 0 1600 620" class="farmsvg">
  <defs><linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" id="fs0" stop-color="#7ec8f0"/><stop offset="1" id="fs1" stop-color="#d9f0fb"/></linearGradient>
    <radialGradient id="fsun"><stop offset="0" stop-color="#fff6c4"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs>
  <rect width="1600" height="620" fill="url(#fsky)"/>
  <g id="fstars" opacity="0">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 397) % 1600}" cy="${(i * 131) % 300}" r="${1 + i % 3}" fill="#fff"/>`).join('')}</g>
  <circle id="fsunc" r="70" fill="url(#fsun)"/><circle id="fmoon" r="34" fill="#f4f1ea" opacity="0"/>
  <g id="fcloud"><ellipse cx="0" cy="0" rx="110" ry="40" fill="#e9eef5"/><ellipse cx="-60" cy="12" rx="70" ry="32" fill="#e9eef5"/><ellipse cx="70" cy="14" rx="80" ry="30" fill="#e9eef5"/>
    <g id="frain" opacity="0">${Array.from({ length: 14 }, (_, i) => `<line x1="${-110 + i * 16}" y1="40" x2="${-118 + i * 16}" y2="70" class="drop" style="animation-delay:${(i % 5) * 0.12}s"/>`).join('')}</g></g>
  <path d="M0 420 C 300 380, 600 410, 900 395 S 1400 380, 1600 400 L1600 620 L0 620 Z" fill="#7cb342"/>
  <path d="M0 470 C 400 450, 900 470, 1600 455 L1600 620 L0 620 Z" fill="#689f38"/>
  ${Array.from({ length: 5 }, (_, r) => `<path d="M40 ${490 + r * 26} L640 ${484 + r * 26}" stroke="#8d6e48" stroke-width="12" stroke-linecap="round"/>
    ${Array.from({ length: 10 }, (_, k) => `<g class="plant" transform="translate(${70 + k * 60} ${484 + r * 26})"><path d="M0 0 C -10 -14, -14 -20, -4 -26 M0 0 C 10 -14, 14 -22, 4 -28" stroke="#2e7d32" stroke-width="5" fill="none"/><circle cx="0" cy="-30" r="5" class="fruit"/></g>`).join('')}`).join('')}
  <g id="fspray" opacity="0">${[150, 340, 530].map(x => `<g transform="translate(${x} 470)"><line x1="0" y1="0" x2="0" y2="-24" stroke="#5b6275" stroke-width="5"/>${[-60, -30, 0, 30, 60].map(a => `<path d="M0 -24 q ${a} -40 ${a * 1.8} 10" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="4 6" class="spray"/>`).join('')}</g>`).join('')}</g>
  <g transform="translate(700 300)"><path d="M0 120 L0 40 Q 110 -40 220 40 L220 120 Z" fill="rgba(200,235,255,.55)" stroke="#9fc5d8" stroke-width="4"/>
    ${[40, 80, 120, 160].map(x => `<line x1="${x + 10}" y1="${x < 110 ? 40 - x * .6 + 10 : -26 + (x - 110) * .6 + 10}" x2="${x + 10}" y2="120" stroke="#9fc5d8" stroke-width="2"/>`).join('')}
    <g transform="translate(190 70)"><circle r="18" fill="#dfe6f0" stroke="#5b6275" stroke-width="3"/><g id="ffan">${[0, 120, 240].map(a => `<path d="M0 0 C -4 -8, -2 -16, 4 -16 C 8 -10, 4 -4, 0 0" fill="#5b6275" transform="rotate(${a})"/>`).join('')}</g></g>
    ${[30, 70, 110, 150].map(x => `<path d="M${x} 118 c -6 -16, -2 -30, 8 -36 c 4 12, 2 26, -8 36" fill="#43a047"/>`).join('')}
    <text x="110" y="148" class="flbl">البيت المحمي</text></g>
  <g transform="translate(1000 230)"><rect x="0" y="10" width="54" height="170" rx="8" fill="#b0bec5" stroke="#78909c" stroke-width="4"/><rect id="fwater" x="6" y="60" width="42" height="114" rx="4" fill="#4fc3f7"/>
    <rect x="-6" y="0" width="66" height="14" rx="5" fill="#78909c"/><text x="27" y="206" class="flbl">الخزان</text></g>
  <g transform="translate(1150 200)"><path d="M0 120 L150 20 L300 120 Z" fill="#c0392b"/><rect x="20" y="118" width="260" height="170" fill="#f4e3c3" stroke="#c9a97a" stroke-width="4"/>
    <rect x="120" y="186" width="56" height="102" rx="6" fill="#8d6e48"/><circle cx="164" cy="240" r="5" fill="#ffd23f"/>
    ${[[44, 150], [206, 150]].map(([x, y]) => `<rect x="${x}" y="${y}" width="56" height="50" rx="4" fill="#5b6275" class="fwin"/><line x1="${x + 28}" y1="${y}" x2="${x + 28}" y2="${y + 50}" stroke="#c9a97a" stroke-width="3"/>`).join('')}
    <g transform="translate(40 30) rotate(-34)"><rect width="110" height="34" rx="4" fill="#1f5fae" stroke="#cfd8e6" stroke-width="3"/>${[27, 55, 82].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="34" stroke="#cfd8e6" stroke-width="2"/>`).join('')}</g>
    <text x="150" y="310" class="flbl">المنزل الذكي</text></g>
  <g id="fevent" class="fevent"><rect x="560" y="18" width="480" height="58" rx="29"/><text x="800" y="56" id="fevt"></text></g>
  <g class="fclock"><rect x="20" y="18" width="200" height="58" rx="29"/><text x="120" y="58" id="fclk">٠٦:٠٠</text></g>
</svg>`;

/* ================== الريليه ================== */
const relaySVG = () => `<svg viewBox="0 0 1000 560" class="relsvg">
  <rect x="20" y="20" width="420" height="520" rx="26" class="lowside"/><rect x="520" y="20" width="460" height="520" rx="26" class="highside"/>
  <text x="230" y="62" class="rside">جانب الأردوينو (٥ فولت)</text><text x="750" y="62" class="rside hs">جانب الحِمل (١٢ فولت)</text>
  <line x1="480" y1="30" x2="480" y2="530" class="iso"/><text x="480" y="548" class="isot">عزل: لا اتصال كهربائي بين الجانبين</text>
  <g transform="translate(60 120)"><rect width="120" height="80" rx="12" fill="#0e7c86"/><text x="60" y="34" class="rlab w">Arduino</text><text x="60" y="62" class="rpin" id="rpin">D4 = LOW</text></g>
  <path d="M180 160 L250 160 L250 240" class="rw" id="rsig"/><circle cx="250" cy="260" r="16" class="rled" id="rled"/><text x="250" y="300" class="rsm">ليد الوحدة</text>
  <g transform="translate(150 360)"><rect x="-10" y="-20" width="200" height="120" rx="10" class="coilbox"/>
    ${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${30 + i * 16}" cy="40" rx="8" ry="30" class="coil"/>`).join('')}<rect x="20" y="34" width="150" height="12" rx="4" fill="#8a909c"/>
    <g id="rfield" opacity="0">${[0, 1, 2].map(i => `<ellipse cx="95" cy="40" rx="${100 + i * 22}" ry="${54 + i * 14}" class="field"/>`).join('')}</g>
    <text x="95" y="122" class="rsm">ملف كهرومغناطيسي</text></g>
  <g transform="translate(560 120)">
    <circle cx="40" cy="200" r="10" class="pivot"/><g id="rarm" style="transform-origin:40px 200px"><rect x="40" y="194" width="220" height="12" rx="6" class="arm"/></g>
    <circle cx="270" cy="120" r="12" class="contact" id="cNO"/><circle cx="270" cy="280" r="12" class="contact" id="cNC"/>
    <text x="300" y="126" class="rlab">NO</text><text x="300" y="286" class="rlab">NC</text><text x="40" y="240" class="rlab">COM</text></g>
  <g transform="translate(870 120)"><circle r="34" class="pump" id="rpumpb"/><g id="rpump">${[0, 90, 180, 270].map(a => `<rect x="-4" y="-28" width="8" height="24" rx="4" fill="#1b2340" transform="rotate(${a})"/>`).join('')}</g><text y="60" class="rsm">مضخة (NO)</text></g>
  <g transform="translate(870 420)"><circle r="26" class="bulb" id="rbulb"/><text y="52" class="rsm">ليد (NC)</text></g>
  <g transform="translate(620 470)"><rect width="110" height="44" rx="8" fill="#1c1f27"/><text x="55" y="29" class="rlab w">12V</text></g>
  <path d="M600 320 L600 470" class="rw2"/><path d="M830 240 L870 240 L870 154" class="rw2 no" id="pNO"/><path d="M830 400 L870 400 L870 394" class="rw2 nc" id="pNC"/>
  <path d="M730 492 L940 492 L940 120 L904 120 M940 420 L896 420" class="rw2"/>
  <path id="fNO" class="flowp" d="M600 470 L600 320 L830 240 L870 240 L870 154"/><path id="fNC" class="flowp" d="M600 470 L600 320 L830 400 L870 400"/>
</svg>`;
const REL_CODE = `int relay = 4;

void setup() {
  pinMode(relay, OUTPUT);
}

void loop() {
  digitalWrite(relay, HIGH);
  delay(3000);
  digitalWrite(relay, LOW);
  delay(3000);
}`;

/* ================== شاشة LCD ================== */
const LCD_T = [
  { k: 'hello', name: '👋 مرحبًا', code: `lcd.init();
lcd.backlight();
lcd.setCursor(0, 0);
lcd.print("Hello Farm!");
lcd.setCursor(0, 1);
lcd.print("Smart & Green");`, ops: [[1, 'clear'], [2, 'light'], [3, 'cur', 0, 0], [4, 'print', 'Hello Farm!'], [5, 'cur', 0, 1], [6, 'print', 'Smart & Green']] },
  { k: 'live', name: '📟 قراءات حية', code: `lcd.setCursor(0, 0);
lcd.print("Soil:");
lcd.print(soil);
lcd.print("% T:");
lcd.print(temp);
lcd.setCursor(0, 1);
lcd.print(pump ? "Pump: ON " : "Pump: OFF");`, live: true },
  { k: 'center', name: '🎯 في المنتصف', code: `lcd.clear();
lcd.setCursor(4, 0);
lcd.print("JUTHOOR");
lcd.setCursor(2, 1);
lcd.print("Arduino Farm");`, ops: [[1, 'clear'], [2, 'cur', 4, 0], [3, 'print', 'JUTHOOR'], [4, 'cur', 2, 1], [5, 'print', 'Arduino Farm']] },
  { k: 'arabic', name: '🔤 عربي؟', code: `lcd.clear();
lcd.print("مرحبا");
// الشاشة لا تعرف العربية!
lcd.setCursor(0, 1);
lcd.print("Use English :)");`, ops: [[1, 'clear'], [2, 'print', '\x01\x01\x01\x01\x01\x01\x01\x01\x01\x01'], [4, 'cur', 0, 1], [5, 'print', 'Use English :)']] },
  { k: 'custom', name: '💧 رمز خاص', code: `byte drop[8] = {4,4,10,10,17,17,17,14};
lcd.createChar(0, drop);
lcd.clear();
lcd.write(byte(0));
lcd.print(" Water: 85%");`, ops: [[1, 'noop'], [2, 'noop'], [3, 'clear'], [4, 'print', '\x02'], [5, 'print', ' Water: 85%']] },
];

/* ================== دوائر البناء ================== */
B2.relaywire = { flow: 8, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نجرّب الريليه على الطاولة قبل تركيبه في المزرعة.' },
  { h: 'وحدة الريليه', b: 'جانب التحكم: VCC وGND وIN. وجانب الحِمل: ثلاثة مشابك COM وNO وNC.' },
  { h: 'VCC إلى 5V · GND إلى GND', b: 'طاقة ملف الريليه من الأردوينو.' },
  { h: 'IN ← المنفذ 4', b: 'إشارة واحدة من الأردوينو تفتح الريليه أو تغلقه.' },
  { h: 'موجب البطارية ← COM', b: 'جانب الحِمل منفصل تمامًا: بطارية ١٢ فولت أو ٥ للمضخة الصغيرة.' },
  { h: 'NO ← موجب المضخة', b: 'NO «مفتوح عادةً»: لا يمر التيار حتى يعمل الريليه.' },
  { h: 'سالب المضخة ← سالب البطارية', b: 'اكتملت الدائرة الثانية، لكنها مقطوعة عند الريليه.' },
  { h: 'شغّل!', b: 'digitalWrite(4, HIGH): نقرة، ويضيء ليد الوحدة، وتضخ المضخة الماء.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 rlw">
  ${base({ 4: '4' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2"><rect x="${col(1) - 16}" y="190" width="${col(8) - col(1) + 32}" height="100" rx="10" fill="#1f5fae"/>
    <rect x="${col(4)}" y="206" width="90" height="70" rx="6" fill="#2b6fc0" stroke="#cfe0ff" stroke-width="2"/><text x="${col(4) + 45}" y="246" class="lbl" style="font-size:12px;fill:#fff">SRD-05VDC</text>
    <circle cx="${col(2)}" cy="214" r="7" class="rlled"/>
    ${['VCC', 'GND', 'IN'].map((t, i) => `<line x1="${col(1 + i)}" y1="290" x2="${col(1 + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(1 + i)}" y="284" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}
    ${['COM', 'NO', 'NC'].map((t, i) => `<rect x="${col(8) + 4}" y="${200 + i * 28}" width="34" height="22" rx="3" fill="#2b6fc0"/><text x="${col(8) + 21}" y="${215 + i * 28}" class="lbl" style="font-size:10px;fill:#fff">${t}</text>`).join('')}</g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(1)} 336 L${col(1)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}${wire(`M${col(2)} 336 L${col(2)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(4)} 150 C ${pinX(4)} 90, 420 110, 420 250 C 420 350, ${col(3) - 16} 340, ${col(3)} 336`, 4, '#e0b400')}
  <g class="bs" data-s="5"><rect x="760" y="60" width="110" height="52" rx="8" fill="#1c1f27"/><text x="815" y="93" class="lbl" style="font-size:16px;fill:#f0cc7a">12V</text></g>
  ${wire(`M790 112 C 790 160, ${col(8) + 50} 160, ${col(8) + 38} 211`, 5, '#e74c3c')}
  <g class="bs" data-s="6"><g transform="translate(780 330)"><circle r="40" fill="#cfd8dc" stroke="#78909c" stroke-width="4"/><g class="rlpump">${[0, 90, 180, 270].map(a => `<rect x="-4" y="-32" width="8" height="26" rx="4" fill="#1b2340" transform="rotate(${a})"/>`).join('')}</g><text y="64" class="lbl" style="font-size:14px">مضخة</text>
    <path d="M40 0 C 70 0, 80 -30, 90 -60" fill="none" stroke="#4fc3f7" stroke-width="8" class="rlwater"/></g></g>
  ${wire(`M${col(8) + 38} 239 C 760 239, 760 290, 760 300`, 6, '#e74c3c')}
  ${wire(`M800 300 C 860 260, 860 120, 840 112`, 7, '#1b2340')}
</svg>` };

B2.lcdwire = { flow: 4, steps: [
  { h: 'اللوحة والشاشة', b: 'شاشة ١٦ × ٢ خلفها لوحة صغيرة I2C: تختصر ١٦ سلكًا إلى أربعة فقط!' },
  { h: 'GND و VCC', b: 'إلى GND و5V في الأردوينو.' },
  { h: 'SDA ← A4 · SCL ← A5', b: 'سلكا البيانات والساعة في بروتوكول I2C. في Uno هما A4 وA5 دائمًا.' },
  { h: 'اضبط التباين واكتب!', b: 'مقبض أزرق صغير خلف الشاشة يضبط وضوح الحروف. إن رأيت مربعات بيضاء فقط فأدِره.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 lcw">
  ${base({}, { 0: '5V', 1: 'GND', 4: 'A4', 5: 'A5' })}
  <g class="bs" data-s="1"><rect x="430" y="120" width="440" height="190" rx="12" fill="#1f6b3a"/><rect x="458" y="150" width="384" height="120" rx="6" fill="#0b3d1f"/>
    <rect x="470" y="162" width="360" height="96" rx="4" class="lcdscr"/><text x="490" y="202" class="lcdtx">Hello Farm!</text><text x="490" y="242" class="lcdtx">Smart &amp; Green</text>
    <rect x="400" y="160" width="40" height="110" rx="4" fill="#1c1f27"/>${['GND', 'VCC', 'SDA', 'SCL'].map((t, i) => `<rect x="388" y="${170 + i * 24}" width="14" height="12" fill="#c9ccd3"/><text x="378" y="${180 + i * 24}" class="lbl" style="font-size:11px;text-anchor:end">${t}</text>`).join('')}</g>
  ${wire(`M${botX(1)} 425 C ${botX(1)} 480, 360 470, 360 176 L388 176`, 2, '#1b2340')}${wire(`M${botX(0)} 425 C ${botX(0)} 490, 372 480, 372 200 L388 200`, 2, '#e74c3c')}
  ${wire(`M${botX(4)} 425 C ${botX(4)} 470, 352 460, 352 224 L388 224`, 3, '#2e9e6b')}${wire(`M${botX(5)} 425 C ${botX(5)} 460, 344 450, 344 248 L388 248`, 3, '#e0b400')}
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  farmhero: s => `<div class="slide dark farmhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="htitle">${s.title}</h1>
      <div class="fwrap">${farmSVG()}</div>
      <div class="fchips">${FEATS.map(([i, t], k) => `<div class="fch" style="animation-delay:${k * 1.5}s"><b>${i}</b>${t}</div>`).join('')}</div></div>`,

  relaylab: s => `<div class="slide light">
      <div class="kicker">🔌 ريليه شفاف</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="rlgrid">
        <div class="rlleft ix">
          <div class="tonecode" dir="ltr" id="rlcode">${highlight('digitalWrite(4, LOW);')}</div>
          <button class="clap" id="rltog">⚡ اكتب HIGH</button>
          <button class="sndbtn" id="rlmode">🔁 الوحدة تعمل على: HIGH</button>
          <div class="rlstate"><div class="ac"><span>الملف</span><b id="rlcoil">لا يعمل</b></div><div class="ac gold"><span>COM متصل بـ</span><b id="rlcom">NC</b></div></div>
          ${codeBlock(REL_CODE, 'micro')}
        </div>
        <div class="rlright ix">${relaySVG()}</div>
      </div></div>`,

  lcdlab: s => `<div class="slide light">
      <div class="kicker">📟 شاشة LCD</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="lcgrid">
        <div class="lcleft ix"><div class="lctabs">${LCD_T.map((t, i) => `<button class="lsb${i === 0 ? ' on' : ''}" data-i="${i}">${t.name}</button>`).join('')}</div>
          <div class="lccode" id="lccode"></div>
          <div class="lcnote" id="lcnote"></div></div>
        <div class="lcright">
          <div class="lcd"><div class="lcdpcb"><div class="lcdglass" id="lcdg">${Array.from({ length: 32 }, (_, i) => `<i data-i="${i}"></i>`).join('')}</div></div>
            <div class="lcdcols" dir="ltr">${Array.from({ length: 16 }, (_, i) => `<span>${i}</span>`).join('')}</div></div>
          <div class="lclive ix" id="lclive"><label class="lsl"><span>🌱 soil: <b id="lcsv">42</b>%</span><input type="range" id="lcs" min="0" max="100" value="42"></label>
            <label class="lsl"><span>🌡️ temp: <b id="lctv">27</b></span><input type="range" id="lct" min="10" max="45" value="27"></label>
            <button class="sndbtn" id="lcp">💧 pump: OFF</button></div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  farmhero(sl) {
    const $ = id => sl.querySelector('#' + id);
    let raf = 0, t0 = 0;
    const DAY = 24;                                                     // ثانية واحدة لكل ساعة من اليوم
    const EVENTS = [[5.5, 7, '🌱 ٠٥:٣٠ التربة جافة ← تشغيل الري'], [11, 15, '🌡️ الحرارة ٣٢ ← المروحة تعمل'], [13.2, 14.8, '🌧️ مطر! ← إلغاء الري وملء الخزان'], [18.5, 20, '💡 غروب الشمس ← إضاءة البيت'], [22, 23.5, '🔒 وقت النوم ← قفل الباب وتشغيل الإنذار']];
    const loop = ts => {
      t0 = t0 || ts; const h = (6 + (ts - t0) / 1000 * (24 / DAY)) % 24;
      const day = clamp(Math.sin((h - 6) / 12 * Math.PI) * 1.4, 0, 1);         // ١ ظهرًا، ٠ ليلًا
      $('fs0').setAttribute('stop-color', mix('#0b1640', '#4fa8e0', day)); $('fs1').setAttribute('stop-color', mix('#22346f', '#d9f0fb', day));
      const a = (h - 6) / 12 * Math.PI; $('fsunc').setAttribute('cx', 800 - Math.cos(a) * 700); $('fsunc').setAttribute('cy', 420 - Math.sin(a) * 340); $('fsunc').setAttribute('opacity', h > 5.5 && h < 18.5 ? 1 : 0);
      const b = ((h + 6) % 24) / 12 * Math.PI; $('fmoon').setAttribute('cx', 800 - Math.cos(b) * 650); $('fmoon').setAttribute('cy', 420 - Math.sin(b) * 300); $('fmoon').setAttribute('opacity', (1 - day) * (h > 18 || h < 6 ? 1 : 0));
      $('fstars').setAttribute('opacity', (1 - day) * 0.9);
      sl.querySelectorAll('.fwin').forEach(w => w.style.fill = h > 18.5 || h < 6 ? '#ffd54f' : '#5b6275');
      $('fspray').setAttribute('opacity', h > 5.5 && h < 7 ? 1 : 0);
      $('ffan').setAttribute('transform', `rotate(${h > 11 && h < 15 ? (ts / 2) % 360 : 0})`);
      const cx = h > 12 && h < 16 ? lerp(-200, 1800, (h - 12) / 4) : -400; $('fcloud').setAttribute('transform', `translate(${cx} 130)`); $('frain').setAttribute('opacity', h > 13.2 && h < 14.8 ? 1 : 0);
      const lvl = h < 5.5 ? 0.75 : h < 7 ? lerp(0.75, 0.45, (h - 5.5) / 1.5) : h < 13.2 ? 0.45 : h < 14.8 ? lerp(0.45, 0.9, (h - 13.2) / 1.6) : 0.9;
      $('fwater').setAttribute('y', 60 + (1 - lvl) * 110); $('fwater').setAttribute('height', 114 - (1 - lvl) * 110);
      sl.querySelectorAll('.fruit').forEach(f => f.style.fill = day > .2 ? '#e53935' : '#8d3b3b');
      $('fclk').textContent = hhmm(h);
      const ev = EVENTS.find(([s, e]) => h >= s && h < e); $('fevt').textContent = ev ? ev[2] : ''; $('fevent').style.opacity = ev ? 1 : 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  relaylab(sl) {
    const $ = id => sl.querySelector('#' + id);
    let pinHigh = false, activeLow = false, raf = 0, ang = 0, last = 0;
    const svg = sl.querySelector('.relsvg'), lines = sl.querySelectorAll('.rlleft .ln');
    const upd = (snd) => {
      const on = activeLow ? !pinHigh : pinHigh;
      $('rlcode').innerHTML = highlight(`digitalWrite(4, ${pinHigh ? 'HIGH' : 'LOW'});`);
      $('rltog').textContent = pinHigh ? '⚡ اكتب LOW' : '⚡ اكتب HIGH';
      $('rlmode').textContent = `🔁 الوحدة تعمل على: ${activeLow ? 'LOW (شائع جدًا!)' : 'HIGH'}`;
      $('rpin').textContent = `D4 = ${pinHigh ? 'HIGH' : 'LOW'}`; $('rsig').classList.toggle('hot', pinHigh);
      $('rlcoil').textContent = on ? 'يعمل ⚡' : 'لا يعمل'; $('rlcoil').classList.toggle('on', on); $('rlcom').textContent = on ? 'NO' : 'NC';
      svg.classList.toggle('on', on);
      lines.forEach(l => l.classList.toggle('run', +l.dataset.n === (pinHigh ? 8 : 10)));
      if (snd) click();
    };
    $('rltog').onclick = () => { const before = activeLow ? !pinHigh : pinHigh; pinHigh = !pinHigh; upd(before !== (activeLow ? !pinHigh : pinHigh)); };
    $('rlmode').onclick = () => { const before = activeLow ? !pinHigh : pinHigh; activeLow = !activeLow; upd(before !== (activeLow ? !pinHigh : pinHigh)); };
    const loop = ts => { const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; if (svg.classList.contains('on')) ang += dt * 720; $('rpump').setAttribute('transform', `rotate(${ang})`); raf = requestAnimationFrame(loop); };
    upd(false); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  lcdlab(sl) {
    const cells = [...sl.querySelectorAll('.lcdglass i')], glass = sl.querySelector('.lcdglass');
    let ti = 0, timers = [], cx = 0, cy = 0, soil = 42, temp = 27, pump = false;
    const put = (ch) => { if (cx > 15) return; const c = cells[cy * 16 + cx]; c.textContent = ch === '\x01' ? '' : ch === '\x02' ? '' : ch; c.className = ch === '\x01' ? 'junk' : ch === '\x02' ? 'drop' : ''; cx++; };
    const showCur = () => cells.forEach((c, i) => c.classList.toggle('cur', i === cy * 16 + cx));
    const clear = () => { cells.forEach(c => { c.textContent = ''; c.className = ''; }); cx = 0; cy = 0; };
    const lines = () => sl.querySelectorAll('#lccode .ln');
    const NOTES = { hello: 'init تجهّز الشاشة، وbacklight تُضيء خلفيتها. setCursor(العمود، السطر) والعدّ يبدأ من صفر.', live: 'حرّك المقابض: الشاشة تتحدث كل ثانية بالقراءات. لاحظ المسافة بعد ON حتى تمسح حرف F المتبقي من OFF!',
      center: 'لتوسيط نص: (١٦ − طول النص) ÷ ٢. كلمة JUTHOOR ٧ حروف، فنبدأ من العمود ٤.', arabic: 'الشاشة تعرف الحروف الإنجليزية والأرقام فقط، فتظهر العربية رموزًا غريبة. الحل: كلمات إنجليزية قصيرة، أو رموز خاصة.',
      custom: 'نرسم رمزًا خاصًا من ٥ × ٨ نقاط: كل رقم سطر من النقاط بالنظام الثنائي. يمكن حفظ ٨ رموز خاصة.' };
    const run = () => {
      timers.forEach(clearTimeout); timers = []; const T = LCD_T[ti];
      sl.querySelector('#lccode').innerHTML = codeBlock(T.code, 'micro'); sl.querySelector('#lcnote').textContent = NOTES[T.k];
      sl.querySelector('#lclive').style.visibility = T.live ? 'visible' : 'hidden';
      clear(); glass.classList.add('lit');
      if (T.live) { const draw = () => { clear(); const l1 = `Soil:${soil}% T:${temp}`, l2 = pump ? 'Pump: ON ' : 'Pump: OFF'; [...l1].forEach(put); cx = 0; cy = 1; [...l2].forEach(put); showCur();
          lines().forEach(l => l.classList.add('run')); timers.push(setTimeout(() => lines().forEach(l => l.classList.remove('run')), 300)); timers.push(setTimeout(draw, 1000)); }; draw(); return; }
      let t = 300;
      T.ops.forEach(op => {
        timers.push(setTimeout(() => { lines().forEach(l => l.classList.toggle('run', +l.dataset.n === op[0]));
          if (op[1] === 'clear') clear(); if (op[1] === 'light') glass.classList.add('lit'); if (op[1] === 'cur') { cx = op[2]; cy = op[3]; } showCur(); }, t));
        t += 500;
        if (op[1] === 'print') [...op[2]].forEach(ch => { timers.push(setTimeout(() => { put(ch); showCur(); }, t)); t += 110; });
      });
      timers.push(setTimeout(() => lines().forEach(l => l.classList.remove('run')), t + 400));
    };
    sl.querySelectorAll('.lctabs .lsb').forEach(b => b.onclick = () => { ti = +b.dataset.i; sl.querySelectorAll('.lctabs .lsb').forEach(x => x.classList.toggle('on', x === b)); run(); });
    sl.querySelector('#lcs').oninput = e => { soil = +e.target.value; sl.querySelector('#lcsv').textContent = soil; };
    sl.querySelector('#lct').oninput = e => { temp = +e.target.value; sl.querySelector('#lctv').textContent = temp; };
    sl.querySelector('#lcp').onclick = e => { pump = !pump; e.target.textContent = `💧 pump: ${pump ? 'ON' : 'OFF'}`; };
    run();
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },
});
})();
