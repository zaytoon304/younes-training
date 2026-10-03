// 🤖٣ تتبع الخط بثلاثة حساسات — المحور ٥
// TCRT5000: الأيسر 34 · الأوسط 35 · الأيمن 39 — أسود = 1
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
const int SL = 34, SC = 35, SR = 39;
const int FAST = 200, SLOW = 60;
int lastSide = 0;                 // آخر جهة رأينا فيها الخط: -1 يسار · 1 يمين

void motors(int l, int r) {
  l = constrain(l, -255, 255); r = constrain(r, -255, 255);
  digitalWrite(IN1, l > 0); digitalWrite(IN2, l < 0); ledcWrite(ENA, abs(l));
  digitalWrite(IN3, r > 0); digitalWrite(IN4, r < 0); ledcWrite(ENB, abs(r));
}

void setup() {
  for (int p : {IN1, IN2, IN3, IN4}) pinMode(p, OUTPUT);
  pinMode(SL, INPUT); pinMode(SC, INPUT); pinMode(SR, INPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
}

void loop() {
  int l = digitalRead(SL), c = digitalRead(SC), r = digitalRead(SR);
  if (c && !l && !r) {
    motors(FAST, FAST);              // الخط في المنتصف: انطلق
  } else if (l && !r) {
    motors(SLOW, FAST);              // الخط مال يسارًا: انعطف يسارًا
    lastSide = -1;
  } else if (r && !l) {
    motors(FAST, SLOW);              // الخط مال يمينًا: انعطف يمينًا
    lastSide = 1;
  } else if (l && c && r) {
    motors(FAST, FAST);              // تقاطع: اعبره مستقيمًا
  } else {
    motors(-150 * lastSide, 150 * lastSide);  // ضاع الخط: دُر نحو آخر جهة رأيته فيها
  }
}
