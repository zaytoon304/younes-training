// محرك DC مع L298N — المحور ٧
// ENA ← GPIO14 (السرعة PWM) · IN1 ← GPIO16 · IN2 ← GPIO17 (الاتجاه)
// بطارية المحرك ← 12V في L298N · GND مشترك مع ESP32
int ena = 14;
int in1 = 16;
int in2 = 17;

void setup() {
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  ledcAttach(ena, 1000, 8);      // ١ كيلوهرتز تناسب أغلب المحركات
}

void drive(int speed) {          // من -255 (خلفًا) إلى 255 (أمامًا)
  digitalWrite(in1, speed > 0);
  digitalWrite(in2, speed < 0);
  ledcWrite(ena, abs(speed));
}

void loop() {
  for (int s = 0; s <= 255; s += 5) { drive(s); delay(30); }   // تسارع
  delay(1000);
  drive(0);    delay(500);                                     // توقف
  drive(-180); delay(1500);                                    // خلفًا
  drive(0);    delay(1000);
}
