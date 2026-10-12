/* =====================================================================
   أدوات الذكاء (الوحدتان ٨ و٩):
   facelab (كيف يعرف نبيه الوجوه) · voicechain (رحلة السؤال من الصوت إلى الجواب) · speak (نبيه يتكلم في المتصفح)
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

/* ---------- وجوه كرتونية ---------- */
function faceSVG(f, cls = '') {
  return `<svg viewBox="0 0 200 220" class="nb-face ${cls}">
    ${f.ghutra ? `<path d="M30 110 Q30 18 100 16 Q170 18 170 110 L178 200 Q100 180 22 200 Z" fill="${f.ghutra}"/>
      ${f.ghutra === '#fff' ? '' : '<path d="M40 70 Q100 30 160 70" stroke="#fff" stroke-width="5" fill="none" opacity=".5"/>'}` : ''}
    <ellipse cx="100" cy="112" rx="58" ry="66" fill="${f.skin}"/>
    ${f.ghutra ? `<path d="M42 78 Q100 40 158 78 L158 64 Q100 26 42 64 Z" fill="#1b1e27"/>` : `<path d="M42 96 Q46 40 100 38 Q154 40 158 96 Q140 60 100 62 Q60 60 42 96 Z" fill="${f.hair || '#2a1a10'}"/>`}
    <ellipse cx="78" cy="108" rx="${f.big ? 9 : 7}" ry="${f.big ? 10 : 8}" fill="#1b1e27"/><ellipse cx="122" cy="108" rx="${f.big ? 9 : 7}" ry="${f.big ? 10 : 8}" fill="#1b1e27"/>
    <path d="M66 ${f.brow || 90} q12 -6 24 0 M110 ${f.brow || 90} q12 -6 24 0" stroke="#3a2a1a" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${f.glasses ? '<circle cx="78" cy="108" r="17" fill="none" stroke="#22346F" stroke-width="5"/><circle cx="122" cy="108" r="17" fill="none" stroke="#22346F" stroke-width="5"/><line x1="95" y1="108" x2="105" y2="108" stroke="#22346F" stroke-width="5"/>' : ''}
    <path d="M100 116 q-6 16 0 18" stroke="#c98b5a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="${f.smile ? 'M78 146 Q100 168 122 146' : 'M82 150 Q100 158 118 150'}" stroke="#8e2a20" stroke-width="5" fill="${f.smile ? '#fff' : 'none'}" stroke-linecap="round"/>
    <circle cx="66" cy="134" r="8" fill="#ff8fa3" opacity=".35"/><circle cx="134" cy="134" r="8" fill="#ff8fa3" opacity=".35"/>
  </svg>`;
}
/* البصمة الحقيقية ١٢٨ رقمًا، ونعرض هنا ٨ فقط لنفهم الفكرة */
const FRIENDS = [
  { name: 'عمر', f: { skin: '#e8b98f', ghutra: '#fff' }, print: [0.9, 0.2, 0.7, 0.1, 0.8, 0.3, 0.5, 0.9] },
  { name: 'يوسف', f: { skin: '#d9a273', hair: '#1b1e27', glasses: 1 }, print: [0.2, 0.9, 0.3, 0.8, 0.1, 0.7, 0.9, 0.2] },
  { name: 'سلمان', f: { skin: '#f1c9a5', ghutra: '#d63a3a', big: 1 }, print: [0.5, 0.5, 0.1, 0.4, 0.9, 0.9, 0.2, 0.4] },
];
const VISITORS = [
  { label: 'عمر يبتسم', f: { skin: '#e8b98f', ghutra: '#fff', smile: 1 }, print: [0.75, 0.35, 0.7, 0.3, 0.6, 0.2, 0.65, 0.8], who: 'عمر' },
  { label: 'يوسف بلا نظارة', f: { skin: '#d9a273', hair: '#1b1e27', smile: 1 }, print: [0.35, 0.8, 0.2, 0.6, 0.3, 0.75, 0.7, 0.4], who: 'يوسف' },
  { label: 'زائر جديد', f: { skin: '#c68e62', hair: '#6b3e1f', brow: 86 }, print: [0.3, 0.3, 0.9, 0.6, 0.4, 0.1, 0.3, 0.7], who: 'غريب' },
];
/* التشابه بين بصمتين: نطرح المتوسط ثم نقيس الزاوية بينهما (مثل SFace)، فالقريب من ١ = نفس الشخص */
function sim(a, b) {
  const m = v => v.map(x => x - v.reduce((s, y) => s + y, 0) / v.length);
  const [x, y] = [m(a), m(b)], dot = x.reduce((s, v, i) => s + v * y[i], 0), n = v => Math.sqrt(v.reduce((s, q) => s + q * q, 0));
  return dot / (n(x) * n(y));
}
const LIMIT = 0.6;
const bars = (p, cls = '') => `<div class="nb-print ${cls}">${p.map(v => `<i style="height:${Math.round(v * 100)}%"></i>`).join('')}</div>`;

function faceStage(sl, v, stage) {
  const vis = VISITORS[v], box = sl.querySelector('.nb-fstage');
  sl.querySelectorAll('.nb-vbtn').forEach((b, i) => b.classList.toggle('on', i === v));
  const scores = FRIENDS.map(fr => ({ name: fr.name, s: sim(vis.print, fr.print) }));
  const best = scores.reduce((a, b) => b.s > a.s ? b : a);
  const known = best.s > LIMIT;
  box.innerHTML = `
    <div class="nb-fcol"><small>① الكاميرا ترى</small><div class="nb-fcam ${stage >= 1 ? 'found' : ''}">${faceSVG(vis.f)}<span class="nb-fbox"></span></div></div>
    <div class="nb-fcol ${stage >= 2 ? '' : 'nb-dim'}"><small>② بصمة الوجه</small>${bars(vis.print, 'cam')}<span class="nb-fnote">${AR(128)} رقمًا في الحقيقة</span></div>
    <div class="nb-fcol wide ${stage >= 3 ? '' : 'nb-dim'}"><small>③ نقارن مع الأصدقاء المحفوظين</small>
      ${FRIENDS.map((fr, i) => { const s = scores[i].s, pct = Math.max(0, Math.round(s * 100));
        return `<div class="nb-frow2 ${stage >= 4 && known && fr.name === best.name ? 'win' : ''}">${faceSVG(fr.f, 'mini')}<b>${fr.name}</b>${bars(fr.print, 'mini')}
          <span class="nb-sbar"><i style="width:${pct}%"></i></span><em>${AR(pct)}٪</em></div>`; }).join('')}
      <div class="nb-flimit">خط النجاح: أكثر من ${AR(LIMIT * 100)}٪</div></div>
    <div class="nb-fresult ${stage >= 4 ? 'show' : ''} ${known ? 'ok' : 'bad'}">${known ? `😊 «أهلًا يا ${best.name}!»` : '🤔 «مرحبًا! لا أعرفك بعد»'}
      <small>${known ? `التشابه مع ${best.name} ${AR(Math.round(best.s * 100))}٪` : 'لا يوجد تشابه كافٍ مع أي صديق، فهو غريب'}</small></div>`;
}

/* ---------- رحلة السؤال ---------- */
const CHAIN = [
  { icon: '🎤', ar: 'الأذن تسمع', b: 'الميكروفون يسجّل صوتك ٥ ثوانٍ', py: 'question = nabeeh.listen(5)' },
  { icon: '📝', ar: 'الصوت يصير نصًّا', b: 'العقل السحابي يكتب ما قلته حروفًا', show: 'ما أكبر كوكب في المجموعة الشمسية؟' },
  { icon: '🧠', ar: 'العقل يفكر', b: 'نرسل السؤال للعقل السحابي عبر الإنترنت، مع قواعدنا: «أجب بلطف وباختصار، وبما يناسب الأطفال»', py: 'answer = nabeeh.ask(question)' },
  { icon: '💬', ar: 'الجواب يرجع نصًّا', b: 'في أقل من ثانيتين!', show: 'المشتري هو أكبر كوكب، ويمكن أن تتسع داخله أكثر من ألف أرض!' },
  { icon: '🔊', ar: 'الفم يتكلم', b: 'نحوّل النص إلى صوت عربي، ونبيه يقوله', py: 'nabeeh.say(answer)' },
];
function chainHTML() {
  return `<div class="nb-chain">${CHAIN.map((c, i) => `<div class="nb-clink" data-i="${i}"><div class="nb-cicon">${c.icon}</div><h3>${c.ar}</h3></div>${i < CHAIN.length - 1 ? '<span class="nb-carrow">←</span>' : ''}`).join('')}</div>
    <div class="nb-cdetail"><div class="nb-cmsg">اضغط «التالي» لنتبع رحلة سؤالك 🚀</div></div>`;
}
function chainShow(sl, k) {
  sl.querySelectorAll('.nb-clink').forEach((e, i) => { e.classList.toggle('on', i === k); e.classList.toggle('done', i < k); });
  const c = CHAIN[k];
  sl.querySelector('.nb-cdetail').innerHTML = `<div class="nb-cmsg"><b>${c.icon} ${c.ar}</b><p>${c.b}</p>
    ${c.show ? `<div class="nb-cbubble">«${c.show}»</div>` : ''}${c.py ? `<code dir="ltr">${c.py}</code>` : ''}</div>`;
}

/* ---------- نبيه يتكلم في المتصفح (صوت حقيقي من جهاز المعلم) ---------- */
function bindSpeak(sl) {
  const txt = sl.querySelector('textarea'), st = sl.querySelector('.nb-spst'), bot = sl.querySelector('.nb-spbot');
  const voices = () => (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => v.lang && v.lang.startsWith('ar'));
  txt.addEventListener('keydown', e => e.stopPropagation());
  sl.querySelectorAll('.nb-spchip').forEach(c => c.onclick = () => { txt.value = c.textContent; });
  sl.querySelector('.go').onclick = () => {
    if (!window.speechSynthesis) { st.textContent = 'هذا المتصفح لا يدعم الكلام. جرّب كروم.'; return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt.value.trim() || 'مرحبًا');
    u.lang = 'ar-SA'; const v = voices(); if (v.length) u.voice = v.find(x => x.lang === 'ar-SA') || v[0];
    u.rate = +sl.querySelector('input').value; u.onstart = () => bot.classList.add('talk'); u.onend = () => bot.classList.remove('talk');
    st.textContent = v.length ? '🔊 نبيه يتكلم…' : '🔊 (لا يوجد صوت عربي في هذا الجهاز، فقد يُقرأ بلكنة غريبة)';
    speechSynthesis.speak(u);
  };
  window.DECK_CLEANUP.push(() => window.speechSynthesis && speechSynthesis.cancel());
}

Object.assign(window.DECK_TYPES, {
  facelab: s => `<div class="slide light"><div class="kicker">${s.kicker || '😊 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="nb-facelab ix"><div class="nb-vrow"><span>من أمام الكاميرا؟</span>${VISITORS.map((v, i) => `<button class="nb-vbtn" data-v="${i}">${faceSVG(v.f, 'mini')}${v.label}</button>`).join('')}</div>
        <div class="nb-fstage"></div></div>${[1, 2, 3, 4].map(() => '<i class="f"></i>').join('')}</div>`,
  voicechain: s => `<div class="slide light"><div class="kicker">${s.kicker || '🗣️ رحلة السؤال'}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>${chainHTML()}${CHAIN.map(() => '<i class="f"></i>').join('')}</div>`,
  speak: s => `<div class="slide light"><div class="kicker">${s.kicker || '🔊 جرّب بنفسك'}</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="nb-speak ix">
        <div class="nb-spside"><textarea dir="rtl">السلام عليكم يا أبطال، أنا نبيه!</textarea>
          <div class="nb-spchips">${['أنا روبوت ذكي صنعه طلاب مدارس الأرقم', 'وجدت الكرة الحمراء!', 'انتبه، يوجد جدار أمامي', 'أهلًا يا صديقي، كيف حالك اليوم؟'].map(t => `<button class="nb-spchip">${t}</button>`).join('')}</div>
          <label class="nb-slider"><span>🐢 سرعة الكلام 🐇</span><input type="range" min="0.6" max="1.4" step="0.1" value="1"></label>
          <div class="nb-ctl"><button class="nb-btn go">🔊 قل يا نبيه</button></div><div class="nb-spst"></div></div>
        <div class="nb-spbot"><div class="nb-stage nb-wave">${window.NB.nabeehSVG()}</div></div>
      </div></div>`,
});
Object.assign(window.DECK_BIND, {
  facelab(sl) { sl._v = 0; sl.querySelectorAll('.nb-vbtn').forEach(b => b.onclick = () => { sl._v = +b.dataset.v; faceStage(sl, sl._v, 4); }); faceStage(sl, 0, 0); },
  speak: bindSpeak,
});
const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (!sl) return;
  if (s.t === 'facelab') faceStage(sl, sl._v || 0, step);
  if (s.t === 'voicechain' && step > 0) chainShow(sl, step - 1);
};
window.NB_AI = { sim, FRIENDS, VISITORS, LIMIT };
})();
