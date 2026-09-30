/* =====================================================================
   أدوات الجزء الثاني — المرحلة الثانية: الحرارة والموجات فوق الصوتية
   الأنواع: templab · sonarlab  ·  دوائر البناء: tmpfan · sonar
   تعتمد على window.ARD (الجزء الأول) وwindow.ARD2 (widgets2.js)
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { plotter, plotFeed, B2, col, pinX, botX, base, wire, fx } = window.ARD2;

/* ================== الحرارة: TMP36 ================== */
/* TMP36: جهد الخرج = ٠٫٥ فولت + ١٠ مللي فولت لكل درجة مئوية */
const TMP_CODE = `int sensor = A0;
int fan = 13;
float limit = 30.0;

void setup() {
  pinMode(fan, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(sensor);
  float volt = raw * 5.0 / 1023;
  float temp = (volt - 0.5) * 100;
  Serial.println(temp);
  if (temp > limit) {
    digitalWrite(fan, HIGH);
  } else {
    digitalWrite(fan, LOW);
  }
  delay(500);
}`;
const roomSVG = () => `<svg viewBox="0 0 640 420" class="roomsvg">
  <rect x="0" y="0" width="640" height="420" rx="0" class="wall"/>
  <rect x="0" y="330" width="640" height="90" class="floor"/>
  <rect x="40" y="60" width="170" height="130" rx="10" class="win"/><line x1="125" y1="60" x2="125" y2="190" class="wf"/><line x1="40" y1="125" x2="210" y2="125" class="wf"/>
  <circle cx="92" cy="98" r="24" class="rsun"/>
  <g transform="translate(470 180)">
    <rect x="-8" y="0" width="16" height="150" rx="6" class="fanpole"/><rect x="-60" y="140" width="120" height="16" rx="8" class="fanpole"/>
    <circle cx="0" cy="0" r="92" class="fancage"/>
    <g class="blades">${[0, 120, 240].map(a => `<path d="M0 0 C 20 -30, 60 -70, 10 -84 C -20 -70, -14 -30, 0 0Z" transform="rotate(${a})" class="blade"/>`).join('')}</g>
    <circle cx="0" cy="0" r="14" class="hub"/>
  </g>
  <g transform="translate(300 70)">
    <rect x="-22" y="0" width="44" height="230" rx="22" class="tglass"/>
    <circle cx="0" cy="250" r="36" class="tbulb"/>
    <rect x="-10" y="40" width="20" height="200" rx="10" class="ttube"/>
    <rect x="-10" y="40" width="20" height="200" rx="10" class="tfill" id="tfill"/>
    ${[0, 10, 20, 30, 40, 50].map(t => `<line x1="24" x2="40" y1="${240 - t * 4}" y2="${240 - t * 4}" class="ttk"/><text x="48" y="${246 - t * 4}" class="ttx" text-anchor="start">${t}°</text>`).join('')}
  </g>
  <g class="heat">${[0, 1, 2].map(i => `<path d="M${250 + i * 26} 60 q10 -14 0 -28 q-10 -14 0 -28" class="hw" style="animation-delay:${i * .3}s"/>`).join('')}</g>
</svg>`;

/* ================== الموجات فوق الصوتية: HC-SR04 ================== */
const SONAR_CODE = `int trig = 9;
int echo = 10;
int buzzer = 8;

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
}

void loop() {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long duration = pulseIn(echo, HIGH);
  int cm = duration * 0.0343 / 2;
  if (cm < 50) {
    tone(buzzer, 1000, 50);
    delay(cm * 10);
  }
}`;
const sonarScene = () => `<svg viewBox="0 0 1480 330" class="sonarsvg">
  <rect x="0" y="0" width="1480" height="330" class="ssky"/>
  <rect x="0" y="262" width="1480" height="68" class="sground"/>
  <g transform="translate(40 150)">
    <path d="M0 110 L0 55 Q0 30 30 26 L120 16 Q150 -30 230 -30 L300 -30 Q340 -30 360 20 L380 30 Q400 34 400 60 L400 110 Z" class="car"/>
    <path d="M150 12 Q170 -18 225 -18 L260 -18 L260 14 Z" class="cwin"/><path d="M275 -18 L300 -18 Q330 -18 345 14 L275 14Z" class="cwin"/>
    <circle cx="95" cy="110" r="34" class="wheel"/><circle cx="95" cy="110" r="14" class="rim"/>
    <circle cx="320" cy="110" r="34" class="wheel"/><circle cx="320" cy="110" r="14" class="rim"/>
    <g transform="translate(398 62)"><rect x="0" y="-22" width="26" height="44" rx="4" class="hcpcb"/><circle cx="18" cy="-11" r="8" class="hceye"/><circle cx="18" cy="11" r="8" class="hceye"/></g>
  </g>
  <g id="waves"></g>
  <g id="wall" class="wallg"><rect x="-36" y="40" width="72" height="222" rx="6" class="wallr"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="-36" x2="36" y1="${76 + i * 37}" y2="${76 + i * 37}" class="brick"/>`).join('')}
    <text x="0" y="28" class="wlbl">↔ اسحبني</text></g>
  <line id="dline" y1="300" y2="300" class="dline"/><text id="dtxt" y="322" class="dtxt"></text>
</svg>`;

/* ---------- دوائر البناء ---------- */
const res220 = (c, s) => `<g class="bs" data-s="${s}"><line x1="${col(c)}" y1="336" x2="${col(c)}" y2="352" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(c) - 10}" y="352" width="20" height="50" rx="9" fill="#d9b382"/>
    <rect x="${col(c) - 10}" y="362" width="20" height="5" fill="#d62828"/><rect x="${col(c) - 10}" y="372" width="20" height="5" fill="#d62828"/><rect x="${col(c) - 10}" y="382" width="20" height="5" fill="#7b4a26"/>
    <line x1="${col(c)}" y1="402" x2="${col(c)}" y2="456" stroke="#9aa1b3" stroke-width="5"/></g>`;
const led = (c, s, cls = '', lbl = '') => `<circle class="glow2 ${cls}" cx="${col(c) + 13}" cy="250" r="56"/>
  <g class="bs" data-s="${s}"><line x1="${col(c)}" y1="288" x2="${col(c)}" y2="262" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(c + 1)}" y1="288" x2="${col(c + 1)}" y2="266" stroke="#9aa1b3" stroke-width="5"/>
    <path class="led2 ${cls}" d="M${col(c) - 7} 266 L${col(c) - 7} 238 A20 20 0 0 1 ${col(c + 1) + 7} 238 L${col(c + 1) + 7} 266 Z"/>
    ${lbl ? `<text x="${col(c) + 13}" y="214" class="lbl" style="font-size:17px">${lbl}</text>` : ''}</g>${res220(c + 1, s)}`;

B2.tmpfan = { flow: 6, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'حساس الحرارة TMP36', b: 'الوجه المسطح نحوك: الرجل اليسرى للطاقة، والوسطى للإشارة، واليمنى للأرضي. انتبه للاتجاه!' },
  { h: 'اليسرى إلى 5V', b: 'سلك أحمر من 5V إلى الخط الموجب، ومنه إلى الرجل اليسرى.' },
  { h: 'اليمنى إلى GND', b: 'سلك أسود من GND إلى الخط السالب، ومنه إلى الرجل اليمنى.' },
  { h: 'الوسطى إلى A0', b: 'السلك الأصفر يحمل جهدًا يرتفع ١٠ مللي فولت مع كل درجة.' },
  { h: 'مؤشر المروحة على 13 · سخّن الحساس!', b: 'ليد أزرق يمثّل المروحة الآن (سنوصل مروحة حقيقية في محور المحركات). أمسك الحساس بأصابعك فترتفع الحرارة ويضيء.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 tmpw">
  ${base({ 1: 'GND', 3: '13' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  <g class="bs" data-s="2"><path d="M${col(2) - 16} 290 L${col(2) - 16} 250 A${col(4) - col(2) + 32} 44 0 0 1 ${col(4) + 16} 250 L${col(4) + 16} 290 Z" fill="#1c1f27" transform="translate(0 0)"/>
    <path d="M${col(2) - 16} 262 L${col(4) + 16} 262" stroke="#3a3f4d" stroke-width="3"/>
    ${[2, 3, 4].map(c => `<line x1="${col(c)}" y1="290" x2="${col(c)}" y2="312" stroke="#9aa1b3" stroke-width="5"/>`).join('')}
    <text x="${col(3)}" y="282" class="lbl" style="font-size:14px;fill:#c9ccd3">TMP</text>
    <text x="${col(3)}" y="206" class="lbl" style="font-size:18px">TMP36</text></g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(2)} 312 L${col(2)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 4, '#1b2340')}${wire(`M${col(4)} 312 L${col(4)} 456`, 4, '#1b2340')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 470, ${col(3)} 470, ${col(3)} 336`, 5, '#e0b400')}
  ${led(10, 6, 'blue', 'المروحة')}
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 70, ${col(10)} 70, ${col(10)} 240`, 6, '#2e9e6b')}
  ${wire(`M${pinX(1)} 150 C ${pinX(1)} 30, 880 30, 880 300 C 880 430, 860 456, 830 456`, 6, '#1b2340')}
  <g class="fingers"><text x="${col(3)}" y="258" style="font-size:78px" text-anchor="middle">🤏</text></g>
  <g class="hotwaves">${[0, 1, 2].map(i => `<path d="M${col(2) + i * 26} 210 q8 -12 0 -24 q-8 -12 0 -24" class="hw2" style="animation-delay:${i * .25}s"/>`).join('')}</g>
</svg>` };

B2.sonar = { flow: 7, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نبدأ كالعادة.' },
  { h: 'حساس HC-SR04', b: 'عينان: واحدة ترسل الموجة (Trig)، وأخرى تستقبل صداها (Echo). أرجله الأربع: VCC وTrig وEcho وGND.' },
  { h: 'VCC إلى 5V · GND إلى GND', b: 'سلكا الطاقة إلى الخطين الموجب والسالب.' },
  { h: 'Trig إلى المنفذ 9', b: 'من هنا يأمر الأردوينو الحساس: «أرسل نبضة الآن».' },
  { h: 'Echo إلى المنفذ 10', b: 'ومن هنا يعرف الأردوينو كم استغرق الصدى حتى عاد.' },
  { h: 'البازر على المنفذ 8', b: 'الرجل الموجبة (الطويلة) إلى 8، والسالبة إلى GND.' },
  { h: 'قرّب يدك من الحساس!', b: 'كلما اقتربت، تسارعت النغمات: هذا حساس ركن السيارة بالضبط.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 sonw">
  ${base({ 1: 'GND', 3: '8', 4: '~10', 5: '~9' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2"><rect x="${col(3) - 44}" y="206" width="${col(8) - col(3) + 88}" height="64" rx="8" fill="#1f5fae"/>
    <circle cx="${col(3) + 4}" cy="236" r="26" fill="#cfd4dc" stroke="#8a93a4" stroke-width="4"/><circle cx="${col(3) + 4}" cy="236" r="14" fill="#6b7384"/>
    <circle cx="${col(8) - 4}" cy="236" r="26" fill="#cfd4dc" stroke="#8a93a4" stroke-width="4"/><circle cx="${col(8) - 4}" cy="236" r="14" fill="#6b7384"/>
    ${[4, 5, 6, 7].map((c, i) => `<line x1="${col(c)}" y1="270" x2="${col(c)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(c)}" y="262" class="lbl" style="font-size:11px;fill:#e8f0ff">${['VCC', 'Trig', 'Echo', 'GND'][i]}</text>`).join('')}
    <text x="${(col(3) + col(8)) / 2}" y="196" class="lbl" style="font-size:17px">HC-SR04</text></g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(4)} 336 C ${col(4)} 370, ${col(4)} 380, ${col(4)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}${wire(`M${col(7)} 336 L${col(7)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 110, 420 120, 420 250 C 420 340, ${col(5) - 20} 336, ${col(5)} 336`, 4, '#e67e22')}
  ${wire(`M${pinX(4)} 150 C ${pinX(4)} 100, 405 110, 405 260 C 405 380, ${col(6)} 380, ${col(6)} 336`, 5, '#8e44ad')}
  <g class="bs" data-s="6"><circle cx="${col(12)}" cy="262" r="30" fill="#1c1f27"/><circle cx="${col(12)}" cy="262" r="7" fill="#444a58"/>
    <line x1="${col(11)}" y1="292" x2="${col(11)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(13)}" y1="292" x2="${col(13)}" y2="312" stroke="#9aa1b3" stroke-width="5"/>
    <text x="${col(12)}" y="220" class="lbl" style="font-size:17px">البازر</text><text x="${col(11) - 6}" y="302" class="sgn" style="font-size:18px;fill:#e74c3c" text-anchor="end">+</text>
    <line x1="${col(13)}" y1="336" x2="${col(13)}" y2="456" stroke="#9aa1b3" stroke-width="5"/></g>
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 40, ${col(11)} 40, ${col(11)} 240`, 6, '#2e9e6b')}
  ${wire(`M${pinX(1)} 150 C ${pinX(1)} 20, 890 20, 890 300 C 890 430, 870 456, 845 456`, 6, '#1b2340')}
  <g class="pings">${[0, 1, 2].map(i => `<path d="M${col(3) - 30} 170 q${-40 - i * 26} ${-44 - i * 16} ${-10 - i * 10} ${-100 - i * 30}" class="ping" style="animation-delay:${i * .25}s"/>`).join('')}</g>
  <g class="handnear"><text x="${col(5) + 10}" y="120" style="font-size:72px" text-anchor="middle">✋</text></g>
  <g class="beeps">${[0, 1].map(i => `<circle cx="${col(12)}" cy="262" r="${40 + i * 18}" class="beep" style="animation-delay:${i * .15}s"/>`).join('')}</g>
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  templab: s => `<div class="slide light">
      <div class="kicker">🌡️ محاكي</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="tgrid">
        <div class="tleft ix">
          <div class="roomwrap" id="room">${roomSVG()}</div>
          <label class="lsl"><span>🌡️ حرارة الغرفة: <b id="tT">24</b>°C</span><input type="range" id="tin" min="0" max="50" value="24" step="0.5"></label>
          <label class="lsl"><span>🎚️ حد تشغيل المروحة (limit): <b id="tL">30</b>°C</span><input type="range" id="tlim" min="20" max="40" value="30" step="0.5"></label>
        </div>
        <div class="tmid">
          <div class="tchain">
            <div class="ac"><span>جهد الحساس</span><b id="tV">0.74 V</b><small>0.5 + 0.01 × °C</small></div>
            <div class="ac gold"><span>analogRead</span><b id="tR">151</b></div>
            <div class="ac"><span>الحرارة المحسوبة</span><b id="tC">24.3 °C</b><small>(volt − 0.5) × 100</small></div>
            <div class="ac"><span>المروحة</span><b id="tF" class="fanst">متوقفة</b></div>
          </div>
        </div>
        <div class="tright">${codeBlock(TMP_CODE, 'micro')}${plotter('tplot', 'temp °C', 50)}</div>
      </div></div>`,

  sonarlab: s => `<div class="slide light">
      <div class="kicker">🦇 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="songrid">
        <div class="soncode">${codeBlock(SONAR_CODE, 'micro')}</div>
        <div class="sonright">
          <div class="sontop ix"><div class="sonwrap" id="son">${sonarScene()}</div></div>
          <div class="sonfacts">
            <div class="ac"><span>زمن الذهاب والعودة</span><b id="sT">1749 µs</b><small>pulseIn(echo, HIGH)</small></div>
            <div class="ac gold"><span>المسافة</span><b id="sD">30 cm</b><small>duration × 0.0343 ÷ 2</small></div>
            <div class="ac"><span>التنبيه</span><b id="sB">🔈</b><small id="sBs">كل 300 مللي ثانية</small></div>
            <div class="pbars" id="pbars">${Array.from({ length: 8 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
            <button class="sndbtn ix" id="snd">🔇 تشغيل الصوت</button>
          </div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  templab(sl) {
    const tin = sl.querySelector('#tin'), tlim = sl.querySelector('#tlim'), room = sl.querySelector('#room');
    const plot = sl.querySelector('#tplot'), th = plot.querySelector('.pth'), lines = sl.querySelectorAll('.code .ln'), buf = [];
    let T = 24;
    const upd = () => {
      T = +tin.value; const L = +tlim.value;
      const V = 0.5 + 0.01 * T, raw = Math.round(V * 1023 / 5), calc = (raw * 5 / 1023 - 0.5) * 100, on = calc > L;
      sl.querySelector('#tT').textContent = T; sl.querySelector('#tL').textContent = L;
      sl.querySelector('#tV').textContent = fx(V) + ' V'; sl.querySelector('#tR').textContent = raw; sl.querySelector('#tC').textContent = fx(calc, 1) + ' °C';
      const f = sl.querySelector('#tF'); f.textContent = on ? 'تعمل 🌀' : 'متوقفة'; f.classList.toggle('on', on);
      sl.querySelector('#tfill').setAttribute('y', 240 - T * 4); sl.querySelector('#tfill').setAttribute('height', 10 + T * 4);
      room.style.setProperty('--heat', T / 50); room.classList.toggle('fanon', on);
      room.style.setProperty('--spin', on ? Math.max(0.25, 1.6 - (calc - L) / 12) + 's' : '0s');
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', [11, 12, 13].includes(n) || (on ? n === 16 : n === 18)); });
      sl.querySelector('.ln[data-n="3"] .cl-src').innerHTML = highlight(`float limit = ${fx(L, 1)};`);
      th.style.display = ''; const y = 180 - L / 50 * 170; th.setAttribute('y1', y); th.setAttribute('y2', y);
    };
    tin.oninput = tlim.oninput = upd; upd();
    const t = setInterval(() => plotFeed(plot, buf, Math.max(0, Math.min(50, T + (Math.random() - .5) * 0.6)), 50), 120);
    window.DECK_CLEANUP.push(() => clearInterval(t));
  },

  sonarlab(sl) {
    const svg = sl.querySelector('.sonarsvg'), wall = sl.querySelector('#wall'), waves = sl.querySelector('#waves');
    const SX = 470, PX = 5.1;                        // موضع الحساس، وعدد البكسلات لكل سنتيمتر
    let cm = 60, audio = null, raf = 0, nextBeep = 0, ping = null;
    const lines = sl.querySelectorAll('.code .ln'), bars = [...sl.querySelectorAll('#pbars i')];
    const setWall = () => {
      const x = SX + cm * PX; wall.setAttribute('transform', `translate(${x + 36} 0)`);
      const dl = sl.querySelector('#dline'), dt = sl.querySelector('#dtxt');
      dl.setAttribute('x1', SX); dl.setAttribute('x2', x); dt.setAttribute('x', (SX + x) / 2); dt.textContent = Math.round(cm) + ' cm';
      const us = Math.round(cm * 2 / 0.0343);
      sl.querySelector('#sT').textContent = us + ' µs'; sl.querySelector('#sD').textContent = Math.round(cm) + ' cm';
      const near = cm < 50, gap = Math.round(cm) * 10;
      sl.querySelector('#sB').textContent = near ? (cm < 12 ? '🔊🔊' : '🔊') : '🔈';
      sl.querySelector('#sBs').textContent = near ? (cm < 8 ? 'نغمة شبه متصلة: قف!' : `نغمة كل ${gap + 50} مللي ثانية`) : 'بعيد: لا تنبيه';
      bars.forEach((b, i) => b.classList.toggle('on', near && i < Math.ceil((50 - cm) / 50 * 8)));
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 16 || n === 17 || (near && (n === 19 || n === 20))); });
    };
    /* السحب بالماوس */
    const toCm = e => { const r = svg.getBoundingClientRect(); const x = (e.clientX - r.left) * 1480 / r.width - 36; cm = Math.max(3, Math.min(190, (x - SX) / PX)); setWall(); };
    let drag = false;
    svg.addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); toCm(e); });
    svg.addEventListener('pointermove', e => drag && toCm(e));
    svg.addEventListener('pointerup', () => drag = false);
    /* الموجة: تذهب إلى الجدار ثم ترتد (حركة مبطّأة جدًا لتراها العين) */
    const loop = ts => {
      if (!ping || ts - ping.t0 > ping.dur) ping = { t0: ts, dur: 500 + cm * 14 };
      const p = (ts - ping.t0) / ping.dur, far = cm * PX;
      const d = p < .5 ? far * p * 2 : far * (1 - (p - .5) * 2), back = p >= .5;
      waves.innerHTML = [0, 14, 28].map(o => { const x = SX + Math.max(0, d - o * (back ? -1 : 1));
        return `<path d="M${x} ${150 - 38} q${back ? -22 : 22} 38 0 76" class="wv ${back ? 'back' : ''}" style="opacity:${1 - o / 40}"/>`; }).join('');
      if (cm < 50 && ts > nextBeep) { beep(); nextBeep = ts + 50 + Math.round(cm) * 10; }
      raf = requestAnimationFrame(loop);
    };
    const pb = sl.querySelector('#sB');
    const beep = () => {
      pb.classList.remove('bp'); void pb.offsetWidth; pb.classList.add('bp');
      if (!audio) return;
      const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 1000; g.gain.value = 0.08;
      o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.05);
    };
    sl.querySelector('#snd').onclick = e => {
      if (audio) { audio.close(); audio = null; e.target.textContent = '🔇 تشغيل الصوت'; }
      else { audio = new (window.AudioContext || window.webkitAudioContext)(); e.target.textContent = '🔊 إيقاف الصوت'; }
    };
    setWall(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); if (audio) audio.close(); });
  },
});
})();
