/* =====================================================================
   أكاديمية سيارة الروبوت — المراحل ٤ إلى ٦: PID · الرادار · الروبوت المدمج · السومو · المتاهة
   الأنواع: pidlab · radarlab · combolab · sumolab · mazelab  ·  دائرة البناء: radarwire
   فيزياء واقعية: قصور المحرك (ثابت زمني ٠٫٢ ث) وحلقة تحكم كل ٤٠ مللي ثانية، فيظهر التذبذب كما في الواقع
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, col, pinX, botX, base, wire, plotter, plotFeed } = window.ARD2;
const { miniCar, TRACKS } = window.ARD3;
const f1 = v => AR((Math.round(v * 10) / 10).toFixed(1)).replace('.', '٫').replace('-', '−');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pwmV = (p, k) => Math.abs(p) < 50 ? 0 : p / 255 * 60 * k;      // بكسل/ث، k بكسل لكل سم
const arena = (cls, w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" class="${cls}"><defs><pattern id="${cls}t" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f4f0e6"/><path d="M40 0 L0 0 0 40" fill="none" stroke="#e3dccb" stroke-width="2"/></pattern></defs>
  <rect width="${w}" height="${h}" fill="url(#${cls}t)"/><rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="12" class="dwall"/>${inner}</svg>`;
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
/* سحب مستطيلات (صناديق) داخل SVG */
function dragBoxes(svg, boxes, els, W, H) {
  let drag = null;
  const pt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  els.forEach((g, i) => g.addEventListener('pointerdown', e => { const [px, py] = pt(e); drag = { i, dx: px - boxes[i][0], dy: py - boxes[i][1] }; svg.setPointerCapture(e.pointerId); e.stopPropagation(); }));
  svg.addEventListener('pointermove', e => {
    if (!drag) return; const [px, py] = pt(e), b = boxes[drag.i];
    b[0] = clamp(px - drag.dx, 8, W - 8 - b[2]); b[1] = clamp(py - drag.dy, 8, H - 8 - b[3]);
    const r = els[drag.i].querySelector('rect'), t = els[drag.i].querySelector('text');
    r.setAttribute('x', b[0]); r.setAttribute('y', b[1]); if (t) { t.setAttribute('x', b[0] + b[2] / 2); t.setAttribute('y', b[1] + b[3] / 2 + 10); }
  });
  svg.addEventListener('pointerup', () => drag = null);
}
const inBox = (boxes, x, y) => boxes.some(([bx, by, bw, bh]) => x > bx && x < bx + bw && y > by && y < by + bh);
const ray = (x, y, a, hit, max = 600) => { for (let d = 0; d < max; d += 2) if (hit(x + Math.cos(a) * d, y + Math.sin(a) * d)) return d; return max; };

/* ============ متتبع خط: أقرب نقطة والخطأ الجانبي (موجب = الخط على اليمين) ============ */
function trackOf(ti) { const f = TRACKS[ti].f, P = []; for (let i = 0; i < 1400; i++) P.push(f(i / 1400 * Math.PI * 2)); return P; }
function nearest(P, px, py, start, span = 60) { let bi = start, bd = 1e9; for (let j = -span; j <= span; j++) { const q = (start + j + P.length) % P.length, d = (P[q][0] - px) ** 2 + (P[q][1] - py) ** 2; if (d < bd) { bd = d; bi = q; } } return [bi, Math.sqrt(bd)]; }
function sideErr(P, i, px, py, d) { const a = P[i], b = P[(i + 1) % P.length], s = Math.sign((b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0])); return -s * d; }
const trackPath = P => 'M' + P.map(p => p.map(Math.round).join(' ')).join(' L') + ' Z';

/* ================== PID ================== */
const PID_CODE = `float Kp = 60, Kd = 2;
float lastError = 0;

void loop() {
  float error = readLinePosition();
  float P = Kp * error;
  float D = Kd * (error - lastError) / 0.04;
  float turn = P + D;
  drive(base + turn, base - turn);
  lastError = error;
  delay(40);
}`;
const PID_PRE = [['😴 P ضعيف', 8, 0], ['〰️ P قوي فقط', 60, 0], ['✨ P + D', 60, 2]];
const PX3 = 3, WB3 = 39;

/* ================== الرادار ================== */
const RADAR_CODE = `int look(int angle) {
  head.write(angle);
  delay(300);
  return distance();
}

void loop() {
  if (distance() > 25) { drive(180, 180); return; }
  drive(0, 0);
  int right = look(30);
  int left = look(150);
  head.write(90);
  if (left > right) drive(-180, 180);
  else drive(180, -180);
  delay(350);
}`;
const RW = 760, RH = 480, RPX = 4;
const RBOX = [[300, 60, 90, 80], [520, 250, 110, 70], [140, 300, 80, 110], [600, 70, 60, 60]];
const radarScreen = () => `<svg viewBox="0 0 400 230" class="rscreen">
  <rect width="400" height="230" rx="18" fill="#04150c"/>
  ${[60, 120, 180].map(r => `<path d="M${200 - r} 210 A${r} ${r} 0 0 1 ${200 + r} 210" class="rring"/>`).join('')}
  ${[0, 30, 60, 90, 120, 150, 180].map(a => { const t = a * Math.PI / 180; return `<line x1="200" y1="210" x2="${200 + Math.cos(t) * 190}" y2="${210 - Math.sin(t) * 190}" class="rspoke"/>`; }).join('')}
  <text x="200" y="226" class="rlab">٢٥ سم لكل حلقة</text>
  <g id="rblips"></g><line id="rsweep" x1="200" y1="210" x2="200" y2="20" class="rsweep"/>
</svg>`;

/* ================== الروبوت المدمج ================== */
const COMBO_CODE = `void loop() {
  if (distance() < 15) { avoid(); return; }
  followLine();
}

void avoid() {
  drive(180, -180); delay(240);
  drive(110, 200);  delay(800);
  while (!lineSeen()) drive(110, 200);
  delay(120);
  while (digitalRead(SM) == LOW) drive(150, -150);
}`;

/* ================== السومو ================== */
const SUMO_CODE = `void setup() {
  delay(5000);
}

void loop() {
  if (digitalRead(EL) == LOW || digitalRead(ER) == LOW) {
    drive(-255, -255); delay(300);
    drive(255, -255);  delay(250);
  } else if (distance() < 40) {
    drive(255, 255);
  } else {
    drive(150, -150);
  }
}`;
const SW = 760, SH = 520, SCX = 380, SCY = 260, SR = 250, SPX = 6.5, BR = 30;   // حلبة ٧٧ سم ≈ ٢٥٠ بكسل نصف قطر
const OPP = [['🧍 دمية ثابتة', 'still'], ['🎲 يتجول', 'wander'], ['🤖 مهاجم ذكي', 'smart']];

/* ================== المتاهة ================== */
const MAZE_CODE = `void loop() {
  if (rightFree())      { turnRight(); forward(); }
  else if (frontFree()) { forward(); }
  else if (leftFree())  { turnLeft(); forward(); }
  else                  { turnBack(); }
}`;
const MC = 11, MR = 7, CS = 64, MW = MC * CS + 8, MH = MR * CS + 8;

/* ================== دائرة البناء: الرادار ================== */
B2.radarwire = { flow: 6, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'على السيارة: الرأس في المقدمة تمامًا.' },
  { h: 'السيرفو وعليه الحساس', b: 'ثبّت حساس المسافة على ذراع السيرفو بحامل أو بشريط لاصق قوي، أفقيًا وينظر للأمام عند ٩٠ درجة.' },
  { h: 'طاقة السيرفو والحساس', b: 'كلاهما من 5V وGND عبر خطّي اللوح.' },
  { h: 'إشارة السيرفو ← 11', b: 'مكتبة Servo تعمل على أي منفذ. 11 حرّ في توصيلنا الموحّد.' },
  { h: 'TRIG ← 12 · ECHO ← 13', b: 'كما في حساس ركن السيارة من الجزء الثاني.' },
  { h: 'شغّل الرادار!', b: 'الرأس يلتفت يمينًا ثم يسارًا، والحساس يقيس في كل اتجاه.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 rdw">
  ${base({ 3: '11', 4: '12', 5: '13' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2"><rect x="${col(5) - 40}" y="150" width="80" height="60" rx="8" fill="#2b6fc0"/><text x="${col(5)}" y="196" class="lbl" style="font-size:13px;fill:#fff">SG90</text>
    <g class="rdhead" style="transform-origin:${col(5)}px 160px"><rect x="${col(5) - 70}" y="96" width="140" height="48" rx="6" fill="#1f5fae"/><circle cx="${col(5) - 36}" cy="120" r="18" fill="#dfe3ea"/><circle cx="${col(5) + 36}" cy="120" r="18" fill="#dfe3ea"/>
      <path d="M${col(5) - 40} 92 L${col(5)} 20 L${col(5) + 40} 92 Z" fill="rgba(126,226,168,.25)" class="rdbeam"/></g>
    ${[['#6b3e1f', 3], ['#d62828', 4], ['#f08a24', 5]].map(([c, k]) => `<path d="M${col(5) - 20 + (k - 3) * 20} 210 C ${col(5) - 20 + (k - 3) * 20} 228, ${col(k)} 226, ${col(k)} 240" fill="none" stroke="${c}" stroke-width="6"/>`).join('')}
    ${['VCC', 'TRIG', 'ECHO', 'GND'].map((t, i) => `<path d="M${col(5) - 54 + i * 36} 144 C ${col(5) - 54 + i * 36} 180, ${col(8 + i)} 200, ${col(8 + i)} 240" fill="none" stroke="#9aa1b3" stroke-width="4"/><text x="${col(8 + i)}" y="232" class="lbl" style="font-size:9px">${t}</text>`).join('')}</g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}
  ${wire(`M${col(4)} 264 L${col(4)} 404`, 3, '#e74c3c')}${wire(`M${col(3)} 264 L${col(3)} 456`, 3, '#1b2340')}
  ${wire(`M${col(8)} 264 L${col(8)} 404`, 3, '#e74c3c')}${wire(`M${col(11)} 264 L${col(11)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 80, 420 90, 420 250 C 420 340, ${col(5) - 16} 330, ${col(5)} 312`, 4, '#f08a24')}
  ${wire(`M${pinX(4)} 150 C ${pinX(4)} 40, 880 40, 880 250 C 880 340, ${col(9) + 20} 330, ${col(9)} 312`, 5, '#2e9e6b')}
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 24, 892 24, 892 250 C 892 352, ${col(10) + 20} 352, ${col(10)} 336`, 5, '#8e44ad')}
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  pidlab: s => `<div class="slide light">
      <div class="kicker">🎛️ مختبر PID</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="pgrid">
        <div class="pleft ix">
          <div class="ppre">${PID_PRE.map(([t, p, d], i) => `<button class="sndbtn" data-p="${p}" data-d="${d}">${t}</button>`).join('')}</div>
          <label class="lsl"><span>P · Kp: <b id="kpv">60</b></span><input type="range" id="kp" min="0" max="120" value="60"></label>
          <label class="lsl"><span>D · Kd: <b id="kdv">0٫0</b></span><input type="range" id="kd" min="0" max="40" value="0"></label>
          <label class="lsl"><span>🏎️ base: <b id="pbv">220</b></span><input type="range" id="pb" min="120" max="255" value="220" step="5"></label>
          ${codeBlock(PID_CODE, 'micro')}
        </div>
        <div class="pright ix">
          <div class="dawrap"><svg viewBox="0 0 1000 560" class="larena"><rect width="1000" height="560" fill="#fbfaf6"/><rect x="4" y="4" width="992" height="552" rx="12" class="dwall"/>
            <path id="ppath" class="lpath" d=""/><path id="ptrail" class="ptrail" d=""/><g id="pcar"><g transform="scale(.95)">${miniCar('pid')}</g></g>
            <g id="plost" class="dwin"><rect x="260" y="220" width="480" height="120" rx="24"/><text x="500" y="284" class="dwt1" style="font-size:44px">😵 ضاع الروبوت!</text><text x="500" y="324" class="dwt2" style="font-size:24px">Kp أصغر من أن يلحق بالمنعطف</text></g></svg></div>
          ${plotter('pplot', 'error (سم)', 16)}
          <div class="lctl"><button class="clap" id="pgo">▶ انطلق</button><button class="sndbtn" id="prs">↺ من البداية</button>
            <div class="lstat"><div><span>متوسط |الخطأ|</span><b id="pea">—</b></div><div><span>اللفة الحالية</span><b id="pcur">٠٫٠</b></div><div><span>🏆 الأفضل</span><b id="pbest">—</b></div></div></div>
        </div>
      </div></div>`,

  radarlab: s => `<div class="slide light">
      <div class="kicker">📡 محاكي الرادار</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="rgrid">
        <div class="rleft">${radarScreen()}${codeBlock(RADAR_CODE, 'micro')}</div>
        <div class="rright ix"><div class="dawrap">${arena('rarena', RW, RH, `${RBOX.map((b, i) => `<g class="abox" data-i="${i}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="8"/><text x="${b[0] + b[2] / 2}" y="${b[1] + b[3] / 2 + 10}">📦</text></g>`).join('')}
            <path id="rtrail" class="dtrail" d=""/><line id="rray" class="aray" x1="0" y1="0" x2="0" y2="0"/><circle id="rhit" class="ahit" r="7"/>
            <g id="rcar"><g transform="scale(1.15)">${miniCar('rd')}</g><g id="rhead"><rect x="36" y="-12" width="12" height="24" rx="3" class="rhd"/></g></g>`)}</div>
          <div class="lctl"><button class="clap" id="rgo">▶ انطلق</button><button class="sndbtn" id="rrs">↺ من البداية</button><div class="irdec" id="rst">جاهز</div></div></div>
      </div></div>`,

  combolab: s => `<div class="slide light">
      <div class="kicker">🔀 الروبوت المدمج</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="rgrid">
        <div class="rleft">${codeBlock(COMBO_CODE, 'micro')}<div class="cmfacts"><div class="ac"><span>distance()</span><b id="cmd">—</b></div><div class="ac gold"><span>الحالة</span><b id="cms" style="font-size:26px">يتبع الخط</b></div></div>
          <div class="lread"><div class="lrh">حساسات الخط</div><div class="lrd" id="cmr" dir="ltr"></div></div></div>
        <div class="rright ix"><div class="dawrap"><svg viewBox="0 0 1000 560" class="larena cmarena"><rect width="1000" height="560" fill="#fbfaf6"/><rect x="4" y="4" width="992" height="552" rx="12" class="dwall"/>
            <path id="cmpath" class="lpath" d=""/><path id="cmtrail" class="ptrail" d=""/>
            <g id="cmboxes"></g><line id="cmray" class="aray" x1="0" y1="0" x2="0" y2="0"/>
            <g id="cmcar"><g transform="scale(.95)">${miniCar('cm')}</g><g id="cmsens"></g></g></svg></div>
          <div class="lctl"><button class="clap" id="cmgo">▶ انطلق</button><button class="sndbtn" id="cmrs">↺ من البداية</button>
            <div class="lstat"><div><span>اللفات</span><b id="cmlap">٠</b></div><div><span>عوائق تجاوزها</span><b id="cmav">٠</b></div><div><span>الزمن</span><b id="cmt">٠٫٠</b></div></div></div></div>
      </div></div>`,

  sumolab: s => `<div class="slide light">
      <div class="kicker">🥋 حلبة السومو</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="sgrid3">
        <div class="sleft ix">${codeBlock(SUMO_CODE, 'micro')}
          <div class="lseg"><span>الخصم</span>${OPP.map(([t, k], i) => `<button class="lsb${i === 1 ? ' on' : ''}" data-o="${k}">${t}</button>`).join('')}</div>
          <label class="lsl"><span>⚔️ سرعة الهجوم: <b id="sav">255</b></span><input type="range" id="sa" min="120" max="255" value="255" step="5"></label>
          <button class="sndbtn" id="sedge">✅ حساسات الحافة تعمل</button></div>
        <div class="sright ix"><div class="dawrap"><svg viewBox="0 0 ${SW} ${SH}" class="sarena"><rect width="${SW}" height="${SH}" fill="#2a2f3d"/>
            <circle cx="${SCX}" cy="${SCY}" r="${SR}" class="dohyo"/><circle cx="${SCX}" cy="${SCY}" r="${SR - 16}" class="dohyo2"/>
            <line x1="${SCX - 60}" y1="${SCY - 50}" x2="${SCX - 60}" y2="${SCY + 50}" class="shikiri"/><line x1="${SCX + 60}" y1="${SCY - 50}" x2="${SCX + 60}" y2="${SCY + 50}" class="shikiri"/>
            <line id="sray" class="aray" x1="0" y1="0" x2="0" y2="0"/>
            <g id="sbot0" class="sbot me"><rect x="-30" y="-30" width="60" height="60" rx="8"/><path d="M30 -30 L42 -30 L42 30 L30 30 Z" class="blade"/><circle cx="26" cy="-22" r="5" class="edge" id="e0"/><circle cx="26" cy="22" r="5" class="edge" id="e1"/><text x="-4" y="8">🔵</text></g>
            <g id="sbot1" class="sbot op"><rect x="-30" y="-30" width="60" height="60" rx="8"/><path d="M30 -30 L42 -30 L42 30 L30 30 Z" class="blade"/><text x="-4" y="8">🔴</text></g>
            <g id="sover" class="sover"><rect x="${SCX - 250}" y="${SCY - 60}" width="500" height="120" rx="24"/><text x="${SCX}" y="${SCY + 2}" class="dwt1" id="sov1" style="font-size:48px"></text><text x="${SCX}" y="${SCY + 42}" class="dwt2" id="sov2" style="font-size:24px"></text></g></svg></div>
          <div class="lctl"><button class="clap" id="sgo">▶ ابدأ النزال</button><div class="sscore"><span>🔵 روبوتنا <b id="ss0">٠</b></span><span>🔴 الخصم <b id="ss1">٠</b></span></div><div class="irdec" id="sst">جاهز</div></div></div>
      </div></div>`,

  mazelab: s => `<div class="slide light">
      <div class="kicker">🧭 محاكي المتاهة</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="mgrid">
        <div class="mleft ix">${codeBlock(MAZE_CODE, 'micro')}
          <div class="lseg"><span>القاعدة</span><button class="lsb on" data-h="1">✋ اليد اليمنى</button><button class="lsb" data-h="-1">🤚 اليد اليسرى</button></div>
          <label class="lsl"><span>⏩ السرعة</span><input type="range" id="msp" min="1" max="10" value="5"></label>
          <div class="mfacts"><div class="ac"><span>الخطوات</span><b id="mst">٠</b></div><div class="ac gold"><span>القرار</span><b id="mdc" style="font-size:24px">—</b></div></div></div>
        <div class="mright ix"><div class="dawrap mwrap"><svg viewBox="0 0 ${MW} ${MH}" class="marena"><rect width="${MW}" height="${MH}" fill="#fbfaf6"/><g id="mwalls"></g><path id="mtrail" class="mtrail" d=""/>
            <text id="mgoal" class="mgoal" x="0" y="0">🏁</text><g id="mcar"><g transform="scale(.62)">${miniCar('mz')}</g></g>
            <g id="mwin" class="dwin"><rect x="${MW / 2 - 220}" y="${MH / 2 - 60}" width="440" height="120" rx="24"/><text x="${MW / 2}" y="${MH / 2 + 2}" class="dwt1" style="font-size:44px">🏁 وجد المخرج!</text><text x="${MW / 2}" y="${MH / 2 + 42}" class="dwt2" id="mwt" style="font-size:24px"></text></g></svg></div>
          <div class="lctl"><button class="clap" id="mgo">▶ انطلق</button><button class="sndbtn" id="mnew">🎲 متاهة جديدة</button><button class="sndbtn" id="mstep">⏭ خطوة</button></div></div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  /* ---------------- PID ---------------- */
  pidlab(sl) {
    const P = trackOf(1), car = sl.querySelector('#pcar'), trail = sl.querySelector('#ptrail'), lost = sl.querySelector('#plost'), plot = sl.querySelector('#pplot'), buf = [];
    const kp = sl.querySelector('#kp'), kd = sl.querySelector('#kd'), pb = sl.querySelector('#pb'), go = sl.querySelector('#pgo');
    sl.querySelector('#ppath').setAttribute('d', trackPath(P));
    let x, y, th, idx, sidx, sweep, lapT, best = null, pe, cl, cr, wl, wr, tick, sum, cnt, run = false, last = 0, raf = 0, lostT, pts, plotT = 0, e = 0;
    const reset = () => { [x, y] = P[0]; th = Math.atan2(P[6][1] - y, P[6][0] - x); idx = 0; sidx = 0; sweep = 0; lapT = 0; pe = 0; cl = cr = wl = wr = 0; tick = 0; sum = 0; cnt = 0; lostT = 0; pts = []; e = 0; lost.classList.remove('on'); };
    const ui = () => { sl.querySelector('#kpv').textContent = kp.value; sl.querySelector('#kdv').textContent = f1(kd.value / 10); sl.querySelector('#pbv').textContent = pb.value;
      const src = sl.querySelector('.pleft .ln[data-n="1"] .cl-src'); src.innerHTML = highlight(`float Kp = ${kp.value}, Kd = ${(kd.value / 10).toString()};`); };
    kp.oninput = kd.oninput = pb.oninput = ui;
    sl.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { kp.value = b.dataset.p; kd.value = b.dataset.d * 10; ui(); best = null; reset(); run = true; go.textContent = '⏸ توقف'; });
    go.onclick = () => { if (lost.classList.contains('on')) reset(); run = !run; go.textContent = run ? '⏸ توقف' : '▶ انطلق'; };
    sl.querySelector('#prs').onclick = () => { reset(); run = false; go.textContent = '▶ انطلق'; };
    const loop = ts => {
      const dtAll = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      if (run) for (let k = 0; k < 8; k++) {
        const dt = dtAll / 8, sx = x + Math.cos(th) * 30, sy = y + Math.sin(th) * 30;
        const [si, sd] = nearest(P, sx, sy, sidx); sidx = si;
        e = sd < 18 ? sideErr(P, si, sx, sy, sd) / PX3 : Math.sign(pe || 1) * 7;
        lostT = sd < 45 ? 0 : lostT + dt;
        if (lostT > 1.2) { run = false; go.textContent = '▶ انطلق'; lost.classList.add('on'); break; }
        tick += dt;
        if (tick >= 0.04) { tick -= 0.04; const turn = +kp.value * e + (kd.value / 10) * (e - pe) / 0.04; pe = e;
          cl = clamp(+pb.value + turn, -255, 255); cr = clamp(+pb.value - turn, -255, 255); }
        wl += (pwmV(cl, PX3) - wl) * dt / 0.2; wr += (pwmV(cr, PX3) - wr) * dt / 0.2;
        const v = (wl + wr) / 2, w = (wr - wl) / WB3; th -= w * dt; x += Math.cos(th) * v * dt; y += Math.sin(th) * v * dt;
        sum += Math.abs(e) * dt; cnt += dt; lapT += dt;
        const [bi] = nearest(P, x, y, idx); sweep += ((bi - idx + P.length * 1.5) % P.length) - P.length / 2; idx = bi;
        if (sweep >= P.length) { sweep -= P.length; best = best === null ? lapT : Math.min(best, lapT); lapT = 0; }
      }
      if (run && (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 4)) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 260) pts.shift(); }
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`);
      trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
      plotT += dtAll; if (plotT > 0.05) { plotT = 0; plotFeed(plot, buf, clamp(e, -8, 8) + 8, 16, 90); }
      sl.querySelector('#pea').textContent = cnt ? f1(sum / cnt) + ' سم' : '—'; sl.querySelector('#pcur').textContent = f1(lapT); sl.querySelector('#pbest').textContent = best === null ? '—' : f1(best) + ' ث';
      runLines(sl, '.pleft', run ? [5, 6, 7, 8, 9] : []);
      raf = requestAnimationFrame(loop);
    };
    const th0 = plot.querySelector('.pth'); th0.style.display = ''; th0.setAttribute('y1', 95); th0.setAttribute('y2', 95);
    ui(); reset(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- الرادار ---------------- */
  radarlab(sl) {
    const svg = sl.querySelector('.rarena'), car = sl.querySelector('#rcar'), head = sl.querySelector('#rhead'), rayEl = sl.querySelector('#rray'), hit = sl.querySelector('#rhit'), trail = sl.querySelector('#rtrail');
    const sweep = sl.querySelector('#rsweep'), blipG = sl.querySelector('#rblips'), go = sl.querySelector('#rgo');
    const boxes = RBOX.map(b => [...b]); dragBoxes(svg, boxes, [...sl.querySelectorAll('.rarena .abox')], RW, RH);
    const blocked = (px, py) => px < 8 || py < 8 || px > RW - 8 || py > RH - 8 || inBox(boxes, px, py);
    let x, y, th, st, stT, hang, tgt, dR, dL, run = false, last = 0, raf = 0, pts, blips = [];
    const reset = () => { x = 110; y = 110; th = 0; st = 'fwd'; stT = 0; hang = 90; tgt = 90; dR = dL = 0; pts = []; blips = []; };
    const measure = a => { const fx = x + Math.cos(th) * 46, fy = y + Math.sin(th) * 46, ang = th + (90 - a) * Math.PI / 180; const d = ray(fx, fy, ang, blocked, 800); return [d / RPX, fx, fy, ang, d]; };
    const NAMES = { fwd: ['للأمام ⬆', [8]], stop: ['قف وانظر يمينًا 👉', [9, 10, 2, 3, 4]], lookL: ['انظر يسارًا 👈', [11, 2, 3, 4]], center: ['قارن: أين الطريق أوسع؟', [12, 13, 14]], turnL: ['استدر يسارًا ↺', [13, 15]], turnR: ['استدر يمينًا ↻', [14, 15]] };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      hang += clamp(tgt - hang, -600 * dt, 600 * dt);                   // السيرفو يدور ٦٠٠ درجة/ث تقريبًا
      let [cm, fx, fy, ang, dpx] = measure(hang);
      if (run) {
        stT -= dt;
        if (st === 'fwd') { if (measure(90)[0] <= 25) { st = 'stop'; stT = 0.35; tgt = 30; } else { const v = pwmV(180, RPX), nx = x + Math.cos(th) * v * dt, ny = y + Math.sin(th) * v * dt; if (!blocked(nx + Math.cos(th) * 40, ny + Math.sin(th) * 40)) { x = nx; y = ny; } else { st = 'stop'; stT = 0.35; tgt = 30; } } }
        else if (st === 'stop' && stT <= 0) { dR = measure(30)[0]; blips.push([30, dR, 1]); st = 'lookL'; stT = 0.45; tgt = 150; }
        else if (st === 'lookL' && stT <= 0) { dL = measure(150)[0]; blips.push([150, dL, 1]); st = 'center'; stT = 0.3; tgt = 90; }
        else if (st === 'center' && stT <= 0) { st = dL > dR ? 'turnL' : 'turnR'; stT = 0.35; }
        else if (st === 'turnL' || st === 'turnR') { const w = 2 * pwmV(180, RPX) / (13 * RPX) * 0.55; th += (st === 'turnL' ? -1 : 1) * w * dt; if (stT <= 0) { st = 'fwd'; } }
        if (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 6) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 260) pts.shift(); }
        if (st === 'fwd' || Math.random() < 0.15) blips.push([Math.round(hang), cm, 0.7]);
      }
      blips = blips.map(b => [b[0], b[1], b[2] - dt * 0.35]).filter(b => b[2] > 0).slice(-60);
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`);
      head.setAttribute('transform', `rotate(${90 - hang} 42 0)`);
      rayEl.setAttribute('x1', fx); rayEl.setAttribute('y1', fy); rayEl.setAttribute('x2', fx + Math.cos(ang) * dpx); rayEl.setAttribute('y2', fy + Math.sin(ang) * dpx);
      hit.setAttribute('cx', fx + Math.cos(ang) * dpx); hit.setAttribute('cy', fy + Math.sin(ang) * dpx);
      svg.classList.toggle('near', cm <= 25);
      const t = hang * Math.PI / 180; sweep.setAttribute('x2', 200 + Math.cos(t) * 190); sweep.setAttribute('y2', 210 - Math.sin(t) * 190);
      blipG.innerHTML = blips.map(([a, d, o]) => { const r = Math.min(190, d / 25 * 60), tt = a * Math.PI / 180; return `<circle cx="${200 + Math.cos(tt) * r}" cy="${210 - Math.sin(tt) * r}" r="6" fill="#7ee2a8" opacity="${o.toFixed(2)}"/>`; }).join('');
      sl.querySelector('#rst').textContent = run ? NAMES[st][0] : 'متوقف';
      runLines(sl, '.rleft', run ? NAMES[st][1] : []);
      trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
      raf = requestAnimationFrame(loop);
    };
    go.onclick = () => { run = !run; go.textContent = run ? '⏸ توقف' : '▶ انطلق'; };
    sl.querySelector('#rrs').onclick = () => { reset(); run = false; go.textContent = '▶ انطلق'; };
    reset(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- الروبوت المدمج ---------------- */
  combolab(sl) {
    const P = trackOf(0), car = sl.querySelector('#cmcar'), trail = sl.querySelector('#cmtrail'), go = sl.querySelector('#cmgo'), svg = sl.querySelector('.cmarena'), rayEl = sl.querySelector('#cmray');
    sl.querySelector('#cmpath').setAttribute('d', trackPath(P));
    const SEN = [-15, 0, 15], boxes = [P[350], P[1050]].map(([bx, by]) => [bx - 22, by - 22, 44, 44]);
    sl.querySelector('#cmboxes').innerHTML = boxes.map((b, i) => `<g class="abox" data-i="${i}"><rect x="${b[0]}" y="${b[1]}" width="44" height="44" rx="6"/><text x="${b[0] + 22}" y="${b[1] + 32}">📦</text></g>`).join('');
    dragBoxes(svg, boxes, [...sl.querySelectorAll('#cmboxes .abox')], 1000, 560);
    sl.querySelector('#cmsens').innerHTML = SEN.map((o, i) => `<circle cx="28.5" cy="${o * .95}" r="5.5" class="lsd" id="cms${i}"/>`).join('');
    const onLine = (px, py) => { let m = 1e9; for (let i = 0; i < P.length; i += 2) { const d = (P[i][0] - px) ** 2 + (P[i][1] - py) ** 2; if (d < m) m = d; } return Math.sqrt(m) < 9 ? 1 : 0; };
    let x, y, th, st, stT, mem, L, R, idx, sweep, laps, avoided, T, run = false, last = 0, raf = 0, pts, s = [0, 0, 0], d = 0;
    const reset = () => { [x, y] = P[0]; th = Math.atan2(P[6][1] - y, P[6][0] - x); st = 'follow'; stT = 0; mem = 0; L = R = 0; idx = 0; sweep = 0; laps = 0; avoided = 0; T = 0; pts = []; };
    const NAMES = { follow: ['يتبع الخط', [3]], out: ['يستدير يمينًا', [2, 7]], arc: ['يلتف حول العائق', [8]], seek: ['يبحث عن الخط', [9]], fwd: ['يتقدم قليلًا', [10]], align: ['يستقيم على الخط', [11]] };
    const loop = ts => {
      const dtAll = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      if (run) for (let k = 0; k < 4; k++) {
        const dt = dtAll / 4, fx = x + Math.cos(th) * 30, fy = y + Math.sin(th) * 30;
        s = SEN.map(o => onLine(fx - Math.sin(th) * o, fy + Math.cos(th) * o));
        d = ray(x + Math.cos(th) * 36, y + Math.sin(th) * 36, th, (px, py) => inBox(boxes, px, py), 300) / 3;
        stT -= dt;
        if (st === 'follow') {
          if (d < 15) { st = 'out'; stT = 0.24; }
          else { const b = 160, [l, m, r] = s; if (l) { L = 0; R = b; mem = -1; } else if (r) { L = b; R = 0; mem = 1; } else if (m) { L = b; R = b; } else if (mem === -1) { L = -120; R = 120; } else { L = 120; R = -120; } }
        }
        if (st === 'out') { L = 180; R = -180; if (stT <= 0) { st = 'arc'; stT = 0.8; } }
        else if (st === 'arc') { L = 110; R = 200; if (stT <= 0) st = 'seek'; }
        else if (st === 'seek') { L = 110; R = 200; if (s.some(Boolean)) { st = 'fwd'; stT = 0.12; } }
        else if (st === 'fwd') { L = 110; R = 200; if (stT <= 0) { st = 'align'; stT = 1.2; } }
        else if (st === 'align') { L = 150; R = -150; if (s[1] || stT <= 0) { st = 'follow'; mem = 1; avoided++; } }
        const vl = pwmV(L, 3), vr = pwmV(R, 3), v = (vl + vr) / 2, w = (vr - vl) / 39;
        th -= w * dt; x = clamp(x + Math.cos(th) * v * dt, 20, 980); y = clamp(y + Math.sin(th) * v * dt, 20, 540); T += dt;
        const [bi] = nearest(P, x, y, idx, 120); sweep += ((bi - idx + P.length * 1.5) % P.length) - P.length / 2; idx = bi;
        if (sweep >= P.length) { sweep -= P.length; laps++; }
      }
      if (run && (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 5)) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 300) pts.shift(); }
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`);
      trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
      const rx = x + Math.cos(th) * 36, ry = y + Math.sin(th) * 36; rayEl.setAttribute('x1', rx); rayEl.setAttribute('y1', ry); rayEl.setAttribute('x2', rx + Math.cos(th) * Math.min(300, d * 3)); rayEl.setAttribute('y2', ry + Math.sin(th) * Math.min(300, d * 3));
      svg.classList.toggle('near', d < 15);
      s.forEach((v, i) => sl.querySelector('#cms' + i).classList.toggle('blk', !!v));
      sl.querySelector('#cmr').innerHTML = s.map(v => `<i class="${v ? 'b' : ''}">${v}</i>`).join('');
      sl.querySelector('#cmd').textContent = d >= 100 ? '100+' : AR(Math.round(d)); sl.querySelector('#cms').textContent = run ? NAMES[st][0] : 'متوقف';
      sl.querySelector('#cmlap').textContent = AR(laps); sl.querySelector('#cmav').textContent = AR(avoided); sl.querySelector('#cmt').textContent = f1(T);
      runLines(sl, '.rleft', run ? NAMES[st][1] : []);
      raf = requestAnimationFrame(loop);
    };
    go.onclick = () => { run = !run; go.textContent = run ? '⏸ توقف' : '▶ انطلق'; };
    sl.querySelector('#cmrs').onclick = () => { reset(); run = false; go.textContent = '▶ انطلق'; };
    reset(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- السومو ---------------- */
  sumolab(sl) {
    const bots = [0, 1].map(i => sl.querySelector('#sbot' + i)), over = sl.querySelector('#sover'), go = sl.querySelector('#sgo'), rayEl = sl.querySelector('#sray');
    const atk = sl.querySelector('#sa'); let opp = 'wander', edgeOn = true, score = [0, 0], phase = 'idle', cd = 0, raf = 0, last = 0, B;
    const place = () => { B = [{ x: SCX - 60, y: SCY, th: 0, st: 'search', t: 0, L: 0, R: 0, dir: 1 }, { x: SCX + 60, y: SCY, th: Math.PI, st: 'search', t: 0, L: 0, R: 0, dir: -1, wt: 0 }]; };
    const show = (a, b) => { sl.querySelector('#sov1').textContent = a; sl.querySelector('#sov2').textContent = b; over.classList.add('on'); };
    const edgeSensors = b => [-22, 22].map(o => { const ex = b.x + Math.cos(b.th) * 26 - Math.sin(b.th) * o, ey = b.y + Math.sin(b.th) * 26 + Math.cos(b.th) * o; return Math.hypot(ex - SCX, ey - SCY) > SR - 16; });
    const sees = (b, o) => { const dx = o.x - b.x, dy = o.y - b.y, dist = Math.hypot(dx, dy), a = Math.atan2(dy, dx) - b.th, da = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(da) < 0.2 && dist / SPX < 40 + 9 ? dist / SPX - 9 : 99; };
    const brain = (b, o, i, dt) => {                                    // نفس منطق الكود المعروض (روبوتنا)، ومنطق أبسط للخصم
      b.t -= dt;
      if (i === 1 && opp === 'still') { b.L = b.R = 0; return; }
      if (i === 1 && opp === 'wander') { b.wt -= dt; if (b.wt <= 0) { b.wt = 0.6 + Math.random(); b.L = 140 + Math.random() * 60; b.R = 140 + Math.random() * 60; if (Math.random() < .3) { b.L = 160; b.R = -160; } } if (edgeSensors(b).some(Boolean)) { b.L = -200; b.R = -200; b.wt = 0.4; } return; }
      const useEdge = i === 1 || edgeOn, power = i === 0 ? +atk.value : 200;
      if (b.st === 'back') { b.L = b.R = -255; if (b.t <= 0) { b.st = 'spin'; b.t = 0.25; } return; }
      if (b.st === 'spin') { b.L = 255; b.R = -255; if (b.t <= 0) b.st = 'search'; return; }
      if (useEdge && edgeSensors(b).some(Boolean)) { b.st = 'back'; b.t = 0.3; b.L = b.R = -255; return; }
      if (sees(b, o) < 40) { b.L = b.R = power; b.st = 'attack'; } else { b.L = 150 * b.dir; b.R = -150 * b.dir; b.st = 'search'; }
    };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      if (phase === 'count') { cd -= dt; show(cd > 0 ? AR(Math.ceil(cd)) : 'هاجم!', 'قانون السومو: انتظر ٥ ثوانٍ بعد البدء'); if (cd <= -0.4) { phase = 'fight'; over.classList.remove('on'); } }
      if (phase === 'fight') {
        B.forEach((b, i) => brain(b, B[1 - i], i, dt));
        const F = B.map(b => (pwmV(b.L, SPX) + pwmV(b.R, SPX)) / 2);
        B.forEach((b, i) => { const vl = pwmV(b.L, SPX), vr = pwmV(b.R, SPX), w = (vr - vl) / (8 * SPX); b.th -= w * dt; b.x += Math.cos(b.th) * F[i] * dt; b.y += Math.sin(b.th) * F[i] * dt; });
        const [a, c] = B, dx = c.x - a.x, dy = c.y - a.y, dist = Math.hypot(dx, dy);
        if (dist < BR * 2) {                                            // تصادم: الأقوى دفعًا يزيح الآخر
          const nx = dx / dist, ny = dy / dist, pa = Math.max(0, F[0] * (Math.cos(a.th) * nx + Math.sin(a.th) * ny)), pc = Math.max(0, F[1] * -(Math.cos(c.th) * nx + Math.sin(c.th) * ny));
          const net = (pa - pc) * dt * 0.9, push = (BR * 2 - dist) / 2;
          a.x += nx * (net - push); a.y += ny * (net - push); c.x += nx * (net + push); c.y += ny * (net + push);
        }
        const outI = B.findIndex(b => Math.hypot(b.x - SCX, b.y - SCY) > SR + 8);
        if (outI >= 0) { score[1 - outI]++; phase = 'end'; show(outI === 1 ? '🔵 نقطة لروبوتنا!' : '🔴 نقطة للخصم', `${AR(score[0])} − ${AR(score[1])}`);
          sl.querySelector('#ss0').textContent = AR(score[0]); sl.querySelector('#ss1').textContent = AR(score[1]);
          if (score[0] === 2 || score[1] === 2) { const weWon = score[0] === 2; setTimeout(() => show(weWon ? '🏆 فاز روبوتنا بالنزال!' : '😓 فاز الخصم بالنزال', 'الفائز من يسجل نقطتين أولًا'), 1200); score = [0, 0]; go.textContent = '▶ نزال جديد'; }
          else go.textContent = '▶ الجولة التالية'; }
      }
      B.forEach((b, i) => bots[i].setAttribute('transform', `translate(${b.x} ${b.y}) rotate(${b.th * 180 / Math.PI})`));
      const me = B[0], sd = sees(me, B[1]), L = sd < 99 ? (sd + 9) * SPX : 40 * SPX;
      rayEl.setAttribute('x1', me.x); rayEl.setAttribute('y1', me.y); rayEl.setAttribute('x2', me.x + Math.cos(me.th) * L); rayEl.setAttribute('y2', me.y + Math.sin(me.th) * L);
      sl.querySelector('.sarena').classList.toggle('near', sd < 40);
      edgeSensors(me).forEach((v, i) => sl.querySelector('#e' + i).classList.toggle('on', v));
      const lines = phase !== 'fight' ? (phase === 'count' ? [2] : []) : me.st === 'back' ? [6, 7] : me.st === 'spin' ? [8] : me.st === 'attack' ? [9, 10] : [12];
      runLines(sl, '.sleft', lines);
      sl.querySelector('#sst').textContent = { idle: 'جاهز', count: '⏳ العد التنازلي', fight: { search: '🔍 يبحث', attack: '⚔️ يهاجم!', back: '⚠️ الحافة! للخلف', spin: '↻ يستدير' }[me.st], end: 'انتهت الجولة' }[phase];
      raf = requestAnimationFrame(loop);
    };
    go.onclick = () => { place(); phase = 'count'; cd = 5; over.classList.add('on'); go.textContent = '⏳ …'; };
    sl.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { opp = b.dataset.o; sl.querySelectorAll('[data-o]').forEach(x => x.classList.toggle('on', x === b)); });
    atk.oninput = () => sl.querySelector('#sav').textContent = atk.value;
    sl.querySelector('#sedge').onclick = e => { edgeOn = !edgeOn; e.target.textContent = edgeOn ? '✅ حساسات الحافة تعمل' : '❌ حساسات الحافة مفصولة'; };
    place(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- المتاهة ---------------- */
  mazelab(sl) {
    const wallsG = sl.querySelector('#mwalls'), car = sl.querySelector('#mcar'), trail = sl.querySelector('#mtrail'), win = sl.querySelector('#mwin'), go = sl.querySelector('#mgo'), spd = sl.querySelector('#msp');
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];                       // الاتجاهات: يمين، أسفل، يسار، أعلى (على الشاشة)
    let W, cx, cy, dir, hand = 1, steps = 0, run = false, acc = 0, last = 0, raf = 0, pts, ax, ay, adir, done;
    const gen = () => {
      W = Array.from({ length: MR }, () => Array.from({ length: MC }, () => [1, 1, 1, 1]));   // جدار في كل اتجاه
      const seen = Array.from({ length: MR }, () => Array(MC).fill(false)), stack = [[0, 0]]; seen[0][0] = true;
      while (stack.length) { const [x, y] = stack[stack.length - 1], nb = [0, 1, 2, 3].filter(d => { const nx = x + DX[d], ny = y + DY[d]; return nx >= 0 && ny >= 0 && nx < MC && ny < MR && !seen[ny][nx]; });
        if (!nb.length) { stack.pop(); continue; } const d = nb[Math.floor(Math.random() * nb.length)], nx = x + DX[d], ny = y + DY[d]; W[y][x][d] = 0; W[ny][nx][(d + 2) % 4] = 0; seen[ny][nx] = true; stack.push([nx, ny]); }
      let h = ''; for (let y = 0; y < MR; y++) for (let x = 0; x < MC; x++) { const X = 4 + x * CS, Y = 4 + y * CS, w = W[y][x];
        if (w[3]) h += `<line x1="${X}" y1="${Y}" x2="${X + CS}" y2="${Y}"/>`; if (w[2]) h += `<line x1="${X}" y1="${Y}" x2="${X}" y2="${Y + CS}"/>`;
        if (x === MC - 1 && w[0]) h += `<line x1="${X + CS}" y1="${Y}" x2="${X + CS}" y2="${Y + CS}"/>`; if (y === MR - 1 && w[1]) h += `<line x1="${X}" y1="${Y + CS}" x2="${X + CS}" y2="${Y + CS}"/>`; }
      wallsG.innerHTML = h;
      const g = sl.querySelector('#mgoal'); g.setAttribute('x', 4 + (MC - 0.5) * CS); g.setAttribute('y', 4 + (MR - 0.5) * CS + 14);
      reset();
    };
    const reset = () => { cx = 0; cy = 0; dir = 0; ax = cx; ay = cy; adir = 0; steps = 0; pts = [[cx, cy]]; done = false; win.classList.remove('on'); setFacts('—', []); };
    const free = d => !W[cy][cx][(d + 4) % 4];
    const setFacts = (t, ln) => { sl.querySelector('#mdc').textContent = t; sl.querySelector('#mst').textContent = AR(steps); runLines(sl, '.mleft', ln); };
    const step = () => {
      if (done) return;
      const r = (dir + hand + 4) % 4, l = (dir - hand + 4) % 4;               // يمين اليد المختارة ويسارها
      let txt, ln;
      if (free(r)) { dir = r; txt = hand > 0 ? 'يمين مفتوح ↱' : 'يسار مفتوح ↰'; ln = [2]; }
      else if (free(dir)) { txt = 'الأمام مفتوح ⬆'; ln = [3]; }
      else if (free(l)) { dir = l; txt = hand > 0 ? 'يسار مفتوح ↰' : 'يمين مفتوح ↱'; ln = [4]; }
      else { dir = (dir + 2) % 4; txt = 'طريق مسدود ↩'; ln = [5]; setFacts(txt, ln); return; }
      cx += DX[dir]; cy += DY[dir]; steps++; pts.push([cx, cy]); setFacts(txt, ln);
      if (cx === MC - 1 && cy === MR - 1) { done = true; run = false; go.textContent = '▶ انطلق'; win.classList.add('on'); sl.querySelector('#mwt').textContent = `في ${AR(steps)} خطوة`; }
    };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      if (run) { acc += dt * spd.value * 1.6; while (acc >= 1 && run) { acc -= 1; step(); } }
      ax += (cx - ax) * Math.min(1, dt * 10); ay += (cy - ay) * Math.min(1, dt * 10);
      let da = dir * 90 - adir; da = ((da + 540) % 360) - 180; adir += da * Math.min(1, dt * 10);
      car.setAttribute('transform', `translate(${4 + (ax + 0.5) * CS} ${4 + (ay + 0.5) * CS}) rotate(${adir})`);
      trail.setAttribute('d', 'M' + pts.map(([x, y]) => `${4 + (x + 0.5) * CS} ${4 + (y + 0.5) * CS}`).join(' L'));
      raf = requestAnimationFrame(loop);
    };
    go.onclick = () => { if (done) reset(); run = !run; go.textContent = run ? '⏸ توقف' : '▶ انطلق'; };
    sl.querySelector('#mnew').onclick = () => { run = false; go.textContent = '▶ انطلق'; gen(); };
    sl.querySelector('#mstep').onclick = () => { run = false; go.textContent = '▶ انطلق'; step(); };
    sl.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { hand = +b.dataset.h; sl.querySelectorAll('[data-h]').forEach(x => x.classList.toggle('on', x === b)); reset(); run = false; go.textContent = '▶ انطلق'; });
    gen(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
