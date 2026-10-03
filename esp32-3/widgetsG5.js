/* =====================================================================
   «ESP32 للمعلمين ٣» · روبوت كرة القدم: ثلاثة محركات DC (اثنان أمام وواحد خلف) بعجلات أومني
   gkiwi (رياضيات الحركة في كل اتجاه) · gsoccer (المباراة: أنت ضد الحاسوب)
   الإطار: vx للأمام · vy لليسار · w دوران عكس عقارب الساعة
   M1 عند ٦٠° = −0.866·vx + 0.5·vy + w · M2 عند −٦٠° = 0.866·vx + 0.5·vy + w · M3 عند ١٨٠° = −vy + w
   على الشاشة: مقدمة الروبوت للأعلى عند الزاوية φ = 0، وφ تزيد مع عقارب الساعة
   ===================================================================== */
(function () {
const { AR, codeBlock } = window.ARD;
const { clamp, raf, run, cap, st, rng, frame, beep } = window.FZ;
const { sel } = window.GZ;

const ANG = [60, -60, 180].map(a => a * Math.PI / 180);
function kiwi(vx, vy, w) {
  const m = [-0.866 * vx + 0.5 * vy + w, 0.866 * vx + 0.5 * vy + w, -vy + w];
  const big = Math.max(1, ...m.map(Math.abs));
  return { m: m.map(v => v / big), raw: m, big };
}
// الحركة الفعلية = الأمر مقسومًا على big (لأن كل العجلات صُغّرت بالنسبة نفسها)
const toWorld = (phi, vx, vy) => [vx * Math.sin(phi) - vy * Math.cos(phi), -vx * Math.cos(phi) - vy * Math.sin(phi)];
const f2 = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
window.GZ.kiwi = kiwi;

/* روبوت ثلاثي من أعلى: المقدمة للأعلى، والعجلات على ٦٠° و−٦٠° و١٨٠° (موضع العجلة على الشاشة: (−sin α, −cos α)·r) */
const kiwiSvg = (id, r, col, arrows = false, team = '') => `<g id="${id}">
  <circle r="${r}" fill="${col}" stroke="#0b1230" stroke-width="${r / 16}"/>
  <path d="M${-r * .5} ${-r * .87} A ${r} ${r} 0 0 1 ${r * .5} ${-r * .87} L ${r * .36} ${-r * .62} L ${-r * .36} ${-r * .62} Z" fill="#0b1230" opacity=".55"/>
  ${ANG.map((a, i) => { const px = -Math.sin(a) * r * .8, py = -Math.cos(a) * r * .8, deg = -a * 180 / Math.PI;
    return `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${deg.toFixed(1)})"><rect x="${-r * .3}" y="${-r * .13}" width="${r * .6}" height="${r * .26}" rx="${r * .06}" fill="#dfe3ea" stroke="#5b6383" stroke-width="${r / 40}"/>
      ${[-2, -1, 0, 1, 2].map(k => `<rect x="${k * r * .11 - r * .035}" y="${-r * .16}" width="${r * .07}" height="${r * .32}" rx="${r * .03}" fill="#5b6383"/>`).join('')}
      ${arrows ? `<g id="${id}a${i}"><line x1="0" y1="0" x2="0" y2="0" stroke="#ffcf4a" stroke-width="${r / 14}" stroke-linecap="round"/><path d="" fill="#ffcf4a"/></g>` : ''}</g>${arrows ? `<text x="${(px * .52).toFixed(1)}" y="${(py * .52 + r * .05).toFixed(1)}" text-anchor="middle" class="fzt" style="font-size:${r / 6.5}px;fill:#fff">M${i + 1}</text>` : ''}`; }).join('')}
  <circle r="${r * .34}" fill="#1f2a44"/><text y="${r * .1}" text-anchor="middle" class="fzt" style="font-size:${r / 4.5}px">${team || 'ESP32'}</text>
</g>`;
// سهم دفع العجلة (على محور العجلة، موجب = يدفع الروبوت عكس عقارب الساعة… أي نحو اليسار على الشاشة في إطار العجلة)
function setArrow(sl, id, i, v, r) {
  const g = sl.querySelector(`#${id}a${i}`); if (!g) return; const L = v * r * .9, ln = g.querySelector('line'), hd = g.querySelector('path');
  ln.setAttribute('x2', (-L).toFixed(1)); const s = Math.sign(-L) || 1, x = -L, h = r * .12;
  hd.setAttribute('d', Math.abs(L) < 4 ? '' : `M${x + s * h} 0 L${x} ${-h * .8} L${x} ${h * .8} Z`);
  g.setAttribute('opacity', Math.abs(v) < .02 ? .25 : 1);
}

const C = {
  kiwi: `void drive(float vx, float vy, float w) {
  float m[3] = {
    -0.866 * vx + 0.5 * vy + w,
     0.866 * vx + 0.5 * vy + w,
                 -1.0 * vy + w
  };
  float big = max(1.0f, max(fabs(m[0]),
              max(fabs(m[1]), fabs(m[2]))));
  for (int i = 0; i < 3; i++)
    motor(i, m[i] / big * 255);
}`,
};
const PRE = [['⬆️ أمام', 1, 0, 0], ['⬅️ جانبًا', 0, 1, 0], ['↖️ قطري', .7, .7, 0], ['⟲ دوران', 0, 0, .7], ['🌀 أمام + دوران', .8, 0, .4], ['⏹️', 0, 0, 0]];

/* ---------- الملعب ---------- */
const FW = 1000, FH = 860, FX0 = 40, FX1 = 960, FY0 = 60, FY1 = 800, GY0 = 330, GY1 = 530, RR = 46, BRd = 15;
const fieldSvg = () => `<rect width="${FW}" height="${FH}" fill="#0d3b22"/>
  ${Array.from({ length: 8 }, (_, i) => `<rect x="${FX0 + i * 115}" y="${FY0}" width="57.5" height="${FY1 - FY0}" fill="#11492b"/>`).join('')}
  <rect x="${FX0}" y="${FY0}" width="${FX1 - FX0}" height="${FY1 - FY0}" fill="none" stroke="#e8f5e9" stroke-width="6"/>
  <line x1="500" y1="${FY0}" x2="500" y2="${FY1}" stroke="#e8f5e9" stroke-width="4"/><circle cx="500" cy="430" r="90" fill="none" stroke="#e8f5e9" stroke-width="4"/>
  <rect x="${FX0}" y="280" width="110" height="300" fill="none" stroke="#e8f5e9" stroke-width="4"/><rect x="${FX1 - 110}" y="280" width="110" height="300" fill="none" stroke="#e8f5e9" stroke-width="4"/>
  <rect x="${FX0 - 34}" y="${GY0}" width="34" height="${GY1 - GY0}" fill="#2b6fc0" opacity=".85"/><rect x="${FX1}" y="${GY0}" width="34" height="${GY1 - GY0}" fill="#c0392b" opacity=".85"/>
  <text x="${FX0 + 60}" y="40" text-anchor="middle" class="fza" style="font-size:22px;fill:#9ec5ff">مرمى الأزرق</text><text x="${FX1 - 60}" y="40" text-anchor="middle" class="fza" style="font-size:22px;fill:#ff9a8a">مرمى الأحمر</text>`;

Object.assign(window.DECK_TYPES, {
  gkiwi: s => frame(s, 'gkiwi', '0 0 1000 860', `<rect width="1000" height="860" fill="#0f1733"/>
      <defs><pattern id="gkg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 0 40" fill="none" stroke="#1d2a55" stroke-width="2"/></pattern></defs><rect width="1000" height="860" fill="url(#gkg)"/>
      <path id="ktr" fill="none" stroke="#46d68c" stroke-width="4" stroke-dasharray="3 8" stroke-linecap="round"/>
      <g id="kbody">${kiwiSvg('kb', 170, '#1f7a45', true)}</g>
      <g id="kvec"><line id="kvl" stroke="#4fc3f7" stroke-width="8" stroke-linecap="round"/><circle id="kvh" r="12" fill="#4fc3f7"/></g>
      <text x="30" y="830" class="fza" style="font-size:20px;fill:#8d9bd0">الأصفر: دفع كل عجلة · الأزرق: اتجاه حركة الروبوت</text>`,
    `<div class="gkrow"><svg viewBox="0 0 300 300" class="gjpad ix" id="kpad"><circle cx="150" cy="150" r="140" fill="#14532d" stroke="#9be7b4" stroke-width="8"/><line x1="150" y1="20" x2="150" y2="280" stroke="#2f7d4f" stroke-width="2"/><line x1="20" y1="150" x2="280" y2="150" stroke="#2f7d4f" stroke-width="2"/>
        <text x="150" y="42" text-anchor="middle" class="fzt" style="font-size:17px">vx+</text><text x="40" y="156" text-anchor="middle" class="fzt" style="font-size:17px">vy+</text><circle id="kk" cx="150" cy="150" r="46" fill="#fff"/></svg>
      <div class="gkside"><div class="gkpre">${PRE.map(([t, a, b, c]) => `<button class="fzb" data-x="${a}" data-y="${b}" data-w="${c}">${t}</button>`).join('')}</div>
        ${rng('kw', 'w ⟲', -100, 100, 0, 5)}</div></div>
    <div class="gkbars">${[0, 1, 2].map(i => `<div class="gkb"><b>M${i + 1}</b><div class="gkt"><i id="kbar${i}"></i><em></em></div><span id="kval${i}">0</span></div>`).join('')}</div>
    ${codeBlock(C.kiwi)}<div class="fzcap"></div>`),

  gsoccer: s => frame(s, 'gsoccer', `0 0 ${FW} ${FH}`, `${fieldSvg()}
      <g id="gball"><circle r="${BRd}" fill="#fff" stroke="#111" stroke-width="3"/><path d="M-6 -4 L0 -9 L6 -4 L4 4 L-4 4 Z" fill="#111"/></g>
      <g id="grb">${kiwiSvg('gb', RR, '#2b6fc0', false, 'B')}</g><g id="grr">${kiwiSvg('gr', RR, '#c0392b', false, 'R')}</g>
      <g id="ggoal" opacity="0"><rect x="250" y="360" width="500" height="140" rx="26" fill="#101b45" stroke="#f0cc7a" stroke-width="6"/><text x="500" y="445" text-anchor="middle" class="fza" style="font-size:58px" id="ggt">⚽ هدف!</text></g>`,
    `<div class="fzrow"><button class="fzb go" data-a="go">▶ صافرة البداية</button><div class="gscore"><span>🔵 أنت <b id="gs0">٠</b></span><span>⏱️ <b id="gtm">90</b></span><span>🔴 الحاسوب <b id="gs1">٠</b></span></div></div>
    <div class="gkrow"><svg viewBox="0 0 300 300" class="gjpad ix" id="spad"><circle cx="150" cy="150" r="140" fill="#14532d" stroke="#9be7b4" stroke-width="8"/><circle id="sk" cx="150" cy="150" r="46" fill="#fff"/></svg>
      <div class="gkside"><div class="fzrow"><button class="fzb" data-r="1">⟲</button><button class="fzb" data-r="-1">⟳</button><button class="fzb" data-a="tb">🚀 تيربو</button></div>
        <div class="fzrow"><label>العصا</label><button class="fzb on" data-f="0">🤖 الروبوت</button><button class="fzb" data-f="1">🧭 الملعب</button></div>
        <div class="fzrow"><label>الحاسوب</label><button class="fzb on" data-l="0">🙂 مبتدئ</button><button class="fzb" data-l="1">😈 بطل</button></div>
        <div class="gkeys">⌨️ W A S D للتحريك · Q E للدوران · Shift تيربو</div></div></div>
    <div class="gkbars">${[0, 1, 2].map(i => `<div class="gkb"><b>M${i + 1}</b><div class="gkt"><i id="sbar${i}"></i><em></em></div><span id="sval${i}">0</span></div>`).join('')}</div>
    <div class="fzcap"></div>`),
});

/* عصا داخل SVG: تعيد [أعلى, يسار] من −1 إلى 1 */
function joystick(pad, knob, onMove) {
  let on = false, v = [0, 0];
  const mv = e => { const r = pad.getBoundingClientRect(); let dx = (e.clientX - r.left) * 300 / r.width - 150, dy = (e.clientY - r.top) * 300 / r.height - 150; const d = Math.hypot(dx, dy); if (d > 100) { dx *= 100 / d; dy *= 100 / d; }
    knob.setAttribute('cx', 150 + dx); knob.setAttribute('cy', 150 + dy); v = [-dy / 100, -dx / 100]; onMove && onMove(v); };
  pad.onpointerdown = e => { on = true; pad.setPointerCapture(e.pointerId); mv(e); e.stopPropagation(); };
  pad.onpointermove = e => on && mv(e);
  pad.onpointerup = () => { on = false; v = [0, 0]; knob.setAttribute('cx', 150); knob.setAttribute('cy', 150); onMove && onMove(v); };
  return { get: () => v, active: () => on, set: (a, b) => { v = [a, b]; knob.setAttribute('cx', 150 - b * 100); knob.setAttribute('cy', 150 - a * 100); } };
}
const bars = (sl, p, m) => m.forEach((v, i) => { const b = sl.querySelector(`#${p}bar${i}`); b.style.width = Math.abs(v) * 50 + '%'; b.style.left = v < 0 ? 50 - Math.abs(v) * 50 + '%' : '50%'; b.classList.toggle('neg', v < 0); sl.querySelector(`#${p}val${i}`).textContent = Math.round(v * 255); });

Object.assign(window.DECK_BIND, {
  gkiwi(sl) {
    const R = id => sl.querySelector('#' + id), w = R('kw'); let x = 500, y = 430, phi = 0, pts = [], preset = null;
    const J = joystick(R('kpad'), R('kk'), () => { preset = null; });
    sl.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { J.set(+b.dataset.x, +b.dataset.y); w.value = +b.dataset.w * 100; preset = b.textContent; if (b.dataset.x === '0' && b.dataset.y === '0' && b.dataset.w === '0') { x = 500; y = 430; phi = 0; pts = []; } });
    w.oninput = () => preset = null;
    raf(dt => {
      const [vx, vy] = J.get(), wz = +w.value / 100, K = kiwi(vx, vy, wz);
      K.m.forEach((v, i) => setArrow(sl, 'kb', i, v, 170)); bars(sl, 'k', K.m);
      // الحركة: نعرض الروبوت يتحرك ببطء في المكان (مع العودة إذا ابتعد)
      const s = 1 / K.big, [wx, wy] = toWorld(phi, vx * s, vy * s);
      x += wx * 140 * dt; y += wy * 140 * dt; phi -= wz * s * 1.6 * dt;
      if (x < 200 || x > 800 || y < 200 || y > 660) { x = clamp(x, 200, 800); y = clamp(y, 200, 660); }
      if (!vx && !vy && !wz) { x += (500 - x) * dt * .8; y += (430 - y) * dt * .8; }
      R('kbody').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(phi * 180 / Math.PI).toFixed(1)})`);
      pts.push([x, y]); if (pts.length > 240) pts.shift(); R('ktr').setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(0)).join(' ')).join(' L'));
      const mag = Math.hypot(wx, wy), ex = x + wx * 260, ey = y + wy * 260;
      R('kvl').setAttribute('x1', x); R('kvl').setAttribute('y1', y); R('kvl').setAttribute('x2', ex); R('kvl').setAttribute('y2', ey); R('kvh').setAttribute('cx', ex); R('kvh').setAttribute('cy', ey); R('kvec').setAttribute('opacity', mag > .05 ? 1 : 0);
      w.previousElementSibling.textContent = `w = ${wz.toFixed(2)}`;
      run(sl, vx || vy || wz ? (K.big > 1.001 ? [1, 2, 3, 4, 5, 7, 8, 9, 10] : [1, 2, 3, 4, 5, 9, 10]) : []);
      const [a, b, c] = K.raw;
      cap(sl, !vx && !vy && !wz ? 'حرّك العصا أو اضغط زرًا: الأسهم الصفراء = دفع كل عجلة، والسهم الأزرق = اتجاه الروبوت. لاحظ أن الروبوت لا يحتاج أن يستدير ليتحرك جانبًا!' :
        `M1 = ${f2(a)} · M2 = ${f2(b)} · M3 = ${f2(c)} ${K.big > 1.001 ? `← أكبرها ${K.big.toFixed(2)} > ١ فنقسم الكل عليه` : ''}` +
        (Math.abs(vx) > .5 && Math.abs(vy) < .05 && Math.abs(wz) < .05 ? ' · <b>للأمام: العجلة الخلفية M3 = ٠ ترتاح!</b> والأماميتان متعاكستان' :
          Math.abs(vy) > .5 && Math.abs(vx) < .05 && Math.abs(wz) < .05 ? ' · <b>جانبًا: M3 تعمل بأقصى قوة</b> والأماميتان تساعدانها بالنصف' :
          !vx && !vy ? ' · <b>دوران: الثلاث متساوية</b> فيدور الروبوت حول مركزه' : ''), 'ok');
    });
  },

  gsoccer(sl) {
    const R = id => sl.querySelector('#' + id); let phase = 'idle', T = 90, sc = [0, 0], rot = 0, turbo = false, field = false, lvl = 0, goalT = 0, keys = {};
    const J = joystick(R('spad'), R('sk'));
    const kick = () => ({ ball: { x: 500, y: 430, vx: 0, vy: 0 }, B: { x: 230, y: 430, phi: Math.PI / 2, vx: 0, vy: 0 }, Rd: { x: 770, y: 430, phi: -Math.PI / 2, vx: 0, vy: 0 } });
    let S = kick();
    sl.querySelector('[data-a=go]').onclick = e => { if (phase === 'play') { phase = 'pause'; e.target.textContent = '▶ استأنف'; return; } if (phase === 'over' || phase === 'idle') { sc = [0, 0]; T = 90; S = kick(); } phase = 'play'; e.target.textContent = '⏸ إيقاف'; beep(1400, .25, .05); };
    sl.querySelectorAll('[data-r]').forEach(b => { b.onpointerdown = () => { rot = +b.dataset.r; b.classList.add('on'); }; b.onpointerup = b.onpointerleave = () => { rot = 0; b.classList.remove('on'); }; });
    sl.querySelector('[data-a=tb]').onclick = e => { turbo = !turbo; e.target.classList.toggle('on', turbo); };
    sl.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { field = b.dataset.f === '1'; sel(sl, 'f', b.dataset.f); });
    sl.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { lvl = +b.dataset.l; sel(sl, 'l', lvl); });
    const kd = e => { if (!sl.isConnected) return; const k = e.code; if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(k)) { keys[k] = e.type === 'keydown'; e.preventDefault(); } };
    addEventListener('keydown', kd); addEventListener('keyup', kd); window.DECK_CLEANUP.push(() => { removeEventListener('keydown', kd); removeEventListener('keyup', kd); });
    // حركة روبوت ثلاثي: الأمر (أمام، يسار، دوران) في إطاره ← سرعة عالمية بعد قسمة big
    const move = (r, vx, vy, w, top, dt) => { const K = kiwi(vx, vy, w), s = 1 / K.big, [wx, wy] = toWorld(r.phi, vx * s, vy * s);
      const a = Math.min(1, dt / .12); r.vx += (wx * top - r.vx) * a; r.vy += (wy * top - r.vy) * a; r.phi -= w * s * 3.4 * dt;
      r.x = clamp(r.x + r.vx * dt, FX0 + RR, FX1 - RR); r.y = clamp(r.y + r.vy * dt, FY0 + RR, FY1 - RR); return K.m; };
    // ذكاء الحاسوب: يذهب خلف الكرة على الخط الواصل بمرمى الأزرق، ثم يدفع
    const ai = (r, ball, dt) => { const gx = FX0, gy = 430, dx = ball.x - gx, dy = ball.y - gy, d = Math.hypot(dx, dy) || 1, bx = ball.x + dx / d * (RR + 30), by = ball.y + dy / d * (RR + 30);
      const behind = r.x > ball.x + 10, tx = behind ? (Math.hypot(r.x - bx, r.y - by) < 30 ? ball.x - dx / d * 40 : bx) : ball.x + 90, ty = behind ? (Math.hypot(r.x - bx, r.y - by) < 30 ? ball.y - dy / d * 40 : by) : ball.y + (r.y > ball.y ? 90 : -90);
      const ex = tx - r.x, ey = ty - r.y, el = Math.hypot(ex, ey) || 1, fx = Math.sin(r.phi), fy = -Math.cos(r.phi), lx = -Math.cos(r.phi), ly = -Math.sin(r.phi);
      const want = Math.atan2(ball.x - r.x, -(ball.y - r.y)); let dphi = want - r.phi; dphi = Math.atan2(Math.sin(dphi), Math.cos(dphi));
      return move(r, (ex * fx + ey * fy) / el, (ex * lx + ey * ly) / el, clamp(-dphi * 1.5, -.6, .6), lvl ? 270 : 170, dt); };
    const collide = (r, ball) => { const dx = ball.x - r.x, dy = ball.y - r.y, d = Math.hypot(dx, dy), min = RR + BRd; if (d < min && d > 0) { const nx = dx / d, ny = dy / d; ball.x = r.x + nx * min; ball.y = r.y + ny * min;
      const rel = (r.vx - ball.vx) * nx + (r.vy - ball.vy) * ny; if (rel > 0) { ball.vx += nx * rel * 1.5; ball.vy += ny * rel * 1.5; } } };
    raf(dt => {
      const { ball, B, Rd } = S;
      // أوامر اللاعب: العصا أو لوحة المفاتيح
      let [jf, jl] = J.get(); if (!J.active()) { jf = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0); jl = (keys.KeyA ? 1 : 0) - (keys.KeyD ? 1 : 0); const n = Math.hypot(jf, jl); if (n > 1) { jf /= n; jl /= n; } }
      let w = rot * .7 || ((keys.KeyQ ? .7 : 0) - (keys.KeyE ? .7 : 0)); const tb = turbo || keys.ShiftLeft || keys.ShiftRight;
      let vx = jf, vy = jl;
      if (field) { const ux = -jl, uy = -jf, fx = Math.sin(B.phi), fy = -Math.cos(B.phi), lx = -Math.cos(B.phi), ly = -Math.sin(B.phi); vx = ux * fx + uy * fy; vy = ux * lx + uy * ly; }
      let mB = [0, 0, 0];
      if (phase === 'play') {
        T -= dt; mB = move(B, vx, vy, w, tb ? 330 : 230, dt); ai(Rd, ball, dt);
        collide(B, ball); collide(Rd, ball);
        const dx = Rd.x - B.x, dy = Rd.y - B.y, d = Math.hypot(dx, dy); if (d < RR * 2 && d > 0) { const p = (RR * 2 - d) / 2, nx = dx / d, ny = dy / d; B.x -= nx * p; B.y -= ny * p; Rd.x += nx * p; Rd.y += ny * p; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; const fr = Math.pow(.55, dt); ball.vx *= fr; ball.vy *= fr;
        if (ball.y < FY0 + BRd) { ball.y = FY0 + BRd; ball.vy = Math.abs(ball.vy) * .8; } if (ball.y > FY1 - BRd) { ball.y = FY1 - BRd; ball.vy = -Math.abs(ball.vy) * .8; }
        const inMouth = ball.y > GY0 && ball.y < GY1;
        if (ball.x < FX0 + BRd && !inMouth) { ball.x = FX0 + BRd; ball.vx = Math.abs(ball.vx) * .8; } if (ball.x > FX1 - BRd && !inMouth) { ball.x = FX1 - BRd; ball.vx = -Math.abs(ball.vx) * .8; }
        if (ball.x < FX0 - 10 || ball.x > FX1 + 10) { const blue = ball.x > FX1; sc[blue ? 0 : 1]++; R('ggt').textContent = blue ? '⚽ هدف للأزرق!' : '⚽ هدف للأحمر'; goalT = 1.6; phase = 'goal'; beep(blue ? 1200 : 400, .3, .06); }
        if (T <= 0) { T = 0; phase = 'over'; R('ggt').textContent = sc[0] > sc[1] ? '🏆 فزت!' : sc[0] < sc[1] ? '😓 فاز الحاسوب' : '🤝 تعادل'; R('ggoal').setAttribute('opacity', 1); sl.querySelector('[data-a=go]').textContent = '▶ مباراة جديدة'; }
      } else if (phase === 'goal') { goalT -= dt; if (goalT <= 0) { S = kick(); phase = 'play'; } }
      R('ggoal').setAttribute('opacity', phase === 'goal' || phase === 'over' ? 1 : 0);
      R('gball').setAttribute('transform', `translate(${ball.x.toFixed(1)} ${ball.y.toFixed(1)})`);
      R('grb').setAttribute('transform', `translate(${B.x.toFixed(1)} ${B.y.toFixed(1)}) rotate(${(B.phi * 180 / Math.PI).toFixed(1)})`);
      R('grr').setAttribute('transform', `translate(${Rd.x.toFixed(1)} ${Rd.y.toFixed(1)}) rotate(${(Rd.phi * 180 / Math.PI).toFixed(1)})`);
      bars(sl, 's', phase === 'play' ? mB.map(v => v * (tb ? 1 : 180 / 255)) : [0, 0, 0]);
      R('gs0').textContent = AR(sc[0]); R('gs1').textContent = AR(sc[1]); R('gtm').textContent = Math.ceil(T);
      cap(sl, phase === 'idle' ? 'أنت الأزرق وتهاجم مرمى الأحمر (يمين). اسحب العصا أو استعمل W A S D، والدوران ⟲ ⟳ أو Q E' :
        phase === 'goal' ? 'هدف! الكرة والروبوتان يعودون لنقطة البداية' : phase === 'over' ? 'انتهت المباراة. جرّب وضع «🧭 الملعب»: العصا للأعلى = نحو أعلى الملعب مهما كان اتجاه الروبوت (يحتاج حساس بوصلة في الحقيقة)' :
        `أشرطة M1 M2 M3 هي ما يكتبه ESP32 لكل محرك الآن${field ? ' · وضع الملعب: نحوّل اتجاه العصا إلى إطار الروبوت بالزاوية' : ''}${tb ? ' · 🚀 تيربو: ٢٥٥ بدل ١٨٠' : ''}`, 'ok');
    });
  },
});
})();
