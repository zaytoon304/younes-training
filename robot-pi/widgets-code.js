/* =====================================================================
   أدوات البرمجة بلغة Python (الوحدتان ٢ و٣):
   pycode (كود Python مشروح سطرًا سطرًا) · thonny (برنامج Thonny) ·
   robosim (برمج نبيه بالبطاقات) · varlab (المتغير صندوق) · ifsim (نبيه يقرر)
   أوامر مكتبة nabeeh المستخدمة هنا هي نفسها التي سنكتبها للروبوت الحقيقي:
   forward(steps=1) · backward(steps=1) · left() · right() · stop() · distance() · say(text)
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- تلوين كود Python ---------- */
const PY_KW = new Set(['import', 'from', 'for', 'in', 'if', 'elif', 'else', 'while', 'def', 'return', 'True', 'False', 'None', 'and', 'or', 'not', 'break']);
const PY_FN = new Set(['print', 'range', 'input', 'int', 'str', 'len', 'nabeeh', 'forward', 'backward', 'left', 'right', 'stop', 'distance', 'say', 'sleep', 'time']);
function pyLine(line) {
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let out = '', m;
  while ((m = re.exec(line))) {
    const [t, com, str, num, id] = m;
    if (com) out += `<span class="c-com"># <bdi>${esc(com.slice(1).trim())}</bdi></span>`;   // التعليق العربي معزول ليبقى # قبله
    else if (str) { const t = esc(str.slice(1, -1));      // النص العربي فقط يُعزل بخط عربي، والإنجليزي يبقى بخط الكود
      out += `<span class="c-str">${str[0]}${/[\u0600-\u06FF]/.test(t) ? `<bdi>${t}</bdi>` : t}${str[0]}</span>`; }
    else if (num) out += `<span class="c-num">${num}</span>`;
    else if (id) out += PY_KW.has(id) ? `<span class="c-kw">${id}</span>` : PY_FN.has(id) ? `<span class="c-fn">${id}</span>` : id;
    else out += esc(t);
  }
  return out;
}
function pyBlock(code, cls = '') {
  return `<div class="code ${cls}" dir="ltr">${code.split('\n').map((l, i) =>
    `<div class="ln" data-n="${i + 1}"><span class="cl-num">${i + 1}</span><span class="cl-src">${pyLine(l) || ' '}</span></div>`).join('')}</div>`;
}
const sizeCls = n => n > 15 ? 'micro' : n > 13 ? 'tiny' : n > 9 ? 'mid' : '';

/* ---------- برمج نبيه: محاكي الشبكة ---------- */
const CMD = {
  f: { icon: '⬆️', ar: 'امشِ خطوة', py: 'nabeeh.forward()' },
  l: { icon: '↩️', ar: 'لف يسار', py: 'nabeeh.left()' },
  r: { icon: '↪️', ar: 'لف يمين', py: 'nabeeh.right()' },
};
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];      // الاتجاهات: ٠ أعلى، ١ يمين، ٢ أسفل، ٣ يسار
const MAX = 12;
/* رسمة نبيه من الأعلى (يتجه للأعلى، ونديرها حسب الاتجاه) */
const BOT = `<svg viewBox="0 0 100 100"><rect x="8" y="18" width="16" height="64" rx="7" fill="#1b1e27"/><rect x="76" y="18" width="16" height="64" rx="7" fill="#1b1e27"/>
  <rect x="20" y="12" width="60" height="76" rx="18" fill="#2E4288" stroke="#D9AE4B" stroke-width="4"/>
  <circle cx="38" cy="30" r="9" fill="#fff"/><circle cx="62" cy="30" r="9" fill="#fff"/><circle cx="38" cy="27" r="4" fill="#0A1230"/><circle cx="62" cy="27" r="4" fill="#0A1230"/>
  <rect x="34" y="52" width="32" height="22" rx="5" fill="#1f8a3c"/></svg>`;

/* البرنامج = قائمة أوامر؛ في مراحل التكرار يكون: كرر (n) مرات ← قائمة أوامر */
function pyOf(L, prog) {
  const lines = ['import nabeeh', ''], at = [];        // at[i] = رقم سطر الأمر رقم i
  if (L.loop) {
    lines.push(`for i in range(${prog.n}):`);
    prog.body.forEach((c, i) => { lines.push('    ' + CMD[c].py); at[i] = lines.length; });
    if (!prog.body.length) lines.push('    # أضف أوامر هنا');
  } else {
    prog.body.forEach((c, i) => { lines.push(CMD[c].py); at[i] = lines.length; });
    if (!prog.body.length) lines.push('# اضغط البطاقات لتكتب البرنامج');
  }
  return { code: lines.join('\n'), at };
}

function simBoard(L) {
  let cells = '';
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const wall = L.walls.some(w => w[0] === x && w[1] === y), goal = L.goal[0] === x && L.goal[1] === y;
    cells += `<div class="nb-cell ${wall ? 'wall' : ''}" data-x="${x}" data-y="${y}">${goal ? '<span class="nb-goal">⭐</span>' : ''}</div>`;
  }
  return `<div class="nb-board" style="grid-template-columns:repeat(${L.w},1fr);aspect-ratio:${L.w}/${L.h}">${cells}
    <div class="nb-robot" style="width:${100 / L.w}%;height:${100 / L.h}%">${BOT}</div></div>`;
}

const CODE_STEP = s => ({ ...s, t: 'code' });     // pycode يستعمل منطق خطوات شريحة الكود في دورة الأردوينو

Object.assign(window.DECK_TYPES, {
  /* كود Python مشروح: نفس شكل شريحة الكود في دورة الأردوينو */
  pycode: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:26px">${s.title}</h2>
      <div class="codegrid">
        <div class="explain ${s.reveal ? 'solo' : ''}">${s.reveal ? '<div class="xstart">اضغط «التالي» لنكتب أول سطر ✍️</div>' : ''}${(s.steps || []).map((st, i) => `<div class="xp f"><i>${AR(i + 1)}</i><div>${st.text}</div></div>`).join('')}
          ${s.note ? `<div class="xnote">${s.note}</div>` : ''}</div>
        <div class="codewrap">
          <div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">${s.file || 'nabeeh.py'}</span>
            <button class="copy ix">📋 نسخ الكود</button></div>
          ${pyBlock(s.code, sizeCls(s.code.split('\n').length) + (s.reveal ? ' typing' : ''))}
          ${s.output ? `<div class="nb-out f"><span>المخرجات ▸</span><pre dir="auto">${esc(s.output)}</pre></div>` : ''}
        </div>
      </div></div>`,

  /* برنامج Thonny: جولة على أزراره، وعند زر التشغيل تظهر النتيجة */
  thonny: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'برنامج تفاعلي'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-grid wide"><div class="nb-panel"><div class="nb-info"><div class="nb-icon">🐍</div><h3>برنامج Thonny</h3>
          <p>هنا نكتب برامج Python لنبيه. اضغط أي جزء، أو «التالي» للجولة.</p></div>
          <div class="nb-hint">👆 اضغط أي زر · ⬅️ «التالي» للجولة (${AR(THONNY_TOUR.length)})</div></div>
        <div class="nb-stage ix"><div class="nb-win nb-thonny">
          <div class="nb-wbar"><span class="nb-dots"><b></b><b></b><b></b></span>Thonny — nabeeh.py</div>
          <div class="nb-ttools">${['new:📄', 'open:📂', 'save:💾', 'run:▶️', 'stop:⏹️'].map(x => { const [k, ic] = x.split(':');
            return `<span class="nb-tp nb-tb ${k}" data-p="${k}">${ic}<small>${THONNY[k].en.split(' ')[0]}</small></span>`; }).join('')}<span class="nb-dsp"></span><span class="nb-tz">Python 3</span></div>
          <div class="nb-tp nb-ted" data-p="editor">${pyBlock(s.code, 'nb-small')}</div>
          <div class="nb-tp nb-tshell" data-p="shell"><div class="nb-shtitle">Shell</div><pre dir="auto"><span class="nb-prompt">&gt;&gt;&gt;</span> <span class="nb-res">${esc(s.output || '')}</span></pre></div>
        </div></div></div>${THONNY_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  /* برمج نبيه بالبطاقات */
  robosim: s => { const L = s.level; return `<div class="slide light">
      <div class="kicker">${s.kicker || '🎮 برمج نبيه'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="nb-sim ix">
        <div class="nb-simside">
          <div class="nb-pal">${L.cards.map(c => `<button class="nb-card" data-c="${c}"><span>${CMD[c].icon}</span><b>${CMD[c].ar}</b></button>`).join('')}</div>
          <div class="nb-prog">${L.loop ? `<div class="nb-loophead">🔁 كرر <button class="nb-nbtn" data-d="-1">−</button><b class="nb-n">${AR(L.n || 2)}</b><button class="nb-nbtn" data-d="1">+</button> مرات:</div>` : ''}
            <div class="nb-chips ${L.loop ? 'inloop' : ''}"></div></div>
          <div class="nb-ctl"><button class="nb-btn go">▶ شغّل</button><button class="nb-btn ghost back">↺ ارجع</button><button class="nb-btn ghost clear">🗑️ امسح</button>
            ${s.solution ? '<button class="nb-btn ghost sol">💡 الحل</button>' : ''}</div>
          <div class="nb-msg">${s.goal || 'أوصل نبيه إلى النجمة ⭐'}</div>
        </div>
        <div class="nb-simmain">${simBoard(L)}<div class="nb-pywrap"><div class="nb-pyt">🐍 برنامجك بلغة Python</div><div class="nb-py"></div></div></div>
      </div></div>`; },

  /* المتغير صندوق له اسم */
  varlab: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '📦 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="nb-var ix">
        <div class="nb-boxes">
          <div class="nb-vbox"><div class="nb-vlid">name</div><input class="nb-vin" maxlength="12" value="${s.name || 'Sara'}" dir="ltr"><small>اكتب اسمك بالإنجليزي</small></div>
          <div class="nb-vbox num"><div class="nb-vlid">steps</div><div class="nb-vnum"><button class="nb-nbtn" data-d="-1">−</button><b class="nb-sv">3</b><button class="nb-nbtn" data-d="1">+</button></div><small>كم خطوة يمشي نبيه؟</small></div>
        </div>
        <div class="nb-vright">
          <div class="codewrap"><div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">variables.py</span><button class="nb-btn mini go">▶ شغّل</button></div><div class="nb-vcode"></div></div>
          <div class="nb-track"><div class="nb-tbot">${BOT}</div>${[1, 2, 3, 4, 5, 6].map(i => `<span>${AR(i)}</span>`).join('')}</div>
          <div class="nb-out"><span>المخرجات ▸</span><pre dir="ltr" class="nb-vout"></pre></div>
        </div>
      </div></div>`,

  /* نبيه يقرر: إذا اقترب الجدار يتوقف */
  ifsim: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '🤔 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="nb-if ix">
        <div class="nb-ifl">
          <div class="codewrap"><div class="codebar"><span class="dots"><b></b><b></b><b></b></span><span class="fname">decide.py</span></div>${pyBlock(IF_CODE)}</div>
        </div>
        <div class="nb-ifr">
          <div class="nb-road"><div class="nb-rbot">${BOT}</div><div class="nb-waves"><i></i><i></i><i></i></div><div class="nb-wall">🧱</div></div>
          <label class="nb-slider"><span>المسافة إلى الجدار: <b class="nb-dv">60</b> سم</span><input type="range" min="2" max="100" value="60"></label>
          <div class="nb-ifst"></div>
        </div>
      </div></div>`,
});

const IF_CODE = `import nabeeh

distance = nabeeh.distance()
if distance < 20:
    nabeeh.stop()
    nabeeh.say("يوجد جدار!")
else:
    nabeeh.forward()`;

const THONNY = {
  new:    { icon: '📄', ar: 'ملف جديد', en: 'New', b: 'يفتح صفحة فارغة لبرنامج جديد.' },
  open:   { icon: '📂', ar: 'فتح ملف', en: 'Load', b: 'يفتح برنامجًا حفظناه قبل.' },
  save:   { icon: '💾', ar: 'حفظ', en: 'Save', b: 'يحفظ برنامجنا باسم، مثل nabeeh.py. لا تنسَ الحفظ!' },
  editor: { icon: '✍️', ar: 'منطقة الكتابة', en: 'Editor', b: 'هنا نكتب أوامر البرنامج، سطرًا تحت سطر.' },
  run:    { icon: '▶️', ar: 'زر التشغيل', en: 'Run · F5', b: 'أهم زر! يشغّل البرنامج، فينفّذ الـ Pi الأوامر من الأعلى للأسفل.' },
  shell:  { icon: '💬', ar: 'نافذة المخرجات', en: 'Shell', b: 'هنا يرد علينا البرنامج: تظهر النتائج، ورسائل الأخطاء أيضًا.' },
  stop:   { icon: '⏹️', ar: 'زر الإيقاف', en: 'Stop', b: 'يوقف البرنامج فورًا. نستعمله إذا مشى نبيه ولم يتوقف!' },
};
const THONNY_TOUR = ['editor', 'save', 'run', 'shell', 'stop', 'new', 'open'];
function thonnyShow(sl, k) {
  sl.querySelectorAll('.nb-tp').forEach(d => d.classList.toggle('sel', d.dataset.p === k));
  sl.querySelector('.nb-thonny').classList.add('has-sel');
  if (k === 'run') sl.querySelector('.nb-thonny').classList.add('ran');     // بعد التشغيل تظهر النتيجة
  const p = THONNY[k], box = sl.querySelector('.nb-info');
  box.innerHTML = `<div class="nb-icon">${p.icon}</div><h3>${p.ar}</h3><div class="nb-en" dir="ltr">${p.en}</div><p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}

/* ---------- ربط المحاكي ---------- */
function bindSim(sl, s) {
  const L = s.level, prog = { n: L.n || 2, body: [] };
  const chips = sl.querySelector('.nb-chips'), py = sl.querySelector('.nb-py'), msg = sl.querySelector('.nb-msg');
  const robot = sl.querySelector('.nb-robot');
  let bot, timers = [], running = false;
  const clearT = () => { timers.forEach(clearTimeout); timers = []; };
  window.DECK_CLEANUP.push(clearT);

  const place = (anim = true) => {
    robot.style.transition = anim ? '' : 'none';
    robot.style.left = (bot.x * 100 / L.w) + '%'; robot.style.top = (bot.y * 100 / L.h) + '%';
    robot.querySelector('svg').style.transform = `rotate(${bot.turn * 90}deg)`;
  };
  const reset = () => { clearT(); running = false; bot = { x: L.start[0], y: L.start[1], turn: L.start[2] };
    sl.querySelectorAll('.nb-cell.trail').forEach(c => c.classList.remove('trail'));
    robot.classList.remove('bump', 'win'); place(false); sl.querySelector('.nb-sim').classList.remove('running'); };
  const say = (t, cls = '') => { msg.innerHTML = t; msg.className = 'nb-msg ' + cls; };
  const draw = () => {
    chips.innerHTML = prog.body.map((c, i) => `<span class="nb-chip" data-i="${i}" title="اضغط للحذف"><i>${AR(i + 1)}</i>${CMD[c].icon} ${CMD[c].ar}</span>`).join('')
      || `<span class="nb-empty">${L.loop ? 'أضف الأوامر التي تتكرر' : 'برنامجك فارغ… اضغط البطاقات'}</span>`;
    const n = sl.querySelector('.nb-n'); if (n) n.textContent = AR(prog.n);
    py.innerHTML = pyBlock(pyOf(L, prog).code, 'nb-small');
    py.scrollTop = py.scrollHeight;      // آخر أمر أضفناه يبقى ظاهرًا
  };
  const edit = f => { if (running) return; f(); reset(); draw(); say(s.goal || 'أوصل نبيه إلى النجمة ⭐'); };

  sl.querySelectorAll('.nb-card').forEach(b => b.onclick = () => edit(() => { if (prog.body.length < MAX) prog.body.push(b.dataset.c); }));
  chips.onclick = e => { const c = e.target.closest('.nb-chip'); if (c) edit(() => prog.body.splice(+c.dataset.i, 1)); };
  sl.querySelectorAll('.nb-loophead .nb-nbtn').forEach(b => b.onclick = () => edit(() => { prog.n = Math.min(6, Math.max(1, prog.n + +b.dataset.d)); }));
  sl.querySelector('.back').onclick = () => edit(() => prog.body.pop());
  sl.querySelector('.clear').onclick = () => edit(() => { prog.body = []; });
  const sol = sl.querySelector('.sol');
  if (sol) sol.onclick = () => edit(() => { prog.body = [...s.solution.body]; if (s.solution.n) prog.n = s.solution.n; });

  sl.querySelector('.go').onclick = () => {
    if (running || !prog.body.length) return;
    reset(); running = true; sl.querySelector('.nb-sim').classList.add('running');
    const { at } = pyOf(L, prog);
    const ops = []; const reps = L.loop ? prog.n : 1;
    for (let r = 0; r < reps; r++) prog.body.forEach((c, i) => ops.push({ c, i, line: at[i], loopLine: L.loop ? 3 : 0 }));
    say('🏃 نبيه ينفّذ برنامجك…');
    const lines = () => sl.querySelectorAll('.nb-py .ln');
    const mark = (op) => { lines().forEach(l => l.classList.toggle('run', +l.dataset.n === op.line || (op.loopLine && +l.dataset.n === op.loopLine)));
      const cur = py.querySelector(`.ln[data-n="${op.line}"]`);      // الكود الطويل يتحرك ليبقى السطر الحالي ظاهرًا
      if (cur) py.scrollTop = Math.max(0, cur.offsetTop - py.clientHeight / 2);
      chips.querySelectorAll('.nb-chip').forEach((c, k) => c.classList.toggle('now', k === op.i)); };
    const end = (ok, text) => { running = false; sl.querySelector('.nb-sim').classList.remove('running');
      lines().forEach(l => l.classList.remove('run')); chips.querySelectorAll('.nb-chip').forEach(c => c.classList.remove('now'));
      say(text, ok ? 'win' : 'bad'); if (ok) robot.classList.add('win'); };
    let k = 0;
    const tick = () => {
      if (k >= ops.length) {
        const won = bot.x === L.goal[0] && bot.y === L.goal[1];
        return end(won, won ? `🎉 أحسنت! وصل نبيه إلى النجمة · عدد ${L.loop ? 'أسطر برنامجك' : 'الأوامر'}: ${AR(L.loop ? prog.body.length + 1 : prog.body.length)}`
          : '🤔 انتهى البرنامج ولم يصل نبيه… عدّل الأوامر وجرّب مرة ثانية');
      }
      const op = ops[k++]; mark(op);
      if (op.c === 'f') {
        const d = ((bot.turn % 4) + 4) % 4, nx = bot.x + DX[d], ny = bot.y + DY[d];
        const out = nx < 0 || ny < 0 || nx >= L.w || ny >= L.h, wall = L.walls.some(w => w[0] === nx && w[1] === ny);
        if (out || wall) { robot.classList.remove('bump'); void robot.offsetWidth; robot.classList.add('bump');
          return end(false, wall ? '💥 اصطدم نبيه بالجدار! جرّب مرة ثانية' : '😵 كاد نبيه يخرج من الطاولة! جرّب مرة ثانية'); }
        sl.querySelector(`.nb-cell[data-x="${bot.x}"][data-y="${bot.y}"]`).classList.add('trail');
        bot.x = nx; bot.y = ny;
      } else bot.turn += op.c === 'r' ? 1 : -1;
      place(); timers.push(setTimeout(tick, 700));
    };
    timers.push(setTimeout(tick, 350));
  };
  reset(); draw();
}

function bindVar(sl) {
  const inp = sl.querySelector('.nb-vin'), sv = sl.querySelector('.nb-sv'), code = sl.querySelector('.nb-vcode'), out = sl.querySelector('.nb-vout');
  const tb = sl.querySelector('.nb-tbot');
  let steps = 3, t = null;
  window.DECK_CLEANUP.push(() => clearTimeout(t));
  const clean = () => (inp.value.replace(/[^A-Za-z ]/g, '').trim() || 'Sara');
  const draw = () => {
    sv.textContent = AR(steps);
    code.innerHTML = pyBlock(`import nabeeh\n\nname = "${clean()}"\nsteps = ${steps}\n\nprint("Hello", name)\nnabeeh.forward(steps)`, 'nb-small');
    out.textContent = ''; tb.style.transition = 'none'; tb.style.left = '0%';
  };
  inp.addEventListener('input', draw);
  inp.addEventListener('keydown', e => e.stopPropagation());     // الكتابة لا تقلب الشرائح
  sl.querySelectorAll('.nb-vnum .nb-nbtn').forEach(b => b.onclick = () => { steps = Math.min(6, Math.max(1, steps + +b.dataset.d)); draw(); });
  sl.querySelector('.go').onclick = () => {
    draw(); out.textContent = 'Hello ' + clean();
    t = setTimeout(() => { tb.style.transition = `left ${0.45 * steps}s linear`; tb.style.left = (steps * 100 / 6.6) + '%'; }, 250);
  };
  draw();
}

function bindIf(sl) {
  const r = sl.querySelector('input[type=range]'), dv = sl.querySelector('.nb-dv'), st = sl.querySelector('.nb-ifst');
  const bot = sl.querySelector('.nb-rbot'), lines = sl.querySelectorAll('.code .ln');
  const upd = () => {
    const d = +r.value, near = d < 20;
    dv.textContent = AR(d);
    bot.style.right = `calc(${(d / 100) * 66}% + 110px)`;       // كلما قلّت المسافة اقترب نبيه من الجدار
    lines.forEach(l => { const n = +l.dataset.n;
      l.classList.toggle('run', n === 3 || n === 4 || (near ? n === 5 || n === 6 : n === 7 || n === 8));
      l.classList.toggle('dim', near ? n === 7 || n === 8 : n === 5 || n === 6); });
    st.innerHTML = near ? `🛑 <b>${AR(d)} أقل من ٢٠</b>… الشرط صحيح، فنبيه يتوقف ويقول: «يوجد جدار!»`
                        : `🚗 <b>${AR(d)} ليست أقل من ٢٠</b>… الشرط خطأ، فنبيه يذهب إلى else ويمشي`;
    st.className = 'nb-ifst ' + (near ? 'bad' : 'win');
    sl.querySelector('.nb-road').classList.toggle('near', near);
  };
  r.addEventListener('input', upd); upd();
}

Object.assign(window.DECK_BIND, {
  pycode(sl, s) { window.DECK_BIND.code(sl, s); },
  thonny(sl) { sl.querySelectorAll('.nb-tp').forEach(d => d.addEventListener('click', () => thonnyShow(sl, d.dataset.p))); },
  robosim: bindSim,
  varlab: bindVar,
  ifsim: bindIf,
});

const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (s.t === 'pycode') { if (baseStep) baseStep(step, CODE_STEP(s)); return; }
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (sl && s.t === 'thonny' && step > 0) thonnyShow(sl, THONNY_TOUR[step - 1]);
};

window.NB_CODE = { pyLine, pyOf, CMD, IF_CODE };
})();
