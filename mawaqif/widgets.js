/* =====================================================================
   أدوات «مواقف صفية» التفاعلية — تُضاف إلى محرك عروض جذور المشترك
   selfrate: التقييم الذاتي بالباركود (قبل · بعد · متابعة) مع نتائج حية
   branch:   «اختر طريقك» — لكل تصرف نتيجته
   roleplay: لعب الأدوار ببطاقات الشخصيات وقائمة الملاحظ
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const MODE = { pre: ['قبل أن نبدأ', 'أين أنت الآن؟'], post: ['بعد الدورة', 'أين أصبحت الآن؟'], followup: ['بعد أسبوع', 'ماذا طبّقت فعلًا؟'] };
const avg = rows => rows.length ? rows[0].map((_, i) => rows.reduce((a, r) => a + r[i], 0) / rows.length) : null;

const qslide = (kick, title, steps, foot) => `<div class="slide light">
      <div class="kicker">${kick}</div>
      <h2 class="title" style="margin-bottom:18px">${title}</h2>
      <div class="srgrid">
        <div class="srqr ix">${window.LIVE && LIVE.ok ? '<div class="srcode"></div><b>امسح بجوالك</b><span class="srn"></span>' : '<b>يحتاج اتصالًا بالإنترنت</b>'}</div>
        <div class="qsteps">${steps.map(([i, t]) => `<div class="qstep f"><span>${i}</span>${t}</div>`).join('')}<p class="qfoot">${foot}</p></div>
      </div></div>`;

window.DECK_TYPES = {
  selfrate: s => { const R = DECK.selfrate, M = MODE[s.mode];
    return `<div class="slide light">
      <div class="kicker">📊 التقييم الذاتي · ${M[0]}</div>
      <h2 class="title" style="margin-bottom:18px">${s.title || M[1]}</h2>
      <div class="srgrid">
        <div class="srqr ix">${window.LIVE && LIVE.ok ? '<div class="srcode"></div><b>امسح بجوالك</b><span class="srn">لا مشاركات بعد</span>' : '<b>التقييم الحي يحتاج اتصالًا بالإنترنت</b>'}</div>
        <div class="srlist">${R.items.map((q, i) => `<div class="sri"><div class="srq">${AR(i + 1)}. ${q}</div>
          <div class="srbars">${s.mode !== 'pre' ? '<div class="srb pre"><i></i><span></span></div>' : ''}<div class="srb now"><i></i><span></span></div></div></div>`).join('')}
          ${s.mode !== 'pre' ? '<div class="srleg"><span class="pre">قبل الدورة</span><span class="now">' + M[0] + '</span><b class="srgrow"></b></div>' : ''}
        </div>
      </div></div>`; },

  branch: s => `<div class="slide light">
      <div class="kicker">🔀 اختر طريقك</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <p class="brsit">${s.situation}</p>
      <div class="brgrid" style="grid-template-columns:repeat(${s.choices.length},1fr)">
        ${s.choices.map((c, i) => `<div class="bc ix ${c.outcome}" data-i="${i}">
          <div class="bl">${['أ', 'ب', 'ج', 'د'][i]}</div><div class="bt">${c.label}</div>
          <div class="br"><b>${{ good: '✅ نتيجة موفقة', mid: '⚠️ نتيجة جزئية', bad: '❌ نتيجة عكسية' }[c.outcome]}</b><p>${c.result}</p></div>
          <span class="bhint2">اضغط لترى ماذا يحدث</span></div>`).join('')}
      </div>${s.choices.map(() => '<i class="f"></i>').join('')}</div>`,

  /* شرائح «قراءة المتدرب»: التعريف بالاسم، واستطلاع القناعات، ونمطي — كلها باركود + خطوات */
  join: s => qslide('👤 قبل أن نبدأ', s.title || 'عرّف بنفسك مرة واحدة', [
      ['📱', 'امسح الباركود بكاميرا جوالك'], ['✍️', 'اكتب اسمك الثلاثي ومدرستك'], ['🔒', 'اختر كلمة سر (٦ أحرف على الأقل) واحفظها'],
    ], 'بعدها يتعرّف جوالك عليك في كل تصويت، ولا يستطيع أحد التصويت باسمك. إجاباتك لا يراها إلا المدرب.'),
  poll: s => qslide('💭 استطلاع سريع', s.title || 'قناعاتي', [
      ['🧠', 'عشر عبارات عن الطالب والفصل'], ['⚖️', 'حدّد مدى موافقتك على كل عبارة'], ['🤝', 'لا توجد إجابة صحيحة… أجب بما تؤمن به فعلًا'],
    ], 'ثلاث دقائق فقط.'),
  mine: s => qslide('🧭 تقريرك الشخصي', s.title || 'اعرف نمطك', [
      ['📊', 'نمطك في إدارة الصف من قراراتك في المواقف'], ['💪', 'نقاط قوتك والمجالات التي تستحق اهتمامك'], ['🎯', 'خطوات عملية تناسبك'],
    ], 'التقرير خاص بك وحدك.'),

  roleplay: s => `<div class="slide light">
      <div class="kicker">🎭 لعب الأدوار · ${AR(Math.round((s.timer || 300) / 60))} دقائق</div>
      <h2 class="title" style="margin-bottom:18px">${s.title}</h2>
      <div class="rpgrid">
        ${s.roles.map(r => `<div class="rpc f"><div class="rpi">${r.icon}</div><h3>${r.who}</h3><p>${r.brief}</p></div>`).join('')}
        <div class="rpc obs f"><div class="rpi">👀</div><h3>الملاحظون</h3><ul>${s.observe.map(o => `<li>${o}</li>`).join('')}</ul></div>
      </div></div>`,
};

window.DECK_BIND = {
  selfrate(sl, s) {
    if (!(window.LIVE && LIVE.ok)) return;
    const link = LIVE.url(`../shared/rate.html?c=${LIVE.course}&m=${s.mode}`);
    sl.querySelector('.srcode').innerHTML = LIVE.qr(link, 300);
    sl.querySelector('.srqr').onclick = () => LIVE.bigQR(link, 'التقييم الذاتي · ' + MODE[s.mode][0]);
    const un = LIVE.listenRates(by => {
      const now = avg(by[s.mode]), pre = avg(by.pre), n = by[s.mode].length;
      sl.querySelector('.srn').textContent = n ? LIVE.count(n, ['مشارك واحد', 'مشاركان', 'مشاركين', 'مشاركًا']) : 'لا مشاركات بعد';
      const put = (el, v) => { el.querySelector('i').style.width = v ? (v / 5 * 100) + '%' : '0'; el.querySelector('span').textContent = v ? AR(v.toFixed(1)) : ''; };
      sl.querySelectorAll('.sri').forEach((row, i) => {
        put(row.querySelector('.srb.now'), now && now[i]);
        const p = row.querySelector('.srb.pre'); if (p) put(p, pre && pre[i]);
      });
      const g = sl.querySelector('.srgrow');
      if (g && now && pre) { const a = now.reduce((x, y) => x + y) , b = pre.reduce((x, y) => x + y); g.textContent = `النمو: ${a >= b ? '+' : ''}${AR(Math.round((a - b) / b * 100))}٪`; }
    });
    window.DECK_CLEANUP.push(un);
  },
  join(sl, s) { qbind(sl, 'me.html?join=1', 'عرّف بنفسك'); },
  poll(sl) {
    const sid = qbind(sl, 'poll.html', 'قناعاتي');
    if (!sid) return;
    const un = LIVE.listenVotes('poll', 1, c => { sl.querySelector('.srn').textContent = c[0] ? LIVE.count(c[0], ['مشارك واحد', 'مشاركان', 'مشاركين', 'مشاركًا']) : 'لا مشاركات بعد'; });
    window.DECK_CLEANUP.push(un);
  },
  mine(sl) { qbind(sl, 'me.html', 'اعرف نمطك'); },
  branch(sl) {
    sl.querySelectorAll('.bc').forEach(c => c.addEventListener('click', () => { c.classList.add('open'); c.dataset.clicked = 1; }));
  },
};
function qbind(sl, page, title) {
  if (!(window.LIVE && LIVE.ok)) return null;
  const sid = LIVE.session().id;
  const link = LIVE.url(`../shared/${page}${page.includes('?') ? '&' : '?'}c=${LIVE.course}&s=${sid}`);
  sl.querySelector('.srcode').innerHTML = LIVE.qr(link, 300);
  sl.querySelector('.srqr').onclick = () => LIVE.bigQR(link, title);
  return sid;
}
window.DECK_ONSTEP = (step, s) => {
  if (s.t !== 'branch') return;
  document.querySelectorAll('#stage .bc').forEach((c, i) => { if (i < step) c.classList.add('open'); else if (!c.dataset.clicked) c.classList.remove('open'); });
};
})();
