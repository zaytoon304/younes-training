/* =====================================================================
   التفاعل الحي لعروض منصة جذور: تصويت المتدربين من جوالاتهم + التقييم الذاتي
   يحتاج: firebase-app-compat + firebase-firestore-compat + shared/qrcode.js
   المسارات في Firestore:
     courses/{دورة}/votes/{جلسة}_{مفتاح السؤال}/answers   ← { v, ts }
     courses/{دورة}/selfrate                               ← { mode, vals[5], total, ts }
   «الجلسة» رمز قصير يُنشئه المدرب لكل مجموعة متدربين، فلا تختلط الأصوات بين الدورات.
   ===================================================================== */
(function () {
const CONFIG = {
  apiKey: 'AIzaSyDGZ189UFD7Abp3S_AWXMbAjtlAz-Vs2_c',
  authDomain: 'younes-training-app.firebaseapp.com',
  projectId: 'younes-training-app',
  storageBucket: 'younes-training-app.firebasestorage.app',
  messagingSenderId: '711299008550',
  appId: '1:711299008550:web:dd252ae5bcabf04f2d7ee7',
};
const AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
/* العدد مع المعدود بصيغة عربية صحيحة: صوت واحد، صوتان، ٣ أصوات، ١١ صوتًا */
const COUNT = (n, [one, two, few, many]) => n === 1 ? one : n === 2 ? two : n <= 10 ? `${AR(n)} ${few}` : `${AR(n)} ${many}`;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

let db = null;
try { if (window.firebase) { firebase.apps.length || firebase.initializeApp(CONFIG); db = firebase.firestore(); } } catch (e) { console.warn('live: firebase unavailable', e); }

const LIVE = window.LIVE = {
  count: COUNT,
  ok: !!db,
  course: null,

  /* رابط أي صفحة داخل المنصة (يعمل محليًا ومنشورًا) */
  url(rel) { return new URL(rel, location.href).href; },

  /* رمز الجلسة الحالية وبدايتها — يُحفظ في جهاز المدرب */
  session() {
    const k = `live.${this.course}.session`;
    let s = store.get(k);
    if (!s) { s = { id: Math.random().toString(36).slice(2, 7), start: Date.now() }; store.set(k, s); }
    return s;
  },
  newSession() {
    store.set(`live.${this.course}.session`, { id: Math.random().toString(36).slice(2, 7), start: Date.now() });
    return this.session();
  },

  /* باركود بصيغة SVG */
  qr(text, px = 300) {
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), c = px / (n + 8);
    let r = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) r += `M${(x + 4) * c} ${(y + 4) * c}h${c}v${c}h-${c}z`;
    return `<svg viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" class="qr"><rect width="${px}" height="${px}" rx="${c * 2}" fill="#fff"/><path d="${r}" fill="#101B45"/></svg>`;
  },

  /* التصويت */
  voteDoc(key, sid = this.session().id) { return db.collection('courses').doc(this.course).collection('votes').doc(`${sid}_${key}`).collection('answers'); },
  vote(key, v, sid) { return db ? this.voteDoc(key, sid).add({ v, ts: Date.now() }) : Promise.reject(new Error('offline')); },
  listenVotes(key, n, cb) {
    if (!db) return () => {};
    return this.voteDoc(key).onSnapshot(snap => {
      const c = Array(n).fill(0);
      snap.forEach(d => { const v = d.data().v; if (v >= 0 && v < n) c[v]++; });
      cb(c);
    }, e => console.warn('live votes', e.message));
  },

  /* التقييم الذاتي */
  rate(mode, vals) {
    return db ? db.collection('courses').doc(this.course).collection('selfrate')
      .add({ mode, vals, total: vals.reduce((a, b) => a + b, 0), ts: Date.now() }) : Promise.reject(new Error('offline'));
  },
  listenRates(cb) {
    if (!db) return () => {};
    const start = this.session().start;
    return db.collection('courses').doc(this.course).collection('selfrate').where('ts', '>=', start).onSnapshot(snap => {
      const by = { pre: [], post: [], followup: [] };
      snap.forEach(d => { const x = d.data(); if (by[x.mode] && Array.isArray(x.vals)) by[x.mode].push(x.vals); });
      cb(by);
    }, e => console.warn('live rates', e.message));
  },
};

/* ---------- الربط بمحرك العروض ---------- */
window.DECK_HOOKS = window.DECK_HOOKS || [];
function voteKey(s) {                 // مفتاح ثابت للسؤال: معرّف المحور + ترتيب الشريحة فيه
  const m = window.DECK.modules[s.mi];
  return `${m.id}-${m.slides.indexOf(m.slides.find(x => x.title === s.title && x.t === s.t))}`;
}
LIVE.voteKey = voteKey;

window.DECK_HOOKS.push((sl, s) => {
  if (!LIVE.ok || s.t !== 'vote' || s.tap) return;
  const key = voteKey(s), sid = LIVE.session().id;
  sl.classList.add('live');
  const link = LIVE.url(`../shared/vote.html?c=${encodeURIComponent(LIVE.course)}&s=${sid}&k=${encodeURIComponent(key)}`);
  sl.insertAdjacentHTML('beforeend', `<div class="livebox ix" title="اضغط لتكبير الباركود">${LIVE.qr(link, 190)}
      <div><b>📱 صوّت بجوالك</b><span class="lcount">لا أصوات بعد</span></div></div>`);
  const opts = [...sl.querySelectorAll('.opt')];
  opts.forEach(o => o.insertAdjacentHTML('beforeend', '<div class="lbar"><i></i><span></span></div>'));
  const box = sl.querySelector('.livebox');
  box.onclick = () => LIVE.bigQR(link, s.title);
  const un = LIVE.listenVotes(key, opts.length, c => {
    const tot = c.reduce((a, b) => a + b, 0);
    box.querySelector('.lcount').textContent = tot ? COUNT(tot, ['صوت واحد', 'صوتان', 'أصوات', 'صوتًا']) : 'لا أصوات بعد';
    sl.classList.toggle('hasvotes', tot > 0);
    opts.forEach((o, i) => { const p = tot ? Math.round(c[i] / tot * 100) : 0;
      o.querySelector('.lbar i').style.width = p + '%'; o.querySelector('.lbar span').textContent = tot ? AR(p) + '٪' : ''; });
  });
  window.DECK_CLEANUP.push(un);
});

/* باركود كبير يملأ الشاشة */
LIVE.bigQR = (link, title) => {
  const d = document.createElement('div');
  d.className = 'qrbig';
  d.innerHTML = `<div class="qrcard">${LIVE.qr(link, 560)}<h3>${title || 'امسح الباركود'}</h3><p>امسح بكاميرا الجوال · اضغط في أي مكان للإغلاق</p></div>`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
};

/* زر الجلسة في شريط التحكم */
addEventListener('load', () => {
  const bar = document.getElementById('bar');
  if (!bar || !LIVE.ok) return;
  const b = document.createElement('button');
  const lbl = () => `📡 جلسة ${LIVE.session().id}`;
  b.textContent = lbl(); b.title = 'اضغط مرتين متتاليتين لبدء جلسة جديدة (تصفير الأصوات والتقييمات)';
  let armed = 0;
  b.onclick = e => {
    e.stopPropagation();
    if (Date.now() - armed < 1500) { LIVE.newSession(); b.textContent = '✓ جلسة جديدة'; setTimeout(() => { b.textContent = lbl(); render(); }, 1200); armed = 0; }
    else { armed = Date.now(); b.textContent = 'اضغط مرة أخرى للتصفير'; setTimeout(() => { if (armed) b.textContent = lbl(); }, 1500); }
  };
  bar.insertBefore(b, bar.lastElementChild);
});
})();
