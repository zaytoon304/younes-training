/* =====================================================================
   صوت الراوي لعرضي «لمسة تراث WRO» (العربي والإنجليزي)
   - شريحة فيها say: يبدأ صوتها وحده عند فتحها، ويظهر كل عنصر (بطاقة/صف) مع جملته
     (البدايات في audio/cues.js، يولّدها narration-tts.py)
   - شريحة القصة كاملة: يُشغَّل زر «الراوي» فيها تلقائيًا (إلا أثناء التصوير للبوربوينت: body.capture)
   - المتصفح يمنع الصوت قبل أول نقرة: لو مُنع، يبدأ مع أول نقرة أو زر على الصفحة
   ===================================================================== */
(function () {
window.DECK_HOOKS = window.DECK_HOOKS || [];
const CUES = window.NARR_CUES || {};
let audio = null, timers = [], pending = null;

function stop() {
  timers.forEach(clearTimeout); timers = [];
  if (audio) { audio.pause(); audio = null; }
  pending = null;
}

function start(s, idx) {
  const c = CUES[s.say];
  audio = new Audio('audio/' + s.say + '.mp3');
  const p = audio.play();
  if (p && p.catch) p.catch(() => { pending = () => { if (cur === idx) start(s, idx); }; });
  // كل جملة بعد الأولى تُظهر العنصر التالي (إن لم يكن ظاهرًا بالنقر)
  ((c && c.starts) || []).slice(1).forEach((t, k) => timers.push(setTimeout(() => {
    if (cur === idx && step < k + 1 && step < frags().length) { step = k + 1; applySteps(); }
  }, t * 1000)));
}

window.DECK_HOOKS.push((sl, s) => {
  stop();
  const idx = cur;
  if (s.say) start(s, idx);
  if (s.t === 'fullstory') {
    const btn = sl.querySelector('#stsnd');
    if (btn) setTimeout(() => { if (cur === idx && !btn.classList.contains('on') && !document.body.classList.contains('capture')) btn.click(); }, 400);
  }
});

// أول تفاعل مع الصفحة يسمح بالصوت: نعيد المحاولة إن كان ممنوعًا
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => {
  if (pending) { const f = pending; pending = null; setTimeout(f, 50); }
}, true));
})();
