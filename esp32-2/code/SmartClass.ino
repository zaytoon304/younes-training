// مشروع التخرج: الفصل الذكي — المحور ١٣
// يحسّ: DHT22 (4) · LDR (35) · PIR (33)
// يقرر ويتحرك: مروحة عبر مُرحِّل (19) · إنارة (23) · بازر الإنذار (13)
// يتصل: لوحة على الجوال + وضع «الفصل فارغ» يُطلق الإنذار عند أي حركة
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

const char* ssid = "School-WiFi";
const char* pass = "12345678";
WebServer server(80);
DHT dht(4, DHT22);
const int LDR = 35, PIR = 33, FAN = 19, LAMP = 23, BUZ = 13;
float temp = 0, hum = 0, fanAt = 30;
int light = 0, darkAt = 1500, moves = 0;
bool guard = false, alarmOn = false;

const char PAGE[] PROGMEM = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>الفصل الذكي</title>
<style>body{font-family:sans-serif;background:#101b45;color:#fff;text-align:center;margin:0;padding:10px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c{background:#1c2a5e;border-radius:16px;padding:12px}
.v{font-size:34px;font-weight:bold;color:#f0cc7a}button{font-size:22px;padding:14px;border:0;border-radius:14px;width:95%;margin-top:10px}
.al{background:#e74c3c;animation:f 1s infinite}@keyframes f{50%{opacity:.4}}</style></head><body><h2>🏫 الفصل الذكي</h2>
<div class="g"><div class="c">🌡️<div class="v" id="t">--</div></div><div class="c">💧<div class="v" id="h">--</div></div>
<div class="c">☀️<div class="v" id="l">--</div></div><div class="c">🚶<div class="v" id="m">--</div></div>
<div class="c">🌀 المروحة<div class="v" id="f">--</div></div><div class="c">💡 الإنارة<div class="v" id="p">--</div></div></div>
<button id="g" onclick="fetch('/guard').then(u)">🛡️ وضع الحراسة</button><div id="a"></div>
<script>
function u(){fetch('/data').then(r=>r.json()).then(d=>{t.textContent=d.t+'°';h.textContent=d.h+'%';l.textContent=d.l;m.textContent=d.m;
f.textContent=d.f?'تعمل':'متوقفة';p.textContent=d.p?'مضاءة':'مطفأة';g.textContent=d.g?'🛡️ الحراسة: تعمل':'🛡️ الحراسة: متوقفة';
g.style.background=d.g?'#2ecc71':'#ccc';a.innerHTML=d.a?'<button class="al" onclick="fetch(\'/guard\')">🚨 حركة في الفصل! إيقاف</button>':''})}
setInterval(u,1500);u();
</script></body></html>)HTML";

void handleData() {
  String j = "{\"t\":" + String(temp, 1) + ",\"h\":" + String(hum, 0) + ",\"l\":" + String(light) +
             ",\"m\":" + String(moves) + ",\"f\":" + String(digitalRead(FAN)) + ",\"p\":" + String(digitalRead(LAMP)) +
             ",\"g\":" + String(guard) + ",\"a\":" + String(alarmOn) + "}";
  server.send(200, "application/json", j);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR, INPUT); pinMode(FAN, OUTPUT); pinMode(LAMP, OUTPUT);
  ledcAttach(BUZ, 2000, 8);
  dht.begin();
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.print("\nالفصل الذكي: http://");
  Serial.println(WiFi.localIP());
  server.on("/", [] { server.send(200, "text/html; charset=utf-8", PAGE); });
  server.on("/data", handleData);
  server.on("/guard", [] { guard = !guard; alarmOn = false; ledcWriteTone(BUZ, 0); server.send(200, "text/plain", "ok"); });
  server.begin();
}

void loop() {
  server.handleClient();
  static unsigned long lastRead = 0;
  if (millis() - lastRead > 2000) {           // كل ثانيتين: اقرأ وقرّر
    lastRead = millis();
    float t = dht.readTemperature(), h = dht.readHumidity();
    if (!isnan(t)) { temp = t; hum = h; }
    light = analogRead(LDR);
    digitalWrite(FAN, temp > fanAt);
  }
  bool motion = digitalRead(PIR);
  static bool was = false;
  if (motion && !was) moves++;
  was = motion;
  digitalWrite(LAMP, motion && light < darkAt);   // إنارة عند الحركة في الظلام فقط
  if (guard && motion) alarmOn = true;
  ledcWriteTone(BUZ, alarmOn ? (millis() / 300 % 2 ? 1800 : 1200) : 0);
}
