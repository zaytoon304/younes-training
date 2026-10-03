// المقبض يتحكم في سطوع الليد — ESP32 الجزء الثاني · المحور ١
// المقاومة المتغيرة: الطرف الأوسط ← GPIO34 · الطرفان ← 3V3 و GND
// الليد بمقاومة ٢٢٠ أوم ← GPIO23
int knob = 34;   // ADC1: يعمل حتى مع الواي فاي
int led = 23;

void setup() {
  Serial.begin(115200);
  ledcAttach(led, 5000, 8);              // PWM: تردد ٥٠٠٠ ودقة ٨ بت (٠–٢٥٥)
}

void loop() {
  int raw = analogRead(knob);            // ٠ … ٤٠٩٥ (دقة ١٢ بت)
  int mv = analogReadMilliVolts(knob);   // الجهد الحقيقي بالمللي فولت
  int bright = map(raw, 0, 4095, 0, 255);
  ledcWrite(led, bright);
  Serial.print("raw:");  Serial.print(raw);
  Serial.print(" mV:");  Serial.print(mv);
  Serial.print(" pwm:"); Serial.println(bright);
  delay(50);
}
