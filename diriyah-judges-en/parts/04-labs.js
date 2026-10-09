/* Section 4: Motion and operation — each part: its live scene, then its code */
DECK.modules.push({ id: 'curtain', name: '🎭 The curtain', slides: [
  { t: 'dycurtain', title: 'An old door creaks… and the curtain rises',
    notes: 'At the opening, the curtain board sends the letter D wirelessly so an old wooden door sound plays, and at the same moment the stepper winds a spool above the box and the curtain rises like a theatre curtain. A stepper moves step by step when its four coils are energized in a set order (8 half-step states). Move the delay slider: the duration is fixed at 10 seconds, so a shorter delay means more steps and the curtain overshoots; a longer delay and it does not fully rise.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'Door signal… then rising step by step', file: 'curtain_v2.ino',
    code: `#define IN1 14
#define IN2 27
#define IN3 26
#define IN4 25
const int SEQ[8][4] = {{1,0,0,0},{1,1,0,0},{0,1,0,0},{0,1,1,0},
                       {0,0,1,0},{0,0,1,1},{0,0,0,1},{1,0,0,1}};
int STEP_DELAY_MS = 3;

void moveForDuration(int ms, bool up) {
  unsigned long start = millis();
  int i = 0;
  while (millis() - start < (unsigned long)ms) {
    int k = up ? (i % 8) : (7 - (i % 8));
    setPins(SEQ[k][0], SEQ[k][1], SEQ[k][2], SEQ[k][3]);
    delay(STEP_DELAY_MS); i++;
  }
  setPins(0, 0, 0, 0);
}
void setup() {
  sendDoorSignal();                  // 'D' -> door sound 0012
  moveForDuration(10000, true);      // rise for 10 seconds
}`,
    steps: [
      { lines: [1, 2, 3, 4], text: 'Four pins drive the motor coils through the ULN2003' },
      { lines: [5, 6], text: 'Half-step table: 8 states, each row = which coils are on' },
      { lines: [7], text: '3 ms per step (below 2 ms the motor skips steps)' },
      { lines: [12, 13, 14], text: 'To rise we read the table forwards, to lower it backwards' },
      { lines: [17], text: 'Finally we cut the current: no heat, no wasted power' },
      { lines: [20, 21], text: 'The opening: the door signal over the air… then the rise' },
    ],
    notes: 'The motor winds a spool that pulls the curtain string. If it goes down instead of up, we just swap true and false.' },
]});

DECK.modules.push({ id: 'ir', name: '👁️ Detecting visitors', slides: [
  { t: 'dyir', title: 'The system decides: which station speaks now?',
    notes: 'The first independent decision. The visitor stands at station 2, which stays on for 12 seconds so its narration finishes. They move to 3 meanwhile; the sensor sees them, but the system ignores it for now so the narrator is never cut off mid-sentence. When two visitors arrive together, the lower station number wins. Try it: press “Visitor at…”.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'Finding the active station', file: 'sensors_lights.ino',
    code: `const int IR1_PIN = 18, IR2_PIN = 19, IR3_PIN = 23;
const int IR_ACTIVE_STATE = LOW;
const unsigned long HOLD_DURATION_MS = 12000;
unsigned long holdUntil = 0;
int lastActiveStation = -1;

int detectActiveStation() {
  if (digitalRead(IR1_PIN) == IR_ACTIVE_STATE) return 1;
  if (digitalRead(IR2_PIN) == IR_ACTIVE_STATE) return 2;
  if (digitalRead(IR3_PIN) == IR_ACTIVE_STATE) return 3;
  return 0;
}
void loop() {
  if (millis() >= holdUntil) {
    int s = detectActiveStation();
    if (s != lastActiveStation) {
      lastActiveStation = s;
      if (s != 0) holdUntil = millis() + HOLD_DURATION_MS;
      activateStation(s);
    }
  }
}`,
    steps: [
      { lines: [1, 2], text: 'Three sensors; LOW means someone is in front of me' },
      { lines: [3, 4], text: '12-second hold: a station is never cut off before its narration ends' },
      { lines: [7, 8, 9, 10, 11], text: 'The order is the priority: station 1 first' },
      { lines: [14], text: 'We read the sensors only after the hold time ends' },
      { lines: [16, 17, 18, 19], text: 'If the station changed: activate it and start the 12-second count' },
    ],
    notes: 'There is no delay in the loop, so the program keeps reading sensors and updating colors at every moment.' },
]});

DECK.modules.push({ id: 'light', name: '🌈 Lighting', slides: [
  { t: 'dyrgb', title: 'A rainbow that turns… one hue every 15 ms',
    notes: 'The PCA9685 gives us 16 PWM channels with 4096 levels over just two wires (I2C). Each station uses three channels: red, green, blue. We convert a hue from 0 to 359 into three values by splitting the color wheel into six sectors; in each sector one color rises and one falls. Watch the bars on the blue board, and try changing the speed or the station.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'From one hue to three values', file: 'sensors_lights.ino',
    code: `#include <Adafruit_PWMServoDriver.h>
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver(0x40);
const uint16_t PWM_FULL = 4095;

void setRGBHue(uint8_t chR, uint8_t chG, uint8_t chB, uint16_t hue) {
  uint8_t region = hue / 60;
  uint16_t rising = (hue % 60) * 255 / 60 * (PWM_FULL / 255);
  uint16_t falling = PWM_FULL - rising;
  uint16_t r, g, b;
  switch (region) {
    case 0: r = PWM_FULL; g = rising;   b = 0;        break;
    case 1: r = falling;  g = PWM_FULL; b = 0;        break;
    case 2: r = 0;        g = PWM_FULL; b = rising;   break;
    case 3: r = 0;        g = falling;  b = PWM_FULL; break;
    case 4: r = rising;   g = 0;        b = PWM_FULL; break;
    default: r = PWM_FULL; g = 0;       b = falling;
  }
  pwm.setPWM(chR, 0, r); pwm.setPWM(chG, 0, g); pwm.setPWM(chB, 0, b);
}`,
    steps: [
      { lines: [1, 2], text: 'The PCA9685 library at address 0x40' },
      { lines: [6], text: 'The 360° wheel = 6 sectors of 60° each' },
      { lines: [7, 8], text: 'Inside a sector: one color rises from 0, one falls from 4095' },
      { lines: [10, 11, 12, 13, 14, 15, 16, 17], text: 'Each sector sets which color is fixed and which one changes' },
      { lines: [18], text: 'Three channels per station (0–2, 3–5, 6–8)' },
    ],
    notes: 'In the loop, every 15 ms we add one degree, so a full cycle takes about 5.4 seconds.' },
]});

DECK.modules.push({ id: 'now', name: '📶 Wireless sound', slides: [
  { t: 'dynow', title: 'One byte flies… and the narrator speaks',
    notes: 'When a station activates, the sensor board broadcasts one character (\'2\', \'3\' or \'4\') to any listening board. The sound board catches it and plays the track with that number. No wire to break, no router to fail. Press “Send”.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'Sending and receiving with ESP-NOW', file: 'sound_board.ino',
    code: `// Sensor board: sends
uint8_t broadcastAddress[] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};
void sendSoundCommand(char command) {
  esp_now_send(broadcastAddress, (uint8_t *)&command, 1);
}

// Sound board: receives
volatile char pendingCommand = 0;
void onEspNowReceive(const esp_now_recv_info_t *info,
                     const uint8_t *data, int len) {
  if (len >= 1) pendingCommand = (char)data[0];
}
void loop() {
  if (pendingCommand != 0) {
    char c = pendingCommand; pendingCommand = 0;
    if (c == '2') dfPlayer.play(2);
    else if (c == '3') dfPlayer.play(3);
    else if (c == '4') dfPlayer.play(4);
  }
}`,
    steps: [
      { lines: [2], text: 'Broadcast address: every nearby board hears the message' },
      { lines: [3, 4], text: 'We send one character: the station’s track number' },
      { lines: [9, 10, 11], text: 'The receive callback is very fast: it only stores the character' },
      { lines: [14, 15], text: 'The actual playing happens in loop, away from the callback' },
      { lines: [16, 17, 18], text: 'The character = the file number on the SD card' },
    ],
    notes: 'Why not play the sound inside the callback? It runs in the Wi-Fi task, and any delay there could lose messages. So we store the character and act in loop.' },
]});

DECK.modules.push({ id: 'decision', name: '🗳️ The decision', slides: [
  { t: 'dydecision', title: 'How do we protect Diriyah? The visitor decides',
    notes: 'The second independent decision. There is no right or wrong answer, but three real policies: awareness, participation and innovation, each with its own result. The yellow button replays the welcome. Look at the signal: when I press and hold, the sound does not repeat; the gold dot appears only once, at the moment of the press.' },
  { t: 'code', reveal: true, kicker: '💻 The code', title: 'One press = one play', file: 'sound_board.ino',
    code: `#define PIN_BTN_WELCOME      33
#define PIN_BTN_AWARENESS    26
#define PIN_BTN_PARTICIPATE  27
#define PIN_BTN_INNOVATION   25

bool pressedOnce(int pin, bool &lastState) {
  bool current = (digitalRead(pin) == LOW);
  bool justPressed = current && !lastState;
  lastState = current;
  return justPressed;
}

void loop() {
  if (!autoWelcomePlayed && millis() >= 10000) {
    autoWelcomePlayed = true; playTrack(1, "Welcome");
  }
  if (pressedOnce(PIN_BTN_WELCOME, lastWelcome))         playTrack(1, "Welcome");
  if (pressedOnce(PIN_BTN_AWARENESS, lastAwareness))     playTrack(5, "Awareness");
  if (pressedOnce(PIN_BTN_PARTICIPATE, lastParticipate)) playTrack(6, "Participation");
  if (pressedOnce(PIN_BTN_INNOVATION, lastInnovation))   playTrack(7, "Innovation");
  delay(30);
}`,
    steps: [
      { lines: [1, 2, 3, 4], text: 'Four colored buttons, no resistors (INPUT_PULLUP)' },
      { lines: [7], text: 'Pressing pulls the pin LOW' },
      { lines: [8, 9], text: 'We detect the moment of the press: pressed now, not before' },
      { lines: [14, 15, 16], text: 'An automatic welcome, once, after start-up' },
      { lines: [18, 19, 20], text: 'Each policy has its result track: 5, 6 and 7' },
      { lines: [21], text: '30 ms is enough to ignore switch bounce' },
    ],
    notes: 'pressedOnce keeps each button’s state in its own variable, so the same code works for all four buttons.' },
]});
