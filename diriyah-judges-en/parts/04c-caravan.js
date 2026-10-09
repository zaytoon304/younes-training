/* Section: The caravan — an automatic tour on a rail in front of the stations (code: src/curtain_caravan_v2) */
DECK.modules.push({ id: 'caravan', name: '🐪 The caravan', slides: [
  { t: 'dycaravan', title: 'A caravan travels… a sensor stops it… a narrator speaks',
    notes: 'Diriyah was a stop on the caravan and trade routes, so the caravan is the guide of the tour. Camels and a merchant ride on a small cart pulled by a toothed belt in front of the stations, driven by a NEMA17 stepper. The caravan does not know where the stations are! The station’s IR sensor sees it, so the sensor board sends the letter S over the air: “stop”. The station lights up and the narrator speaks; after 12 seconds it sends G: “go”. And so on to the third station, then the decision moment, then the caravan returns home to its limit switch. Four boards cooperating through messages: a real distributed system. And if the caravan ever fails, the show still works by hand with the same sensors.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'The caravan waits for orders… it does not know the road', file: 'curtain_caravan_v2.ino',
    code: `void loop() {
  char c = pending; pending = 0;
  switch (state) {
    case MOVING:                                  // toward the next station
      if (c == 'S') { stopsDone++; go(STOPPED); break; }
      if (stepCaravan(true) && ++legSteps >= MAX_LEG_STEPS) {
        stopsDone++; go(STOPPED);                 // safety: no sensor saw it
      }
      break;
    case STOPPED:                                 // the narrator speaks
      if (c == 'G') go(stopsDone >= 3 ? TO_END : MOVING);
      break;
    case HOMING:                                  // back to the start
      if (atHome()) { caravanPower(false); go(IDLE); break; }
      stepCaravan(false);
      break;
    case IDLE:                                    // the yellow button
      if (c == 'R') startTour();
      break;
  }
}`,
    steps: [
      { lines: [2], text: 'The last wireless message received: S, G or R' },
      { lines: [4, 5], text: 'While moving: if S arrives we stop immediately' },
      { lines: [6, 7, 8], text: 'One step every 3.3 ms, counting steps for safety' },
      { lines: [10, 11], text: 'Stopped until G arrives… after the third station we roll to the end' },
      { lines: [13, 14, 15], text: 'Return until the limit switch is pressed' },
      { lines: [17, 18], text: 'The yellow button on the sound board ⇒ R ⇒ a new tour' },
    ],
    notes: 'stepCaravan takes one step only when it is time, with no delay, so the board keeps listening for messages. During the tour, the sensor board accepts only the next expected station, so a visitor’s hand at another station cannot confuse it.' },
  { t: 'table', kicker: '🛠️ How we build it', title: 'Caravan parts… and where they connect',
    head: ['Part', 'Role', 'Wiring'], widths: ['1.1fr', '1.6fr', '1.1fr'],
    rows: [
      ['NEMA17 motor + A4988 driver', 'Turns the pulley precisely, step by step', 'STEP 18 · DIR 19 · EN 23'],
      ['12V supply + 100µF capacitor', 'Motor power separate from the ESP32 (shared ground)', 'VMOT · GND'],
      ['GT2 belt + two pulleys', '20-tooth pulley on the motor, an idler at the other end', 'Along the rail'],
      ['Wooden rail + small cart', 'The cart slides on the rail, clipped to the belt', 'In front of the stations, at sensor height'],
      ['Caravan model', 'Camels and a merchant (foam or 3D print) on the cart', 'Tall enough for the IR sensor to see'],
      ['Limit switch', 'Tells the motor where home is', 'GPIO 21 → GND'],
    ],
    notes: 'The caravan runs on the curtain board (board 3) because its pins are free. Most important: the model must be at sensor height, and the belt must be tight. Test the motor alone first, then the belt and cart, then stopping at a sensor.' },
]});
