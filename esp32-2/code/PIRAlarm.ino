// إنذار المتسلل — المحور ٥
// PIR: OUT ← GPIO33 · VCC ← VIN · GND ← GND
// البازر ← GPIO13 · ليد التحذير ← GPIO23
int pir = 33;
int buzzer = 13;
int led = 23;

void setup() {
  Serial.begin(115200);
  pinMode(pir, INPUT);
  pinMode(led, OUTPUT);
  ledcAttach(buzzer, 2000, 8);
  Serial.println("انتظر ٣٠ ثانية حتى يستقر الحساس…");
  delay(30000);
}

void loop() {
  if (digitalRead(pir) == HIGH) {
    Serial.println("حركة!");
    for (int i = 0; i < 6; i++) {
      digitalWrite(led, HIGH);
      ledcWriteTone(buzzer, 1800);   // صفارة عالية
      delay(150);
      digitalWrite(led, LOW);
      ledcWriteTone(buzzer, 1200);   // ثم منخفضة
      delay(150);
    }
    ledcWriteTone(buzzer, 0);        // صمت
  }
}
