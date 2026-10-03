// فحص حساسات الخط الثلاثة — المحور ٥
// TCRT5000: الأيسر 34 · الأوسط 35 · الأيمن 39 (VN) — كلها مداخل فقط، والوحدة تُغذّى من 3V3
// حرّك ورقة عليها خط أسود تحت الحساسات واضبط المقاومة الزرقاء حتى: أسود = 1 · أبيض = 0
const int SL = 34, SC = 35, SR = 39;

void setup() {
  Serial.begin(115200);
  pinMode(SL, INPUT); pinMode(SC, INPUT); pinMode(SR, INPUT);
}

void loop() {
  int l = digitalRead(SL), c = digitalRead(SC), r = digitalRead(SR);
  Serial.printf("يسار %d · وسط %d · يمين %d   ", l, c, r);
  Serial.println(l * 4 + c * 2 + r);   // رقم واحد (٠–٧) يلخّص الحالة
  delay(200);
}
