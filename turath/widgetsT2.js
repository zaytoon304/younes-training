/* =====================================================================
   «لمسات تراث» — أدوات المراحل ٣ و٤: السيارة والاتصال والقرار والمهمة
   الأنواع: car4lab · dualrelay · espnowlab · decisionlab · pathlab · missionlab
   دائرة البناء: carwire4 (ESP32 + L298N + أربعة محركات + ريليه مزدوج)
   أطراف السيارة الحقيقية: ENA 33 · ENB 32 · IN1 27 · IN2 26 · IN3 25 · IN4 14 · مضخة 16 · مروحة 17 (LOW = تشغيل)
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, wire } = window.ARD2;
const { beep, lcdHTML, lcdSet, clamp, f0, masmak, palm, car4 } = window.TUR;
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));

/* ================== السيارة الرباعية ================== */
const CAR_CODE = `int ENA = 33, IN1 = 27, IN2 = 26;
int ENB = 32, IN3 = 25, IN4 = 14;
const bool INVERT_RIGHT = true;
int SPEED = 120;

void drive(int left, int right) {
  if (INVERT_RIGHT) right = -right;
  digitalWrite(IN1, left > 0);  digitalWrite(IN2, left < 0);
  digitalWrite(IN3, right > 0); digitalWrite(IN4, right < 0);
  analogWrite(ENA, abs(left));  analogWrite(ENB, abs(right));
}`;
const C4W = 760, C4H = 420;

/* ================== ESP-NOW ================== */
const NOW_SEND = `typedef struct { int type; int level; int zone; } Msg;
uint8_t carMAC[] = {0xEC,0xE3,0x34,0x08,0xBE,0xD8};
Msg m;

void alarmCar(int type, int level, int zone) {
  m.type = type; m.level = level; m.zone = zone;
  esp_now_send(carMAC, (uint8_t*)&m, sizeof(m));
}`;
const NOW_RECV = `void onReceive(const esp_now_recv_info *info,
               const uint8_t *data, int len) {
  memcpy(&m, data, sizeof(m));
  if (m.type == FLAME) goFire(m.zone);
  if (m.type == GAS)   goGas(m.zone);
}`;

/* ================== القرار ================== */
const DEC_CODE = `void onAlarm(int fireP, int gasP) {
  bool fire = fireP > 50, gas = gasP > 30;
  if (fire && gas) {
    int hi = fireP >= gasP ? FIRE_ZONE : GAS_ZONE;
    int lo = (hi == FIRE_ZONE) ? GAS_ZONE : FIRE_ZONE;
    tellRobot2(lo);          // الثاني: الأقل خطورة
    goTo(hi);                // الأول: الأخطر
  }
  else if (fire) goTo(FIRE_ZONE);
  else if (gas) goTo(GAS_ZONE);
  else patrol();
}`;

/* ================== خريطة الساحة (مشتركة للطريق والمهمة) ================== */
const MW = 1000, MH = 560;
const NODES = { home: [500, 500], j: [500, 330], A: [180, 150], B: [820, 150] };
const PATHS = { A: [[500, 500], [500, 330], [180, 330], [180, 150]], B: [[500, 500], [500, 330], [820, 330], [820, 150]] };
const mapSVG = (id) => `<svg viewBox="0 0 ${MW} ${MH}" class="mapsvg" id="${id}">
  <rect width="${MW}" height="${MH}" fill="#d9b382"/><rect x="20" y="20" width="${MW - 40}" height="${MH - 40}" rx="20" fill="#e8cfa4" stroke="#b5895a" stroke-width="6"/>
  ${[[60, 60], [940, 60], [60, 500], [940, 500]].map(([x, y]) => `<rect x="${x - 30}" y="${y - 30}" width="60" height="60" rx="6" fill="#b5895a" stroke="#8a6239" stroke-width="3"/>`).join('')}
  <path d="M500 520 L500 330 L180 330 L180 140 M500 330 L820 330 L820 140 M420 520 L420 330" class="mline"/>
  <rect x="488" y="324" width="24" height="12" fill="#e74c3c" class="jmark"/><text x="530" y="320" class="mtx">تقاطع</text>
  <g transform="translate(180 110)"><rect x="-70" y="-50" width="140" height="70" rx="10" class="mzone" id="zA"/><text y="-8" class="mtx">المنطقة A</text><text y="14" class="mtx2">البرج الغربي</text></g>
  <g transform="translate(820 110)"><rect x="-70" y="-50" width="140" height="70" rx="10" class="mzone" id="zB"/><text y="-8" class="mtx">المنطقة B</text><text y="14" class="mtx2">مخزن الحطب</text></g>
  <g transform="translate(500 535)"><rect x="-60" y="-24" width="120" height="30" rx="8" fill="#5b6275"/><text y="-3" class="mtx w">🏠 الانطلاق</text></g>
  <g transform="translate(500 175)"><rect x="-56" y="-34" width="112" height="72" rx="10" fill="#1c1f27" stroke="#f0cc7a" stroke-width="3"/><circle cx="-24" cy="22" r="9" class="ledr" id="${id}r"/><circle cx="24" cy="22" r="9" class="ledb" id="${id}b"/><rect x="-46" y="-26" width="92" height="30" rx="4" fill="#9fd356"/><text y="-4" class="mlcd" id="${id}lcd">SAFE</text><text y="62" class="mtx">محطة الأمان</text></g>
  <g id="${id}fA" opacity="0" transform="translate(180 120)"><path d="M0 0 C -18 -30, 10 -52, 0 -80 C 30 -52, 26 -22, 0 0 Z" fill="#ff7043"/><path d="M0 -6 C -8 -22, 6 -32, 0 -48 C 14 -32, 12 -18, 0 -6 Z" fill="#ffd54f"/></g>
  <g id="${id}gA" opacity="0">${[0, 1, 2].map(i => `<circle cx="${160 + i * 24}" cy="${100 - i * 14}" r="${30 + i * 8}" fill="#9ccc65" opacity=".4"/>`).join('')}</g>
  <g id="${id}fB" opacity="0" transform="translate(820 120)"><path d="M0 0 C -18 -30, 10 -52, 0 -80 C 30 -52, 26 -22, 0 0 Z" fill="#ff7043"/><path d="M0 -6 C -8 -22, 6 -32, 0 -48 C 14 -32, 12 -18, 0 -6 Z" fill="#ffd54f"/></g>
  <g id="${id}gB" opacity="0">${[0, 1, 2].map(i => `<circle cx="${800 + i * 24}" cy="${100 - i * 14}" r="${30 + i * 8}" fill="#9ccc65" opacity=".4"/>`).join('')}</g>
  <g id="${id}pkt" class="mpkt"><rect x="-56" y="-16" width="112" height="32" rx="16"/><text y="6"></text></g>
  <g id="${id}spray" opacity="0"><path d="M0 0 q 30 -40 60 -10" fill="none" stroke="#4fc3f7" stroke-width="7" stroke-dasharray="8 6" class="spray"/></g>
  <g id="${id}wind" opacity="0">${[-12, 0, 12].map(d => `<path d="M0 ${d} q 30 -8 60 0" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 6" class="spray"/>`).join('')}</g>
  <g id="${id}spray2" opacity="0"><path d="M0 0 q 30 -40 60 -10" fill="none" stroke="#4fc3f7" stroke-width="7" stroke-dasharray="8 6" class="spray"/></g>
  <g id="${id}wind2" opacity="0">${[-12, 0, 12].map(d => `<path d="M0 ${d} q 30 -8 60 0" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 6" class="spray"/>`).join('')}</g>
  <g id="${id}car2">${car4(id + 'c2', 'r2')}</g><text x="420" y="500" class="mtx2" id="${id}r2l">٢</text>
  <g id="${id}car">${car4(id + 'c')}<circle cx="44" cy="-12" r="5" class="irs" id="${id}sl"/><circle cx="44" cy="12" r="5" class="irs" id="${id}sr"/></g>
</svg>`;
const PATH_CODE = `void goTo(int zone) {
  int junctions = 0;
  while (true) {
    followLine();
    if (onJunction()) {
      junctions++;
      if (zone == ZONE_A) turnLeft(); else turnRight();
    }
    if (atZoneMarker()) break;
  }
  drive(0, 0);
}`;
const MISSION_CODE = `void loop() {
  if (!newAlarm) return;
  newAlarm = false;
  bool fire = m.fireP > 50, gas = m.gasP > 30;
  if (fire && gas) {
    int hi = m.fireP >= m.gasP ? FIRE_ZONE : GAS_ZONE;
    tellRobot2(hi == FIRE_ZONE ? GAS_ZONE : FIRE_ZONE);
    mission(hi);
  }
  else if (fire) mission(FIRE_ZONE);
  else if (gas) mission(GAS_ZONE);
}

void mission(int zone) {
  goTo(zone);
  if (zone == FIRE_ZONE) pumpFor(4000); else fanFor(5000);
  goHome();
}`;

/* ================== دائرة البناء: السيارة ================== */
const LEFT = ['EN', 'VP 36', 'VN 39', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const RIGHT = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2 17', 'RX2 16', 'D4', 'D2', 'D15', 'GND', '3V3'];
const PL = n => 190 + LEFT.indexOf(n) * 13.5, PR = n => 190 + RIGHT.indexOf(n) * 13.5;
const esp = `<g transform="translate(40 90)"><rect width="150" height="340" rx="10" fill="#1f2a44"/><rect x="35" y="20" width="80" height="60" rx="4" fill="#c9ccd3"/><text x="75" y="56" class="lbl" style="font-size:13px">ESP32</text>
  ${LEFT.map((p, i) => `<circle cx="12" cy="${100 + i * 13.5}" r="4" fill="#f0cc7a"/>`).join('')}${RIGHT.map((p, i) => `<circle cx="138" cy="${100 + i * 13.5}" r="4" fill="#f0cc7a"/>`).join('')}</g>`;
B2.carwire4 = { flow: 7, steps: [
  { h: 'لوحة ESP32 وهيكل السيارة', b: 'هيكل رباعي الدفع بأربعة محركات، وESP32 هو الدماغ.' },
  { h: 'الدرايفر L298N والمحركات', b: 'المحركان الأيسران معًا على OUT1/OUT2، والأيمنان معًا على OUT3/OUT4.' },
  { h: 'السرعة: ENA ← 33 · ENB ← 32', b: 'انزع غطاءي ENA وENB. هذه أطراف السيارة الحقيقية في مشروعك.' },
  { h: 'الاتجاه: IN1 ← 27 · IN2 ← 26 · IN3 ← 25 · IN4 ← 14', b: 'أربعة أسلاك تحدد اتجاه كل جانب.' },
  { h: 'الريليه المزدوج: IN1 ← RX2 (16) · IN2 ← TX2 (17)', b: 'VCC إلى VIN. القناة الأولى للمضخة، والثانية للمروحة. يعمل على LOW.' },
  { h: 'المضخة على COM وNO · والأرضي المشترك', b: 'موجب البطارية على المسمار الأوسط (COM)، وموجب المضخة على NO. وGND الكل مشترك.' },
  { h: 'شغّل السيارة!', b: 'العجلات الأربع تدور معًا، والمضخة جاهزة.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 c4w">
  <rect x="250" y="30" width="630" height="470" rx="40" fill="rgba(192,57,43,.08)" stroke="#c0392b" stroke-width="4" stroke-dasharray="12 8"/>
  <g class="bs" data-s="1">${esp}</g>
  <g class="bs" data-s="2"><rect x="430" y="190" width="170" height="150" rx="10" fill="#c0392b"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${455 + i * 18}" y="210" width="9" height="80" fill="#1c1f27"/>`).join('')}<text x="515" y="325" class="lbl" style="font-size:15px;fill:#fff">L298N</text>
    ${['ENA', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB'].map((t, i) => `<rect x="${438 + i * 26}" y="340" width="14" height="14" fill="#f0cc7a"/><text x="${445 + i * 26}" y="370" class="lbl" style="font-size:9px">${t}</text>`).join('')}
    ${[[300, 110], [300, 420], [760, 110], [760, 420]].map(([x, y], k) => `<g transform="translate(${x} ${y})"><rect x="-40" y="-26" width="80" height="52" rx="10" fill="#f4d35e" stroke="#8a6d1f" stroke-width="3"/><g class="c4spin">${[0, 90, 180, 270].map(a => `<rect x="-3" y="-20" width="6" height="16" rx="3" fill="#1c1f27" transform="rotate(${a})"/>`).join('')}</g></g>`).join('')}
    <path d="M300 136 C 300 200, 430 220, 430 240 M300 394 C 300 330, 430 290, 430 280" fill="none" stroke="#d62828" stroke-width="5"/><path d="M760 136 C 760 200, 600 220, 600 240 M760 394 C 760 330, 600 290, 600 280" fill="none" stroke="#1b2340" stroke-width="5"/>
    <text x="300" y="72" class="lbl" style="font-size:13px">يسار</text><text x="760" y="72" class="lbl" style="font-size:13px">يمين</text></g>
  ${wire(`M52 ${PL('D33')} C 0 ${PL('D33')}, 0 470, 300 470 C 430 470, 445 380, 445 354`, 3, '#e0b400')}${wire(`M52 ${PL('D32')} C 6 ${PL('D32')}, 6 480, 310 480 C 560 480, 575 380, 575 354`, 3, '#d35400')}
  ${[['D27', 471, '#2e9e6b'], ['D26', 497, '#16a3b5'], ['D25', 523, '#8e44ad'], ['D14', 549, '#2b6fc0']].map(([p, x, c], i) => wire(`M52 ${PL(p)} C ${14 + i * 4} ${PL(p)}, ${14 + i * 4} ${452 - i * 6}, 320 ${452 - i * 6} C ${x - 20} ${452 - i * 6}, ${x} 380, ${x} 354`, 4, c)).join('')}
  <g class="bs" data-s="5"><rect x="660" y="230" width="150" height="80" rx="8" fill="#1f5fae"/><text x="735" y="260" class="lbl" style="font-size:12px;fill:#fff">ريليه مزدوج</text>${[0, 1].map(i => `<rect x="${672 + i * 70}" y="272" width="56" height="26" rx="4" fill="#2b6fc0"/><text x="${700 + i * 70}" y="290" class="lbl" style="font-size:11px;fill:#fff">${i ? 'مروحة' : 'مضخة'}</text>`).join('')}</g>
  ${wire(`M178 ${PR('RX2 16')} C 300 ${PR('RX2 16')}, 620 170, 690 230`, 5, '#2b6fc0')}${wire(`M178 ${PR('TX2 17')} C 300 ${PR('TX2 17')}, 640 160, 760 230`, 5, '#8e44ad')}
  <g class="bs" data-s="6"><g transform="translate(830 170)"><circle r="22" fill="#cfd8dc" stroke="#78909c" stroke-width="3"/><g class="c4pump">${[0, 90, 180, 270].map(a => `<rect x="-3" y="-17" width="6" height="12" rx="3" fill="#1b2340" transform="rotate(${a})"/>`).join('')}</g></g>
    <path d="M700 298 C 700 330, 840 220, 830 192" fill="none" stroke="#e74c3c" stroke-width="5"/><path d="M830 148 C 860 100, 880 60, 860 40" fill="none" stroke="#4fc3f7" stroke-width="7" class="c4water"/></g>
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  car4lab: s => `<div class="slide light">
      <div class="kicker">🚙 السيارة الرباعية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="c4grid">
        <div class="c4left ix"><svg viewBox="0 0 ${C4W} ${C4H}" class="c4arena"><rect width="${C4W}" height="${C4H}" fill="#e8cfa4"/><rect x="6" y="6" width="${C4W - 12}" height="${C4H - 12}" rx="14" fill="none" stroke="#b5895a" stroke-width="6"/><path id="c4trail" class="c4trail" d=""/><g id="c4car" transform="scale(1)"><g transform="scale(1.4)">${car4('c4c')}</g></g></svg>
          <div class="c4pad"><button class="sndbtn" data-d="F">⬆ أمام</button><button class="sndbtn" data-d="B">⬇ خلف</button><button class="sndbtn" data-d="L">↺ يسار</button><button class="sndbtn" data-d="R">↻ يمين</button><button class="sndbtn" data-d="S">⏹ قف</button></div></div>
        <div class="c4right ix"><div class="c4wires"><div class="c4wh"><span>الأسلاك الحقيقية</span><b>الجانب الأيمن موصول بالعكس</b></div>
            <button class="clap" id="c4inv">✅ INVERT_RIGHT = true</button></div>
          <label class="lsl"><span>⚙️ SPEED: <b id="c4sv">120</b></span><input type="range" id="c4s" min="60" max="255" value="120" step="5"></label>
          <div class="sowarn" id="c4msg"></div>
          ${codeBlock(CAR_CODE, 'micro')}</div>
      </div></div>`,

  dualrelay: s => `<div class="slide light">
      <div class="kicker">🔌 الريليه المزدوج</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="drgrid">
        <div class="drboard">${[['pump', '💧 المضخة', 'RX2 · GPIO16', 'إطفاء اللهب'], ['fan', '🌀 المروحة', 'TX2 · GPIO17', 'تبديد الغاز']].map(([k, n, p, j]) => `<div class="drch ix" data-k="${k}"><div class="drh"><b>${n}</b><span dir="ltr">${p}</span></div>
            <div class="drrel" id="dr${k}"><i class="drled"></i><div class="drcoil"></div><div class="drsw"><span>COM</span><em></em><span>NO</span></div></div>
            <div class="drcode" dir="ltr" id="drc${k}">${highlight(`digitalWrite(${k === 'pump' ? 16 : 17}, HIGH);`)}</div>
            <div class="drbtns"><button class="sndbtn" data-v="LOW">LOW</button><button class="sndbtn" data-v="HIGH">HIGH</button></div>
            <div class="drdev" id="drd${k}"><div class="drvis">${k === 'pump' ? '<i class="water"></i>💧' : '<i class="wind"></i>🌀'}</div><span>${j}: <b>متوقفة</b></span></div></div>`).join('')}</div>
        <div class="drnote"><div class="sowarn ok">🔁 هذه الوحدة «تعمل على LOW»: الكتابة LOW تشغّل، وHIGH تطفئ. لهذا نبدأ في setup بكتابة HIGH على القناتين حتى لا تعمل المضخة فجأة عند التشغيل!</div>
          ${codeBlock(`int PUMP = 16, FAN = 17;

void setup() {
  pinMode(PUMP, OUTPUT); digitalWrite(PUMP, HIGH);
  pinMode(FAN, OUTPUT);  digitalWrite(FAN, HIGH);
}

void pumpOn()  { digitalWrite(PUMP, LOW); }
void pumpOff() { digitalWrite(PUMP, HIGH); }`, 'micro')}</div>
      </div></div>`,

  espnowlab: s => `<div class="slide light">
      <div class="kicker">📡 ESP-NOW</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="engrid">
        <div class="encol"><div class="enbox st"><b>🛡️ ESP32 المحطة</b><small dir="ltr">MAC: 24:6F:28:A1:3C:90</small></div>${codeBlock(NOW_SEND, 'micro')}
          <div class="enbtns ix"><button class="sndbtn" data-t="1" data-z="A">🔥 لهب · A</button><button class="sndbtn" data-t="2" data-z="B">💨 غاز · B</button><button class="sndbtn" data-t="1" data-z="B">🔥 لهب · B</button></div></div>
        <div class="enmid"><svg viewBox="0 0 300 300" class="ensvg"><path d="M20 150 Q 150 40 280 150" class="enarc"/><g id="enpkt" class="enpkt"><rect x="-70" y="-30" width="140" height="60" rx="14"/><text y="-6" id="enp1"></text><text y="16" id="enp2"></text></g>
            <text x="150" y="250" class="entx" id="enst">بلا راوتر · مباشرة · في أجزاء من الثانية</text></svg></div>
        <div class="encol"><div class="enbox car"><b>🚙 ESP32 السيارة</b><small dir="ltr">MAC: EC:E3:34:08:BE:D8</small></div>${codeBlock(NOW_RECV, 'micro')}
          <div class="enlog" id="enlog" dir="ltr"></div></div>
      </div></div>`,

  decisionlab: s => `<div class="slide light">
      <div class="kicker">🧠 القرار</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="dcgrid">
        <div class="dczones ix">${[['A', '🔥 نسبة خطر الحريق', 'fireP', 50, '#e74c3c'], ['B', '💨 نسبة خطر الغاز', 'gasP', 30, '#1e88e5']].map(([z, n, v, th, c]) => `<div class="dcz" id="dz${z}"><h3>${n}</h3>
            <label class="lsl"><span dir="ltr">${v} = <b id="dl${z}v">٠</b>%</span><input type="range" id="dl${z}" min="0" max="100" value="${z === 'A' ? 0 : 0}"></label>
            <div class="dcscore"><span>الحد ${th}٪</span><div class="btbar"><i id="ds${z}" style="background:${c}"></i></div><b id="dn${z}">—</b></div></div>`).join('')}
          <div class="lseg"><span>جرّب</span><button class="lsb" data-p="85,0">حريق فقط</button><button class="lsb" data-p="0,70">غاز فقط</button><button class="lsb" data-p="60,90">الاثنان: الغاز أعلى</button><button class="lsb" data-p="95,45">الاثنان: الحريق أعلى</button></div></div>
        <div class="dcright"><div class="dcverdict" id="dcv"></div><svg viewBox="0 0 400 140" class="dcarrow"><g id="dcar2" transform="translate(240 70)">${car4('dcc2', 'r2')}</g><g id="dcar" transform="translate(160 70)">${car4('dcc')}</g><text x="200" y="22" class="dctx" style="font-size:15px">🔴 الروبوت ١ · 🔵 الروبوت ٢</text><text x="40" y="128" class="dctx">🔥 A</text><text x="360" y="128" class="dctx">B 💨</text></svg>
          ${codeBlock(DEC_CODE, 'micro')}</div>
      </div></div>`,

  pathlab: s => `<div class="slide light">
      <div class="kicker">🗺️ الطريق إلى الحدث</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="pmgrid">
        <div class="pmleft ix">${mapSVG('pm')}<div class="lctl"><button class="clap" id="pmA">🔥 اذهب إلى A</button><button class="sndbtn" id="pmB">💨 اذهب إلى B</button><div class="irdec" id="pmst">في نقطة الانطلاق</div></div></div>
        <div class="pmright">${codeBlock(PATH_CODE, 'micro')}<div class="sofacts"><div class="ac"><span>التقاطعات</span><b id="pmj">٠</b></div><div class="ac gold"><span>حساسا الخط</span><b id="pms" dir="ltr">0 0</b></div></div></div>
      </div></div>`,

  missionlab: s => `<div class="slide light missionlab-sm">
      <div class="kicker">🚒 المهمة الكاملة</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="pmgrid">
        <div class="pmleft ix">${mapSVG('ms')}<div class="mctl"><button class="clap" data-e="1A">🔥 لهب A</button><button class="clap" data-e="2B">💨 غاز B</button><button class="sndbtn" data-e="2A">💨 غاز A</button><button class="sndbtn" data-e="1B">🔥 لهب B</button><button class="sndbtn" data-e="both">🔥💨 معًا: روبوتان</button></div></div>
        <div class="pmright"><div class="mslog" id="mslog"></div>${codeBlock(MISSION_CODE, 'micro')}<div class="sofacts"><div class="ac gold"><span>زمن الاستجابة</span><b id="msrt">—</b></div><div class="ac"><span>مهمات منجزة</span><b id="msn">٠</b></div></div></div>
      </div></div>`,
});

/* ---------- محرك الحركة على الخريطة (مشترك بين الطريق والمهمة) ---------- */
function mapMover(sl, id, key = 'car', home = [500, 500]) {
  const $ = k => sl.querySelector('#' + id + k);
  const st = { x: home[0], y: home[1], th: -Math.PI / 2, path: [], cb: null, junc: 0, speed: 150 };
  st.go = (pts, cb) => { st.path = pts.map(p => [...p]); st.cb = cb; st.junc = 0; };
  st.step = dt => {
    if (st.path.length) { const [tx, ty] = st.path[0], dx = tx - st.x, dy = ty - st.y, d = Math.hypot(dx, dy);
      if (d < 3) { const p = st.path.shift(); if (p[0] === 500 && p[1] === 330) st.junc++; if (!st.path.length && st.cb) { const c = st.cb; st.cb = null; c(); } }
      else { const want = Math.atan2(dy, dx); let da = Math.atan2(Math.sin(want - st.th), Math.cos(want - st.th)); if (Math.abs(da) > 0.05) st.th += clamp(da, -5 * dt, 5 * dt); else { st.th = want; const s = Math.min(d, st.speed * dt); st.x += dx / d * s; st.y += dy / d * s; } } }
    $(key).setAttribute('transform', `translate(${st.x} ${st.y}) rotate(${st.th * 180 / Math.PI})`);
    if (key !== 'car') return;
    const onLine = st.path.length > 0; $('sl').classList.toggle('blk', onLine && Math.sin(performance.now() / 120) > .3); $('sr').classList.toggle('blk', onLine && Math.sin(performance.now() / 120) < -.3);
  };
  return st;
}
const rev = p => [...p].reverse();

Object.assign(window.DECK_BIND, {
  car4lab(sl) {
    const $ = id => sl.querySelector('#' + id), car = $('c4car'), trail = $('c4trail');
    let x = C4W / 2, y = C4H / 2, th = -Math.PI / 2, cmd = 'S', inv = true, pts = [], last = 0, raf = 0;
    const lines = sl.querySelectorAll('.c4right .ln');
    $('c4inv').onclick = e => { inv = !inv; e.target.textContent = inv ? '✅ INVERT_RIGHT = true' : '❌ INVERT_RIGHT = false'; e.target.classList.toggle('off', !inv);
      sl.querySelector('.c4right .ln[data-n="3"] .cl-src').innerHTML = highlight(`const bool INVERT_RIGHT = ${inv};`); };
    $('c4s').oninput = () => $('c4sv').textContent = $('c4s').value;
    sl.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { cmd = b.dataset.d; });
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      const S = +$('c4s').value; let L = 0, R = 0;
      if (cmd === 'F') { L = S; R = S; } if (cmd === 'B') { L = -S; R = -S; } if (cmd === 'L') { L = -S; R = S; } if (cmd === 'R') { L = S; R = -S; }
      const wiredR = -(inv ? -R : R);                                        // الأسلاك معكوسة فعليًا، والكود يصحح إن كان INVERT_RIGHT صحيحًا
      const v = p => Math.abs(p) < 50 ? 0 : p / 255 * 180, vl = v(L), vr = v(wiredR), vv = (vl + vr) / 2, w = (vr - vl) / 70;
      th -= w * dt; x = clamp(x + Math.cos(th) * vv * dt, 50, C4W - 50); y = clamp(y + Math.sin(th) * vv * dt, 50, C4H - 50);
      if (vl || vr) { if (!pts.length || Math.hypot(pts[pts.length - 1][0] - x, pts[pts.length - 1][1] - y) > 6) { pts.push([Math.round(x), Math.round(y)]); if (pts.length > 200) pts.shift(); } }
      car.setAttribute('transform', `translate(${x} ${y}) rotate(${th * 180 / Math.PI})`); trail.setAttribute('d', pts.length ? 'M' + pts.map(p => p.join(' ')).join(' L') : '');
      const m = $('c4msg'); const bad = !inv && (cmd === 'F' || cmd === 'B');
      m.className = 'sowarn ' + (bad ? 'bad' : cmd !== 'S' ? 'ok' : ''); m.textContent = bad ? '😵 طلبنا «أمام» فدارت حول نفسها! الجانب الأيمن موصول بالعكس. الحل: INVERT_RIGHT = true بدل إعادة لحام الأسلاك' : cmd === 'S' ? 'اختر حركة من الأزرار' : `drive(${L}, ${R}) ← ${inv ? 'right = −right' : 'بلا تصحيح'}`;
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', cmd !== 'S' && ((inv && n === 7) || n === 8 || n === 9 || n === 10)); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  dualrelay(sl) {
    sl.querySelectorAll('.drch').forEach(ch => { const k = ch.dataset.k, pin = k === 'pump' ? 16 : 17;
      ch.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const on = b.dataset.v === 'LOW';
        ch.querySelector('.drcode').innerHTML = highlight(`digitalWrite(${pin}, ${b.dataset.v});`);
        ch.querySelector('.drrel').classList.toggle('on', on); ch.querySelector('.drdev').classList.toggle('on', on);
        ch.querySelector('.drdev b').textContent = on ? (k === 'pump' ? 'تعمل 💦' : 'تعمل 💨') : 'متوقفة'; beep(on ? 900 : 600, 40, .03); }); });
  },

  espnowlab(sl) {
    const $ = id => sl.querySelector('#' + id), pkt = $('enpkt'), log = $('enlog'); let busy = false, lines = [];
    const sendL = sl.querySelectorAll('.encol:first-child .ln'), recvL = sl.querySelectorAll('.encol:last-child .ln');
    sl.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      if (busy) return; busy = true; const t = +b.dataset.t, z = b.dataset.z, lvl = t === 1 ? 1 : 2400 + Math.floor(Math.random() * 1200);
      $('enp1').textContent = `type=${t} level=${lvl}`; $('enp2').textContent = `zone=${z}`; sendL.forEach(l => l.classList.toggle('run', [5, 6, 7].includes(+l.dataset.n)));
      const t0 = performance.now(); pkt.style.opacity = 1; beep(1600, 50, .03);
      const fly = now => { const k = Math.min(1, (now - t0) / 1100), x = 20 + 260 * k, y = 150 - Math.sin(k * Math.PI) * 110; pkt.setAttribute('transform', `translate(${x} ${y})`);
        if (k < 1) requestAnimationFrame(fly); else { pkt.style.opacity = 0; busy = false; sendL.forEach(l => l.classList.remove('run'));
          recvL.forEach(l => l.classList.toggle('run', [3, t === 1 ? 4 : 5].includes(+l.dataset.n))); setTimeout(() => recvL.forEach(l => l.classList.remove('run')), 1500);
          lines.unshift(`✅ recv ${t === 1 ? 'FLAME' : 'GAS'} zone ${z} lvl ${lvl} · ${AR(Math.round(2 + Math.random() * 4))} ms`); log.innerHTML = lines.slice(0, 5).map(x => `<div>${x}</div>`).join(''); $('enst').textContent = 'Delivery Success ✓'; } };
      requestAnimationFrame(fly);
    });
  },

  decisionlab(sl) {
    const $ = id => sl.querySelector('#' + id);
    const upd = () => {
      const a = +$('dlA').value, b = +$('dlB').value, fire = a > 50, gas = b > 30;
      $('dlAv').textContent = AR(a); $('dlBv').textContent = AR(b);
      $('dsA').style.width = a + '%'; $('dsB').style.width = b + '%'; $('dnA').textContent = fire ? '🔥 نعم' : 'لا'; $('dnB').textContent = gas ? '💨 نعم' : 'لا';
      let txt, x1 = 160, x2 = 240, lines;
      if (fire && gas) { const f = a >= b; x1 = f ? 70 : 330; x2 = f ? 330 : 70;
        txt = f ? `🔴 الروبوت ١ إلى الحريق (${AR(a)}٪ الأخطر) · 📡 ويبلغ 🔵 الروبوت ٢: إلى الغاز` : `🔴 الروبوت ١ إلى الغاز (${AR(b)}٪ الأخطر) · 📡 ويبلغ 🔵 الروبوت ٢: إلى الحريق`; lines = [2, 3, 4, 5, 6, 7]; }
      else if (fire) { txt = '🔴 حريق وحده: الروبوت ١ إليه، و🔵 الروبوت ٢ يبقى حارسًا'; x1 = 70; lines = [2, 9]; }
      else if (gas) { txt = '🔴 غاز وحده: الروبوت ١ إليه، و🔵 الروبوت ٢ يبقى حارسًا'; x1 = 330; lines = [2, 10]; }
      else { txt = '🛡️ لا خطر: الروبوتان في مكانهما يحرسان'; lines = [2, 11]; }
      $('dzA').classList.toggle('win', x1 === 70); $('dzB').classList.toggle('win', x1 === 330);
      $('dcv').textContent = txt;
      $('dcar').setAttribute('transform', `translate(${x1} 70) rotate(${x1 < 200 ? 180 : 0})`); $('dcar2').setAttribute('transform', `translate(${x2} 70) rotate(${x2 < 200 ? 180 : 0})`);
      runLines(sl, '.dcright', lines);
    };
    sl.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.p.split(','); $('dlA').value = a; $('dlB').value = c; upd(); });
    ['dlA', 'dlB'].forEach(id => $(id).oninput = upd); upd();
  },

  pathlab(sl) {
    const $ = id => sl.querySelector('#' + id), M = mapMover(sl, 'pm'); let raf = 0, last = 0, busy = false;
    const go = z => { if (busy) return; busy = true; $('pmst').textContent = `يتبع الخط نحو ${z}…`; runLines(sl, '.pmright', [3, 4]);
      M.go(PATHS[z], () => { $('pmst').textContent = `✅ وصل إلى المنطقة ${z}`; runLines(sl, '.pmright', [9, 11]); setTimeout(() => { $('pmst').textContent = 'يعود إلى نقطة الانطلاق…'; M.go(rev(PATHS[z]), () => { $('pmst').textContent = 'في نقطة الانطلاق'; busy = false; runLines(sl, '.pmright', []); }); }, 1200); }); };
    $('pmA').onclick = () => go('A'); $('pmB').onclick = () => go('B');
    const loop = ts => { const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; const j0 = M.junc; M.step(dt); if (M.junc !== j0) runLines(sl, '.pmright', [5, 6, 7]);
      $('pmj').textContent = AR(M.junc); $('pms').textContent = `${$('pmsl').classList.contains('blk') ? 1 : 0} ${$('pmsr').classList.contains('blk') ? 1 : 0}`; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  missionlab(sl) {
    const $ = id => sl.querySelector('#' + id), M1 = mapMover(sl, 'ms'), M2 = mapMover(sl, 'ms', 'car2', [420, 500]), lcd = $('mslcd'), pkt = $('mspkt');
    const P2 = { A: [[420, 500], [420, 330], [180, 330], [180, 150]], B: [[420, 500], [420, 330], [820, 330], [820, 150]] };
    let ev = { A: 0, B: 0 }, pc = { A: 0, B: 0 }, busy = 0, t0 = 0, done = 0, raf = 0, last = 0, logs = [], timers = [];
    const say = t => { logs.unshift(`<div><b>${AR(((performance.now() - (t0 || performance.now())) / 1000).toFixed(1)).replace('.', '٫')} ث</b> ${t}</div>`); $('mslog').innerHTML = logs.slice(0, 7).join(''); };
    const station = () => { const fire = ev.A === 1 || ev.B === 1, gas = ev.A === 2 || ev.B === 2; $('msr').classList.toggle('on', fire); $('msb').classList.toggle('on', gas); lcd.textContent = fire && gas ? 'FIRE+GAS' : fire ? 'FLAME!' : gas ? 'GAS!' : 'SAFE';
      ['A', 'B'].forEach(z => { $('msf' + z).setAttribute('opacity', ev[z] === 1 ? 1 : 0); $('msg' + z).setAttribute('opacity', ev[z] === 2 ? 1 : 0); $('z' + z) && $('z' + z).classList.toggle('alarm', !!ev[z]); }); };
    const fly = (from, to, txt, cb) => { const s = performance.now(); pkt.querySelector('text').textContent = txt; pkt.style.opacity = 1;
      const f = now => { const k = Math.min(1, (now - s) / 900), x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 60; pkt.setAttribute('transform', `translate(${x} ${y})`); if (k < 1) requestAnimationFrame(f); else { pkt.style.opacity = 0; cb(); } }; requestAnimationFrame(f); };
    const secs = () => AR(((performance.now() - t0) / 1000).toFixed(1)).replace('.', '٫') + ' ث';
    const NAME = { 1: '🔴 الروبوت ١', 2: '🔵 الروبوت ٢' };
    const mission = (r, z) => { const M = r === 1 ? M1 : M2, path = r === 1 ? PATHS[z] : P2[z]; runLines(sl, '.pmright', [14, 15]);
      M.go(path, () => { const type = ev[z]; say(`${NAME[r]} وصل: ${type === 1 ? '💧 المضخة تعمل' : '🌀 المروحة تعمل'}`); runLines(sl, '.pmright', [16]);
        const g = $((type === 1 ? 'msspray' : 'mswind') + (r === 1 ? '' : '2')); g.setAttribute('opacity', 1); g.setAttribute('transform', `translate(${M.x + 10} ${M.y - 40}) rotate(-60)`); beep(type === 1 ? 500 : 300, 300, .02);
        timers.push(setTimeout(() => { g.setAttribute('opacity', 0); ev[z] = 0; station(); done++; $('msn').textContent = AR(done); say(`✅ المنطقة ${z} آمنة (${NAME[r]})`); $('msrt').textContent = secs(); runLines(sl, '.pmright', [17]);
          M.go(rev(path), () => { busy--; if (!busy) { runLines(sl, '.pmright', []); say('🏠 الروبوتان في نقطة الانطلاق'); } }); }, type === 1 ? 3200 : 3800)); }); };
    const run = () => {
      const fire = ev.A === 1 ? 'A' : ev.B === 1 ? 'B' : null, gas = ev.A === 2 ? 'A' : ev.B === 2 ? 'B' : null;
      const st0 = { x: 500, y: 175 };
      if (fire && gas) {
        const hi = pc[fire] >= pc[gas] ? fire : gas, lo = hi === fire ? gas : fire;
        say(`📡 المحطة ترسل: 🔥 ${AR(pc[fire])}٪ · 💨 ${AR(pc[gas])}٪`); runLines(sl, '.pmright', [2, 3, 4, 5]);
        fly(st0, M1, 'FIRE+GAS', () => {
          say(`🧠 ${NAME[1]} يقرر: ${hi === fire ? 'الحريق' : 'الغاز'} أخطر ← إليه`); runLines(sl, '.pmright', [6, 7, 8]); busy = 2;
          fly(M1, M2, 'GO ' + lo, () => { say(`📡 ${NAME[1]} يبلغ ${NAME[2]}: إلى ${lo === fire ? 'الحريق' : 'الغاز'} (الأقل خطورة)`); mission(2, lo); });
          mission(1, hi);
        });
      } else {
        const z = fire || gas; say(`📡 المحطة ترسل: ${fire ? '🔥 حريق ' + AR(pc[z]) + '٪' : '💨 غاز ' + AR(pc[z]) + '٪'} في ${z}`); runLines(sl, '.pmright', [2, 3, 4]);
        fly(st0, M1, (fire ? 'FIRE ' : 'GAS ') + z, () => { say(`🧠 ${NAME[1]}: خطر واحد ← إليه، و${NAME[2]} يبقى حارسًا`); runLines(sl, '.pmright', [10, 11]); busy = 1; mission(1, z); });
      }
    };
    sl.querySelectorAll('[data-e]').forEach(b => b.onclick = () => {
      if (busy) return; busy = 1; const e = b.dataset.e; t0 = performance.now(); logs = [];
      if (e === 'both') { ev.A = 2; ev.B = 1; pc.A = 88; pc.B = 72; say('🔥💨 حدثان معًا: غاز ٨٨٪ في A ولهب ٧٢٪ في B'); }
      else { ev[e[1]] = +e[0]; pc[e[1]] = e[0] === '1' ? 80 : 65; }
      say(`🚨 المحطة: ${e === 'both' ? 'الأحمر والأزرق يضيئان' : e[0] === '1' ? 'الليد الأحمر والبازر' : 'الليد الأزرق والبازر'}`); station(); beep(1500, 150, .04);
      timers.push(setTimeout(run, 700));
    });
    const loop = ts => { const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; M1.step(dt); M2.step(dt); raf = requestAnimationFrame(loop); };
    station(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); });
  },
});
})();
