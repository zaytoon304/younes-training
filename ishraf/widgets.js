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
});
})();
