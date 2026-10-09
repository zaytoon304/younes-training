/* Section: Challenges and closing */
DECK.modules.push({ id: 'end', name: '🏆 Challenges', slides: [
  { t: 'table', kicker: '🔧 What we faced', title: 'Six real problems… and how we solved them',
    head: ['The problem', 'The solution'], widths: ['1fr', '1.25fr'],
    rows: [
      ['The sound cut off if the visitor moved for a moment', 'A 12-second hold: a station always finishes speaking'],
      ['Two visitors at two stations at once', 'A clear priority in the code: the lower station number'],
      ['A wire between boards could come loose on the day', 'ESP-NOW: one byte, no wires and no router'],
      ['A plain motor curtain does not know where to stop', 'A stepper: a counted number of steps = a known distance'],
      ['Loose wires and weak solder joints', 'A test program for every part before any integration'],
      ['A “quiz” ending resembled another project', 'A decision dilemma with no wrong answer: thinking, not memorizing'],
    ],
    notes: 'Every row happened during the build. Tell one example in detail: the sound cutting off, and the hold time.' },
  { t: 'statement', kicker: 'Our message',
    text: 'Diriyah was not built only to be watched… but to be protected, and every visitor leaves our show having decided how to protect it',
    notes: 'A strong ending, then: thank you for your time, we welcome your questions.' },
  { t: 'end', title: 'Thank you', sub: 'Pulse of Diriyah and Its Nights · WRO 2026',
    notes: 'We welcome your questions.' },
]});
