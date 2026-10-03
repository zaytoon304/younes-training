// الاتصال بشبكة المدرسة — المحور ٨
#include <WiFi.h>

const char* ssid = "School-WiFi";      // اسم الشبكة
const char* pass = "12345678";         // كلمة المرور

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Serial.print("أتصل");
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nتم الاتصال ✓");
    Serial.print("عنواني IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("قوة الإشارة: ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("\nفشل: افحص الاسم وكلمة المرور، وأن الشبكة 2.4GHz");
  }
}

void loop() {}
