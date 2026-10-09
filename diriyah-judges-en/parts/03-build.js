/* Section 3: How we built it */
DECK.modules.push({ id: 'build', name: '🛠️ How we built it', slides: [
  { t: 'dyevolve', title: 'Four versions… until we reached a design that works',
    items: [
      { v: 'Version 1', h: 'Najdi house with buttons', b: 'The visitor presses a button, a part moves and a light turns on', why: 'Only follows orders: no decision' },
      { v: 'Version 2', h: 'Sound & light show', b: 'A dark theatre box, dramatic lighting and a narrator', why: 'Traditional shows are 100% fixed' },
      { v: 'Version 3', h: 'Robot on a track', b: 'A small cart moving between 4 stations', why: '4 boards and risky mechanics' },
      { v: 'Final', h: '3 stations that see the visitor', b: 'Sensors decide, ESP-NOW links the boards, the visitor decides', why: '✓ Simple, reliable, autonomous' },
    ],
    img: '../diriyah-judges/img/concept.jpg', cap: 'The first concept (version 3) before we simplified it: the most beautiful idea on paper is not always the one that works on the day',
    notes: 'A real engineering story. We started with a Najdi house with buttons, then a sound and light show, then a robot on a track. Each version revealed a problem: no decision, a fixed script, too complex. So we simplified to three fixed but smart stations.' },
  { t: 'numlist', kicker: '🧱 Build steps', title: 'Every part alone… then integration',
    items: [
      { h: 'Test the board alone', b: 'A simple Serial program: the board connects and uploads' },
      { h: 'Test each part separately', b: 'The three sensors, the PCA9685 on I2C, each RGB, the spotlights, the DFPlayer, the buttons: more than 20 test programs' },
      { h: 'First integration', b: 'Each sensor turns on its station (spotlight + colors) and turns off the others' },
      { h: 'Wireless integration', b: 'The sensor board tells the sound board over ESP-NOW, no wire at all' },
      { h: 'The model', b: 'A wooden base, Najdi façades of foam and plaster painted in mud colors, a dark box and a curtain' },
    ],
    notes: 'We never assemble everything at once. Each part has its own test program. That is how we found a loose wire in RGB2 and RGB3 and a weak solder on the red button before problems mixed together.' },
]});
