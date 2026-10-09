/* Section 5: The new features (version 2) — code in src/*_v2 */
DECK.modules.push({ id: 'new', name: '🆕 New features', slides: [
  { t: 'dyextra', title: 'Your hand stays? Then you are interested… and the narrator tells you more',
    notes: 'Visits are by hand: the student places a hand in front of a station sensor and hears a 12-second summary. At the end the system asks itself: is the hand still there? If yes, it decides the visitor is interested and plays a 20-second extra narration. If the hand was lifted, the summary is enough. The system makes this decision on its own, from sensor data: how long the visitor stays. Try it: place your hand, then lift it before the summary ends; then try again and keep it there.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'The extra-narration decision', file: 'sensors_lights_v2.ino',
    code: `const unsigned long HOLD_DURATION_MS = 12000;
const unsigned long EXTRA_DURATION_MS = 20000;
bool extraPlayed[4] = {false, false, false, false};

void loop() {
  updateSensors();
  if (millis() >= holdUntil) {
    int s = detectActiveStation();
    if (s != lastActiveStation) {
      lastActiveStation = s;
      if (s != 0) holdUntil = millis() + HOLD_DURATION_MS;
      activateStation(s);
    } else if (s != 0 && visitorAt(s) && !extraPlayed[s]) {
      extraPlayed[s] = true;
      holdUntil = millis() + EXTRA_DURATION_MS;
      sendSoundCommand('A' + (s - 1));
    }
  }
}`,
    steps: [
      { lines: [1, 2], text: 'A 12-second summary… and a 20-second extra narration' },
      { lines: [3], text: 'Per station: has this visitor heard the extra part? (once per visit)' },
      { lines: [6], text: 'Read the sensors after removing flicker' },
      { lines: [9, 10, 11, 12], text: 'A new visitor: start the summary as before' },
      { lines: [13], text: 'Summary over and the visitor is still here? ⇒ interested' },
      { lines: [14, 15, 16], text: 'Extend by 20 seconds and send \'A\', \'B\' or \'C\' to the sound board' },
    ],
    notes: 'The sound board receives A, B and C and plays tracks 0009, 0010 and 0011.' },
  { t: 'dyfuture', title: 'Press your choice… and see Diriyah in 50 years',
    notes: 'After pressing a decision button, the visitor does not just hear a sentence: the whole model tells the result with light. First, 4 seconds of “neglect”: the lights flicker and fade as if the mud were eroding, and the year runs from 2026 to 2076. Then 10 seconds of “restore”: awareness brings all stations back together with warm light, participation brings them back one by one, and innovation scans them with a blue wave before lighting them up. Communication is now two-way: the sound board sends the choice to the light board.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'Simulating neglect, then restoration', file: 'sensors_lights_v2.ino',
    code: `// Sound board: the button plays the result and tells the light board
// playTrack(5, "Awareness"); sendPolicy('a');

bool runSimulation() {
  unsigned long t = millis() - simStart;
  if (t < NEGLECT_MS) showNeglect((float)t / NEGLECT_MS);
  else if (t < NEGLECT_MS + RESTORE_MS) {
    unsigned long r = t - NEGLECT_MS;
    showRestore(simPolicy, (float)r / RESTORE_MS, r);
  } else { simPolicy = 0; allOff(); return false; }
  return true;
}

void showNeglect(float k) {
  int base = 255 * (1.0 - k);
  for (int i = 0; i < 3; i++) {
    int flicker = random(0, 100) < 25 ? random(0, base / 2 + 1) : base;
    spot(i, flicker);
    setRGB(i, PWM_FULL * (1.0 - k), 900 * (1.0 - k), 0);
  }
}`,
    steps: [
      { lines: [1, 2], text: 'The button on the sound board sends the choice: a, p or i' },
      { lines: [5, 6], text: 'First 4 seconds: the neglect phase' },
      { lines: [7, 8, 9], text: 'Then 10 seconds: restoration in the style of the choice' },
      { lines: [10], text: 'Then everything turns off and we wait for a new visitor' },
      { lines: [15, 18], text: 'The light fades gradually as time passes' },
      { lines: [17], text: 'And a quarter of the time it flickers suddenly: as if the mud were cracking' },
    ],
    notes: 'The spotlights now use analogWrite (levels 0 to 255) instead of just on and off.' },
  { t: 'table', kicker: '🔊 A real problem… and its fix', title: 'Why did the sound freeze and repeat by itself?',
    head: ['What we saw', 'The cause', 'The fix in version 2'], widths: ['.85fr', '1.2fr', '1.25fr'],
    rows: [
      ['The welcome repeats by itself', 'The speaker at full volume drew so much current that the board browned out and restarted', 'Volume 22 instead of 30 + print the reset reason + a 1000µF capacitor'],
      ['A station sound repeats', 'The IR sensor flickered briefly, looking like a new visitor', '300 ms of stable reading before trusting it + no repeat within 30 s'],
      ['A command arrives twice', 'The same wireless message was received twice', 'Ignore any repeated command within 3 seconds'],
      ['The wrong track plays', 'play(n) follows the order files were copied to the card', 'playMp3Folder: play by file name from the mp3 folder'],
    ],
    notes: 'The team noticed this during testing. The lesson: if the welcome repeats by itself, the problem is usually power, not code — so we print the reset reason at every start-up; BROWNOUT means the voltage dropped.' },
]});
