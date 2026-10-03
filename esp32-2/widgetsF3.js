/* =====================================================================
   «ESP32 للمعلمين ٢» · مختبرات الشبكة (الجديد كليًا عن الأردوينو)
   fwifi · fweb · fdash · fnow · fcar
   + مشاهد «الشرح الوافي» الجديدة تُضاف إلى نوع explain من الجزء الأول
   ===================================================================== */
(function () {
const { AR, codeBlock } = window.ARD;
const { clamp, raf, later, run, cap, st, rng, frame, mb, W, ledSvg, setLed, beep } = window.FZ;

/* ---------- حزمة تتحرك على مسار ---------- */
function packet(sl, pathId, label, color, ms, done, back = false) {
  const p = sl.querySelector('#' + pathId), layer = sl.querySelector('#pkl'); if (!p || !layer) return;
  const L = p.getTotalLength(), g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const w = Math.max(60, label.length * 10.5 + 26);
  g.innerHTML = `<rect x="${-w / 2}" y="-17" width="${w}" height="34" rx="10" fill="${color}" stroke="#0b1230" stroke-width="2"/><text y="7" text-anchor="middle" class="fzt" style="font-size:16px;fill:#0b1230">${label}</text>`;
  layer.appendChild(g); const t0 = performance.now(); let id = 0;
  const step = now => { const k = clamp((now - t0) / ms, 0, 1), pt = p.getPointAtLength((back ? 1 - k : k) * L); g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    if (k < 1) id = requestAnimationFrame(step); else { g.remove(); done && done(); } };
  id = requestAnimationFrame(step); window.DECK_CLEANUP.push(() => { cancelAnimationFrame(id); g.remove(); });
}
const phone = (x, y, w, h, inner, url = '') => `<g transform="translate(${x} ${y})" class="fzph"><rect width="${w}" height="${h}" rx="34" fill="#0b0f1f" stroke="#c9cfe6" stroke-width="5"/>
  <rect x="14" y="44" width="${w - 28}" height="${h - 88}" rx="10" fill="#f4f6fb"/>${url ? `<rect x="24" y="54" width="${w - 48}" height="34" rx="17" fill="#e1e5ef"/><text x="${w / 2}" y="77" text-anchor="middle" class="fzt" style="font-size:15px;fill:#1b2340" id="purl">${url}</text>` : ''}
  <rect x="${w / 2 - 30}" y="${h - 28}" width="60" height="7" rx="3" fill="#c9cfe6"/>${inner}</g>`;
const router = (x, y, lbl = 'الراوتر', id = 'rt') => `<g transform="translate(${x} ${y})" id="${id}"><rect x="-80" y="-30" width="160" height="60" rx="14" fill="#2e4288" stroke="#8d9bd0" stroke-width="3"/>
  <line x1="-50" y1="-30" x2="-62" y2="-80" stroke="#8d9bd0" stroke-width="6" stroke-linecap="round"/><line x1="50" y1="-30" x2="62" y2="-80" stroke="#8d9bd0" stroke-width="6" stroke-linecap="round"/>
  ${[0, 1, 2, 3].map(i => `<circle cx="${-45 + i * 30}" cy="8" r="6" fill="#46d68c" class="${i % 2 ? 'fzpulse' : ''}"/>`).join('')}<text y="58" text-anchor="middle" class="fza" style="font-size:18px">${lbl}</text></g>`;
const board = (x, y, id, lbl, extra = '') => `<g transform="translate(${x} ${y})" id="${id}"><rect x="-70" y="-90" width="140" height="180" rx="16" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/>
  <rect x="-45" y="-78" width="90" height="34" rx="5" fill="#c9ccd3"/><text y="-55" text-anchor="middle" class="fzt" style="font-size:15px;fill:#1b2340">ESP32</text>${extra}<text y="118" text-anchor="middle" class="fza" style="font-size:18px">${lbl}</text></g>`;
const serialBox = (x, y, w, h, id, title = 'Serial Monitor') => `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="12" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="10" y="22" class="fzt" style="font-size:13px;fill:#8d95b5">${title}</text><text id="${id}" x="10" y="48" class="fzt" style="font-size:15px;fill:#d6dcf5"></text></g>`;
const lines = (el, arr, n = 8, dy = 22) => { el.innerHTML = arr.slice(-n).map((l, i) => `<tspan x="10" dy="${i ? dy : 0}">${l}</tspan>`).join(''); };

const C = {
  wifi: `WiFi.mode(WIFI_STA);
WiFi.begin(ssid, pass);
while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
}
Serial.println(WiFi.localIP());`,
  web: `WebServer server(80);
void handleOn() {
  digitalWrite(led, HIGH);
  server.send(200, "text/html", page());
}
void setup() {
  server.on("/", handleRoot);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.begin();
}
void loop() {
  server.handleClient();
}`,
  dash: `// على الجوال (JavaScript):
setInterval(upd, 2000);   // كل ثانيتين
fetch('/data') → JSON → الأرقام
// على ESP32:
void handleData() {
  String json = "{\\"t\\":" + String(t, 1)
     + ",\\"h\\":" + String(h, 0)
     + ",\\"l\\":" + String(analogRead(ldr)) + "}";
  server.send(200, "application/json", json);
}`,
  now: `uint8_t everyone[] = {0xFF,0xFF,0xFF,0xFF,0xFF,0xFF};
struct Msg { int button; int count; };
// المرسل:
esp_now_send(everyone, (uint8_t*)&msg, sizeof(msg));
// المستقبل:
void onReceive(const esp_now_recv_info_t* info,
               const uint8_t* data, int len) {
  memcpy(&m, data, sizeof(m));
  ring = true;
}`,
  car: `WiFi.softAP("ESP32-Car", "12345678");
server.on("/go", [] { dir = server.arg("d")[0]; });
void loop() {
  server.handleClient();
  if (millis() - last > 60) {
    last = millis();
    float cm = readCm();
    if (dir == 'f' && cm < 20) dir = 's';
    apply(dir);
  }
}`,
};

Object.assign(window.DECK_TYPES, {
  /* ٨) الواي فاي: البحث والاتصال وعنوان IP */
  fwifi: s => frame(s, 'fwifi', '0 0 1000 560', `
      ${router(250, 120, 'School-WiFi · 2.4GHz', 'r1')}${router(560, 90, 'Teachers-5G · 5GHz', 'r2')}${router(830, 150, 'Cafe · مفتوحة', 'r3')}
      <g id="wv1">${[60, 100, 140].map((r, i) => `<circle cx="250" cy="120" r="${r}" fill="none" stroke="#4fc3f7" stroke-width="3" class="ehwave" style="animation-delay:${i * .4}s"/>`).join('')}</g>
      <path id="pw1" d="M250 160 C 250 300, 200 330, 170 400" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="8 8" opacity=".4"/>
      ${board(170, 430, 'eb', 'ESP32 · <tspan id="eip">بلا عنوان</tspan>', `<text y="10" text-anchor="middle" font-size="40" id="eic">📶</text>`)}
      ${serialBox(420, 300, 560, 240, 'wser')}<g id="pkl"></g>
      <text id="wst" x="700" y="290" text-anchor="middle" class="fzt" style="font-size:18px;fill:#ffcf4a"></text>`,
    `<div class="fzrow"><button class="fzb on" data-a="scan">🔍 scanNetworks()</button></div>
    <div class="fzrow"><label>الشبكة</label><button class="fzb on" data-n="0">School-WiFi</button><button class="fzb" data-n="1">Teachers-5G</button></div>
    <div class="fzrow"><label>كلمة المرور</label><button class="fzb on" data-p="1">✓ صحيحة</button><button class="fzb warn" data-p="0">✗ خاطئة</button><button class="fzb go" data-a="go">🔗 اتصل</button></div>
    ${rng('wd', '📏 البعد عن الراوتر', 1, 60, 8)}
    <div class="fzstats">${st('wrs', 'RSSI dBm')}${st('wss', 'status')}${st('wipv', 'IP')}</div>${codeBlock(C.wifi)}<div class="fzcap"></div>`),

  /* ٩) خادم الويب: الجوال يطلب… ESP32 يجيب */
  fweb: s => frame(s, 'fweb', '0 0 1000 560', `
      ${phone(30, 40, 270, 480, `<text x="135" y="140" text-anchor="middle" class="fza" style="font-size:24px;fill:#1b2340">💡 ليد الفصل</text>
        <text x="135" y="185" text-anchor="middle" class="fza" style="font-size:19px;fill:#1b2340" id="wsta">الحالة: مطفأ</text>
        <g class="fzphb" data-u="/on"><rect x="40" y="215" width="190" height="70" rx="16" fill="#2ecc71"/><text x="135" y="260" text-anchor="middle" class="fza" style="font-size:24px;fill:#fff">أشعل</text></g>
        <g class="fzphb" data-u="/off"><rect x="40" y="305" width="190" height="70" rx="16" fill="#e74c3c"/><text x="135" y="350" text-anchor="middle" class="fza" style="font-size:24px;fill:#fff">أطفئ</text></g>
        <text x="135" y="415" text-anchor="middle" class="fzt" style="font-size:13px;fill:#5e6782" id="wload"></text>`, 'http://192.168.1.50/')}
      ${router(500, 120, 'الراوتر')}
      ${board(830, 300, 'wb', 'الخادم · 192.168.1.50', `${ledSvg('wled', 0, 20, '#ffcf4a', 24)}`)}
      <path id="p1" d="M300 200 C 380 200, 420 150, 420 135" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="8 8" opacity=".5"/>
      <path id="p2" d="M580 135 C 700 135, 830 160, 830 210" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="8 8" opacity=".5"/>
      <path id="pall" d="M300 200 C 380 200, 420 150, 440 140 L 560 140 C 700 140, 830 160, 830 210" fill="none" stroke="none"/>
      <g id="pkl"></g>
      <g transform="translate(340 330)"><rect width="390" height="200" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="10" y="24" class="fzt" style="font-size:13px;fill:#8d95b5">سجل HTTP</text><text id="wlog" x="10" y="52" class="fzt" style="font-size:15px;fill:#d6dcf5"></text></g>`,
    `<div class="fzrow"><label>🌐 اكتب في الشريط</label><button class="fzb" data-u="/">/</button><button class="fzb go" data-u="/on">/on</button><button class="fzb" data-u="/off">/off</button><button class="fzb warn" data-u="/abc">/abc</button></div>
    <div class="fzstats">${st('wreq', 'الطلب', '—')}${st('wcode', 'الرد', '—')}${st('wms', 'الزمن', '—')}</div>${codeBlock(C.web)}<div class="fzcap"></div>`),

  /* ١٠) لوحة التحكم: JSON كل ثانيتين + تحكم عكسي */
  fdash: s => frame(s, 'fdash', '0 0 1000 560', `
      ${phone(30, 20, 300, 520, `<text x="150" y="122" text-anchor="middle" class="fza" style="font-size:22px;fill:#1b2340">📡 فصلي الذكي</text>
        ${[['🌡️', 'dpt', 150], ['💧', 'dph', 215], ['☀️', 'dpl', 280]].map(([e, id, y]) => `<rect x="30" y="${y - 10}" width="240" height="56" rx="12" fill="#101b45"/><text x="250" y="${y + 28}" text-anchor="end" font-size="26">${e}</text><text id="${id}" x="50" y="${y + 29}" class="fzt" style="font-size:24px;fill:#f0cc7a">--</text>`).join('')}
        <g class="fzphb" id="dpb"><rect x="30" y="345" width="240" height="56" rx="12" fill="#5b6383" id="dpbr"/><text x="150" y="381" text-anchor="middle" class="fza" style="font-size:20px;fill:#fff" id="dpbt">💡 الليد: مطفأ</text></g>
        <text x="150" y="432" text-anchor="middle" class="fza" style="font-size:17px;fill:#1b2340">🦾 السيرفو <tspan id="dpa">90</tspan>°</text>
        <rect x="40" y="446" width="220" height="10" rx="5" fill="#c9cfe6"/><circle id="dpk" cx="150" cy="451" r="15" fill="#2b6fc0" style="cursor:grab"/>`)}
      ${router(500, 90, 'الراوتر')}
      <path id="q1" d="M330 200 C 420 200, 440 120, 500 120 C 620 120, 680 230, 720 260" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="8 8" opacity=".45"/>
      ${board(790, 300, 'db', 'ESP32 · 192.168.1.50', `${ledSvg('dled', -30, 20, '#ffcf4a', 18)}<g transform="translate(35 30)"><circle r="20" fill="#2b6fc0"/><rect id="dsv" x="-4" y="-34" width="8" height="34" rx="4" fill="#f2f4f8"/></g>`)}
      <g transform="translate(380 330)"><rect width="300" height="200" rx="14" fill="#0b1230" stroke="#2b3566" stroke-width="3"/><text x="10" y="24" class="fzt" style="font-size:13px;fill:#8d95b5">آخر رد JSON</text><text id="djson" x="10" y="56" class="fzt" style="font-size:15px;fill:#46d68c"></text></g>
      <g id="pkl"></g>`,
    `${rng('xt', '🌡️ حرارة الفصل', 15, 42, 26, .5)}${rng('xl', '☀️ ضوء الفصل', 0, 4095, 2300, 5)}${rng('xa', '🦾 منزلق الجوال', 0, 180, 90)}
    <div class="fzrow"><button class="fzb on" data-a="auto">🔄 التحديث كل ثانيتين: يعمل</button><button class="fzb" data-a="led">💡 زر الجوال</button></div>${codeBlock(C.dash)}<div class="fzcap"></div>`),

  /* ١١) ESP-NOW: لوحة تكلّم لوحة بلا راوتر */
  fnow: s => frame(s, 'fnow', '0 0 1000 560', `
      <rect width="1000" height="560" fill="#13213a"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 173) % 1000}" cy="${(i * 89) % 560}" r="2" fill="#2e5a3a"/>`).join('')}
      <g transform="translate(500 70)" opacity=".55"><text text-anchor="middle" font-size="44">📶</text><line x1="-34" y1="-34" x2="34" y2="10" stroke="#ff5a5a" stroke-width="7"/><text y="40" text-anchor="middle" class="fza" style="font-size:16px">لا راوتر!</text></g>
      ${board(130, 300, 'na', 'A · المرسل', `<g class="fzphb" id="nbtn"><rect x="-32" y="0" width="64" height="50" rx="8" fill="#39415f"/><circle cx="0" cy="22" r="18" fill="#e74c3c"/></g>`)}
      <text x="130" y="455" text-anchor="middle" class="fzt" style="font-size:14px;fill:#8d95b5">24:6F:28:AA:01:0A</text>
      ${board(560, 250, 'nb', 'B · غرفة المعلم', `${ledSvg('nlb', 0, 20, '#ffcf4a', 22)}`)}<text x="560" y="405" text-anchor="middle" class="fzt" style="font-size:14px;fill:#8d95b5">24:6F:28:BB:02:0B</text>
      <g id="ncg">${board(860, 330, 'nc', 'C · <tspan id="ncd">40</tspan> م', `${ledSvg('nlc', 0, 20, '#ffcf4a', 22)}`)}<text x="860" y="485" text-anchor="middle" class="fzt" style="font-size:14px;fill:#8d95b5">24:6F:28:CC:03:0C</text></g>
      <path id="nab" d="M200 290 C 330 230, 420 220, 490 240" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="8 8" opacity=".5"/>
      <path id="nac" d="M200 320 C 450 380, 650 400, 790 340" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="8 8" opacity=".5" />
      <g id="pkl"></g><text id="nx" x="700" y="380" text-anchor="middle" font-size="50" opacity="0">✖</text>`,
    `<div class="fzrow"><button class="fzb go" data-a="send">🔴 اضغط زر المرسل</button></div>
    <div class="fzrow"><label>إلى من؟</label><button class="fzb on" data-m="all">📢 الجميع (بث)</button><button class="fzb" data-m="b">🎯 B فقط (MAC)</button></div>
    ${rng('nd', '📏 بعد C (متر)', 10, 300, 40, 5)}
    <div class="fzstats">${st('ncnt', 'count', 0)}${st('nlat', 'الزمن')}${st('nok', 'وصلت')}</div>${codeBlock(C.now)}<div class="fzcap"></div>`),

  /* ١٢) السيارة تُقاد من الجوال وتحمي نفسها */
  fcar: s => frame(s, 'fcar', '0 0 1000 560', `
      <rect x="20" y="20" width="960" height="520" rx="18" fill="#1b2340" stroke="#5b6383" stroke-width="6"/>
      ${[[300, 120, 120, 90], [620, 330, 150, 110], [780, 90, 90, 90], [180, 380, 90, 120]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#8a6a3e" stroke="#5c4424" stroke-width="4" class="cob"/>`).join('')}
      <path id="cbeam" fill="#4fc3f7" opacity=".18"/><line id="cray" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="6 6"/>
      <g id="ccar"><rect x="-34" y="-24" width="68" height="48" rx="12" fill="#e74c3c" stroke="#7a1d14" stroke-width="3"/><rect x="-26" y="-32" width="18" height="10" rx="3" fill="#222"/><rect x="8" y="-32" width="18" height="10" rx="3" fill="#222"/><rect x="-26" y="22" width="18" height="10" rx="3" fill="#222"/><rect x="8" y="22" width="18" height="10" rx="3" fill="#222"/>
        <rect x="30" y="-14" width="12" height="28" rx="3" fill="#2b6fc0"/><text x="-6" y="7" text-anchor="middle" style="font-size:20px">📡</text></g>
      <g transform="translate(860 470)"><rect x="-110" y="-38" width="220" height="70" rx="12" fill="#0b1230" opacity=".9"/><text y="-12" text-anchor="middle" class="fzt" style="font-size:15px;fill:#8d95b5">WiFi: ESP32-Car</text><text y="16" text-anchor="middle" class="fzt" style="font-size:17px;fill:#ffcf4a">192.168.4.1</text></g>
      <text id="cwarn" x="500" y="60" text-anchor="middle" class="fza fzblink" style="font-size:26px;fill:#ff7b6b" opacity="0">⛔ عائق! توقف تلقائي</text>`,
    `<div class="fzrow" style="justify-content:center"><div style="display:grid;grid-template-columns:repeat(3,74px);gap:8px">
      <i></i><button class="fzb" data-d="f" style="font-size:30px">⬆️</button><i></i><button class="fzb" data-d="l" style="font-size:30px">⬅️</button><button class="fzb" data-d="s" style="font-size:30px">⏹️</button><button class="fzb" data-d="r" style="font-size:30px">➡️</button><i></i><button class="fzb" data-d="b" style="font-size:30px">⬇️</button><i></i></div>
      <div style="display:flex;flex-direction:column;gap:8px"><button class="fzb on" data-a="safe">🛡️ الحماية: تعمل</button><span class="rl" style="font-size:16px;font-weight:800;color:var(--muted)">اضغط مطوّلًا على الأسهم</span></div></div>
    <div class="fzstats">${st('cdir', 'dir', 's')}${st('ccm', 'readCm()')}${st('cstop', 'توقف تلقائي', 0)}</div>${codeBlock(C.car)}<div class="fzcap"></div>`),
});

Object.assign(window.DECK_BIND, {
  fwifi(sl) {
    const R = id => sl.querySelector('#' + id), ser = R('wser'); let L = ['WiFi.mode(WIFI_STA)'], net = 0, pw = 1, busy = false, T = [];
    const rssi = () => Math.round(-30 - +R('wd').value * 1.05);
    const say = l => { L.push(l); lines(ser, L, 9, 22); };
    const sel = (attr, v) => sl.querySelectorAll(`[data-${attr}]`).forEach(b => b.classList.toggle('on', b.dataset[attr] == v));
    sl.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { net = +b.dataset.n; sel('n', net); });
    sl.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { pw = +b.dataset.p; sel('p', pw); });
    const upd = () => { const r = rssi(); R('wrs').textContent = r; R('eic').textContent = r > -67 ? '📶' : r > -80 ? '📶' : '📵'; R('eic').style.opacity = r > -67 ? 1 : r > -80 ? .6 : .3; };
    R('wd').oninput = upd; upd();
    sl.querySelector('[data-a=scan]').onclick = () => { if (busy) return; L = ['أبحث عن الشبكات…']; lines(ser, L); run(sl, [1]);
      T.push(later(() => { const r = rssi(); say(` 1) School-WiFi    ${r} dBm  محمية`); say(` 2) Cafe           ${r - 14} dBm  مفتوحة`); say('(Teachers-5G لا تظهر: إنها 5GHz)');
        cap(sl, 'ESP32 يسمع شبكات 2.4GHz فقط. شبكة الـ 5GHz موجودة… لكنها غير مرئية له إطلاقًا: أشهر سبب لـ «لا يتصل» في المدارس', ''); }, 900)); };
    sl.querySelector('[data-a=go]').onclick = () => { if (busy) return; busy = true; T.forEach(clearTimeout); L = []; R('eip').textContent = 'بلا عنوان'; R('wipv').textContent = '—';
      const r = rssi(); say(`WiFi.begin("${net ? 'Teachers-5G' : 'School-WiFi'}")`); run(sl, [1, 2, 3, 4, 5]); let dots = 'أتصل'; R('wss').textContent = 'IDLE';
      const fail = net === 1 ? ['NO_SSID', 'لم يجد الشبكة: ESP32 لا يرى 5GHz. اطلب من الفني تفعيل 2.4GHz أو شبكة خاصة للمعمل'] : !pw ? ['FAILED', 'كلمة المرور خاطئة ← الراوتر رفض الدخول ← WL_CONNECT_FAILED. الحروف الكبيرة والصغيرة مختلفة!'] : r < -85 ? ['LOST', 'الإشارة ضعيفة جدًا (أقل من −٨٥) ← الاتصال ينقطع. قرّب اللوحة أو أضف مقوّي إشارة'] : null;
      for (let i = 1; i <= 6; i++) T.push(later(() => { dots += '.'; L[L.length - (i > 1 ? 1 : 0)] = dots; if (i === 1) L.push(dots); lines(ser, L, 9, 22); }, i * 350));
      T.push(later(() => { busy = false;
        if (fail) { say('✗ ' + fail[0]); R('wss').textContent = fail[0]; cap(sl, fail[1], 'bad'); return; }
        R('wss').textContent = 'DHCP'; cap(sl, 'دخلت الشبكة ✓ والآن تطلب عنوانًا: «أنا جديدة، أعطني رقمًا» (DHCP)', '');
        const seq = [['Discover 🙋', '#4fc3f7', false], ['Offer 192.168.1.50', '#ffcf4a', true], ['Request ✋', '#4fc3f7', false], ['ACK ✓', '#46d68c', true]];
        const go = k => { if (k >= seq.length) { R('eip').textContent = '192.168.1.50'; R('wipv').textContent = '.50'; R('wss').textContent = 'CONNECTED'; say('تم الاتصال ✓'); say('IP: 192.168.1.50'); run(sl, [7]);
            cap(sl, `الراوتر أعطاها العنوان <b>192.168.1.50</b>: مثل رقم بيت في شارع. بهذا الرقم سيصل إليها الجوال في المحور القادم. الإشارة ${r} dBm ${r > -67 ? 'ممتازة' : 'مقبولة'}`, 'ok'); return; }
          packet(sl, 'pw1', seq[k][0], seq[k][1], 700, () => go(k + 1), !seq[k][2]); };
        go(0); }, 2400)); };
    lines(ser, L); cap(sl, 'ابدأ بالبحث عن الشبكات، ثم اختر شبكة وكلمة مرور واضغط «اتصل»', '');
    window.DECK_CLEANUP.push(() => T.forEach(clearTimeout));
  },

  fweb(sl) {
    const R = id => sl.querySelector('#' + id); let busy = false, on = false; const LOG = [];
    const req = u => { if (busy) return; busy = true; const t0 = performance.now(); R('purl').textContent = 'http://192.168.1.50' + u; R('wload').textContent = '⏳ جارٍ التحميل…';
      R('wreq').textContent = 'GET ' + u; R('wcode').textContent = '…'; LOG.push(`→ GET ${u} HTTP/1.1`); lines(R('wlog'), LOG, 7, 22);
      cap(sl, `المتصفح يرسل <b>طلبًا</b> إلى العنوان 192.168.1.50 يطلب المسار <code>${u}</code>… يمر عبر الراوتر`, '');
      run(sl, [13]);
      packet(sl, 'pall', 'GET ' + u, '#4fc3f7', 1100, () => {
        const known = ['/', '/on', '/off'].includes(u);
        if (u === '/on') { on = true; run(sl, [2, 3, 4, 8]); } else if (u === '/off') { on = false; run(sl, [9]); } else if (u === '/') run(sl, [7]); else run(sl, [13]);
        setLed(sl, 'wled', on ? 1 : 0);
        later(() => packet(sl, 'pall', known ? '200 OK + HTML' : '404 Not Found', known ? '#46d68c' : '#ff7b6b', 1100, () => {
          busy = false; const ms = Math.round(performance.now() - t0) / 40 | 0; R('wcode').textContent = known ? '200' : '404'; R('wms').textContent = ms + ' ms'; R('wload').textContent = '';
          R('wsta').textContent = known ? (on ? 'الحالة: مضاء' : 'الحالة: مطفأ') : '404 الصفحة غير موجودة';
          LOG.push(`← ${known ? '200 OK' : '404 Not Found'}`); lines(R('wlog'), LOG, 7, 22);
          cap(sl, known ? `الخادم نفّذ الدالة المسجلة للمسار <code>${u}</code>${u === '/on' ? ' فأشعل الليد' : u === '/off' ? ' فأطفأه' : ''}، ثم <b>ردّ</b> بصفحة HTML جديدة يعرضها الجوال ✓ هذه هي الدورة كلها: طلب ← تنفيذ ← رد` : 'لا توجد دالة مسجلة لـ /abc في <code>server.on</code> ← الخادم يرد 404: «لا أعرف هذا المسار»', known ? 'ok' : 'bad');
        }, true), 250); });
    };
    sl.querySelectorAll('[data-u]').forEach(b => b.onclick = () => req(b.dataset.u));
    cap(sl, 'اضغط «أشعل» على شاشة الجوال، أو اكتب مسارًا في الشريط… وتابع الطلب والرد', '');
  },

  fdash(sl) {
    const R = id => sl.querySelector('#' + id); let auto = true, led = false, acc = 1.6, angle = 90, sv = 90;
    const poll = () => { const t = +R('xt').value, l = +R('xl').value, h = Math.round(60 - (t - 26) * 1.2);
      packet(sl, 'q1', 'GET /data', '#4fc3f7', 600, () => { const js = `{"t":${t.toFixed(1)},"h":${h},"l":${l}}`;
        later(() => packet(sl, 'q1', 'JSON', '#46d68c', 600, () => { R('dpt').textContent = t.toFixed(1) + ' C'; R('dph').textContent = h + ' %'; R('dpl').textContent = l;
          R('djson').innerHTML = `<tspan x="10" dy="0">{</tspan><tspan x="10" dy="26">  "t": ${t.toFixed(1)},</tspan><tspan x="10" dy="26">  "h": ${h},</tspan><tspan x="10" dy="26">  "l": ${l}</tspan><tspan x="10" dy="26">}</tspan>`;
          run(sl, [2, 3, 5, 6, 7, 8, 9]); cap(sl, `الجوال يسأل كل ثانيتين «ما الجديد؟» بـ <code>fetch('/data')</code>، وESP32 يرد بنص JSON صغير ${js.length} حرفًا فقط ← تتحدث الأرقام دون إعادة تحميل الصفحة ✓`, 'ok'); }, true), 120); }); };
    raf(dt => { if (!auto) return; acc += dt; if (acc > 2) { acc = 0; poll(); } angle += (sv - angle) * Math.min(1, dt * 8); R('dsv').setAttribute('transform', `rotate(${angle - 90} 0 0)`); });
    sl.querySelector('[data-a=auto]').onclick = e => { auto = !auto; e.target.classList.toggle('on', auto); e.target.textContent = auto ? '🔄 التحديث كل ثانيتين: يعمل' : '⏸️ التحديث متوقف'; if (!auto) cap(sl, 'بلا تحديث تلقائي تبقى الأرقام قديمة حتى يعيد المستخدم تحميل الصفحة يدويًا', 'bad'); };
    const toggleLed = () => { packet(sl, 'q1', 'GET /led', '#ffcf4a', 600, () => { led = !led; setLed(sl, 'dled', led ? 1 : 0); later(() => packet(sl, 'q1', led ? 'مضاء' : 'مطفأ', '#46d68c', 600, () => {
      R('dpbt').textContent = led ? '💡 الليد: مضاء' : '💡 الليد: مطفأ'; R('dpbr').setAttribute('fill', led ? '#2ecc71' : '#5b6383'); }, true), 100); }); cap(sl, 'الاتجاه المعاكس: الجوال يأمر ← ESP32 ينفّذ ويرد بالحالة الجديدة', ''); };
    R('dpb').onclick = toggleLed; sl.querySelector('[data-a=led]').onclick = toggleLed;
    const setServo = a => { R('dpa').textContent = a; R('dpk').setAttribute('cx', 40 + a / 180 * 220); packet(sl, 'q1', '/servo?a=' + a, '#c48cff', 500, () => { sv = a; }); cap(sl, `المنزلق يرسل <code>/servo?a=${a}</code> ← <code>server.arg("a")</code> تقرأ الرقم ← <code>arm.write(${a})</code>`, 'ok'); };
    let to = 0; R('xa').oninput = e => { clearTimeout(to); const a = +e.target.value; R('dpa').textContent = a; R('dpk').setAttribute('cx', 40 + a / 180 * 220); to = setTimeout(() => setServo(a), 180); };
    window.DECK_CLEANUP.push(() => clearTimeout(to));
  },

  fnow(sl) {
    const R = id => sl.querySelector('#' + id); let mode = 'all', cnt = 0, busy = false;
    sl.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; sl.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); });
    R('nd').oninput = () => { const d = +R('nd').value; R('ncd').textContent = d; R('ncg').setAttribute('transform', `translate(${(d - 40) * .25} 0)`); R('ncg').style.opacity = d > 220 ? .55 : 1; };
    const ring = id => { setLed(sl, id, 1); beep(880, .12, .05); later(() => setLed(sl, id, 0), 700); };
    const send = () => { if (busy) return; busy = true; cnt++; R('ncnt').textContent = cnt; const d = +R('nd').value, cOk = mode === 'all' && d <= 220;
      R('nbtn').querySelector('circle').setAttribute('fill', '#ffcf4a'); later(() => R('nbtn').querySelector('circle').setAttribute('fill', '#e74c3c'), 200);
      run(sl, [4]); let n = 0;
      const fin = () => { if (++n < 2) return; busy = false; R('nlat').textContent = '≈ 2 ms'; R('nok').textContent = mode === 'all' ? (cOk ? 'B + C' : 'B فقط') : 'B';
        run(sl, [6, 7, 8, 9]);
        cap(sl, mode === 'all' ? (cOk ? `البث FF:FF:FF:FF:FF:FF وصل إلى كل اللوحات القريبة مباشرة، بلا راوتر ولا إنترنت، في نحو ٢ مللي ثانية ✓ الرسالة: {button:1, count:${cnt}}` : `C على بعد ${d} متر: خارج المدى (نحو ٢٠٠ متر في الهواء الطلق، وأقل بكثير خلف الجدران) ← لم تصل`) :
          'الإرسال إلى عنوان MAC محدد: B وحدها تستقبل، والبقية لا تعلم بشيء. مثل رسالة خاصة بدل إعلان في الإذاعة المدرسية', mode === 'all' && !cOk ? 'bad' : 'ok'); };
      packet(sl, 'nab', `{1, ${cnt}}`, '#ffcf4a', 500, () => { ring('nlb'); fin(); });
      if (mode === 'all') packet(sl, 'nac', `{1, ${cnt}}`, '#ffcf4a', 500 + d * 2, () => { if (cOk) ring('nlc'); else { R('nx').setAttribute('opacity', 1); later(() => R('nx').setAttribute('opacity', 0), 900); } fin(); }); else fin(); };
    sl.querySelector('[data-a=send]').onclick = send; R('nbtn').onclick = send;
    cap(sl, 'ثلاث لوحات في ساحة المدرسة ولا يوجد أي راوتر. اضغط زر المرسل A', '');
  },

  fcar(sl) {
    const R = id => sl.querySelector('#' + id), obs = [...sl.querySelectorAll('.cob')].map(o => ['x', 'y', 'width', 'height'].map(a => +o.getAttribute(a)));
    let x = 120, y = 150, h = 0, dir = 's', safe = true, stops = 0, warnT = 0;
    const hit = (px, py) => px < 20 || px > 980 || py < 20 || py > 540 || obs.some(([ox, oy, w, hh]) => px > ox && px < ox + w && py > oy && py < oy + hh);
    const ray = () => { for (let d = 0; d < 400; d += 3) { const px = x + Math.cos(h) * (42 + d), py = y + Math.sin(h) * (42 + d); if (hit(px, py)) return d; } return 400; };
    sl.querySelectorAll('[data-d]').forEach(b => { const d = b.dataset.d; b.onpointerdown = () => { dir = d; b.classList.add('on'); }; b.onpointerup = b.onpointerleave = () => { if (d !== 's') dir = 's'; b.classList.remove('on'); }; });
    sl.querySelector('[data-a=safe]').onclick = e => { safe = !safe; e.target.classList.toggle('on', safe); e.target.textContent = safe ? '🛡️ الحماية: تعمل' : '⚠️ الحماية: معطّلة'; };
    raf(dt => { const px = ray(), cm = Math.round(px / 4); let d = dir;
      if (d === 'f' && cm < 20 && safe) { d = 's'; if (warnT <= 0) { stops++; beep(600, .1, .05); } warnT = .8; }
      warnT -= dt; R('cwarn').setAttribute('opacity', warnT > 0 ? 1 : 0);
      const v = 170 * dt;
      if (d === 'f' || d === 'b') { const nx = x + Math.cos(h) * v * (d === 'f' ? 1 : -1), ny = y + Math.sin(h) * v * (d === 'f' ? 1 : -1); if (!hit(nx + Math.cos(h) * 34 * (d === 'f' ? 1 : -1), ny + Math.sin(h) * 34 * (d === 'f' ? 1 : -1))) { x = nx; y = ny; } }
      if (d === 'l') h -= 2.6 * dt; if (d === 'r') h += 2.6 * dt;
      R('ccar').setAttribute('transform', `translate(${x} ${y}) rotate(${h * 180 / Math.PI})`);
      const ex = x + Math.cos(h) * (42 + px), ey = y + Math.sin(h) * (42 + px), sx = x + Math.cos(h) * 42, sy = y + Math.sin(h) * 42, a1 = h - .2, a2 = h + .2;
      R('cray').setAttribute('x1', sx); R('cray').setAttribute('y1', sy); R('cray').setAttribute('x2', ex); R('cray').setAttribute('y2', ey);
      R('cbeam').setAttribute('d', `M${sx} ${sy} L${x + Math.cos(a1) * (42 + px)} ${y + Math.sin(a1) * (42 + px)} L${x + Math.cos(a2) * (42 + px)} ${y + Math.sin(a2) * (42 + px)} Z`);
      R('cbeam').setAttribute('fill', cm < 20 ? '#ff5a5a' : '#4fc3f7');
      R('cdir').textContent = `'${d}'`; R('ccm').textContent = cm >= 100 ? '100+' : cm; R('cstop').textContent = stops;
      run(sl, d !== dir ? [7] : [4, 5, 6, 8]);
      cap(sl, d !== dir ? `الجوال يقول «أمام» لكن الحساس يرى عائقًا على ${cm} سم ← الكود يغيّر dir إلى 's' بنفسه: <b>الأمان قبل الأوامر</b>` :
        !safe && cm < 20 && dir === 'f' ? 'الحماية معطّلة: السيارة تصطدم! لهذا يُكتب فحص المسافة داخل loop لا في الجوال' : dir === 's' ? 'اضغط مطوّلًا على سهم: كل ضغطة ترسل <code>/go?d=f</code> وكل رفع ترسل <code>/go?d=s</code>' : `تتحرك '${dir}' … والحساس يفحص ١٦ مرة في الثانية بـ millis دون أن يوقف الخادم`, d !== dir || (!safe && cm < 20) ? 'bad' : '');
    });
  },
});

/* =====================================================================
   مشاهد «الشرح الوافي» الجديدة (تُضاف إلى explain)
   ===================================================================== */
const S = window.EXPLAIN_SCENES, K = window.EXPLAIN_KIT, svg = K.svg;

S.map = {
  svg: svg(`<text x="380" y="40" text-anchor="middle" class="ezt" style="font-size:19px">map(value, fromLow, fromHigh, toLow, toHigh)</text>
    ${[['0', '4095', 120, '#4fc3f7', 'analogRead'], ['0', '255', 300, '#ffcf4a', 'السطوع']].map(([a, b, y, c, t]) => `<line x1="80" x2="680" y1="${y}" y2="${y}" stroke="${c}" stroke-width="8" stroke-linecap="round"/><text x="80" y="${y + 40}" text-anchor="middle" class="ezt" style="fill:${c}">${a}</text><text x="680" y="${y + 40}" text-anchor="middle" class="ezt" style="fill:${c}">${b}</text><text x="380" y="${y - 22}" text-anchor="middle" class="ezta" style="font-size:18px;fill:${c}">${t}</text>`).join('')}
    <circle id="mpa" cy="120" r="16" fill="#4fc3f7"/><circle id="mpb" cy="300" r="16" fill="#ffcf4a"/><line id="mpl" y1="136" y2="284" stroke="#fff" stroke-width="3" stroke-dasharray="8 6"/>
    <text id="mpt" x="380" y="385" text-anchor="middle" class="ezt" style="font-size:24px;fill:#46d68c"></text>`),
  ctl: `<span class="rl">القيمة</span><input type="range" min="0" max="4095" value="2048"><button data-a="inv">🔄 اعكس (255 إلى 0)</button>`,
  bind(q, cap) { const r = q.$('input'); let inv = false;
    const upd = () => { const v = +r.value, o = Math.round(inv ? 255 - v * 255 / 4095 : v * 255 / 4095), xa = 80 + v / 4095 * 600, xb = 80 + o / 255 * 600;
      q.$('#mpa').setAttribute('cx', xa); q.$('#mpb').setAttribute('cx', xb); q.$('#mpl').setAttribute('x1', xa); q.$('#mpl').setAttribute('x2', xb);
      q.$('#mpt').textContent = `map(${v}, 0, 4095, ${inv ? '255, 0' : '0, 255'}) = ${o}`;
      cap(inv ? `معكوس: كلما زادت القراءة قلّ الناتج — مفيد مثلًا حين تريد ضوءًا أقوى كلما قلّ ضوء الغرفة` : `${v} من ٤٠٩٥ تقع في المكان نفسه نسبيًا مثل ${o} من ٢٥٥ (${Math.round(v / 40.95)}٪)`, 'ok'); };
    r.oninput = upd; q.btn('inv', () => { inv = !inv; q.$('[data-a=inv]').classList.toggle('on', inv); upd(); }); upd(); },
};

S.divider = {
  svg: svg(`<text x="120" y="40" class="ezt" style="fill:#ffa53a">3.3V</text><path d="M150 55 V90" class="ezw or"/>
    <rect x="125" y="90" width="50" height="100" rx="8" fill="#c48a3a"/><text x="200" y="140" class="ezt" style="font-size:18px">R1</text><text id="dvr1" x="200" y="168" class="ezt" style="font-size:18px;fill:#ffcf4a"></text>
    <path d="M150 190 V215" class="ezw or"/><circle cx="150" cy="222" r="9" fill="#4fc3f7"/><path d="M159 222 H330" class="ezw" style="stroke:#4fc3f7"/><text x="340" y="230" class="ezt" style="fill:#4fc3f7">GPIO</text>
    <path d="M150 230 V255" class="ezw blk"/><rect x="125" y="255" width="50" height="100" rx="8" fill="#d9b26f"/><text x="200" y="305" class="ezt" style="font-size:18px">R2 = 10k</text>
    <path d="M150 355 V380" class="ezw blk"/><text x="120" y="398" class="ezt" style="fill:#8d95b5">GND</text>
    <g transform="translate(560 220)"><rect x="-150" y="-110" width="300" height="220" rx="18" fill="#1c2650"/><text y="-70" text-anchor="middle" class="ezt" style="font-size:18px">Vout = 3.3 × R2 ÷ (R1+R2)</text>
      <text id="dvo" y="10" text-anchor="middle" class="ezt" style="font-size:52px;fill:#ffcf4a"></text><text id="dvraw" y="70" text-anchor="middle" class="ezt" style="font-size:22px;fill:#46d68c"></text></g>`),
  ctl: `<span class="rl">R1 (LDR)</span><input type="range" min="0" max="100" value="50"><span class="rl" id="dvl"></span>`,
  bind(q, cap) { const r = q.$('input');
    const upd = () => { const R1 = Math.round(1000 * Math.pow(200, r.value / 100)), vo = 3.3 * 10000 / (R1 + 10000);
      q.$('#dvr1').textContent = R1 >= 1000 ? (R1 / 1000).toFixed(1) + 'kΩ' : R1 + 'Ω'; q.$('#dvo').textContent = vo.toFixed(2) + ' V'; q.$('#dvraw').textContent = 'analogRead ≈ ' + Math.round(vo / 3.3 * 4095);
      q.$('#dvl').textContent = r.value < 35 ? '☀️ ضوء' : r.value > 65 ? '🌙 ظلام' : '⛅'; cap(`R1 = ${q.$('#dvr1').textContent}: ${R1 < 10000 ? 'R1 أصغر من R2 فيحصل GPIO على أكثر من نصف الجهد' : 'R1 أكبر من R2 فيأخذ R1 معظم الجهد ويبقى للـ GPIO أقل من النصف'}`, ''); };
    r.oninput = upd; upd(); },
};

S.library = {
  svg: svg(`<g transform="translate(40 40)"><rect width="320" height="320" rx="16" fill="#1c2650"/><text x="160" y="34" text-anchor="middle" class="ezta" style="font-size:19px">بلا مكتبة</text>
      <text id="lbn" x="16" y="70" class="ezmono" style="fill:#8d95b5;font-size:13px"></text></g>
    <g transform="translate(400 40)"><rect width="320" height="320" rx="16" fill="#1c2650"/><text x="160" y="34" text-anchor="middle" class="ezta" style="font-size:19px">مع مكتبة DHT</text>
      <text x="16" y="80" class="ezmono" style="fill:#ffcf4a;font-size:16px">#include &lt;DHT.h&gt;</text><text x="16" y="110" class="ezmono" style="fill:#d6dcf5;font-size:16px">DHT dht(4, DHT22);</text><text x="16" y="140" class="ezmono" style="fill:#d6dcf5;font-size:16px">dht.begin();</text><text x="16" y="170" class="ezmono" style="fill:#46d68c;font-size:16px">dht.readTemperature();</text>
      <g id="lbook" opacity=".25"><text x="160" y="250" text-anchor="middle" font-size="64">📚</text><text x="160" y="300" text-anchor="middle" class="ezta" style="font-size:16px" id="lbt">غير مثبتة</text></g></g>
    <text id="lbc" x="380" y="390" text-anchor="middle" class="ezt" style="font-size:20px"></text>`),
  ctl: `<button data-a="ins" class="on">📥 ثبّت من Library Manager</button><button data-a="rm" class="warn">🗑️ بلا تثبيت</button>`,
  bind(q, cap) {
    q.$('#lbn').innerHTML = ['pinMode(4, OUTPUT); digitalWrite(4, LOW);', 'delay(18); digitalWrite(4, HIGH);', 'delayMicroseconds(40); pinMode(4, INPUT);', 'while (digitalRead(4) == LOW);', 'while (digitalRead(4) == HIGH);', 'for (int i = 0; i < 40; i++) {', '  while (digitalRead(4) == LOW);', '  unsigned long t = micros();', '  while (digitalRead(4) == HIGH);', '  if (micros() - t > 40) bits |= …', '}', '// + التحقق من المجموع + التحويل…', '// ≈ ١٢٠ سطرًا دقيقًا بالميكروثانية'].map((l, i) => `<tspan x="16" dy="${i ? 18 : 0}">${l}</tspan>`).join('');
    const set = ok => { q.on(ok ? 'ins' : 'rm'); q.$('#lbook').setAttribute('opacity', ok ? 1 : .25); q.$('#lbt').textContent = ok ? 'DHT sensor library ✓' : 'غير مثبتة';
      q.$('#lbc').textContent = ok ? 'Done compiling ✓' : "fatal error: DHT.h: No such file or directory"; q.$('#lbc').style.fill = ok ? '#46d68c' : '#ff7b6b';
      cap(ok ? 'المكتبة كتبها خبراء وجرّبها الآلاف: ثلاثة أسطر بدل ١٢٠. تُثبَّت مرة واحدة على الحاسوب' : 'السطر #include يبحث عن المكتبة ولا يجدها ← خطأ ترجمة. الحل: Tools ← Manage Libraries ← ابحث عن DHT ← Install', ok ? 'ok' : 'bad'); };
    q.btn('ins', () => set(true)); q.btn('rm', () => set(false)); set(true); },
};

S.relay = {
  svg: svg(`${K.CHIP(30, 120, 160, 150)}<path d="M202 195 H270" class="ezw" id="rlw"/><text x="236" y="180" text-anchor="middle" class="ezt" style="font-size:15px">19</text>
    <g transform="translate(270 120)"><rect width="190" height="150" rx="14" fill="#2b6fc0"/><rect x="20" y="30" width="70" height="90" rx="8" fill="#1d4f8f"/><path d="M30 50 h50 M30 65 h50 M30 80 h50 M30 95 h50" stroke="#c48a3a" stroke-width="5"/>
      <g id="rlarm"><line x1="110" y1="110" x2="170" y2="50" stroke="#c9cfe6" stroke-width="8" stroke-linecap="round"/></g><circle cx="110" cy="110" r="8" fill="#c9cfe6"/><circle cx="170" cy="40" r="7" fill="#ffcf4a"/>
      <text x="95" y="145" text-anchor="middle" class="ezt" style="font-size:15px">Relay</text></g>
    <path d="M460 160 H560" class="ezw red" id="rl2"/><g transform="translate(620 200)"><circle r="60" fill="#141d3d" stroke="#8d9bd0" stroke-width="4"/><g id="rlfan" class="fzspin">${[0, 120, 240].map(a => `<ellipse rx="16" ry="48" fill="#4fc3f7" transform="rotate(${a}) translate(0 -26)"/>`).join('')}</g></g>
    <text x="620" y="300" text-anchor="middle" class="ezta" style="font-size:18px">مروحة ٢٢٠ فولت</text><text x="110" y="320" text-anchor="middle" class="ezta" style="font-size:18px">٣٫٣ فولت ضعيفة</text>
    <text x="510" y="140" text-anchor="middle" class="ezt" style="font-size:14px;fill:#ff7b6b">⚡ 220V</text><text id="rlclick" x="365" y="100" text-anchor="middle" class="ezt" style="font-size:22px;fill:#ffcf4a"></text>`),
  ctl: `<button data-a="on">digitalWrite(19, HIGH)</button><button data-a="off" class="on">digitalWrite(19, LOW)</button>`,
  bind(q, cap) { let on = false, a = 0, id = 0;
    const set = v => { on = v; q.on(v ? 'on' : 'off'); q.$('#rlw').classList.toggle('hot', v); q.$('#rl2').style.opacity = v ? 1 : .3; q.$('#rlarm').setAttribute('transform', v ? 'rotate(-16 110 110)' : ''); q.$('#rlclick').textContent = v ? 'تِك!' : '';
      cap(v ? 'تيار صغير من ESP32 يمر في ملف المُرحِّل فيصير مغناطيسًا يسحب المفتاح ← دائرة الـ ٢٢٠ فولت تُغلق ← المروحة تعمل. الدائرتان منفصلتان تمامًا ✓' : 'لا تيار في الملف ← المفتاح مفتوح ← المروحة متوقفة', v ? 'ok' : ''); };
    const loop = () => { a += on ? 14 : 0; q.$('#rlfan').setAttribute('transform', `rotate(${a})`); id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); q.clean(() => cancelAnimationFrame(id));
    q.btn('on', () => set(true)); q.btn('off', () => set(false)); set(false); },
};

S.echodiv = {
  svg: svg(`<g transform="translate(70 70)"><rect width="140" height="200" rx="12" fill="#2b6fc0"/><text x="70" y="100" text-anchor="middle" class="ezt" style="font-size:18px">HC-SR04</text><text x="70" y="130" text-anchor="middle" class="ezt" style="font-size:15px;fill:#ffcf4a">يعمل على 5V</text></g>
    <path d="M210 170 H300" class="ezw red"/><text x="255" y="155" text-anchor="middle" class="ezt" style="font-size:15px;fill:#ff7b6b">Echo 5V</text>
    <g id="edv"><rect x="300" y="155" width="70" height="30" rx="5" fill="#d9b26f"/><text x="335" y="148" text-anchor="middle" class="ezt" style="font-size:15px">1k</text>
      <path d="M370 170 H440" class="ezw" style="stroke:#46d68c"/><circle cx="440" cy="170" r="8" fill="#46d68c"/><path d="M440 178 V230" class="ezw blk"/><rect x="425" y="230" width="30" height="70" rx="5" fill="#d9b26f"/><text x="470" y="270" class="ezt" style="font-size:15px">2k</text><path d="M440 300 V340" class="ezw blk"/><text x="440" y="362" text-anchor="middle" class="ezt" style="fill:#8d95b5;font-size:15px">GND</text></g>
    <path id="edd" d="M300 170 H440" class="ezw red ezhide"/><path d="M448 170 H560" class="ezw" id="edw"/>
    ${K.CHIP(560, 90, 170, 160)}<text x="645" y="290" text-anchor="middle" class="ezt" style="font-size:16px">GPIO27 (حد ٣٫٦V)</text>
    <text id="edv2" x="500" y="140" text-anchor="middle" class="ezt" style="font-size:26px;fill:#46d68c">3.33V</text><text id="edfire" x="645" y="80" text-anchor="middle" font-size="44" opacity="0">🔥</text>`),
  ctl: `<button data-a="with" class="on">✅ مع المقسم</button><button data-a="without" class="warn">⚠️ بلا مقسم</button>`,
  bind(q, cap) { const set = w => { q.on(w ? 'with' : 'without'); q.$('#edv').classList.toggle('ezhide', !w); q.$('#edd').classList.toggle('ezhide', w); q.$('#edw').setAttribute('class', 'ezw ' + (w ? '' : 'red'));
      q.$('#edv2').textContent = w ? '3.33V' : '5.00V'; q.$('#edv2').style.fill = w ? '#46d68c' : '#ff5a5a'; q.$('#edfire').setAttribute('opacity', w ? 0 : 1);
      cap(w ? '5 × 2k ÷ (1k + 2k) = ٣٫٣٣ فولت ✓ تكفي لتقرأها ESP32 HIGH، وآمنة على الطرف' : '٥ فولت على طرف حدّه ٣٫٦: قد يعمل أيامًا ثم يتلف الطرف أو الشريحة. لا تراهن على الحظ', w ? 'ok' : 'bad'); };
    q.btn('with', () => set(true)); q.btn('without', () => set(false)); set(true); },
};

S.pulsein = {
  svg: svg(`<text x="40" y="50" class="ezt" style="fill:#ffcf4a">Trig</text><path id="pit" fill="none" stroke="#ffcf4a" stroke-width="4"/>
    <text x="40" y="200" class="ezt" style="fill:#4fc3f7">Echo</text><path id="pie" fill="none" stroke="#4fc3f7" stroke-width="4"/>
    <rect id="pis" y="160" height="80" fill="#46d68c" opacity=".2"/><text id="pil" y="275" text-anchor="middle" class="ezt" style="font-size:22px;fill:#46d68c"></text>
    <text x="380" y="350" text-anchor="middle" class="ezt" style="font-size:22px" id="pif"></text><text x="380" y="385" text-anchor="middle" class="ezta" style="font-size:18px">⏱️ ساعة إيقاف تبدأ مع HIGH وتتوقف مع LOW</text>`),
  ctl: `<span class="rl">البعد</span><input type="range" min="5" max="150" value="40"><span class="rl" id="pid"></span>`,
  bind(q, cap) { const r = q.$('input');
    const upd = () => { const cm = +r.value, us = Math.round(cm * 2 / .0343), w = us / 9000 * 560, x0 = 150;
      q.$('#pit').setAttribute('d', `M100 100 H120 V60 H130 V100 H720`); q.$('#pie').setAttribute('d', `M100 230 H${x0} V170 H${x0 + w} V230 H720`);
      q.$('#pis').setAttribute('x', x0); q.$('#pis').setAttribute('width', w); q.$('#pil').setAttribute('x', x0 + w / 2); q.$('#pil').textContent = us + ' µs';
      q.$('#pif').textContent = `${us} × 0.0343 ÷ 2 = ${cm} cm`; q.$('#pid').textContent = cm + ' سم';
      cap(`<code>pulseIn(echo, HIGH)</code> تنتظر أن يصير Echo عاليًا، ثم تعدّ الميكروثانيات حتى ينخفض: ${us} ميكروثانية = زمن ذهاب الصوت وعودته`, 'ok'); };
    r.oninput = upd; upd(); },
};

S.router = {
  svg: svg(`<g transform="translate(380 90)"><rect x="-90" y="-36" width="180" height="72" rx="16" fill="#2e4288" stroke="#8d9bd0" stroke-width="3"/><text y="8" text-anchor="middle" class="ezta" style="font-size:20px">الراوتر</text></g>
    ${[['💻', 110, 300, '192.168.1.10'], ['📱', 300, 330, '192.168.1.23'], ['📡', 470, 330, '192.168.1.50'], ['🖨️', 650, 300, '192.168.1.80']].map(([e, x, y, ip], i) => `<path d="M380 126 L ${x} ${y - 40}" class="ezw" stroke-dasharray="8 8" id="rtl${i}"/><g transform="translate(${x} ${y})"><circle r="40" fill="#1c2650" stroke="#4fc3f7" stroke-width="3"/><text y="14" text-anchor="middle" font-size="38">${e}</text><text y="66" text-anchor="middle" class="ezt" style="font-size:15px;fill:#ffcf4a" class="rip">${ip}</text></g>`).join('')}
    <g transform="translate(380 18)"><text text-anchor="middle" font-size="26">🌍</text></g><path d="M380 30 V54" class="ezw" stroke-dasharray="4 4"/>`),
  ctl: `<button data-a="ok" class="on">🏠 الشبكة المحلية</button><button data-a="net">🌍 الإنترنت</button>`,
  bind(q, cap) { const set = n => { q.on(n ? 'net' : 'ok'); cap(n ? 'الراوتر هو «بوابة» الشبكة المحلية إلى الإنترنت. في هذه الدورة لا نحتاج الإنترنت أصلًا: الجوال وESP32 يتكلمان داخل الشبكة المحلية فقط' : 'الراوتر مثل <b>مكتب البريد في الحي</b>: كل جهاز متصل به له عنوان، والرسائل بين الأجهزة تمر عبره. ESP32 جهاز مثل الجوال تمامًا', ''); };
    q.btn('ok', () => set(false)); q.btn('net', () => set(true)); set(false); },
};

S.ip = {
  svg: svg(`<text x="380" y="80" text-anchor="middle" style="font:700 64px var(--mono)"><tspan fill="#4fc3f7">192.168.1</tspan><tspan fill="#fff">.</tspan><tspan fill="#ffcf4a" id="ipl">50</tspan></text>
    <text x="250" y="130" text-anchor="middle" class="ezta" style="font-size:20px;fill:#4fc3f7">رقم الشبكة (الحي)</text><text x="560" y="130" text-anchor="middle" class="ezta" style="font-size:20px;fill:#ffcf4a">رقم الجهاز (البيت)</text>
    ${Array.from({ length: 6 }, (_, i) => `<g transform="translate(${80 + i * 120} 240)"><path d="M-40 0 L0 -36 L40 0 V50 H-40 Z" fill="${i === 3 ? '#ffcf4a' : '#2e4288'}" id="iph${i}"/><text y="32" text-anchor="middle" class="ezt" style="font-size:18px;fill:${i === 3 ? '#0f1733' : '#fff'}">.${[10, 23, 31, 50, 77, 80][i]}</text></g>`).join('')}
    <text x="380" y="350" text-anchor="middle" class="ezt" style="font-size:22px;fill:#46d68c" id="ipd"></text>`),
  ctl: `<button data-a="dhcp" class="on">🎟️ DHCP: الراوتر يعطيه</button><button data-a="fixed">📌 عنوان ثابت</button><button data-a="other">🏫 شبكة أخرى</button>`,
  bind(q, cap) { const set = m => { q.on(m); q.$('#ipl').textContent = m === 'other' ? '50' : '50';
      q.$('#ipd').textContent = { dhcp: 'Serial.println(WiFi.localIP());', fixed: 'WiFi.config(IPAddress(192,168,1,50), …);', other: '10.0.0.x  ←  شبكة مختلفة = حي مختلف' }[m];
      cap({ dhcp: 'عنوان IP = رقم بيت ESP32 في الشبكة. الراوتر يعطيه تلقائيًا (DHCP)، وقد يتغير إن أعدت التشغيل غدًا: لذلك نطبعه في الشاشة التسلسلية دائمًا', fixed: 'يمكن تثبيت العنوان في الكود فلا يتغير أبدًا: مفيد لمشروع معلّق في الفصل، لكن تأكد أن الرقم غير مستعمل', other: 'الجوال يجب أن يكون في <b>الحي نفسه</b> (الشبكة نفسها). جوال على بيانات الهاتف 4G لن يصل إلى 192.168.1.50 أبدًا' }[m], m === 'other' ? 'bad' : 'ok'); };
    ['dhcp', 'fixed', 'other'].forEach(m => q.btn(m, () => set(m))); set('dhcp'); },
};

S.staap = {
  svg: svg(`<g id="sta"><g transform="translate(380 80)"><rect x="-80" y="-30" width="160" height="60" rx="14" fill="#2e4288"/><text y="8" text-anchor="middle" class="ezta" style="font-size:18px">راوتر المدرسة</text></g>
      <path d="M330 110 L180 260 M380 110 V260 M430 110 L580 260" class="ezw" stroke-dasharray="8 8"/>${[['📱', 180], ['📡', 380], ['💻', 580]].map(([e, x]) => `<g transform="translate(${x} 300)"><circle r="40" fill="#1c2650" stroke="#4fc3f7" stroke-width="3"/><text y="14" text-anchor="middle" font-size="38">${e}</text></g>`).join('')}
      <text x="380" y="380" text-anchor="middle" class="ezt" style="font-size:20px;fill:#ffcf4a">WiFi.begin(ssid, pass);</text></g>
    <g id="ap" class="ezhide"><g transform="translate(380 130)"><circle r="56" fill="#1c2650" stroke="#ffcf4a" stroke-width="4"/><text y="16" text-anchor="middle" font-size="46">📡</text></g>
      ${[70, 110, 150].map(r => `<circle cx="380" cy="130" r="${r}" fill="none" stroke="#ffcf4a" stroke-width="3" opacity=".5"/>`).join('')}
      ${[['📱', 160], ['📱', 600]].map(([e, x]) => `<path d="M380 130 L ${x} 300" class="ezw hot" stroke-dasharray="8 8"/><g transform="translate(${x} 300)"><circle r="40" fill="#1c2650" stroke="#4fc3f7" stroke-width="3"/><text y="14" text-anchor="middle" font-size="38">${e}</text></g>`).join('')}
      <text x="380" y="380" text-anchor="middle" class="ezt" style="font-size:20px;fill:#ffcf4a">WiFi.softAP("ESP32-Car", "12345678");</text></g>`),
  ctl: `<button data-a="sta" class="on">STA: ينضم لشبكة موجودة</button><button data-a="ap">AP: يصنع شبكته</button>`,
  bind(q, cap) { const set = a => { q.on(a ? 'ap' : 'sta'); q.$('#sta').classList.toggle('ezhide', a); q.$('#ap').classList.toggle('ezhide', !a);
      cap(a ? 'AP (نقطة وصول): ESP32 نفسه يصير «راوتر صغيرًا» باسم وكلمة مرور، والجوال يتصل به مباشرة على 192.168.4.1. مثالي للسيارة والمعارض: لا يحتاج شبكة المدرسة' : 'STA (محطة): ESP32 ينضم لشبكة المدرسة مثل أي جوال. مناسب للوحات التحكم التي يراها الجميع في الشبكة', 'ok'); };
    q.btn('sta', () => set(false)); q.btn('ap', () => set(true)); set(false); },
};

S.http = {
  svg: svg(`<g transform="translate(110 200)"><rect x="-70" y="-120" width="140" height="240" rx="24" fill="#0b0f1f" stroke="#c9cfe6" stroke-width="4"/><text y="14" text-anchor="middle" font-size="50">📱</text><text y="150" text-anchor="middle" class="ezta" style="font-size:18px">العميل (المتصفح)</text></g>
    <g transform="translate(650 200)"><rect x="-70" y="-90" width="140" height="180" rx="16" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/><text y="10" text-anchor="middle" class="ezt">ESP32</text><text y="120" text-anchor="middle" class="ezta" style="font-size:18px">الخادم</text></g>
    <path id="hq" d="M190 150 H570" class="ezw" stroke-dasharray="8 8" style="opacity:.4"/><path id="hr" d="M570 250 H190" class="ezw" stroke-dasharray="8 8" style="opacity:.4"/>
    <g id="hqp" transform="translate(190 150)"><rect x="-80" y="-22" width="160" height="44" rx="12" fill="#4fc3f7"/><text y="7" text-anchor="middle" class="ezt" style="font-size:17px;fill:#0b1230">GET /on</text></g>
    <g id="hrp" transform="translate(570 250)" opacity="0"><rect x="-90" y="-22" width="180" height="44" rx="12" fill="#46d68c"/><text y="7" text-anchor="middle" class="ezt" style="font-size:17px;fill:#0b1230">200 OK + HTML</text></g>
    <text x="380" y="370" text-anchor="middle" class="ezta" style="font-size:20px" id="hst"></text>`),
  ctl: `<button data-a="go" class="on">▶ أرسل طلبًا</button>`,
  bind(q, cap) { let T = [];
    const go = () => { T.forEach(clearTimeout); const a = q.$('#hqp'), b = q.$('#hrp'); a.style.transition = b.style.transition = 'none'; a.setAttribute('transform', 'translate(190 150)'); a.setAttribute('opacity', 1); b.setAttribute('opacity', 0); b.setAttribute('transform', 'translate(570 250)');
      q.$('#hst').textContent = '١) العميل يطلب'; cap('المتصفح يرسل <b>طلبًا</b> (Request): «أعطني الصفحة /on»', '');
      T.push(setTimeout(() => { a.style.transition = 'transform 1s'; a.setAttribute('transform', 'translate(570 150)'); }, 100));
      T.push(setTimeout(() => { q.$('#hst').textContent = '٢) الخادم ينفّذ: يشعل الليد'; cap('الخادم يجد الدالة المسجلة لـ /on فينفّذها: <code>digitalWrite(23, HIGH)</code>', ''); a.setAttribute('opacity', 0); }, 1300));
      T.push(setTimeout(() => { b.setAttribute('opacity', 1); b.style.transition = 'transform 1s'; b.setAttribute('transform', 'translate(190 250)'); q.$('#hst').textContent = '٣) الخادم يرد'; }, 2300));
      T.push(setTimeout(() => { cap('ثم يرسل <b>ردًا</b> (Response): رمز ٢٠٠ = «تم بنجاح» + صفحة HTML يعرضها الجوال. هذا هو HTTP: لغة الويب كلها', 'ok'); q.$('#hst').textContent = 'طلب ← تنفيذ ← رد'; }, 3400)); };
    q.btn('go', go); q.clean(() => T.forEach(clearTimeout)); go(); },
};

S.url = {
  svg: svg(`<text x="380" y="110" text-anchor="middle" style="font:700 34px var(--mono)"><tspan fill="#c48cff" id="u0">http://</tspan><tspan fill="#4fc3f7" id="u1">192.168.1.50</tspan><tspan fill="#ffcf4a" id="u2">/servo</tspan><tspan fill="#46d68c" id="u3">?a=90</tspan></text>
    ${[['البروتوكول', '#c48cff', 110], ['العنوان (أي جهاز؟)', '#4fc3f7', 300], ['المسار (أي دالة؟)', '#ffcf4a', 500], ['المعامل (بأي قيمة؟)', '#46d68c', 650]].map(([t, c, x], i) => `<g class="ug" data-i="${i}"><path d="M${x} 130 V${190 + i * 45}" stroke="${c}" stroke-width="3"/><text x="${x}" y="${215 + i * 45}" text-anchor="middle" class="ezta" style="font-size:19px;fill:${c}">${t}</text></g>`).join('')}
    <text x="380" y="395" text-anchor="middle" class="ezt" style="font-size:19px" id="ucode"></text>`),
  ctl: `<button data-a="0">http://</button><button data-a="1">192.168.1.50</button><button data-a="2" class="on">/servo</button><button data-a="3">?a=90</button>`,
  bind(q, cap) { const T = ['http:// = لغة الطلب (HTTP). المتصفح يضيفها وحده غالبًا', '192.168.1.50 = عنوان ESP32 في الشبكة، يطبعه الكود في الشاشة التسلسلية', '/servo = المسار. كل مسار مربوط بدالة: <code>server.on("/servo", handleServo)</code>', '?a=90 = معامل ومعه قيمة. في الكود: <code>server.arg("a").toInt()</code> تعطي 90'];
    const C2 = ['', 'WiFi.localIP()', 'server.on("/servo", handleServo);', 'int a = server.arg("a").toInt();'];
    const set = i => { q.on(String(i)); [0, 1, 2, 3].forEach(k => q.$('#u' + k).style.opacity = k === i ? 1 : .3); q.$('#ucode').textContent = C2[i]; cap(T[i], 'ok'); };
    [0, 1, 2, 3].forEach(i => q.btn(String(i), () => set(i))); set(2); },
};

S.json = {
  svg: svg(`<g transform="translate(40 50)"><rect width="320" height="300" rx="16" fill="#1c2650"/><text x="160" y="34" text-anchor="middle" class="ezta" style="font-size:19px">صفحة HTML كاملة</text>
      <text x="16" y="70" class="ezmono" style="font-size:13px;fill:#8d95b5">${['<!DOCTYPE html><html dir=rtl>', '<head><meta charset=utf-8>', '<style>body{font-family:…}', '.c{background:#1c2a5e;…}', '</style></head><body>', '<h2>فصلي الذكي</h2>', '<div class=c>الحرارة', '<div class=v>27.5</div>', '…', '</body></html>'].map((l, i) => `<tspan x="16" dy="${i ? 20 : 0}">${l.replace(/</g, '&lt;')}</tspan>`).join('')}</text>
      <text x="160" y="285" text-anchor="middle" class="ezt" style="font-size:18px;fill:#ff7b6b">≈ 1500 حرف</text></g>
    <g transform="translate(400 50)"><rect width="320" height="300" rx="16" fill="#1c2650"/><text x="160" y="34" text-anchor="middle" class="ezta" style="font-size:19px">JSON</text>
      <text x="30" y="110" class="ezmono" style="font-size:22px;fill:#46d68c"><tspan x="30">{</tspan><tspan x="30" dy="34">  "t": 27.5,</tspan><tspan x="30" dy="34">  "h": 55,</tspan><tspan x="30" dy="34">  "l": 2310</tspan><tspan x="30" dy="34">}</tspan></text>
      <text x="160" y="285" text-anchor="middle" class="ezt" style="font-size:18px;fill:#46d68c">27 حرفًا فقط</text></g>`),
  ctl: `<button data-a="a" class="on">ما الفرق؟</button>`,
  bind(q, cap) { q.btn('a', () => cap('الصفحة تُرسل <b>مرة واحدة</b>، ثم كل ثانيتين يُرسل JSON صغير بالأرقام فقط: أسرع بخمسين مرة، ولا تومض الصفحة', 'ok'));
    cap('JSON = طريقة لكتابة البيانات على شكل «اسم: قيمة» يفهمها الجوال والحاسوب وكل لغات البرمجة', ''); },
};

S.mac = {
  svg: svg(`<text x="380" y="90" text-anchor="middle" style="font:700 46px var(--mono)" id="mct"><tspan fill="#ffcf4a">24:6F:28</tspan><tspan fill="#4fc3f7">:AB:CD:EF</tspan></text>
    <text x="250" y="140" text-anchor="middle" class="ezta" style="font-size:19px;fill:#ffcf4a">رقم الشركة المصنّعة</text><text x="530" y="140" text-anchor="middle" class="ezta" style="font-size:19px;fill:#4fc3f7">رقم هذه اللوحة بالذات</text>
    <g transform="translate(200 270)"><rect x="-150" y="-70" width="300" height="140" rx="16" fill="#1c2650"/><text y="-30" text-anchor="middle" class="ezta" style="font-size:18px">IP مثل رقم المقعد في الفصل</text><text y="8" text-anchor="middle" class="ezt" style="font-size:18px;fill:#8d95b5">يتغير من فصل لآخر</text><text y="44" text-anchor="middle" class="ezt" style="font-size:20px;fill:#4fc3f7">192.168.1.50</text></g>
    <g transform="translate(560 270)"><rect x="-150" y="-70" width="300" height="140" rx="16" fill="#1c2650"/><text y="-30" text-anchor="middle" class="ezta" style="font-size:18px">MAC مثل رقم الهوية الوطنية</text><text y="8" text-anchor="middle" class="ezt" style="font-size:18px;fill:#8d95b5">ثابت طوال العمر</text><text y="44" text-anchor="middle" class="ezt" style="font-size:20px;fill:#ffcf4a">24:6F:28:AB:CD:EF</text></g>`),
  ctl: `<button data-a="new" class="on">🎲 لوحة أخرى</button><button data-a="bc">📢 FF:FF:FF:FF:FF:FF</button>`,
  bind(q, cap) { const hx = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
    q.btn('new', () => { q.on('new'); q.$('#mct').innerHTML = `<tspan fill="#ffcf4a">24:6F:28</tspan><tspan fill="#4fc3f7">:${hx()}:${hx()}:${hx()}</tspan>`; cap('كل لوحة في العالم لها MAC مختلف، محفور في الشريحة من المصنع. اطبعه بـ <code>WiFi.macAddress()</code> والصقه على اللوحة بملصق', 'ok'); });
    q.btn('bc', () => { q.on('bc'); q.$('#mct').innerHTML = '<tspan fill="#ff7b6b">FF:FF:FF:FF:FF:FF</tspan>'; cap('عنوان خاص معناه «الجميع» (بث): الرسالة تصل لكل اللوحات القريبة. أسهل للطلاب لأنه لا يحتاج نسخ عناوين', 'ok'); });
    cap('MAC = عنوان فريد من ٦ أزواج يميّز كل جهاز شبكة في العالم. ESP-NOW يستعمله بدل IP لأنه لا يوجد راوتر يوزع العناوين', ''); },
};

S.espnow = {
  svg: svg(`<g id="enw"><g transform="translate(380 70)"><rect x="-80" y="-30" width="160" height="60" rx="14" fill="#2e4288"/><text y="8" text-anchor="middle" class="ezta" style="font-size:18px">الراوتر</text></g>
      <path d="M150 260 L320 100 M610 260 L440 100" class="ezw" stroke-dasharray="8 8"/><text x="380" y="190" text-anchor="middle" class="ezt" style="font-size:20px;fill:#ffcf4a">≈ 50–300 ms</text></g>
    <g id="enn" class="ezhide"><path d="M190 300 H570" class="ezw hot" stroke-dasharray="10 8"/><text x="380" y="280" text-anchor="middle" class="ezt" style="font-size:22px;fill:#46d68c">≈ 2 ms · مباشرة</text></g>
    ${[150, 610].map(x => `<g transform="translate(${x} 300)"><rect x="-55" y="-60" width="110" height="120" rx="14" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/><text y="8" text-anchor="middle" class="ezt" style="font-size:18px">ESP32</text></g>`).join('')}`),
  ctl: `<button data-a="wifi">📶 عبر الواي فاي</button><button data-a="now" class="on">⚡ ESP-NOW</button>`,
  bind(q, cap) { const set = n => { q.on(n ? 'now' : 'wifi'); q.$('#enw').classList.toggle('ezhide', n); q.$('#enn').classList.toggle('ezhide', !n);
      cap(n ? 'ESP-NOW: بروتوكول من Espressif تتكلم فيه لوحات ESP مباشرة بعناوين MAC. بلا راوتر ولا كلمة مرور، وفي نحو ٢ مللي ثانية، ورسالة حتى ٢٥٠ بايت' : 'عبر الواي فاي: كل رسالة تمر بالراوتر، وتحتاج الشبكة وكلمة المرور، وأبطأ. وإن انقطعت شبكة المدرسة توقف المشروع', n ? 'ok' : ''); };
    q.btn('wifi', () => set(false)); q.btn('now', () => set(true)); set(true); },
};

S.callback = {
  svg: svg(`<g transform="translate(40 60)"><rect width="320" height="280" rx="16" fill="#1c2650"/><text x="160" y="34" text-anchor="middle" class="ezta" style="font-size:19px">loop يعمل…</text>
      <text id="cbl" x="20" y="80" class="ezmono" style="font-size:17px;fill:#d6dcf5"><tspan x="20">void loop() {</tspan><tspan x="20" dy="30">  if (ring) {</tspan><tspan x="20" dy="30">    ring = false;</tspan><tspan x="20" dy="30">    دق الجرس!</tspan><tspan x="20" dy="30">  }</tspan><tspan x="20" dy="30">}</tspan></text></g>
    <g transform="translate(400 60)"><rect width="320" height="280" rx="16" fill="#1c2650" id="cbr"/><text x="160" y="34" text-anchor="middle" class="ezta" style="font-size:19px">دالة الاستدعاء</text>
      <text x="20" y="80" class="ezmono" style="font-size:16px;fill:#ffcf4a"><tspan x="20">void onReceive(…) {</tspan><tspan x="20" dy="30">  memcpy(&amp;m, data, …);</tspan><tspan x="20" dy="30">  ring = true;</tspan><tspan x="20" dy="30">}</tspan></text>
      <text x="160" y="250" text-anchor="middle" class="ezt" style="font-size:16px;fill:#8d95b5">esp_now_register_recv_cb(onReceive);</text></g>
    <text id="cbm" x="560" y="380" text-anchor="middle" font-size="34" opacity="0">📨</text>`),
  ctl: `<button data-a="msg" class="on">📨 وصلت رسالة</button>`,
  bind(q, cap) { q.btn('msg', () => { q.$('#cbm').setAttribute('opacity', 1); q.$('#cbr').setAttribute('fill', '#2e4288'); setTimeout(() => { q.$('#cbm').setAttribute('opacity', 0); q.$('#cbr').setAttribute('fill', '#1c2650'); }, 900);
      cap('لم نستدعِ onReceive بأنفسنا! سجّلناها مرة واحدة، والنظام يناديها <b>تلقائيًا</b> لحظة وصول رسالة، فترفع علمًا قصيرًا، ثم loop ترى العلم وتدق الجرس', 'ok'); });
    cap('دالة الاستدعاء (Callback) = دالة نعطيها للنظام ونقول له: «نادِها حين يحدث كذا». مثل رقم جوالك عند الطبيب: «اتصل بي حين يأتي دوري»', ''); },
};

S.millis = {
  svg: svg(`${[['delay(5000)', 40, '#ff7b6b', 'mdl'], ['millis()', 400, '#46d68c', 'mml']].map(([t, x, c, id]) => `<g transform="translate(${x} 50)"><rect width="320" height="300" rx="16" fill="#1c2650"/><text x="160" y="36" text-anchor="middle" class="ezt" style="font-size:20px;fill:${c}">${t}</text>
      <circle cx="160" cy="150" r="70" fill="none" stroke="#2b3566" stroke-width="12"/><circle id="${id}" cx="160" cy="150" r="70" fill="none" stroke="${c}" stroke-width="12" stroke-dasharray="440" stroke-dashoffset="440" transform="rotate(-90 160 150)"/>
      <text id="${id}t" x="160" y="265" text-anchor="middle" class="ezta" style="font-size:18px"></text></g>`).join('')}`),
  ctl: `<button data-a="req" class="on">📱 الجوال يطلب الآن</button>`,
  bind(q, cap) { let t0 = performance.now(), id = 0, req = -1;
    const loop = now => { const k = ((now - t0) / 5000) % 1; q.$('#mdl').setAttribute('stroke-dashoffset', 440 * (1 - k)); q.$('#mml').setAttribute('stroke-dashoffset', 440 * (1 - k));
      if (req >= 0) { const wait = Math.max(0, 5000 - ((now - t0) % 5000)); q.$('#mdlt').textContent = `الجوال ينتظر… ${(wait / 1000).toFixed(1)} ث`; q.$('#mmlt').textContent = 'ردّ فورًا ✓'; }
      else { q.$('#mdlt').textContent = 'متجمد: لا يسمع أحدًا'; q.$('#mmlt').textContent = 'يفحص الساعة ويخدم الجوال'; } id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop); q.clean(() => cancelAnimationFrame(id));
    q.btn('req', () => { req = 1; cap('مع delay يتجمد البرنامج كله فلا يرد الخادم حتى ينتهي الانتظار. مع millis نسأل: «هل مرّت ٥ ثوانٍ؟» ونكمل خدمة الجوال في كل دورة ✓', 'ok'); });
    cap('<code>millis()</code> = كم مللي ثانية مرت منذ تشغيل اللوحة. نستعملها كساعة حائط ننظر إليها، بدل delay التي تشبه النوم', ''); },
};

S.rssi = {
  svg: svg(`<g transform="translate(120 200)"><rect x="-60" y="-26" width="120" height="52" rx="12" fill="#2e4288"/><text y="7" text-anchor="middle" class="ezta" style="font-size:16px">الراوتر</text></g>
    <g id="rsb" transform="translate(300 200)"><rect x="-55" y="-60" width="110" height="120" rx="14" fill="#1f2a44" stroke="#5a6aa0" stroke-width="3"/><text y="8" text-anchor="middle" class="ezt" style="font-size:16px">ESP32</text></g>
    ${[0, 1, 2, 3].map(i => `<rect class="rsbar" x="${560 + i * 40}" y="${260 - i * 40 - 40}" width="28" height="${40 + i * 40}" rx="5" fill="#2b3566"/>`).join('')}
    <text id="rsv" x="620" y="320" text-anchor="middle" class="ezt" style="font-size:34px;fill:#ffcf4a"></text>`),
  ctl: `<span class="rl">البعد</span><input type="range" min="1" max="60" value="10"><span class="rl">🧱</span><button data-a="wall">جدار خرساني</button>`,
  bind(q, cap) { const r = q.$('input'); let wall = false;
    const upd = () => { const d = +r.value, v = Math.round(-30 - d * 1.05 - (wall ? 12 : 0)), bars = v > -55 ? 4 : v > -67 ? 3 : v > -78 ? 2 : v > -88 ? 1 : 0;
      q.$('#rsb').setAttribute('transform', `translate(${180 + d * 5} 200)`); q.$('#rsv').textContent = v + ' dBm';
      q.all('.rsbar').forEach((b, i) => b.setAttribute('fill', i < bars ? (bars > 2 ? '#46d68c' : bars > 1 ? '#ffcf4a' : '#ff7b6b') : '#2b3566'));
      cap(`${v} dBm: ${v > -55 ? 'ممتازة' : v > -67 ? 'جيدة جدًا للمشاريع' : v > -78 ? 'مقبولة وقد تتأخر' : v > -88 ? 'ضعيفة: انقطاعات' : 'لا اتصال'}. الرقم سالب دائمًا: الأقرب إلى الصفر أقوى`, v > -67 ? 'ok' : v > -78 ? '' : 'bad'); };
    r.oninput = upd; q.btn('wall', () => { wall = !wall; q.$('[data-a=wall]').classList.toggle('on', wall); upd(); }); upd(); },
};

S.ghz = {
  svg: svg(`${[['2.4 GHz', 200, '#46d68c', 'يصل أبعد ويخترق الجدران · ESP32 يراه ✓', 4], ['5 GHz', 560, '#ff7b6b', 'أسرع لكن أقصر مدى · ESP32 لا يراه ✗', 9]].map(([t, x, c, d, n]) => `<g transform="translate(${x} 0)"><text y="60" text-anchor="middle" class="ezt" style="font-size:30px;fill:${c}">${t}</text>
      <path d="M-150 200 ${Array.from({ length: n * 2 }, (_, i) => `Q ${-150 + (i + .5) * 300 / (n * 2)} ${i % 2 ? 260 : 140} ${-150 + (i + 1) * 300 / (n * 2)} 200`).join(' ')}" fill="none" stroke="${c}" stroke-width="5"/>
      <text y="320" text-anchor="middle" class="ezta" style="font-size:17px">${d}</text></g>`).join('')}`),
  ctl: `<button data-a="a" class="on">كيف أعرف؟</button>`,
  bind(q, cap) { q.btn('a', () => cap('في إعدادات الراوتر: اسم ينتهي بـ 5G غالبًا 5GHz. كثير من الراوترات تبث الاثنين باسم واحد: اطلب من الفني فصلهما أو شبكة 2.4 خاصة للمعمل', 'ok'));
    cap('الواي فاي يعمل على «ترددين»: ESP32 الكلاسيكية تتعامل مع 2.4GHz فقط. هذا ليس عيبًا: المدى الأبعد أنسب للأجهزة الذكية', ''); },
};
})();
