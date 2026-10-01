/* =====================================================================
   أكاديمية سيارة الروبوت — المرحلة الثانية: الطاقة والتركيب
   الأنواع: batlab (مختبر البطارية) · checklist (قائمة فحص تفاعلية)
   دوائر البناء: carmech (التركيب الميكانيكي) · carwire (التوصيل الكهربائي)
   أرقام تقريبية واقعية: السعة «الفعلية» تحت حمل المحركات أقل من المكتوب على البطارية،
   والدرايفر L298N يستهلك نحو ٢ فولت، والأردوينو يحتاج ٧ فولت على الأقل عبر VIN.
   ===================================================================== */
(function () {
const { AR, highlight } = window.ARD;
const { B2, wire } = window.ARD2;
const f1 = v => AR((Math.round(v * 10) / 10).toFixed(1)).replace('.', '٫');

/* ================== مختبر البطارية ================== */
const PACKS = [
  { k: 'aa4', name: '٤ × AA قلوية', cells: 4, cv: 1.5, cap: 1200, col: '#e0b400' },
  { k: 'aa6', name: '٦ × AA قلوية', cells: 6, cv: 1.5, cap: 1200, col: '#e0b400' },
  { k: 'nimh', name: '٦ × AA قابلة للشحن', cells: 6, cv: 1.2, cap: 1900, col: '#2e9e6b' },
  { k: 'v9', name: '٩ فولت مربعة', cells: 1, cv: 9, cap: 300, col: '#8e44ad' },
  { k: 'li', name: '٢ × 18650 ليثيوم', cells: 2, cv: 3.7, cap: 2500, col: '#2b6fc0' },
];
const DROP = 2, BASE = 90;                                             // هبوط الدرايفر · الأردوينو والدرايفر والحساسات (مللي أمبير)

/* ================== دائرة البناء: التركيب الميكانيكي (من أعلى، المقدمة يمينًا) ================== */
const screws = pts => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#c9ccd3" stroke="#6b7180" stroke-width="2"/>`).join('');
B2.carmech = { flow: 10, steps: [
  { h: 'الهيكل', b: 'اللوح المثقّب. انزع الورق الواقي عن الأكريليك أولًا، وحدد المقدمة.' },
  { h: 'المحركان', b: 'ثبّت كل محرك بحامليه وبرغيين طويلين، وأسلاكه نحو الداخل. المحركان متقابلان كالمرآة.' },
  { h: 'العجلتان', b: 'اضغط كل عجلة على محور المحرك حتى النهاية، بلا ميل.' },
  { h: 'العجلة الحرة في الخلف', b: 'بأربعة أعمدة نحاسية، حتى يصبح الهيكل أفقيًا تمامًا.' },
  { h: 'حامل البطاريات والمفتاح', b: 'في الخلف ليتوازن الوزن فوق العجلات. المفتاح في مكان تصله يدك بسهولة.' },
  { h: 'الدرايفر L298N', b: 'في المنتصف، قريبًا من المحركين لتقصر أسلاكهما.' },
  { h: 'الأردوينو', b: 'على أعمدة بلاستيكية حتى لا يلمس أسفلُه البراغي أو الهيكل المعدني.' },
  { h: 'الرأس: سيرفو وحساس مسافة', b: 'في المقدمة تمامًا، والحساس أفقي ينظر للأمام.' },
  { h: 'حساسات الخط تحت المقدمة', b: 'على ارتفاع ١ إلى ٢ سم عن الأرض، متجهة للأسفل.' },
  { h: 'اهزز السيارة!', b: 'لا شيء يتحرك أو يهتز؟ العجلتان تدوران بحرية؟ انتقل إلى الكهرباء.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg mech">
  <rect width="900" height="520" fill="#f7f4ec"/>
  <g class="bs mdrop" data-s="1"><rect x="200" y="120" width="500" height="280" rx="36" fill="rgba(120,170,230,.18)" stroke="#5b8fd6" stroke-width="5"/>
    ${[[240, 160], [660, 160], [240, 360], [660, 360], [450, 260]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#f7f4ec" stroke="#5b8fd6" stroke-width="2"/>`).join('')}
    <text x="805" y="268" class="lbl" style="font-size:22px">المقدمة ▶</text></g>
  <g class="bs mdrop" data-s="2"><rect x="520" y="126" width="110" height="52" rx="8" fill="#f4d35e" stroke="#8a6d1f" stroke-width="3"/><rect x="520" y="342" width="110" height="52" rx="8" fill="#f4d35e" stroke="#8a6d1f" stroke-width="3"/>
    ${screws([[540, 152], [610, 152], [540, 368], [610, 368]])}<text x="575" y="157" class="lbl" style="font-size:15px">TT</text><text x="575" y="373" class="lbl" style="font-size:15px">TT</text></g>
  <g class="bs mdrop" data-s="3">${[60, 400].map(y => `<g><rect x="505" y="${y}" width="140" height="60" rx="22" fill="#23262e"/>${Array.from({ length: 7 }, (_, i) => `<line x1="${520 + i * 18}" y1="${y + 6}" x2="${520 + i * 18}" y2="${y + 54}" stroke="#4a4f5c" stroke-width="5"/>`).join('')}<circle cx="575" cy="${y + 30}" r="10" fill="#f4d35e"/></g>`).join('')}</g>
  <g class="bs mdrop" data-s="4"><circle cx="240" cy="260" r="32" fill="#9aa1b3" stroke="#6b7180" stroke-width="4"/><circle cx="240" cy="260" r="14" fill="#dfe3ea"/>${screws([[214, 234], [266, 234], [214, 286], [266, 286]])}</g>
  <g class="bs mdrop" data-s="5"><rect x="290" y="190" width="120" height="140" rx="12" fill="#1c1f27"/><rect x="304" y="204" width="40" height="112" rx="20" fill="#2e9e6b"/><rect x="356" y="204" width="40" height="112" rx="20" fill="#2e9e6b"/>
    <rect x="300" y="140" width="46" height="34" rx="6" fill="#3a3f4d"/><rect x="310" y="146" width="16" height="22" rx="3" fill="#e74c3c"/><text x="323" y="134" class="lbl" style="font-size:13px">ON/OFF</text></g>
  <g class="bs mdrop" data-s="6"><rect x="426" y="200" width="100" height="120" rx="8" fill="#c0392b"/>${Array.from({ length: 5 }, (_, i) => `<rect x="${440 + i * 15}" y="214" width="8" height="70" fill="#1c1f27"/>`).join('')}<text x="476" y="306" class="lbl" style="font-size:14px;fill:#fff">L298N</text></g>
  <g class="bs mdrop" data-s="7"><rect x="540" y="196" width="120" height="128" rx="10" fill="#0e7c86"/><rect x="552" y="206" width="30" height="24" rx="3" fill="#c9ccd3"/><rect x="586" y="268" width="48" height="16" fill="#15171e"/><text x="600" y="312" class="lbl" style="font-size:14px;fill:#fff">UNO</text>
    ${screws([[548, 204], [652, 204], [548, 316], [652, 316]])}</g>
  <g class="bs mdrop" data-s="8"><rect x="672" y="236" width="40" height="48" rx="6" fill="#2b6fc0"/><circle cx="692" cy="260" r="8" fill="#fff"/>
    <g class="mhead" style="transform-origin:700px 260px"><rect x="706" y="206" width="34" height="108" rx="6" fill="#1f5fae"/><circle cx="726" cy="234" r="13" fill="#dfe3ea"/><circle cx="726" cy="286" r="13" fill="#dfe3ea"/></g></g>
  <g class="bs mdrop" data-s="9">${[178, 342].map(y => `<rect x="690" y="${y - 14}" width="34" height="28" rx="4" fill="#1f5fae" stroke="#8fb8ff" stroke-width="2" stroke-dasharray="4 3"/><circle cx="700" cy="${y}" r="5" fill="#e8e3d6"/>`).join('')}
    <text x="707" y="150" class="lbl" style="font-size:12px">IR</text></g>
  <g class="mspin">${[90, 430].map(y => `<circle cx="575" cy="${y}" r="26" fill="none" stroke="#2e9e6b" stroke-width="4" stroke-dasharray="10 8"/>`).join('')}</g>
</svg>` };

/* ================== دائرة البناء: التوصيل الكهربائي ================== */
const T = (x, y, t, c = '#2b6fc0') => `<rect x="${x - 13}" y="${y - 10}" width="26" height="20" rx="3" fill="${c}"/><text x="${x}" y="${y + 30}" class="lbl" style="font-size:11px">${t}</text>`;
const P = (x, y, t) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#0b0d12"/><text x="${x}" y="${y - 12}" class="lbl" style="font-size:12px;fill:#e8f6f7">${t}</text>`;
B2.carwire = { flow: 9, steps: [
  { h: 'القطع في أماكنها', b: 'البطارية والمفتاح، والدرايفر، والأردوينو، والمحركان. كل شيء مطفأ.' },
  { h: 'موجب البطارية إلى المفتاح', b: 'السلك الأحمر يمر أولًا بالمفتاح: هكذا نقطع الكهرباء كلها بضغطة.' },
  { h: 'المفتاح إلى 12V · والسالب إلى GND', b: 'إلى مشبك الطاقة في الدرايفر. ٧٫٤ فولت تدخل هنا.' },
  { h: 'GND الدرايفر إلى GND الأردوينو', b: 'الأرضي المشترك: أهم سلك في السيارة كلها!' },
  { h: '5V الدرايفر إلى 5V الأردوينو', b: 'منظّم الدرايفر يغذّي الأردوينو، مع إبقاء غطاء «5V-EN» في مكانه.' },
  { h: 'المحركان إلى OUT1-2 وOUT3-4', b: 'الأيسر على اليسار والأيمن على اليمين.' },
  { h: 'ENA ← 5 · IN1 ← 7 · IN2 ← 8', b: 'انزع غطاء ENA أولًا لنتحكم في السرعة.' },
  { h: 'ENB ← 6 · IN3 ← 9 · IN4 ← 10', b: 'وانزع غطاء ENB. هذا هو التوصيل الموحّد للأكاديمية كلها.' },
  { h: 'شغّل المفتاح!', b: 'تضيء ليدات الدرايفر والأردوينو، والطاقة تجري في مسارها.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 cw">
  <rect width="900" height="520" fill="#f7f4ec"/>
  <g class="bs" data-s="1">
    <rect x="40" y="330" width="150" height="120" rx="12" fill="#1c1f27"/><rect x="54" y="344" width="122" height="40" rx="20" fill="#2e9e6b"/><rect x="54" y="396" width="122" height="40" rx="20" fill="#2e9e6b"/>
    <text x="115" y="470" class="lbl" style="font-size:15px">بطارية 7.4V</text><text x="196" y="352" class="lbl" style="font-size:18px;fill:#e74c3c">+</text><text x="196" y="432" class="lbl" style="font-size:20px">−</text>
    <rect x="236" y="230" width="60" height="44" rx="8" fill="#3a3f4d"/><rect x="250" y="238" width="18" height="28" rx="4" class="swk"/><text x="266" y="222" class="lbl" style="font-size:13px">المفتاح</text>
    <rect x="330" y="180" width="220" height="200" rx="12" fill="#c0392b"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${390 + i * 14}" y="232" width="8" height="80" fill="#1c1f27"/>`).join('')}<text x="440" y="344" class="lbl" style="font-size:17px;fill:#fff">L298N</text>
    <circle cx="350" cy="364" r="7" class="dled"/>
    ${T(360, 172, 'OUT1')}${T(392, 172, 'OUT2')}${T(488, 172, 'OUT3')}${T(520, 172, 'OUT4')}
    ${T(380, 390, '12V')}${T(412, 390, 'GND')}${T(444, 390, '5V')}
    ${['ENA', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB'].map((t, i) => `<rect x="${544}" y="${226 + i * 22}" width="12" height="12" fill="#f0cc7a"/><text x="538" y="${236 + i * 22}" class="lbl" style="font-size:11px;fill:#fff;text-anchor:end">${t}</text>`).join('')}
    <rect x="660" y="190" width="200" height="250" rx="14" fill="#0e7c86"/><rect x="676" y="206" width="44" height="34" rx="4" fill="#c9ccd3"/><text x="760" y="330" class="lbl" style="font-size:20px;fill:#cfe">UNO</text><circle cx="840" cy="214" r="6" class="aled"/>
    ${[['5', 230], ['6', 254], ['7', 278], ['8', 302], ['9', 326], ['10', 350]].map(([t, y]) => P(676, y, t)).join('')}
    ${P(760, 420, '5V')}${P(800, 420, 'GND')}
    ${[[160, 90, 'الأيسر'], [690, 90, 'الأيمن']].map(([x, y, t]) => `<g transform="translate(${x} ${y})"><circle r="44" fill="#f4d35e" stroke="#8a6d1f" stroke-width="4"/><g class="cwspin">${[0, 90, 180, 270].map(a => `<rect x="-4" y="-38" width="8" height="32" rx="4" fill="#1c1f27" transform="rotate(${a})"/>`).join('')}</g><text y="66" class="lbl" style="font-size:15px">${t}</text></g>`).join('')}</g>
  ${wire('M190 360 C 214 360, 230 300, 252 274', 2, '#e74c3c')}
  ${wire('M282 254 C 330 254, 330 420, 380 400', 3, '#e74c3c')}${wire('M190 430 C 290 470, 400 460, 412 400', 3, '#1b2340')}
  ${wire('M412 400 C 420 480, 800 490, 800 426', 4, '#1b2340')}
  ${wire('M444 400 C 460 462, 760 470, 760 426', 5, '#e67e22')}
  ${wire('M200 90 C 300 90, 360 120, 360 162', 6, '#d62828')}${wire('M196 112 C 300 130, 392 120, 392 162', 6, '#1b2340')}
  ${wire('M650 90 C 560 90, 488 120, 488 162', 6, '#d62828')}${wire('M654 112 C 560 130, 520 120, 520 162', 6, '#1b2340')}
  ${[[0, 230, '#8e44ad'], [1, 278, '#2e9e6b'], [2, 302, '#e0b400']].map(([i, y, c]) => wire(`M556 ${232 + i * 22} C 610 ${232 + i * 22}, 620 ${y}, 670 ${y}`, 7, c)).join('')}
  ${[[3, 326, '#2b6fc0'], [4, 350, '#16a3b5'], [5, 254, '#d35400']].map(([i, y, c]) => wire(`M556 ${232 + i * 22} C 610 ${232 + i * 22}, 630 ${y}, 670 ${y}`, 8, c)).join('')}
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  batlab: s => `<div class="slide light">
      <div class="kicker">🔋 مختبر البطارية</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="bgrid3">
        <div class="bpick ix">${PACKS.map((p, i) => `<button class="bpk${i === 4 ? ' on' : ''}" data-i="${i}"><i style="background:${p.col}"></i>${p.name}</button>`).join('')}
          <label class="lsl"><span>🏎️ سرعة المحركين: <b id="bsv">70</b>٪</span><input type="range" id="bs" min="0" max="100" value="70"></label>
          <div class="btog"><button class="sndbtn" id="bsrv">🦾 الرادار (سيرفو): مطفأ</button><button class="sndbtn" id="bbt">📶 البلوتوث: مطفأ</button></div></div>
        <div class="bmid"><svg viewBox="0 0 600 220" class="bcells" id="bcells"></svg>
          <div class="bfacts"><div class="ac"><span>جهد المجموعة</span><b id="bV">—</b></div><div class="ac"><span>يصل للمحرك</span><b id="bM">—</b></div><div class="ac"><span>التيار الكلي</span><b id="bI">—</b></div></div>
          <div class="btank"><div class="btl">⏱️ زمن التشغيل المتوقع</div><div class="btbar"><i id="bfill"></i></div><b id="bT">—</b></div></div>
        <div class="bverd" id="bverd"></div>
      </div></div>`,

  checklist: s => `<div class="slide light">
      <div class="kicker">${s.kicker || '✅ قائمة الفحص'}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="clgrid ix">${s.items.map((it, i) => `<button class="cli" data-i="${i}"><b>☐</b><span><strong>${it.h}</strong><small>${it.b}</small></span></button>`).join('')}</div>
      <div class="clbar"><div class="clprog"><i id="clfill"></i></div><div class="cldone" id="cldone">${AR(0)} / ${AR(s.items.length)}</div></div></div>`,
});

Object.assign(window.DECK_BIND, {
  batlab(sl) {
    let pi = 4, srv = false, bt = false;
    const spd = sl.querySelector('#bs');
    const upd = () => {
      const p = PACKS[pi], V = p.cells * p.cv, sp = spd.value / 100, motV = Math.max(0, V - DROP);
      const I = BASE + 2 * (spd.value > 0 ? 60 + 190 * sp : 0) + (srv ? 120 : 0) + (bt ? 40 : 0);
      const mins = p.cap / I * 60;
      sl.querySelector('#bsv').textContent = spd.value;
      sl.querySelector('#bV').textContent = f1(V) + ' ف'; sl.querySelector('#bM').textContent = f1(motV) + ' ف'; sl.querySelector('#bI').textContent = AR(Math.round(I)) + ' م.أ';
      sl.querySelector('#bT').textContent = mins >= 60 ? `${f1(mins / 60)} ساعة` : `${AR(Math.round(mins))} دقيقة`;
      const fill = sl.querySelector('#bfill'); fill.style.width = Math.min(100, mins / 180 * 100) + '%'; fill.style.background = mins < 20 ? '#e74c3c' : mins < 60 ? '#e0b400' : '#2e9e6b';
      const n = p.cells, w = Math.min(84, 520 / n);
      sl.querySelector('#bcells').innerHTML = Array.from({ length: n }, (_, i) => { const x = 300 - n * w / 2 + i * w;
        return `<rect x="${x + 4}" y="40" width="${w - 8}" height="110" rx="12" fill="${p.col}"/><rect x="${x + w / 2 - 9}" y="30" width="18" height="12" rx="3" fill="#8a909c"/>
          <text x="${x + w / 2}" y="104" class="bct">${n > 4 ? '' : f1(p.cv)}</text>${i < n - 1 ? `<text x="${x + w}" y="104" class="bplus">+</text>` : ''}`; }).join('') +
        `<text x="300" y="196" class="bsum">${n > 1 ? `${AR(n)} × ${f1(p.cv)} = ` : ''}${f1(V)} فولت (توالي)</text>`;
      const v = [];
      v.push(V >= 7 ? ['ok', 'الأردوينو يعمل بثبات عبر VIN (يحتاج ٧ فولت على الأقل)'] : ['bad', 'أقل من ٧ فولت: الأردوينو قد يعيد التشغيل كلما تحركت المحركات']);
      v.push(motV < 4 ? ['bad', 'المحركان ضعيفان: الدرايفر يأكل نحو ٢ فولت'] : motV > 7.2 ? ['mid', 'أعلى من جهد المحرك المعتاد (٦ فولت): يسخن ويقصر عمره'] : ['ok', 'جهد مناسب للمحركين الأصفرين']);
      v.push(mins < 20 ? ['bad', 'تنفد في دقائق: لا تصلح لحصة كاملة'] : mins < 60 ? ['mid', 'تكفي حصة واحدة تقريبًا'] : ['ok', 'تكفي حصصًا متتالية']);
      v.push(p.k === 'li' ? ['ok', 'تُشحن مئات المرات: الأوفر على المدى البعيد'] : p.k === 'nimh' ? ['ok', 'تُشحن، لكن جهد الخلية ١٫٢ فقط'] : ['mid', 'تُرمى بعد نفادها: مكلفة على المدرسة']);
      sl.querySelector('#bverd').innerHTML = `<h3>${p.k === 'li' ? '🏆 الاختيار الأفضل' : 'التقييم'}</h3>` + v.map(([c, t]) => `<div class="bv ${c}"><b>${{ ok: '✅', mid: '⚠️', bad: '❌' }[c]}</b>${t}</div>`).join('');
    };
    sl.querySelectorAll('.bpk').forEach(b => b.onclick = () => { pi = +b.dataset.i; sl.querySelectorAll('.bpk').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    spd.oninput = upd;
    sl.querySelector('#bsrv').onclick = e => { srv = !srv; e.target.textContent = `🦾 الرادار (سيرفو): ${srv ? 'يعمل' : 'مطفأ'}`; upd(); };
    sl.querySelector('#bbt').onclick = e => { bt = !bt; e.target.textContent = `📶 البلوتوث: ${bt ? 'يعمل' : 'مطفأ'}`; upd(); };
    upd();
  },

  checklist(sl, s) {
    const items = [...sl.querySelectorAll('.cli')], n = items.length;
    const upd = () => {
      const k = items.filter(i => i.classList.contains('on')).length;
      sl.querySelector('#clfill').style.width = k / n * 100 + '%';
      const d = sl.querySelector('#cldone'); d.textContent = k === n ? '🚀 جاهزة للانطلاق!' : `${AR(k)} / ${AR(n)}`; d.classList.toggle('all', k === n);
    };
    items.forEach(b => b.onclick = () => { b.classList.toggle('on'); b.querySelector('b').textContent = b.classList.contains('on') ? '✔' : '☐'; upd(); });
    upd();
  },
});
})();
