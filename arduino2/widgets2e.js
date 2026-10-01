/* =====================================================================
   أدوات الجزء الثاني — المرحلة الخامسة: المحركات
   الأنواع: kicklab (الترانزستور والدايود) · hlab (الجسر H بـ L298N) · steplab (المحرك الخطوي)
   دوائر البناء: dcfan · stepwire
   أرقام علمية: 28BYJ-48 = 2048 خطوة للدورة في وضع الخطوة الكاملة (0.18 درجة للخطوة تقريبًا)
   ومكتبة Stepper معه: Stepper(2048, 8, 10, 9, 11) ← تتابع الملفات IN1+IN2 → IN2+IN3 → IN3+IN4 → IN4+IN1
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { plotter, plotFeed, B2, col, pinX, botX, base, wire } = window.ARD2;
const START_PWM = 60;                                                 // تحت هذه القيمة يطنّ المحرك الصغير ولا يدور

const fanSVG = id => `<svg viewBox="0 0 200 200" class="fansvg2" id="${id}">
  <circle cx="100" cy="100" r="92" class="fring"/>
  <g class="fblades">${[0, 120, 240].map(a => `<path d="M100 100 C 80 60, 90 22, 112 18 C 128 40, 120 76, 100 100 Z" transform="rotate(${a} 100 100)" class="fblade"/>`).join('')}</g>
  <circle cx="100" cy="100" r="16" class="fhub"/></svg>`;

/* ================== الترانزستور والدايود ================== */
const kickSVG = () => `<svg viewBox="0 0 560 470" class="kicksvg">
  <text x="360" y="34" class="klab">5V</text><line x1="360" y1="44" x2="360" y2="80" class="kw k5"/>
  <circle cx="360" cy="140" r="52" class="kmot"/><text x="360" y="155" class="kM">M</text>
  <line x1="360" y1="80" x2="360" y2="88" class="kw k5"/><line x1="360" y1="192" x2="360" y2="250" class="kw kc"/>
  <g id="kdiode"><path d="M360 70 L470 70 L470 118" class="kw kd"/><path d="M470 162 L470 210 L360 210" class="kw kd"/>
    <polygon points="452,162 488,162 470,128" class="kdtri"/><line x1="450" y1="126" x2="490" y2="126" class="kdbar"/>
    <text x="528" y="152" class="ksm">دايود</text></g>
  <path d="M360 250 L360 290 L330 305" class="kw kc"/><line x1="330" y1="280" x2="330" y2="360" class="kbase"/>
  <path d="M330 335 L360 350 L360 420" class="kw ke"/><polygon points="352,340 364,352 348,352" class="karrow"/>
  <circle cx="345" cy="320" r="62" class="ktr"/>
  <text x="478" y="318" class="ksm">ترانزستور</text><text x="478" y="346" class="ksm2" text-anchor="middle">TIP120</text>
  <line x1="360" y1="420" x2="360" y2="440" class="kw ke"/><line x1="330" y1="440" x2="390" y2="440" class="kgnd"/><line x1="342" y1="452" x2="378" y2="452" class="kgnd"/><text x="360" y="470" class="ksm">GND</text>
  <rect x="20" y="296" width="90" height="48" rx="10" class="kpin"/><text x="65" y="328" class="kpint">~9</text>
  <line x1="110" y1="320" x2="170" y2="320" class="kw kb"/><rect x="170" y="304" width="90" height="32" rx="8" class="kres"/><text x="215" y="296" class="ksm">1kΩ</text>
  <line x1="260" y1="320" x2="330" y2="320" class="kw kb"/>
  <path id="kflow" class="kflow" d="M360 44 L360 88 M360 192 L360 290 L330 305 M330 335 L360 350 L360 440"/>
  <path id="kloop" class="kloop" d="M360 192 L360 210 L470 210 L470 70 L360 70 L360 88"/>
</svg>`;

/* ================== الجسر H ================== */
const H_CODE = `int ena = 5;
int in1 = 6;
int in2 = 7;

void setup() {
  pinMode(ena, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
}

void loop() {
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  analogWrite(ena, 200);
  delay(2000);
  digitalWrite(in1, LOW);
  digitalWrite(in2, HIGH);
  delay(2000);
  analogWrite(ena, 0);
  delay(1000);
}`;
const sw = (id, x, y1) => `<g class="hsw" id="${id}"><circle cx="${x}" cy="${y1}" r="7" class="hdot"/><circle cx="${x}" cy="${y1 + 70}" r="7" class="hdot"/>
  <line x1="${x}" y1="${y1}" x2="${x}" y2="${y1 + 70}" class="hlev" style="transform-origin:${x}px ${y1}px"/></g>`;
const hSVG = () => `<svg viewBox="0 0 600 440" class="hsvg">
  <line x1="120" y1="40" x2="480" y2="40" class="hw" id="hvp"/><text x="300" y="28" class="hlab">+V (البطارية)</text>
  <line x1="120" y1="400" x2="480" y2="400" class="hw" id="hgnd"/><text x="300" y="430" class="hlab">GND</text>
  <line x1="120" y1="40" x2="120" y2="90" class="hw" id="hl1"/><line x1="120" y1="160" x2="120" y2="260" class="hw" id="hl2"/><line x1="120" y1="330" x2="120" y2="400" class="hw" id="hl3"/>
  <line x1="480" y1="40" x2="480" y2="90" class="hw" id="hr1"/><line x1="480" y1="160" x2="480" y2="260" class="hw" id="hr2"/><line x1="480" y1="330" x2="480" y2="400" class="hw" id="hr3"/>
  ${sw('s1', 120, 90)}${sw('s2', 120, 260)}${sw('s3', 480, 90)}${sw('s4', 480, 260)}
  <text x="92" y="130" class="hs">S1</text><text x="92" y="300" class="hs">S2</text><text x="508" y="130" class="hs">S3</text><text x="508" y="300" class="hs">S4</text>
  <line x1="120" y1="210" x2="240" y2="210" class="hw" id="hml"/><line x1="360" y1="210" x2="480" y2="210" class="hw" id="hmr"/>
  <circle cx="300" cy="210" r="60" class="hmot"/><text x="300" y="226" class="hM">M</text>
  <text x="150" y="196" class="hs2">OUT1</text><text x="450" y="196" class="hs2">OUT2</text>
  <path id="hpath" class="hpath" d=""/>
</svg>`;

/* ================== المحرك الخطوي ================== */
const STEPS = 2048;
const PAIRS = [[0, 1], [1, 2], [2, 3], [3, 0]];                        // الملفات المضاءة في كل مرحلة: IN1+IN2 ، IN2+IN3 …
const stepSVG = () => `<svg viewBox="0 0 400 400" class="stepsvg">
  <circle cx="200" cy="200" r="178" class="stator"/>
  ${[0, 90, 180, 270].map((a, i) => `<g transform="rotate(${a} 200 200)"><rect x="170" y="30" width="60" height="70" rx="10" class="coil" id="coil${i}"/>
    <text x="200" y="74" class="coilt" transform="rotate(${-a} 200 65)">${'ABCD'[i]}</text></g>`).join('')}
  <g id="rotor"><circle cx="200" cy="200" r="70" class="rotorb"/><path d="M200 136 L222 200 L178 200 Z" class="rn"/><path d="M200 264 L222 200 L178 200 Z" class="rs"/>
    <text x="200" y="182" class="rnt">N</text></g>
  <circle cx="200" cy="200" r="10" class="shaft2"/>
</svg>`;
const dialSVG = () => `<svg viewBox="0 0 300 300" class="dialsvg">
  <circle cx="150" cy="150" r="136" class="dface"/>
  ${Array.from({ length: 60 }, (_, i) => { const a = i * 6 * Math.PI / 180, r2 = i % 5 ? 124 : 112;
    return `<line x1="${150 + Math.sin(a) * 132}" y1="${150 - Math.cos(a) * 132}" x2="${150 + Math.sin(a) * r2}" y2="${150 - Math.cos(a) * r2}" class="dtick${i % 5 ? '' : ' b'}"/>`; }).join('')}
  <g id="dhand"><rect x="146" y="30" width="8" height="126" rx="4" class="dhand"/></g><circle cx="150" cy="150" r="10" class="dhub"/></svg>`;
const STEP_CODE = `#include <Stepper.h>

Stepper motor(2048, 8, 10, 9, 11);

void setup() {
  motor.setSpeed(10);
}

void loop() {
  motor.step(512);
  delay(1000);
}`;

/* ================== دوائر البناء ================== */
const res1k = (x, y) => `<rect x="${x}" y="${y - 10}" width="${col(6) - col(3) - 20}" height="20" rx="9" fill="#d9b382"/>
  ${[12, 22, 32].map((dx, i) => `<rect x="${x + dx}" y="${y - 10}" width="5" height="20" fill="${['#7b4a26', '#1b1b1b', '#d62828'][i]}"/>`).join('')}`;
B2.dcfan = { flow: 8, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'الترانزستور TIP120', b: 'الوجه المكتوب نحوك، والأرجل من اليسار: القاعدة B ثم المجمّع C ثم الباعث E.' },
  { h: 'مقاومة 1 كيلو أوم إلى القاعدة', b: 'تحمي المنفذ: تسمح بتيار صغير فقط يكفي لفتح الترانزستور.' },
  { h: 'المنفذ ~9 إلى المقاومة', b: 'إشارة الأردوينو تصل إلى القاعدة عبر المقاومة. نستخدم منفذ PWM لنتحكم في السرعة.' },
  { h: 'المحرك', b: 'طرف إلى الخط الموجب، والطرف الآخر إلى المجمّع C. الترانزستور يفتح طريق المحرك إلى الأرض أو يغلقه.' },
  { h: 'الدايود بالعكس فوق المحرك', b: 'الشريط الفضي (الكاثود) نحو الموجب. يمتص الجهد المرتد حين يتوقف المحرك.' },
  { h: 'الباعث E إلى GND · والطاقة', b: 'الباعث إلى الخط السالب، ثم 5V وGND من الأردوينو إلى الخطين.' },
  { h: 'شغّل المروحة!', b: 'analogWrite(9, 200): المروحة تدور، والأردوينو لم يحمل تيار المحرك بنفسه.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 dcw">
  ${base({ 5: '~9' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2"><rect x="${col(6) - 22}" y="150" width="${col(8) - col(6) + 44}" height="18" rx="4" fill="#b8bec9"/><circle cx="${col(7)}" cy="159" r="6" fill="#8a909c"/>
    <rect x="${col(6) - 22}" y="168" width="${col(8) - col(6) + 44}" height="62" rx="6" fill="#23262e"/><text x="${col(7)}" y="204" class="lbl" style="font-size:13px;fill:#cfd3dc">TIP120</text>
    ${[6, 7, 8].map((c, i) => `<line x1="${col(c)}" y1="230" x2="${col(c)}" y2="288" stroke="#9aa1b3" stroke-width="5"/><text x="${col(c)}" y="146" class="lbl" style="font-size:15px">${'BCE'[i]}</text>`).join('')}</g>
  <g class="bs" data-s="3"><line x1="${col(3)}" y1="312" x2="${col(3)}" y2="264" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(3)}" y1="264" x2="${col(6)}" y2="264" stroke="#9aa1b3" stroke-width="5"/>${res1k(col(3) + 10, 264)}<text x="${col(4) + 10}" y="248" class="lbl" style="font-size:14px">1kΩ</text></g>
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 110, 420 120, 420 250 C 420 350, ${col(3) - 20} 336, ${col(3)} 336`, 4, '#2e9e6b')}
  <g class="bs" data-s="5"><g transform="translate(${col(11)} 96)"><circle r="58" fill="#c9ccd3" stroke="#6b7180" stroke-width="4"/>
      <g class="dcspin">${[0, 120, 240].map(a => `<path d="M0 0 C -14 -28, -8 -52, 8 -54 C 18 -38, 12 -14, 0 0 Z" transform="rotate(${a})" fill="#2b6fc0"/>`).join('')}</g><circle r="9" fill="#1b2340"/></g>
    <path d="M${col(11) - 30} 146 C ${col(11) - 30} 190, ${col(10)} 200, ${col(10)} 240" fill="none" stroke="#d62828" stroke-width="5"/>
    <path d="M${col(11) + 30} 146 C ${col(11) + 30} 190, ${col(12)} 200, ${col(12)} 240" fill="none" stroke="#1b2340" stroke-width="5"/></g>
  ${wire(`M${col(10)} 312 L${col(10)} 404`, 5, '#e74c3c')}
  ${wire(`M${col(12)} 336 C ${col(12)} 380, ${col(7)} 380, ${col(7)} 336`, 5, '#8e44ad')}
  <g class="bs" data-s="6"><line x1="${col(10)}" y1="288" x2="${col(12)}" y2="288" stroke="#9aa1b3" stroke-width="5"/>
    <rect x="${col(10) + 10}" y="279" width="${col(12) - col(10) - 20}" height="18" rx="6" fill="#1c1f27"/><rect x="${col(10) + 10}" y="279" width="7" height="18" fill="#dfe3ea"/>
    <text x="${col(11)}" y="272" class="lbl" style="font-size:13px">1N4007</text></g>
  ${wire(`M${col(8)} 312 L${col(8)} 456`, 7, '#1b2340')}
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 7, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 7, '#1b2340')}
</svg>` };

const ULX = 520, ULY = 222;                                           // لوحة ULN2003 فوق لوح التوصيل
B2.stepwire = { flow: 5, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'لوحة الدرايفر ULN2003 والمحرك', b: 'قابس المحرك الأبيض بخمسة أسلاك يدخل في اللوحة باتجاه واحد فقط.' },
  { h: 'IN1 إلى IN4 ← المنافذ 8 و9 و10 و11', b: 'أربعة أسلاك بالترتيب. في الكود نكتبها 8، 10، 9، 11 وسنعرف السبب.' },
  { h: 'الطاقة: + إلى 5V · − إلى GND', b: 'محرك 28BYJ-48 واحد يعمل من 5V الأردوينو. لأكثر من محرك: مصدر خارجي وGND مشترك.' },
  { h: 'شغّل!', b: 'الليدات الأربعة على اللوحة تضيء بالتتابع، والمحور يدور ببطء ودقة.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 stw">
  ${base({ 2: '8', 3: '9', 4: '10', 5: '11' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2">
    <g transform="translate(730 96)"><circle r="62" fill="#c9ccd3" stroke="#6b7180" stroke-width="4"/><circle cx="0" cy="-26" r="12" fill="#f4d35e" stroke="#8a6d1f" stroke-width="3"/>
      <g class="stspin" style="transform-origin:0px -26px"><rect x="-3" y="-60" width="6" height="34" rx="3" fill="#8a6d1f"/></g>
      <text y="36" class="lbl" style="font-size:13px">28BYJ-48</text></g>
    <path d="M700 150 C 700 190, 690 200, 690 ${ULY + 20}" fill="none" stroke="#e67e22" stroke-width="10" stroke-dasharray="2 3"/>
    <rect x="${ULX}" y="${ULY}" width="230" height="170" rx="10" fill="#1f7a4d"/>
    <rect x="${ULX + 70}" y="${ULY + 50}" width="80" height="30" rx="4" fill="#1c1f27"/><text x="${ULX + 110}" y="${ULY + 70}" class="lbl" style="font-size:12px;fill:#cfd3dc">ULN2003</text>
    <rect x="${ULX + 140}" y="${ULY + 10}" width="70" height="26" rx="4" fill="#f4f1ea"/>
    ${[0, 1, 2, 3].map(i => `<circle cx="${ULX + 80 + i * 26}" cy="${ULY + 118}" r="9" class="stled l${i}"/><text x="${ULX + 80 + i * 26}" y="${ULY + 146}" class="lbl" style="font-size:11px;fill:#e8f6f7">${'ABCD'[i]}</text>`).join('')}
    ${[0, 1, 2, 3].map(i => `<rect x="${ULX + 8}" y="${ULY + 40 + i * 22}" width="12" height="12" fill="#0b0d12"/><text x="${ULX + 26}" y="${ULY + 51 + i * 22}" class="lbl" style="font-size:11px;fill:#e8f6f7;text-anchor:start">IN${i + 1}</text>`).join('')}
    <rect x="${ULX + 60}" y="${ULY + 152}" width="12" height="12" fill="#0b0d12"/><rect x="${ULX + 90}" y="${ULY + 152}" width="12" height="12" fill="#0b0d12"/>
    <text x="${ULX + 66}" y="${ULY + 148}" class="lbl" style="font-size:13px;fill:#ffd2cc">+</text><text x="${ULX + 96}" y="${ULY + 148}" class="lbl" style="font-size:13px;fill:#cfe0ff">−</text></g>
  ${[0, 1, 2, 3].map(i => wire(`M${pinX(2 + i)} 150 C ${pinX(2 + i)} ${96 - i * 14}, ${ULX - 40 - i * 10} ${120 + i * 6}, ${ULX - 40 - i * 10} ${ULY + 46 + i * 22} L${ULX + 14} ${ULY + 46 + i * 22}`, 3, ['#e74c3c', '#e0b400', '#2e9e6b', '#2b6fc0'][i])).join('')}
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, ${ULX + 66} 500, ${ULX + 66} ${ULY + 158}`, 4, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 490, ${ULX + 96} 490, ${ULX + 96} ${ULY + 158}`, 4, '#1b2340')}
</svg>` };

/* ================== مشروع الدرايفر: مقبض للسرعة وزر للاتجاه ================== */
const DRV_CODE = `int ena = 5;
int in1 = 6;
int in2 = 7;
int knob = A0;
int btn = 2;
bool forward = true;

void setup() {
  pinMode(ena, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  pinMode(btn, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(btn) == LOW) {
    forward = !forward;
    delay(300);
  }
  digitalWrite(in1, forward);
  digitalWrite(in2, !forward);
  analogWrite(ena, map(analogRead(knob), 0, 1023, 0, 255));
}`;
const LX = 660, LY = 222;                                              // لوحة L298N فوق يمين لوح التوصيل
const potAt = c => `<rect x="${col(c) - 18}" y="252" width="${col(c + 2) - col(c) + 36}" height="46" rx="10" fill="#2b5fa8"/>
    <circle cx="${col(c + 1)}" cy="248" r="28" fill="#e8e3d6" stroke="#1b2340" stroke-width="4"/>
    <g class="potspin" style="transform-origin:${col(c + 1)}px 248px"><rect x="${col(c + 1) - 5}" y="224" width="10" height="24" rx="5" fill="#1b2340"/></g>
    ${[0, 1, 2].map(i => `<line x1="${col(c + i)}" y1="298" x2="${col(c + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/>`).join('')}
    <text x="${col(c + 1)}" y="206" class="lbl" style="font-size:15px">السرعة</text>`;
B2.l298 = { flow: 9, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'لوحة الدرايفر L298N', b: 'أطرافها ثلاث مجموعات: المحرك (OUT1 وOUT2)، والطاقة (12V وGND وـ5V)، والتحكم (ENA وIN1 وIN2).' },
  { h: 'المحرك إلى OUT1 وOUT2', b: 'سلكا المحرك في المشبك الأزرق. لا يهم الترتيب: لو دار بالعكس بدّلهما أو بدّل المنطق في الكود.' },
  { h: 'البطارية إلى 12V وGND', b: 'بطارية من ٧ إلى ١٢ فولت تغذي المحرك وحدها، فلا يحمل الأردوينو تيار المحرك.' },
  { h: 'أرضي مشترك!', b: 'سلك من GND الدرايفر إلى GND الأردوينو. بدونه لا يفهم الدرايفر إشارات الأردوينو. ثم 5V وGND الأردوينو إلى خطَّي اللوح.' },
  { h: 'ENA ← 5 · IN1 ← 6 · IN2 ← 7', b: 'انزع الغطاء البلاستيكي عن ENA أولًا، وإلا تبقى السرعة قصوى دائمًا.' },
  { h: 'المقاومة المتغيرة ← A0', b: 'مقبض السرعة: طرفاه إلى 5V وGND، والوسط إلى A0.' },
  { h: 'زر الاتجاه ← المنفذ 2', b: 'رجل إلى المنفذ 2، والأخرى إلى GND. سنستخدم INPUT_PULLUP فلا نحتاج مقاومة.' },
  { h: 'أدِر المقبض… واضغط الزر!', b: 'المقبض يغيّر السرعة، والزر يعكس الاتجاه: هذا قلب كل سيارة روبوت.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 drw">
  ${base({ 0: '2', 2: '~5', 3: '~6', 4: '7' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  <g class="bs" data-s="2">
    <rect x="${LX}" y="${LY}" width="190" height="170" rx="10" fill="#c0392b"/>
    <rect x="${LX + 90}" y="${LY + 40}" width="80" height="90" rx="4" fill="#1c1f27"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${LX + 94 + i * 13}" y="${LY + 44}" width="6" height="82" fill="#3a3f4d"/>`).join('')}
    <text x="${LX + 130}" y="${LY + 150}" class="lbl" style="font-size:15px;fill:#fff">L298N</text>
    ${[['OUT1', 40], ['OUT2', 70], ['12V', 130], ['GND', 155], ['5V', 180]].map(([t, dx]) => `<rect x="${LX + dx - 11}" y="${LY - 8}" width="22" height="18" rx="3" fill="#2b6fc0"/><text x="${LX + dx}" y="${LY + 26}" class="lbl" style="font-size:10px;fill:#fff">${t}</text>`).join('')}
    ${['ENA', 'IN1', 'IN2'].map((t, i) => `<rect x="${LX - 6}" y="${LY + 72 + i * 26}" width="12" height="12" fill="#f0cc7a"/><text x="${LX + 12}" y="${LY + 83 + i * 26}" class="lbl" style="font-size:12px;fill:#fff;text-anchor:start">${t}</text>`).join('')}</g>
  <g class="bs" data-s="3"><g transform="translate(${LX + 55} 112)"><circle r="46" fill="#c9ccd3" stroke="#6b7180" stroke-width="4"/>
      <g class="drspin">${[0, 120, 240].map(a => `<path d="M0 0 C -12 -24, -7 -44, 7 -46 C 16 -32, 10 -12, 0 0 Z" transform="rotate(${a})" fill="#2b6fc0"/>`).join('')}</g><circle r="8" fill="#1b2340"/></g>
    <path d="M${LX + 34} 150 C ${LX + 34} 180, ${LX + 40} 190, ${LX + 40} ${LY - 6}" fill="none" stroke="#d62828" stroke-width="5"/>
    <path d="M${LX + 76} 150 C ${LX + 76} 180, ${LX + 70} 190, ${LX + 70} ${LY - 6}" fill="none" stroke="#1b2340" stroke-width="5"/></g>
  <g class="bs" data-s="4"><rect x="${LX + 120}" y="30" width="70" height="118" rx="10" fill="#1c1f27"/><rect x="${LX + 138}" y="22" width="34" height="10" rx="3" fill="#8a909c"/>
    <text x="${LX + 155}" y="80" class="lbl" style="font-size:14px;fill:#f0cc7a">9–12V</text><text x="${LX + 155}" y="104" class="lbl" style="font-size:12px;fill:#fff">بطارية</text>
    <path d="M${LX + 138} 148 C ${LX + 138} 180, ${LX + 130} 190, ${LX + 130} ${LY - 6}" fill="none" stroke="#e74c3c" stroke-width="5"/>
    <path d="M${LX + 172} 148 C ${LX + 172} 180, ${LX + 155} 190, ${LX + 155} ${LY - 6}" fill="none" stroke="#1b2340" stroke-width="5"/></g>
  ${wire(`M845 456 C 888 440, 888 196, ${LX + 162} 196 L${LX + 155} ${LY - 6}`, 5, '#1b2340')}
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 5, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 5, '#1b2340')}
  ${[2, 3, 4].map((p, i) => wire(`M${pinX(p)} 150 C ${pinX(p)} ${100 - i * 10}, ${645 - i * 8} ${100 - i * 10}, ${645 - i * 8} 200 L${645 - i * 8} ${LY + 78 + i * 26} L${LX} ${LY + 78 + i * 26}`, 6, ['#8e44ad', '#2e9e6b', '#e0b400'][i])).join('')}
  <g class="bs" data-s="7">${potAt(0)}</g>
  ${wire(`M${col(2)} 312 L${col(2)} 404`, 7, '#e74c3c')}${wire(`M${col(0)} 336 L${col(0)} 456`, 7, '#1b2340')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 485, ${col(1)} 485, ${col(1)} 336`, 7, '#f08a24')}
  <g class="bs" data-s="8"><rect x="${col(4) - 12}" y="256" width="${col(5) - col(4) + 24}" height="40" rx="6" fill="#1b2340"/><circle cx="${(col(4) + col(5)) / 2}" cy="276" r="13" fill="#d62828"/>
    ${[4, 5].map(c => `<line x1="${col(c)}" y1="296" x2="${col(c)}" y2="312" stroke="#9aa1b3" stroke-width="5"/>`).join('')}
    <text x="${(col(4) + col(5)) / 2}" y="240" class="lbl" style="font-size:15px">الاتجاه</text></g>
  ${wire(`M${pinX(0)} 150 C ${pinX(0)} 60, 420 60, 420 250 C 420 360, ${col(4) - 20} 336, ${col(4)} 336`, 8, '#2b6fc0')}
  ${wire(`M${col(5)} 336 L${col(5)} 456`, 8, '#1b2340')}
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  kicklab: s => `<div class="slide light">
      <div class="kicker">⚡ مختبر</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="kgrid">
        <div class="kcirc">${kickSVG()}</div>
        <div class="kmid ix">
          <div class="tonecode" dir="ltr" id="kcode">${highlight('analogWrite(9, 0);')}</div>
          <div class="kbtns"><button class="clap" id="kon">▶ شغّل</button><button class="sndbtn" id="kdio">✅ الدايود موصول</button></div>
          <label class="lsl"><span>🎚️ السرعة analogWrite: <b id="kpv">200</b></span><input type="range" id="kp" min="0" max="255" value="200"></label>
          <div class="kwarn" id="kwarn"></div>
        </div>
        <div class="kright">
          <div class="kfan">${fanSVG('kfan')}<div class="ac"><span>المحرك</span><b id="kst" class="fanst">متوقف</b></div></div>
          ${plotter('kplot', 'جهد المجمّع (فولت)', 60)}
        </div>
      </div></div>`,

  hlab: s => `<div class="slide light">
      <div class="kicker">🔀 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hgrid">
        <div class="hcirc">${hSVG()}</div>
        <div class="hmid ix">
          <div class="hins"><button class="hin" id="h1" data-v="1">IN1<b>HIGH</b></button><button class="hin" id="h2" data-v="0">IN2<b>LOW</b></button></div>
          <label class="lsl"><span>🎚️ ENA (السرعة): <b id="hev">200</b></span><input type="range" id="he" min="0" max="255" value="200"></label>
          <div class="hcode" dir="ltr" id="hcode"></div>
          <div class="irdec" id="hdec"></div>
        </div>
        <div class="hright">${fanSVG('hwheel')}<div class="htab"><table><tr><th>IN1</th><th>IN2</th><th>المحرك</th></tr>
          <tr data-k="10"><td>HIGH</td><td>LOW</td><td>للأمام ⟳</td></tr><tr data-k="01"><td>LOW</td><td>HIGH</td><td>للخلف ⟲</td></tr>
          <tr data-k="11"><td>HIGH</td><td>HIGH</td><td>فرملة</td></tr><tr data-k="00"><td>LOW</td><td>LOW</td><td>فرملة</td></tr></table></div></div>
      </div></div>`,

  drvlab: s => `<div class="slide light">
      <div class="kicker">🚗 محاكي المشروع</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="dvgrid">
        <div class="dvcode">${codeBlock(DRV_CODE, 'micro')}</div>
        <div class="dvmid ix">
          <label class="lsl"><span>🎛️ المقبض analogRead: <b id="dva">800</b></span><input type="range" id="dvk" min="0" max="1023" value="800"></label>
          <button class="clap" id="dvb">🔘 زر الاتجاه</button>
          <div class="dvfacts"><div class="ac"><span>forward</span><b id="dvf">true</b></div><div class="ac gold"><span>ENA</span><b id="dve">199</b></div>
            <div class="ac"><span>IN1</span><b id="dv1">1</b></div><div class="ac"><span>IN2</span><b id="dv2">0</b></div></div>
        </div>
        <div class="dvright">${fanSVG('dvfan')}<div class="irdec" id="dvdec">للأمام ⟳</div></div>
      </div></div>`,

  steplab: s => `<div class="slide light">
      <div class="kicker">⚙️ مختبر المحرك الخطوي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="stgrid">
        <div class="stcol"><div class="stcap">داخل المحرك (مبسّط)</div>${stepSVG()}
          <div class="stleds">${[0, 1, 2, 3].map(i => `<div><i id="led${i}"></i><span>IN${i + 1}</span></div>`).join('')}</div></div>
        <div class="stcol"><div class="stcap">المحور الخارجي بعد التروس</div>${dialSVG()}
          <div class="stfacts"><div class="ac"><span>الخطوات</span><b id="stn">0</b></div><div class="ac gold"><span>الزاوية</span><b id="sta">0°</b></div></div></div>
        <div class="stctl ix">
          <div class="tonecode" dir="ltr" id="stcode">${highlight('motor.step(0);')}</div>
          <div class="stbtns">${[[1, 'خطوة واحدة'], [-1, 'خطوة للخلف'], [512, 'ربع دورة'], [-512, 'ربع للخلف'], [1024, 'نصف دورة'], [2048, 'دورة كاملة']].map(([n, t]) =>
            `<button class="sndbtn" data-n="${n}"><b dir="ltr">step(${n})</b><small>${t}</small></button>`).join('')}</div>
          <label class="lsl"><span>🎚️ setSpeed: <b id="stv">10</b> دورة/دقيقة</span><input type="range" id="sts" min="1" max="15" value="10"></label>
          <div class="stbusy" id="stbusy">جاهز</div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  kicklab(sl) {
    const plot = sl.querySelector('#kplot'), buf = [], fan = sl.querySelector('#kfan .fblades'), rng = sl.querySelector('#kp');
    let on = false, diode = true, ang = 0, last = 0, raf = 0, spike = [];
    const pwm = () => on ? +rng.value : 0;
    const upd = () => {
      const p = pwm(), runs = p >= START_PWM;
      sl.querySelector('#kcode').innerHTML = highlight(`analogWrite(9, ${p});`);
      sl.querySelector('#kpv').textContent = rng.value;
      sl.querySelector('#kon').textContent = on ? '⏹ أطفئ' : '▶ شغّل';
      const st = sl.querySelector('#kst'); st.textContent = !on || p === 0 ? 'متوقف' : runs ? 'يدور' : 'يطنّ ولا يدور'; st.classList.toggle('on', on && runs);
      sl.querySelector('.kicksvg').classList.toggle('on', on && p > 0);
      sl.querySelector('#kdiode').classList.toggle('off', !diode);
      sl.querySelector('#kdio').textContent = diode ? '✅ الدايود موصول' : '❌ بلا دايود';
    };
    sl.querySelector('#kon').onclick = () => {
      if (on) {                                                         // لحظة الإطفاء: الملف يرفض توقف التيار فجأة
        spike = diode ? [5.7, 5.4, 5.1] : [56, 38, 20, 9, 6];
        const w = sl.querySelector('#kwarn');
        w.className = 'kwarn ' + (diode ? 'ok' : 'bad');
        w.textContent = diode ? '🛡️ الدايود امتص الجهد المرتد: أقصى جهد نحو 5.7 فولت فقط' : '⚡ قفزة جهد بعشرات الفولتات! هذا ما يُتلف الترانزستور والأردوينو مع الوقت';
        sl.querySelector('.kicksvg').classList.toggle('loop', diode);
        setTimeout(() => sl.querySelector('.kicksvg').classList.remove('loop'), 700);
      }
      on = !on; upd();
    };
    sl.querySelector('#kdio').onclick = () => { diode = !diode; upd(); };
    rng.oninput = upd;
    const t = setInterval(() => {
      const p = pwm(), v = spike.length ? spike.shift() : p > 0 ? 5 - 4 * p / 255 : 5;   // المجمّع: 5V متوقف، ويقترب من 1V تشغيلًا كاملًا
      plotFeed(plot, buf, v + (Math.random() - .5) * .3, 60);
    }, 80);
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      const p = pwm(); if (p >= START_PWM) ang += dt * p / 255 * 1.4;
      fan.setAttribute('transform', `rotate(${ang} 100 100)`);
      raf = requestAnimationFrame(loop);
    };
    upd(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => { clearInterval(t); cancelAnimationFrame(raf); });
  },

  hlab(sl) {
    const b1 = sl.querySelector('#h1'), b2 = sl.querySelector('#h2'), en = sl.querySelector('#he'), path = sl.querySelector('#hpath');
    const wheel = sl.querySelector('#hwheel .fblades');
    let ang = 0, last = 0, raf = 0;
    const lev = (id, closed) => { const g = sl.querySelector('#' + id); g.classList.toggle('closed', closed); g.querySelector('.hlev').style.transform = closed ? '' : 'rotate(-32deg)'; };
    const state = () => ({ i1: +b1.dataset.v, i2: +b2.dataset.v, e: +en.value });
    const upd = () => {
      const { i1, i2, e } = state(), act = e > 0;
      [[b1, i1], [b2, i2]].forEach(([b, v]) => { b.querySelector('b').textContent = v ? 'HIGH' : 'LOW'; b.classList.toggle('hi', !!v); });
      sl.querySelector('#hev').textContent = e;
      lev('s1', act && i1 === 1); lev('s2', act && i1 === 0); lev('s3', act && i2 === 1); lev('s4', act && i2 === 0);
      const fwd = act && i1 && !i2, rev = act && !i1 && i2;
      path.setAttribute('d', fwd ? 'M120 40 L120 210 L480 210 L480 400' : rev ? 'M480 40 L480 210 L120 210 L120 400' : '');
      const moving = (fwd || rev) && e >= START_PWM;
      sl.querySelector('#hdec').textContent = !act ? 'ENA = 0: المحرك حرّ متوقف' : fwd ? (moving ? 'للأمام ⟳' : 'يطنّ… السرعة قليلة') : rev ? (moving ? 'للخلف ⟲' : 'يطنّ… السرعة قليلة') : 'فرملة: طرفا المحرك متساويان';
      sl.querySelector('#hcode').innerHTML = [`digitalWrite(in1, ${i1 ? 'HIGH' : 'LOW'});`, `digitalWrite(in2, ${i2 ? 'HIGH' : 'LOW'});`, `analogWrite(ena, ${e});`].map(highlight).join('<br>');
      sl.querySelectorAll('.htab tr[data-k]').forEach(r => r.classList.toggle('on', r.dataset.k === `${i1}${i2}`));
      sl.querySelector('.hsvg').classList.toggle('fwd', !!fwd); sl.querySelector('.hsvg').classList.toggle('rev', !!rev);
    };
    [b1, b2].forEach(b => b.onclick = () => { b.dataset.v = 1 - b.dataset.v; upd(); });
    en.oninput = upd;
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      const { i1, i2, e } = state(), dir = e >= START_PWM ? i1 - i2 : 0;
      ang += dir * dt * e / 255 * 0.8; wheel.setAttribute('transform', `rotate(${ang} 100 100)`);
      raf = requestAnimationFrame(loop);
    };
    upd(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  drvlab(sl) {
    const k = sl.querySelector('#dvk'), btn = sl.querySelector('#dvb'), fan = sl.querySelector('#dvfan .fblades'), lines = sl.querySelectorAll('.dvcode .ln');
    let fwd = true, press = 0, ang = 0, last = 0, raf = 0;
    const ena = () => Math.round(+k.value * 255 / 1023);                // map(analogRead, 0, 1023, 0, 255)
    const upd = () => {
      const e = ena();
      sl.querySelector('#dva').textContent = k.value; sl.querySelector('#dve').textContent = e;
      sl.querySelector('#dvf').textContent = fwd; sl.querySelector('#dv1').textContent = fwd ? 1 : 0; sl.querySelector('#dv2').textContent = fwd ? 0 : 1;
      sl.querySelector('#dvdec').textContent = e < START_PWM ? (e === 0 ? 'متوقف' : 'يطنّ… أدِر المقبض أكثر') : fwd ? 'للأمام ⟳' : 'للخلف ⟲';
    };
    btn.addEventListener('pointerdown', () => { fwd = !fwd; press = performance.now() + 300; upd(); });
    k.oninput = upd;
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      const e = ena(); if (e >= START_PWM) ang += (fwd ? 1 : -1) * dt * e / 255 * 0.9;
      fan.setAttribute('transform', `rotate(${ang} 100 100)`);
      const hit = ts < press;
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', hit ? n >= 16 && n <= 18 : n >= 20 && n <= 22); });
      raf = requestAnimationFrame(loop);
    };
    upd(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  steplab(sl) {
    const rotor = sl.querySelector('#rotor'), hand = sl.querySelector('#dhand'), spd = sl.querySelector('#sts'), busy = sl.querySelector('#stbusy');
    const btns = [...sl.querySelectorAll('[data-n]')];
    let pos = 0, left = 0, dir = 1, acc = 0, last = 0, raf = 0;
    const draw = () => {
      const ph = ((pos % 4) + 4) % 4, [a, b] = PAIRS[ph];
      [0, 1, 2, 3].forEach(i => { const onC = i === a || i === b; sl.querySelector('#coil' + i).classList.toggle('on', onC); sl.querySelector('#led' + i).classList.toggle('on', onC); });
      rotor.setAttribute('transform', `rotate(${45 + ph * 90} 200 200)`);
      hand.setAttribute('transform', `rotate(${pos * 360 / STEPS} 150 150)`);
      sl.querySelector('#stn').textContent = pos;
      sl.querySelector('#sta').textContent = (Math.round(pos * 360 / STEPS * 100) / 100) + '°';
    };
    btns.forEach(b => b.onclick = () => {
      if (left) return;
      const n = +b.dataset.n; left = Math.abs(n); dir = Math.sign(n); acc = 0;
      sl.querySelector('#stcode').innerHTML = highlight(`motor.step(${n});`);
      btns.forEach(x => x.disabled = true);
      busy.className = 'stbusy on'; busy.textContent = '⏳ الأردوينو مشغول حتى تنتهي step…';
    });
    spd.oninput = () => sl.querySelector('#stv').textContent = spd.value;
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      if (left) {
        acc += dt; const per = 60000 / (STEPS * spd.value);               // زمن الخطوة الواحدة بالمللي ثانية
        while (left && acc >= per) { acc -= per; pos += dir; left--; }
        if (!left) { btns.forEach(x => x.disabled = false); busy.className = 'stbusy'; busy.textContent = '✅ انتهت، والأردوينو ينتقل للسطر التالي'; }
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    draw(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
