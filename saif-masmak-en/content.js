/* =====================================================================
   "Smart Al Masmak" — SAIF 2026 judging presentation (English, narrated, plays on the booth screen during the live demo)
   Built on the SAIF workshop "From prototype to competition" (2026-10-24):
   Problem → Solution (transforms the visit) → Two claims → Story → How we tested → Evidence chain per claim
   → Four angles (reliable) → Improvement cycle: all challenges (one change at a time) → Limits of our evidence → Impact → Live
   Every number comes from the team's real tests and project reports.
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
      notes: 'No narrator: each student introduces himself in one sentence, live, and names the part he owns.' },

    { t: 'cards', say: 'problem', kicker: 'The problem', title: 'Heritage is for everyone… but not everyone can reach it', cols: 4, cards: [
      { icon: '♿', h: 'Motor disability', b: 'cannot move around a fixed model' },
      { icon: '🧏', h: 'Hearing disability', b: "cannot hear the guide's explanation" },
      { icon: '👁️', h: 'Visual disability', b: 'cannot see the details on display' },
      { icon: '🔥', h: 'Fire risk', b: 'mud and wood burn fast, and crowds need time to leave' } ] },

    { t: 'cards', say: 'solution', kicker: 'Our solution', title: 'One smart museum that protects people and heritage', cols: 3, cards: [
      { icon: '👁️', h: 'Explore', b: 'the visitor turns the palace with his eyes, hand or voice, with sign language and audio' },
      { icon: '🛡️', h: 'Protect people', b: 'a gate that knows who is inside, and robots that fight fire and help visitors out' },
      { icon: '🏺', h: 'Protect the artifact', b: 'sensors watch the air around the model, day and night' } ] },

    { t: 'cards', say: 'claims', kicker: '🎯 Our claims', title: 'Two claims… backed by evidence', cols: 2, cards: [
      { icon: '1️⃣', h: 'Explore without help', b: 'a visitor with a disability explores Masmak alone: with eyes, hand or voice' },
      { icon: '2️⃣', h: 'Protection without waiting', b: 'fire is detected and handled automatically in seconds, and Civil Defense is alerted by itself' } ] },

    { t: 'saifstory', kicker: '🎬 The whole story', title: 'From the gate… to "Masmak is safe"' },

    { t: 'table', say: 'method', kicker: '🧪 How we tested', title: 'Each part alone, same conditions… then together',
      head: ['Part', 'Task', 'Number we record'], widths: ['1fr', '1.45fr', '1.45fr'], rows: [
      ['👁️ Masmak control', 'turn and stop by eyes, then hand, then voice', 'right side reached? calibration time'],
      ['🔥 Safety station', 'lighter flame, gas, then both', 'sensor reading, decision, spray time'],
      ['🚒 Civil Defense', 'a fire that does not go out', 'when is help requested? when does the robot stop?'],
      ['🦽 Wheelchair', 'voice command, obstacle, cut link', 'stopping distance, time to stop alone'] ] },

    { t: 'flow', say: 'claim1', kicker: '📊 Evidence 1 · Explore without help', title: 'The visitor runs Masmak alone',
      steps: [
        { icon: '🎯', h: 'Claim', b: 'explores alone, without help' },
        { icon: '🧪', h: 'Test', b: 'eyes, hand, voice on all 4 sides' },
        { icon: '📏', h: 'Result', b: 'turns and stops all 3 ways; calibration 2.5 s' },
        { icon: '🔧', h: 'Improve', b: 'lost message → watchdog stops it in 1 s' },
        { icon: '🌍', h: 'Impact', b: 'a visitor who could not… now can' } ],
      alert: { ok: true, icon: '✅', h: 'No buttons, no training', b: 'automatic calibration in 2.5 s; voice works with no internet' } },

    { t: 'table', say: 'claim2', kicker: '📊 Evidence 2 · Protection without waiting', title: 'Without our system… and with it',
      head: ['', 'Without', 'With our system'], widths: ['1fr', '1.1fr', '1.6fr'], rows: [
      ['🔥 Detecting danger', 'someone must notice', 'station reads flame and gas every 0.2 s'],
      ['💨 Gas evidence', '—', 'sensor 255 → 3627 (87%) at a lighter'],
      ['🤖 First response', 'nobody', 'the Leader goes alone, sprays ≤ 15 s'],
      ['📲 Civil Defense', 'waits for a call', 'auto Telegram: fire location + safe passage'],
      ['🚒 Fire not out', 'robot fights forever', 'after 15 s: asks for help, backs away'] ] },

    { t: 'cards', say: 'reliable', kicker: '🛡️ Four angles', title: 'Works… easy… useful… and reliable', cols: 2, cards: [
      { icon: '✅', h: 'Works', b: 'all five scenarios passed: fire, gas, both, fire not out, hand-driven support' },
      { icon: '👌', h: 'Easy', b: 'automatic calibration in 2.5 s; the wheelchair understands 5 voice commands' },
      { icon: '💡', h: 'Useful', b: 'one experience for three disabilities, protecting visitors and heritage' },
      { icon: '🛡️', h: 'Reliable', b: 'if the link drops it stops by itself: support robot in 0.5 s, wheelchair in 1.5 s' } ] },

    { t: 'table', say: 'challenges1', kicker: '🔁 Improvement cycle 1', title: 'Building Masmak: challenges and fixes',
      head: ['Challenge', 'Fix'], widths: ['1fr', '1.3fr'], rows: [
      ['🔑 Forgot the Raspberry Pi password', 'Repair mode from the SD card, no file lost'],
      ['📷 Camera failed on the Raspberry Pi', 'Moved eye tracking to the laptop camera, commands over Wi‑Fi'],
      ['👁️ Reversed pupil indices', 'Printed the raw numbers and fixed the order'],
      ['🌀 Lost message = over-rotation', 'Watchdog stops Masmak after 1 s with no message'],
      ['🎞️ Videos shorter than their audio', 'Repeat the last frame, keep the originals'],
      ['🔈 Audio far too quiet', 'Raised in 3 places: card, system, player'],
      ['💤 Camera drops when the laptop sleeps', 'Sleep blocked + a guard restarts it'],
      ['🔀 Board and Pi swapped addresses', 'A fixed address for every device'] ] },

    { t: 'table', say: 'challenges2', kicker: '🔁 Improvement cycle 2', title: 'Robots and add-ons: challenges and fixes',
      head: ['Challenge', 'Fix'], widths: ['1fr', '1.3fr'], rows: [
      ['🔥 “Flame” sensor was a heat sensor', 'Candle test, then a real flame sensor'],
      ['⚡ Board burned: battery 7.4 V, not 5', 'Multimeter, 5 V converter, power bank'],
      ['🌀 Wheels ran alone at full speed', 'A separate ground wire'],
      ['📶 The Leader missed the black line', 'Turned off Wi‑Fi power saving'],
      ['📱 Robots missed the iPhone hotspot', '“Maximize compatibility”, hotspot page open'],
      ['🦽 Wheelchair worked only by cable', 'Pybricks over Bluetooth, stops if the link drops'] ] },

    { t: 'cards', say: 'limits', kicker: '🧭 Honestly', title: 'The limits of our evidence today… and our next step', cols: 3, cards: [
      { icon: '👥', h: 'Tested by our team', b: 'next: 5 visitors from outside the team, 5 trials per part' },
      { icon: '🎙️', h: 'Voice hears people nearby', b: 'next: a headset microphone close to the visitor' },
      { icon: '🏛️', h: 'A scale model', b: 'next: a trial in a real museum' } ] },

    { t: 'statement', say: 'impact', kicker: '🌍 Impact', text: 'Masmak is only our model… any museum in the world can use it' },

    { t: 'statement', say: 'live', kicker: '🎬 Live demonstration', text: 'And now… the project, live',
      notes: 'After this slide, the students run the project in front of the judges.' },
  ] }],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
