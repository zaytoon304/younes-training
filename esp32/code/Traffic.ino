// إشارة المرور: أحمر 25 · أصفر 26 · أخضر 27
// ESP32 للمعلمين — الجزء الأول · منصة جذور · أ. محمد زيتون
// اللوحة: ESP32 Dev Module

int red = 25, yellow = 26, green = 27;

void setup() {
  pinMode(red, OUTPUT);
  pinMode(yellow, OUTPUT);
  pinMode(green, OUTPUT);
}

void loop() {
  digitalWrite(green, HIGH); delay(4000);
  digitalWrite(green, LOW);
  digitalWrite(yellow, HIGH); delay(1500);
  digitalWrite(yellow, LOW);
  digitalWrite(red, HIGH); delay(4000);
  digitalWrite(red, LOW);
}
