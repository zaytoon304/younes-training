/* "Touch of Heritage WRO": slides picked from the full English deck, each with its narrator clip (say = file in audio/) */
(function () {
  const all = [];
  DECK.modules.forEach(m => m.slides.forEach(s => all.push(s)));
  const T = (t, title) => all.find(s => s.t === t && (!title || (s.title || '').startsWith(title)));
  const say = (s, key, notes) => Object.assign({}, s, { say: key }, notes ? { notes } : {});
  const LIVE = { t: 'statement', kicker: '🎬 Live demo', text: 'And now… the project, live in front of you', say: 'live',
    notes: 'After this slide the students run the project in front of the judges without explaining: the explanation came before.' };
  const team = Object.assign({}, T('team'), { notes: 'No narrator: each student introduces himself live, in his own voice, in one sentence: his name and the part he built.' });
  const slides = [
    say(T('cover'), 'cover', 'The narrator starts by itself: a welcome and the project name.'),
    team,
    say(T('cards', 'Heritage belongs'), 'problem'),
    say(T('statement'), 'idea'),
    T('fullstory'),
    say(T('table', 'Five challenges'), 'challenges'),
    LIVE,
  ];
  if (slides.some(s => !s)) throw new Error('missing slide in pick.js');
  DECK.modules.length = 0;
  DECK.modules.push({ id: 'wro', name: '🏆 Touch of Heritage WRO', slides });
})();
