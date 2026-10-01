/* =====================================================================
   أدوات الجزء الثاني — المرحلة الرابعة: محرك السيرفو
   الأنواع: servolab · gatelab  ·  دائرة البناء: servometer
   الأرقام كما في مكتبة Servo: write(زاوية) ← نبضة من 544 إلى 2400 ميكروثانية كل 20 مللي ثانية
   وسرعة الدوران كسرعة SG90 تقريبًا: 0.1 ثانية لكل 60 درجة (0.6 درجة لكل مللي ثانية)
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, col, pinX, botX, base, wire } = window.ARD2;

const pulseUs = a => Math.round(544 + a / 180 * (2400 - 544));
const SPEED = 0.6;                                                    // درجة لكل مللي ثانية
const approach = (cur, target, dt) => { const d = target - cur, m = SPEED * dt; return Math.abs(d) <= m ? target : cur + Math.sign(d) * m; };

/* ================== مختبر السيرفو ================== */
const SWEEP_CODE = `#include <Servo.h>

Servo arm;

void setup() {
  arm.attach(9);
}

void loop() {
  for (int a = 0; a <= 180; a++) {
    arm.write(a);
    delay(15);
  }
  for (int a = 180; a >= 0; a--) {
    arm.write(a);
    delay(15);
  }
}`;
const servoSVG = () => `<svg viewBox="0 0 600 420" class="servosvg">
  <path d="M60 300 A240 240 0 0 1 540 300" class="protr"/>
  ${Array.from({ length: 19 }, (_, i) => { const a = i * 10 * Math.PI / 180, big = i % 9 === 0;
    const r1 = 240, r2 = i % 3 === 0 ? 218 : 228;
    return `<line x1="${300 + Math.cos(a) * r1}" y1="${300 - Math.sin(a) * r1}" x2="${300 + Math.cos(a) * r2}" y2="${300 - Math.sin(a) * r2}" class="ptick${big ? ' b' : ''}"/>`; }).join('')}
  ${[0, 45, 90, 135, 180].map(d => { const a = d * Math.PI / 180; return `<text x="${300 + Math.cos(a) * 272}" y="${300 - Math.sin(a) * 272 + 8}" class="pnum">${d}°</text>`; }).join('')}
  <path id="sarc" class="sarc" d=""/>
  <rect x="170" y="296" width="260" height="110" rx="12" class="sbody"/>
  <rect x="136" y="318" width="328" height="20" rx="6" class="sbody"/>
  <circle cx="136" cy="328" r="7" class="shole"/><circle cx="464" cy="328" r="7" class="shole"/>
  <text x="300" y="386" class="sname">SG90</text>
  <circle cx="300" cy="300" r="34" class="sgear"/>
  <g id="horn"><path d="M300 282 L480 290 A10 10 0 0 1 480 310 L300 318 Z" class="shorn"/>
    <path d="M300 288 L250 292 A8 8 0 0 0 250 308 L300 312 Z" class="shorn"/>
    ${[340, 380, 420, 460].map(x => `<circle cx="${x}" cy="300" r="4" class="shole"/>`).join('')}</g>
  <circle cx="300" cy="300" r="16" class="shaft"/>
</svg>`;
const pulseSVG = () => `<svg viewBox="0 0 600 120" class="pulsesvg" preserveAspectRatio="none">
  <line x1="0" y1="96" x2="600" y2="96" class="pbase"/>
  <path id="pwave" class="pwave" d=""/>
  <line x1="300" y1="10" x2="300" y2="106" class="pdiv"/>
</svg>`;

/* ================== البوابة الذكية ================== */
const GATE_CODE = `#include <Servo.h>
Servo gate;
int trig = 7;
int echo = 8;
void setup() {
  gate.attach(9);
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
}

void loop() {
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  int cm = pulseIn(echo, HIGH) * 0.0343 / 2;
  if (cm < 20) {
    gate.write(90);
    delay(3000);
  } else {
    gate.write(0);
  }
}`;
const GX = 1000, PXCM = 4;                                           // موضع البوابة، و٤ بكسل لكل سنتيمتر
const gateSVG = () => `<svg viewBox="0 0 1400 420" class="gatesvg">
  <rect width="1400" height="420" class="gsky"/>
  <rect y="300" width="1400" height="120" class="groad"/>
  ${[60, 260, 460, 660, 1100, 1300].map(x => `<rect x="${x}" y="356" width="110" height="10" rx="5" class="glane"/>`).join('')}
  <line x1="${GX}" y1="300" x2="${GX}" y2="420" class="gstop"/>
  <g id="gbeam" class="gbeam"><path d="" id="gbeamp"/></g>
  <g id="car"><g transform="translate(-230 0)">
    <path d="M10 250 L30 196 Q40 178 70 176 L150 176 Q178 178 196 200 L222 214 Q232 218 232 232 L232 262 L10 262 Z" class="carb"/>
    <path d="M50 212 L64 188 L110 188 L110 212 Z M122 212 L122 188 L150 188 Q166 190 180 212 Z" class="carw"/>
    <circle cx="60" cy="266" r="26" class="tyre"/><circle cx="60" cy="266" r="10" class="hub"/>
    <circle cx="186" cy="266" r="26" class="tyre"/><circle cx="186" cy="266" r="10" class="hub"/>
    <rect x="218" y="222" width="14" height="12" rx="3" class="lampc"/></g>
    <text x="-115" y="160" class="glbl">↔ اسحبني</text></g>
  <rect x="${GX + 6}" y="150" width="46" height="150" rx="8" class="gpost"/>
  <rect x="${GX - 6}" y="176" width="26" height="38" rx="6" class="gsonar"/>
  <circle cx="${GX + 1}" cy="186" r="7" class="geye"/><circle cx="${GX + 1}" cy="204" r="7" class="geye"/>
  <g id="barrier"><rect x="${GX + 29 - 380}" y="226" width="380" height="24" rx="12" class="garm"/>
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${GX + 29 - 360 + i * 76}" y="226" width="34" height="24" class="gstripe"/>`).join('')}</g>
  <circle cx="${GX + 29}" cy="238" r="18" class="gpivot"/>
  <text x="${GX + 29}" y="140" class="glbl">سيرفو</text>
</svg>`;

/* ================== دائرة البناء: مؤشر الضوء ================== */
const S0 = col(4), SY = 150;                                          // مركز محور السيرفو في دائرة البناء
const ldrAt = c => `<line x1="${col(c)}" y1="300" x2="${col(c)}" y2="272" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(c + 2)}" y1="300" x2="${col(c + 2)}" y2="272" stroke="#9aa1b3" stroke-width="5"/>
    <rect x="${col(c) - 12}" y="236" width="${col(c + 2) - col(c) + 24}" height="40" rx="20" fill="#e8d7b0" stroke="#8a6d3b" stroke-width="3"/>
    <path d="M${col(c) + 4} 256 h8 v-8 h8 v16 h8 v-16 h8 v16 h8 v-8 h6" fill="none" stroke="#b5462f" stroke-width="3"/>
    <text x="${col(c + 1)}" y="222" class="lbl" style="font-size:18px">LDR</text>
    <line x1="${col(c)}" y1="336" x2="${col(c)}" y2="352" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(c) - 10}" y="352" width="20" height="50" rx="9" fill="#d9b382"/>
    <rect x="${col(c) - 10}" y="362" width="20" height="5" fill="#7b4a26"/><rect x="${col(c) - 10}" y="372" width="20" height="5" fill="#1b1b1b"/><rect x="${col(c) - 10}" y="382" width="20" height="5" fill="#e67e22"/>
    <line x1="${col(c)}" y1="402" x2="${col(c)}" y2="456" stroke="#9aa1b3" stroke-width="5"/><text x="${col(c) + 16}" y="392" class="lbl" style="font-size:14px" text-anchor="start">10kΩ</text>`;
B2.servometer = { flow: 7, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'السيرفو وعليه عقرب', b: 'ثبّت على محوره ذراعًا طويلًا كالعقرب، وخلفه ورقة مرسوم عليها: ظلام… ضوء.' },
  { h: 'البني إلى GND · الأحمر إلى 5V', b: 'سلك السيرفو البني (أو الأسود) إلى الخط السالب، والأحمر إلى الموجب.' },
  { h: 'البرتقالي إلى المنفذ ~9', b: 'سلك الإشارة: منه تخرج النبضات التي تحدد الزاوية.' },
  { h: 'حساس الضوء ومقاومة 10 كيلو أوم', b: 'مقسم الجهد نفسه من المحور الثاني.' },
  { h: 'نقطة الالتقاء إلى A0', b: 'السلك الأصفر ينقل قراءة الضوء إلى الأردوينو.' },
  { h: 'غطِّ الحساس… ثم اكشفه!', b: 'يتحرك العقرب مع الضوء كعداد حقيقي.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 smw">
  ${base({ 5: '~9' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  <g class="bs" data-s="2">
    <path d="M${S0 - 110} ${SY} A110 110 0 0 1 ${S0 + 110} ${SY}" fill="#fffdf6" stroke="#c9c3b3" stroke-width="3"/>
    <text x="${S0 - 92}" y="${SY - 12}" class="lbl" style="font-size:18px">🌙</text><text x="${S0 + 92}" y="${SY - 12}" class="lbl" style="font-size:18px">☀️</text>
    <path d="M${S0 - 12} ${SY + 54} C ${S0 - 12} 222, ${col(3)} 222, ${col(3)} 240" fill="none" stroke="#6b3e1f" stroke-width="6"/>
    <path d="M${S0} ${SY + 54} L${col(4)} 240" fill="none" stroke="#d62828" stroke-width="6"/>
    <path d="M${S0 + 12} ${SY + 54} C ${S0 + 12} 222, ${col(5)} 222, ${col(5)} 240" fill="none" stroke="#f08a24" stroke-width="6"/>
    <rect x="${S0 - 50}" y="${SY - 6}" width="100" height="60" rx="8" fill="#2b6fc0"/><text x="${S0}" y="${SY + 38}" class="lbl" style="font-size:14px;fill:#fff">SG90</text>
    <g class="needle" style="transform-origin:${S0}px ${SY}px"><rect x="${S0 - 4}" y="${SY - 96}" width="8" height="96" rx="4" fill="#d62828"/></g>
    <circle cx="${S0}" cy="${SY}" r="9" fill="#fff" stroke="#1b2340" stroke-width="3"/></g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(4)} 264 L${col(4)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}${wire(`M${col(3)} 264 L${col(3)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 110, 420 120, 420 250 C 420 350, ${col(5) - 20} 336, ${col(5)} 336`, 4, '#f08a24')}
  <g class="bs" data-s="5">${ldrAt(9)}</g>
  ${wire(`M${col(11)} 312 L${col(11)} 404`, 5, '#e74c3c')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 490, ${col(8)} 490, ${col(8)} 336 L${col(8)} 312 L${col(9)} 312`, 6, '#e0b400')}
  <g class="handcover"><text x="${col(10)}" y="262" style="font-size:80px" text-anchor="middle">✋</text></g>
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  servolab: s => `<div class="slide light">
      <div class="kicker">🦾 مختبر السيرفو</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="svgrid">
        <div class="svcode">${codeBlock(SWEEP_CODE, 'micro')}</div>
        <div class="svmid ix">${servoSVG()}
          <label class="lsl"><span>🎚️ الزاوية المطلوبة: <b id="sva">90</b>°</span><input type="range" id="svr" min="0" max="180" value="90"></label>
          <div class="svbtns">${[0, 45, 90, 135, 180].map(a => `<button class="sndbtn" data-a="${a}">${a}°</button>`).join('')}<button class="sndbtn gold" id="sweep">▶ Sweep</button></div>
        </div>
        <div class="svright">
          <div class="tonecode" dir="ltr" id="svw">${highlight('arm.write(90);')}</div>
          <div class="ac"><span>عرض النبضة (تحسبه المكتبة)</span><b id="svp" dir="ltr">1472 µs</b></div>
          <div class="pulsebox">${pulseSVG()}<div class="plegend">نبضة كل ٢٠ مللي ثانية (فترتان هنا)، وعرضها هو «الأمر»</div></div>
          <div class="ac gold"><span>زاوية المحور الآن</span><b id="svnow">90°</b></div>
        </div>
      </div></div>`,

  gatelab: s => `<div class="slide light">
      <div class="kicker">🚧 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="gtgrid">
        <div class="gtcode">${codeBlock(GATE_CODE, 'micro')}</div>
        <div class="gtright">
          <div class="gtwrap ix" id="gtw">${gateSVG()}</div>
          <div class="gtfacts">
            <div class="ac"><span>cm · المسافة</span><b id="gcm">—</b></div>
            <div class="ac gold"><span>gate.write</span><b id="gw" dir="ltr">0</b></div>
            <div class="ac"><span>البوابة</span><b id="gst" class="fanst">مغلقة</b></div>
          </div>
          <div class="gtnote">اسحب السيارة نحو البوابة: تحت ٢٠ سم يرفع السيرفو الذراع ٩٠ درجة، ويبقيها ٣ ثوانٍ (<code dir="ltr">delay(3000)</code>)</div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  servolab(sl) {
    const horn = sl.querySelector('#horn'), arc = sl.querySelector('#sarc'), rng = sl.querySelector('#svr'), wave = sl.querySelector('#pwave');
    const lines = sl.querySelectorAll('.svcode .ln'), sweepBtn = sl.querySelector('#sweep');
    let target = 90, cur = 90, last = 0, raf = 0, sweep = null;       // sweep: { a, dir, t }
    const setTarget = (a, fromSweep) => {
      target = a; rng.value = a;
      sl.querySelector('#sva').textContent = a;
      sl.querySelector('#svw').innerHTML = highlight(`arm.write(${a});`);
      const us = pulseUs(a); sl.querySelector('#svp').textContent = us + ' µs';
      const w = us / 20000 * 300;                                     // فترتان كل منهما ٢٠ مللي ثانية على ٦٠٠ بكسل
      wave.setAttribute('d', [0, 300].map(x0 => `M${x0} 96 L${x0 + 4} 96 L${x0 + 4} 20 L${x0 + 4 + w} 20 L${x0 + 4 + w} 96 L${x0 + 300} 96`).join(' '));
      if (!fromSweep) { stopSweep(); lines.forEach(l => l.classList.toggle('run', false)); }
    };
    const stopSweep = () => { sweep = null; sweepBtn.textContent = '▶ Sweep'; };
    const draw = () => {
      horn.setAttribute('transform', `rotate(${-cur} 300 300)`);
      const r = 120, a = cur * Math.PI / 180;
      arc.setAttribute('d', cur < 0.5 ? '' : `M${300 + r} 300 A${r} ${r} 0 0 0 ${300 + Math.cos(a) * r} ${300 - Math.sin(a) * r}`);
      sl.querySelector('#svnow').textContent = Math.round(cur) + '°';
    };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      if (sweep) {
        sweep.t += dt;
        while (sweep && sweep.t >= 15) {                              // delay(15) بين كل درجة وأخرى
          sweep.t -= 15; sweep.a += sweep.dir;
          if (sweep.a > 180) { sweep.a = 180; sweep.dir = -1; }
          if (sweep.a < 0) { sweep.a = 0; sweep.dir = 1; }
          setTarget(sweep.a, true);
        }
        if (sweep) lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', sweep.dir > 0 ? n >= 10 && n <= 12 : n >= 14 && n <= 16); });
      }
      cur = approach(cur, target, dt); draw();
      raf = requestAnimationFrame(loop);
    };
    rng.oninput = () => setTarget(+rng.value);
    sl.querySelectorAll('[data-a]').forEach(b => b.onclick = () => setTarget(+b.dataset.a));
    sweepBtn.onclick = () => {
      if (sweep) { stopSweep(); return; }
      sweep = { a: Math.round(cur), dir: cur >= 180 ? -1 : 1, t: 0 }; sweepBtn.textContent = '⏸ إيقاف';
    };
    setTarget(90); draw(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  gatelab(sl) {
    const svg = sl.querySelector('.gatesvg'), car = sl.querySelector('#car'), bar = sl.querySelector('#barrier'), beam = sl.querySelector('#gbeamp');
    const lines = sl.querySelectorAll('.gtcode .ln');
    let x = 420, cur = 0, target = 0, holdUntil = 0, last = 0, raf = 0;   // x = مقدمة السيارة
    const measure = () => { const d = (GX - 6 - x) / PXCM; return x > GX + 30 || d > 200 ? null : Math.max(2, d); };
    const drag = e => {
      const r = svg.getBoundingClientRect(); let nx = (e.clientX - r.left) * 1400 / r.width + 40;
      if (cur < 80 && x <= GX - 8) nx = Math.min(nx, GX - 8);          // الذراع المغلقة توقف السيارة
      x = Math.max(260, Math.min(1400 + 240, nx));
    };
    let dn = false;
    svg.addEventListener('pointerdown', e => { dn = true; svg.setPointerCapture(e.pointerId); drag(e); });
    svg.addEventListener('pointermove', e => dn && drag(e));
    svg.addEventListener('pointerup', () => dn = false);
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      const d = measure(), near = d !== null && d < 20;
      if (ts >= holdUntil) {
        if (near) { target = 90; holdUntil = ts + 3000; } else target = 0;
      }
      cur = approach(cur, target, dt);
      car.setAttribute('transform', `translate(${x} 0)`);
      bar.setAttribute('transform', `rotate(${cur} ${GX + 29} 238)`);
      sl.querySelector('#gcm').textContent = d === null ? '—' : AR(Math.round(d));
      sl.querySelector('#gw').textContent = target;
      const st = sl.querySelector('#gst'), open = cur > 80;
      st.textContent = open ? 'مفتوحة ✅' : cur > 1 ? 'تتحرك…' : 'مغلقة'; st.classList.toggle('on', open);
      beam.setAttribute('d', d === null ? '' : `M${GX - 6} 195 L${x + 4} 180 L${x + 4} 210 Z`);
      svg.classList.toggle('near', near);
      const holding = ts < holdUntil && target === 90;
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', holding ? n === 17 || n === 18 : near ? n === 16 : n === 20 || n === 15); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
