/* المحور ٧: أول برنامج — الوميض */
DECK.modules.push({ id: 'blink', name: 'أول برنامج: الوميض', slides: [
  { t: 'section', num: '٧', title: 'أول برنامج: الوميض', sub: 'الليد الأزرق المدمج… ثم ليد على GPIO23',
    notes: 'لحظة الدورة الأولى: كل متدرب يجعل لوحته تومض.' },
  { t: 'numlist', kicker: '🎯 بنهاية هذا المحور تستطيع أن', title: 'أهداف المحور',
    items: [
      { h: 'تكتب setup وloop وتفهم كل سطر' },
      { h: 'تجعل الليد المدمج يومض بلا أي توصيل' },
      { h: 'تنقل الوميض إلى ليد خارجي على طرف آمن' },
      { h: 'تكتشف أخطاء الطرف الخطأ' },
    ]},
  { t: 'code', kicker: 'الخطوة الأولى', title: 'setup: التجهيز مرة واحدة', file: 'Blink.ino',
    code: `void setup() {
  pinMode(2, OUTPUT);   // الليد الأزرق المدمج
}`,
    note: 'pinMode(الطرف، OUTPUT): نخبر ESP32 أن الطرف 2 سيُخرج جهدًا. والطرف 2 متصل بالليد الأزرق في اللوحة.' },
  { t: 'code', kicker: 'الخطوة الثانية', title: 'loop: القلب الذي لا يتوقف', file: 'Blink.ino',
    code: `void loop() {
  digitalWrite(2, HIGH);   // ٣٫٣ فولت: يضيء
  delay(500);              // انتظر نصف ثانية
  digitalWrite(2, LOW);    // صفر: ينطفئ
  delay(500);
}`,
    note: 'HIGH في ESP32 تعني ٣٫٣ فولت لا ٥. وdelay بالمللي ثانية: ٥٠٠ = نصف ثانية.' },
  { t: 'codecheck', title: 'صح أم خطأ؟ اكتشف الأخطاء قبل الحاسوب',
    items: [
      { code: 'pinMode(2, OUTPUT);', ok: true, why: 'الليد المدمج على الطرف 2' },
      { code: 'digitalWrite(2, high);', ok: false, why: 'HIGH بأحرف كبيرة: C++ تفرّق بين الحروف' },
      { code: 'pinMode(34, OUTPUT); // ليد', ok: false, why: '34 مدخل فقط: لن يضيء' },
      { code: 'delay(1000); // ثانية', ok: true, why: '١٠٠٠ مللي ثانية = ثانية' },
    ]},
  { t: 'eblink', kicker: '💡 جرّب الآن', title: 'شغّل الوميض… وغيّر الطرف والسرعة',
    notes: 'ابدأ بـ GPIO2: الليد الأزرق المدمج. ثم GPIO23: الليد الخارجي يومض والسلك ظاهر. ثم 25. ثم 34: لا شيء! ورسالة تشرح السبب. غيّر WAIT إلى ١٠٠: وميض سريع.' },
  { t: 'build2', kind: 'eledw', kicker: '🔧 التركيب', title: 'ركّب دائرة الوميض الخارجية… قطعة قطعة', intro: 'GPIO23 + ٢٢٠ أوم + ليد',
    notes: 'نفس دائرة المحور الخامس: الآن نبرمجها.' },
  { t: 'code', reveal: true, kicker: '✍️ الكود الكامل', title: 'وميض على GPIO23', file: 'Blink23.ino',
    code: `int led = 23;

void setup() {
  pinMode(led, OUTPUT);
}

void loop() {
  digitalWrite(led, HIGH);
  delay(500);
  digitalWrite(led, LOW);
  delay(500);
}`,
    steps: [
      { lines: [1], text: 'متغير باسم واضح: لو نقلنا الليد غيّرنا هذا السطر فقط' },
      { lines: [4], text: 'الطرف مخرج' },
      { lines: [8, 9], text: 'يضيء نصف ثانية' },
      { lines: [10, 11], text: 'ينطفئ نصف ثانية… وتعود loop من أولها' },
    ],
    notes: 'هذا الملف ضمن «حقيبة الأكواد» في آخر الدورة: يُنزَّل ويُرفع مباشرة.' },
  { t: 'numlist', kicker: 'خطوة بخطوة', title: 'ابنِ مشروع الوميض',
    items: [
      { h: 'جرّب في Wokwi أولًا', b: 'ESP32 + ليد + مقاومة، والصق الكود' },
      { h: 'ركّب على الطاولة', b: 'GPIO23 ← ٢٢٠ أوم ← ليد ← GND' },
      { h: 'ارفع', b: 'ESP32 Dev Module والمنفذ، وBOOT إن احتجت' },
      { h: 'غيّر وجرّب', b: 'السرعة، والطرف (من الآمنة فقط)' },
    ]},
  { t: 'vote', tap: true, kicker: '✅ اختبر نفسك', title: 'الليد على 34 لا يضيء أبدًا رغم صحة الدائرة. لماذا؟', correct: 1,
    options: ['المقاومة كبيرة', '34 مدخل فقط ولا يُخرج جهدًا', 'delay قصيرة'],
    why: [
      'لو كانت كبيرة لأضاء خافتًا',
      'صحيح: انقله إلى 23 أو أي طرف آمن',
      'لا علاقة لها',
    ]},
  { t: 'code', kicker: 'تحدٍّ', title: 'اجعل الليد ينبض كالقلب', file: 'Heartbeat.ino',
    code: `void loop() {
  digitalWrite(2, HIGH); delay(100);
  digitalWrite(2, LOW);  delay(100);
  digitalWrite(2, HIGH); delay(100);
  digitalWrite(2, LOW);  delay(700);
}`,
    note: 'نبضتان سريعتان ثم راحة: إيقاع القلب «دُق دُق… دُق دُق».' },
  { t: 'glossary', title: 'مصطلحات المحور السابع',
    terms: [
      { en: 'pinMode', ar: 'وضع الطرف', b: 'مدخل أو مخرج' },
      { en: 'digitalWrite', ar: 'الكتابة الرقمية', b: 'HIGH (٣٫٣ فولت) أو LOW' },
      { en: 'delay', ar: 'الانتظار', b: 'بالمللي ثانية' },
      { en: 'LED_BUILTIN', ar: 'الليد المدمج', b: 'GPIO2 في DevKit' },
      { en: 'Sketch', ar: 'البرنامج', b: 'ملف ‎.ino' },
      { en: 'Upload', ar: 'الرفع', b: 'من الحاسوب إلى اللوحة' },
    ]},
  { t: 'teach', title: 'تدريس أول برنامج',
    mistakes: [
      'نسيان الفاصلة المنقوطة',
      'high بدل HIGH',
      'ليد على 34 أو 12',
    ],
    activity: { title: '«رسائل الضوء»', time: '٢٥ دقيقة', steps: [
      'كل مجموعة تختار كلمة قصيرة',
      'تحولها إلى ومضات طويلة وقصيرة (مورس)',
      'المجموعات الأخرى تفك الرسالة من الضوء',
    ]},
    notes: 'نشاط مورس يجعل الطلاب يكتبون عشرات الأسطر من digitalWrite وdelay بحماس.' },
  { t: 'statement', kicker: 'خلاصة المحور',
    text: 'أربعة أسطر في loop… والليد الأزرق يومض: هذه بداية كل شيء',
    notes: 'المحور التالي: ثلاثة ليدات، وإشارة مرور، ومتغيرات.' },
]});
