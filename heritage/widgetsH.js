/* =====================================================================
   «صانع الذكريات التراثية» — الدورة السادسة · أدوات تفاعلية
   مبنية على ملف فريق Al arqam inventors (WRO 2026 · Future Innovators · Elementary)
   الأطراف الحقيقية: ULN2003 IN1–IN4 ← 13/14/26/27 · Servo العملة ← 23 · LCD I2C ← 21/22 · DFPlayer RX/TX ← 16/17
                    HC-SR04 Trig/Echo ← 18/34 · LED أخضر/أحمر ← 4/5 · أزرار المحطات ← 32/33/25/35 · زرا الإجابة ← 36/39
   الطاقة: 6V للمنصة · 4.5V للسيرفو · أرضي مشترك
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, wire } = window.ARD2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
let AC = null;
const beep = (f = 900, ms = 120, v = .04, type = 'sine') => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0008, AC.currentTime + ms / 1000); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + ms / 1000); } catch (e) { } };
const fmt = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

/* ================== المحطات الأربع ================== */
// ترتيب الأزرار كما في لوحة الفريق: أحمر الخيمة · أصفر الفخار · أزرق الملابس · أخضر السيف
const ST = [
  { k: 'tent', n: 'الخيمة', en: 'TENT', c: '#d64545', pin: 32, learn: 'الضيافة والترحال، ومكان اجتماع الأسرة والضيف',
    q: ['ما الذي كانت تُستخدم له الخيمة؟', 'للضيافة واجتماع الأسرة والترحال', 'لتخزين الحديد فقط'], h: ['تذكّر: كان الضيف يُستقبل فيها… الخيمة مكان:', 'يجتمع فيه الأهل والضيوف', 'للزينة فقط'] },
  { k: 'jar', n: 'الفخار', en: 'POTTERY', c: '#e0b400', pin: 33, learn: 'حرفة يدوية ترتبط بمهارة الصانع والمواد المحلية',
    q: ['الفخار حرفة يدوية تُصنع من:', 'الطين', 'الحديد'], h: ['يشكّل الصانع الطين ثم:', 'يحرقه في الفرن ليصبح صلبًا', 'يذيبه في الماء'] },
  { k: 'cloth', n: 'الملابس', en: 'CLOTHES', c: '#2b6fc0', pin: 25, learn: 'تنوع الأزياء التقليدية ودلالاتها عبر مناطق المملكة',
    q: ['الملابس التقليدية في المملكة:', 'تتنوع بين المناطق', 'واحدة في كل المناطق'], h: ['مثال على لباس تقليدي للرجل:', 'البشت', 'البدلة الرياضية'] },
  { k: 'sword', n: 'السيف', en: 'SWORD', c: '#2e9e6b', pin: 35, learn: 'رمز للفخر والشجاعة، وحاضر في العرضة',
    q: ['في أي فن شعبي يحضر السيف؟', 'العرضة', 'صيد السمك'], h: ['العرضة رقصة شعبية تُؤدّى:', 'بالسيوف والطبول والشعر', 'بالكرة'] },
];
window.HM = { ST };
const VOICES = [
  { f: '0001', n: 'الترحيب', e: '👋', c: '#7a5230', t: 'مرحبًا بك في صانع الذكريات التراثية! اختر عنصرًا تراثيًا، واستمع إلى قصته، ثم أجب…' },
  { f: '0002', k: 'tent', n: 'الخيمة', c: '#d64545', t: 'أنا الخيمة! بيت أهل البادية… في ظلّي تجتمع الأسرة ويُكرَم الضيف. أنا رمز الضيافة والكرم.' },
  { f: '0003', k: 'jar', n: 'الفخار', c: '#e0b400', t: 'أنا الفخّار! صنعني الحِرَفيّ من الطين وأدخلني الفرن… حفظتُ الماء باردًا والطعام سليمًا.' },
  { f: '0004', k: 'cloth', n: 'الملابس', c: '#2b6fc0', t: 'أنا الملابس التقليدية! تتنوّع ألواني من منطقة إلى منطقة… وفي تنوّعي جمال المملكة كلّها.' },
  { f: '0005', k: 'sword', n: 'السيف', c: '#2e9e6b', t: 'أنا السيف! رمز الفخر والشجاعة… أحضر في العرضة، وأزيّن مع النخلة شعار وطني.' },
  { f: '0006', n: 'أحسنت', e: '🟢', c: '#2e9e6b', t: 'أحسنت! إجابة صحيحة… خُذ ذكراك!' },
  { f: '0007', n: 'حاول مرة أخرى', e: '🔴', c: '#d64545', t: 'لا بأس، حاول مرة أخرى… استمع جيدًا.' },
];
let PLAYER = null;
const playAudio = (src, onEnd) => { try { if (PLAYER) { PLAYER.pause(); PLAYER.onended && PLAYER.onended(); } PLAYER = new Audio(src); PLAYER.onended = onEnd; PLAYER.play().catch(() => onEnd && onEnd()); } catch (e) { onEnd && onEnd(); } };
const stopAudio = () => { if (PLAYER) { PLAYER.pause(); PLAYER = null; } };

/* ================== رسومات العناصر التراثية (من الأمام) ================== */
const ITEM = {
  tent: `<g><path d="M-62 20 L-50 -26 Q 0 -44 50 -26 L 62 20 Z" fill="#1d1a17"/><path d="M-50 -26 Q 0 -44 50 -26 L 46 -14 Q 0 -30 -46 -14 Z" fill="#8a2c22"/>
    <path d="M-56 0 L 56 0" stroke="#c9a06d" stroke-width="3"/><path d="M-59 10 L 59 10" stroke="#8a2c22" stroke-width="4"/><rect x="-14" y="-6" width="28" height="26" fill="#4a3424"/><path d="M-14 -6 L 0 6 L 14 -6" fill="#6d4521"/>
    <line x1="-50" y1="-26" x2="-66" y2="-40" stroke="#6d4521" stroke-width="3"/><line x1="50" y1="-26" x2="66" y2="-40" stroke="#6d4521" stroke-width="3"/></g>`,
  jar: `<g><ellipse cx="0" cy="20" rx="26" ry="6" fill="rgba(0,0,0,.25)"/><path d="M-12 -46 L 12 -46 L 10 -34 Q 34 -24 30 0 Q 26 20 0 22 Q -26 20 -30 0 Q -34 -24 -10 -34 Z" fill="#b5652e"/>
    <path d="M-28 -6 Q 0 2 28 -6" stroke="#7a3d16" stroke-width="3" fill="none"/><path d="M-26 4 Q 0 12 26 4" stroke="#f0cc7a" stroke-width="2" fill="none"/><path d="M-16 -18 l6 -6 l6 6 l6 -6 l6 6 l6 -6" stroke="#7a3d16" stroke-width="2" fill="none"/>
    <path d="M-30 -18 Q -42 -14 -30 -2" stroke="#9c5426" stroke-width="5" fill="none"/><ellipse cx="0" cy="-46" rx="13" ry="4" fill="#7a3d16"/></g>`,
  cloth: `<g><rect x="-2" y="-56" width="4" height="78" fill="#6d4521"/><rect x="-18" y="18" width="36" height="5" rx="2" fill="#6d4521"/>
    <path d="M-30 -40 Q 0 -50 30 -40 L 34 14 L -34 14 Z" fill="#14120f"/><path d="M-8 -44 L -4 14 M 8 -44 L 4 14" stroke="#e0b400" stroke-width="4"/><path d="M-12 -46 L 0 -32 L 12 -46" fill="#f4f1ea"/>
    <path d="M-30 -40 L -38 -6 M 30 -40 L 38 -6" stroke="#14120f" stroke-width="9" stroke-linecap="round"/><circle cy="-54" r="6" fill="#f4f1ea"/></g>`,
  sword: `<g><rect x="-26" y="12" width="52" height="8" rx="3" fill="#6d4521"/><rect x="-3" y="-6" width="6" height="20" fill="#6d4521"/>
    <path d="M-44 -2 Q 0 -30 46 -48 Q 8 -20 -40 6 Z" fill="#d6dbe4" stroke="#8f97a8" stroke-width="2"/><path d="M-44 -2 L -58 6" stroke="#e0b400" stroke-width="8" stroke-linecap="round"/>
    <rect x="-48" y="-10" width="6" height="22" rx="2" fill="#e0b400" transform="rotate(-20 -45 1)"/><circle cx="-60" cy="7" r="4" fill="#e0b400"/></g>`,
};
const coinSVG = (k, r = 22) => `<g><circle r="${r}" fill="#b98a55" stroke="#7a5230" stroke-width="${r * .12}"/><circle r="${r * .78}" fill="none" stroke="#e8c48c" stroke-width="1.5" stroke-dasharray="3 3"/>
  <g transform="scale(${r / 110})">${ITEM[k]}</g></g>`;
window.HM.ITEM = ITEM; window.HM.coinSVG = coinSVG;

/* المنصة الدوّارة: أربعة مجسمات حول قرص، والمحطة الأمامية هي المواجهة للطفل
   th = زاوية المنصة؛ المحطة i في الأمام حين th = −i·π/2 */
function platform(th, cx, cy, R, opt = {}) {
  const tilt = .38, out = [];
  out.push(`<ellipse cx="${cx}" cy="${cy + R * .2}" rx="${R * 1.12}" ry="${R * tilt * 1.12}" fill="rgba(0,0,0,.28)"/>
    <path d="M${cx - R} ${cy} L${cx - R} ${cy + R * .16} A ${R} ${R * tilt} 0 0 0 ${cx + R} ${cy + R * .16} L${cx + R} ${cy} Z" fill="#7a5230"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * tilt}" fill="url(#hmwood)" stroke="#e0b400" stroke-width="3"/>`);
  for (let i = 0; i < 4; i++) { const a = th + i * Math.PI / 2 + Math.PI / 4; out.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy + Math.sin(a) * R * tilt).toFixed(1)}" stroke="#7a5230" stroke-width="2" opacity=".6"/>`); }
  const items = ST.map((s, i) => { const a = th + i * Math.PI / 2 + Math.PI / 2; const d = Math.sin(a); return { s, i, x: cx + Math.cos(a) * R * .62, y: cy + d * R * tilt * .62, d, k: .55 + .45 * (d + 1) / 2 }; }).sort((a, b) => a.d - b.d);
  items.forEach(o => { const sc = R / 150 * o.k; const front = o.d > .97;
    out.push(`<g transform="translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) scale(${sc.toFixed(3)})" opacity="${(.55 + .45 * (o.d + 1) / 2).toFixed(2)}">${front && opt.glow ? `<ellipse cy="20" rx="80" ry="22" fill="${o.s.c}" opacity=".35"/>` : ''}${ITEM[o.s.k]}
      <g transform="translate(0 40)"><rect x="-38" y="-12" width="76" height="24" rx="6" fill="#f4e7c8" stroke="#7a5230" stroke-width="2"/><text y="6" class="hmlbl">${o.s.n}</text></g></g>`); });
  out.push(`<path d="M${cx} ${cy + R * tilt + R * .2 + 4} l -12 16 h 24 Z" fill="#e0b400"/>`);
  return out.join('');
}
const facing = th => { const k = Math.round(-th / (Math.PI / 2)); return ((k % 4) + 4) % 4; };
const DEFS = `<defs><radialGradient id="hmwood" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#e8c48c"/><stop offset="1" stop-color="#b98a55"/></radialGradient>
  <pattern id="sadu" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#8a2c22"/><path d="M0 10 L10 0 L20 10 L30 0 L40 10 L30 20 L20 10 L10 20 Z" fill="#1d1a17"/><path d="M5 10 L10 5 L15 10 L10 15 Z M25 10 L30 5 L35 10 L30 15 Z" fill="#f4e7c8"/></pattern></defs>`;

/* صندوق التحكم الأمامي كما في صورة الفريق: حساس، شاشة، سماعة، أربعة أزرار، فتحة العملة */
const panel = (id, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" id="${id}">
  <rect x="-300" y="-70" width="600" height="140" rx="14" fill="#e8c48c" stroke="#7a5230" stroke-width="4"/><rect x="-300" y="-70" width="600" height="14" rx="7" fill="url(#sadu)"/>
  <g transform="translate(-245 -14)"><rect x="-38" y="-18" width="76" height="36" rx="6" fill="#1f5fae"/><circle cx="-18" r="13" fill="#c9ccd3" stroke="#78909c" stroke-width="3"/><circle cx="18" r="13" fill="#c9ccd3" stroke="#78909c" stroke-width="3"/><text y="40" class="hmpl">اقترب لبدء اللعبة</text></g>
  <g transform="translate(-85 -18)"><rect x="-80" y="-24" width="160" height="48" rx="6" fill="#1b2340"/><rect x="-72" y="-17" width="144" height="34" rx="3" class="hmlcdbg" id="${id}lcdbg"/><text y="-2" class="hmlcd" id="${id}l1">Heritage Memory</text><text y="13" class="hmlcd" id="${id}l2">Maker  05:00</text></g>
  <g transform="translate(70 -18)">${Array.from({ length: 16 }, (_, i) => `<circle cx="${(i % 4) * 9 - 13.5}" cy="${Math.floor(i / 4) * 9 - 13.5}" r="2.6" fill="#7a5230"/>`).join('')}<g id="${id}spk" opacity="0">${[16, 26, 36].map(r => `<path d="M${r} -12 q 8 12 0 24" stroke="#1b2340" stroke-width="3" fill="none"/>`).join('')}</g></g>
  ${ST.map((s, i) => `<g transform="translate(${-170 + i * 70} 40)" class="hmbtn" data-b="${i}"><circle r="15" fill="${s.c}" stroke="#3e2a1a" stroke-width="3" id="${id}b${i}"/><text y="28" class="hmpl" style="font-size:12px">${s.n}</text></g>`).join('')}
  <g transform="translate(150 40)"><circle r="7" class="hmled g" id="${id}lg"/><circle cx="20" r="7" class="hmled r" id="${id}lr"/></g>
  <g transform="translate(245 0)"><rect x="-38" y="-46" width="76" height="92" rx="8" fill="#3e2a1a"/><text y="-28" class="hmpl" style="fill:#f0cc7a">خذ ذكراك</text><rect x="-24" y="14" width="48" height="10" rx="3" fill="#0e0b08"/><g id="${id}coin" opacity="0">${coinSVG('tent', 15)}</g></g>
</g>`;
window.HM.panel = panel; window.HM.platform = platform;

/* ================== الأكواد ================== */
const SONAR_CODE = `const int TRIG = 18, ECHO = 34;
int near = 0;

float readCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long t = pulseIn(ECHO, HIGH, 25000);
  return t * 0.0343 / 2;
}

bool visitorHere() {
  float d = readCm();
  near = (d > 2 && d < 60) ? near + 1 : 0;
  return near >= 3;
}`;
const BTN_CODE = `const int STATION[4] = {32, 33, 25, 35};
const int ANS_A = 36, ANS_B = 39;

void setup() {
  pinMode(32, INPUT_PULLUP);
  pinMode(33, INPUT_PULLUP);
  pinMode(25, INPUT_PULLUP);
  pinMode(35, INPUT);      // مقاومة 10k خارجية
  pinMode(36, INPUT);      // مقاومة 10k خارجية
  pinMode(39, INPUT);      // مقاومة 10k خارجية
}

bool pressed(int pin) {
  if (digitalRead(pin) == HIGH) return false;
  delay(20);               // إزالة الارتداد
  return digitalRead(pin) == LOW;
}`;
const PLAT_CODE = `#include <Stepper.h>
Stepper plat(2048, 13, 26, 14, 27);
int stepsQuarter = 510;   // من جدول المعايرة
int here = 0;             // 0 خيمة · 1 فخار · 2 ملابس · 3 سيف

void goStation(int target) {
  int d = (target - here + 4) % 4;
  if (d == 3) d = -1;           // الأقصر: ربع للخلف
  plat.setSpeed(10);
  plat.step(d * stepsQuarter);
  here = target;
}`;
const COIN_CODE = `#include <ESP32Servo.h>
Servo coin;
bool coinGiven = false;

void setup() {
  coin.attach(23);
  coin.write(0);           // وضع الاستعداد
}

void giveCoin() {
  if (coinGiven) return;   // قفل: عملة واحدة للمحطة
  coin.write(120);         // الترس يدفع القضيب
  delay(600);
  coin.write(0);           // يعود للاستعداد
  coinGiven = true;
}`;
const STATE_CODE = `enum State { WAIT, CHOOSE, BUSY, ANS1, ANS2, DONE };
State st = WAIT;

void loop() {
  switch (st) {
    case WAIT:   if (visitorHere()) { welcome(); st = CHOOSE; } break;
    case CHOOSE: { int s = readStation(); if (s >= 0) { start(s); st = BUSY; } } break;
    case BUSY:   if (moveDone() && audioDone()) { askQ1(); st = ANS1; } break;
    case ANS1:   onAnswer1(); break;
    case ANS2:   onAnswer2(); break;
    case DONE:   if (timeUp() || allCoins()) { reset(); st = WAIT; } break;
  }
}`;
const DEC_CODE = `void onAnswer1() {
  int a = readAnswer();       // -1 لا شيء
  if (a < 0) return;
  if (a == correct[here]) {
    green(); play(OK); giveCoin(); st = CHOOSE;
  } else {
    red(); askHelper(); st = ANS2;
  }
}

void onAnswer2() {
  int a = readAnswer();
  if (a < 0) return;
  if (a == helperCorrect[here]) { green(); giveCoin(); }
  else { red(); play(TRY_NEXT); }
  st = CHOOSE;
}`;
const MEDIA_CODE = `#include <DFRobotDFPlayerMini.h>
#include <LiquidCrystal_I2C.h>
HardwareSerial dfSerial(2);
DFRobotDFPlayerMini df;
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  dfSerial.begin(9600, SERIAL_8N1, 16, 17);
  df.begin(dfSerial); df.volume(25);
  lcd.init(); lcd.backlight();
}

void present(int s) {
  lcd.clear(); lcd.print(NAME[s]);
  df.play(s + 2);         // 0002.mp3 ... 0005.mp3
}`;

/* ================== دائرة البناء: المنظومة كاملة ================== */
const M = (x, y, w, h, fill, t, sub = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}"/><text x="${x + w / 2}" y="${y + h / 2 + (sub ? -2 : 6)}" class="lbl" style="font-size:14px;fill:#fff">${t}</text>${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 16}" class="lbl" style="font-size:11px;fill:#e8ecf8">${sub}</text>` : ''}`;
B2.hmwire = { flow: 9, steps: [
  { h: 'لوحة ESP32 في قلب الصندوق', b: 'كل الأجهزة تتصل بها، وكلها تشترك في أرضي واحد.' },
  { h: 'المنصة: ULN2003 ← 13 · 14 · 26 · 27', b: 'محرك 28BYJ-48 يُدار من الدرايفر، وطاقته 6 فولت من مصدر مستقل.' },
  { h: 'عملة الذكرى: سيرفو ← 23', b: 'طاقة السيرفو 4.5 فولت منفصلة، والإشارة فقط من ESP32.' },
  { h: 'الشاشة: SDA ← 21 · SCL ← 22', b: 'سلكان للبيانات عبر I2C.' },
  { h: 'الصوت: DFPlayer ← 16 (RX) · 17 (TX)', b: 'بطاقة ذاكرة فيها ملفات الشرح، وسماعة صغيرة.' },
  { h: 'حساس الاقتراب: Trig ← 18 · Echo ← 34', b: 'Echo على 34 لأنه مدخل فقط، وهو يكفي للقراءة.' },
  { h: 'الأزرار: المحطات 32 · 33 · 25 · 35 · الإجابة 36 · 39', b: '35 و36 و39 بلا مقاومة سحب داخلية: نضيف مقاومة 10k خارجية.' },
  { h: 'الليدان: الأخضر ← 4 · الأحمر ← 5', b: 'مع مقاومة 220 أوم لكل ليد.' },
  { h: 'شغّل الجولة!', b: 'المنصة تدور، والصوت يشرح، والعملة جاهزة.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 hmw">
  <g class="bs" data-s="1"><rect x="370" y="170" width="160" height="200" rx="12" fill="#1f2a44"/><rect x="405" y="190" width="90" height="60" rx="4" fill="#c9ccd3"/><text x="450" y="226" class="lbl" style="font-size:15px">ESP32</text>
    <rect x="370" y="390" width="160" height="10" rx="5" fill="#1b2340"/><text x="450" y="420" class="lbl" style="font-size:12px">GND مشترك</text></g>
  <g class="bs" data-s="2">${M(60, 40, 150, 70, '#1f7a4d', 'ULN2003', 'IN1–IN4')}<g transform="translate(135 175)"><circle r="40" fill="#c9ccd3" stroke="#6b7180" stroke-width="4"/><g class="hmspin"><rect x="-3" y="-34" width="6" height="22" rx="3" fill="#8a6d1f"/></g><text y="60" class="lbl" style="font-size:12px">28BYJ-48</text></g>${M(20, 250, 120, 44, '#c0392b', '6V', 'للمنصة')}</g>
  ${wire('M370 200 C 300 200, 260 75, 210 75', 2, '#e74c3c')}${wire('M370 212 C 296 212, 256 85, 210 85', 2, '#e0b400')}${wire('M370 224 C 292 224, 252 95, 210 95', 2, '#2e9e6b')}${wire('M370 236 C 288 236, 248 105, 210 105', 2, '#2b6fc0')}
  <g class="bs" data-s="3">${M(690, 40, 170, 70, '#8e44ad', 'Servo', 'ترس + قضيب مسنن')}<g transform="translate(775 160)"><circle r="22" fill="#e0b400"/><g class="hmpin">${Array.from({ length: 10 }, (_, i) => `<rect x="-3" y="-28" width="6" height="8" fill="#e0b400" transform="rotate(${i * 36})"/>`).join('')}</g><rect x="-60" y="26" width="120" height="12" fill="#b98a55" class="hmrack"/></g>${M(760, 250, 120, 44, '#c0392b', '4.5V', 'للسيرفو')}</g>
  ${wire('M530 200 C 600 200, 640 80, 690 80', 3, '#8e44ad')}
  <g class="bs" data-s="4">${M(600, 300, 150, 60, '#2b6fc0', 'LCD 16×2', 'I2C')}</g>
  ${wire('M530 300 C 560 300, 570 320, 600 320', 4, '#2b6fc0')}${wire('M530 312 C 556 312, 566 338, 600 338', 4, '#16a3b5')}
  <g class="bs" data-s="5">${M(600, 390, 150, 60, '#b5652e', 'DFPlayer', 'microSD + سماعة')}<g transform="translate(790 420)"><circle r="24" fill="#3e2a1a"/><circle r="10" fill="#7a5230"/></g></g>
  ${wire('M530 340 C 566 340, 560 410, 600 410', 5, '#b5652e')}${wire('M530 352 C 560 352, 556 426, 600 426', 5, '#e67e22')}
  <g class="bs" data-s="6">${M(60, 330, 170, 60, '#1f5fae', 'HC-SR04', 'Trig / Echo')}</g>
  ${wire('M370 300 C 300 300, 280 350, 230 350', 6, '#16a3b5')}${wire('M370 312 C 296 312, 276 366, 230 366', 6, '#8e44ad')}
  <g class="bs" data-s="7">${[['#d64545', 0], ['#e0b400', 1], ['#2b6fc0', 2], ['#2e9e6b', 3]].map(([c, i]) => `<circle cx="${300 + i * 50}" cy="470" r="16" fill="${c}" stroke="#3e2a1a" stroke-width="3"/>`).join('')}<circle cx="520" cy="470" r="13" fill="#f4f1ea" stroke="#3e2a1a" stroke-width="3"/><circle cx="560" cy="470" r="13" fill="#f4f1ea" stroke="#3e2a1a" stroke-width="3"/><text x="540" y="503" class="lbl" style="font-size:12px">أ · ب</text><text x="375" y="503" class="lbl" style="font-size:12px">المحطات</text></g>
  ${wire('M420 370 C 420 420, 375 430, 375 454', 7, '#1b2340')}${wire('M480 370 C 480 420, 540 430, 540 457', 7, '#1b2340')}
  <g class="bs" data-s="8"><circle cx="640" cy="485" r="11" class="hmled g"/><circle cx="680" cy="485" r="11" class="hmled r"/></g>
  ${wire('M530 364 C 600 364, 640 440, 640 474', 8, '#2e9e6b')}${wire('M530 376 C 610 376, 680 440, 680 474', 8, '#d64545')}
</svg>` };

/* ================== المخطط ================== */
const SYS = [
  { k: 'kid', x: 90, y: 230, i: '🧒', n: 'الطفل', d: 'يقترب، ويختار، ويسمع، ويجيب، ثم يحمل ذكراه. هو محور التجربة كلها.' },
  { k: 'sonar', x: 270, y: 90, i: '📡', n: 'HC-SR04', d: 'يكتشف اقتراب الطفل فتبدأ الجولة دون أي ضغطة أولى: Trig 18 وEcho 34.' },
  { k: 'btn', x: 270, y: 370, i: '🔘', n: 'الأزرار', d: 'أربعة لاختيار المحطة (32، 33، 25، 35) واثنان للإجابة (36، 39).' },
  { k: 'esp', x: 470, y: 230, i: '🧠', n: 'ESP32', d: 'آلة حالات تقرأ وتقرر وتشغّل كل شيء دون delay طويلة.' },
  { k: 'step', x: 680, y: 70, i: '🎠', n: 'المنصة', d: 'Stepper 28BYJ-48 عبر ULN2003 (13، 14، 26، 27) يدير المجسمات الأربعة إلى الطفل.' },
  { k: 'media', x: 700, y: 210, i: '🔊', n: 'الصوت والشاشة', d: 'DFPlayer (16، 17) يروي المعلومة، وLCD (21، 22) يعرض الاسم والمؤقت.' },
  { k: 'leds', x: 690, y: 340, i: '🟢', n: 'الليدان', d: 'أخضر للإجابة الصحيحة (4)، وأحمر للمحاولة المساعدة (5).' },
  { k: 'coin', x: 600, y: 440, i: '🪙', n: 'عملة الذكرى', d: 'Servo على 23 يدير ترسًا يدفع قضيبًا مسننًا فتخرج العملة الخشبية.' },
];
const SYS_LINKS = [['kid', 'sonar'], ['kid', 'btn'], ['sonar', 'esp'], ['btn', 'esp'], ['esp', 'step'], ['esp', 'media'], ['esp', 'leds'], ['esp', 'coin']];
const SYS_FLOW = [['kid', '١. طفل يقف أمام البوث'], ['sonar', '٢. الحساس يقيس أقل من ٦٠ سم: زائر!'], ['esp', '٣. ترحيب ويبدأ المؤقت 05:00'], ['btn', '٤. يضغط الزر الأحمر: الخيمة'], ['step', '٥. المنصة تدور إلى الخيمة'], ['media', '٦. صوت المعلومة واسم المحطة على الشاشة'], ['btn', '٧. يجيب عن السؤال'], ['leds', '٨. صحيح: الليد الأخضر'], ['coin', '٩. تخرج عملة الذكرى!']];

/* ================== الأنواع ================== */
Object.assign(window.DECK_TYPES, {
  hmhero: s => `<div class="slide dark hmhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="htitle">${s.title}</h1>
      <div class="hmwrap"><svg viewBox="0 0 1600 600" class="hmsvg">${DEFS}
        <rect width="1600" height="600" fill="#1a1410"/><rect x="0" y="0" width="1600" height="300" fill="#2b2016"/>
        <g opacity=".95"><rect x="1080" y="20" width="500" height="200" rx="10" fill="#f4e7c8"/><rect x="1080" y="20" width="500" height="18" fill="url(#sadu)"/><rect x="1080" y="202" width="500" height="18" fill="url(#sadu)"/>
          <text x="1330" y="92" class="hmbig" style="font-size:40px">صانع الذكريات التراثية</text><text x="1330" y="135" class="hmen" style="font-size:24px">Heritage Memory Maker</text><text x="1330" y="182" class="hmsl" style="font-size:28px">تراث نعيشه… وذكرى نحملها</text></g>
        <rect x="0" y="420" width="1600" height="180" fill="#4a1d1d"/><rect x="420" y="330" width="760" height="120" rx="8" fill="#6b2323"/>
        <g id="hhplat"></g>${panel('hhp', 760, 505, .9)}
        <g transform="translate(1330 340)"><rect x="-90" y="-60" width="180" height="120" rx="12" fill="#1c1f27" stroke="#3a4266" stroke-width="5"/><text y="18" class="hmtimer" id="hhtime">05:00</text><text y="88" class="hmpl" style="fill:#f0cc7a">⏱️ المؤقت</text></g>
        <g id="hhkid" transform="translate(-100 470)"><circle cy="-120" r="26" fill="#c99a74"/><path d="M-30 -130 Q 0 -160 30 -130 L 34 -96 L -34 -96 Z" fill="#f4f1ea"/><path d="M-26 -132 Q 0 -150 26 -132" stroke="#d64545" stroke-width="5" fill="none"/><path d="M-34 -96 L -40 30 L 40 30 L 34 -96 Z" fill="#f4f1ea"/><rect x="-28" y="30" width="18" height="40" fill="#f4f1ea"/><rect x="10" y="30" width="18" height="40" fill="#f4f1ea"/></g>
        <g id="hhwave" opacity="0">${[30, 55, 80].map(r => `<path d="M${510 - r} 512 q -12 -20 0 -40" stroke="#7ee2a8" stroke-width="4" fill="none"/>`).join('')}</g>
        <g transform="translate(70 60)" id="hhcoins">${ST.map((x, i) => `<g transform="translate(${i * 56} 0)" class="hhc" id="hhc${i}" opacity=".18">${coinSVG(x.k, 22)}</g>`).join('')}</g>
        <rect x="200" y="20" width="300" height="0" fill="none"/>
        <g transform="translate(1330 470)"><rect x="-250" y="-24" width="500" height="40" rx="12" fill="rgba(0,0,0,.55)"/><text y="4" class="hmcap" id="hhcap"></text></g>
      </svg></div></div>`,

  hmsystem: s => `<div class="slide light">
      <div class="kicker">🗺️ بنية النظام</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="argrid">
        <div class="arleft ix"><svg viewBox="0 0 800 520" class="archsvg hmsys">
            <rect x="20" y="20" width="360" height="480" rx="24" class="zone2"/><text x="200" y="52" class="zt">المدخلات</text>
            <rect x="560" y="20" width="220" height="480" rx="24" class="zone1"/><text x="670" y="52" class="zt">المخرجات</text>
            ${SYS_LINKS.map(([a, b]) => { const A = SYS.find(x => x.k === a), B = SYS.find(x => x.k === b); return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="alink" data-l="${a}-${b}"/>`; }).join('')}
            ${SYS.map(a => `<g class="anode" data-k="${a.k}" transform="translate(${a.x} ${a.y})"><circle r="46" class="acirc"/><text y="12" class="aico">${a.i}</text><text y="70" class="anm">${a.n}</text></g>`).join('')}
          </svg><div class="arctl"><button class="clap" id="hsplay">▶ شاهد جولة طفل</button><div class="arcap" id="hscap">👆 انقر أي جزء لتتعرف عليه</div></div></div>
        <div class="arinfo" id="hsinfo"><div class="xi0">من اقتراب الطفل… حتى عملة في يده.</div></div>
      </div></div>`,

  sonarlab: s => `<div class="slide light">
      <div class="kicker">📡 حساس الاقتراب HC-SR04</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 380" class="hmS">${DEFS}<rect width="800" height="380" rx="20" fill="#f4e7c8"/><rect y="330" width="800" height="50" fill="#d9b382"/>
            <g transform="translate(90 230)"><rect x="-56" y="-40" width="112" height="80" rx="10" fill="#1f5fae"/><circle cx="-24" r="20" fill="#c9ccd3" stroke="#78909c" stroke-width="4"/><circle cx="24" r="20" fill="#c9ccd3" stroke="#78909c" stroke-width="4"/><text y="62" class="hmpl">HC-SR04</text></g>
            <g id="sopulse"></g>
            <line x1="146" y1="300" x2="146" y2="300" id="sorule" stroke="#2b6fc0" stroke-width="3" stroke-dasharray="8 6"/><text id="sorulet" class="hmpl" y="318"></text>
            <line id="soth" y1="120" y2="330" stroke="#e74c3c" stroke-width="3" stroke-dasharray="10 8"/><text id="sotht" y="112" class="hmpl" style="fill:#c0392b"></text>
            <g id="sokid"><circle cy="-120" r="24" fill="#c99a74"/><path d="M-28 -128 Q 0 -156 28 -128 L 32 -96 L -32 -96 Z" fill="#f4f1ea"/><path d="M-32 -96 L -38 20 L 38 20 L 32 -96 Z" fill="#f4f1ea"/><rect x="-26" y="20" width="16" height="44" fill="#f4f1ea"/><rect x="10" y="20" width="16" height="44" fill="#f4f1ea"/></g></svg>
          <label class="lsl"><span>🚶 الطفل على بعد: <b id="sodv">١٥٠</b> سم (اسحب)</span><input type="range" id="sod" min="10" max="220" value="150"></label></div>
        <div class="hmR ix"><div class="sofacts"><div class="ac"><span>زمن الصدى</span><b id="soe">—</b></div><div class="ac gold"><span>المسافة</span><b id="soc">—</b></div><div class="ac"><span>near</span><b id="son">٠</b></div></div>
          <label class="lsl"><span>🎯 مسافة البدء: <b id="sotv">٦٠</b> سم</span><input type="range" id="sot" min="30" max="120" value="60" step="5"></label>
          <div class="sowarn" id="sow"></div>
          ${codeBlock(SONAR_CODE, 'micro')}</div>
      </div></div>`,

  btnlab: s => `<div class="slide light">
      <div class="kicker">🔘 أزرار الاختيار والإجابة</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><div class="bpanel">${[...ST.map((x, i) => ({ n: x.n, c: x.c, pin: x.pin, ext: x.pin === 35 })), { n: 'إجابة أ', c: '#f4f1ea', pin: 36, ext: true }, { n: 'إجابة ب', c: '#f4f1ea', pin: 39, ext: true }].map(b => `<div class="bcell"><button class="bbig" data-pin="${b.pin}" style="background:${b.c}"></button><b>${b.n}</b><span dir="ltr">GPIO ${b.pin}</span><em id="bv${b.pin}">HIGH</em><small>${b.ext ? 'مدخل فقط: بلا سحب داخلي' : 'INPUT_PULLUP'}</small></div>`).join('')}</div>
          <div class="bctl"><button class="sndbtn" id="bres">❌ بلا مقاومة خارجية على 35 · 36 · 39</button><button class="sndbtn" id="bdeb">❌ بلا إزالة ارتداد</button></div></div>
        <div class="hmR"><div class="sofacts"><div class="ac"><span>ضغطات حقيقية</span><b id="breal">٠</b></div><div class="ac gold"><span>ضغطات قرأها الكود</span><b id="bread">٠</b></div><div class="ac"><span>ضغطات وهمية</span><b id="bghost">٠</b></div></div>
          <div class="sowarn" id="bw"></div>
          ${codeBlock(BTN_CODE, 'micro')}</div>
      </div></div>`,

  platlab: s => `<div class="slide light">
      <div class="kicker">🎠 المنصة الدوّارة · 28BYJ-48 + ULN2003</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 430" class="hmS">${DEFS}<rect width="800" height="430" rx="20" fill="#2b2016"/><g id="plm"></g>
            <g transform="translate(30 24)"><rect width="190" height="70" rx="10" fill="#1f7a4d"/><text x="95" y="22" class="hmpl" style="fill:#e8f6f7">ULN2003</text>${[0, 1, 2, 3].map(i => `<circle cx="${35 + i * 40}" cy="46" r="10" class="ttled" id="pll${i}"/>`).join('')}</g>
            <g transform="translate(780 40)"><text class="hmerr" id="plerr" text-anchor="end"></text></g></svg>
          <div class="plbtns">${ST.map((x, i) => `<button class="bbig sm" data-s="${i}" style="background:${x.c}"><span>${x.n}</span></button>`).join('')}<button class="sndbtn" id="plhome">🏠 مستشعر البداية</button></div></div>
        <div class="hmR ix">
          <label class="lsl"><span>🔢 stepsQuarter: <b id="plqv">٥١٢</b></span><input type="range" id="plq" min="495" max="525" value="512"></label>
          <label class="lsl"><span>🏋️ حمل المجسمات والاحتكاك: <b id="pllv">متوسط</b></span><input type="range" id="pll" min="0" max="2" value="1"></label>
          <div class="sofacts"><div class="ac"><span>المحطة الحالية</span><b id="plhere">الخيمة</b></div><div class="ac gold"><span>خطأ التوقف</span><b id="ple">٠°</b></div><div class="ac"><span>جولات</span><b id="pln">٠</b></div></div>
          <div class="sowarn" id="plw"></div>
          ${codeBlock(PLAT_CODE, 'micro')}</div>
      </div></div>`,

  callab: s => `<div class="slide light">
      <div class="kicker">📏 المعايرة الميدانية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><div class="cltable"><div class="clhead"><span>المحطة</span>${Array.from({ length: 10 }, (_, i) => `<span>${AR(i + 1)}</span>`).join('')}<span>النجاح</span></div>
            ${ST.map((x, i) => `<div class="clrow" id="clr${i}"><span style="color:${x.c}">${x.n}</span>${Array.from({ length: 10 }, (_, j) => `<i id="cl${i}_${j}"></i>`).join('')}<b id="cls${i}">—</b></div>`).join('')}</div>
          <div class="clctl"><label class="lsl"><span>🔢 stepsQuarter: <b id="clqv">٥١٢</b></span><input type="range" id="clq" min="495" max="525" value="512"></label>
            <label class="lsl"><span>⚡ السرعة: <b id="clsv">١٢</b> دورة/دقيقة</span><input type="range" id="cls" min="4" max="16" value="12"></label>
            <button class="clap" id="clgo">▶ ١٠ محاولات لكل محطة</button></div></div>
        <div class="hmR"><div class="clcmp"><div><span>قبل المعايرة</span><b id="clb">—</b></div><div><span>بعد المعايرة</span><b id="cla">—</b></div></div>
          <div class="sowarn" id="clw"></div>
          <div class="clnote"><b>لماذا ليست ٥١٢؟</b> نسبة تروس 28BYJ-48 الحقيقية نحو ١ : ٦٣٫٧ لا ١ : ٦٤، فالدورة نحو ٢٠٣٨ خطوة لا ٢٠٤٨. ومع حمل المجسمات والاحتكاك تضيع خطوات أكثر عند السرعة العالية.</div></div>
      </div></div>`,

  medialab: s => `<div class="slide light">
      <div class="kicker">🔊 الصوت والشاشة · DFPlayer + LCD</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 380" class="hmS">${DEFS}<rect width="800" height="380" rx="20" fill="#2b2016"/>${panel('mdp', 400, 120, 1.15)}
            <g transform="translate(400 300)"><rect x="-330" y="-46" width="660" height="92" rx="14" fill="#1b2340"/><g id="mdwave"></g><text x="-310" y="-22" class="hmpl" style="fill:#f0cc7a;text-anchor:start" id="mdfile">microSD</text></g></svg>
          <div class="plbtns">${ST.map((x, i) => `<button class="bbig sm" data-s="${i}" style="background:${x.c}"><span>${x.n}</span></button>`).join('')}<button class="sndbtn" id="mdwel">👋 الترحيب 0001</button></div></div>
        <div class="hmR ix"><div class="mdlist" id="mdlist">${['0001.mp3 · الترحيب', ...ST.map((x, i) => `000${i + 2}.mp3 · ${x.n}`), '0006.mp3 · أحسنت', '0007.mp3 · حاول مرة أخرى'].map((t, i) => `<div data-f="${i + 1}"><i>🎵</i>${t}</div>`).join('')}</div>
          <div class="sowarn" id="mdw">🗣️ الشرح بالعربية من الصوت، والشاشة 16×2 تعرض الاسم بالإنجليزية والمؤقت: حروف العربية على هذه الشاشة تحتاج رموزًا مخصصة</div>
          ${codeBlock(MEDIA_CODE, 'micro')}</div>
      </div></div>`,

  coinlab: s => `<div class="slide light">
      <div class="kicker">🪙 ابتكار عملة الذكرى</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 400" class="hmS">${DEFS}<rect width="800" height="400" rx="20" fill="#f4e7c8"/>
            <rect x="80" y="210" width="520" height="70" fill="#d9b382" stroke="#7a5230" stroke-width="3"/><rect x="600" y="210" width="12" height="70" fill="#7a5230"/><rect x="600" y="248" width="12" height="32" fill="#f4e7c8"/>
            <g id="cnrack"><rect x="110" y="232" width="300" height="20" fill="#9aa1b3"/>${Array.from({ length: 22 }, (_, i) => `<rect x="${114 + i * 13.5}" y="220" width="7" height="12" fill="#9aa1b3"/>`).join('')}<rect x="400" y="226" width="16" height="32" rx="3" fill="#6b7180"/></g>
            <g transform="translate(280 175)"><g id="cnpin"><circle r="40" fill="#2b6fc0" stroke="#1b2340" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-5" y="-50" width="10" height="12" fill="#2b6fc0" stroke="#1b2340" stroke-width="2" transform="rotate(${i * 30})"/>`).join('')}<line x1="0" y1="0" x2="0" y2="-34" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g><circle r="8" fill="#1b2340"/></g>
            <g transform="translate(280 100)"><rect x="-50" y="-40" width="100" height="60" rx="8" fill="#1f5fae"/><text y="-4" class="hmpl" style="fill:#fff">SG90 · 23</text></g>
            <g id="cncoin"><g transform="translate(470 248)">${coinSVG('tent', 26)}</g></g>
            <g id="cnstack">${[0, 1, 2].map(i => `<g transform="translate(470 ${170 - i * 12})" opacity=".9">${coinSVG('jar', 26)}</g>`).join('')}<rect x="436" y="120" width="68" height="100" fill="none" stroke="#7a5230" stroke-width="3"/><text x="470" y="110" class="hmpl">الخزان</text></g>
            <text x="700" y="330" class="hmpl" id="cnout"></text>
            <line x1="420" y1="300" x2="420" y2="300" stroke="#c0392b" stroke-width="4" id="cnsl"/><text x="420" y="330" class="hmpl" id="cnst"></text></svg>
          <div class="cnctl"><label class="lsl"><span>🔄 زاوية السيرفو: <b id="cnav">٠°</b></span><input type="range" id="cna" min="0" max="180" value="0"></label>
            <label class="lsl"><span>⚙️ نصف قطر الترس: <b id="cnrv">١٠</b> مم</span><input type="range" id="cnr" min="6" max="16" value="10"></label></div>
          <div class="plbtns"><button class="clap" id="cngive">🎁 giveCoin()</button><button class="sndbtn" id="cnreset">🔄 جولة جديدة</button><button class="sndbtn" id="cnpow">🔌 الطاقة: 4.5V مستقلة</button></div></div>
        <div class="hmR"><div class="sofacts"><div class="ac"><span>دفع القضيب s = r·θ</span><b id="cns">٠ مم</b></div><div class="ac gold"><span>المطلوب لخروج العملة</span><b>٣٢ مم</b></div><div class="ac"><span>coinGiven</span><b id="cng">false</b></div></div>
          <div class="sowarn" id="cnw"></div>
          ${codeBlock(COIN_CODE, 'micro')}</div>
      </div></div>`,

  statelab: s => `<div class="slide light">
      <div class="kicker">🔀 آلة الحالات</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 380" class="hmS sm">
            <rect width="800" height="380" rx="20" fill="#fbf7ee"/>
            ${[['WAIT', 'انتظار زائر', 110, 90], ['CHOOSE', 'اختيار عنصر', 330, 90], ['BUSY', 'انشغال', 560, 90], ['ANS1', 'إجابة أولى', 560, 280], ['ANS2', 'إجابة ثانية', 330, 280], ['DONE', 'نهاية الجولة', 110, 280]].map(([k, n, x, y]) => `<g class="stn" id="stn${k}" transform="translate(${x} ${y})"><rect x="-90" y="-44" width="180" height="88" rx="22"/><text y="-6" class="stk">${k}</text><text y="22" class="stt">${n}</text></g>`).join('')}
            <path d="M200 90 L240 90 M420 90 L470 90 M560 134 L560 236 M470 280 L420 280 M330 236 Q 330 170 330 134 M240 280 L200 280 M110 236 L110 134 M 500 236 Q 420 170 380 134" class="starr"/>
          </svg>
          <div class="stbtns">${[['visitor', '🧒 اقترب طفل'], ['station', '🔘 زر محطة'], ['done', '✅ انتهت الحركة والصوت'], ['right', '🟢 إجابة صحيحة'], ['wrong', '🔴 إجابة خاطئة'], ['timeup', '⏱️ انتهى الوقت']].map(([e, t]) => `<button class="sndbtn" data-e="${e}">${t}</button>`).join('')}</div></div>
        <div class="hmR"><div class="stlog" id="stlog"></div>
          ${codeBlock(STATE_CODE, 'micro')}</div>
      </div></div>`,

  hdecide: s => `<div class="slide light">
      <div class="kicker">🧠 منطق القرار المستقل</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 400" class="hmS sm"><rect width="800" height="400" rx="20" fill="#fbf7ee"/>
            <g class="dn" id="dnq1" transform="translate(400 55)"><rect x="-120" y="-30" width="240" height="60" rx="16"/><text y="8">❓ السؤال الأول</text></g>
            <g class="dn" id="dnc1" transform="translate(180 175)"><rect x="-130" y="-30" width="260" height="60" rx="16"/><text y="8">🪙 عملة الذكرى (المسار أ)</text></g>
            <g class="dn" id="dnh" transform="translate(600 175)"><rect x="-130" y="-30" width="260" height="60" rx="16"/><text y="8">💡 سؤال مساعد (المسار ب)</text></g>
            <g class="dn" id="dnc2" transform="translate(470 310)"><rect x="-110" y="-30" width="220" height="60" rx="16"/><text y="8">🪙 عملة بعد المساعدة</text></g>
            <g class="dn" id="dnx" transform="translate(720 310)"><rect x="-70" y="-30" width="140" height="60" rx="16"/><text y="8" style="font-size:16px">⏭️ بلا عملة (ب٢)</text></g>
            <path d="M330 85 L230 145 M470 85 L560 145 M560 205 L490 280 M650 205 L700 280" class="starr"/>
            <text x="250" y="110" class="dlab ok">صحيح</text><text x="555" y="110" class="dlab bad">خطأ</text><text x="490" y="250" class="dlab ok">صحيح</text><text x="720" y="250" class="dlab bad">خطأ</text></svg>
          <div class="dq" id="dq"></div>
          <div class="plbtns"><button class="bbig sm wt" data-a="0"><span>أ</span></button><button class="bbig sm wt" data-a="1"><span>ب</span></button><button class="sndbtn" id="dnext">🔄 محطة أخرى</button></div></div>
        <div class="hmR"><div class="sowarn" id="dw"></div>${codeBlock(DEC_CODE, 'micro')}</div>
      </div></div>`,

  htour: s => `<div class="slide light">
      <div class="kicker">🎮 الجولة الكاملة</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg tour">
        <div class="hmL ix"><svg viewBox="0 0 900 470" class="hmS">${DEFS}<rect width="900" height="470" rx="20" fill="#2b2016"/><rect y="300" width="900" height="170" fill="#4a1d1d"/>
            <g id="tom"></g>${panel('top', 450, 370, 1.12)}
            <g transform="translate(800 70)"><rect x="-80" y="-44" width="160" height="88" rx="12" fill="#1c1f27" stroke="#3a4266" stroke-width="4"/><text y="14" class="hmtimer" style="font-size:44px" id="totime">05:00</text></g>
            <g transform="translate(40 40)" id="tocoins">${ST.map((x, i) => `<g transform="translate(${i * 54 + 24} 24)" opacity=".18" id="toc${i}">${coinSVG(x.k, 22)}</g>`).join('')}</g>
            <g id="totitle" opacity="0"><rect x="200" y="160" width="500" height="90" rx="20" fill="#e0b400" stroke="#7a5230" stroke-width="5"/><text x="450" y="200" class="hmbig" style="font-size:30px;fill:#3e2a1a">🏅 حارس الذكريات التراثية</text><text x="450" y="234" class="hmpl" style="fill:#3e2a1a;font-size:18px">جمعت العملات الأربع!</text></g></svg>
          <div class="tobtns"><button class="clap" id="tokid">🧒 اقترب</button>${ST.map((x, i) => `<button class="bbig sm" data-s="${i}" style="background:${x.c}"><span>${x.n}</span></button>`).join('')}<button class="bbig sm wt" data-a="0"><span>أ</span></button><button class="bbig sm wt" data-a="1"><span>ب</span></button></div></div>
        <div class="hmR"><div class="toq" id="toq">اضغط «اقترب» لتبدأ الجولة</div><div class="mslog hmlog" id="tolog"></div>
          <div class="sofacts"><div class="ac"><span>الحالة</span><b id="tost">WAIT</b></div><div class="ac gold"><span>العملات</span><b id="tocn">٠ / ٤</b></div></div></div>
      </div></div>`,

  boothlab: s => `<div class="slide light">
      <div class="kicker">🎪 البوث وهوية الفريق</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmg">
        <div class="hmL ix"><svg viewBox="0 0 800 460" class="hmS">${DEFS}<rect width="800" height="460" rx="20" fill="#efe6d4"/>
            <text x="400" y="34" class="hmpl" style="font-size:18px">منظر علوي · العرض ٣ م × العمق ٢ م · مفتوح من الأمام</text>
            <rect x="100" y="60" width="600" height="360" fill="#f7f0e0" stroke="#7a5230" stroke-width="4" stroke-dasharray="14 8"/>
            ${[['p1', 120, 'رحلة الفريق'], ['p2', 320, 'اسم المشروع'], ['p3', 520, 'المشكلة والحل']].map(([k, x, t]) => `<g class="bz" data-k="${k}"><rect x="${x}" y="64" width="160" height="26" rx="4" fill="#2e7d32"/><text x="${x + 80}" y="83" class="hmpl" style="fill:#fff;font-size:14px">${t}</text></g>`).join('')}
            <g class="bz" data-k="rug"><rect x="200" y="250" width="400" height="150" rx="6" fill="url(#sadu)" opacity=".85"/></g>
            <g class="bz" data-k="table"><rect x="290" y="150" width="220" height="90" rx="10" fill="#6b2323"/><g transform="translate(400 190) scale(.35)"><ellipse rx="150" ry="57" fill="url(#hmwood)" stroke="#e0b400" stroke-width="6"/></g><text x="400" y="232" class="hmpl" style="fill:#f0cc7a;font-size:13px">الروبوت</text></g>
            <g class="bz" data-k="timer"><rect x="540" y="160" width="80" height="54" rx="8" fill="#1c1f27"/><text x="580" y="194" class="hmtimer" style="font-size:20px">05:00</text></g>
            <g class="bz" data-k="decor"><text x="160" y="190" style="font-size:40px">🫖</text><text x="640" y="300" style="font-size:40px">🏮</text><text x="150" y="330" style="font-size:34px">🧺</text></g>
            <g class="bz" data-k="kids"><text x="330" y="430" style="font-size:38px">🧒</text><text x="440" y="430" style="font-size:38px">🧒</text></g>
            <g class="bz" data-k="cam"><path d="M400 455 L330 380 M400 455 L470 380" stroke="#c0392b" stroke-width="3" stroke-dasharray="6 6"/><text x="400" y="452" style="font-size:22px" text-anchor="middle">🎥</text></g></svg></div>
        <div class="hmR"><div class="arinfo" id="bzinfo" style="min-height:300px"><div class="xi0">انقر أي عنصر في البوث لتعرف لماذا وُضع هناك</div></div>
          <div class="tagrow2"><span style="background:#d9b382">رملي</span><span style="background:#efe6d4;color:#3e2a1a">بيج</span><span style="background:#6d4521">بني داكن</span><span style="background:#14120f">أسود</span><span style="background:#8a2c22">لمسات سدو</span></div></div>
      </div></div>`,

  voices: s => { const all = s.set === 'all';
    const V = all ? VOICES : VOICES.filter(v => v.k);
    return `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="vogrid ${all ? 'all' : ''}">${V.map(v => `<div class="vocard" data-c="${v.c}" style="--vc:${v.c}">
          ${v.k ? `<svg viewBox="-80 -70 160 130" class="voart">${ITEM[v.k]}</svg>` : `<div class="voemo">${v.e}</div>`}
          <div class="votx"><b>${v.n}</b><p>«${v.t}»</p>${all ? `<a class="vofile" href="audio/${v.f}.mp3" download dir="ltr">⬇ ${v.f}.mp3</a>` : ''}</div>
          <button class="voplay ix" data-audio="audio/${v.f}.mp3">▶</button></div>`).join('')}</div>
      ${all ? `<div class="sowarn ok vonote">💾 انسخ الملفات السبعة كما هي إلى جذر بطاقة microSD (FAT32) بالترتيب: 0001 أولًا ثم 0002… والمشغّل جاهز</div>` : ''}</div>`; },

  pitch: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="ptgrid">${s.rows.map((r, i) => `<div class="ptrow" style="animation-delay:${i * .12}s"><div class="ptn">${AR(i + 1)}</div><div class="ptar">${r[0]}</div><div class="pten" dir="ltr">${r[1]}</div></div>`).join('')}</div></div>`,
});

/* ================== السلوك ================== */
const lcd = (sl, id, a, b) => { const l1 = sl.querySelector('#' + id + 'l1'), l2 = sl.querySelector('#' + id + 'l2'); if (l1) l1.textContent = a; if (l2) l2.textContent = b; };
const BOOTH = {
  p1: ['🧭 لوحة رحلة الفريق', 'العصف الذهني، ثم البحث، ثم الرسم الأولي، ثم البناء المنفصل، ثم الدمج والاختبار: الحكم يرى العملية لا النتيجة فقط.'],
  p2: ['🏷️ اسم المشروع والشعار', '«صانع الذكريات التراثية — تراث نعيشه… وذكرى نحملها» في المنتصف خلف الروبوت مباشرة.'],
  p3: ['💡 المشكلة والحل', 'محتوى تراثي ثابت ← روبوت تفاعلي بأربع محطات وسؤال وعملة.'],
  table: ['🎠 قلب البوث', 'الروبوت على طاولة رئيسية بارتفاع مناسب للأطفال، واضح في منتصف المشهد دائمًا.'],
  timer: ['⏱️ المؤقت', 'شاشة رقمية واضحة بجوار المشروع تبدأ مع كل جولة: 05:00 حدًّا مرئيًا، يراه الزائر والحكم دون تخمين.'],
  rug: ['🟥 سجادة السدو', 'هوية بصرية تراثية تحت الطاولة، دون أن تحجب الروبوت.'],
  decor: ['🫖 الزينة', 'دلة وفنجان، وفانوس، وسلتان صغيرتان: لمسات تكمل القصة ولا تسرق الانتباه من الروبوت.'],
  kids: ['🧒 موقع الطالبين', 'يقفان على جانبي الطاولة، فيرى الحكم الطالبين والروبوت والمؤقت في لقطة واحدة.'],
  cam: ['🎥 فيديو ٥ دقائق بلقطة واحدة', 'المشكلة ← رحلة الحل ← تشغيل الروبوت ← شرح الهوية والبوث، بلا مونتاج.'],
};

Object.assign(window.DECK_BIND, {
  hmhero(sl) {
    const $ = id => sl.querySelector('#' + id); let raf = 0, t0 = 0, th = 0, coins = 0, lastPhase = '';
    const SC = [[0, 'idle', '🌙 البوث ينتظر زائرًا صغيرًا…'], [3, 'walk', '🧒 طفل يقترب من البوث'], [5.5, 'hello', '📡 الحساس اكتشفه: مرحبًا! ويبدأ المؤقت'], [8, 'press', '🔘 يضغط الزر الأحمر: الخيمة'], [9, 'turn', '🎠 المنصة تدور إلى الخيمة'], [12, 'talk', '🔊 «الخيمة رمز الضيافة والترحال…»'], [16, 'answer', '❓ سؤال… وإجابة صحيحة من أول مرة!'], [18, 'coin', '🪙 تخرج عملة الذكرى… تراث نعيشه، وذكرى نحملها'], [23, 'end', '🏅 أربع عملات = حارس الذكريات التراثية']];
    const loop = ts => {
      t0 = t0 || ts; const t = ((ts - t0) / 1000) % 26, ph = [...SC].reverse().find(([s]) => t >= s);
      const p = ph[1]; $('hhcap').textContent = ph[2];
      const kx = p === 'idle' ? -100 : p === 'walk' ? -100 + (t - 3) / 2.5 * 340 : 240;
      $('hhkid').setAttribute('transform', `translate(${kx} 470)`);
      $('hhwave').setAttribute('opacity', p === 'hello' || p === 'walk' ? .5 + .5 * Math.sin(ts / 120) : 0);
      const target = 0; if (p === 'idle' || p === 'walk') th = Math.sin(t * .4) * .3 - Math.PI / 2 * 1.5; if (p === 'turn') th += (target - th) * .06; if (['talk', 'answer', 'coin', 'end'].includes(p)) th = target;
      $('hhplat').innerHTML = platform(th, 640, 250, 280, { glow: ['talk', 'answer', 'coin'].includes(p) });
      const live = !['idle', 'walk'].includes(p); $('hhtime').textContent = live ? fmt(300 - (t - 5.5)) : '05:00';
      lcd(sl, 'hhp', { idle: 'Heritage Memory', walk: 'Come closer...', hello: 'Welcome!', press: 'You chose:', turn: 'Turning...', talk: 'Station: TENT', answer: 'Correct!', coin: 'Take your coin!', end: 'Heritage Keeper' }[p], live ? 'Time ' + fmt(300 - (t - 5.5)) : 'Maker  05:00');
      $('hhpb0').setAttribute('stroke-width', p === 'press' ? 7 : 3); $('hhpb0').setAttribute('stroke', p === 'press' ? '#fff' : '#3e2a1a');
      $('hhpspk').setAttribute('opacity', p === 'talk' ? .5 + .5 * Math.sin(ts / 90) : 0);
      $('hhplg').classList.toggle('on', ['answer', 'coin'].includes(p));
      const cy = p === 'coin' ? Math.min(40, (t - 18) * 40) : 0; $('hhpcoin').setAttribute('opacity', p === 'coin' || p === 'end' ? 1 : 0); $('hhpcoin').setAttribute('transform', `translate(0 ${18 + cy})`);
      if (p !== lastPhase) { if (p === 'coin') beep(1200, 200, .03); if (p === 'idle') coins = 0; lastPhase = p; }
      const n = p === 'end' ? 4 : ['coin'].includes(p) ? 1 : 0; ST.forEach((_, i) => $('hhc' + i).setAttribute('opacity', i < n ? 1 : .18));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  hmsystem(sl) {
    const $ = id => sl.querySelector('#' + id), info = $('hsinfo'); let timers = [];
    const pick = k => { const a = SYS.find(x => x.k === k); sl.querySelectorAll('.anode').forEach(n => n.classList.toggle('sel', n.dataset.k === k));
      info.innerHTML = `<div class="xi1">${a.i}</div><h3>${a.n}</h3><p>${a.d}</p>`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); };
    sl.querySelectorAll('.anode').forEach(n => n.addEventListener('pointerdown', () => pick(n.dataset.k)));
    $('hsplay').onclick = () => { timers.forEach(clearTimeout); timers = []; sl.querySelectorAll('.alink').forEach(l => l.classList.remove('hot'));
      SYS_FLOW.forEach(([k, cap], i) => timers.push(setTimeout(() => { pick(k); $('hscap').textContent = cap; const prev = i ? SYS_FLOW[i - 1][0] : null;
        sl.querySelectorAll('.alink').forEach(l => { if (prev && (l.dataset.l === `${prev}-${k}` || l.dataset.l === `${k}-${prev}`)) l.classList.add('hot'); });
        if (['step', 'media', 'leds', 'coin'].includes(k)) sl.querySelectorAll(`.alink[data-l="esp-${k}"]`).forEach(l => l.classList.add('hot')); }, i * 1400))); };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  sonarlab(sl) {
    const $ = id => sl.querySelector('#' + id); let raf = 0, last = 0, pt = 0, near = 0, pulses = [], acc = 0;
    $('sod').oninput = () => $('sodv').textContent = AR($('sod').value);
    $('sot').oninput = () => { $('sotv').textContent = AR($('sot').value); const l = sl.querySelector('.hmR .ln[data-n="14"] .cl-src'); if (l) l.innerHTML = highlight(`  near = (d > 2 && d < ${$('sot').value}) ? near + 1 : 0;`); };
    const X = cm => 146 + cm * 2.8;
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; acc += dt;
      const d = +$('sod').value, th = +$('sot').value, kx = X(d);
      $('sokid').setAttribute('transform', `translate(${kx + 30} 300)`);
      $('sorule').setAttribute('x2', kx); $('sorulet').setAttribute('x', (146 + kx) / 2); $('sorulet').textContent = AR(d) + ' سم';
      $('soth').setAttribute('x1', X(th)); $('soth').setAttribute('x2', X(th)); $('sotht').setAttribute('x', X(th)); $('sotht').textContent = `حد البدء ${AR(th)} سم`;
      if (acc > .25) { acc = 0; pulses.push({ x: 146, dir: 1 }); const echo = Math.round(d * 2 / .0343); $('soe').textContent = AR(echo) + ' µs'; $('soc').textContent = AR((echo * .0343 / 2).toFixed(0)) + ' سم';
        near = d < th ? Math.min(near + 1, 9) : 0; $('son').textContent = AR(near); }
      pulses.forEach(p => { p.x += p.dir * 900 * dt; if (p.dir > 0 && p.x >= kx) p.dir = -1; }); pulses = pulses.filter(p => !(p.dir < 0 && p.x <= 146));
      $('sopulse').innerHTML = pulses.map(p => `<path d="M${p.x.toFixed(0)} 205 q ${p.dir * 12} 25 0 50" stroke="${p.dir > 0 ? '#2b6fc0' : '#2e9e6b'}" stroke-width="5" fill="none" opacity=".8"/>`).join('');
      const here = near >= 3, w = $('sow'); w.className = 'sowarn ' + (here ? 'ok' : near ? '' : '');
      w.textContent = here ? '👋 زائر! ثلاث قراءات متتالية أقل من الحد: ترحيب ويبدأ المؤقت' : near ? `⏳ قراءة ${AR(near)} من ٣… نتأكد أنه واقف فعلًا لا مارٌّ مسرعًا` : '🛑 لا زائر: البوث في وضع الانتظار';
      runLines(sl, '.hmR', here ? [14, 15] : near ? [14] : [8, 9]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  btnlab(sl) {
    const $ = id => sl.querySelector('#' + id); let ext = false, deb = false, real = 0, read = 0, ghost = 0, raf = 0, last = 0, ft = 0;
    const down = {}, PINS = [32, 33, 25, 35, 36, 39], FLOAT = [35, 36, 39];
    $('bres').onclick = () => { ext = !ext; $('bres').textContent = ext ? '✅ مقاومة 10k خارجية على 35 · 36 · 39' : '❌ بلا مقاومة خارجية على 35 · 36 · 39'; $('bres').classList.toggle('on', ext); };
    $('bdeb').onclick = () => { deb = !deb; $('bdeb').textContent = deb ? '✅ إزالة الارتداد (20 مللي ثانية)' : '❌ بلا إزالة ارتداد'; $('bdeb').classList.toggle('on', deb); };
    sl.querySelectorAll('[data-pin]').forEach(b => { const p = +b.dataset.pin;
      b.addEventListener('pointerdown', () => { down[p] = true; real++; read += deb ? 1 : 1 + Math.floor(Math.random() * 3); beep(700, 30, .02); b.classList.add('on'); });
      ['pointerup', 'pointerleave'].forEach(e => b.addEventListener(e, () => { down[p] = false; b.classList.remove('on'); })); });
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; ft += dt;
      PINS.forEach(p => { let v = down[p] ? 'LOW' : 'HIGH'; const fl = !ext && FLOAT.includes(p) && !down[p];
        if (fl) { v = Math.sin(ts / 97 + p) + Math.sin(ts / 41 + p * 3) > 1.2 ? 'LOW' : 'HIGH'; if (v === 'LOW' && ft > .7) { ft = 0; ghost++; read++; } }
        const e = $('bv' + p); e.textContent = v; e.className = v === 'LOW' ? 'lo' : ''; e.parentNode.classList.toggle('float', fl); });
      $('breal').textContent = AR(real); $('bread').textContent = AR(read); $('bghost').textContent = AR(ghost);
      const w = $('bw'), bad = !ext || !deb;
      w.className = 'sowarn ' + (bad ? 'bad' : 'ok');
      w.textContent = !ext ? '👻 الأطراف 35 و36 و39 «عائمة»: بلا مقاومة سحب تقرأ ضجيجًا عشوائيًا فيظن الكود أن الطفل ضغط! أضف مقاومة 10k إلى 3.3V' : !deb ? '⚡ الزر المعدني يرتد: ضغطة واحدة تُقرأ مرتين أو ثلاثًا. أضف إزالة الارتداد' : '✅ قراءة نظيفة: كل ضغطة حقيقية = ضغطة واحدة في الكود';
      runLines(sl, '.hmR', !ext ? [8, 9, 10] : !deb ? [14, 15, 16] : [5, 6, 7]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  platlab(sl) {
    const $ = id => sl.querySelector('#' + id); let th = 0, target = 0, here = 0, err = 0, raf = 0, last = 0, moving = false, trips = 0, ph = 0;
    const LOADS = ['خفيف', 'متوسط', 'ثقيل'];
    $('plq').oninput = () => { $('plqv').textContent = AR($('plq').value); const l = sl.querySelector('.hmR .ln[data-n="3"] .cl-src'); if (l) l.innerHTML = highlight(`int stepsQuarter = ${$('plq').value};   // من جدول المعايرة`); };
    $('pll').oninput = () => $('pllv').textContent = LOADS[$('pll').value];
    const go = i => { if (moving) return; let d = (i - here + 4) % 4; if (d === 3) d = -1; if (!d) return;
      const q = +$('plq').value, real = 509.5 * (1 - [.002, .006, .014][$('pll').value]);    // خطوات الربع الفعلية
      err += d * (q - real) / 2037.9 * 360 * (Math.abs(d)) / Math.abs(d) * Math.abs(d) / Math.abs(d);
      target = -(i * 90 + err) * Math.PI / 180; moving = true; here = i; trips++; runLines(sl, '.hmR', [7, 8, 9, 10, 11]); };
    sl.querySelectorAll('[data-s]').forEach(b => b.onclick = () => go(+b.dataset.s));
    $('plhome').onclick = () => { err = 0; here = 0; target = 0; moving = true; $('plw').className = 'sowarn ok'; };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts;
      if (moving) { const d = target - th; if (Math.abs(d) < .004) { th = target; moving = false; runLines(sl, '.hmR', []); } else { th += clamp(d, -1.3 * dt, 1.3 * dt); ph += dt * 30; } }
      $('plm').innerHTML = platform(th, 400, 240, 280, { glow: !moving });
      for (let i = 0; i < 4; i++) $('pll' + i).classList.toggle('on', moving && (Math.floor(ph) % 4 === i || Math.floor(ph + 1) % 4 === i));
      const e = Math.abs(err); $('ple').textContent = AR(e.toFixed(1)).replace('.', '٫') + '°'; $('plhere').textContent = ST[here].n; $('pln').textContent = AR(trips);
      $('plerr').textContent = e > 4 ? '⚠️ المجسم لا يواجه الطفل تمامًا' : '';
      if (!moving) { const w = $('plw'); w.className = 'sowarn ' + (e > 4 ? 'bad' : e > 1.5 ? '' : 'ok');
        w.textContent = e > 4 ? `الخطأ يتراكم مع كل حركة (${AR(trips)} حركات). عدّل stepsQuarter نحو ٥٠٨–٥١٠، أو اضغط «مستشعر البداية» ليعيد الصفر عند الخيمة` : e > 1.5 ? 'خطأ صغير… لكنه سيكبر مع الجولات. راقب العداد' : 'اختر محطة: المنصة تأخذ الطريق الأقصر'; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  callab(sl) {
    const $ = id => sl.querySelector('#' + id); let first = null, timers = [];
    $('clq').oninput = () => $('clqv').textContent = AR($('clq').value);
    $('cls').oninput = () => $('clsv').textContent = AR($('cls').value);
    $('clgo').onclick = () => {
      timers.forEach(clearTimeout); timers = [];
      const q = +$('clq').value, sp = +$('cls').value, slip = Math.max(0, sp - 10) * .004 + .003;
      const real = 509.5 * (1 - slip);
      let tot = 0, n = 0, okAll = 0;
      ST.forEach((x, i) => { let ok = 0;
        for (let j = 0; j < 10; j++) { timers.push(setTimeout(() => {
          const e = (q - real) / 2037.9 * 360 * (j + 1) * .5 + (Math.random() - .5) * (sp > 12 ? 4 : 1.6);
          const good = Math.abs(e) <= 3; if (good) ok++; okAll += good; tot += Math.abs(e); n++;
          const c = $(`cl${i}_${j}`); c.textContent = AR(Math.abs(e).toFixed(0)) + '°'; c.className = good ? 'ok' : 'bad';
          $('cls' + i).textContent = AR(ok) + '/١٠';
          if (n === 40) { const mean = tot / 40; if (!first) { first = mean; $('clb').textContent = AR(mean.toFixed(1)).replace('.', '٫') + '°'; }
            else $('cla').textContent = AR(mean.toFixed(1)).replace('.', '٫') + '°';
            const w = $('clw'); const pc = Math.round(okAll / 40 * 100);
            w.className = 'sowarn ' + (pc >= 90 ? 'ok' : 'bad');
            w.textContent = pc >= 90 ? `✅ ${AR(pc)}٪ من المحاولات ضمن ±٣°: سجّلوا stepsQuarter = ${AR(q)} في الكود والسرعة ${AR(sp)}` : `${AR(pc)}٪ فقط ضمن ±٣°. غيّر عاملًا واحدًا فقط (الخطوات أو السرعة) ثم أعد الاختبار`; }
        }, (i * 10 + j) * 70)); } });
    };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  medialab(sl) {
    const $ = id => sl.querySelector('#' + id); let raf = 0, playT = 0, file = 0, last = 0, t = 0;
    const play = (f, a, b) => { file = f; playT = 60; playAudio(`audio/${String(f).padStart(4, '0')}.mp3`, () => { playT = 0; }); lcd(sl, 'mdp', a, b); sl.querySelectorAll('#mdlist div').forEach(d => d.classList.toggle('on', +d.dataset.f === f)); $('mdfile').textContent = `▶ ${String(f).padStart(4, '0')}.mp3`;
      runLines(sl, '.hmR', f === 1 ? [10, 11] : [14, 15, 16]); };
    $('mdwel').onclick = () => play(1, 'Welcome!', 'Time 05:00');
    sl.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const i = +b.dataset.s; play(i + 2, 'Station: ' + ST[i].en, 'Time 04:3' + i); });
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt; playT = Math.max(0, playT - dt);
      $('mdpspk').setAttribute('opacity', playT > 0 ? .5 + .5 * Math.sin(ts / 80) : 0);
      $('mdwave').innerHTML = Array.from({ length: 60 }, (_, i) => { const h = playT > 0 ? 6 + Math.abs(Math.sin(i * .7 + t * 9) * Math.sin(i * .23 + t * 3)) * 32 : 3; return `<rect x="${-300 + i * 10}" y="${10 - h / 2}" width="6" height="${h.toFixed(1)}" rx="3" fill="${playT > 0 ? '#7ee2a8' : '#3a4266'}"/>`; }).join('');
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); stopAudio(); });
  },

  coinlab(sl) {
    const $ = id => sl.querySelector('#' + id); let given = false, pow = true, raf = 0, last = 0, ang = 0, want = 0, out = 0, t = 0, auto = 0;
    const setA = a => { want = a; $('cna').value = a; };
    $('cna').oninput = () => setA(+$('cna').value);
    $('cnr').oninput = () => $('cnrv').textContent = AR($('cnr').value);
    $('cngive').onclick = () => { if (given) { $('cnw').className = 'sowarn bad'; $('cnw').textContent = '🔒 coinGiven = true: القفل يمنع عملة ثانية في الجولة نفسها'; runLines(sl, '.hmR', [10]); return; } auto = 1; setA(120); runLines(sl, '.hmR', [11, 12]); };
    $('cnreset').onclick = () => { given = false; out = 0; setA(0); auto = 0; };
    $('cnpow').onclick = () => { pow = !pow; $('cnpow').textContent = pow ? '🔌 الطاقة: 4.5V مستقلة' : '⚠️ الطاقة: من لوحة ESP32'; $('cnpow').classList.toggle('on', !pow); };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt;
      const jit = pow ? 0 : Math.sin(t * 37) * 9 + Math.sin(t * 13) * 6;
      ang += clamp(want + jit - ang, -400 * dt, 400 * dt);
      const r = +$('cnr').value, s = Math.max(0, r * ang * Math.PI / 180);
      $('cnpin').setAttribute('transform', `rotate(${ang})`); $('cnrack').setAttribute('transform', `translate(${s * 2.2} 0)`);
      const push = Math.max(0, s * 2.2 - 50);
      if (s >= 32 && !given) { given = true; beep(1300, 160, .03); }
      if (given) out = Math.min(out + dt * 1.6, 1);
      const cx = given ? 470 + 150 * Math.min(out * 1.4, 1) : 470 + push, cy = given ? 248 + Math.max(0, out - .7) * 300 : 248;
      $('cncoin').innerHTML = `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${given ? out * 200 : 0})">${coinSVG('tent', 26)}</g>`;
      $('cnout').textContent = given ? '🎉 خذ ذكراك!' : '';
      $('cnsl').setAttribute('x2', 420 + s * 2.2); $('cnst').setAttribute('x', 420 + s * 1.1); $('cnst').textContent = AR(Math.round(s)) + ' مم';
      $('cnav').textContent = AR(Math.round(ang)) + '°'; $('cns').textContent = AR(Math.round(s)) + ' مم'; $('cng').textContent = given ? 'true' : 'false';
      if (auto && Math.abs(ang - 120) < 3 && given) { auto = 0; setTimeout(() => setA(0), 500); runLines(sl, '.hmR', [14, 15]); }
      if (!$('cnw').textContent.startsWith('🔒') || !given) { const w = $('cnw');
        w.className = 'sowarn ' + (!pow ? 'bad' : given ? 'ok' : '');
        w.textContent = !pow ? '⚡ السيرفو يرتجف: سحب تيارًا كبيرًا من اللوحة فهبط الجهد. هذا ما واجهه الفريق: غيّروا المنفذ وفحصوا التغذية والأرضي' : given ? 'العملة خرجت دون لمس يدوي، والقفل يمنع تكرار المكافأة' : `s = r × θ = ${AR(r)} × ${AR((ang * Math.PI / 180).toFixed(2)).replace('.', '٫')} راديان = ${AR(Math.round(s))} مم. نحتاج ٣٢ مم لتخرج العملة`; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  statelab(sl) {
    const $ = id => sl.querySelector('#' + id); let st = 'WAIT', logs = [];
    const say = (s, bad) => { logs.unshift(`<div class="${bad ? 'bad' : ''}">${s}</div>`); $('stlog').innerHTML = logs.slice(0, 7).join(''); };
    const LINE = { WAIT: 6, CHOOSE: 7, BUSY: 8, ANS1: 9, ANS2: 10, DONE: 11 };
    const show = () => { sl.querySelectorAll('.stn').forEach(n => n.classList.toggle('on', n.id === 'stn' + st)); runLines(sl, '.hmR', [5, LINE[st]]); };
    const T = { WAIT: { visitor: ['CHOOSE', '👋 ترحيب وبدء المؤقت'] }, CHOOSE: { station: ['BUSY', '🎠 المنصة تدور والصوت يبدأ'], timeup: ['DONE', '⏱️ انتهى الوقت'] }, BUSY: { done: ['ANS1', '❓ السؤال الأول'] },
      ANS1: { right: ['CHOOSE', '🪙 عملة! اختر محطة أخرى'], wrong: ['ANS2', '💡 سؤال مساعد'] }, ANS2: { right: ['CHOOSE', '🪙 عملة بعد المساعدة'], wrong: ['CHOOSE', '⏭️ بلا عملة، محطة أخرى'] }, DONE: { visitor: ['CHOOSE', '👋 زائر جديد بعد إعادة الضبط'] } };
    const WHY = { station: 'الأزرار مقفلة: المنصة تدور أو الصوت يعمل', right: 'لا يوجد سؤال الآن', wrong: 'لا يوجد سؤال الآن', visitor: 'الجولة جارية بالفعل', done: 'لا حركة جارية', timeup: 'المؤقت لا يعمل الآن' };
    sl.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const e = b.dataset.e, tr = (T[st] || {})[e];
      if (e === 'timeup' && st !== 'WAIT' && st !== 'DONE') { st = 'DONE'; say('⏱️ انتهى الوقت ← DONE'); show(); return; }
      if (!tr) { say(`🚫 ${st}: «${b.textContent}» مرفوض · ${WHY[e]}`, true); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); beep(200, 120, .03, 'square'); return; }
      say(`${st} ← ${tr[0]} · ${tr[1]}`); st = tr[0]; beep(800, 60, .02); show(); });
    say('▶ ابدأ بـ «اقترب طفل»، ثم جرّب أزرارًا في غير وقتها'); show();
  },

  hdecide(sl) {
    const $ = id => sl.querySelector('#' + id); let s = 0, stage = 1;
    const mark = ids => sl.querySelectorAll('.dn').forEach(n => n.classList.toggle('on', ids.includes(n.id)));
    const ask = () => { const Q = stage === 1 ? ST[s].q : ST[s].h; $('dq').innerHTML = `<b style="color:${ST[s].c}">${ST[s].n}</b> · ${Q[0]}<div class="dqo"><span>أ. ${Q[1]}</span><span>ب. ${Q[2]}</span></div>`; };
    const reset = () => { stage = 1; mark(['dnq1']); ask(); $('dw').className = 'sowarn'; $('dw').textContent = 'أجب عن السؤال: (أ) هي الصحيحة في كل المحطات هنا، فجرّب الخطأ أيضًا!'; runLines(sl, '.hmR', [2, 3]); };
    sl.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const ok = +b.dataset.a === 0;
      if (stage === 1) { if (ok) { mark(['dnq1', 'dnc1']); stage = 0; $('dw').className = 'sowarn ok'; $('dw').textContent = '🟢 صحيح من أول مرة: تغذية راجعة إيجابية + Servo ← تخرج العملة'; beep(1200, 160, .03); runLines(sl, '.hmR', [4, 5]); }
        else { mark(['dnq1', 'dnh']); stage = 2; ask(); $('dw').className = 'sowarn'; $('dw').textContent = '🔴 ليست صحيحة… لكن الروبوت لا يعاقب: يعطي سؤالًا مساعدًا بمعلومة إضافية'; runLines(sl, '.hmR', [6, 7]); } }
      else if (stage === 2) { if (ok) { mark(['dnq1', 'dnh', 'dnc2']); $('dw').className = 'sowarn ok'; $('dw').textContent = '🟢 تعلّم من المساعدة: عملة ذكرى!'; beep(1200, 160, .03); runLines(sl, '.hmR', [13]); }
        else { mark(['dnq1', 'dnh', 'dnx']); $('dw').className = 'sowarn bad'; $('dw').textContent = '⏭️ المسار ب٢: تنتهي المحطة دون تفعيل العملة، وينتقل الطفل للجولة التالية'; runLines(sl, '.hmR', [14, 15]); } stage = 0; } });
    $('dnext').onclick = () => { s = (s + 1) % 4; reset(); };
    reset();
  },

  htour(sl) {
    const $ = id => sl.querySelector('#' + id); let st = 'WAIT', th = 0, target = 0, cur = -1, timer = 300, coins = [0, 0, 0, 0], busyT = 0, raf = 0, last = 0, stage = 1, logs = [], coinAnim = 0;
    const say = s => { logs.unshift(`<div>${s}</div>`); $('tolog').innerHTML = logs.slice(0, 7).join(''); };
    const L = (a, b) => lcd(sl, 'top', a, b);
    const ask = () => { const Q = stage === 1 ? ST[cur].q : ST[cur].h; $('toq').innerHTML = `<b style="color:${ST[cur].c}">${ST[cur].n}</b> · ${Q[0]}<div class="dqo"><span>أ. ${Q[1]}</span><span>ب. ${Q[2]}</span></div>`; };
    const flashLed = (g) => { $(g ? 'toplg' : 'toplr').classList.add('on'); setTimeout(() => { $('toplg').classList.remove('on'); $('toplr').classList.remove('on'); }, 1200); };
    $('tokid').onclick = () => { if (st !== 'WAIT' && st !== 'DONE') return say('🚫 الجولة جارية بالفعل'); st = 'CHOOSE'; timer = 300; coins = [0, 0, 0, 0]; say('👋 الحساس اكتشفك: مرحبًا! المؤقت بدأ'); L('Welcome!', 'Choose a station'); $('toq').textContent = 'اختر عنصرًا تراثيًا بأحد الأزرار الملونة'; $('totitle').setAttribute('opacity', 0); beep(900, 150, .03); };
    sl.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const i = +b.dataset.s;
      if (st !== 'CHOOSE') return say(st === 'BUSY' ? '🔒 الأزرار مقفلة أثناء الدوران والصوت' : st === 'WAIT' ? '🧒 اقترب أولًا' : '❓ أجب عن السؤال أولًا');
      if (coins[i]) return say(`✔️ أخذت عملة «${ST[i].n}» من قبل: اختر غيرها`);
      cur = i; stage = 1; let d = (i - ((Math.round(-target / (Math.PI / 2)) % 4) + 4) % 4 + 4) % 4; if (d === 3) d = -1; target -= d * Math.PI / 2;
      st = 'BUSY'; busyT = 4.2; say(`🎠 المنصة تدور إلى «${ST[i].n}» · 🔊 ${String(i + 2).padStart(4, '0')}.mp3`); L('Station: ' + ST[i].en, ''); $('toq').innerHTML = `🔊 ${ST[i].learn}`; });
    sl.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { if (st !== 'ANS1' && st !== 'ANS2') return say('🔒 لا يوجد سؤال الآن'); const ok = +b.dataset.a === 0;
      if (ok) { coins[cur] = 1; coinAnim = 1.4; flashLed(true); beep(1200, 200, .03); say(st === 'ANS1' ? '🟢 صحيح من أول مرة: عملة الذكرى!' : '🟢 صحيح بعد المساعدة: عملة الذكرى!'); L('Correct!', 'Take your coin!'); st = 'CHOOSE'; $('toq').textContent = 'أحسنت! اختر محطة أخرى'; }
      else if (st === 'ANS1') { flashLed(false); stage = 2; st = 'ANS2'; ask(); say('💡 سؤال مساعد بمعلومة إضافية'); L('Try again :)', 'Helper question'); }
      else { flashLed(false); st = 'CHOOSE'; say('⏭️ لا عملة هذه المرة… جرّب محطة أخرى'); L('Next station', ''); $('toq').textContent = 'اختر محطة أخرى'; }
      if (coins.every(Boolean)) { st = 'DONE'; $('totitle').setAttribute('opacity', 1); say('🏅 أربع عملات: حارس الذكريات التراثية!'); L('Heritage Keeper', 'Well done!'); $('toq').textContent = '🏅 لقب «حارس الذكريات التراثية»'; } });
    say('▶ اضغط «اقترب» لتبدأ'); $('tolog').innerHTML = logs.join('');
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts;
      if (['CHOOSE', 'BUSY', 'ANS1', 'ANS2'].includes(st)) { timer -= dt; if (timer <= 0) { timer = 0; st = 'DONE'; say('⏱️ انتهى الوقت'); L('Time is up!', 'Thank you'); } }
      th += clamp(target - th, -1.4 * dt, 1.4 * dt);
      if (st === 'BUSY') { busyT -= dt; if (busyT <= 0) { st = 'ANS1'; ask(); say('❓ السؤال الأول'); L(ST[cur].en + ' question', 'Press A or B'); } }
      $('tom').innerHTML = platform(th, 450, 190, 230, { glow: st !== 'BUSY' && cur >= 0 });
      $('totime').textContent = fmt(timer); $('totime').classList.toggle('warn', timer < 60);
      $('topspk').setAttribute('opacity', st === 'BUSY' && busyT < 3 ? .5 + .5 * Math.sin(ts / 80) : 0);
      coinAnim = Math.max(0, coinAnim - dt); $('topcoin').setAttribute('opacity', coinAnim > 0 ? 1 : 0); $('topcoin').setAttribute('transform', `translate(0 ${18 + (1.4 - coinAnim) * 26})`);
      if (cur >= 0) $('topcoin').innerHTML = coinSVG(ST[cur].k, 15);
      coins.forEach((c, i) => $('toc' + i).setAttribute('opacity', c ? 1 : .18));
      ST.forEach((_, i) => $('topb' + i).setAttribute('opacity', st === 'CHOOSE' && !coins[i] ? 1 : .45));
      $('tost').textContent = st; $('tocn').textContent = AR(coins.filter(Boolean).length) + ' / ٤';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  voices(sl) {
    sl.querySelectorAll('.voplay').forEach(b => b.onclick = () => { const card = b.closest('.vocard'), on = card.classList.contains('on');
      sl.querySelectorAll('.vocard').forEach(c => { c.classList.remove('on'); c.querySelector('.voplay').textContent = '▶'; });
      if (on) return stopAudio();
      card.classList.add('on'); b.textContent = '⏸';
      playAudio(b.dataset.audio, () => { card.classList.remove('on'); b.textContent = '▶'; }); });
    window.DECK_CLEANUP.push(stopAudio);
  },

  boothlab(sl) {
    const info = sl.querySelector('#bzinfo');
    sl.querySelectorAll('.bz').forEach(z => z.addEventListener('pointerdown', () => { const [h, p] = BOOTH[z.dataset.k]; sl.querySelectorAll('.bz').forEach(x => x.classList.toggle('sel', x === z));
      info.innerHTML = `<h3>${h}</h3><p>${p}</p>`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); }));
  },
});
})();
