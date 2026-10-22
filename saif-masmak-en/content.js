/* =====================================================================
   "Smart Al Masmak" — SAIF 2026 judging presentation (English, narrated, ~4 minutes)
   Cover → Team → Problem → Solution → The whole animated story (all additions) → Testing → Impact → Live
   Narration: saif-masmak/narration-tts.py writes audio/<say>.mp3 + audio/cues.js
   ===================================================================== */
(function (root) {
root.DECK = {
  lang: 'en',
  title: 'Smart Al Masmak',
  subtitle: 'A heritage museum that welcomes everyone… and protects everyone',
  tag: 'SAIF 2026 · Robotics & Automation · Saudi Arabia',
  author: 'Al-Arqam Schools · Riyadh',
  sectionLabel: 'Part',
  parts: [],
  modules: [{ id: 'saif', name: '🏆 Smart Al Masmak · SAIF 2026', slides: [
    { t: 'cover', say: 'cover' },

    { t: 'team', kicker: 'Our team', title: 'Team Al Arqam Innovators', school: 'Al-Arqam Schools',
      members: [{ name: 'Saleh Sulaiman Al-Tayyar' }, { name: 'Mishari Turki Al-Buqami' }, { name: 'Abdullah Anas Al-Obaidullah' }],
      coach: 'Mr. Mohamed Mahmoud Hassan El Sayed',
      notes: 'No narrator: each student introduces himself in one sentence, live.' },

    { t: 'cards', say: 'problem', kicker: 'The problem', title: 'Heritage is for everyone… but not everyone can reach it', cols: 4, cards: [
      { icon: '♿', h: 'Motor disability', b: 'cannot move freely around fixed models' },
      { icon: '🧏', h: 'Hearing disability', b: "cannot hear the guide's explanation" },
      { icon: '👁️', h: 'Visual disability', b: 'cannot see the details on display' },
      { icon: '🔥', h: 'Fire risk', b: 'mud and wood heritage burns fast, and crowds need time to leave' } ] },

    { t: 'cards', say: 'solution', kicker: 'Our solution', title: 'One smart museum that protects people and heritage', cols: 3, cards: [
      { icon: '👁️', h: 'Explore', b: 'the visitor turns the palace with his eyes, with sign language and audio' },
      { icon: '🛡️', h: 'Protect people', b: 'a smart gate counts visitors, and a robot team fights fire' },
      { icon: '🏺', h: 'Protect the artifact', b: 'sensors watch the air around the model day and night' } ] },

    { t: 'saifstory', kicker: '🎬 The whole story', title: 'From the gate… to “Masmak is safe”' },

    { t: 'table', say: 'testing', kicker: 'Implementation & testing', title: 'Every part tested alone, then together',
      head: ['Test', 'Result'], widths: ['2.2fr', '1fr'], rows: [
      ['Eye control on all 4 sides', '✅ Pass'],
      ['Fire only: Leader sprays and returns', '✅ Pass'],
      ['Gas only: gas robot fans and returns', '✅ Pass'],
      ['Fire + gas: both robots at once', '✅ Pass'],
      ['Fire not out: hand-driven support robots', '✅ Pass'] ] },

    { t: 'table', say: 'challenges1', kicker: '🧯 Challenges 1', title: 'Building Masmak: challenges and fixes',
      head: ['Challenge', 'Fix'], widths: ['1fr', '1.3fr'], rows: [
      ['🔑 Forgot the Raspberry Pi password', 'Repair mode from the SD card, no file lost'],
      ['📷 Camera failed on the Raspberry Pi', 'Moved eye tracking to the laptop camera, commands over Wi‑Fi'],
      ['👁️ Reversed pupil indices', 'Printed the raw numbers and fixed the order'],
      ['🌀 Lost message = over-rotation', 'Watchdog stops Masmak after 1 s with no message'],
      ['🎞️ Videos shorter than their audio', 'Repeat the last frame, keep the originals'],
      ['🔈 Audio far too quiet', 'Raised in 3 places: card, system, player'],
      ['💤 Camera drops when the laptop sleeps', 'Sleep blocked + a guard restarts it'],
      ['🔀 Board and Pi swapped addresses', 'A fixed address for every device'] ] },

    { t: 'table', say: 'challenges2', kicker: '🧯 Challenges 2', title: 'Robots and add-ons: challenges and fixes',
      head: ['Challenge', 'Fix'], widths: ['1fr', '1.3fr'], rows: [
      ['🔥 “Flame” sensor was a heat sensor', 'Candle test, then a real flame sensor'],
      ['⚡ Board burned: battery 7.4 V, not 5', 'Multimeter, 5 V converter, power bank'],
      ['🌀 Wheels ran alone at full speed', 'A separate ground wire'],
      ['📶 The Leader missed the black line', 'Turned off Wi‑Fi power saving'],
      ['📱 Robots missed the iPhone hotspot', '“Maximize compatibility”, hotspot page open'],
      ['🦽 Wheelchair worked only by cable', 'Pybricks over Bluetooth, stops if the link drops'] ] },

    { t: 'statement', say: 'impact', kicker: '🌍 Impact', text: 'Masmak is only our model… any museum in the world can use it' },

    { t: 'statement', say: 'live', kicker: '🎬 Live demonstration', text: 'And now… the project, live',
      notes: 'After this slide the students run the project in front of the judges.' },
  ] }],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
