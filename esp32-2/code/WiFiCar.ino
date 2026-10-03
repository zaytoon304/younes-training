// سيارة تُقاد من الجوال وتتوقف أمام العائق — المحور ١٢
// السيارة تصنع شبكتها الخاصة (نقطة وصول): اتصل بـ ESP32-Car ثم افتح 192.168.4.1
// L298N: يسار ENA 14 · IN1 16 · IN2 17 — يمين ENB 32 · IN3 21 · IN4 22
// HC-SR04: Trig 26 · Echo (بمقسم جهد) 27
#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);
const int ENA = 14, IN1 = 16, IN2 = 17, ENB = 32, IN3 = 21, IN4 = 22;
const int TRIG = 26, ECHO = 27;
int speed = 200;
char dir = 's';                     // f أمام · b خلف · l يسار · r يمين · s قف

const char PAGE[] PROGMEM = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>سيارتي</title>
<style>body{font-family:sans-serif;background:#101b45;color:#fff;text-align:center;user-select:none;touch-action:none}
.g{display:grid;grid-template-columns:repeat(3,90px);gap:12px;justify-content:center;margin-top:20px}
b{display:flex;align-items:center;justify-content:center;height:90px;border-radius:20px;background:#2e4288;font-size:40px}
b:active{background:#f0cc7a}#d{font-size:22px;margin-top:16px}</style></head><body><h2>🚗 سيارتي</h2>
<div class="g"><i></i><b data-d="f">⬆️</b><i></i><b data-d="r">➡️</b><b data-d="s">⏹️</b><b data-d="l">⬅️</b><i></i><b data-d="b">⬇️</b><i></i></div>
<div id="d">المسافة: -- سم</div>
<script>
document.querySelectorAll('b').forEach(k=>{
 k.onpointerdown=()=>fetch('/go?d='+k.dataset.d);
 k.onpointerup=k.onpointerleave=()=>fetch('/go?d=s');});
setInterval(()=>fetch('/cm').then(r=>r.text()).then(x=>d.textContent='المسافة: '+x+' سم'),500);
</script></body></html>)HTML";

void motors(int l, int r) {         // من -255 إلى 255 لكل جهة
  digitalWrite(IN1, l > 0); digitalWrite(IN2, l < 0); ledcWrite(ENA, abs(l));
  digitalWrite(IN3, r > 0); digitalWrite(IN4, r < 0); ledcWrite(ENB, abs(r));
}

float readCm() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 25000);
  return us ? us * 0.0343 / 2 : 999;
}

void apply(float cm) {
  if (dir == 'f' && cm < 20) dir = 's';     // الأمان أولًا: عائق أمامي
  switch (dir) {
    case 'f': motors(speed, speed);   break;
    case 'b': motors(-speed, -speed); break;
    case 'l': motors(-speed, speed);  break;
    case 'r': motors(speed, -speed);  break;
    default:  motors(0, 0);
  }
}

void setup() {
  Serial.begin(115200);
  for (int p : {IN1, IN2, IN3, IN4, TRIG}) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
  WiFi.softAP("ESP32-Car", "12345678");     // كلمة المرور ٨ أحرف على الأقل
  Serial.print("اتصل بالشبكة ESP32-Car ثم افتح http://");
  Serial.println(WiFi.softAPIP());          // 192.168.4.1
  server.on("/", [] { server.send(200, "text/html; charset=utf-8", PAGE); });
  server.on("/go", [] { dir = server.arg("d")[0]; server.send(200, "text/plain", "ok"); });
  server.on("/cm", [] { server.send(200, "text/plain", String(readCm(), 0)); });
  server.begin();
}

void loop() {
  server.handleClient();
  static unsigned long last = 0;
  if (millis() - last > 60) {       // افحص المسافة ١٦ مرة في الثانية
    last = millis();
    apply(readCm());
  }
}
