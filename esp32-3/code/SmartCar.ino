// 🤖٦ السيارة المتكاملة: كل ما بنيناه في سيارة واحدة… واختر «العقل» من جوالك — المحور ٨
// اتصل بـ SmartCar-1 (12345678) ثم افتح 192.168.4.1
// الأوضاع: m يدوي (عصا) · a تجنب العوائق · l تتبع الخط · c خط + عوائق · x قف
#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
const int TRIG = 26, ECHO = 27;
const int SL = 34, SC = 35, SR = 39;
const int FAST = 190, SLOW = 60, TURN45 = 190;
char mode = 'x';
int jx = 0, jy = 0, lastSide = 0;
unsigned long lastCmd = 0;
float cm = 999;

const char PAGE[] PROGMEM = R"HTML(<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>السيارة الذكية</title>
<style>body{margin:0;font-family:sans-serif;background:#101b45;color:#fff;text-align:center;user-select:none;touch-action:none}
.m{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px}
.m b{padding:14px 4px;border-radius:14px;background:#2e4288;font-size:18px}.m b.on{background:#f0cc7a;color:#101b45}
#pad{width:240px;height:240px;border-radius:50%;background:#2e4288;margin:14px auto;position:relative;border:6px solid #8d9bd0}
#k{width:90px;height:90px;border-radius:50%;background:#f0cc7a;position:absolute;left:75px;top:75px}
#s{font-size:20px}</style></head><body><h3>🤖 السيارة الذكية</h3>
<div class="m"><b data-m="m">🎮 يدوي</b><b data-m="a">🧱 عوائق</b><b data-m="l">〰️ خط</b><b data-m="c">🔀 خط+عوائق</b><b data-m="x">⏹️ قف</b></div>
<div id="pad"><div id="k"></div></div><div id="s">—</div>
<script>
let x=0,y=0,on=false;const pad=document.getElementById('pad'),k=document.getElementById('k');
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>fetch('/mode?m='+b.dataset.m));
function mv(e){const r=pad.getBoundingClientRect();let dx=e.clientX-r.left-120,dy=e.clientY-r.top-120;
 const d=Math.hypot(dx,dy);if(d>95){dx*=95/d;dy*=95/d;}k.style.left=(75+dx)+'px';k.style.top=(75+dy)+'px';
 x=Math.round(dx/.95);y=Math.round(-dy/.95);}
pad.onpointerdown=e=>{on=true;pad.setPointerCapture(e.pointerId);mv(e);};
pad.onpointermove=e=>{if(on)mv(e);};
pad.onpointerup=()=>{on=false;x=y=0;k.style.left=k.style.top='75px';};
setInterval(()=>fetch('/j?x='+x+'&y='+y),120);
setInterval(()=>fetch('/st').then(r=>r.json()).then(j=>{
 document.querySelectorAll('[data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m==j.m));
 s.textContent='المسافة '+j.cm+' سم · الخط '+j.l+j.c+j.r;}),500);
</script></body></html>)HTML";

void motors(int l, int r) {
  l = constrain(l, -255, 255); r = constrain(r, -255, 255);
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

// انتظار «يسمع»: بدل delay — يخدم الجوال أثناء الانتظار، ويتوقف إن تغيّر الوضع
bool wait(int ms, char was) {
  unsigned long t = millis();
  while (millis() - t < ms) { server.handleClient(); if (mode != was) return false; }
  return true;
}

bool lineSeen() { return digitalRead(SL) || digitalRead(SC) || digitalRead(SR); }

void followLine() {
  int l = digitalRead(SL), c = digitalRead(SC), r = digitalRead(SR);
  if (c && !l && !r)      motors(FAST, FAST);
  else if (l && !r)     { motors(SLOW, FAST); lastSide = -1; }
  else if (r && !l)     { motors(FAST, SLOW); lastSide = 1; }
  else if (l && c && r)   motors(FAST, FAST);
  else                    motors(150 * lastSide, -150 * lastSide);
}

void avoidObstacle() {               // من المحور الرابع
  if (cm > 60) { motors(200, 200); return; }
  if (cm > 25) { int s = map(cm, 25, 60, 120, 200); motors(s, s); return; }
  motors(-200, -200);  if (!wait(250, 'a')) return;
  motors(200, -200);   if (!wait(TURN45, 'a')) return;
  motors(0, 0);        if (!wait(100, 'a')) return;
  float right = readCm();
  motors(-200, 200);   if (!wait(TURN45 * 2, 'a')) return;
  motors(0, 0);        if (!wait(100, 'a')) return;
  if (right > readCm()) { motors(200, -200); wait(TURN45 * 2, 'a'); }
}

void goAround() {                    // من المحور السادس
  motors(FAST, -FAST); if (!wait(TURN45, 'c')) return;
  motors(FAST, FAST);  if (!wait(500, 'c')) return;
  unsigned long t0 = millis();
  while (!lineSeen() && millis() - t0 < 4000) { motors(110, 210); if (!wait(5, 'c')) return; }
  motors(FAST, FAST);  if (!wait(120, 'c')) return;
  while (!digitalRead(SC) && millis() - t0 < 6000) { motors(-140, 140); if (!wait(5, 'c')) return; }
  lastSide = -1;
}

void manual() {                      // من المحور الرابع… مع حماية من الاصطدام
  if (millis() - lastCmd > 400) jx = jy = 0;
  if (jy > 0 && cm < 20) jy = 0;
  motors((jy + jx) * 255 / 100, (jy - jx) * 255 / 100);
}

void setup() {
  for (int p : {IN1, IN2, IN3, IN4, TRIG}) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT); pinMode(SL, INPUT); pinMode(SC, INPUT); pinMode(SR, INPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
  WiFi.softAP("SmartCar-1", "12345678");
  server.on("/", [] { server.send(200, "text/html; charset=utf-8", PAGE); });
  server.on("/mode", [] { mode = server.arg("m")[0]; motors(0, 0); server.send(200, "text/plain", "ok"); });
  server.on("/j", [] { jx = server.arg("x").toInt(); jy = server.arg("y").toInt(); lastCmd = millis(); server.send(200, "text/plain", "ok"); });
  server.on("/st", [] {
    String j = "{\"m\":\"" + String(mode) + "\",\"cm\":" + String(cm, 0) + ",\"l\":" + digitalRead(SL) +
               ",\"c\":" + digitalRead(SC) + ",\"r\":" + digitalRead(SR) + "}";
    server.send(200, "application/json", j);
  });
  server.begin();
}

void loop() {
  server.handleClient();
  static unsigned long last = 0;
  if (millis() - last < 30) return;  // العقل يفكر ٣٣ مرة في الثانية
  last = millis();
  cm = readCm();
  switch (mode) {
    case 'm': manual(); break;
    case 'a': avoidObstacle(); break;
    case 'l': followLine(); break;
    case 'c': if (cm < 15) goAround(); else followLine(); break;
    default:  motors(0, 0);
  }
}
