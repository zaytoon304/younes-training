// البوابة الذكية — المحور ٦
// سيرفو: الإشارة ← GPIO18 · الطاقة ← VIN (5V) · GND مشترك
// HC-SR04: Trig ← 26 · Echo ← (مقسم جهد) ← 27
#include <ESP32Servo.h>

Servo gate;
int trig = 26;
int echo = 27;

void setup() {
  Serial.begin(115200);
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  gate.attach(18, 500, 2400);   // نبضة من ٥٠٠ إلى ٢٤٠٠ ميكروثانية
  gate.write(0);                // مغلقة
}

float readCm() {
  digitalWrite(trig, LOW);  delayMicroseconds(2);
  digitalWrite(trig, HIGH); delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long us = pulseIn(echo, HIGH, 30000);
  return us ? us * 0.0343 / 2 : 999;
}

void loop() {
  float cm = readCm();
  if (cm < 20) {
    Serial.println("سيارة! افتح البوابة");
    for (int a = 0; a <= 90; a += 2) { gate.write(a); delay(15); }   // فتح ناعم
    delay(3000);
    for (int a = 90; a >= 0; a -= 2) { gate.write(a); delay(15); }   // إغلاق ناعم
  }
  delay(100);
}
