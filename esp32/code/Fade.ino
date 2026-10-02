// التلاشي والتوهج بـ LEDC على GPIO23 (حزمة esp32 الإصدار 3)
// ESP32 للمعلمين — الجزء الأول · منصة جذور · أ. محمد زيتون
// اللوحة: ESP32 Dev Module

const int LED = 23;

void setup() {
  ledcAttach(LED, 5000, 8);   // الطرف، التردد، الدقة
}

void loop() {
  for (int d = 0; d <= 255; d++) {
    ledcWrite(LED, d);
    delay(5);
  }
  for (int d = 255; d >= 0; d--) {
    ledcWrite(LED, d);
    delay(5);
  }
}
