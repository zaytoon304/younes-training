/* =====================================================================
   «ESP32 للمعلمين ٣» · مختبرات الروبوتات ٣–٦
   gline (متتبع الخط) · gcombo (خط + عوائق) · gsumo (السومو) · gsmart (السيارة المتكاملة: العقل من الجوال)
   كل «عقل» هنا ينفّذ منطق الكود المعروض حرفيًا، والسطر المنفَّذ يضيء
   ===================================================================== */
(function () {
const { AR, codeBlock } = window.ARD;
const { clamp, raf, run, cap, st, rng, frame, beep } = window.FZ;
const { PX, VB, AW, AH, stepCar, newCar, place, at, carSvg, floor, TRACKS, trackPts, pathD, lineMap, sonarCm, hitsBox, dragBoxes, boxSvg, trail, sel, Seq } = window.GZ;

const C = {
  line: `void loop() {
  int l = digitalRead(SL), c = digitalRead(SC), r = digitalRead(SR);
  if (c && !l && !r) {
    motors(FAST, FAST);
  } else if (l && !r) {
    motors(SLOW, FAST); lastSide = -1;
  } else if (r && !l) {
    motors(FAST, SLOW); lastSide = 1;
  } else if (l && c && r) {
    motors(FAST, FAST);
  } else {
    motors(150 * lastSide, -150 * lastSide);
  }
}`,
  combo: `void loop() {
  if (readCm() < 15) { avoid(); return; }
  followLine();
}
void avoid() {
  motors(0, 0); delay(200);
  motors(FAST, -FAST); delay(TURN45);
  motors(FAST, FAST);  delay(500);
  while (!lineSeen()) motors(110, 210);
  motors(FAST, FAST); delay(120);
  while (!digitalRead(SC)) motors(-140, 140);
}`,
  sumo: `void setup() {
  while (digitalRead(START) == HIGH) { }
  for (int i = 0; i < 10; i++) { blink(); delay(500); }
}
void loop() {
  bool edgeL = digitalRead(EL) == LOW, edgeR = digitalRead(ER) == LOW;
  if (edgeL || edgeR) {
    motors(-255, -255); delay(300);
    if (edgeL) motors(255, -255); else motors(-255, 255);
    delay(250);
  } else if (readCm() < 40) {
    motors(255, 255);
  } else {
    motors(150 * dir, -150 * dir);
  }
}`,
  smart: `void loop() {
  server.handleClient();
  if (millis() - last < 30) return;
  last = millis();
  cm = readCm();
  switch (mode) {
    case 'm': manual(); break;
    case 'a': avoidObstacle(); break;
    case 'l': followLine(); break;
    case 'c': if (cm < 15) goAround(); else followLine(); break;
    default:  motors(0, 0);
  }
}`,
};
window.GZ.C4 = C;

/* ---------- عقل تتبع الخط (يطابق LineFollow.ino) ---------- */
function lineBrain(S, FAST, SLOW) {
  const [l, c, r] = S;
  if (c && !l && !r) return { cmd: [FAST, FAST], ln: [3, 4], tx: '⬆ في المنتصف' };
  if (l && !r) return { cmd: [SLOW, FAST], ln: [5, 6], tx: '↰ يسارًا', side: -1 };
  if (r && !l) return { cmd: [FAST, SLOW], ln: [7, 8], tx: '↱ يمينًا', side: 1 };
  if (l && c && r) return { cmd: [FAST, FAST], ln: [9, 10], tx: '➕ تقاطع' };
  return { cmd: null, ln: [11, 12], tx: '❓ ضاع الخط' };
}
// حلبة أصغر للدمج والسيارة المتكاملة: مساحة للالتفاف خارج المنحنى
const smallTrack = () => Array.from({ length: 900 }, (_, i) => { const t = i / 900 * Math.PI * 2; return [500 + 290 * Math.cos(t), 390 + 210 * Math.sin(t)]; });
const readIR = (c, on) => [-14, 0, 14].map(fy => on(...at(c, 40, fy)));
const paintIR = (sl, id, S) => S.forEach((v, i) => { const e = sl.querySelector(`#${id}ir${i}`); if (e) e.setAttribute('fill', v ? '#46d68c' : '#3b4256'); });
const irDots = () => `<div class="glir">${['يسار SL', 'وسط SC', 'يمين SR'].map((t, i) => `<div><i id="gli${i}"></i><small>${t}</small><b id="glv${i}">0</b></div>`).join('')}</div>`;
const showIR = (sl, S) => S.forEach((v, i) => { sl.querySelector('#gli' + i).classList.toggle('on', !!v); sl.querySelector('#glv' + i).textContent = v; });

/* ---------- السومو ---------- */
const SCX = 500, SCY = 430, SR = 370, SK = 9.6, BR = 46;   // حلبة ٧٧ سم · ٩٫٦ بكسل لكل سم · روبوت ١٠ سم
const sumoV = p => Math.abs(p) < 50 ? 0 : p / 255 * 55 * SK * 0.75;
const OPP = [['🧍 دمية ثابتة', 'still'], ['🎲 يتجول', 'wander'], ['🤖 مهاجم ذكي', 'smart']];
const sumoBot = (id, col, me) => `<g id="${id}"><rect x="-${BR}" y="-${BR}" width="${BR * 2}" height="${BR * 2}" rx="10" fill="${col}" stroke="#111" stroke-width="4"/>
  <path d="M${BR} -${BR} L${BR + 16} -${BR - 6} L${BR + 16} ${BR - 6} L${BR} ${BR} Z" fill="#c9cfe6" stroke="#5b6383" stroke-width="3"/>
  ${me ? `<circle cx="${BR - 8}" cy="-${BR - 10}" r="8" id="se0" fill="#3b4256"/><circle cx="${BR - 8}" cy="${BR - 10}" r="8" id="se1" fill="#3b4256"/><rect x="${BR - 20}" y="-14" width="12" height="28" rx="3" fill="#2b6fc0"/>` : ''}
  <rect x="-24" y="-16" width="26" height="32" rx="4" fill="#1f2a44"/></g>`;

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  gline: s => frame(s, 'gline', VB, `${floor('glf')}<path id="lpath" fill="none" stroke="#1b1b1b" stroke-width="22" stroke-linejoin="round"/>
      <path id="ltr" fill="none" stroke="#e67e22" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/><g id="lcar">${carSvg({ ir: true, id: 'lc' })}</g>
      <g id="llost" opacity="0"><rect x="280" y="40" width="440" height="70" rx="18" fill="#962d22"/><text x="500" y="88" text-anchor="middle" class="fza" style="font-size:28px">😵 خرج عن المسار</text></g>`,
    `<div class="fzrow"><button class="fzb go" data-a="go">▶ انطلق</button>${TRACKS.map((t, i) => `<button class="fzb${i ? '' : ' on'}" data-t="${i}">${t.n}</button>`).join('')}</div>
    ${rng('lf', 'FAST', 120, 255, 200, 5)}${rng('ls', 'SLOW', -120, 150, 60, 5)}
    <div class="glrow">${irDots()}<div class="fzstats" style="flex:1">${st('lcase', 'الحالة')}${st('lmot', 'motors')}</div></div>
    ${codeBlock(C.line)}<div class="fzcap"></div>`),

  gcombo: s => frame(s, 'gcombo', VB, `${floor('gcf')}<path id="cpath" fill="none" stroke="#1b1b1b" stroke-width="22" stroke-linejoin="round"/>
      ${boxSvg([[450, 556, 100, 90]])}<path id="cbeam" fill="#4fc3f7" opacity=".2"/>
      <path id="ctr" fill="none" stroke="#e67e22" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/><g id="ccar">${carSvg({ ir: true, sonar: true, id: 'cc' })}</g>`,
    `<div class="fzrow"><button class="fzb go" data-a="go">▶ انطلق</button><button class="fzb" data-a="rs">↺</button><span class="rl" style="font-size:17px;font-weight:800;color:var(--muted)">اسحب الصندوق إلى أي مكان على الخط</span></div>
    <div class="glrow">${irDots()}<div class="fzstats" style="flex:1">${st('ccm', 'readCm()')}${st('cst', 'الخطوة')}</div></div>
    ${codeBlock(C.combo)}<div class="fzcap"></div>`),

  gsumo: s => frame(s, 'gsumo', VB, `<rect width="${AW}" height="${AH}" fill="#2a2f3d"/>
      <circle cx="${SCX}" cy="${SCY}" r="${SR}" fill="#111" stroke="#f4f4f4" stroke-width="22"/>
      <line x1="${SCX - 70}" y1="${SCY - 60}" x2="${SCX - 70}" y2="${SCY + 60}" stroke="#a0522d" stroke-width="8"/><line x1="${SCX + 70}" y1="${SCY - 60}" x2="${SCX + 70}" y2="${SCY + 60}" stroke="#a0522d" stroke-width="8"/>
      <line id="sray" stroke="#4fc3f7" stroke-width="4" stroke-dasharray="8 6"/>${sumoBot('sb0', '#2b6fc0', true)}${sumoBot('sb1', '#c0392b')}
      <g id="sover" opacity="0"><rect x="${SCX - 300}" y="${SCY - 70}" width="600" height="140" rx="24" fill="#101b45" stroke="#f0cc7a" stroke-width="5"/><text x="${SCX}" y="${SCY + 4}" text-anchor="middle" class="fza" style="font-size:48px" id="sov1"></text><text x="${SCX}" y="${SCY + 46}" text-anchor="middle" class="fza" style="font-size:24px;fill:#9ec5ff" id="sov2"></text></g>`,
    `<div class="fzrow"><button class="fzb go" data-a="boot">🔘 اضغط BOOT</button><div class="gscore"><span>🔵 روبوتنا <b id="ss0">٠</b></span><span>🔴 الخصم <b id="ss1">٠</b></span></div></div>
    <div class="fzrow"><label>الخصم</label>${OPP.map(([t, k], i) => `<button class="fzb${i === 1 ? ' on' : ''}" data-o="${k}">${t}</button>`).join('')}</div>
    <div class="fzrow"><button class="fzb on" data-a="edge">✅ حساسا الحافة يعملان</button>${rng('sa', '⚔️ الهجوم', 150, 255, 255, 5).replace('<div class="fzrow">', '').replace(/<\/div>$/, '')}</div>
    <div class="fzstats">${st('sst', 'الحالة', 'جاهز')}${st('sed', 'EL · ER', '1 · 1')}${st('scm', 'readCm()')}</div>
    ${codeBlock(C.sumo)}<div class="fzcap"></div>`),

  gsmart: s => frame(s, 'gsmart', VB, `${floor('gmf')}<path id="mpath" fill="none" stroke="#1b1b1b" stroke-width="22" stroke-linejoin="round"/>
      ${boxSvg([[450, 556, 100, 90], [160, 700, 150, 100]])}<path id="mbeam" fill="#4fc3f7" opacity=".2"/>
      <path id="mtr" fill="none" stroke="#e67e22" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/><g id="mcar">${carSvg({ ir: true, sonar: true, id: 'mc', color: '#8e44ad' })}</g>`,
    `<div class="gsph"><div class="gsmodes">${[['m', '🎮 يدوي'], ['a', '🧱 عوائق'], ['l', '〰️ خط'], ['c', '🔀 خط+عوائق'], ['x', '⏹️ قف']].map(([k, t]) => `<button class="fzb${k === 'x' ? ' on' : ''}" data-m="${k}">${t}</button>`).join('')}</div>
      <svg viewBox="0 0 300 300" class="gjpad ix" id="mpad"><circle cx="150" cy="150" r="140" fill="#2e4288" stroke="#8d9bd0" stroke-width="8"/><circle id="mk" cx="150" cy="150" r="52" fill="#f0cc7a"/></svg></div>
    <div class="fzstats s4">${st('mmo', 'mode', "'x'")}${st('mcm', 'cm')}${st('mlcr', 'l c r', '000')}${st('mmt', 'motors')}</div>
    ${codeBlock(C.smart)}<div class="fzcap"></div>`),
});

/* ---------- الربط ---------- */
Object.assign(window.DECK_BIND, {
  gline(sl) {
    const R = id => sl.querySelector('#' + id); let P, on, c, pts, go = false, side = 0, lostT = 0, ti = 0;
    const load = i => { ti = i; P = trackPts(i); on = lineMap(P); R('lpath').setAttribute('d', pathD(P)); const a = P[0], b = P[8]; c = newCar(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0])); pts = []; side = 0; lostT = 0; };
    load(0);
    sl.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { load(+b.dataset.t); sel(sl, 't', ti); });
    sl.querySelector('[data-a=go]').onclick = e => { go = !go; if (go && lostT > 1.5) load(ti); e.target.classList.toggle('on', go); e.target.textContent = go ? '⏸ أوقف' : '▶ انطلق'; };
    raf(dt => {
      const S = readIR(c, on), F = +R('lf').value, SL = +R('ls').value, b = lineBrain(S, F, SL);
      if (b.side) side = b.side;
      let cmd = b.cmd || [150 * side, -150 * side];
      if (!go) cmd = [0, 0];
      stepCar(c, cmd[0], cmd[1], dt);
      lostT = S.some(Boolean) ? 0 : lostT + (go ? dt : 0);
      place(R('lcar'), c); R('ltr').setAttribute('d', trail(pts, c, 300)); paintIR(sl, 'lc', S); showIR(sl, S);
      R('lf').previousElementSibling.textContent = 'FAST = ' + F; R('ls').previousElementSibling.textContent = 'SLOW = ' + SL;
      R('lcase').textContent = b.tx; R('lmot').textContent = cmd.join(','); R('llost').setAttribute('opacity', lostT > 1.5 ? 1 : 0);
      run(sl, go ? [2, ...b.ln] : []);
      cap(sl, !go ? 'كل حساس يقرأ 1 على الأسود و0 على الأبيض. ثلاث قراءات = ثماني حالات، والكود يقرر لكل حالة' :
        lostT > 1.5 ? 'ضاع الخط! جرّب SLOW أصغر (حتى سالبًا: العجلة الداخلية تدور للخلف فيضيق المنعطف) أو FAST أقل' :
        !b.cmd ? `لا حساس يرى الخط ← يدور نحو آخر جهة رآه فيها (lastSide = ${side})… «ذاكرة» من سطر واحد` :
        b.ln[0] === 3 ? 'الوسط وحده يرى الأسود ← السيارة فوق الخط تمامًا ← انطلق بالسرعتين FAST' :
        `الخط تحت الحساس ${b.side < 0 ? 'الأيسر' : b.side > 0 ? 'الأيمن' : 'الثلاثة'} ← ${b.side ? `العجلة ${b.side < 0 ? 'اليسرى' : 'اليمنى'} تبطئ إلى SLOW فتنعطف السيارة نحو الخط` : 'تقاطع: اعبر مستقيمًا'}`,
        lostT > 1.5 ? 'bad' : 'ok');
    });
  },

  gcombo(sl) {
    const R = id => sl.querySelector('#' + id), svg = sl.querySelector('.fzsc svg'), boxes = [[450, 556, 100, 90]], P = smallTrack(), on = lineMap(P);
    R('cpath').setAttribute('d', pathD(P));
    const seq = Seq(); let c, pts, go = false, side = 0, step = '—', ln = [], cm = 200;
    const reset = () => { const a = P[450], b = P[442]; c = newCar(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0])); pts = []; seq.clear(); side = 0; };
    reset(); dragBoxes(svg, boxes);
    sl.querySelector('[data-a=go]').onclick = e => { go = !go; e.target.classList.toggle('on', go); e.target.textContent = go ? '⏸ أوقف' : '▶ انطلق'; };
    sl.querySelector('[data-a=rs]').onclick = reset;
    const F = 190;
    raf(dt => {
      cm = sonarCm(c, boxes); const S = readIR(c, on); let cmd = [0, 0];
      if (go) {
        if (!seq.busy() && cm < 15) seq.push({ l: 0, r: 0, t: .2, ln: [6], tx: '١) قف' }, { l: F, r: -F, t: .19, ln: [7], tx: '٢) انحرف يمينًا' },
          { l: F, r: F, t: .5, ln: [8], tx: '٣) ابتعد' }, { l: 110, r: 210, t: 4, until: () => readIR(c, on).some(Boolean), ln: [9], tx: '٤) قوس حتى الخط' },
          { l: F, r: F, t: .12, ln: [10], tx: '٥) اعبر قليلًا' }, { l: -140, r: 140, t: 2, until: () => readIR(c, on)[1], ln: [11], tx: '٦) استقم على الخط', end: () => side = -1 });
        const s = seq.step(dt);
        if (s) { cmd = [s.l, s.r]; ln = [2, ...s.ln]; step = s.tx; }
        else { const b = lineBrain(S, F, 60); if (b.side) side = b.side; cmd = b.cmd || [150 * side, -150 * side]; ln = [2, 3]; step = '〰️ يتبع الخط'; }
      } else ln = [];
      const prev = { ...c }; stepCar(c, cmd[0], cmd[1], dt); if (hitsBox(c, boxes)) { c.x = prev.x; c.y = prev.y; }
      place(R('ccar'), c); R('ctr').setAttribute('d', trail(pts, c, 420)); paintIR(sl, 'cc', S); showIR(sl, S);
      const [sx, sy] = at(c, 46, 0), L = Math.min(cm, 120) * PX;
      R('cbeam').setAttribute('d', `M${sx} ${sy} L${sx + Math.cos(c.th - .13) * L} ${sy + Math.sin(c.th - .13) * L} L${sx + Math.cos(c.th + .13) * L} ${sy + Math.sin(c.th + .13) * L} Z`);
      R('cbeam').setAttribute('fill', cm < 15 ? '#ff5a5a' : '#4fc3f7');
      R('ccm').textContent = cm >= 200 ? '200+' : cm.toFixed(0); R('cst').textContent = go ? step : '⏸';
      run(sl, ln);
      cap(sl, !go ? 'روبوتان في روبوت واحد: «متتبع الخط» من المحور السادس + «عين» المحور الخامس. السؤال: من له الأولوية؟' :
        seq.busy() ? `العائق أقرب من ١٥ سم ← <b>العائق له الأولوية</b> على الخط ← خطة الالتفاف خطوة بخطوة: ${step}` :
        'لا عائق ← <code>followLine()</code> كما كتبناها في المحور السادس بلا أي تغيير. هذه قوة الدوال: نجمعها كقطع الليغو', 'ok');
    });
  },

  gsumo(sl) {
    const R = id => sl.querySelector('#' + id), bots = [R('sb0'), R('sb1')]; let opp = 'wander', edgeOn = true, score = [0, 0], phase = 'idle', cd = 0, B;
    const reset = () => { B = [{ x: SCX - 90, y: SCY, th: 0, st: 'search', t: 0, L: 0, R: 0, dir: 1 }, { x: SCX + 90, y: SCY, th: Math.PI, st: 'search', t: 0, L: 0, R: 0, dir: -1, wt: 0 }]; };
    const show = (a, b) => { R('sov1').textContent = a; R('sov2').textContent = b; R('sover').setAttribute('opacity', 1); };
    const edges = b => [-(BR - 10), BR - 10].map(o => { const ex = b.x + Math.cos(b.th) * (BR - 8) - Math.sin(b.th) * o, ey = b.y + Math.sin(b.th) * (BR - 8) + Math.cos(b.th) * o; return Math.hypot(ex - SCX, ey - SCY) > SR - 11; });
    const sees = (b, o) => { const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) - b.th, da = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(da) < .22 && (d - BR * 2) / SK < 40 ? (d - BR * 2) / SK : 99; };
    const brain = (b, o, i, dt) => {
      b.t -= dt;
      if (i === 1 && opp === 'still') { b.L = b.R = 0; return; }
      if (i === 1 && opp === 'wander') { b.wt -= dt; if (b.wt <= 0) { b.wt = .6 + Math.random(); b.L = 140 + Math.random() * 60; b.R = 140 + Math.random() * 60; if (Math.random() < .3) { b.L = 160; b.R = -160; } } if (edges(b).some(Boolean)) { b.L = b.R = -200; b.wt = .4; } return; }
      const useEdge = i === 1 || edgeOn, power = i === 0 ? +R('sa').value : 210;
      if (b.st === 'back') { b.L = b.R = -255; if (b.t <= 0) { b.st = 'spin'; b.t = .25; b.L = 255 * b.sd; b.R = -255 * b.sd; } return; }
      if (b.st === 'spin') { b.L = 255 * b.sd; b.R = -255 * b.sd; if (b.t <= 0) b.st = 'search'; return; }
      const E = edges(b);
      if (useEdge && (E[0] || E[1])) { b.st = 'back'; b.t = .3; b.sd = E[0] ? 1 : -1; b.dir = b.sd; b.L = b.R = -255; return; }
      if (sees(b, o) < 40) { b.L = b.R = power; b.st = 'attack'; } else { b.L = 150 * b.dir; b.R = -150 * b.dir; b.st = 'search'; }
    };
    reset();
    sl.querySelector('[data-a=boot]').onclick = () => { if (phase === 'count' || phase === 'fight') return; reset(); phase = 'count'; cd = 5; beep(880, .08); };
    sl.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { opp = b.dataset.o; sel(sl, 'o', opp); });
    sl.querySelector('[data-a=edge]').onclick = e => { edgeOn = !edgeOn; e.target.classList.toggle('on', edgeOn); e.target.textContent = edgeOn ? '✅ حساسا الحافة يعملان' : '❌ حساسا الحافة مفصولان'; };
    let lastSec = 6;
    raf(dt => {
      if (phase === 'count') { cd -= dt; const s = Math.ceil(cd); if (s !== lastSec && s > 0) { lastSec = s; beep(660, .06); } show(cd > 0 ? AR(s) : 'هاجم!', 'قانون السومو: ٥ ثوانٍ بعد الضغط'); if (cd <= -.4) { phase = 'fight'; R('sover').setAttribute('opacity', 0); lastSec = 6; } }
      if (phase === 'fight') {
        B.forEach((b, i) => brain(b, B[1 - i], i, dt));
        const F = B.map(b => (sumoV(b.L) + sumoV(b.R)) / 2);
        B.forEach((b, i) => { const w = (sumoV(b.L) - sumoV(b.R)) / (BR * 2) * .9; b.th += w * dt; b.x += Math.cos(b.th) * F[i] * dt; b.y += Math.sin(b.th) * F[i] * dt; });
        const [a, c] = B, dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
        if (d < BR * 2.1) { const nx = dx / d, ny = dy / d, pa = Math.max(0, F[0] * (Math.cos(a.th) * nx + Math.sin(a.th) * ny)), pc = Math.max(0, F[1] * -(Math.cos(c.th) * nx + Math.sin(c.th) * ny));
          const net = (pa - pc) * dt * .9, push = (BR * 2.1 - d) / 2; a.x += nx * (net - push); a.y += ny * (net - push); c.x += nx * (net + push); c.y += ny * (net + push); }
        const out = B.findIndex(b => Math.hypot(b.x - SCX, b.y - SCY) > SR + 10);
        if (out >= 0) { score[1 - out]++; phase = 'end'; beep(out === 1 ? 1200 : 300, .25);
          show(out === 1 ? '🔵 نقطة لروبوتنا!' : '🔴 نقطة للخصم', `${AR(score[0])} − ${AR(score[1])}`);
          R('ss0').textContent = AR(score[0]); R('ss1').textContent = AR(score[1]);
          if (Math.max(...score) === 2) { const won = score[0] === 2; setTimeout(() => show(won ? '🏆 فاز روبوتنا بالنزال!' : '😓 فاز الخصم', 'الفائز من يسجل نقطتين أولًا'), 1200); score = [0, 0]; } }
      }
      B.forEach((b, i) => bots[i].setAttribute('transform', `translate(${b.x} ${b.y}) rotate(${b.th * 180 / Math.PI})`));
      const me = B[0], sd = sees(me, B[1]), E = edges(me), L = sd < 99 ? sd * SK + BR : 40 * SK + BR;
      R('sray').setAttribute('x1', me.x); R('sray').setAttribute('y1', me.y); R('sray').setAttribute('x2', me.x + Math.cos(me.th) * L); R('sray').setAttribute('y2', me.y + Math.sin(me.th) * L);
      R('sray').setAttribute('stroke', sd < 40 ? '#ff5a5a' : '#4fc3f7');
      E.forEach((v, i) => R('se' + i).setAttribute('fill', v ? '#fff' : '#3b4256'));
      R('sed').textContent = `${E[0] ? 0 : 1} · ${E[1] ? 0 : 1}`; R('scm').textContent = sd < 99 ? sd.toFixed(0) : '99+';
      const lines = phase === 'idle' || phase === 'end' ? [] : phase === 'count' ? [3] : me.st === 'back' ? [7, 8] : me.st === 'spin' ? [9, 10] : me.st === 'attack' ? [11, 12] : [14];
      run(sl, phase === 'idle' ? [2] : lines);
      R('sst').textContent = { idle: '⏳ ينتظر BOOT', count: '⏱️ العد', fight: { search: '🔍 يبحث', attack: '⚔️ يهاجم', back: '⚠️ الحافة!', spin: '↻ يبتعد' }[me.st], end: '🏁 انتهت' }[phase];
      cap(sl, phase === 'idle' ? 'الروبوت ينتظر في السطر ٢ حتى تضغط زر BOOT (GPIO0) الموجود على اللوحة أصلًا: لا نحتاج زرًا إضافيًا' :
        phase === 'count' ? 'العد التنازلي: الليد الأزرق (GPIO2) يومض ١٠ مرات × نصف ثانية = ٥ ثوانٍ كما يشترط قانون السومو' :
        phase === 'end' ? 'اضغط BOOT للجولة التالية. جرّب فصل حساسي الحافة: سيسقط روبوتنا وحده!' :
        me.st === 'back' || me.st === 'spin' ? '⚠️ حساس حافة رأى الأبيض (قرأ 0) ← <b>الحافة أولًا</b>: للخلف ثم ابتعد عن الجهة الخطرة… قبل أي هجوم' :
        me.st === 'attack' ? `الخصم على ${sd.toFixed(0)} سم ← هجوم بكل القوة ${R('sa').value}` : 'لا أحد أمامه ← يدور حول نفسه ويمسح الحلبة بعينه', me.st === 'back' ? 'bad' : 'ok');
    });
  },

  gsmart(sl) {
    const R = id => sl.querySelector('#' + id), svg = sl.querySelector('.fzsc svg'), boxes = [[450, 556, 100, 90], [160, 700, 150, 100]], P = smallTrack(), on = lineMap(P);
    R('mpath').setAttribute('d', pathD(P)); dragBoxes(svg, boxes);
    const seq = Seq(); let c = newCar(P[450][0], P[450][1], Math.atan2(P[442][1] - P[450][1], P[442][0] - P[450][0])), pts = [], mode = 'x', side = 0, jx = 0, jy = 0, drag = false, tx = '', aborted = 0;
    const pad = R('mpad'), knob = R('mk');
    const mv = e => { const r = pad.getBoundingClientRect(); let dx = (e.clientX - r.left) * 300 / r.width - 150, dy = (e.clientY - r.top) * 300 / r.height - 150; const d = Math.hypot(dx, dy); if (d > 100) { dx *= 100 / d; dy *= 100 / d; } knob.setAttribute('cx', 150 + dx); knob.setAttribute('cy', 150 + dy); jx = Math.round(dx); jy = Math.round(-dy); };
    pad.onpointerdown = e => { drag = true; pad.setPointerCapture(e.pointerId); mv(e); if (mode !== 'm') setMode('m'); };
    pad.onpointermove = e => drag && mv(e); pad.onpointerup = () => { drag = false; jx = jy = 0; knob.setAttribute('cx', 150); knob.setAttribute('cy', 150); };
    const setMode = m => { if (seq.busy()) aborted = 1.6; mode = m; seq.clear(); sel(sl, 'm', m); };
    sl.querySelectorAll('[data-m]').forEach(b => b.onclick = () => setMode(b.dataset.m));
    raf(dt => {
      const cm = sonarCm(c, boxes), S = readIR(c, on); let cmd = [0, 0], ln = [];
      aborted = Math.max(0, aborted - dt);
      const s = seq.step(dt);
      if (s) { cmd = [s.l, s.r]; ln = s.ln; tx = s.tx; }
      else if (mode === 'm') { let y = jy; if (y > 0 && cm < 20) y = 0; cmd = [clamp((y + jx) * 255 / 100, -255, 255) | 0, clamp((y - jx) * 255 / 100, -255, 255) | 0]; ln = [7]; tx = jy > 0 && cm < 20 ? '🛡️ حماية' : '🎮 يدوي'; }
      else if (mode === 'a') { ln = [8]; tx = '🧱 تجنب';
        if (cm > 60) cmd = [200, 200]; else if (cm > 25) { const v = Math.round(120 + (cm - 25) / 35 * 80); cmd = [v, v]; }
        else seq.push({ l: -200, r: -200, t: .25, ln: [8], tx: '⬇ تراجع' }, { l: 200, r: -200, t: .19, ln: [8], tx: '👉 يمين' }, { l: -200, r: 200, t: .38, ln: [8], tx: '👈 يسار' }, { l: 200, r: -200, t: .38, ln: [8], tx: '↪ الأوسع' }); }
      else if (mode === 'l' || mode === 'c') {
        if (mode === 'c' && cm < 15) { seq.push({ l: 190, r: -190, t: .19, ln: [10], tx: '↪ التفاف' }, { l: 190, r: 190, t: .5, ln: [10], tx: '↪ التفاف' },
            { l: 110, r: 210, t: 4, until: () => readIR(c, on).some(Boolean), ln: [10], tx: '↩ عودة للخط' }, { l: 190, r: 190, t: .12, ln: [10], tx: '↩ عودة' }, { l: -140, r: 140, t: 2, until: () => readIR(c, on)[1], ln: [10], tx: '↩ استقامة', end: () => side = -1 }); }
        else { const b = lineBrain(S, 190, 60); if (b.side) side = b.side; cmd = b.cmd || [150 * side, -150 * side]; ln = mode === 'c' ? [10] : [9]; tx = '〰️ ' + b.tx; } }
      else { ln = [11]; tx = '⏹️'; }
      const prev = { ...c }; stepCar(c, cmd[0], cmd[1], dt); if (hitsBox(c, boxes)) { c.x = prev.x; c.y = prev.y; }
      place(R('mcar'), c); R('mtr').setAttribute('d', trail(pts, c, 380)); paintIR(sl, 'mc', S);
      const [sx, sy] = at(c, 46, 0), L = Math.min(cm, 120) * PX;
      R('mbeam').setAttribute('d', `M${sx} ${sy} L${sx + Math.cos(c.th - .13) * L} ${sy + Math.sin(c.th - .13) * L} L${sx + Math.cos(c.th + .13) * L} ${sy + Math.sin(c.th + .13) * L} Z`);
      R('mbeam').setAttribute('fill', cm < 20 ? '#ff5a5a' : '#4fc3f7');
      R('mmo').textContent = `'${mode}'`; R('mcm').textContent = cm >= 200 ? '200+' : cm.toFixed(0); R('mlcr').textContent = S.join(''); R('mmt').textContent = cmd.map(v => v | 0).join(',');
      run(sl, mode === 'x' && !s ? [1, 11] : [1, 5, 6, ...ln]);
      cap(sl, aborted ? 'غيّرت الوضع في منتصف حركة! دالة <code>wait()</code> لاحظت أن mode تغيّر فخرجت فورًا… لهذا استبدلنا delay بها' :
        mode === 'x' ? 'اختر «العقل» من أزرار الجوال: السيارة نفسها والقطع نفسها… والسلوك يتغير بحرف واحد في mode' :
        mode === 'm' ? (tx.includes('حماية') ? '🛡️ تقود نحو عائق أقرب من ٢٠ سم: الكود يصفّر jy… الحساس يحمي السيارة حتى في الوضع اليدوي' : 'اسحب العصا: هذا كود المحور الرابع بعينه داخل <code>case \'m\'</code>') :
        `case '${mode}': ${tx} — دالة من محور سابق تُستدعى كما هي. السيارة المتكاملة = «مكتبة» من كل ما بنيناه + switch يختار`, aborted ? 'bad' : 'ok');
    });
  },
});
})();
