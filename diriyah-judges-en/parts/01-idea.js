/* Section 1: The idea and the goal */
DECK.modules.push({ id: 'idea', name: '🌙 Idea & goal', slides: [
  { t: 'cover',
    notes: 'Good morning, honorable judges. We are proud to present our project: “Pulse of Diriyah and Its Nights”.' },
  { t: 'dyhero', gifFps: 5, kicker: '“When the visitor stops… Diriyah comes alive”', title: 'Pulse of Diriyah and Its Nights',
    notes: 'Let the scene run. An old door creaks and the stepper motor raises the curtain. The visitor stops at the first station (Salwa Palace): the IR sensor sees them, the spotlight turns on, RGB colors cycle, and a wireless message flies to the sound board so the narrator speaks. Then the Imam Mohammed bin Saud Mosque, then Wadi Hanifa. Finally the visitor presses a button to choose how to protect heritage, and hears and sees the result. Ask the judges: “Who decided which station speaks?” The answer: the system itself, from real sensor data.' },
  { t: 'cards', kicker: 'The problem', title: 'Sound & light shows are beautiful… but they see no one', cols: 3,
    cards: [
      { icon: '🔁', h: 'One version for everyone', b: 'Same order, same timing, every time — whether the visitor stops or walks away' },
      { icon: '🪑', h: 'The visitor only watches', b: 'No choice and no role, so what they hear is quickly forgotten' },
      { icon: '🏚️', h: 'Heritage needs protection', b: 'Watching alone does not create people who protect Diriyah' },
    ],
    notes: 'Traditional sound and light shows are 100% fixed. We wanted a show that notices the visitor, reacts to them, and then hands them a real question about protecting heritage.' },
  { t: 'statement', kicker: 'The idea',
    text: 'A show that never repeats itself… it detects where the visitor stands, decides what to tell, then hands the decision to the visitor',
    notes: 'Two independent decisions: the system decides which station speaks now; the visitor decides how to protect heritage. This meets the WRO autonomy requirement.' },
  { t: 'cards', kicker: 'Diriyah in three stations', title: 'From the cradle of the First Saudi State (1727)… to a question about the future', cols: 3,
    cards: [
      { icon: '🏰', h: '1. Salwa Palace', b: 'Seat of rule of the First Saudi State in At-Turaif, a UNESCO World Heritage Site' },
      { icon: '🕌', h: '2. Imam Mohammed bin Saud Mosque', b: 'Next to Salwa Palace: prayer, circles of learning, and community' },
      { icon: '🌴', h: '3. Wadi Hanifa', b: 'The lifeline: Diriyah rose on its banks among palm farms' },
    ],
    notes: 'Each station has its own sensor, spotlight, colored light and narration: rule at Salwa Palace, faith and learning at the mosque, life at Wadi Hanifa. Then comes the decision moment: how do we protect all of this?' },
  { t: 'cards', kicker: '🎯 The goal', title: 'Why this project?', cols: 2,
    cards: [
      { icon: '🇸🇦', h: 'Saudi Vision 2030', b: 'Reviving heritage and identity for a new generation' },
      { icon: '🌍', h: 'SDG target 11.4', b: 'Safeguard the world’s cultural heritage' },
      { icon: '🤖', h: 'Real autonomy', b: 'Sensors decide when each station starts' },
      { icon: '🧠', h: 'From spectator to decision-maker', b: 'The visitor chooses how to protect heritage' },
    ],
    notes: 'The project connects national identity with a global sustainability target, and meets the WRO engineering requirement: decisions based on sensor data.' },
]});
