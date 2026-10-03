// 🤖٢ السيارة + الألتراسونك: تتباطأ أمام العائق ثم تختار الجهة الأوسع — المحور ٤
// HC-SR04: Trig 26 · Echo 27 (عبر مقسم جهد 1k/2k لأن Echo يخرج ٥ فولت)
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
const int TRIG = 26, ECHO = 27;
const int SPEED = 200, TURN45 = 190;

void motors(int l, int r) {
  l = constrain(l, -255, 255); r = constrain(r, -255, 255);
  digitalWrite(IN1, l > 0); digitalWrite(IN2, l < 0); ledcWrite(ENA, abs(l));
  digitalWrite(IN3, r > 0); digitalWrite(IN4, r < 0); ledcWrite(ENB, abs(r));
}

float readCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 25000);     // لا ننتظر أكثر من ٢٥ مللي ثانية
  return us ? us * 0.0343 / 2 : 999;        // لا صدى = الطريق مفتوح
}

void setup() {
  Serial.begin(115200);
  for (int p : {IN1, IN2, IN3, IN4, TRIG}) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
}

void loop() {
  float cm = readCm();
  Serial.println(cm);
  if (cm > 60) {
    motors(SPEED, SPEED);                    // الطريق مفتوح
  } else if (cm > 25) {
    int s = map(cm, 25, 60, 120, SPEED);     // منطقة الحذر: كلما اقترب تباطأ
    motors(s, s);
  } else {
    motors(0, 0); delay(150);
    motors(-SPEED, -SPEED); delay(250);      // تراجع قليلًا
    motors(SPEED, -SPEED); delay(TURN45);    // انظر يمينًا
    motors(0, 0); delay(100);
    float right = readCm();
    motors(-SPEED, SPEED); delay(TURN45 * 2); // انظر يسارًا
    motors(0, 0); delay(100);
    float left = readCm();
    if (right > left) { motors(SPEED, -SPEED); delay(TURN45 * 2); }  // عُد لليمين
    motors(0, 0); delay(100);
  }
  delay(30);
}
