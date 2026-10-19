/* =====================================================================
   "Smart Al Masmak" — SAIF 2026 judging presentation (English, narrated, ~4 minutes)
   Cover → Team (students speak live) → Problem → Solution → Explore → Smart gate → Artifact care
   → Robot team → Civil Defense → Testing → Impact → Live
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

    { t: 'pic', say: 'explore', kicker: '1 · Explore', title: 'Heritage you control with your eyes', img: 'students.jpg',
      cap: 'Students demonstrating the eye control', points: [
      { icon: '👀', h: 'Look right or left', b: 'the palace turns slowly on its stepper turntable' },
      { icon: '🎯', h: 'Hold your gaze', b: 'it stops, and that side tells its story' },
      { icon: '🤟', h: 'Sign language + audio', b: 'for deaf visitors and for blind visitors' },
      { icon: '🦽', h: 'LEGO SPIKE wheelchair', b: 'brings the visitor to the station' } ] },

    { t: 'flow', say: 'gate', kicker: '2 · Protect people · 🆕 New for SAIF', title: 'The smart entrance gate', steps: [
      { icon: '🎫', h: 'Wristband', b: 'every visitor gets one, with his name' },
      { icon: '📡', h: 'Tap the reader', b: 'RFID reads the wristband' },
      { icon: '🚧', h: 'Barrier opens', b: 'green light and a welcome sound' },
      { icon: '🔢', h: 'Live count', b: 'the museum always knows who is inside' } ],
      alert: { icon: '🔥', h: 'Fire? The gate opens by itself', b: 'and the names of everyone inside go to Civil Defense' } },

    { t: 'flow', say: 'artifact', kicker: '3 · Protect the artifact · 🆕 New for SAIF', title: 'Caring for the heritage inside its case', steps: [
      { icon: '🌡️', h: 'Temperature', b: 'heat damages mud and wood' },
      { icon: '💧', h: 'Humidity', b: 'moisture cracks and stains' },
      { icon: '💨', h: 'Air quality', b: 'dust and pollution' } ],
      alert: { icon: '📺', h: 'Live screen + automatic action', b: 'if the air becomes dangerous for the artifact, the system warns and acts' } },

    { t: 'pic', say: 'robots', kicker: '4 · The robot team', title: 'Robots that decide by themselves', img: 'project.jpg',
      cap: 'The complete working prototype', points: [
      { icon: '🔥', h: 'The station detects', b: 'flame and gas sensors, a screen and an alarm' },
      { icon: '🧠', h: 'The Leader decides', b: 'fire: itself · gas: the gas robot · both: both' },
      { icon: '🛑', h: 'Stop at the line, act', b: 'spray water or fan the gas, then return home' },
      { icon: '⏱️', h: 'Knows its limit', b: 'still burning after 15 s? it calls for help' } ] },

    { t: 'flow', say: 'civil', kicker: '5 · Civil Defense', title: 'When robots need people', steps: [
      { icon: '📱', h: 'Telegram alert', b: 'fire, east side, people inside' },
      { icon: '🆘', h: 'Support request', b: 'with a safe passage to enter' },
      { icon: '✋', h: 'Hand gestures', b: 'a firefighter drives two robots, with a live camera' },
      { icon: '🤖', h: 'Rescue robot', b: 'guides the visitors to the exit' } ],
      alert: { icon: '✅', h: '"Masmak Museum is safe"', b: 'the last message, when the fire is out', ok: true } },

    { t: 'table', say: 'testing', kicker: 'Implementation & testing', title: 'Every part tested alone, then together',
      head: ['Test', 'Result'], widths: ['2.2fr', '1fr'], rows: [
      ['Eye control on all 4 sides', '✅ Pass'],
      ['Fire only: Leader sprays and returns', '✅ Pass'],
      ['Gas only: gas robot fans and returns', '✅ Pass'],
      ['Fire + gas: both robots at once', '✅ Pass'],
      ['Fire not out: hand-driven support robots', '✅ Pass'] ] },

    { t: 'statement', say: 'impact', kicker: '🌍 Impact', text: 'Masmak is only our model… any museum in the world can use it' },

    { t: 'statement', say: 'live', kicker: '🎬 Live demonstration', text: 'And now… the project, live',
      notes: 'After this slide the students run the project in front of the judges.' },
  ] }],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
