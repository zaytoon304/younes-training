// إنارة الشارع الذكية — المحور ٢
// مقسم جهد: 3V3 ← LDR ← GPIO35 ← مقاومة 10k ← GND
// كلما زاد الضوء زادت القراءة
int ldr = 35;            // ADC1، مدخل فقط
int lamp = 23;
int threshold = 1500;    // اضبطها من الشاشة التسلسلية في مكانك

void setup() {
  Serial.begin(115200);
  pinMode(lamp, OUTPUT);
}

void loop() {
  int light = analogRead(ldr);
  Serial.println(light);
  if (light < threshold) {
    digitalWrite(lamp, HIGH);   // ظلام: أشعل المصباح
  } else {
    digitalWrite(lamp, LOW);    // نهار: أطفئه
  }
  delay(200);
}
