/* =====================================================================
   «المصمك الذكي · سيف 2026» — القصة الكاملة المتحركة بصوت الراوي (العربي والإنجليزي)
   تعيد استخدام مشاهد قصة WRO (window.TUR5 من turath/widgetsT5.js) وتضيف ثلاثة مشاهد جديدة:
     🚪 البوابة الذكية (أسورة + حاجز + عدّاد)  ·  🏺 حماية الأثر (حرارة/رطوبة/هواء + مروحة)
     🤖 روبوت الإنقاذ (البوابة تفتح وحدها + سيارة إنقاذ تسحب كرسي القعيد + عدد من بالداخل للدفاع المدني)
   لكل مشهد مقطع صوت audio/story_<key>.mp3، ومدته الحقيقية في story-dur.js (يولّدها story-tts.py)
   النوع: { t: 'saifstory', kicker, title }  ·  في البوربوينت: فيديو MP4 (story-video.js)
   ===================================================================== */
(function () {
const EN = (window.DECK || {}).lang === 'en';
const L = (ar, en) => EN ? en : ar;
const N = n => EN ? String(n) : String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const T5 = window.TUR5, TUR = window.TUR;
const { lerp, ease, clamp, seg, fire, smoke, helper, phone } = T5;
const car4 = TUR.car4;
const AUD = k => `../${EN ? 'saif-masmak-en' : 'saif-masmak'}/audio/story_${k}.mp3`;

// مهلة الرش ١٥ ثانية، ورسائل تلجرام فيها عدد من بالداخل
window.STORY_LIMIT = 15;
window.STORY_NO_TIMER = true;   // لا نعرض عدّادًا بالثواني: القائد يقرر لما يحس إن النار تزيد
window.STORY_MSGS = ['',
  L('🚨 بلاغ: لهب وغاز في متحف المصمك.<br>👥 بالداخل: ٣ أشخاص<br>🤖 الروبوتات تتعامل الآن', '🚨 Report: fire and gas at Masmak Museum.<br>👥 Inside: 3 people<br>🤖 Robots are handling it'),
  L('🚨 لم نستطع السيطرة على الحريق.<br><b>نحتاج دعمًا عاجلًا</b> 🚒<br>الجهة الشرقية · ممر آمن', '🚨 We could not control the fire.<br><b>Urgent support needed</b> 🚒<br>East side · safe passage'),
  L('✅ تم إخماد الحريق بدعم الدفاع المدني.<br><b>متحف المصمك آمن الآن</b> 🙏', '✅ The fire was put out with Civil Defense.<br><b>Masmak Museum is safe now</b> 🙏'),
];

/* ---------- مشاهد القصة بالترتيب ----------
   r: كيف يُرسم المشهد · a/b: مجال الزمن القياسي داخل المشهد الأصلي (للمشاهد المعاد استخدامها) */
const SC = [
  { k: 'intro',  r: 'v', a: 0,  b: 8 },
  { k: 'gate',   r: 'gate', a: 0, b: 13 },
  { k: 'v2',     r: 'v', a: 8,  b: 18 },
  { k: 'v3',     r: 'v', a: 18, b: 30 },
  { k: 'v4',     r: 'v', a: 30, b: 42 },
  { k: 'modes',  r: 'modes', a: 0, b: 13 },
  { k: 'care',   r: 'care', a: 0, b: 13 },
  { k: 's1',     r: 's', a: 0,  b: 15 },
  { k: 's2',     r: 's', a: 15, b: 30 },
  { k: 's3',     r: 's', a: 30, b: 45 },
  { k: 'f1',     r: 's', a: 45, b: 50 },
  { k: 'f2',     r: 's', a: 50, b: 59 },
  { k: 'f3',     r: 's', a: 59, b: 70 },
  { k: 'rescue', r: 'rescue', a: 0, b: 15 },
  { k: 'f4',     r: 's', a: 70, b: 80 },
  { k: 'end',    r: 'end', a: 0, b: 8 },
];
const GAP = .8;
const DUR = ((window.SAIF_STORY_DUR || {})[EN ? 'en' : 'ar']) || SC.map(s => s.b - s.a);
const ST = DUR.reduce((acc, d) => (acc.push(acc[acc.length - 1] + d + GAP), acc), [0]);
const TOTAL = ST[ST.length - 1];
window.STORY_STARTS = { starts: ST.slice(0, -1), keys: SC.map(s => 'story_' + s.k), total: TOTAL };   // لصانع الفيديو
function clock(t) {
  const tt = ((t % TOTAL) + TOTAL) % TOTAL;
  let i = 0; while (i < SC.length - 1 && tt >= ST[i + 1]) i++;
  const k = clamp((tt - ST[i]) / (DUR[i] || 1), 0, 1);       // ٠..١ داخل المشهد (السكتة تبقى على آخر إطار)
  return { i, c: SC[i].a + k * (SC[i].b - SC[i].a) };
}

/* ---------- رسومات مساعدة ---------- */
const BG = `<rect width="1600" height="700" fill="#0d1226"/><rect y="560" width="1600" height="140" fill="#3a2a18"/>`;
const GRAD = `<defs><linearGradient id="m3tw" x1="0" x2="1"><stop offset="0" stop-color="#8a6239"/><stop offset=".45" stop-color="#d2ab78"/><stop offset="1" stop-color="#9c7246"/></linearGradient></defs>`;
const txt = (x, y, s, size, col, w = 800, anchor = 'middle') => `<text x="${x}" y="${y}" style="font:${w} ${size}px Cairo,sans-serif;fill:${col};text-anchor:${anchor}">${s}</text>`;
const NAMES = EN ? ['Ahmed', 'Sara', 'Omar'] : ['أحمد', 'سارة', 'عمر'];
const COLS = ['#ef8f3a', '#9c6ade', '#3aa6a0'];
// زائر بسيط: رأس + جسم + أسورة (تومض لما تُقرأ)
function person(x, y, col, band, walk) {
  const st = walk ? Math.sin(walk * 9) * 8 : 0;
  return `<g transform="translate(${x} ${y})"><line x1="-8" y1="-6" x2="${-10 - st}" y2="34" stroke="#2a3150" stroke-width="9" stroke-linecap="round"/>
    <line x1="8" y1="-6" x2="${10 + st}" y2="34" stroke="#2a3150" stroke-width="9" stroke-linecap="round"/>
    <rect x="-18" y="-70" width="36" height="66" rx="14" fill="${col}"/><circle cy="-88" r="18" fill="#c99a74"/>
    <rect x="10" y="-42" width="18" height="12" rx="3" fill="#fff" stroke="${band ? '#7ee2a8' : '#0d1226'}" stroke-width="${band ? 4 : 2}"/>
    ${[[12, -40], [22, -40], [12, -34], [17, -37], [22, -34]].map(([x, y]) => `<rect x="${x}" y="${y}" width="4" height="4" fill="#111"/>`).join('')}</g>`;
}
// البوابة: عمودان + قارئ + حاجز يرتفع (open ٠..١)
function gateSVG(x, open, state) {
  const glow = state === 'ok' ? '#7ee2a8' : state === 'alarm' ? '#ff5252' : '#55607a';
  return `<g transform="translate(${x} 560)"><rect x="-14" y="-200" width="28" height="200" rx="6" fill="#55607a"/><rect x="186" y="-200" width="28" height="200" rx="6" fill="#55607a"/>
    <rect x="-20" y="-214" width="240" height="22" rx="8" fill="#2a3150"/>${txt(100, -198, L('مدخل المصمك', 'Masmak entrance'), 15, '#f0cc7a')}
    <g transform="translate(0 -96) rotate(${-82 * open})"><rect x="0" y="-9" width="196" height="18" rx="9" fill="#f3ead2" stroke="#c62828" stroke-width="3"/>
      ${[30, 80, 130].map(v => `<rect x="${v}" y="-9" width="22" height="18" fill="#c62828"/>`).join('')}</g>
    <g transform="translate(-58 -120)"><rect x="-30" y="-38" width="60" height="76" rx="10" fill="#1c1f27" stroke="${glow}" stroke-width="4"/>
      ${[-16, -11, -7, -2, 3, 7, 12, 16].map((v, i) => `<rect x="${v}" y="-26" width="${i % 3 ? 2 : 3.5}" height="22" fill="#f3ead2"/>`).join('')}
      <circle cy="20" r="7" fill="${glow}"/>${state === 'ok' ? '<path d="M30 -4 L 100 -30 L 100 22 Z" fill="#ff5252" opacity=".35"/><line x1="30" y1="-4" x2="100" y2="-4" stroke="#ff1744" stroke-width="3"/>' : ''}
      ${txt(0, 60, L('كاميرا الأسورة', 'Wristband camera'), 14, '#9aa8d8')}</g></g>`;
}
function counter(x, y, n, names, alarm) {
  return `<g transform="translate(${x} ${y})"><rect x="-170" y="-60" width="340" height="${names ? 190 : 110}" rx="18" fill="#1c1f27" stroke="${alarm ? '#ff5252' : '#f0cc7a'}" stroke-width="4"/>
    ${txt(0, -24, L('👥 داخل المتحف', '👥 Inside the museum'), 22, '#9aa8d8')}${txt(0, 34, N(n), 54, alarm ? '#ff5252' : '#7ee2a8', 900)}
    ${names ? txt(0, 90, names.join(' · '), 22, '#f3ead2') : ''}</g>`;
}

function blindP(x, y, walk) {   // زائر كفيف بعصا بيضاء
  return person(x, y, '#3aa6a0', false, walk) + `<g transform="translate(${x} ${y})"><line x1="-20" y1="-40" x2="-52" y2="34" stroke="#fff" stroke-width="5"/><line x1="-46" y1="20" x2="-52" y2="34" stroke="#e53935" stroke-width="5"/></g>`;
}

/* 🚪 البوابة الذكية: ثلاثة زوار يمرّرون أساورهم */
function gateScene(c, t) {
  const GX = 640;
  let n = 0, open = 0, state = '';
  const people = [0, 1, 2].map(i => {
    const t0 = 1 + i * 3.6;                         // كل زائر: يمشي للقارئ ← يمرّر ← يعبر
    const k1 = seg(c, t0, t0 + 1.4), k2 = seg(c, t0 + 2, t0 + 3.4);
    const x = k2 > 0 ? lerp(GX - 70, GX + 290 + i * 150, ease(k2)) : lerp(-60, GX - 70, ease(k1));
    const at = c >= t0 + 1.4 && c < t0 + 2.4;
    if (c >= t0 + 1.6) n = i + 1;
    if (c >= t0 + 1.5 && c < t0 + 3.2) { open = Math.max(open, seg(c, t0 + 1.5, t0 + 2) * (1 - seg(c, t0 + 2.8, t0 + 3.2))); }
    if (at) state = 'ok';
    return { x, at, walk: (k1 > 0 && k1 < 1) || (k2 > 0 && k2 < 1) ? t : 0 };
  });
  const names = NAMES.slice(0, n);
  const cap = c < 1 ? ['🚪', L('البوابة الذكية: لكل زائر أسورة باسمه', 'The smart gate: every visitor gets a wristband with his name')]
    : c < 12 ? ['🎫', L(`الكاميرا تقرأ رمز أسورته… الحاجز يفتح، والعدد يزيد: ${N(n)}`, `The camera reads his wristband code… the barrier opens, the count goes up: ${n}`)]
    : ['🔢', L('المتحف يعرف دائمًا من بداخله', 'The museum always knows who is inside')];
  // نفس زوار مشهد الإنقاذ: الأصم، والكفيف بعصاه، والقعيد بكرسيه (كلهم يدخلون بالطريقة نفسها)
  const draw = (p, i) => i === 0 ? person(p.x, 560, COLS[0], p.at, p.walk) + `<g transform="translate(${p.x} 440)">${txt(0, 0, '🧏', 26, '#fff')}</g>`
    : i === 1 ? blindP(p.x, 560, p.walk) + `<g transform="translate(${p.x} 440)">${txt(0, 0, '🦯', 26, '#fff')}</g>`
    : `<g transform="translate(${p.x} 545) scale(1.7)">${T5.chair(p.at)}</g><g transform="translate(${p.x - 20} 400)">${txt(0, 0, '🦽', 26, '#fff')}</g>`
      + (p.at ? `<g transform="translate(${p.x + 6} 470)"><rect x="-10" y="-7" width="20" height="13" rx="3" fill="#fff" stroke="#7ee2a8" stroke-width="3"/></g>` : '');
  return { svg: BG + gateSVG(GX, open, state) + people.map(draw).join('')
      + counter(1300, 200, n, names) + (state === 'ok' ? txt(GX - 58, 370, L('أهلًا ✅', 'Welcome ✅'), 24, '#7ee2a8', 900) : ''), cap };
}

/* 🏺 حماية الأثر: الرطوبة ترتفع ← تنبيه ← المروحة تعمل ← تعود طبيعية */
function careScene(c, t) {
  const hum = c < 3 ? 46 : c < 6 ? lerp(46, 72, seg(c, 3, 6)) : c < 8 ? 72 : lerp(72, 50, seg(c, 8, 12));
  const temp = 24 + Math.sin(t) * .4, air = 'OK';
  const alarm = hum > 65, fanOn = c >= 6.5 && c < 12;
  const gauge = (x, ic, name, val, bad) => `<g transform="translate(${x} 170)"><rect x="-110" y="-60" width="220" height="130" rx="18" fill="#1c1f27" stroke="${bad ? '#ff5252' : '#7ee2a8'}" stroke-width="4"/>
      ${txt(-60, -6, ic, 40, '#fff')}${txt(30, -14, name, 20, '#9aa8d8')}${txt(30, 36, val, 38, bad ? '#ff5252' : '#7ee2a8', 900)}</g>`;
  const box = `<g><rect x="560" y="300" width="460" height="260" rx="10" fill="#9fd3ff" opacity=".12" stroke="#bfe3ff" stroke-width="4"/>
      ${TUR.masmak3D ? TUR.masmak3D(t * .3, 790, 470, 80, .42, {}) : ''}${txt(790, 600, L('صندوق الأثر', 'Artifact case'), 20, '#f0cc7a')}</g>`;
  const fan = `<g transform="translate(1130 430)"><rect x="-44" y="-44" width="88" height="88" rx="14" fill="#1c1f27" stroke="${fanOn ? '#7ee2a8' : '#55607a'}" stroke-width="4"/>
      <g transform="rotate(${fanOn ? t * 720 : 0})">${[0, 90, 180, 270].map(a => `<ellipse rx="10" ry="30" cy="-18" transform="rotate(${a})" fill="#9aa8d8"/>`).join('')}</g>
      ${txt(0, 76, L('مروحة', 'Fan'), 18, '#9aa8d8')}</g>`;
  const screen = `<g transform="translate(300 430)"><rect x="-150" y="-100" width="300" height="190" rx="14" fill="#1c1f27" stroke="#55607a" stroke-width="4"/>
      ${txt(0, -64, L('📺 شاشة الأثر', '📺 Artifact screen'), 20, '#f0cc7a')}
      ${txt(0, -18, `🌡️ ${N(temp.toFixed(1))}°C`, 26, '#f3ead2')}${txt(0, 22, `💧 ${N(Math.round(hum))}%`, 26, alarm ? '#ff5252' : '#f3ead2')}${txt(0, 62, `💨 ${air}`, 26, '#f3ead2')}</g>`;
  const warn = alarm ? `<g transform="translate(790 255)"><rect x="-230" y="-30" width="460" height="54" rx="27" fill="#ff5252"/>${txt(0, 6, L('⚠️ الرطوبة عالية! المروحة تعمل', '⚠️ Humidity high! Fan ON'), 24, '#fff', 900)}</g>` : '';
  const cap = c < 3 ? ['🏺', L('داخل صندوق المصمك حساسات ترعى الأثر', 'Inside the Masmak case, sensors care for the artifact')]
    : c < 6.5 ? ['💧', L('الرطوبة ترتفع… خطر على الطين والخشب', 'Humidity rises… a danger for mud and wood')]
    : c < 12 ? ['🌀', L('النظام يتدخل وحده: المروحة تعمل حتى تعود الرطوبة طبيعية', 'The system acts by itself: the fan runs until humidity is normal')]
    : ['✅', L('الأثر في أمان', 'The artifact is safe')];
  return { svg: GRAD + BG + gauge(450, '🌡️', L('الحرارة', 'Temp'), `${N(temp.toFixed(0))}°`, false) + gauge(800, '💧', L('الرطوبة', 'Humidity'), `${N(Math.round(hum))}%`, alarm)
      + gauge(1150, '💨', L('الهواء', 'Air'), air, false) + box + fan + screen + warn, cap };
}

/* 🤖 الإنقاذ: لكل زائر طريقته
   🧏 الأصم: ضوء وامض + سهم مضيء + شاشة طوارئ بلغة الإشارة · 🦯 الكفيف: صوت «اتبع صوتي»
   🦽 القعيد: سيارة الإنقاذ تمسك كرسيه بذراعها وتسحبه للخارج (الكرسي أقرب زائر للروبوت، والذراع خط أصفر بينهما) */
function rescueScene(c, t) {
  const GX = 300, FX = 1270;
  const fk = 1.1 + Math.sin(t * 2) * .05;
  const open = seg(c, .4, 1.4);
  // الروبوت: يدخل ← يقف عند الزوار ← يقود الجميع للمخرج
  const rx = c < 4 ? lerp(-140, 740, ease(seg(c, .8, 4))) : c < 7 ? 740 : lerp(740, -320, ease(seg(c, 7, 14)));
  const lead = c >= 7;
  const follow = (gap, x0) => lead ? Math.min(x0, rx + gap) : x0;   // كل زائر يلحق الروبوت بمسافة ثابتة
  const chairX = follow(150, 870), deafX = follow(300, 1000), blindX = follow(420, 1110);
  const gone = [deafX, blindX, chairX].filter(x => x < GX - 20).length, n = 3 - gone;
  const beacon = Math.sin(t * 12) > 0 ? '#ff1744' : '#2979ff';
  const waves = c >= 4.5 && c < 13 ? [0, 1, 2].map(i => `<path d="M${rx + 46 + i * 22} ${500 - i * 10} q ${16 + i * 5} ${28 + i * 8} 0 ${56 + i * 16}" stroke="#f0cc7a" stroke-width="4" fill="none" opacity="${.35 + .65 * ((Math.sin(t * 7 - i) + 1) / 2)}"/>`).join('') : '';
  const arrow = `<g transform="translate(${rx - 4} 486)"><rect x="-40" y="-20" width="80" height="34" rx="8" fill="#111" stroke="${beacon}" stroke-width="3"/>${txt(0, 8, EN ? '⬅ EXIT' : '⬅ مخرج', 18, '#7ee2a8', 900)}</g>`;
  const robot = `<g transform="translate(${rx} 560)">${car4('rsc', 'r2')}<circle cx="0" cy="-60" r="14" fill="${beacon}"/><circle cx="0" cy="-60" r="${26 + Math.sin(t * 12) * 6}" fill="${beacon}" opacity=".25"/>
      ${txt(0, 60, L('روبوت الإنقاذ', 'Rescue robot'), 18, '#82b1ff')}</g>${arrow}${waves}
    ${c >= 4.5 && c < 13 ? `<g transform="translate(${rx + 10} 390)"><rect x="-160" y="-34" width="320" height="54" rx="18" fill="#f3ead2"/>${txt(0, 2, L('🔊 اتبع صوتي… المخرج هنا', '🔊 Follow my voice… exit here'), 20, '#0d1226', 900)}</g>` : ''}`;
  // شاشة الطوارئ بلغة الإشارة (للأصم)
  const sign = `<g transform="translate(760 130)"><rect x="-150" y="-70" width="300" height="140" rx="14" fill="#1c1f27" stroke="#ff5252" stroke-width="4"/>
      <rect x="-138" y="-58" width="276" height="34" fill="#ff5252"/>${txt(0, -34, L('🤟 طوارئ: حريق! اتبع الروبوت', '🤟 Emergency: fire! Follow the robot'), 17, '#fff', 900)}
      <g transform="translate(-70 30)"><circle cy="-10" r="14" fill="#c99a74"/><rect x="-16" y="4" width="32" height="34" rx="8" fill="#2b6fc0"/>
        <line x1="-14" y1="10" x2="${-34 + Math.sin(t * 6) * 10}" y2="-12" stroke="#2b6fc0" stroke-width="8" stroke-linecap="round"/><line x1="14" y1="10" x2="${34 + Math.cos(t * 5) * 10}" y2="-12" stroke="#2b6fc0" stroke-width="8" stroke-linecap="round"/></g>
      ${txt(50, 30, L('شاشة المصمك', 'Masmak screen'), 16, '#9aa8d8')}</g>`;
  const tag = (x, ic, lbl) => `<g transform="translate(${x} 680)">${txt(0, 0, ic + ' ' + lbl, 18, '#f3ead2')}</g>`;
  const walkD = lead && deafX > -150 ? t : 0, walkB = lead && blindX > -150 ? t : 0;
  const msg = c < 13 ? L('🚨 حريق في متحف المصمك.<br>👥 بالداخل ٣: زائر أصم، زائر كفيف، زائر على كرسي<br>🚪 البوابة مفتوحة للإخلاء', '🚨 Fire at Masmak Museum.<br>👥 3 inside: a deaf visitor, a blind visitor, a wheelchair user<br>🚪 Gate open for evacuation')
    : L('✅ تم إخلاء جميع الزوار.<br>👥 بالداخل: ٠', '✅ All visitors are out.<br>👥 Inside: 0');
  const cap = c < 1.6 ? ['🚪', L('حريق! البوابة تفتح وحدها… ولا تُغلق على أحد', 'Fire! The gate opens by itself… it never locks anyone in')]
    : c < 4.5 ? ['🤖', L('روبوت الإنقاذ يدخل بضوء وامض وسهم يشير للمخرج', 'The rescue robot drives in with a flashing light and an exit arrow')]
    : c < 7 ? ['🧏🦯', L('الأصم يرى الضوء وشاشة الإشارة… والكفيف يسمع: اتبع صوتي', 'The deaf visitor sees the light and the sign screen… the blind visitor hears: follow my voice')]
    : c < 13 ? ['🦽', L('وسيارة الإنقاذ تمسك كرسي القعيد بذراعها وتسحبه للخارج… والعدد ينقص', 'And the rescue car grabs the wheelchair with its arm and pulls it out… the count goes down')]
    : ['✅', L('الجميع في الخارج… والدفاع المدني يعرف ذلك', 'Everyone is out… and Civil Defense knows it')];
  return { svg: BG + `<g transform="translate(${FX} 560)">${smoke(0, 0, fk, t)}${fire(0, 0, fk, t)}</g>` + gateSVG(GX, open, 'alarm') + sign
      + person(deafX, 560, '#ef8f3a', false, walkD) + `<g transform="translate(${deafX} 440)">${txt(0, 0, '🧏', 26, '#fff')}</g>`
      + blindP(blindX, 560, walkB) + `<g transform="translate(${blindX} 440)">${txt(0, 0, '🦯', 26, '#fff')}</g>`
      + `<g transform="translate(${chairX} 545) scale(1.7)">${T5.chair(false)}</g>` + `<g transform="translate(${chairX - 20} 400)">${txt(0, 0, '🦽', 26, '#fff')}</g>`
      + (lead ? `<line x1="${rx + 40}" y1="540" x2="${chairX - 40}" y2="540" stroke="#f0cc7a" stroke-width="8" stroke-linecap="round"/>` : '')
      + robot + counter(1180, 150, n, null, true) + phone(1460, 330, msg, true), cap };
}

/* 🎯 كل زائر بطريقته: القعيد بعينه، والأصم بيده، والكفيف بصوته، والزائر العادي بما يحب
   🎧 ولكل أثر سماعة: يسمع ما يريد دون أن يزعج غيره */
function modesScene(c, t) {
  const ST = [
    { x: 330,  on: [1, 4.5],   ic: '👁️', lbl: L('بؤبؤ العين', 'Eye pupil'),  who: L('القعيد', 'Wheelchair user') },
    { x: 800,  on: [4.5, 8],   ic: '✋', lbl: L('حركة اليد', 'Hand gesture'), who: L('الأصم', 'Deaf visitor') },
    { x: 1270, on: [8, 11.5],  ic: '🎙️', lbl: L('الصوت', 'Voice'),          who: L('الكفيف', 'Blind visitor') },
  ];
  const all = c >= 11.5;
  const dir = c < 4.5 ? 1 : c < 8 ? -1 : 1;
  const draw = (st, i) => {
    const act = all || (c >= st.on[0] && c < st.on[1]), op = c >= st.on[0] || all ? 1 : .25;
    const fig = i === 0 ? `<g transform="translate(${st.x} 585) scale(1.7)">${T5.chair(act)}</g>`
      : i === 1 ? person(st.x, 600, COLS[0], false, 0) : blindP(st.x, 600, 0);
    const hy = i === 0 ? 472 : 500;
    return `<g opacity="${op}">${fig}
      <g transform="translate(${st.x + 4} ${hy})">${txt(0, 0, '🎧', 34, '#fff')}</g>
      <g transform="translate(${st.x} 690)"><rect x="-120" y="-36" width="240" height="50" rx="16" fill="${act ? '#f0cc7a' : '#2a3150'}"/>
        ${txt(0, -3, st.ic + ' ' + st.lbl, 22, act ? '#0d1226' : '#9aa8d8', 900)}</g>
      ${txt(st.x, 395, st.who, 20, '#f3ead2')}
      ${act ? `<line x1="${st.x}" y1="345" x2="${800 + (st.x - 800) * .25}" y2="250" stroke="#f0cc7a" stroke-width="3" stroke-dasharray="6 8" opacity=".8"/>` : ''}</g>`;
  };
  const cap = c < 1 ? ['🎯', L('كل زائر يدير المصمك بطريقته', 'Every visitor runs Masmak in his own way')]
    : c < 4.5 ? ['🦽', L('القعيد: ببؤبؤ عينه', 'The wheelchair user: with his eye pupil')]
    : c < 8 ? ['🧏', L('الأصم: بحركة يده… ويرى لغة الإشارة', 'The deaf visitor: with a hand gesture… and sees sign language')]
    : c < 11.5 ? ['🦯', L('الكفيف: بصوته… ويسمع الشرح', 'The blind visitor: with his voice… and hears the narration')]
    : ['🎧', L('ولكل أثر سماعة: يسمع ما يريد… دون أن يزعج غيره', 'A headset at every artifact: each hears what he wants… without disturbing others')];
  return { svg: GRAD + BG + (TUR.masmak3D ? TUR.masmak3D(t * .5 * dir, 800, 200, 70, .42, {}) : '') + ST.map(draw).join(''), cap };
}

function endScene(c, t) {
  const o = seg(c, .3, 1.8);
  return { svg: GRAD + BG + (TUR.masmak3D ? TUR.masmak3D(t * .5, 800, 430, 120, .42, { ring: (i) => ((i + Math.floor(t * 6)) % 4 === 0 ? '#f0cc7a' : null) }) : '')
      + `<g transform="translate(230 600)">${car4('sel')}</g><g transform="translate(380 600)">${car4('ser', 'r2')}</g>`
      + helper(1220, 600, 20, true, '3', 'r2') + helper(1370, 600, 20, false, '4', '')
      + `<g opacity="${o}">${txt(800, 120, L('المصمك الذكي', 'Smart Al Masmak'), 76, '#f0cc7a', 900)}${txt(800, 180, L('متحف يرحّب بالجميع… ويحمي الجميع', 'A museum that welcomes everyone… and protects everyone'), 32, '#f3ead2')}</g>`,
    cap: ['🇸🇦', L('فكرة مبتكرة من السعودية، أرض الإبداع', 'An innovative idea from Saudi Arabia, the land of innovation')] };
}

const PARTS = [L('الدخول', 'Entry'), L('كل زائر بطريقته', 'Every visitor'), L('حماية الأثر', 'Artifact care'), L('الروبوتات', 'The robots'), L('الدفاع المدني', 'Civil Defense'), L('الخاتمة', 'Ending')];
const partOf = k => ['intro', 'gate'].includes(k) ? 0 : (/^v/.test(k) || k === 'modes') ? 1 : k === 'care' ? 2 : /^s/.test(k) ? 3 : k === 'end' ? 5 : 4;
function frame(t) {
  const { i, c } = clock(t), s = SC[i];
  let F;
  if (s.r === 'v') F = { svg: T5.visitorSVG(c, t), cap: T5.visitorState(c).cap };
  else if (s.r === 's') F = { svg: T5.storySVG(c), cap: T5.storyState(c).cap };
  else F = ({ gate: gateScene, care: careScene, modes: modesScene, rescue: rescueScene, end: endScene })[s.r](c, t);
  if (s.k === 's3' && c >= 40) F.cap = ['🔥', L('النار تكبر… والقائد يشعر بزيادتها', 'The fire keeps growing… and the leader feels it')];
  if (s.k === 'f1' && c < 46.5) F.cap = ['🚨', L('القائد لم يستطع السيطرة على النار… فيقرر وحده: نحتاج الدفاع المدني', 'The leader cannot control the fire… it decides by itself: we need Civil Defense')];
  if (s.k === 'f4' && c >= 72) F.cap = ['🛡️', L('كل روبوت يعود إلى مكانه… المصمك الذكي: تقنية تحمي الإنسان والأثر', 'Every robot returns home… Smart Al Masmak: technology protecting people and heritage')];
  if (s.k === 'intro') F.cap = ['🏰', L('المصمك الذكي: تجربة واحدة لذوي الإعاقة الحركية والسمعية والبصرية… وأمان للجميع', 'Smart Al Masmak: one experience for motor, hearing and visual disabilities… and safety for all')];
  const p = partOf(s.k), W = EN ? 400 : 360;
  const pill = `<g transform="translate(40 34)"><rect width="${W}" height="60" rx="30" fill="#f0cc7a"/><circle cx="30" cy="30" r="23" fill="#0d1226"/>
      ${txt(30, 39, p === 5 ? '★' : N(p + 1), 24, '#f0cc7a', 900)}${txt(W / 2 + 26, 40, PARTS[p], 24, '#0d1226', 900)}</g>
    ${PARTS.map((_, k) => `<circle cx="${62 + k * 24}" cy="116" r="7" fill="${k <= p ? '#f0cc7a' : '#2a3150'}"/>`).join('')}`;
  return { svg: F.svg + pill, cap: F.cap, i };
}

Object.assign(window.DECK_TYPES, {
  saifstory: s => `<div class="slide dark stfull">
      <div class="sttop"><span class="kicker">${s.kicker}</span><h1>${s.title}</h1><button class="ffsnd ix" id="stsnd">🔊 ${L('الراوي', 'Narrator')}</button></div>
      <div class="dygif ffwrap stwrap"><svg viewBox="0 0 1600 700" class="ffsvg" id="sts"></svg><div class="ffcap" id="stc"><span class="i"></span><span class="tx"></span></div></div></div>`,
});
window.DECK_BIND = window.DECK_BIND || {};
Object.assign(window.DECK_BIND, {
  saifstory(sl) {
    const svg = sl.querySelector('#sts'), cap = sl.querySelector('#stc'), btn = sl.querySelector('#stsnd');
    let on = false, base = 0, last = -1, now = 0, audio = null;
    const play = k => { try { if (audio) audio.pause(); audio = new Audio(AUD(k)); audio.play().catch(() => {}); } catch (e) {} };
    btn.onclick = e => { e.stopPropagation(); on = !on; btn.classList.toggle('on', on); if (audio) audio.pause(); if (on) { base = now; last = -1; } };
    window.DECK_CLEANUP.push(() => { if (audio) audio.pause(); });
    T5.runLoop(t => { now = t; const F = frame(on ? t - base : t);
      svg.innerHTML = F.svg; cap.querySelector('.i').textContent = F.cap[0]; cap.querySelector('.tx').textContent = F.cap[1];
      if (on && F.i !== last) { last = F.i; play(SC[F.i].k); }
    }, TOTAL);
  },
});
// مثل قصة WRO: الراوي يبدأ وحده عند فتح الشريحة (إلا أثناء التصوير للبوربوينت)
window.DECK_HOOKS = window.DECK_HOOKS || [];
window.DECK_HOOKS.push((sl, s) => {
  if (s.t !== 'saifstory') return;
  const idx = cur, btn = sl.querySelector('#stsnd');
  if (btn) setTimeout(() => { if (cur === idx && !btn.classList.contains('on') && !document.body.classList.contains('capture')) btn.click(); }, 400);
});
window.SAIF_STORY = { frame, TOTAL, SC, ST };
})();
