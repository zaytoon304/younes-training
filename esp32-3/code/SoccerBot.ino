// ⚽ روبوت كرة القدم: ثلاثة محركات (اثنان أمام وواحد خلف) تتحرك في كل اتجاه — المحاور ١٠–١٢
// اتصل بشبكة فريقك Soccer-Blue (12345678) ثم افتح 192.168.4.1
// الدرايفر الأول: M1 أمامي أيسر ← 14 · 16 · 17   M2 أمامي أيمن ← 32 · 21 · 22
// الدرايفر الثاني: M3 خلفي ← 25 · 33 · 19
#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);
const char* TEAM = "Soccer-Blue";        // الفريق الآخر: Soccer-Red
const int EN[3]  = {14, 32, 25};
const int INA[3] = {16, 21, 33};
const int INB[3] = {17, 22, 19};
float vx = 0, vy = 0, w = 0;             // الأمر الحالي من الجوال
bool turbo = false;
unsigned long lastCmd = 0;

const char PAGE[] PROGMEM = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>⚽ روبوتي</title>
<style>body{margin:0;font-family:sans-serif;background:#0d3b22;color:#fff;user-select:none;touch-action:none;text-align:center}
.w{display:flex;justify-content:space-around;align-items:center;margin-top:20px}
#pad{width:230px;height:230px;border-radius:50%;background:#14532d;position:relative;border:6px solid #9be7b4}
#k{width:86px;height:86px;border-radius:50%;background:#fff;position:absolute;left:72px;top:72px}
.r{display:flex;flex-direction:column;gap:12px}.r b{width:96px;height:80px;border-radius:18px;background:#1f7a45;display:flex;align-items:center;justify-content:center;font-size:34px}
.r b.on{background:#f0cc7a;color:#0d3b22}</style></head><body><h3>⚽ روبوتي</h3><div class="w">
<div class="r"><b id="cc">⟲</b><b id="cw">⟳</b><b id="tb">🚀</b></div><div id="pad"><div id="k"></div></div></div>
<script>
let x=0,y=0,r=0,t=0,on=false;const pad=document.getElementById('pad'),k=document.getElementById('k');
function mv(e){const b=pad.getBoundingClientRect();let dx=e.clientX-b.left-115,dy=e.clientY-b.top-115;
 const d=Math.hypot(dx,dy);if(d>90){dx*=90/d;dy*=90/d;}k.style.left=(72+dx)+'px';k.style.top=(72+dy)+'px';
 x=Math.round(-dy/.9);y=Math.round(-dx/.9);}
pad.onpointerdown=e=>{on=true;pad.setPointerCapture(e.pointerId);mv(e);};
pad.onpointermove=e=>{if(on)mv(e);};
pad.onpointerup=()=>{on=false;x=y=0;k.style.left=k.style.top='72px';};
const hold=(id,f,g)=>{const b=document.getElementById(id);b.onpointerdown=()=>{f();b.classList.add('on');};b.onpointerup=b.onpointerleave=()=>{g();b.classList.remove('on');};};
hold('cc',()=>r=60,()=>r=0);hold('cw',()=>r=-60,()=>r=0);
document.getElementById('tb').onclick=e=>{t=1-t;e.target.classList.toggle('on',t);};
setInterval(()=>fetch('/j?x='+x+'&y='+y+'&r='+r+'&t='+t),80);
</script></body></html>)HTML";

void motor(int i, int s) {
  s = constrain(s, -255, 255);
  digitalWrite(INA[i], s > 0); digitalWrite(INB[i], s < 0); ledcWrite(EN[i], abs(s));
}

void drive(float vx, float vy, float w) {
  float m[3] = { -0.866 * vx + 0.5 * vy + w,
                  0.866 * vx + 0.5 * vy + w,
                              -1.0 * vy + w };
  float big = max(1.0f, max(fabs(m[0]), max(fabs(m[1]), fabs(m[2]))));
  int top = turbo ? 255 : 180;           // السرعة العادية ٧٠٪ للتحكم الدقيق
  for (int i = 0; i < 3; i++) motor(i, m[i] / big * top);
}

void setup() {
  for (int i = 0; i < 3; i++) {
    pinMode(INA[i], OUTPUT); pinMode(INB[i], OUTPUT);
    ledcAttach(EN[i], 1000, 8);
  }
  WiFi.softAP(TEAM, "12345678");
  server.on("/", [] { server.send(200, "text/html; charset=utf-8", PAGE); });
  server.on("/j", [] {
    vx = server.arg("x").toInt() / 100.0;   // للأمام
    vy = server.arg("y").toInt() / 100.0;   // لليسار
    w  = server.arg("r").toInt() / 100.0;   // دوران
    turbo = server.arg("t") == "1";
    lastCmd = millis();
    server.send(200, "text/plain", "ok");
  });
  server.begin();
}

void loop() {
  server.handleClient();
  if (millis() - lastCmd > 300) { vx = vy = w = 0; }   // أمان: انقطع الجوال؟ قف
  drive(vx, vy, w);
}
