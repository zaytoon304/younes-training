/* =====================================================================
   «لمسة تراث» — رجل الإطفاء وروبوتا الدعم (إضافة ٩ أكتوبر ٢٠٢٦)
   حين لا يستطيع القائد والروبوت الثاني السيطرة على النار: القائد يطلب الدعم بتيليجرام،
   فيأتي رجل الإطفاء ويقود روبوتين آخرين بحركة يده أمام كاميرا اللابتوب (MediaPipe):
     ✋ يد مفتوحة = تقدّم · ✊ قبضة = قف وابدأ الرش · القبضة يمينًا/يسارًا = الخرطوم يرتفع/ينخفض
   الروبوت ٣: خرطوم على سيرفو + ESP32-CAM يبث الحريق · الروبوت ٤: خرطوم على سيرفو فقط
   الأنواع: ffhero (المشهد الكامل متحركًا) · gesturelab (محاكي اليد)
   أداة واحدة للعربية والإنجليزية (DECK.lang === 'en')، والمشهدان يُصوَّران GIF (window.DY_ANIM + .dygif)
   ===================================================================== */
(function () {
const EN = (window.DECK || {}).lang === 'en';
const L = (ar, en) => EN ? en : ar;
const N = n => EN ? String(n) : window.ARD.AR(n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1);
const ease = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const { car4 } = window.TUR;
// صوت الراوي: زر يعمل بالنقر هنا، ويصير ملفًا صوتيًا بالنقر في البوربوينت ([data-audio])
const SND = n => `../${EN ? 'masmak-judges-en' : 'masmak-judges'}/audio/${n}.mp3`;
let ffAudio = null;
const ffPlay = src => { try { if (ffAudio) ffAudio.pause(); ffAudio = new Audio(src); ffAudio.play().catch(() => {}); } catch (e) {} };
const sndBtn = n => `<button class="ffsnd ix" data-audio="${SND(n)}">🎙️ ${L('الراوي', 'Narrator')}</button>`;

function runLoop(draw, period) {
  let raf = 0, t0 = 0;
  const tick = now => { t0 = t0 || now; if (!window.DY_HOLD) draw((now - t0) / 1000); raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  window.DY_ANIM = { draw, period };
  window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); window.DY_ANIM = null; });
}

/* ---------- رسومات ---------- */
const fire = (x, y, k, t) => {
  const f = Math.sin(t * 9) * .08 + 1;
  return k <= .02 ? '' : `<g transform="translate(${x} ${y}) scale(${k * f} ${k})"><path d="M0 0 C -30 -50, 16 -86, 0 -140 C 52 -90, 44 -40, 0 0 Z" fill="#ff5722"/>
    <path d="M-34 0 C -50 -34, -26 -60, -30 -92 C 4 -60, 4 -26, -34 0 Z" fill="#ff7043"/><path d="M34 0 C 50 -34, 26 -60, 30 -92 C -4 -60, -4 -26, 34 0 Z" fill="#ff7043"/>
    <path d="M0 -8 C -12 -36, 8 -52, 0 -80 C 22 -52, 18 -28, 0 -8 Z" fill="#ffd54f"/></g>`;
};
const smoke = (x, y, k, t) => k <= .02 ? '' : [0, 1, 2].map(i => `<circle cx="${x + Math.sin(t + i) * 20}" cy="${y - 120 * k - i * 40 - (t * 20 % 40)}" r="${(26 + i * 10) * k}" fill="#6d6d7a" opacity="${.35 - i * .08}"/>`).join('');
const water = (x1, y1, x2, y2, t, op = 1) => `<path d="M${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 80} ${x2} ${y2}" stroke="#4fc3f7" stroke-width="7" fill="none" stroke-dasharray="12 9" stroke-dashoffset="${-t * 80}" opacity="${op}"/>`;
// روبوت دعم: هيكل + خرطوم على سيرفو بزاوية ang (درجات) + كاميرا اختيارية
function helper(x, y, ang, cam, label, col) {
  return `<g transform="translate(${x} ${y})">${car4('h' + label, col)}
    <g transform="translate(6 -24) rotate(${-ang})"><rect x="0" y="-5" width="54" height="10" rx="5" fill="#c62828" stroke="#7f1d1d" stroke-width="2"/><circle r="9" fill="#37474f"/></g>
    ${cam ? `<g transform="translate(-26 -30)"><rect x="-14" y="-12" width="28" height="22" rx="4" fill="#263238" stroke="#90a4ae" stroke-width="2"/><circle r="6" fill="#4fc3f7"/><circle cx="10" cy="-8" r="2.5" fill="#ff5252"/></g>` : ''}
    <text y="${54}" style="font:800 18px Cairo,sans-serif;fill:#f3ead2;text-anchor:middle">${label}</text></g>`;
}
function hand(open, x, y, k = 1) {
  const sk = '#f2c9a0', ln = '#b8865b';
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <rect x="-38" y="-20" width="76" height="70" rx="26" fill="${sk}" stroke="${ln}" stroke-width="3"/>
    ${open ? [-28, -10, 8, 26].map((fx, i) => `<rect x="${fx - 8}" y="${-86 + Math.abs(i - 1.5) * 8}" width="17" height="72" rx="8.5" fill="${sk}" stroke="${ln}" stroke-width="3"/>`).join('')
           : [-26, -9, 8, 25].map(fx => `<rect x="${fx - 9}" y="-40" width="18" height="30" rx="9" fill="${sk}" stroke="${ln}" stroke-width="3"/>`).join('')}
    <rect x="${open ? 34 : 24}" y="${open ? -6 : -14}" width="16" height="${open ? 50 : 34}" rx="8" transform="rotate(${open ? -40 : -70} 42 18)" fill="${sk}" stroke="${ln}" stroke-width="3"/>
    <rect x="-30" y="48" width="60" height="44" fill="#1e3a8a"/></g>`;
}
function laptop(x, y, inner, k = 1) {
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-150" y="-110" width="300" height="190" rx="12" fill="#1c1f27" stroke="#55607a" stroke-width="4"/>
    <rect x="-138" y="-98" width="276" height="166" rx="4" fill="#0b0f20"/>${inner}
    <circle cx="0" cy="-104" r="4" fill="#7ee2a8"/><path d="M-180 80 h360 l-22 22 h-316z" fill="#2a3150"/>
    <text y="124" style="font:700 15px Cairo,sans-serif;fill:#9aa8d8;text-anchor:middle">ASUS · ${L('كاميرا اللابتوب + MediaPipe', 'webcam + MediaPipe')}</text></g>`;
}
function phone(x, y, msg, show) {
  return show ? `<g transform="translate(${x} ${y})"><rect x="-80" y="-120" width="160" height="240" rx="20" fill="#111" stroke="#9aa8b8" stroke-width="4"/>
    <rect x="-70" y="-104" width="140" height="196" rx="6" fill="#e3f2fd"/><rect x="-70" y="-104" width="140" height="28" fill="#2aabee"/>
    <text y="-84" style="font:800 13px Cairo,sans-serif;fill:#fff;text-anchor:middle">🛡️ ${L('حارس المصمك', 'Masmak Guard')}</text>
    <foreignObject x="-66" y="-70" width="132" height="160"><div xmlns="http://www.w3.org/1999/xhtml" style="font:700 12.5px Cairo,sans-serif;background:#fff;border-radius:10px;padding:6px 8px;color:#1c1f27;line-height:1.45;direction:${EN ? 'ltr' : 'rtl'}">${msg}</div></foreignObject></g>` : '';
}

/* ---------- المشهد الكامل: من «لم نستطع» إلى «تمت السيطرة» ---------- */
const FP = 40;
function ffState(t) {
  const ph = t % FP;
  // حجم النار: تكبر رغم الرش، ثم يطفئها روبوتا الدعم
  const fk = ph < 6 ? .7 + ph * .06 : ph < 26 ? 1.06 + Math.sin(ph * 2) * .03 : ph < 34 ? lerp(1.06, 0, (ph - 26) / 8) : 0;
  const lead = ph < 6 ? 'spray' : ph < 9 ? 'call' : ph < 13 ? 'back' : 'home';
  const lx = lead === 'back' ? lerp(900, 1240, ease((ph - 9) / 4)) : lead === 'home' ? 1240 : 900;
  const hx = ph < 13 ? -140 : ph < 20 ? lerp(-140, 470, ease((ph - 13) / 7)) : ph < 34 ? 470 : ph < 38 ? lerp(470, -140, ease((ph - 34) / 4)) : -140;
  const g = ph < 20 ? 'open' : ph < 34 ? 'fist' : 'open';
  const hose = ph < 22 ? 10 : ph < 26 ? lerp(10, 38, (ph - 22) / 4) : ph < 29 ? lerp(38, 18, (ph - 26) / 3) : 26;
  const spray = ph >= 24 && ph < 34;
  const handX = ph < 22 ? 0 : ph < 26 ? 34 : ph < 29 ? -34 : 0;
  const tg1 = ph >= 7 && ph < 30, tg2 = ph >= 34;
  const timer = ph < 6 ? Math.max(0, Math.round(30 - ph * 5)) : 0;
  let cap;
  if (ph < 6) cap = ['💧🌀', L(`القائد والروبوت ٢ يرشّان… لكن النار تكبر · المهلة ${N(timer)} ث`, `The leader and robot 2 spray… but the fire keeps growing · time left ${timer} s`)];
  else if (ph < 9) cap = ['📱', L('انتهت المهلة: القائد يقرر وحده أنه يحتاج دعمًا… ويرسل تيليجرام للدفاع المدني', 'Time is up: the leader decides by itself it needs help… and sends Telegram to Civil Defense')];
  else if (ph < 13) cap = ['↩️', L('الروبوتان يعودان للخلف بأمان… والمهمة تنتقل لرجل الإطفاء', 'Both robots back away safely… the mission passes to the firefighter')];
  else if (ph < 20) cap = ['✋', L('رجل الإطفاء يفتح يده أمام كاميرا اللابتوب: الروبوتان ٣ و٤ يتقدمان، والكاميرا تبث الحريق', 'The firefighter opens his hand at the laptop camera: robots 3 and 4 advance, the camera streams the fire')];
  else if (ph < 22) cap = ['✊', L('قبضة: الروبوتان يقفان أمام النار', 'A fist: both robots stop in front of the fire')];
  else if (ph < 26) cap = ['✊➡️', L('القبضة يمينًا: السيرفو يرفع الخرطوم… والرش يبدأ', 'Fist to the right: the servo raises the hose… spraying starts')];
  else if (ph < 29) cap = ['✊⬅️', L('القبضة يسارًا: الخرطوم ينخفض نحو قاعدة النار', 'Fist to the left: the hose lowers to the base of the fire')];
  else if (ph < 34) cap = ['💦', L('الماء يصل… والنار تنطفئ', 'The water reaches… and the fire goes out')];
  else cap = ['✅', L('تمت السيطرة: رسالة ثانية «المتحف آمن» وكل روبوت يعود إلى مكانه', 'Under control: a second message, “the museum is safe”, and every robot returns home')];
  return { ph, fk, lead, lx, hx, g, hose, spray, handX, tg1, tg2, timer, cap };
}
function ffSVG(t) {
  const S = ffState(t), FX = 760, FY = 440;
  const camView = `<defs><clipPath id="ffclip"><rect x="-130" y="-92" width="260" height="150"/></clipPath></defs><rect x="-130" y="-92" width="260" height="150" fill="#1a1208"/><g clip-path="url(#ffclip)">${fire(0, 52, S.fk * .7, t)}${smoke(0, 52, S.fk * .7, t)}</g>
    <text x="-122" y="-74" style="font:700 12px monospace;fill:#ff5252">● LIVE</text><text x="122" y="-74" style="font:700 11px monospace;fill:#9aa8b8;text-anchor:end">ESP32-CAM</text>
    <g transform="translate(${88 + S.handX * .6} 30)">${hand(S.g === 'open', 0, 0, .34)}</g>`;
  return `<rect width="1600" height="640" fill="#0d1226"/>
    <rect y="500" width="1600" height="140" fill="#3a2a18"/><rect y="500" width="1600" height="8" fill="#5a3a1c"/>
    <g opacity=".9">${window.TUR.masmak ? window.TUR.masmak(560, 230, .62) : ''}</g>
    ${smoke(FX, FY + 60, S.fk, t)}${fire(FX, FY + 60, S.fk, t)}
    ${S.lead === 'spray' ? water(870, 470, FX + 20, FY + 20, t) + water(1010, 480, FX + 40, FY + 30, t, .8) : ''}
    <g transform="translate(${S.lx} 500) scale(-1 1)">${car4('ffl')}</g><text x="${S.lx}" y="560" style="font:800 18px Cairo,sans-serif;fill:#ff8a80;text-anchor:middle">${L('القائد', 'Leader')}</text>
    <g transform="translate(${S.lx + 140} 512) scale(-1 1)">${car4('ff2', 'r2')}</g><text x="${S.lx + 140}" y="572" style="font:800 18px Cairo,sans-serif;fill:#82b1ff;text-anchor:middle">${L('الروبوت ٢', 'Robot 2')}</text>
    ${helper(S.hx, 500, S.hose, true, '3', 'r2')}${helper(S.hx - 150, 520, S.hose, false, '4', '')}
    ${S.spray ? (() => { const a = S.hose * Math.PI / 180, x1 = S.hx + 6 + 54 * Math.cos(a), y1 = 476 - 54 * Math.sin(a); return water(x1, y1, FX - 30, FY + 30 - S.hose, t) + water(x1 - 150, y1 + 20, FX - 50, FY + 50 - S.hose, t, .8); })() : ''}
    ${laptop(190, 200, camView, 1)}
    <g transform="translate(190 372)"><text style="font:800 24px Cairo,sans-serif;fill:#f0cc7a;text-anchor:middle">🧑‍🚒 ${L('رجل الإطفاء', 'Firefighter')}</text></g>
    ${phone(1440, 220, S.tg2 ? L('✅ تمت السيطرة على الحريق.<br><b>المتحف آمن الآن</b> 🙏', '✅ The fire is under control.<br><b>The museum is safe now</b> 🙏')
                            : L('🚨 لم نستطع السيطرة على الحريق في متحف المصمك.<br><b>نحتاج دعمًا عاجلًا</b> 🚒', '🚨 We could not control the fire at the Masmak Museum.<br><b>Urgent support needed</b> 🚒'), S.tg1 || S.tg2)}
    ${S.timer ? `<g transform="translate(1000 90)"><rect x="-80" y="-34" width="160" height="56" rx="12" fill="#1c1f27" stroke="#ff5252" stroke-width="3"/><text y="6" style="font:900 30px monospace;fill:#ff5252;text-anchor:middle">⏱ ${S.timer}s</text></g>` : ''}`;
}

/* ---------- محاكي اليد ---------- */
const GP = 20;
function gestureAuto(t) {
  const ph = t % GP;
  if (ph < 6) return { g: 'open', dx: 0 };
  if (ph < 8) return { g: 'fist', dx: 0 };
  if (ph < 12) return { g: 'fist', dx: 1 };
  if (ph < 16) return { g: 'fist', dx: -1 };
  return { g: 'fist', dx: 0 };
}
function gestureSVG(t, st) {
  const fk = st.fire;
  return `<rect width="1000" height="560" fill="#0d1226"/><rect y="440" width="1000" height="120" fill="#3a2a18"/>
    ${smoke(820, 470, fk, t)}${fire(820, 470, fk, t)}
    ${helper(st.x, 440, st.hose, true, '3', 'r2')}${helper(st.x - 150, 458, st.hose, false, '4', '')}
    ${st.water ? (() => { const a = st.hose * Math.PI / 180, x1 = st.x + 6 + 54 * Math.cos(a), y1 = 416 - 54 * Math.sin(a); return water(x1, y1, 790, 440 - st.hose * 1.2, t) + water(x1 - 150, y1 + 20, 770, 460 - st.hose * 1.2, t, .8); })() : ''}
    <g transform="translate(130 150)"><rect x="-110" y="-110" width="220" height="200" rx="14" fill="#1c1f27" stroke="#55607a" stroke-width="3"/>
      <text y="-86" style="font:700 14px Cairo,sans-serif;fill:#9aa8d8;text-anchor:middle">📷 ${L('كاميرا اللابتوب', 'Laptop camera')}</text>
      <g transform="translate(${st.dx * 40} 20)">${hand(st.g === 'open', 0, 0, .7)}</g></g>
    <g transform="translate(130 330)"><rect x="-110" y="-24" width="220" height="48" rx="12" fill="#7ee2a8"/><text y="8" style="font:900 24px monospace;fill:#06301b;text-anchor:middle">${st.cmd}</text></g>
    <text x="130" y="390" style="font:700 15px Cairo,sans-serif;fill:#9aa8d8;text-anchor:middle">${L('الأمر عبر الشبكة إلى الروبوتين', 'command over Wi-Fi to both robots')}</text>`;
}

Object.assign(window.DECK_TYPES, {
  ffhero: s => `<div class="slide dark ffhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="ffh1">${s.title}</h1>
      <div class="dygif ffwrap"><svg viewBox="0 0 1600 640" class="ffsvg" id="ffs"></svg><div class="ffcap" id="ffc"><span class="i"></span><span class="tx"></span></div></div><div class="ffbar">${sndBtn('ff1')}</div></div>`,

  gesturelab: s => `<div class="slide light">
      <div class="kicker">${s.kicker || L('✋ التحكم بحركة اليد', '✋ Hand-gesture control')}</div>
      <h2 class="title" style="margin-bottom:12px">${s.title}</h2>
      <div class="gsgrid">
        <div class="dygif ix gsview"><svg viewBox="0 0 1000 560" class="ffsvg" id="gss"></svg></div>
        <div class="gsside ix">
          <div class="gsmap">
            <div data-g="open"><span>✋</span><b>${L('يد مفتوحة', 'Open hand')}</b><small>${L('الروبوتان يتقدمان', 'robots advance')}</small><code>F</code></div>
            <div data-g="fist"><span>✊</span><b>${L('قبضة', 'Fist')}</b><small>${L('يقفان ويبدأ الرش', 'stop and spray')}</small><code>W</code></div>
            <div data-g="up"><span>✊➡️</span><b>${L('القبضة يمينًا', 'Fist right')}</b><small>${L('الخرطوم يرتفع', 'hose up')}</small><code>U</code></div>
            <div data-g="down"><span>✊⬅️</span><b>${L('القبضة يسارًا', 'Fist left')}</b><small>${L('الخرطوم ينخفض', 'hose down')}</small><code>D</code></div>
          </div>
          <div class="gsbtns"><button class="gsb" data-a="open">✋</button><button class="gsb" data-a="fist">✊</button><button class="gsb" data-a="up">✊➡️</button><button class="gsb" data-a="down">✊⬅️</button><button class="gsb ghost" data-a="auto">▶ ${L('تلقائي', 'Auto')}</button>${sndBtn('ff2')}</div>
          <div class="gsfacts"><div><span>${L('زاوية الخرطوم', 'Hose angle')}</span><b id="gsang"></b></div><div><span>${L('النار', 'Fire')}</span><b id="gsfire"></b></div></div>
        </div></div></div>`,
});

Object.assign(window.DECK_BIND, {
  ffhero(sl) {
    sl.querySelectorAll('[data-audio]').forEach(b => b.onclick = e => { e.stopPropagation(); ffPlay(b.dataset.audio); });
    window.DECK_CLEANUP.push(() => { if (ffAudio) ffAudio.pause(); });
    const svg = sl.querySelector('#ffs'), cap = sl.querySelector('#ffc');
    runLoop(t => { svg.innerHTML = ffSVG(t); const c = ffState(t).cap; cap.querySelector('.i').textContent = c[0]; cap.querySelector('.tx').textContent = c[1]; }, FP);
  },
  gesturelab(sl) {
    sl.querySelectorAll('[data-audio]').forEach(b => b.onclick = e => { e.stopPropagation(); ffPlay(b.dataset.audio); });
    window.DECK_CLEANUP.push(() => { if (ffAudio) ffAudio.pause(); });
    const svg = sl.querySelector('#gss'), rows = sl.querySelectorAll('.gsmap div');
    let man = null, last = 0;
    // حالة محاكاة بسيطة تتحدث كل إطار
    const st = { x: 160, hose: 12, fire: 1, water: false, g: 'open', dx: 0, cmd: 'F' };
    sl.querySelectorAll('.gsb').forEach(b => b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'auto') { man = null; return; }
      man = a === 'open' ? { g: 'open', dx: 0 } : a === 'fist' ? { g: 'fist', dx: 0 } : { g: 'fist', dx: a === 'up' ? 1 : -1 };
    });
    runLoop(t => {
      if (t < last) { st.x = 160; st.hose = 12; st.fire = 1; }     // بداية دورة جديدة (للتصوير)
      const dt = clamp(t - last, 0, .1); last = t;
      const G = man || gestureAuto(t);
      st.g = G.g; st.dx = G.dx;
      if (!man && (t % GP) < .05) { st.x = 160; st.hose = 12; st.fire = 1; }
      if (G.g === 'open') { st.cmd = 'F'; st.water = false; st.x = Math.min(560, st.x + 70 * dt); }
      else { st.water = true; st.cmd = G.dx > 0 ? 'W + U' : G.dx < 0 ? 'W + D' : 'W';
        st.hose = clamp(st.hose + G.dx * 9 * dt, 0, 45);
        if (st.x > 450) st.fire = Math.max(0, st.fire - dt * (Math.abs(st.hose - 26) < 12 ? .12 : .03)); }
      if (man && st.fire === 0) st.fire = 0;
      svg.innerHTML = gestureSVG(t, st);
      const key = G.g === 'open' ? 'open' : G.dx > 0 ? 'up' : G.dx < 0 ? 'down' : 'fist';
      rows.forEach(r => r.classList.toggle('on', r.dataset.g === key));
      sl.querySelector('#gsang').textContent = N(Math.round(st.hose)) + '°';
      sl.querySelector('#gsfire').textContent = st.fire > .05 ? N(Math.round(st.fire * 100)) + (EN ? '%' : '٪') : L('انطفأت ✅', 'out ✅');
    }, GP);
  },
});
})();
