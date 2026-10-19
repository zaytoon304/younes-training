/* =====================================================================
   أنواع شرائح عرض سيف (العربي والإنجليزي)
   - pic:  صورة كبيرة بجانب نقاط تظهر واحدة واحدة   { t:'pic', kicker, title, img, cap, points:[{icon,h,b}] }
   - flow: خطوات متتالية بأسهم (مخطط النظام)         { t:'flow', kicker, title, steps:[{icon,h,b}], alert:{icon,h,b} }
   كل نقطة/خطوة عنصر .f، فتظهر مع جملتها في صوت الراوي
   ===================================================================== */
(function () {
window.DECK_TYPES = window.DECK_TYPES || {};
const EN = (window.DECK || {}).lang === 'en';
const IMG = '../saif-masmak/img/';   // الصور مشتركة بين النسختين

const css = `
.pic-wrap{flex:1;display:grid;grid-template-columns:1.05fr 1fr;gap:64px;align-items:center;min-height:0}
.pic-img{position:relative;height:100%;max-height:740px;border-radius:36px;overflow:hidden;box-shadow:0 24px 60px rgba(16,27,69,.22)}
.pic-img img{width:100%;height:100%;object-fit:cover;display:block}
.pic-img .cap{position:absolute;inset:auto 0 0 0;padding:18px 28px;font-size:26px;font-weight:700;color:#fff;
  background:linear-gradient(0deg,rgba(10,18,48,.85),rgba(10,18,48,0))}
.pic-pts{display:flex;flex-direction:column;gap:24px}
.pic-pt{display:flex;gap:26px;align-items:flex-start;background:#fff;border:2px solid var(--line);border-radius:30px;padding:24px 30px;
  box-shadow:0 12px 30px rgba(16,27,69,.07)}
.pic-pt .ic{flex:none;width:84px;height:84px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:46px;
  background:linear-gradient(145deg,#FBEFD2,#F3DCA3)}
.pic-pt h3{font-size:40px;font-weight:900;color:var(--navy-800);line-height:1.25}
.pic-pt p{font-size:30px;font-weight:600;color:var(--muted);margin-top:4px;line-height:1.45}
.flow-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;gap:40px}
.flow-row{display:flex;align-items:stretch;gap:18px}
.flow-st{flex:1;background:#fff;border:2px solid var(--line);border-radius:30px;padding:40px 24px;text-align:center;
  box-shadow:0 12px 30px rgba(16,27,69,.08);display:flex;flex-direction:column;align-items:center;gap:12px}
.flow-st .ic{font-size:88px;line-height:1}
.flow-st h3{font-size:42px;font-weight:900;color:var(--navy-800);line-height:1.25}
.flow-st p{font-size:31px;font-weight:600;color:var(--muted);line-height:1.4}
.flow-ar{flex:none;align-self:center;font-size:56px;font-weight:900;color:var(--gold-dark);transition:opacity .45s}
.flow-ar:has(+ .flow-st:not(.in)){opacity:0}   /* السهم يظهر مع الخطوة اللي بعده */
/* شريحة الفريق بثلاثة طلاب: نصغّر البطاقات شوي عشان يبان اسم المدرب */
.team-list{gap:22px!important}
.team-card{padding:24px 40px!important}
.team-card .av{width:100px!important;height:100px!important;font-size:54px!important}
.team-card h3{font-size:48px!important}
/* البطاقات في منتصف المساحة */
.slide .cards{flex:1;align-content:center}
.flow-alert{display:flex;gap:30px;align-items:center;background:linear-gradient(135deg,#7f1d1d,#b91c1c);color:#fff;border-radius:32px;padding:30px 42px}
.flow-alert.ok{background:linear-gradient(135deg,#14532d,#15803d)}
.flow-alert .ic{font-size:76px}
.flow-alert h3{font-size:46px;font-weight:900}
.flow-alert p{font-size:33px;font-weight:600;opacity:.92;margin-top:4px}
`;
if (!document.getElementById('saif-css')) {
  const st = document.createElement('style'); st.id = 'saif-css'; st.textContent = css; document.head.appendChild(st);
}
// في الإنجليزي الأسهم لليمين، وفي العربي لليسار
const ARROW = EN ? '→' : '←';

Object.assign(window.DECK_TYPES, {
  pic: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:28px">${s.title}</h2>
      <div class="pic-wrap">
        <div class="pic-img"><img src="${IMG + s.img}" alt="">${s.cap ? `<div class="cap">${s.cap}</div>` : ''}</div>
        <div class="pic-pts">${s.points.map(p => `<div class="pic-pt f"><div class="ic">${p.icon}</div>
          <div><h3>${p.h}</h3>${p.b ? `<p>${p.b}</p>` : ''}</div></div>`).join('')}</div>
      </div></div>`,

  flow: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="flow-wrap">
        <div class="flow-row">${s.steps.map((st, i) => `${i ? `<div class="flow-ar">${ARROW}</div>` : ''}<div class="flow-st f">
          <div class="ic">${st.icon}</div><h3>${st.h}</h3>${st.b ? `<p>${st.b}</p>` : ''}</div>`).join('')}</div>
        ${s.alert ? `<div class="flow-alert f${s.alert.ok ? ' ok' : ''}"><div class="ic">${s.alert.icon}</div><div><h3>${s.alert.h}</h3><p>${s.alert.b}</p></div></div>` : ''}
      </div></div>`,
});
})();
