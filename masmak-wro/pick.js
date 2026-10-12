/* اختيار شرائح «لمسة تراث WRO» من دورة «لمسة تراث»، ولكل شريحة صوت الراوي (say = اسم ملفها في audio/) */
(function () {
  const all = [];
  DECK.modules.forEach(m => m.slides.forEach(s => all.push(s)));
  const S = n => all[n - 1];
  const T = (t, title) => all.find(s => s.t === t && (!title || (s.title || '').startsWith(title)));
  const say = (s, key, notes) => Object.assign({}, s, { say: key }, notes ? { notes } : {});
  const TEAM = { t: 'team', kicker: 'فريق المشروع', title: 'فريق al arqam innovators',
    school: 'مدارس الأرقم',
    members: [{ name: 'مشاري تركي البقمي' }, { name: 'صالح سليمان الطيار' }],
    coach: 'أ. محمد زيتون',
    notes: 'بلا راوٍ: يعرّف كل طالب بنفسه بصوته في جملة واحدة: اسمه، والجزء الذي بناه في المشروع.' };
  const LIVE = { t: 'statement', kicker: '🎬 العرض الحي', text: 'والآن… نقدّم لكم المشروع على الطبيعة', say: 'live',
    notes: 'بعد هذه الشريحة يشغّل الطالبان المشروع أمام اللجنة دون شرح: الشرح سبقه في العرض.' };
  const slides = [
    say(S(1), 'cover', 'يعمل صوت الراوي وحده: ترحيب باللجنة واسم المشروع.'),
    TEAM,
    say(S(4), 'problem'),
    say(S(5), 'idea'),
    T('fullstory'),
    say(T('table', 'خمسة تحديات'), 'challenges'),
    LIVE,
  ];
  if (slides.some(s => !s)) throw new Error('شريحة مفقودة في pick.js');
  DECK.modules.length = 0;
  DECK.modules.push({ id: 'wro', name: '🏆 لمسة تراث WRO', slides });
})();
