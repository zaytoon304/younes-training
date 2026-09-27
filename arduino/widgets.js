/* =====================================================================
   أدوات دورة الأردوينو التفاعلية — تُضاف إلى محرك عروض جذور المشترك
   الأنواع: hero · code · board · blinksim · timeline · glossary · teach
   كل أداة يتفاعل معها المتدرب تحمل الصنف ix حتى لا ينقل النقرُ الشريحة.
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- تلوين كود الأردوينو ---------- */
const KW = /\b(void|int|long|byte|float|bool|boolean|char|unsigned|const|for|while|if|else|return|true|false|HIGH|LOW|OUTPUT|INPUT|INPUT_PULLUP)\b/;
const FN = /\b(setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|millis|map|Serial|begin|println|print)\b/;
function highlight(line) {
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(#\w+)|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let out = '', m;
  while ((m = re.exec(line))) {
    const [t, com, str, pre, num, id] = m;
    if (com) out += `<span class="c-com">// <bdi>${esc(com.slice(2).trim())}</bdi></span>`;   // التعليق العربي معزول ليبقى // قبله
    else if (str) out += `<span class="c-str">${esc(str)}</span>`;
    else if (pre) out += `<span class="c-kw">${esc(pre)}</span>`;
    else if (num) out += `<span class="c-num">${num}</span>`;
    else if (id) out += KW.test(id) && id.match(KW)[0] === id ? `<span class="c-kw">${id}</span>`
                    : FN.test(id) && id.match(FN)[0] === id ? `<span class="c-fn">${id}</span>` : id;
    else out += esc(t);
  }
  return out;
}
function codeBlock(code, cls = '') {
  return `<div class="code ${cls}" dir="ltr">${code.split('\n').map((l, i) =>
    `<div class="ln" data-n="${i + 1}"><span class="cl-num">${i + 1}</span><span class="cl-src">${highlight(l) || ' '}</span></div>`).join('')}</div>`;
}

/* ---------- لوحة Uno مرسومة (كل جزء قابل للضغط) ---------- */
const UNO_PARTS = {
  usb:     { icon: '🔌', ar: 'مدخل USB', en: 'USB Port', b: 'يوصل اللوحة بالحاسوب: ننقل عبره البرنامج، ويغذي اللوحة بجهد ٥ فولت.' },
  jack:    { icon: '🔋', ar: 'مدخل الطاقة', en: 'Power Jack', b: 'مدخل ثانٍ للطاقة من محوّل أو بطارية بجهد من ٧ إلى ١٢ فولت، حين تعمل اللوحة بعيدًا عن الحاسوب.' },
  reg:     { icon: '🎚️', ar: 'منظّم الجهد', en: 'Voltage Regulator', b: 'يحوّل الجهد القادم من مدخل الطاقة (٧–١٢ فولت) إلى ٥ فولت ثابتة تحتاجها اللوحة.' },
  mcu:     { icon: '🧠', ar: 'المتحكم الدقيق', en: 'ATmega328P Microcontroller', b: 'عقل اللوحة: دائرة متكاملة قابلة للبرمجة، تحفظ الكود الذي تكتبه وتنفّذه.' },
  xtal:    { icon: '💓', ar: 'الكريستالة', en: 'Crystal Oscillator · 16 MHz', b: 'القلب النابض: تحدد سرعة تنفيذ المتحكم، ١٦ مليون نبضة في الثانية.' },
  digital: { icon: '🔢', ar: 'المنافذ الرقمية (0–13)', en: 'Digital Pins', b: 'لها حالتان فقط: ٥ فولت (HIGH) أو صفر (LOW). المنافذ المعلَّمة بعلامة ~ (3، 5، 6، 9، 10، 11) تدعم PWM.' },
  analog:  { icon: '📈', ar: 'المنافذ التناظرية (A0–A5)', en: 'Analog Input Pins', b: 'تقرأ جهدًا متغيرًا بين صفر و٥ فولت، وتحوّله إلى رقم من 0 إلى 1023، مثل قراءة حساس ضوء أو حرارة.' },
  power:   { icon: '⚡', ar: 'منافذ الطاقة', en: 'Power Pins', b: 'GND هو الأرضي (السالب)، و5V و3.3V لتغذية المكونات، وVin لإدخال جهد خارجي.' },
  ioref:   { icon: '🛡️', ar: 'منفذ IOREF', en: 'IOREF', b: 'يُخبر الدروع (Shields) بجهد عمل اللوحة، فتعمل عليه ولا تتلف.' },
  l13:     { icon: '💡', ar: 'الليد المدمج L', en: 'Built-in LED · Pin 13', b: 'متصل بالمنفذ 13 داخل اللوحة. تبرمجه دون أي توصيل، وهو أول تجربة لكل مبتدئ.' },
  txrx:    { icon: '📡', ar: 'ليدات TX و RX', en: 'Transmit / Receive LEDs', b: 'تومض عند إرسال البيانات (TX) واستقبالها (RX) بين اللوحة والحاسوب.' },
  on:      { icon: '🟢', ar: 'ليد التشغيل ON', en: 'Power LED', b: 'يضيء حين تصل الطاقة إلى اللوحة، فتعرف فورًا أنها تعمل.' },
  reset:   { icon: '🔄', ar: 'زر إعادة الضبط', en: 'Reset Button', b: 'يعيد تشغيل البرنامج المحمَّل من بدايته دون أن يمسحه.' },
  icsp:    { icon: '🧷', ar: 'منفذ ICSP', en: 'In-Circuit Serial Programming', b: 'لبرمجة المتحكم مباشرة دون USB. استخدام متقدم لن نحتاجه في هذه الدورة.' },
};
const TOUR = ['usb', 'jack', 'reg', 'mcu', 'xtal', 'digital', 'analog', 'power', 'l13', 'txrx', 'on', 'reset', 'ioref', 'icsp'];

function unoSVG() {
  const pinRow = (x, y, n, gapAt = -1) => { let s = ''; let px = x;
    for (let i = 0; i < n; i++) { if (i === gapAt) px += 18; s += `<rect x="${px}" y="${y}" width="14" height="14" rx="2" fill="#0b0d12"/>`; px += 30; } return s; };
  const labels = (x, y, arr, up, gapAt = -1) => { let s = ''; let px = x + 7;
    arr.forEach((t, i) => { if (i === gapAt) px += 18; s += `<text x="${px}" y="${y}" transform="rotate(-90 ${px} ${y})" class="silk" text-anchor="${up ? 'start' : 'end'}">${t}</text>`; px += 30; }); return s; };
  const dig = ['SCL', 'SDA', 'AREF', 'GND', '13', '12', '~11', '~10', '~9', '8', '7', '~6', '~5', '4', '~3', '2', 'TX 1', 'RX 0'];
  const pw = ['', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'Vin'];
  const an = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
  let mcuPins = ''; for (let i = 0; i < 14; i++) { const x = 540 + i * 24.5; mcuPins += `<rect x="${x}" y="428" width="10" height="14" fill="#c4c9d4"/><rect x="${x}" y="538" width="10" height="14" fill="#c4c9d4"/>`; }
  return `<svg viewBox="0 0 1000 700" class="uno" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#138f98"/><stop offset="1" stop-color="#0a6670"/></linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="60" y="40" width="900" height="620" rx="36" fill="url(#pcb)"/>
  <circle cx="120" cy="330" r="14" fill="#0a4f57"/><circle cx="905" cy="95" r="14" fill="#0a4f57"/><circle cx="905" cy="610" r="14" fill="#0a4f57"/>
  <text x="640" y="330" class="logo">UNO</text><text x="640" y="372" class="silk" style="font-size:22px">R3 · 16 MHz</text>
  <g class="part" data-p="usb"><rect x="18" y="120" width="200" height="160" rx="10" fill="#cfd4de" stroke="#8b93a7" stroke-width="4"/><rect x="48" y="150" width="140" height="100" rx="6" fill="#9aa1b3"/></g>
  <g class="part" data-p="jack"><rect x="28" y="468" width="175" height="150" rx="16" fill="#1d1f27"/><circle cx="115" cy="543" r="36" fill="#3a3d48"/><circle cx="115" cy="543" r="12" fill="#c4c9d4"/></g>
  <g class="part" data-p="reg"><rect x="240" y="492" width="84" height="22" fill="#9aa1b3"/><rect x="240" y="512" width="84" height="56" rx="4" fill="#2a2d36"/></g>
  <g class="part" data-p="reset"><rect x="245" y="62" width="76" height="76" rx="10" fill="#dfe2e8"/><circle cx="283" cy="100" r="24" fill="#c0392b"/></g>
  <g class="part" data-p="xtal"><rect x="330" y="296" width="120" height="50" rx="25" fill="#d4d8e1" stroke="#9aa1b3" stroke-width="3"/></g>
  <g class="part" data-p="l13"><rect x="452" y="150" width="34" height="20" rx="4" fill="#f5a623"/><text x="498" y="168" class="silk">L</text></g>
  <g class="part" data-p="txrx"><rect x="452" y="200" width="34" height="20" rx="4" fill="#f5a623"/><rect x="452" y="236" width="34" height="20" rx="4" fill="#f5a623"/><text x="498" y="218" class="silk">TX</text><text x="498" y="254" class="silk">RX</text></g>
  <g class="part" data-p="on"><rect x="820" y="290" width="34" height="20" rx="4" fill="#2ecc71"/><text x="862" y="308" class="silk">ON</text></g>
  <g class="part" data-p="icsp"><rect x="895" y="310" width="52" height="80" rx="4" fill="#0b0d12"/>${[0, 1, 2].map(r => [0, 1].map(c => `<circle cx="${909 + c * 24}" cy="${325 + r * 25}" r="6" fill="#c4c9d4"/>`).join('')).join('')}</g>
  <g class="part" data-p="mcu"><rect x="525" y="440" width="360" height="100" rx="8" fill="#15171e"/><circle cx="545" cy="490" r="9" fill="#2b2e38"/>${mcuPins}<text x="705" y="500" class="chip">ATMEGA328P</text></g>
  <g class="part" data-p="digital"><rect x="370" y="46" width="560" height="42" rx="4" fill="#1b1d24"/>${pinRow(378, 60, 18, 10)}${labels(378, 100, dig, false, 10)}</g>
  <g class="part" data-p="power"><rect x="330" y="610" width="250" height="42" rx="4" fill="#1b1d24"/>${pinRow(338, 624, 8)}${labels(338, 600, pw, true)}</g>
  <g class="part" data-p="ioref"><rect x="364" y="614" width="30" height="34" rx="4" fill="transparent" stroke="#F0CC7A" stroke-width="0" /></g>
  <g class="part" data-p="analog"><rect x="640" y="610" width="190" height="42" rx="4" fill="#1b1d24"/>${pinRow(648, 624, 6)}${labels(648, 600, an, true)}</g>
</svg>`;
}

/* ---------- دائرة الوميض المصغّرة ---------- */
function blinkSVG() {
  let holes = ''; for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) holes += `<circle cx="${425 + c * 24}" cy="${185 + r * 22}" r="3.2" fill="#cfc8b6"/>`;
  return `<svg viewBox="0 0 700 460" class="blinksvg" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="ledglow"><stop offset="0" stop-color="#ff5a5a" stop-opacity=".95"/><stop offset="1" stop-color="#ff5a5a" stop-opacity="0"/></radialGradient></defs>
    <rect x="20" y="110" width="310" height="250" rx="22" fill="#0e7c86"/>
    <rect x="70" y="120" width="240" height="30" rx="4" fill="#1b1d24"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${80 + i * 28}" y="129" width="12" height="12" fill="#0b0d12"/>`).join('')}
    <text x="200" y="182" class="silk" text-anchor="middle">GND   13</text>
    <rect x="120" y="230" width="150" height="60" rx="6" fill="#15171e"/><text x="195" y="268" class="chip" text-anchor="middle" style="font-size:20px">UNO</text>
    <rect x="400" y="160" width="280" height="200" rx="14" fill="#f4f1ea" stroke="#e1dbcc" stroke-width="3"/>${holes}
    <path d="M254 135 C 254 60, 520 60, 520 190" fill="none" stroke="#e74c3c" stroke-width="7" stroke-linecap="round"/>
    <path d="M226 135 C 226 40, 640 40, 640 340" fill="none" stroke="#2c3e50" stroke-width="7" stroke-linecap="round"/>
    <circle id="bglow" cx="520" cy="215" r="70" fill="url(#ledglow)" opacity="0"/>
    <path d="M505 232 L505 206 A15 15 0 0 1 535 206 L535 232 Z" id="bled" fill="#7a2323" stroke="#4a1111" stroke-width="2"/>
    <line x1="512" y1="232" x2="512" y2="260" stroke="#9aa1b3" stroke-width="4"/><line x1="528" y1="232" x2="528" y2="252" stroke="#9aa1b3" stroke-width="4"/>
    <rect x="560" y="246" width="60" height="16" rx="8" fill="#d9b382"/><rect x="574" y="246" width="5" height="16" fill="#e74c3c"/><rect x="586" y="246" width="5" height="16" fill="#e74c3c"/><rect x="598" y="246" width="5" height="16" fill="#8b5a2b"/>
    <line x1="528" y1="254" x2="560" y2="254" stroke="#9aa1b3" stroke-width="4"/><line x1="620" y1="254" x2="640" y2="254" stroke="#9aa1b3" stroke-width="4"/>
    <text x="520" y="300" class="silk dark" text-anchor="middle">LED</text><text x="590" y="290" class="silk dark" text-anchor="middle">220Ω</text>
  </svg>`;
}
const BLINK_CODE = d => `void setup() {
  pinMode(13, OUTPUT);   // المنفذ 13 مخرج
}

void loop() {
  digitalWrite(13, HIGH); // أشعل الليد
  delay(${d});            // انتظر
  digitalWrite(13, LOW);  // أطفئ الليد
  delay(${d});            // انتظر
}`;


/* ---------- بيئة البرمجة (IDE) مرسومة وتفاعلية ---------- */
const IDE_PARTS = {
  verify:  { icon: '✔️', ar: 'زر التحقق', en: 'Verify', b: 'يفحص الكود ويترجمه ليكشف الأخطاء، دون أن يرسله إلى اللوحة.' },
  upload:  { icon: '➡️', ar: 'زر الرفع', en: 'Upload', b: 'يترجم الكود ثم يرسله إلى اللوحة عبر كابل USB، فتبدأ تنفيذه فورًا.' },
  board:   { icon: '🔌', ar: 'اللوحة والمنفذ', en: 'Board & Port', b: 'اختر «Arduino Uno» والمنفذ الذي وصلت عليه اللوحة. بدون هذا يفشل الرفع.' },
  serial:  { icon: '🔍', ar: 'الشاشة التسلسلية', en: 'Serial Monitor', b: 'نافذة تعرض الرسائل القادمة من اللوحة، وسنستخدمها في المحور الثامن.' },
  editor:  { icon: '✍️', ar: 'منطقة الكود', en: 'Editor', b: 'هنا تكتب برنامجك، داخل الدالتين setup و loop.' },
  output:  { icon: '📋', ar: 'منطقة الرسائل', en: 'Output', b: 'تُظهر نتيجة التحقق والرفع، ورسائل الأخطاء باللون الأحمر.' },
  file:    { icon: '📁', ar: 'قائمة ملف', en: 'File', b: 'جديد، وفتح، وحفظ، والأمثلة الجاهزة (Examples): كنز حقيقي للمبتدئ.' },
  edit:    { icon: '✂️', ar: 'قائمة تحرير', en: 'Edit', b: 'النسخ واللصق والبحث، وتحويل الأسطر إلى تعليقات بضغطة.' },
  sketch:  { icon: '🧩', ar: 'قائمة Sketch', en: 'Sketch', b: 'التحقق والرفع، وإضافة المكتبات الجاهزة إلى برنامجك.' },
  tools:   { icon: '🛠️', ar: 'قائمة الأدوات', en: 'Tools', b: 'اختيار نوع اللوحة والمنفذ، وفتح الشاشة التسلسلية.' },
};
const IDE_TOUR = ['verify', 'upload', 'board', 'serial', 'editor', 'output', 'file', 'edit', 'sketch', 'tools'];
function ideHTML() {
  const hs = (k, inner, cls = '') => `<div class="hs ${cls}" data-h="${k}">${inner}</div>`;
  return `<div class="ide" dir="ltr">
    <div class="ide-title"><span class="dots"><b></b><b></b><b></b></span>Blink | Arduino IDE 2</div>
    <div class="ide-menu">${hs('file', 'File')}${hs('edit', 'Edit')}${hs('sketch', 'Sketch')}${hs('tools', 'Tools')}<span>Help</span></div>
    <div class="ide-bar">${hs('verify', '✓', 'rb')}${hs('upload', '➜', 'rb')}
      ${hs('board', '<span>▾</span> Arduino Uno <small>COM3</small>', 'sel')}<span class="sp"></span>${hs('serial', '🔍', 'rb light')}</div>
    ${hs('editor', `<div class="ide-tab">Blink.ino</div>${codeBlock(BLINK_CODE(1000), 'ide-code')}`, 'ed')}
    ${hs('output', '<b>Output</b><div>Sketch uses 924 bytes (2%) of program storage space.</div><div class="okmsg">Done uploading.</div>', 'out')}
  </div>`;
}

/* ---------- لوح التوصيل (بريدبورد) تفاعلي ---------- */
const BB = { cols: 30, x0: 88, dx: 29, rowsTop: ['a', 'b', 'c', 'd', 'e'], rowsBot: ['f', 'g', 'h', 'i', 'j'] };
const bbY = r => ({ a: 170, b: 200, c: 230, d: 260, e: 290, f: 370, g: 400, h: 430, i: 460, j: 490 }[r]);
const RAILS = { tp: 62, tn: 92, bp: 568, bn: 598 };   // الموجب والسالب أعلى وأسفل
function bbSVG() {
  let h = '';
  // ثقوب القضبان في مجموعات من خمسة
  Object.entries(RAILS).forEach(([k, y]) => { for (let c = 0; c < BB.cols; c++) {
    if (c % 6 === 5) continue; const x = BB.x0 + c * BB.dx;
    h += `<rect class="hole" data-g="rail-${k}" x="${x - 9}" y="${y - 9}" width="18" height="18" rx="4"/>`; } });
  // الأشرطة الأساسية
  for (let c = 0; c < BB.cols; c++) { const x = BB.x0 + c * BB.dx;
    BB.rowsTop.forEach(r => h += `<rect class="hole" data-g="top-${c}" data-c="${c + 1}" x="${x - 9}" y="${bbY(r) - 9}" width="18" height="18" rx="4"/>`);
    BB.rowsBot.forEach(r => h += `<rect class="hole" data-g="bot-${c}" data-c="${c + 1}" x="${x - 9}" y="${bbY(r) - 9}" width="18" height="18" rx="4"/>`);
    if (c % 5 === 0) h += `<text x="${x}" y="140" class="bbn">${c + 1}</text><text x="${x}" y="532" class="bbn">${c + 1}</text>`; }
  const rowLbl = [...BB.rowsTop, ...BB.rowsBot].map(r => `<text x="52" y="${bbY(r) + 7}" class="bbn">${r}</text>`).join('');
  const led = (id, c1, c2, ok) => { const x1 = BB.x0 + c1 * BB.dx, x2 = BB.x0 + c2 * BB.dx, xm = (x1 + x2) / 2;
    return `<g id="${id}" class="bbled" opacity="0"><line x1="${x1}" y1="230" x2="${x1}" y2="${ok ? 186 : 186}" stroke="#9aa1b3" stroke-width="5"/><line x1="${x2}" y1="230" x2="${x2}" y2="186" stroke="#9aa1b3" stroke-width="5"/>
      <path d="M${xm - 22} 186 L${xm - 22} 150 A22 22 0 0 1 ${xm + 22} 150 L${xm + 22} 186 Z" fill="${ok ? '#ff3b3b' : '#7a2323'}" ${ok ? 'filter="url(#bbglow)"' : ''}/>
      <text x="${xm}" y="120" class="bbtag ${ok ? 'ok' : 'bad'}">${ok ? '✓ صحيح' : '✗ قِصَر'}</text></g>`; };
  return `<svg viewBox="0 0 1000 640" class="bb" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="bbglow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <rect x="20" y="20" width="960" height="600" rx="26" fill="#f6f3ec" stroke="#e2dccd" stroke-width="4"/>
    <line x1="60" y1="${RAILS.tp - 20}" x2="940" y2="${RAILS.tp - 20}" stroke="#e74c3c" stroke-width="4"/><text x="40" y="${RAILS.tp + 7}" class="bbr red">+</text>
    <line x1="60" y1="${RAILS.tn + 20}" x2="940" y2="${RAILS.tn + 20}" stroke="#3b6fd8" stroke-width="4"/><text x="40" y="${RAILS.tn + 7}" class="bbr blue">−</text>
    <line x1="60" y1="${RAILS.bp - 20}" x2="940" y2="${RAILS.bp - 20}" stroke="#e74c3c" stroke-width="4"/><text x="40" y="${RAILS.bp + 7}" class="bbr red">+</text>
    <line x1="60" y1="${RAILS.bn + 20}" x2="940" y2="${RAILS.bn + 20}" stroke="#3b6fd8" stroke-width="4"/><text x="40" y="${RAILS.bn + 7}" class="bbr blue">−</text>
    <rect x="60" y="318" width="880" height="24" rx="8" fill="#e8e2d3"/>
    ${rowLbl}${h}${led('ledok', 11, 12, true)}${led('ledbad', 20, 20.001, false)}
  </svg>`;
}
const BB_TOUR = [
  { g: ['rail-tp'], h: 'القضيب الموجب (+)', b: 'صف أفقي كامل متصل من الداخل. نوصله بمنفذ 5V.' },
  { g: ['rail-tn'], h: 'القضيب السالب (−)', b: 'صف أفقي كامل متصل. نوصله بمنفذ GND.' },
  { g: ['top-5'], h: 'الأشرطة الأساسية', b: 'كل عمود من خمسة ثقوب (a إلى e) متصل رأسيًا. هنا نركّب المكونات.' },
  { g: ['top-5', 'bot-5'], split: true, h: 'القناة الوسطى', b: 'النصف العلوي لا يتصل بالسفلي. لذلك يوضع فوقها الشريحة الإلكترونية بساقين في كل جهة.' },
  { led: 'ledok', g: ['top-11', 'top-12'], h: '✅ ليد في عمودين مختلفين', b: 'كل ساق في عمود مستقل، فيمر التيار عبر الليد ويضيء.' },
  { led: 'ledbad', g: ['top-20'], h: '❌ الساقان في العمود نفسه', b: 'العمود متصل من الداخل، فيلتف التيار حول الليد (قِصَر) ولا يضيء.' },
];


/* ---------- رموز الدوائر ---------- */
const SYM = {
  battery: '<line x1="10" y1="50" x2="42" y2="50"/><line x1="42" y1="25" x2="42" y2="75" stroke-width="6"/><line x1="58" y1="36" x2="58" y2="64" stroke-width="10"/><line x1="58" y1="50" x2="90" y2="50"/><text x="30" y="22" class="sy">+</text>',
  resistor: '<polyline points="5,50 22,50 28,32 40,68 52,32 64,68 76,32 82,50 95,50" fill="none"/>',
  led: '<line x1="5" y1="50" x2="35" y2="50"/><polygon points="35,30 35,70 62,50" fill="currentColor"/><line x1="62" y1="30" x2="62" y2="70"/><line x1="62" y1="50" x2="95" y2="50"/><line x1="58" y1="20" x2="74" y2="6"/><line x1="70" y1="26" x2="86" y2="12"/>',
  switch: '<line x1="5" y1="50" x2="30" y2="50"/><circle cx="32" cy="50" r="4" fill="currentColor"/><line x1="32" y1="50" x2="66" y2="28"/><circle cx="70" cy="50" r="4" fill="currentColor"/><line x1="70" y1="50" x2="95" y2="50"/>',
  wire: '<line x1="5" y1="50" x2="95" y2="50"/><circle cx="50" cy="50" r="5" fill="currentColor"/><line x1="50" y1="50" x2="50" y2="90"/>',
  ground: '<line x1="50" y1="10" x2="50" y2="45"/><line x1="22" y1="45" x2="78" y2="45"/><line x1="32" y1="60" x2="68" y2="60"/><line x1="42" y1="75" x2="58" y2="75"/>',
};
const symSVG = k => `<svg viewBox="0 0 100 100" class="sym">${SYM[k]}</svg>`;

/* ---------- توالي أو توازي (تفاعلي) ---------- */
function spSVG(mode) {
  const bulb = (id, x, y) => `<g class="spled ix" data-id="${id}" transform="translate(${x} ${y})" style="cursor:pointer">
      <circle r="46" class="halo" fill="url(#sphalo)"/><circle r="26" class="glass" fill="#ffd54a" stroke="#b58b00" stroke-width="4"/>
      <text y="68" class="splbl" text-anchor="middle">اضغط</text></g>`;
  const common = `<defs><radialGradient id="sphalo"><stop offset="0" stop-color="#ffe27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient></defs>
    <g stroke="#1b2340" stroke-width="6" fill="none">
      <rect x="40" y="150" width="46" height="90" rx="8" fill="#1b2340"/></g>
    <text x="63" y="140" class="splbl" text-anchor="middle">+  −</text>`;
  if (mode === 'series') return `<svg viewBox="0 0 600 380" class="spsvg">${common}
    <path d="M63 150 V60 H540 V320 H63 V240" stroke="#1b2340" stroke-width="6" fill="none"/>
    ${bulb('a', 230, 60)}${bulb('b', 420, 60)}${bulb('c', 540, 200)}</svg>`;
  return `<svg viewBox="0 0 600 380" class="spsvg">${common}
    <path d="M63 150 V50 H540 M63 240 V340 H540 M240 50 V340 M390 50 V340 M540 50 V340" stroke="#1b2340" stroke-width="6" fill="none"/>
    ${bulb('a', 240, 195)}${bulb('b', 390, 195)}${bulb('c', 540, 195)}</svg>`;
}

/* ---------- حاسبة ألوان المقاومة ---------- */
const RCOL = [
  { n: 'أسود', c: '#1a1a1a' }, { n: 'بني', c: '#7b4a26' }, { n: 'أحمر', c: '#d62828' }, { n: 'برتقالي', c: '#f77f00' },
  { n: 'أصفر', c: '#fcbf49' }, { n: 'أخضر', c: '#2a9d4b' }, { n: 'أزرق', c: '#1d6fd1' }, { n: 'بنفسجي', c: '#7b2cbf' },
  { n: 'رمادي', c: '#8d99ae' }, { n: 'أبيض', c: '#f1f1f1' },
];
const RMUL = [...RCOL.map((x, i) => ({ ...x, m: 10 ** i })).slice(0, 7), { n: 'ذهبي', c: '#d4af37', m: 0.1 }, { n: 'فضي', c: '#c0c0c0', m: 0.01 }];
const fmtOhm = v => v >= 1e6 ? (v / 1e6).toLocaleString('en', { maximumFractionDigits: 2 }) + ' MΩ'
                 : v >= 1e3 ? (v / 1e3).toLocaleString('en', { maximumFractionDigits: 2 }) + ' kΩ'
                 : v.toLocaleString('en', { maximumFractionDigits: 2 }) + ' Ω';

/* ---------- مختبر قانون أوم ---------- */
function ohmSVG() {
  return `<svg viewBox="0 0 640 400" class="ohmsvg">
    <defs><radialGradient id="ohmglow"><stop offset="0" stop-color="#ff4d4d" stop-opacity=".95"/><stop offset="1" stop-color="#ff4d4d" stop-opacity="0"/></radialGradient></defs>
    <path d="M90 140 V60 H560 V340 H90 V260" stroke="#1b2340" stroke-width="7" fill="none"/>
    <rect x="60" y="140" width="60" height="120" rx="10" fill="#1b2340"/><text x="90" y="210" class="ohmv" text-anchor="middle" id="ovtxt">5V</text>
    <g transform="translate(250 60)"><rect x="-50" y="-16" width="100" height="32" rx="16" fill="#d9b382"/><rect x="-26" y="-16" width="8" height="32" fill="#d62828"/><rect x="-8" y="-16" width="8" height="32" fill="#d62828"/><rect x="10" y="-16" width="8" height="32" fill="#7b4a26"/></g>
    <text x="250" y="112" class="ohml" text-anchor="middle" id="ortxt">220Ω</text>
    <circle id="oglow" cx="560" cy="200" r="90" fill="url(#ohmglow)" opacity="0"/>
    <path id="oled" d="M540 222 L540 190 A20 20 0 0 1 580 190 L580 222 Z" fill="#7a2323" stroke="#4a1111" stroke-width="3"/>
    <g id="osmoke" opacity="0"><circle cx="555" cy="160" r="14" fill="#9aa1b3"/><circle cx="572" cy="138" r="18" fill="#b8bdc9"/><circle cx="560" cy="110" r="22" fill="#d3d6de"/></g>
    <text x="600" y="250" class="ohml">LED</text>
  </svg>`;
}
function ledAnatSVG() {
  return `<svg viewBox="100 0 560 530" class="ledanat" direction="ltr">
    <defs><radialGradient id="lg" cx="45%" cy="35%"><stop offset="0" stop-color="#ff8a8a"/><stop offset="1" stop-color="#d62828"/></radialGradient></defs>
    <path d="M190 300 V150 A70 70 0 0 1 330 150 V300 Z" fill="url(#lg)" stroke="#8e1b1b" stroke-width="4"/>
    <rect x="178" y="296" width="164" height="22" rx="4" fill="#c22"/><line x1="342" y1="296" x2="342" y2="318" stroke="#fff" stroke-width="6"/>
    <line x1="225" y1="318" x2="225" y2="500" stroke="#9aa1b3" stroke-width="10"/>
    <line x1="295" y1="318" x2="295" y2="440" stroke="#9aa1b3" stroke-width="10"/>
    <g class="lab"><line x1="342" y1="300" x2="400" y2="262"/><text x="410" y="262">حافة مسطحة</text><text x="410" y="292" class="s">تدل على جهة السالب</text></g>
    <g class="lab"><line x1="295" y1="410" x2="400" y2="380"/><text x="410" y="380">السالب (−)</text><text x="410" y="410" class="s">الساق الأقصر · Cathode</text></g>
    <g class="lab"><line x1="225" y1="490" x2="400" y2="480"/><text x="410" y="480">الموجب (+)</text><text x="410" y="510" class="s">الساق الأطول · Anode</text></g>
  </svg>`;
}
/* ---------- زر يفتح موقعًا خارجيًا ---------- */
/* ---------- رسم الأنواع ---------- */
window.DECK_TYPES = {
  symbols: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'لغة المهندسين'}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="syms">${s.items.map(it => `<div class="symc f">${symSVG(it.k)}<h3>${it.ar}</h3><div class="en" dir="ltr">${it.en}</div><p>${it.b}</p></div>`).join('')}</div></div>`,

  seriespar: s => `<div class="slide light">
      <div class="kicker">🖱️ جرّب بنفسك</div>
      <h2 class="title" style="margin-bottom:16px">${s.title}</h2>
      <div class="spgrid">
        <div class="spcol ix"><h3>🔗 التوالي</h3><p>مسار واحد يمر بكل الليدات</p>${spSVG('series')}<div class="spmsg" data-m="series">اضغط أي ليد لتعطّله</div></div>
        <div class="spcol ix"><h3>🔀 التوازي</h3><p>لكل ليد مساره الخاص</p>${spSVG('parallel')}<div class="spmsg" data-m="parallel">اضغط أي ليد لتعطّله</div></div>
      </div></div>`,

  resistor: s => `<div class="slide light">
      <div class="kicker">🖱️ حاسبة تفاعلية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="rcalc ix">
        <svg viewBox="0 0 900 200" class="rsvg"><line x1="0" y1="100" x2="900" y2="100" stroke="#9aa1b3" stroke-width="12"/>
          <rect x="190" y="40" width="520" height="120" rx="60" fill="#e8c9a0" stroke="#b8905e" stroke-width="4"/>
          <rect class="band" data-b="0" x="270" y="40" width="42" height="120"/><rect class="band" data-b="1" x="350" y="40" width="42" height="120"/>
          <rect class="band" data-b="2" x="430" y="40" width="42" height="120"/><rect class="band" data-b="3" x="590" y="40" width="42" height="120"/></svg>
        <div class="rval"><span id="rv">220 Ω</span><small id="rtol">± 5%</small></div>
        <div class="rrows">
          ${['الحلقة الأولى (الرقم الأول)', 'الحلقة الثانية (الرقم الثاني)', 'الحلقة الثالثة (المضاعف)', 'الحلقة الرابعة (نسبة الخطأ)'].map((lbl, b) => `<div class="rrow"><b>${lbl}</b><div class="sw">${
            (b < 2 ? RCOL : b === 2 ? RMUL : [{ n: 'ذهبي', c: '#d4af37', t: 5 }, { n: 'فضي', c: '#c0c0c0', t: 10 }, { n: 'بني', c: '#7b4a26', t: 1 }])
              .map((c, i) => `<button class="swc" data-b="${b}" data-i="${i}" title="${c.n}" style="background:${c.c}"></button>`).join('')}</div></div>`).join('')}
        </div>
        <div class="rpre">${[['220 Ω', [2, 2, 1, 0]], ['330 Ω', [3, 3, 1, 0]], ['1 kΩ', [1, 0, 2, 0]], ['10 kΩ', [1, 0, 3, 0]]].map(([t, v]) => `<button class="pre" data-v="${v.join(',')}">${t}</button>`).join('')}</div>
      </div></div>`,

  ohmlab: s => `<div class="slide light">
      <div class="kicker">🔬 مختبر تفاعلي</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="ohmgrid">
        <div class="ohmside ix">
          <label><span>الجهد (V): <b id="vv">5</b> فولت</span><input id="vin" type="range" min="2" max="12" step="0.5" value="5"></label>
          <label><span>المقاومة (R): <b id="rrv">220</b> أوم</span><input id="rin" type="range" min="10" max="1000" step="10" value="220"></label>
          <div class="ohmeq" dir="ltr">I = (V − 2) ÷ R = <b id="ieq">13.6 mA</b></div>
          <div class="ohmmeter"><div class="fill" id="ifill"></div><span class="safe">الحد الآمن ٢٠ مللي أمبير</span></div>
          <div class="ohmstate" id="ostate">✅ آمن: الليد يضيء بسلام</div>
        </div>
        <div class="ohmview">${ohmSVG()}</div>
      </div></div>`,

  ledanat: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'تشريح المكوّن'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="lagrid"><div class="lafacts">${s.facts.map(f => `<div class="laf f"><i>${f.icon}</i><div><h3>${f.h}</h3><p>${f.b}</p></div></div>`).join('')}</div>
        <div>${ledAnatSVG()}</div></div></div>`,

  ide: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '🖱️ واجهة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="boardgrid wide">
        <div class="bpanel"><div class="binfo" id="binfo"><div class="bicon">👆</div><h3>اضغط على أي زر أو قائمة</h3>
          <p>أو «التالي» لجولة على أجزاء البرنامج</p></div>
          <div class="bhint">🖱️ اضغط أي جزء · ⬅️ «التالي» للجولة (${AR(IDE_TOUR.length)} أجزاء)</div></div>
        <div class="bwrap ix">${ideHTML()}</div>
      </div>${IDE_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  breadboard: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '🖱️ لوح تفاعلي'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="boardgrid wide">
        <div class="bpanel"><div class="binfo" id="binfo"><div class="bicon">🧱</div><h3>مرّر الماوس على أي ثقب</h3>
          <p>فتضيء كل الثقوب المتصلة به من الداخل</p></div>
          <div class="bhint">⬅️ «التالي» لجولة من ${AR(BB_TOUR.length)} خطوات</div></div>
        <div class="bwrap ix">${bbSVG()}</div>
      </div>${BB_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  cta: s => `<div class="slide dark center">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <div class="statement" style="font-size:80px">${s.title}</div>
      ${s.sub ? `<p class="ctasub">${s.sub}</p>` : ''}
      <a class="ctabtn ix" href="${s.url}" target="_blank" rel="noopener">${s.btn} ↗</a>
      <div class="ctaurl" dir="ltr">${s.url.replace(/^https?:\/\//, '')}</div></div>`,

  hero: s => `<div class="slide dark mcover">
      <div class="bgimg kb"><img src="${s.img}" alt=""></div>
      ${s.cat ? `<div class="cat">${s.cat}</div>` : ''}
      <h2 style="font-size:${s.title.length > 16 ? 110 : 140}px;max-width:1150px">${s.title}</h2>
      ${s.sub ? `<div class="lbl" style="max-width:1050px;line-height:1.5">${s.sub}</div>` : ''}
      ${s.pills ? `<div class="flow">${s.pills.map(p => `<span>${p}</span>`).join('')}</div>` : ''}</div>`,

  code: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:26px">${s.title}</h2>
      <div class="codegrid">
        <div class="explain">${(s.steps || []).map((st, i) => `<div class="xp f"><i>${AR(i + 1)}</i><div>${st.text}</div></div>`).join('')}
          ${s.note ? `<div class="xnote">${s.note}</div>` : ''}</div>
        <div class="codewrap">
          <div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">${s.file || 'sketch.ino'}</span>
            <button class="copy ix">📋 نسخ الكود</button></div>
          ${codeBlock(s.code)}
        </div>
      </div></div>`,

  board: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'لوحة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="boardgrid">
        <div class="bpanel">
          <div class="binfo" id="binfo"><div class="bicon">👆</div><h3>اضغط على أي جزء من اللوحة</h3>
            <p>أو اضغط «التالي» لجولة على الأجزاء واحدًا واحدًا</p></div>
          <div class="bhint">🖱️ اضغط أي جزء في الرسمة · ⬅️ «التالي» للجولة الكاملة (${AR(TOUR.length)} جزءًا)</div>
        </div>
        <div class="bwrap ix">${unoSVG()}</div>
      </div>${TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  blinksim: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:20px">${s.title}</h2>
      <div class="simgrid">
        <div class="simside">${codeBlock(BLINK_CODE(500), 'small')}</div>
        <div class="simview">${blinkSVG()}
          <div class="status">المنفذ 13: <b>LOW · 0 فولت</b></div>
          <div class="simctl ix">
            <button class="play">▶ تشغيل</button>
            <label><span>مدة الانتظار: <b class="dval">500</b> ملّي ثانية</span><input type="range" min="100" max="2000" step="100" value="500"></label>
          </div>
        </div>
      </div></div>`,

  timeline: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title">${s.title}</h2>
      <div class="tline" style="grid-template-columns:repeat(${s.items.length},1fr)">
        ${s.items.map(it => `<div class="tl f"><div class="yr">${it.year}</div><div class="dot"></div><h3>${it.h}</h3><p>${it.b}</p></div>`).join('')}
      </div></div>`,

  glossary: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '📖 مصطلحات المحور'}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title || 'قاموس المحور'}</h2>
      <div class="gloss" style="grid-template-columns:repeat(${s.cols || 3},1fr)">
        ${s.terms.map(t => `<div class="gt f"><div class="en" dir="ltr">${t.en}</div><h3>${t.ar}</h3><p>${t.b}</p></div>`).join('')}
      </div></div>`,

  teach: s => `<div class="slide light">
      <div class="kicker">👩‍🏫 كيف تدرّسها لطلابك؟</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="teachgrid">
        <div class="tcol bad"><h4>⚠️ أخطاء شائعة عند الطلاب</h4>${s.mistakes.map(m => `<div class="tm f">${m}</div>`).join('')}</div>
        <div class="tcol act f"><h4>🎲 نشاط صفي جاهز · ${s.activity.time}</h4><h3>${s.activity.title}</h3>
          ${s.activity.steps.map((x, i) => `<div class="ts"><i>${AR(i + 1)}</i><div>${x}</div></div>`).join('')}</div>
      </div></div>`,
};

/* ---------- ربط التفاعل ---------- */
function selectPart(sl, k) {
  sl.querySelectorAll('.part').forEach(g => g.classList.toggle('sel', g.dataset.p === k));
  sl.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.p === k));
  const p = UNO_PARTS[k], box = sl.querySelector('#binfo');
  if (!p || !box) return;
  box.innerHTML = `<div class="bicon">${p.icon}</div><h3>${p.ar}</h3><div class="ben" dir="ltr">${p.en}</div><p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}

function selectIde(sl, k) {
  sl.querySelectorAll('.hs').forEach(h => h.classList.toggle('sel', h.dataset.h === k));
  const p = IDE_PARTS[k], box = sl.querySelector('#binfo');
  if (!p) return;
  box.innerHTML = `<div class="bicon">${p.icon}</div><h3>${p.ar}</h3><div class="ben" dir="ltr">${p.en}</div><p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
function bbShow(sl, groups, info, hole) {
  sl.querySelectorAll('.hole').forEach(h => h.classList.toggle('lit', groups.includes(h.dataset.g)));
  const box = sl.querySelector('#binfo');
  if (!info && hole) {
    const g = hole.dataset.g;
    info = g.startsWith('rail') ? { h: g.endsWith('p') ? 'قضيب موجب (+)' : 'قضيب سالب (−)', b: 'كل ثقوب هذا الصف متصلة ببعضها.' }
         : { h: `العمود ${AR(hole.dataset.c)} · ${g.startsWith('top') ? 'a–e' : 'f–j'}`, b: 'هذه الثقوب الخمسة متصلة من الداخل، وأي ساقين فيها كأنهما مربوطتان بسلك.' };
    box.innerHTML = `<div class="bicon">🔗</div><h3>${info.h}</h3><p>${info.b}</p>`;
  } else if (info) {
    box.innerHTML = `<div class="bicon">${info.led ? '💡' : '🧱'}</div><h3>${info.h}</h3><p>${info.b}</p>`;
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  }
}
window.DECK_BIND = {
  seriespar(sl) {
    const upd = col => {
      const mode = col.querySelector('.spmsg').dataset.m, leds = [...col.querySelectorAll('.spled')];
      const broken = leds.filter(l => l.classList.contains('off')).length;
      leds.forEach(l => { const on = mode === 'series' ? broken === 0 : !l.classList.contains('off'); l.classList.toggle('dark', !on); });
      col.querySelector('.spmsg').innerHTML = broken === 0 ? 'اضغط أي ليد لتعطّله'
        : mode === 'series' ? '❌ انقطع المسار الوحيد… فانطفأت <b>كل</b> الليدات' : `✅ تعطّل ${AR(broken)}… والباقي <b>ما زال يضيء</b>`;
    };
    sl.querySelectorAll('.spcol').forEach(col => col.querySelectorAll('.spled').forEach(l => l.addEventListener('click', () => { l.classList.toggle('off'); upd(col); })));
  },
  resistor(sl) {
    let v = [2, 2, 1, 0];
    const TOL = [5, 10, 1], TOLC = ['#d4af37', '#c0c0c0', '#7b4a26'];
    const draw = () => {
      const val = (v[0] * 10 + v[1]) * RMUL[v[2]].m;
      sl.querySelector('#rv').textContent = fmtOhm(val);
      sl.querySelector('#rtol').textContent = '± ' + TOL[v[3]] + '%';
      const cols = [RCOL[v[0]].c, RCOL[v[1]].c, RMUL[v[2]].c, TOLC[v[3]]];
      sl.querySelectorAll('.band').forEach((b, i) => b.setAttribute('fill', cols[i]));
      sl.querySelectorAll('.swc').forEach(b => b.classList.toggle('on', +b.dataset.i === v[+b.dataset.b]));
    };
    sl.querySelectorAll('.swc').forEach(b => b.addEventListener('click', () => { v[+b.dataset.b] = +b.dataset.i; draw(); }));
    sl.querySelectorAll('.pre').forEach(b => b.addEventListener('click', () => { v = b.dataset.v.split(',').map(Number); draw(); }));
    draw();
  },
  ohmlab(sl) {
    const vin = sl.querySelector('#vin'), rin = sl.querySelector('#rin');
    const upd = () => {
      const V = +vin.value, R = +rin.value, I = Math.max(0, (V - 2) / R) * 1000;   // مللي أمبير (جهد الليد الأحمر تقريبًا ٢ فولت)
      sl.querySelector('#vv').textContent = V; sl.querySelector('#rrv').textContent = R;
      sl.querySelector('#ovtxt').textContent = V + 'V'; sl.querySelector('#ortxt').textContent = R + 'Ω';
      sl.querySelector('#ieq').textContent = I.toFixed(1) + ' mA';
      const pct = Math.min(100, I / 60 * 100), fill = sl.querySelector('#ifill');
      fill.style.width = pct + '%'; fill.className = 'fill ' + (I > 40 ? 'burn' : I > 20 ? 'hot' : 'ok');
      const burnt = I > 40, st = sl.querySelector('#ostate');
      st.textContent = burnt ? '💥 احترق الليد! التيار أكبر بكثير من طاقته' : I > 20 ? '⚠️ خطر: التيار أعلى من الحد الآمن' : I < 2 ? '🌑 التيار ضعيف جدًا… الليد لا يكاد يضيء' : '✅ آمن: الليد يضيء بسلام';
      st.className = 'ohmstate ' + (burnt ? 'burn' : I > 20 ? 'hot' : 'ok');
      const b = burnt ? 0 : Math.min(1, I / 20);
      sl.querySelector('#oled').setAttribute('fill', burnt ? '#2b2b2b' : b > 0.05 ? `rgb(${120 + 135 * b},${35 + 30 * b},${35 + 30 * b})` : '#7a2323');
      sl.querySelector('#oglow').setAttribute('opacity', burnt ? 0 : b);
      sl.querySelector('#osmoke').setAttribute('opacity', burnt ? 1 : 0);
    };
    vin.oninput = rin.oninput = upd; upd();
  },

  ide(sl) {
    sl.querySelectorAll('.hs').forEach(h => h.addEventListener('click', e => { e.stopPropagation(); selectIde(sl, h.dataset.h); }));
  },
  breadboard(sl) {
    const holes = [...sl.querySelectorAll('.hole')];
    holes.forEach(h => {
      h.addEventListener('mouseenter', () => bbShow(sl, [h.dataset.g], null, h));
      h.addEventListener('click', () => bbShow(sl, [h.dataset.g], null, h));
    });
  },

  code(sl, s) {
    sl.querySelector('.copy').onclick = e => {
      navigator.clipboard?.writeText(s.code).then(() => { e.target.textContent = '✓ تم النسخ'; setTimeout(() => e.target.textContent = '📋 نسخ الكود', 1600); });
    };
  },
  board(sl) {
    sl.querySelectorAll('.part').forEach(g => g.addEventListener('click', () => selectPart(sl, g.dataset.p)));
    sl.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => selectPart(sl, c.dataset.p)));
  },
  blinksim(sl) {
    let d = 500, running = false, t = null, i = 0;
    const lines = sl.querySelectorAll('.code .ln'), led = sl.querySelector('#bled'), glow = sl.querySelector('#bglow');
    const status = sl.querySelector('.status b'), btn = sl.querySelector('.play'), range = sl.querySelector('input[type=range]');
    // خطوات الحلقة: [رقم السطر، حالة الليد أو null، مدة الانتظار]
    const seq = () => [[6, true, 150], [7, null, d], [8, false, 150], [9, null, d]];
    const setLed = on => {
      led.setAttribute('fill', on ? '#ff3b3b' : '#7a2323'); glow.setAttribute('opacity', on ? 1 : 0);
      status.textContent = on ? 'HIGH · 5 فولت' : 'LOW · 0 فولت'; status.className = on ? 'hi' : '';
    };
    const tick = () => {
      if (!running) return;
      const [ln, st, wait] = seq()[i % 4];
      lines.forEach(l => l.classList.toggle('run', +l.dataset.n === ln));
      if (st !== null) setLed(st);
      i++; t = setTimeout(tick, wait);
    };
    btn.onclick = () => { running = !running; btn.textContent = running ? '⏸ إيقاف' : '▶ تشغيل'; if (running) tick(); else clearTimeout(t); };
    range.oninput = () => {
      d = +range.value; sl.querySelector('.dval').textContent = d;
      [7, 9].forEach(n => { const src = sl.querySelector(`.ln[data-n="${n}"] .cl-src`); src.innerHTML = src.innerHTML.replace(/(<span class="c-num">)\d+(<\/span>)/, `$1${d}$2`); });
    };
    window.DECK_CLEANUP.push(() => { running = false; clearTimeout(t); });
  },
};
/* كل نقرة: السطر المشروح في الكود، والجزء التالي في جولة اللوحة */
window.DECK_ONSTEP = (step, s) => {
  const sl = document.querySelector('#stage .slide');
  if (!sl) return;
  if (s.t === 'code' && s.steps) {
    const cur = s.steps[step - 1], on = cur ? new Set(cur.lines) : null;
    sl.querySelectorAll('.code .ln').forEach(l => { const n = +l.dataset.n;
      l.classList.toggle('hl', !!on && on.has(n)); l.classList.toggle('dim', !!on && !on.has(n)); });
    sl.querySelectorAll('.xp').forEach((x, i) => x.classList.toggle('now', i === step - 1));
  }
  if (s.t === 'board' && step > 0) selectPart(sl, TOUR[step - 1]);
  if (s.t === 'ide' && step > 0) selectIde(sl, IDE_TOUR[step - 1]);
  if (s.t === 'breadboard') {
    const st = BB_TOUR[step - 1];
    sl.querySelectorAll('.bbled').forEach(l => l.setAttribute('opacity', st && st.led === l.id ? 1 : 0));
    sl.querySelector('.bb').classList.toggle('split', !!(st && st.split));
    if (st) bbShow(sl, st.g, st);
  }
};
})();
