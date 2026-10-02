/* =====================================================================
   «ESP32 للمعلمين — الجزء الأول» · الأدوات التفاعلية الخاصة بـ ESP32 DevKit V1 (30 طرفًا)
   eboard · epinmap · eupload · eblink · eohm · etraffic · eserial · epwm · ergb · ebutton · etouch · codebag
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
const raf = (sl, fn) => { let id = 0, last = 0; const loop = ts => { const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; fn(dt, ts); id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); window.DECK_CLEANUP.push(() => cancelAnimationFrame(id)); };

/* ================== أطراف DevKit V1 (30 طرفًا) ==================
   LEFT من أعلى (جهة الهوائي) إلى أسفل (جهة USB)، وRIGHT كذلك */
const LEFT = ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const RIGHT = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3'];
const GP = { VP: 36, VN: 39, TX0: 1, RX0: 3, TX2: 17, RX2: 16 };
const gpio = p => GP[p] ?? (p[0] === 'D' ? +p.slice(1) : null);
const CAT = {
  safe: { n: '✅ آمن للمخرجات', c: '#2e9e6b', g: [4, 13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33], d: 'أطراف عامة تخرج وتُدخل بلا مفاجآت. ابدأ بها دائمًا مع الطلاب.' },
  inonly: { n: '👁️ مدخلات فقط', c: '#e0b400', g: [34, 35, 36, 39], d: 'تقرأ فقط ولا تُخرج جهدًا، ولا مقاومة سحب داخلية فيها. ممتازة للحساسات.' },
  boot: { n: '⚠️ أطراف الإقلاع', c: '#e67e22', g: [2, 5, 12, 15], d: 'تحدد طريقة إقلاع اللوحة لحظة التشغيل. إن وصلت بها شيئًا قد تفشل اللوحة في الإقلاع أو الرفع. استعملها أخيرًا.' },
  serial: { n: '🔌 منفذ الحاسوب', c: '#c0392b', g: [1, 3], d: 'TX0 وRX0 يتصلان بالحاسوب عبر USB. لا تستعملهما وإلا تعطل الرفع والشاشة التسلسلية.' },
  adc1: { n: '📈 ADC1 تماثلي', c: '#2b6fc0', g: [32, 33, 34, 35, 36, 39], d: 'قراءة تماثلية من ٠ إلى ٤٠٩٥ (١٢ بت)، وتعمل دائمًا حتى مع الواي فاي.' },
  adc2: { n: '📡 ADC2', c: '#8e44ad', g: [0, 2, 4, 12, 13, 14, 15, 25, 26, 27], d: 'تماثلية أيضًا… لكنها لا تعمل حين يكون الواي فاي مشغّلًا! للحساسات في المشاريع اللاسلكية استعمل ADC1.' },
  touch: { n: '✋ لمس', c: '#16a3b5', g: [4, 2, 15, 13, 12, 14, 27, 33, 32], d: 'تحس بإصبعك دون أي زر! touchRead تعطي رقمًا ينخفض حين تلمس السلك.' },
  dac: { n: '🔊 DAC', c: '#d64545', g: [25, 26], d: 'تُخرج جهدًا تماثليًا حقيقيًا (٠–٣٫٣ فولت) لا نبضات: للأصوات والإشارات.' },
};
const PINFO = {
  EN: 'زر/طرف إعادة التشغيل: LOW يعيد تشغيل الشريحة.', GND: 'الأرضي (السالب).', VIN: 'دخل ٥ فولت (من USB أو مصدر خارجي).', '3V3': 'خرج ٣٫٣ فولت من منظّم اللوحة: لتغذية الحساسات الصغيرة.',
  D21: 'SDA الافتراضي لـ I2C (الشاشات والحساسات).', D22: 'SCL الافتراضي لـ I2C.', D23: 'MOSI لـ SPI، وطرف آمن ممتاز لليد.', D19: 'MISO لـ SPI.', D18: 'SCK لـ SPI.', D5: 'SS لـ SPI، وطرف إقلاع.',
  RX2: 'GPIO16: المنفذ التسلسلي الثاني UART2 (RX)، وآمن للمخرجات.', TX2: 'GPIO17: UART2 (TX)، وآمن للمخرجات.', D2: 'متصل بالليد الأزرق المدمج على أغلب اللوحات، وطرف إقلاع.',
  D25: 'DAC1، وآمن للمخرجات.', D26: 'DAC2، وآمن للمخرجات.', D4: 'لمس T0، وآمن، ومن ADC2.', D12: 'طرف إقلاع حساس: HIGH عند التشغيل قد يمنع الإقلاع.',
};

/* ================== رسم اللوحة (أفقيًا: USB يسار والهوائي يمين) ================== */
// صف علوي = LEFT معكوسًا (VIN جهة USB)، وسفلي = RIGHT معكوسًا (3V3 جهة USB)
const PX = i => 112 + i * 41;
const TOP = [...LEFT].reverse(), BOT = [...RIGHT].reverse();
function devkit(opt = {}) {
  const part = (k, inner) => opt.clickable ? `<g class="ebp" data-p="${k}">${inner}</g>` : inner;
  return `<g class="edev">
  <rect x="40" y="70" width="700" height="200" rx="14" class="ebpcb"/>
  ${part('usb', `<rect x="6" y="140" width="62" height="60" rx="6" fill="#c9ccd3" stroke="#6b7180" stroke-width="3"/><rect x="16" y="156" width="40" height="28" rx="4" fill="#3a3f4d"/>`)}
  ${part('uart', `<rect x="110" y="140" width="56" height="56" rx="4" fill="#1c1f27"/><text x="138" y="174" class="ebsilk">CP2102</text>`)}
  ${part('reg', `<rect x="190" y="200" width="44" height="30" rx="3" fill="#1c1f27"/>${[0, 1, 2].map(i => `<rect x="${196 + i * 13}" y="230" width="6" height="10" fill="#9aa1b3"/>`).join('')}<text x="212" y="219" class="ebsilk" style="font-size:9px">AMS1117</text>`)}
  ${part('en', `<rect x="84" y="88" width="34" height="34" rx="5" fill="#d9dde6" stroke="#6b7180" stroke-width="2"/><circle cx="101" cy="105" r="10" fill="#1c1f27"/><text x="101" y="138" class="ebsilk2">EN</text>`)}
  ${part('boot', `<rect x="84" y="210" width="34" height="34" rx="5" fill="#d9dde6" stroke="#6b7180" stroke-width="2"/><circle cx="101" cy="227" r="10" fill="#1c1f27" id="${opt.id || 'eb'}bootc"/><text x="101" y="205" class="ebsilk2">BOOT</text>`)}
  ${part('pled', `<rect x="250" y="96" width="18" height="12" rx="2" fill="#ff3b3b" class="ebpled"/><text x="259" y="125" class="ebsilk2">PWR</text>`)}
  ${part('bled', `<rect x="250" y="226" width="18" height="12" rx="2" class="ebbled" id="${opt.id || 'eb'}bled"/><text x="259" y="220" class="ebsilk2">IO2</text>`)}
  ${part('module', `<rect x="430" y="88" width="230" height="164" rx="6" fill="#c9ccd3" stroke="#8f97a8" stroke-width="3"/><text x="545" y="160" class="ebmod">ESP-WROOM-32</text><text x="545" y="186" class="ebsilk" style="fill:#3a3f4d">Wi-Fi · BT · 240MHz</text><text x="545" y="206" class="ebsilk" style="fill:#3a3f4d">2 × Xtensa LX6</text>`)}
  ${part('antenna', `<rect x="660" y="88" width="70" height="164" rx="4" fill="#1e6b3a"/><path d="M675 100 h40 v20 h-30 v20 h30 v20 h-30 v20 h30 v20 h-30 v20 h30 v18" fill="none" stroke="#e0b400" stroke-width="4"/>`)}
  ${part('pins', TOP.map((p, i) => `<circle cx="${PX(i)}" cy="80" r="7" class="ebhole" data-pin="${p}"/>`).join('') + BOT.map((p, i) => `<circle cx="${PX(i)}" cy="260" r="7" class="ebhole" data-pin="${p}"/>`).join(''))}
  ${TOP.map((p, i) => `<text x="${PX(i)}" y="56" class="ebpin" data-pl="${p}">${p}</text>`).join('')}${BOT.map((p, i) => `<text x="${PX(i)}" y="296" class="ebpin" data-pl="${p}">${p}</text>`).join('')}
</g>`;
}
const EPARTS = {
  module: { icon: '🧠', ar: 'وحدة ESP-WROOM-32', en: 'ESP32 Module', b: 'العقل: معالج بنواتين حتى ٢٤٠ ميجاهرتز، وذاكرة فلاش ٤ ميجابايت، وواي فاي وبلوتوث، كلها تحت الغطاء المعدني.' },
  antenna: { icon: '📶', ar: 'الهوائي', en: 'PCB Antenna', b: 'خط متعرج مطبوع على اللوحة: منه يخرج الواي فاي والبلوتوث. لا تغطّه بمعدن ولا تضع أسلاكًا فوقه.' },
  usb: { icon: '🔌', ar: 'منفذ USB', en: 'Micro-USB / USB-C', b: 'للبرمجة والطاقة معًا: ٥ فولت من الحاسوب، والبيانات تمر عبر شريحة التحويل.' },
  uart: { icon: '🔁', ar: 'شريحة USB إلى تسلسلي', en: 'CP2102 / CH340', b: 'المترجم بين الحاسوب وESP32. إن لم يظهر المنفذ في الحاسوب فغالبًا تحتاج تعريفها (Driver).' },
  reg: { icon: '🎚️', ar: 'منظّم الجهد', en: 'AMS1117-3.3', b: 'يحوّل ٥ فولت إلى ٣٫٣ فولت: الجهد الذي تعمل به الشريحة وكل أطرافها.' },
  en: { icon: '🔄', ar: 'زر EN', en: 'Enable / Reset', b: 'إعادة التشغيل: يبدأ البرنامج من أوله دون أن يُمسح.' },
  boot: { icon: '⬇️', ar: 'زر BOOT', en: 'Boot (GPIO0)', b: 'اضغطه مطولًا لحظة ظهور Connecting… أثناء الرفع، حين لا تدخل اللوحة وضع الرفع وحدها.' },
  pled: { icon: '🔴', ar: 'ليد الطاقة', en: 'Power LED', b: 'يضيء حين تصل الطاقة. إن لم يضئ: الكابل أو المنفذ.' },
  bled: { icon: '🔵', ar: 'الليد الأزرق المدمج', en: 'Built-in LED · GPIO2', b: 'متصل بالطرف 2 في أغلب لوحات DevKit: أول تجربة وميض بلا أي توصيل.' },
  pins: { icon: '📍', ar: '٣٠ طرفًا', en: 'GPIO Header', b: 'صفّان من ١٥ طرفًا. الاسم المطبوع (D23) هو رقم GPIO الذي نكتبه في الكود (23).' },
};
const ETOUR = ['module', 'antenna', 'usb', 'uart', 'reg', 'en', 'boot', 'pled', 'bled', 'pins'];

/* ================== الأكواد ================== */
const BLINK = p => `void setup() {
  pinMode(${p}, OUTPUT);
}

void loop() {
  digitalWrite(${p}, HIGH);
  delay(WAIT);
  digitalWrite(${p}, LOW);
  delay(WAIT);
}`;
const TRAFFIC = `int red = 25, yellow = 26, green = 27;

void setup() {
  pinMode(red, OUTPUT);
  pinMode(yellow, OUTPUT);
  pinMode(green, OUTPUT);
}

void loop() {
  digitalWrite(green, HIGH); delay(4000);
  digitalWrite(green, LOW);
  digitalWrite(yellow, HIGH); delay(1500);
  digitalWrite(yellow, LOW);
  digitalWrite(red, HIGH); delay(4000);
  digitalWrite(red, LOW);
}`;
const SERIAL = `void setup() {
  Serial.begin(115200);
}

void loop() {
  for (int i = 1; i <= 5; i++) {
    Serial.print("Round ");
    Serial.println(i);
    delay(500);
  }
  Serial.println("Done!");
  delay(2000);
}`;
const PWM = `const int LED = 23;
const int FREQ = 5000, BITS = 8;

void setup() {
  ledcAttach(LED, FREQ, BITS);
}

void loop() {
  ledcWrite(LED, DUTY);
}`;
const BTN = `const int BTN = 4, LED = 23;

void setup() {
  pinMode(BTN, INPUT_PULLUP);
  pinMode(LED, OUTPUT);
}

void loop() {
  if (digitalRead(BTN) == LOW) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }
}`;
const TOUCH = `const int LED = 23;
int limit = 30;

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
}

void loop() {
  int v = touchRead(4);       // T0
  Serial.println(v);
  digitalWrite(LED, v < limit);
  delay(100);
}`;

/* ================== الأنواع ================== */
Object.assign(window.DECK_TYPES, {
  ehero: s => `<div class="slide dark ehero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="htitle">${s.title}</h1>
      <div class="ehwrap"><svg viewBox="0 0 1600 560" class="ehsvg">
        <defs><radialGradient id="ehg" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#2b6fc0" stop-opacity=".45"/><stop offset="1" stop-color="#2b6fc0" stop-opacity="0"/></radialGradient></defs>
        <rect width="1600" height="560" fill="#0b1230"/><ellipse cx="800" cy="290" rx="560" ry="260" fill="url(#ehg)"/>
        ${Array.from({ length: 50 }, (_, i) => `<circle cx="${(i * 331) % 1600}" cy="${(i * 97) % 560}" r="${i % 3 ? 1 : 2}" fill="#7fa6ff" opacity=".4"/>`).join('')}
        <g transform="translate(410 150) scale(1)">${devkit({ id: 'eh' })}</g>
        <g id="ehwaves">${[60, 110, 160, 210].map((r, i) => `<path d="M${1150 + r * .2} ${290 - r} A ${r} ${r} 0 0 1 ${1150 + r * .2} ${290 + r}" class="ehwave" style="animation-delay:${i * .35}s"/>`).join('')}</g>
        ${[['📱', 1380, 140, 'جوال'], ['☁️', 1450, 290, 'سحابة'], ['🏠', 1380, 440, 'بيت ذكي'], ['🤖', 210, 150, 'روبوت'], ['🌡️', 140, 290, 'حساسات'], ['💡', 210, 430, 'إضاءة']].map(([e, x, y, t], i) => `<g transform="translate(${x} ${y})" class="ehnode" style="animation-delay:${i * .4}s"><circle r="52" fill="#18224a" stroke="#4fc3f7" stroke-width="3"/><text y="16" text-anchor="middle" font-size="46">${e}</text><text y="82" class="ehl">${t}</text></g>`).join('')}
        <path d="M262 150 C 330 150, 360 200, 420 230 M192 290 L 410 290 M262 430 C 330 430, 360 380, 420 350" class="ehlink"/>
        <text x="800" y="530" class="ehcap" id="ehcap"></text></svg></div></div>`,

  eboard: s => `<div class="slide light">
      <div class="kicker">🔍 تشريح اللوحة</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="ebgrid">
        <div class="ebleft ix"><svg viewBox="0 0 780 320" class="ebsvg">${devkit({ clickable: true, id: 'ebd' })}</svg>
          <div class="ebctl"><button class="clap" id="ebtour">▶ جولة على اللوحة</button><div class="ebhint">👆 أو اضغط أي جزء</div></div></div>
        <div class="ebinfo" id="ebinfo"><div class="xi0">عشرة أجزاء… اضغط أيّها لتعرف قصته</div></div>
      </div></div>`,

  epinmap: s => `<div class="slide light">
      <div class="kicker">📍 خريطة الأطراف</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="ebgrid pm">
        <div class="ebleft ix"><svg viewBox="0 0 780 320" class="ebsvg">${devkit({ id: 'epm' })}</svg>
          <div class="pmcats">${Object.entries(CAT).map(([k, c]) => `<button class="lsb pmc" data-c="${k}" style="--cc:${c.c}">${c.n}</button>`).join('')}</div></div>
        <div class="ebinfo" id="pminfo"><div class="xi0">اختر فئة… أو اضغط أي طرف في الرسم</div></div>
      </div></div>`,

  eupload: s => `<div class="slide light">
      <div class="kicker">⬆️ الرفع إلى ESP32</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><div class="euide"><div class="eubar"><span class="eubtn" id="euup">➡️</span><span class="eusel">▾ ESP32 Dev Module <small id="euport">COM5</small></span></div>
            <div class="eucon" id="eucon" dir="ltr"></div></div>
          <svg viewBox="0 0 780 320" class="ebsvg eusm">${devkit({ id: 'eu' })}</svg>
          <div class="euctl"><button class="clap" id="eugo">➡️ رفع</button><button class="sndbtn euboot" id="euboot">⬇️ اضغط BOOT (مطولًا)</button><button class="sndbtn" id="euauto">🔁 لوحتي تدخل وحدها: لا</button></div></div>
        <div class="euright"><div class="sowarn" id="euw">اضغط «رفع» وراقب الرسائل</div>
          <div class="eusteps">${['رابط لوحات Espressif في الإعدادات', 'تثبيت حزمة esp32 من مدير اللوحات', 'اختيار ESP32 Dev Module والمنفذ', 'رفع… واضغط BOOT عند Connecting'].map((t, i) => `<div><b>${AR(i + 1)}</b>${t}</div>`).join('')}</div></div>
      </div></div>`,

  eblink: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '💡 الوميض'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><svg viewBox="0 0 780 420" class="ebsvg">${devkit({ id: 'ebl' })}
            <g id="eblext"><line x1="0" y1="0" x2="0" y2="0" id="eblw" stroke="#e74c3c" stroke-width="5"/><g id="ebll" transform="translate(600 370)"><rect x="-40" y="-8" width="40" height="16" rx="4" fill="#d9b382" stroke="#7a5230" stroke-width="2"/><text x="-20" y="30" class="ebsilk2" style="fill:#3e2a1a">220Ω</text><circle cx="30" r="20" class="eblled" id="eblled"/><text x="30" y="48" class="ebsilk2" style="fill:#3e2a1a">LED</text></g></g></svg>
          <div class="eblctl"><div class="lseg"><span>الطرف</span>${[2, 23, 25, 34].map(p => `<button class="lsb${p === 2 ? ' on' : ''}" data-p="${p}">GPIO${p}</button>`).join('')}</div>
            <label class="lsl"><span>⏱️ WAIT: <b id="eblwv">٥٠٠</b> مللي ثانية</span><input type="range" id="eblw2" min="100" max="2000" step="100" value="500"></label>
            <button class="clap" id="eblgo">▶ تشغيل</button></div></div>
        <div class="euright"><div class="sowarn" id="eblst">GPIO2: LOW · ٠ فولت</div><div id="eblcode">${codeBlock(BLINK(2).replace(/WAIT/g, 500))}</div></div>
      </div></div>`,

  eohm: s => `<div class="slide light">
      <div class="kicker">⚡ قانون أوم مع ٣٫٣ فولت</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><svg viewBox="0 0 760 360" class="ebsvg"><rect width="760" height="360" rx="20" fill="#fbf7ee"/>
            <path d="M120 80 H 640 V 280 H 120 Z" fill="none" stroke="#1b2340" stroke-width="6" id="ohw"/>
            <g transform="translate(120 180)"><rect x="-55" y="-60" width="110" height="120" rx="12" fill="#1f2a44"/><text y="-10" class="ohv">3.3V</text><text y="22" class="ebsilk2">GPIO</text></g>
            <g transform="translate(380 80)"><rect x="-60" y="-20" width="120" height="40" rx="8" fill="#d9b382" stroke="#7a5230" stroke-width="3"/><text y="7" class="ohr" id="ohrt">220Ω</text></g>
            <g transform="translate(640 180)"><circle r="44" id="ohled"/><text y="80" class="ebsilk2" style="fill:#3e2a1a" id="ohlt"></text></g>
            <g id="ohdots"></g>
            <text x="380" y="330" class="ohf" id="ohf"></text></svg></div>
        <div class="euright ix"><div class="lseg"><span>لون الليد</span>${[['red', 'أحمر', 2.0], ['green', 'أخضر', 2.1], ['yellow', 'أصفر', 2.1], ['blue', 'أزرق', 3.0], ['white', 'أبيض', 3.0]].map(([k, n, v], i) => `<button class="lsb${i ? '' : ' on'}" data-k="${k}" data-v="${v}">${n}</button>`).join('')}</div>
          <label class="lsl"><span>🎚️ المقاومة: <b id="ohrv">٢٢٠</b> أوم</span><input type="range" id="ohr" min="10" max="1000" step="10" value="220"></label>
          <div class="sofacts"><div class="ac"><span>التيار</span><b id="ohi">—</b></div><div class="ac gold"><span>السطوع</span><b id="ohb">—</b></div></div>
          <div class="sowarn" id="ohw2"></div></div>
      </div></div>`,

  etraffic: s => `<div class="slide light">
      <div class="kicker">🚦 إشارة المرور</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><div class="etlight"><div class="etbox">${['red', 'yellow', 'green'].map((c, i) => `<div class="etl ${c}" id="etl${i}"><span>${['25', '26', '27'][i]}</span></div>`).join('')}</div>
            <div class="etinfo"><div class="etphase" id="etph">⏸ متوقفة</div><div class="ettime" id="ettm">—</div></div></div>
          <div class="eblctl"><button class="clap" id="etgo">▶ تشغيل</button><label class="lsl"><span>⏩ سرعة العرض: <b id="etsv">×٢</b></span><input type="range" id="ets" min="1" max="4" value="2"></label></div></div>
        <div class="euright">${codeBlock(TRAFFIC, 'micro')}</div>
      </div></div>`,

  eserial: s => `<div class="slide light">
      <div class="kicker">🖥️ الشاشة التسلسلية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><div class="esmon"><div class="esbar"><b>Serial Monitor</b><span class="eslbl">Baud:</span><button class="lsb on" data-b="115200">115200</button><button class="lsb" data-b="9600">9600</button></div>
            <div class="esout" id="esout" dir="ltr"></div></div>
          <div class="eblctl"><button class="clap" id="esgo">🔄 EN: إعادة تشغيل اللوحة</button></div></div>
        <div class="euright"><div class="sowarn" id="esw">اضغط EN لتبدأ اللوحة من أولها</div>${codeBlock(SERIAL, 'micro')}</div>
      </div></div>`,

  epwm: s => `<div class="slide light">
      <div class="kicker">🌗 PWM في ESP32 (LEDC)</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><svg viewBox="0 0 760 300" class="ebsvg"><rect width="760" height="300" rx="20" fill="#0f1530"/>
            <path id="pwmw" fill="none" stroke="#f0cc7a" stroke-width="4"/><line x1="40" y1="230" x2="620" y2="230" stroke="#3a4266" stroke-width="2"/>
            <text x="40" y="60" class="pwml" id="pwmv">3.3V</text><text x="40" y="255" class="pwml">0V</text>
            <g transform="translate(690 150)"><circle r="44" fill="#2a1a10" id="pwmled"/><circle r="44" fill="#ff5a3c" id="pwmglow"/></g></svg>
          <label class="lsl"><span>🎚️ DUTY: <b id="pwmdv">١٢٨</b> من <b id="pwmmax">٢٥٥</b></span><input type="range" id="pwmd" min="0" max="255" value="128"></label>
          <div class="pwmrow"><label class="lsl"><span>〰️ التردد: <b id="pwmfv">٥٠٠٠</b> هرتز</span><input type="range" id="pwmf" min="0" max="14" value="11"></label>
            <div class="lseg"><span>الدقة</span>${[8, 10, 12].map(b => `<button class="lsb${b === 8 ? ' on' : ''}" data-bits="${b}">${AR(b)} بت</button>`).join('')}</div></div></div>
        <div class="euright"><div class="sowarn" id="pwmw2"></div>${codeBlock(PWM.replace('DUTY', '128'))}</div>
      </div></div>`,

  ergb: s => `<div class="slide light">
      <div class="kicker">🌈 خلّاط الألوان</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><div class="rgbstage"><div class="rgbled" id="rgbled"><i></i></div>
            <div class="rgbsl">${[['r', 'أحمر · 16', '#e74c3c'], ['g', 'أخضر · 17', '#2ecc71'], ['b', 'أزرق · 18', '#3498db']].map(([k, n, c]) => `<label class="lsl" style="--rc:${c}"><span>${n}: <b id="rgb${k}v">${k === 'r' ? '٢٥٥' : k === 'g' ? '١٢٠' : '٠'}</b></span><input type="range" id="rgb${k}" min="0" max="255" value="${k === 'r' ? 255 : k === 'g' ? 120 : 0}"></label>`).join('')}</div></div>
          <div class="lseg"><span>النوع</span><button class="lsb on" data-t="cc">مهبط مشترك (−)</button><button class="lsb" data-t="ca">مصعد مشترك (+)</button>
            ${[['برتقالي', 255, 120, 0], ['بنفسجي', 140, 0, 255], ['تركوازي', 0, 200, 180], ['أبيض', 255, 255, 255]].map(([n, r, g, b]) => `<button class="lsb" data-rgb="${r},${g},${b}">${n}</button>`).join('')}</div></div>
        <div class="euright"><div id="rgbcode"></div></div>
      </div></div>`,

  ebutton: s => `<div class="slide light">
      <div class="kicker">🔘 الزر في ESP32</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><div class="ebtnstage"><button class="bbig" id="ebtn"></button><div class="ebtnread"><span>digitalRead</span><b id="ebtnv">HIGH</b></div><div class="eblled2" id="ebtnled"></div></div>
          <div class="lseg"><span>الطرف</span><button class="lsb on" data-p="4">GPIO4</button><button class="lsb" data-p="34">GPIO34</button></div>
          <div class="lseg"><span>الوضع</span><button class="lsb on" data-m="pu">INPUT_PULLUP</button><button class="lsb" data-m="in">INPUT</button></div></div>
        <div class="euright"><div class="sowarn" id="ebtnw"></div><div id="ebtncode">${codeBlock(BTN, 'micro')}</div></div>
      </div></div>`,

  etouch: s => `<div class="slide light">
      <div class="kicker">✋ ميزة لا توجد في الأونو: اللمس</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eugrid">
        <div class="euleft ix"><svg viewBox="0 0 760 330" class="ebsvg" id="tchsvg"><rect width="760" height="330" rx="20" fill="#fbf7ee"/>
            <g transform="translate(120 170)"><rect x="-70" y="-90" width="140" height="180" rx="12" fill="#1f2a44"/><text y="-50" class="ebsilk2">ESP32</text><text y="0" class="ohv" style="font-size:22px">T0 · GPIO4</text></g>
            <path d="M190 170 C 300 170, 330 200, 420 200" stroke="#e0b400" stroke-width="6" fill="none"/>
            <g transform="translate(470 200)"><rect x="-55" y="-30" width="110" height="60" rx="10" fill="#c9a06d" stroke="#7a5230" stroke-width="3"/><text y="7" class="ebsilk2" style="fill:#3e2a1a">رقاقة نحاس</text></g>
            <g id="tchfinger"><text font-size="90" text-anchor="middle">👆</text></g>
            <g transform="translate(680 90)"><circle r="34" class="eblled" id="tchled"/><text y="62" class="ebsilk2" style="fill:#3e2a1a">LED 23</text></g></svg>
          <label class="lsl"><span>👆 قرّب إصبعك: <b id="tchdv">بعيد</b></span><input type="range" id="tchd" min="0" max="100" value="100"></label></div>
        <div class="euright ix"><div class="sofacts"><div class="ac"><span>touchRead(4)</span><b id="tchv">—</b></div><div class="ac gold"><span>الحد</span><b id="tchlv">٣٠</b></div></div>
          <div class="plot4"><div class="plh"><i style="background:#16a3b5"></i>قراءة اللمس <i style="background:#f0cc7a"></i>الحد</div><svg viewBox="0 0 600 140" class="chart4" preserveAspectRatio="none"><line x1="0" x2="600" y1="0" y2="0" class="cm" id="tchth"/><polyline class="cl" style="stroke:#16a3b5" id="tchpl"/></svg></div>
          ${codeBlock(TOUCH, 'micro')}</div>
      </div></div>`,

  codebag: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="cbgrid">${s.files.map(f => `<a class="cbf" href="code/${f.f}" download><span class="cbi">${f.i}</span><b>${f.n}</b><small dir="ltr">${f.f}</small><em>${f.d}</em></a>`).join('')}</div>
      ${s.note ? `<div class="sowarn ok" style="margin-top:14px">${s.note}</div>` : ''}</div>`,
});

/* ================== السلوك ================== */
const showPart = (box, k) => { const p = EPARTS[k]; box.innerHTML = `<div class="xi1">${p.icon}</div><h3>${p.ar}</h3><div class="eben" dir="ltr">${p.en}</div><p>${p.b}</p>`; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); };

Object.assign(window.DECK_BIND, {
  ehero(sl) {
    const cap = sl.querySelector('#ehcap'), led = sl.querySelector('#ehbled');
    const CAPS = ['لوحة بحجم إصبعين… فيها واي فاي وبلوتوث ونواتان', 'تقرأ الحساسات، وتدير المحركات، وتتصل بالإنترنت', 'وثمنها قريب من ثمن الأونو… وأقوى منه بخمس عشرة مرة'];
    raf(sl, (dt, ts) => { const k = Math.floor(ts / 3200) % CAPS.length; cap.textContent = CAPS[k]; led.classList.toggle('on', Math.floor(ts / 500) % 2 === 0); });
  },

  eboard(sl) {
    const info = sl.querySelector('#ebinfo'); let timers = [];
    const pick = k => { sl.querySelectorAll('.ebp').forEach(p => p.classList.toggle('sel', p.dataset.p === k)); showPart(info, k); };
    sl.querySelectorAll('.ebp').forEach(p => p.addEventListener('pointerdown', () => { timers.forEach(clearTimeout); pick(p.dataset.p); }));
    sl.querySelector('#ebtour').onclick = () => { timers.forEach(clearTimeout); timers = ETOUR.map((k, i) => setTimeout(() => pick(k), i * 2600)); };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  epinmap(sl) {
    const info = sl.querySelector('#pminfo');
    const paint = (sel) => sl.querySelectorAll('.ebhole').forEach(h => { const g = gpio(h.dataset.pin); const on = sel(g, h.dataset.pin); h.style.fill = on || ''; h.classList.toggle('hi', !!on); sl.querySelector(`[data-pl="${h.dataset.pin}"]`).classList.toggle('hi', !!on); });
    sl.querySelectorAll('.pmc').forEach(b => b.onclick = () => { const c = CAT[b.dataset.c]; sl.querySelectorAll('.pmc').forEach(x => x.classList.toggle('on', x === b));
      paint(g => c.g.includes(g) ? c.c : null);
      info.innerHTML = `<h3 style="color:${c.c}">${c.n}</h3><div class="pmlist" dir="ltr">${c.g.map(g => `<span>GPIO${g}</span>`).join('')}</div><p>${c.d}</p>`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); });
    sl.querySelectorAll('.ebhole').forEach(h => h.addEventListener('pointerdown', () => { const p = h.dataset.pin, g = gpio(p);
      const cats = Object.values(CAT).filter(c => c.g.includes(g));
      paint((gg, pp) => pp === p ? '#1b2340' : null);
      info.innerHTML = `<h3 dir="ltr">${p}${g !== null && !String(p).includes(String(g)) ? ` · GPIO${g}` : ''}</h3>${cats.length ? `<div class="pmtags">${cats.map(c => `<span style="background:${c.c}">${c.n}</span>`).join('')}</div>` : ''}<p>${PINFO[p] || (cats[0] ? cats[0].d : 'طرف طاقة.')}</p>`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); }));
  },

  eupload(sl) {
    const $ = id => sl.querySelector('#' + id); let auto = false, boot = false, timers = [], stage = 'idle';
    const out = (t, c = '') => { $('eucon').insertAdjacentHTML('beforeend', `<div class="${c}">${t}</div>`); $('eucon').scrollTop = 1e9; };
    const bootBtn = $('euboot');
    bootBtn.addEventListener('pointerdown', () => { boot = true; bootBtn.classList.add('on'); $('eubootc').setAttribute('fill', '#f0cc7a'); });
    ['pointerup', 'pointerleave'].forEach(e => bootBtn.addEventListener(e, () => { boot = false; bootBtn.classList.remove('on'); $('eubootc').setAttribute('fill', '#1c1f27'); }));
    $('euauto').onclick = () => { auto = !auto; $('euauto').textContent = auto ? '🔁 لوحتي تدخل وحدها: نعم' : '🔁 لوحتي تدخل وحدها: لا'; $('euauto').classList.toggle('on', auto); };
    const w = (t, c) => { $('euw').className = 'sowarn ' + (c || ''); $('euw').textContent = t; };
    $('eugo').onclick = () => {
      if (stage === 'busy') return; stage = 'busy'; timers.forEach(clearTimeout); timers = []; $('eucon').innerHTML = '';
      out('Compiling sketch...'); w('⏳ الترجمة…');
      timers.push(setTimeout(() => { out('Sketch uses 280245 bytes (21%) of program storage space.'); out('esptool.py v4.8 · Serial port COM5'); out('Connecting', 'dots'); w('🔌 Connecting… الآن! اضغط BOOT مطولًا إن لم تدخل اللوحة وحدها', 'bad'); }, 1400));
      let k = 0; const poll = () => { k++; const ok = auto || boot;
        if (ok && k > 2) { out('Chip is ESP32-D0WD-V3 (revision v3.1)'); out('Writing at 0x00010000... (25 %)'); out('Writing at 0x00030000... (100 %)'); out('Hard resetting via RTS pin...', 'ok'); w('✅ تم الرفع! والآن اترك BOOT: اللوحة تعيد التشغيل وتبدأ برنامجك', 'ok'); stage = 'idle'; return; }
        if (k > 14) { out('A fatal error occurred: Failed to connect to ESP32: Wrong boot mode detected (0x13)! The chip needs to be in download mode.', 'err'); w('❌ فشل الرفع: اللوحة لم تدخل وضع الرفع. أعد المحاولة واضغط BOOT مطولًا عند Connecting', 'bad'); stage = 'idle'; return; }
        sl.querySelector('#eucon .dots:last-child') && (sl.querySelector('#eucon .dots:last-child').textContent += k % 3 ? '.' : '_');
        timers.push(setTimeout(poll, 320)); };
      timers.push(setTimeout(poll, 1800));
    };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  eblink(sl) {
    const $ = id => sl.querySelector('#' + id); let pin = 2, run = false, on = false, acc = 0;
    const holeXY = p => { const name = p === 2 ? 'D2' : 'D' + p; const h = sl.querySelector(`.ebhole[data-pin="${name}"]`); return h ? [+h.getAttribute('cx'), +h.getAttribute('cy')] : [0, 0]; };
    const setCode = () => { $('eblcode').innerHTML = codeBlock(BLINK(pin).replace(/WAIT/g, $('eblw2').value)); };
    const setPin = p => { pin = p; sl.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', +b.dataset.p === p)); const [x, y] = holeXY(p);
      $('eblext').style.display = p === 2 ? 'none' : ''; $('eblw').setAttribute('x1', x); $('eblw').setAttribute('y1', y); $('eblw').setAttribute('x2', 560); $('eblw').setAttribute('y2', 370); setCode(); };
    sl.querySelectorAll('[data-p]').forEach(b => b.onclick = () => setPin(+b.dataset.p));
    $('eblw2').oninput = () => { $('eblwv').textContent = AR($('eblw2').value); setCode(); };
    $('eblgo').onclick = () => { run = !run; $('eblgo').textContent = run ? '⏸ إيقاف' : '▶ تشغيل'; };
    setPin(2);
    raf(sl, dt => {
      if (run) { acc += dt * 1000; if (acc >= +$('eblw2').value) { acc = 0; on = !on; } } else on = false;
      const bad = pin === 34, lit = on && !bad;
      $('eblbled').classList.toggle('on', pin === 2 && lit); $('eblled').classList.toggle('on', pin !== 2 && lit);
      const st = $('eblst');
      if (bad && run) { st.className = 'sowarn bad'; st.textContent = '🚫 GPIO34 مدخل فقط: pinMode(34, OUTPUT) لا يُخرج أي جهد. الليد لن يضيء أبدًا! جرّب 23'; }
      else { st.className = 'sowarn ' + (lit ? 'ok' : ''); st.textContent = `GPIO${pin}: ${lit ? 'HIGH · ٣٫٣ فولت' : 'LOW · ٠ فولت'}${pin === 2 ? ' · الليد الأزرق المدمج' : ''}`; }
      runLines(sl, '#eblcode', run ? (on ? [6, 7] : [8, 9]) : [2]);
    });
  },

  eohm(sl) {
    const $ = id => sl.querySelector('#' + id); let vf = 2.0, col = 'red';
    const COL = { red: '#ff3b3b', green: '#2ecc71', yellow: '#f5d020', blue: '#3b82ff', white: '#ffffff' };
    sl.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { col = b.dataset.k; vf = +b.dataset.v; sl.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); });
    let ph = 0;
    raf(sl, dt => {
      const R = +$('ohr').value, I = Math.max(0, (3.3 - vf) / R) * 1000, br = clamp(I / 15, 0, 1.3);
      $('ohrv').textContent = AR(R); $('ohrt').textContent = R + 'Ω';
      $('ohi').textContent = AR(I.toFixed(1)).replace('.', '٫') + ' mA'; $('ohb').textContent = I < 1 ? 'خافت جدًا' : I < 4 ? 'خافت' : I <= 20 ? 'جيد ✅' : 'زائد ⚠️';
      const led = $('ohled'); led.setAttribute('fill', COL[col]); led.style.opacity = .25 + .75 * Math.min(1, br); led.style.filter = `drop-shadow(0 0 ${18 * Math.min(1, br)}px ${COL[col]})`;
      $('ohlt').textContent = `Vf ≈ ${vf} V`;
      $('ohf').textContent = `I = (3.3 − ${vf}) ÷ ${R} = ${I.toFixed(1)} mA`;
      ph = (ph + dt * I * 6) % 40; $('ohdots').innerHTML = I > .5 ? Array.from({ length: 30 }, (_, i) => { const d = (i * 40 + ph) % 1200; const [x, y] = d < 520 ? [120 + d, 80] : d < 720 ? [640, 80 + d - 520] : d < 1240 ? [640 - (d - 720), 280] : [120, 280]; return `<circle cx="${x}" cy="${y}" r="5" fill="#f0cc7a"/>`; }).join('') : '';
      const w = $('ohw2');
      if (I > 20) { w.className = 'sowarn bad'; w.textContent = '⚠️ تيار أكبر من الموصى به لطرف ESP32 (نحو ٢٠ مللي أمبير). كبّر المقاومة'; }
      else if (vf >= 3) { w.className = 'sowarn bad'; w.textContent = '🔵 الأزرق والأبيض يحتاجان نحو ٣ فولت، و٣٫٣ لا تترك إلا ٠٫٣ فولت للمقاومة: يضيء خافتًا. استعمل مقاومة صغيرة (٣٣ أوم) أو ترانزستور مع ٥ فولت'; }
      else if (I < 4) { w.className = 'sowarn'; w.textContent = 'خافت: المقاومة كبيرة على ٣٫٣ فولت'; }
      else { w.className = 'sowarn ok'; w.textContent = `مع ٣٫٣ فولت يكفي ${vf < 2.05 ? '١٠٠ إلى ٢٢٠' : '٦٨ إلى ١٥٠'} أوم: أقل مما اعتدنا مع الأونو (٥ فولت)`; }
    });
  },

  etraffic(sl) {
    const $ = id => sl.querySelector('#' + id); let run = false, t = 0;
    const PH = [[4, 0, 'أخضر', [10]], [1.5, 1, 'أصفر', [12]], [4, 2, 'أحمر', [14]]];
    $('etgo').onclick = () => { run = !run; $('etgo').textContent = run ? '⏸ إيقاف' : '▶ تشغيل'; if (run) t = 0; };
    $('ets').oninput = () => $('etsv').textContent = '×' + AR($('ets').value);
    raf(sl, dt => {
      if (!run) { [0, 1, 2].forEach(i => $('etl' + i).classList.remove('on')); $('etph').textContent = '⏸ متوقفة'; $('ettm').textContent = '—'; runLines(sl, '.euright', []); return; }
      t = (t + dt * +$('ets').value) % 9.5; let acc = 0, k = 0; while (t > acc + PH[k][0]) { acc += PH[k][0]; k++; }
      const ph = PH[k], light = [2, 1, 0][k];
      [0, 1, 2].forEach(i => $('etl' + i).classList.toggle('on', i === light));
      $('etph').textContent = '🚦 ' + ph[2]; $('ettm').textContent = AR((ph[0] - (t - acc)).toFixed(1)).replace('.', '٫') + ' ث';
      runLines(sl, '.euright', ph[3]);
    });
  },

  eserial(sl) {
    const $ = id => sl.querySelector('#' + id); let baud = 115200, timers = [];
    const out = (t, c = '') => { $('esout').insertAdjacentHTML('beforeend', `<div class="${c}">${t}</div>`); const o = $('esout'); while (o.children.length > 14) o.firstChild.remove(); o.scrollTop = 1e9; };
    const garb = n => Array.from({ length: n }, () => '�ÿ¤Ãxâ§'[Math.floor(Math.random() * 8)]).join('');
    const say = t => baud === 115200 ? out(t) : out(garb(t.length), 'garb');
    sl.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { baud = +b.dataset.b; sl.querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', x === b)); });
    $('esgo').onclick = () => {
      timers.forEach(clearTimeout); timers = []; $('esout').innerHTML = '';
      out('ets Jun  8 2016 00:22:57', 'boot'); out('rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)', 'boot');
      const w = $('esw'); if (baud !== 115200) { w.className = 'sowarn bad'; w.textContent = '🤯 رموز غريبة! سرعة الشاشة (9600) لا تطابق Serial.begin(115200). غيّرها إلى 115200'; } else { w.className = 'sowarn ok'; w.textContent = 'السطران الأولان رسالة إقلاع ESP32 نفسها… ثم يبدأ برنامجك'; }
      let d = 600; for (let r = 0; r < 2; r++) { for (let i = 1; i <= 5; i++) { timers.push(setTimeout(() => { say('Round ' + i); runLines(sl, '.euright', [6, 7, 8]); }, d)); d += 450; } timers.push(setTimeout(() => { say('Done!'); runLines(sl, '.euright', [11]); }, d)); d += 1400; }
    };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  epwm(sl) {
    const $ = id => sl.querySelector('#' + id); let bits = 8, ph = 0;
    const FREQS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 40000];
    const freq = () => FREQS[+$('pwmf').value];
    const setCode = () => { const max = 2 ** bits - 1, d = Math.round(+$('pwmd').value / 255 * max); $('pwmdv').textContent = AR(d); $('pwmmax').textContent = AR(max);
      sl.querySelector('.euright .code').outerHTML; const box = sl.querySelector('.euright'); box.querySelector('.code') && box.querySelector('.code').remove(); box.insertAdjacentHTML('beforeend', codeBlock(PWM.replace('FREQ = 5000', 'FREQ = ' + freq()).replace('BITS = 8', 'BITS = ' + bits).replace('DUTY', d))); };
    sl.querySelectorAll('[data-bits]').forEach(b => b.onclick = () => { bits = +b.dataset.bits; sl.querySelectorAll('[data-bits]').forEach(x => x.classList.toggle('on', x === b)); setCode(); });
    $('pwmd').oninput = setCode; $('pwmf').oninput = () => { $('pwmfv').textContent = AR(freq()); setCode(); };
    setCode();
    raf(sl, dt => {
      const duty = +$('pwmd').value / 255, f = freq(), cyc = 5, W = 580 / cyc;
      let d = ''; for (let c = 0; c < cyc; c++) { const x0 = 40 + c * W, x1 = x0 + W * duty; d += `M${x0} 230 V 70 H ${x1} V 230 H ${x0 + W} `; }
      $('pwmw').setAttribute('d', duty <= 0 ? 'M40 230 H 620' : duty >= 1 ? 'M40 70 H 620' : d);
      ph += dt * f; const flick = f < 40 ? (Math.sin(ph * Math.PI * 2) > 0 ? 1 : 0) : 1;
      $('pwmglow').style.opacity = f < 40 ? flick * (duty > 0) : duty; $('pwmglow').style.filter = `drop-shadow(0 0 ${20 * duty}px #ff5a3c)`;
      $('pwmv').textContent = '3.3V'; const w = $('pwmw2');
      if (f < 40) { w.className = 'sowarn bad'; w.textContent = `〰️ ${AR(f)} هرتز بطيء جدًا: العين ترى الليد يومض! فوق ~٥٠ هرتز تراه ضوءًا ثابتًا`; }
      else { w.className = 'sowarn ok'; w.textContent = `متوسط الجهد ≈ ${AR((3.3 * duty).toFixed(2)).replace('.', '٫')} فولت · الدقة ${AR(bits)} بت = ${AR(2 ** bits)} درجة سطوع`; }
    });
  },

  ergb(sl) {
    const $ = id => sl.querySelector('#' + id); let ca = false;
    const upd = () => { const r = +$('rgbr').value, g = +$('rgbg').value, b = +$('rgbb').value; ['r', 'g', 'b'].forEach(k => $('rgb' + k + 'v').textContent = AR($('rgb' + k).value));
      $('rgbled').style.setProperty('--c', `rgb(${r},${g},${b})`);
      const W = v => ca ? 255 - v : v;
      $('rgbcode').innerHTML = codeBlock(`// ${ca ? 'مصعد مشترك: نعكس القيم (255 − القيمة)' : 'مهبط مشترك'}
void setup() {
  pinMode(16, OUTPUT);
  pinMode(17, OUTPUT);
  pinMode(18, OUTPUT);
}

void loop() {
  analogWrite(16, ${W(r)});   // أحمر
  analogWrite(17, ${W(g)});   // أخضر
  analogWrite(18, ${W(b)});   // أزرق
}`, 'micro'); };
    ['rgbr', 'rgbg', 'rgbb'].forEach(id => $(id).oninput = upd);
    sl.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ca = b.dataset.t === 'ca'; sl.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    sl.querySelectorAll('[data-rgb]').forEach(b => b.onclick = () => { const [r, g, bb] = b.dataset.rgb.split(','); $('rgbr').value = r; $('rgbg').value = g; $('rgbb').value = bb; upd(); });
    upd();
  },

  ebutton(sl) {
    const $ = id => sl.querySelector('#' + id); let pin = 4, mode = 'pu', down = false;
    const btn = $('ebtn'); btn.addEventListener('pointerdown', () => { down = true; btn.classList.add('on'); }); ['pointerup', 'pointerleave'].forEach(e => btn.addEventListener(e, () => { down = false; btn.classList.remove('on'); }));
    const setCode = () => { $('ebtncode').innerHTML = codeBlock(BTN.replace('BTN = 4', 'BTN = ' + pin).replace('INPUT_PULLUP', mode === 'pu' ? 'INPUT_PULLUP' : 'INPUT'), 'micro'); };
    sl.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { pin = +b.dataset.p; sl.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b)); setCode(); });
    sl.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; sl.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); setCode(); });
    raf(sl, (dt, ts) => {
      const floating = mode === 'in' || pin === 34;
      const v = down ? 'LOW' : floating ? (Math.sin(ts / 83) + Math.sin(ts / 37) > .6 ? 'LOW' : 'HIGH') : 'HIGH';
      $('ebtnv').textContent = v; $('ebtnv').className = v === 'LOW' ? 'lo' : ''; $('ebtnled').classList.toggle('on', v === 'LOW');
      const w = $('ebtnw');
      if (floating && !down) { w.className = 'sowarn bad'; w.textContent = pin === 34 ? '👻 GPIO34 بلا مقاومة سحب داخلية: INPUT_PULLUP لا يفعل شيئًا هنا! الطرف عائم والليد يرتجف. استعمل 4 أو مقاومة 10k خارجية' : '👻 INPUT بلا مقاومة: الطرف عائم يلتقط الضجيج'; }
      else { w.className = 'sowarn ok'; w.textContent = down ? '🟢 الضغط يوصل الطرف بالأرضي: LOW ← الليد يضيء' : 'INPUT_PULLUP: مقاومة داخلية تثبّت الطرف على HIGH، بلا أي مقاومة خارجية'; }
      runLines(sl, '#ebtncode', v === 'LOW' ? [9, 10] : [12]);
    });
  },

  etouch(sl) {
    const $ = id => sl.querySelector('#' + id), buf = [];
    const Y = v => 130 - v / 90 * 120; $('tchth').setAttribute('y1', Y(30)); $('tchth').setAttribute('y2', Y(30));
    raf(sl, (dt, ts) => {
      const d = +$('tchd').value, fx = 470, fy = 192 - d * 1.35;
      $('tchfinger').setAttribute('transform', `translate(${fx} ${fy})`);
      const base = 72, v = Math.round(base - (1 - d / 100) ** 2 * 58 + (Math.sin(ts / 90) * 2));
      const on = v < 30; $('tchled').classList.toggle('on', on);
      $('tchv').textContent = AR(v); $('tchv').className = on ? 'on' : ''; $('tchdv').textContent = d < 8 ? 'يلمس ✋' : d < 50 ? 'قريب' : 'بعيد';
      buf.push(v); while (buf.length > 120) buf.shift(); $('tchpl').setAttribute('points', buf.map((x, i) => `${i / 119 * 600},${Y(x)}`).join(' '));
      runLines(sl, '.euright', on ? [10, 12] : [10, 11]);
    });
  },
});
})();
