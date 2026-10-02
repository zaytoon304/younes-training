/* =====================================================================
   «صانع الذكريات التراثية» — دوائر التركيب: كل مكوّن وحده على ESP32 بأطراف المشروع الحقيقية
   hsonar · hlcd · hbtn · hstep · hdf · hled · hservo  (والمنظومة كاملة: hmwire في widgetsH.js)
   ===================================================================== */
(function () {
const { B2, wire } = window.ARD2;
const { ITEM, coinSVG } = window.HM;
const LEFT = ['EN', 'VP 36', 'VN 39', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const RIGHT = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2 17', 'RX2 16', 'D4', 'D2', 'D15', 'GND', '3V3'];
const BX = 380, BY = 70, BW = 140, PY = 112, PS = 22;
const pin = n => { const l = LEFT.indexOf(n); if (l >= 0) return [BX, PY + l * PS]; const r = RIGHT.indexOf(n); return [BX + BW, PY + r * PS]; };
const board = (used = []) => `<g class="bs" data-s="1"><rect x="${BX}" y="${BY}" width="${BW}" height="${PY - BY + 15 * PS}" rx="12" fill="#1f2a44"/>
  <rect x="${BX + 35}" y="${BY + 8}" width="70" height="26" rx="4" fill="#c9ccd3"/><text x="${BX + 70}" y="${BY + 26}" class="lbl" style="font-size:13px">ESP32</text>
  ${LEFT.map((p, i) => `<circle cx="${BX}" cy="${PY + i * PS}" r="5" fill="${used.includes(p) ? '#f0cc7a' : '#5b6688'}"/>${used.includes(p) ? `<text x="${BX + 12}" y="${PY + i * PS + 5}" class="hpinl" text-anchor="start">${p}</text>` : ''}`).join('')}
  ${RIGHT.map((p, i) => `<circle cx="${BX + BW}" cy="${PY + i * PS}" r="5" fill="${used.includes(p) ? '#f0cc7a' : '#5b6688'}"/>${used.includes(p) ? `<text x="${BX + BW - 12}" y="${PY + i * PS + 5}" class="hpinl" text-anchor="end">${p}</text>` : ''}`).join('')}</g>`;
const to = (p, [x, y], s, c) => { const [px, py] = pin(p), dx = px < x ? 1 : -1; return wire(`M${px} ${py} C ${px + dx * 70} ${py}, ${x - dx * 70} ${y}, ${x} ${y}`, s, c); };
const box = (s, x, y, w, h, fill, t, sub, extra = '') => `<g class="bs" data-s="${s}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}"/><text x="${x + w / 2}" y="${y + 24}" class="lbl" style="font-size:15px;fill:#fff">${t}</text>${sub ? `<text x="${x + w / 2}" y="${y + 44}" class="lbl" style="font-size:11px;fill:#e8ecf8">${sub}</text>` : ''}${extra}</g>`;
const svgW = (cls, body) => `<svg viewBox="0 0 900 520" class="bsvg b2 hkit ${cls}">${body}</svg>`;

/* ١) حساس الاقتراب */
B2.hsonar = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'نبدأ كل مكوّن وحده على اللوحة: أسهل في الاختبار وفي اكتشاف الخطأ.' },
  { h: 'HC-SR04: الطاقة VCC ← VIN (5V) · GND ← GND', b: 'الحساس يحتاج 5 فولت ليعمل جيدًا.' },
  { h: 'Trig ← 18 · Echo ← 34', b: 'Echo يخرج 5 فولت: ضعوا مقسّم جهد (1k و2k) قبل الطرف 34 لحماية ESP32.' },
  { h: 'شغّل وراقب الشاشة التسلسلية', b: 'قرّب يدك وأبعدها: المسافة بالسنتيمتر.' },
], svg: svgW('hs', `${board(['D34', 'D18', 'VIN', 'GND'])}
  ${box(2, 60, 120, 200, 110, '#1f5fae', 'HC-SR04', 'VCC · Trig · Echo · GND', `<circle cx="120" cy="190" r="22" fill="#c9ccd3" stroke="#78909c" stroke-width="4"/><circle cx="200" cy="190" r="22" fill="#c9ccd3" stroke="#78909c" stroke-width="4"/><g class="hrun">${[30, 50, 70].map(r => `<path d="M${60 - r / 3} ${160} q -12 ${30} 0 ${60}" stroke="#2b6fc0" stroke-width="4" fill="none" opacity=".7"/>`).join('')}</g>`)}
  ${to('VIN', [160, 230], 2, '#e74c3c')}${to('GND', [230, 230], 2, '#1b2340')}
  <g class="bs" data-s="3"><rect x="250" y="300" width="60" height="22" rx="4" fill="#f4e7c8" stroke="#7a5230"/><text x="280" y="316" class="lbl" style="font-size:11px">1k+2k</text></g>
  ${to('D18', [110, 230], 3, '#16a3b5')}${wire(`M200 230 C 200 300, 230 311, 250 311 M310 311 C 340 311, 340 ${pin('D34')[1]}, ${BX} ${pin('D34')[1]}`, 3, '#8e44ad')}`) };

/* ٢) الشاشة */
B2.hlcd = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'مكوّن جديد… على لوحة نظيفة.' },
  { h: 'LCD 16×2 مع لوحة I2C خلفها', b: 'أربعة أطراف فقط بدل ستة عشر.' },
  { h: 'SDA ← 21 · SCL ← 22 · VCC ← VIN · GND ← GND', b: 'إن ظهرت مربعات سوداء: اضبط مقاومة التباين الزرقاء خلف الشاشة.' },
  { h: 'شغّل', b: 'Heritage Memory Maker على الشاشة.' },
], svg: svgW('hl', `${board(['D21', 'D22', 'VIN', 'GND'])}
  ${box(2, 620, 150, 250, 120, '#1b2340', 'LCD 16×2 · I2C', '0x27', `<rect x="640" y="200" width="210" height="54" rx="4" class="hlcdg"/><text x="745" y="222" class="hlcdt">Heritage Memory</text><text x="745" y="244" class="hlcdt">Maker</text>`)}
  ${to('D21', [660, 270], 3, '#2b6fc0')}${to('D22', [700, 270], 3, '#16a3b5')}${to('VIN', [760, 270], 3, '#e74c3c')}${to('GND', [820, 270], 3, '#1b2340')}`) };

/* ٣) الأزرار */
B2.hbtn = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'ستة أزرار: أربعة للمحطات واثنان للإجابة.' },
  { h: 'أزرار المحطات: 32 · 33 · 25 · 35', b: 'طرف من كل زر إلى المنفذ، والطرف الآخر إلى GND.' },
  { h: 'زرا الإجابة: 36 · 39 + مقاومات 10k', b: '35 و36 و39 مدخلات فقط بلا سحب داخلي: مقاومة 10k من كل منها إلى 3.3V.' },
  { h: 'اضغط كل زر', b: 'راقب LOW في الشاشة التسلسلية.' },
], svg: svgW('hb', `${board(['D32', 'D33', 'D25', 'D35', 'VP 36', 'VN 39', 'GND', '3V3'])}
  <g class="bs" data-s="2">${[['#d64545', 'الخيمة'], ['#e0b400', 'الفخار'], ['#2b6fc0', 'الملابس'], ['#2e9e6b', 'السيف']].map(([c, n], i) => `<circle cx="120" cy="${200 + i * 56}" r="20" fill="${c}" stroke="#3e2a1a" stroke-width="3"/><text x="70" y="${206 + i * 56}" class="lbl" style="font-size:13px">${n}</text>`).join('')}</g>
  ${['D35', 'D32', 'D33', 'D25'].map((p, i) => to(p, [140, [200 + 3 * 56, 200, 256, 312][i]], 2, '#2b6fc0')).join('')}
  <g class="bs" data-s="3"><circle cx="120" cy="80" r="18" fill="#f4f1ea" stroke="#3e2a1a" stroke-width="3"/><text x="120" y="86" class="lbl" style="font-size:14px">أ</text><circle cx="200" cy="80" r="18" fill="#f4f1ea" stroke="#3e2a1a" stroke-width="3"/><text x="200" y="86" class="lbl" style="font-size:14px">ب</text>
    <rect x="250" y="40" width="70" height="20" rx="4" fill="#f4e7c8" stroke="#7a5230"/><text x="285" y="55" class="lbl" style="font-size:11px">10k × 3</text></g>
  ${to('VP 36', [138, 80], 3, '#8e44ad')}${to('VN 39', [218, 80], 3, '#8e44ad')}${to('3V3', [320, 50], 3, '#e74c3c')}`) };

/* ٤) المحرك الخطوي */
B2.hstep = { flow: 5, steps: [
  { h: 'لوحة ESP32', b: 'المكوّن الأثقل… والأهم.' },
  { h: 'ULN2003 ومحرك 28BYJ-48', b: 'قابس المحرك الأبيض يدخل في اللوحة باتجاه واحد فقط.' },
  { h: 'IN1 ← 13 · IN2 ← 14 · IN3 ← 26 · IN4 ← 27', b: 'أربعة أسلاك بالترتيب. وفي الكود نكتبها 13، 26، 14، 27.' },
  { h: 'الطاقة: مصدر 6V مستقل + GND مشترك', b: 'لا نغذي المحرك من ESP32: نصل أرضي المصدر بأرضي اللوحة.' },
  { h: 'شغّل', b: 'الليدات الأربعة تتتابع، والمنصة تدور بهدوء.' },
], svg: svgW('hst', `${board(['D13', 'D14', 'D26', 'D27', 'GND'])}
  ${box(2, 60, 60, 220, 150, '#1f7a4d', 'ULN2003', 'IN1 · IN2 · IN3 · IN4', [0, 1, 2, 3].map(i => `<circle cx="${110 + i * 40}" cy="${150}" r="10" class="hstled l${i}"/>`).join(''))}
  <g class="bs" data-s="2"><g transform="translate(170 300)"><circle r="56" fill="#c9ccd3" stroke="#6b7180" stroke-width="4"/><g class="hmspin"><rect x="-4" y="-50" width="8" height="30" rx="4" fill="#8a6d1f"/></g><text y="80" class="lbl" style="font-size:12px">28BYJ-48</text></g><path d="M170 244 L170 210" stroke="#e67e22" stroke-width="10" stroke-dasharray="2 3"/></g>
  ${['D13', 'D14', 'D26', 'D27'].map((p, i) => to(p, [280, 90 + i * 22], 3, ['#e74c3c', '#e0b400', '#2e9e6b', '#2b6fc0'][i])).join('')}
  ${box(4, 40, 420, 150, 60, '#c0392b', '6V', 'مصدر المنصة')}${wire('M190 440 C 230 440, 250 210, 250 210', 4, '#e74c3c')}${to('GND', [115, 480], 4, '#1b2340')}`) };

/* ٥) الصوت */
B2.hdf = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'نضيف الصوت: الطفل يسمع القصة.' },
  { h: 'DFPlayer Mini + بطاقة microSD + سماعة', b: 'الملفات في جذر البطاقة: 0001.mp3، 0002.mp3…' },
  { h: 'RX2 (16) ← TX المشغّل · TX2 (17) ← RX المشغّل (بمقاومة 1k)', b: 'السلكان يتقاطعان: إرسال أحدهما = استقبال الآخر.' },
  { h: 'شغّل', b: 'صوت الترحيب.' },
], svg: svgW('hd', `${board(['RX2 16', 'TX2 17', 'VIN', 'GND'])}
  ${box(2, 630, 120, 200, 120, '#b5652e', 'DFPlayer Mini', 'microSD', `<rect x="690" y="190" width="80" height="34" rx="4" fill="#1b2340"/><text x="730" y="212" class="lbl" style="font-size:11px;fill:#f0cc7a">0001.mp3</text>`)}
  <g class="bs" data-s="2"><g transform="translate(730 330)"><circle r="44" fill="#3e2a1a"/><circle r="20" fill="#7a5230"/><g class="hrun">${[56, 70].map(r => `<path d="M${r} -20 q 12 20 0 40" stroke="#b5652e" stroke-width="4" fill="none"/>`).join('')}</g></g><path d="M730 240 L730 286" stroke="#1b2340" stroke-width="4"/></g>
  ${to('RX2 16', [650, 240], 3, '#e67e22')}${to('TX2 17', [690, 240], 3, '#b5652e')}${to('VIN', [770, 240], 3, '#e74c3c')}${to('GND', [810, 240], 3, '#1b2340')}`) };

/* ٦) الليدان */
B2.hled = { flow: 3, steps: [
  { h: 'لوحة ESP32', b: 'ليدان يقولان للطفل: أحسنت… أو حاول مرة أخرى.' },
  { h: 'الأخضر ← 4 · الأحمر ← 5 · مع 220 أوم لكل ليد', b: 'الطرف الطويل (+) إلى المنفذ عبر المقاومة، والقصير إلى GND.' },
  { h: 'شغّل', b: 'أخضر… ثم أحمر.' },
], svg: svgW('hle', `${board(['D4', 'D5', 'GND'])}
  <g class="bs" data-s="2"><g transform="translate(720 230)"><circle r="26" class="hmled g hrunled"/><text y="56" class="lbl" style="font-size:13px">أخضر · صحيح</text></g><g transform="translate(820 230)"><circle r="26" class="hmled r hrunled2"/><text y="56" class="lbl" style="font-size:13px">أحمر · مساعدة</text></g>
    <rect x="640" y="300" width="60" height="18" rx="4" fill="#f4e7c8" stroke="#7a5230"/><text x="670" y="314" class="lbl" style="font-size:10px">220Ω × 2</text></g>
  ${to('D4', [720, 204], 2, '#2e9e6b')}${to('D5', [820, 204], 2, '#d64545')}${to('GND', [770, 320], 2, '#1b2340')}`) };

/* ٧) السيرفو */
B2.hservo = { flow: 4, steps: [
  { h: 'لوحة ESP32', b: 'آخر مكوّن… وأجمل لحظة في الجولة.' },
  { h: 'SG90 + ترس Pinion + قضيب Rack', b: 'الترس على محور السيرفو، والقضيب ينزلق تحت خزان العملات.' },
  { h: 'الإشارة (البرتقالي) ← 23 · الطاقة من 4.5V مستقلة · GND مشترك', b: 'تغذية السيرفو من لوحة ESP32 تسبب الارتجاف: هذا تحدٍّ واجهه الفريق.' },
  { h: 'giveCoin()', b: 'الترس يدور، والقضيب يدفع، والعملة تخرج.' },
], svg: svgW('hse', `${board(['D23', 'GND'])}
  ${box(2, 640, 70, 200, 90, '#1f5fae', 'SG90', 'بني GND · أحمر + · برتقالي إشارة')}
  <g class="bs" data-s="2"><g transform="translate(740 220)"><g class="hpinion"><circle r="30" fill="#2b6fc0"/>${Array.from({ length: 10 }, (_, i) => `<rect x="-4" y="-38" width="8" height="10" fill="#2b6fc0" transform="rotate(${i * 36})"/>`).join('')}</g></g><g class="hrack"><rect x="610" y="258" width="200" height="14" fill="#9aa1b3"/></g><g class="hcoinout" transform="translate(830 300)">${coinSVG('sword', 22)}</g></g>
  ${to('D23', [660, 160], 3, '#e67e22')}${box(3, 600, 420, 140, 56, '#c0392b', '4.5V', 'للسيرفو')}${wire('M740 420 C 740 300, 820 200, 820 160', 3, '#e74c3c')}${to('GND', [700, 160], 3, '#1b2340')}`) };
})();
