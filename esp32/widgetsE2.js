/* =====================================================================
   «ESP32 للمعلمين — الجزء الأول» · دوائر التركيب خطوة خطوة (build2)
   eledw · etrafficw · ebtnw · ergbw · epedw
   ===================================================================== */
(function () {
const { B2, wire } = window.ARD2;
const LEFT = ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const RIGHT = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3'];
const BX = 330, BY = 60, BW = 150, PY = 104, PS = 24;
const pin = n => { const l = LEFT.indexOf(n); if (l >= 0) return [BX, PY + l * PS]; const r = RIGHT.indexOf(n); return [BX + BW, PY + r * PS]; };
const board = (used = []) => `<g class="bs" data-s="1"><rect x="${BX}" y="${BY}" width="${BW}" height="${PY - BY + 15 * PS}" rx="12" fill="#1f2a44"/>
  <rect x="${BX + 30}" y="${BY + 8}" width="90" height="30" rx="4" fill="#c9ccd3"/><text x="${BX + 75}" y="${BY + 28}" class="lbl" style="font-size:13px">ESP32</text>
  <rect x="${BX + 55}" y="${PY + 15 * PS - 6}" width="40" height="22" rx="4" fill="#c9ccd3"/><text x="${BX + 75}" y="${PY + 15 * PS + 32}" class="lbl" style="font-size:11px">USB</text>
  ${LEFT.map((p, i) => `<circle cx="${BX}" cy="${PY + i * PS}" r="5.5" fill="${used.includes(p) ? '#f0cc7a' : '#5b6688'}"/>${used.includes(p) ? `<text x="${BX + 12}" y="${PY + i * PS + 5}" class="epinl" text-anchor="start">${p}</text>` : ''}`).join('')}
  ${RIGHT.map((p, i) => `<circle cx="${BX + BW}" cy="${PY + i * PS}" r="5.5" fill="${used.includes(p) ? '#f0cc7a' : '#5b6688'}"/>${used.includes(p) ? `<text x="${BX + BW - 12}" y="${PY + i * PS + 5}" class="epinl" text-anchor="end">${p}</text>` : ''}`).join('')}</g>`;
const to = (p, [x, y], s, c) => { const [px, py] = pin(p), dx = px < x ? 1 : -1; return wire(`M${px} ${py} C ${px + dx * 70} ${py}, ${x - dx * 60} ${y}, ${x} ${y}`, s, c); };
// ليد بمقاومة: المقاومة أفقية ثم الليد، والكاثود إلى سكة الأرضي
const ledR = (s, x, y, color, cls, label) => `<g class="bs" data-s="${s}"><rect x="${x}" y="${y - 7}" width="44" height="14" rx="4" fill="#d9b382" stroke="#7a5230" stroke-width="2"/>${[0, 1, 2].map(i => `<rect x="${x + 10 + i * 9}" y="${y - 7}" width="4" height="14" fill="${['#c0392b', '#c0392b', '#6d4521'][i]}"/>`).join('')}
  <line x1="${x + 44}" y1="${y}" x2="${x + 62}" y2="${y}" stroke="#9aa1b3" stroke-width="3"/><circle cx="${x + 80}" cy="${y}" r="17" fill="${color}" class="eled ${cls}" opacity=".9"/><line x1="${x + 80}" y1="${y + 17}" x2="${x + 80}" y2="${y + 44}" stroke="#9aa1b3" stroke-width="3"/>${label ? `<text x="${x + 80}" y="${y - 24}" class="lbl" style="font-size:12px">${label}</text>` : ''}</g>`;
const gndRail = (s, x1, x2, y) => `<g class="bs" data-s="${s}"><rect x="${x1}" y="${y - 5}" width="${x2 - x1}" height="10" rx="5" fill="#1b2340"/><text x="${x2 + 6}" y="${y + 5}" class="lbl" style="font-size:12px;text-anchor:start">GND</text></g>`;
const svg = (cls, body) => `<svg viewBox="0 0 900 520" class="bsvg b2 ekit ${cls}">${body}</svg>`;

B2.eledw = { flow: 4, steps: [
  { h: 'لوحة ESP32 DevKit', b: 'نحدد الطرف 23 والأرضي GND.' },
  { h: 'مقاومة ٢٢٠ أوم + ليد', b: 'الساق الطويلة (+) جهة المقاومة، والقصيرة (−) إلى الأرضي.' },
  { h: 'سلك: GPIO23 ← المقاومة · والليد ← GND', b: 'التيار يخرج من الطرف، ويمر في المقاومة فالليد، ويعود إلى الأرضي.' },
  { h: 'ارفع الكود', b: 'الطرف 23 يُخرج ٣٫٣ فولت ثم صفرًا… والليد يومض.' },
], svg: svg('el', `${board(['D23', 'GND'])}${ledR(2, 600, 140, '#ff3b3b', 'b1', 'LED')}${gndRail(2, 560, 760, 300)}
  ${to('D23', [600, 140], 3, '#e74c3c')}${wire('M680 184 L680 300', 3, '#1b2340')}${to('GND', [560, 300], 3, '#1b2340')}`) };

B2.etrafficw = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'ثلاثة أطراف آمنة متجاورة: 25 و26 و27.' },
  { h: 'ثلاثة ليدات بمقاوماتها', b: 'أحمر فأصفر فأخضر، من الأعلى إلى الأسفل كالإشارة الحقيقية.' },
  { h: 'الأسلاك: 25 ← الأحمر · 26 ← الأصفر · 27 ← الأخضر', b: 'كل ليد له طرفه الخاص.' },
  { h: 'سكة أرضي واحدة لكل الليدات', b: 'الأرجل القصيرة الثلاث إلى السكة، والسكة إلى GND في اللوحة.' },
  { h: 'شغّل الإشارة', b: 'أخضر… أصفر… أحمر.' },
], svg: svg('et', `${board(['D25', 'D26', 'D27', 'GND'])}${ledR(2, 80, 110, '#ff3b3b', 'r', 'أحمر · 25')}${ledR(2, 80, 210, '#f5d020', 'y', 'أصفر · 26')}${ledR(2, 80, 310, '#2ecc71', 'g', 'أخضر · 27')}
  ${to('D25', [80, 110], 3, '#e74c3c')}${to('D26', [80, 210], 3, '#e0b400')}${to('D27', [80, 310], 3, '#2e9e6b')}
  ${gndRail(4, 60, 250, 420)}${[154, 254, 354].map(y => wire(`M160 ${y} L160 ${y + 16} L200 ${y + 16} L200 420`, 4, '#1b2340')).join('')}${to('GND', [250, 420], 4, '#1b2340')}`) };

B2.ebtnw = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'زر على الطرف 4، وليد على 23.' },
  { h: 'الزر: طرف إلى GPIO4 وطرف إلى GND', b: 'لا مقاومة! INPUT_PULLUP في الكود يكفي.' },
  { h: 'الليد بمقاومته على GPIO23', b: 'كما في الوميض.' },
  { h: 'اضغط الزر', b: 'الضغط يوصل الطرف 4 بالأرضي: LOW… والليد يضيء.' },
], svg: svg('eb', `${board(['D4', 'D23', 'GND'])}
  <g class="bs" data-s="2"><rect x="610" y="330" width="70" height="70" rx="8" fill="#1c1f27"/><circle cx="645" cy="365" r="22" fill="#d64545" class="ebtnc"/><text x="645" y="425" class="lbl" style="font-size:12px">زر · GPIO4</text></g>
  ${to('D4', [610, 350], 2, '#2b6fc0')}${wire('M680 380 C 760 380, 760 470, 640 470 L520 470', 2, '#1b2340')}${to('GND', [520, 470], 2, '#1b2340')}
  ${ledR(3, 600, 140, '#ff3b3b', 'b1', 'LED · 23')}${to('D23', [600, 140], 3, '#e74c3c')}${wire('M680 184 C 680 240, 760 240, 760 380', 3, '#1b2340')}`) };

B2.ergbw = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'ثلاثة أطراف للألوان الثلاثة: 16 و17 و18.' },
  { h: 'ليد RGB (مهبط مشترك) + ثلاث مقاومات', b: 'الساق الأطول هي المشتركة: إلى GND.' },
  { h: 'الأحمر ← 16 · الأخضر ← 17 · الأزرق ← 18', b: 'كل لون عبر مقاومته.' },
  { h: 'امزج الألوان', b: 'analogWrite بقيم من ٠ إلى ٢٥٥ لكل لون.' },
], svg: svg('er', `${board(['RX2', 'TX2', 'D18', 'GND'])}
  <g class="bs" data-s="2"><circle cx="700" cy="250" r="42" class="ergbc"/>${[0, 1, 2, 3].map(i => `<line x1="${670 + i * 20}" y1="292" x2="${670 + i * 20}" y2="${i === 1 ? 360 : 330}" stroke="#9aa1b3" stroke-width="4"/>`).join('')}
    ${[0, 1, 2].map(i => `<rect x="${590 + i * 0}" y="${150 + i * 50}" width="0" height="0"/>`).join('')}<text x="700" y="200" class="lbl" style="font-size:13px">RGB</text></g>
  ${to('RX2', [670, 330], 3, '#e74c3c')}${to('TX2', [710, 330], 3, '#2ecc71')}${to('D18', [730, 330], 3, '#3498db')}${wire('M690 360 C 690 440, 600 470, 520 470', 2, '#1b2340')}${to('GND', [520, 470], 2, '#1b2340')}`) };

B2.epedw = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'إشارة سيارات وإشارة مشاة وزر عبور.' },
  { h: 'السيارات: 25 أحمر · 26 أصفر · 27 أخضر', b: 'كما في محور إشارة المرور.' },
  { h: 'المشاة: 32 أحمر · 33 أخضر', b: 'طرفان آمنان على الجهة نفسها.' },
  { h: 'زر العبور: GPIO4 ← الزر ← GND', b: 'مع INPUT_PULLUP.' },
  { h: 'اضغط الزر', b: 'السيارات تتوقف… والمشاة يعبرون.' },
], svg: svg('ep', `${board(['D25', 'D26', 'D27', 'D32', 'D33', 'D4', 'GND'])}
  ${ledR(2, 70, 90, '#ff3b3b', 'r', 'سيارات · 25')}${ledR(2, 70, 170, '#f5d020', 'y', '26')}${ledR(2, 70, 250, '#2ecc71', 'g', '27')}
  ${to('D25', [70, 90], 2, '#e74c3c')}${to('D26', [70, 170], 2, '#e0b400')}${to('D27', [70, 250], 2, '#2e9e6b')}
  ${ledR(3, 70, 350, '#ff3b3b', 'pr', 'مشاة · 32')}${ledR(3, 70, 430, '#2ecc71', 'pg', '33')}${to('D32', [70, 350], 3, '#c0392b')}${to('D33', [70, 430], 3, '#1e7a4c')}
  <g class="bs" data-s="4"><rect x="620" y="300" width="70" height="70" rx="8" fill="#1c1f27"/><circle cx="655" cy="335" r="22" fill="#2b6fc0" class="ebtnc"/><text x="655" y="395" class="lbl" style="font-size:12px">زر العبور · 4</text></g>
  ${to('D4', [620, 320], 4, '#2b6fc0')}${wire('M690 350 C 760 350, 760 470, 640 470 L520 470', 4, '#1b2340')}${to('GND', [520, 470], 4, '#1b2340')}`) };
})();
