/* =====================================================================
   محرك «قراءة عقلية المعلم» — منصة جذور
   دالة واحدة نقية: INSIGHT.analyze(DECK, items) → تقرير
   - DECK: محتوى الدورة + DECK.insight (مفتاح الخبير، مثل mawaqif/insight-key.js)
   - items: إجابات متدرب واحد { مفتاح: { v } أو { vals } }
   المنهج موثّق في رأس ملف المفتاح. العتبات مكتوبة هنا صراحة حتى يمكن مراجعتها.
   ===================================================================== */
(function (root) {
const pct = x => Math.round(x);
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const effPct = e => (e - 1) / 3 * 100;          // فاعلية ١..٤ → ٠..١٠٠

/* العتبات (قابلة للمراجعة) */
const T = { minDecisions: 8, star: 80, good: 65, weak: 45, beliefStar: 65, overconfident: 25, dominant: 0.5 };
const SEVERE = ['humiliate', 'exclude', 'neglect', 'privacy'];

const INSIGHT = root.INSIGHT = {
  T,
  analyze(DECK, items) {
    const K = DECK.insight, R = { decisions: [], myths: [], flags: [] };

    /* ١) قرارات المواقف (حكم على المواقف) + المفاهيم الخاطئة */
    DECK.modules.forEach(m => m.slides.forEach((s, i) => {
      const it = items[`${m.id}-${i}`];
      if ((s.t === 'vote' || s.t === 'branch')) {
        const rub = s.rubric || K.rubric[m.id];
        if (!rub || !it || rub.opts[it.v] == null) return;
        const texts = s.options || s.choices.map(c => c.label);
        const best = rub.opts.findIndex(o => o[0] === 4);
        const [eff, style, flag] = rub.opts[it.v];
        const d = { id: s.qid || m.id, title: s.title, area: rub.area, kind: rub.kind || 'act', eff, style, flag,
          chosen: texts[it.v], best: texts[best] };
        R.decisions.push(d);
        if (flag) R.flags.push(d);
      }
      if (s.t === 'myth' && it) R.myths.push({ n: s.n, text: s.text, believed: it.v === 0, tag: K.myths[s.n - 1] });
    }));

    const D = R.decisions;
    R.n = D.length;
    R.judgment = D.length ? pct(avg(D.map(d => effPct(d.eff)))) : null;

    /* المجالات */
    R.areas = {};
    Object.keys(K.areas).forEach(a => {
      const x = D.filter(d => d.area === a);
      if (x.length) R.areas[a] = { name: K.areas[a], score: pct(avg(x.map(d => effPct(d.eff)))), n: x.length };
    });

    /* ٢) الأنماط (Wubbels / Baumrind) */
    const styled = D.filter(d => d.style);
    R.styles = {};
    Object.keys(K.styles).forEach(k => R.styles[k] = styled.filter(d => d.style === k).length);
    const top = Object.keys(R.styles).sort((a, b) => R.styles[b] - R.styles[a])[0];
    R.dominant = styled.length ? top : null;
    R.dominantShare = styled.length ? R.styles[top] / styled.length : 0;
    R.control = styled.length ? avg(styled.map(d => K.styles[d.style].control)) : 0;   // -١ متساهل … +١ حازم
    R.warmth = styled.length ? avg(styled.map(d => K.styles[d.style].warmth)) : 0;     // -١ بارد … +١ دافئ

    /* ٣) القناعات: الاستطلاع + المفاهيم */
    R.poll = null;
    if (items.poll && Array.isArray(items.poll.vals)) {
      R.poll = {};
      Object.keys(K.pollDims).forEach(dim => {
        const sc = K.poll.map((q, i) => q.dim === dim && items.poll.vals[i] ? (q.dir > 0 ? items.poll.vals[i] - 1 : 5 - items.poll.vals[i]) / 4 * 100 : null).filter(x => x != null);
        if (sc.length) R.poll[dim] = { name: K.pollDims[dim], score: pct(avg(sc)) };
      });
    }
    R.mythsBelieved = R.myths.filter(m => m.believed);
    R.mythScore = R.myths.length ? pct((R.myths.length - R.mythsBelieved.length) / R.myths.length * 100) : null;
    const bparts = [R.poll && R.poll.humanism && R.poll.humanism.score, R.poll && R.poll.growth && R.poll.growth.score, R.mythScore].filter(x => x != null);
    R.beliefs = bparts.length ? pct(avg(bparts)) : null;

    /* ٤) الوعي بالذات: تقديره لنفسه قبل الدورة مقابل قراراته الفعلية */
    const rate = m => items['rate-' + m] && items['rate-' + m].vals ? pct((avg(items['rate-' + m].vals) - 1) / 4 * 100) : null;
    R.selfPre = rate('pre'); R.selfPost = rate('post'); R.selfFollow = rate('followup');
    R.gap = R.selfPre != null && R.judgment != null ? R.selfPre - R.judgment : null;
    R.overconfident = R.gap != null && R.gap >= T.overconfident;

    /* ٥) القابلية للتطوير: أول قرارات الدورة مقابل مواقف العيادة الجديدة + الانفتاح */
    const jOf = ids => { const x = D.filter(d => ids.includes(d.id)); return x.length >= 2 ? pct(avg(x.map(d => effPct(d.eff)))) : null; };
    R.early = jOf(K.early); R.late = jOf(K.late);
    R.growth = R.early != null && R.late != null ? R.late - R.early : null;
    const open = R.poll && R.poll.open ? R.poll.open.score : null;
    const parts = [];
    if (R.growth != null) parts.push([Math.max(0, Math.min(100, 50 + R.growth / 2 + (R.late >= T.star ? 20 : 0))), 0.6]);
    if (open != null) parts.push([open, 0.4]);
    R.coach = parts.length ? pct(parts.reduce((a, [v, w]) => a + v * w, 0) / parts.reduce((a, [, w]) => a + w, 0)) : null;
    R.coachLevel = R.coach == null ? null : R.coach >= 65 ? 'high' : R.coach >= 45 ? 'mid' : 'low';

    /* ٦) التصنيف */
    const severe = R.flags.filter(f => SEVERE.includes(f.flag)).length;
    const J = R.judgment, B = R.beliefs, why = [];
    let cat;
    if (R.n < T.minDecisions) cat = 'insufficient';
    else if (J >= T.star && R.flags.length === 0 && (B == null || B >= T.beliefStar)) cat = 'star';
    else if (J >= T.good && severe <= 1 && R.flags.length <= 1) cat = 'good';
    // من بدأ الدورة باختيارات قاسية ثم تحسّن بوضوح في مواقف العيادة الجديدة يُعدّ قابلًا للتطوير (وتبقى إشاراته الحمراء ظاهرة في التقرير)
    else if (R.coachLevel === 'high' && R.late != null && R.late >= T.good) cat = 'support';
    else if (severe >= 2 || (['auth', 'perm'].includes(R.dominant) && R.dominantShare >= T.dominant && R.coachLevel !== 'high')
             || (J < T.weak && R.coachLevel !== 'high')) cat = 'direct';
    else cat = 'support';

    if (J != null) why.push(`جودة قراراته في المواقف ${J}٪ (${R.n} قرارًا)`);
    if (R.dominant) why.push(`النمط الغالب: ${K.styles[R.dominant].name} في ${pct(R.dominantShare * 100)}٪ من قراراته`);
    if (severe) why.push(`${severe} ${severe === 1 ? 'اختيار يمس' : 'اختيارات تمس'} كرامة الطالب أو أمانه`);
    if (R.coachLevel) why.push(`القابلية للتطوير: ${{ high: 'عالية', mid: 'متوسطة', low: 'منخفضة' }[R.coachLevel]}`);
    if (R.overconfident) why.push(`يقدّر نفسه أعلى من قراراته الفعلية بفارق ${R.gap} نقطة`);
    R.category = { id: cat, reasons: why };

    /* نقاط الضعف والقوة */
    const ar = Object.values(R.areas).sort((a, b) => a.score - b.score);
    R.weakAreas = ar.filter(a => a.score < 70).map(a => a.name);
    R.strongAreas = ar.filter(a => a.score >= 80).map(a => a.name);
    R.tips = R.dominant ? K.tips[R.dominant] : [];
    return R;
  },

  /* أسماء التصنيفات وألوانها */
  CATS: {
    star:  { icon: '🌟', name: 'جدير ومميز',            color: '#2E9E6B', note: 'قرارات تربوية ناضجة، ونظرة إنسانية للطالب. نموذج يُستفاد منه.' },
    good:  { icon: '✅', name: 'جيد… وينقصه',          color: '#3B7DD8', note: 'أساس سليم مع جوانب محددة تحتاج صقلًا.' },
    support: { icon: '🤝', name: 'قابل للتطوير — يحتاج دعمًا', color: '#D99A2B', note: 'النية سليمة والأدوات ناقصة؛ يتحسن بالمتابعة والتدريب العملي.' },
    direct: { icon: '⚠️', name: 'يحتاج توجيهًا ومتابعة',  color: '#C0392B', note: 'أنماط قد تضر الطلاب نفسيًا؛ يلزم توجيه مباشر وملاحظة صفية قريبة.' },
    insufficient: { icon: '⏳', name: 'بيانات غير كافية', color: '#8A93A8', note: 'لم يشارك في عدد كافٍ من المواقف للحكم.' },
  },

  /* وصف طريقة التفكير بلغة واضحة */
  mindText(R, K) {
    const s = [];
    const d = R.dominant;
    if (d === 'firm') s.push('يوازن بين الحزم والدفء: يحفظ القاعدة ويحفظ كرامة الطالب معًا.');
    if (d === 'auth') s.push('يميل إلى حسم المواقف بالسلطة: يرى الانضباط في الخوف والعقوبة، وقد يدخل في صراعات قوة علنية مع الطلاب.');
    if (d === 'perm') s.push('يميل إلى التجنب والتجاهل: يترك المشكلات تمر، فتضعف القواعد ويشعر الطلاب بغياب الحماية.');
    if (d === 'emo') s.push('يميل إلى الإرضاء: علاقته دافئة لكنه يتنازل عن القواعد والعدل لتجنب الانزعاج.');
    if (R.control < -0.2) s.push('الحزم عنده منخفض.');
    if (R.warmth < -0.2) s.push('الدفء في تعامله منخفض، والعلاقة مع الطالب ليست أولوية في قراراته.');
    if (R.poll && R.poll.humanism && R.poll.humanism.score < 50) s.push('يحمل نظرة «ضبطية» للطالب: السيطرة أهم من الفهم.');
    if (R.poll && R.poll.growth && R.poll.growth.score < 50) s.push('يميل إلى عقلية ثابتة: يرى أن بعض الطلاب لا يتغيرون.');
    if (R.poll && R.poll.open && R.poll.open.score < 50) s.push('انفتاحه على الملاحظة والتغيير محدود.');
    if (R.mythsBelieved.length) s.push('يؤمن بمفاهيم خاطئة: ' + [...new Set(R.mythsBelieved.map(m => K.beliefNames[m.tag]))].join('، ') + '.');
    if (R.poll && R.judgment != null && R.poll.humanism && R.poll.humanism.score - R.judgment >= 30)
      s.push('يقول ما لا يفعل: قناعاته المعلنة أفضل بكثير من قراراته في المواقف.');
    return s;
  },
};
if (typeof module !== 'undefined' && module.exports) module.exports = INSIGHT;
})(typeof window !== 'undefined' ? window : globalThis);
