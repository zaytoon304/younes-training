// المروحة الذكية حسب الحرارة — المحور ٣
// DHT22: البيانات ← GPIO4 (مع مقاومة 10k إلى 3V3 إن لم تكن على الوحدة)
// المروحة عبر مُرحِّل (Relay) ← GPIO19
#include <DHT.h>

DHT dht(4, DHT22);     // غيّرها إلى DHT11 إن كان حساسك أزرق
int fan = 19;
float limit = 30.0;    // درجة التشغيل

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(fan, OUTPUT);
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("تعذّرت القراءة: افحص الأسلاك");
    delay(2000);
    return;
  }
  Serial.printf("الحرارة: %.1f C  الرطوبة: %.0f %%\n", t, h);
  digitalWrite(fan, t > limit ? HIGH : LOW);
  delay(2000);           // DHT يحتاج ثانيتين بين القراءات
}
