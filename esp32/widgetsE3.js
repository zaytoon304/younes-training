/* =====================================================================
   «ESP32 للمعلمين» · شرائح «الشرح الوافي» (النوع explain)
   كل مصطلح: ببساطة · لماذا وُجد · متى نستخدمه · متى نتجنبه · تشبيه + تجربة حيّة تُري ما يحدث فعلًا
   المشاهد: gpioname · highlow · gpio · inonly · strap · serialpins · adc · touch · dac
            power · driver · bootbtn · enbtn · baud · duty · freq · res · pullup
   ===================================================================== */
(function () {
const { AR } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BOX = { what: ['💡', 'ببساطة', '#2b6fc0'], why: ['🤔', 'لماذا وُجد؟', '#8e44ad'], use: ['✅', 'متى نستخدمه؟', '#1f8a55'], avoid: ['⛔', 'متى نتجنبه؟', '#c0392b'] };

/* ---------- أدوات الرسم ---------- */
const LED = (id, x, y, c = '#ff4d4d') => `<g id="${id}" class="ezled" style="--c:${c}" transform="translate(${x} ${y})">
  <circle r="40" fill="${c}" class="glow" style="filter:blur(10px)"/><path d="M-9 20 v34 M9 20 v44" stroke="#aab2cf" stroke-width="5"/>
  <path d="M-22 22 v-22 a22 22 0 0 1 44 0 v22 z" class="bulb"/><rect x="-26" y="18" width="52" height="8" rx="3" fill="#6b7393"/></g>`;
const CHIP = (x, y, w = 200, h = 200, t = 'ESP32') => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="18" class="ezchip"/>
  ${Array.from({ length: 6 }, (_, i) => `<rect x="${-12}" y="${20 + i * (h - 40) / 5 - 4}" width="12" height="8" fill="#c9a24a"/><rect x="${w}" y="${20 + i * (h - 40) / 5 - 4}" width="12" height="8" fill="#c9a24a"/>`).join('')}
  <text x="${w / 2}" y="${h / 2 + 8}" text-anchor="middle" class="ezt" style="font-size:26px">${t}</text></g>`;
const PIN = (x, y, t, c = '#f0cc7a') => `<g transform="translate(${x} ${y})"><rect x="-58" y="-19" width="116" height="38" rx="10" fill="#26315a" stroke="${c}" stroke-width="3"/><text text-anchor="middle" y="7" class="ezt" style="font-size:19px;fill:${c}">${t}</text></g>`;
const BTN = (id, x, y) => `<g id="${id}" class="ezbtn" transform="translate(${x} ${y})"><rect x="-38" y="-10" width="76" height="46" rx="8" fill="#39415f" stroke="#aab2cf" stroke-width="3"/><g class="cap"><circle cy="-6" r="24" fill="#e74c3c" stroke="#7a1d14" stroke-width="3"/></g></g>`;
const svg = (body, h = 400) => `<svg viewBox="0 0 760 ${h}">${body}</svg>`;

/* ---------- المشاهد: كل مشهد = رسم + أزرار + ربط ---------- */
const S = {};

/* ٠) ما معنى GPIO؟ تفكيك الكلمة */
S.gpioname = {
  svg: svg(`${[['G', 'General', 'عام', '#4fc3f7'], ['P', 'Purpose', 'الغرض', '#46d68c'], ['I', 'Input', 'مدخل', '#ffcf4a'], ['O', 'Output', 'مخرج', '#ff7b6b']].map(([l, en, ar, c], i) => `
    <g class="gl" data-i="${i}" transform="translate(${95 + i * 190} 150)" style="cursor:pointer">
      <rect x="-80" y="-95" width="160" height="150" rx="24" fill="#1c2650" stroke="${c}" stroke-width="5"/>
      <text text-anchor="middle" y="20" style="font:900 110px var(--mono);fill:${c}">${l}</text>
      <g class="gx" style="opacity:0;transition:opacity .4s"><text text-anchor="middle" y="95" class="ezt" style="font-size:24px;fill:${c}">${en}</text><text text-anchor="middle" y="135" class="ezta" style="font-size:30px">${ar}</text></g></g>`).join('')}
    <text x="380" y="345" text-anchor="middle" class="ezta" id="gnsum" style="font-size:30px;fill:#ffcf4a;opacity:0;transition:opacity .4s">طرف «عام الغرض»: الكود يجعله مدخلًا أو مخرجًا</text>
    <text x="380" y="385" text-anchor="middle" class="ezt" id="gnex" style="opacity:0;transition:opacity .4s">GPIO23  ←  pinMode(23, OUTPUT)</text>`),
  ctl: `<button data-a="go" class="on">▶ فكّك الكلمة حرفًا حرفًا</button>`,
  cap: 'اضغط الزر أو أي حرف لترى معناه',
  bind(q, cap) {
    let T = [];
    const show = n => { q.all('.gl').forEach((g, i) => g.querySelector('.gx').style.opacity = i < n ? 1 : 0); q.$('#gnsum').style.opacity = n >= 4 ? 1 : 0; q.$('#gnex').style.opacity = n >= 4 ? 1 : 0;
      cap(['', 'General = عام: ليس مخصصًا لشيء واحد', 'Purpose = الغرض: أي استعمال تريده', 'Input = مدخل: يقرأ (زر، حساس)', 'Output = مخرج: يُخرج جهدًا (ليد، جرس)'][Math.min(n, 4)] + (n >= 4 ? ' · فالمعنى: «مدخل/مخرج عام الغرض»' : ''), n >= 4 ? 'ok' : ''); };
    q.btn('go', () => { T.forEach(clearTimeout); show(0); T = [1, 2, 3, 4].map(n => setTimeout(() => show(n), n * 900)); });
    q.all('.gl').forEach(g => g.onclick = () => { T.forEach(clearTimeout); show(+g.dataset.i + 1); });
    q.clean(() => T.forEach(clearTimeout));
  },
};

/* ١) HIGH وLOW: لغة الأطراف */
S.highlow = {
  svg: svg(`${CHIP(40, 100)}${PIN(330, 200, 'GPIO23')}<path d="M252 200 H272" class="ezw"/><path id="hlw" d="M388 200 H560" class="ezw"/>${LED('hlled', 610, 170, '#ff4d4d')}
    <path d="M610 238 V330 H120 V300" class="ezw blk"/><text x="380" y="355" text-anchor="middle" class="ezt" style="fill:#8d95b5">GND 0V</text>
    <g transform="translate(470 95)"><rect x="-90" y="-50" width="180" height="84" rx="16" fill="#e8d36a" stroke="#6d5a12" stroke-width="4"/><rect x="-74" y="-38" width="148" height="50" rx="8" fill="#1d2a18"/>
    <text id="hlv" text-anchor="middle" y="0" style="font:700 36px VT323,monospace;fill:#9cff7a">0.00 V</text></g>
    <text id="hlst" x="140" y="70" text-anchor="middle" style="font:900 40px var(--mono);fill:#8d9bd0">LOW</text>`),
  ctl: `<button data-a="hi">digitalWrite(23, HIGH)</button><button data-a="lo" class="on">digitalWrite(23, LOW)</button>`,
  cap: 'اختر أمرًا وراقب الفولتميتر',
  bind(q, cap) {
    const set = h => { q.$('#hlled').classList.toggle('on', h); q.$('#hlw').classList.toggle('hot', h); q.$('#hlv').textContent = h ? '3.30 V' : '0.00 V';
      q.$('#hlst').textContent = h ? 'HIGH' : 'LOW'; q.$('#hlst').style.fill = h ? '#ffcf4a' : '#8d9bd0'; q.on(h ? 'hi' : 'lo');
      cap(h ? 'HIGH = ١ = يوجد جهد (٣٫٣ فولت في ESP32 · ٥ فولت في الأونو) ← الليد يضيء' : 'LOW = ٠ = لا جهد (٠ فولت) ← الليد مطفأ', h ? 'ok' : ''); };
    q.btn('hi', () => set(true)); q.btn('lo', () => set(false));
  },
};

/* ٢) GPIO مدخل أو مخرج */
S.gpio = {
  svg: svg(`${CHIP(40, 100)}${PIN(330, 200, 'GPIO23')}<path d="M252 200 H272" class="ezw"/><path id="gw" d="M388 200 H530" class="ezw"/>
    <g id="gout">${LED('gled', 590, 170, '#ffcf4a')}<path d="M440 180 l30 20 l-30 20" fill="none" stroke="#ffcf4a" stroke-width="6"/></g>
    <g id="gin" class="ezhide">${BTN('gbtn', 590, 200)}<path d="M480 180 l-30 20 l30 20" fill="none" stroke="#4fc3f7" stroke-width="6"/><text x="590" y="280" text-anchor="middle" class="ezta" style="font-size:19px">اضغطني</text></g>
    <text id="gread" x="380" y="60" text-anchor="middle" class="ezt" style="font-size:24px"></text>
    <text id="gcode" x="380" y="370" text-anchor="middle" class="ezt" style="fill:#ffcf4a"></text>`),
  ctl: `<button data-a="out" class="on">💡 اجعله مخرجًا OUTPUT</button><button data-a="in">🔘 اجعله مدخلًا INPUT</button>`,
  cap: '',
  bind(q, cap) {
    let mode = 'out', iv = 0, pressed = false;
    const set = m => { mode = m; q.on(m); clearInterval(iv); q.$('#gout').classList.toggle('ezhide', m !== 'out'); q.$('#gin').classList.toggle('ezhide', m !== 'in');
      if (m === 'out') { let on = false; iv = setInterval(() => { on = !on; q.$('#gled').classList.toggle('on', on); q.$('#gw').classList.toggle('hot', on); }, 600);
        q.$('#gcode').textContent = 'pinMode(23, OUTPUT);  digitalWrite(23, HIGH);'; q.$('#gread').textContent = '';
        cap('المخرج: الشريحة «تتكلم» فتُخرج جهدًا على الطرف ← تشغّل ليدًا أو جرسًا أو مُرحّلًا', 'ok'); }
      else { q.$('#gcode').textContent = 'pinMode(23, INPUT);  int v = digitalRead(23);'; upd(); cap('المدخل: الشريحة «تسمع» فتقرأ هل وصل جهد إلى الطرف أم لا ← اضغط الزر الأحمر', ''); } };
    const upd = () => { q.$('#gread').textContent = 'digitalRead = ' + (pressed ? 'HIGH (1)' : 'LOW (0)'); q.$('#gbtn').classList.toggle('down', pressed); q.$('#gw').classList.toggle('hot', pressed && mode === 'in'); };
    const b = q.$('#gbtn'); b.onpointerdown = () => { pressed = true; upd(); }; b.onpointerup = b.onpointerleave = () => { pressed = false; upd(); };
    q.btn('out', () => set('out')); q.btn('in', () => set('in')); set('out'); q.clean(() => clearInterval(iv));
  },
};

/* ٣) مدخلات فقط 34–39 */
S.inonly = {
  svg: svg(`${CHIP(40, 90, 200, 230)}${PIN(330, 150, 'GPIO23', '#46d68c')}${PIN(330, 270, 'GPIO34', '#ffcf4a')}
    <path d="M252 150 H272 M252 270 H272" class="ezw"/><path id="iw23" d="M388 150 H560" class="ezw"/><path id="iw34" d="M388 270 H560" class="ezw"/>
    ${LED('il23', 610, 120, '#46d68c')}<g id="il34g">${LED('il34', 610, 240, '#ffcf4a')}</g>
    <g id="isens" class="ezhide" transform="translate(620 270)"><rect x="-50" y="-40" width="100" height="80" rx="14" fill="#2b6fc0"/><text text-anchor="middle" y="14" style="font-size:44px">🌡️</text></g>
    <g id="iblock" class="ezhide"><circle cx="470" cy="270" r="30" fill="#c0392b"/><path d="M450 250 l40 40 M490 250 l-40 40" stroke="#fff" stroke-width="7"/></g>
    <text id="iread" x="470" y="335" text-anchor="middle" class="ezt" style="font-size:24px;fill:#4fc3f7"></text>
    <text x="140" y="370" text-anchor="middle" class="ezta" style="font-size:18px;fill:#8d95b5">لا دائرة إخراج داخل 34–39</text>`),
  ctl: `<button data-a="o23">💡 أضئ ليدًا على 23</button><button data-a="o34" class="warn">💡 أضئ ليدًا على 34</button><button data-a="r34">🌡️ اقرأ حساسًا على 34</button>`,
  cap: 'جرّب الأزرار الثلاثة وقارن',
  bind(q, cap) {
    let iv = 0;
    const reset = () => { clearInterval(iv); ['il23', 'il34'].forEach(i => q.$('#' + i).classList.remove('on')); ['iw23', 'iw34'].forEach(i => q.$('#' + i).classList.remove('hot')); q.$('#iblock').classList.add('ezhide'); q.$('#iread').textContent = ''; };
    q.btn('o23', () => { reset(); q.on('o23'); q.$('#il34g').classList.remove('ezhide'); q.$('#isens').classList.add('ezhide'); q.$('#il23').classList.add('on'); q.$('#iw23').classList.add('hot'); cap('23 طرف عادي: يُخرج ٣٫٣ فولت فيضيء الليد ✓', 'ok'); });
    q.btn('o34', () => { reset(); q.on('o34'); q.$('#il34g').classList.remove('ezhide'); q.$('#isens').classList.add('ezhide'); q.$('#iblock').classList.remove('ezhide'); cap('الكود يُرفع بلا أي رسالة خطأ… لكن الليد لا يضيء أبدًا: 34 باب «دخول فقط»', 'bad'); });
    q.btn('r34', () => { reset(); q.on('r34'); q.$('#il34g').classList.add('ezhide'); q.$('#isens').classList.remove('ezhide'); q.$('#iw34').classList.add('hot'); let t = 0;
      iv = setInterval(() => { t += .15; q.$('#iread').textContent = 'analogRead(34) = ' + Math.round(2000 + 900 * Math.sin(t)); }, 120); cap('هنا يتألق 34: يقرأ الحساسات بامتياز، وهو من ADC1 فيعمل حتى مع الواي فاي ✓', 'ok'); });
    q.clean(() => clearInterval(iv));
  },
};

/* ٤) أطراف الإقلاع: لحظة التشغيل */
S.strap = {
  svg: svg(`<rect x="20" y="20" width="720" height="44" rx="12" fill="#1c2650"/><rect id="stbar" x="20" y="20" width="0" height="44" rx="12" fill="#ffcf4a"/>
    <text x="380" y="50" text-anchor="middle" class="ezta" style="font-size:20px;fill:#0f1733" id="sttl">أول جزء من الثانية بعد التشغيل</text>
    ${CHIP(40, 110, 220, 210, '')}<text id="stchip" x="150" y="225" text-anchor="middle" class="ezta" style="font-size:26px">ESP32 ⏻</text>
    ${[0, 2, 5, 12, 15].map((g, i) => `<g transform="translate(330 ${110 + i * 50})"><rect width="200" height="40" rx="10" fill="#26315a"/><text x="20" y="28" class="ezt">GPIO${g}</text>
      <circle id="sc${g}" cx="170" cy="20" r="14" fill="#4a5170"/><text id="sx${g}" x="170" y="27" text-anchor="middle" style="font:900 20px var(--mono);fill:#fff"></text></g>`).join('')}
    <g id="stsens" class="ezhide"><path d="M530 280 H600" class="ezw hot"/><g transform="translate(650 280)"><rect x="-48" y="-38" width="96" height="76" rx="14" fill="#8e44ad"/><text text-anchor="middle" y="12" style="font-size:40px">📟</text></g>
      <text x="650" y="345" text-anchor="middle" class="ezta" style="font-size:18px">قطعة ترفعه HIGH</text></g>`),
  ctl: `<button data-a="pw" class="on">⚡ شغّل اللوحة</button><button data-a="att" class="warn">🔌 صِل قطعة على GPIO12</button>`,
  cap: 'اضغط «شغّل اللوحة» وراقب ما تفحصه الشريحة',
  bind(q, cap) {
    let att = false, T = [];
    const G = [0, 2, 5, 12, 15];
    const clr = () => { T.forEach(clearTimeout); T = []; G.forEach(g => { q.$('#sc' + g).setAttribute('fill', '#4a5170'); q.$('#sx' + g).textContent = ''; }); q.$('#stbar').setAttribute('width', 0); q.$('#stchip').textContent = 'ESP32 ⏻'; };
    const run = () => { clr(); cap('الشريحة تقرأ أطراف الإقلاع لتقرر: كيف أبدأ؟ من أي ذاكرة؟ بأي جهد؟', '');
      G.forEach((g, i) => T.push(setTimeout(() => { q.$('#stbar').setAttribute('width', 144 * (i + 1));
        const bad = att && g === 12; q.$('#sc' + g).setAttribute('fill', bad ? '#ff5a5a' : '#46d68c'); q.$('#sx' + g).textContent = bad ? '✗' : '✓';
        if (bad) { T.forEach(clearTimeout); q.$('#stchip').textContent = '❌ لم تُقلع'; cap('القطعة رفعت 12 إلى HIGH لحظة التشغيل، فظنّت الشريحة أن ذاكرتها ١٫٨ فولت… فتوقفت! افصلها وأعد التشغيل', 'bad'); } }, 500 + i * 650)));
      if (!att) T.push(setTimeout(() => { q.$('#stchip').textContent = '✅ يعمل برنامجك'; cap('أقلعت بنجاح ✓ ومن الآن تصير هذه الأطراف أطرافًا عادية تقريبًا: الخطر فقط لحظة التشغيل', 'ok'); }, 500 + 5 * 650)); };
    q.btn('pw', run); q.btn('att', () => { att = !att; q.$('[data-a=att]').classList.toggle('on', att); q.$('#stsens').classList.toggle('ezhide', !att); clr(); cap(att ? 'وُصلت قطعة بالطرف 12… الآن اضغط «شغّل اللوحة»' : 'فُصلت القطعة', att ? 'bad' : ''); });
    q.clean(() => T.forEach(clearTimeout));
  },
};

/* ٥) TX0 وRX0: خط الحاسوب */
S.serialpins = {
  svg: svg(`<g transform="translate(30 120)"><rect width="170" height="110" rx="10" fill="#2c3a66" stroke="#8d9bd0" stroke-width="4"/><rect x="12" y="12" width="146" height="78" fill="#0b1230"/><text x="85" y="62" text-anchor="middle" style="font-size:40px">💻</text><rect x="-15" y="110" width="200" height="16" rx="6" fill="#8d9bd0"/></g>
    <path d="M200 175 H290" class="ezw" style="stroke-width:10"/><text x="245" y="160" text-anchor="middle" class="ezt" style="font-size:16px">USB</text>
    <g transform="translate(290 135)"><rect width="110" height="80" rx="10" fill="#5b2c6f"/><text x="55" y="35" text-anchor="middle" class="ezt" style="font-size:15px">CP2102</text><text x="55" y="60" text-anchor="middle" class="ezta" style="font-size:15px">مترجم USB</text></g>
    <path d="M400 155 H560" class="ezw" id="txl"/><path d="M400 195 H560" class="ezw" id="rxl"/>
    <text x="480" y="143" text-anchor="middle" class="ezt" style="font-size:17px">TX0 · GPIO1</text><text x="480" y="225" text-anchor="middle" class="ezt" style="font-size:17px">RX0 · GPIO3</text>
    ${CHIP(560, 105, 170, 150)}
    <g id="pk"></g>
    <g id="sled" class="ezhide"><path d="M470 155 V255" class="ezw hot"/>${LED('sl', 470, 280, '#46d68c')}</g>
    <text id="sprog" x="380" y="370" text-anchor="middle" class="ezt" style="font-size:24px;fill:#ffcf4a"></text>`),
  ctl: `<button data-a="up" class="on">⬆️ ارفع برنامجًا</button><button data-a="led" class="warn">💡 صِل ليدًا على TX0</button>`,
  cap: 'عبر هذين الطرفين يمر كل شيء بين الحاسوب واللوحة',
  bind(q, cap) {
    let led = false, raf = 0, prog = -1, ts0 = 0;
    const pk = q.$('#pk');
    const loop = ts => { raf = requestAnimationFrame(loop); if (!ts0) ts0 = ts; const t = (ts - ts0) / 1000;
      pk.innerHTML = Array.from({ length: 6 }, (_, i) => { const p = ((t * .7 + i / 6) % 1); return `<circle cx="${400 + p * 160}" cy="155" r="7" fill="${led && prog >= 0 ? '#ff5a5a' : '#ffcf4a'}"/><circle cx="${560 - p * 160}" cy="195" r="7" fill="#4fc3f7"/>`; }).join('');
      if (led) q.$('#sl').classList.toggle('on', Math.sin(t * 40) > 0);
      if (prog >= 0) { prog = Math.min(100, t * 30); if (led && prog > 35) { q.$('#sprog').textContent = 'A fatal error occurred ✗'; cap('الليد «سرق» من التيار وشوّه الإشارات فتلفت البيانات وفشل الرفع. اترك TX0 وRX0 للحاسوب', 'bad'); prog = -1; }
        else { q.$('#sprog').textContent = `Writing… ${Math.round(prog)}%`; if (prog >= 100) { q.$('#sprog').textContent = 'تم الرفع ✓'; cap('رُفع البرنامج عبر TX0/RX0 ✓ ونفس الخطين تستعملهما الشاشة التسلسلية Serial', 'ok'); prog = -1; } } } };
    raf = requestAnimationFrame(loop);
    q.btn('up', () => { ts0 = 0; prog = 0; cap('البرنامج يعبر الآن على هذين الخطين…', ''); });
    q.btn('led', () => { led = !led; q.$('[data-a=led]').classList.toggle('on', led); q.$('#sled').classList.toggle('ezhide', !led); q.$('#sl').classList.remove('on'); cap(led ? 'لاحظ: الليد يرتعش مع البيانات! الآن جرّب الرفع' : 'فُصل الليد', led ? 'bad' : ''); });
    q.clean(() => cancelAnimationFrame(raf));
  },
};

/* ٦) ADC: من جهد إلى رقم + ADC2 والواي فاي */
S.adc = {
  svg: svg(`<g transform="translate(110 200)"><circle r="80" fill="#2b3566" stroke="#8d9bd0" stroke-width="5"/><g id="knob"><circle r="56" fill="#3d4a85"/><rect x="-6" y="-60" width="12" height="40" rx="5" fill="#ffcf4a"/></g>
    <text y="125" text-anchor="middle" class="ezta" style="font-size:19px">مقاومة متغيرة</text><text id="avolt" y="-100" text-anchor="middle" class="ezt" style="font-size:26px;fill:#ffcf4a">1.65 V</text></g>
    <path d="M190 200 H260 M260 200 V130 H330 M260 200 V280 H330" class="ezw hot"/>
    ${PIN(390, 130, 'GPIO34', '#46d68c')}${PIN(390, 280, 'GPIO4', '#c48cff')}
    <text x="390" y="95" text-anchor="middle" class="ezt" style="font-size:16px;fill:#46d68c">ADC1</text><text x="390" y="245" text-anchor="middle" class="ezt" style="font-size:16px;fill:#c48cff">ADC2</text>
    ${[['a1', 130], ['a2', 280]].map(([id, y]) => `<g transform="translate(470 ${y - 32})"><rect width="270" height="64" rx="12" fill="#1c2650"/><rect id="${id}b" x="6" y="44" width="0" height="12" rx="5" fill="#46d68c"/><text id="${id}" x="135" y="34" text-anchor="middle" class="ezt" style="font-size:24px"></text></g>`).join('')}
    <g id="wifi" class="ezhide" transform="translate(640 365)"><text text-anchor="middle" style="font-size:26px">📡</text><text x="-30" y="0" text-anchor="end" class="ezta" style="font-size:18px;fill:#ffcf4a">الواي فاي يعمل</text></g>`),
  ctl: `<span class="rl">🎛️ أدر المقبض</span><input type="range" min="0" max="330" value="165"><button data-a="wf" class="warn">📡 شغّل الواي فاي</button>`,
  cap: '',
  bind(q, cap) {
    let wifi = false; const r = q.$('input');
    const upd = () => { const v = r.value / 100, n = Math.round(v / 3.3 * 4095);
      q.$('#knob').setAttribute('transform', `rotate(${-135 + 270 * v / 3.3})`); q.$('#avolt').textContent = v.toFixed(2) + ' V';
      q.$('#a1').textContent = 'analogRead(34) = ' + n; q.$('#a1b').setAttribute('width', 258 * n / 4095);
      q.$('#a2').textContent = wifi ? '✗ مشغول بالواي فاي' : 'analogRead(4) = ' + n; q.$('#a2').style.fill = wifi ? '#ff7b6b' : ''; q.$('#a2b').setAttribute('width', wifi ? 0 : 258 * n / 4095);
      cap(wifi ? 'مع الواي فاي: ADC1 (32–39) يعمل ✓ أما ADC2 فيستعمله الواي فاي داخليًا فلا يقرأ ✗' : `${v.toFixed(2)} فولت ← الرقم ${n}: الجهد من ٠ إلى ٣٫٣ يتحول إلى رقم من ٠ إلى ٤٠٩٥`, wifi ? 'bad' : ''); };
    r.oninput = upd; q.btn('wf', () => { wifi = !wifi; q.$('[data-a=wf]').classList.toggle('on', wifi); q.$('#wifi').classList.toggle('ezhide', !wifi); upd(); }); upd();
  },
};

/* ٧) اللمس السعوي */
S.touch = {
  svg: svg(`<rect x="60" y="250" width="170" height="110" rx="10" fill="#b8c2d9" stroke="#6b7393" stroke-width="3"/><text x="145" y="315" text-anchor="middle" class="ezta" style="font-size:18px;fill:#1b2340">رقاقة ألمنيوم</text>
    <g id="fing" style="transition:transform .1s"><text x="145" y="0" text-anchor="middle" style="font-size:90px">👇</text></g>
    <path d="M230 305 H300" class="ezw"/>${PIN(360, 305, 'GPIO4 · T0', '#4fc3f7')}<path d="M418 305 H440" class="ezw"/>
    <g transform="translate(450 40)"><rect width="290" height="200" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><path id="tline" fill="none" stroke="#4fc3f7" stroke-width="4"/>
      <line x1="0" x2="290" y1="${200 - 30 * 2.4}" y2="${200 - 30 * 2.4}" stroke="#ff7b6b" stroke-width="3" stroke-dasharray="10 8"/><text x="284" y="${190 - 30 * 2.4}" text-anchor="end" class="ezt" style="font-size:15px;fill:#ff7b6b">العتبة 30</text></g>
    <text id="tval" x="595" y="275" text-anchor="middle" class="ezt" style="font-size:26px"></text>${LED('tled', 640, 320, '#4fc3f7')}`),
  ctl: `<span class="rl">☝️ قرّب إصبعك</span><input type="range" min="0" max="100" value="0">`,
  cap: '',
  bind(q, cap) {
    const r = q.$('input'), H = []; let raf = 0, last = 0;
    const loop = ts => { raf = requestAnimationFrame(loop); if (ts - last < 70) return; last = ts;
      const c = r.value / 100, v = Math.round(72 - 60 * c * c + (Math.random() - .5) * 4); H.push(v); if (H.length > 50) H.shift();
      q.$('#tline').setAttribute('d', 'M' + H.map((h, i) => `${i * 290 / 49} ${200 - h * 2.4}`).join(' L'));
      q.$('#fing').setAttribute('transform', `translate(0 ${70 + c * 150})`); q.$('#tval').textContent = 'touchRead(4) = ' + v;
      const on = v < 30; q.$('#tled').classList.toggle('on', on);
      cap(on ? 'الرقم نزل تحت ٣٠ ← الكود يعتبرها «لمسة» فيضيء الليد ✓' : c > .2 ? 'كلما اقترب الإصبع نزل الرقم: جسمك يخزّن شحنة فيغيّر «سعة» الطرف' : 'بلا لمس: الرقم مرتفع (حوالي ٧٠)', on ? 'ok' : ''); };
    raf = requestAnimationFrame(loop); q.clean(() => cancelAnimationFrame(raf));
  },
};

/* ٨) DAC مقابل PWM */
S.dac = {
  svg: svg(`${[['PWM · GPIO23', 30, 'pw'], ['DAC · GPIO25', 210, 'dc']].map(([t, y, id]) => `<g transform="translate(30 ${y})"><rect width="560" height="150" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/>
      <text x="14" y="30" class="ezt" style="font-size:18px;fill:#8d95b5">${t}</text><path id="${id}" fill="none" stroke="${id === 'pw' ? '#ffcf4a' : '#46d68c'}" stroke-width="5"/></g>
      <g transform="translate(680 ${y + 75})"><rect x="-70" y="-40" width="140" height="80" rx="14" fill="#e8d36a"/><rect x="-58" y="-28" width="116" height="46" rx="8" fill="#1d2a18"/><text id="${id}v" text-anchor="middle" y="6" style="font:700 30px VT323,monospace;fill:#9cff7a"></text></g>`).join('')}`),
  ctl: `<span class="rl">القيمة</span><input type="range" min="0" max="255" value="128"><span class="rl" id="dval">128</span>`,
  cap: '',
  bind(q, cap) {
    const r = q.$('input');
    const upd = () => { const v = +r.value, d = v / 255, y0 = 130, y1 = 45; let p = `M0 ${y0}`;
      for (let k = 0; k < 6; k++) { const x = 20 + k * 90; p += ` H${x} V${d > 0 ? y1 : y0} H${x + 90 * d} V${y0}`; } p += ' H560';
      q.$('#pw').setAttribute('d', p); const y = y0 - (y0 - y1) * d; q.$('#dc').setAttribute('d', `M0 ${y} H560`);
      q.$('#pwv').textContent = q.$('#dcv').textContent = (3.3 * d).toFixed(2) + ' V'; q.$('#dval').textContent = v;
      cap(`نفس القيمة ${v}… PWM يقفز بين ٠ و٣٫٣ بسرعة (المتوسط ${(3.3 * d).toFixed(2)})، أما DAC فيُخرج ${(3.3 * d).toFixed(2)} فولت ثابتة حقيقية`, ''); };
    r.oninput = upd; upd();
  },
};

/* ٩) الطاقة: USB وVIN و3V3 وGND */
S.power = {
  svg: svg(`<g id="srcusb" transform="translate(30 110)"><rect width="120" height="80" rx="12" fill="#2c3a66"/><text x="60" y="52" text-anchor="middle" class="ezt" style="font-size:22px">USB 5V</text></g>
    <g id="srcbat" class="ezhide" transform="translate(30 110)"><rect width="120" height="80" rx="12" fill="#1f8a55"/><text x="60" y="52" text-anchor="middle" class="ezt" style="font-size:20px">🔋 7–9V</text></g>
    <path d="M150 150 H250" class="ezw red" style="stroke-width:7"/><text x="200" y="135" text-anchor="middle" class="ezt" style="font-size:16px;fill:#ff7b6b">VIN</text>
    <g transform="translate(250 105)"><rect width="140" height="90" rx="12" fill="#5b2c6f"/><text x="70" y="40" text-anchor="middle" class="ezta" style="font-size:18px">منظّم الجهد</text><text x="70" y="70" text-anchor="middle" class="ezt" style="font-size:18px">→ 3.3V</text></g>
    <path d="M390 150 H470" class="ezw or" style="stroke-width:7"/>${CHIP(470, 90, 150, 120)}
    <path id="p33" d="M430 150 V300 H560" class="ezw or" style="stroke-width:7;opacity:.25"/><text x="440" y="250" class="ezt" style="font-size:16px;fill:#ffa53a">3V3</text>
    <g id="psens" transform="translate(620 300)" style="opacity:.25"><rect x="-55" y="-35" width="110" height="70" rx="12" fill="#2b6fc0"/><text text-anchor="middle" y="10" class="ezta" style="font-size:18px">حساس 3.3V</text></g>
    <path d="M30 370 H730" class="ezw blk" style="stroke-width:7"/><text x="380" y="360" text-anchor="middle" class="ezt" style="font-size:16px;fill:#8d95b5">GND مشترك (السالب)</text>
    <g id="pbad" class="ezhide"><path d="M700 120 H640 V150 H632" class="ezw red" style="stroke-width:7"/><text x="705" y="110" class="ezt" style="font-size:16px;fill:#ff7b6b">5V!</text>
      <text x="545" y="80" style="font-size:54px" class="ezpulse">💨🔥</text></g>`),
  ctl: `<button data-a="usb" class="on">🔌 من USB</button><button data-a="bat">🔋 بطارية على VIN</button><button data-a="sen">🌡️ غذِّ حساسًا</button><button data-a="bad" class="warn">⚠️ 5V على طرف GPIO</button>`,
  cap: '',
  bind(q, cap) {
    const set = m => { q.on(m); q.$('#srcusb').classList.toggle('ezhide', m === 'bat'); q.$('#srcbat').classList.toggle('ezhide', m !== 'bat');
      q.$('#p33').style.opacity = q.$('#psens').style.opacity = m === 'sen' ? 1 : .25; q.$('#pbad').classList.toggle('ezhide', m !== 'bad');
      cap(...{ usb: ['USB يعطي ٥ فولت، والمنظّم على اللوحة يخفضها إلى ٣٫٣ فولت التي تعيش عليها الشريحة ✓', 'ok'], bat: ['بطارية ٧–٩ فولت على VIN والسالب على GND: المنظّم يتكفّل بالباقي ✓ (لا تصل USB وVIN معًا)', 'ok'],
        sen: ['الحساسات الصغيرة تأخذ طاقتها من 3V3، وكل الأرضيات GND تُوصل معًا ✓', 'ok'], bad: ['❌ أطراف GPIO تتحمل ٣٫٦ فولت كحد أقصى: ٥ فولت مباشرة قد تتلف الشريحة. استعمل مقسّم جهد', 'bad'] }[m]); };
    ['usb', 'bat', 'sen', 'bad'].forEach(m => q.btn(m, () => set(m))); set('usb');
  },
};

/* ١٠) التعريف والمنفذ COM */
S.driver = {
  svg: svg(`<g transform="translate(20 20)"><rect width="440" height="330" rx="16" fill="#e9edf6"/><rect width="440" height="44" rx="16" fill="#2b3566"/><text x="220" y="30" text-anchor="middle" class="ezta" style="font-size:19px">إدارة الأجهزة (Device Manager)</text>
    <text x="410" y="90" text-anchor="end" class="ezta" style="font-size:20px;fill:#1b2340">▾ المنافذ (COM &amp; LPT)</text>
    <text id="dvline" x="400" y="135" text-anchor="end" class="ezta" style="font-size:20px;fill:#1b2340"></text>
    <rect x="20" y="190" width="400" height="120" rx="12" fill="#fff" stroke="#c6cde0"/><text x="400" y="220" text-anchor="end" class="ezta" style="font-size:18px;fill:#5e6782">Arduino IDE ← Tools ← Port</text>
    <text id="dvide" x="400" y="270" text-anchor="end" class="ezt" style="font-size:24px;fill:#1b2340"></text></g>
    <path id="dvcab" d="M470 200 C 540 200, 540 260, 590 260" class="ezw" style="stroke-width:9;opacity:.2"/>
    <g transform="translate(590 170)"><rect width="150" height="190" rx="12" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/><rect x="45" y="150" width="60" height="30" rx="5" fill="#9aa3bd"/>
      <rect x="40" y="95" width="70" height="40" rx="5" fill="#111"/><text x="75" y="120" text-anchor="middle" class="ezt" style="font-size:13px">CP2102</text><circle id="dvpwr" cx="30" cy="30" r="10" fill="#4a1d1d"/></g>`),
  ctl: `<button data-a="cab">🔌 صِل كابل بيانات</button><button data-a="drv">💿 ثبّت التعريف</button><button data-a="chg" class="warn">🔋 كابل شحن فقط</button>`,
  cap: 'ابدأ بتوصيل الكابل…',
  bind(q, cap) {
    let cab = 0, drv = false;
    const upd = () => { q.$('#dvcab').style.opacity = cab ? 1 : .2; q.$('#dvpwr').setAttribute('fill', cab ? '#ff3b3b' : '#4a1d1d');
      const ln = q.$('#dvline'), ide = q.$('#dvide');
      if (!cab) { ln.textContent = ''; ide.textContent = '(لا يوجد)'; cap('لا كابل… لا منفذ', ''); }
      else if (cab === 2) { ln.textContent = ''; ide.textContent = '(لا يوجد)'; cap('الليد الأحمر يضيء (طاقة) لكن لا منفذ! كابل الشحن بلا أسلاك بيانات: غيّره بكابل بيانات', 'bad'); }
      else if (!drv) { ln.textContent = '⚠️ جهاز غير معروف'; ln.style.fill = '#c0392b'; ide.textContent = '(لا يوجد)'; cap('ويندوز رأى جهازًا لكنه لا يعرف «لغته»: يحتاج تعريف المترجم CP210x أو CH340 (اقرأ اسمه قرب منفذ USB)', 'bad'); }
      else { ln.textContent = '✅ Silicon Labs CP210x (COM5)'; ln.style.fill = '#1f8a55'; ide.textContent = '☑ COM5'; cap('ظهر المنفذ COM5 ✓ اختره في Arduino IDE ثم ارفع', 'ok'); } };
    q.btn('cab', () => { cab = 1; upd(); }); q.btn('chg', () => { cab = 2; upd(); }); q.btn('drv', () => { drv = true; q.$('[data-a=drv]').classList.add('on'); upd(); }); upd();
  },
};

/* ١١) زر BOOT ووضع الرفع */
S.bootbtn = {
  svg: svg(`<g transform="translate(20 20)"><rect width="430" height="340" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="14" y="28" class="ezt" style="font-size:15px;fill:#8d95b5">Output</text>
    <text id="bcon" x="14" y="62" class="ezmono" style="fill:#d6dcf5"></text></g>
    <g transform="translate(480 60)"><rect width="250" height="270" rx="16" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/><text x="125" y="120" text-anchor="middle" class="ezt" style="font-size:24px">ESP32</text>
      <g id="ben" class="ezbtn" transform="translate(60 210)"><rect x="-34" y="-24" width="68" height="48" rx="8" fill="#39415f"/><circle r="15" fill="#c9cfe6"/><text y="52" text-anchor="middle" class="ezt" style="font-size:17px">EN</text></g>
      <g id="bboot" class="ezbtn" transform="translate(190 210)"><rect x="-34" y="-24" width="68" height="48" rx="8" fill="#39415f" stroke="#ffcf4a" stroke-width="3"/><g class="cap"><circle r="15" fill="#ffcf4a"/></g><text y="52" text-anchor="middle" class="ezt" style="font-size:17px;fill:#ffcf4a">BOOT</text></g>
      <text x="190" y="160" text-anchor="middle" class="ezta" style="font-size:15px;fill:#ffcf4a">= GPIO0</text></g>`),
  ctl: `<button data-a="up" class="on">▶ ارفع البرنامج</button><button data-a="auto">🤖 لوحة تضغطه تلقائيًا</button><span class="rl">ثم اضغط BOOT في الرسم ⬆</span>`,
  cap: 'اضغط «ارفع البرنامج» وراقب Connecting…',
  bind(q, cap) {
    let auto = false, st = 'idle', T = 0, lines = [], dots = '', pressed = false;
    const con = q.$('#bcon');
    const draw = () => { con.innerHTML = [...lines, st === 'conn' ? 'Connecting' + dots : ''].slice(-10).map((l, i) => `<tspan x="14" dy="${i ? 30 : 0}">${l}</tspan>`).join(''); };
    const tick = () => {
      if (st === 'conn') { dots += dots.length % 2 ? '_' : '.'; draw();
        if (pressed || (auto && dots.length > 4)) { st = 'write'; lines.push('Connecting' + dots, 'Chip is ESP32-D0WD-V3'); dots = 0; cap(auto ? 'اللوحة ضغطت BOOT وحدها عبر المترجم ✓' : 'دخلت «وضع الرفع» لأن GPIO0 كان LOW ✓ يمكنك ترك الزر الآن', 'ok'); }
        else if (dots.length > 22) { st = 'idle'; lines.push('Connecting' + dots, '<tspan fill="#ff7b6b">A fatal error occurred:</tspan>', '<tspan fill="#ff7b6b">Failed to connect to ESP32</tspan>'); draw(); cap('فشل! كان يجب ضغط BOOT (والاستمرار) أثناء ظهور Connecting…', 'bad'); return; } }
      else if (st === 'write') { dots += 20; lines.push(`Writing at 0x000${dots < 100 ? '1' : '2'}0000… (${Math.min(100, dots)}%)`); draw();
        if (dots >= 100) { st = 'idle'; lines.push('Hard resetting via RTS pin…', '<tspan fill="#46d68c">✓ Done uploading</tspan>'); draw(); cap('تم الرفع ✓ ثم أعادت اللوحة التشغيل إلى «الوضع العادي» فبدأ برنامجك', 'ok'); return; } }
      T = setTimeout(tick, st === 'conn' ? 280 : 420); };
    q.btn('up', () => { clearTimeout(T); lines = ['Sketch uses 268,000 bytes (20%)', 'esptool v4.8 · Serial port COM5']; dots = ''; st = 'conn'; draw(); cap('اللوحة تنتظر إشارة: هل تدخل وضع الرفع؟ اضغط BOOT الآن!', ''); tick(); });
    q.btn('auto', () => { auto = !auto; q.$('[data-a=auto]').classList.toggle('on', auto); });
    const b = q.$('#bboot'); b.onpointerdown = () => { pressed = true; b.classList.add('down'); }; b.onpointerup = b.onpointerleave = () => { pressed = false; b.classList.remove('down'); };
    draw(); q.clean(() => clearTimeout(T));
  },
};

/* ١٢) زر EN: إعادة التشغيل */
S.enbtn = {
  svg: svg(`<g transform="translate(20 20)"><rect width="430" height="340" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="14" y="28" class="ezt" style="font-size:15px;fill:#8d95b5">Serial Monitor · 115200</text>
    <text id="econ" x="14" y="62" class="ezmono" style="fill:#d6dcf5"></text></g>
    <g transform="translate(480 60)"><rect width="250" height="270" rx="16" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/><text x="125" y="110" text-anchor="middle" class="ezt" style="font-size:24px">ESP32</text>
      <circle id="eled" cx="125" cy="150" r="12" fill="#1e2a5b"/>
      <g id="enb" class="ezbtn" transform="translate(60 210)"><rect x="-34" y="-24" width="68" height="48" rx="8" fill="#39415f" stroke="#ff7b6b" stroke-width="3"/><g class="cap"><circle r="15" fill="#ff7b6b"/></g><text y="52" text-anchor="middle" class="ezt" style="font-size:17px;fill:#ff7b6b">EN</text></g>
      <g transform="translate(190 210)"><rect x="-34" y="-24" width="68" height="48" rx="8" fill="#39415f"/><circle r="15" fill="#c9cfe6"/><text y="52" text-anchor="middle" class="ezt" style="font-size:17px">BOOT</text></g></g>`),
  ctl: `<button data-a="en" class="on">🔁 اضغط EN</button>`,
  cap: 'البرنامج يعمل: يعدّ الثواني ويومض الليد الأزرق',
  bind(q, cap) {
    let n = 0, lines = ['setup: بدأ البرنامج'], iv = 0;
    const draw = () => q.$('#econ').innerHTML = lines.slice(-10).map((l, i) => `<tspan x="14" dy="${i ? 30 : 0}">${l}</tspan>`).join('');
    const start = () => { clearInterval(iv); iv = setInterval(() => { n++; lines.push('loop: الثانية ' + n); q.$('#eled').setAttribute('fill', n % 2 ? '#3b82ff' : '#1e2a5b'); draw(); }, 900); };
    const press = () => { clearInterval(iv); const b = q.$('#enb'); b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 200); n = 0;
      lines.push('<tspan fill="#ffcf4a">rst:0x1 (POWERON_RESET)</tspan>', '<tspan fill="#ffcf4a">ets Jul 29 2019 … boot:0x13</tspan>', 'setup: بدأ البرنامج'); draw();
      cap('EN أعاد تشغيل الشريحة: البرنامج بدأ من setup والعدّ رجع للصفر — مثل فصل الكابل وتوصيله، دون فصله ✓', 'ok'); setTimeout(start, 500); };
    q.btn('en', press); q.$('#enb').onpointerdown = press; draw(); start(); q.clean(() => clearInterval(iv));
  },
};

/* ١٣) سرعة الاتصال baud */
S.baud = {
  svg: svg(`${CHIP(30, 110, 180, 160)}<text x="120" y="300" text-anchor="middle" class="ezt" style="font-size:17px;fill:#ffcf4a">Serial.begin(115200)</text>
    <path d="M222 190 H310" class="ezw hot"/><g id="bpk"></g>
    <g transform="translate(310 40)"><rect width="430" height="320" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="14" y="28" class="ezt" style="font-size:15px;fill:#8d95b5">Serial Monitor</text>
      <text id="bsp" x="416" y="28" text-anchor="end" class="ezt" style="font-size:15px;fill:#ffcf4a"></text><text id="bcon2" x="14" y="66" class="ezmono" style="fill:#d6dcf5;font-size:20px"></text></g>`),
  ctl: `<span class="rl">سرعة الشاشة:</span><button data-a="9600" class="warn">9600</button><button data-a="57600" class="warn">57600</button><button data-a="115200">115200</button>`,
  cap: '',
  bind(q, cap) {
    let sp = 9600, lines = [], k = 0, iv = 0;
    const junk = () => Array.from({ length: 14 }, () => '⸮�ÿ¥xàÐ~'[Math.floor(Math.random() * 9)]).join('');
    const draw = () => q.$('#bcon2').innerHTML = lines.slice(-9).map((l, i) => `<tspan x="14" dy="${i ? 30 : 0}">${l}</tspan>`).join('');
    const set = s => { sp = s; q.on(String(s)); q.$('#bsp').textContent = s + ' baud'; lines = []; draw();
      cap(s === 115200 ? 'السرعتان متطابقتان ✓ فتظهر الرسائل واضحة' : `اللوحة ترسل بـ 115200 والشاشة تقرأ بـ ${s}: كل منهما «يعدّ» البتات بسرعة مختلفة فتظهر رموز غريبة ✗`, s === 115200 ? 'ok' : 'bad'); };
    iv = setInterval(() => { k++; lines.push(sp === 115200 ? 'temp = ' + (24 + k % 5) + ' C  مرحبا' : junk()); draw(); }, 700);
    [9600, 57600, 115200].forEach(s => q.btn(String(s), () => set(s))); set(9600); q.clean(() => clearInterval(iv));
  },
};

/* ١٤) دورة العمل Duty */
S.duty = {
  svg: svg(`<g transform="translate(30 40)"><rect width="480" height="200" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><path id="dw" fill="none" stroke="#ffcf4a" stroke-width="5"/>
    <text x="10" y="58" class="ezt" style="font-size:15px;fill:#8d95b5">3.3V</text><text x="10" y="186" class="ezt" style="font-size:15px;fill:#8d95b5">0V</text></g>
    ${LED('dled', 630, 110, '#ffcf4a')}
    <g transform="translate(140 300)"><rect x="-100" y="-40" width="200" height="80" rx="14" fill="#e8d36a"/><rect x="-86" y="-28" width="172" height="46" rx="8" fill="#1d2a18"/><text id="dv" text-anchor="middle" y="6" style="font:700 30px VT323,monospace;fill:#9cff7a"></text></g>
    <text id="dcode" x="500" y="310" text-anchor="middle" class="ezt" style="font-size:22px;fill:#ffcf4a"></text>`),
  ctl: `<span class="rl">نسبة التشغيل</span><input type="range" min="0" max="100" value="25"><span class="rl" id="dpc"></span>`,
  cap: '',
  bind(q, cap) {
    const r = q.$('input');
    const upd = () => { const d = r.value / 100; let p = 'M20 175'; for (let k = 0; k < 4; k++) { const x = 20 + k * 110; p += ` H${x} V${d > 0 ? 55 : 175} H${x + 110 * d} V175`; } p += ' H470';
      q.$('#dw').setAttribute('d', p); const led = q.$('#dled'); led.classList.toggle('on', d > 0); led.style.opacity = .25 + .75 * d; led.querySelector('.glow').style.opacity = .7 * d;
      q.$('#dv').textContent = (3.3 * d).toFixed(2) + ' V'; q.$('#dpc').textContent = AR(Math.round(d * 100)) + '٪'; q.$('#dcode').textContent = `ledcWrite(23, ${Math.round(d * 255)});`;
      cap(`الطرف «مشغّل» ${AR(Math.round(d * 100))}٪ من كل دورة و«مطفأ» الباقي — أسرع من أن تراه العين، فترى ضوءًا خافتًا بمتوسط ${(3.3 * d).toFixed(2)} فولت`, ''); };
    r.oninput = upd; upd();
  },
};

/* ١٥) التردد */
S.freq = {
  svg: svg(`<g transform="translate(30 40)"><rect width="480" height="200" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><path id="fw" fill="none" stroke="#4fc3f7" stroke-width="4"/></g>
    ${LED('fled', 630, 110, '#4fc3f7')}<text id="fhz" x="270" y="310" text-anchor="middle" class="ezt" style="font-size:40px;fill:#4fc3f7"></text>
    <text id="feye" x="630" y="250" text-anchor="middle" class="ezta" style="font-size:20px"></text>`),
  ctl: `<span class="rl">التردد</span><input type="range" min="0" max="100" value="10">`,
  cap: '',
  bind(q, cap) {
    const r = q.$('input'); let raf = 0, f = 1;
    const upd = () => { f = Math.round(Math.pow(10, r.value / 100 * Math.log10(5000))); const n = Math.min(f, 60); let p = 'M20 175';
      for (let k = 0; k < n; k++) { const x = 20 + k * 440 / n; p += ` H${x} V55 H${x + 220 / n} V175`; } p += ' H460';
      q.$('#fw').setAttribute('d', p); q.$('#fhz').textContent = f + ' Hz'; q.$('#feye').textContent = f < 50 ? 'العين ترى وميضًا' : 'العين ترى ضوءًا ثابتًا';
      cap(f < 50 ? `${f} مرة في الثانية: بطيء فترى الليد يومض. التردد = عدد مرات التشغيل والإطفاء في الثانية` : `${f} مرة في الثانية: أسرع من العين ← ضوء ثابت ✓ لليد نستعمل 5000، وللجرس التردد = النغمة`, f < 50 ? '' : 'ok'); };
    const loop = ts => { raf = requestAnimationFrame(loop); const led = q.$('#fled'); led.classList.toggle('on', f >= 50 || Math.floor(ts / 1000 * f * 2) % 2 === 0); };
    r.oninput = upd; upd(); raf = requestAnimationFrame(loop); q.clean(() => cancelAnimationFrame(raf));
  },
};

/* ١٦) الدقة بالبت */
S.res = {
  svg: svg(`<g transform="translate(30 30)"><rect width="700" height="250" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><path id="rs" fill="none" stroke="#46d68c" stroke-width="4"/></g>
    <text id="rt" x="380" y="330" text-anchor="middle" direction="rtl" class="ezta" style="font-size:28px;fill:#46d68c"></text><text id="rt2" x="380" y="372" text-anchor="middle" direction="rtl" class="ezta" style="font-size:20px"></text>`),
  ctl: `<button data-a="1">١ بت</button><button data-a="3">٣ بت</button><button data-a="8" class="on">٨ بت</button><button data-a="10">١٠ بت</button><button data-a="12">١٢ بت</button>`,
  cap: '',
  bind(q, cap) {
    const set = b => { q.on(String(b)); const N = 2 ** b, n = Math.min(N, 128); let p = 'M20 230';
      for (let i = 0; i < n; i++) { const x = 20 + i * 660 / n, y = 230 - (i / (n - 1 || 1)) * 200; p += ` V${y} H${20 + (i + 1) * 660 / n}`; } q.$('#rs').setAttribute('d', p);
      q.$('#rt').textContent = `عدد الدرجات: ${AR(N)} (من ٠ إلى ${AR(N - 1)})`; q.$('#rt2').textContent = `كل درجة = ${AR((3300 / (N - 1)).toFixed(N > 1000 ? 2 : 1)).replace('.', '٫')} مللي فولت`;
      cap(b === 1 ? 'بت واحد = درجتان فقط: مطفأ أو مشغّل (مثل digitalWrite)' : b >= 10 ? `${N} درجة: سلم ناعم جدًا ← تحكم دقيق (ADC في ESP32 دقته ١٢ بت: ٠–٤٠٩٥)` : `${N} درجة: كل بت إضافي يضاعف عدد الدرجات`, b >= 8 ? 'ok' : ''); };
    [1, 3, 8, 10, 12].forEach(b => q.btn(String(b), () => set(b))); set(8);
  },
};

/* ١٧) الطرف العائم وINPUT_PULLUP */
S.pullup = {
  svg: svg(`${CHIP(30, 80, 230, 230, '')}<text x="145" y="110" text-anchor="middle" class="ezt" style="font-size:20px">ESP32</text>
    <g id="pr" class="ezhide"><path d="M200 130 V150" class="ezw or"/><rect x="188" y="150" width="24" height="60" rx="4" fill="#d9b26f"/><path d="M200 210 V240" class="ezw or"/><text x="165" y="140" text-anchor="end" class="ezt" style="font-size:15px;fill:#ffa53a">3.3V</text><text x="180" y="185" text-anchor="end" class="ezt" style="font-size:14px;fill:#ffa53a">مقاومة داخلية</text></g>
    <path d="M200 240 H272" class="ezw"/>${PIN(320, 240, 'GPIO4')}<path d="M378 240 H430" class="ezw"/>${BTN('pb', 470, 240)}<path d="M508 240 H540 V340 H30" class="ezw blk"/><text x="560" y="335" class="ezt" style="font-size:16px;fill:#8d95b5">GND</text>
    <g transform="translate(470 30)"><rect width="270" height="150" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><path id="pl" fill="none" stroke="#ffcf4a" stroke-width="4"/><text x="8" y="36" class="ezt" style="font-size:14px;fill:#8d95b5">1</text><text x="8" y="132" class="ezt" style="font-size:14px;fill:#8d95b5">0</text></g>
    <text id="pv" x="605" y="215" text-anchor="middle" class="ezt" style="font-size:22px"></text><text x="470" y="300" text-anchor="middle" class="ezta" style="font-size:17px">اضغطني</text>`),
  ctl: `<button data-a="in" class="on warn">INPUT (بلا مقاومة)</button><button data-a="pu">INPUT_PULLUP</button>`,
  cap: '',
  bind(q, cap) {
    let mode = 'in', pressed = false, H = [], raf = 0, last = 0;
    const set = m => { mode = m; q.on(m); q.$('#pr').classList.toggle('ezhide', m !== 'pu'); };
    const b = q.$('#pb'); b.onpointerdown = () => { pressed = true; b.classList.add('down'); }; b.onpointerup = b.onpointerleave = () => { pressed = false; b.classList.remove('down'); };
    const loop = ts => { raf = requestAnimationFrame(loop); if (ts - last < 90) return; last = ts;
      const v = pressed ? 0 : mode === 'pu' ? 1 : (Math.random() < .5 ? 1 : 0); H.push(v); if (H.length > 40) H.shift();
      q.$('#pl').setAttribute('d', 'M' + H.map((h, i) => `${25 + i * 240 / 39} ${h ? 40 : 125}`).join(' L'));
      q.$('#pv').textContent = 'digitalRead = ' + v;
      cap(pressed ? 'مضغوط ← الطرف متصل بـ GND ← يقرأ 0 (LOW) ✓ انتبه: مع PULLUP «مضغوط = 0»' : mode === 'pu' ? 'غير مضغوط ← المقاومة الداخلية «تسحب» الطرف إلى ٣٫٣ فولت ← يقرأ 1 ثابتًا ✓' : 'غير مضغوط والطرف «عائم» (غير متصل بشيء): يلتقط الشحنات من الهواء فيقرأ 0 و1 عشوائيًا ✗', pressed || mode === 'pu' ? 'ok' : 'bad'); };
    q.btn('in', () => set('in')); q.btn('pu', () => set('pu')); raf = requestAnimationFrame(loop); q.clean(() => cancelAnimationFrame(raf));
  },
};

/* ================== نوع الشريحة ================== */
Object.assign(window.DECK_TYPES, {
  explain: s => { const sc = S[s.scene];
    return `<div class="slide light ezp">
      <div class="ezphd"><div class="kicker">${s.kicker || '🔎 شرح وافٍ'}</div><h2 class="title">${s.title}</h2></div>
      <div class="ezpg">
        <div class="ezpR">${['what', 'why', 'use', 'avoid'].filter(k => s[k]).map(k => `<div class="ezpb f" style="--bc:${BOX[k][2]}"><div class="lb"><i>${BOX[k][0]}</i>${s.lbl && s.lbl[k] || BOX[k][1]}</div><p>${s[k]}</p></div>`).join('')}</div>
        <div class="ezpL"><div class="ezpsc ix">${sc.svg}</div><div class="ezpctl ix">${sc.ctl}</div><div class="ezpcap">${sc.cap || ''}</div>${s.analogy ? `<div class="ezpana">🏠 <b>تشبيه:</b> ${s.analogy}</div>` : ''}</div>
      </div></div>`; },
});
Object.assign(window.DECK_BIND, {
  explain(sl, s) {
    const sc = S[s.scene]; if (!sc || !sc.bind) return;
    const capEl = sl.querySelector('.ezpcap');
    const q = { $: x => sl.querySelector(x), all: x => sl.querySelectorAll(x),
      btn: (a, fn) => { const b = sl.querySelector(`.ezpctl [data-a="${a}"]`); if (b) b.onclick = fn; },
      on: a => sl.querySelectorAll('.ezpctl button[data-a]').forEach(b => { if (!['att', 'led', 'wf', 'auto', 'drv'].includes(b.dataset.a)) b.classList.toggle('on', b.dataset.a === a); }),
      clean: f => window.DECK_CLEANUP.push(f) };
    const cap = (t, k) => { capEl.innerHTML = t; capEl.classList.toggle('ok', k === 'ok'); capEl.classList.toggle('bad', k === 'bad'); };
    sc.bind(q, cap);
  },
});
})();
