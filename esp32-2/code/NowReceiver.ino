// المُستقبِل: جرس لاسلكي — المحور ١١
// البازر ← GPIO13 · الليد ← GPIO23
#include <WiFi.h>
#include <esp_now.h>

struct Msg { int button; int count; };
volatile bool ring = false;
volatile int lastCount = 0;
int buzzer = 13, led = 23;

// تُستدعى تلقائيًا عند وصول رسالة
void onReceive(const esp_now_recv_info_t* info, const uint8_t* data, int len) {
  if (len != sizeof(Msg)) return;
  Msg m;
  memcpy(&m, data, sizeof(m));
  lastCount = m.count;
  ring = true;                       // لا نطيل العمل هنا: نرفع علمًا فقط
}

void setup() {
  Serial.begin(115200);
  pinMode(led, OUTPUT);
  ledcAttach(buzzer, 2000, 8);
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) { Serial.println("فشل تشغيل ESP-NOW"); return; }
  esp_now_register_recv_cb(onReceive);
  Serial.println("أنتظر الرسائل…");
}

void loop() {
  if (ring) {
    ring = false;
    Serial.printf("دق الجرس! (الرسالة رقم %d)\n", lastCount);
    digitalWrite(led, HIGH);
    ledcWriteTone(buzzer, 880); delay(200);
    ledcWriteTone(buzzer, 660); delay(300);
    ledcWriteTone(buzzer, 0);
    digitalWrite(led, LOW);
  }
}
