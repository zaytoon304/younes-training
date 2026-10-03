// اعرف عنوان MAC للوحتك — المحور ١١
#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  delay(200);
  Serial.print("عنوان MAC: ");
  Serial.println(WiFi.macAddress());   // مثل 24:6F:28:AB:CD:EF
}

void loop() {}
