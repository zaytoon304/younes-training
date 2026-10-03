/* =====================================================================
   «ESP32 للمعلمين ٢» · مختبرات الحساسات والمحركات
   fhero · fadc · fldr · fdht · fsonar · fpir · fservo · fmotor
   كل مختبر: مشهد حيّ (يسار) + أدوات وقراءات وكود يتلوّن سطره المنفَّذ (يمين)
   ===================================================================== */
(function () {
const { AR, codeBlock } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const raf = fn => { let id = 0, last = 0; const loop = ts => { const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; fn(dt, ts); id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); window.DECK_CLEANUP.push(() => cancelAnimationFrame(id)); };
const later = (fn, ms) => { const t = setTimeout(fn, ms); window.DECK_CLEANUP.push(() => clearTimeout(t)); return t; };
const run = (sl, arr) => sl.querySelectorAll('.fzp .code .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
const cap = (sl, t, k = '') => { const c = sl.querySelector('.fzcap'); c.innerHTML = t; c.classList.toggle('ok', k === 'ok'); c.classList.toggle('bad', k === 'bad'); };
const st = (id, lb, v = '—') => `<div class="fzst"><small>${lb}</small><b id="${id}">${v}</b></div>`;
const rng = (id, lb, min, max, v, step = 1) => `<div class="fzrow"><label>${lb}</label><input type="range" id="${id}" min="${min}" max="${max}" value="${v}" step="${step}"></div>`;
const frame = (s, cls, vb, body, panel) => `<div class="slide light fzlab ${cls}">
  <div class="fzhd">${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}<h2 class="title">${s.title}</h2></div>
  <div class="fzg"><div class="fzsc ix"><svg viewBox="${vb}">${body}</svg></div><div class="fzp ix">${panel}</div></div></div>`;
// لوحة ESP32 صغيرة بأطراف مسمّاة على جهة واحدة: تعيد الرسم ومواضع الأطراف
function mb(x, y, pins, side = 'r', h) {
  const H = h || Math.max(200, 70 + pins.length * 40), P = {};
  const g = [`<g><rect x="${x}" y="${y}" width="150" height="${H}" rx="16" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/>
    <rect x="${x + 30}" y="${y + 14}" width="90" height="34" rx="5" fill="#c9ccd3"/><text x="${x + 75}" y="${y + 37}" text-anchor="middle" class="fzt" style="font-size:16px;fill:#1b2340">ESP32</text>
    <circle cx="${x + 40}" cy="${y + H - 24}" r="6" fill="#ff3b3b"/>`];
  pins.forEach((p, i) => { const py = y + 78 + i * 40, px = side === 'r' ? x + 150 : x;
    P[p] = [px, py]; g.push(`<circle cx="${px}" cy="${py}" r="7" fill="#f0cc7a"/><text x="${side === 'r' ? px - 14 : px + 14}" y="${py + 6}" text-anchor="${side === 'r' ? 'end' : 'start'}" class="fzt" style="font-size:16px">${p}</text>`); });
  g.push('</g>'); return { svg: g.join(''), P };
}
const W = (d, c = '', id = '') => `<path ${id ? `id="${id}"` : ''} d="${d}" class="fzw ${c}"/>`;
const ledSvg = (id, x, y, c = '#ffcf4a', r = 26) => `<g transform="translate(${x} ${y})"><circle id="${id}g" r="${r * 1.9}" fill="${c}" opacity="0" style="filter:blur(12px)"/><path d="M${-r} ${r * .9} v${-r * .9} a${r} ${r} 0 0 1 ${2 * r} 0 v${r * .9} z" id="${id}" fill="#4a5170"/><rect x="${-r - 4}" y="${r * .85}" width="${2 * r + 8}" height="9" rx="3" fill="#6b7393"/></g>`;
const setLed = (sl, id, k, c = '#ffcf4a') => { sl.querySelector('#' + id).setAttribute('fill', k > .02 ? c : '#4a5170'); sl.querySelector('#' + id + 'g').setAttribute('opacity', (k * .75).toFixed(2)); };
// صوت قصير اختياري (بلا ملفات)
let AC = null;
const beep = (f = 1000, d = .06, v = .08) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.frequency.value = f; o.type = 'square'; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02); } catch (e) { } };
window.FZ = { clamp, raf, later, run, cap, st, rng, frame, mb, W, ledSvg, setLed, beep };

/* ================== الأكواد (نفس ملفات code/ تمامًا) ================== */
const C = {
  knob: `int knob = 34;
int led = 23;
void setup() {
  ledcAttach(led, 5000, 8);
}
void loop() {
  int raw = analogRead(knob);
  int mv = analogReadMilliVolts(knob);
  int bright = map(raw, 0, 4095, 0, 255);
  ledcWrite(led, bright);
  delay(50);
}`,
  ldr: `int ldr = 35;
int lamp = 23;
int threshold = 1500;
void loop() {
  int light = analogRead(ldr);
  if (light < threshold) {
    digitalWrite(lamp, HIGH);
  } else {
    digitalWrite(lamp, LOW);
  }
  delay(200);
}`,
  dht: `DHT dht(4, DHT22);
void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("تعذّرت القراءة");
    delay(2000);
    return;
  }
  digitalWrite(fan, t > limit ? HIGH : LOW);
  delay(2000);
}`,
  sonar: `digitalWrite(trig, HIGH);
delayMicroseconds(10);
digitalWrite(trig, LOW);
long us = pulseIn(echo, HIGH, 30000);
float cm = us * 0.0343 / 2;
if (cm < 50) {
  tone(buzzer, 1000, 50);
  delay(cm * 10);
}`,
  pir: `if (digitalRead(pir) == HIGH) {
  for (int i = 0; i < 6; i++) {
    digitalWrite(led, HIGH);
    ledcWriteTone(buzzer, 1800);
    delay(150);
    digitalWrite(led, LOW);
    ledcWriteTone(buzzer, 1200);
    delay(150);
  }
  ledcWriteTone(buzzer, 0);
}`,
  servo: `#include <ESP32Servo.h>
Servo gate;
void setup() {
  gate.attach(18, 500, 2400);
}
void loop() {
  if (readCm() < 20) {
    for (int a = 0; a <= 90; a += 2) {
      gate.write(a); delay(15);
    }
    delay(3000);
    for (int a = 90; a >= 0; a -= 2) {
      gate.write(a); delay(15);
    }
  }
}`,
  motor: `void drive(int speed) {
  digitalWrite(in1, speed > 0);
  digitalWrite(in2, speed < 0);
  ledcWrite(ena, abs(speed));
}
// drive(200)  ← أمامًا بسرعة ٧٨٪
// drive(-150) ← خلفًا
// drive(0)    ← توقف`,
};
window.FZ.C = C;

/* ================== الرسم ================== */
Object.assign(window.DECK_TYPES, {
  /* البطل: يحسّ ← يقرر ← يتحرك ← يتصل */
  fhero: s => `<div class="slide dark fzhero">
    <div class="kicker">${s.kicker}</div><h1 class="htitle">${s.title}</h1>
    <div class="fzhw"><svg viewBox="0 0 1600 600">
      <rect width="1600" height="600" fill="#0b1230"/>
      ${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 331) % 1600}" cy="${(i * 97) % 600}" r="${i % 3 ? 1 : 2}" fill="#7fa6ff" opacity=".35"/>`).join('')}
      ${['🎛️', '☀️', '🌡️', '📏', '🚶'].map((e, i) => `<g transform="translate(150 ${90 + i * 100})"><circle r="42" fill="#18224a" stroke="#4fc3f7" stroke-width="3"/><text y="15" text-anchor="middle" font-size="40">${e}</text></g>
        ${W(`M192 ${90 + i * 100} C 380 ${90 + i * 100}, 420 300, 600 300`, 'b', 'hs' + i)}<circle r="8" fill="#4fc3f7" class="hpk" data-k="${i}"/>`).join('')}
      <g transform="translate(600 170)"><rect width="260" height="260" rx="26" fill="#1f2a44" stroke="#5a6aa0" stroke-width="4"/><rect x="60" y="24" width="140" height="56" rx="8" fill="#c9ccd3"/>
        <text x="130" y="61" text-anchor="middle" class="fzt" style="fill:#1b2340;font-size:26px">ESP32</text><circle id="hbl" cx="70" cy="215" r="12" fill="#1e2a5b"/>
        <text x="130" y="150" text-anchor="middle" style="font-size:60px">🧠</text></g>
      ${[['⚙️', 560, 490], ['🦾', 730, 505], ['🔔', 900, 490]].map(([e, x, y], i) => `<g transform="translate(${x} ${y})"><circle r="40" fill="#18224a" stroke="#46d68c" stroke-width="3"/><text y="14" text-anchor="middle" font-size="38" class="${i === 0 ? 'fzspin' : ''}" id="ha${i}">${e}</text></g>${W(`M730 430 C 730 470, ${x} 450, ${x} ${y - 40}`, 'g')}`).join('')}
      ${[70, 120, 170, 220].map((r, i) => `<path d="M${880 + r * .2} ${300 - r} A ${r} ${r} 0 0 1 ${880 + r * .2} ${300 + r}" fill="none" stroke="#f0cc7a" stroke-width="5" class="ehwave" style="animation-delay:${i * .35}s"/>`).join('')}
      <g transform="translate(1180 70)"><rect width="250" height="470" rx="36" fill="#0f1733" stroke="#c9cfe6" stroke-width="6"/><rect x="18" y="50" width="214" height="380" rx="10" fill="#101b45"/>
        <text x="125" y="90" text-anchor="middle" class="fza" style="font-size:22px">📡 فصلي الذكي</text>
        ${[['🌡️', 'ht', '24.5°'], ['☀️', 'hl', '2310'], ['📏', 'hd', '42 سم'], ['🚶', 'hm', 'لا حركة']].map(([e, id, v], i) => `<g transform="translate(30 ${110 + i * 72})"><rect width="190" height="60" rx="12" fill="#1c2a5e"/><text x="170" y="40" text-anchor="end" font-size="28">${e}</text><text id="${id}" x="20" y="40" class="fzt" style="font-size:22px;fill:#f0cc7a">${v}</text></g>`).join('')}
        <rect x="95" y="440" width="60" height="8" rx="4" fill="#c9cfe6"/></g>
      ${['يحسّ', 'يقرر', 'يتحرك', 'يتصل'].map((v, i) => `<text x="${1440 - i * 290}" y="588" text-anchor="middle" class="fzverb" id="hv${i}">${['👁️', '🧠', '⚙️', '📡'][i]} ${v}</text>`).join('')}
    </svg></div></div>`,

  /* ١) القراءة التماثلية */
  fadc: s => { const b = mb(380, 120, ['GPIO34', '3V3', 'GND', 'GPIO23'], 'l', 260);
    return frame(s, 'fadc', '0 0 1000 560', `
      <g transform="translate(150 230)"><circle r="96" fill="#2b3566" stroke="#8d9bd0" stroke-width="5"/><g id="aknob"><circle r="70" fill="#3d4a85"/><rect x="-7" y="-74" width="14" height="46" rx="6" fill="#ffcf4a"/></g>
        <text y="140" text-anchor="middle" class="fza">مقاومة متغيرة</text><text id="av" y="-118" text-anchor="middle" class="fzt" style="font-size:28px;fill:#ffcf4a">1.65 V</text></g>
      ${W('M246 230 C 300 230, 320 198, 380 198', 'y')}${W('M150 326 C 150 360, 300 238, 380 238', 'r')}${W('M190 320 C 220 380, 320 278, 380 278', 'k')}
      ${b.svg}${W('M380 318 C 320 318, 300 470, 240 470', '', 'aw')}${ledSvg('aled', 200, 470, '#ffcf4a', 24)}
      <g transform="translate(560 90)"><rect width="410" height="210" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="12" y="26" class="fzt" style="font-size:15px;fill:#8d95b5">Serial Plotter · raw</text>
        <path id="aplot" fill="none" stroke="#4fc3f7" stroke-width="3"/><text x="402" y="24" text-anchor="end" class="fzt" style="font-size:14px;fill:#8d95b5" id="amax">4095</text></g>
      <g transform="translate(560 330)"><rect width="410" height="190" rx="14" fill="#141d3d"/><text x="205" y="34" text-anchor="middle" class="fza" style="font-size:19px">من جهد… إلى رقم… إلى سطوع</text>
        <text x="205" y="88" text-anchor="middle" class="fzt" style="font-size:22px" id="af1"></text><text x="205" y="132" text-anchor="middle" class="fzt" style="font-size:18px;fill:#ffcf4a" id="af2"></text>
        <text x="205" y="172" text-anchor="middle" class="fza" style="font-size:16px;fill:#8d95b5" id="af3"></text></g>`,
      `${rng('ak', '🎛️ أدر المقبض', 0, 330, 165)}
      <div class="fzrow"><button class="fzb on" data-m="esp">ESP32 · ١٢ بت</button><button class="fzb" data-m="uno">الأونو · ١٠ بت</button><button class="fzb" data-m="real">الحقيقة: الأطراف</button></div>
      <div class="fzstats">${st('araw', 'analogRead')}${st('amv', 'mV')}${st('apwm', 'PWM')}</div>${codeBlock(C.knob)}<div class="fzcap"></div>`); },

  /* ٢) LDR ومقسم الجهد */
  fldr: s => frame(s, 'fldr', '0 0 1000 560', `
      <rect id="lsky" width="1000" height="560" fill="#7ec8ff"/><circle id="lsun" cx="160" cy="110" r="52" fill="#ffd54a"/><text id="lmoon" x="160" y="130" text-anchor="middle" font-size="70" opacity="0">🌙</text>
      <rect y="470" width="1000" height="90" fill="#2b3048"/><rect y="510" width="1000" height="6" fill="#ffcf4a" opacity=".5"/>
      <g transform="translate(170 250)"><rect x="-8" y="0" width="16" height="225" fill="#5b6383"/><path d="M0 0 Q 0 -30 50 -30 H 90" fill="none" stroke="#5b6383" stroke-width="14"/>
        <path d="M70 -36 h50 l-10 26 h-30 z" fill="#3a4266"/><path id="lbeam" d="M75 -10 L 30 220 L 200 220 L 115 -10 z" fill="#ffe680" opacity="0"/><circle id="lbulb" cx="95" cy="-12" r="11" fill="#5b6383"/></g>
      <g transform="translate(560 40)"><rect width="410" height="410" rx="20" fill="#0f1733" opacity=".93"/>
        <text x="205" y="36" text-anchor="middle" class="fza" style="font-size:19px">مقسم الجهد</text>
        <text x="40" y="78" class="fzt" style="fill:#ffa53a">3V3</text>${W('M70 90 V110', 'o')}
        <rect x="45" y="110" width="50" height="90" rx="10" fill="#c48a3a"/><path d="M52 125 q18 10 0 20 q18 10 0 20 q18 10 0 20" stroke="#5b2d0e" stroke-width="4" fill="none"/><text x="110" y="160" class="fzt" style="font-size:17px">LDR</text><text id="lr" x="110" y="186" class="fzt" style="font-size:17px;fill:#ffcf4a"></text>
        ${W('M70 200 V235', 'o')}<circle cx="70" cy="240" r="8" fill="#4fc3f7"/>${W('M78 240 H200', 'b')}<text x="210" y="246" class="fzt" style="fill:#4fc3f7;font-size:19px">GPIO35</text><text id="lvo" x="210" y="276" class="fzt" style="fill:#ffcf4a;font-size:22px"></text>
        ${W('M70 248 V275', 'k')}<rect x="50" y="275" width="40" height="70" rx="6" fill="#d9b26f"/><text x="110" y="318" class="fzt" style="font-size:17px">10k</text>${W('M70 345 V370', 'k')}<text x="40" y="395" class="fzt" style="fill:#8d95b5">GND</text>
        <text x="205" y="360" class="fzt" style="font-size:20px" id="lraw"></text></g>`,
    `${rng('ll', '☀️ الضوء', 0, 100, 70)}${rng('lt', '🎚️ العتبة', 200, 3500, 1500, 50)}
    <div class="fzstats">${st('lrw', 'analogRead(35)')}${st('lth', 'threshold')}${st('lst', 'المصباح')}</div>${codeBlock(C.ldr)}<div class="fzcap"></div>`),

  /* ٣) DHT */
  fdht: s => { const b = mb(330, 140, ['GPIO4', '3V3', 'GND', 'GPIO19'], 'l', 250);
    return frame(s, 'fdht', '0 0 1000 560', `
      <g transform="translate(70 150)"><rect width="120" height="170" rx="14" fill="#f2f4f8"/>${Array.from({ length: 24 }, (_, i) => `<circle cx="${22 + (i % 4) * 25}" cy="${30 + Math.floor(i / 4) * 22}" r="7" fill="#c8cfdf"/>`).join('')}<text x="60" y="200" text-anchor="middle" class="fzt" style="fill:#c9cfe6">DHT22</text></g>
      ${W('M190 200 C 260 200, 270 218, 330 218', 'b', 'dwire')}${W('M190 240 C 260 240, 270 258, 330 258', 'o')}${W('M190 280 C 260 280, 270 298, 330 298', 'k')}
      <g id="dbits"></g>${b.svg}
      ${W('M330 338 C 260 338, 250 460, 180 460', '')}<g transform="translate(130 460)"><rect x="-50" y="-30" width="100" height="60" rx="10" fill="#2b6fc0"/><text y="8" text-anchor="middle" class="fzt" style="font-size:16px">Relay</text></g>
      <g transform="translate(130 460)">${W('M-50 0 H-80', 'r')}</g>
      <g transform="translate(560 320)"><circle r="110" fill="#141d3d"/><g id="dfan" class="fzspin">${[0, 120, 240].map(a => `<ellipse rx="26" ry="88" fill="#4fc3f7" opacity=".85" transform="rotate(${a}) translate(0 -50)"/>`).join('')}<circle r="22" fill="#c9cfe6"/></g><text y="150" text-anchor="middle" class="fza" id="dfl">المروحة</text></g>
      <g transform="translate(760 60)"><rect width="200" height="440" rx="20" fill="#141d3d"/><rect x="85" y="40" width="30" height="300" rx="15" fill="#2b3566"/><rect id="dmerc" x="91" y="200" width="18" height="140" rx="9" fill="#ff5a5a"/><circle cx="100" cy="360" r="34" fill="#ff5a5a"/>
        <text id="dtv" x="100" y="425" text-anchor="middle" class="fzt" style="font-size:28px;fill:#ffcf4a"></text><line id="dlim" x1="70" x2="130" stroke="#fff" stroke-width="4" stroke-dasharray="6 5"/><text id="dlt" x="140" y="0" class="fzt" style="font-size:14px"></text></g>
      <text x="560" y="90" text-anchor="middle" class="fza" style="font-size:20px" id="dnext"></text>`,
      `${rng('dt', '🌡️ الحرارة', 10, 45, 27, .5)}${rng('dh', '💧 الرطوبة', 10, 95, 55)}${rng('dl', '🎚️ حد التشغيل', 20, 40, 30, .5)}
      <div class="fzrow"><button class="fzb warn" data-a="cut">✂️ افصل سلك البيانات</button><button class="fzb" data-a="dht11">DHT11 الأزرق</button></div>
      <div class="fzstats">${st('drt', 't')}${st('drh', 'h')}${st('drf', 'fan')}</div>${codeBlock(C.dht)}<div class="fzcap"></div>`); },

  /* ٤) الموجات فوق الصوتية + مقسم Echo */
  fsonar: s => { const b = mb(40, 130, ['VIN', 'GPIO26', 'GPIO27', 'GND', 'GPIO13'], 'r', 300);
    return frame(s, 'fsonar', '0 0 1000 560', `
      ${b.svg}<g transform="translate(330 150)"><rect width="110" height="150" rx="10" fill="#2b6fc0"/><circle cx="55" cy="40" r="28" fill="#c9cfe6"/><circle cx="55" cy="110" r="28" fill="#c9cfe6"/><circle cx="55" cy="40" r="16" fill="#5b6383"/><circle cx="55" cy="110" r="16" fill="#5b6383"/><text x="55" y="178" text-anchor="middle" class="fzt" style="font-size:15px">HC-SR04</text></g>
      ${W('M190 208 C 260 208, 270 170, 330 170', 'r')}${W('M190 248 C 260 248, 270 200, 330 200', 'b')}${W('M190 328 C 260 328, 270 270, 330 270', 'k')}
      <g id="sdiv"><path d="M330 240 C 300 240, 300 300, 270 300" class="fzw y"/><rect x="250" y="300" width="40" height="22" rx="4" fill="#d9b26f"/><text x="300" y="317" class="fzt" style="font-size:13px">1k</text>
        <circle cx="270" cy="345" r="6" fill="#4fc3f7"/>${W('M270 322 V340')}${W('M264 345 C 230 345, 220 288, 190 288', 'b')}${W('M270 350 V372')}<rect x="250" y="372" width="40" height="22" rx="4" fill="#d9b26f"/><text x="300" y="389" class="fzt" style="font-size:13px">2k</text>${W('M270 394 V420', 'k')}
        <text id="sev" x="200" y="410" class="fzt" style="font-size:18px;fill:#46d68c">3.3V ✓</text></g>
      <g id="sraw" class="fzhide">${W('M330 240 C 260 240, 250 288, 190 288', 'r')}<text x="200" y="410" class="fzt fzblink" style="font-size:20px;fill:#ff5a5a">5V ⚠</text></g>
      <g id="swaves"></g><rect id="swall" x="900" y="100" width="40" height="260" rx="6" fill="#a9b2c9"/><text id="scm" x="700" y="460" text-anchor="middle" class="fzt" style="font-size:40px;fill:#ffcf4a"></text>
      <text x="700" y="500" text-anchor="middle" class="fza" style="font-size:18px" id="sus"></text>
      <g id="sbz" transform="translate(110 480)"><circle r="30" fill="#1c1f27" stroke="#5b6383" stroke-width="3"/><circle r="8" fill="#5b6383"/><text x="45" y="8" class="fzt" style="font-size:16px">13</text></g>`,
      `${rng('sd', '🧱 بُعد الجدار (سم)', 3, 200, 80)}
      <div class="fzrow"><button class="fzb warn" data-a="nodiv">⚠️ Echo بلا مقسم جهد</button><button class="fzb" data-a="snd">🔊 الصوت</button></div>
      <div class="fzstats">${st('sus2', 'pulseIn (µs)')}${st('scm2', 'cm')}${st('sbeep', 'كل (ms)')}</div>${codeBlock(C.sonar)}<div class="fzcap"></div>`); },

  /* ٥) PIR والبازر */
  fpir: s => frame(s, 'fpir', '0 0 1000 560', `
      <rect x="40" y="30" width="620" height="500" rx="18" fill="#141d3d" stroke="#2b3566" stroke-width="4"/>
      ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${110 + c * 130}" y="${250 + r * 65}" width="90" height="40" rx="6" fill="#26315a"/>`).join('')).join('')}
      <path id="pcone" d="M350 60 L 90 520 L 610 520 Z" fill="#4fc3f7" opacity=".12"/>
      ${[0, 1, 2, 3, 4].map(i => `<path d="M350 60 L ${90 + i * 104} 520 L ${142 + i * 104} 520 Z" fill="none" stroke="#4fc3f7" stroke-opacity=".25" stroke-width="2"/>`).join('')}
      <g transform="translate(350 60)"><circle r="30" fill="#f2f4f8"/><circle r="18" fill="#dfe3ee" stroke="#b9c0d3"/><text x="40" y="8" class="fzt" style="font-size:16px">PIR · 33</text></g>
      <text id="pman" x="120" y="200" text-anchor="middle" font-size="64">🚶</text>
      <g transform="translate(830 130)"><circle r="70" fill="#1c1f27" stroke="#5b6383" stroke-width="4"/><circle r="22" fill="#5b6383" id="pbz"/><text y="110" text-anchor="middle" class="fza">البازر · 13</text>
        <g id="pwaves" opacity="0">${[90, 115, 140].map(r => `<circle r="${r}" fill="none" stroke="#ff5a5a" stroke-width="5"/>`).join('')}</g></g>
      ${ledSvg('pled', 830, 360, '#ff3b3b', 30)}<text x="830" y="440" text-anchor="middle" class="fza">ليد · 23</text>
      <g transform="translate(700 470)"><rect width="270" height="60" rx="12" fill="#0b1230"/><text id="pout" x="135" y="40" text-anchor="middle" class="fzt" style="font-size:22px">OUT = LOW</text></g>
      <g id="pnotes" opacity="0">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect class="pn" x="${700 + i * 34}" y="300" width="26" height="10" rx="4" fill="#ffcf4a"/>`).join('')}</g>`,
    `${rng('px', '🚶 مكان الشخص', 0, 100, 10)}
    <div class="fzrow"><button class="fzb go" data-a="walk">🚶 امشِ عبر الفصل</button><button class="fzb" data-a="still">🧍 قف ساكنًا</button><button class="fzb" data-a="mel">🎵 شغّل اللحن</button></div>
    <div class="fzstats">${st('pst', 'digitalRead(33)')}${st('phold', 'يبقى HIGH')}${st('pcnt', 'مرات الكشف', 0)}</div>${codeBlock(C.pir)}<div class="fzcap"></div>`),

  /* ٦) السيرفو والبوابة */
  fservo: s => frame(s, 'fservo', '0 0 1000 560', `
      <g transform="translate(240 200)"><rect x="-90" y="-60" width="180" height="120" rx="12" fill="#2b6fc0"/><rect x="-110" y="-12" width="220" height="24" rx="6" fill="#2563a8"/>
        <circle r="34" fill="#f2f4f8"/><g id="shorn"><rect x="-10" y="-130" width="20" height="130" rx="10" fill="#f2f4f8"/><circle cy="-115" r="7" fill="#c9cfe6"/></g><circle r="10" fill="#9aa3bd"/>
        <text y="95" text-anchor="middle" class="fzt" style="font-size:18px">Servo · GPIO18</text><text id="sang" y="-150" text-anchor="middle" class="fzt" style="font-size:30px;fill:#ffcf4a">90°</text></g>
      <g transform="translate(40 330)"><rect width="460" height="190" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="12" y="26" class="fzt" style="font-size:14px;fill:#8d95b5">الإشارة: نبضة كل 20 مللي ثانية</text>
        <path id="spw" fill="none" stroke="#46d68c" stroke-width="4"/><text id="spl" x="230" y="178" text-anchor="middle" class="fzt" style="font-size:18px;fill:#46d68c"></text></g>
      <g transform="translate(560 40)"><rect width="410" height="480" rx="18" fill="#141d3d"/><text x="205" y="34" text-anchor="middle" class="fza" style="font-size:19px">البوابة الذكية</text>
        <rect x="0" y="330" width="410" height="90" fill="#2b3048"/><rect x="50" y="250" width="22" height="80" fill="#9aa3bd"/>
        <g id="sgate" transform="translate(61 260)"><rect x="0" y="-8" width="300" height="16" rx="6" fill="#ff5a5a"/>${[1, 2, 3, 4].map(i => `<rect x="${i * 60}" y="-8" width="25" height="16" fill="#fff"/>`).join('')}</g>
        <text id="scar" x="460" y="390" font-size="62">🚗</text><g transform="translate(330 200)"><rect width="56" height="34" rx="6" fill="#2b6fc0"/><text x="28" y="23" text-anchor="middle" class="fzt" style="font-size:12px">SR04</text></g>
        <text id="sgcm" x="205" y="460" text-anchor="middle" class="fzt" style="font-size:20px;fill:#ffcf4a"></text></g>`,
    `${rng('sa', '🦾 الزاوية', 0, 180, 90)}
    <div class="fzrow"><button class="fzb go" data-a="car">🚗 سيارة تقترب</button><button class="fzb" data-a="sw">↔️ مسح ٠–١٨٠</button></div>
    <div class="fzstats">${st('sdeg', 'write()')}${st('sus', 'النبضة µs')}${st('sduty', 'من الدورة')}</div>${codeBlock(C.servo)}<div class="fzcap"></div>`),

  /* ٧) محرك DC وجسر H */
  fmotor: s => frame(s, 'fmotor', '0 0 1000 560', `
      <text x="300" y="44" text-anchor="middle" class="fzt" style="fill:#ff7b6b">+12V</text>${W('M120 60 H480', 'r')}${W('M120 500 H480', 'k')}<text x="300" y="535" text-anchor="middle" class="fzt" style="fill:#8d95b5">GND</text>
      ${[['q1', 120, 60, 'S1'], ['q2', 480, 60, 'S2'], ['q3', 120, 330, 'S3'], ['q4', 480, 330, 'S4']].map(([id, x, y, t]) => `<g><path d="M${x} ${y} V${y + 70}" class="fzw" id="${id}a"/><g id="${id}" transform="translate(${x} ${y + 70})"><line x1="0" y1="0" x2="34" y2="-60" stroke="#c9cfe6" stroke-width="7" stroke-linecap="round" id="${id}k"/><circle r="8" fill="#c9cfe6"/></g>
        <path d="M${x} ${y + 100} V${y + 170}" class="fzw" id="${id}b"/><circle cx="${x}" cy="${y + 100}" r="8" fill="#c9cfe6"/><text x="${x + (x < 300 ? -30 : 30)}" y="${y + 95}" text-anchor="middle" class="fzt" style="font-size:16px">${t}</text></g>`).join('')}
      ${W('M120 230 V330')}${W('M480 230 V330')}${W('M120 280 H230', '', 'mwl')}${W('M370 280 H480', '', 'mwr')}
      <g transform="translate(300 280)"><circle r="70" fill="#2b3566" stroke="#8d9bd0" stroke-width="5"/><g id="mrot" class="fzspin"><circle r="52" fill="#3d4a85"/>${[0, 60, 120, 180, 240, 300].map(a => `<rect x="-5" y="-50" width="10" height="26" rx="4" fill="#ffcf4a" transform="rotate(${a})"/>`).join('')}</g><text y="8" text-anchor="middle" class="fzt" style="font-size:22px">M</text></g>
      <g id="mflow"></g>
      <g transform="translate(580 70)"><rect width="390" height="430" rx="18" fill="#141d3d"/><rect x="20" y="20" width="350" height="70" rx="10" fill="#c0392b"/><text x="195" y="64" text-anchor="middle" class="fzt" style="font-size:24px">L298N</text>
        ${[['ENA · 14', 'mena'], ['IN1 · 16', 'min1'], ['IN2 · 17', 'min2']].map(([t, id], i) => `<text x="40" y="${140 + i * 52}" class="fzt" style="font-size:20px">${t}</text><rect x="220" y="${118 + i * 52}" width="130" height="34" rx="8" fill="#0b1230"/><text id="${id}" x="285" y="${142 + i * 52}" text-anchor="middle" class="fzt" style="font-size:19px;fill:#ffcf4a">LOW</text>`).join('')}
        <text x="195" y="320" text-anchor="middle" class="fza" style="font-size:20px" id="mdir"></text><text x="195" y="370" text-anchor="middle" class="fzt" style="font-size:20px;fill:#46d68c" id="mvolt"></text>
        <text x="195" y="410" text-anchor="middle" class="fza" style="font-size:15px;fill:#8d95b5">الدرايفر يستهلك نحو ٢ فولت</text></g>`,
    `${rng('ms', '⚡ drive(speed)', -255, 255, 0, 5)}
    <div class="fzrow"><button class="fzb go" data-a="f">⬆️ أمامًا</button><button class="fzb" data-a="s">⏹️ قف</button><button class="fzb" data-a="b">⬇️ خلفًا</button><button class="fzb warn" data-a="x">⚠️ S1+S3 معًا</button></div>
    <div class="fzstats">${st('mspd', 'speed')}${st('mpct', 'السرعة')}${st('mrpm', 'الاتجاه')}</div>${codeBlock(C.motor)}<div class="fzcap"></div>`),
});

/* ================== السلوك ================== */
Object.assign(window.DECK_BIND, {
  fhero(sl) {
    const V = [0, 1, 2, 3].map(i => sl.querySelector('#hv' + i)), pk = [...sl.querySelectorAll('.hpk')], paths = pk.map((_, i) => sl.querySelector('#hs' + i));
    const L = paths.map(p => p.getTotalLength());
    raf((dt, ts) => { const k = Math.floor(ts / 1600) % 4; V.forEach((v, i) => v.classList.toggle('on', i === k));
      pk.forEach((c, i) => { const pt = paths[i].getPointAtLength(((ts / 1400 + i * .2) % 1) * L[i]); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); });
      sl.querySelector('#hbl').setAttribute('fill', Math.floor(ts / 400) % 2 ? '#3b82ff' : '#1e2a5b');
      sl.querySelector('#ha0').setAttribute('transform', `rotate(${ts / 6})`);
      if (Math.floor(ts / 50) % 20 === 0) { sl.querySelector('#ht').textContent = (24 + Math.sin(ts / 3000) * 2).toFixed(1) + '°'; sl.querySelector('#hl').textContent = Math.round(2300 + Math.sin(ts / 2000) * 600);
        sl.querySelector('#hd').textContent = Math.round(40 + Math.sin(ts / 1700) * 25) + ' سم'; sl.querySelector('#hm').textContent = Math.sin(ts / 2500) > .4 ? '🚨 حركة!' : 'لا حركة'; } });
  },

  fadc(sl) {
    let mode = 'esp'; const H = [], k = sl.querySelector('#ak');
    sl.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; sl.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    const calc = v => { if (mode === 'uno') { const V = v / 3.3 * 5; return { V, raw: Math.round(V / 5 * 1023), max: 1023, mv: Math.round(V * 1000) }; }
      const raw = mode === 'real' ? Math.round(clamp((v - .14) / (3.1 - .14), 0, 1) * 4095) : Math.round(v / 3.3 * 4095); return { V: v, raw, max: 4095, mv: Math.round(v * 1000) }; };
    let cur;
    const upd = () => { const v = k.value / 100; cur = calc(v); const pwm = Math.round(cur.raw / cur.max * 255);
      sl.querySelector('#aknob').setAttribute('transform', `rotate(${-135 + 270 * v / 3.3})`); sl.querySelector('#av').textContent = cur.V.toFixed(2) + ' V';
      sl.querySelector('#araw').textContent = cur.raw; sl.querySelector('#amv').textContent = cur.mv; sl.querySelector('#apwm').textContent = pwm; sl.querySelector('#amax').textContent = cur.max;
      setLed(sl, 'aled', pwm / 255); sl.querySelector('#aw').classList.toggle('y', pwm > 0);
      sl.querySelector('#af1').textContent = `${cur.V.toFixed(2)} V → ${cur.raw}`; sl.querySelector('#af2').textContent = `map(${cur.raw}, 0, ${cur.max}, 0, 255) = ${pwm}`;
      sl.querySelector('#af3').textContent = mode === 'uno' ? 'الأونو: ٥ فولت و١٠٢٤ درجة' : 'ESP32: ٣٫٣ فولت و٤٠٩٦ درجة — أدق بأربع مرات';
      run(sl, [7, 8, 9, 10]);
      cap(sl, mode === 'real' ? (cur.raw === 0 && v > 0 ? 'الحقيقة: تحت ٠٫١٤ فولت تقريبًا يقرأ ESP32 صفرًا! لذلك نستعمل <code>analogReadMilliVolts</code> للجهد الدقيق' : cur.raw === 4095 && v < 3.3 ? 'الحقيقة: فوق ٣٫١ فولت تقريبًا يتشبّع القارئ عند ٤٠٩٥. المنطقة الوسطى هي الأدق' : 'في المنطقة الوسطى القراءة دقيقة. عند الطرفين تختلف قليلًا عن الحساب النظري') :
        mode === 'uno' ? `الأونو يقرأ نفس الدوران بأرقام ٠–١٠٢٣. لهذا لا تنسخ أكواد الأونو كما هي: غيّر 1023 إلى <b>4095</b> في map` : `${cur.V.toFixed(2)} فولت ← الرقم ${cur.raw} من ٤٠٩٥ ← map تحوّله إلى ${pwm} من ٢٥٥ ← سطوع الليد`, mode === 'uno' ? 'bad' : ''); };
    k.oninput = upd; upd();
    let acc = 0; raf(dt => { acc += dt; if (acc < .05) return; acc = 0; H.push(cur.raw / cur.max + (Math.random() - .5) * .006); if (H.length > 90) H.shift();
      sl.querySelector('#aplot').setAttribute('d', 'M' + H.map((h, i) => `${10 + i * 390 / 89} ${200 - clamp(h, 0, 1) * 160}`).join(' L')); });
    sl.querySelector('#af3').textContent = '';
  },

  fldr(sl) {
    const L = sl.querySelector('#ll'), T = sl.querySelector('#lt');
    const upd = () => { const lux = L.value / 100, R = Math.round(200000 * Math.pow(0.005, lux)), vo = 3.3 * 10000 / (R + 10000), raw = Math.round(vo / 3.3 * 4095), th = +T.value, on = raw < th;
      const sky = [Math.round(14 + 112 * lux), Math.round(20 + 180 * lux), Math.round(48 + 207 * lux)];
      sl.querySelector('#lsky').setAttribute('fill', `rgb(${sky})`); sl.querySelector('#lsun').setAttribute('opacity', lux); sl.querySelector('#lsun').setAttribute('cy', 110 + (1 - lux) * 120); sl.querySelector('#lmoon').setAttribute('opacity', 1 - lux);
      sl.querySelector('#lbeam').setAttribute('opacity', on ? .55 : 0); sl.querySelector('#lbulb').setAttribute('fill', on ? '#ffe680' : '#5b6383');
      sl.querySelector('#lr').textContent = R >= 1000 ? Math.round(R / 1000) + 'kΩ' : R + 'Ω'; sl.querySelector('#lvo').textContent = vo.toFixed(2) + ' V'; sl.querySelector('#lraw').textContent = '→ ' + raw;
      sl.querySelector('#lrw').textContent = raw; sl.querySelector('#lth').textContent = th; sl.querySelector('#lst').textContent = on ? 'ON' : 'OFF';
      run(sl, [5, 6, on ? 7 : 9]);
      cap(sl, on ? `${raw} أقل من العتبة ${th} ← ظلام ← المصباح يضيء ✓` : `${raw} أكبر من العتبة ${th} ← نهار ← المصباح مطفأ. في الظلام تكبر مقاومة LDR فيقل الجهد على 35`, on ? 'ok' : ''); };
    L.oninput = T.oninput = upd; upd();
  },

  fdht(sl) {
    let cut = false, d11 = false, t = 27, h = 55, next = 2, shown = { t: null, h: null };
    const R = id => sl.querySelector('#' + id);
    sl.querySelector('[data-a=cut]').onclick = e => { cut = !cut; e.target.classList.toggle('on', cut); R('dwire').style.opacity = cut ? .15 : 1; };
    sl.querySelector('[data-a=dht11]').onclick = e => { d11 = !d11; e.target.classList.toggle('on', d11); };
    const read = () => { t = +R('dt').value; h = +R('dh').value; const lim = +R('dl').value;
      if (cut) { shown = { t: NaN, h: NaN }; R('drt').textContent = 'nan'; R('drh').textContent = 'nan'; run(sl, [3, 4, 5, 6, 7, 8]); cap(sl, 'لا بيانات تصل ← القراءة <code>nan</code> (ليست رقمًا) ← الكود يطبع «تعذّرت القراءة» ويحاول بعد ثانيتين، ولا يتخذ قرارًا خاطئًا', 'bad'); return; }
      const tt = d11 ? Math.round(t) : Math.round(t * 10) / 10, hh = Math.round(h); shown = { t: tt, h: hh }; const on = tt > lim;
      R('drt').textContent = d11 ? tt : tt.toFixed(1); R('drh').textContent = hh; R('drf').textContent = on ? 'ON' : 'OFF'; R('dfl').textContent = on ? 'المروحة تعمل' : 'المروحة متوقفة';
      run(sl, [3, 4, 10]); cap(sl, `قرأ ${tt}° و${hh}٪ ${on ? `← أعلى من ${lim}° ← المروحة تعمل ✓` : `← ليست أعلى من ${lim}° ← المروحة متوقفة`}${d11 ? ' (DHT11 يقرأ أعدادًا صحيحة فقط)' : ''}`, on ? 'ok' : '');
      const bits = R('dbits'); bits.innerHTML = Array.from({ length: 40 }, (_, i) => `<rect x="${195 + i * 3.2}" y="${Math.random() < .5 ? 186 : 192}" width="2.4" height="${Math.random() < .5 ? 10 : 4}" fill="#4fc3f7"/>`).join(''); later(() => bits.innerHTML = '', 600); };
    let ang = 0;
    raf(dt => { next -= dt; if (next <= 0) { next = 2; read(); } R('dnext').textContent = `القراءة التالية بعد ${next.toFixed(1)} ث`;
      const v = +R('dt').value, lim = +R('dl').value; R('dmerc').setAttribute('y', 340 - (v - 5) / 45 * 300); R('dmerc').setAttribute('height', (v - 5) / 45 * 300); R('dtv').textContent = v.toFixed(1) + '°';
      const ly = 340 - (lim - 5) / 45 * 300; R('dlim').setAttribute('y1', ly); R('dlim').setAttribute('y2', ly); R('dlt').setAttribute('y', ly + 5); R('dlt').textContent = lim + '°';
      const on = shown.t > lim; ang += dt * (on ? 720 : 0); R('dfan').setAttribute('transform', `rotate(${ang})`); });
    read();
  },

  fsonar(sl) {
    let nodiv = false, snd = false, t = 0, lastBeep = 0;
    const R = id => sl.querySelector('#' + id), D = R('sd');
    sl.querySelector('[data-a=nodiv]').onclick = e => { nodiv = !nodiv; e.target.classList.toggle('on', nodiv); R('sdiv').classList.toggle('fzhide', nodiv); R('sraw').classList.toggle('fzhide', !nodiv); upd(); };
    sl.querySelector('[data-a=snd]').onclick = e => { snd = !snd; e.target.classList.toggle('on', snd); };
    const upd = () => { const cm = +D.value, us = Math.round(cm * 2 / .0343), x = 440 + cm * 2.3;
      R('swall').setAttribute('x', Math.min(x, 950)); R('scm').textContent = cm + ' سم'; R('sus').textContent = `الذهاب والعودة: ${us} ميكروثانية`;
      R('sus2').textContent = us; R('scm2').textContent = cm; R('sbeep').textContent = cm < 50 ? cm * 10 : '—';
      run(sl, cm < 50 ? [4, 5, 6, 7, 8] : [4, 5, 6]);
      cap(sl, nodiv ? 'خطر! Echo يُخرج ٥ فولت مباشرة إلى GPIO27 والحد الأقصى ٣٫٦ فولت. قد يعمل اليوم… ويتلف الطرف غدًا. المقسم 1k و2k يجعلها ٣٫٣ ✓' :
        cm < 50 ? `${us} ÷ ٢ × ٠٫٠٣٤٣ = ${cm} سم ← أقرب من ٥٠ ← تنبيه كل ${cm * 10} مللي ثانية: كلما اقترب تسارعت النغمات` : `${us} ميكروثانية ← ${cm} سم: بعيد، لا تنبيه`, nodiv ? 'bad' : cm < 50 ? 'ok' : ''); };
    D.oninput = upd; upd();
    raf((dt, ts) => { const cm = +D.value, wx = Math.min(440 + cm * 2.3, 950); t += dt;
      const per = .9, p = (t % per) / per, go = p < .5, px = go ? 440 + (wx - 440) * p * 2 : wx - (wx - 440) * (p - .5) * 2, y = go ? 190 : 260;
      R('swaves').innerHTML = [0, 1, 2].map(i => `<path d="M${px - i * 14} ${y - 26} q ${go ? 14 : -14} 26 0 52" fill="none" stroke="${go ? '#4fc3f7' : '#46d68c'}" stroke-width="5" opacity="${1 - i * .3}"/>`).join('');
      if (cm < 50 && ts - lastBeep > Math.max(60, cm * 10)) { lastBeep = ts; R('sbz').querySelector('circle:nth-child(2)').setAttribute('fill', '#ffcf4a'); later(() => R('sbz').querySelector('circle:nth-child(2)').setAttribute('fill', '#5b6383'), 60); if (snd) beep(1000, .05); } });
  },

  fpir(sl) {
    let walk = false, hold = 0, cnt = 0, prevX = 10, still = 0, mel = -1, melT = 0;
    const R = id => sl.querySelector('#' + id), X = R('px');
    sl.querySelector('[data-a=walk]').onclick = () => { walk = true; };
    sl.querySelector('[data-a=still]').onclick = () => { walk = false; };
    sl.querySelector('[data-a=mel]').onclick = () => { mel = 0; melT = 0; R('pnotes').setAttribute('opacity', 1); };
    const NOTES = [262, 294, 330, 349, 392, 392, 440, 392], BEATS = [300, 300, 300, 300, 600, 300, 300, 900];
    let dir = 1, siren = 0;
    raf((dt, ts) => {
      if (walk) { let v = +X.value + dir * dt * 22; if (v > 100 || v < 0) { dir *= -1; v = clamp(v, 0, 100); } X.value = v; }
      const x = +X.value, px = 90 + x * 5.2, moving = Math.abs(x - prevX) > .01; prevX = x;
      R('pman').setAttribute('x', px); R('pman').setAttribute('y', 330 + Math.sin(ts / 150) * (moving ? 6 : 0));
      const zone = Math.floor(x / 20);
      if (moving) { if (hold <= 0) cnt++; hold = 3; } else hold = Math.max(0, hold - dt);
      const hi = hold > 0;
      R('pout').textContent = hi ? 'OUT = HIGH' : 'OUT = LOW'; R('pout').style.fill = hi ? '#ff7b6b' : '#dfe6ff'; R('pcone').setAttribute('opacity', hi ? .28 : .12);
      R('pst').textContent = hi ? 'HIGH' : 'LOW'; R('phold').textContent = hi ? hold.toFixed(1) + 's' : '—'; R('pcnt').textContent = cnt;
      siren += dt; const hiTone = Math.floor(siren / .15) % 2 === 0;
      setLed(sl, 'pled', hi && hiTone ? 1 : 0, '#ff3b3b'); R('pwaves').setAttribute('opacity', hi ? (hiTone ? 1 : .4) : 0); R('pbz').setAttribute('fill', hi ? '#ff5a5a' : '#5b6383');
      if (mel >= 0) { melT += dt * 1000; if (melT > BEATS[mel]) { melT = 0; mel++; }
        if (mel >= NOTES.length) { mel = -1; R('pnotes').setAttribute('opacity', 0); }
        else { sl.querySelectorAll('.pn').forEach((n, i) => { n.setAttribute('y', 300 - (i === mel ? (NOTES[i] - 240) / 1.3 : 0)); n.setAttribute('fill', i === mel ? '#ff7b6b' : '#ffcf4a'); }); if (melT === 0 || melT < dt * 1000 + 1) beep(NOTES[mel], BEATS[mel] / 1000 * .85, .06); } }
      run(sl, hi ? [1, 2, 3, 4, 6, 7] : [1]);
      if (mel >= 0) cap(sl, `اللحن: النغمة ${mel + 1} من ٨ = ${NOTES[mel]} هرتز لمدة ${BEATS[mel]} مللي ثانية — <code>ledcWriteTone(buzzer, ${NOTES[mel]})</code>`, 'ok');
      else cap(sl, hi ? `حرارة جسم تتحرك عبر مناطق العدسة ← OUT = HIGH لثلاث ثوانٍ ← الإنذار: صفارة ١٨٠٠ ثم ١٢٠٠ هرتز` : `الشخص ${walk ? 'يتحرك' : 'ساكن'}… PIR لا يرى الأجسام، بل يرى <b>تغيّر</b> الحرارة بين مناطقه. الساكن تمامًا لا يُكشف`, hi ? 'bad' : '');
    });
  },

  fservo(sl) {
    const R = id => sl.querySelector('#' + id), A = R('sa');
    let target = 90, cur = 90, car = -1, carT = 0, sweep = false, sw = 0;
    const draw = a => { R('shorn').setAttribute('transform', `rotate(${a - 90})`); R('sang').textContent = Math.round(a) + '°';
      const us = Math.round(500 + a / 180 * 1900); R('sdeg').textContent = Math.round(a); R('sus').textContent = us; R('sduty').textContent = (us / 200).toFixed(1) + '%';
      const pw = us / 20000 * 440; let p = 'M10 160'; for (let k = 0; k < 2; k++) { const x0 = 10 + k * 220; p += ` H${x0 + 20} V60 H${x0 + 20 + pw * 4} V160 H${x0 + 220}`; } R('spw').setAttribute('d', p);
      R('spl').textContent = `${us} µs ≈ ${(us / 1000).toFixed(2)} ms → ${Math.round(a)}°`;
      R('sgate').setAttribute('transform', `translate(61 260) rotate(${-a})`); };
    A.oninput = () => { sweep = false; car = -1; target = +A.value; };
    sl.querySelector('[data-a=car]').onclick = () => { sweep = false; car = 0; carT = 0; };
    sl.querySelector('[data-a=sw]').onclick = () => { car = -1; sweep = true; sw = 0; };
    raf(dt => {
      if (sweep) { sw += dt; target = 90 - 90 * Math.cos(sw * 1.5); A.value = target; }
      if (car >= 0) { carT += dt; let cx;
        if (car === 0) { cx = 470 - carT * 120; if (cx <= 360) { car = 1; carT = 0; } target = 0; }
        else if (car === 1) { cx = 360; target = Math.min(90, carT * 133); if (carT > 3.2) { car = 2; carT = 0; } }
        else { cx = 360 - carT * 160; target = carT < 1 ? 90 : Math.max(0, 90 - (carT - 1) * 133); if (cx < -80) { car = -1; target = 0; } }
        R('scar').setAttribute('x', cx); const d = Math.max(3, Math.round((cx - 330) / 4)); R('sgcm').textContent = car >= 0 ? `readCm() = ${car === 0 ? d : car === 1 ? 12 : 999} سم` : '';
        A.value = target; run(sl, car === 1 ? [7, 8, 9] : car === 2 ? [12, 13, 14] : [7]);
        cap(sl, car === 0 ? 'سيارة تقترب… الحساس يقيس المسافة باستمرار' : car === 1 ? 'أقل من ٢٠ سم ← حلقة for ترفع الذراع درجتين كل ١٥ مللي ثانية: فتح ناعم بلا قفزة' : 'بعد ٣ ثوانٍ تُغلق البوابة بالنعومة نفسها', 'ok'); }
      cur += (target - cur) * Math.min(1, dt * 10); draw(cur);
      if (car < 0) { run(sl, [4]); cap(sl, `<code>gate.write(${Math.round(cur)})</code> ← نبضة ${Math.round(500 + cur / 180 * 1900)} ميكروثانية كل ٢٠ مللي ثانية. النبضة الأعرض = زاوية أكبر`, ''); }
    });
  },

  fmotor(sl) {
    const R = id => sl.querySelector('#' + id), S = R('ms'); let short = false, ang = 0;
    const sw = (id, on) => { R(id + 'k').setAttribute('x2', on ? 0 : 34); R(id + 'k').setAttribute('y2', -60 + (on ? -0 : 0)); R(id + 'k').setAttribute('stroke', on ? '#46d68c' : '#c9cfe6'); ['a', 'b'].forEach(z => R(id + z).classList.toggle('y', on)); };
    sl.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { short = b.dataset.a === 'x'; S.value = { f: 200, s: 0, b: -200, x: 0 }[b.dataset.a]; upd(); });
    S.oninput = () => { short = false; upd(); };
    let speed = 0;
    const upd = () => { speed = +S.value; const fw = speed > 0, bw = speed < 0, pct = Math.round(Math.abs(speed) / 255 * 100);
      if (short) { ['q1', 'q3'].forEach(q => sw(q, true)); ['q2', 'q4'].forEach(q => sw(q, false)); R('mdir').textContent = '💥 تماس! البطارية موصولة بالأرضي مباشرة'; R('mdir').style.fill = '#ff5a5a';
        cap(sl, 'S1 وS3 في الجهة نفسها معًا = طريق مباشر من +12V إلى GND بلا محرك: تيار هائل يحرق الدرايفر. لهذا نكتب الاتجاه بـ IN1 وIN2 فقط، والدرايفر يمنع هذه الحالة', 'bad'); R('mvolt').textContent = ''; return; }
      R('mdir').style.fill = '';
      sw('q1', fw); sw('q4', fw); sw('q2', bw); sw('q3', bw);
      R('min1').textContent = fw ? 'HIGH' : 'LOW'; R('min2').textContent = bw ? 'HIGH' : 'LOW'; R('mena').textContent = Math.abs(speed);
      R('mwl').classList.toggle('y', speed !== 0); R('mwr').classList.toggle('y', speed !== 0);
      R('mspd').textContent = speed; R('mpct').textContent = pct + '%'; R('mrpm').textContent = fw ? '⟳' : bw ? '⟲' : '■';
      R('mdir').textContent = fw ? 'S1 وS4 مغلقان ← التيار يمر يمينًا ← أمامًا' : bw ? 'S2 وS3 مغلقان ← التيار يمر يسارًا ← خلفًا' : 'كل المفاتيح مفتوحة ← المحرك متوقف';
      R('mvolt').textContent = speed ? `≈ ${(10 * pct / 100).toFixed(1)} V تصل إلى المحرك` : '';
      run(sl, [2, 3, 4]);
      cap(sl, speed ? `drive(${speed}): IN1=${fw ? 'HIGH' : 'LOW'} وIN2=${bw ? 'HIGH' : 'LOW'} يحددان الاتجاه، وENA=${Math.abs(speed)} (PWM) يحدد السرعة ${pct}٪` : 'drive(0): IN1 وIN2 كلاهما LOW وENA=0 ← المحرك يتوقف', speed ? 'ok' : ''); };
    upd();
    raf(dt => { ang += dt * speed * 3; R('mrot').setAttribute('transform', `rotate(${ang})`); });
  },
});
})();
