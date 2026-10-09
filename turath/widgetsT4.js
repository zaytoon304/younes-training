/* =====================================================================
   «لمسة تراث» — أدوات الإنذار والبلاغ (إضافات ٩ أكتوبر ٢٠٢٦)
   الأنواع: alertlcd (شاشة المحطة: صفحات إعلانية كل ثانيتين) · tgphone (بلاغ الدفاع المدني عبر تيليجرام)
   أداة واحدة للعربية والإنجليزية (DECK.lang === 'en')، فلا تحتاج make-en.py
   كل نقرة = خطوة (.f)، وتُصوَّر خطوة خطوة في البوربوينت (STEPPED في capture-pptx.js)
   ===================================================================== */
(function () {
const EN = (window.DECK || {}).lang === 'en';
const L = (ar, en) => EN ? en : ar;
const N = n => EN ? String(n) : window.ARD.AR(n);
const { beep, lcdHTML, lcdSet } = window.TUR;

/* صفحات الشاشة كما في كود المحطة الحقيقي (station.ino)، والشاشة إنجليزية دائمًا */
const PAGES = [
  { a: 'Masmak Museum', b: 'Status: SAFE', mode: 'safe' },
  { a: '!! FIRE ALERT !!', b: 'Fire level: 70%', mode: 'alert',
    t: L('🔥 المحطة ترى اللهب: الشاشة تعلن الخطر ونسبته', '🔥 The station sees a flame: the screen announces the danger and its level') },
  { a: 'Robots on their', b: 'way to respond', mode: 'alert',
    t: L('🚒 الروبوتات في طريقها للتعامل مع الموقف', '🚒 The robots are on their way to respond') },
  { a: 'Civil Defense', b: 'notified', mode: 'alert',
    t: L('📱 أُبلغ الدفاع المدني برسالة على الجوال', '📱 Civil Defense has been notified by phone') },
  { a: 'Mission complete', b: 'successfully!', mode: 'done',
    t: L('✅ انطفأت النار وعاد الروبوت إلى مكانه', '✅ The fire is out and the robot is back home') },
  { a: 'Museum is SAFE', b: 'now', mode: 'done',
    t: L('🏰 المتحف آمن الآن', '🏰 The museum is safe now') },
];

const BUB1 = L(
  '🚨 بلاغ إلى الدفاع المدني<br>حريق في <b>متحف المصمك</b><br>نسبة الحريق: <b>٧٠٪</b><br>🤖 الروبوتات تتعامل مع الموقف الآن',
  '🚨 Report to Civil Defense<br>Fire at the <b>Masmak Museum</b><br>Fire level: <b>70%</b><br>🤖 The robots are handling it now');
const BUB2 = L(
  '✅ تمت المهمة بنجاح<br>تمت السيطرة على الحريق في متحف المصمك<br><b>المتحف آمن الآن، لا داعي للحضور</b> 🙏',
  '✅ Mission completed successfully<br>The fire at the Masmak Museum is under control<br><b>The museum is safe, no need to come</b> 🙏');

Object.assign(window.DECK_TYPES, {
  alertlcd: s => `<div class="slide light alertlcd">
      <div class="kicker">${s.kicker || L('📟 شاشة المحطة', '📟 The station screen')}</div>
      <h2 class="title" style="margin-bottom:22px">${s.title}</h2>
      <div class="algrid">
        <div class="alscreen">
          <div class="allcd" id="allcd">${lcdHTML('alglass')}</div>
          <div class="alled"><span class="dot red" id="alred"></span>${L('ليد أحمر', 'Red LED')}<span class="dot blue"></span>${L('ليد أزرق', 'Blue LED')}<span class="bz" id="albz">🔔</span>${L('البازر', 'Buzzer')}</div>
          <div class="alnote">⏱️ ${L(`كل صفحة ${N(2)} ثانية… مثل لوحة الإعلانات`, 'Each page stays 2 seconds… like an advert board')}</div>
        </div>
        <div class="alsteps">${PAGES.slice(1).map((p, i) => `<div class="alstep f ${p.mode}"><span class="aln">${N(i + 1)}</span><div><div class="alt">${p.t}</div><code>${p.a} / ${p.b}</code></div></div>`).join('')}</div>
      </div></div>`,

  tgphone: s => `<div class="slide light tgphone">
      <div class="kicker">${s.kicker || L('📱 بلاغ الدفاع المدني', '📱 Reporting to Civil Defense')}</div>
      <h2 class="title" style="margin-bottom:22px">${s.title}</h2>
      <div class="tggrid">
        <div class="tgside">
          <div class="tgpt"><span>📶</span><div><b>${L('شبكة Z1', 'The Z1 network')}</b>${L('المحطة والروبوتان على الشبكة نفسها', 'The station and both robots share one network')}</div></div>
          <div class="tgpt"><span>🤖</span><div><b>${L('بوت تيليجرام', 'A Telegram bot')}</b>${L('المحطة ترسل البلاغ وحدها، دون أن يلمسها أحد', 'The station sends the report by itself, no one touches it')}</div></div>
          <div class="tgpt"><span>🚒</span><div><b>${L('لا داعي للحضور', 'No need to come')}</b>${L('رسالة النجاح توفّر وقت الدفاع المدني وجهده', 'The success message saves Civil Defense time and effort')}</div></div>
        </div>
        <div class="tgdev"><div class="tgscreen">
          <div class="tghead"><span class="tgav">🛡️</span><div><b>${L('حارس المصمك', 'Masmak Guard')}</b><small>${L('بوت', 'bot')}</small></div></div>
          <div class="tgchat">
            <div class="tgday">${L('اليوم', 'Today')}</div>
            <div class="tgb f">${BUB1}<i>${N(10)}:${N(42)} ✓✓</i></div>
            <div class="tgwork f">🚒 ${L('الروبوتات تعمل…', 'Robots at work…')} 💧🌀</div>
            <div class="tgb ok f">${BUB2}<i>${N(10)}:${N(43)} ✓✓</i></div>
          </div>
        </div></div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  alertlcd(sl) {
    const glass = sl.querySelector('#alglass');
    lcdSet(glass, PAGES[0].a, PAGES[0].b);
  },
});

/* كل نقرة تقلب صفحة الشاشة وتشغّل الإنذار */
const prevStep = window.DECK_ONSTEP;
window.DECK_ONSTEP = (step, s) => {
  if (prevStep) prevStep(step, s);
  if (!s || s.t !== 'alertlcd') return;
  const sl = document.querySelector('#stage .alertlcd'); if (!sl) return;
  const p = PAGES[Math.min(step, PAGES.length - 1)];
  lcdSet(sl.querySelector('#alglass'), p.a, p.b);
  sl.querySelector('#allcd').className = 'allcd ' + p.mode;
  sl.querySelector('#alred').classList.toggle('on', p.mode === 'alert');
  sl.querySelector('#albz').classList.toggle('on', p.mode === 'alert');
  sl.querySelectorAll('.alstep').forEach((el, i) => el.classList.toggle('now', i === step - 1));
  if (p.mode === 'alert' && step === 1 && !document.body.classList.contains('capture')) { beep(1400, 140); setTimeout(() => beep(1400, 140), 260); }
};
})();
