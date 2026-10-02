// ليد RGB (مهبط مشترك): أحمر 16 · أخضر 17 · أزرق 18
// ESP32 للمعلمين — الجزء الأول · منصة جذور · أ. محمد زيتون
// اللوحة: ESP32 Dev Module

void setColor(int r, int g, int b) {
  analogWrite(16, r);
  analogWrite(17, g);
  analogWrite(18, b);
}

void setup() {
  pinMode(16, OUTPUT);
  pinMode(17, OUTPUT);
  pinMode(18, OUTPUT);
}

void loop() {
  setColor(255, 0, 0);   delay(1000);   // أحمر
  setColor(0, 255, 0);   delay(1000);   // أخضر
  setColor(0, 0, 255);   delay(1000);   // أزرق
  setColor(255, 120, 0); delay(1000);   // برتقالي
}
