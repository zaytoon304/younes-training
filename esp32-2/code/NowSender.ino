// المُرسِل: جرس لاسلكي بلا راوتر — المحور ١١
// زر بين GPIO4 و GND · يرسل لكل اللوحات القريبة (بث Broadcast)
#include <WiFi.h>
#include <esp_now.h>

uint8_t everyone[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};   // عنوان البث
struct Msg { int button; int count; };
Msg msg;
int btn = 4;

void setup() {
  Serial.begin(115200);
  pinMode(btn, INPUT_PULLUP);
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) { Serial.println("فشل تشغيل ESP-NOW"); return; }
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, everyone, 6);
  peer.channel = 0;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
  Serial.println("جاهز: اضغط الزر");
}

void loop() {
  if (digitalRead(btn) == LOW) {
    msg.button = 1;
    msg.count++;
    esp_err_t r = esp_now_send(everyone, (uint8_t*)&msg, sizeof(msg));
    Serial.println(r == ESP_OK ? "أُرسلت ✓" : "فشل الإرسال");
    delay(300);                     // منع التكرار مع ضغطة واحدة
  }
}
