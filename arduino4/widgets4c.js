/* =====================================================================
   «المزرعة الذكية والمنزل الذكي» — أدوات المنزل والجراج والإنترنت
   الأنواع: houselab (إضاءة بـ PIR وmillis) · doorlab (لوحة مفاتيح وRFID وقفل) · gaslab (غاز وحريق)
            solarlab (طاقة شمسية وأولويات) · homelab (أوضاع المنزل الكامل) · garagelab (جراج ببوابتين ومواقف)
            iotlab (جوال ← واي فاي ← ESP32)
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const f0 = v => AR(Math.round(v)), f1 = v => AR((Math.round(v * 10) / 10).toFixed(1)).replace('.', '٫');
const hhmm = h => AR(String(Math.floor(h) % 24).padStart(2, '0')) + ':' + AR(String(Math.floor((h % 1) * 60)).padStart(2, '0'));
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
let AC = null;
const beep = (f = 1200, ms = 120, v = .05) => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0008, AC.currentTime + ms / 1000); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + ms / 1000); } catch (e) { } };
const lcdGrid = id => `<div class="lcd2"><div class="lcdglass lit" id="${id}">${Array.from({ length: 32 }, () => '<i></i>').join('')}</div></div>`;
const lcdSet = (el, a, b) => { const cells = el.querySelectorAll('i'); (a.padEnd(16).slice(0, 16) + b.padEnd(16).slice(0, 16)).split('').forEach((c, i) => cells[i].textContent = c === ' ' ? '' : c); };

/* ================== الإضاءة الذكية ================== */
const ROOMS = [['الصالة', 40, 40, 380, 230], ['المطبخ', 420, 40, 300, 230], ['النوم', 40, 270, 380, 230], ['الممر', 420, 270, 300, 230]];
const houseSVG = () => `<svg viewBox="0 0 760 540" class="hsvg2">
  <rect width="760" height="540" fill="#1b2340"/>
  ${ROOMS.map(([n, x, y, w, h], i) => `<g class="room" data-i="${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="rfloor" id="rf${i}"/>
    <circle cx="${x + w / 2}" cy="${y + 34}" r="18" class="rbulb" id="rb${i}"/><circle cx="${x + w / 2}" cy="${y + 34}" r="120" class="rglow" id="rg${i}"/>
    <g transform="translate(${x + w - 34} ${y + 16})"><rect width="24" height="16" rx="4" class="pir"/><circle cx="12" cy="8" r="5" class="pirl" id="pl${i}"/></g>
    <text x="${x + 20}" y="${y + h - 18}" class="rname">${n}</text><rect x="${x + 20}" y="${y + h - 12}" width="${w - 40}" height="6" rx="3" class="rtbar"/><rect x="${x + 20}" y="${y + h - 12}" width="0" height="6" rx="3" class="rtfill" id="rt${i}"/></g>`).join('')}
  <g id="hperson"><circle r="22" class="pbody"/><text y="8" class="pface">🧍</text></g>
</svg>`;
const LIGHT_CODE = `unsigned long lastMove = 0;

void loop() {
  bool dark = analogRead(A1) < 300;
  if (digitalRead(3) == HIGH) lastMove = millis();
  bool on = dark && (millis() - lastMove < 30000);
  digitalWrite(13, on);
}`;

/* ================== الباب الذكي ================== */
const KEYS = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
const CARDS = [['💳 بطاقة الأب', 'A3 1F 9C 22', true], ['💳 بطاقة الأم', '7B 44 E0 15', true], ['❓ بطاقة مجهولة', '19 C2 7A 6D', false]];
const DOOR_CODE = `String pass = "2026", input = "";
int wrong = 0;

void loop() {
  char k = keypad.getKey();
  if (k && k != '#') input += k;
  if (k == '#') {
    if (input == pass) { openDoor(); wrong = 0; }
    else if (++wrong >= 3) alarm();
    input = "";
  }
}`;
const doorSVG = () => `<svg viewBox="0 0 360 440" class="dsvg">
  <rect x="20" y="20" width="320" height="400" rx="8" fill="#c9a97a"/><rect x="40" y="40" width="280" height="380" fill="#3e2a1a"/>
  <g id="dleaf" style="transform-origin:40px 230px"><rect x="40" y="40" width="280" height="380" rx="4" class="leafd"/>${[[70, 70], [190, 70], [70, 250], [190, 250]].map(([x, y]) => `<rect x="${x}" y="${y}" width="100" height="150" rx="6" class="panel"/>`).join('')}
    <circle cx="290" cy="240" r="12" fill="#f0cc7a"/></g>
  <g transform="translate(300 230)"><rect x="-30" y="-14" width="40" height="28" rx="4" fill="#2b6fc0"/><rect id="dbolt" x="-24" y="-5" width="30" height="10" rx="3" fill="#c9ccd3"/></g>
  <text x="180" y="20" class="dst" id="dst">🔒 مقفل</text>
</svg>`;

/* ================== الغاز والحريق ================== */
const GAS_CODE = `int gas = analogRead(A3);
if (gas > 400) tone(8, 1500, 100);
if (gas > 600) {
  digitalWrite(valve, LOW);
  digitalWrite(exhaust, HIGH);
  window.write(90);
}
if (digitalRead(7) == LOW) alarmFire();`;
const kitchenSVG = () => `<svg viewBox="0 0 620 440" class="ksvg2">
  <rect width="620" height="440" fill="#f4eee2"/><rect y="340" width="620" height="100" fill="#d7c4a3"/>
  <rect id="kgas" width="620" height="440" fill="#9ccc65" opacity="0"/>
  <g transform="translate(80 230)"><rect width="200" height="110" rx="6" fill="#b0bec5"/><rect x="10" y="-14" width="180" height="16" rx="4" fill="#78909c"/>
    <circle cx="60" cy="-6" r="22" fill="#455a64"/><circle cx="140" cy="-6" r="22" fill="#455a64"/>
    <g id="kflame" opacity="0"><path d="M60 -30 C 40 -60, 70 -80, 60 -110 C 90 -80, 90 -50, 60 -30 Z" fill="#ff7043"/><path d="M60 -34 C 52 -54, 66 -64, 60 -80 C 76 -62, 74 -46, 60 -34 Z" fill="#ffd54f"/></g>
    <g transform="translate(100 70)"><circle r="18" fill="#eceff1" stroke="#455a64" stroke-width="3"/><g id="kknob"><rect x="-3" y="-16" width="6" height="16" fill="#c62828"/></g></g></g>
  <g transform="translate(330 300)"><rect width="34" height="40" rx="4" fill="#5b6275"/><circle cx="17" cy="16" r="9" fill="#ffd54f" id="kvalvel"/><text x="17" y="58" class="kl">صمام</text></g>
  <g transform="translate(470 60)"><rect width="110" height="140" rx="6" fill="#cfe8f5" stroke="#8d6e48" stroke-width="6"/><g id="kwin" style="transform-origin:470px 60px"><rect x="0" y="0" width="110" height="140" rx="4" fill="rgba(143,202,236,.7)" stroke="#8d6e48" stroke-width="4"/></g><text x="55" y="164" class="kl">نافذة</text></g>
  <g transform="translate(470 270)"><circle r="34" fill="#eceff1" stroke="#455a64" stroke-width="4"/><g id="kfan">${[0, 120, 240].map(a => `<path d="M0 0 C -6 -14, -3 -28, 6 -28 C 12 -18, 6 -8, 0 0" fill="#455a64" transform="rotate(${a})"/>`).join('')}</g><text y="56" class="kl">شفاط</text></g>
  <g transform="translate(320 40)"><rect width="60" height="36" rx="6" fill="#1f5fae"/><text x="30" y="24" class="kl w">MQ-2</text><circle cx="30" cy="54" r="10" fill="#ff3b3b" id="kalarm" class="kal"/></g>
</svg>`;

/* ================== الطاقة الشمسية ================== */
const LOADS = [['🧊', 'الثلاجة', 60, 1, 'always'], ['💡', 'الإضاءة', 40, 2, 'evening'], ['💧', 'مضخة المزرعة', 120, 3, 'dawn'], ['❄️', 'المكيف', 250, 4, 'hot']];
const SOLAR_CODE = `int battery = readBatteryPercent();
digitalWrite(fridge, HIGH);
digitalWrite(lights, battery > 15);
digitalWrite(pump, battery > 40);
digitalWrite(ac, battery > 60 && solarPower() > 100);`;

/* ================== المنزل الكامل ================== */
const MODES = { home: ['🏠', 'في البيت', { lights: 'auto', ac: 'auto', alarm: false, lock: false, curtain: 'auto' }], away: ['🚗', 'خارج البيت', { lights: 'off', ac: 'off', alarm: true, lock: true, curtain: 'closed' }],
  night: ['🌙', 'النوم', { lights: 'night', ac: 'eco', alarm: true, lock: true, curtain: 'closed' }], guests: ['🎉', 'الضيوف', { lights: 'on', ac: 'on', alarm: false, lock: false, curtain: 'open' }] };
const HOME_CODE = `enum Mode { HOME, AWAY, NIGHT, GUESTS };
Mode mode = HOME;

void loop() {
  switch (mode) {
    case HOME:   autoLights(); autoClimate(); break;
    case AWAY:   allOff(); lockDoor(); armAlarm(); break;
    case NIGHT:  nightLights(); lockDoor(); armAlarm(); break;
    case GUESTS: allLights(true); unlockDoor(); break;
  }
  if (motion() && alarmArmed) sendAlert();
  if (gasLeak()) emergency();
}`;

/* ================== الجراج الذكي ================== */
const GW = 960, GH = 560, SPOTS = 6;
const SPOT_XY = Array.from({ length: SPOTS }, (_, i) => [250 + (i % 3) * 210, i < 3 ? 70 : 380]);
const GARAGE_CODE = `int freeSpots = 6;

void loop() {
  if (carAtEntrance()) {
    if (freeSpots > 0) { openGate(entry); freeSpots--; }
    else lcdShow("Sorry, FULL!");
  }
  if (carAtExit()) { openGate(exitGate); freeSpots++; }
  for (int i = 0; i < 6; i++) {
    bool busy = analogRead(spot[i]) < 400;
    digitalWrite(red[i], busy);
    digitalWrite(green[i], !busy);
  }
  lcdShow("Welcome! Free:", freeSpots);
}`;
const garageSVG = () => `<svg viewBox="0 0 ${GW} ${GH}" class="gsvg2">
  <rect width="${GW}" height="${GH}" fill="#3a3f4b"/>
  <rect x="0" y="220" width="${GW}" height="120" fill="#4a505e"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 80 + 20}" y="276" width="44" height="8" rx="4" fill="#f4f1ea" opacity=".6"/>`).join('')}
  ${SPOT_XY.map(([x, y], i) => `<g class="spot" data-i="${i}"><rect x="${x - 80}" y="${y}" width="160" height="110" rx="6" class="sparea"/><text x="${x}" y="${y + (i < 3 ? 100 : 22)}" class="spn">P${i + 1}</text>
    <circle cx="${x + 62}" cy="${y + (i < 3 ? 14 : 96)}" r="10" class="sled" id="sl${i}"/></g>`).join('')}
  <rect x="0" y="210" width="12" height="140" fill="#f0cc7a"/><rect x="${GW - 12}" y="210" width="12" height="140" fill="#f0cc7a"/>
  <g transform="translate(70 214)"><rect x="-10" y="-10" width="20" height="20" rx="4" fill="#5b6275"/><g id="gate0" style="transform-origin:0px 0px"><rect x="-5" y="0" width="10" height="120" rx="5" class="garm"/>${[0, 1, 2].map(i => `<rect x="-5" y="${14 + i * 34}" width="10" height="16" fill="#e74c3c"/>`).join('')}</g><circle cx="0" cy="-26" r="9" class="glight" id="gl0"/></g>
  <g transform="translate(${GW - 70} 346)"><rect x="-10" y="-10" width="20" height="20" rx="4" fill="#5b6275"/><g id="gate1" style="transform-origin:0px 0px"><rect x="-5" y="-120" width="10" height="120" rx="5" class="garm"/>${[0, 1, 2].map(i => `<rect x="-5" y="${-30 - i * 34}" width="10" height="16" fill="#e74c3c"/>`).join('')}</g><circle cx="0" cy="26" r="9" class="glight" id="gl1"/></g>
  <text x="30" y="380" class="gtxt">دخول ⬅</text><text x="${GW - 30}" y="200" class="gtxt" style="text-anchor:end">➡ خروج</text>
  <g id="gcars"></g>
</svg>`;
const carG = (c) => `<g class="gcar" id="car${c.id}"><rect x="-34" y="-20" width="68" height="40" rx="10" fill="${c.col}"/><rect x="2" y="-15" width="18" height="30" rx="4" fill="#cfe7f7"/><rect x="-26" y="-15" width="14" height="30" rx="3" fill="#cfe7f7" opacity=".7"/></g>`;

/* ================== إنترنت الأشياء ================== */
const IOT_CODE = `#include <WiFi.h>
#include <WebServer.h>
WebServer server(80);

void setup() {
  WiFi.begin("SchoolWiFi", "password");
  server.on("/pump/on", []() {
    digitalWrite(PUMP, HIGH);
    server.send(200, "text/plain", "pump on");
  });
  server.on("/status", []() {
    server.send(200, "application/json", statusJSON());
  });
  server.begin();
}

void loop() {
  server.handleClient();
}`;

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  houselab: s => `<div class="slide light">
      <div class="kicker">💡 بيت حي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hlgrid">
        <div class="hlleft ix">${houseSVG()}<div class="hlhint">👆 انقر أي غرفة ليمشي إليها الشخص</div></div>
        <div class="hlright ix">
          <label class="lsl"><span>☀️ ضوء النهار: <b id="hldv">٢٠</b>٪</span><input type="range" id="hld" min="0" max="100" value="20"></label>
          <label class="lsl"><span>⏱️ مدة البقاء مضاءً: <b id="hltv">٨</b> ث</span><input type="range" id="hlt" min="3" max="20" value="8"></label>
          <div class="sofacts"><div class="ac"><span>بيت ذكي ⚡</span><b id="hlsmart">٠ واط·س</b></div><div class="ac"><span>بيت عادي ⚡</span><b id="hldumb">٠ واط·س</b></div><div class="ac gold"><span>التوفير</span><b id="hlsave">—</b></div></div>
          ${codeBlock(LIGHT_CODE, 'micro')}
        </div>
      </div></div>`,

  doorlab: s => `<div class="slide light">
      <div class="kicker">🚪 الباب الذكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="dlgrid">
        <div class="dlcol ix">${lcdGrid('dlcd')}<div class="keypad">${KEYS.map(k => `<button class="kk${/[A-D*#]/.test(k) ? ' fn' : ''}" data-k="${k}">${k}</button>`).join('')}</div>
          <div class="dlhint">كلمة السر: <b dir="ltr">2026</b> ثم <b>#</b></div></div>
        <div class="dlcol">${doorSVG()}<div class="dlwrong" id="dlw"></div></div>
        <div class="dlcol ix"><div class="rfid"><div class="rfreader" id="rfr"><span>📶 RC522</span></div>${CARDS.map(([n, u], i) => `<button class="rfcard" data-c="${i}">${n}<small dir="ltr">${u}</small></button>`).join('')}</div>
          ${codeBlock(DOOR_CODE, 'micro')}</div>
      </div></div>`,

  gaslab: s => `<div class="slide light">
      <div class="kicker">🔥 مطبخ آمن</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="gsgrid">
        <div class="gsleft">${kitchenSVG()}</div>
        <div class="gsright ix">
          <div class="sofacts"><div class="ac"><span>MQ-2 (A3)</span><b id="gsv">—</b></div><div class="ac gold"><span>الحالة</span><b id="gss" style="font-size:24px">—</b></div><div class="ac"><span>الصمام</span><b id="gsvl">مفتوح</b></div></div>
          <label class="lsl"><span>🔥 تسرّب الغاز: <b id="gslv">٠</b></span><input type="range" id="gsl" min="0" max="10" value="0"></label>
          <div class="gsbtns"><button class="clap" id="gsfire">🔥 حريق!</button><button class="sndbtn" id="gssys">🛡️ النظام: يعمل</button><button class="sndbtn" id="gssnd">🔇 الصوت</button></div>
          <div class="plot4"><div class="plh"><i style="background:#ffb300"></i>تركيز الغاز <i style="background:#f0cc7a"></i>حدا التحذير والخطر</div><svg viewBox="0 0 600 170" class="chart4" id="gsch" preserveAspectRatio="none"><line x1="0" x2="600" class="cm" id="gsm1"/><line x1="0" x2="600" class="cm" id="gsm2"/><polyline class="cl" style="stroke:#ffb300" id="gspl" points=""/></svg></div>
          ${codeBlock(GAS_CODE, 'micro')}
        </div>
      </div></div>`,

  solarlab: s => `<div class="slide light">
      <div class="kicker">☀️ طاقة شمسية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="slgrid">
        <div class="slleft"><svg viewBox="0 0 640 360" class="slsvg"><rect width="640" height="360" id="slsky" fill="#bfe3f7"/><circle id="slsun" r="28" fill="#ffd23f"/><rect y="290" width="640" height="70" fill="#7cb342"/>
            <g transform="translate(60 180) skewX(-14)"><rect width="170" height="90" rx="6" fill="#1f5fae" stroke="#cfd8e6" stroke-width="4"/>${[42, 85, 128].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="90" stroke="#cfd8e6" stroke-width="2"/>`).join('')}</g><text x="150" y="300" class="kl">اللوح الشمسي</text>
            <g transform="translate(300 170)"><rect width="80" height="120" rx="10" fill="#37474f"/><rect x="26" y="-10" width="28" height="12" rx="3" fill="#78909c"/><rect id="slbat" x="8" y="10" width="64" height="100" rx="5" fill="#2e9e6b"/><text x="40" y="146" class="kl">البطارية</text></g>
            <path d="M232 230 L300 230" class="slflow" id="slf1"/><path d="M380 230 L450 230" class="slflow" id="slf2"/>
            <g transform="translate(470 120)">${LOADS.map(([i, n], k) => `<g transform="translate(0 ${k * 44})"><rect width="150" height="36" rx="10" class="slload" id="sll${k}"/><text x="18" y="25" style="font-size:20px">${i}</text><text x="40" y="24" class="sln">${n}</text></g>`).join('')}</g>
            <text x="20" y="40" class="ghclk" id="slclk">٠٦:٠٠</text></svg>
          <div class="ghctl ix"><button class="clap" id="slmode">🧠 الإدارة الذكية: تعمل</button><label class="lsl"><span>⏩ سرعة اليوم</span><input type="range" id="slsp" min="1" max="6" value="3"></label></div></div>
        <div class="slright">
          <div class="sofacts"><div class="ac"><span>الشمس تعطي</span><b id="slin">—</b></div><div class="ac"><span>الأحمال تأخذ</span><b id="slout">—</b></div><div class="ac gold"><span>البطارية</span><b id="slbv">—</b></div></div>
          <div class="sowarn" id="slmsg"></div>
          <div class="plot4"><div class="plh"><i style="background:#2e9e6b"></i>شحن البطارية ٪ <i style="background:#ffb300"></i>إنتاج الشمس</div><svg viewBox="0 0 600 170" class="chart4" id="slch" preserveAspectRatio="none"><polyline class="cl" style="stroke:#2e9e6b" id="slp1" points=""/><polyline class="cl" style="stroke:#ffb300" id="slp2" points=""/></svg></div>
          ${codeBlock(SOLAR_CODE, 'micro')}
        </div>
      </div></div>`,

  homelab: s => `<div class="slide light">
      <div class="kicker">🏠 المنزل الكامل</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="hmgrid">
        <div class="hmleft ix"><div class="hmmodes">${Object.entries(MODES).map(([k, [i, n]]) => `<button class="hmm${k === 'home' ? ' on' : ''}" data-m="${k}"><b>${i}</b>${n}</button>`).join('')}</div>
          <div class="hmdev" id="hmdev"></div>
          <div class="hmev"><span>أحداث:</span><button class="sndbtn" data-e="motion">🚶 حركة في الصالة</button><button class="sndbtn" data-e="gas">💨 تسرب غاز</button><button class="sndbtn" data-e="bell">🔔 جرس الباب</button></div>
          <div class="hmphone" id="hmphone"><b>📱 جوال صاحب البيت</b><div id="hmnote">لا إشعارات</div></div></div>
        <div class="hmright">${codeBlock(HOME_CODE, 'micro')}</div>
      </div></div>`,

  garagelab: s => `<div class="slide light">
      <div class="kicker">🅿️ الجراج الذكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="gggrid">
        <div class="ggleft ix">${garageSVG()}
          <div class="ggctl"><button class="clap" id="ggin">🚗 سيارة تصل</button><button class="sndbtn" id="ggout">🚙 سيارة تغادر</button><button class="sndbtn" id="ggfill">⚡ املأ الجراج</button><button class="sndbtn" id="ggauto">▶ حركة تلقائية</button></div></div>
        <div class="ggright">${lcdGrid('glcd')}
          <div class="sofacts"><div class="ac gold"><span>الأماكن الخالية</span><b id="ggfree">٦</b></div><div class="ac"><span>بوابة الدخول</span><b id="gg0">مغلقة</b></div><div class="ac"><span>بوابة الخروج</span><b id="gg1">مغلقة</b></div></div>
          <div class="sowarn" id="ggmsg"></div>
          ${codeBlock(GARAGE_CODE, 'micro')}
        </div>
      </div></div>`,

  iotlab: s => `<div class="slide light">
      <div class="kicker">📡 إنترنت الأشياء</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="iogrid">
        <div class="iophone ix"><div class="phone2"><div class="pscr">
          <div class="ptop">🌐 192.168.1.50 · متصل</div>
          <div class="iocard"><b>🌱 المزرعة</b><span>التربة <i id="ios">٤٢٪</i></span><button class="iobtn" data-r="/pump/on">💧 شغّل المضخة</button></div>
          <div class="iocard"><b>🏠 البيت</b><button class="iobtn" data-r="/light/toggle">💡 ضوء الصالة</button><button class="iobtn" data-r="/door/lock">🔒 اقفل الباب</button></div>
          <div class="iocard"><b>🅿️ الجراج</b><span>أماكن خالية <i id="iog">٣</i></span><button class="iobtn" data-r="/status">🔄 تحديث</button></div>
        </div></div></div>
        <div class="iomid"><svg viewBox="0 0 420 420" class="iosvg"><g transform="translate(60 210)"><rect x="-34" y="-58" width="68" height="116" rx="14" fill="#1c1f27"/><rect x="-28" y="-46" width="56" height="88" rx="4" fill="#2b6fc0"/></g>
            <g transform="translate(210 110)"><rect x="-50" y="-20" width="100" height="40" rx="10" fill="#37474f"/><line x1="-30" y1="-20" x2="-40" y2="-56" stroke="#37474f" stroke-width="6"/><line x1="30" y1="-20" x2="40" y2="-56" stroke="#37474f" stroke-width="6"/><circle cx="-30" cy="0" r="5" fill="#7ee2a8"/><circle cx="-12" cy="0" r="5" fill="#7ee2a8"/><text y="44" class="kl">الراوتر</text></g>
            <g transform="translate(360 210)"><rect x="-44" y="-60" width="88" height="120" rx="8" fill="#1f2a44"/><rect x="-30" y="-48" width="60" height="40" rx="3" fill="#c9ccd3"/><text y="34" class="kl w">ESP32</text><circle cx="30" cy="48" r="6" fill="#ff3b3b" id="ioled"/></g>
            <path d="M94 190 Q 150 110 160 110" class="iopath"/><path d="M260 110 Q 300 110 316 170" class="iopath"/>
            <g id="iopkt" class="iopkt"><rect x="-70" y="-16" width="140" height="32" rx="16"/><text y="6" id="iopt"></text></g>
            <g transform="translate(210 330)"><text class="kl" id="iodev">💧 المضخة: متوقفة · 💡 الضوء: مطفأ · 🔒 الباب: مفتوح</text></g></svg>
          <div class="iolog" id="iolog" dir="ltr"></div></div>
        <div class="iocode">${codeBlock(IOT_CODE, 'micro')}</div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  /* ---------------- الإضاءة ---------------- */
  houselab(sl) {
    const $ = id => sl.querySelector('#' + id), person = $('hperson');
    const center = i => { const [, x, y, w, h] = ROOMS[i]; return [x + w / 2, y + h / 2 + 20]; };
    let pos = center(0), target = center(0), roomNow = 0, lastMove = [0, 0, 0, 0], on = [0, 0, 0, 0], smart = 0, dumb = 0, last = 0, raf = 0, t = 0;
    sl.querySelectorAll('.room').forEach(r => r.addEventListener('pointerdown', () => { target = center(+r.dataset.i); }));
    ['hld', 'hlt'].forEach(id => $(id).oninput = () => { $('hldv').textContent = f0($('hld').value); $('hltv').textContent = f0($('hlt').value); });
    const lines = sl.querySelectorAll('.hlright .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; t += dt;
      const dx = target[0] - pos[0], dy = target[1] - pos[1], d = Math.hypot(dx, dy);
      if (d > 2) { const st = Math.min(d, 260 * dt); pos = [pos[0] + dx / d * st, pos[1] + dy / d * st]; }
      roomNow = ROOMS.findIndex(([, x, y, w, h]) => pos[0] > x && pos[0] < x + w && pos[1] > y && pos[1] < y + h);
      const dark = +$('hld').value < 30, T = +$('hlt').value;
      ROOMS.forEach((_, i) => {
        const motion = roomNow === i && (d > 2 || Math.sin(t * 3) > 0.3);       // الحركة: مشي، أو حركة خفيفة في المكان
        if (motion) lastMove[i] = t;
        on[i] = dark && t - lastMove[i] < T && lastMove[i] > 0;
        $('pl' + i).classList.toggle('on', motion); $('rb' + i).classList.toggle('on', !!on[i]); $('rg' + i).classList.toggle('on', !!on[i]); $('rf' + i).classList.toggle('lit', !!on[i]);
        const left = on[i] ? 1 - (t - lastMove[i]) / T : 0; $('rt' + i).setAttribute('width', Math.max(0, left) * (ROOMS[i][3] - 40));
      });
      smart += on.filter(Boolean).length * 15 * dt; dumb += (dark ? 4 : 0) * 15 * dt;
      $('hlsmart').textContent = f0(smart) + ' واط·ث'; $('hldumb').textContent = f0(dumb) + ' واط·ث'; $('hlsave').textContent = dumb > 5 ? f0(100 - smart / dumb * 100) + '٪' : '—';
      person.setAttribute('transform', `translate(${pos[0]} ${pos[1]})`);
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 4 || (roomNow >= 0 && n === 5 && t - lastMove[roomNow] < .2) || n === 6 || n === 7); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- الباب ---------------- */
  doorlab(sl) {
    const $ = id => sl.querySelector('#' + id), lcd = $('dlcd');
    let input = '', wrong = 0, lockUntil = 0, closeT = 0, timers = [];
    const show = (a, b) => lcdSet(lcd, a, b);
    const idle = () => show('Enter password:', '');
    const setDoor = open => { $('dleaf').classList.toggle('open', open); $('dbolt').classList.toggle('open', open); $('dst').textContent = open ? '🔓 مفتوح' : '🔒 مقفل'; };
    const open = who => { setDoor(true); show('Welcome home!', who); beep(1800, 120); setTimeout(() => beep(2300, 160), 140); clearTimeout(closeT); closeT = setTimeout(() => { setDoor(false); idle(); }, 4000); };
    const lines = sl.querySelectorAll('.dlcol .ln'), hl = arr => { lines.forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n))); timers.push(setTimeout(() => lines.forEach(l => l.classList.remove('run')), 900)); };
    const fail = () => { wrong++; $('dlw').textContent = '❌'.repeat(wrong); beep(300, 250);
      if (wrong >= 3) { lockUntil = Date.now() + 10000; show('!! ALARM !!', 'Locked 10 sec'); $('dlw').classList.add('alarm'); for (let i = 0; i < 6; i++) timers.push(setTimeout(() => beep(i % 2 ? 900 : 1400, 220, .06), i * 300));
        timers.push(setTimeout(() => { wrong = 0; $('dlw').textContent = ''; $('dlw').classList.remove('alarm'); idle(); }, 10000)); hl([9]); }
      else { show('Wrong password', `${3 - wrong} tries left`); hl([9]); timers.push(setTimeout(idle, 1500)); } };
    sl.querySelectorAll('.kk').forEach(b => b.addEventListener('pointerdown', () => {
      if (Date.now() < lockUntil) return; const k = b.dataset.k; b.classList.add('dn'); setTimeout(() => b.classList.remove('dn'), 120); beep(1000, 40, .03);
      if (k === '*') { input = ''; idle(); return; }
      if (k !== '#') { input += k; show('Enter password:', '*'.repeat(input.length)); hl([5, 6]); return; }
      if (input === '2026') { wrong = 0; $('dlw').textContent = ''; open('Code: OK'); hl([7, 8]); } else fail();
      input = '';
    }));
    sl.querySelectorAll('.rfcard').forEach(b => b.onclick = () => {
      if (Date.now() < lockUntil) return; const [n, uid, ok] = CARDS[+b.dataset.c]; $('rfr').classList.add('read'); setTimeout(() => $('rfr').classList.remove('read'), 500);
      if (ok) open(n.replace('💳 بطاقة ', '').trim() === 'الأب' ? 'Card: Father' : 'Card: Mother'); else { show('Unknown card!', uid); beep(300, 300); timers.push(setTimeout(idle, 1600)); }
    });
    idle();
    window.DECK_CLEANUP.push(() => { clearTimeout(closeT); timers.forEach(clearTimeout); });
  },

  /* ---------------- الغاز والحريق ---------------- */
  gaslab(sl) {
    const $ = id => sl.querySelector('#' + id), pl = $('gspl'), buf = [];
    let ppm = 120, sysOn = true, sound = false, fire = 0, valve = true, exhaust = false, win = 0, last = 0, raf = 0, bt = 0, warm = 8;
    const Y = v => 160 - clamp(v, 0, 1000) / 1000 * 150; [['gsm1', 400], ['gsm2', 600]].forEach(([id, v]) => { $(id).setAttribute('y1', Y(v)); $(id).setAttribute('y2', Y(v)); });
    $('gsl').oninput = () => { $('gslv').textContent = AR($('gsl').value); if (+$('gsl').value > 0) valve = true; };
    $('gsfire').onclick = () => { fire = 6; };
    $('gssys').onclick = e => { sysOn = !sysOn; e.target.textContent = sysOn ? '🛡️ النظام: يعمل' : '⛔ النظام: مطفأ'; };
    $('gssnd').onclick = e => { sound = !sound; e.target.textContent = sound ? '🔊 الصوت' : '🔇 الصوت'; };
    const lines = sl.querySelectorAll('.gsright .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; warm = Math.max(0, warm - dt);
      const leak = valve ? +$('gsl').value : 0;
      ppm = clamp(ppm + (leak * 28 - (exhaust ? 90 : 0) - win / 90 * 40 - (ppm - 120) * 0.05) * dt * 3, 100, 1000);
      fire = Math.max(0, fire - dt);
      const read = warm > 0 ? 0 : Math.round(ppm + (Math.random() - .5) * 20);
      let state = 'safe';
      if (sysOn && warm <= 0) { if (read > 400) state = 'warn'; if (read > 600) { state = 'danger'; valve = false; exhaust = true; win = 90; } else if (read < 300) { exhaust = false; win = Math.max(0, win - dt * 30); } }
      if (!sysOn) { exhaust = false; win = 0; valve = true; }
      if (fire > 0 && sysOn) state = 'fire';
      if (sound) { bt -= dt; if ((state === 'danger' || state === 'fire') && bt <= 0) { beep(state === 'fire' ? 2000 : 1500, 160, .05); bt = .35; } else if (state === 'warn' && bt <= 0) { beep(1200, 80, .03); bt = 1; } }
      buf.push(ppm); while (buf.length > 160) buf.shift(); pl.setAttribute('points', buf.map((v, i) => `${i / 159 * 600},${Y(v)}`).join(' '));
      $('gsv').textContent = warm > 0 ? `تسخين ${AR(Math.ceil(warm))}` : AR(read);
      const S = { safe: ['آمن ✅', ''], warn: ['تحذير ⚠️', 'warn'], danger: ['خطر! 🚨', 'on'], fire: ['حريق! 🔥', 'on'] }[state];
      $('gss').textContent = S[0]; $('gss').className = S[1]; $('gsvl').textContent = valve ? 'مفتوح' : 'مغلق 🔒';
      $('kgas').setAttribute('opacity', clamp((ppm - 150) / 1400, 0, .5)); $('kflame').setAttribute('opacity', fire > 0 ? 1 : 0); $('kvalvel').setAttribute('fill', valve ? '#ffd54f' : '#e74c3c');
      $('kknob').setAttribute('transform', `rotate(${+$('gsl').value * 18})`); $('kwin').style.transform = `rotate(${-win * .6}deg)`;
      $('kfan').setAttribute('transform', `rotate(${exhaust ? (ts / 1.2) % 360 : 0})`); $('kalarm').classList.toggle('on', state === 'danger' || state === 'fire');
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 1 || (state !== 'safe' && n === 2) || (state === 'danger' && [3, 4, 5, 6].includes(n)) || (state === 'fire' && n === 8)); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- الطاقة الشمسية ---------------- */
  solarlab(sl) {
    const $ = id => sl.querySelector('#' + id), b1 = [], b2 = [];
    let h = 6, bat = 60, smart = true, last = 0, raf = 0, acc = 0, cut = 0;
    $('slmode').onclick = e => { smart = !smart; e.target.textContent = smart ? '🧠 الإدارة الذكية: تعمل' : '🤷 بلا إدارة: كل شيء يعمل'; e.target.classList.toggle('off', !smart); };
    const lines = sl.querySelectorAll('.slright .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; acc += dt * $('slsp').value;
      let on = [];
      while (acc > 0.05) { acc -= 0.05; h = (h + 0.05) % 24;
        const S = clamp(Math.sin((h - 6) / 12 * Math.PI), 0, 1), solar = 400 * S, hot = h > 11 && h < 18;
        const want = [true, h > 18 || h < 6.5, h > 5 && h < 7, h > 11 && h < 23];
        on = smart ? [true, want[1] && bat > 15, want[2] && bat > 40, want[3] && bat > 60 && solar > 100] : want;
        const use = LOADS.reduce((a, l, k) => a + (on[k] ? l[2] : 0), 0);
        bat = clamp(bat + (solar - use) * 0.05 / 1000 * 100 * 0.6, 0, 100);
        if (bat <= 0) on = on.map(() => false);
        cut = bat <= 0 ? 1 : 0;
        b1.push(bat); b2.push(solar / 4); while (b1.length > 200) { b1.shift(); b2.shift(); }
        sl._sol = [solar, use, on];
      }
      const [solar, use, onx] = sl._sol || [0, 0, []]; on = onx;
      const S = clamp(Math.sin((h - 6) / 12 * Math.PI), 0, 1);
      $('slsky').setAttribute('fill', S > 0 ? `hsl(200,70%,${55 + S * 30}%)` : '#1b2850');
      const a = (h - 6) / 12 * Math.PI; $('slsun').setAttribute('cx', 320 - Math.cos(a) * 280); $('slsun').setAttribute('cy', 300 - Math.sin(a) * 260); $('slsun').setAttribute('opacity', S > 0 ? 1 : 0);
      $('slbat').setAttribute('y', 10 + (1 - bat / 100) * 100); $('slbat').setAttribute('height', bat); $('slbat').setAttribute('fill', bat < 20 ? '#e74c3c' : bat < 50 ? '#e0b400' : '#2e9e6b');
      $('slf1').classList.toggle('on', solar > 5); $('slf2').classList.toggle('on', use > 0);
      LOADS.forEach((_, k) => $('sll' + k).classList.toggle('on', !!on[k]));
      $('slclk').textContent = hhmm(h); $('slin').textContent = f0(solar) + ' واط'; $('slout').textContent = f0(use) + ' واط'; $('slbv').textContent = f0(bat) + '٪';
      const m = $('slmsg'); m.className = 'sowarn ' + (cut ? 'bad' : smart ? 'ok' : '');
      m.textContent = cut ? '⛔ نفدت البطارية! انطفأت الثلاجة نفسها… الطعام في خطر' : smart ? (bat < 40 ? '🧠 البطارية منخفضة: أُوقف المكيف والمضخة، والثلاجة والإضاءة تعمل' : '🧠 كل جهاز يعمل حسب أولويته ومستوى البطارية') : '🤷 كل شيء يعمل متى أراد… راقب البطارية ليلًا';
      $('slp1').setAttribute('points', b1.map((v, i) => `${i / 199 * 600},${160 - v * 1.5}`).join(' ')); $('slp2').setAttribute('points', b2.map((v, i) => `${i / 199 * 600},${160 - v * 1.5}`).join(' '));
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', smart && (n === 1 || (n === 2) || (n === 3 && on[1]) || (n === 4 && on[2]) || (n === 5 && on[3]))); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- المنزل الكامل ---------------- */
  homelab(sl) {
    const $ = id => sl.querySelector('#' + id);
    let mode = 'home', notes = [];
    const LBL = { lights: ['💡 الإضاءة', { auto: 'آلية', off: 'مطفأة', night: 'ليلية خافتة', on: 'كلها مضاءة' }], ac: ['❄️ التكييف', { auto: 'آلي', off: 'مطفأ', eco: 'اقتصادي ٢٦°', on: 'يعمل ٢٢°' }],
      alarm: ['🚨 الإنذار', { true: 'مفعّل', false: 'غير مفعّل' }], lock: ['🔒 الباب', { true: 'مقفل', false: 'مفتوح' }], curtain: ['🪟 الستائر', { auto: 'آلية', closed: 'مغلقة', open: 'مفتوحة' }] };
    const LN = { home: [6], away: [7], night: [8], guests: [9] };
    const render = (flash) => {
      const st = MODES[mode][2];
      $('hmdev').innerHTML = Object.entries(LBL).map(([k, [n, vals]]) => `<div class="hmd${flash === k ? ' flash' : ''}"><span>${n}</span><b>${vals[String(st[k])]}</b></div>`).join('');
      sl.querySelectorAll('.hmm').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
      runLines(sl, '.hmright', [5, ...LN[mode]]);
      $('hmnote').innerHTML = notes.length ? notes.slice(0, 3).join('') : 'لا إشعارات';
    };
    const notify = (t, cls) => { notes.unshift(`<div class="hmn ${cls}">${t}</div>`); $('hmphone').classList.remove('ping'); void $('hmphone').offsetWidth; $('hmphone').classList.add('ping'); beep(1600, 90); };
    sl.querySelectorAll('.hmm').forEach(b => b.onclick = () => { mode = b.dataset.m; render(); });
    sl.querySelectorAll('[data-e]').forEach(b => b.onclick = () => {
      const st = MODES[mode][2], e = b.dataset.e;
      if (e === 'motion') { if (st.alarm) { notify('🚨 حركة في الصالة والبيت فارغ! (صورة الكاميرا مرفقة)', 'bad'); runLines(sl, '.hmright', [11]); } else { notify('🚶 حركة: أُضيء الضوء آليًا', ''); render('lights'); } }
      if (e === 'gas') { notify('💨 تسرب غاز! أُغلق الصمام وفُتحت النوافذ واتصل النظام بك', 'bad'); runLines(sl, '.hmright', [12]); }
      if (e === 'bell') { notify(st.lock && mode === 'away' ? '🔔 زائر عند الباب وأنت خارج البيت: تحدّث معه من الجوال' : '🔔 جرس الباب: الكاميرا تعرض الزائر على الشاشة', ''); }
      $('hmnote').innerHTML = notes.slice(0, 3).join('');
    });
    render();
  },

  /* ---------------- الجراج ---------------- */
  garagelab(sl) {
    const $ = id => sl.querySelector('#' + id), carsG = $('gcars'), lcd = $('glcd');
    const COLS = ['#e0584a', '#2e9e6b', '#f0cc7a', '#8e44ad', '#16a3b5', '#e67e22', '#5b8fd6', '#c0392b'];
    let cars = [], occ = Array(SPOTS).fill(null), gate = [0, 0], gateT = [0, 0], id = 0, last = 0, raf = 0, auto = false, autoT = 0, waiting = null, msgT = 0;
    const free = () => occ.filter(o => o === null).length;
    const say = (t, cls = '') => { const m = $('ggmsg'); m.textContent = t; m.className = 'sowarn ' + cls; msgT = 4; };
    const lines = sl.querySelectorAll('.ggright .ln'), hl = arr => lines.forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
    const addCar = () => {
      if (waiting) { say('⏳ سيارة تنتظر عند البوابة بالفعل', ''); return; }
      const c = { id: id++, col: COLS[id % COLS.length], x: -60, y: 300, th: 0, path: [], spot: -1, state: 'arrive' };
      c.path = [[40, 300]]; cars.push(c); carsG.insertAdjacentHTML('beforeend', carG(c)); waiting = c;
    };
    const leave = () => {
      const parked = cars.filter(c => c.state === 'parked'); if (!parked.length) { say('لا توجد سيارات لتغادر', ''); return; }
      const c = parked[Math.floor(Math.random() * parked.length)], [sx, sy] = SPOT_XY[c.spot];
      occ[c.spot] = null; c.state = 'toexit'; c.path = [[sx, 280], [GW - 150, 280], [GW - 110, 280]];
    };
    $('ggin').onclick = addCar; $('ggout').onclick = leave;
    $('ggfill').onclick = () => { occ.forEach((o, i) => { if (o === null) { const c = { id: id++, col: COLS[id % COLS.length], x: SPOT_XY[i][0], y: SPOT_XY[i][1] + 55, th: i < 3 ? -Math.PI / 2 : Math.PI / 2, path: [], spot: i, state: 'parked' }; occ[i] = c.id; cars.push(c); carsG.insertAdjacentHTML('beforeend', carG(c)); } }); say('🅿️ امتلأ الجراج! جرّب إرسال سيارة جديدة', 'bad'); };
    $('ggauto').onclick = e => { auto = !auto; e.target.textContent = auto ? '⏸ إيقاف الحركة' : '▶ حركة تلقائية'; };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; msgT -= dt;
      if (auto) { autoT -= dt; if (autoT <= 0) { autoT = 1.6 + Math.random() * 1.4; (Math.random() < .55 || !cars.some(c => c.state === 'parked')) ? addCar() : leave(); } }
      /* بوابة الدخول */
      if (waiting && waiting.state === 'arrive' && !waiting.path.length) {
        if (free() > 0) { const s = occ.findIndex(o => o === null); occ[s] = waiting.id; waiting.spot = s; waiting.state = 'enter'; gateT[0] = 2.2; const [sx, sy] = SPOT_XY[s];
          waiting.path = [[150, 300], [sx, 280], [sx, sy + 55]]; say(`✅ أهلًا! البوابة تفتح… الموقف P${s + 1}`, 'ok'); hl([4, 5]); waiting = null; beep(1700, 100); }
        else { if (msgT <= 0) { say('⛔ الجراج ممتلئ: البوابة لا تُفتح. السيارة تنتظر حتى تخرج سيارة', 'bad'); hl([4, 6]); } }
      }
      cars.forEach(c => {
        if (c.state === 'toexit' && c.path.length === 1) gateT[1] = 2.2;
        if (c.path.length) { const [tx, ty] = c.path[0]; const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
          const blocked = (c.state === 'arrive' && false) || (c.state === 'toexit' && c.path.length === 1 && gate[1] < 80);
          if (d < 3) c.path.shift(); else if (!blocked) { const st = Math.min(d, 180 * dt); c.x += dx / d * st; c.y += dy / d * st; c.th = Math.atan2(dy, dx); } }
        else if (c.state === 'enter') { c.state = 'parked'; }
        else if (c.state === 'toexit') { c.state = 'gone'; c.path = [[GW + 80, 280]]; hl([8]); say('👋 مع السلامة! البوابة تفتح، وزاد عدد الأماكن الخالية', 'ok'); }
        else if (c.state === 'gone') { c.state = 'dead'; }
        const el = sl.querySelector('#car' + c.id); if (el) el.setAttribute('transform', `translate(${c.x} ${c.y}) rotate(${c.th * 180 / Math.PI})`);
      });
      cars.filter(c => c.state === 'dead').forEach(c => sl.querySelector('#car' + c.id)?.remove()); cars = cars.filter(c => c.state !== 'dead');
      if (waiting && waiting.state === 'arrive' && waiting.path.length) { /* تتقدم إلى البوابة */ }
      [0, 1].forEach(g => { gateT[g] -= dt; const tgt = gateT[g] > 0 ? 85 : 0; gate[g] += clamp(tgt - gate[g], -200 * dt, 200 * dt);
        $('gate' + g).style.transform = `rotate(${g === 0 ? -gate[g] : gate[g]}deg)`; $('gl' + g).classList.toggle('go', gate[g] > 60); $('gg' + g).textContent = gate[g] > 60 ? 'مفتوحة' : gate[g] > 2 ? 'تتحرك' : 'مغلقة'; });
      occ.forEach((o, i) => { const busy = o !== null; $('sl' + i).classList.toggle('busy', busy); });
      const fr = free(); $('ggfree').textContent = AR(fr); $('ggfree').classList.toggle('on', fr === 0);
      lcdSet(lcd, fr ? 'Welcome! :)' : 'Sorry, FULL!', fr ? `Free spots: ${fr}` : 'Please wait...');
      if (msgT <= 0 && !waiting) { const m = $('ggmsg'); m.className = 'sowarn'; m.textContent = 'كل موقف فيه حساس: أحمر = مشغول، أخضر = خالٍ'; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  /* ---------------- إنترنت الأشياء ---------------- */
  iotlab(sl) {
    const $ = id => sl.querySelector('#' + id), pkt = $('iopkt'), log = $('iolog');
    let pump = false, light = false, locked = false, busy = false, lines = [];
    const dev = () => { $('iodev').textContent = `💧 المضخة: ${pump ? 'تعمل' : 'متوقفة'} · 💡 الضوء: ${light ? 'مضاء' : 'مطفأ'} · 🔒 الباب: ${locked ? 'مقفل' : 'مفتوح'}`; };
    const addLog = t => { lines.unshift(t); log.innerHTML = lines.slice(0, 6).map(x => `<div>${x}</div>`).join(''); };
    const fly = (txt, from, to, cb) => { const t0 = performance.now(), D = 900; pkt.querySelector('text').textContent = txt; pkt.style.opacity = 1;
      const pts = from === 'phone' ? [[94, 190], [160, 110], [260, 110], [316, 170]] : [[316, 170], [260, 110], [160, 110], [94, 190]];
      const step = now => { const k = Math.min(1, (now - t0) / D), seg = Math.min(2, Math.floor(k * 3)), f = k * 3 - seg, [a, b] = [pts[seg], pts[seg + 1]];
        pkt.setAttribute('transform', `translate(${a[0] + (b[0] - a[0]) * f} ${a[1] + (b[1] - a[1]) * f})`); if (k < 1) requestAnimationFrame(step); else { pkt.style.opacity = 0; cb && cb(); } }; requestAnimationFrame(step); };
    const codeLines = sl.querySelectorAll('.iocode .ln'), hl = arr => codeLines.forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
    sl.querySelectorAll('.iobtn').forEach(b => b.onclick = () => {
      if (busy) return; busy = true; const r = b.dataset.r; addLog(`📱 → GET ${r}`); hl([18]);
      fly(`GET ${r}`, 'phone', 'esp', () => {
        let resp = 'ok';
        if (r === '/pump/on') { pump = true; resp = '"pump on"'; hl([7, 8, 9]); setTimeout(() => { pump = false; dev(); }, 5000); }
        if (r === '/light/toggle') { light = !light; resp = `"light ${light ? 'on' : 'off'}"`; }
        if (r === '/door/lock') { locked = true; resp = '"door locked"'; }
        if (r === '/status') { resp = '{"soil":' + (38 + Math.floor(Math.random() * 10)) + ',"free":' + (2 + Math.floor(Math.random() * 3)) + '}'; hl([11, 12]); }
        $('ioled').setAttribute('fill', '#7ee2a8'); setTimeout(() => $('ioled').setAttribute('fill', '#ff3b3b'), 300); dev();
        fly('200 OK', 'esp', 'phone', () => { addLog(`📡 ← 200 ${resp}`); busy = false;
          if (r === '/status') { const j = JSON.parse(resp); $('ios').textContent = AR(j.soil) + '٪'; $('iog').textContent = AR(j.free); }
          b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 600); });
      });
    });
    dev(); addLog('📡 ESP32 متصل · IP 192.168.1.50');
  },
});
})();
