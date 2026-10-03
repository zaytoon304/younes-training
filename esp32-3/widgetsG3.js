/* =====================================================================
   «ESP32 للمعلمين ٣» · مشاهد «الشرح الوافي» الجديدة (تُضاف إلى نوع explain من الجزء الأول)
   gear · caster · cells · trim · failsafe · irsens · prio · omni · vecadd · normalize
   ===================================================================== */
(function () {
const S = window.EXPLAIN_SCENES, { svg, clamp } = window.EXPLAIN_KIT;
const loop = (q, fn) => { let id = 0, last = 0; const f = ts => { const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; fn(dt); id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); q.clean(() => cancelAnimationFrame(id)); };
const gearPath = (r, n) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr = i % 2 ? r * .82 : r; d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1) + ' '; } return d + 'Z'; };

/* علبة التروس: سرعة أقل = قوة أكبر */
S.gear = {
  svg: svg(`<g transform="translate(150 200)"><g id="g1"><path d="${gearPath(40, 10)}" fill="#ffcf4a"/></g><text y="95" text-anchor="middle" class="ezt" style="font-size:17px">المحرك</text><text id="g1t" y="122" text-anchor="middle" class="ezt" style="font-size:17px;fill:#ffcf4a"></text></g>
    <g transform="translate(330 200)"><g id="g2"><path d="${gearPath(95, 24)}" fill="#c9cfe6"/><circle r="14" fill="#5b6383"/></g></g>
    <g transform="translate(590 200)"><g id="g3"><circle r="110" fill="#222"/><circle r="74" fill="#555"/>${[0, 60, 120].map(a => `<rect x="-6" y="-72" width="12" height="144" rx="6" fill="#888" transform="rotate(${a})"/>`).join('')}</g><text y="140" text-anchor="middle" class="ezt" style="font-size:17px">العجلة</text><text id="g3t" y="166" text-anchor="middle" class="ezt" style="font-size:17px;fill:#46d68c"></text></g>
    <text id="gtt" x="380" y="40" text-anchor="middle" class="ezt" style="font-size:22px;fill:#ffcf4a"></text>`),
  ctl: `<span class="rl">نسبة التروس</span><input type="range" min="1" max="120" value="48"><button data-a="r1">١:١ بلا تروس</button><button data-a="r48">١:٤٨ (TT)</button>`,
  bind(q, cap) { const r = q.$('input'); let a = 0;
    q.btn('r1', () => r.value = 1); q.btn('r48', () => r.value = 48);
    loop(q, dt => { const n = +r.value, rpm = 9600 / n, torque = 0.8 * n, climbs = torque > 20;
      a += 9600 / 60 * 360 * dt / 40; q.$('#g1').setAttribute('transform', `rotate(${a % 360})`); q.$('#g2').setAttribute('transform', `rotate(${-(a / 2.4) % 360})`); q.$('#g3').setAttribute('transform', `rotate(${(a / n) % 360})`);
      q.$('#g1t').textContent = '9600 rpm'; q.$('#g3t').textContent = Math.round(rpm) + ' rpm';
      q.$('#gtt').textContent = `القوة × ${n} · السرعة ÷ ${n}`;
      cap(n < 10 ? `بلا تروس تقريبًا: العجلة تدور ${Math.round(rpm)} دورة/دقيقة لكن بقوة ضعيفة جدًا… السيارة لا تتحرك من مكانها بوزنها` :
        n > 90 ? `قوة هائلة لكن ${Math.round(rpm)} دورة/دقيقة فقط: السيارة كالسلحفاة` : `١:${n} — العجلة ${Math.round(rpm)} دورة/دقيقة بقوة كافية لحمل السيارة. ١:٤٨ هي نسبة محرك TT: توازن ممتاز`, climbs && n <= 90 ? 'ok' : 'bad'); }); },
};

/* العجلة الحرة: ثلاث نقاط ارتكاز */
S.caster = {
  svg: svg(`<line x1="40" y1="330" x2="720" y2="330" stroke="#5b6383" stroke-width="6"/>
    <g id="cb"><rect x="230" y="190" width="300" height="70" rx="16" fill="#e0a526"/><rect x="300" y="160" width="80" height="34" rx="6" fill="#1f2a44"/><rect x="400" y="164" width="70" height="30" rx="6" fill="#2d6a4f"/>
      <circle cx="470" cy="290" r="40" fill="#222"/><circle cx="470" cy="290" r="18" fill="#888"/><g id="cc"><line x1="270" y1="260" x2="270" y2="300" stroke="#9aa1b3" stroke-width="8"/><circle cx="270" cy="312" r="18" fill="#dfe3ea"/></g></g>
    <text id="ct" x="380" y="70" text-anchor="middle" class="ezt" style="font-size:22px"></text>`),
  ctl: `<button data-a="on" class="on">⚪ بالعجلة الحرة</button><button data-a="off">🚫 بدونها</button>`,
  bind(q, cap) { let on = true, ang = 0;
    q.btn('on', () => { on = true; q.on('on'); }); q.btn('off', () => { on = false; q.on('off'); });
    loop(q, dt => { ang += ((on ? 0 : -14) - ang) * Math.min(1, dt * 5); q.$('#cb').setAttribute('transform', `rotate(${ang.toFixed(1)} 470 330)`); q.$('#cc').setAttribute('opacity', on ? 1 : 0);
      q.$('#ct').textContent = on ? 'ثلاث نقاط ارتكاز = توازن ✓' : 'نقطتان فقط = تنقلب ✗';
      cap(on ? 'عجلتان بمحركين + عجلة حرة تدور في كل اتجاه: ثلاث نقاط تكفي لأي جسم ليقف ثابتًا (مثل الكرسي ذي الأرجل الثلاث)' : 'بلا عجلة ثالثة يميل الهيكل ويحتك بالأرض، فتتعثر السيارة ولا تستدير', on ? 'ok' : 'bad'); }); },
};

/* هبوط الجهد عند الانطلاق (Brownout) */
S.brown = {
  svg: svg(`<rect x="60" y="30" width="660" height="290" rx="12" fill="#0b1230"/><line x1="60" y1="${320 - 4.6 / 9 * 290}" x2="720" y2="${320 - 4.6 / 9 * 290}" stroke="#ff5a5a" stroke-width="3" stroke-dasharray="10 8"/>
    <text x="714" y="${312 - 4.6 / 9 * 290}" text-anchor="end" class="ezt" style="font-size:15px;fill:#ff5a5a">حدّ ESP32</text><path id="bw" fill="none" stroke="#ffcf4a" stroke-width="5"/><path id="b5" fill="none" stroke="#4fc3f7" stroke-width="4"/>
    <text x="70" y="56" class="ezt" style="font-size:15px;fill:#ffcf4a">البطارية</text><text x="70" y="80" class="ezt" style="font-size:15px;fill:#4fc3f7">5V إلى VIN</text>
    <g transform="translate(380 365)"><rect x="-120" y="-24" width="240" height="44" rx="12" fill="#1f2a44" id="bbox"/><text id="bst" y="6" text-anchor="middle" class="ezta" style="font-size:20px"></text></g>`),
  ctl: `<button data-a="go" class="on">⚡ انطلق!</button><button data-a="weak">🪫 بطارية ضعيفة</button><button data-a="soft">📈 تسارع تدريجي</button>`,
  bind(q, cap) { let weak = false, soft = false, t = 0, H = [], H5 = [], resets = 0, dead = 0;
    q.btn('go', () => { t = 0; H = []; H5 = []; resets = 0; dead = 0; });
    q.btn('weak', () => { weak = !weak; q.$('[data-a=weak]').classList.toggle('on', weak); t = 0; H = []; H5 = []; resets = 0; });
    q.btn('soft', () => { soft = !soft; q.$('[data-a=soft]').classList.toggle('on', soft); t = 0; H = []; H5 = []; resets = 0; });
    loop(q, dt => { t += dt; if (t > 4) { t = 0; H = []; H5 = []; resets = 0; }
      const base = weak ? 6.6 : 8.1, start = 0.8, k = t < start ? 0 : soft ? Math.min(1, (t - start) / 1.2) : 1, kick = t > start ? (soft ? 0.3 : 1) * Math.exp(-(t - start) * 5) : 0;
      const vb = base - k * (weak ? 0.9 : 0.5) - kick * (weak ? 2.2 : 1.6) + Math.sin(t * 40) * .04, v5 = Math.min(5, vb - 1.6);
      if (v5 < 4.6) { if (!dead) resets++; dead = 0.5; } dead = Math.max(0, dead - dt);
      H.push([60 + t / 4 * 660, 320 - vb / 9 * 290]); H5.push([60 + t / 4 * 660, 320 - v5 / 9 * 290]);
      q.$('#bw').setAttribute('d', 'M' + H.map(p => p.map(v => v.toFixed(0)).join(' ')).join(' L')); q.$('#b5').setAttribute('d', 'M' + H5.map(p => p.map(v => v.toFixed(0)).join(' ')).join(' L'));
      q.$('#bst').textContent = dead ? '🔄 ESP32 يعيد التشغيل!' : t < start ? 'جاهزة' : '✅ تعمل'; q.$('#bbox').setAttribute('fill', dead ? '#962d22' : '#1f2a44');
      cap(resets ? (soft ? 'حتى مع التسارع التدريجي: البطارية الضعيفة جدًا تحتاج شحنًا' : 'الانطلاق المفاجئ يسحب تيارًا كبيرًا ← الجهد يهبط لحظة تحت الحد ← <b>Brownout</b>. جرّب «تسارع تدريجي»') : t < start ? 'المحركات واقفة: الجهد ثابت' : weak ? 'نجت هذه المرة لأن التسارع تدريجي: الهبوط موزّع على وقت أطول' : 'بطارية مشحونة: هبوط قصير لكنه فوق الحد ✓', resets ? 'bad' : 'ok'); }); },
};

/* البطاريات: التوالي والتوازي */
S.cells = {
  svg: svg(`<g id="cl"></g><text id="cv" x="560" y="150" text-anchor="middle" class="ezt" style="font-size:54px;fill:#ffcf4a"></text><text id="cm" x="560" y="215" text-anchor="middle" class="ezt" style="font-size:24px;fill:#4fc3f7"></text>
    <text id="cn" x="560" y="290" text-anchor="middle" class="ezta" style="font-size:22px"></text>`),
  ctl: `<button data-a="one">١ خلية</button><button data-a="ser" class="on">٢ على التوالي</button><button data-a="par">٢ على التوازي</button>`,
  bind(q, cap) { const cell = (x, y, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-90" y="-26" width="180" height="52" rx="26" fill="#52b788" stroke="#0b3d2a" stroke-width="3"/><rect x="90" y="-10" width="10" height="20" fill="#9aa1b3"/><text y="9" text-anchor="middle" class="ezt" style="font-size:20px;fill:#0b3d2a">3.7V</text></g>`;
    const set = m => { q.on(m); const g = q.$('#cl');
      if (m === 'one') { g.innerHTML = cell(220, 200); q.$('#cv').textContent = '3.7V'; q.$('#cm').textContent = '2500 mAh'; q.$('#cn').textContent = 'لا تكفي: L298N يأكل ٢ فولت'; cap('خلية واحدة ٣٫٧ فولت: بعد خسارة الدرايفر يبقى للمحرك أقل من ٢ فولت… لا يدور', 'bad'); }
      if (m === 'ser') { g.innerHTML = cell(130, 200) + cell(330, 200) + `<path d="M230 200 L 240 200" stroke="#ffcf4a" stroke-width="6"/>`; q.$('#cv').textContent = '7.4V'; q.$('#cm').textContent = '2500 mAh'; q.$('#cn').textContent = 'الجهد يتضاعف ✓'; cap('التوالي (الموجب بالسالب): الجهد يُجمع ٣٫٧ + ٣٫٧ = ٧٫٤ فولت والسعة كما هي. هذا ما تحتاجه سيارتنا', 'ok'); }
      if (m === 'par') { g.innerHTML = cell(220, 140) + cell(220, 260) + `<path d="M120 140 V260 M320 140 V260" stroke="#ffcf4a" stroke-width="6"/>`; q.$('#cv').textContent = '3.7V'; q.$('#cm').textContent = '5000 mAh'; q.$('#cn').textContent = 'الوقت يتضاعف… الجهد لا'; cap('التوازي (الموجب بالموجب): السعة تُجمع فتدوم أطول، لكن الجهد ٣٫٧ فقط: لا يكفي المحركات', 'bad'); } };
    ['one', 'ser', 'par'].forEach(m => q.btn(m, () => set(m))); set('ser'); },
};

/* المعايرة: محركان غير متطابقين */
S.trim = {
  svg: svg(`<rect width="760" height="400" fill="#f4f0e6" opacity=".08"/><line x1="80" y1="350" x2="80" y2="30" stroke="#46d68c" stroke-width="3" stroke-dasharray="10 8"/><text x="96" y="44" class="ezt" style="font-size:16px;fill:#46d68c">الخط المستقيم</text>
    <path id="tp" fill="none" stroke="#ffcf4a" stroke-width="5" stroke-dasharray="3 9" stroke-linecap="round"/><g id="tc"><rect x="-22" y="-30" width="44" height="60" rx="10" fill="#e0a526"/><rect x="-30" y="-24" width="8" height="18" fill="#222"/><rect x="22" y="-24" width="8" height="18" fill="#222"/></g>
    <text id="tt" x="470" y="200" text-anchor="middle" class="ezt" style="font-size:26px"></text>`),
  ctl: `<span class="rl">trimL</span><input type="range" min="-30" max="0" value="0"><button data-a="go">▶ انطلق</button>`,
  bind(q, cap) { const r = q.$('input'); let x, y, th, pts, t;
    const go = () => { x = 80; y = 350; th = 0; pts = []; t = 0; }; go(); q.btn('go', go); r.oninput = go;
    loop(q, dt => { t += dt; if (t < 3.2) { const vl = (200 + +r.value) * 0.92, vr = 200 * 0.85; th += (vl - vr) / 600 * dt; x += Math.sin(th) * 100 * dt; y -= Math.cos(th) * 100 * dt; pts.push([x, y]); }
      q.$('#tc').setAttribute('transform', `translate(${x} ${y}) rotate(${th * 57.3})`); q.$('#tp').setAttribute('d', pts.length ? 'M' + pts.map(p => p.map(v => v.toFixed(0)).join(' ')).join(' L') : '');
      const drift = Math.abs(x - 80); q.$('#tt').textContent = `trimL = ${r.value} · الانحراف ${Math.round(drift / 4)} سم`;
      cap(drift < 12 ? 'ممتاز: بعد إنقاص سرعة العجلة الأقوى تسير السيارة مستقيمة. اكتب الرقم في الكود: كل سيارة لها رقمها' : 'المحركان من المصنع نفسه لكنهما لا يتطابقان أبدًا: اليسرى أقوى قليلًا فتنحرف يمينًا. حرّك trimL حتى تستقيم', drift < 12 ? 'ok' : 'bad'); }); },
};

/* الأمان عند انقطاع الاتصال */
S.failsafe = {
  svg: svg(`<g transform="translate(60 80)"><rect width="140" height="240" rx="24" fill="#0b0f1f" stroke="#c9cfe6" stroke-width="4"/><text x="70" y="130" text-anchor="middle" style="font-size:60px">📱</text></g>
    <path id="fl" d="M210 200 H520" stroke="#4fc3f7" stroke-width="5" stroke-dasharray="10 10"/><g id="fpk"></g>
    <g transform="translate(560 200)"><rect x="-70" y="-50" width="140" height="100" rx="16" fill="#e0a526"/><text y="12" text-anchor="middle" style="font-size:40px" id="fcar">🚗</text></g>
    <rect x="240" y="300" width="280" height="22" rx="11" fill="#1f2a55"/><rect id="fbar" x="240" y="300" width="0" height="22" rx="11" fill="#46d68c"/><line x1="${240 + 280 * .8}" y1="292" x2="${240 + 280 * .8}" y2="330" stroke="#ff5a5a" stroke-width="4"/>
    <text x="380" y="360" text-anchor="middle" class="ezt" style="font-size:19px" id="ft"></text>`),
  ctl: `<button data-a="cut" class="warn">📵 اقطع الاتصال</button><button data-a="fs" class="on">🛡️ الأمان</button>`,
  bind(q, cap) { let cut = false, fs = true, since = 0, ph = 0;
    q.btn('cut', () => { cut = !cut; q.$('[data-a=cut]').classList.toggle('on', cut); since = 0; });
    q.btn('fs', () => { fs = !fs; q.$('[data-a=fs]').classList.toggle('on', fs); });
    loop(q, dt => { ph += dt; if (!cut && ph % .1 < dt) since = 0; else since += dt;
      const k = (ph * 3) % 1; q.$('#fpk').innerHTML = cut ? '' : `<circle cx="${210 + k * 310}" cy="200" r="10" fill="#4fc3f7"/>`; q.$('#fl').setAttribute('stroke', cut ? '#5b6383' : '#4fc3f7');
      const ms = Math.min(500, since * 1000), stop = fs && ms > 400; q.$('#fbar').setAttribute('width', ms / 500 * 280); q.$('#fbar').setAttribute('fill', ms > 400 ? '#ff5a5a' : '#46d68c');
      q.$('#ft').textContent = `منذ آخر أمر: ${Math.round(ms)} مللي ثانية`; q.$('#fcar').textContent = cut ? (stop ? '🛑' : '🏃') : '🚗';
      cap(!cut ? 'الجوال يرسل أمرًا كل ١٠٠ مللي ثانية، فيبقى العدّاد قرب الصفر' : stop ? 'مرت ٤٠٠ مللي ثانية بلا أمر ← السيارة تقف وحدها. هذا <b>Failsafe</b>' : fs ? 'انقطع… العدّاد يرتفع… ننتظر قليلًا لأن تأخر رسالة واحدة طبيعي' : 'بلا أمان: آخر أمر «انطلق» يبقى إلى الأبد… السيارة تهرب!', stop || !cut ? 'ok' : fs ? '' : 'bad'); }); },
};

/* حساس الخط TCRT5000 */
S.irsens = {
  svg: svg(`<rect id="sf" x="0" y="300" width="760" height="100" fill="#f4f4f4"/><text id="sft" x="700" y="360" text-anchor="end" class="ezt" style="font-size:22px;fill:#888"></text>
    <g id="ss"><rect x="250" y="40" width="260" height="110" rx="10" fill="#1b5e20"/><circle cx="335" cy="150" r="20" fill="#90caf9"/><circle cx="425" cy="150" r="20" fill="#263238"/>
      <circle cx="470" cy="70" r="14" fill="#2b6fc0"/><circle id="sled" cx="290" cy="70" r="11" fill="#333"/><text x="380" y="100" text-anchor="middle" class="ezt" style="font-size:17px">TCRT5000</text></g>
    <line id="sr1" x1="335" y1="170" x2="380" y2="300" stroke="#ff7b6b" stroke-width="5" stroke-dasharray="8 6"/><line id="sr2" x1="380" y1="300" x2="425" y2="170" stroke="#ff7b6b" stroke-width="5" stroke-dasharray="8 6"/>
    <text id="sout" x="620" y="110" text-anchor="middle" class="ezt" style="font-size:44px"></text><text x="620" y="150" text-anchor="middle" class="ezt" style="font-size:16px">D0</text>`),
  ctl: `<button data-a="w" class="on">⬜ أبيض</button><button data-a="b">⬛ أسود</button><span class="rl">الارتفاع</span><input type="range" min="2" max="40" value="8">`,
  bind(q, cap) { let black = false; const h = q.$('input');
    const upd = () => { const mm = +h.value, refl = (black ? .08 : 1) * clamp(1.4 - mm / 18, 0, 1), out = refl > .35 ? 0 : 1, y = 40 + (mm - 8) * 4;
      q.$('#ss').setAttribute('transform', `translate(0 ${(mm - 8) * 2})`); q.$('#sf').setAttribute('fill', black ? '#1a1a1a' : '#f4f4f4'); q.$('#sft').textContent = black ? 'خط أسود' : 'أرضية بيضاء';
      q.$('#sr1').setAttribute('y1', 170 + (mm - 8) * 2); q.$('#sr2').setAttribute('y2', 170 + (mm - 8) * 2); q.$('#sr2').setAttribute('opacity', refl.toFixed(2));
      q.$('#sout').textContent = out; q.$('#sout').setAttribute('fill', out ? '#46d68c' : '#ffcf4a'); q.$('#sled').setAttribute('fill', out ? '#333' : '#46d68c');
      cap(mm > 22 ? `على ${mm} مم الضوء يتشتت فلا يعود شيء حتى من الأبيض: الحساس «يظن» كل شيء أسود. ثبّته على ١–١٠ مم` :
        black ? 'الأسود يمتص الأشعة تحت الحمراء ← لا ينعكس شيء ← D0 = 1 والليد الصغير مطفأ' : 'الأبيض يعكس الأشعة ← المستقبِل يلتقطها ← D0 = 0 والليد الصغير يضيء', mm > 22 ? 'bad' : 'ok'); };
    q.btn('w', () => { black = false; q.on('w'); upd(); }); q.btn('b', () => { black = true; q.on('b'); upd(); }); h.oninput = upd; upd(); },
};

/* الأولويات: من يتكلم أولًا؟ */
S.prio = {
  svg: svg(`${[['⚠️ الحافة / الخطر', '#ff5a5a', 70], ['🧱 عائق قريب', '#ffa53a', 170], ['〰️ الخط / المهمة', '#4fc3f7', 270]].map(([t, c, y], i) => `<g id="pr${i}"><rect x="60" y="${y}" width="420" height="76" rx="16" fill="#18224a" stroke="${c}" stroke-width="4"/><text x="80" y="${y + 48}" class="ezta" style="font-size:24px;fill:${c}">${['if', 'else if', 'else'][i]} · ${t}</text></g>`).join('')}
    <text id="pw" x="620" y="210" text-anchor="middle" style="font-size:80px"></text><text id="pwt" x="620" y="290" text-anchor="middle" class="ezta" style="font-size:22px"></text>`),
  ctl: `<button data-a="t0">⚠️ حافة</button><button data-a="t1">🧱 عائق</button><span class="rl">← فعّل أكثر من واحد معًا</span>`,
  bind(q, cap) { const on = [false, false];
    const upd = () => { const w = on[0] ? 0 : on[1] ? 1 : 2;
      [0, 1, 2].forEach(i => q.$('#pr' + i).setAttribute('opacity', i === w ? 1 : .35)); ['t0', 't1'].forEach((a, i) => q.$(`[data-a=${a}]`).classList.toggle('on', on[i]));
      q.$('#pw').textContent = ['🛑', '↪️', '➡️'][w]; q.$('#pwt').textContent = ['ارجع فورًا', 'التفّ حوله', 'تابع مهمتك'][w];
      cap(on[0] && on[1] ? 'الحافة والعائق معًا ← ينفَّذ الأول فقط! ترتيب if هو ترتيب الأهمية: السلامة أولًا ثم العوائق ثم المهمة' : w === 2 ? 'لا خطر ولا عائق ← نصل إلى else: المهمة الأساسية (تتبع الخط أو البحث)' : `«${['الحافة', 'العائق'][w]}» يأخذ الكلمة، وكل ما تحته يُتجاهل في هذه الدورة من loop`, 'ok'); };
    q.btn('t0', () => { on[0] = !on[0]; upd(); }); q.btn('t1', () => { on[1] = !on[1]; upd(); }); upd(); },
};

/* عجلة أومني */
S.omni = {
  svg: svg(`<g transform="translate(380 200)"><g id="ow"><rect x="-150" y="-60" width="300" height="120" rx="20" fill="#dfe3ea"/><g id="orl">${[-120, -60, 0, 60, 120].map(x => `<g transform="translate(${x} 0)"><rect x="-18" y="-72" width="36" height="144" rx="16" fill="#5b6383"/><g class="orr"><line x1="-14" y1="-50" x2="14" y2="-50" stroke="#c9cfe6" stroke-width="4"/><line x1="-14" y1="0" x2="14" y2="0" stroke="#c9cfe6" stroke-width="4"/><line x1="-14" y1="50" x2="14" y2="50" stroke="#c9cfe6" stroke-width="4"/></g></g>`).join('')}</g><circle r="22" fill="#1f2a44"/></g></g>
    <path id="oa" stroke="#ffcf4a" stroke-width="10" fill="none" stroke-linecap="round"/><text id="ot" x="380" y="370" text-anchor="middle" class="ezta" style="font-size:24px"></text>`),
  ctl: `<button data-a="o" class="on">⚽ عجلة أومني</button><button data-a="n">⚫ عجلة عادية</button><button data-a="f">⬅➡ ادفع باتجاه الدوران</button><button data-a="s">⬆⬇ ادفع جانبيًا</button>`,
  bind(q, cap) { let omni = true, dir = 'f', t = 0;
    const set = () => { q.$('[data-a=o]').classList.toggle('on', omni); q.$('[data-a=n]').classList.toggle('on', !omni); q.$('[data-a=f]').classList.toggle('on', dir === 'f'); q.$('[data-a=s]').classList.toggle('on', dir === 's'); q.$('#orl').setAttribute('opacity', omni ? 1 : 0); };
    q.btn('o', () => { omni = true; set(); }); q.btn('n', () => { omni = false; set(); }); q.btn('f', () => { dir = 'f'; set(); }); q.btn('s', () => { dir = 's'; set(); }); set();
    loop(q, dt => { t += dt; const k = Math.sin(t * 2), slide = dir === 's' && omni ? k * 40 : dir === 's' ? Math.max(-6, Math.min(6, k * 6)) : 0, roll = dir === 'f' ? k * 60 : 0;
      q.$('#ow').setAttribute('transform', `translate(${roll.toFixed(1)} ${slide.toFixed(1)})`);
      q.all('.orr').forEach(e => e.setAttribute('transform', dir === 's' && omni ? `translate(0 ${((t * 80) % 50) - 25})` : ''));
      q.$('#oa').setAttribute('d', dir === 'f' ? 'M240 120 H520 M500 104 L520 120 L500 136' : 'M380 40 V110 M366 92 L380 110 L394 92');
      q.$('#ot').textContent = dir === 'f' ? 'العجلة تدفع مثل أي عجلة' : omni ? 'البكرات الصغيرة تدور ← تنزلق جانبيًا بسهولة' : 'العجلة العادية تقاوم وتحتك ✗';
      cap(dir === 'f' ? 'باتجاه دورانها: عجلة الأومني تدفع تمامًا مثل العجلة العادية' : omni ? 'جانبيًا: البكرات على محيطها تدور فلا تمنع الحركة. لهذا تعمل ثلاث عجلات بزوايا مختلفة معًا دون أن تتعارك' : 'العجلة العادية تمنع الحركة الجانبية: لو وضعناها بزوايا مختلفة لتصارعت ولم يتحرك الروبوت', dir === 's' && !omni ? 'bad' : 'ok'); }); },
};

/* جمع المتجهات: ثلاث دفعات = حركة واحدة */
const AR3 = [60, -60, 180].map(a => a * Math.PI / 180);
S.vecadd = {
  svg: svg(`<g transform="translate(260 205)"><circle r="120" fill="#1f7a45" stroke="#9be7b4" stroke-width="5"/>${AR3.map((a, i) => `<g transform="translate(${(-Math.sin(a) * 100).toFixed(1)} ${(-Math.cos(a) * 100).toFixed(1)}) rotate(${(-a * 57.3).toFixed(1)})"><rect x="-34" y="-14" width="68" height="28" rx="6" fill="#dfe3ea"/><text y="46" text-anchor="middle" class="ezt" style="font-size:16px;fill:#fff">M${i + 1}</text></g><line id="va${i}" stroke="#ffcf4a" stroke-width="8" stroke-linecap="round"/>`).join('')}
      <line id="vs" stroke="#4fc3f7" stroke-width="12" stroke-linecap="round"/></g>
    <g transform="translate(560 120)">${[0, 1, 2].map(i => `<text y="${i * 46}" class="ezt" style="font-size:22px" id="vt${i}"></text>`).join('')}<text y="160" class="ezta" style="font-size:22px;fill:#4fc3f7" id="vr"></text></g>`),
  ctl: `<button data-a="fw" class="on">⬆ أمام</button><button data-a="sd">⬅ جانب</button><button data-a="rt">⟲ دوران</button>`,
  bind(q, cap) { const P = { fw: [1, 0, 0], sd: [0, 1, 0], rt: [0, 0, .8] };
    const set = k => { q.on(k); const [vx, vy, w] = P[k], m = [-.866 * vx + .5 * vy + w, .866 * vx + .5 * vy + w, -vy + w]; let sx = 0, sy = 0;
      m.forEach((v, i) => { const a = AR3[i], px = -Math.sin(a) * 100, py = -Math.cos(a) * 100, dx = -Math.cos(a) * v * 80, dy = Math.sin(a) * v * 80; sx += dx; sy += dy;
        const l = q.$('#va' + i); l.setAttribute('x1', px); l.setAttribute('y1', py); l.setAttribute('x2', px + dx); l.setAttribute('y2', py + dy); l.setAttribute('opacity', Math.abs(v) < .01 ? 0 : 1);
        q.$('#vt' + i).textContent = `M${i + 1} = ${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`; });
      const vs = q.$('#vs'); vs.setAttribute('x2', sx * .6); vs.setAttribute('y2', sy * .6); vs.setAttribute('x1', 0); vs.setAttribute('y1', 0);
      q.$('#vr').textContent = k === 'rt' ? 'المجموع: صفر حركة… دوران فقط' : k === 'fw' ? 'المجموع: ⬆ للأمام' : 'المجموع: ⬅ لليسار';
      cap(k === 'fw' ? 'M1 وM2 يدفعان بزاويتين: مركّبتاهما الجانبيتان تلغيان بعضهما، والأماميتان تجتمعان ⬆. وM3 لا عمل له!' : k === 'sd' ? 'M3 يدفع لليسار بقوة كاملة، وM1 وM2 يساعدانه بالنصف، ومركّبتاهما الأمامية والخلفية تلغيان بعضهما' : 'كل العجلات تدفع بالاتجاه الدائري نفسه: الدفعات تلتف حول المركز فيدور الروبوت في مكانه', 'ok'); };
    ['fw', 'sd', 'rt'].forEach(k => q.btn(k, () => set(k))); set('fw'); },
};

/* التطبيع: لا تتجاوز ٢٥٥ */
S.normalize = {
  svg: svg(`${[0, 1, 2].map(i => `<text x="40" y="${90 + i * 100}" class="ezt" style="font-size:22px">M${i + 1}</text><rect x="110" y="${66 + i * 100}" width="560" height="34" rx="8" fill="#1f2a55"/><line x1="390" y1="${58 + i * 100}" x2="390" y2="${108 + i * 100}" stroke="#8d9bd0" stroke-width="2"/>
    <rect id="nr${i}" y="${66 + i * 100}" height="34" rx="8" fill="#ff7b6b" opacity=".45"/><rect id="nn${i}" y="${72 + i * 100}" height="22" rx="6" fill="#46d68c"/>`).join('')}
    <line x1="110" y1="40" x2="110" y2="330" stroke="#ff5a5a" stroke-width="3" stroke-dasharray="6 6"/><line x1="670" y1="40" x2="670" y2="330" stroke="#ff5a5a" stroke-width="3" stroke-dasharray="6 6"/>
    <text x="670" y="360" text-anchor="middle" class="ezt" style="font-size:16px;fill:#ff5a5a">+255</text><text x="110" y="360" text-anchor="middle" class="ezt" style="font-size:16px;fill:#ff5a5a">−255</text><text id="nb" x="390" y="385" text-anchor="middle" class="ezt" style="font-size:20px;fill:#ffcf4a"></text>`),
  ctl: `<span class="rl">vy</span><input type="range" min="-100" max="100" value="100" id="nvy"><span class="rl">w</span><input type="range" min="-100" max="100" value="60" id="nw">`,
  bind(q, cap) { const upd = () => { const vy = +q.$('#nvy').value / 100, w = +q.$('#nw').value / 100, m = [.5 * vy + w, .5 * vy + w, -vy + w], big = Math.max(1, ...m.map(Math.abs));
      m.forEach((v, i) => { const raw = clamp(v, -2, 2) * 140, n = v / big * 280; const r = q.$('#nr' + i), g = q.$('#nn' + i);
        r.setAttribute('x', raw < 0 ? 390 + raw : 390); r.setAttribute('width', Math.abs(raw)); g.setAttribute('x', n < 0 ? 390 + n : 390); g.setAttribute('width', Math.abs(n)); });
      q.$('#nb').textContent = `big = ${big.toFixed(2)}`;
      cap(big > 1 ? `أحد المحركات يطلب ${big.toFixed(2)} من طاقته… مستحيل! الأحمر هو المطلوب، والأخضر بعد القسمة على big: كلها تصغر بالنسبة نفسها فيبقى <b>الاتجاه صحيحًا</b>` : 'كل القيم داخل الحدود: big = 1 ولا يتغير شيء', big > 1 ? '' : 'ok'); };
    q.$('#nvy').oninput = q.$('#nw').oninput = upd; upd(); },
};
})();
