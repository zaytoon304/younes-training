/* المحور ٤: الحركة والتشغيل — كل جزء: تطبيقه العملي ثم كوده */
DECK.modules.push({ id: 'curtain', name: '🎭 الستارة', slides: [
  { t: 'dycurtain', title: 'الستارة تُفتح بنبضات محسوبة',
    notes: 'المحرك الخطوي لا يدور دورانًا حرًا: يتحرك خطوة خطوة حين نشغّل ملفاته الأربعة بترتيب معيّن (٨ حالات نصف خطوة). الأضواء الحمراء على ULN2003 تُظهر الملف الذي يعمل الآن. حرّك منزلق التأخير: المدة ثابتة ١٠ ثوانٍ، فإن قلّ التأخير زادت الخطوات وتجاوزت الستارة نهايتها، وإن زاد لم تُفتح كاملة. لهذا اخترنا ٣ مللي ثانية.' },
  { t: 'code', reveal: true, kicker: '💻 الكود', title: 'تتابع نصف الخطوة', file: 'curtain_stepper.ino',
    code: `#define IN1 14
#define IN2 27
#define IN3 26
#define IN4 25
const int SEQ[8][4] = {{1,0,0,0},{1,1,0,0},{0,1,0,0},{0,1,1,0},
                       {0,0,1,0},{0,0,1,1},{0,0,0,1},{1,0,0,1}};
int STEP_DELAY_MS = 3;

void setPins(int a, int b, int c, int d) {
  digitalWrite(IN1, a); digitalWrite(IN2, b);
  digitalWrite(IN3, c); digitalWrite(IN4, d);
}
void moveForDuration(int ms, bool forward) {
  unsigned long start = millis();
  int i = 0;
  while (millis() - start < (unsigned long)ms) {
    int k = forward ? (i % 8) : (7 - (i % 8));
    setPins(SEQ[k][0], SEQ[k][1], SEQ[k][2], SEQ[k][3]);
    delay(STEP_DELAY_MS); i++;
  }
  setPins(0, 0, 0, 0);
}`,
    steps: [
      { lines: [1, 2, 3, 4], text: 'أربعة أطراف تقود ملفات المحرك عبر ULN2003' },
      { lines: [5, 6], text: 'جدول نصف الخطوة: ٨ حالات، كل صف = أي الملفات يعمل' },
      { lines: [7], text: 'زمن كل خطوة: ٣ مللي ثانية (أقل من ٢ يفوّت خطوات)' },
      { lines: [13, 14, 15], text: 'ندور مدة محددة بالضبط باستخدام millis' },
      { lines: [16, 17], text: 'للأمام نقرأ الجدول من أوله، وللخلف من آخره' },
      { lines: [20], text: 'في النهاية نفصل التيار: لا سخونة ولا هدر طاقة' },
    ],
    notes: 'moveForDuration(10000, true) تفتح الستارة، وmoveForDuration(10000, false) تُغلقها.' },
]});

DECK.modules.push({ id: 'ir', name: '👁️ كشف الزائر', slides: [
  { t: 'dyir', title: 'النظام يقرر: أي محطة تتكلم الآن؟',
    notes: 'هنا القرار المستقل الأول. شاهدوا: الزائر يقف عند المحطة ٢ فتعمل ١٢ ثانية حتى يكتمل صوتها. يتحرك إلى ٣ أثناء ذلك، فيراه الحساس، لكن النظام يتجاهله مؤقتًا حتى لا يقطع الراوي في منتصف الجملة. وحين يصل زائران معًا، الأولوية للمحطة الأصغر رقمًا. جرّبوا بأنفسكم: اضغطوا «زائر عند…».' },
  { t: 'code', reveal: true, kicker: '💻 الكود', title: 'اكتشاف المحطة النشطة', file: 'sensors_lights.ino',
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
      { lines: [1, 2], text: 'ثلاثة حساسات، وLOW تعني: يوجد زائر أمامي' },
      { lines: [3, 4], text: '١٢ ثانية بقاء: المحطة لا تنقطع قبل أن يكمل صوتها' },
      { lines: [7, 8, 9, 10, 11], text: 'الترتيب نفسه هو الأولوية: محطة ١ أولًا' },
      { lines: [14], text: 'لا نقرأ الحساسات إلا بعد انتهاء مدة البقاء' },
      { lines: [16, 17, 18, 19], text: 'إن تغيّرت المحطة: نفعّلها ونبدأ عدّ ١٢ ثانية' },
    ],
    notes: 'لا يوجد delay في الحلقة: البرنامج يبقى حرًا يقرأ ويحدّث الألوان في كل لحظة.' },
]});

DECK.modules.push({ id: 'light', name: '🌈 الإضاءة', slides: [
  { t: 'dyrgb', title: 'قوس قزح يدور… بدرجة كل ١٥ مللي ثانية',
    notes: 'PCA9685 يعطينا ١٦ قناة PWM بدقة ٤٠٩٦ درجة عبر سلكين فقط (I2C). لكل محطة ثلاث قنوات: أحمر وأخضر وأزرق. نحوّل «الدرجة اللونية» من ٠ إلى ٣٥٩ إلى ثلاث قيم، ونقسم الدائرة إلى ستة قطاعات في كل قطاع لون يصعد ولون ينزل. لاحظوا الأعمدة في اللوحة الزرقاء. غيّروا السرعة أو المحطة.' },
  { t: 'code', reveal: true, kicker: '💻 الكود', title: 'من درجة لونية إلى ثلاث قيم', file: 'sensors_lights.ino',
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
      { lines: [1, 2], text: 'مكتبة PCA9685 على العنوان 0x40' },
      { lines: [6], text: 'الدائرة ٣٦٠ درجة = ٦ قطاعات، كل قطاع ٦٠ درجة' },
      { lines: [7, 8], text: 'داخل القطاع: لون يصعد من ٠، ولون ينزل من ٤٠٩٥' },
      { lines: [10, 11, 12, 13, 14, 15, 16, 17], text: 'كل قطاع يحدد أي لون ثابت وأي لون يتغير' },
      { lines: [18], text: 'ثلاث قنوات لكل محطة (٠–٢، ٣–٥، ٦–٨)' },
    ],
    notes: 'وفي loop: كل ١٥ مللي ثانية نزيد الدرجة واحدًا، فتكتمل الدورة كل ٥٫٤ ثانية تقريبًا.' },
]});

DECK.modules.push({ id: 'now', name: '📶 الصوت لاسلكيًا', slides: [
  { t: 'dynow', title: 'بايت واحد يطير… فيتكلم الراوي',
    notes: 'حين تُفعَّل المحطة، ترسل لوحة الحساسات حرفًا واحدًا (\'2\' أو \'3\' أو \'4\') بالبث إلى أي لوحة تسمع. لوحة الصوت تلتقطه وتشغّل المقطع بالرقم نفسه. لا سلك يُقطع، ولا راوتر يتعطل. اضغطوا «أرسل».' },
  { t: 'code', reveal: true, kicker: '💻 الكود', title: 'إرسال واستقبال عبر ESP-NOW', file: 'sound_board.ino',
    code: `// لوحة الحساسات: ترسل
uint8_t broadcastAddress[] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};
void sendSoundCommand(char command) {
  esp_now_send(broadcastAddress, (uint8_t *)&command, 1);
}

// لوحة الصوت: تستقبل
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
      { lines: [2], text: 'عنوان البث: كل لوحة قريبة تسمع الرسالة' },
      { lines: [3, 4], text: 'نرسل حرفًا واحدًا: رقم مقطع المحطة' },
      { lines: [9, 10, 11], text: 'دالة الاستقبال سريعة جدًا: تحفظ الحرف فقط' },
      { lines: [14, 15], text: 'التشغيل الفعلي في loop، بعيدًا عن دالة الاستقبال' },
      { lines: [16, 17, 18], text: 'الحرف = رقم الملف على بطاقة SD' },
    ],
    notes: 'لماذا لا نشغّل الصوت داخل دالة الاستقبال مباشرة؟ لأنها تعمل في مهمة الاتصال، والتأخير فيها قد يُفقدنا رسائل. فنحفظ الحرف وننفذ في loop.' },
]});

DECK.modules.push({ id: 'decision', name: '🗳️ القرار', slides: [
  { t: 'dydecision', title: 'كيف نحافظ على الدرعية؟ الزائر يقرر',
    notes: 'القرار المستقل الثاني. لا يوجد جواب صح وجواب خطأ، بل ثلاث سياسات حقيقية: التوعية والمشاركة والابتكار، ولكل منها نتيجة صوتية. والزر الأصفر يعيد الترحيب. انظروا إلى الإشارة: حين أضغط الزر وأبقيه مضغوطًا، لا يتكرر الصوت؛ النقطة الذهبية تظهر مرة واحدة فقط عند لحظة الضغط.' },
  { t: 'code', reveal: true, kicker: '💻 الكود', title: 'ضغطة واحدة = تشغيل واحد', file: 'sound_board.ino',
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
    autoWelcomePlayed = true; playTrack(1, "الترحيب");
  }
  if (pressedOnce(PIN_BTN_WELCOME, lastWelcome))         playTrack(1, "الترحيب");
  if (pressedOnce(PIN_BTN_AWARENESS, lastAwareness))     playTrack(5, "التوعية");
  if (pressedOnce(PIN_BTN_PARTICIPATE, lastParticipate)) playTrack(6, "المشاركة");
  if (pressedOnce(PIN_BTN_INNOVATION, lastInnovation))   playTrack(7, "الابتكار");
  delay(30);
}`,
    steps: [
      { lines: [1, 2, 3, 4], text: 'أربعة أزرار بألوانها، بلا مقاومات (INPUT_PULLUP)' },
      { lines: [7], text: 'الضغط يجعل الطرف LOW' },
      { lines: [8, 9], text: 'نكتشف «لحظة» الضغط: الآن مضغوط، وقبلها لا' },
      { lines: [14, 15, 16], text: 'ترحيب تلقائي مرة واحدة بعد ١٠ ثوانٍ من التشغيل' },
      { lines: [18, 19, 20], text: 'كل سياسة لها مقطع نتيجة: ٥ و٦ و٧' },
      { lines: [21], text: '٣٠ مللي ثانية تكفي لتجاهل ارتداد الزر' },
    ],
    notes: 'الدالة pressedOnce تحفظ حالة كل زر في متغير خاص به، فتعمل للأزرار الأربعة بالكود نفسه.' },
]});
