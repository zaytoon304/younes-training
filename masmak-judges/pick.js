/* اختيار شرائح العرض أمام المحكّمين من دورة «لمسة تراث»
   الترتيب: الافتتاح والفكرة ← ثم لكل جزء: شريحة التطبيق العملي وتليها شريحة الكود ← روبوتا السلامة ← التحديات
   الشرائح الأولى بأرقامها في الدورة (طلب أ. محمد)، والباقية بنوعها أو عنوانها حتى لا يتغير الاختيار إن أُضيفت شرائح */
(function () {
  const all = [];
  DECK.modules.forEach(m => m.slides.forEach(s => all.push(s)));
  const S = n => all[n - 1];
  const T = (t, title) => all.find(s => s.t === t && (!title || (s.title || '').startsWith(title)));
  const after = s => all[all.indexOf(s) + 1];           // الشريحة التي تلي التطبيق العملي (الكود)
  const GROUPS = [
    { id: 'idea', name: '🏰 لمسة تراث', s: [S(1), S(3), S(4), S(5), S(13)] },
    { id: 'table', name: '🎠 المجسّم الدوّار', s: [S(30), S(31)] },
    { id: 'leds', name: '🌈 الإضاءة الذكية', s: [S(40), S(41)] },
    { id: 'screen', name: '🤟 لغة الإشارة والصوت', s: [S(47), S(48)] },
    { id: 'guard', name: '📶 الحارس الأمني', s: [S(57), S(58)] },
    { id: 'eyes', name: '👁️ تتبع العين', s: [S(67), S(68)] },
    { id: 'tour', name: '🦽 القرار والجولة', s: [S(77), S(78)] },
    { id: 'safety', name: '🛡️ روبوتا السلامة', s: [T('masmakhero'), T('decisionlab'), after(T('decisionlab')), T('missionlab'), after(T('missionlab'))] },
    { id: 'end', name: '🏆 التحديات', s: [T('table', 'خمسة تحديات'), T('end')] },
  ];
  DECK.modules.length = 0;
  GROUPS.forEach(g => DECK.modules.push({ id: g.id, name: g.name, slides: g.s }));
})();
