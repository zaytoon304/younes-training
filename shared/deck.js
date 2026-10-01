/* محرك عروض منصة جذور — مشترك بين الدورات (مواقف صفية، الأردوينو…) */
/* ========== تجهيز قائمة الشرائح ========== */
const C = window.DECK || window.MAWAQIF;   // بيانات الدورة الحالية
const SLIDES = [];                       // كل شرائح الدورة بالترتيب
C.modules.forEach((m, mi) => m.slides.forEach(s => SLIDES.push({ ...s, mi })));
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);   // أرقام عربية
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

let cur = 0, step = 0;                   // الشريحة الحالية، وعدد العناصر الظاهرة فيها

/* الشرائح الداكنة: العناوين والنصوص الشرعية؛ والباقي فاتح */
const DARK = ['cover','section','hadith','ayah','statement','prophet','activity','mcover','end'];

/* ========== رسم كل نوع من الشرائح ========== */
const R = {
  cover: () => `<div class="slide dark cover">
      <div class="logo">🌳</div>
      <div class="tag">${C.tag}</div>
      <h1>${C.title}</h1>
      <div class="subt">${C.subtitle}</div>
      <div class="goldline"></div>
      <div class="by">إعداد وتقديم: <b>${C.author}</b></div></div>`,

  bio: s => `<div class="slide light">
      <div class="kicker">مقدّم الدورة</div>
      <h2 class="title" style="margin-bottom:12px">${s.name}</h2>
      <div class="sub" style="margin-top:0;color:var(--navy-600)">${s.role}</div>
      <div class="cards" style="grid-template-columns:repeat(3,1fr)">
        ${s.facts.map(f => `<div class="card f" style="align-items:center;text-align:center;padding:60px 30px">
          <div style="font-size:${/\d|[٠-٩]/.test(f.big)?110:68}px;font-weight:900;color:var(--gold-dark);line-height:1.2;direction:ltr">${f.big}</div>
          <p style="font-size:40px;font-weight:800;color:var(--navy-800)">${f.small}</p></div>`).join('')}
      </div>
      <div class="f" style="text-align:center;font-size:36px;font-weight:700;color:var(--muted);margin-top:30px">${s.line}</div></div>`,

  cards: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title">${s.title}</h2>
      <div class="cards" style="grid-template-columns:repeat(${s.cols || s.cards.length},1fr);${s.cols ? 'gap:28px' : ''}">
        ${s.cards.map(c => `<div class="card f" ${s.cols ? 'style="padding:30px 34px;gap:10px"' : ''}><div class="ic" ${s.cols ? 'style="width:84px;height:84px;font-size:48px"' : ''}>${c.icon}</div><h3 ${s.cols ? 'style="font-size:40px"' : ''}>${c.h}</h3><p ${s.cols ? 'style="font-size:32px"' : ''}>${c.b}</p></div>`).join('')}
      </div></div>`,

  section: s => `<div class="slide dark section">
      <div class="num">${s.num}</div>
      <div class="lbl">${s.label || C.sectionLabel || 'المحطة'} ${s.num}</div>
      <h2>${s.title}</h2><p>${s.sub}</p></div>`,

  hadith: s => `<div class="slide dark center">
      <div class="kicker">${s.kicker}</div>
      <div class="hadith-box"><div class="naskh">${s.text}</div></div>
      <div class="src f">${s.src}</div></div>`,

  ayah: s => `<div class="slide dark center">
      <div class="kicker">قال تعالى</div>
      <div class="ayah"><span class="br">﴿</span> ${s.text} <span class="br">﴾</span></div>
      <div class="src">${s.src}</div></div>`,

  statement: s => `<div class="slide dark center">
      <div class="kicker">${s.kicker}</div>
      <div class="statement ${s.src ? 'naskh' : ''}" ${s.src ? 'style="font-size:88px"' : ''}>${s.text.replace(/…/, '…<br><span class="hl">') + (s.text.includes('…') ? '</span>' : '')}</div>
      ${s.src ? `<div class="src">${s.src}</div>` : ''}</div>`,

  script: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title">${s.title}</h2>
      <div class="lines">
        ${s.lines.map(l => `<div class="line f"><div class="who">${l.who}</div>
          <div class="bubble ${l.say.length > 55 ? 'long' : ''}"><span class="q">«</span>${l.say}<span class="q">»</span></div></div>`).join('')}
      </div>
      ${s.warn ? `<div class="warn f">⚠️ ${s.warn}</div>` : ''}</div>`,

  activity: s => `<div class="slide dark">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="color:var(--gold-light)">${s.title}</h2>
      <div class="activity">
        <div class="steps">${s.steps.map((t, i) => `<div class="step f"><div class="n">${AR(i + 1)}</div><div>${t}</div></div>`).join('')}</div>
        <div class="timer" id="timer" data-sec="${s.timer}" onclick="event.stopPropagation();startTimer(this)">
          <div class="t">${fmt(s.timer)}</div><div class="h">اضغط لبدء المؤقت</div></div>
      </div></div>`,

  prophet: s => `<div class="slide dark">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title">${s.title}</h2>
      <div class="prophet">
        <div><div class="story">${s.story}</div>
          <div class="pq f">«${s.quote}»<small>${s.src}</small></div></div>
        <div class="lessons f"><h4>كيف تصرّف ﷺ؟</h4>
          ${s.lessons.map((l, i) => `<div class="l"><i>${AR(i + 1)}</i><div>${l}</div></div>`).join('')}</div>
      </div></div>`,

  puzzle: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:30px">${s.title}</h2>
      <div class="pz" id="pz"><div class="words">${s.words.map(w => `<span class="word">${w}</span>`).join('')}</div>
      <div class="ptext">${s.text.replace(/____/g, '<span class="blank"></span>')}</div>
      <div class="answer"><b>الحل:</b> ${s.answer}</div></div><i class="f" data-reveal="pz"></i></div>`,

  vote: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title">${s.title}</h2>
      <div class="opts ${s.options.length > 3 ? 'compact' : ''}" id="opts">
        ${s.options.map((o, i) => `<div class="opt ${i === s.correct ? 'ok' : ''}"><div class="L">${LETTERS[i]}</div>
          <div class="tx">${o}${s.why ? `<div class="w">${s.why[i]}</div>` : ''}</div></div>`).join('')}
      </div><i class="f" data-reveal="opts"></i></div>`,

  chart: s => {
    const max = 100;
    return `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:30px">${s.title}</h2>
      <div class="chart" id="chart">
        ${s.bars.map(b => `<div class="bar ${b.tone}"><div class="v">${AR(b.v)}</div><div class="col" data-h="${b.v / max * 100}%"></div></div>`).join('')}
      </div>
      <div class="blabels">${s.bars.map(b => `<div>${b.label}</div>`).join('')}</div>
      <div class="chart-src">المحور الرأسي: ${s.unit} · المصدر: ${s.src}</div></div>`;
  },

  map: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="map ${s.stops.length > 9 ? 'map4' : ''}">${s.stops.map((p, i) => `<div class="stop"><div class="i">${p.icon}</div>
        <div><div class="no">${C.sectionLabel || 'المحطة'} ${AR(i + (C.mapStart ?? 1))}</div><div class="nm">${p.name}</div></div></div>`).join('')}</div></div>`,

  mcover: s => `<div class="slide dark mcover">
      ${s.img ? `<div class="bgimg kb"><img src="${s.img}" alt=""></div>` : `<div class="big">${s.icon}</div>`}
      <div class="cat">${s.cat}</div>
      <div class="lbl">الموقف ${s.num}</div>
      <h2>${s.title}</h2>
      <div class="flow"><span>🎬 القصة</span><span>🗳️ تصويت</span><span>🔍 لماذا؟</span><span>⏱️ أول ١٠ ثوانٍ</span><span>💬 ماذا تقول؟</span><span>🪜 سلّم التدخّل</span></div></div>`,

  story: s => {
    if (s.img) return `<div class="slide dark story-full">
      <div class="bgimg kb"><img src="${s.img}" alt=""></div>
      <div class="kicker">🎬 القصة · ${s.title}</div>
      <div class="cap">${s.paras.map((p, i) => `<div class="sp ${i ? 'f' : ''} ${i === s.paras.length - 1 ? 'last' : ''}">${p}</div>`).join('')}</div>
      <div class="capdots">${s.paras.map(() => '<i></i>').join('')}</div></div>`;
    const paras = `<div class="story-wrap">${s.paras.map((p, i) => `<div class="para f ${i === s.paras.length - 1 ? 'last' : ''}">${p}</div>`).join('')}</div>`;
    return `<div class="slide light">
      <div class="kicker">🎬 القصة</div>
      <h2 class="title" style="margin-bottom:20px">${s.title}</h2>
      ${s.img ? `<div class="story-grid">${paras}<div class="scene kb"><img src="${s.img}" alt=""></div></div>` : paras}</div>`;
  },

  why: s => `<div class="slide light">
      <div class="kicker">🔍 ${s.sub}</div>
      <h2 class="title">${s.title}</h2>
      <div class="why-grid" style="grid-template-columns:repeat(${s.causes.length},1fr)">${s.causes.map(c => `<div class="card f"><div class="ic">${c.icon}</div><h3>${c.h}</h3><p>${c.b}</p></div>`).join('')}</div>
      <div class="key f">💡 ${s.key.replace('…', '…<br><b>') + '</b>'}</div></div>`,

  first10: s => `<div class="slide light">
      <div class="kicker">⏱️ ${s.sub}</div>
      <div class="clock">⏱ ${s.clock || '١٠ ثوانٍ'}</div>
      <h2 class="title">${s.title}</h2>
      <div class="f10">${s.steps.map((x, i) => `<div class="s f"><div class="n">${AR(i + 1)}</div><h3>${x.h}</h3><p>${x.b}</p></div>`).join('')}</div></div>`,

  ladder: s => {
    const cols = ['#2E9E6B', '#5A9E4B', '#B7A034', '#D99A2B', '#D9722B', '#C94040'];
    return `<div class="slide light">
      <div class="kicker">🪜 ${s.sub}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="ladder">${s.steps.map((t, i) => `<div class="rung f" style="background:${cols[i]};margin-right:${i * 70}px">
        <div class="n">${AR(i + 1)}</div><div>${t}</div></div>`).join('')}</div></div>`;
  },

  dodont: s => `<div class="slide light">
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="dd"><div class="hd"><div class="x">${(s.heads || [])[0] || '❌ الخطأ الشائع'}</div><div></div><div class="v">${(s.heads || [])[1] || '✅ البديل'}</div></div>
        ${s.rows.map(r => `<div class="r"><div class="c x f">${r[0]}</div><div class="ar">←</div>
          <div class="slot"><span class="q">💬 ناقشوا… ما البديل؟</span><div class="c v f">${r[1]}</div></div></div>`).join('')}</div></div>`,
};

Object.assign(R, {
  myth: s => `<div class="slide light">
      <div class="kicker">صح أم خطأ؟ ${s.n ? '· ' + AR(s.n) + ' من ' + AR(s.of) : ''}</div>
      <div class="myth">
        <div class="claim">${s.text}</div>
        <div class="stamp f">✗ خطأ</div>
        <div class="fix f"><b>الصحيح: </b>${s.fix}</div>
      </div></div>`,

  table: s => {
    const cols = s.widths || s.head.map(() => '1fr');
    const gt = `grid-template-columns:${cols.join(' ')}`;
    return `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="tbl"><div class="tr" style="${gt}">${s.head.map(h => `<div class="th">${h}</div>`).join('')}</div>
        ${s.rows.map(r => `<div class="tr f" style="${gt}">${r.map(c => `<div class="td">${c}</div>`).join('')}</div>`).join('')}</div></div>`;
  },

  quad: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="quad">
        <div class="ax v">${s.yHigh}</div>${s.cells.slice(0, 2).map(c => quadCell(c)).join('')}
        <div class="ax v">${s.yLow}</div>${s.cells.slice(2).map(c => quadCell(c)).join('')}
        <div></div><div class="ax">${s.xRight}</div><div class="ax">${s.xLeft}</div>
      </div></div>`,

  numlist: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="numlist ${s.items.length > 4 ? 'compact' : ''}">${s.items.map((it, i) => `<div class="it f"><div class="n">${AR(i + 1)}</div>
        <div><h3>${it.h}</h3>${it.b ? `<p>${it.b}</p>` : ''}</div></div>`).join('')}</div></div>`,

  end: s => `<div class="slide dark cover">
      <div class="logo">🌳</div>
      <h1 style="font-size:150px">${s.title}</h1>
      <div class="subt">${s.sub}</div>
      <div class="goldline"></div>
      <div class="by">${C.title} · إعداد وتقديم: <b>${C.author}</b></div></div>`,
});
function quadCell(c) {
  return `<div class="cell f ${c.best ? 'best' : ''}"><div class="ci">${c.icon}</div><h3>${c.name}</h3><p>${c.desc}</p></div>`;
}

/* نقطة التوسعة: كل دورة تضيف أنواعها الخاصة هنا (مثل أدوات الأردوينو التفاعلية) */
if (window.DECK_TYPES) Object.assign(R, window.DECK_TYPES);
const BIND = window.DECK_BIND || {};

function fmt(sec) { return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }

/* ========== العرض والتنقل ========== */
function footer(s) {
  if (s.t === 'cover') return '';
  return `<div class="foot"><div class="brand">🌳 <b>جذور</b> · ${C.title}</div><div class="sp"></div>
    <div>${C.modules[s.mi].name}</div><div>·</div><div>${AR(cur + 1)}</div></div>`;
}
/* الأدوات التفاعلية تسجّل هنا ما يجب إيقافه عند مغادرة الشريحة (مؤقتات المحاكاة) */
window.DECK_CLEANUP = [];
function render() {
  window.DECK_CLEANUP.splice(0).forEach(f => { try { f(); } catch (e) {} });
  clearInterval(tmr);
  const s = SLIDES[cur];
  const stage = document.getElementById('stage');
  stage.innerHTML = R[s.t](s);
  const sl = stage.firstElementChild;
  sl.querySelectorAll('h2.title').forEach(h => { if (h.textContent.length > 32) h.classList.add('long'); });
  sl.classList.add('enter');
  sl.insertAdjacentHTML('beforeend', footer(s));
  step = 0;
  if (BIND[s.t]) BIND[s.t](sl, s);    // ربط الأدوات التفاعلية بعد الرسم
  (window.DECK_HOOKS || []).forEach(h => h(sl, s));   // إضافات عامة (مثل التصويت الحي)
  if (s.t === 'vote' && s.tap) {        // الاختبار: الضغط على أي خيار يكشف الإجابة
    sl.querySelectorAll('.opt').forEach(o => { o.classList.add('ix'); o.style.cursor = 'pointer';
      o.onclick = () => { o.classList.add('picked'); step = frags().length; applySteps(); }; });
  }
  applySteps();
  // الرسم البياني يرتفع تلقائيًا
  if (s.t === 'chart') setTimeout(() => stage.querySelectorAll('.col').forEach((c, i) =>
    setTimeout(() => c.style.height = c.dataset.h, i * 180)), 250);
  document.getElementById('cnt').textContent = `${AR(cur + 1)} / ${AR(SLIDES.length)}`;
  const hc = document.getElementById('hcnt'); if (hc) hc.textContent = AR(cur + 1);
  document.getElementById('progress').style.width = ((cur + 1) / SLIDES.length * 100) + '%';
  if (location.hash !== '#' + (cur + 1)) history.replaceState(null, '', '#' + (cur + 1));
}
function frags() { return [...document.querySelectorAll('#stage .f')]; }
function applySteps() {
  frags().forEach((el, i) => {
    const on = i < step;
    el.classList.toggle('in', on);
    if (el.dataset.reveal) document.getElementById(el.dataset.reveal).classList.toggle('revealed', on);
  });
  const sps = [...document.querySelectorAll('#stage .cap .sp')];
  if (sps.length) {
    const cur = Math.min(step, sps.length - 1);
    sps.forEach((el, i) => el.classList.toggle('now', i === cur));
    document.querySelectorAll('#stage .capdots i').forEach((d, i) => d.classList.toggle('on', i <= cur));
  }
  if (window.DECK_ONSTEP) window.DECK_ONSTEP(step, SLIDES[cur]);   // للأدوات التي تتغير مع كل نقرة
}
function next() {
  if (step < frags().length) { step++; applySteps(); return; }
  if (cur < SLIDES.length - 1) { cur++; render(); }
}
function prev() {
  if (step > 0) { step--; applySteps(); return; }
  if (cur > 0) { cur--; render(); step = frags().length; applySteps(); }
}
function goTo(i) { cur = Math.max(0, Math.min(SLIDES.length - 1, i)); render(); toggleMenu(false); }

/* مؤقت النشاط */
let tmr = null;
function startTimer(el) {
  clearInterval(tmr);
  let left = +el.dataset.sec;
  el.classList.remove('done'); el.classList.add('run');
  el.querySelector('.h').textContent = 'الوقت المتبقي';
  tmr = setInterval(() => {
    left--; el.querySelector('.t').textContent = fmt(Math.max(0, left));
    if (left <= 0) { clearInterval(tmr); el.classList.replace('run', 'done'); el.querySelector('.h').textContent = 'انتهى الوقت ✓'; }
  }, 1000);
}

/* قائمة المحاور */
function toggleMenu(force) {
  const m = document.getElementById('menu');
  const open = force ?? !m.classList.contains('open');
  if (open) {
    let idx = 0;
    document.getElementById('mods').innerHTML = C.modules.map((mod, mi) => {
      const first = idx; idx += mod.slides.length;
      return `<button class="${SLIDES[cur].mi === mi ? 'cur' : ''}" onclick="goTo(${first})">${mod.name}<small>${AR(mod.slides.length)} شريحة</small></button>`;
    }).join('');
  }
  m.classList.toggle('open', open);
}
function fullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

/* تكبير المسرح ليملأ الشاشة مع الحفاظ على نسبة 16:9 */
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.getElementById('stage').style.transform = `scale(${k})`;
}
addEventListener('resize', fit);

/* لوحة المفاتيح: نفس أزرار البوربوينت وأجهزة التحكم عن بعد */
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
  else if (e.key === 'f' || e.key === 'F' || e.key === 'ف') fullscreen();
  else if (e.key === 'm' || e.key === 'M' || e.key === 'ة') toggleMenu();
  else if (e.key === 'Escape') toggleMenu(false);
  else if (e.key === 'Home') goTo(0);
  else if (e.key === 'End') goTo(SLIDES.length - 1);
});
/* النقر على الشريحة = التالي */
document.getElementById('viewport').addEventListener('click', e => { if (!e.target.closest('#bar') && !e.target.closest('.ix')) next(); });

/* شريط التحكم مخفي أثناء العرض حتى لا يغطي الشريحة. يظهر بثلاث طرق:
   الاقتراب من أسفل الشاشة، أو زر الزاوية الصغير (يثبّته)، أو مفتاح B */
let hideT, barPinned = false;
const barEl = document.getElementById('bar');
const barBtn = document.createElement('button');
barBtn.id = 'barbtn'; barBtn.title = 'شريط التحكم (B)'; barBtn.innerHTML = '☰ <span id="hcnt"></span>';
document.body.appendChild(barBtn);
function hideBar() {
  if (barPinned || barEl.matches(':hover')) { hideT = setTimeout(hideBar, 1200); return; }
  barEl.classList.add('hide'); barBtn.classList.remove('away');
}
function showBar(ms = 1800) { barEl.classList.remove('hide'); barBtn.classList.add('away'); clearTimeout(hideT); hideT = setTimeout(hideBar, ms); }
function toggleBar() { barPinned = !barPinned; barBtn.classList.toggle('pinned', barPinned); if (barPinned) showBar(); else { clearTimeout(hideT); hideBar(); } }
addEventListener('mousemove', e => { if (innerHeight - e.clientY < 90) showBar(); });
barBtn.addEventListener('click', e => { e.stopPropagation(); toggleBar(); });
addEventListener('keydown', e => { if ((e.key === 'b' || e.key === 'B' || e.key === 'لا') && !e.target.closest('input,textarea')) toggleBar(); });

/* البداية: من رقم الشريحة في الرابط (مثل ‎#12) أو من الغلاف */
(function start() {
  const h = parseInt(location.hash.slice(1));
  cur = Math.max(0, Math.min(SLIDES.length - 1, h ? h - 1 : 0));
  fit(); render(); showBar();
})();
