/* المحور ٦: كيف نحرّك الأومني — الرياضيات البسيطة */
DECK.modules.push({ id: 'motor', name: 'تحريك الأومني', slides: [
  { t: 'section', num: '٦', title: 'تحريك الأومني',
    sub: 'معادلتان فقط — وثلاثة أسطر — وتتحرك في أي اتجاه',
    notes: 'قل: «هذا هو قلب الدورة. إذا فهمت هذه المعادلات فهمت كيف يعمل أي روبوت أومني في العالم».' },

  { t: 'cards', kicker: '⚙️ كيف نتحكم في اتجاه المحرك؟', title: 'دالة setMotor — الأساس',
    cards: [
      { icon: '▶️', h: 'للأمام: IA=HIGH، IB=LOW', b: 'analogWrite(ia, speed) يضبط السرعة. digitalWrite(ib, LOW) يوقف الاتجاه الآخر. النتيجة: دوران للأمام.' },
      { icon: '◀️', h: 'للخلف: IA=LOW، IB=HIGH', b: 'نعكس القيمتين. المحرك يدور بنفس السرعة لكن في الاتجاه المعاكس.' },
      { icon: '⏹', h: 'توقف: IA=LOW، IB=LOW', b: 'كلاهما صفر = لا تيار = الموتور يتوقف ببطء (توقف ناعم).' },
    ],
    notes: 'لمستخدمي L298N: analogWrite(en, abs(spd)) للسرعة، ثم digitalWrite(inA/inB) للاتجاه.' },

  { t: 'code', reveal: true, kicker: '💻 كود المحركات — سطرًا سطرًا', title: 'setMotor و moveOmni',
    file: 'OmniCar.ino',
    code: `/* === للـ L9110S === */
void setMotor(int ia, int ib, int spd) {
  spd = constrain(spd, -255, 255);
  if (spd >= 0) {
    analogWrite(ia, spd);
    analogWrite(ib, 0);
  } else {
    analogWrite(ia, 0);
    analogWrite(ib, -spd);
  }
}

/* === نفس الدالة للـ L298N ===
void setMotor(int en, int inA, int inB, int spd) {
  spd = constrain(spd, -255, 255);
  analogWrite(en, abs(spd));
  digitalWrite(inA, spd >= 0 ? HIGH : LOW);
  digitalWrite(inB, spd >= 0 ? LOW  : HIGH);
} */

void moveOmni(int vx, int vy, int rot) {
  int M1 = vy;
  int M2 = -vy / 2 + vx * 87 / 100;
  int M3 = -vy / 2 - vx * 87 / 100;
  M1 = constrain(M1 + rot, -255, 255);
  M2 = constrain(M2 + rot, -255, 255);
  M3 = constrain(M3 + rot, -255, 255);
  setMotor(IA1, IB1, M1);
  setMotor(IA2, IB2, M2);
  setMotor(IA3, IB3, M3);
}`,
    steps: [
      { lines: [2, 3], text: '🔒 constrain تمنع السرعة من تجاوز حد الـ PWM (-255 إلى 255). مثل حارس المرمى — يمنع الكرة من الخروج عن الملعب.' },
      { lines: [4, 5, 6], text: '▶️ إذا كانت السرعة موجبة (للأمام): نرسل السرعة لـ ia، ونضع ib على صفر. النتيجة: دوران للأمام.' },
      { lines: [7, 8, 9], text: '◀️ إذا كانت السرعة سالبة (للخلف): نضع ia على صفر ونرسل القيمة المطلقة لـ ib. عكس الاتجاه.' },
      { lines: [13, 14, 15, 16, 17, 18], text: '🔀 هذه نسخة L298N من نفس الدالة. الفرق: ثلاث أرجل بدل اثنتين (en للسرعة، inA/inB للاتجاه). احذف الـ /* */ لاستخدامها.' },
      { lines: [21], text: '① المحرك الأمامي (M1) = vy مباشرة. تريد التحرك للأمام؟ M1 يدور بكامل قوتك. رياضيًا: M1 = sin(90°) × vy.' },
      { lines: [22], text: '② المحرك اليمين-خلف (M2). الرقم 87/100 هو تقريب cos(30°) = √3/2 ≈ 0.866. نستخدم أعدادًا صحيحة لتجنب الكسور في الـ ESP32.' },
      { lines: [23], text: '③ المحرك اليسار-خلف (M3). مثل M2 لكن علامة vx معكوسة. هكذا عندما تتحرك لليمين، M2 يدفع ← وM3 يدفع → في توازن.' },
      { lines: [24, 25, 26], text: '🔄 نضيف الدوران (rot) لكل محرك. هذا ما يجعل الروبوت يدور في مكانه: كل محرك يضيف نفس قدر الدوران. constrain تمنع التجاوز.' },
      { lines: [27, 28, 29], text: '🚀 أخيرًا: أرسل القيم المحسوبة لكل محرك. هذه الثلاثة أسطر هي النتيجة النهائية لكل العمليات.' },
    ],
    notes: 'اطلب من متدرب شرح المعادلة بالعربية الدارجة: "M1 = vy يعني ابن ما قلته فيه للأمام/الخلف".' },

  { t: 'omnimath', kicker: '🎮 جرّب المعادلة', title: 'حرّك السلايدر وشاهد المحركات',
    notes: 'حرّك vx و vy وشاهد كيف تتغير قيم M1 و M2 و M3 فورًا. هذا هو الكود يعمل بصريًا.' },
]});
