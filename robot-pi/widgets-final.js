/* =====================================================================
   أدوات الوحدتين ١٠ و١١:
   senseloop (يحس ← يفكر ← يتحرك) · modesim (عقل نبيه بأوضاعه الثلاثة) · phone (التحكم من الجوال)
   منطق الأوضاع هنا هو نفسه في البرنامج 10_brain.py
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const { pyBlock } = window.NB_CODE;

/* ---------- ١) حلقة الروبوت ---------- */
const LOOP = [
  { icon: '👁️', ar: 'يحس', b: 'يقرأ الحساسات: المسافة، والكاميرا، والميكروفون', ex: 'distance() · find_color() · who_is_there() · listen()' },
  { icon: '🧠', ar: 'يفكر', b: 'يقرر بالشروط: إذا… وإلّا إذا… وإلّا', ex: 'if · elif · else' },
  { icon: '🦾', ar: 'يتحرك', b: 'ينفّذ: يمشي، أو يلف، أو يتكلم', ex: 'forward() · right() · say()' },
];
const loopSVG = `<svg viewBox="0 0 700 600" class="nb-loopsvg">
  <defs><marker id="nbArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#D9AE4B"/></marker></defs>
  <circle cx="350" cy="320" r="210" fill="none" stroke="#e4dcc8" stroke-width="18"/>
  <path class="nb-larc" d="M350 110 A210 210 0 1 1 349 110" fill="none" stroke="#D9AE4B" stroke-width="18" stroke-dasharray="60 1260" stroke-linecap="round"/>
  ${[[350, 110], [532, 425], [168, 425]].map(([x, y], i) => `<g class="nb-lnode" data-i="${i}"><circle cx="${x}" cy="${y}" r="92" fill="#101B45"/>
    <text x="${x}" y="${y - 2}" text-anchor="middle" font-size="64">${LOOP[i].icon}</text><text x="${x}" y="${y + 56}" text-anchor="middle" class="nb-ltxt">${LOOP[i].ar}</text></g>`).join('')}
  <text x="350" y="300" text-anchor="middle" class="nb-ltxt dark">ويعيد</text><text x="350" y="350" text-anchor="middle" class="nb-ltxt dark">للأبد 🔁</text>
</svg>`;

/* ---------- ٢) عقل نبيه: الأوضاع الثلاثة ---------- */
const BRAIN = `def explore():
    if nabeeh.distance() < 20:
        nabeeh.stop()
        nabeeh.backward()
        nabeeh.right()
    elif nabeeh.find_color("red") is not None:
        nabeeh.stop()
        nabeeh.say("وجدت شيئًا أحمر!")
    else:
        nabeeh.forward()

def guard():
    name = nabeeh.who_is_there()
    if name == "غريب":
        nabeeh.say("تنبيه! شخص لا أعرفه")
    elif name is not None:
        nabeeh.say("أهلًا يا " + name)

def hide_and_seek():
    if nabeeh.who_is_there() == FRIEND:
        nabeeh.say("وجدتك يا " + FRIEND + "!")
    else:
        nabeeh.right()`;
const MODES = {
  explore: { icon: '🧭', ar: 'المستكشف', fn: 1, events: {
    wall: { lines: [2, 3, 4, 5], act: '🛑 يتوقف، ويرجع، ويلف يمينًا', say: '' },
    red: { lines: [2, 6, 7, 8], act: '⏹️ يتوقف ويخبرنا', say: 'وجدت شيئًا أحمر!' },
    friend: { lines: [2, 6, 9, 10], act: '⬆️ يمشي للأمام (المستكشف لا يهتم بالوجوه)', say: '' },
    stranger: { lines: [2, 6, 9, 10], act: '⬆️ يمشي للأمام', say: '' },
    none: { lines: [2, 6, 9, 10], act: '⬆️ يمشي للأمام ويستكشف', say: '' } } },
  guard: { icon: '🛡️', ar: 'الحارس', fn: 12, events: {
    wall: { lines: [13, 14, 16], act: '🧍 يبقى مكانه يحرس', say: '' },
    red: { lines: [13, 14, 16], act: '🧍 يبقى مكانه (الحارس لا يبحث عن الألوان)', say: '' },
    friend: { lines: [13, 14, 16, 17], act: '😊 يرحّب بصديقه', say: 'أهلًا يا عمر' },
    stranger: { lines: [13, 14, 15], act: '🚨 ينبّه!', say: 'تنبيه! شخص لا أعرفه' },
    none: { lines: [13, 14, 16], act: '🧍 لا أحد… يبقى منتبهًا', say: '' } } },
  hide: { icon: '🙈', ar: 'الغميضة', fn: 19, events: {
    wall: { lines: [20, 22, 23], act: '↪️ يلتفت ليبحث', say: '' },
    red: { lines: [20, 22, 23], act: '↪️ يلتفت ليبحث', say: '' },
    friend: { lines: [20, 21], act: '🎉 وجده! يفرح ويدور', say: 'وجدتك يا عمر!' },
    stranger: { lines: [20, 22, 23], act: '↪️ ليس صديقه… يكمل البحث', say: '' },
    none: { lines: [20, 22, 23], act: '↪️ يلتفت ليبحث', say: '' } } },
};
const EVENTS = { wall: '🧱 جدار قريب', red: '🔴 كرة حمراء', friend: '😊 عمر', stranger: '🧑 شخص غريب', none: '🌫️ لا شيء' };

function bindModes(sl) {
  let mode = 'explore', ev = 'none';
  const code = sl.querySelector('.nb-mcode');
  code.innerHTML = pyBlock(BRAIN, 'nb-small');
  const draw = () => {
    const M = MODES[mode], E = M.events[ev];
    sl.querySelectorAll('.nb-mbtn').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    sl.querySelectorAll('.nb-ebtn').forEach(b => b.classList.toggle('on', b.dataset.e === ev));
    code.querySelectorAll('.ln').forEach(l => { const n = +l.dataset.n;
      l.classList.toggle('run', E.lines.includes(n)); l.classList.toggle('dim', !E.lines.includes(n) && n !== M.fn); l.classList.toggle('hl', n === M.fn); });
    const cur = code.querySelector(`.ln[data-n="${M.fn}"]`); if (cur) code.scrollTop = cur.offsetTop - 10;
    sl.querySelector('.nb-mout').innerHTML = `<div class="nb-mact">${E.act}</div>${E.say ? `<div class="nb-msay">🔊 «${E.say}»</div>` : ''}`;
  };
  sl.querySelectorAll('.nb-mbtn').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
  sl.querySelectorAll('.nb-ebtn').forEach(b => b.onclick = () => { ev = b.dataset.e; draw(); });
  draw();
}

/* ---------- ٣) الجوال يتحكم بنبيه ---------- */
function bindPhone(sl) {
  const bot = sl.querySelector('.nb-pbot'), field = sl.querySelector('.nb-pfield'), bubble = sl.querySelector('.nb-pbubble');
  let x = 50, y = 60, a = -90, timer = null, act = null;
  const place = () => { bot.style.left = x + '%'; bot.style.top = y + '%'; bot.style.transform = `translate(-50%,-50%) rotate(${a + 90}deg)`; };
  const tick = () => {
    if (act === 'forward' || act === 'backward') { const s = act === 'forward' ? 1.2 : -1.2;
      x = Math.min(94, Math.max(6, x + Math.cos(a * Math.PI / 180) * s)); y = Math.min(92, Math.max(8, y + Math.sin(a * Math.PI / 180) * s * 1.6)); }
    if (act === 'left') a -= 6; if (act === 'right') a += 6;
    place();
  };
  const stop = () => { act = null; clearInterval(timer); timer = null; sl.querySelectorAll('.nb-pad2 button').forEach(b => b.classList.remove('on'));
    sl.querySelector('.nb-plog').textContent = 'POST /move  action=stop'; };
  window.DECK_CLEANUP.push(() => clearInterval(timer));
  sl.querySelectorAll('.nb-pad2 button').forEach(b => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); stop(); if (b.dataset.a === 'stop') return;
      act = b.dataset.a; b.classList.add('on'); timer = setInterval(tick, 40);
      sl.querySelector('.nb-plog').textContent = `POST /move  action=${act}`; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => act && stop()));
  });
  sl.querySelector('.nb-psay').onclick = () => { const t = sl.querySelector('.nb-pinput').value.trim() || 'مرحبًا!';
    bubble.textContent = t; bubble.classList.add('show'); setTimeout(() => bubble.classList.remove('show'), 2500);
    sl.querySelector('.nb-plog').textContent = 'POST /say  text=' + t; };
  sl.querySelector('.nb-pinput').addEventListener('keydown', e => e.stopPropagation());
  place();
}

Object.assign(window.DECK_TYPES, {
  senseloop: s => `<div class="slide light"><div class="kicker">${s.kicker || '🔁 سر كل روبوت'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-loop"><div class="nb-stage">${loopSVG}</div>
        <div class="nb-panel"><div class="nb-info"><div class="nb-icon">🤖</div><h3>كل روبوت في العالم…</h3><p>من المكنسة الذكية إلى المركبة على المريخ، يكرر ثلاث خطوات. اضغط «التالي».</p></div></div></div>
      ${LOOP.map(() => '<i class="f"></i>').join('')}</div>`,
  modesim: s => `<div class="slide light"><div class="kicker">${s.kicker || '🧠 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="nb-modes ix">
        <div class="nb-mside">
          <div class="nb-mrow"><span>١. اختر الوضع:</span>${Object.entries(MODES).map(([k, m]) => `<button class="nb-mbtn" data-m="${k}">${m.icon} ${m.ar}</button>`).join('')}</div>
          <div class="nb-mrow wrap"><span>٢. ماذا يرى نبيه؟</span>${Object.entries(EVENTS).map(([k, t]) => `<button class="nb-ebtn" data-e="${k}">${t}</button>`).join('')}</div>
          <div class="nb-mout"></div>
        </div>
        <div class="codewrap"><div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">10_brain.py</span></div><div class="nb-mcode"></div></div>
      </div></div>`,
  phone: s => `<div class="slide light"><div class="kicker">${s.kicker || '📱 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="nb-phonelab ix">
        <div class="nb-phone"><div class="nb-pnotch"></div><div class="nb-purl" dir="ltr">🔒 nabeeh.local:5000</div>
          <div class="nb-pscreen"><h4>🤖 تحكّم بنبيه</h4>
            <div class="nb-pcam"><div class="nb-pball"></div></div>
            <div class="nb-pad2" dir="ltr"><button data-a="forward" class="u">⬆️</button><button data-a="left" class="l">⬅️</button><button data-a="stop" class="s">⏹️</button><button data-a="right" class="r">➡️</button><button data-a="backward" class="d">⬇️</button></div>
            <div class="nb-ptalk"><input class="nb-pinput" placeholder="جملة يقولها نبيه…"><button class="nb-psay">🔊</button></div></div></div>
        <div class="nb-pright">
          <div class="nb-pfield"><div class="nb-pbot">${window.NB.nabeehSVG()}</div><div class="nb-pbubble"></div></div>
          <div class="nb-pnet"><span>📱 الجوال</span><i>📶 واي فاي المدرسة</i><span>🍓 نبيه</span></div>
          <code class="nb-plog" dir="ltr">اضغط زرًّا في الجوال…</code>
        </div>
      </div></div>`,
});
Object.assign(window.DECK_BIND, { modesim: bindModes, phone: bindPhone });

const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (!sl || s.t !== 'senseloop' || step < 1) return;
  const L = LOOP[step - 1];
  sl.querySelectorAll('.nb-lnode').forEach((n, i) => n.classList.toggle('on', i === step - 1));
  sl.querySelector('.nb-larc').style.strokeDashoffset = -((step - 1) * 440);
  const box = sl.querySelector('.nb-info');
  box.innerHTML = `<div class="nb-icon">${L.icon}</div><h3>${AR(step)}. ${L.ar}</h3><p>${L.b}</p><div class="nb-en" dir="ltr">${L.ex}</div>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
};
window.NB_FINAL = { MODES, BRAIN };
})();
