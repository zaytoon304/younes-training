// زر اللمس: سلك أو رقاقة ألمنيوم على GPIO4 (T0) · الليد على 23
// ESP32 للمعلمين — الجزء الأول · منصة جذور · أ. محمد زيتون
// اللوحة: ESP32 Dev Module

const int LED = 23;
int limit = 30;   // راقب القراءات أولًا ثم اختر الحد

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
}

void loop() {
  int v = touchRead(4);       // T0
  Serial.println(v);
  digitalWrite(LED, v < limit);
  delay(100);
}
