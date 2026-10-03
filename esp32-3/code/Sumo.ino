// 🤖٥ روبوت السومو — المحور ٧
// اضغط زر BOOT (GPIO0) لبدء النزال ← ٥ ثوانٍ عد تنازلي (قانون السومو) ← هجوم
// حساسا الحافة: حساسا الخط الأيسر 34 والأيمن 39 في زاويتي المقدمة ينظران للأسفل
// الحلبة سوداء وحافتها بيضاء ← على الأبيض يقرأ الحساس 0
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
const int TRIG = 26, ECHO = 27;
const int EL = 34, ER = 39;
const int START = 0, LED = 2;       // زر BOOT والليد الأزرق على اللوحة
int dir = 1;                        // جهة البحث

void motors(int l, int r) {
  l = constrain(l, -255, 255); r = constrain(r, -255, 255);
  digitalWrite(IN1, l > 0); digitalWrite(IN2, l < 0); ledcWrite(ENA, abs(l));
  digitalWrite(IN3, r > 0); digitalWrite(IN4, r < 0); ledcWrite(ENB, abs(r));
}

float readCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 12000);     // ٢ متر تكفي الحلبة
  return us ? us * 0.0343 / 2 : 999;
}

void setup() {
  for (int p : {IN1, IN2, IN3, IN4, TRIG, LED}) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT); pinMode(EL, INPUT); pinMode(ER, INPUT);
  pinMode(START, INPUT_PULLUP);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
  motors(0, 0);
  while (digitalRead(START) == HIGH) { digitalWrite(LED, millis() / 500 % 2); }  // انتظر الزر
  for (int i = 0; i < 10; i++) { digitalWrite(LED, i % 2); delay(500); }         // ٥ ثوانٍ
  digitalWrite(LED, HIGH);
}

void loop() {
  bool edgeL = digitalRead(EL) == LOW, edgeR = digitalRead(ER) == LOW;
  if (edgeL || edgeR) {                       // ١) الحافة أولًا: لا تسقط!
    motors(-255, -255); delay(300);
    if (edgeL) { motors(255, -255); dir = 1; }  // ابتعد عن الجهة التي رأت الأبيض
    else       { motors(-255, 255); dir = -1; }
    delay(250);
  } else if (readCm() < 40) {                 // ٢) الخصم أمامك: ادفعه بكل قوتك
    motors(255, 255);
  } else {                                    // ٣) لا أحد: دُر حول نفسك وابحث
    motors(150 * dir, -150 * dir);
  }
}
