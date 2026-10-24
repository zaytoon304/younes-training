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
