/* =====================================================================
   أدوات الجزء الثاني — المرحلة السادسة: سيارة الروبوت
   الأنواع: robotlab (ساحة يتجول فيها الروبوت وحده ويتجنب الصناديق)  ·  دائرة البناء: robotcar
   منطق المحاكي هو نفسه كود loop في الشرائح: أمام ← قف ٢٠٠ ← للخلف ٤٠٠ ← استدر يمينًا ٣٥٠ مللي ثانية
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, col, pinX, botX, base, wire } = window.ARD2;

/* ================== محاكي الساحة ================== */
const LOOP_CODE = `void loop() {
  if (distance() > 25) {
    drive(1, 0, 1, 0);
  } else {
    drive(0, 0, 0, 0);
    delay(200);
    drive(0, 1, 0, 1);
    delay(400);
    drive(1, 0, 0, 1);
    delay(350);
  }
}`;
const W = 760, H = 380, CM = 2;                                        // الساحة بالبكسل، و٢ بكسل لكل سنتيمتر
const BOXES = [[490, 80, 120, 80], [170, 240, 90, 100], [430, 260, 70, 70]];
const arenaSVG = () => `<svg viewBox="0 0 ${W} ${H}" class="arena">
  <defs><pattern id="tiles" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f3efe6"/><path d="M40 0 L0 0 0 40" fill="none" stroke="#e2dccd" stroke-width="2"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="url(#tiles)"/><rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="10" class="awall"/>
  ${BOXES.map(([x, y, w, h], i) => `<g class="abox" data-i="${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><text x="${x + w / 2}" y="${y + h / 2 + 8}">📦</text></g>`).join('')}
  <line id="aray" class="aray" x1="0" y1="0" x2="0" y2="0"/><circle id="ahit" class="ahit" r="7"/>
  <path id="trail" class="trail" d=""/>
  <g id="bot2"><rect x="-26" y="-32" width="52" height="64" rx="12" class="rbody"/>
    <rect x="-34" y="-22" width="10" height="26" rx="4" class="rwheel" id="wl"/><rect x="24" y="-22" width="10" height="26" rx="4" class="rwheel" id="wr"/>
    <circle cx="0" cy="22" r="6" class="rcaster"/>
    <rect x="-20" y="-40" width="40" height="12" rx="3" class="rsonar"/><circle cx="-10" cy="-34" r="5" class="reye"/><circle cx="10" cy="-34" r="5" class="reye"/></g>
</svg>`;

/* ================== دائرة البناء ================== */
const LX = 650, LY = 222;
const motor = (x, y, cls) => `<g transform="translate(${x} ${y})"><circle r="40" fill="#f4d35e" stroke="#8a6d1f" stroke-width="4"/>
  <g class="${cls}">${[0, 90, 180, 270].map(a => `<rect x="-4" y="-34" width="8" height="30" rx="4" fill="#1c1f27" transform="rotate(${a})"/>`).join('')}</g><circle r="7" fill="#1b2340"/></g>`;
B2.robotcar = { flow: 8, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'على هيكل السيارة: الأردوينو، ولوح توصيل صغير، والدرايفر.' },
  { h: 'الدرايفر ومحركا العجلتين', b: 'المحرك الأيسر إلى OUT1 وOUT2، والأيمن إلى OUT3 وOUT4.' },
  { h: 'البطارية إلى 12V وGND', b: 'بطاريتا ليثيوم (٧٫٤ فولت) أو ست بطاريات AA. هي وحدها تغذي المحركين.' },
  { h: 'أرضي مشترك · وطاقة اللوح', b: 'GND الدرايفر إلى GND الأردوينو. ثم 5V وGND الأردوينو إلى خطَّي اللوح.' },
  { h: 'IN1 ← 7 · IN2 ← 6 · IN3 ← 5 · IN4 ← 4', b: 'أبقينا غطاءي ENA وENB في مكانهما: سرعة قصوى دائمًا، فتقل الأسلاك.' },
  { h: 'عين الروبوت: HC-SR04', b: 'في مقدمة السيارة. VCC إلى الموجب، وGND إلى السالب.' },
  { h: 'TRIG ← 12 · ECHO ← 11', b: 'كما في حساس ركن السيارة تمامًا.' },
  { h: 'انطلق!', b: 'العجلتان تدوران، والعين تقيس، والأردوينو يقرر.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 rcw">
  ${base({ 0: '12', 1: '11', 2: '7', 3: '6', 4: '5', 5: '4' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2">
    <rect x="${LX}" y="${LY}" width="190" height="170" rx="10" fill="#c0392b"/>
    <rect x="${LX + 90}" y="${LY + 40}" width="80" height="90" rx="4" fill="#1c1f27"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${LX + 94 + i * 13}" y="${LY + 44}" width="6" height="82" fill="#3a3f4d"/>`).join('')}
    <text x="${LX + 130}" y="${LY + 150}" class="lbl" style="font-size:15px;fill:#fff">L298N</text>
    ${[['OUT1', 18], ['OUT2', 42], ['12V', 82], ['GND', 106], ['5V', 130], ['OUT3', 152], ['OUT4', 176]].map(([t, dx]) => `<rect x="${LX + dx - 10}" y="${LY - 8}" width="20" height="18" rx="3" fill="#2b6fc0"/><text x="${LX + dx}" y="${LY + 24}" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}
    ${['IN1', 'IN2', 'IN3', 'IN4'].map((t, i) => `<rect x="${LX - 6}" y="${LY + 54 + i * 24}" width="12" height="12" fill="#f0cc7a"/><text x="${LX + 12}" y="${LY + 65 + i * 24}" class="lbl" style="font-size:12px;fill:#fff;text-anchor:start">${t}</text>`).join('')}
    ${motor(LX + 18, 110, 'rcl')}${motor(LX + 190, 110, 'rcr')}
    <text x="${LX + 18}" y="60" class="lbl" style="font-size:14px">يسار</text><text x="${LX + 190}" y="60" class="lbl" style="font-size:14px">يمين</text>
    <path d="M${LX + 8} 150 L${LX + 18} ${LY - 6}" stroke="#d62828" stroke-width="5"/><path d="M${LX + 28} 150 L${LX + 42} ${LY - 6}" stroke="#1b2340" stroke-width="5"/>
    <path d="M${LX + 180} 150 L${LX + 152} ${LY - 6}" stroke="#d62828" stroke-width="5"/><path d="M${LX + 200} 150 L${LX + 176} ${LY - 6}" stroke="#1b2340" stroke-width="5"/></g>
  <g class="bs" data-s="3"><rect x="${LX + 64}" y="40" width="80" height="44" rx="8" fill="#1c1f27"/><rect x="${LX + 144}" y="54" width="8" height="16" rx="2" fill="#8a909c"/>
    <text x="${LX + 104}" y="68" class="lbl" style="font-size:13px;fill:#f0cc7a">7.4V</text>
    <path d="M${LX + 84} 84 C ${LX + 84} 150, ${LX + 82} 170, ${LX + 82} ${LY - 6}" fill="none" stroke="#e74c3c" stroke-width="5"/>
    <path d="M${LX + 124} 84 C ${LX + 124} 150, ${LX + 106} 170, ${LX + 106} ${LY - 6}" fill="none" stroke="#1b2340" stroke-width="5"/></g>
  ${wire(`M845 456 C 892 440, 892 196, ${LX + 116} 196 L${LX + 106} ${LY - 6}`, 4, '#1b2340')}
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 4, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 4, '#1b2340')}
  ${[2, 3, 4, 5].map((p, i) => wire(`M${pinX(p)} 150 C ${pinX(p)} ${104 - i * 10}, ${632 - i * 8} ${104 - i * 10}, ${632 - i * 8} 200 L${632 - i * 8} ${LY + 60 + i * 24} L${LX} ${LY + 60 + i * 24}`, 5, ['#8e44ad', '#2e9e6b', '#e0b400', '#2b6fc0'][i])).join('')}
  <g class="bs" data-s="6"><rect x="${col(0) - 16}" y="196" width="${col(3) - col(0) + 32}" height="50" rx="6" fill="#1f5fae"/>
    <circle cx="${col(0) + 10}" cy="214" r="18" fill="#dfe3ea" stroke="#8a909c" stroke-width="3"/><circle cx="${col(3) - 10}" cy="214" r="18" fill="#dfe3ea" stroke="#8a909c" stroke-width="3"/>
    ${['VCC', 'TRIG', 'ECHO', 'GND'].map((t, i) => `<line x1="${col(i)}" y1="246" x2="${col(i)}" y2="264" stroke="#9aa1b3" stroke-width="5"/><text x="${col(i)}" y="190" class="lbl" style="font-size:9px">${t}</text>`).join('')}
    <g class="rcwave"><path d="M${col(1) + 13} 176 q -30 -20 0 -44 M${col(1) + 13} 176 q 30 -20 0 -44" fill="none" stroke="#2e9e6b" stroke-width="4"/></g></g>
  ${wire(`M${col(0)} 312 L${col(0)} 404`, 6, '#e74c3c')}${wire(`M${col(3)} 312 L${col(3)} 456`, 6, '#1b2340')}
  ${wire(`M${pinX(0)} 150 C ${pinX(0)} 60, 410 60, 410 250 C 410 360, ${col(1) - 20} 336, ${col(1)} 336`, 7, '#f08a24')}
  ${wire(`M${pinX(1)} 150 C ${pinX(1)} 76, 424 76, 424 250 C 424 350, ${col(2) - 16} 330, ${col(2)} 330`, 7, '#16a3b5')}
</svg>` };

/* ---------- النوع ---------- */
Object.assign(window.DECK_TYPES, {
  robotlab: s => `<div class="slide light">
      <div class="kicker">🤖 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="rbgrid">
        <div class="rbleft">${codeBlock(LOOP_CODE, 'micro')}
          <div class="rbfacts"><div class="ac"><span dir="ltr">distance()</span><b id="rbd">—</b></div><div class="ac gold"><span dir="ltr">drive(…)</span><b id="rbw" dir="ltr">1,0,1,0</b></div></div>
          <div class="irdec" id="rbst">جاهز</div></div>
        <div class="rbright ix"><div class="arwrap" id="arw">${arenaSVG()}</div>
          <div class="rbctl"><button class="clap" id="rbgo">▶ انطلق</button><button class="sndbtn" id="rbrs">↺ من البداية</button>
            <label class="lsl"><span>🛑 مسافة التوقف: <b id="rblv">25</b> سم</span><input type="range" id="rbl" min="10" max="60" value="25"></label></div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  robotlab(sl) {
    const svg = sl.querySelector('.arena'), bot = sl.querySelector('#bot2'), ray = sl.querySelector('#aray'), hit = sl.querySelector('#ahit'), trail = sl.querySelector('#trail');
    const lines = sl.querySelectorAll('.rbleft .ln'), lim = sl.querySelector('#rbl'), go = sl.querySelector('#rbgo');
    const boxes = BOXES.map(b => [...b]), boxEls = [...sl.querySelectorAll('.abox')];
    let x, y, th, run = false, st, stT, last = 0, raf = 0, pts;
    const reset = () => { x = 110; y = 110; th = 0; st = 'fwd'; stT = 0; pts = []; };   // th = 0 يعني نحو اليمين
    const blocked = (px, py) => px < 8 || py < 8 || px > W - 8 || py > H - 8 || boxes.some(([bx, by, bw, bh]) => px > bx && px < bx + bw && py > by && py < by + bh);
    const measure = () => {                                              // شعاع صوتي مستقيم من مقدمة الروبوت
      const fx = x + Math.cos(th) * 40, fy = y + Math.sin(th) * 40;
      for (let d = 0; d < 400; d += 2) { const px = fx + Math.cos(th) * d, py = fy + Math.sin(th) * d; if (blocked(px, py)) return [d / CM, px, py, fx, fy]; }
      return [200, fx + Math.cos(th) * 400, fy + Math.sin(th) * 400, fx, fy];
    };
    const STATES = { fwd: ['للأمام ⬆', [2, 3], '1,0,1,0'], stop: ['قف!', [5, 6], '0,0,0,0'], back: ['للخلف ⬇', [7, 8], '0,1,0,1'], turn: ['استدر يمينًا ↻', [9, 10], '1,0,0,1'] };
    const NEXT = { stop: ['back', 400], back: ['turn', 350], turn: ['fwd', 0] };
    const setLine2 = () => { const src = sl.querySelector('.rbleft .ln[data-n="2"] .cl-src'); src.innerHTML = highlight(`  if (distance() > ${lim.value}) {`); sl.querySelector('#rblv').textContent = lim.value; };
    const draw = d => {
      bot.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI + 90})`);
      const [cm, hx, hy, fx, fy] = d;
      ray.setAttribute('x1', fx); ray.setAttribute('y1', fy); ray.setAttribute('x2', hx); ray.setAttribute('y2', hy);
      hit.setAttribute('cx', hx); hit.setAttribute('cy', hy);
      svg.classList.toggle('near', cm <= +lim.value);
      sl.querySelector('#rbd').textContent = cm >= 200 ? '200+' : Math.round(cm);
      const S = STATES[st]; sl.querySelector('#rbst').textContent = run ? S[0] : 'متوقف: اضغط «انطلق»'; sl.querySelector('#rbw').textContent = run ? S[2] : '0,0,0,0';
      lines.forEach(l => l.classList.toggle('run', run && S[1].includes(+l.dataset.n)));
      const wl = st === 'back' ? -1 : st === 'stop' ? 0 : 1, wr = st === 'back' || st === 'turn' ? -1 : st === 'stop' ? 0 : 1;
      sl.querySelector('#wl').setAttribute('class', 'rwheel ' + (run ? ['b', 's', 'f'][wl + 1] : 's')); sl.querySelector('#wr').setAttribute('class', 'rwheel ' + (run ? ['b', 's', 'f'][wr + 1] : 's'));
      trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
    };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      let d = measure();
      if (run) {
        stT -= dt * 1000;
        if (st === 'fwd') { if (d[0] <= +lim.value) { st = 'stop'; stT = 200; } else { const nx = x + Math.cos(th) * 90 * dt, ny = y + Math.sin(th) * 90 * dt; if (!blocked(nx + Math.cos(th) * 34, ny + Math.sin(th) * 34)) { x = nx; y = ny; } else { st = 'stop'; stT = 200; } } }
        else if (st === 'back') { const nx = x - Math.cos(th) * 60 * dt, ny = y - Math.sin(th) * 60 * dt; if (!blocked(nx - Math.cos(th) * 34, ny - Math.sin(th) * 34)) { x = nx; y = ny; } }
        else if (st === 'turn') th += dt * 4.5;                             // نحو ٩٠ درجة في ٣٥٠ مللي ثانية
        if (st !== 'fwd' && stT <= 0) { const [n, t] = NEXT[st]; st = n; stT = t; }
        if (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 8) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 160) pts.shift(); }
        d = measure();
      }
      draw(d); raf = requestAnimationFrame(loop);
    };
    /* سحب الصناديق */
    let drag = null;
    const pt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
    boxEls.forEach((g, i) => g.addEventListener('pointerdown', e => { const [px, py] = pt(e); drag = { i, dx: px - boxes[i][0], dy: py - boxes[i][1] }; svg.setPointerCapture(e.pointerId); e.stopPropagation(); }));
    svg.addEventListener('pointermove', e => {
      if (!drag) return; const [px, py] = pt(e), b = boxes[drag.i];
      b[0] = Math.max(8, Math.min(W - 8 - b[2], px - drag.dx)); b[1] = Math.max(8, Math.min(H - 8 - b[3], py - drag.dy));
      const r = boxEls[drag.i].querySelector('rect'), t = boxEls[drag.i].querySelector('text');
      r.setAttribute('x', b[0]); r.setAttribute('y', b[1]); t.setAttribute('x', b[0] + b[2] / 2); t.setAttribute('y', b[1] + b[3] / 2 + 8);
    });
    svg.addEventListener('pointerup', () => drag = null);
    go.onclick = () => { run = !run; go.textContent = run ? '⏸ توقف' : '▶ انطلق'; };
    sl.querySelector('#rbrs').onclick = () => { reset(); run = false; go.textContent = '▶ انطلق'; };
    lim.oninput = setLine2;
    reset(); setLine2(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
