/* =====================================================================
   «المصمك الذكي · سيف 2026» — القصة الكاملة المتحركة بصوت الراوي (العربي والإنجليزي)
   تعيد استخدام مشاهد قصة WRO (window.TUR5 من turath/widgetsT5.js) وتضيف ثلاثة مشاهد جديدة:
     🚪 البوابة الذكية (أسورة + حاجز + عدّاد)  ·  🏺 حماية الأثر (حرارة/رطوبة/هواء + مروحة)
     🤖 روبوت الإنقاذ (البوابة تفتح وحدها + أسماء من بالداخل للدفاع المدني)
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
  { k: 'v5',     r: 'v', a: 42, b: 50 },
  { k: 'care',   r: 'care', a: 0, b: 13 },
  { k: 's1',     r: 's', a: 0,  b: 15 },
  { k: 's2',     r: 's', a: 15, b: 30 },
  { k: 's3',     r: 's', a: 30, b: 45 },
  { k: 'f1',     r: 's', a: 45, b: 50 },
  { k: 'f2',     r: 's', a: 50, b: 59 },
  { k: 'f3',     r: 's', a: 59, b: 70 },
  { k: 'rescue', r: 'rescue', a: 0, b: 14 },
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
    <rect x="12" y="-40" width="12" height="9" rx="3" fill="${band ? '#7ee2a8' : '#f0cc7a'}" stroke="#0d1226" stroke-width="2"/></g>`;
}
// البوابة: عمودان + قارئ + حاجز يرتفع (open ٠..١)
function gateSVG(x, open, state) {
  const glow = state === 'ok' ? '#7ee2a8' : state === 'alarm' ? '#ff5252' : '#55607a';
  return `<g transform="translate(${x} 560)"><rect x="-14" y="-200" width="28" height="200" rx="6" fill="#55607a"/><rect x="186" y="-200" width="28" height="200" rx="6" fill="#55607a"/>
    <rect x="-20" y="-214" width="240" height="22" rx="8" fill="#2a3150"/>${txt(100, -198, L('مدخل المصمك', 'Masmak entrance'), 15, '#f0cc7a')}
    <g transform="translate(0 -96) rotate(${-82 * open})"><rect x="0" y="-9" width="196" height="18" rx="9" fill="#f3ead2" stroke="#c62828" stroke-width="3"/>
      ${[30, 80, 130].map(v => `<rect x="${v}" y="-9" width="22" height="18" fill="#c62828"/>`).join('')}</g>
    <g transform="translate(-58 -120)"><rect x="-26" y="-36" width="52" height="72" rx="10" fill="#1c1f27" stroke="${glow}" stroke-width="4"/>
      ${txt(0, -6, '📡', 22, '#fff')}<circle cy="20" r="7" fill="${glow}"/></g></g>`;
}
function counter(x, y, n, names, alarm) {
  return `<g transform="translate(${x} ${y})"><rect x="-170" y="-60" width="340" height="${names ? 190 : 110}" rx="18" fill="#1c1f27" stroke="${alarm ? '#ff5252' : '#f0cc7a'}" stroke-width="4"/>
    ${txt(0, -24, L('👥 داخل المتحف', '👥 Inside the museum'), 22, '#9aa8d8')}${txt(0, 34, N(n), 54, alarm ? '#ff5252' : '#7ee2a8', 900)}
    ${names ? txt(0, 90, names.join(' · '), 22, '#f3ead2') : ''}</g>`;
}

/* 🚪 البوابة الذكية: ثلاثة زوار يمرّرون أساورهم */
function gateScene(c, t) {
  const GX = 640;
  let n = 0, open = 0, state = '';
  const people = [0, 1, 2].map(i => {
    const t0 = 1 + i * 3.6;                         // كل زائر: يمشي للقارئ ← يمرّر ← يعبر
    const k1 = seg(c, t0, t0 + 1.4), k2 = seg(c, t0 + 2, t0 + 3.4);
    const x = k2 > 0 ? lerp(GX - 70, GX + 330 + i * 70, ease(k2)) : lerp(-60, GX - 70, ease(k1));
    const at = c >= t0 + 1.4 && c < t0 + 2.4;
    if (c >= t0 + 1.6) n = i + 1;
    if (c >= t0 + 1.5 && c < t0 + 3.2) { open = Math.max(open, seg(c, t0 + 1.5, t0 + 2) * (1 - seg(c, t0 + 2.8, t0 + 3.2))); }
    if (at) state = 'ok';
    return { x, at, walk: (k1 > 0 && k1 < 1) || (k2 > 0 && k2 < 1) ? t : 0 };
  });
  const names = NAMES.slice(0, n);
  const cap = c < 1 ? ['🚪', L('البوابة الذكية: لكل زائر أسورة باسمه', 'The smart gate: every visitor gets a wristband with his name')]
    : c < 12 ? ['🎫', L(`يمرّر أسورته… الحاجز يفتح، والعدد يزيد: ${N(n)}`, `He taps his wristband… the barrier opens, the count goes up: ${n}`)]
    : ['🔢', L('المتحف يعرف دائمًا من بداخله', 'The museum always knows who is inside')];
  return { svg: BG + gateSVG(GX, open, state) + people.map((p, i) => person(p.x, 560, COLS[i], p.at, p.walk)).join('')
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

/* 🤖 الإنقاذ: البوابة تفتح وحدها، روبوت الإنقاذ يرشد الزوار للخروج، وأسماؤهم تصل للدفاع المدني */
function rescueScene(c, t) {
  const GX = 300;
  const fk = 1.1 + Math.sin(t * 2) * .05;
  const open = seg(c, .5, 1.5);
  const rx = c < 2 ? lerp(-120, 120, ease(seg(c, .5, 2))) : c < 5.5 ? lerp(120, 900, ease(seg(c, 2, 5.5))) : c < 6.5 ? 900 : lerp(900, -200, ease(seg(c, 6.5, 12.5)));
  const out = [0, 1, 2].map(i => c >= 6.5 + i * .4);
  const px = i => out[i] ? lerp(1000 + i * 70, -200 + i * 70, ease(seg(c, 6.5 + i * .4, 12.5 + i * .4))) : 1000 + i * 70;
  const gone = [0, 1, 2].filter(i => px(i) < GX - 30).length;
  const n = 3 - gone;
  const beacon = Math.sin(t * 10) > 0 ? '#ff5252' : '#3b8bff';
  const robot = `<g transform="translate(${rx} 560)">${car4('rsc', 'r2')}<circle cx="0" cy="-48" r="12" fill="${beacon}"/>
      ${c >= 5.5 && c < 9 ? `<g transform="translate(0 -130)"><rect x="-120" y="-34" width="240" height="56" rx="18" fill="#f3ead2"/>${txt(0, 4, L('🔊 اتبعوني إلى المخرج!', '🔊 Follow me to the exit!'), 22, '#0d1226', 900)}</g>` : ''}
      ${txt(0, 60, L('روبوت الإنقاذ', 'Rescue robot'), 18, '#82b1ff')}</g>`;
  const msg = c < 9 ? L(`🚨 حريق في متحف المصمك.<br>👥 بالداخل ٣: ${NAMES.join('، ')}<br>🚪 البوابة مفتوحة للإخلاء`, `🚨 Fire at Masmak Museum.<br>👥 3 inside: ${NAMES.join(', ')}<br>🚪 Gate open for evacuation`)
    : L('✅ تم إخلاء جميع الزوار.<br>👥 بالداخل: ٠', '✅ All visitors are out.<br>👥 Inside: 0');
  const cap = c < 2 ? ['🚪', L('حريق! البوابة تفتح وحدها… ولا تُغلق على أحد', 'Fire! The gate opens by itself… it never locks anyone in')]
    : c < 6 ? ['🤖', L('روبوت الإنقاذ ينطلق إلى الزوار', 'The rescue robot drives to the visitors')]
    : c < 12.5 ? ['🔊', L('«اتبعوني إلى المخرج»… والعدد ينقص', '“Follow me to the exit”… and the count goes down')]
    : ['✅', L('الجميع في الخارج… ورسالة للدفاع المدني', 'Everyone is out… and Civil Defense is told')];
  return { svg: BG + `<g transform="translate(1250 560)">${smoke(0, 0, fk, t)}${fire(0, 0, fk, t)}</g>` + gateSVG(GX, open, 'alarm')
      + [0, 1, 2].map(i => person(px(i), 560, COLS[i], false, out[i] && px(i) > -150 ? t : 0)).join('') + robot
      + counter(800, 150, n, null, true) + phone(1440, 300, msg, true), cap };
}

function endScene(c, t) {
  const o = seg(c, .3, 1.8);
  return { svg: GRAD + BG + (TUR.masmak3D ? TUR.masmak3D(t * .5, 800, 430, 120, .42, { ring: (i) => ((i + Math.floor(t * 6)) % 4 === 0 ? '#f0cc7a' : null) }) : '')
      + `<g transform="translate(230 600)">${car4('sel')}</g><g transform="translate(380 600)">${car4('ser', 'r2')}</g>`
      + helper(1220, 600, 20, true, '3', 'r2') + helper(1370, 600, 20, false, '4', '')
      + `<g opacity="${o}">${txt(800, 120, L('المصمك الذكي', 'Smart Al Masmak'), 76, '#f0cc7a', 900)}${txt(800, 180, L('متحف يرحّب بالجميع… ويحمي الجميع', 'A museum that welcomes everyone… and protects everyone'), 32, '#f3ead2')}</g>`,
    cap: ['🇸🇦', L('فكرة مبتكرة من السعودية، أرض الإبداع', 'An innovative idea from Saudi Arabia, the land of innovation')] };
}

const PARTS = [L('الدخول', 'Entry'), L('الزائر وعيناه', 'The visitor'), L('حماية الأثر', 'Artifact care'), L('الروبوتات', 'The robots'), L('الدفاع المدني', 'Civil Defense'), L('الخاتمة', 'Ending')];
const partOf = k => ['intro', 'gate'].includes(k) ? 0 : /^v/.test(k) ? 1 : k === 'care' ? 2 : /^s/.test(k) ? 3 : k === 'end' ? 5 : 4;
function frame(t) {
  const { i, c } = clock(t), s = SC[i];
  let F;
  if (s.r === 'v') F = { svg: T5.visitorSVG(c, t), cap: T5.visitorState(c).cap };
  else if (s.r === 's') F = { svg: T5.storySVG(c), cap: T5.storyState(c).cap };
  else F = ({ gate: gateScene, care: careScene, rescue: rescueScene, end: endScene })[s.r](c, t);
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
