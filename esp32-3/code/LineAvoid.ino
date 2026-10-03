// 🤖٤ الدمج: يتبع الخط… ويلتف حول العائق… ثم يعود للخط — المحور ٦
// المحركات كما سبق · HC-SR04: Trig 26 · Echo 27 · الخط: 34 · 35 · 39
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
const int TRIG = 26, ECHO = 27;
const int SL = 34, SC = 35, SR = 39;
const int FAST = 190, SLOW = 60, TURN45 = 190;
int lastSide = 0;

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

bool lineSeen() { return digitalRead(SL) || digitalRead(SC) || digitalRead(SR); }

void followLine() {                 // من المحور الخامس كما هو
  int l = digitalRead(SL), c = digitalRead(SC), r = digitalRead(SR);
  if (c && !l && !r)      motors(FAST, FAST);
  else if (l && !r)     { motors(SLOW, FAST); lastSide = -1; }
  else if (r && !l)     { motors(FAST, SLOW); lastSide = 1; }
  else if (l && c && r)   motors(FAST, FAST);
  else                    motors(-150 * lastSide, 150 * lastSide);
}

void avoid() {                      // الالتفاف حول العائق من جهة اليمين
  motors(0, 0); delay(200);
  motors(FAST, -FAST); delay(TURN45);         // ١) انحرف يمينًا ٤٥°
  motors(FAST, FAST);  delay(500);            // ٢) ابتعد عن العائق
  unsigned long t0 = millis();
  while (!lineSeen() && millis() - t0 < 4000) // ٣) قوس واسع نحو اليسار حتى يظهر الخط
    motors(110, 210);
  motors(FAST, FAST); delay(120);             // ٤) اعبر الخط قليلًا
  while (!digitalRead(SC) && millis() - t0 < 6000)
    motors(-140, 140);                        // ٥) استدر حتى يصبح الخط تحت الحساس الأوسط
  lastSide = -1;
}

void setup() {
  for (int p : {IN1, IN2, IN3, IN4, TRIG}) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(SL, INPUT); pinMode(SC, INPUT); pinMode(SR, INPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
}

void loop() {
  if (readCm() < 15) { avoid(); return; }   // الأولوية للعائق
  followLine();
}
