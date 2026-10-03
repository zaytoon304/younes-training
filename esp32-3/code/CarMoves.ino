// 🤖١ السيارة العادية: حركات مبرمجة + رسم مربع — المحور ٣
// L298N: الأيسر ENA 14 · IN1 16 · IN2 17 — الأيمن ENB 32 · IN3 21 · IN4 22
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;
const int SPEED = 200;
const int TURN90 = 380;   // زمن استدارة ٩٠ درجة بالمللي ثانية: اضبطه لسيارتك
int trimL = 0, trimR = 0; // معايرة: إن انحرفت السيارة يمينًا أنقص trimL قليلًا

void motors(int l, int r) {
  l = constrain(l + (l ? trimL : 0), -255, 255);
  r = constrain(r + (r ? trimR : 0), -255, 255);
  digitalWrite(IN1, l > 0); digitalWrite(IN2, l < 0); ledcWrite(ENA, abs(l));
  digitalWrite(IN3, r > 0); digitalWrite(IN4, r < 0); ledcWrite(ENB, abs(r));
}

void forward(int ms) { motors(SPEED, SPEED);   delay(ms); }
void back(int ms)    { motors(-SPEED, -SPEED); delay(ms); }
void left(int ms)    { motors(-SPEED, SPEED);  delay(ms); }
void right(int ms)   { motors(SPEED, -SPEED);  delay(ms); }
void stopCar(int ms) { motors(0, 0);           delay(ms); }

void setup() {
  for (int p : {IN1, IN2, IN3, IN4}) pinMode(p, OUTPUT);
  ledcAttach(ENA, 1000, 8);
  ledcAttach(ENB, 1000, 8);
  delay(2000);              // ثانيتان لتضع السيارة على الأرض
}

void loop() {
  for (int i = 0; i < 4; i++) {   // مربع: أمام ثم يمين… أربع مرات
    forward(1000);
    stopCar(200);
    right(TURN90);
    stopCar(200);
  }
  stopCar(3000);
}
