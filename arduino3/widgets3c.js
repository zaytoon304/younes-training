/* =====================================================================
   أكاديمية سيارة الروبوت — المرحلة الثالثة: روبوت الجوال وروبوت تتبع الخط
   الأنواع: btlab (جوال يقود السيارة بالبلوتوث) · linelab (حلبة تتبع الخط بحساسين/ثلاثة/خمسة)
   دوائر البناء: btwire (HC-05 مع مقسم جهد) · linewire (ثلاثة حساسات IR)
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, col, pinX, botX, base, wire } = window.ARD2;
const { miniCar } = window.ARD3;
const f1 = v => AR((Math.round(v * 10) / 10).toFixed(1)).replace('.', '٫');

/* ================== روبوت الجوال ================== */
const BT_CODE = `#include <SoftwareSerial.h>
SoftwareSerial bt(2, 3);
int speed = 200;

void setup() {
  bt.begin(9600);
  for (int p = 5; p <= 10; p++) pinMode(p, OUTPUT);
}

void loop() {
  if (bt.available()) {
    char c = bt.read();
    if (c == 'F') drive(speed, speed);
    if (c == 'B') drive(-speed, -speed);
    if (c == 'L') drive(-speed, speed);
    if (c == 'R') drive(speed, -speed);
    if (c == 'S') drive(0, 0);
    if (c >= '0' && c <= '9') speed = 100 + (c - '0') * 17;
  }
}`;
const BT_LINE = { F: 13, B: 14, L: 15, R: 16, S: 17 };
const BW = 760, BH = 520;
const btArena = () => `<svg viewBox="0 0 ${BW} ${BH}" class="btarena">
  <defs><pattern id="btt" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f4f0e6"/><path d="M40 0 L0 0 0 40" fill="none" stroke="#e3dccb" stroke-width="2"/></pattern></defs>
  <rect width="${BW}" height="${BH}" fill="url(#btt)"/><rect x="4" y="4" width="${BW - 8}" height="${BH - 8}" rx="12" class="dwall"/>
  ${[[180, 140], [380, 300], [560, 150], [580, 400], [200, 400]].map(([x, y]) => `<g class="cone"><path d="M${x} ${y - 26} L${x + 18} ${y + 18} L${x - 18} ${y + 18} Z"/><rect x="${x - 22}" y="${y + 14}" width="44" height="8" rx="3"/></g>`).join('')}
  <path id="bttrail" class="dtrail" d=""/>
  <g id="btcar"><g transform="scale(1.2)">${miniCar('bt')}</g><g id="btpkt" class="btpkt"><circle r="22"/><text y="9"></text></g></g>
</svg>`;

/* ================== حلبة تتبع الخط ================== */
const LW = 1000, LH = 560, LPX = 3, LWB = 13 * LPX, LINE = 18;     // ٣ بكسل لكل سم · عرض الخط على الشاشة
const TRACKS = [
  { name: 'حلبة التدريب', f: t => [500 + 360 * Math.cos(t), 280 + 190 * Math.sin(t)] },
  { name: 'حلبة البطولة', f: t => [500 + 360 * Math.cos(t) + 40 * Math.cos(3 * t), 280 + 170 * Math.sin(t) + 40 * Math.sin(2 * t)] },
];
const SENS = { 2: [-13, 13], 3: [-15, 0, 15], 5: [-22, -11, 0, 11, 22] };
const LCODE = {
  2: `int l = digitalRead(A0);
int r = digitalRead(A1);
if (l == LOW && r == LOW) drive(base, base);
else if (l == HIGH) drive(0, base);
else if (r == HIGH) drive(base, 0);`,
  3: `int l = digitalRead(A0), m = digitalRead(A1), r = digitalRead(A2);
if (l == HIGH) { drive(0, base); last = -1; }
else if (r == HIGH) { drive(base, 0); last = 1; }
else if (m == HIGH) drive(base, base);
else if (last == -1) drive(-120, 120);
else drive(120, -120);`,
  5: `int e = -2*s[0] - s[1] + s[3] + 2*s[4];
if (s[0]+s[1]+s[2]+s[3]+s[4] == 0) e = last;
drive(base + k * e, base - k * e);
last = e;`,
};
const lineSVG = () => `<svg viewBox="0 0 ${LW} ${LH}" class="larena">
  <rect width="${LW}" height="${LH}" fill="#fbfaf6"/><rect x="4" y="4" width="${LW - 8}" height="${LH - 8}" rx="12" class="dwall"/>
  <path id="lpath" class="lpath" d=""/><line id="lstart" class="lstart" x1="0" y1="0" x2="0" y2="0"/>
  <g id="lcar"><g transform="scale(.95)">${miniCar('ln')}</g><g id="lsens"></g></g>
  <g id="llost" class="dwin"><rect x="${LW / 2 - 240}" y="${LH / 2 - 60}" width="480" height="120" rx="24"/><text x="${LW / 2}" y="${LH / 2 + 4}" class="dwt1" style="font-size:44px">😵 ضاع الروبوت!</text><text x="${LW / 2}" y="${LH / 2 + 44}" class="dwt2" style="font-size:24px">خفّف السرعة أو زِد الحساسات</text></g>
</svg>`;

/* ================== دوائر البناء ================== */
const hcBody = (c0) => `<rect x="${col(c0) - 16}" y="150" width="${col(c0 + 3) - col(c0) + 32}" height="140" rx="8" fill="#1f5fae"/>
  <rect x="${col(c0) - 4}" y="162" width="${col(c0 + 3) - col(c0) + 8}" height="44" rx="4" fill="#2b6fc0"/><path d="M${col(c0)} 172 h12 v24 h12 v-24 h12 v24 h12 v-24 h12" fill="none" stroke="#f0cc7a" stroke-width="3"/>
  <circle cx="${col(c0 + 3)}" cy="226" r="7" class="hcled"/><text x="${col(c0 + 1) + 13}" y="262" class="lbl" style="font-size:15px;fill:#fff">HC-05</text>
  ${['VCC', 'GND', 'TXD', 'RXD'].map((t, i) => `<line x1="${col(c0 + i)}" y1="290" x2="${col(c0 + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(c0 + i)}" y="284" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}`;
const vres = (c, y1, y2, bands, lbl) => `<line x1="${col(c)}" y1="${y1}" x2="${col(c)}" y2="${y2}" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(c) - 10}" y="${(y1 + y2) / 2 - 25}" width="20" height="50" rx="9" fill="#d9b382"/>
  ${bands.map((b, i) => `<rect x="${col(c) - 10}" y="${(y1 + y2) / 2 - 15 + i * 10}" width="20" height="5" fill="${b}"/>`).join('')}<text x="${col(c) + 16}" y="${(y1 + y2) / 2 + 6}" class="lbl" style="font-size:14px;text-anchor:start">${lbl}</text>`;
B2.btwire = { flow: 7, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نختبر البلوتوث على لوح التوصيل أولًا، ثم ننقله إلى السيارة.' },
  { h: 'وحدة البلوتوث HC-05', b: 'أطرافها المهمة: VCC وGND وTXD (ترسل) وRXD (تستقبل).' },
  { h: 'الطاقة', b: 'VCC إلى 5V، وGND إلى GND.' },
  { h: 'TXD ← المنفذ 2', b: 'ما ترسله الوحدة يستقبله الأردوينو على المنفذ 2. الإرسال يدخل إلى الاستقبال دائمًا.' },
  { h: 'مقسم جهد: 1kΩ و2kΩ', b: 'مدخل RXD في الوحدة يعمل على ٣٫٣ فولت، والأردوينو يرسل ٥. المقسم يخفضها إلى نحو ٣٫٣.' },
  { h: 'المنفذ 3 ← المقسم ← RXD', b: 'الأردوينو يرسل من 3 عبر المقاومة الأولى، ونقطة الالتقاء تذهب إلى RXD.' },
  { h: 'اقرن الجوال!', b: 'الليد يومض بسرعة قبل الاقتران، وببطء بعده. كلمة السر غالبًا 1234 أو 0000.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 btw">
  ${base({ 0: '2', 1: '3' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2">${hcBody(1)}</g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(1)} 336 L${col(1)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}${wire(`M${col(2)} 336 L${col(2)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(0)} 150 C ${pinX(0)} 80, 420 80, 420 250 C 420 360, ${col(3) - 18} 340, ${col(3)} 336`, 4, '#2e9e6b')}
  <g class="bs" data-s="5">${vres(9, 240, 336, ['#7b4a26', '#1b1b1b', '#d62828'], '1kΩ')}${vres(7, 336, 456, ['#d62828', '#1b1b1b', '#d62828'], '2kΩ')}
    <line x1="${col(7)}" y1="312" x2="${col(9)}" y2="312" stroke="#9aa1b3" stroke-width="5"/></g>
  ${wire(`M${pinX(1)} 150 C ${pinX(1)} 50, ${col(9)} 50, ${col(9)} 240`, 6, '#e0b400')}
  ${wire(`M${col(4)} 336 C ${col(4)} 372, ${col(7)} 372, ${col(7)} 340`, 6, '#e67e22')}
  <g class="phone"><rect x="760" y="40" width="90" height="150" rx="16" fill="#1c1f27"/><rect x="768" y="56" width="74" height="112" rx="6" fill="#2b6fc0"/><text x="805" y="122" style="font-size:40px" text-anchor="middle">🎮</text>
    <path d="M740 110 q -14 -14 0 -28 M728 120 q -26 -24 0 -48" fill="none" stroke="#2e9e6b" stroke-width="4" class="waves"/></g>
</svg>` };

const irMod = (c, i) => `<rect x="${col(c) - 18}" y="180" width="${col(c + 2) - col(c) + 36}" height="96" rx="8" fill="#1f5fae"/>
  <circle cx="${col(c) + 4}" cy="262" r="9" fill="#dfe6f0"/><circle cx="${col(c + 2) - 4}" cy="262" r="9" fill="#3a3f4d"/><circle cx="${col(c + 1)}" cy="204" r="9" fill="#2b6fc0" stroke="#fff" stroke-width="2"/>
  <circle cx="${col(c + 2) + 8}" cy="190" r="5" class="irl l${i}"/><text x="${col(c + 1)}" y="170" class="lbl" style="font-size:14px">${['يسار A0', 'وسط A1', 'يمين A2'][i]}</text>
  ${['VCC', 'GND', 'OUT'].map((t, k) => `<line x1="${col(c + k)}" y1="276" x2="${col(c + k)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(c + k)}" y="240" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}`;
B2.linewire = { flow: 5, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'على السيارة: الحساسات الثلاثة تحت المقدمة، متجاورة.' },
  { h: 'ثلاثة حساسات IR', b: 'المسافة بين كل حساس وجاره قريبة من عرض الخط (نحو ٢ سم).' },
  { h: 'الطاقة للثلاثة', b: 'كل VCC إلى الموجب، وكل GND إلى السالب.' },
  { h: 'OUT ← A0 وA1 وA2', b: 'المنافذ التماثلية تعمل رقمية أيضًا: نقرأها بـ digitalRead.' },
  { h: 'اضبط الحساسية', b: 'أدِر مقبض كل حساس حتى يضيء ليده فوق الأبيض وينطفئ فوق الأسود (أو العكس حسب الوحدة).' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 lnw">
  ${base({}, { 0: '5V', 1: 'GND', 2: 'A0', 3: 'A1', 4: 'A2' })}
  <g class="bs" data-s="2">${[0, 4, 8].map((c, i) => irMod(c + 1, i)).join('')}</g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}
  ${[1, 5, 9].map(c => wire(`M${col(c)} 336 L${col(c)} 404`, 3, '#e74c3c') + wire(`M${col(c + 1)} 336 L${col(c + 1)} 456`, 3, '#1b2340')).join('')}
  ${[3, 7, 11].map((c, i) => wire(`M${botX(2 + i)} 425 C ${botX(2 + i)} ${478 + i * 10}, ${col(c) + 40} ${478 + i * 10}, ${col(c) + 26} 380 C ${col(c) + 14} 350, ${col(c)} 352, ${col(c)} 336`, 4, ['#e0b400', '#2e9e6b', '#8e44ad'][i])).join('')}
  <g class="lpaper"><rect x="${col(0)}" y="40" width="${col(12) - col(0)}" height="70" rx="6" fill="#fff" stroke="#c9c3b3" stroke-width="2"/><rect x="${col(5) + 4}" y="40" width="40" height="70" fill="#111"/></g>
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  btlab: s => `<div class="slide light">
      <div class="kicker">📱 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="btgrid">
        <div class="btcode">${codeBlock(BT_CODE, 'micro')}</div>
        <div class="btmid ix">
          <div class="phone2"><div class="pscr"><div class="ptop">🔵 HC-05 · متصل</div>
            <div class="pad">${[['', ''], ['F', '▲'], ['', ''], ['L', '◀'], ['S', '■'], ['R', '▶'], ['', ''], ['B', '▼'], ['', '']].map(([c, t]) => c ? `<button class="pb" data-c="${c}">${t}</button>` : '<i></i>').join('')}</div>
            <label class="psp"><span>السرعة <b id="btsv">6</b></span><input type="range" id="btsp" min="0" max="9" value="6"></label></div></div>
          <div class="btlog"><div class="btlh" dir="ltr">Serial ← bt.read()</div><div class="btll" id="btlog" dir="ltr"></div></div>
        </div>
        <div class="btright ix"><div class="dawrap">${btArena()}</div><div class="btfacts"><div class="ac"><span>آخر حرف</span><b id="btc">—</b></div><div class="ac gold"><span>speed</span><b id="bts">202</b></div><div class="ac"><span>drive</span><b id="btd" dir="ltr">0, 0</b></div></div></div>
      </div></div>`,

  linelab: s => `<div class="slide light">
      <div class="kicker">〰️ حلبة تتبع الخط</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="lgrid">
        <div class="lleft ix">
          <div class="lseg"><span>الحساسات</span>${[2, 3, 5].map(n => `<button class="lsb${n === 2 ? ' on' : ''}" data-n="${n}">${AR(n)}</button>`).join('')}</div>
          <div class="lseg"><span>الحلبة</span>${TRACKS.map((t, i) => `<button class="ltb${i === 0 ? ' on' : ''}" data-t="${i}">${t.name}</button>`).join('')}</div>
          <label class="lsl"><span>🏎️ السرعة base: <b id="lbv">150</b></span><input type="range" id="lb" min="90" max="255" value="150" step="5"></label>
          <div class="lread"><div class="lrh">قراءات الحساسات (١ = أسود)</div><div class="lrd" id="lrd" dir="ltr"></div></div>
          <div class="lcode" id="lcode"></div>
        </div>
        <div class="lright ix"><div class="dawrap">${lineSVG()}</div>
          <div class="lctl"><button class="clap" id="lgo">▶ انطلق</button><button class="sndbtn" id="lrs">↺ من البداية</button>
            <div class="lstat"><div><span>اللفات</span><b id="llap">٠</b></div><div><span>اللفة الحالية</span><b id="lcur">٠٫٠</b></div><div><span>🏆 الأفضل</span><b id="lbest">—</b></div></div></div></div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  btlab(sl) {
    const car = sl.querySelector('#btcar'), trail = sl.querySelector('#bttrail'), pkt = sl.querySelector('#btpkt'), log = sl.querySelector('#btlog');
    const lines = sl.querySelectorAll('.btcode .ln'), sp = sl.querySelector('#btsp');
    let x = 120, y = BH - 100, th = -Math.PI / 2, L = 0, R = 0, speed = 100 + 6 * 17, pts = [], last = 0, raf = 0, hl = 0, chars = [];
    const send = c => {
      chars.push(c); if (chars.length > 26) chars.shift(); log.textContent = chars.join(' ');
      sl.querySelector('#btc').textContent = c;
      if (c === 'F') { L = speed; R = speed; } if (c === 'B') { L = -speed; R = -speed; } if (c === 'L') { L = -speed; R = speed; } if (c === 'R') { L = speed; R = -speed; } if (c === 'S') { L = 0; R = 0; }
      if (c >= '0' && c <= '9') { speed = 100 + (+c) * 17; if (L || R) { L = Math.sign(L) * speed; R = Math.sign(R) * speed; } }
      sl.querySelector('#bts').textContent = speed; sl.querySelector('#btd').textContent = `${L}, ${R}`;
      const ln = c >= '0' && c <= '9' ? 18 : BT_LINE[c];
      lines.forEach(l => l.classList.toggle('run', [11, 12, ln].includes(+l.dataset.n)));
      clearTimeout(hl); hl = setTimeout(() => lines.forEach(l => l.classList.remove('run')), 900);
      pkt.querySelector('text').textContent = c; pkt.classList.remove('go'); void pkt.getBoundingClientRect(); pkt.classList.add('go');
    };
    sl.querySelectorAll('.pb').forEach(b => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('dn'); send(b.dataset.c); });
      const up = () => { if (!b.classList.contains('dn')) return; b.classList.remove('dn'); if (b.dataset.c !== 'S') send('S'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
    });
    sp.oninput = () => { sl.querySelector('#btsv').textContent = sp.value; send(String(sp.value)); };
    const v = p => Math.abs(p) < 50 ? 0 : p / 255 * 60 * 4;              // بكسل/ث (٤ بكسل لكل سم)
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      const vl = v(L), vr = v(R), vv = (vl + vr) / 2, w = (vr - vl) / (13 * 4);
      th -= w * dt; x = Math.max(40, Math.min(BW - 40, x + Math.cos(th) * vv * dt)); y = Math.max(40, Math.min(BH - 40, y + Math.sin(th) * vv * dt));
      if ((vl || vr) && (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 6)) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 300) pts.shift(); }
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`);
      pkt.setAttribute('transform', `rotate(${-th * 180 / Math.PI}) translate(0 -62)`);
      trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); clearTimeout(hl); });
  },

  linelab(sl) {
    const car = sl.querySelector('#lcar'), sensG = sl.querySelector('#lsens'), path = sl.querySelector('#lpath'), lost = sl.querySelector('#llost');
    const go = sl.querySelector('#lgo'), bsl = sl.querySelector('#lb');
    let n = 2, ti = 0, P = [], x, y, th, run = false, last = 0, raf = 0, mem = 0, lostT = 0, idx = 0, laps = 0, lapT = 0, best = null, sweep = 0;
    const build = () => {
      const f = TRACKS[ti].f; P = [];
      for (let i = 0; i < 1400; i++) P.push(f(i / 1400 * Math.PI * 2));
      path.setAttribute('d', 'M' + P.map(p => p.map(Math.round).join(' ')).join(' L') + ' Z');
      const [a, b] = [P[0], P[6]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang) * 30, ny = Math.cos(ang) * 30;
      const st = sl.querySelector('#lstart'); st.setAttribute('x1', a[0] - nx); st.setAttribute('y1', a[1] - ny); st.setAttribute('x2', a[0] + nx); st.setAttribute('y2', a[1] + ny);
    };
    const reset = () => { const [a, b] = [P[0], P[6]]; x = a[0]; y = a[1]; th = Math.atan2(b[1] - a[1], b[0] - a[0]); idx = 0; laps = 0; lapT = 0; sweep = 0; mem = 0; lostT = 0; lost.classList.remove('on'); };
    const onLine = (px, py) => { let m = 1e9; for (let i = 0; i < P.length; i += 2) { const d = (P[i][0] - px) ** 2 + (P[i][1] - py) ** 2; if (d < m) m = d; } return Math.sqrt(m) < LINE / 2 ? 1 : 0; };
    const drawSens = () => { sensG.innerHTML = SENS[n].map((o, i) => `<circle cx="${30 * .95}" cy="${o * .95}" r="5.5" class="lsd" id="sd${i}"/>`).join(''); };
    const setCode = () => { sl.querySelector('#lcode').innerHTML = codeBlock(LCODE[n], 'micro'); };
    const B = () => +bsl.value, vpx = p => Math.abs(p) < 50 ? 0 : p / 255 * 60 * LPX;
    let L = 0, R = 0, hlN = 0;
    const control = s => {                                              // نفس منطق الكود المعروض، سطرًا بسطر
      const b = B();
      if (n === 2) { const [l, r] = s; if (!l && !r) { L = b; R = b; hlN = 3; } else if (l) { L = 0; R = b; hlN = 4; } else { L = b; R = 0; hlN = 5; } }
      else if (n === 3) { const [l, m, r] = s;
        if (l) { L = 0; R = b; mem = -1; hlN = 2; } else if (r) { L = b; R = 0; mem = 1; hlN = 3; } else if (m) { L = b; R = b; hlN = 4; }
        else if (mem === -1) { L = -120; R = 120; hlN = 5; } else { L = 120; R = -120; hlN = 6; } }
      else { let e = -2 * s[0] - s[1] + s[3] + 2 * s[4]; const any = s.some(Boolean); if (!any) e = mem; const k = b * 0.42;
        L = Math.max(-255, Math.min(255, b + k * e)); R = Math.max(-255, Math.min(255, b - k * e)); mem = e; hlN = any ? 3 : 2; }
    };
    const loop = ts => {
      const dtAll = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      let s = SENS[n].map(() => 0);
      if (run) for (let k = 0; k < 4; k++) {                              // حلقة تحكم أسرع من الرسم: ٤ قراءات في كل إطار
        const dt = dtAll / 4, fx = x + Math.cos(th) * 30, fy = y + Math.sin(th) * 30;
        s = SENS[n].map(o => onLine(fx - Math.sin(th) * o, fy + Math.cos(th) * o));
        control(s);
        const vl = vpx(L), vr = vpx(R), v = (vl + vr) / 2, w = (vr - vl) / LWB;
        th -= w * dt; x += Math.cos(th) * v * dt; y += Math.sin(th) * v * dt;
        lostT = s.some(Boolean) ? 0 : lostT + dt;
        if (lostT > 1.1 || x < 10 || y < 10 || x > LW - 10 || y > LH - 10) { run = false; go.textContent = '▶ انطلق'; lost.classList.add('on'); break; }
        lapT += dt;
        let bi = idx, bd = 1e9; for (let j = -40; j <= 40; j++) { const q = (idx + j + P.length) % P.length, d = (P[q][0] - x) ** 2 + (P[q][1] - y) ** 2; if (d < bd) { bd = d; bi = q; } }
        const step = ((bi - idx + P.length + P.length / 2) % P.length) - P.length / 2; sweep += step; idx = bi;
        if (sweep >= P.length) { sweep -= P.length; laps++; if (best === null || lapT < best) best = lapT; lapT = 0; }
      } else { const fx = x + Math.cos(th) * 30, fy = y + Math.sin(th) * 30; s = SENS[n].map(o => onLine(fx - Math.sin(th) * o, fy + Math.cos(th) * o)); }
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`);
      s.forEach((v, i) => { const d = sl.querySelector('#sd' + i); if (d) d.classList.toggle('blk', !!v); });
      sl.querySelector('#lrd').innerHTML = s.map(v => `<i class="${v ? 'b' : ''}">${v}</i>`).join('');
      sl.querySelectorAll('.lcode .ln').forEach(l => l.classList.toggle('run', run && +l.dataset.n === hlN));
      sl.querySelector('#llap').textContent = AR(laps); sl.querySelector('#lcur').textContent = f1(lapT); sl.querySelector('#lbest').textContent = best === null ? '—' : f1(best) + ' ث';
      raf = requestAnimationFrame(loop);
    };
    sl.querySelectorAll('.lsb').forEach(b => b.onclick = () => { n = +b.dataset.n; sl.querySelectorAll('.lsb').forEach(x => x.classList.toggle('on', x === b)); drawSens(); setCode(); best = null; reset(); run = false; go.textContent = '▶ انطلق'; });
    sl.querySelectorAll('.ltb').forEach(b => b.onclick = () => { ti = +b.dataset.t; sl.querySelectorAll('.ltb').forEach(x => x.classList.toggle('on', x === b)); build(); best = null; reset(); run = false; go.textContent = '▶ انطلق'; });
    bsl.oninput = () => sl.querySelector('#lbv').textContent = bsl.value;
    go.onclick = () => { if (lost.classList.contains('on')) reset(); run = !run; go.textContent = run ? '⏸ توقف' : '▶ انطلق'; };
    sl.querySelector('#lrs').onclick = () => { reset(); run = false; go.textContent = '▶ انطلق'; };
    build(); drawSens(); setCode(); reset(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
