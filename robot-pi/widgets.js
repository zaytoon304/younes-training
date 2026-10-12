/* =====================================================================
   أدوات دورة «روبوتي الذكي» التفاعلية
   تُحمَّل بعد أدوات دورة الأردوينو، وتضيف فوقها:
   meet (نبيه يعرّف بنفسه) · body (جسم نبيه مثل جسمك) · piboard (لوحة Pi 4) · versus (مقارنة)
   كل الأصناف تبدأ بـ nb- حتى لا تتعارض مع أصناف المحرك أو دورة الأردوينو
   ===================================================================== */
(function () {

/* ---------- أجزاء جسم نبيه: كل جزء يقابله عضو في جسم الإنسان ---------- */
const NB_PARTS = {
  brain:   { icon: '🧠', ar: 'العقل', en: 'Raspberry Pi 4', human: 'مثل مخّك',
             b: 'يفكر ويقرر. يستقبل ما تراه العين وما تسمعه الأذن، ثم يعطي الأوامر للرجلين والفم.' },
  camera:  { icon: '👁️', ar: 'العين', en: 'Camera', human: 'مثل عينك',
             b: 'ترى الألوان والوجوه والأشياء، وترسل الصورة للعقل في جزء من الثانية.' },
  sonar:   { icon: '🦇', ar: 'حاسّة الخفاش', en: 'Ultrasonic Sensor · HC-SR04', human: 'مثل الخفاش!',
             b: 'تشبه العيون، لكنها تطلق صوتًا لا تسمعه أذنك، وتنتظر صداه… فتعرف كم يبعد الجدار.' },
  mic:     { icon: '👂', ar: 'الأذن', en: 'Microphone', human: 'مثل أذنك',
             b: 'تسمع كلامك وترسله للعقل، فيفهم ماذا تريد.' },
  speaker: { icon: '👄', ar: 'الفم', en: 'Speaker', human: 'مثل فمك',
             b: 'يتكلم بها نبيه ويرد عليك… بالعربي!' },
  driver:  { icon: '💪', ar: 'العضلات', en: 'Motor Driver · L298N', human: 'مثل عضلاتك',
             b: 'العقل لا يقدر يحرك العجلات وحده. يعطي الأمر للعضلات، وهي تدفع الكهرباء للمحركات.' },
  wheels:  { icon: '🦵', ar: 'الرجلان', en: 'DC Motors & Wheels', human: 'مثل رجليك',
             b: 'محركات صغيرة تدير العجلات: للأمام، وللخلف، ويمين، ويسار.' },
  battery: { icon: '🔋', ar: 'الطاقة', en: 'Battery', human: 'مثل الأكل لجسمك',
             b: 'بدون طاقة لا يتحرك شيء! بطارية للعضلات والرجلين، وبطارية أخرى للعقل.' },
};
const NB_TOUR = ['brain', 'camera', 'sonar', 'mic', 'speaker', 'driver', 'wheels', 'battery'];

/* رسمة نبيه من الأمام (كل جزء مجموعة قابلة للضغط data-p) */
function nabeehSVG() {
  const tread = x => [0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${x}" y="${492 + i * 30}" width="100" height="10" rx="4" fill="#2a2e3a"/>`).join('');
  const grille = [0, 1, 2, 3].map(i => `<rect x="${352 + i * 26}" y="410" width="14" height="34" rx="7" fill="#0A1230"/>`).join('');
  const mesh = (cx) => [-24, -8, 8, 24].map(d => `<line x1="${cx - 34}" y1="${340 + d}" x2="${cx + 34}" y2="${340 + d}" stroke="#9aa3b5" stroke-width="2"/><line x1="${cx + d}" y1="306" x2="${cx + d}" y2="374" stroke="#9aa3b5" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 800 740" class="nb-bot" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="nbBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A54A8"/><stop offset="1" stop-color="#22346F"/></linearGradient>
    <linearGradient id="nbHead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E8F2"/></linearGradient>
    <linearGradient id="nbDome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".55"/><stop offset="1" stop-color="#9cc7ff" stop-opacity=".18"/></linearGradient>
    <linearGradient id="nbMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset="1" stop-color="#a9b0bf"/></linearGradient>
  </defs>
  <ellipse cx="400" cy="712" rx="330" ry="22" fill="#0A1230" opacity=".18"/>

  <!-- الرجلان: العجلات والمحركات -->
  <g class="nb-part" data-p="wheels">
    <rect x="30" y="470" width="120" height="236" rx="34" fill="#1b1e27"/>${tread(40)}
    <rect x="650" y="470" width="120" height="236" rx="34" fill="#1b1e27"/>${tread(660)}
    <rect x="150" y="560" width="40" height="60" rx="8" fill="#F0CC7A"/><rect x="610" y="560" width="40" height="60" rx="8" fill="#F0CC7A"/>
  </g>

  <!-- الهيكل -->
  <rect x="140" y="500" width="520" height="150" rx="30" fill="url(#nbBody)"/>
  <rect x="140" y="500" width="520" height="16" rx="8" fill="#D9AE4B"/>

  <!-- الطاقة: بطاريتان 18650 -->
  <g class="nb-part" data-p="battery">
    <rect x="270" y="566" width="260" height="66" rx="14" fill="#101B45"/>
    <rect x="284" y="576" width="112" height="46" rx="20" fill="#2E9E6B"/><rect x="396" y="588" width="10" height="22" rx="3" fill="#c4c9d4"/>
    <rect x="404" y="576" width="112" height="46" rx="20" fill="#2E9E6B"/><rect x="516" y="588" width="10" height="22" rx="3" fill="#c4c9d4"/>
    <text x="340" y="607" class="nb-tiny">+</text><text x="460" y="607" class="nb-tiny">+</text>
  </g>

  <!-- العضلات: لوحة L298N الحمراء بمشتتها الحراري، على مقدمة الهيكل -->
  <g class="nb-part" data-p="driver">
    <rect x="160" y="530" width="96" height="100" rx="8" fill="#c0392b"/>
    ${[0, 1, 2, 3].map(i => `<rect x="172" y="${540 + i * 13}" width="72" height="8" rx="2" fill="#1b1e27"/>`).join('')}
    <rect x="168" y="600" width="30" height="20" rx="3" fill="#2E9E6B"/><rect x="218" y="600" width="30" height="20" rx="3" fill="#2E9E6B"/>
  </g>

  <!-- الرقبة والرأس -->
  <rect x="360" y="460" width="80" height="50" rx="10" fill="#22346F"/>
  <rect x="200" y="196" width="400" height="280" rx="70" fill="url(#nbHead)" stroke="#22346F" stroke-width="8"/>

  <!-- الأذن: ميكروفون على جانب الرأس -->
  <g class="nb-part" data-p="mic">
    <rect x="596" y="300" width="34" height="70" rx="12" fill="#22346F"/>
    <circle cx="656" cy="335" r="30" fill="#1b1e27"/><circle cx="656" cy="335" r="20" fill="#3a3f4f"/>
    ${[-8, 0, 8].map(d => `<circle cx="${656 + d}" cy="${327}" r="3" fill="#7d8597"/><circle cx="${656 + d}" cy="${343}" r="3" fill="#7d8597"/>`).join('')}
  </g>

  <!-- العين: الكاميرا -->
  <g class="nb-part" data-p="camera">
    <rect x="356" y="222" width="88" height="62" rx="12" fill="#1b1e27"/>
    <circle cx="400" cy="253" r="22" fill="#2E4288"/><circle cx="400" cy="253" r="12" fill="#0A1230"/>
    <circle cx="393" cy="246" r="5" fill="#fff" opacity=".85"/>
    <circle cx="430" cy="232" r="4" fill="#ff5a5a" class="nb-rec"/>
  </g>

  <!-- حاسة الخفاش: حساس الألتراسونك (يشبه العينين) -->
  <g class="nb-part" data-p="sonar">
    <rect x="248" y="296" width="304" height="90" rx="14" fill="#2E6FD8"/>
    <circle cx="320" cy="340" r="44" fill="url(#nbMetal)"/>${mesh(320)}
    <circle cx="480" cy="340" r="44" fill="url(#nbMetal)"/>${mesh(480)}
    <g class="nb-pupils"><circle cx="320" cy="340" r="17" fill="#0A1230"/><circle cx="480" cy="340" r="17" fill="#0A1230"/>
      <circle cx="326" cy="333" r="6" fill="#fff"/><circle cx="486" cy="333" r="6" fill="#fff"/></g>
  </g>

  <!-- الفم: السماعة -->
  <g class="nb-part" data-p="speaker">
    <rect x="330" y="400" width="140" height="54" rx="27" fill="#D9AE4B"/>${grille}
  </g>
  <circle cx="250" cy="420" r="16" fill="#ff8fa3" opacity=".45"/><circle cx="550" cy="420" r="16" fill="#ff8fa3" opacity=".45"/>

  <!-- العقل: لوحة Raspberry Pi داخل قبة شفافة -->
  <g class="nb-part" data-p="brain">
    <path d="M240 200 Q240 70 400 70 Q560 70 560 200 Z" fill="url(#nbDome)" stroke="#9cc7ff" stroke-width="5"/>
    <rect x="292" y="120" width="216" height="72" rx="8" fill="#1f8a3c"/>
    <rect x="306" y="128" width="188" height="10" rx="2" fill="#11161f"/>
    <rect x="356" y="148" width="44" height="34" rx="3" fill="#c4c9d4"/><rect x="410" y="152" width="36" height="26" rx="2" fill="#1b1e27"/>
    <rect x="456" y="146" width="44" height="40" rx="3" fill="#c4c9d4"/>
    <circle cx="312" cy="176" r="5" fill="#ff4d4d"/><circle cx="328" cy="176" r="5" fill="#3ddc84" class="nb-act"/>
    <path d="M300 104 Q330 84 360 92" stroke="#fff" stroke-width="7" fill="none" opacity=".6" stroke-linecap="round"/>
  </g>
</svg>`;
}

/* ---------- لوحة Raspberry Pi 4 مرسومة من الأعلى ---------- */
const PI_PARTS = {
  cpu:   { icon: '🧠', ar: 'المعالج', en: 'Processor · BCM2711', b: 'عقل الـ Pi الحقيقي. في داخله ٤ عقول صغيرة تشتغل معًا، وتنفّذ ملايين الأوامر في الثانية الواحدة.' },
  ram:   { icon: '📝', ar: 'الذاكرة المؤقتة', en: 'RAM', b: 'مثل السبورة: يكتب عليها الـ Pi وهو يشتغل، وتنمسح كلها لما نطفيه.' },
  sd:    { icon: '💾', ar: 'كرت الذاكرة', en: 'microSD Card Slot', b: 'تحت اللوحة! مثل الحقيبة: فيه نظام التشغيل وكل برامجنا، ولا تنمسح لما نطفي الـ Pi.' },
  power: { icon: '⚡', ar: 'مدخل الكهرباء', en: 'USB-C Power', b: 'من هنا يأكل الـ Pi. يحتاج ٥ فولت و٣ أمبير، فنستخدم شاحنه الخاص.' },
  hdmi:  { icon: '🖥️', ar: 'منفذا الشاشة', en: 'micro-HDMI × 2', b: 'نوصل هنا الشاشة، ويقدر يشغّل شاشتين معًا. انتبه: الفتحة صغيرة، تحتاج كابل micro-HDMI.' },
  usb3:  { icon: '🔵', ar: 'منفذا USB 3 الزرقاوان', en: 'USB 3.0', b: 'الأسرع! نوصل فيهما الكاميرا أو الفلاش.' },
  usb2:  { icon: '⚫', ar: 'منفذا USB 2', en: 'USB 2.0', b: 'للكيبورد والماوس والمايك.' },
  eth:   { icon: '🌐', ar: 'منفذ الإنترنت بالسلك', en: 'Ethernet', b: 'يوصل الـ Pi بالإنترنت عن طريق سلك، إذا ضعف الواي فاي.' },
  wifi:  { icon: '📶', ar: 'الواي فاي والبلوتوث', en: 'Wi-Fi & Bluetooth', b: 'يتصل بالإنترنت بدون سلك. ومن خلاله سنتحكم بنبيه من الجوال!' },
  audio: { icon: '🎧', ar: 'مخرج الصوت', en: 'Audio Jack', b: 'نوصل فيه سماعة نبيه، ليتكلم.' },
  csi:   { icon: '📷', ar: 'منفذ الكاميرا', en: 'Camera Port · CSI', b: 'شريط كاميرا الـ Pi الخاصة يدخل هنا.' },
  dsi:   { icon: '📺', ar: 'منفذ الشاشة الصغيرة', en: 'Display Port · DSI', b: 'لشاشة اللمس الصغيرة الخاصة بالـ Pi. لن نحتاجه مع نبيه.' },
  leds:  { icon: '🚦', ar: 'ضوءا الحالة', en: 'Power & Activity LEDs', b: 'الأحمر: الكهرباء واصلة. الأخضر يرمش: الـ Pi يقرأ من كرت الذاكرة… يعني يفكر!' },
  gpio:  { icon: '📍', ar: 'منافذ GPIO', en: 'GPIO · 40 Pins', b: 'أهم جزء لنبيه! ٤٠ دبوسًا يكلّم منها الـ Pi المحركات والحساسات. هي يدا الـ Pi.' },
};
const PI_TOUR = ['cpu', 'ram', 'sd', 'power', 'hdmi', 'usb3', 'usb2', 'eth', 'wifi', 'audio', 'csi', 'dsi', 'leds', 'gpio'];

function pi4SVG() {
  let pins = '';
  for (let i = 0; i < 20; i++) for (let r = 0; r < 2; r++)
    pins += `<rect x="${140 + i * 26.5}" y="${82 + r * 26}" width="14" height="14" rx="2" fill="#d9b44a"/>`;
  const usb = (y, blue) => `<rect x="756" y="${y}" width="214" height="134" rx="8" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/>
    <rect x="786" y="${y + 20}" width="164" height="36" rx="4" fill="${blue ? '#2E6FD8' : '#1b1e27'}"/>
    <rect x="786" y="${y + 78}" width="164" height="36" rx="4" fill="${blue ? '#2E6FD8' : '#1b1e27'}"/>`;
  const hole = (x, y) => `<circle cx="${x}" cy="${y}" r="16" fill="#e9eef0"/><circle cx="${x}" cy="${y}" r="9" fill="#0d3d1d"/>`;
  return `<svg viewBox="0 0 1000 690" class="nb-pi" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="piPcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25a04a"/><stop offset="1" stop-color="#157331"/></linearGradient>
    <linearGradient id="piMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset="1" stop-color="#a9b0bf"/></linearGradient>
  </defs>
  <!-- كرت الذاكرة: تحت اللوحة من الحافة اليسرى -->
  <g class="nb-part" data-p="sd"><rect x="14" y="270" width="110" height="140" rx="10" fill="#2b2f3a"/><rect x="24" y="282" width="40" height="116" rx="6" fill="#4b5263"/></g>
  <rect x="60" y="60" width="860" height="566" rx="36" fill="url(#piPcb)"/>
  ${hole(100, 100)}${hole(704, 100)}${hole(100, 586)}${hole(704, 586)}
  <text x="300" y="478" class="nb-silk big" text-anchor="middle">Raspberry Pi 4 Model B</text>
  <text x="300" y="512" class="nb-silk" text-anchor="middle">© Raspberry Pi 2018</text>

  <g class="nb-part" data-p="gpio"><rect x="128" y="72" width="546" height="62" rx="4" fill="#11161f"/>${pins}
    <text x="400" y="166" class="nb-silk" text-anchor="middle">GPIO · ٤٠ دبوسًا</text></g>
  <g class="nb-part" data-p="wifi"><rect x="112" y="190" width="120" height="96" rx="6" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/>
    <path d="M150 248 q22 -24 44 0 M158 256 q14 -14 28 0" stroke="#5e6782" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="172" cy="264" r="5" fill="#5e6782"/></g>
  <g class="nb-part" data-p="cpu"><rect x="262" y="226" width="160" height="160" rx="12" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/>
    <text x="342" y="300" class="nb-chip" text-anchor="middle">BROADCOM</text><text x="342" y="332" class="nb-chip" text-anchor="middle">BCM2711</text></g>
  <g class="nb-part" data-p="ram"><rect x="460" y="246" width="150" height="120" rx="6" fill="#15171e"/><text x="535" y="315" class="nb-chip light" text-anchor="middle">RAM</text></g>
  <rect x="690" y="150" width="44" height="44" rx="3" fill="#11161f"/>${[0, 1].map(r => [0, 1].map(c => `<rect x="${698 + c * 20}" y="${158 + r * 20}" width="9" height="9" fill="#d9b44a"/>`).join('')).join('')}

  <g class="nb-part" data-p="usb2">${usb(80, false)}</g>
  <g class="nb-part" data-p="usb3">${usb(236, true)}</g>
  <g class="nb-part" data-p="eth"><rect x="740" y="410" width="236" height="196" rx="8" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/>
    <rect x="790" y="452" width="150" height="112" rx="6" fill="#1b1e27"/><rect x="838" y="540" width="54" height="24" fill="#3a3f4f"/>
    <rect x="798" y="420" width="26" height="16" rx="3" fill="#F0CC7A"/><rect x="904" y="420" width="26" height="16" rx="3" fill="#3ddc84"/></g>

  <g class="nb-part" data-p="power"><rect x="120" y="580" width="96" height="76" rx="20" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/><rect x="138" y="606" width="60" height="22" rx="11" fill="#1b1e27"/></g>
  <g class="nb-part" data-p="hdmi"><rect x="248" y="590" width="84" height="64" rx="8" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/><rect x="262" y="608" width="56" height="20" rx="4" fill="#1b1e27"/>
    <rect x="356" y="590" width="84" height="64" rx="8" fill="url(#piMetal)" stroke="#8b93a7" stroke-width="3"/><rect x="370" y="608" width="56" height="20" rx="4" fill="#1b1e27"/></g>
  <g class="nb-part" data-p="csi"><rect x="500" y="430" width="36" height="170" rx="4" fill="#f2efe6" stroke="#5e6782" stroke-width="3"/><rect x="510" y="440" width="16" height="150" fill="#1b1e27"/></g>
  <g class="nb-part" data-p="audio"><rect x="560" y="560" width="96" height="96" rx="16" fill="#1b1e27"/><circle cx="608" cy="632" r="18" fill="#3a3f4f"/><circle cx="608" cy="632" r="8" fill="#0b0d12"/></g>
  <g class="nb-part" data-p="dsi"><rect x="76" y="250" width="36" height="160" rx="4" fill="#f2efe6" stroke="#5e6782" stroke-width="3"/><rect x="86" y="260" width="16" height="140" fill="#1b1e27"/></g>
  <g class="nb-part" data-p="leds"><rect x="132" y="520" width="34" height="22" rx="5" fill="#ff4d4d"/><rect x="132" y="550" width="34" height="22" rx="5" fill="#3ddc84" class="nb-act"/>
    <text x="176" y="538" class="nb-silk" style="font-size:17px">PWR</text><text x="176" y="568" class="nb-silk" style="font-size:17px">ACT</text></g>
</svg>`;
}

/* ---------- بطاقة المعلومات الجانبية (مشتركة بين نبيه ولوحة Pi) ---------- */
function showInfo(sl, parts, k) {
  sl.querySelectorAll('.nb-part').forEach(g => g.classList.toggle('sel', g.dataset.p === k));
  const p = parts[k], box = sl.querySelector('.nb-info');
  if (!p || !box) return;
  box.innerHTML = `<div class="nb-icon">${p.icon}</div><h3>${p.ar}</h3><div class="nb-en" dir="ltr">${p.en}</div>
    ${p.human ? `<div class="nb-human">${p.human}</div>` : ''}<p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
const panel = (msg, hint) => `<div class="nb-panel">
    <div class="nb-info"><div class="nb-icon">👆</div><h3>${msg}</h3><p>أو اضغط «التالي» لنتعرّف عليها واحدًا واحدًا</p></div>
    <div class="nb-hint">${hint}</div></div>`;

/* ---------- أنواع الشرائح الجديدة ---------- */
Object.assign(window.DECK_TYPES, {
  /* نبيه يعرّف بنفسه: كل نقرة تُظهر فقاعة كلام جديدة */
  meet: s => `<div class="slide dark">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <div class="nb-meet">
        <div class="nb-talk">${s.lines.map(l => `<div class="nb-bubble f">${l}</div>`).join('')}</div>
        <div class="nb-stage nb-wave">${nabeehSVG()}</div>
      </div></div>`,

  /* جسم نبيه مثل جسمك: اضغط أي جزء */
  body: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'رسمة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-grid">${panel('اضغط على أي جزء من نبيه', `👆 اضغط أي جزء · ⬅️ «التالي» للجولة (${AR(NB_TOUR.length)} أجزاء)`)}
        <div class="nb-stage ix">${nabeehSVG()}</div></div>${NB_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  /* لوحة Raspberry Pi 4 التفاعلية */
  piboard: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'لوحة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-grid wide">${panel('اضغط على أي جزء من اللوحة', `👆 اضغط أي جزء · ⬅️ «التالي» للجولة (${AR(PI_TOUR.length)} جزءًا)`)}
        <div class="nb-stage ix">${pi4SVG()}</div></div>${PI_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  /* مقارنة بين شيئين بصفوف تظهر واحدًا واحدًا، وخلاصة في الأسفل */
  versus: s => `<div class="slide light">
      ${s.kicker ? `<div class="kicker">${s.kicker}</div>` : ''}
      <h2 class="title" style="margin-bottom:22px">${s.title}</h2>
      <div class="nb-vs">
        <div class="nb-vhead a"><span>${s.a.icon}</span><div><h3>${s.a.name}</h3><p>${s.a.tag}</p></div></div>
        <div class="nb-vmid">VS</div>
        <div class="nb-vhead b"><span>${s.b.icon}</span><div><h3>${s.b.name}</h3><p>${s.b.tag}</p></div></div>
        ${s.rows.map(r => `<div class="nb-vrow f"><div class="nb-vc a">${r[1]}</div><div class="nb-vq">${r[0]}</div><div class="nb-vc b">${r[2]}</div></div>`).join('')}
      </div>
      ${s.verdict ? `<div class="nb-verdict f">${s.verdict}</div>` : ''}</div>`,
});

Object.assign(window.DECK_BIND, {
  body(sl) { sl.querySelectorAll('.nb-part').forEach(g => g.addEventListener('click', () => showInfo(sl, NB_PARTS, g.dataset.p))); },
  piboard(sl) { sl.querySelectorAll('.nb-part').forEach(g => g.addEventListener('click', () => showInfo(sl, PI_PARTS, g.dataset.p))); },
});

/* كل نقرة «التالي»: الجزء التالي في الجولة (ونترك باقي الأنواع لأدوات الأردوينو) */
const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (!sl) return;
  if (s.t === 'body' && step > 0) showInfo(sl, NB_PARTS, NB_TOUR[step - 1]);
  if (s.t === 'piboard' && step > 0) showInfo(sl, PI_PARTS, PI_TOUR[step - 1]);
};

/* الأدوات التفاعلية تعيد رسم أجزائها عند النقر، فيصل النقر للمحرك من عنصر لم يعد في الصفحة
   فيظنه نقرًا عاديًّا وينقل الشريحة. نوقف النقر عند حدود كل أداة تفاعلية (ix) */
window.DECK_HOOKS = (window.DECK_HOOKS || []).concat(sl =>
  sl.querySelectorAll('.ix').forEach(el => el.addEventListener('click', e => e.stopPropagation())));

/* للاختبار خارج المتصفح */
window.NB = { NB_PARTS, NB_TOUR, PI_PARTS, PI_TOUR, nabeehSVG, pi4SVG };
})();
