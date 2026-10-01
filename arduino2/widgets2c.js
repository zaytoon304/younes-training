/* =====================================================================
   أدوات الجزء الثاني — المرحلة الثالثة: الحركة PIR · الأشعة تحت الحمراء IR · الصوت
   الأنواع: pirlab · irlab · soundlab  ·  دوائر البناء: pirwire · irwire · clapwire
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { plotter, plotFeed, B2, col, pinX, botX, base, wire, fx, bulbSVG } = window.ARD2;

/* صوت قصير عبر متصفح الجهاز (بديل البازر) */
let AC = null;
const audio = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function beep(freq, ms = 200, vol = 0.08, type = 'square') {
  const a = audio(), o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = vol;
  g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + ms / 1000);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + ms / 1000);
}

/* ================== PIR ================== */
const PIR_CODE = `int pir = 2;
int led = 13;
int buzzer = 8;

void setup() {
  pinMode(pir, INPUT);
  pinMode(led, OUTPUT);
}

void loop() {
  if (digitalRead(pir) == HIGH) {
    digitalWrite(led, HIGH);
    tone(buzzer, 1500, 200);
  } else {
    digitalWrite(led, LOW);
  }
  delay(100);
}`;
const corridorSVG = () => `<svg viewBox="0 0 1400 380" class="pirsvg">
  <rect width="1400" height="380" class="cwall"/>
  <rect y="300" width="1400" height="80" class="cfloor"/>
  ${[220, 620, 1020].map(x => `<rect x="${x}" y="80" width="150" height="220" rx="8" class="cdoor"/><circle cx="${x + 128}" cy="195" r="7" class="cknob"/>`).join('')}
  <polygon points="120,58 470,300 -20,300" class="cone" id="cone"/>
  <g transform="translate(120 40)"><rect x="-40" y="-14" width="80" height="18" rx="4" class="pirbox"/><path d="M-26 4 A26 26 0 0 0 26 4 Z" class="pirdome"/></g>
  <text x="120" y="22" class="plbl">PIR</text>
  <g class="alarm" id="alarm"><rect x="1270" y="30" width="60" height="26" rx="6" class="abase"/><path d="M1276 30 A24 24 0 0 1 1324 30 Z" class="alamp"/></g>
  <g id="thief" class="thief"><text x="0" y="0" class="tf">🥷</text><text x="0" y="46" class="tlbl">↔ اسحبني</text></g>
</svg>`;

/* ================== IR ================== */
const IR_CODE = `int left = 2;
int right = 3;

void setup() {
  pinMode(left, INPUT);
  pinMode(right, INPUT);
  Serial.begin(9600);
}

void loop() {
  int L = digitalRead(left);
  int R = digitalRead(right);
  if (L == LOW && R == LOW) {
    Serial.println("forward");
  } else if (L == HIGH) {
    Serial.println("turn left");
  } else {
    Serial.println("turn right");
  }
}`;
const trackSVG = () => `<svg viewBox="0 0 520 520" class="irsvg">
  <rect width="520" height="520" class="floor2"/>
  <path id="irline" class="iline" d=""/>
  <g id="bot"><rect x="-54" y="-70" width="108" height="140" rx="22" class="botbody"/>
    <rect x="-66" y="-46" width="16" height="44" rx="6" class="wheel2"/><rect x="50" y="-46" width="16" height="44" rx="6" class="wheel2"/>
    <rect x="-66" y="22" width="16" height="44" rx="6" class="wheel2"/><rect x="50" y="22" width="16" height="44" rx="6" class="wheel2"/>
    <circle id="sL" cx="-26" cy="-78" r="11" class="irs"/><circle id="sR" cx="26" cy="-78" r="11" class="irs"/>
    <text x="0" y="12" class="botarrow" id="barrow">⬆</text></g>
</svg>`;
const beamSVG = (id, black) => `<svg viewBox="0 0 220 170" class="beamsvg" id="${id}">
  <rect x="60" y="10" width="100" height="36" rx="6" class="irpcb"/><circle cx="92" cy="46" r="10" class="irtx"/><circle cx="128" cy="46" r="10" class="irrx"/>
  <rect x="10" y="130" width="200" height="30" class="${black ? 'surfb' : 'surfw'}"/>
  <path d="M92 56 L110 128" class="ray1"/>${black ? '<text x="110" y="120" class="absorb">✕</text>' : '<path d="M110 128 L128 56" class="ray2"/>'}
  <text x="110" y="156" class="stxt">${black ? 'أسود: يمتص الضوء' : 'أبيض: يعكس الضوء'}</text></svg>`;

/* ================== الصوت ================== */
const NOTES = [['دو', 'C', 262], ['ري', 'D', 294], ['مي', 'E', 330], ['فا', 'F', 349], ['صول', 'G', 392], ['لا', 'A', 440], ['سي', 'B', 494], ['دو', 'C5', 523]];
const MELODY = [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0];     // لحن شعبي مشهور (نجمة صغيرة) ملكية عامة
const MELODY_CODE = `int buzzer = 8;
int notes[] = {262, 262, 392, 392, 440, 440, 392};

void setup() {
  for (int i = 0; i < 7; i++) {
    tone(buzzer, notes[i], 300);
    delay(400);
  }
}

void loop() {
}`;
const CLAP_CODE = `int mic = A0;
int lamp = 13;
int limit = 600;
bool lampOn = false;

void setup() {
  pinMode(lamp, OUTPUT);
}

void loop() {
  int level = analogRead(mic);
  if (level > limit) {
    lampOn = !lampOn;
    digitalWrite(lamp, lampOn);
    delay(300);
  }
}`;

/* ---------- دوائر البناء: وحدة بثلاث أرجل (VCC · OUT · GND) ---------- */
const mod3 = (c, s, name, color, labels, extra = '') => `<g class="bs" data-s="${s}">
  <rect x="${col(c) - 30}" y="206" width="${col(c + 2) - col(c) + 60}" height="68" rx="8" fill="${color}"/>${extra}
  ${[0, 1, 2].map(i => `<line x1="${col(c + i)}" y1="274" x2="${col(c + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(c + i)}" y="266" class="lbl" style="font-size:11px;fill:#fff">${labels[i]}</text>`).join('')}
  <text x="${col(c + 1)}" y="194" class="lbl" style="font-size:17px">${name}</text></g>`;
const ledR = (c, s, cls, lbl) => `<circle class="glow2 ${cls}" cx="${col(c) + 13}" cy="250" r="56"/>
  <g class="bs" data-s="${s}"><line x1="${col(c)}" y1="288" x2="${col(c)}" y2="262" stroke="#9aa1b3" stroke-width="5"/><line x1="${col(c + 1)}" y1="288" x2="${col(c + 1)}" y2="266" stroke="#9aa1b3" stroke-width="5"/>
    <path class="led2 ${cls}" d="M${col(c) - 7} 266 L${col(c) - 7} 238 A20 20 0 0 1 ${col(c + 1) + 7} 238 L${col(c + 1) + 7} 266 Z"/>
    <text x="${col(c) + 13}" y="214" class="lbl" style="font-size:16px">${lbl}</text>
    <line x1="${col(c + 1)}" y1="336" x2="${col(c + 1)}" y2="352" stroke="#9aa1b3" stroke-width="5"/><rect x="${col(c + 1) - 10}" y="352" width="20" height="50" rx="9" fill="#d9b382"/>
    <rect x="${col(c + 1) - 10}" y="362" width="20" height="5" fill="#d62828"/><rect x="${col(c + 1) - 10}" y="372" width="20" height="5" fill="#d62828"/><rect x="${col(c + 1) - 10}" y="382" width="20" height="5" fill="#7b4a26"/>
    <line x1="${col(c + 1)}" y1="402" x2="${col(c + 1)}" y2="456" stroke="#9aa1b3" stroke-width="5"/></g>`;
const power3 = (c, s) => `${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, s, '#e74c3c')}${wire(`M${col(c)} 336 L${col(c)} 404`, s, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, s, '#1b2340')}${wire(`M${col(c + 2)} 336 L${col(c + 2)} 456`, s, '#1b2340')}`;
const gndTop = s => wire(`M${pinX(1)} 150 C ${pinX(1)} 20, 890 20, 890 300 C 890 430, 870 456, 845 456`, s, '#1b2340');

B2.pirwire = { flow: 6, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'حساس الحركة PIR', b: 'قبة بيضاء وثلاث أرجل: VCC وOUT وGND. عليه مقبضان: الحساسية، ومدة البقاء HIGH.' },
  { h: 'VCC إلى 5V · GND إلى GND', b: 'سلكا الطاقة إلى الخطين الموجب والسالب.' },
  { h: 'OUT إلى المنفذ 2', b: 'مخرج رقمي: HIGH حين يرى حركة، وLOW حين لا يرى.' },
  { h: 'ليد الإنذار على 13', b: 'ليد أحمر مع مقاومة 220 أوم.' },
  { h: 'مرّ أمامه!', b: 'انتظر دقيقة ليستقر الحساس أولًا، ثم مرّ أمامه: يضيء الإنذار.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 pirw">
  ${base({ 1: 'GND', 3: '13', 5: '2' }, { 0: '5V', 1: 'GND' })}
  ${mod3(3, 2, 'PIR', '#2e7d4f', ['VCC', 'OUT', 'GND'], `<path d="M${col(4) - 34} 218 A34 34 0 0 1 ${col(4) + 34} 218 Z" fill="#f4f1ea" stroke="#c9c3b3" stroke-width="3" transform="translate(0 -14)"/>`)}
  ${power3(3, 3)}
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 110, 420 120, 420 250 C 420 350, ${col(4) - 20} 336, ${col(4)} 336`, 4, '#e0b400')}
  ${ledR(10, 5, '', 'الإنذار')}
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 60, ${col(10)} 60, ${col(10)} 240`, 5, '#2e9e6b')}${gndTop(5)}
  <g class="walker"><text x="${col(4)}" y="130" style="font-size:70px" text-anchor="middle">🚶</text></g>
</svg>` };

B2.irwire = { flow: 5, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نبدأ كالعادة.' },
  { h: 'حساس الأشعة تحت الحمراء', b: 'فيه ليد يرسل ضوءًا لا نراه، ومستقبل ينتظر انعكاسه. أرجله: VCC وGND وOUT.' },
  { h: 'الطاقة', b: 'VCC إلى 5V، وGND إلى GND.' },
  { h: 'OUT إلى المنفذ 2 · وليد على 13', b: 'الليد يضيء حين يرى الحساس خطًّا أسود.' },
  { h: 'مرّر ورقة عليها خط أسود!', b: 'فوق الأبيض ينعكس الضوء فيقرأ LOW، وفوق الأسود يُمتص فيقرأ HIGH.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 irw">
  ${base({ 1: 'GND', 3: '13', 5: '2' }, { 0: '5V', 1: 'GND' })}
  ${mod3(3, 2, 'IR', '#1f5fae', ['VCC', 'GND', 'OUT'], `<circle cx="${col(3) + 8}" cy="226" r="10" fill="#dfe6f0"/><circle cx="${col(5) - 8}" cy="226" r="10" fill="#3a3f4d"/>`)}
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(3)} 336 L${col(3)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}${wire(`M${col(4)} 336 L${col(4)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(5)} 150 C ${pinX(5)} 110, 420 120, 420 250 C 420 350, ${col(5) - 20} 336, ${col(5)} 336`, 4, '#e0b400')}
  ${ledR(10, 4, '', 'خط أسود!')}
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 60, ${col(10)} 60, ${col(10)} 240`, 4, '#2e9e6b')}${gndTop(4)}
  <g class="paper"><rect x="${col(2)}" y="120" width="120" height="60" rx="4" fill="#fff" stroke="#c9c3b3" stroke-width="2"/><rect x="${col(2) + 48}" y="120" width="24" height="60" fill="#111"/></g>
</svg>` };

B2.clapwire = { flow: 5, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'البداية المعتادة.' },
  { h: 'حساس الصوت', b: 'ميكروفون صغير مع دائرة تكبير. نستخدم المخرج التماثلي AO لنعرف «كم» الصوت.' },
  { h: 'الطاقة', b: 'VCC إلى 5V، وGND إلى GND.' },
  { h: 'AO إلى A0 · ومصباح على 13', b: 'السلك الأصفر يحمل شدة الصوت، والليد يمثّل مصباح الغرفة.' },
  { h: 'صفّق!', b: 'تصفيقة تشعل المصباح، وتصفيقة ثانية تطفئه: هذا هو «المفتاح الرقمي» من المحور الأول، لكن بالصوت.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 clapw">
  ${base({ 1: 'GND', 3: '13' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  ${mod3(3, 2, 'حساس الصوت', '#b23b3b', ['AO', 'GND', 'VCC'], `<circle cx="${col(3) - 6}" cy="228" r="16" fill="#1c1f27"/><circle cx="${col(3) - 6}" cy="228" r="8" fill="#555c6b"/>`)}
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${col(5)} 336 L${col(5)} 404`, 3, '#e74c3c')}
  ${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}${wire(`M${col(4)} 336 L${col(4)} 456`, 3, '#1b2340')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 480, ${col(1)} 480, ${col(1)} 336 L${col(1)} 312 L${col(3)} 312`, 4, '#e0b400')}
  ${ledR(10, 4, 'white', 'المصباح')}
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 60, ${col(10)} 60, ${col(10)} 240`, 4, '#2e9e6b')}${gndTop(4)}
  <g class="claps"><text x="${col(3)}" y="140" style="font-size:66px" text-anchor="middle">👏</text></g>
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  pirlab: s => `<div class="slide light">
      <div class="kicker">🚨 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="pirgrid">
        <div class="pircode">${codeBlock(PIR_CODE, 'micro')}</div>
        <div class="pirright">
          <div class="pirwrap ix" id="pirw">${corridorSVG()}</div>
          <div class="pirfacts ix">
            <div class="ac"><span>digitalRead(pir)</span><b id="pr">0</b></div>
            <div class="ac gold"><span>الحالة</span><b id="ps" class="fanst">هادئ</b></div>
            <label class="lsl"><span>⏱️ مدة البقاء HIGH (مقبض الحساس): <b id="phv">3</b> ث</span><input type="range" id="ph" min="1" max="8" value="3"></label>
            <button class="sndbtn" id="psnd">🔇 تشغيل صوت الإنذار</button>
          </div>
          ${plotter('pplot', 'digitalRead', 1)}
        </div>
      </div></div>`,

  irlab: s => `<div class="slide light">
      <div class="kicker">🤖 محاكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="irgrid">
        <div class="ircode">${codeBlock(IR_CODE, 'micro')}</div>
        <div class="irmid">
          <div class="beams">${beamSVG('bw', false)}${beamSVG('bb', true)}</div>
          <div class="irfacts"><div class="ac"><span>L · اليسار</span><b id="iL">0</b></div><div class="ac"><span>R · اليمين</span><b id="iR">0</b></div></div>
          <div class="irdec" id="idec">امشِ للأمام ⬆</div>
          <div class="irbtns ix"><button class="sndbtn" id="iauto">▶ تشغيل الروبوت</button></div>
        </div>
        <div class="irtrack ix" id="itrack">${trackSVG()}<div class="irhint">اسحب الروبوت يمينًا ويسارًا… أو شغّله ليتبع الخط وحده</div></div>
      </div></div>`,

  soundlab: s => `<div class="slide light">
      <div class="kicker">🎵 مختبر الصوت</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="sgrid">
        <div class="spanel ix">
          <h3>🔊 البازر يعزف: tone(8, التردد)</h3>
          <div class="piano">${NOTES.map(([ar, en, f], i) => `<button class="key" data-i="${i}"><b>${ar}</b><small>${f} Hz</small></button>`).join('')}</div>
          <div class="tonecode" dir="ltr" id="tcode">${highlight('tone(8, 262, 300);')}</div>
          <button class="sndbtn" id="melody">▶ اعزف اللحن كاملًا بالمصفوفة</button>
          ${codeBlock(MELODY_CODE, 'micro')}
        </div>
        <div class="spanel ix">
          <h3>👏 مفتاح التصفيق: ضغطة… بالصوت</h3>
          <div class="clapin">
            <div class="clapctl">
              <div class="claprow">${bulbSVG('cbulb')}<div class="clapbtns"><button class="clap" id="clap">👏 صفّق</button><button class="sndbtn" id="mic">🎤 ميكروفون الجهاز</button></div></div>
              <label class="lsl"><span>🎚️ الحد (limit): <b id="clv">600</b></span><input type="range" id="cl" min="200" max="950" value="600"></label>
              ${plotter('cplot', 'analogRead(mic)', 1023)}
            </div>
            ${codeBlock(CLAP_CODE, 'micro')}
          </div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  pirlab(sl) {
    const svg = sl.querySelector('.pirsvg'), thief = sl.querySelector('#thief'), cone = sl.querySelector('#cone');
    const hold = sl.querySelector('#ph'), lines = sl.querySelectorAll('.code .ln'), plot = sl.querySelector('#pplot'), buf = [];
    let x = 1100, until = 0, sound = false, lastBeep = 0, raf = 0, prev = -1;
    const place = () => thief.setAttribute('transform', `translate(${x} 270)`);
    const inCone = () => x > -10 && x < 450;        // مدى الرؤية التقريبي للمخروط عند ارتفاع الجسم
    const drag = e => { const r = svg.getBoundingClientRect(); x = Math.max(40, Math.min(1340, (e.clientX - r.left) * 1400 / r.width)); place(); };
    let dn = false;
    svg.addEventListener('pointerdown', e => { dn = true; svg.setPointerCapture(e.pointerId); drag(e); });
    svg.addEventListener('pointermove', e => dn && drag(e));
    svg.addEventListener('pointerup', () => dn = false);
    hold.oninput = () => sl.querySelector('#phv').textContent = hold.value;
    sl.querySelector('#psnd').onclick = e => { sound = !sound; e.target.textContent = sound ? '🔊 إيقاف صوت الإنذار' : '🔇 تشغيل صوت الإنذار'; if (sound) audio(); };
    const loop = ts => {
      if (inCone()) until = ts + hold.value * 1000;
      const on = ts < until;
      if (on !== prev) {
        prev = on;
        sl.querySelector('#pr').textContent = on ? 1 : 0;
        const st = sl.querySelector('#ps'); st.textContent = on ? 'حركة! 🚨' : 'هادئ'; st.classList.toggle('on', on);
        svg.classList.toggle('alert', on); cone.classList.toggle('seen', inCone());
        lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', on ? [11, 12, 13].includes(n) : n === 15); });
      }
      cone.classList.toggle('seen', inCone());
      const left = Math.max(0, (until - ts) / 1000);
      sl.querySelector('#ps').title = on ? `يبقى HIGH ${left.toFixed(1)} ث` : '';
      if (on && sound && ts - lastBeep > 400) { beep(1500, 200, 0.05); lastBeep = ts; }
      raf = requestAnimationFrame(loop);
    };
    const t = setInterval(() => plotFeed(plot, buf, prev === true ? 1 : 0, 1), 90);
    place(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); clearInterval(t); });
  },

  irlab(sl) {
    const bot = sl.querySelector('#bot'), line = sl.querySelector('#irline'), svg = sl.querySelector('.irsvg');
    const lines = sl.querySelectorAll('.code .ln'), auto = sl.querySelector('#iauto');
    let bx = 260, t = 0, run = false, raf = 0, last = 0;
    const lineX = y => 260 + (run ? 110 * Math.sin((y + t) / 95) : 0);          // الخط مستقيم يدويًا، ومتعرّج في وضع التشغيل
    const drawLine = () => { let d = ''; for (let y = -10; y <= 530; y += 10) d += (y < 0 ? 'M' : 'L') + lineX(y) + ' ' + y; line.setAttribute('d', d); };
    const read = () => {
      const sy = 300 - 78, lx = lineX(sy);
      const L = Math.abs(bx - 26 - lx) < 22 ? 1 : 0, R = Math.abs(bx + 26 - lx) < 22 ? 1 : 0;     // 1 = HIGH فوق الأسود
      sl.querySelector('#iL').textContent = L; sl.querySelector('#iR').textContent = R;
      sl.querySelector('#sL').classList.toggle('blk', !!L); sl.querySelector('#sR').classList.toggle('blk', !!R);
      const dec = !L && !R ? ['امشِ للأمام ⬆', 13, '⬆'] : L ? ['انعطف يسارًا ⬅', 15, '⬅'] : ['انعطف يمينًا ➡', 17, '➡'];
      sl.querySelector('#idec').textContent = dec[0]; sl.querySelector('#barrow').textContent = dec[2];
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 11 || n === 12 || n === dec[1] || n === dec[1] + 1); });
      sl.querySelector('#bw').classList.toggle('dim', !!(L && R)); sl.querySelector('#bb').classList.toggle('dim', !L && !R);
      return [L, R];
    };
    const place = () => bot.setAttribute('transform', `translate(${bx} 300)`);
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)); last = ts;
      if (run) { t += dt * 0.12; const [L, R] = read(); if (L && !R) bx -= dt * 0.16; else if (R && !L) bx += dt * 0.16; }
      drawLine(); read(); place();
      raf = requestAnimationFrame(loop);
    };
    const drag = e => { if (run) return; const r = svg.getBoundingClientRect(); bx = Math.max(70, Math.min(450, (e.clientX - r.left) * 520 / r.width)); };
    let dn = false;
    svg.addEventListener('pointerdown', e => { dn = true; svg.setPointerCapture(e.pointerId); drag(e); });
    svg.addEventListener('pointermove', e => dn && drag(e));
    svg.addEventListener('pointerup', () => dn = false);
    auto.onclick = () => { run = !run; auto.textContent = run ? '⏸ إيقاف الروبوت' : '▶ تشغيل الروبوت'; if (run) bx = 260; };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  soundlab(sl) {
    const keys = [...sl.querySelectorAll('.key')], tcode = sl.querySelector('#tcode');
    const play = i => {
      if (i < 0) return;
      const [, , f] = NOTES[i]; beep(f, 300, 0.07, 'square');
      tcode.innerHTML = highlight(`tone(8, ${f}, 300);`);
      keys.forEach((k, j) => k.classList.toggle('on', j === i)); setTimeout(() => keys[i].classList.remove('on'), 280);
    };
    keys.forEach(k => k.addEventListener('pointerdown', () => play(+k.dataset.i)));
    let mt = [];
    sl.querySelector('#melody').onclick = () => { mt.forEach(clearTimeout); mt = MELODY.map((n, j) => setTimeout(() => play(n), j * 400)); };
    /* مفتاح التصفيق */
    let level = 30, lampOn = false, cool = 0, stream = null, an = null, data = null;
    const lim = sl.querySelector('#cl'), plot = sl.querySelector('#cplot'), th = plot.querySelector('.pth'), buf = [], bulb = sl.querySelector('#cbulb');
    const clines = sl.querySelectorAll('.spanel:nth-child(2) .ln');
    const setLim = () => { sl.querySelector('#clv').textContent = lim.value; th.style.display = ''; const y = 180 - lim.value / 1023 * 170; th.setAttribute('y1', y); th.setAttribute('y2', y); };
    lim.oninput = setLim; setLim();
    sl.querySelector('#clap').onclick = () => { level = 980; };
    sl.querySelector('#mic').onclick = async e => {
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; an = null; e.target.textContent = '🎤 ميكروفون الجهاز'; return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const a = audio(); an = a.createAnalyser(); an.fftSize = 512; a.createMediaStreamSource(stream).connect(an); data = new Uint8Array(an.fftSize);
        e.target.textContent = '🎤 الميكروفون يعمل… صفّق!';
      } catch (err) { e.target.textContent = '⚠️ لم يُسمح بالميكروفون'; }
    };
    const tick = setInterval(() => {
      if (an) { an.getByteTimeDomainData(data); let m = 0; for (const v of data) m = Math.max(m, Math.abs(v - 128)); level = Math.max(level * 0.6, Math.min(1023, m * 9)); }
      const v = Math.round(Math.max(20, level + (Math.random() - .5) * 20));
      plotFeed(plot, buf, v, 1023);
      const hit = v > +lim.value && Date.now() > cool;
      if (hit) { lampOn = !lampOn; cool = Date.now() + 300; bulb.style.setProperty('--b', lampOn ? 1 : 0); }
      clines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', n === 11 || (Date.now() < cool && [12, 13, 14, 15].includes(n))); });
      if (!an) level = Math.max(30, level * 0.55);
    }, 70);
    window.DECK_CLEANUP.push(() => { clearInterval(tick); mt.forEach(clearTimeout); if (stream) stream.getTracks().forEach(t => t.stop()); });
  },
});
})();
