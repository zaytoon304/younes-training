/* Section 2: The parts */
DECK.modules.push({ id: 'parts', name: '🧩 Components', slides: [
  { t: 'dysystem', title: 'Three ESP32 boards… talking without wires',
    notes: 'Click any part, or let the automatic tour run. Board 1 sees and lights: 3 IR sensors, a PCA9685 driving 3 RGB LEDs, and 3 spotlights. Board 2 speaks: a DFPlayer, a speaker and the decision buttons. Board 3 raises the curtain with a stepper, announces the opening with the door sound, and drives the caravan. They all talk over ESP-NOW. Why three boards? Each one is built and tested alone, and a fault in one does not stop the others.' },
  { t: 'table', kicker: '🧾 Bill of materials', title: 'Every part… its role… and where it connects',
    head: ['Part', 'Qty', 'Role', 'Wiring'], widths: ['1.2fr', '.45fr', '1.9fr', '1.1fr'],
    rows: [
      ['ESP32 DevKit', '3', 'Sensors & lights · Sound & decision · Curtain & caravan', 'ESP-NOW between them'],
      ['Digital IR sensor', '3', 'Detects a visitor standing at its station', 'GPIO 18 · 19 · 23'],
      ['PCA9685 + RGB', '1 + 3', 'Cycling colored light at the active station', 'I2C: 21 · 22 · 0x40'],
      ['LED spotlights', '3', 'Reveal only the active station model', 'GPIO 25 · 26 · 27'],
      ['DFPlayer + speaker', '1 + 1', 'Narration, results, door sound', 'UART2: 16 · 17 (1kΩ)'],
      ['Decision buttons', '4', 'Welcome · Awareness · Participation · Innovation', 'GPIO 33 · 26 · 27 · 25'],
      ['28BYJ-48 + ULN2003', '1', 'Raises the curtain (spool and string)', 'IN1–4: 14 · 27 · 26 · 25'],
      ['NEMA17 + A4988 + belt', '1', 'Moves the caravan along the rail', 'STEP 18 · DIR 19 · EN 23'],
    ],
    notes: 'All pins come from the real code. The decision buttons use INPUT_PULLUP, so no external resistors are needed.' },
]});
