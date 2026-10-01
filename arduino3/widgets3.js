/* =====================================================================
   أدوات «أكاديمية سيارة الروبوت» — المرحلة الأولى
   الأنواع: carhero · carxray · speedlab · difflab
   تعتمد على window.ARD (التلوين والكود) من ../arduino/widgets.js
   فيزياء الدفع التفاضلي: v = (vL + vR) / 2 · ω = (vR − vL) / W · R = v / ω
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;

/* ---------- سيارة مرسومة من أعلى (المقدمة نحو +x) ---------- */
const miniCar = (cls = '') => `<g class="mcar ${cls}">
  <rect x="-34" y="-30" width="22" height="12" rx="4" class="mtire"/><rect x="-34" y="18" width="22" height="12" rx="4" class="mtire"/>
  <rect x="-40" y="-20" width="74" height="40" rx="10" class="mbody"/>
  <rect x="-18" y="-12" width="26" height="24" rx="4" class="mboard"/>
  <rect x="30" y="-14" width="10" height="28" rx="3" class="msonar"/><circle cx="36" cy="-7" r="3.4" class="meye"/><circle cx="36" cy="7" r="3.4" class="meye"/>
  <circle cx="-36" cy="0" r="5" class="mcaster"/></g>`;

/* ================== الافتتاح: سيارة تجوب الشريحة ================== */
const MODES = [['🎮', 'يُقاد بالجوال'], ['〰️', 'يتبع الخط'], ['🧱', 'يتجنب العوائق'], ['🥋', 'يصارع في السومو'], ['🧭', 'يحل المتاهة'], ['🏁', 'يسابق بذكاء PID']];
const TRACK = 'M300 470 C 300 330, 520 300, 700 330 S 1000 470, 1180 400 S 1400 180, 1250 140 S 900 170, 760 150 S 380 90, 260 200 S 180 560, 300 470 Z';
const heroSVG = () => `<svg viewBox="0 0 1600 640" class="herosvg">
  <defs><pattern id="hgrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 L0 0 0 60" fill="none" stroke="rgba(240,204,122,.07)" stroke-width="2"/></pattern>
    <radialGradient id="hglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f0cc7a" stop-opacity=".35"/><stop offset="1" stop-color="#f0cc7a" stop-opacity="0"/></radialGradient></defs>
  <rect width="1600" height="640" fill="url(#hgrid)"/>
  <circle cx="1420" cy="470" r="120" class="hring"/><circle cx="1420" cy="470" r="104" class="hring2"/><text x="1420" y="480" class="hrt">السومو</text>
  ${[[560, 210], [980, 300], [1080, 120]].map(([x, y]) => `<rect x="${x}" y="${y}" width="46" height="46" rx="6" class="hbox"/>`).join('')}
  <path d="${TRACK}" class="htrack"/><path d="${TRACK}" class="htrack2"/>
  <g><circle r="90" fill="url(#hglow)"/>${miniCar('hero')}
    <path d="M40 0 L190 -60 L190 60 Z" class="hbeam"/>
    <animateMotion dur="16s" repeatCount="indefinite" rotate="auto" path="${TRACK}"/></g>
</svg>`;

/* ================== السيارة بالأشعة السينية ================== */
const PARTS = [
  { k: 'chassis', icon: '🟫', ar: 'الهيكل', en: 'Chassis', spec: ['لوح أكريليك أو ألمنيوم مثقّب', 'يحمل كل القطع في طابق أو طابقين'], job: 'العمود الفقري: كل قطعة تُثبّت عليه', topic: '٤', dx: 0, dy: 0 },
  { k: 'motorL', icon: '🟡', ar: 'محرك TT الأيسر', en: 'TT Gear Motor', spec: ['٣–٦ فولت', 'تروس بنسبة ١:٤٨', 'نحو ٢٠٠ دورة/دقيقة على ٦ فولت'], job: 'يدير العجلة اليسرى للأمام أو للخلف', topic: '٢', dx: -150, dy: 0 },
  { k: 'motorR', icon: '🟡', ar: 'محرك TT الأيمن', en: 'TT Gear Motor', spec: ['مثل الأيسر تمامًا', 'لكنه مقلوب: لذلك قد يدور بالعكس'], job: 'يدير العجلة اليمنى. الفرق بين العجلتين يصنع الاستدارة', topic: '٢', dx: 150, dy: 0 },
  { k: 'wheelL', icon: '⚫', ar: 'العجلة اليسرى', en: 'Wheel 65 mm', spec: ['قطرها ٦٥ مم', 'محيطها ٢٠٫٤ سم: هذه مسافة دورة واحدة'], job: 'تحوّل الدوران إلى حركة على الأرض', topic: '١', dx: -250, dy: 0 },
  { k: 'wheelR', icon: '⚫', ar: 'العجلة اليمنى', en: 'Wheel 65 mm', spec: ['مطاط يمنع الانزلاق'], job: 'معها تصنع الدفع التفاضلي', topic: '١', dx: 250, dy: 0 },
  { k: 'caster', icon: '⚪', ar: 'العجلة الحرة', en: 'Caster Wheel', spec: ['كرة أو عجلة تدور في كل اتجاه', 'بلا محرك'], job: 'نقطة ارتكاز ثالثة حتى لا تنقلب السيارة', topic: '١', dx: 0, dy: 170 },
  { k: 'battery', icon: '🔋', ar: 'حامل البطاريات', en: '2 × 18650', spec: ['بطاريتا ليثيوم ٣٫٧ فولت', 'معًا ٧٫٤ فولت (٨٫٤ مشحونتين)'], job: 'خزان الطاقة للمحركات والأردوينو', topic: '٣', dx: 0, dy: 80 },
  { k: 'driver', icon: '🟥', ar: 'الدرايفر L298N', en: 'Motor Driver', spec: ['جسرا H: محركان', 'IN للاتجاه وEN للسرعة'], job: 'العضلات: ينقل أوامر الأردوينو الضعيفة إلى المحركين بقوة البطارية', topic: '٢', dx: 120, dy: 40 },
  { k: 'uno', icon: '🧠', ar: 'الأردوينو Uno', en: 'Arduino Uno', spec: ['يقرأ الحساسات', 'ينفذ الكود ١٦ مليون عملية في الثانية'], job: 'الدماغ: يحسّ ثم يقرر', topic: 'كل المحاور', dx: -110, dy: -40 },
  { k: 'sonar', icon: '🦇', ar: 'حساس المسافة HC-SR04', en: 'Ultrasonic Sensor', spec: ['من ٢ سم إلى ٤ أمتار', 'يقيس بزمن الصدى'], job: 'العين: يرى العوائق، والخصم في السومو', topic: '٨ و٩ و١٠', dx: 0, dy: -125 },
  { k: 'servo', icon: '🦾', ar: 'سيرفو الرأس', en: 'SG90 Servo', spec: ['يدير الحساس من ٠ إلى ١٨٠ درجة'], job: 'يحوّل العين إلى رادار يمسح يمينًا ويسارًا', topic: '٨', dx: 0, dy: -75 },
  { k: 'ir', icon: '〰️', ar: 'حساسات الخط IR', en: 'IR Line Sensors', spec: ['تحت مقدمة السيارة', 'تميّز الأسود من الأبيض'], job: 'تقرأ الخط في التتبع، وحافة الحلبة في السومو', topic: '٦ و٩ و١٠', dx: 0, dy: -45 },
  { k: 'bt', icon: '📶', ar: 'البلوتوث HC-05', en: 'Bluetooth Module', spec: ['مدى نحو ١٠ أمتار', 'يستقبل الأوامر حروفًا: F B L R'], job: 'يربط السيارة بالجوال', topic: '٥', dx: -150, dy: 90 },
  { k: 'switch', icon: '🔘', ar: 'مفتاح التشغيل', en: 'Power Switch', spec: ['يفصل البطارية كليًا'], job: 'أمان: أطفئ السيارة قبل أي تعديل في الأسلاك', topic: '٣', dx: 150, dy: 90 },
];
const xraySVG = () => `<svg viewBox="-90 -90 1080 1080" class="xsvg">
  <defs><pattern id="xgrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 L0 0 0 30" fill="none" stroke="rgba(126,226,168,.12)" stroke-width="1.5"/></pattern></defs>
  <rect x="-90" y="-90" width="1080" height="1080" fill="url(#xgrid)"/>
  <g class="xp" data-k="chassis"><rect x="270" y="140" width="360" height="650" rx="40" class="xchassis"/>${[[300, 200], [600, 200], [300, 760], [600, 760], [450, 470]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" class="xhole"/>`).join('')}</g>
  <g class="xp" data-k="wheelL"><rect x="196" y="230" width="58" height="170" rx="18" class="xtire"/>${Array.from({ length: 8 }, (_, i) => `<line x1="200" y1="${246 + i * 20}" x2="250" y2="${246 + i * 20}" class="xtread"/>`).join('')}</g>
  <g class="xp" data-k="wheelR"><rect x="646" y="230" width="58" height="170" rx="18" class="xtire"/>${Array.from({ length: 8 }, (_, i) => `<line x1="650" y1="${246 + i * 20}" x2="700" y2="${246 + i * 20}" class="xtread"/>`).join('')}</g>
  <g class="xp" data-k="motorL"><rect x="258" y="282" width="104" height="66" rx="10" class="xmotor"/><rect x="254" y="304" width="10" height="22" class="xshaft"/><text x="310" y="322" class="xt">TT</text></g>
  <g class="xp" data-k="motorR"><rect x="538" y="282" width="104" height="66" rx="10" class="xmotor"/><rect x="636" y="304" width="10" height="22" class="xshaft"/><text x="590" y="322" class="xt">TT</text></g>
  <g class="xp" data-k="uno"><rect x="372" y="178" width="156" height="200" rx="12" class="xuno"/><rect x="390" y="196" width="40" height="30" rx="4" class="xusb"/><rect x="420" y="270" width="64" height="20" rx="3" class="xic"/><text x="450" y="350" class="xt w">UNO</text></g>
  <g class="xp" data-k="driver"><rect x="380" y="400" width="140" height="140" rx="10" class="xdrv"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${404 + i * 16}" y="420" width="8" height="74" class="xsink"/>`).join('')}<text x="450" y="526" class="xt w">L298N</text></g>
  <g class="xp" data-k="battery"><rect x="355" y="565" width="190" height="120" rx="12" class="xbat"/><rect x="372" y="582" width="156" height="38" rx="19" class="xcell"/><rect x="372" y="630" width="156" height="38" rx="19" class="xcell"/><text x="450" y="607" class="xt">3.7V</text><text x="450" y="655" class="xt">3.7V</text></g>
  <g class="xp" data-k="caster"><circle cx="450" cy="740" r="30" class="xcaster"/><circle cx="450" cy="740" r="14" class="xball"/></g>
  <g class="xp" data-k="bt"><rect x="292" y="560" width="44" height="100" rx="6" class="xbt"/><text x="314" y="616" class="xt w" transform="rotate(-90 314 612)">HC-05</text></g>
  <g class="xp" data-k="switch"><rect x="566" y="590" width="44" height="60" rx="8" class="xsw"/><rect x="578" y="600" width="20" height="22" rx="4" class="xswk"/></g>
  <g class="xp" data-k="ir"><rect x="300" y="150" width="58" height="30" rx="5" class="xir"/><rect x="542" y="150" width="58" height="30" rx="5" class="xir"/><circle cx="318" cy="165" r="7" class="xirled"/><circle cx="582" cy="165" r="7" class="xirled"/></g>
  <g class="xp" data-k="servo"><rect x="414" y="104" width="72" height="56" rx="8" class="xservo"/><circle cx="450" cy="118" r="10" class="xhorn"/></g>
  <g class="xp" data-k="sonar"><rect x="356" y="44" width="188" height="62" rx="8" class="xsonar"/><circle cx="398" cy="75" r="24" class="xeye"/><circle cx="502" cy="75" r="24" class="xeye"/></g>
</svg>`;

/* ================== مختبر السرعة ================== */
const wheelSVG = () => `<svg viewBox="0 0 300 300" class="whsvg"><g id="whg"><circle cx="150" cy="150" r="130" class="whtire"/><circle cx="150" cy="150" r="96" class="whrim"/>
  ${Array.from({ length: 6 }, (_, i) => `<rect x="144" y="62" width="12" height="88" rx="6" class="whspoke" transform="rotate(${i * 60} 150 150)"/>`).join('')}<circle cx="150" cy="150" r="22" class="whhub"/></g>
  <line x1="150" y1="150" x2="280" y2="150" class="whd" id="whd"/><text x="215" y="140" class="whdt" id="whdt">65 مم</text></svg>`;

/* ================== محاكي الدفع التفاضلي ================== */
const AW = 1000, AH = 560, PX = 4, WB = 13, VMAX = 60, DEAD = 50;     // ٤ بكسل لكل سم · المسافة بين العجلتين ١٣ سم · أقصى سرعة ٦٠ سم/ث
const wheelV = p => Math.abs(p) < DEAD ? 0 : p / 255 * VMAX;          // تحت ٥٠ لا يتغلب المحرك على الاحتكاك
const DIFF_PRE = [['⬆ للأمام', 200, 200], ['⬇ للخلف', -200, -200], ['↻ في مكانها', 200, -200], ['↪ منعطف واسع', 200, 120], ['↩ محور على عجلة', 0, 200], ['⏹ قف', 0, 0]];
const arenaSVG = () => `<svg viewBox="0 0 ${AW} ${AH}" class="darena">
  <defs><pattern id="dtile" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f4f0e6"/><path d="M40 0 L0 0 0 40" fill="none" stroke="#e3dccb" stroke-width="2"/></pattern></defs>
  <rect width="${AW}" height="${AH}" fill="url(#dtile)"/><rect x="4" y="4" width="${AW - 8}" height="${AH - 8}" rx="12" class="dwall"/>
  <g id="dflag" class="dflag"><circle r="34" class="dzone"/><line x1="0" y1="0" x2="0" y2="-60" class="dpole"/><path d="M0 -60 L44 -48 L0 -36 Z" class="dfl"/></g>
  <path id="dtrail" class="dtrail" d=""/>
  <g id="dcar"><g transform="scale(1.25)">${miniCar('dc')}</g></g>
  <g id="dwin" class="dwin"><rect x="${AW / 2 - 260}" y="${AH / 2 - 70}" width="520" height="140" rx="26"/><text x="${AW / 2}" y="${AH / 2 - 6}" class="dwt1">🎉 وصلت!</text><text x="${AW / 2}" y="${AH / 2 + 44}" class="dwt2" id="dwt"></text></g>
</svg>`;

/* أدوات مشتركة لملفات المراحل التالية (widgets3b.js …) */
window.ARD3 = { miniCar, wheelV, VMAX, DEAD, WB };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  carhero: s => `<div class="slide dark carhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="htitle">${s.title}</h1>
      <div class="hwrap">${heroSVG()}</div>
      <div class="hmodes">${MODES.map(([i, t], k) => `<div class="hm" style="animation-delay:${k * 2.6}s"><b>${i}</b>${t}</div>`).join('')}</div></div>`,

  carxray: s => `<div class="slide light">
      <div class="kicker">🩻 سيارة بالأشعة السينية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="xgrid">
        <div class="xwrap ix" id="xw">${xraySVG()}<button class="clap xboom" id="xboom">🔧 فكّك السيارة</button></div>
        <div class="xinfo" id="xinfo"><div class="xi0">👆 انقر أي قطعة في السيارة لتتعرف عليها</div></div>
        <div class="xlist ix">${PARTS.filter(p => !/R$/.test(p.k)).map(p => `<button class="xchip" data-k="${p.k}">${p.icon} ${p.ar.replace(/ الأيسر| اليسرى/, '')}</button>`).join('')}</div>
      </div></div>`,

  speedlab: s => `<div class="slide light">
      <div class="kicker">🧮 مختبر السرعة</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="spgrid">
        <div class="spleft ix">${wheelSVG()}
          <label class="lsl"><span>⚙️ سرعة المحرك: <b id="sprv">200</b> دورة/دقيقة</span><input type="range" id="spr" min="60" max="300" value="200"></label>
          <label class="lsl"><span>⭕ قطر العجلة: <b id="spdv">65</b> مم</span><input type="range" id="spd" min="40" max="100" value="65"></label></div>
        <div class="spright">
          <div class="speq" id="speq"></div>
          <div class="spfacts"><div class="ac"><span>المحيط</span><b id="spc">—</b></div><div class="ac gold"><span>السرعة</span><b id="sps">—</b></div><div class="ac"><span>كم/ساعة</span><b id="spk">—</b></div></div>
          <div class="sprace ix"><div class="sprt">🏫 عبور فصل طوله ٨ أمتار: <b id="spt">—</b></div>
            <svg viewBox="0 0 1000 120" class="sprsvg">${Array.from({ length: 9 }, (_, i) => `<line x1="${40 + i * 115}" y1="86" x2="${40 + i * 115}" y2="104" class="sptick"/><text x="${40 + i * 115}" y="118" class="spnum">${AR(i)}م</text>`).join('')}
              <line x1="40" y1="86" x2="960" y2="86" class="spline"/><g id="sprcar">${miniCar('spc')}</g></svg>
            <button class="sndbtn" id="spgo">▶ انطلق في سباق</button></div>
        </div>
      </div></div>`,

  difflab: s => `<div class="slide light">
      <div class="kicker">🕹️ محاكي الدفع التفاضلي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="dgrid">
        <div class="dleft ix">
          <div class="tonecode" dir="ltr" id="dcode">${highlight('drive(0, 0);')}</div>
          <label class="lsl dsl"><span>⬅ العجلة اليسرى: <b id="dlv">0</b></span><input type="range" id="dl" min="-255" max="255" value="0" step="5"></label>
          <label class="lsl dsl"><span>➡ العجلة اليمنى: <b id="drv">0</b></span><input type="range" id="dr" min="-255" max="255" value="0" step="5"></label>
          <div class="dpre">${DIFF_PRE.map(([t, l, r]) => `<button class="sndbtn" data-l="${l}" data-r="${r}">${t}</button>`).join('')}</div>
          <div class="dmath"><div><span>v</span><b id="dmv">0</b><small>سم/ث</small></div><div><span>ω</span><b id="dmw">0</b><small>درجة/ث</small></div><div><span>R</span><b id="dmr">—</b><small>نصف قطر المنعطف</small></div></div>
        </div>
        <div class="dright ix"><div class="dawrap" id="daw">${arenaSVG()}</div>
          <div class="dctl"><button class="clap" id="dchal">🏁 التحدي: أوصلها إلى العلم</button><button class="sndbtn" id="dreset">↺ من البداية</button><div class="dtime" id="dtime">⏱️ ٠٫٠ ث</div></div></div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  carxray(sl) {
    const info = sl.querySelector('#xinfo'), svg = sl.querySelector('.xsvg'), boom = sl.querySelector('#xboom');
    const show = k => {
      const p = PARTS.find(x => x.k === k); if (!p) return;
      const base = x => x.replace(/[LR]$/, ''), kk = base(k);         // العجلتان والمحركان يُضاءان معًا
      sl.querySelectorAll('.xp').forEach(g => g.classList.toggle('sel', base(g.dataset.k) === kk));
      svg.classList.add('picking');
      sl.querySelectorAll('.xchip').forEach(c => c.classList.toggle('on', base(c.dataset.k) === kk));
      info.innerHTML = `<div class="xi1">${p.icon}</div><h3>${p.ar}</h3><div class="xen" dir="ltr">${p.en}</div>
        <ul>${p.spec.map(x => `<li>${x}</li>`).join('')}</ul><div class="xjob">💡 ${p.job}</div><div class="xtop">📍 نتعمق فيه في المحور ${p.topic}</div>`;
      info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop');
    };
    sl.querySelectorAll('.xp').forEach(g => g.addEventListener('pointerdown', e => { e.stopPropagation(); show(g.dataset.k); }));
    sl.querySelectorAll('.xchip').forEach(c => c.onclick = () => show(c.dataset.k));
    PARTS.forEach(p => { const g = sl.querySelector(`.xp[data-k="${p.k}"]`); g.style.setProperty('--dx', p.dx + 'px'); g.style.setProperty('--dy', p.dy + 'px'); });
    boom.onclick = () => { const on = svg.classList.toggle('boom'); boom.textContent = on ? '🔩 ركّبها من جديد' : '🔧 فكّك السيارة'; };
  },

  speedlab(sl) {
    const r = sl.querySelector('#spr'), d = sl.querySelector('#spd'), wg = sl.querySelector('#whg'), car = sl.querySelector('#sprcar');
    let ang = 0, last = 0, raf = 0, race = null;
    const calc = () => { const circ = Math.PI * d.value / 10, v = r.value * circ / 60; return { circ, v, kmh: v * 0.036, t: 800 / v }; };
    const f1 = x => AR(x.toFixed(1)).replace('.', '٫');
    const upd = () => {
      const { circ, v, kmh, t } = calc();
      sl.querySelector('#sprv').textContent = r.value; sl.querySelector('#spdv').textContent = d.value; sl.querySelector('#whdt').textContent = d.value + ' مم';
      sl.querySelector('#spc').textContent = f1(circ) + ' سم'; sl.querySelector('#sps').textContent = f1(v) + ' سم/ث'; sl.querySelector('#spk').textContent = f1(kmh);
      sl.querySelector('#spt').textContent = f1(t) + ' ثانية';
      sl.querySelector('#speq').innerHTML = `<div>المحيط = π × القطر = ٣٫١٤ × ${AR(d.value / 10).replace('.', '٫')} سم = <b>${f1(circ)} سم</b></div>
        <div>السرعة = الدورات في الثانية × المحيط = (${AR(r.value)} ÷ ٦٠) × ${f1(circ)} = <b>${f1(v)} سم/ث</b></div>`;
    };
    r.oninput = d.oninput = upd;
    sl.querySelector('#spgo').onclick = () => { race = { t0: null }; };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts;
      ang += r.value / 60 * 360 * dt; wg.setAttribute('transform', `rotate(${ang} 150 150)`);
      const { v } = calc();
      let x = 40;
      if (race) { if (race.t0 === null) race.t0 = ts; const el = (ts - race.t0) / 1000, cm = Math.min(800, v * el); x = 40 + cm / 800 * 920; if (cm >= 800) race.done = race.done || el; }
      car.setAttribute('transform', `translate(${x} 50) scale(.9)`);
      raf = requestAnimationFrame(loop);
    };
    upd(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  difflab(sl) {
    const L = sl.querySelector('#dl'), R = sl.querySelector('#dr'), car = sl.querySelector('#dcar'), trail = sl.querySelector('#dtrail');
    const flag = sl.querySelector('#dflag'), win = sl.querySelector('#dwin'), timeEl = sl.querySelector('#dtime');
    let x, y, th, pts, last = 0, raf = 0, chal = false, t = 0, done = false, fx = 0, fy = 0;
    const reset = () => { x = 120; y = AH - 110; th = -Math.PI / 2; pts = []; t = 0; done = false; win.classList.remove('on'); };
    const f1 = v => AR(Math.abs(v) < 0.05 ? '0' : v.toFixed(1)).replace('.', '٫').replace('-', '−');
    const setUI = () => {
      const l = +L.value, r = +R.value;
      sl.querySelector('#dlv').textContent = l; sl.querySelector('#drv').textContent = r;
      sl.querySelector('#dcode').innerHTML = highlight(`drive(${l}, ${r});`);
      const vl = wheelV(l), vr = wheelV(r), v = (vl + vr) / 2, w = (vr - vl) / WB;
      sl.querySelector('#dmv').textContent = f1(v); sl.querySelector('#dmw').textContent = f1(w * 180 / Math.PI);      // موجب = استدارة نحو اليسار
      sl.querySelector('#dmr').textContent = Math.abs(w) < 1e-6 ? (v ? '∞' : '—') : Math.abs(v) < 1e-6 ? '٠' : f1(Math.abs(v / w)) + ' سم';
    };
    L.oninput = R.oninput = setUI;
    sl.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { L.value = b.dataset.l; R.value = b.dataset.r; setUI(); });
    const placeFlag = () => { fx = 700 + Math.random() * 220; fy = 90 + Math.random() * 160; flag.setAttribute('transform', `translate(${fx} ${fy})`); };
    sl.querySelector('#dchal').onclick = () => { chal = true; reset(); L.value = 0; R.value = 0; setUI(); placeFlag(); flag.classList.add('on'); };
    sl.querySelector('#dreset').onclick = () => { reset(); L.value = 0; R.value = 0; setUI(); };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      const vl = wheelV(+L.value) * PX, vr = wheelV(+R.value) * PX, v = (vl + vr) / 2, w = (vr - vl) / (WB * PX);
      if (!done) {
        th -= w * dt;                                                   // اليمين أسرع ← استدارة نحو اليسار (عكس عقارب الساعة على الشاشة)
        x = Math.max(40, Math.min(AW - 40, x + Math.cos(th) * v * dt)); y = Math.max(40, Math.min(AH - 40, y + Math.sin(th) * v * dt));
        if ((vl || vr) && (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 6)) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 400) pts.shift(); }
        if (chal && (vl || vr)) t += dt;
        if (chal && Math.hypot(x - fx, y - fy) < 40) { done = true; win.classList.add('on'); sl.querySelector('#dwt').textContent = `في ${AR(t.toFixed(1)).replace('.', '٫')} ثانية`; }
      }
      timeEl.textContent = `⏱️ ${AR(t.toFixed(1)).replace('.', '٫')} ث`;
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`);
      trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
      raf = requestAnimationFrame(loop);
    };
    reset(); setUI(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
