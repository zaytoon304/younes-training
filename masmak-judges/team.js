/* =====================================================================
   شريحة «فريق المشروع» لعرضي لجنة التحكيم (العربي والإنجليزي)
   شعار مدارس الأرقم (خلفية شفافة) + الطالبان + المدرب
   النوع: team  ·  { t: 'team', kicker, title, members: [{ name, role }], coach, school }
   ===================================================================== */
(function () {
window.DECK_TYPES = window.DECK_TYPES || {};
const EN = (window.DECK || {}).lang === 'en';
// مسار الشعار ثابت لكلا العرضين (كلاهما في مجلد بجانب masmak-judges)
const LOGO = '../masmak-judges/arqam-logo.png';

const css = `
.team-wrap{flex:1;display:grid;grid-template-columns:1fr 1.25fr;gap:70px;align-items:center}
.team-logo{display:flex;flex-direction:column;align-items:center;gap:26px}
.team-logo img{width:100%;max-width:640px;height:auto;display:block}
.team-logo .school{font-size:38px;font-weight:800;color:var(--navy-800)}
.team-list{display:flex;flex-direction:column;gap:34px}
.team-card{display:flex;align-items:center;gap:36px;background:#fff;border:2px solid var(--line);border-radius:36px;
  padding:38px 44px;box-shadow:0 16px 40px rgba(16,27,69,.08)}
.team-card .av{flex:none;width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:64px;background:linear-gradient(145deg,#FBEFD2,#F3DCA3)}
.team-card h3{font-size:54px;font-weight:900;color:var(--navy-800);line-height:1.3}
.team-card p{font-size:34px;font-weight:700;color:var(--muted);margin-top:6px}
.team-coach{font-size:34px;font-weight:700;color:var(--muted);padding:0 12px}
.team-coach b{color:var(--gold-dark)}
`;
if (!document.getElementById('team-css')) {
  const st = document.createElement('style'); st.id = 'team-css'; st.textContent = css; document.head.appendChild(st);
}

Object.assign(window.DECK_TYPES, {
  team: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="team-wrap">
        <div class="team-logo f"><img src="${LOGO}" alt="${EN ? 'Al-Arqam Schools logo' : 'شعار مدارس الأرقم'}">
          <div class="school">${s.school}</div></div>
        <div class="team-list">
          ${s.members.map(m => `<div class="team-card f"><div class="av">${m.icon || '👨‍🎓'}</div>
            <div><h3>${m.name}</h3>${m.role ? `<p>${m.role}</p>` : ''}</div></div>`).join('')}
          ${s.coach ? `<div class="team-coach f">${EN ? 'Coach' : 'المدرب'}: <b>${s.coach}</b></div>` : ''}
        </div>
      </div></div>`,
});
})();
