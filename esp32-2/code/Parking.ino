// حساس ركن السيارة — المحور ٤
// HC-SR04 يعمل على 5V: VCC ← VIN · Trig ← GPIO26
// Echo يُخرج 5V! مقسم جهد: Echo ← 1k ← GPIO27 ← 2k ← GND
// البازر ← GPIO13
int trig = 26;
int echo = 27;
int buzzer = 13;

void setup() {
  Serial.begin(115200);
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
}

float readCm() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long us = pulseIn(echo, HIGH, 30000);   // مهلة ٣٠ مللي ثانية
  if (us == 0) return 999;                 // لا صدى
  return us * 0.0343 / 2;
}

void loop() {
  float cm = readCm();
  Serial.println(cm);
  if (cm < 50) {
    tone(buzzer, 1000, 50);
    delay(cm * 10);       // أقرب = نغمات أسرع
  } else {
    delay(100);
  }
}
