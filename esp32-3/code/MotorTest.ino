// فحص المحركين بعد التركيب — المحور ٢
// كل محرك وحده: أمام ثانية ثم خلف ثانية. راقب العجلة وقارن بما تطبعه الشاشة التسلسلية
// L298N: الأيسر ENA 14 · IN1 16 · IN2 17 — الأيمن ENB 32 · IN3 21 · IN4 22
const int ENA = 14, IN1 = 16, IN2 = 17;
const int ENB = 32, IN3 = 21, IN4 = 22;

void motorL(int s) { digitalWrite(IN1, s > 0); digitalWrite(IN2, s < 0); ledcWrite(ENA, abs(s)); }
void motorR(int s) { digitalWrite(IN3, s > 0); digitalWrite(IN4, s < 0); ledcWrite(ENB, abs(s)); }

void setup() {
  Serial.begin(115200);
  for (int p : {IN1, IN2, IN3, IN4}) pinMode(p, OUTPUT);
  ledcAttach(ENA, 1000, 8);         // ١ كيلوهرتز: مناسب للمحركات
  ledcAttach(ENB, 1000, 8);
}

void loop() {
  Serial.println("الأيسر للأمام");  motorL(200);  delay(1000); motorL(0); delay(500);
  Serial.println("الأيسر للخلف");   motorL(-200); delay(1000); motorL(0); delay(500);
  Serial.println("الأيمن للأمام");  motorR(200);  delay(1000); motorR(0); delay(500);
  Serial.println("الأيمن للخلف");   motorR(-200); delay(1000); motorR(0);
  Serial.println("— إن دارت عجلة عكس المكتوب: بدّل سلكي ذلك المحرك على الدرايفر —");
  delay(3000);
}
