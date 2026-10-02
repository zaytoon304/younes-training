// إشارة المشاة بزر لمس على GPIO4 (نسخة ESP32 الخاصة)
// ESP32 للمعلمين — الجزء الأول · منصة جذور · أ. محمد زيتون
// اللوحة: ESP32 Dev Module

int cR = 25, cY = 26, cG = 27, pR = 32, pG = 33;
int limit = 30;

void setup() {
  int outs[] = {cR, cY, cG, pR, pG};
  for (int i = 0; i < 5; i++) pinMode(outs[i], OUTPUT);
  digitalWrite(cG, HIGH); digitalWrite(pR, HIGH);
}

void loop() {
  if (touchRead(4) < limit) {
    digitalWrite(cG, LOW);  digitalWrite(cY, HIGH); delay(1500);
    digitalWrite(cY, LOW);  digitalWrite(cR, HIGH);
    digitalWrite(pR, LOW);  digitalWrite(pG, HIGH); delay(5000);
    digitalWrite(pG, LOW);  digitalWrite(pR, HIGH);
    digitalWrite(cR, LOW);  digitalWrite(cG, HIGH);
  }
}
