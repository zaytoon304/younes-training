/* =====================================================================
   أدوات الجزء الثاني (الحساسات والمحركات) — تُضاف فوق أدوات الجزء الأول
   الأنواع: sensehero · catalog · adclab · ldrlab · build2
   تعتمد على window.ARD (التلوين والكود) من ../arduino/widgets.js
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const fx = (v, d = 2) => Number(v).toFixed(d);

/* ---------- راسم إشارات مصغّر (Serial Plotter) ---------- */
function plotter(id, label, max = 1023) {
  return `<div class="plot"><div class="pbar" dir="ltr">📈 Serial Plotter <span>${label} · 0–${max}</span></div>
    <svg viewBox="0 0 600 190" class="psvg" id="${id}" preserveAspectRatio="none">
      <line x1="0" y1="10" x2="600" y2="10" class="pg"/><line x1="0" y1="95" x2="600" y2="95" class="pg"/><line x1="0" y1="180" x2="600" y2="180" class="pg"/>
      <polyline class="pl" points=""/><line class="pth" x1="0" x2="600" y1="0" y2="0" style="display:none"/></svg></div>`;
}
function plotFeed(svg, buf, v, max = 1023, n = 60) {
  buf.push(v); while (buf.length > n) buf.shift();
  svg.querySelector('.pl').setAttribute('points', buf.map((x, i) => `${(i / (n - 1)) * 600},${180 - (x / max) * 170}`).join(' '));
}

/* ---------- غلاف: يحسّ ← يقرر ← يتحرك ---------- */
const senseSVG = () => `<svg viewBox="0 0 1500 420" class="sensesvg">
  <defs><marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#F0CC7A"/></marker></defs>
  <g class="sg f"><circle cx="210" cy="190" r="150" class="ring"/>
    <text x="210" y="170" class="big">👁️</text><text x="210" y="265" class="lab">يحسّ</text><text x="210" y="310" class="en">SENSORS</text></g>
  <path d="M380 190 L560 190" class="arr" marker-end="url(#ar2)"/>
  <g class="sg f"><circle cx="750" cy="190" r="150" class="ring gold"/>
    <text x="750" y="170" class="big">🧠</text><text x="750" y="265" class="lab">يقرر</text><text x="750" y="310" class="en">ARDUINO</text></g>
  <path d="M920 190 L1100 190" class="arr" marker-end="url(#ar2)"/>
  <g class="sg f"><circle cx="1290" cy="190" r="150" class="ring"/>
    <text x="1290" y="170" class="big">⚙️</text><text x="1290" y="265" class="lab">يتحرك</text><text x="1290" y="310" class="en">MOTORS</text></g>
</svg>`;

/* ---------- كتالوج الحساسات والمحركات ---------- */
const CAT = [
  { k: 'in', sig: 'a', icon: '🎛️', ar: 'المقاومة المتغيرة', en: 'Potentiometer', b: 'مقبض يغيّر الجهد من 0 إلى 5 فولت. أبسط مدخل تماثلي.', ex: 'التحكم في الصوت والسطوع' },
  { k: 'in', sig: 'a', icon: '☀️', ar: 'حساس الضوء', en: 'LDR · Photoresistor', b: 'مقاومته تقل كلما زاد الضوء.', ex: 'إنارة الشوارع التلقائية' },
  { k: 'in', sig: 'a', icon: '🌡️', ar: 'حساس الحرارة', en: 'TMP36 / DHT11', b: 'يحوّل الحرارة إلى جهد أو إلى بيانات رقمية.', ex: 'المروحة والمكيف الذكي' },
  { k: 'in', sig: 'd', icon: '🦇', ar: 'الموجات فوق الصوتية', en: 'HC-SR04 Ultrasonic', b: 'يقيس المسافة بزمن ارتداد الصدى، كالخفاش.', ex: 'حساس ركن السيارة' },
  { k: 'in', sig: 'd', icon: '🚶', ar: 'حساس الحركة', en: 'PIR Motion', b: 'يلتقط حرارة الجسم المتحرك أمامه.', ex: 'إنذار اللصوص والأبواب الآلية' },
  { k: 'in', sig: 'd', icon: '〰️', ar: 'حساس الأشعة تحت الحمراء', en: 'IR Sensor', b: 'يميّز الأسود من الأبيض بانعكاس الضوء.', ex: 'روبوت يتتبع الخط' },
  { k: 'in', sig: 'a', icon: '🎤', ar: 'حساس الصوت', en: 'Sound Sensor', b: 'يلتقط شدة الصوت حوله.', ex: 'إضاءة تعمل بالتصفيق' },
  { k: 'out', sig: 'p', icon: '🔊', ar: 'البازر', en: 'Buzzer', b: 'يصدر نغمات بتردد نحدده بالأمر tone.', ex: 'الإنذار والألحان' },
  { k: 'out', sig: 'p', icon: '🦾', ar: 'محرك السيرفو', en: 'Servo Motor', b: 'يدور إلى زاوية محددة بدقة من 0 إلى 180 درجة.', ex: 'ذراع الروبوت والبوابات' },
  { k: 'out', sig: 'p', icon: '🌀', ar: 'محرك التيار المستمر', en: 'DC Motor', b: 'يدور باستمرار، ونتحكم في سرعته واتجاهه بدرايفر.', ex: 'عجلات السيارة والمراوح' },
  { k: 'out', sig: 'd', icon: '⚙️', ar: 'المحرك الخطوي', en: 'Stepper Motor', b: 'يدور خطوة خطوة بدقة عالية.', ex: 'الطابعات ثلاثية الأبعاد' },
];
const SIG = { a: ['〰️ تماثلي', 'a'], d: ['🔢 رقمي', 'd'], p: ['⚡ نبضات', 'p'] };

/* ---------- مختبر القراءة التماثلية (مقاومة متغيرة) ---------- */
const ADC_CODE = `int knob = A0;
int led = 9;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int value = analogRead(knob);
  int bright = map(value, 0, 1023, 0, 255);
  analogWrite(led, bright);
  Serial.println(value);
}`;
const potSVG = () => `<svg viewBox="0 0 360 360" class="potsvg">
  <circle cx="180" cy="180" r="150" class="potbase"/>
  ${Array.from({ length: 11 }, (_, i) => { const a = (-135 + i * 27) * Math.PI / 180;
    return `<line x1="${180 + Math.sin(a) * 158}" y1="${180 - Math.cos(a) * 158}" x2="${180 + Math.sin(a) * 172}" y2="${180 - Math.cos(a) * 172}" class="tick"/>`; }).join('')}
  <g class="knob"><circle cx="180" cy="180" r="112" class="potknob"/><rect x="172" y="84" width="16" height="62" rx="8" class="potmark"/></g>
  <text x="44" y="344" class="potl">0V</text><text x="316" y="344" class="potl">5V</text></svg>`;

/* ---------- مختبر حساس الضوء ومقسم الجهد ---------- */
const LDR_CODE = `int ldr = A0;
int lamp = 13;
int limit = 400;

void setup() {
  pinMode(lamp, OUTPUT);
}

void loop() {
  int light = analogRead(ldr);
  if (light < limit) {
    digitalWrite(lamp, HIGH);
  } else {
    digitalWrite(lamp, LOW);
  }
}`;
/* مقاومة LDR تقريبية: ~١ كيلو أوم في ضوء قوي، وتصل إلى ~٢٠٠ كيلو أوم في الظلام (منحنى لوغاريتمي) */
const ldrR = lux => 1000 * Math.pow(200, 1 - lux / 100);
const ldrScene = () => `<svg viewBox="0 0 700 430" class="ldrscene">
  <rect x="0" y="0" width="700" height="430" class="sky"/>
  <circle cx="560" cy="90" r="46" class="sun"/><path d="M520 70 a42 42 0 1 0 50 60 a36 36 0 1 1 -50 -60z" class="moon"/>
  ${[[70, 60], [180, 120], [300, 40], [420, 150], [640, 190]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" class="star"/>`).join('')}
  <rect x="0" y="360" width="700" height="70" class="road"/>
  ${[40, 180, 320, 460, 600].map(x => `<rect x="${x}" y="392" width="70" height="8" rx="4" class="lane"/>`).join('')}
  <polygon points="190,215 70,370 310,370" class="beam"/>
  <rect x="182" y="120" width="16" height="250" rx="6" class="pole"/>
  <path d="M190 128 C190 96 250 96 250 128" class="arm"/>
  <rect x="222" y="126" width="56" height="26" rx="10" class="head"/><circle cx="250" cy="160" r="14" class="bulb"/>
  <g transform="translate(470 270)"><rect x="-38" y="-22" width="76" height="44" rx="22" class="ldrbody"/>
    <path d="M-24 -6 h10 v12 h10 v-12 h10 v12 h10 v-12 h8" class="ldrzig"/><text x="0" y="52" class="lbl2">LDR</text></g>
</svg>`;
const dividerSVG = () => `<svg viewBox="0 0 330 430" class="divsvg">
  <text x="165" y="30" class="dvt">5V</text><line x1="165" y1="40" x2="165" y2="70" class="dw"/>
  <rect x="135" y="70" width="60" height="110" rx="14" class="dvr ldr"/><text x="215" y="120" class="dvl" text-anchor="start">LDR</text><text x="215" y="152" class="dvv" id="dr1" text-anchor="start"></text>
  <line x1="165" y1="180" x2="165" y2="240" class="dw"/><circle cx="165" cy="215" r="9" class="dnode"/>
  <line x1="165" y1="215" x2="40" y2="215" class="dw"/><text x="30" y="205" class="dvt" text-anchor="end" style="font-size:24px">A0</text>
  <rect x="135" y="240" width="60" height="110" rx="14" class="dvr"/><text x="215" y="290" class="dvl" text-anchor="start">10kΩ</text>
  <line x1="165" y1="350" x2="165" y2="385" class="dw"/><text x="165" y="418" class="dvt">GND</text>
</svg>`;

/* ---------- بناء دائرة خطوة بخطوة (للجزء الثاني) ----------
   كل عنصر يحمل data-s (الخطوة التي يظهر فيها)، وعند خطوة flow تبدأ الحركة (الصنف running) */
const B2 = {};
const col = c => 470 + c * 26;
const pinX = i => 148 + i * 32;
const holes = () => { let h = '';
  for (let c = 0; c < 15; c++) { const x = col(c);
    for (let r = 0; r < 5; r++) h += `<circle cx="${x}" cy="${240 + r * 24}" r="4" fill="#cfc8b6"/>`;
    h += `<circle cx="${x}" cy="418" r="4" fill="#cfc8b6"/><circle cx="${x}" cy="442" r="4" fill="#cfc8b6"/>`; }
  return h; };
const base = (top, bottom) => `<g class="bs" data-s="1">
  <rect x="40" y="130" width="300" height="320" rx="24" fill="#0e7c86"/>
  <rect x="130" y="140" width="200" height="30" rx="4" fill="#1b2340"/>
  ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${142 + i * 32}" y="149" width="12" height="12" fill="#0b0d12"/>`).join('')}
  ${Object.entries(top).map(([i, t]) => `<text x="${pinX(+i)}" y="196" class="lbl" style="fill:#e8f6f7;font-size:18px">${t}</text>`).join('')}
  <rect x="100" y="410" width="230" height="30" rx="4" fill="#1b2340"/>
  ${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${112 + i * 32}" y="419" width="12" height="12" fill="#0b0d12"/>`).join('')}
  ${Object.entries(bottom).map(([i, t]) => `<text x="${118 + i * 32}" y="400" class="lbl" style="fill:#e8f6f7;font-size:17px">${t}</text>`).join('')}
  <rect x="110" y="250" width="160" height="60" rx="6" fill="#15171e"/><text x="190" y="288" class="lbl" style="fill:#8a90a0">UNO</text>
  <rect x="440" y="200" width="420" height="270" rx="16" fill="#f6f3ec" stroke="#e2dccd" stroke-width="3"/>
  <line x1="455" y1="404" x2="845" y2="404" stroke="#e74c3c" stroke-width="3"/><line x1="455" y1="456" x2="845" y2="456" stroke="#3b6fd8" stroke-width="3"/>
  <text x="452" y="424" class="sgn" style="font-size:22px;fill:#e74c3c" text-anchor="end">+</text><text x="452" y="448" class="sgn" style="font-size:22px;fill:#3b6fd8" text-anchor="end">−</text>
  ${holes()}</g>`;
const wire = (d, s, c = '#1b2340') => `<path class="bs w" data-s="${s}" pathLength="1" d="${d}" style="stroke:${c}"/>`;
const botX = i => 118 + i * 32;   // منافذ الطاقة والتماثلية أسفل اللوحة: 0=5V 1=GND 2=A0

/* مشروع ١: مقبض يتحكم في سطوع ليد */
B2.potled = { flow: 7, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نبدأ كالعادة: الأردوينو ولوح التوصيل جنبًا إلى جنب.' },
  { h: 'المقاومة المتغيرة', b: 'ضعها بأرجلها الثلاث في ثلاثة أعمدة مختلفة. الرجل الوسطى هي «الماسحة» التي تتغير.' },
  { h: 'الرجل اليمنى إلى 5V', b: 'سلك أحمر من المنفذ 5V إلى الخط الموجب، ومنه إلى الرجل اليمنى.' },
  { h: 'الرجل اليسرى إلى GND', b: 'سلك أسود من GND إلى الخط السالب، ومنه إلى الرجل اليسرى.' },
  { h: 'الوسطى إلى A0', b: 'السلك الأصفر ينقل الجهد المتغير إلى المنفذ التماثلي A0.' },
  { h: 'الليد والمقاومة على ~9', b: 'ليد مع مقاومة 220 أوم على المنفذ 9 (يدعم PWM) لنتحكم في سطوعه.' },
  { h: 'أدِر المقبض!', b: 'ارفع الكود وأدِر المقبض: يزداد السطوع ويقل معه، والأرقام تتغير على الشاشة التسلسلية.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 potw">
  ${base({ 1: 'GND', 5: '~9' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  <g class="bs" data-s="2"><rect x="${col(1) - 18}" y="252" width="${col(3) - col(1) + 36}" height="46" rx="10" fill="#2b5fa8"/>
    <circle cx="${col(2)}" cy="248" r="30" fill="#e8e3d6" stroke="#1b2340" stroke-width="4"/>
    <g class="potspin" style="transform-origin:${col(2)}px 248px"><rect x="${col(2) - 5}" y="222" width="10" height="26" rx="5" fill="#1b2340"/></g>
    ${[1, 2, 3].map(c => `<line x1="${col(c)}" y1="298" x2="${col(c)}" y2="312" stroke="#9aa1b3" stroke-width="5"/>`).join('')}
    <text x="${col(2)}" y="200" class="lbl" style="font-size:18px">المقاومة المتغيرة</text></g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(3)} 312 L${col(3)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 4, '#1b2340')}${wire(`M${col(1)} 312 L${col(1)} 456`, 4, '#1b2340')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 490, ${col(2)} 490, ${col(2)} 336`, 5, '#e0b400')}
  <circle class="glow2" cx="${col(10) + 13}" cy="250" r="56"/>
  <g class="bs" data-s="6"><line x1="${col(10)}" y1="288" x2="${col(10)}" y2="262" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(11)}" y1="288" x2="${col(11)}" y2="266" stroke="#9aa1b3" stroke-width="5"/>
    <path class="led2" d="M${col(10) - 7} 266 L${col(10) - 7} 238 A20 20 0 0 1 ${col(11) + 7} 238 L${col(11) + 7} 266 Z"/>
    <line x1="${col(11)}" y1="336" x2="${col(11)}" y2="352" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(11) - 10}" y="352" width="20" height="50" rx="9" fill="#d9b382"/>
    <rect x="${col(11) - 10}" y="362" width="20" height="5" fill="#d62828"/><rect x="${col(11) - 10}" y="372" width="20" height="5" fill="#d62828"/><rect x="${col(11) - 10}" y="382" width="20" height="5" fill="#7b4a26"/>
    <line x1="${col(11)}" y1="402" x2="${col(11)}" y2="456" stroke="#9aa1b3" stroke-width="5"/></g>
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 70, ${col(10)} 70, ${col(10)} 240`, 6, '#2e9e6b')}
  ${wire(`M${pinX(1)} 150 C ${pinX(1)} 30, 880 30, 880 300 C 880 430, 860 456, 830 456`, 4, '#1b2340')}
</svg>` };

/* مشروع ٢: الإنارة الذكية بحساس الضوء */
B2.ldrlamp = { flow: 7, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نفس البداية المعتادة.' },
  { h: 'حساس الضوء LDR', b: 'رجلاه في عمودين مختلفين. ليس له قطبية، فلا يهم الاتجاه.' },
  { h: 'مقاومة 10 كيلو أوم', b: 'من رجل الحساس إلى الخط السالب. معًا يصنعان «مقسم الجهد».' },
  { h: 'طرف الحساس الآخر إلى 5V', b: 'سلك أحمر من 5V إلى الخط الموجب، ومنه إلى رجل الحساس.' },
  { h: 'نقطة الالتقاء إلى A0', b: 'السلك الأصفر من النقطة بين الحساس والمقاومة إلى A0: هنا يتغير الجهد مع الضوء.' },
  { h: 'مصباح الشارع على المنفذ 13', b: 'ليد أبيض مع مقاومة 220 أوم، يمثّل مصباح الشارع.' },
  { h: 'غطِّ الحساس بيدك!', b: 'حين يحل «الليل» تقل القراءة عن الحد، فيضيء المصباح وحده.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 ldrw">
  ${base({ 1: 'GND', 3: '13' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  <g class="bs" data-s="2"><line x1="${col(2)}" y1="300" x2="${col(2)}" y2="272" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(4)}" y1="300" x2="${col(4)}" y2="272" stroke="#9aa1b3" stroke-width="5"/>
    <rect x="${col(2) - 12}" y="236" width="${col(4) - col(2) + 24}" height="40" rx="20" fill="#e8d7b0" stroke="#8a6d3b" stroke-width="3"/>
    <path d="M${col(2) + 4} 256 h8 v-8 h8 v16 h8 v-16 h8 v16 h8 v-8 h6" fill="none" stroke="#b5462f" stroke-width="3"/>
    <text x="${col(3)}" y="222" class="lbl" style="font-size:18px">LDR</text></g>
  <g class="bs" data-s="3"><line x1="${col(2)}" y1="336" x2="${col(2)}" y2="352" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(2) - 10}" y="352" width="20" height="50" rx="9" fill="#d9b382"/>
    <rect x="${col(2) - 10}" y="362" width="20" height="5" fill="#7b4a26"/><rect x="${col(2) - 10}" y="372" width="20" height="5" fill="#1b1b1b"/><rect x="${col(2) - 10}" y="382" width="20" height="5" fill="#e67e22"/>
    <line x1="${col(2)}" y1="402" x2="${col(2)}" y2="456" stroke="#9aa1b3" stroke-width="5"/><text x="${col(2) - 18}" y="386" class="lbl" style="font-size:15px" text-anchor="end">10kΩ</text></g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 4, '#e74c3c')}${wire(`M${col(4)} 312 L${col(4)} 404`, 4, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 480, ${col(1)} 480, ${col(1)} 336 L${col(1)} 312 L${col(2)} 312`, 5, '#e0b400')}
  <circle class="glow2 white" cx="${col(10) + 13}" cy="250" r="60"/>
  <g class="bs" data-s="6"><line x1="${col(10)}" y1="288" x2="${col(10)}" y2="262" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(11)}" y1="288" x2="${col(11)}" y2="266" stroke="#9aa1b3" stroke-width="5"/>
    <path class="led2 white" d="M${col(10) - 7} 266 L${col(10) - 7} 238 A20 20 0 0 1 ${col(11) + 7} 238 L${col(11) + 7} 266 Z"/>
    <line x1="${col(11)}" y1="336" x2="${col(11)}" y2="352" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(11) - 10}" y="352" width="20" height="50" rx="9" fill="#d9b382"/>
    <rect x="${col(11) - 10}" y="362" width="20" height="5" fill="#d62828"/><rect x="${col(11) - 10}" y="372" width="20" height="5" fill="#d62828"/><rect x="${col(11) - 10}" y="382" width="20" height="5" fill="#7b4a26"/>
    <line x1="${col(11)}" y1="402" x2="${col(11)}" y2="456" stroke="#9aa1b3" stroke-width="5"/>
    <text x="${col(12) + 6}" y="226" class="lbl" style="font-size:17px" text-anchor="start">مصباح الشارع</text></g>
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 70, ${col(10)} 70, ${col(10)} 240`, 6, '#2e9e6b')}
  ${wire(`M${pinX(1)} 150 C ${pinX(1)} 30, 880 30, 880 300 C 880 430, 860 456, 830 456`, 6, '#1b2340')}
  <g class="handcover"><text x="${col(3)}" y="262" style="font-size:80px" text-anchor="middle">✋</text></g>
</svg>` };

/* ---------- رقمي أم تماثلي؟ تجربة حية: زر يبدّل الإضاءة · منظّم يدرّجها ---------- */
const bulbSVG = id => `<svg viewBox="0 0 220 260" class="bulbsvg" id="${id}">
  <line x1="110" y1="0" x2="110" y2="46" stroke="#5b6275" stroke-width="6"/>
  <rect x="84" y="44" width="52" height="34" rx="8" fill="#8b93a7"/>
  <circle class="bglow" cx="110" cy="150" r="100"/>
  <path class="bglass" d="M110 78 C 40 78, 40 190, 88 208 L 132 208 C 180 190, 180 78, 110 78 Z"/>
  <path d="M96 150 q7 -18 14 0 q7 18 14 0" class="bfil"/>
  <rect x="90" y="208" width="40" height="26" rx="6" fill="#8b93a7"/></svg>`;
const DIG_CODE = `if (digitalRead(2) == HIGH) {
  lampOn = !lampOn;
  digitalWrite(13, lampOn);
}`;
const ANA_CODE = `int v = analogRead(A0);
analogWrite(9, map(v, 0, 1023, 0, 255));`;

/* ---------- رسم الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  sensehero: s => `<div class="slide dark center shero">
      <div class="cat">${s.cat || ''}</div>
      <h2>${s.title}</h2>
      ${s.sub ? `<div class="lbl">${s.sub}</div>` : ''}
      ${senseSVG()}</div>`,

  dalab: s => `<div class="slide light">
      <div class="kicker">🧪 تجربة حية</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="dagrid">
        <div class="dapanel dig ix">
          <div class="dahead"><span class="datag">🔘 رقمي · Digital</span><h3>مفتاح النور في بيتك</h3></div>
          <div class="darow">
            <div class="daleft"><button class="bigbtn" id="dbtn"><i></i></button><span class="dahint">اضغط: ضغطة تنير… وضغطة تطفئ</span></div>
            ${bulbSVG('dbulb')}
          </div>
          <div class="dafacts"><div><b id="dread">0</b><span>digitalRead(2)</span></div><div><b id="dstate">مطفأ</b><span>المصباح</span></div></div>
          <div id="dcode">${codeBlock(DIG_CODE, 'micro')}</div>
          ${plotter('dplot', 'digitalRead', 1)}
          <p class="danote">حالتان فقط: <b>0</b> أو <b>1</b>… لا يوجد «نصف ضغطة»</p>
        </div>
        <div class="dapanel ana ix">
          <div class="dahead"><span class="datag">🎚️ تماثلي · Analog</span><h3>منظّم الإضاءة (Dimmer)</h3></div>
          <div class="darow">
            <div class="daleft"><div class="potwrap small" id="apw">${potSVG()}</div><span class="dahint">أدِر المقبض بالماوس</span></div>
            ${bulbSVG('abulb')}
          </div>
          <div class="dafacts"><div><b id="aread">512</b><span>analogRead(A0)</span></div><div><b id="apct">50%</b><span>شدة الإضاءة</span></div></div>
          <div>${codeBlock(ANA_CODE, 'micro')}</div>
          ${plotter('anplot', 'analogRead', 1023)}
          <p class="danote">١٠٢٤ قيمة متدرجة: من <b>0</b> إلى <b>1023</b></p>
        </div>
      </div></div>`,

  catalog: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '🧰 حقيبة الجزء الثاني'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="catbar ix">${[['all', 'الكل'], ['in', '👁️ حساسات (مدخلات)'], ['out', '⚙️ محركات ومخرجات (مخرجات)']].map(([k, n], i) =>
        `<button data-f="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</div>
      <div class="catgrid ix">${CAT.map((c, i) => `<div class="citem ${c.k}" data-i="${i}"><span class="ci">${c.icon}</span><b>${c.ar}</b><small dir="ltr">${c.en}</small>
        <span class="csig ${SIG[c.sig][1]}">${SIG[c.sig][0]}</span></div>`).join('')}</div>
      <div class="catinfo" id="catinfo"><span>👆 اضغط أي قطعة لتعرف ماذا تفعل وأين نراها في حياتنا</span></div></div>`,

  adclab: s => `<div class="slide light">
      <div class="kicker">🔬 مختبر تفاعلي</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="adcgrid">
        <div class="adcleft ix">
          <div class="potwrap" title="اسحب المقبض لتديره">${potSVG()}</div>
          <input type="range" id="adcin" min="0" max="1023" value="512">
          <div class="adcled"><div class="aledbulb" id="aled"></div><span>الليد على ~9</span></div>
        </div>
        <div class="adcmid">
          <div class="adcchain">
            <div class="ac"><span>الجهد على A0</span><b id="av">2.50 V</b></div><i>←</i>
            <div class="ac gold"><span>analogRead</span><b id="araw">512</b></div><i>←</i>
            <div class="ac"><span>map إلى 0–255</span><b id="amap">128</b></div>
          </div>
          <div class="adcbar"><div class="adcfill" id="afill"></div><div class="adcsc"><span>0</span><span>256</span><span>512</span><span>768</span><span>1023</span></div></div>
          <div class="adceq" dir="ltr" id="aeq"></div>
          ${plotter('aplot', 'value')}
        </div>
        <div class="adccode">${codeBlock(ADC_CODE, 'micro')}</div>
      </div></div>`,

  ldrlab: s => `<div class="slide light">
      <div class="kicker">🌗 محاكي</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="ldrgrid">
        <div class="ldrleft ix">
          <div class="scenewrap" id="scene">${ldrScene()}</div>
          <label class="lsl"><span>☀️ ضوء النهار: <b id="llux">80</b>٪</span><input type="range" id="lin" min="0" max="100" value="80"></label>
          <label class="lsl"><span>🎚️ الحد (limit): <b id="llim">400</b></span><input type="range" id="lth" min="50" max="900" value="400"></label>
        </div>
        <div class="ldrmid">
          ${dividerSVG()}
          <div class="ldrfacts"><div><b id="lraw">0</b><span>analogRead(A0)</span></div><div><b id="lstate">مطفأ</b><span>المصباح</span></div></div>
        </div>
        <div class="ldrright">${codeBlock(LDR_CODE, 'micro')}${plotter('lplot', 'light', 1023)}</div>
      </div></div>`,

  build2: s => { const B = B2[s.kind]; return `<div class="slide light">
      <div class="kicker">${s.kicker || '🔧 ابنِ الدائرة خطوة بخطوة'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="bgrid">
        <div class="bpanel2"><div class="bstep"><span class="bnum">اضغط «التالي» لتبدأ</span><h3>${s.intro || 'لنبنِ الدائرة معًا'}</h3><p></p></div>
          <ol class="blist">${B.steps.map(st => `<li>${st.h}</li>`).join('')}</ol></div>
        <div class="bview">${B.svg}</div>
      </div>${B.steps.map(() => '<i class="f"></i>').join('')}</div>`; },
});

/* ---------- ربط التفاعل ---------- */
Object.assign(window.DECK_BIND, {
  dalab(sl) {
    /* الرقمي: الزر يقرأ 1 ما دام الإصبع عليه، وكل ضغطة جديدة تقلب حالة المصباح */
    let pressed = false, lampOn = false, v = 512;
    const btn = sl.querySelector('#dbtn'), db = sl.querySelector('#dbulb'), dl = sl.querySelectorAll('#dcode .ln');
    const setD = () => {
      sl.querySelector('#dread').textContent = pressed ? 1 : 0;
      const st = sl.querySelector('#dstate'); st.textContent = lampOn ? 'مضاء' : 'مطفأ'; st.className = lampOn ? 'on' : '';
      db.style.setProperty('--b', lampOn ? 1 : 0);
      dl.forEach(l => l.classList.toggle('run', pressed && [1, 2, 3].includes(+l.dataset.n)));
    };
    const down = e => { e.preventDefault(); if (pressed) return; pressed = true; lampOn = !lampOn; btn.classList.add('down'); setD(); };
    const up = () => { if (!pressed) return; pressed = false; btn.classList.remove('down'); setD(); };
    btn.addEventListener('pointerdown', down); addEventListener('pointerup', up);
    setD();
    /* التماثلي: المقبض يغيّر القراءة تدريجيًا، والسطوع يتبعها */
    const pw = sl.querySelector('#apw'), knob = pw.querySelector('.knob'), ab = sl.querySelector('#abulb');
    const setA = () => {
      knob.style.transform = `rotate(${-135 + v / 1023 * 270}deg)`;
      sl.querySelector('#aread').textContent = v; sl.querySelector('#apct').textContent = Math.round(v / 1023 * 100) + '%';
      ab.style.setProperty('--b', v / 1023);
    };
    const drag = e => { const r = pw.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      let a = Math.atan2(x, -y) * 180 / Math.PI; a = Math.max(-135, Math.min(135, a)); v = Math.round((a + 135) / 270 * 1023); setA(); };
    let dn = false;
    pw.addEventListener('pointerdown', e => { dn = true; pw.setPointerCapture(e.pointerId); drag(e); });
    pw.addEventListener('pointermove', e => dn && drag(e));
    pw.addEventListener('pointerup', () => dn = false);
    setA();
    const bd = [], ba = [], dp = sl.querySelector('#dplot'), ap = sl.querySelector('#anplot');
    const t = setInterval(() => { plotFeed(dp, bd, pressed ? 1 : 0, 1); plotFeed(ap, ba, v, 1023); }, 90);
    window.DECK_CLEANUP.push(() => { clearInterval(t); removeEventListener('pointerup', up); });
  },
  catalog(sl) {
    const info = sl.querySelector('#catinfo');
    sl.querySelectorAll('.catbar button').forEach(b => b.onclick = () => {
      sl.querySelectorAll('.catbar button').forEach(x => x.classList.toggle('on', x === b));
      sl.querySelectorAll('.citem').forEach(it => it.classList.toggle('hide', b.dataset.f !== 'all' && !it.classList.contains(b.dataset.f)));
    });
    sl.querySelectorAll('.citem').forEach(it => it.onclick = () => {
      const c = CAT[+it.dataset.i];
      sl.querySelectorAll('.citem').forEach(x => x.classList.toggle('sel', x === it));
      info.innerHTML = `<span class="cbig">${c.icon}</span><div><h3>${c.ar} <small dir="ltr">${c.en}</small></h3><p>${c.b}</p><p class="cex">🏠 في حياتنا: ${c.ex}</p></div>`;
      info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop');
    });
  },

  adclab(sl) {
    const inp = sl.querySelector('#adcin'), knob = sl.querySelector('.knob'), plot = sl.querySelector('#aplot');
    const lines = sl.querySelectorAll('.code .ln'), buf = [];
    let v = 512;
    const upd = () => {
      v = +inp.value;
      const volt = v * 5 / 1023, m = Math.round(v * 255 / 1023);
      knob.style.transform = `rotate(${-135 + v / 1023 * 270}deg)`;
      sl.querySelector('#av').textContent = fx(volt) + ' V';
      sl.querySelector('#araw').textContent = v;
      sl.querySelector('#amap').textContent = m;
      sl.querySelector('#afill').style.width = (v / 1023 * 100) + '%';
      sl.querySelector('#aeq').innerHTML = `${fx(volt)}V × 1023 ÷ 5 ≈ <b>${v}</b> &nbsp;·&nbsp; map(${v}, 0, 1023, 0, 255) = <b>${m}</b>`;
      const b = m / 255, bulb = sl.querySelector('#aled');
      bulb.style.opacity = 0.12 + 0.88 * b; bulb.style.boxShadow = `0 0 ${20 + 90 * b}px ${8 + 40 * b}px rgba(255,70,70,${0.75 * b})`;
      // الأرقام الحية داخل الكود: سطر map وسطر analogWrite
      lines.forEach(l => l.classList.toggle('run', [9, 10, 11].includes(+l.dataset.n)));
    };
    inp.oninput = upd;
    // سحب المقبض نفسه بالماوس أو الإصبع
    const pw = sl.querySelector('.potwrap');
    const drag = e => { const r = pw.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      let a = Math.atan2(x, -y) * 180 / Math.PI; a = Math.max(-135, Math.min(135, a)); inp.value = Math.round((a + 135) / 270 * 1023); upd(); };
    let down = false;
    pw.addEventListener('pointerdown', e => { down = true; pw.setPointerCapture(e.pointerId); drag(e); });
    pw.addEventListener('pointermove', e => down && drag(e));
    pw.addEventListener('pointerup', () => down = false);
    upd();
    const t = setInterval(() => plotFeed(plot, buf, Math.max(0, Math.min(1023, v + (Math.random() - .5) * 6))), 90);   // تشويش طفيف واقعي
    window.DECK_CLEANUP.push(() => clearInterval(t));
  },

  ldrlab(sl) {
    const lin = sl.querySelector('#lin'), lth = sl.querySelector('#lth'), scene = sl.querySelector('#scene');
    const plot = sl.querySelector('#lplot'), th = plot.querySelector('.pth'), lines = sl.querySelectorAll('.code .ln'), buf = [];
    let raw = 0, on = false;
    const upd = () => {
      const lux = +lin.value, lim = +lth.value, R = ldrR(lux);
      const vout = 5 * 10000 / (10000 + R);               // مقسم الجهد: المقاومة الثابتة 10k بين A0 وGND
      raw = Math.round(vout / 5 * 1023); on = raw < lim;
      sl.querySelector('#llux').textContent = lux; sl.querySelector('#llim').textContent = lim;
      sl.querySelector('#lraw').textContent = raw;
      sl.querySelector('#dr1').textContent = R >= 1000 ? fx(R / 1000, R < 10000 ? 1 : 0) + ' kΩ' : Math.round(R) + ' Ω';
      const st = sl.querySelector('#lstate'); st.textContent = on ? 'مضاء 💡' : 'مطفأ'; st.className = on ? 'on' : '';
      scene.style.setProperty('--day', lux / 100); scene.classList.toggle('lampon', on);
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 10 || (on ? n === 12 : n === 14)); });
      // تحديث رقم الحد داخل الكود نفسه
      const src = sl.querySelector('.ln[data-n="3"] .cl-src'); src.innerHTML = src.innerHTML.replace(/(<span class="c-num">)\d+(<\/span>)/, `$1${lim}$2`);
      th.style.display = ''; const y = 180 - lim / 1023 * 170; th.setAttribute('y1', y); th.setAttribute('y2', y);
    };
    lin.oninput = lth.oninput = upd; upd();
    const t = setInterval(() => plotFeed(plot, buf, Math.max(0, Math.min(1023, raw + (Math.random() - .5) * 10))), 90);
    window.DECK_CLEANUP.push(() => clearInterval(t));
  },
});

/* خطوات البناء في الجزء الثاني (مع الإبقاء على خطوات الجزء الأول كما هي) */
const prevStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (s.t !== 'build2') return prevStep && prevStep(step, s);
  const sl = document.querySelector('#stage .slide'); if (!sl) return;
  const B = B2[s.kind];
  sl.querySelectorAll('.bs').forEach(e => e.classList.toggle('on', +e.dataset.s <= step));
  sl.querySelector('.bsvg').classList.toggle('running', step >= B.flow);
  const st = B.steps[step - 1], box = sl.querySelector('.bstep');
  if (st) box.innerHTML = `<span class="bnum">الخطوة ${AR(step)} من ${AR(B.steps.length)}</span><h3>${st.h}</h3><p>${st.b}</p>`;
  sl.querySelectorAll('.blist li').forEach((li, i) => { li.classList.toggle('done', i < step - 1); li.classList.toggle('now', i === step - 1); });
};
})();
