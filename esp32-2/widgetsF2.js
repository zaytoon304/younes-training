/* =====================================================================
   «ESP32 للمعلمين ٢» · دوائر التركيب خطوة خطوة (build2)
   fknobw · fldrw · fdhtw · fsonarw · fpirw · fgatew · fmotorw
   ===================================================================== */
(function () {
const { B2, wire } = window.ARD2;
const LEFT = ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const RIGHT = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3'];
const BX = 375, BY = 40, BW = 150, PY = 84, PS = 24;
const pin = (n, side) => { const l = LEFT.indexOf(n), r = RIGHT.indexOf(n); if (side === 'r' || l < 0) return [BX + BW, PY + r * PS]; return [BX, PY + l * PS]; };
const NICK = { TX2: 'TX2·17', RX2: 'RX2·16', VP: 'VP·36' };
const board = (used = []) => `<g class="bs" data-s="1"><rect x="${BX}" y="${BY}" width="${BW}" height="${PY - BY + 15 * PS}" rx="12" fill="#1f2a44"/>
  <rect x="${BX + 30}" y="${BY + 8}" width="90" height="30" rx="4" fill="#c9ccd3"/><text x="${BX + 75}" y="${BY + 28}" class="lbl" style="font-size:13px">ESP32</text>
  <rect x="${BX + 55}" y="${PY + 15 * PS - 6}" width="40" height="22" rx="4" fill="#c9ccd3"/>
  ${LEFT.map((p, i) => `<circle cx="${BX}" cy="${PY + i * PS}" r="5.5" fill="${used.includes(p) || used.includes('L:' + p) ? '#f0cc7a' : '#5b6688'}"/>${used.includes(p) || used.includes('L:' + p) ? `<text x="${BX + 12}" y="${PY + i * PS + 5}" class="epinl" text-anchor="start">${NICK[p] || p}</text>` : ''}`).join('')}
  ${RIGHT.map((p, i) => `<circle cx="${BX + BW}" cy="${PY + i * PS}" r="5.5" fill="${used.includes('R:' + p) || (used.includes(p) && !LEFT.includes(p)) ? '#f0cc7a' : '#5b6688'}"/>${used.includes('R:' + p) || (used.includes(p) && !LEFT.includes(p)) ? `<text x="${BX + BW - 12}" y="${PY + i * PS + 5}" class="epinl" text-anchor="end">${NICK[p] || p}</text>` : ''}`).join('')}</g>`;
const to = (p, [x, y], s, c, side) => { const [px, py] = pin(p, side), dx = px < x ? 1 : -1; return wire(`M${px} ${py} C ${px + dx * 70} ${py}, ${x - dx * 60} ${y}, ${x} ${y}`, s, c); };
const G = (s, inner) => `<g class="bs" data-s="${s}">${inner}</g>`;
const T = (x, y, t, sz = 12) => `<text x="${x}" y="${y}" class="lbl" style="font-size:${sz}px">${t}</text>`;
const ledR = (s, x, y, color, label) => G(s, `<rect x="${x}" y="${y - 7}" width="44" height="14" rx="4" fill="#d9b382" stroke="#7a5230" stroke-width="2"/>${[0, 1, 2].map(i => `<rect x="${x + 10 + i * 9}" y="${y - 7}" width="4" height="14" fill="${['#c0392b', '#c0392b', '#6d4521'][i]}"/>`).join('')}
  <line x1="${x + 44}" y1="${y}" x2="${x + 62}" y2="${y}" stroke="#9aa1b3" stroke-width="3"/><circle cx="${x + 80}" cy="${y}" r="17" fill="${color}" class="eled b1" opacity=".9"/><line x1="${x + 80}" y1="${y + 17}" x2="${x + 80}" y2="${y + 44}" stroke="#9aa1b3" stroke-width="3"/>${label ? T(x + 80, y - 24, label) : ''}`);
const res = (x, y, lbl, vert = false) => vert ? `<rect x="${x - 7}" y="${y}" width="14" height="44" rx="4" fill="#d9b382" stroke="#7a5230" stroke-width="2"/>${T(x + 26, y + 26, lbl, 11)}` : `<rect x="${x}" y="${y - 7}" width="44" height="14" rx="4" fill="#d9b382" stroke="#7a5230" stroke-width="2"/>${T(x + 22, y - 12, lbl, 11)}`;
const svg = (cls, body) => `<svg viewBox="0 0 900 520" class="bsvg b2 ekit ${cls}">${body}</svg>`;
const K = '#1b2340', RED = '#e74c3c', OR = '#e67e22';

/* ١) المقبض والليد */
B2.fknobw = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'المقبض على 34 (ADC1)، والليد على 23.' },
  { h: 'المقاومة المتغيرة: الطرفان إلى 3V3 وGND', b: 'لا ٥ فولت أبدًا: الطرف يتحمل ٣٫٣ فقط.' },
  { h: 'الطرف الأوسط ← GPIO34', b: 'هو الذي يتغير جهده حين تدير المقبض.' },
  { h: 'الليد بمقاومة ٢٢٠ ← GPIO23', b: 'ثم ارفع KnobLED وأدر المقبض: يتدرج السطوع.' },
], svg: svg('fk', `${board(['D34', 'L:GND', 'R:3V3', 'R:D23', 'R:GND'])}
  ${G(2, `<circle cx="150" cy="200" r="46" fill="#2b6fc0"/><circle cx="150" cy="200" r="22" fill="#c9cfe6"/><rect x="146" y="170" width="8" height="26" rx="3" fill="#2b6fc0"/>${[110, 150, 190].map(x => `<line x1="${x}" y1="246" x2="${x}" y2="280" stroke="#9aa1b3" stroke-width="5"/>`).join('')}${T(150, 140, 'مقاومة متغيرة', 13)}`)}
  ${wire('M525 420 C 600 420, 600 500, 450 500 L 200 500 C 110 500, 110 400, 110 280', 2, OR)}${to('GND', [190, 280], 2, K)}${to('D34', [150, 280], 3, '#2b6fc0')}
  ${ledR(4, 640, 120, '#ffcf4a', 'LED · 23')}${to('D23', [640, 120], 4, RED, 'r')}${wire('M720 164 C 720 330, 600 400, 525 396', 4, K)}`) };

/* ٢) LDR ومقسم الجهد والمصباح */
B2.fldrw = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'الحساس على 35 (مدخل فقط، ADC1).' },
  { h: 'LDR من 3V3', b: 'المقاومة الضوئية: تقل مقاومتها كلما زاد الضوء.' },
  { h: 'مقاومة 10k من نقطة الالتقاء إلى GND', b: 'هذا هو «مقسم الجهد».' },
  { h: 'نقطة الالتقاء ← GPIO35', b: 'جهدها يتغير مع الضوء.' },
  { h: 'المصباح (ليد) على 23', b: 'ارفع StreetLight وغطِّ الحساس بيدك.' },
], svg: svg('fl', `${board(['D35', 'L:GND', 'R:3V3', 'R:D23', 'R:GND'])}
  ${G(2, `<rect x="120" y="90" width="60" height="60" rx="30" fill="#c48a3a"/><path d="M132 105 q18 8 0 15 q18 8 0 15" stroke="#5b2d0e" stroke-width="4" fill="none"/>${T(220, 125, 'LDR', 14)}<line x1="150" y1="150" x2="150" y2="210" stroke="#9aa1b3" stroke-width="4"/>`)}
  ${G(2, wire('M150 90 C 150 30, 560 20, 600 60 C 640 100, 560 420, 525 420', 2, OR).replace(/<g[^>]*>|<\/g>/g, ''))}
  ${G(3, `${res(150, 230, '10k', true)}<circle cx="150" cy="220" r="7" fill="#f0cc7a"/><line x1="150" y1="274" x2="150" y2="330" stroke="#9aa1b3" stroke-width="4"/>`)}${to('GND', [150, 330], 3, K)}
  ${to('D35', [158, 220], 4, '#2b6fc0')}
  ${ledR(5, 640, 120, '#ffcf4a', 'المصباح · 23')}${to('D23', [640, 120], 5, RED, 'r')}${wire('M720 164 C 720 300, 700 360, 525 396', 5, K)}`) };

/* ٣) DHT22 والمُرحِّل */
B2.fdhtw = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'الحساس على 4، والمُرحِّل على 19.' },
  { h: 'وحدة DHT22: + إلى 3V3 · − إلى GND', b: 'الوحدة الجاهزة فيها مقاومة السحب 10k. الحساس العاري يحتاجها بين البيانات و3V3.' },
  { h: 'out (البيانات) ← GPIO4', b: 'سلك واحد ينقل الحرارة والرطوبة معًا: ٤٠ بت كل مرة.' },
  { h: 'وحدة المُرحِّل: IN ← 19 · VCC ← VIN · GND', b: 'أغلب وحدات المرحّل تريد ٥ فولت للملف: من VIN.' },
  { h: 'المروحة على جهة المفتاح', b: 'في المعمل نجرّب بمروحة ٥ فولت أو ليد. الـ ٢٢٠ فولت للفني المختص فقط.' },
], svg: svg('fd', `${board(['R:D4', 'R:3V3', 'R:GND', 'R:D19', 'VIN'])}
  ${G(2, `<rect x="700" y="300" width="90" height="120" rx="10" fill="#f2f4f8"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${717 + (i % 3) * 28}" cy="${322 + Math.floor(i / 3) * 24}" r="6" fill="#c8cfdf"/>`).join('')}${T(745, 290, 'DHT22', 14)}${['+', 'out', '−'].map((t, i) => `<line x1="${720 + i * 25}" y1="420" x2="${720 + i * 25}" y2="460" stroke="#9aa1b3" stroke-width="4"/>${T(720 + i * 25, 478, t, 12)}`).join('')}`)}
  ${to('3V3', [720, 460], 2, OR, 'r')}${to('GND', [770, 460], 2, K, 'r')}${to('D4', [745, 460], 3, '#2b6fc0', 'r')}
  ${G(4, `<rect x="660" y="60" width="150" height="90" rx="10" fill="#2b6fc0"/><rect x="680" y="75" width="60" height="55" rx="6" fill="#1d4f8f"/>${T(735, 168, 'مُرحِّل (Relay)', 13)}${['IN', 'VCC', 'GND'].map((t, i) => T(640, 90 + i * 22, t, 11)).join('')}`)}
  ${to('D19', [660, 85], 4, '#8e44ad', 'r')}${wire('M375 420 C 250 470, 600 500, 660 107', 4, RED)}${wire('M525 396 C 600 396, 620 130, 660 129', 4, K)}
  ${G(5, `<circle cx="830" cy="230" r="40" fill="#141d3d" stroke="#8d9bd0" stroke-width="3"/>${[0, 120, 240].map(a => `<ellipse cx="830" cy="230" rx="10" ry="30" fill="#4fc3f7" transform="rotate(${a} 830 230) translate(0 -16)"/>`).join('')}${T(830, 290, 'المروحة', 13)}<line x1="810" y1="150" x2="820" y2="192" stroke="#e74c3c" stroke-width="4"/>`)}`) };

/* ٤) HC-SR04 بمقسم جهد + بازر */
B2.fsonarw = { flow: 6, steps: [
  { h: 'لوحة ESP32', b: 'Trig على 26، وEcho على 27، والبازر على 13.' },
  { h: 'HC-SR04: VCC ← VIN (5V) · GND ← GND', b: 'الحساس الكلاسيكي يحتاج ٥ فولت ليعمل جيدًا.' },
  { h: 'Trig ← GPIO26', b: 'الـ ٣٫٣ فولت تكفي لإعطاء أمر الإرسال.' },
  { h: 'Echo ← مقاومة 1k ← GPIO27 ← مقاومة 2k ← GND', b: 'Echo يُخرج ٥ فولت: المقسم يخفضها إلى ٣٫٣ ليحمي الطرف.' },
  { h: 'البازر: + ← 13 · − ← GND', b: 'البازر السلبي يصدر أي نغمة نطلبها.' },
  { h: 'ارفع Parking', b: 'قرّب يدك: تتسارع النغمات.' },
], svg: svg('fs', `${board(['VIN', 'D26', 'D27', 'GND', 'D13'])}
  ${G(2, `<rect x="40" y="60" width="200" height="90" rx="10" fill="#2b6fc0"/><circle cx="90" cy="105" r="30" fill="#c9cfe6"/><circle cx="190" cy="105" r="30" fill="#c9cfe6"/>${['VCC', 'Trig', 'Echo', 'GND'].map((t, i) => `<line x1="${85 + i * 35}" y1="150" x2="${85 + i * 35}" y2="185" stroke="#9aa1b3" stroke-width="4"/>${T(85 + i * 35, 200, t, 11)}`).join('')}`)}
  ${to('VIN', [85, 185], 2, RED)}${to('GND', [190, 185], 2, K)}${to('D26', [120, 185], 3, '#e0b400')}
  ${G(4, `${wire('M155 185 L155 250', 4, '#2b6fc0').replace(/<g[^>]*>|<\/g>/g, '')}${res(155, 250, '1k', true)}<circle cx="155" cy="305" r="6" fill="#f0cc7a"/>${res(155, 315, '2k', true)}<line x1="155" y1="359" x2="155" y2="390" stroke="#9aa1b3" stroke-width="4"/>${T(110, 400, 'GND', 11)}`)}
  ${to('D27', [161, 305], 4, '#2b6fc0')}
  ${G(5, `<circle cx="250" cy="440" r="30" fill="#1c1f27"/><circle cx="250" cy="440" r="9" fill="#5b6383"/>${T(250, 495, 'بازر', 13)}`)}${to('D13', [280, 440], 5, '#8e44ad')}`) };

/* ٥) PIR وبازر وليد */
B2.fpirw = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'PIR على 33، والبازر على 13، والليد على 23.' },
  { h: 'PIR: VCC ← VIN · GND ← GND', b: 'وحدة HC-SR501 تعمل من ٥ فولت، لكن خرجها ٣٫٣ فولت: آمن مباشرة!' },
  { h: 'OUT ← GPIO33', b: 'HIGH عند كشف حركة.' },
  { h: 'البازر ← 13 · الليد ← 23', b: 'الإنذار صوت وضوء.' },
  { h: 'ارفع PIRAlarm وانتظر ٣٠ ثانية', b: 'الحساس يحتاج وقتًا ليتعلم «حرارة الغرفة الهادئة».' },
], svg: svg('fp', `${board(['VIN', 'D33', 'GND', 'D13', 'R:D23', 'R:GND'])}
  ${G(2, `<rect x="60" y="90" width="150" height="110" rx="10" fill="#2e9e6b"/><circle cx="135" cy="145" r="44" fill="#f2f4f8"/><circle cx="135" cy="145" r="28" fill="#dfe3ee"/>${['VCC', 'OUT', 'GND'].map((t, i) => `<line x1="${100 + i * 35}" y1="200" x2="${100 + i * 35}" y2="235" stroke="#9aa1b3" stroke-width="4"/>${T(100 + i * 35, 250, t, 11)}`).join('')}${T(135, 75, 'PIR · HC-SR501', 13)}`)}
  ${to('VIN', [100, 235], 2, RED)}${to('GND', [170, 235], 2, K)}${to('D33', [135, 235], 3, '#2b6fc0')}
  ${G(4, `<circle cx="200" cy="420" r="30" fill="#1c1f27"/><circle cx="200" cy="420" r="9" fill="#5b6383"/>${T(200, 475, 'بازر', 13)}`)}${to('D13', [230, 420], 4, '#8e44ad')}
  ${ledR(4, 640, 120, '#ff3b3b', 'ليد التحذير · 23')}${to('D23', [640, 120], 4, RED, 'r')}${wire('M720 164 C 720 300, 700 360, 525 396', 4, K)}`) };

/* ٦) البوابة: سيرفو + HC-SR04 */
B2.fgatew = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'السيرفو على 18، والحساس على 26 و27 كما في المحور الرابع.' },
  { h: 'السيرفو: البني ← GND · الأحمر ← VIN', b: 'السيرفو يسحب تيارًا كبيرًا لحظة الحركة: لا تغذّه من 3V3.' },
  { h: 'البرتقالي (الإشارة) ← GPIO18', b: 'إشارة ٣٫٣ فولت تكفي أغلب السيرفوهات.' },
  { h: 'HC-SR04 بمقسم Echo', b: 'نفس توصيل حساس الركن.' },
  { h: 'ارفع SmartGate', b: 'قرّب سيارة اللعبة: تنفتح البوابة بنعومة.' },
], svg: svg('fg', `${board(['VIN', 'D26', 'D27', 'L:GND', 'R:D18', 'R:GND'])}
  ${G(2, `<rect x="660" y="150" width="120" height="70" rx="8" fill="#2b6fc0"/><circle cx="700" cy="185" r="22" fill="#f2f4f8"/><rect x="694" y="110" width="12" height="70" rx="6" fill="#f2f4f8"/>${T(720, 245, 'سيرفو SG90', 13)}
    ${[['#6d4521', 0], ['#e74c3c', 1], ['#e67e22', 2]].map(([c, i]) => `<line x1="660" y1="${170 + i * 14}" x2="620" y2="${170 + i * 14}" stroke="${c}" stroke-width="5"/>`).join('')}`)}
  ${to('GND', [620, 170], 2, K, 'r')}${wire('M375 420 C 250 500, 600 500, 620 184', 2, RED)}${to('D18', [620, 198], 3, OR, 'r')}
  ${G(4, `<rect x="40" y="60" width="200" height="90" rx="10" fill="#2b6fc0"/><circle cx="90" cy="105" r="30" fill="#c9cfe6"/><circle cx="190" cy="105" r="30" fill="#c9cfe6"/>${T(140, 175, 'HC-SR04 + مقسم 1k/2k', 12)}`)}
  ${to('D26', [140, 150], 4, '#e0b400')}${to('D27', [180, 150], 4, '#2b6fc0')}`) };

/* ٧) L298N والمحرك */
B2.fmotorw = { flow: 6, steps: [
  { h: 'لوحة ESP32', b: 'ENA على 14 للسرعة، وIN1 وIN2 على 16 و17 للاتجاه.' },
  { h: 'درايفر L298N', b: 'جسر H مزدوج: يتحمل تيار المحرك الكبير بدل ESP32.' },
  { h: 'المحرك على OUT1 وOUT2', b: 'إن دار عكس المتوقع: اعكس سلكيه فقط.' },
  { h: 'البطارية: + ← 12V · − ← GND', b: 'مصدر منفصل للمحرك. لا تشغّل المحرك من USB.' },
  { h: 'ENA ← 14 · IN1 ← 16 · IN2 ← 17 · GND مشترك', b: 'انزع وصلة ENA الصغيرة (Jumper) لتتحكم بالسرعة. وGND المشترك إلزامي!' },
  { h: 'ارفع MotorL298N', b: 'تسارع… توقف… خلفًا.' },
], svg: svg('fm', `${board(['D14', 'L:GND', 'R:RX2', 'R:TX2', 'R:GND'])}
  ${G(2, `<rect x="640" y="200" width="200" height="150" rx="12" fill="#c0392b"/><rect x="700" y="220" width="80" height="60" rx="6" fill="#222"/>${T(740, 310, 'L298N', 15)}${['ENA', 'IN1', 'IN2'].map((t, i) => `<circle cx="${660 + i * 30}" cy="340" r="5" fill="#f0cc7a"/>${T(660 + i * 30, 365, t, 10)}`).join('')}${['12V', 'GND'].map((t, i) => `<rect x="${760 + i * 40}" y="330" width="30" height="16" rx="3" fill="#2b6fc0"/>${T(775 + i * 40, 365, t, 10)}`).join('')}`)}
  ${G(3, `<rect x="660" y="60" width="100" height="70" rx="35" fill="#9aa3bd"/><rect x="760" y="85" width="40" height="20" fill="#c9cfe6"/>${T(710, 52, 'محرك DC', 13)}<line x1="680" y1="130" x2="660" y2="210" stroke="#e74c3c" stroke-width="4"/><line x1="740" y1="130" x2="830" y2="210" stroke="#1b2340" stroke-width="4"/>`)}
  ${G(4, `<rect x="700" y="420" width="140" height="70" rx="10" fill="#2e9e6b"/>${T(770, 462, '🔋 بطارية 9–12V', 13)}`)}${wire('M760 420 L775 346', 4, RED)}${wire('M820 420 L815 346', 4, K)}
  ${to('D14', [660, 340], 5, '#8e44ad')}${to('RX2', [690, 340], 5, '#2b6fc0', 'r')}${to('TX2', [720, 340], 5, '#16a3b5', 'r')}${wire('M525 396 C 600 420, 780 400, 815 346', 5, K)}`) };
})();
