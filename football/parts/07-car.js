/* المحور ٧: كود السيارة الكاملة */
DECK.modules.push({ id: 'car', name: 'كود السيارة', slides: [

  { t: 'section', num: '٧', title: 'كود السيارة الكاملة',
    sub: 'loop() مع Ramping + تسديد ذكي + ESP-NOW',
    notes: 'قل: «هذه النسخة النهائية من كود السيارة — تجمع كل ما تعلمناه في كود واحد محترف».' },

  { t: 'code', reveal: true, kicker: '💻 onReceive + loop() الكاملة', title: 'كود السيارة النهائي',
    file: 'OmniCar.ino',
    code: `// === استقبال البيانات من الجويستيك ===
void onReceive(const esp_now_recv_info_t*,
               const uint8_t* buf, int len) {
  if (len == sizeof(data))
    memcpy(&data, buf, len);
}

void loop() {
  // ① أولوية قصوى: التسديد
  if (data.kick) {
    // أوقف كل المحركات أولاً
    tgt1 = tgt2 = tgt3 = 0;
    cur1 = cur2 = cur3 = 0;
    driveMotor(W1_IN1, W1_IN2, W1_EN, 0);
    driveMotor(W2_IN1, W2_IN2, W2_EN, 0);
    driveMotor(W3_IN1, W3_IN2, W3_EN, 0);
    // ضرب!
    servo.write(130);
    delay(280);
    servo.write(0);
    data.kick = false;
    return;
  }

  // ② حساب أهداف المحركات
  moveOmni(data.vx, data.vy, data.rot);

  // ③ تطبيق Ramping كل 20ms
  unsigned long now = millis();
  if (now - lastLoop >= LOOP_MS) {
    lastLoop = now;
    cur1 += (tgt1 - cur1) * RAMP;
    cur2 += (tgt2 - cur2) * RAMP;
    cur3 += (tgt3 - cur3) * RAMP;
    if (abs(tgt1-cur1) < 1) cur1 = tgt1;
    if (abs(tgt2-cur2) < 1) cur2 = tgt2;
    if (abs(tgt3-cur3) < 1) cur3 = tgt3;
    driveMotor(W1_IN1, W1_IN2, W1_EN, cur1);
    driveMotor(W2_IN1, W2_IN2, W2_EN, cur2);
    driveMotor(W3_IN1, W3_IN2, W3_EN, cur3);
  }
}`,
    steps: [
      { lines: [2, 3, 4], text: '📡 onReceive — ينادى تلقائياً عند وصول رسالة. مثل جرس الباب: ما تحتاج تستنى وتسأل — الجرس ينادي بنفسه.' },
      { lines: [4, 5], text: '🔒 if(len == sizeof(data)) — لماذا؟ لأن رسالة ناقصة أو خاطئة تعطي بيانات عشوائية. هذا السطر يرفض أي رسالة لا تطابق حجم صندوقنا بالضبط.' },
      { lines: [10, 11], text: '⚽ data.kick — أولوية قصوى. لماذا نضعه أول شيء في loop()؟ لأن التسديد يجب أن يحدث فوراً — لا ننتظر دورة Ramping أو أي شيء آخر.' },
      { lines: [12, 13, 14, 15, 16], text: '🛑 لماذا نوقف المحركات أولاً قبل التسديد؟ لأن السيرفو يسحب تياراً كبيراً — لو المحركات شغّالة في نفس الوقت قد تنخفض طاقة البطارية وتتصرف المحركات بشكل غريب. الإيقاف الكامل (tgt=cur=0) يضمن أن كل الطاقة للتسديد.' },
      { lines: [18, 19, 20], text: '🦾 servo.write(130) — 130° بدلاً من 120°. لماذا؟ زاوية أكبر = ضربة أقوى. delay(280) = الوقت الكافي لتكتمل الضربة. بعدها servo.write(0) يُعيده لوضع الاستعداد.' },
      { lines: [21, 22], text: '🔄 data.kick = false — لمنع تكرار التسديد. return — نخرج من loop() فوراً بعد التسديد، لا نُشغّل المحركات في نفس الفريم.' },
      { lines: [25], text: '⚙️ moveOmni — يحسب الأهداف tgt1/tgt2/tgt3 من vx/vy/rot مع التطبيع. لا يُرسل للمحركات مباشرةً — يضع الأهداف فقط.' },
      { lines: [28, 29], text: '⏱️ millis() + LOOP_MS — لماذا نتحقق من الوقت؟ loop() تعمل ٥٠٠٠+ مرة/ثانية. لو أرسلنا للمحركات في كل مرة: ضوضاء كهربائية وإثقال. نُرسل فقط كل 20ms = 50 مرة/ثانية.' },
      { lines: [30, 31, 32], text: '📐 cur += (tgt-cur)×RAMP — قلب الـ Ramping. كل دورة: اقترب 12% من الهدف. النتيجة: حركة ناعمة تدريجية.' },
      { lines: [33, 34, 35], text: '🔒 abs(tgt-cur)<1 — عند الاقتراب الشديد: ثبّت. بدون هذا السطر: ESP32 سيُرسل 99.999 بدلاً من 100 إلى الأبد.' },
      { lines: [36, 37, 38], text: '🚗 driveMotor بـ cur (الحالي بعد الـ Ramping) — وليس tgt (الهدف). هذا هو المحرك يُشغَّل بالسرعة الفعلية الناعمة.' },
    ],
    notes: 'الكود الكامل: onReceive يُحدّث data. loop() تحسب الأهداف. كل 20ms: تطبّق Ramping وتُرسل للمحركات.' },

  { t: 'cards', kicker: '🗂️ هيكل الكود الكامل', title: 'ترتيب الأولويات في loop()',
    cards: [
      { icon: '①', h: 'التسديد — أعلى أولوية', b: 'if(data.kick) → أوقف المحركات → ضرب السيرفو → عُد. لا شيء يعلو على التسديد.' },
      { icon: '②', h: 'الحركة — الحالة الطبيعية', b: 'moveOmni حساب الأهداف. الـ Ramping كل 20ms. driveMotor للمحركات.' },
      { icon: '③', h: 'الاستقبال — في الخلفية', b: 'onReceive تعمل باستمرار بشكل مستقل. تُحدّث data عند وصول رسالة. loop() لا تعرف متى تصل الرسالة.' },
    ],
    notes: 'هذا التصميم "event-driven" — نمط محترف يُستخدم في أنظمة التحكم الصناعية.' },
]});
