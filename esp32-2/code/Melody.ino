// لحن على البازر — المحور ٥
// البازر السلبي ← GPIO13
int buzzer = 13;
int notes[] = {262, 294, 330, 349, 392, 392, 440, 392};   // دو ري مي فا صول صول لا صول
int beats[] = {300, 300, 300, 300, 600, 300, 300, 900};

void setup() {
  ledcAttach(buzzer, 2000, 8);
  for (int i = 0; i < 8; i++) {
    ledcWriteTone(buzzer, notes[i]);
    delay(beats[i]);
    ledcWriteTone(buzzer, 0);
    delay(40);                       // فاصل صغير بين النغمات
  }
}

void loop() {}
