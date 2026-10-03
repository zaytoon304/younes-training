// تحكم في الليد من الجوال — المحور ٩
// افتح العنوان الذي يظهر في الشاشة التسلسلية من متصفح الجوال (على الشبكة نفسها)
#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "School-WiFi";
const char* pass = "12345678";
int led = 23;
bool on = false;
WebServer server(80);           // الخادم يستمع على المنفذ ٨٠

String page() {
  String s = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>ليد الفصل</title>
<style>body{font-family:sans-serif;text-align:center;background:#101b45;color:#fff}
a{display:block;margin:18px auto;width:70%;padding:22px;border-radius:18px;font-size:28px;color:#fff;text-decoration:none}
.on{background:#2ecc71}.off{background:#e74c3c}</style></head><body><h1>💡 ليد الفصل</h1>)HTML";
  s += on ? "<h2>الحالة: مضاء</h2>" : "<h2>الحالة: مطفأ</h2>";
  s += R"HTML(<a class="on" href="/on">أشعل</a><a class="off" href="/off">أطفئ</a></body></html>)HTML";
  return s;
}

void handleRoot() { server.send(200, "text/html; charset=utf-8", page()); }
void handleOn()   { on = true;  digitalWrite(led, HIGH); handleRoot(); }
void handleOff()  { on = false; digitalWrite(led, LOW);  handleRoot(); }

void setup() {
  Serial.begin(115200);
  pinMode(led, OUTPUT);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.print("\nافتح من الجوال: http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.begin();
}

void loop() {
  server.handleClient();        // استقبل طلبات المتصفح
}
