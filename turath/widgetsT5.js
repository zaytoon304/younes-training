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

/* ---------- القصة الكاملة في مشهد واحد (٤ فصول، ٨٠ ثانية) ----------
   ١ لهب فقط: القائد يذهب ويطفئ ويعود للخلف
   ٢ غاز فقط: القائد يعطي الروبوت ٢ الإذن، فيذهب ويشغّل المروحة ويعود
   ٣ لهب وغاز: القائد للهب ويأمر الثاني بالغاز + رسالة تيليجرام أولى
   ٤ النار أكبر: انتهت المهلة ← «نحتاج دعمًا» ← رجل الإطفاء يقود الروبوتين ٣ و٤ بيده ← «المتحف آمن» */
const SP = 80, HOME = 1180, STOP = 760, FIRE_X = 640, LY = 330, GY = 470;
const seg = (ph, a, b) => clamp((ph - a) / (b - a), 0, 1);
function storyState(t) {
  const ph = t % SP;
  const ch = ph < 15 ? 1 : ph < 30 ? 2 : ph < 45 ? 3 : 4;
  let fire = 0, gas = 0, lx = HOME, rx = HOME, lspray = false, fan = false, pkt = null, msg = 0, timer = 0;
  let hx = -160, g = 'open', hose = 10, hspray = false, handX = 0, ff = 0;
  if (ch === 1) {
    fire = ph < 5 ? .8 * seg(ph, .5, 1.5) : .8 * (1 - seg(ph, 5, 9));
    lx = ph < 5 ? lerp(HOME, STOP, ease(seg(ph, 1.5, 5))) : ph < 9 ? STOP : lerp(STOP, HOME, ease(seg(ph, 9, 13)));
    lspray = ph >= 5 && ph < 9;
  } else if (ch === 2) {
    gas = ph < 20.5 ? seg(ph, 15.5, 16.5) : 1 - seg(ph, 20.5, 25);
    if (ph >= 16 && ph < 17) pkt = { k: seg(ph, 16, 17), txt: L('✅ إذن', '✅ GO') };
    rx = ph < 20.5 ? lerp(HOME, STOP, ease(seg(ph, 17, 20.5))) : ph < 25 ? STOP : lerp(STOP, HOME, ease(seg(ph, 25, 28.5)));
    fan = ph >= 20.5 && ph < 25;
  } else if (ch === 3) {
    gas = ph < 35.5 ? seg(ph, 30.5, 31.5) : 1 - seg(ph, 35.5, 40);
    fire = ph < 35.5 ? .8 * seg(ph, 30.5, 31.5) : lerp(.8, 1.25, seg(ph, 35.5, 45));
    if (ph >= 31 && ph < 32) pkt = { k: seg(ph, 31, 32), txt: 'GO GAS' };
    lx = rx = lerp(HOME, STOP, ease(seg(ph, 32, 35.5)));
    lspray = ph >= 35.5; fan = ph >= 35.5 && ph < 40;
    msg = ph >= 31.5 ? 1 : 0;
    timer = ph >= 35.5 ? Math.max(0, Math.ceil(30 - (ph - 35.5) * 30 / 9.5)) : 0;
  } else {
    fire = ph < 61 ? 1.25 + Math.sin(ph * 2) * .04 : 1.25 * (1 - seg(ph, 61, 70));
    msg = ph < 70 ? 2 : 3;
    lx = rx = lerp(STOP, HOME, ease(seg(ph, 46.5, 50)));
    ff = seg(ph, 49, 51);
    hx = ph < 53 ? lerp(-160, -20, seg(ph, 50, 53)) : ph < 59 ? lerp(-20, 470, ease(seg(ph, 53, 59))) : ph < 72 ? 470 : lerp(470, -160, ease(seg(ph, 72, 77)));
    g = ph >= 59 && ph < 72 ? 'fist' : 'open';
    hose = ph < 61 ? 10 : ph < 65 ? lerp(10, 40, seg(ph, 61, 65)) : ph < 68 ? lerp(40, 22, seg(ph, 65, 68)) : 22;
    handX = ph >= 61 && ph < 65 ? 1 : ph >= 65 && ph < 68 ? -1 : 0;
    hspray = ph >= 61 && ph < 72;
  }
  let cap;
  const C = (i, ar, en) => [i, L(ar, en)];
  if (ch === 1) cap = ph < 1.5 ? C('🔥', 'المحطة ترى لهبًا… الشاشة تعلن الخطر', 'The station sees a flame… the screen announces the danger')
    : ph < 5 ? C('🔴', 'القائد يذهب بنفسه حتى الشريط الأسود', 'The leader drives itself to the black strip')
    : ph < 9 ? C('💧', 'المضخة تعمل… والنار تنطفئ', 'The pump runs… the fire goes out')
    : ph < 13 ? C('↩️', 'يعود للخلف بالاتجاه نفسه… دون أن يستدير', 'It backs up the same way… without turning around')
    : C('✅', 'المتحف آمن', 'The museum is safe');
  else if (ch === 2) cap = ph < 16 ? C('💨', 'تسرّب غاز… القائد يبقى مكانه', 'A gas leak… the leader stays in place')
    : ph < 17 ? C('📡', 'القائد يعطي الروبوت ٢ الإذن عبر ESP-NOW', 'The leader gives robot 2 permission over ESP-NOW')
    : ph < 20.5 ? C('🔵', 'الروبوت ٢ ينطلق إلى الغاز', 'Robot 2 heads to the gas')
    : ph < 25 ? C('🌀', 'المروحة تبدد الغاز', 'The fan clears the gas')
    : C('↩️', 'الروبوت ٢ يعود إلى مكانه', 'Robot 2 returns to its place');
  else if (ch === 3) cap = ph < 32 ? C('🔥💨', 'لهب وغاز معًا! القائد يقرر: اللهب لي… ويأمر الروبوت ٢: إلى الغاز', 'Fire and gas together! The leader decides: the fire is mine… robot 2, to the gas')
    : ph < 35.5 ? C('📱', 'رسالة تيليجرام للدفاع المدني: الروبوتات تتعامل مع الموقف', 'A Telegram message to Civil Defense: the robots are handling it')
    : ph < 40 ? C('💧🌀', 'الغاز يتبدد… لكن النار تكبر', 'The gas clears… but the fire keeps growing')
    : C('⏱️', `المهلة تنفد… ${N(timer)} ث`, `Time is running out… ${timer} s`);
  else cap = ph < 46.5 ? C('🚨', 'القائد يقرر وحده: نحتاج دعمًا… ويرسل تيليجرام', 'The leader decides alone: we need help… and sends Telegram')
    : ph < 50 ? C('↩️', 'الروبوتان يعودان للخلف بأمان', 'Both robots back away safely')
    : ph < 53 ? C('🧑‍🚒', 'رجل الدفاع المدني يصل… ومعه الروبوتان ٣ و٤', 'The Civil Defense officer arrives… with robots 3 and 4')
    : ph < 59 ? C('✋', 'يد مفتوحة أمام كاميرا اللابتوب: الروبوتان يتقدمان، والكاميرا تبث النار', 'An open hand at the laptop camera: the robots advance, the camera streams the fire')
    : ph < 61 ? C('✊', 'قبضة: الروبوتان يقفان أمام النار', 'A fist: both robots stop in front of the fire')
    : ph < 65 ? C('✊➡️', 'القبضة يمينًا: الخرطوم يرتفع… والرش يبدأ', 'Fist to the right: the hose rises… spraying starts')
    : ph < 68 ? C('✊⬅️', 'القبضة يسارًا: الخرطوم ينخفض نحو قاعدة النار', 'Fist to the left: the hose lowers to the base of the fire')
    : ph < 72 ? C('✅', 'تمت السيطرة… رسالة: المتحف آمن الآن', 'Under control… message: the museum is safe now')
    : C('🛡️', 'كل روبوت يعود إلى مكانه… لمسة تراث: تقنية تحمي التاريخ', 'Every robot returns home… Touch of Heritage: technology protecting history');
  return { ph, ch, fire, gas, lx, rx, lspray, fan, pkt, msg, timer, hx, g, hose, hspray, handX, ff, cap };
}
const CH = [L('لهب فقط', 'Fire only'), L('غاز فقط', 'Gas only'), L('لهب وغاز معًا', 'Fire and gas'), L('النار أكبر من الروبوتات', 'A fire too big for the robots')];
const MSGS = [
  '',
  L('🚨 بلاغ: لهب وغاز في متحف المصمك.<br>🤖 الروبوتات تتعامل مع الموقف الآن', '🚨 Report: fire and gas at the Masmak Museum.<br>🤖 The robots are handling it now'),
  L('🚨 لم نستطع السيطرة على الحريق.<br><b>نحتاج دعمًا عاجلًا</b> 🚒', '🚨 We could not control the fire.<br><b>Urgent support needed</b> 🚒'),
  L('✅ تمت السيطرة على الحريق.<br><b>المتحف آمن الآن</b> 🙏', '✅ The fire is under control.<br><b>The museum is safe now</b> 🙏'),
];
function storySVG(t) {
  const S = storyState(t);
  const lcd = S.fire > .05 && S.gas > .05 ? 'FIRE + GAS' : S.fire > .05 ? 'FIRE ALERT' : S.gas > .05 ? 'GAS ALERT' : 'SAFE';
  const lane = (y, col) => `<line x1="${STOP - 60}" y1="${y + 20}" x2="${HOME + 70}" y2="${y + 20}" stroke="#1c1f27" stroke-width="10"/><rect x="${STOP - 74}" y="${y + 6}" width="14" height="28" fill="#111"/><text x="${HOME + 90}" y="${y + 26}" style="font:800 16px Cairo,sans-serif;fill:${col}">🏠</text>`;
  const pk = S.pkt ? (() => { const x = S.lx - 10, y1 = LY - 30, y2 = GY - 30, y = lerp(y1, y2, S.pkt.k) - Math.sin(S.pkt.k * Math.PI) * 40;
    return `<g transform="translate(${x + Math.sin(S.pkt.k * Math.PI) * 60} ${y})"><rect x="-52" y="-16" width="104" height="32" rx="16" fill="#7ee2a8"/><text y="6" style="font:800 16px Cairo,sans-serif;fill:#06301b;text-anchor:middle">${S.pkt.txt}</text></g>`; })() : '';
  const camView = `<defs><clipPath id="stclip"><rect x="-130" y="-92" width="260" height="150"/></clipPath></defs><rect x="-130" y="-92" width="260" height="150" fill="#1a1208"/><g clip-path="url(#stclip)">${fire(0, 52, S.fire * .6, t)}</g>
    <text x="-122" y="-74" style="font:700 12px monospace;fill:#ff5252">● LIVE</text><text x="122" y="-74" style="font:700 11px monospace;fill:#9aa8b8;text-anchor:end">ESP32-CAM</text>
    <g transform="translate(${88 + S.handX * 22} 30)">${hand(S.g === 'open', 0, 0, .34)}</g>`;
  return `<rect width="1600" height="700" fill="#0d1226"/><rect y="560" width="1600" height="140" fill="#3a2a18"/>
    <rect x="460" y="190" width="900" height="360" rx="18" fill="#e8cfa4" opacity=".1" stroke="#b5895a" stroke-width="3" stroke-dasharray="10 8"/>
    ${lane(LY, '#ff8a80')}${lane(GY, '#82b1ff')}
    <g transform="translate(${FIRE_X} ${LY + 30})">${smoke(0, 0, S.fire, t)}${fire(0, 0, S.fire, t)}</g>
    ${S.gas > .02 ? [0, 1, 2, 3].map(i => `<circle cx="${FIRE_X - 20 + i * 26}" cy="${GY + 10 - i * 14}" r="${30 + i * 8}" fill="#9ccc65" opacity="${.35 * S.gas}"/>`).join('') : ''}
    ${S.lspray ? water(S.lx - 50, LY - 10, FIRE_X + 30, LY + 10, t) : ''}
    ${S.fan ? [0, 1, 2].map(i => `<path d="M${S.rx - 50} ${GY - 10 + i * 14} q -40 -10 -90 0" stroke="#e0f2f1" stroke-width="4" fill="none" stroke-dasharray="8 8" stroke-dashoffset="${t * 40}"/>`).join('') : ''}
    <g transform="translate(${S.lx} ${LY + 20}) scale(-1 1)">${car4('stl')}</g><text x="${S.lx}" y="${LY + 78}" style="font:800 18px Cairo,sans-serif;fill:#ff8a80;text-anchor:middle">${L('القائد', 'Leader')}</text>
    <g transform="translate(${S.rx} ${GY + 20}) scale(-1 1)">${car4('str', 'r2')}</g><text x="${S.rx}" y="${GY + 78}" style="font:800 18px Cairo,sans-serif;fill:#82b1ff;text-anchor:middle">${L('الروبوت ٢', 'Robot 2')}</text>
    ${pk}
    ${S.ch === 4 ? helper(S.hx, LY + 20, S.hose, true, '3', 'r2') + helper(S.hx - 150, LY + 40, S.hose, false, '4', '') : ''}
    ${S.hspray ? (() => { const a = S.hose * Math.PI / 180, x1 = S.hx + 6 + 54 * Math.cos(a), y1 = LY - 4 - 54 * Math.sin(a); return water(x1, y1, FIRE_X - 20, LY + 20 - S.hose * .6, t) + water(x1 - 150, y1 + 20, FIRE_X - 30, LY + 30 - S.hose * .6, t, .8); })() : ''}
    <g transform="translate(900 90)"><rect x="-120" y="-56" width="240" height="104" rx="12" fill="#1c1f27" stroke="#f0cc7a" stroke-width="3"/>
      <rect x="-104" y="-42" width="208" height="40" rx="4" fill="${lcd === 'SAFE' ? '#9fd356' : '#ff5252'}"/><text y="-14" style="font:900 22px monospace;fill:#111;text-anchor:middle">${lcd}</text>
      <circle cx="-40" cy="24" r="10" fill="${S.fire > .05 ? '#ff3b3b' : '#4a1f1f'}"/><circle cx="40" cy="24" r="10" fill="${S.gas > .05 ? '#3b8bff' : '#1f2a4a'}"/>
      <text y="74" style="font:800 17px Cairo,sans-serif;fill:#f0cc7a;text-anchor:middle">${L('محطة الأمان', 'Safety station')}</text></g>
    ${S.timer ? `<g transform="translate(${FIRE_X} 150)"><rect x="-80" y="-30" width="160" height="52" rx="12" fill="#1c1f27" stroke="#ff5252" stroke-width="3"/><text y="6" style="font:900 28px monospace;fill:#ff5252;text-anchor:middle">⏱ ${S.timer}s</text></g>` : ''}
    ${S.ff > 0 ? `<g opacity="${S.ff}">${laptop(200, 600, camView, .68)}<text x="200" y="500" style="font:800 22px Cairo,sans-serif;fill:#f0cc7a;text-anchor:middle">🧑‍🚒 ${L('رجل الدفاع المدني', 'Civil Defense officer')}</text></g>` : ''}
    ${phone(1470, 330, MSGS[S.msg], S.msg > 0)}
`;
}

/* ---------- القصة الكاملة بصوت الراوي: الزائر ← محطة الأمان (٤ فصول) ← الخاتمة ----------
   ١٣ مقطعًا صوتيًا (audio/story_*.mp3)، لكل مقطع جزء من المشهد له زمن «قياسي» (CB)،
   ويُمدَّد الجزء ليطابق مدة صوته الحقيقية (window.STORY_DUR من story-dur.js) فلا يسبق المشهدُ الراويَ */
const SKEYS = ['v1', 'v2', 'v3', 'v4', 'v5', 's1', 's2', 's3', 'f1', 'f2', 'f3', 'f4', 'end'];
const CB = [0, 8, 18, 30, 42, 50, 65, 80, 95, 100, 109, 120, 130, 138];       // حدود الأجزاء بالزمن القياسي
const GAP = .9;                                                              // سكتة بعد كل مقطع
const SDUR = ((window.STORY_DUR || {})[EN ? 'en' : 'ar']) || SKEYS.map((_, i) => CB[i + 1] - CB[i] - GAP);
const RST = SDUR.reduce((a, d) => (a.push(a[a.length - 1] + d + GAP), a), [0]);  // بدايات الأجزاء بالزمن الحقيقي
const STOTAL = RST[RST.length - 1];
window.STORY_STARTS = { starts: RST.slice(0, -1), keys: SKEYS };   // لصانع الفيديو story-video.js
function storyClock(t) {
  const tt = ((t % STOTAL) + STOTAL) % STOTAL;
  let i = 0; while (i < SKEYS.length - 1 && tt >= RST[i + 1]) i++;
  return { i, c: CB[i] + (tt - RST[i]) / (RST[i + 1] - RST[i]) * (CB[i + 1] - CB[i]) };
}

// الزائر: كرسي LEGO، كاميرا، عين، منصة دوّارة، شاشة لغة الإشارة
function visitorState(c) {
  const vx = c < 9 ? -120 : c < 13 ? lerp(-120, 330, ease(seg(c, 9, 13))) : 330;
  let th = 0, eye = 'c', cmd = '', wave = false, face = -1, link = 1, wd = 0;
  if (c >= 18 && c < 24) { eye = 'r'; cmd = 'r'; wave = true; th = lerp(0, Math.PI, seg(c, 18.5, 24)); }
  else if (c >= 24 && c < 30) { eye = 'l'; cmd = 'l'; wave = true; th = lerp(Math.PI, Math.PI / 2, seg(c, 24.5, 30)); }
  else if (c >= 30) th = Math.PI / 2;
  if (c >= 30 && c < 42) { cmd = 's'; face = 1; }
  if (c >= 42 && c < 46) { eye = c < 45 ? 'x' : 'c'; cmd = 's'; }
  if (c >= 46) { link = c < 47 ? 1 : 0; wd = c >= 47 ? Math.min(1, (c - 47)) : 0; cmd = wd >= 1 ? 's' : ''; }
  const cap = c < 8 ? ['🏰', L('لمسة تراث: قصر المصمك التفاعلي… تجربة واحدة لذوي الإعاقة الحركية والسمعية والبصرية معًا', 'Touch of Heritage: one interactive Masmak for motor, hearing and visual disabilities, together')]
    : c < 13 ? ['🦽', L('«وضع القيادة»: الكرسي المتحرك LEGO يقرّب الزائر من المجسّم', '“Drive mode”: the LEGO wheelchair brings the visitor close to the model')]
    : c < 18 ? ['📷', L('الكاميرا ترى وجهه… وترحّب به بالعربية والإنجليزية', 'The camera sees his face… and welcomes him in Arabic and English')]
    : c < 24 ? ['👁️➡️', L('ينظر يمينًا: القصر يدور يمينًا مع موجة ضوء ذهبية', 'He looks right: the fortress turns right with a golden wave of light')]
    : c < 30 ? ['⬅️👁️', L('ينظر يسارًا: القصر يدور يسارًا', 'He looks left: the fortress turns left')]
    : c < 42 ? ['🤟🔊', L('يثبّت نظره: القصر يقف، والجهة تضيء بلونها، فيديو بلغة الإشارة + سرد صوتي معًا', 'He holds his gaze: the fortress stops, the face lights up, sign language + audio narration together')]
    : c < 46 ? ['😌', L('رمشة: المنصة تقف فورًا حفاظًا على سلامته', 'A blink: the turntable stops at once, for his safety')]
    : ['🐕', L('انقطع الاتصال أكثر من ثانية؟ الحارس (Watchdog) يوقف المحرك', 'Connection lost for over a second? The watchdog stops the motor')];
  return { vx, th, eye, cmd, wave, face, link, wd, cap };
}
function eyeIcon(x, y, d) {
  const ix = d === 'r' ? 22 : d === 'l' ? -22 : 0;
  return `<g transform="translate(${x} ${y})"><path d="M-70 0 Q 0 -54 70 0 Q 0 54 -70 0 Z" fill="#fff" stroke="#f0cc7a" stroke-width="4"/>
    ${d === 'x' ? '<path d="M-70 0 Q 0 40 70 0" stroke="#1c1f27" stroke-width="6" fill="none"/><path d="M-70 0 Q 0 -54 70 0 Q 0 30 -70 0 Z" fill="#c99a74"/>'
               : `<circle cx="${ix}" r="26" fill="#6d4521"/><circle cx="${ix}" r="12" fill="#111"/><circle cx="${ix + 7}" cy="-8" r="5" fill="#fff"/>`}</g>`;
}
function signerAnim(x, y, t, on) {
  const a = on ? Math.sin(t * 5) * 28 : 0, b = on ? Math.cos(t * 4) * 24 : 0;
  return `<g transform="translate(${x} ${y})"><path d="M-46 70 Q -42 22 0 18 Q 42 22 46 70 Z" fill="#2b6fc0"/><circle cy="-6" r="22" fill="#c99a74"/><path d="M-22 -10 Q -20 -32 0 -32 Q 20 -32 22 -10 Q 14 -24 0 -24 Q -14 -24 -22 -10 Z" fill="#3e2a1a"/>
    <g transform="rotate(${-30 + a} -30 34)"><path d="M-30 34 L-58 0" stroke="#2b6fc0" stroke-width="13" stroke-linecap="round"/><circle cx="-60" cy="-4" r="9" fill="#c99a74"/></g>
    <g transform="rotate(${30 + b} 30 34)"><path d="M30 34 L58 0" stroke="#2b6fc0" stroke-width="13" stroke-linecap="round"/><circle cx="60" cy="-4" r="9" fill="#c99a74"/></g></g>`;
}
function visitorSVG(c, t) {
  const S = visitorState(c), F = window.TUR.FACES || [], fc = S.face >= 0 && F[S.face] ? F[S.face].c : null;
  const ring = S.wave ? (i, N) => ((i + Math.floor(t * 8)) % 6 === 0 ? '#f0cc7a' : null) : fc ? () => fc : null;
  const m3 = window.TUR.masmak3D ? window.TUR.masmak3D(S.th, 860, 470, 112, .42, { ring }) : '';
  const intro = c < 8 ? [['🦽', L('حركية', 'Motor')], ['🧏', L('سمعية', 'Hearing')], ['🦯', L('بصرية', 'Visual')]].map(([i, n], k) => {
      const o = seg(c, 1.5 + k * 1.6, 2.3 + k * 1.6);
      return `<g opacity="${o}" transform="translate(${430 + k * 280} ${210 - o * 10})"><rect x="-120" y="-56" width="240" height="96" rx="22" fill="#1c2a5c" stroke="#f0cc7a" stroke-width="3"/><text x="-70" y="10" style="font:44px sans-serif;text-anchor:middle">${i}</text><text x="20" y="8" style="font:900 30px Cairo,sans-serif;fill:#f3ead2;text-anchor:middle">${n}</text></g>`; }).join('') : '';
  const welcome = c >= 13.5 && c < 18 ? `<g opacity="${seg(c, 13.5, 14.2)}" transform="translate(${S.vx + 40} 300)"><rect x="-150" y="-44" width="300" height="70" rx="20" fill="#f3ead2"/><path d="M-20 26 l10 22 l14 -22z" fill="#f3ead2"/><text y="2" style="font:900 26px Cairo,sans-serif;fill:#0d1226;text-anchor:middle">أهلًا بك · Welcome</text></g>` : '';
  const facebox = c >= 13 && c < 18 ? `<rect x="${S.vx - 58}" y="${400}" width="56" height="56" fill="none" stroke="#7ee2a8" stroke-width="4" stroke-dasharray="8 5"/>` : '';
  const showEye = c >= 18;
  const cmdPkt = S.cmd && c >= 18 ? (() => { const k = (t * .9) % 1, x = lerp(560, 760, k), y = 380 - Math.sin(k * Math.PI) * 50;
      return `<g transform="translate(${x} ${y})"><rect x="-26" y="-22" width="52" height="40" rx="12" fill="#7ee2a8"/><text y="7" style="font:900 24px monospace;fill:#06301b;text-anchor:middle;direction:ltr">'${S.cmd}'</text></g>`; })() : '';
  const screen = `<g transform="translate(1340 330)"><rect x="-170" y="-150" width="340" height="250" rx="16" fill="#1c1f27" stroke="#55607a" stroke-width="4"/>
      <rect x="-156" y="-136" width="312" height="200" rx="6" fill="${fc ? '#0f1733' : '#0b0f20'}"/>
      ${fc ? `<rect x="-156" y="-136" width="312" height="34" fill="${fc}"/><text y="-112" style="font:900 20px Cairo,sans-serif;fill:#0d1226;text-anchor:middle">${L(F[S.face].n, F[S.face].en)}</text>${signerAnim(-50, -10, t, true)}
        ${[0, 1, 2].map(i => `<path d="M${70 + i * 18} ${-40 - i * 10} q ${14 + i * 4} ${30 + i * 10} 0 ${60 + i * 20}" stroke="#f0cc7a" stroke-width="4" fill="none" opacity="${.4 + .6 * ((Math.sin(t * 6 - i) + 1) / 2)}"/>`).join('')}<text x="60" y="8" style="font:34px sans-serif;text-anchor:middle">🔊</text>`
            : `<text y="-30" style="font:700 18px Cairo,sans-serif;fill:#55607a;text-anchor:middle">Raspberry Pi</text>`}
      <rect x="-30" y="100" width="60" height="30" fill="#2a3150"/><rect x="-80" y="128" width="160" height="12" rx="6" fill="#2a3150"/>
      <text y="${fc ? 88 : 30}" style="font:800 17px Cairo,sans-serif;fill:#9aa8d8;text-anchor:middle">${fc ? L('🤟 للصم + 🔊 للمكفوفين', '🤟 deaf + 🔊 blind') : ''}</text></g>`;
  const blink = c >= 42 && c < 46 ? `<g transform="translate(860 150)"><rect x="-130" y="-40" width="260" height="70" rx="35" fill="#ff5252"/><text y="8" style="font:900 30px Cairo,sans-serif;fill:#fff;text-anchor:middle;direction:ltr;unicode-bidi:embed">⛔ STOP · 's'</text></g>` : '';
  const watchdog = c >= 46 ? `<g transform="translate(860 150)"><rect x="-230" y="-44" width="460" height="78" rx="20" fill="#1c1f27" stroke="${S.wd >= 1 ? '#ff5252' : '#f0cc7a'}" stroke-width="4"/>
      <text x="-150" y="10" style="font:36px sans-serif;text-anchor:middle">${S.link ? '📶' : '📵'}</text>
      <text x="40" y="10" style="font:900 28px monospace;fill:${S.wd >= 1 ? '#ff5252' : '#f0cc7a'};text-anchor:middle;direction:ltr;unicode-bidi:embed">${S.link ? 'UDP OK' : S.wd >= 1 ? '> 1 s → STOP' : (S.wd).toFixed(1) + ' s…'}</text></g>` : '';
  return `<defs><linearGradient id="m3tw" x1="0" x2="1"><stop offset="0" stop-color="#8a6239"/><stop offset=".45" stop-color="#d2ab78"/><stop offset="1" stop-color="#9c7246"/></linearGradient></defs>
    <rect width="1600" height="700" fill="#0d1226"/><rect y="560" width="1600" height="140" fill="#3a2a18"/>
    ${intro}${m3}
    <g transform="translate(860 640)"><rect x="-70" y="-26" width="140" height="44" rx="8" fill="#1c1f27" stroke="#55607a" stroke-width="2"/><text y="4" style="font:800 16px monospace;fill:#7ee2a8;text-anchor:middle">ESP32 · A4988</text></g>
    <g transform="translate(560 470)"><rect x="-6" y="0" width="12" height="90" fill="#55607a"/><rect x="-34" y="-26" width="68" height="40" rx="8" fill="#263238" stroke="#90a4ae" stroke-width="2"/><circle cx="-18" cy="-6" r="11" fill="#4fc3f7"/><circle cx="-18" cy="-6" r="5" fill="#0d1226"/></g>
    <g transform="translate(${S.vx} 545) scale(1.7)">${chair(c >= 13 && c < 18)}</g>
    ${facebox}${welcome}${cmdPkt}${showEye ? eyeIcon(250, 230, S.eye) + `<text x="250" y="320" style="font:800 20px Cairo,sans-serif;fill:#9aa8d8;text-anchor:middle">MediaPipe · ${L('٤٧٨ نقطة', '478 points')}</text>` : ''}
    ${screen}${blink}${watchdog}`;
}
const chair = glow => `<g><rect x="-34" y="-8" width="68" height="14" rx="3" fill="#f5c400"/><rect x="-34" y="-48" width="12" height="44" rx="3" fill="#f5c400"/>
  ${[-24, 24].map(x => `<circle cx="${x}" cy="12" r="12" fill="#1c1f27"/><circle cx="${x}" cy="12" r="4" fill="#9aa3b8"/>`).join('')}
  <circle cx="-14" cy="-62" r="12" fill="#c99a74"/><path d="M-26 -50 Q -14 -46 -2 -50 L 4 -14 L -24 -14 Z" fill="#2b6fc0"/><path d="M-6 -20 L 22 -20 L 24 -2" stroke="#1b2340" stroke-width="7" fill="none" stroke-linecap="round"/>
  ${glow ? '<circle cx="-14" cy="-62" r="17" fill="none" stroke="#7ee2a8" stroke-width="3" stroke-dasharray="4 4"/>' : ''}</g>`;

function endSVG(c, t) {
  const o = seg(c, 130, 131.5);
  return `<defs><linearGradient id="m3tw" x1="0" x2="1"><stop offset="0" stop-color="#8a6239"/><stop offset=".45" stop-color="#d2ab78"/><stop offset="1" stop-color="#9c7246"/></linearGradient></defs>
    <rect width="1600" height="700" fill="#0d1226"/><rect y="560" width="1600" height="140" fill="#3a2a18"/>
    ${window.TUR.masmak3D ? window.TUR.masmak3D(t * .5, 800, 430, 120, .42, { ring: (i, N) => ((i + Math.floor(t * 6)) % 4 === 0 ? '#f0cc7a' : null) }) : ''}
    ${[['stel', '', 230], ['ster', 'r2', 380]].map(([id, cl, x]) => `<g transform="translate(${x} 600)">${car4(id, cl)}</g>`).join('')}
    ${helper(1220, 600, 20, true, '3', 'r2')}${helper(1370, 600, 20, false, '4', '')}
    <g opacity="${o}"><text x="800" y="120" style="font:900 76px Cairo,sans-serif;fill:#f0cc7a;text-anchor:middle">${L('لمسة تراث', 'Touch of Heritage')}</text>
    <text x="800" y="180" style="font:800 32px Cairo,sans-serif;fill:#f3ead2;text-anchor:middle">${L('تراثٌ مفتوح للجميع… تحميه التقنية الذكية', 'Heritage open to everyone… protected by smart technology')}</text></g>`;
}

const PILL = [L('الزائر وعيناه', 'The visitor'), ...CH, L('الخاتمة', 'Ending')];
function fullSVG(t) {
  const { i, c } = storyClock(t);
  const ch = i < 5 ? 0 : i === 12 ? 5 : i <= 5 ? 1 : i === 6 ? 2 : i === 7 ? 3 : 4;
  const body = ch === 0 ? visitorSVG(c, t) : ch === 5 ? endSVG(c, t) : storySVG(c - 50);
  const cap = ch === 0 ? visitorState(c).cap : ch === 5 ? ['🏰', L('ننظر إلى الماضي… بعيون المستقبل', 'We look at the past… with the eyes of the future')] : storyState(c - 50).cap;
  const pill = `<g transform="translate(40 34)"><rect width="${EN ? 440 : 400}" height="60" rx="30" fill="#f0cc7a"/><circle cx="30" cy="30" r="23" fill="#0d1226"/>
      <text x="30" y="39" style="font:900 24px Cairo,sans-serif;fill:#f0cc7a;text-anchor:middle">${ch === 5 ? '★' : N(ch)}</text>
      <text x="${(EN ? 440 : 400) / 2 + 26}" y="40" style="font:900 24px Cairo,sans-serif;fill:#0d1226;text-anchor:middle">${PILL[ch]}</text></g>
    ${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${62 + k * 24}" cy="116" r="7" fill="${k <= ch ? '#f0cc7a' : '#2a3150'}"/>`).join('')}`;
  return { svg: body + pill, cap, i };
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
  // القصة الكاملة: المشهد يملأ الشريحة، و🔊 يشغّل صوت الراوي متزامنًا (يبدأ المشهد من أوله). في البوربوينت: فيديو MP4 بالصوت (sl.video)
  fullstory: s => `<div class="slide dark stfull">
      <div class="sttop"><span class="kicker">${s.kicker}</span><h1>${s.title}</h1><button class="ffsnd ix" id="stsnd">🔊 ${L('الراوي', 'Narrator')}</button></div>
      <div class="dygif ffwrap stwrap"><svg viewBox="0 0 1600 700" class="ffsvg" id="sts"></svg><div class="ffcap" id="stc"><span class="i"></span><span class="tx"></span></div></div></div>`,

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
  fullstory(sl) {
    const svg = sl.querySelector('#sts'), cap = sl.querySelector('#stc'), btn = sl.querySelector('#stsnd');
    let on = false, base = 0, last = -1, now = 0;
    btn.onclick = e => { e.stopPropagation(); on = !on; btn.classList.toggle('on', on); if (ffAudio) ffAudio.pause();
      if (on) { base = now; last = -1; } };                           // التشغيل بالصوت يبدأ القصة من أولها
    window.DECK_CLEANUP.push(() => { if (ffAudio) ffAudio.pause(); });
    runLoop(t => { now = t; const F = fullSVG(on ? t - base : t);
      svg.innerHTML = F.svg; cap.querySelector('.i').textContent = F.cap[0]; cap.querySelector('.tx').textContent = F.cap[1];
      if (on && F.i !== last) { last = F.i; ffPlay(SND('story_' + SKEYS[F.i])); }
    }, STOTAL);
  },
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
