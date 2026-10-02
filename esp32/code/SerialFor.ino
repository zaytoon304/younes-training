// حلقة for والشاشة التسلسلية (اضبط الشاشة على 115200)
// ESP32 للمعلمين — الجزء الأول · منصة جذور · أ. محمد زيتون
// اللوحة: ESP32 Dev Module

void setup() {
  Serial.begin(115200);
}

void loop() {
  for (int i = 1; i <= 5; i++) {
    Serial.print("Round ");
    Serial.println(i);
    delay(500);
  }
  Serial.println("Done!");
  delay(2000);
}
