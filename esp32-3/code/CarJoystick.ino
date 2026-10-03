// 🤖١ السيارة العادية تُقاد بعصا تحكم على الجوال — المحور ٣
// السيارة تصنع شبكتها: اتصل بـ ESP32-Car-1 (كلمة المرور 12345678) ثم افتح 192.168.4.1
// L298N: الأيسر ENA 14 · IN1 16 · IN2 17 — الأيمن ENB 32 · IN3 21 · IN4 22
#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
int jx = 0, jy = 0;               // موضع العصا: من -100 إلى 100
unsigned long lastCmd = 0;        // متى وصل آخر أمر؟

const char PAGE[] PROGMEM = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>عصا التحكم</title>
<style>body{margin:0;font-family:sans-serif;background:#101b45;color:#fff;text-align:center;user-select:none;touch-action:none}
#pad{width:280px;height:280px;border-radius:50%;background:#2e4288;margin:30px auto;position:relative;border:6px solid #8d9bd0}
#k{width:110px;height:110px;border-radius:50%;background:#f0cc7a;position:absolute;left:85px;top:85px}
#v{font-size:22px}</style></head><body><h2>🚗 سيارتي</h2><div id="pad"><div id="k"></div></div><div id="v">x 0 · y 0</div>
<script>
let x=0,y=0,on=false;const pad=document.getElementById('pad'),k=document.getElementById('k');
function mv(e){const r=pad.getBoundingClientRect();let dx=e.clientX-r.left-140,dy=e.clientY-r.top-140;
 const d=Math.hypot(dx,dy);if(d>110){dx*=110/d;dy*=110/d;}
 k.style.left=(85+dx)+'px';k.style.top=(85+dy)+'px';x=Math.round(dx/1.1);y=Math.round(-dy/1.1);v.textContent='x '+x+' · y '+y;}
pad.onpointerdown=e=>{on=true;pad.setPointerCapture(e.pointerId);mv(e);};
pad.onpointermove=e=>{if(on)mv(e);};
pad.onpointerup=()=>{on=false;x=y=0;k.style.left=k.style.top='85px';v.textContent='x 0 · y 0';};
setInterval(()=>fetch('/j?x='+x+'&y='+y),100);   // عشر مرات في الثانية
</script></body></html>)HTML";

void motors(int l, int r) {
  l = constrain(l, -255, 255); r = constrain(r, -255, 255);
  digitalWrite(IN1, l > 0); digitalWrite(IN2, l < 0); ledcWrite(ENA, abs(l));
  digitalWrite(IN3, r > 0); digitalWrite(IN4, r < 0); ledcWrite(ENB, abs(r));
}

void setup() {
  for (int p : {IN1, IN2, IN3, IN4}) pinMode(p, OUTPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
  WiFi.softAP("ESP32-Car-1", "12345678");
  server.on("/", [] { server.send(200, "text/html; charset=utf-8", PAGE); });
  server.on("/j", [] {
    jx = server.arg("x").toInt();
    jy = server.arg("y").toInt();
    lastCmd = millis();
    server.send(200, "text/plain", "ok");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  if (millis() - lastCmd > 400) { jx = 0; jy = 0; }   // انقطع الجوال؟ قف
  int l = (jy + jx) * 255 / 100;   // المزج: الأمام + الانعطاف
  int r = (jy - jx) * 255 / 100;
  motors(l, r);
}
