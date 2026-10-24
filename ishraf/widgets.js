/* =====================================================================
   أدوات «المشرف المطوِّر» — تُضاف إلى أدوات مواقف صفية ومحرك جذور المشترك
   dot:    نشاط النقطة الافتتاحي (سؤال مفتوح + مؤقت)
   gap:    الجسر من الواقع إلى المأمول، والفجوة بينهما
   evo:    خط تطور الإشراف عبر الزمن
   invpyr: الهرم المقلوب (الفصل في القمة… والكل خلف المعلم)
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const fmt = sec => `${AR(Math.floor(sec / 60))}:${AR(String(sec % 60).padStart(2, '0'))}`;

Object.assign(window.DECK_TYPES = window.DECK_TYPES || {}, {
  dot: s => `<div class="slide light dotslide">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title">${s.title}</h2>
      <div class="dotboard"><i class="thedot"></i></div>
      <div class="dotfoot">
        <div class="timer ix" id="timer" data-sec="${s.timer}" onclick="event.stopPropagation();startTimer(this)">
          <div class="t">${fmt(s.timer)}</div><div class="h">اضغط لبدء المؤقت</div></div>
        <p>${s.hint}</p>
      </div></div>`,

  gap: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="gapwrap">
        <div class="gside now f"><div class="gl">📍 ${s.now.h}</div><p>${s.now.b}</p></div>
        <div class="gmid f"><div class="gline"></div><div class="gbadge">${s.mid.h}</div><p>${s.mid.b}</p></div>
        <div class="gside want f"><div class="gl">🎯 ${s.want.h}</div><p>${s.want.b}</p></div>
      </div>
      ${s.key ? `<div class="key f">💡 ${s.key}</div>` : ''}</div>`,

  evo: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:24px">${s.title}</h2>
      <div class="evo" style="grid-template-columns:repeat(${s.stages.length},1fr)">
        ${s.stages.map((x, i) => `<div class="ev f ${x.now ? 'now' : ''}">
          <div class="evn">${AR(i + 1)}</div><div class="evi">${x.icon}</div>
          <h3>${x.name}</h3><div class="evq">«${x.q}»</div><p>${x.b}</p></div>`).join('')}
      </div><div class="evarrow f">${s.arrow}</div></div>`,

  invpyr: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:16px">${s.title}</h2>
      <div class="ipgrid">
        <div class="ipyr">${s.levels.map((l, i) => `<div class="ipl f" style="width:${100 - i * 13}%"><span>${l.icon}</span>${l.name}</div>`).join('')}</div>
        <div class="ipside">${s.points.map(p => `<div class="ipp f">${p}</div>`).join('')}</div>
      </div></div>`,

  /* لعبة تدريبية: باركود للعب من الجوال + لوحة صدارة حيّة */
  game: s => { const g = (window.ISHRAF_GAMES || {})[s.game] || {};
    return `<div class="slide light gameslide">
      <div class="kicker">🎮 لعبة تدريبية · ${AR((g.qs || []).length)} ${(g.qs || []).length > 10 ? 'سؤالًا' : 'أسئلة'}</div>
      <h2 class="title" style="margin-bottom:14px">${g.icon || ''} ${g.title || s.game}</h2>
      <div class="gmgrid">
        <div class="srqr ix gmqr">${window.LIVE && LIVE.ok ? '<div class="srcode"></div><b>امسح وابدأ اللعب</b><span class="gmn">لا لاعبين بعد</span>' : '<b>يحتاج اتصالًا بالإنترنت</b>'}</div>
        <div class="gmboard"><div class="gmrules">${g.rules || ''}</div><div class="gmhead">🏆 لوحة الصدارة</div><div class="gmlist"><div class="gmwait">في انتظار أول لاعب…</div></div></div>
      </div></div>`; },

  /* شريحة المثل: المثل ← معناه ← تطبيقه في الإشراف (حتى لا يُترك المعنى للتخمين) */
  mathal: s => `<div class="slide dark mathal">
      <div class="kicker">${s.kicker || '🪶 مثلٌ وحكمة'}</div>
      <div class="mtext">${s.text}</div>
      ${s.src ? `<div class="msrc">${s.src}</div>` : ''}
      <div class="mgrid">
        <div class="mbox f"><h3>📖 معناه</h3><p>${s.meaning}</p></div>
        <div class="mbox apply f"><h3>🧭 وفي الإشراف…</h3><p>${s.apply}</p></div>
      </div></div>`,

  /* تدريب الغرف الجانبية: باركود/رابط للتدريب + خطوات + مؤقت */
  task: s => `<div class="slide light">
      <div class="kicker">🚪 ${s.kicker || 'تدريب الغرف الجانبية'} · ${AR(Math.round(s.timer / 60))} دقيقة</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="tkgrid">
        <div class="srqr ix tkqr">${window.LIVE && LIVE.ok ? '<div class="srcode"></div><b>امسح أو افتح الرابط</b><span class="tklink"></span>' : '<b>يحتاج اتصالًا بالإنترنت</b>'}</div>
        <div class="tksteps">${s.steps.map((t, i) => `<div class="qstep f"><span>${AR(i + 1)}</span>${t}</div>`).join('')}</div>
        <div class="timer ix tktimer" id="timer" data-sec="${s.timer}" onclick="event.stopPropagation();startTimer(this)">
          <div class="t">${fmt(s.timer)}</div><div class="h">اضغط لبدء المؤقت</div></div>
      </div></div>`,

  /* بطاقة دولة: العلم والفكرة وكيف يطبقونها وماذا نأخذ منها */
  nation: s => `<div class="slide light">
      <div class="kicker">🌍 جولة حول العالم · ${s.n}</div>
      <div class="nhead"><div class="nflag">${s.flag}</div><div><h2 class="title" style="margin:0">${s.name}</h2><div class="nidea">${s.idea}</div></div></div>
      <div class="ngrid">
        <div class="nbox f"><h3>⚙️ كيف يطبّقونها؟</h3>${s.how.map(x => `<p>• ${x}</p>`).join('')}</div>
        <div class="nbox take f"><h3>🎯 ماذا نأخذ منها غدًا؟</h3><p>${s.take}</p></div>
      </div>
      <div class="nsrc">المصدر: ${s.src}</div></div>`,
});

/* غلاف الدورة بفيديو افتتاحي متحرك */
window.DECK_TYPES.cover = () => `<div class="slide dark cover vcover">
      <div class="vbg"><video src="assets/media/opening.mp4" poster="assets/media/opening.jpg" autoplay muted loop playsinline></video></div>
      <div class="logo">🌳</div>
      <div class="tag">${DECK.tag}</div>
      <h1>${DECK.title}</h1>
      <div class="subt">${DECK.subtitle}</div>
      <div class="goldline"></div>
      <div class="by">إعداد وتقديم: <b>${DECK.author}</b></div></div>`;

/* خلفيات متحركة هادئة: شرائح المحطات (s.bg)، والآيات والأحاديث ومواقف النبي ﷺ (مسجد بلا أشخاص)، وبطاقات الدول (s.video) */
const BGV = { hadith: 'mosque', ayah: 'mosque', prophet: 'mosque' };
window.DECK_HOOKS = window.DECK_HOOKS || [];
window.DECK_HOOKS.push((sl, s) => {
  const v = s.bg || s.video && s.t === 'nation' && s.video || BGV[s.t];
  if (!v) return;
  sl.classList.add('hasbg', 'bg-' + s.t);
  sl.insertAdjacentHTML('afterbegin', `<div class="vbgx"><video src="assets/media/${v}.mp4" poster="assets/media/${v}.jpg" autoplay muted loop playsinline></video></div>`);
});

/* صوت الراوي للقصص: زر «استمع للقصة» يظهر في كل شريحة لها ملف صوتي */
window.DECK_HOOKS = window.DECK_HOOKS || [];
window.DECK_HOOKS.push((sl, s) => {
  if (!s.audio) return;
  const au = new Audio(s.audio);
  sl.insertAdjacentHTML('beforeend', '<button class="narr ix" title="صوت الراوي">🔊 استمع للقصة</button>');
  const btn = sl.querySelector('.narr');
  btn.onclick = e => { e.stopPropagation(); if (au.paused) { au.play(); btn.classList.add('on'); btn.textContent = '⏸ إيقاف الراوي'; } else { au.pause(); btn.classList.remove('on'); btn.textContent = '🔊 استمع للقصة'; } };
  au.onended = () => { btn.classList.remove('on'); btn.textContent = '🔁 أعد الاستماع'; };
  window.DECK_CLEANUP.push(() => au.pause());
});

/* ربط اللعبة: الباركود ولوحة الصدارة الحية (أعلى ٨) */
window.DECK_BIND.game = (sl, s) => {
  if (!(window.LIVE && LIVE.ok)) return;
  const sid = LIVE.session().id, link = LIVE.url(`play.html?g=${s.game}&s=${sid}`);
  sl.querySelector('.srcode').innerHTML = LIVE.qr(link, 280);
  sl.querySelector('.gmqr').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); LIVE.bigQR(link, 'امسح وابدأ اللعب · نُسخ الرابط للدردشة'); };
  const medal = ['🥇', '🥈', '🥉'];
  const un = firebase.firestore().collection('courses').doc(LIVE.course).collection('games').doc(`${s.game}-${sid}`).collection('results')
    .onSnapshot(snap => {
      const rows = snap.docs.map(d => d.data()).sort((a, b) => b.score - a.score);
      sl.querySelector('.gmn').textContent = rows.length ? LIVE.count(rows.length, ['لاعب واحد', 'لاعبان', 'لاعبين', 'لاعبًا']) : 'لا لاعبين بعد';
      if (!rows.length) return;
      sl.querySelector('.gmrules').style.display = 'none';
      const max = rows[0].score || 1;
      sl.querySelector('.gmlist').innerHTML = rows.slice(0, 5).map((r, i) => `<div class="gmrow ${i < 3 ? 'top' : ''}" style="animation-delay:${i * 60}ms">
        <span class="gmm">${medal[i] || AR(i + 1)}</span><span class="gmname">${String(r.groupName).replace(/</g, '&lt;')}</span>
        <span class="gmbar"><i style="width:${r.score / max * 100}%"></i></span><b>${AR(r.score)}</b></div>`).join('');
    }, e => console.warn('game board', e.message));
  window.DECK_CLEANUP.push(un);
};

/* ربط باركود التدريب: رابط ثابت يُرسل في دردشة كل غرفة */
window.DECK_BIND = window.DECK_BIND || {};
window.DECK_BIND.task = (sl, s) => {
  if (!(window.LIVE && LIVE.ok)) return;
  const link = LIVE.url(`../shared/task.html?c=${LIVE.course}&t=${s.task}`);
  sl.querySelector('.srcode').innerHTML = LIVE.qr(link, 260);
  sl.querySelector('.tklink').textContent = link.replace(/^https?:\/\//, '');
  sl.querySelector('.tkqr').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link); LIVE.bigQR(link, s.title + ' · نُسخ الرابط لترسله في الدردشة'); };
};
})();
