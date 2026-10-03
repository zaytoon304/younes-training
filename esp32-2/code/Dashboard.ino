// لوحة تحكم إنترنت الأشياء — المحور ١٠
// الحرارة والرطوبة (DHT22 ← 4) والضوء (LDR ← 35) تُعرض على الجوال كل ثانيتين
// ومن الجوال: زر لليد (23) ومنزلق للسيرفو (18)
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ESP32Servo.h>

const char* ssid = "School-WiFi";
const char* pass = "12345678";
WebServer server(80);
DHT dht(4, DHT22);
Servo arm;
int led = 23, ldr = 35;
bool ledOn = false;

const char PAGE[] PROGMEM = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>فصلي الذكي</title>
<style>body{font-family:sans-serif;background:#101b45;color:#fff;text-align:center;margin:0;padding:12px}
.c{background:#1c2a5e;border-radius:18px;margin:10px;padding:14px}.v{font-size:44px;font-weight:bold;color:#f0cc7a}
button{font-size:24px;padding:14px 30px;border:0;border-radius:14px;background:#2ecc71;color:#fff}
input{width:85%}</style></head><body><h2>📡 فصلي الذكي</h2>
<div class="c">🌡️ الحرارة<div class="v" id="t">--</div></div>
<div class="c">💧 الرطوبة<div class="v" id="h">--</div></div>
<div class="c">☀️ الضوء<div class="v" id="l">--</div></div>
<div class="c"><button id="b" onclick="fetch('/led').then(r=>r.text()).then(x=>b.textContent=x)">💡 الليد</button></div>
<div class="c">🦾 السيرفو <span id="a">90</span>°<br><input type="range" min="0" max="180" value="90"
 oninput="a.textContent=this.value;fetch('/servo?a='+this.value)"></div>
<script>
function upd(){fetch('/data').then(r=>r.json()).then(d=>{t.textContent=d.t+' C';h.textContent=d.h+' %';l.textContent=d.l})}
setInterval(upd,2000);upd();
</script></body></html>)HTML";

void handleData() {
  float t = dht.readTemperature(), h = dht.readHumidity();
  String json = "{\"t\":" + String(isnan(t) ? 0 : t, 1) +
                ",\"h\":" + String(isnan(h) ? 0 : h, 0) +
                ",\"l\":" + String(analogRead(ldr)) + "}";
  server.send(200, "application/json", json);
}

void handleLed() {
  ledOn = !ledOn;
  digitalWrite(led, ledOn);
  server.send(200, "text/plain; charset=utf-8", ledOn ? "💡 مضاء" : "💡 مطفأ");
}

void handleServo() {
  int a = server.arg("a").toInt();
  arm.write(constrain(a, 0, 180));
  server.send(200, "text/plain", "ok");
}

void setup() {
  Serial.begin(115200);
  pinMode(led, OUTPUT);
  dht.begin();
  arm.attach(18, 500, 2400);
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.print("\nلوحة التحكم: http://");
  Serial.println(WiFi.localIP());
  server.on("/", [] { server.send(200, "text/html; charset=utf-8", PAGE); });
  server.on("/data", handleData);
  server.on("/led", handleLed);
  server.on("/servo", handleServo);
  server.begin();
}

void loop() {
  server.handleClient();
}
