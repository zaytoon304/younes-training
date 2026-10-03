// ماسح الشبكات — المحور ٨
#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);          // وضع «المحطة»: عميل يبحث عن شبكة
  WiFi.disconnect();
  delay(100);
}

void loop() {
  Serial.println("أبحث عن الشبكات…");
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    Serial.printf("%2d) %-24s  %4d dBm  %s\n", i + 1,
                  WiFi.SSID(i).c_str(), WiFi.RSSI(i),
                  WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "مفتوحة" : "محمية");
  }
  Serial.println();
  delay(5000);
}
