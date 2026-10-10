/* "Touch of Heritage" — English judging deck: the same slides as ../masmak-judges, in English */
DECK.modules.push({ id: 'idea', name: '🏰 Touch of Heritage', slides: [
  { t: 'cover', notes: 'Good morning, honorable judges. We are proud to present our project: Touch of Heritage — the fully interactive Masmak Fortress.' },
  { t: 'exhibithero', kicker: '“We look at the past… with the eyes of the future”', title: 'Touch of Heritage: the interactive Masmak',
    notes: 'Let the scene run: a visitor in a wheelchair in front of a camera. They look right with their eyes and the model turns, with a golden light wave around the turntable. They hold their gaze, the model stops, the face lights up in its color, and a sign-language video with audio narration starts on the screen. Turn the sound on to hear the narrator. Then ask: “Who is in control here?” The answer: only the visitor’s eyes. In the corner, a safety robot guards the exhibition.' },
  { t: 'cards', kicker: 'The problem', title: 'Heritage belongs to all of us… but it is not easy for everyone to reach', cols: 3,
    cards: [
      { icon: '🦽', h: 'Motor disabilities', b: 'Hard to move around fixed models, always needing a companion' },
      { icon: '🧏', h: 'Hearing disabilities', b: 'The guide’s explanation and audio recordings do not reach them' },
      { icon: '👁️‍🗨️', h: 'Visual disabilities', b: 'The details on display and the signs cannot be seen' },
    ],
    notes: 'Through field visits and talking with people with disabilities, the team noticed that heritage sites are rarely designed for everyone. The need is not three separate solutions, but one smart solution.' },
  { t: 'statement', kicker: 'The core idea',
    text: 'One simple, natural interface: eye movement… serving three groups of disabilities at once',
    notes: 'Motor: no buttons needing strength or precision. Hearing: a sign-language video. Visual: audio narration. This unified design is what sets the project apart from solutions that treat each disability separately.' },
  { t: 'systemlab', title: 'The system: click any part… then watch one glance turn the fortress',
    notes: 'Click each node to read its role. Then “Watch one glance”: eight steps from the camera to the sign-language video. Ask: “How many devices took part in one glance?” Four: the camera and computer, the Raspberry Pi, the ESP32 and the driver.' },
]});
DECK.modules.push({ id: 'table', name: '🎠 The turntable', slides: [
  { t: 'turntablelab', title: 'Drive the turntable: right… left… stop',
    notes: 'Press r right: the STEP LED blinks with every pulse, DIR is on, the model turns and a golden wave runs around it. Press s: EN goes HIGH and the face name appears. Change wait: bigger = slower. Then choose “Full ×1” and lower wait below 700: the motor loses steps and shakes. Microstepping makes the motion smooth for the eye to follow.' },
  { t: 'code', reveal: true, kicker: '✍️ Line by line', title: 'Turning the turntable', file: 'Turntable.ino',
    code: `const int STEP = 26, DIR = 25, EN = 27;
int wait = 1500;

void setup() {
  pinMode(STEP, OUTPUT); pinMode(DIR, OUTPUT);
  pinMode(EN, OUTPUT); digitalWrite(EN, HIGH);
}

void turn(bool right) {
  digitalWrite(EN, LOW);
  digitalWrite(DIR, right);
  digitalWrite(STEP, HIGH); delayMicroseconds(wait);
  digitalWrite(STEP, LOW);  delayMicroseconds(wait);
}

void stopTable() { digitalWrite(EN, HIGH); }`,
    steps: [
      { lines: [1], text: 'The real project pins: STEP 26, DIR 25, EN 27' },
      { lines: [2], text: 'Time between pulses in microseconds: the speed knob' },
      { lines: [6], text: 'We start with the motor disabled (HIGH): no sudden motion at power-up' },
      { lines: [10, 11], text: 'Enable the motor and set the direction' },
      { lines: [12, 13], text: 'One pulse = one step. turn is called again and again while the command lasts' },
      { lines: [16], text: 'Stopping: disable the motor so it does not heat up' },
    ],
    notes: 'turn takes only one step, and loop calls it thousands of times. That keeps the ESP32 free to read new commands between steps.' },
]});
DECK.modules.push({ id: 'leds', name: '🌈 Smart lighting', slides: [
  { t: 'ledlab', title: 'Color the Masmak: one color per face… a wave… and a reward',
    notes: 'Press each face: the turntable turns to it and the strip takes its color. Then “Turning wave”. Then “Interest reward”: an idea the team is developing, for when a visitor looks at a face for a long time. Raise the brightness to 255 and watch the current: that is why the team limited the brightness for safety.' },
  { t: 'code', reveal: true, kicker: '✍️ Line by line', title: 'Face colors', file: 'Turntable.ino',
    code: `#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel ring(24, 23, NEO_GRB + NEO_KHZ800);
uint32_t faceColor[4];

void setup() {
  ring.begin(); ring.setBrightness(60);
  faceColor[0] = ring.Color(240, 180, 40);
  faceColor[1] = ring.Color(46, 204, 113);
}

void showFace(int f) { ring.fill(faceColor[f]); ring.show(); }

void wave(int t) {
  for (int i = 0; i < 24; i++)
    ring.setPixelColor(i, (i + t) % 6 == 0 ? 0xF0CC7A : 0);
  ring.show();
}`,
    steps: [
      { lines: [1, 2], text: 'The NeoPixel library: 24 LEDs on GPIO23' },
      { lines: [3], text: 'An array for the colors of the four faces' },
      { lines: [6], text: 'Brightness 60 of 255: bright enough and safe on current' },
      { lines: [7, 8], text: 'The color of each face (the other two the same way)' },
      { lines: [11], text: 'fill colors the whole strip, and show actually sends the colors' },
      { lines: [13, 14, 15, 16], text: 'The wave: one LED in six is lit, and as t grows it runs around the turntable' },
    ],
    notes: 'Nothing changes before show! A common mistake: students set the colors, forget show, and see nothing.' },
]});
DECK.modules.push({ id: 'screen', name: '🤟 Sign language & audio', slides: [
  { t: 'kiosklab', title: 'Sign language and audio together… and a real problem',
    notes: 'Choose a face and watch the two bars: the audio is longer than the video! Without extension, the video ends, the screen goes black while the audio continues, and the deaf visitor loses the interpreter. This really happened to the team: differences of 2 to 11 seconds. Press “Extend with last frame”: the picture stays until the audio ends — one ffmpeg command, keeping the originals as a backup.' },
  { t: 'code', reveal: true, kicker: '✍️ Python line by line', title: 'Play the face content', file: 'content.py',
    code: `import subprocess
FACES = ["towers", "courtyard", "mosque", "majlis"]
players = []

def play(face):
    stop()
    name = FACES[face]
    players.append(subprocess.Popen(["cvlc", "--fullscreen",
        "--play-and-exit", name + "_fixed.mp4"]))
    players.append(subprocess.Popen(["mpg123", name + ".mp3"]))

def stop():
    for p in players: p.terminate()
    players.clear()`,
    steps: [
      { lines: [1], text: 'subprocess: runs system programs from Python' },
      { lines: [2], text: 'The file names of the four faces' },
      { lines: [6], text: 'First stop any previous content: the visitor moved to a new face' },
      { lines: [8, 9], text: 'VLC shows the (extended) sign-language video full screen' },
      { lines: [10], text: 'And mpg123 plays the audio narration at the same moment' },
      { lines: [12, 13, 14], text: 'Stopping: end both players together' },
    ],
    notes: 'Popen does not wait for the program to finish, so video and audio play together and Python stays free for eye commands.' },
]});
DECK.modules.push({ id: 'guard', name: '📶 The watchdog', slides: [
  { t: 'udplab', title: 'Try it: look right… then stop… and lose a message',
    notes: 'Press and hold “Look right”: r messages fly every 100 ms. Release: s messages. Now raise the loss to 40%, turn off the watchdog and repeat: sometimes the s messages are lost and the turntable keeps turning! The team found this in the logs: one lost message caused far more rotation than intended. Then turn the watchdog on: if no message arrives for more than a second, the turntable stops safely. Finally, “Cut the network” with the watchdog on.' },
  { t: 'code', reveal: true, kicker: '✍️ ESP32: receiver and watchdog', title: 'The safety watchdog', file: 'Turntable.ino',
    code: `WiFiUDP udp;
char cmd = 's';
unsigned long lastMsg = 0;

void loop() {
  if (udp.parsePacket()) {
    cmd = udp.read();
    lastMsg = millis();
  }
  if (millis() - lastMsg > 1000) cmd = 's';
  if (cmd == 'r') turn(true);
  else if (cmd == 'l') turn(false);
  else stopTable();
}`,
    steps: [
      { lines: [2], text: 'The last command received; we start stopped' },
      { lines: [3], text: 'When did the last message arrive?' },
      { lines: [6, 7, 8], text: 'A message arrived? Save the command and its time' },
      { lines: [10], text: 'The watchdog: a second with no messages? Stop now, whatever the last command' },
      { lines: [11, 12, 13], text: 'Execute: a step right, a step left, or disable the motor' },
    ],
    notes: 'Why does the watchdog work? Because the sender repeats the command continuously. So a long silence does not mean “keep going”, it means “something went wrong”. This is the fail-safe principle used in planes, trains and elevators.' },
]});
DECK.modules.push({ id: 'eyes', name: '👁️ Eye tracking', slides: [
  { t: 'eyelab', title: 'Move your eyes: hover over the face… and watch the fortress',
    notes: 'Press “Calibrate” first. Then move the pointer right and left over the face: the pupil moves, the ratio changes, the command is r or l, and the fortress turns. Back to the center: s, and the face content starts. Move up: the gate, without turning. Press “Blink”: an instant safety stop. And “Long close”: “explain this face”. Finally, “Indices: documented”: the directions flip! The team really found that indices 468 and 473 were reversed compared to common sources.' },
  { t: 'code', reveal: true, kicker: '✍️ Python line by line', title: 'From the pupil to the command', file: 'eyes.py',
    code: `ratio = (iris.x - inner.x) / (outer.x - inner.x)

if eyes_closed:
    cmd = 's'
elif ratio < center - 0.08:
    cmd = 'r'
elif ratio > center + 0.08:
    cmd = 'l'
elif looking_up:
    play("gate")
else:
    cmd = 's'
send(cmd)`,
    steps: [
      { lines: [1], text: 'The pupil position between the eye corners: a number from 0 to 1' },
      { lines: [3, 4], text: 'Blink guard first: eyes closed? A safety stop instead of a random reading' },
      { lines: [5, 6], text: 'More than 0.08 from the calibrated center? Right' },
      { lines: [7, 8], text: 'Or left' },
      { lines: [9, 10], text: 'Looking up: the historic gate content, without turning' },
      { lines: [11, 12, 13], text: 'Otherwise stop, and send the command over UDP' },
    ],
    notes: 'The 0.08 margin is a “dead zone”: a natural forward gaze has small jitters that should not move the turntable. A deliberate long close (longer than a blink) means “explain this face”.' },
]});
DECK.modules.push({ id: 'tour', name: '🦽 Decision & tour', slides: [
  { t: 'tourlab', title: 'The tour: start… then look right, left and up',
    notes: 'Press “Start the tour”: a welcome, then the chair moves forward and the distance sensor measures, then “explore mode”. Press and hold “Look right”: the fortress turns. Release: it stops, the face content starts, and the interest bar fills. Look at one face for a long time: celebration lights. Visit all four faces: the tour summary. These two features are in development by the team; the simulator shows how they will work.' },
  { t: 'cards', kicker: '🧠 A robot that decides', title: 'Measuring interest: from a tool… to a system that decides', cols: 2,
    cards: [
      { icon: '⏱️', h: 'The data', b: 'How many seconds did the visitor hold their gaze on each face? Did they stay after the video ended?' },
      { icon: '🎉', h: 'The decision', b: 'Long, deep interest? The system decides on its own to reward it with celebration lights' },
      { icon: '📋', h: 'Tour summary', b: 'At the end: “What caught you most was…” instead of an abrupt ending' },
      { icon: '🤖', h: 'Why it matters', b: 'An independent decision based on live data: the autonomy requirement in robotics competitions' },
    ],
    notes: 'This is the difference between a robot that “responds to a command” and a robot that “makes a decision”.' },
]});
DECK.modules.push({ id: 'safety', name: '🛡️ Safety robots', slides: [
  { t: 'masmakhero', kicker: 'Safety robots · tested on two robots', title: 'A station that sees… and two robots that share the danger',
    notes: 'Let the scene run: a flame at the tower and a gas leak at the same moment. The leader goes to the fire itself (it carries the pump), and sends robot 2 to the gas (it carries the fan). They set off together, and when they finish, each one backs up to its place the same way. Two robots are faster than one robot handling both dangers in turn.' },
  { t: 'decisionlab', title: 'The decision simulator: change the dangers… and watch the robots',
    notes: 'Try the three buttons: fire only (the leader goes and backs up, robot 2 keeps guard), then gas only (the leader stays and gives robot 2 permission), then both (the leader goes to the fire and orders robot 2 to the gas). Then move the sliders yourself.' },
  { t: 'code', reveal: true, kicker: '✍️ Line by line', title: 'The leader’s brain', file: 'Leader.ino',
    code: `void onAlarm(int fireP, int gasP) {
  bool fire = fireP > 50, gas = gasP > 30;
  if (fire && gas) {
    tellRobot2(GO_GAS);
    fireMission();
  }
  else if (fire) fireMission();
  else if (gas) tellRobot2(GO_GAS);
  else patrol();
}`,
    steps: [
      { lines: [1], text: 'The two danger levels arrive from the station over ESP-NOW' },
      { lines: [2], text: 'Is each danger really there? (above its threshold)' },
      { lines: [3, 4], text: 'Both: first we order robot 2 to the gas over ESP-NOW, so it leaves at once' },
      { lines: [5], text: 'Then the leader goes to the fire itself: both dangers handled together' },
      { lines: [7], text: 'Fire only: the leader goes and comes back' },
      { lines: [8], text: 'Gas only: the leader stays and gives robot 2 permission' },
      { lines: [9], text: 'No danger: both robots stay on guard' },
    ],
    notes: 'Why order robot 2 before moving? The fire mission takes time; if we told robot 2 afterwards, the gas would wait for nothing. The order of two lines saves precious seconds.' },
  { t: 'missionlab', title: 'The full mission: one event… or two events and two robots',
    notes: 'Start with “Fire A”: the leader (red) goes itself, puts out the fire, then backs up the same way, while robot 2 (blue) keeps guard. Then “Gas B”: the leader stays and sends a permission message to robot 2, which goes, runs the fan and returns. Then “Both”: gas in A and fire in B — the leader sends the order to robot 2 and sets off to the fire; they work at the same time, pump here and fan there, then each one returns to its place.' },
  { t: 'code', reveal: true, kicker: '✍️ Line by line', title: 'The leader’s heart', file: 'Leader.ino',
    code: `void loop() {
  if (!newAlarm) return;
  newAlarm = false;
  bool fire = m.fireP > 50, gas = m.gasP > 30;
  if (gas) tellRobot2(GO_GAS);
  if (fire) fireMission();
}

void fireMission() {
  unsigned long trip = goToStrip();
  if (trip) pumpFor(4000);
  driveBack(trip);
}`,
    steps: [
      { lines: [2, 3], text: 'An alarm arrived? Clear the flag at once so we never handle it twice' },
      { lines: [4], text: 'The two levels from the station' },
      { lines: [5], text: 'Gas? The leader gives robot 2 permission over ESP-NOW, and it leaves at once' },
      { lines: [6], text: 'Fire? The leader goes itself' },
      { lines: [10], text: 'Forward until both sensors see the black strip' },
      { lines: [11], text: 'Arrived? The pump for 4 seconds' },
      { lines: [12], text: 'Then backwards, the same way and for the same time: home without turning around' },
    ],
    notes: 'And robot 2? It waits for the GO GAS message from the leader, then goes to the gas, runs the fan and backs up the same way. The decision belongs to the leader; the work is shared by both.' },
  { t: 'alertlcd', kicker: '📟 The station screen', title: 'The screen tells the story… one page every two seconds',
    notes: 'Click step by step. Normally the screen says the museum is safe. When a fire starts, the screen turns red and announces “FIRE ALERT” with its level, then “Robots on their way”, then “Civil Defense notified”. Once the fire is out and the robot is home: “Mission complete”, then “Museum is SAFE now”. The pages flip by themselves every two seconds, like an advert board.' },
  { t: 'tgphone', kicker: '📱 Reporting to Civil Defense', title: 'One message when danger starts… one when it is safe',
    notes: 'This phone plays the role of the Civil Defense phone. The moment a fire is detected, the station itself sends a Telegram message with the type of danger, its level, and that the robots are handling it. When the fire is gone and every robot is back home, a second message arrives: “The museum is safe, no need to come.” Read both messages aloud to the judges; even better, let a real phone ring in front of them.' },
  { t: 'cards', kicker: '🛡️ Safety first', title: 'Rules that protect the museum… and the robot', cols: 2,
    cards: [
      { icon: '💧', h: 'Spray until the danger is gone', b: 'The pump and fan run until the station says the danger is over' },
      { icon: '⏱️', h: '30 seconds at most', b: 'Then the robot stops and returns, even if the danger remains' },
      { icon: '📡', h: 'Lost the link? Stop', b: 'No message from the station for 2 seconds: the pump stops at once' },
      { icon: '🔁', h: 'No reply? Send again', b: 'The leader repeats the order until robot 2 answers “received”' },
    ],
    notes: 'Each rule answers a “what if?”: what if the fire does not go out? What if the link drops? What if a message is lost? This is how engineers design real safety systems.' },
]});
DECK.modules.push({ id: 'firefighter', name: '🚒 The firefighter', slides: [
  { t: 'ffhero', kicker: '🚒 When the fire is bigger than the robots', title: 'The leader calls for help… the firefighter leads by hand',
    notes: 'Let the scene run: the leader and robot 2 spray, but the fire keeps growing. The time limit (30 seconds) ends, so the leader decides by itself that it needs help and sends a Telegram message: “We could not control the fire… urgent support needed”, then both robots back away safely. The firefighter arrives with two more robots: robot 3 carries a hose and an ESP32-CAM streaming the fire to the laptop; robot 4 carries a hose only. He opens his hand at the laptop camera and they advance; he makes a fist and they stop and spray; he moves the fist right and left and the hose rises and lowers. The fire goes out, and a second message arrives: “The museum is safe.”' },
  { t: 'cards', kicker: '🤖 Four robots… four ways', title: 'Each robot works in a different way', cols: 2,
    cards: [
      { icon: '🔴', h: 'Leader: decides alone', b: 'Puts out the fire, assigns tasks, and calls for help by Telegram when it is not enough' },
      { icon: '🔵', h: 'Robot 2: follows orders', b: 'Moves only with the leader’s permission, and handles the gas' },
      { icon: '📷', h: 'Robot 3: the firefighter’s eye', b: 'A hose on a servo + an ESP32-CAM streaming the fire to the laptop' },
      { icon: '🧯', h: 'Robot 4: an extra hose', b: 'A hose on a servo, moving with robot 3 by the same hand gestures' },
    ],
    notes: 'The core idea for a security exhibition: autonomous robots that know their limits and ask for help, and a human who leads other robots from a safe distance without approaching the fire.' },
  { t: 'code', reveal: true, kicker: '✍️ The leader knows its limits', title: 'When does the leader call for help?', file: 'Leader.ino',
    code: `const unsigned long MAX_SPRAY_MS = 30000;   // 30 seconds at most

void fireMission() {
  unsigned long trip = goToStrip();
  unsigned long start = millis();
  pumpOn();
  while (fireLevel() > 50) {                   // is the fire still there?
    if (millis() - start > MAX_SPRAY_MS) {     // time is up
      pumpOff();
      sendTelegram("We could not control the fire... urgent support needed");
      break;
    }
  }
  pumpOff();
  driveBack(trip);                             // back away safely
}`,
    steps: [
      { lines: [1], text: 'Spraying limit: 30 seconds at most' },
      { lines: [4, 5, 6], text: 'Reach the fire, start counting, turn on the pump' },
      { lines: [7], text: 'Spray as long as the station sees fire' },
      { lines: [8, 9, 10], text: 'Time is up and the fire is still there? It decides alone: I need help' },
      { lines: [10], text: 'A Telegram message to Civil Defense' },
      { lines: [14, 15], text: 'Turn off the pump and back away safely' },
    ],
    notes: 'A real independent decision: the robot measures, compares with its limit, and decides the mission is bigger than itself. Knowing your limits is part of safety.' },
  { t: 'gesturelab', title: 'The firefighter leads both robots by hand… safely',
    notes: 'Try the buttons, or let the auto demo run: open hand and both robots advance, fist and they stop and spray, fist right and the hose rises, fist left and it lowers. The water puts out the fire faster when the hose is at the right angle. The picture on the laptop comes from the ESP32-CAM on robot 3.' },
  { t: 'code', reveal: true, kicker: '✍️ Python: from the hand to the command', title: 'MediaPipe reads the hand', file: 'firefighter.py',
    code: `import cv2, mediapipe as mp
cam = cv2.VideoCapture(0)                    # laptop camera
hands = mp.solutions.hands.Hands(max_num_hands=1)
TIPS, JOINTS = [8, 12, 16, 20], [6, 10, 14, 18]
last_x = None

def is_fist(h):
    return all(h[t].y > h[j].y for t, j in zip(TIPS, JOINTS))

while True:
    ok, frame = cam.read()
    res = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if not res.multi_hand_landmarks:
        send("S"); continue                  # no hand: stop
    h = res.multi_hand_landmarks[0].landmark
    if not is_fist(h):
        send("F"); last_x = None             # open hand: advance
    else:
        send("W")                            # fist: stop and spray
        if last_x is not None and h[0].x - last_x > 0.04: send("U")
        if last_x is not None and last_x - h[0].x > 0.04: send("D")
        last_x = h[0].x`,
    steps: [
      { lines: [1, 2, 3], text: 'The laptop camera + MediaPipe Hands: 21 points on the hand' },
      { lines: [4], text: 'Fingertips and their middle joints' },
      { lines: [7, 8], text: 'A fist = every fingertip below its joint' },
      { lines: [13, 14], text: 'No hand in front of the camera? A safety stop' },
      { lines: [16, 17], text: 'Open hand: advance' },
      { lines: [19], text: 'Fist: stop and spray' },
      { lines: [20, 21, 22], text: 'Fist moving right or left: raise or lower the hose' },
    ],
    notes: 'Each command is one letter flying over the network to both robots, just like the eye commands of the Masmak model. And no hand means stop: safety first.' },
]});
DECK.modules[0].slides.splice(1, 0,
  { t: 'fullstory', kicker: '🎬 The whole story', title: 'From the visitor’s eyes… to the Civil Defense officer', video: 'story.mp4',
    notes: 'Plays first in front of the judges, with the English narrator (in PowerPoint it is a video that starts by itself; on the web press 🔊 Narrator). Chapter 0: the visitor in the LEGO wheelchair, the camera welcomes him, his eyes turn the fortress right and left with the light wave, he holds his gaze and gets sign language + audio narration together, and a blink or the watchdog stops the turntable. Then the safety station: (1) fire only: the leader puts it out and backs up. (2) gas only: the leader gives robot 2 permission. (3) fire and gas: leader to the fire, robot 2 to the gas + Telegram. (4) a fire too big: “we need help”, and the Civil Defense officer leads robots 3 and 4 by hand until “the museum is safe”. Let it run completely, then start explaining.' });
DECK.modules.push({ id: 'end', name: '🏆 Challenges', slides: [
  { t: 'table', kicker: '🧯 Our challenges', title: 'Five challenges the team faced… and how we solved them',
    head: ['The challenge', 'The solution'], widths: ['1fr', '1.5fr'],
    rows: [
      ['🎞️ Videos shorter than audio', 'Froze each video’s last frame, keeping the originals'],
      ['🌀 Lost message = over-rotation', 'Read the logs + a watchdog that stops after 1 s of silence'],
      ['👁️ Reversed pupil indices', 'Checked raw coordinates instead of common sources'],
      ['🔈 Very quiet audio', 'Raised the volume in PipeWire and in the player'],
      ['🔑 Forgotten Pi password', 'Reset from the SD card without losing a file'],
    ],
    notes: 'Judges love this table more than a feature list: it shows the team really built, made mistakes, understood, and fixed them.' },
  { t: 'end', title: 'Thank you', sub: 'We look at the past… with the eyes of the future',
    notes: 'Thank you. We welcome your questions.' },
]});
