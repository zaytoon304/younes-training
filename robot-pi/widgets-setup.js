/* =====================================================================
   أدوات الوحدة ٢ (نجهّز عقل نبيه):
   imager (برنامج تجهيز الكرت) · order (رتّب الخطوات) · desktop (سطح مكتب الـ Pi)
   تُحمَّل بعد widgets.js. كل الأصناف تبدأ بـ nb-
   ===================================================================== */
(function () {
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

/* بطاقة الشرح الجانبية: نفس شكل بطاقة لوحة Pi */
function info(sl, p, n, total) {
  const box = sl.querySelector('.nb-info');
  if (!box || !p) return;
  box.innerHTML = `${n ? `<div class="nb-stepno">الخطوة ${AR(n)} من ${AR(total)}</div>` : ''}<div class="nb-icon">${p.icon}</div>
    <h3>${p.ar}</h3>${p.en ? `<div class="nb-en" dir="ltr">${p.en}</div>` : ''}<p>${p.b}</p>`;
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
const panel = (h, p, hint) => `<div class="nb-panel">
    <div class="nb-info"><div class="nb-icon">👆</div><h3>${h}</h3><p>${p}</p></div>
    <div class="nb-hint">${hint}</div></div>`;

/* ---------- ١) برنامج Raspberry Pi Imager: المعلم يجهّز كرت الذاكرة ---------- */
const IMG_STEPS = [
  { scr: 'main', hl: 'dev', icon: '🍓', ar: 'اختر نوع اللوحة', en: 'Raspberry Pi Device', b: 'نضغط الزر الأول ونختار <b>Raspberry Pi 4</b>، لأنها عقل نبيه.' },
  { scr: 'main', hl: 'os', icon: '💿', ar: 'اختر نظام التشغيل', en: 'Operating System', b: 'نختار <b>Raspberry Pi OS (64-bit)</b>: النظام الرسمي، وفيه كل ما نحتاجه.' },
  { scr: 'main', hl: 'sd', icon: '💾', ar: 'اختر كرت الذاكرة', en: 'Storage', b: 'نختار الكرت الجديد. انتبه: كل ما في الكرت سيُمسح، فلا تختر كرتًا عليه مشروع آخر!' },
  { scr: 'main', hl: 'next', icon: '⚙️', ar: 'التالي… ثم «تعديل الإعدادات»', en: 'Next → Edit Settings', b: 'يسألنا البرنامج: هل تريد تعديل الإعدادات؟ نختار <b>نعم</b>، لنجهّز نبيه قبل أول تشغيل.' },
  { scr: 'set', hl: 'host', icon: '🏷️', ar: 'اسم الجهاز واسم المستخدم', en: 'Hostname · Username', b: 'نسمّي الجهاز <b>nabeeh</b>، ونكتب اسم مستخدم وكلمة مرور يحفظها المعلم.' },
  { scr: 'set', hl: 'wifi', icon: '📶', ar: 'شبكة الواي فاي', en: 'Wireless LAN', b: 'نكتب اسم شبكة المدرسة وكلمة مرورها، فيتصل نبيه بالإنترنت وحده من أول تشغيل.' },
  { scr: 'set', hl: 'ssh', icon: '🔑', ar: 'تفعيل SSH', en: 'Services → Enable SSH', b: 'يسمح لنا أن نكلّم نبيه من اللابتوب دون شاشة، ونحتاجه حين يمشي نبيه على الأرض.' },
  { scr: 'write', hl: 'write', icon: '⏳', ar: 'الكتابة على الكرت', en: 'Write', b: 'يكتب البرنامج النظام على الكرت ثم يتأكد منه. ننتظر من ١٠ إلى ٢٠ دقيقة… ولا ننزع الكرت!' },
];
function imagerHTML(i) {
  const st = IMG_STEPS[i] || { scr: 'main' };
  const done = k => IMG_STEPS.findIndex(x => x.hl === k) < i;     // الأزرار التي اخترناها قبل الخطوة الحالية
  const btn = (k, label, val) => `<div class="nb-ibtn ${st.hl === k ? 'hl' : ''} ${done(k) || st.hl === k ? 'set' : ''}">
      <small>${label}</small><b>${done(k) || st.hl === k ? val : 'CHOOSE'}</b></div>`;
  let body = '';
  if (st.scr === 'main') body = `<div class="nb-ilogo">🍓</div><div class="nb-irow">
      ${btn('dev', 'Raspberry Pi Device', 'RASPBERRY PI 4')}${btn('os', 'Operating System', 'RASPBERRY PI OS (64-BIT)')}${btn('sd', 'Storage', 'SD CARD · 32 GB')}</div>
      <div class="nb-inext ${st.hl === 'next' ? 'hl' : ''}">NEXT</div>`;
  if (st.scr === 'set') body = `<div class="nb-itabs"><span class="${st.hl !== 'ssh' ? 'on' : ''}">GENERAL</span><span class="${st.hl === 'ssh' ? 'on' : ''}">SERVICES</span></div>
      ${st.hl === 'ssh' ? `<div class="nb-ifield hl"><i class="nb-tick">✓</i> Enable SSH</div><div class="nb-ifield"><i class="nb-tick">✓</i> Use password authentication</div>`
      : `<div class="nb-ifield ${st.hl === 'host' ? 'hl' : ''}"><i class="nb-tick">✓</i> Set hostname: <u>nabeeh</u>.local</div>
         <div class="nb-ifield ${st.hl === 'host' ? 'hl' : ''}"><i class="nb-tick">✓</i> Username: <u>nabeeh</u> · Password: <u>••••••</u></div>
         <div class="nb-ifield ${st.hl === 'wifi' ? 'hl' : ''}"><i class="nb-tick">✓</i> Wireless LAN: <u>School-WiFi</u> · <u>••••••</u></div>
         <div class="nb-ifield"><i class="nb-tick">✓</i> Locale: <u>Asia/Riyadh</u></div>`}
      <div class="nb-inext">SAVE</div>`;
  if (st.scr === 'write') body = `<div class="nb-ilogo">💾</div><div class="nb-iprog"><div>Writing… 64%</div><span><i></i></span></div>
      <div class="nb-iwarn">⚠️ لا تنزع الكرت حتى تظهر رسالة النجاح</div>`;
  return `<div class="nb-win"><div class="nb-wbar"><span class="nb-dots"><b></b><b></b><b></b></span>Raspberry Pi Imager</div>
    <div class="nb-wbody ${st.scr}">${body}</div></div>`;
}

/* ---------- ٢) سطح مكتب Raspberry Pi OS ---------- */
const DESK_PARTS = {
  menu:    { icon: '🍓', ar: 'قائمة البرامج', en: 'Applications Menu', b: 'زر التوتة: منه نفتح كل البرامج، ومنه نطفئ الجهاز بأمان.' },
  web:     { icon: '🌐', ar: 'المتصفح', en: 'Chromium Web Browser', b: 'نفتح به المواقع، مثل كروم تمامًا.' },
  files:   { icon: '📁', ar: 'مدير الملفات', en: 'File Manager', b: 'فيه كل ملفاتنا وبرامجنا، مرتبة في مجلدات.' },
  term:    { icon: '⌨️', ar: 'الطرفية', en: 'Terminal', b: 'نافذة سوداء نكتب فيها أوامر للجهاز مباشرة. يستعملها المبرمجون كثيرًا.' },
  wifi:    { icon: '📶', ar: 'الواي فاي', en: 'Wi-Fi', b: 'نتأكد منه أن نبيه متصل بالإنترنت.' },
  sound:   { icon: '🔊', ar: 'الصوت', en: 'Volume', b: 'نرفع منه صوت نبيه أو نخفضه، ونختار السماعة.' },
  clock:   { icon: '🕐', ar: 'الساعة', en: 'Clock', b: 'تضبط نفسها من الإنترنت.' },
  trash:   { icon: '🗑️', ar: 'سلة المحذوفات', en: 'Wastebasket', b: 'الملفات التي نحذفها تذهب هنا أولًا، ونقدر نرجعها.' },
};
const DESK_TOUR = ['menu', 'web', 'files', 'term', 'wifi', 'sound', 'clock', 'trash'];
function deskHTML() {
  const t = (k, inner, cls = '') => `<span class="nb-dp ${cls}" data-p="${k}">${inner}</span>`;
  return `<div class="nb-desk">
    <div class="nb-dbar">${t('menu', '🍓')}${t('web', '🌐')}${t('files', '📁')}${t('term', '⌨️')}
      <span class="nb-dsp"></span>${t('wifi', '📶')}${t('sound', '🔊')}${t('clock', '10:30', 'txt')}</div>
    <div class="nb-dwall">${t('trash', '🗑️<small>Wastebasket</small>', 'icon')}<div class="nb-dhill a"></div><div class="nb-dhill b"></div></div>
  </div>`;
}

/* ---------- ٣) رتّب الخطوات: لعبة ترتيب بالضغط ---------- */
/* خلط ثابت (لا عشوائي) حتى يرى كل الطلاب نفس الترتيب: البطاقة i تذهب للمكان (k·i + 1) mod n،
   و k أصغر عدد أكبر من ١ لا يقبل القسمة المشتركة مع n، فالنتيجة ترتيب كامل لا يطابق الصحيح */
function mixed(n) {
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  let k = 2; while (gcd(k, n) !== 1) k++;
  const out = []; for (let i = 0; i < n; i++) out[(k * i + 1) % n] = i;
  return out;
}

Object.assign(window.DECK_TYPES, {
  imager: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '👨‍🏫 مهمة المعلم'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-grid wide">${panel('نجهّز كرت الذاكرة بالنظام', 'اضغط «التالي» لنمشي مع البرنامج خطوة خطوة', `⬅️ «التالي» للخطوات (${AR(IMG_STEPS.length)})`)}
        <div class="nb-stage nb-imgwrap">${imagerHTML(-1)}</div></div>${IMG_STEPS.map(() => '<i class="f"></i>').join('')}</div>`,

  desktop: s => `<div class="slide light">
      <div class="kicker">${s.kicker || 'شاشة تفاعلية'}</div>
      <h2 class="title" style="margin-bottom:6px">${s.title}</h2>
      <div class="nb-grid wide">${panel('اضغط على أي شيء في الشاشة', 'أو اضغط «التالي» لنتعرف عليها واحدًا واحدًا', `👆 اضغط أي شيء · ⬅️ «التالي» للجولة (${AR(DESK_TOUR.length)})`)}
        <div class="nb-stage ix">${deskHTML()}</div></div>${DESK_TOUR.map(() => '<i class="f"></i>').join('')}</div>`,

  order: s => { const mix = mixed(s.items.length); return `<div class="slide light">
      <div class="kicker">${s.kicker || '🧩 رتّب الخطوات'}</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="nb-ohint">${s.hint || 'اضغط البطاقات بالترتيب الصحيح: الأولى، ثم الثانية…'}</div>
      <div class="nb-order ix" style="grid-template-columns:repeat(${s.cols || 3},1fr)">
        ${mix.map(i => `<div class="nb-ocard" data-i="${i}"><span class="nb-onum"></span><div class="nb-oicon">${s.items[i].icon}</div>
          <h3>${s.items[i].h}</h3>${s.items[i].b ? `<p>${s.items[i].b}</p>` : ''}</div>`).join('')}
      </div>
      <div class="nb-omsg"><span></span><button class="nb-btn ghost ix nb-oreset">↺ من جديد</button></div>
      ${s.items.map(() => '<i class="f"></i>').join('')}</div>`; },
});

/* لعبة الترتيب: كل ضغطة صحيحة تأخذ رقمها، والخطأ يهتز */
function orderSet(sl, s, n) {            // n = عدد البطاقات الصحيحة الظاهرة
  sl.dataset.n = n;
  sl.querySelectorAll('.nb-ocard').forEach(c => { const i = +c.dataset.i, on = i < n;
    c.classList.toggle('ok', on); c.querySelector('.nb-onum').textContent = on ? AR(i + 1) : ''; });
  const msg = sl.querySelector('.nb-omsg span');
  msg.innerHTML = n >= s.items.length ? (s.done || '🎉 ممتاز! هذا هو الترتيب الصحيح') : n ? `أحسنت… بقي ${AR(s.items.length - n)}` : '';
  sl.querySelector('.nb-omsg').classList.toggle('win', n >= s.items.length);
}

Object.assign(window.DECK_BIND, {
  desktop(sl) { sl.querySelectorAll('.nb-dp').forEach(d => d.addEventListener('click', () => deskShow(sl, d.dataset.p))); },
  order(sl, s) {
    orderSet(sl, s, 0);
    sl.querySelectorAll('.nb-ocard').forEach(c => c.addEventListener('click', () => {
      const n = +sl.dataset.n, i = +c.dataset.i;
      if (i < n) return;
      if (i === n) orderSet(sl, s, n + 1);
      else { c.classList.remove('no'); void c.offsetWidth; c.classList.add('no'); }
    }));
    sl.querySelector('.nb-oreset').onclick = () => orderSet(sl, s, 0);
  },
});
function deskShow(sl, k) {
  sl.querySelectorAll('.nb-dp').forEach(d => d.classList.toggle('sel', d.dataset.p === k));
  sl.querySelector('.nb-desk').classList.add('has-sel');
  info(sl, DESK_PARTS[k]);
}

const baseStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (baseStep) baseStep(step, s);
  const sl = document.querySelector('#stage .slide');
  if (!sl) return;
  if (s.t === 'imager' && step > 0) {
    sl.querySelector('.nb-imgwrap').innerHTML = imagerHTML(step - 1);
    info(sl, IMG_STEPS[step - 1], step, IMG_STEPS.length);
  }
  if (s.t === 'desktop' && step > 0) deskShow(sl, DESK_TOUR[step - 1]);
  if (s.t === 'order') orderSet(sl, s, Math.max(step, +sl.dataset.n || 0));
};

window.NB_SETUP = { IMG_STEPS, DESK_PARTS, DESK_TOUR, imagerHTML, mixed };
})();
