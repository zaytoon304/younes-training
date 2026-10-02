/* المحور ١١: آلة الحالات — كود بلا حبس */
DECK.modules.push({ id: 'states', name: '🔀 آلة الحالات', slides: [
  { t: 'section', num: '١١', title: '🔀 آلة الحالات', sub: 'من كود «يعمل» إلى كود عالمي: لا delay طويلة، ولا أزرار في غير وقتها',
    notes: 'كودنا في المحور التاسع يعمل… لكنه يحبس الروبوت في delay وwhile. هنا نعيد كتابته كما يكتبه المحترفون.' },
  { t: 'numlist', kicker: '🎯 بنهاية هذا المحور تستطيع أن', title: 'أهداف المحور',
    items: [
      { h: 'تقسّم الجولة إلى ست حالات واضحة' },
      { h: 'تكتبها بـ enum وswitch' },
      { h: 'تقفل الأزرار التي لا تناسب الحالة' },
      { h: 'تدير الحركة والصوت دون حبس (non-blocking)' },
    ]},
  { t: 'table', kicker: 'جدول الحالات من ملف الفريق', title: 'ست حالات… كل منها تنتظر شيئًا واحدًا',
    head: ['الحالة', 'ماذا تنتظر؟', 'الانتقال'], widths: ['0.9fr', '1.3fr', '1.4fr'],
    rows: [
      ['WAIT انتظار زائر', 'مسافة مناسبة من HC-SR04', 'ترحيب ← CHOOSE'],
      ['CHOOSE اختيار عنصر', 'ضغط أحد أزرار المحطات', 'دوران ومحتوى ← BUSY'],
      ['BUSY انشغال', 'انتهاء الحركة والصوت', 'السؤال الأول ← ANS1'],
      ['ANS1 إجابة أولى', 'إجابة الطفل', 'عملة ← CHOOSE · أو مساعد ← ANS2'],
      ['ANS2 إجابة ثانية', 'إجابة بعد المساعدة', 'مع أو دون عملة ← CHOOSE'],
      ['DONE نهاية الجولة', 'انتهاء الوقت أو العملات الأربع', 'إعادة الضبط ← WAIT'],
    ],
    notes: 'ارسموا الحالات دوائر على السبورة والأسهم بينها، قبل أي كود. هذا الرسم هو «التصميم»، والكود ترجمته.' },
  { t: 'statelab', title: 'آلة الحالات الحية: جرّب الأحداث… حتى في غير وقتها',
    notes: 'ابدأ بـ «اقترب طفل»، ثم «زر محطة»، ثم «انتهت الحركة والصوت»، ثم «إجابة خاطئة» ثم «صحيحة». الآن جرّب الخطأ: اضغط «زر محطة» وأنت في BUSY: مرفوض! «الأزرار مقفلة أثناء الدوران». هذا ما كتبه الفريق: «لا يقبل الروبوت الأزرار التي لا تناسب الحالة الحالية».' },
  { t: 'code', reveal: true, kicker: '✍️ القلب الجديد', title: 'loop بآلة الحالات', file: 'HeritageMemoryMaker.ino',
    code: `enum State { WAIT, CHOOSE, BUSY, ANS1, ANS2, DONE };
State st = WAIT;

void loop() {
  switch (st) {
    case WAIT:   if (visitorHere()) { welcome(); st = CHOOSE; } break;
    case CHOOSE: { int s = readStation(); if (s >= 0) { start(s); st = BUSY; } } break;
    case BUSY:   if (moveDone() && audioDone()) { askQ1(); st = ANS1; } break;
    case ANS1:   onAnswer1(); break;
    case ANS2:   onAnswer2(); break;
    case DONE:   if (timeUp() || allCoins()) { reset(); st = WAIT; } break;
  }
  runMotor(); showTimer();
}`,
    steps: [
      { lines: [1], text: 'enum: أسماء مفهومة للحالات الست بدل أرقام' },
      { lines: [2], text: 'الروبوت يبدأ منتظرًا' },
      { lines: [5], text: 'switch: في كل دورة ننفذ سطر الحالة الحالية فقط' },
      { lines: [7], text: 'في CHOOSE فقط نقرأ أزرار المحطات: في غيرها لا تعمل. هذا هو «القفل»' },
      { lines: [8], text: 'BUSY لا تنتظر بـ delay: تسأل «هل انتهيت؟» وتمضي' },
      { lines: [14], text: 'والمحرك والمؤقت يعملان في كل دورة، مهما كانت الحالة' },
    ],
    notes: 'لا delay طويلة في أي مكان! loop تدور آلاف المرات في الثانية، وفي كل مرة تفعل شيئًا صغيرًا. هكذا يرى الحساس ويتحدث المؤقت ويدور المحرك… معًا.' },
  { t: 'code', reveal: true, kicker: '✍️ المحرك بلا حبس', title: 'خطوة واحدة في كل دورة', file: 'HeritageMemoryMaker.ino',
    code: `int stepsLeft = 0;

void start(int s) {
  int d = (s - here + 4) % 4;
  if (d == 3) d = -1;
  stepsLeft = d * stepsQuarter;
  here = s; coinGiven = false;
  lcd.clear(); lcd.print(NAME[s]);
}

void runMotor() {
  if (stepsLeft == 0) return;
  plat.step(stepsLeft > 0 ? 1 : -1);
  stepsLeft += stepsLeft > 0 ? -1 : 1;
}

bool moveDone() { return stepsLeft == 0; }`,
    steps: [
      { lines: [1], text: 'كم خطوة باقية؟ صفر = المنصة واقفة' },
      { lines: [3, 6], text: 'start لا تدير المحرك! تكتب فقط «كم خطوة نحتاج»' },
      { lines: [7], text: 'ونفتح قفل العملة للمحطة الجديدة' },
      { lines: [11, 12, 13, 14], text: 'runMotor: خطوة واحدة فقط، ثم نعود إلى loop' },
      { lines: [17], text: 'BUSY تسأل: هل انتهت الخطوات؟' },
    ],
    notes: 'نفس الفكرة للصوت: audioDone تسأل المشغّل «هل انتهيت؟» (df.available ثم DFPlayerPlayFinished) بدل delay(6000). هذا ما يسميه الفريق في ملفه: non-blocking.' },
  { t: 'codecheck', title: 'صح أم خطأ؟ آلة الحالات',
    items: [
      { code: 'case BUSY: delay(6000); st = ANS1;', ok: false, why: 'حبس: اسأل «هل انتهى؟» وامضِ' },
      { code: 'قراءة أزرار المحطات في كل الحالات', ok: false, why: 'في CHOOSE فقط: قفل مقصود' },
      { code: 'enum State { WAIT, CHOOSE, … };', ok: true, why: 'أسماء واضحة بدل أرقام' },
      { code: 'runMotor() خارج switch', ok: true, why: 'المحرك يعمل في أي حالة' },
    ]},
  { t: 'vote', tap: true, kicker: '✅ اختبر نفسك', title: 'طفل يضغط زر «السيف» والمنصة ما زالت تدور إلى الخيمة. ماذا يحدث؟', correct: 1,
    options: ['تتوقف وتذهب للسيف', 'لا شيء: الحالة BUSY لا تقرأ أزرار المحطات', 'يتعطل الروبوت'],
    why: [
      'هذا ما يحدث بلا آلة حالات: فوضى',
      'صحيح: قفل مقصود يحمي التجربة والتشغيل',
      'آلة الحالات تمنع ذلك',
    ]},
  { t: 'statement', kicker: 'خلاصة المحور',
    text: 'ست حالات، وswitch واحدة، ولا delay طويلة: الروبوت يرى ويسمع ويتحرك… في الوقت نفسه',
    notes: 'المحور التالي: منطق القرار المستقل والسؤال المساعد.' },
]});
