// ⚽ اختبار القاعدة الثلاثية (كيوي): ثلاثة محركات وعجلات أومني — المحور ١٠
// M1 أمامي أيسر (عند ٦٠°) · M2 أمامي أيمن (عند −٦٠°) · M3 خلفي (عند ١٨٠°)
// الدرايفر الأول L298N: M1 ← ENA 14 · IN1 16 · IN2 17 · M2 ← ENB 32 · IN3 21 · IN4 22
// الدرايفر الثاني L298N: M3 ← ENA 25 · IN1 33 · IN2 19
const int EN[3]  = {14, 32, 25};
const int INA[3] = {16, 21, 33};
const int INB[3] = {17, 22, 19};

void motor(int i, int s) {          // i = 0 أو 1 أو 2 · s من -255 إلى 255
  s = constrain(s, -255, 255);
  digitalWrite(INA[i], s > 0); digitalWrite(INB[i], s < 0); ledcWrite(EN[i], abs(s));
}

// vx للأمام · vy لليسار · w للدوران عكس عقارب الساعة — كل منها من -1 إلى 1
void drive(float vx, float vy, float w) {
  float m[3] = {
    -0.866 * vx + 0.5 * vy + w,      // M1 عند ٦٠°
     0.866 * vx + 0.5 * vy + w,      // M2 عند −٦٠°
                 -1.0 * vy + w       // M3 عند ١٨٠°
  };
  float big = max(1.0f, max(fabs(m[0]), max(fabs(m[1]), fabs(m[2]))));
  for (int i = 0; i < 3; i++) motor(i, m[i] / big * 255);   // لا تتجاوز ٢٥٥
  Serial.printf("M1 %4.0f · M2 %4.0f · M3 %4.0f\n", m[0] / big * 255, m[1] / big * 255, m[2] / big * 255);
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 3; i++) {
    pinMode(INA[i], OUTPUT); pinMode(INB[i], OUTPUT);
    ledcAttach(EN[i], 1000, 8);
  }
  delay(2000);
}

void loop() {
  Serial.println("⬆ للأمام");        drive(0.8, 0, 0);    delay(1200);
  Serial.println("⬇ للخلف");         drive(-0.8, 0, 0);   delay(1200);
  Serial.println("⬅ جانبيًا لليسار"); drive(0, 0.8, 0);    delay(1200);
  Serial.println("➡ جانبيًا لليمين"); drive(0, -0.8, 0);   delay(1200);
  Serial.println("↖ قطريًا");        drive(0.6, 0.6, 0);  delay(1200);
  Serial.println("⟲ دوران في المكان"); drive(0, 0, 0.6);    delay(1200);
  drive(0, 0, 0); delay(2500);
}
