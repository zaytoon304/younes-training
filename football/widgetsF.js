/* =====================================================================
   سيارة كرة القدم الأومني — أدوات التفاعل
   omnilab · omnimath · nowlab · omnilab2 · wireanm
   فيزياء الأومني: M1=vy, M2=-vy/2+vx*0.87, M3=-vy/2-vx*0.87
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* حساب سرعات المحركات — معادلات المرجع الدولي الصحيحة */
function omniCalc(vx, vy, rot) {
  const W1 = clamp(vy - rot, -100, 100);
  const W2 = clamp((-0.5 * vy - 0.866 * vx) - rot, -100, 100);
  const W3 = clamp((-0.5 * vy + 0.866 * vx) - rot, -100, 100);
  return [W1, W2, W3];
}

/* تطبيع — يحفظ الاتجاه ويُبقي القيم في -100..100 */
function omniNorm(vx, vy, rot) {
  let W1 = vy - rot;
  let W2 = (-0.5 * vy - 0.866 * vx) - rot;
  let W3 = (-0.5 * vy + 0.866 * vx) - rot;
  const raw = [W1, W2, W3];
  const mx = Math.max(Math.abs(W1), Math.abs(W2), Math.abs(W3));
  if (mx > 100) { W1 = W1 / mx * 100; W2 = W2 / mx * 100; W3 = W3 / mx * 100; }
  return { raw, norm: [W1, W2, W3] };
}

/* رسم روبوت أومني من أعلى (مثلث متساوي الأضلاع) */
function drawOmniBot(ctx, x, y, angle, M1, M2, M3, size) {
  const sz = size || 28;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  /* جسم المثلث */
  ctx.beginPath();
  ctx.moveTo(0, -sz * 1.1);
  ctx.lineTo(-sz, sz * 0.7);
  ctx.lineTo(sz, sz * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#2b6fc0';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  /* رسم سهم لكل محرك: موضعه على رأس المثلث */
  const wheels = [
    { dx: 0, dy: -sz * 1.1, wAngle: 0, spd: M1 },        /* أمامي */
    { dx: sz * 0.9, dy: sz * 0.5, wAngle: 2 * Math.PI / 3, spd: M2 },  /* يمين-خلف */
    { dx: -sz * 0.9, dy: sz * 0.5, wAngle: -2 * Math.PI / 3, spd: M3 }, /* يسار-خلف */
  ];

  wheels.forEach(({ dx, dy, wAngle, spd }) => {
    const arrowLen = Math.abs(spd) / 100 * 22;
    const col = spd >= 0 ? '#43a047' : '#e53935';
    const dir = spd >= 0 ? 1 : -1;
    /* عجلة صغيرة */
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(wAngle);
    ctx.fillStyle = '#1c1f27';
    ctx.fillRect(-6, -3, 12, 6);
    /* سهم السرعة */
    if (arrowLen > 2) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -dir * arrowLen);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, -dir * arrowLen);
      ctx.lineTo(0, -dir * (arrowLen + 7));
      ctx.lineTo(4, -dir * arrowLen);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.restore();
  });

  /* نقطة مركزية */
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.restore();
}

/* ==================== omnilab — مختبر الأومني ==================== */
Object.assign(window.DECK_TYPES, {
  omnilab: s => `<div class="slide light">
    <div class="kicker">🎮 مختبر الأومني</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'كيف تتحرك العجلات الثلاث؟'}</h2>
    <div class="fb-omnilab ix">
      <canvas class="fb-omni-field" width="520" height="320"></canvas>
      <div class="fb-omni-btns">
        <button id="ob_ul">↖</button><button id="ob_up">⬆</button><button id="ob_ur">↗</button><button id="ob_rotl">↺</button>
        <button id="ob_lt">⬅</button><button id="ob_stop">⏹</button><button id="ob_rt">➡</button><button id="ob_rotr">↻</button>
        <button id="ob_dl">↙</button><button id="ob_dn">⬇</button><button id="ob_dr">↘</button><span></span>
      </div>
      <div class="fb-omni-vals">
        <span>M1 أمامي<b id="ov_M1">0</b></span>
        <span>M2 يمين<b id="ov_M2">0</b></span>
        <span>M3 يسار<b id="ov_M3">0</b></span>
      </div>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  omnilab(sl) {
    const canvas = sl.querySelector('.fb-omni-field');
    const ctx = canvas.getContext('2d');
    const W = 520, H = 320;
    let vx = 0, vy = 0, rot = 0;
    let robotX = W / 2, robotY = H / 2, robotAngle = 0;
    let last = 0, raf;

    /* حالة الأزرار */
    const CMD = {
      ob_up: [0, -100, 0], ob_dn: [0, 100, 0], ob_lt: [-100, 0, 0], ob_rt: [100, 0, 0],
      ob_ul: [-80, -80, 0], ob_ur: [80, -80, 0], ob_dl: [-80, 80, 0], ob_dr: [80, 80, 0],
      ob_rotl: [0, 0, -80], ob_rotr: [0, 0, 80], ob_stop: [0, 0, 0],
    };
    const held = {};
    const updateCmd = () => {
      let _vx = 0, _vy = 0, _rot = 0;
      Object.keys(held).forEach(k => { if (held[k] && CMD[k]) { _vx = CMD[k][0]; _vy = CMD[k][1]; _rot = CMD[k][2]; } });
      vx = _vx; vy = _vy; rot = _rot;
    };
    Object.keys(CMD).forEach(id => {
      const btn = sl.querySelector('#' + id);
      if (!btn) return;
      const start = () => { held[id] = true; updateCmd(); };
      const end = () => { held[id] = false; updateCmd(); };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
    });

    function draw(ts) {
      const dt = Math.min(ts - last, 50);
      last = ts;
      const [M1, M2, M3] = omniCalc(vx, vy, rot);

      /* تحريك الروبوت */
      const speed = 0.3;
      robotX += vx * speed * dt / 40;
      robotY += vy * speed * dt / 40;
      robotAngle += rot * 0.003 * dt / 16;
      robotX = clamp(robotX, 40, W - 40);
      robotY = clamp(robotY, 40, H - 40);

      /* رسم الخلفية */
      ctx.fillStyle = '#2d8a4e';
      ctx.fillRect(0, 0, W, H);
      /* خطوط الملعب */
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 20, W - 40, H - 40);
      ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H - 20); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 45, 0, Math.PI * 2); ctx.stroke();

      /* رسم الروبوت */
      drawOmniBot(ctx, robotX, robotY, robotAngle, M1, M2, M3, 26);

      /* تحديث القيم */
      ['M1', 'M2', 'M3'].forEach((k, i) => {
        const el = sl.querySelector('#ov_' + k);
        if (el) el.textContent = [M1, M2, M3][i];
      });

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(ts => { last = ts; draw(ts); });
    return () => cancelAnimationFrame(raf);
  },
});

/* ==================== omnimath — مختبر المعادلة ==================== */
Object.assign(window.DECK_TYPES, {
  omnimath: s => `<div class="slide light">
    <div class="kicker">🔢 مختبر المعادلة</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'حرّك السلايدر وشاهد المحركات'}</h2>
    <div class="fb-math ix">
      <canvas class="fb-math-canvas" width="280" height="280"></canvas>
      <div class="fb-math-panel">
        <div class="fb-slider-row">
          <label>vx (يمين/يسار): <b id="om_vxv">0</b></label>
          <input type="range" id="om_vx" min="-100" max="100" value="0">
        </div>
        <div class="fb-slider-row">
          <label>vy (أمام/خلف): <b id="om_vyv">0</b></label>
          <input type="range" id="om_vy" min="-100" max="100" value="0">
        </div>
        <div class="fb-motor-vals">
          <div class="fb-motor-val"><span class="lbl">M1</span><div class="fb-motor-bar" id="om_b1" style="width:0"></div><span class="fb-motor-num" id="om_n1">0</span></div>
          <div class="fb-motor-val"><span class="lbl">M2</span><div class="fb-motor-bar" id="om_b2" style="width:0"></div><span class="fb-motor-num" id="om_n2">0</span></div>
          <div class="fb-motor-val"><span class="lbl">M3</span><div class="fb-motor-bar" id="om_b3" style="width:0"></div><span class="fb-motor-num" id="om_n3">0</span></div>
        </div>
        <div style="font-size:12px;font-family:Cairo,sans-serif;color:#555;line-height:1.8">
          <b>المعادلة الصحيحة:</b><br>
          W1 = vy − rot<br>
          W2 = (−0.5·vy − 0.866·vx) − rot<br>
          W3 = (−0.5·vy + 0.866·vx) − rot
        </div>
      </div>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  omnimath(sl) {
    const canvas = sl.querySelector('.fb-math-canvas');
    const ctx = canvas.getContext('2d');
    const W = 280, H = 280;

    const upd = () => {
      const vx = +sl.querySelector('#om_vx').value;
      const vy = +sl.querySelector('#om_vy').value;
      sl.querySelector('#om_vxv').textContent = vx;
      sl.querySelector('#om_vyv').textContent = vy;
      const [M1, M2, M3] = omniCalc(vx, vy, 0);
      [M1, M2, M3].forEach((v, i) => {
        const b = sl.querySelector('#om_b' + (i + 1));
        const n = sl.querySelector('#om_n' + (i + 1));
        const pct = Math.abs(v) / 100 * 120;
        if (b) { b.style.width = pct + 'px'; b.className = 'fb-motor-bar' + (v < 0 ? ' neg' : ''); }
        if (n) n.textContent = v;
      });
      /* رسم الروبوت */
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, W, H);
      /* محاور */
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      drawOmniBot(ctx, W / 2, H / 2, 0, M1, M2, M3, 32);
    };

    ['om_vx', 'om_vy'].forEach(id => sl.querySelector('#' + id).addEventListener('input', upd));
    upd();
  },
});

/* ==================== nowlab — مختبر ESP-NOW ==================== */
Object.assign(window.DECK_TYPES, {
  nowlab: s => `<div class="slide light">
    <div class="kicker">📡 مختبر ESP-NOW</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'شاهد الرسالة وهي تطير'}</h2>
    <div class="fb-nowlab ix">
      <canvas width="600" height="260"></canvas>
      <button id="nl_send">📡 أرسل</button>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  nowlab(sl) {
    const canvas = sl.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const W = 600, H = 260;
    let packet = null; // {x, y, progress, vx, vy, rot, kick}
    let raf;

    function drawBoard(ctx, x, y, label, isJoy) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#0e7c86';
      ctx.beginPath(); ctx.roundRect(-55, -70, 110, 140, 10); ctx.fill();
      ctx.strokeStyle = '#4dc8c6'; ctx.lineWidth = 2; ctx.stroke();
      /* USB */
      ctx.fillStyle = '#c9ccd3';
      ctx.fillRect(-15, -70, 30, 16);
      /* ESP32 chip */
      ctx.fillStyle = '#1c1f27';
      ctx.fillRect(-20, -20, 40, 30);
      ctx.fillStyle = '#4dc8c6'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('ESP32', 0, -5);
      /* Antenna */
      ctx.strokeStyle = '#f0cc7a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(35, -60); ctx.lineTo(55, -60); ctx.lineTo(55, -30); ctx.stroke();
      /* label */
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Cairo, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, 0, 85);
      if (isJoy) {
        /* جويستيك صغير */
        ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(0, 40, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(0, 40, 8, 0, Math.PI * 2); ctx.fill();
      } else {
        /* عجلات صغيرة */
        [[-30, 30], [30, 30], [-30, 55], [30, 55]].forEach(([px, py]) => {
          ctx.fillStyle = '#444'; ctx.fillRect(px - 5, py - 8, 10, 16);
        });
      }
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f7f4ec';
      ctx.fillRect(0, 0, W, H);

      drawBoard(ctx, 100, 130, 'الجويستيك', true);
      drawBoard(ctx, 500, 130, 'السيارة', false);

      /* خط الاتصال */
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(160, 130); ctx.lineTo(440, 130); ctx.stroke();
      ctx.setLineDash([]);

      if (packet) {
        packet.progress += 0.025;
        const px = 160 + (440 - 160) * packet.progress;
        const py = 130;
        if (packet.progress >= 1) {
          /* تأثير الوصول */
          ctx.fillStyle = 'rgba(77,200,198,.25)';
          ctx.beginPath(); ctx.arc(500, 130, 40, 0, Math.PI * 2); ctx.fill();
          packet = null;
        } else {
          /* الحزمة */
          ctx.save();
          ctx.translate(px, py);
          ctx.fillStyle = '#f0cc7a';
          ctx.beginPath(); ctx.roundRect(-40, -25, 80, 50, 6); ctx.fill();
          ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#1b2340'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`vx:${packet.vx}`, 0, -10);
          ctx.fillText(`vy:${packet.vy} rot:${packet.rot}`, 0, 4);
          ctx.fillText(`kick:${packet.kick}`, 0, 18);
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    const btn = sl.querySelector('#nl_send');
    if (btn) btn.addEventListener('click', () => {
      packet = { progress: 0, vx: Math.floor(Math.random() * 200 - 100), vy: Math.floor(Math.random() * 200 - 100), rot: 0, kick: Math.random() > 0.8 };
    });

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  },
});

/* ==================== wireanm — مخطط التوصيل المتحرك ==================== */
Object.assign(window.DECK_TYPES, {
  wireanm: s => `<div class="slide light">
    <div class="kicker">🔌 خطوات التوصيل</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'ربط السيارة الأومنية'}</h2>
    <div class="fb-wire ix">
      <canvas width="640" height="320"></canvas>
      <div class="fb-wire-ctrl">
        <button id="fw_prev">→ السابق</button>
        <span class="fb-wire-step" id="fw_label">الخطوة ١: قطع في أماكنها</span>
        <button id="fw_next">التالي ←</button>
      </div>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  wireanm(sl) {
    const canvas = sl.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const W = 640, H = 320;
    const steps = [
      { label: 'الخطوة ١: القطع في أماكنها (المفتاح على OFF)', highlight: 'all' },
      { label: 'الخطوة ٢: موجب البطارية → المفتاح → دريفر (VCC)', highlight: 'power' },
      { label: 'الخطوة ٣: سالب البطارية → GND المشترك', highlight: 'gnd' },
      { label: 'الخطوة ٤: GND الدريفر → GND الـ ESP32', highlight: 'gnd2' },
      { label: 'الخطوة ٥: دريفر M1 → GPIO27/GPIO26', highlight: 'm1' },
      { label: 'الخطوة ٦: دريفر M2 → GPIO25/GPIO33', highlight: 'm2' },
      { label: 'الخطوة ٧: دريفر M3 → GPIO32/GPIO14', highlight: 'm3' },
      { label: 'الخطوة ٨: سيرفو → GPIO13 + 5V خارجي', highlight: 'servo' },
      { label: 'الخطوة ٩: جويستيك → GPIO34/GPIO35 (3.3V فقط!)', highlight: 'joy' },
    ];
    let step = 0;

    function drawDiagram(highlight) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f7f4ec';
      ctx.fillRect(0, 0, W, H);

      const active = (h) => highlight === 'all' || highlight === h;
      const dim = (h) => (!active(h) && highlight !== 'all') ? 0.25 : 1;

      /* ESP32 */
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#0e7c86'; ctx.beginPath(); ctx.roundRect(240, 90, 100, 140, 8); ctx.fill();
      ctx.strokeStyle = '#4dc8c6'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Cairo'; ctx.textAlign = 'center';
      ctx.fillText('ESP32', 290, 165);

      /* البطارية */
      ctx.fillStyle = '#1c1f27'; ctx.beginPath(); ctx.roundRect(20, 110, 80, 100, 8); ctx.fill();
      ctx.fillStyle = '#2e9e6b'; ctx.fillRect(26, 118, 68, 34);
      ctx.fillRect(26, 164, 68, 34);
      ctx.fillStyle = '#fff'; ctx.font = '12px Cairo'; ctx.textAlign = 'center';
      ctx.fillText('7.4V', 60, 205);

      /* الدريفر */
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.roundRect(140, 90, 80, 140, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('L9110S', 180, 165);
      ctx.fillText('×٣', 180, 185);

      /* السيرفو */
      ctx.fillStyle = '#2b6fc0'; ctx.beginPath(); ctx.roundRect(380, 90, 70, 60, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '11px Cairo'; ctx.fillText('سيرفو', 415, 125);
      ctx.fillText('MG996R', 415, 140);

      /* الجويستيك */
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.roundRect(380, 180, 70, 60, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('جويستيك', 415, 215);
      ctx.font = '10px Cairo'; ctx.fillText('KY-023', 415, 230);

      /* المحركات */
      [['M1', 490, 70], ['M2', 490, 170], ['M3', 490, 260]].forEach(([lbl, mx, my]) => {
        ctx.globalAlpha = dim(lbl.toLowerCase());
        ctx.fillStyle = '#f4d35e'; ctx.beginPath(); ctx.roundRect(mx, my, 60, 40, 6); ctx.fill();
        ctx.strokeStyle = '#8a6d1f'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#1c1f27'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        ctx.fillText(lbl, mx + 30, my + 25);
        ctx.globalAlpha = 1;
      });

      /* أسلاك */
      const wire = (x1, y1, x2, y2, col, h) => {
        ctx.globalAlpha = dim(h);
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.globalAlpha = 1;
      };

      wire(100, 125, 140, 125, '#e74c3c', 'power'); /* موجب */
      wire(100, 185, 140, 185, '#1b2340', 'gnd');   /* سالب */
      wire(140, 185, 240, 185, '#1b2340', 'gnd2');  /* GND مشترك */
      wire(220, 110, 240, 110, '#8e44ad', 'm1');    /* M1 إشارة */
      wire(220, 140, 240, 140, '#2e9e6b', 'm2');    /* M2 إشارة */
      wire(220, 170, 240, 170, '#e0b400', 'm3');    /* M3 إشارة */
      wire(340, 110, 380, 110, '#2b6fc0', 'servo'); /* سيرفو */
      wire(340, 200, 380, 200, '#9b59b6', 'joy');   /* جويستيك */
      wire(220, 90, 490, 70 + 20, '#f4d35e', 'm1');
      wire(220, 120, 490, 170 + 20, '#f4d35e', 'm2');
      wire(220, 150, 490, 260 + 20, '#f4d35e', 'm3');

      ctx.setLineDash([]);
    }

    function updateUI() {
      const s = steps[step];
      const lbl = sl.querySelector('#fw_label');
      if (lbl) lbl.textContent = s.label;
      drawDiagram(s.highlight);
    }

    const prev = sl.querySelector('#fw_prev');
    const next = sl.querySelector('#fw_next');
    if (prev) prev.addEventListener('click', () => { step = Math.max(0, step - 1); updateUI(); });
    if (next) next.addEventListener('click', () => { step = Math.min(steps.length - 1, step + 1); updateUI(); });
    updateUI();
  },
});

/* ==================== omnilab2 — ملعب التجربة الكامل ==================== */
Object.assign(window.DECK_TYPES, {
  omnilab2: s => `<div class="slide light">
  <div class="kicker">⚽ ملعب التجربة</div>
  <h2 class="title" style="margin-bottom:6px">${s.title||'سيارتان أومني — جرّب الحركة الكاملة'}</h2>
  <div class="fb-lab2 ix">
    <canvas class="fb-lab2-field" width="720" height="440" style="flex:1;min-width:0;border-radius:14px;box-shadow:0 6px 28px rgba(0,0,0,.3)"></canvas>
    <div class="fb-lab2-right" style="display:flex;flex-direction:column;gap:10px;min-width:180px">
      <div class="fb-score" style="font-size:26px">
        <div>🔵 أنت <b id="fl_s0" style="font-size:36px;color:#2b6fc0">٠</b></div>
        <div>🔴 خصم <b id="fl_s1" style="font-size:36px;color:#c0392b">٠</b></div>
      </div>
      <div style="font-family:Cairo,sans-serif;font-size:14px;font-weight:700;color:#555" id="fl_st">جاهز!</div>
      <div style="font-family:Cairo,sans-serif;font-size:13px;font-weight:700;color:#777">سرعة عجلاتك:</div>
      <div class="fb-wheel-bars" style="direction:ltr">
        <div class="fb-wb-row"><span style="font-size:15px;font-weight:800;min-width:28px">M1</span><div class="fb-wb-track"><div class="fb-wb-fill" id="fl_m1"></div></div><span class="fb-wb-num" id="fl_n1">0</span></div>
        <div class="fb-wb-row"><span style="font-size:15px;font-weight:800;min-width:28px">M2</span><div class="fb-wb-track"><div class="fb-wb-fill" id="fl_m2"></div></div><span class="fb-wb-num" id="fl_n2">0</span></div>
        <div class="fb-wb-row"><span style="font-size:15px;font-weight:800;min-width:28px">M3</span><div class="fb-wb-track"><div class="fb-wb-fill" id="fl_m3"></div></div><span class="fb-wb-num" id="fl_n3">0</span></div>
      </div>
      <div class="fb-lab2-btns" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;direction:ltr;margin-top:8px">
        <button id="fl_ul" style="font-size:20px;padding:9px">↖</button>
        <button id="fl_up" style="font-size:20px;padding:9px">⬆</button>
        <button id="fl_ur" style="font-size:20px;padding:9px">↗</button>
        <button id="fl_lt" style="font-size:20px;padding:9px">⬅</button>
        <button id="fl_kick" style="font-size:18px;padding:9px;background:#e53935;color:#fff;border-radius:10px;font-family:Cairo,sans-serif;font-weight:800">⚽ سدّد</button>
        <button id="fl_rt" style="font-size:20px;padding:9px">➡</button>
        <button id="fl_dl" style="font-size:20px;padding:9px">↙</button>
        <button id="fl_dn" style="font-size:20px;padding:9px">⬇</button>
        <button id="fl_dr" style="font-size:20px;padding:9px">↘</button>
        <button id="fl_rotl" style="font-size:18px;padding:9px">↺</button>
        <span></span>
        <button id="fl_rotr" style="font-size:18px;padding:9px">↻</button>
      </div>
    </div>
  </div></div>`,
});

Object.assign(window.DECK_BIND, {
  omnilab2(sl) {
    const canvas = sl.querySelector('.fb-lab2-field');
    const ctx = canvas.getContext('2d');
    const FW = 720, FH = 440;
    const BALL_R = 11;
    const GOAL_W = 20, GOAL_H = 110;
    const GOAL_Y0 = (FH - GOAL_H) / 2, GOAL_Y1 = GOAL_Y0 + GOAL_H;
    const ROBOT_SIZE = 36;

    const robot = { x: FW * 0.3, y: FH / 2, angle: 0, vx: 0, vy: 0, rot: 0,
                    cur1: 0, cur2: 0, cur3: 0, tgt1: 0, tgt2: 0, tgt3: 0 };
    const opp = { x: FW * 0.7, y: FH / 2, angle: Math.PI };
    const ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0 };

    let score = [0, 0];
    let goalFlash = 0;
    let kickAnim = 0;
    const servo = { angle: 0 };
    let last = 0, raf;

    function omniCalcPlayer(vx, vy, rot) {
      let M1 =  vy - rot;
      let M2 = (-0.5 * vy - 0.866 * vx) - rot;
      let M3 = (-0.5 * vy + 0.866 * vx) - rot;
      const mx = Math.max(Math.abs(M1), Math.abs(M2), Math.abs(M3));
      if (mx > 100) { M1 = M1/mx*100; M2 = M2/mx*100; M3 = M3/mx*100; }
      return [M1, M2, M3];
    }

    const CMD = {
      fl_up: [0,-100,0], fl_dn: [0,100,0], fl_lt: [-100,0,0], fl_rt: [100,0,0],
      fl_ul: [-80,-80,0], fl_ur: [80,-80,0], fl_dl: [-80,80,0], fl_dr: [80,80,0],
      fl_rotl: [0,0,-80], fl_rotr: [0,0,80],
    };
    const held = {};
    const updateCmd = () => {
      let vx=0,vy=0,rot=0;
      Object.keys(held).forEach(k => { if(held[k]&&CMD[k]){vx=CMD[k][0];vy=CMD[k][1];rot=CMD[k][2];} });
      robot.vx=vx; robot.vy=vy; robot.rot=rot;
    };
    Object.keys(CMD).forEach(id => {
      const btn = sl.querySelector('#'+id);
      if(!btn) return;
      btn.addEventListener('pointerdown', e => { e.preventDefault(); held[id]=true; updateCmd(); });
      ['pointerup','pointerleave'].forEach(e => btn.addEventListener(e, ()=>{ held[id]=false; updateCmd(); }));
    });
    const kickBtn = sl.querySelector('#fl_kick');
    if (kickBtn) kickBtn.addEventListener('pointerdown', e => { e.preventDefault(); kickAnim = 18; });

    function resetPositions() {
      robot.x = FW*0.28; robot.y = FH/2; robot.angle = 0;
      opp.x = FW*0.72; opp.y = FH/2; opp.angle = Math.PI;
      ball.x = FW/2; ball.y = FH/2; ball.vx = 0; ball.vy = 0;
      robot.cur1 = robot.cur2 = robot.cur3 = 0;
      robot.tgt1 = robot.tgt2 = robot.tgt3 = 0;
    }

    function drawTriBot(cx, cy, angle, color, border, sz) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(-sz * 0.87, sz * 0.5);
      ctx.lineTo(sz * 0.87, sz * 0.5);
      ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = 3; ctx.stroke();
      [[0,-sz,0],[-sz*0.87,sz*0.5,2*Math.PI/3],[sz*0.87,sz*0.5,-2*Math.PI/3]].forEach(([dx,dy,wa]) => {
        ctx.save(); ctx.translate(dx,dy); ctx.rotate(wa);
        ctx.fillStyle='#1c1f27'; ctx.fillRect(-7,-3,14,6);
        ctx.restore();
      });
      ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2);
      ctx.fillStyle=border; ctx.fill();
      ctx.restore();
    }

    function drawServoArm(cx, cy, angle, armAngle, sz) {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.translate(0, -sz*0.7);
      ctx.rotate((armAngle - 90)*Math.PI/180);
      ctx.fillStyle='#f4d35e'; ctx.strokeStyle='#8a6d1f'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(-4,-sz*0.55,8,sz*0.55,3);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    function frame(ts) {
      const dt = Math.min(ts - last, 50) / 16;
      last = ts;
      const RAMP = 0.14;

      const [M1,M2,M3] = omniCalcPlayer(robot.vx, robot.vy, robot.rot);
      robot.tgt1=M1; robot.tgt2=M2; robot.tgt3=M3;
      robot.cur1 += (robot.tgt1-robot.cur1)*RAMP;
      robot.cur2 += (robot.tgt2-robot.cur2)*RAMP;
      robot.cur3 += (robot.tgt3-robot.cur3)*RAMP;
      robot.angle += robot.rot * 0.025 * dt;
      const wx = robot.vx*Math.cos(robot.angle) - robot.vy*Math.sin(robot.angle);
      const wy = robot.vx*Math.sin(robot.angle) + robot.vy*Math.cos(robot.angle);
      robot.x = clamp(robot.x + wx*dt*0.03, ROBOT_SIZE, FW-ROBOT_SIZE);
      robot.y = clamp(robot.y + wy*dt*0.03, ROBOT_SIZE, FH-ROBOT_SIZE);

      // Opponent AI: chase ball
      const odx = ball.x-opp.x, ody = ball.y-opp.y;
      const odist = Math.sqrt(odx*odx+ody*ody);
      if (odist > 5) {
        const spd = Math.min(1.4, odist*0.015);
        opp.x += (odx/odist)*spd*dt; opp.y += (ody/odist)*spd*dt;
        opp.angle = Math.atan2(ody,odx) - Math.PI/2;
      }
      opp.x = clamp(opp.x, ROBOT_SIZE, FW-ROBOT_SIZE);
      opp.y = clamp(opp.y, ROBOT_SIZE, FH-ROBOT_SIZE);

      // Ball physics
      ball.x += ball.vx*dt; ball.y += ball.vy*dt;
      ball.vx *= 0.985; ball.vy *= 0.985;
      if (ball.x-BALL_R < GOAL_W && (ball.y<GOAL_Y0||ball.y>GOAL_Y1)) { ball.x=GOAL_W+BALL_R; ball.vx=Math.abs(ball.vx); }
      if (ball.x+BALL_R > FW-GOAL_W && (ball.y<GOAL_Y0||ball.y>GOAL_Y1)) { ball.x=FW-GOAL_W-BALL_R; ball.vx=-Math.abs(ball.vx); }
      if (ball.y-BALL_R < 0) { ball.y=BALL_R; ball.vy=Math.abs(ball.vy); }
      if (ball.y+BALL_R > FH) { ball.y=FH-BALL_R; ball.vy=-Math.abs(ball.vy); }

      // Player-ball collision
      const pdx=ball.x-robot.x, pdy=ball.y-robot.y, pd=Math.sqrt(pdx*pdx+pdy*pdy);
      if (pd < ROBOT_SIZE*0.8+BALL_R) {
        const nx=pdx/pd, ny=pdy/pd;
        ball.x=robot.x+nx*(ROBOT_SIZE*0.8+BALL_R+1);
        ball.y=robot.y+ny*(ROBOT_SIZE*0.8+BALL_R+1);
        ball.vx=nx*3.5; ball.vy=ny*3.5;
      }
      // Opponent-ball collision
      const qdx=ball.x-opp.x, qdy=ball.y-opp.y, qd=Math.sqrt(qdx*qdx+qdy*qdy);
      if (qd < ROBOT_SIZE*0.8+BALL_R) {
        const nx=qdx/qd, ny=qdy/qd;
        ball.x=opp.x+nx*(ROBOT_SIZE*0.8+BALL_R+1);
        ball.y=opp.y+ny*(ROBOT_SIZE*0.8+BALL_R+1);
        ball.vx=nx*3; ball.vy=ny*3;
      }

      // Kick
      if (kickAnim > 0) {
        kickAnim--;
        servo.angle = kickAnim > 9 ? 120 : 0;
        if (kickAnim === 9) {
          const kx=ball.x-robot.x, ky=ball.y-robot.y, kd=Math.sqrt(kx*kx+ky*ky);
          if (kd < ROBOT_SIZE*1.5) {
            const kang = robot.angle - Math.PI/2;
            ball.vx += Math.cos(kang)*9; ball.vy += Math.sin(kang)*9;
          }
        }
      } else { servo.angle = 0; }

      // Goals
      if (ball.x < 0) { score[1]++; goalFlash=50; const el=sl.querySelector('#fl_s1'); if(el)el.textContent=AR(score[1]); resetPositions(); }
      if (ball.x > FW) { score[0]++; goalFlash=50; const el=sl.querySelector('#fl_s0'); if(el)el.textContent=AR(score[0]); resetPositions(); }

      // Draw field
      ctx.fillStyle='#1a7a40'; ctx.fillRect(0,0,FW,FH);
      for (let i=0;i<8;i++){
        ctx.fillStyle=i%2===0?'rgba(255,255,255,.03)':'rgba(0,0,0,.03)';
        ctx.fillRect(i*FW/8,0,FW/8,FH);
      }
      ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=2;
      ctx.strokeRect(30,30,FW-60,FH-60);
      ctx.beginPath(); ctx.moveTo(FW/2,30); ctx.lineTo(FW/2,FH-30); ctx.stroke();
      ctx.beginPath(); ctx.arc(FW/2,FH/2,55,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(FW/2,FH/2,5,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2;
      ctx.strokeRect(30,GOAL_Y0-20,50,GOAL_H+40);
      ctx.strokeRect(FW-80,GOAL_Y0-20,50,GOAL_H+40);
      ctx.strokeStyle='#fff'; ctx.lineWidth=3;
      ctx.strokeRect(0,GOAL_Y0,GOAL_W,GOAL_H);
      ctx.strokeRect(FW-GOAL_W,GOAL_Y0,GOAL_W,GOAL_H);

      if (goalFlash>0){
        ctx.fillStyle=`rgba(255,215,0,${goalFlash/50*0.25})`;
        ctx.fillRect(0,0,FW,FH); goalFlash--;
      }

      drawTriBot(opp.x,opp.y,opp.angle,'#c0392b','#fff',ROBOT_SIZE);
      drawTriBot(robot.x,robot.y,robot.angle,'#2b6fc0','#4dc8c6',ROBOT_SIZE);
      drawServoArm(robot.x,robot.y,robot.angle,servo.angle,ROBOT_SIZE);

      // Ball
      ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);
      ctx.fillStyle='#f5f5f5'; ctx.fill();
      ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(ball.x,ball.y,BALL_R*0.45,0,Math.PI*2);
      ctx.strokeStyle='#666'; ctx.lineWidth=1; ctx.stroke();

      // Score overlay
      ctx.fillStyle='rgba(0,0,0,.55)';
      ctx.beginPath(); ctx.roundRect(FW/2-70,8,140,38,8); ctx.fill();
      ctx.font='bold 22px Cairo,sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#fff';
      ctx.fillText(score[0]+' - '+score[1],FW/2,32);

      // Wheel bars
      [robot.cur1,robot.cur2,robot.cur3].forEach((v,i) => {
        const fill=sl.querySelector('#fl_m'+(i+1));
        const num=sl.querySelector('#fl_n'+(i+1));
        if(fill){
          const pct=Math.abs(v)/100*50;
          fill.style.width=pct+'%';
          fill.style.left=v>=0?'50%':(50-pct)+'%';
          fill.style.background=v>=0?'#43a047':'#e53935';
        }
        if(num) num.textContent=Math.round(v);
      });

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(ts => { last=ts; frame(ts); });
    return () => cancelAnimationFrame(raf);
  },
});


/* ==================== partpic — رسم مكوّن متحرك ==================== */
const PART_SVGS = {
  esp32: () => `<svg viewBox="0 0 260 180" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes antPulse{0%,100%{opacity:.4}50%{opacity:1}}
      @keyframes pinBlink{0%,100%{opacity:.6}50%{opacity:1}}
      .ant{animation:antPulse 1.6s ease-in-out infinite}
      .prow{animation:pinBlink 2s ease-in-out infinite}
    </style>
    <!-- PCB -->
    <rect x="30" y="20" width="200" height="140" rx="8" fill="#0e7c86"/>
    <rect x="30" y="20" width="200" height="140" rx="8" fill="none" stroke="#4dc8c6" stroke-width="2"/>
    <!-- USB connector -->
    <rect x="100" y="8" width="60" height="18" rx="3" fill="#c9ccd3"/>
    <rect x="108" y="12" width="44" height="10" rx="2" fill="#888"/>
    <!-- Chip module -->
    <rect x="80" y="55" width="100" height="70" rx="4" fill="#1c1f27"/>
    <rect x="85" y="60" width="90" height="60" rx="3" fill="#2a2e3a"/>
    <text x="130" y="94" text-anchor="middle" fill="#4dc8c6" font-size="11" font-family="monospace" font-weight="bold">ESP32</text>
    <text x="130" y="108" text-anchor="middle" fill="#4dc8c6" font-size="8" font-family="monospace">WROOM-32</text>
    <!-- Antenna -->
    <rect x="198" y="28" width="22" height="8" rx="2" fill="#f0cc7a" class="ant"/>
    <line x1="220" y1="32" x2="240" y2="32" stroke="#f0cc7a" stroke-width="2.5" stroke-linecap="round" class="ant"/>
    <line x1="240" y1="32" x2="240" y2="52" stroke="#f0cc7a" stroke-width="2" stroke-linecap="round" class="ant"/>
    <!-- Left pins -->
    <g class="prow">
      <line x1="14" y1="38" x2="30" y2="38" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="52" x2="30" y2="52" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="66" x2="30" y2="66" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="80" x2="30" y2="80" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="94" x2="30" y2="94" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="108" x2="30" y2="108" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="122" x2="30" y2="122" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="136" x2="30" y2="136" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="150" x2="30" y2="150" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- Right pins -->
    <g class="prow" style="animation-delay:.4s">
      <line x1="230" y1="38" x2="246" y2="38" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="52" x2="246" y2="52" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="66" x2="246" y2="66" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="80" x2="246" y2="80" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="94" x2="246" y2="94" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="108" x2="246" y2="108" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="122" x2="246" y2="122" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
      <line x1="230" y1="136" x2="246" y2="136" stroke="#b0b8c8" stroke-width="3" stroke-linecap="round"/>
    </g>
    <!-- Labels -->
    <text x="130" y="172" text-anchor="middle" fill="#fff" font-size="10" font-family="Cairo,sans-serif" font-weight="bold">أرجل GPIO</text>
    <text x="248" y="35" fill="#f0cc7a" font-size="9" font-family="Cairo,sans-serif" class="ant">أنتينا</text>
    <text x="6" y="78" text-anchor="middle" fill="#aaa" font-size="8" font-family="monospace" writing-mode="tb">GPIO</text>
    <text x="130" y="6" text-anchor="middle" fill="#ccc" font-size="9" font-family="Cairo,sans-serif">USB</text>
  </svg>`,

  l9110s: () => `<svg viewBox="0 0 260 180" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes flowRight{0%{stroke-dashoffset:30}100%{stroke-dashoffset:0}}
      .flow{stroke-dasharray:8 4;animation:flowRight 1s linear infinite}
    </style>
    <!-- PCB -->
    <rect x="60" y="40" width="140" height="100" rx="6" fill="#1a3a8f"/>
    <rect x="60" y="40" width="140" height="100" rx="6" fill="none" stroke="#4a7dff" stroke-width="2"/>
    <!-- IC Chip -->
    <rect x="100" y="65" width="60" height="50" rx="3" fill="#1c1f27"/>
    <rect x="103" y="68" width="54" height="44" rx="2" fill="#2a2e3a"/>
    <text x="130" y="95" text-anchor="middle" fill="#7af" font-size="9" font-family="monospace">L9110S</text>
    <!-- Left pins: VCC GND IA IB -->
    <line x1="40" y1="58" x2="60" y2="58" stroke="#e74c3c" stroke-width="3" stroke-linecap="round"/>
    <line x1="40" y1="72" x2="60" y2="72" stroke="#1b2340" stroke-width="3" stroke-linecap="round"/>
    <line x1="40" y1="108" x2="60" y2="108" stroke="#2ecc71" stroke-width="3" stroke-linecap="round"/>
    <line x1="40" y1="122" x2="60" y2="122" stroke="#9b59b6" stroke-width="3" stroke-linecap="round"/>
    <text x="36" y="62" text-anchor="end" fill="#e74c3c" font-size="10" font-family="monospace">VCC</text>
    <text x="36" y="76" text-anchor="end" fill="#888" font-size="10" font-family="monospace">GND</text>
    <text x="36" y="112" text-anchor="end" fill="#2ecc71" font-size="10" font-family="monospace">IA</text>
    <text x="36" y="126" text-anchor="end" fill="#9b59b6" font-size="10" font-family="monospace">IB</text>
    <!-- Right pins: OUT+ OUT- -->
    <line x1="200" y1="72" x2="224" y2="72" stroke="#f39c12" stroke-width="4" stroke-linecap="round"/>
    <line x1="200" y1="108" x2="224" y2="108" stroke="#555" stroke-width="4" stroke-linecap="round"/>
    <text x="228" y="76" fill="#f39c12" font-size="10" font-family="monospace">OUT+</text>
    <text x="228" y="112" fill="#888" font-size="10" font-family="monospace">OUT-</text>
    <!-- Motor symbol -->
    <circle cx="242" cy="90" r="16" fill="none" stroke="#ccc" stroke-width="2"/>
    <text x="242" y="94" text-anchor="middle" fill="#ccc" font-size="11" font-family="monospace" font-weight="bold">M</text>
    <!-- Animated current flow -->
    <line x1="60" y1="58" x2="103" y2="80" stroke="#e74c3c" stroke-width="2" class="flow"/>
    <line x1="103" y1="80" x2="200" y2="72" stroke="#f39c12" stroke-width="2" class="flow" style="animation-delay:.3s"/>
    <!-- PCB label -->
    <text x="130" y="155" text-anchor="middle" fill="#fff" font-size="10" font-family="Cairo,sans-serif" font-weight="bold">L9110S × واحد لكل محرك</text>
  </svg>`,

  omni: () => `<svg viewBox="0 0 260 180" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes spinWheel{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      @keyframes slideX{0%,100%{transform:translateX(0)}50%{transform:translateX(18px)}}
      .hub{transform-origin:130px 90px;animation:spinWheel 2s linear infinite}
      .slid{animation:slideX 2s ease-in-out infinite}
    </style>
    <!-- Hub center -->
    <g class="hub">
      <circle cx="130" cy="90" r="28" fill="#444" stroke="#666" stroke-width="2"/>
      <circle cx="130" cy="90" r="10" fill="#888"/>
      <!-- Rollers on rim (8 rollers at 45° intervals) -->
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(0,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(45,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(90,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(135,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(180,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(225,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(270,130,90)"/>
      <rect x="124" y="56" width="12" height="20" rx="6" fill="#c9a227" transform="rotate(315,130,90)"/>
    </g>
    <!-- Forward arrow -->
    <line x1="130" y1="28" x2="130" y2="8" stroke="#43a047" stroke-width="3" marker-end="url(#arr)"/>
    <line x1="130" y1="152" x2="130" y2="172" stroke="#e53935" stroke-width="3" marker-end="url(#arr2)"/>
    <!-- Sideways arrow (animated) -->
    <g class="slid">
      <line x1="172" y1="90" x2="196" y2="90" stroke="#2196f3" stroke-width="3" stroke-linecap="round"/>
      <polygon points="196,84 208,90 196,96" fill="#2196f3"/>
    </g>
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <polygon points="0,0 8,4 0,8" fill="#43a047"/>
      </marker>
      <marker id="arr2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <polygon points="0,0 8,4 0,8" fill="#e53935"/>
      </marker>
    </defs>
    <text x="130" y="14" text-anchor="middle" fill="#43a047" font-size="10" font-family="Cairo,sans-serif">أمام</text>
    <text x="130" y="176" text-anchor="middle" fill="#e53935" font-size="10" font-family="Cairo,sans-serif">خلف</text>
    <text x="214" y="94" fill="#2196f3" font-size="10" font-family="Cairo,sans-serif">جانب</text>
    <text x="130" y="195" text-anchor="middle" fill="#555" font-size="10" font-family="Cairo,sans-serif">أسطوانات تسمح بالانزلاق الجانبي</text>
  </svg>`,

  servo: () => `<svg viewBox="0 0 260 200" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes kickArm{0%,40%,100%{transform:rotate(-10deg)}60%,80%{transform:rotate(110deg)}}
      .arm{transform-origin:130px 85px;animation:kickArm 2.5s ease-in-out infinite}
    </style>
    <!-- Body -->
    <rect x="65" y="60" width="130" height="90" rx="6" fill="#7f8c8d"/>
    <rect x="65" y="60" width="130" height="90" rx="6" fill="none" stroke="#95a5a6" stroke-width="2"/>
    <!-- Mounting tabs -->
    <rect x="40" y="68" width="28" height="20" rx="3" fill="#606c70"/>
    <circle cx="52" cy="78" r="5" fill="#888" stroke="#555" stroke-width="1.5"/>
    <rect x="192" y="68" width="28" height="20" rx="3" fill="#606c70"/>
    <circle cx="208" cy="78" r="5" fill="#888" stroke="#555" stroke-width="1.5"/>
    <!-- Output shaft -->
    <circle cx="130" cy="85" r="14" fill="#bdc3c7" stroke="#95a5a6" stroke-width="2"/>
    <circle cx="130" cy="85" r="6" fill="#7f8c8d"/>
    <!-- Arm (animated) -->
    <g class="arm">
      <rect x="127" y="56" width="6" height="32" rx="3" fill="#fff"/>
      <circle cx="130" cy="55" r="5" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="1.5"/>
    </g>
    <!-- Wires -->
    <line x1="85" y1="150" x2="85" y2="185" stroke="#f39c12" stroke-width="4" stroke-linecap="round"/>
    <line x1="130" y1="150" x2="130" y2="185" stroke="#e74c3c" stroke-width="4" stroke-linecap="round"/>
    <line x1="175" y1="150" x2="175" y2="185" stroke="#7f5c3e" stroke-width="4" stroke-linecap="round"/>
    <text x="85" y="196" text-anchor="middle" fill="#f39c12" font-size="10" font-family="monospace">إشارة</text>
    <text x="130" y="196" text-anchor="middle" fill="#e74c3c" font-size="10" font-family="monospace">5V</text>
    <text x="175" y="196" text-anchor="middle" fill="#888" font-size="10" font-family="monospace">GND</text>
    <!-- Angle labels -->
    <text x="148" y="50" fill="#43a047" font-size="10" font-family="Cairo,sans-serif">١٢٠° ضربة</text>
    <text x="148" y="38" fill="#2196f3" font-size="10" font-family="Cairo,sans-serif">٠° استراحة</text>
    <!-- MG996R label -->
    <text x="130" y="120" text-anchor="middle" fill="#fff" font-size="11" font-family="monospace" font-weight="bold">MG996R</text>
  </svg>`,

  joystick: () => `<svg viewBox="0 0 260 200" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes tiltStick{
        0%,100%{transform:translate(0,0) rotate(0deg)}
        20%{transform:translate(0,-12px) rotate(-8deg)}
        40%{transform:translate(12px,0) rotate(8deg)}
        60%{transform:translate(0,12px) rotate(8deg)}
        80%{transform:translate(-12px,0) rotate(-8deg)}
      }
      .stick{animation:tiltStick 4s ease-in-out infinite;transform-origin:130px 100px}
    </style>
    <!-- PCB -->
    <rect x="55" y="55" width="150" height="120" rx="6" fill="#2c3e50"/>
    <rect x="55" y="55" width="150" height="120" rx="6" fill="none" stroke="#34495e" stroke-width="2"/>
    <!-- Base of joystick -->
    <circle cx="130" cy="100" r="26" fill="#34495e" stroke="#555" stroke-width="2"/>
    <!-- Joystick stick (animated) -->
    <g class="stick">
      <line x1="130" y1="100" x2="130" y2="72" stroke="#888" stroke-width="6" stroke-linecap="round"/>
      <circle cx="130" cy="70" r="12" fill="#666" stroke="#888" stroke-width="2"/>
      <circle cx="130" cy="70" r="7" fill="#c0392b"/>
    </g>
    <!-- Axes arrows -->
    <line x1="96" y1="100" x2="72" y2="100" stroke="#2196f3" stroke-width="2" stroke-dasharray="4 2"/>
    <line x1="164" y1="100" x2="188" y2="100" stroke="#2196f3" stroke-width="2" stroke-dasharray="4 2"/>
    <text x="66" y="98" text-anchor="middle" fill="#2196f3" font-size="9" font-family="monospace">X−</text>
    <text x="196" y="98" text-anchor="middle" fill="#2196f3" font-size="9" font-family="monospace">X+</text>
    <line x1="130" y1="74" x2="130" y2="56" stroke="#4caf50" stroke-width="2" stroke-dasharray="4 2"/>
    <line x1="130" y1="126" x2="130" y2="144" stroke="#4caf50" stroke-width="2" stroke-dasharray="4 2"/>
    <text x="130" y="52" text-anchor="middle" fill="#4caf50" font-size="9" font-family="monospace">Y−</text>
    <text x="130" y="152" text-anchor="middle" fill="#4caf50" font-size="9" font-family="monospace">Y+</text>
    <!-- Pins at bottom -->
    <line x1="75"  y1="175" x2="75"  y2="190" stroke="#e74c3c" stroke-width="3" stroke-linecap="round"/>
    <line x1="100" y1="175" x2="100" y2="190" stroke="#1b2340" stroke-width="3" stroke-linecap="round"/>
    <line x1="125" y1="175" x2="125" y2="190" stroke="#2196f3" stroke-width="3" stroke-linecap="round"/>
    <line x1="150" y1="175" x2="150" y2="190" stroke="#4caf50" stroke-width="3" stroke-linecap="round"/>
    <line x1="175" y1="175" x2="175" y2="190" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
    <text x="75"  y="198" text-anchor="middle" fill="#e74c3c" font-size="8" font-family="monospace">VCC</text>
    <text x="100" y="198" text-anchor="middle" fill="#888"    font-size="8" font-family="monospace">GND</text>
    <text x="125" y="198" text-anchor="middle" fill="#2196f3" font-size="8" font-family="monospace">VRX</text>
    <text x="150" y="198" text-anchor="middle" fill="#4caf50" font-size="8" font-family="monospace">VRY</text>
    <text x="175" y="198" text-anchor="middle" fill="#aaa"    font-size="8" font-family="monospace">SW</text>
    <!-- Label -->
    <text x="130" y="48" text-anchor="middle" fill="#aaa" font-size="10" font-family="Cairo,sans-serif" font-weight="bold">KY-023</text>
  </svg>`,

  motor: () => `<svg viewBox="0 0 260 180" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">
    <style>
      @keyframes spinOmni{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      .omniSpin{transform-origin:185px 90px;animation:spinOmni 1.5s linear infinite}
    </style>
    <!-- Motor body (cylinder side view) -->
    <rect x="40" y="60" width="110" height="60" rx="6" fill="#7f8c8d"/>
    <rect x="40" y="60" width="110" height="60" rx="6" fill="none" stroke="#95a5a6" stroke-width="2"/>
    <!-- Motor end cap -->
    <ellipse cx="40" cy="90" rx="12" ry="30" fill="#606c70" stroke="#7f8c8d" stroke-width="1.5"/>
    <!-- Ventilation slots -->
    <line x1="70" y1="66" x2="70" y2="114" stroke="#606c70" stroke-width="1.5"/>
    <line x1="90" y1="66" x2="90" y2="114" stroke="#606c70" stroke-width="1.5"/>
    <line x1="110" y1="66" x2="110" y2="114" stroke="#606c70" stroke-width="1.5"/>
    <line x1="130" y1="66" x2="130" y2="114" stroke="#606c70" stroke-width="1.5"/>
    <!-- Shaft -->
    <rect x="148" y="85" width="22" height="10" rx="3" fill="#bdc3c7"/>
    <!-- Omni wheel (spinning) -->
    <g class="omniSpin">
      <circle cx="185" cy="90" r="28" fill="#444" stroke="#666" stroke-width="2"/>
      <circle cx="185" cy="90" r="9" fill="#888"/>
      <rect x="179" y="58" width="12" height="18" rx="6" fill="#c9a227" transform="rotate(0,185,90)"/>
      <rect x="179" y="58" width="12" height="18" rx="6" fill="#c9a227" transform="rotate(60,185,90)"/>
      <rect x="179" y="58" width="12" height="18" rx="6" fill="#c9a227" transform="rotate(120,185,90)"/>
      <rect x="179" y="58" width="12" height="18" rx="6" fill="#c9a227" transform="rotate(180,185,90)"/>
      <rect x="179" y="58" width="12" height="18" rx="6" fill="#c9a227" transform="rotate(240,185,90)"/>
      <rect x="179" y="58" width="12" height="18" rx="6" fill="#c9a227" transform="rotate(300,185,90)"/>
    </g>
    <!-- Labels -->
    <text x="90" y="144" text-anchor="middle" fill="#ccc" font-size="11" font-family="Cairo,sans-serif" font-weight="bold">موتور DC TT</text>
    <text x="185" y="144" text-anchor="middle" fill="#c9a227" font-size="10" font-family="Cairo,sans-serif" font-weight="bold">عجلة أومني</text>
    <!-- Speed arrow -->
    <line x1="220" y1="90" x2="248" y2="90" stroke="#43a047" stroke-width="3" stroke-linecap="round"/>
    <polygon points="248,84 260,90 248,96" fill="#43a047"/>
    <text x="252" y="82" fill="#43a047" font-size="9" font-family="Cairo,sans-serif">أمام</text>
  </svg>`,
};

let _ppid = 0;
Object.assign(window.DECK_TYPES, {
  partpic(s) {
    const id = 'pp' + (_ppid++);
    const svg = PART_SVGS[s.pic] ? PART_SVGS[s.pic]() : `<svg width="200" height="160"><text x="100" y="80" text-anchor="middle" fill="#999" font-size="14">${s.pic}</text></svg>`;
    const facts = (s.facts || []).map(f => `<li><b>${f.k}</b> ${f.v}</li>`).join('');
    return `<div class="slide light">
      <div class="kicker">${s.kicker || ''}</div>
      <h2 class="title" style="margin-bottom:8px">${s.title || ''}</h2>
      <div class="fb-partpic">
        <div class="fb-pic-svg" id="${id}">${svg}</div>
        <div class="fb-pic-info">
          <p class="fb-pic-desc">${s.desc || ''}</p>
          <ul class="fb-pic-facts">${facts}</ul>
        </div>
      </div>
    </div>`;
  },
});

/* ==================== chassisbuild — تجميع الهيكل خطوة بخطوة ==================== */
Object.assign(window.DECK_TYPES, {
  chassisbuild: s => `<div class="slide light">
    <div class="kicker">${s.kicker || '🔧 خطوة بخطوة'}</div>
    <h2 class="title" style="margin-bottom:6px">${s.title || 'شاهد الروبوت يُبنى أمامك'}</h2>
    <div class="fb-chassis-wrap ix">
      <canvas class="fb-chassis-canvas" width="820" height="420"></canvas>
      <div class="fb-chassis-nav">
        <button id="cb_prev">→ السابق</button>
        <span class="fb-chassis-step" id="cb_step">الخطوة ١ من ٧</span>
        <button id="cb_next">التالي ←</button>
      </div>
    </div>
  </div>`,
});

Object.assign(window.DECK_BIND, {
  chassisbuild(sl) {
    const canvas = sl.querySelector('.fb-chassis-canvas');
    const ctx = canvas.getContext('2d');
    const W = 820, H = 420;
    const CX = W / 2, CY = H / 2 + 20;
    const R = 150; // triangle circumradius
    let step = 0;
    let raf;
    let t = 0; // animation time

    // Triangle vertices (120° apart, top = 270°)
    const verts = [0, 1, 2].map(i => {
      const a = (i * 120 - 90) * Math.PI / 180;
      return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
    });
    // Motor positions: V0=top(M1), V1=right(M2), V2=left(M3)
    const motorLabels = ['M1 أمامي', 'M2 يمين-خلف', 'M3 يسار-خلف'];
    const motorColors = ['#4dc8c6', '#f4d35e', '#f4a235'];

    const steps = [
      { label: 'الخطوة ١ من ٧: الهيكل المثلث — القاعدة' },
      { label: 'الخطوة ٢ من ٧: المحرك الأمامي M1' },
      { label: 'الخطوة ٣ من ٧: المحرك اليمين-خلف M2' },
      { label: 'الخطوة ٤ من ٧: المحرك اليسار-خلف M3' },
      { label: 'الخطوة ٥ من ٧: ESP32 في المركز' },
      { label: 'الخطوة ٦ من ٧: دريفرات L9110S' },
      { label: 'الخطوة ٧ من ٧: السيرفو — الضربة القاتلة' },
      { label: '✅ الروبوت جاهز للمسابقة!' },
    ];

    // Easing
    const easeOut = p => 1 - Math.pow(1 - p, 3);

    // Draw omni wheel symbol
    function drawOmniWheel(x, y, r, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle || 0);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#333'; ctx.fill();
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.save(); ctx.rotate(a);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(-3, r - 8, 6, 7);
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#777'; ctx.fill();
      ctx.restore();
    }

    // Draw motor + wheel at vertex
    function drawMotor(vi, alpha, wheelSpin) {
      const v = verts[vi];
      ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1);
      // Motor body
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath(); ctx.roundRect(v.x - 14, v.y - 10, 28, 20, 4); ctx.fill();
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.stroke();
      // Wheel
      drawOmniWheel(v.x, v.y - 22, 13, wheelSpin);
      // Label
      ctx.fillStyle = motorColors[vi]; ctx.font = 'bold 15px Cairo,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(motorLabels[vi], v.x, v.y + 14);
      ctx.restore();
    }

    function drawScene() {
      ctx.clearRect(0, 0, W, H);
      // Background
      ctx.fillStyle = '#1e2535';
      ctx.fillRect(0, 0, W, H);

      // Triangle chassis
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      ctx.lineTo(verts[1].x, verts[1].y);
      ctx.lineTo(verts[2].x, verts[2].y);
      ctx.closePath();
      ctx.strokeStyle = step === 0 ? '#4dc8c6' : 'rgba(77,200,198,.5)';
      ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = step === 0 ? 'rgba(77,200,198,.08)' : 'rgba(77,200,198,.04)';
      ctx.fill();
      if (step === 0) {
        ctx.fillStyle = '#4dc8c6'; ctx.font = 'bold 20px Cairo,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('الهيكل', CX, CY);
        // Angle labels
        [0,1,2].map((i,_) => {
          const a = (i * 120 - 90) * Math.PI / 180;
          const lx = CX + (R + 32) * Math.cos(a), ly = CY + (R + 32) * Math.sin(a);
          ctx.fillStyle = '#aaa'; ctx.font = '15px Cairo,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('١٢٠°', lx, ly);
        });
      }

      // Motors 1 appear at step>=1, 2 at step>=2, 3 at step>=3
      for (let mi = 0; mi < 3; mi++) {
        if (step >= mi + 1) drawMotor(mi, 1, t * 0.03);
      }

      // ESP32 in center (step>=4)
      if (step >= 4) {
        const alpha = clamp((step - 3) * 2, 0, 1);
        const pulse = 0.85 + 0.15 * Math.sin(t * 0.08);
        ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.fillStyle = '#0e7c86';
        ctx.beginPath(); ctx.roundRect(CX - 28, CY - 18, 56, 36, 5); ctx.fill();
        ctx.strokeStyle = `rgba(77,200,198,${pulse})`; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('ESP32', CX, CY - 3);
        ctx.fillStyle = '#4dc8c6'; ctx.font = '13px Cairo,sans-serif';
        ctx.fillText('الدماغ', CX, CY + 12);
        ctx.restore();
      }

      // L9110S near each motor (step>=5)
      if (step >= 5) {
        for (let mi = 0; mi < 3; mi++) {
          const v = verts[mi];
          const cx2 = (v.x + CX) / 2, cy2 = (v.y + CY) / 2;
          ctx.save(); ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#1a3a8f';
          ctx.beginPath(); ctx.roundRect(cx2 - 12, cy2 - 9, 24, 18, 3); ctx.fill();
          ctx.strokeStyle = '#4a7dff'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#7af'; ctx.font = 'bold 11px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('L9110S', cx2, cy2);
          // Wire from esp32 to driver
          ctx.strokeStyle = 'rgba(100,180,255,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
          ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(cx2, cy2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
        ctx.save(); ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#4dc8c6'; ctx.font = 'bold 15px Cairo,sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('دريفر L9110S', CX, CY + 36);
        ctx.restore();
      }

      // Servo at front (step>=6)
      if (step >= 6) {
        const sv = verts[0];
        const sa = Math.sin(t * 0.05) * 0.8 + 0.8; // servo arm angle animation
        ctx.save(); ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#2b6fc0';
        ctx.beginPath(); ctx.roundRect(sv.x - 16, sv.y - 55, 32, 22, 4); ctx.fill();
        ctx.strokeStyle = '#4dc8c6'; ctx.lineWidth = 1.5; ctx.stroke();
        // Servo arm
        ctx.save(); ctx.translate(sv.x, sv.y - 45);
        ctx.rotate(sa);
        ctx.fillStyle = '#f4d35e';
        ctx.fillRect(-3, -16, 6, 16);
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Cairo,sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('سيرفو', sv.x, sv.y - 44);
        ctx.restore();
      }

      // Final: DONE text + glow
      if (step >= 7) {
        ctx.save();
        const glow = 0.6 + 0.4 * Math.sin(t * 0.07);
        ctx.fillStyle = `rgba(77,200,198,${glow * 0.15})`;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#43a047'; ctx.font = 'bold 39px Cairo,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = '#43a047'; ctx.shadowBlur = 18;
        ctx.fillText('✅ الروبوت جاهز!', CX, 38);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    function animate() {
      t++;
      drawScene();
      raf = requestAnimationFrame(animate);
    }

    function updateUI() {
      const lbl = sl.querySelector('#cb_step');
      if (lbl) lbl.textContent = steps[Math.min(step, steps.length - 1)].label;
    }

    const prev = sl.querySelector('#cb_prev');
    const next = sl.querySelector('#cb_next');
    if (prev) prev.addEventListener('click', () => { step = Math.max(0, step - 1); updateUI(); });
    if (next) next.addEventListener('click', () => { step = Math.min(steps.length - 1, step + 1); updateUI(); });
    updateUI();
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  },
});


/* ==================== normlab — مختبر التطبيع ==================== */
Object.assign(window.DECK_TYPES, {
  normlab: s => `<div class="slide light">
    <div class="kicker">🔬 مختبر التطبيع</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'قبل وبعد التطبيع'}</h2>
    <div class="fb-normlab ix">
      <div class="fb-norm-sliders">
        <div class="fb-slider-row"><label>vx (يمين): <b id="nm_vxv">0</b></label><input type="range" id="nm_vx" min="-100" max="100" value="0"></div>
        <div class="fb-slider-row"><label>vy (أمام): <b id="nm_vyv">0</b></label><input type="range" id="nm_vy" min="-100" max="100" value="0"></div>
        <div class="fb-slider-row"><label>rot (دوران): <b id="nm_rotv">0</b></label><input type="range" id="nm_rot" min="-80" max="80" value="0"></div>
        <div id="nm_warning" class="fb-norm-warn" style="display:none">⚠️ تجاوز 100 — التطبيع ضروري!</div>
      </div>
      <div class="fb-norm-grid">
        <div class="fb-norm-head">المحرك</div>
        <div class="fb-norm-head">قبل التطبيع</div>
        <div class="fb-norm-head">بعد التطبيع</div>
        <div class="fb-norm-lbl">W1 أمامي</div>
        <div class="fb-norm-cell" id="nm_r1">0</div>
        <div class="fb-norm-cell ok" id="nm_n1">0</div>
        <div class="fb-norm-lbl">W2 يمين-خلف</div>
        <div class="fb-norm-cell" id="nm_r2">0</div>
        <div class="fb-norm-cell ok" id="nm_n2">0</div>
        <div class="fb-norm-lbl">W3 يسار-خلف</div>
        <div class="fb-norm-cell" id="nm_r3">0</div>
        <div class="fb-norm-cell ok" id="nm_n3">0</div>
      </div>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  normlab(sl) {
    const upd = () => {
      const vx = +sl.querySelector('#nm_vx').value;
      const vy = +sl.querySelector('#nm_vy').value;
      const rot = +sl.querySelector('#nm_rot').value;
      sl.querySelector('#nm_vxv').textContent = vx;
      sl.querySelector('#nm_vyv').textContent = vy;
      sl.querySelector('#nm_rotv').textContent = rot;
      const { raw, norm } = omniNorm(vx, vy, rot);
      const overLimit = raw.some(v => Math.abs(v) > 100);
      const warn = sl.querySelector('#nm_warn' + 'ing');
      if (warn) warn.style.display = overLimit ? '' : 'none';
      raw.forEach((v, i) => {
        const el = sl.querySelector('#nm_r' + (i+1));
        if (!el) return;
        el.textContent = v.toFixed(1);
        el.className = 'fb-norm-cell' + (Math.abs(v) > 100 ? ' over' : '');
      });
      norm.forEach((v, i) => {
        const el = sl.querySelector('#nm_n' + (i+1));
        if (el) { el.textContent = v.toFixed(1); el.className = 'fb-norm-cell ok'; }
      });
    };
    ['nm_vx','nm_vy','nm_rot'].forEach(id => sl.querySelector('#'+id).addEventListener('input', upd));
    upd();
  },
});

/* ==================== ramplab — مختبر التسارع التدريجي ==================== */
Object.assign(window.DECK_TYPES, {
  ramplab: s => `<div class="slide light">
    <div class="kicker">🎮 مختبر الـ Ramping</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'مع وبدون Ramping'}</h2>
    <div class="fb-ramplab ix">
      <canvas class="fb-ramp-canvas" width="520" height="220"></canvas>
      <div class="fb-ramp-ctrl">
        <div class="fb-slider-row" style="max-width:280px">
          <label>RAMP_RATE: <b id="rl_rv">0.12</b></label>
          <input type="range" id="rl_rate" min="0.02" max="1.0" step="0.01" value="0.12">
        </div>
        <div class="fb-ramp-btns">
          <button id="rl_fwd">⬆ أمام</button>
          <button id="rl_stop">⏹ إيقاف</button>
        </div>
        <div class="fb-ramp-info">
          <span>الهدف: <b id="rl_tgt">0</b></span>
          <span>الحالي: <b id="rl_cur">0</b></span>
        </div>
      </div>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  ramplab(sl) {
    const canvas = sl.querySelector('.fb-ramp-canvas');
    const ctx = canvas.getContext('2d');
    const W = 520, H = 220;
    let tgt = 0, cur = 0, ramp = 0.12;
    const history = Array(W).fill(0);
    let raf;

    const upd = () => {
      ramp = +sl.querySelector('#rl_rate').value;
      sl.querySelector('#rl_rv').textContent = ramp.toFixed(2);
    };
    sl.querySelector('#rl_rate').addEventListener('input', upd);
    sl.querySelector('#rl_fwd').addEventListener('click', () => { tgt = 100; });
    sl.querySelector('#rl_stop').addEventListener('click', () => { tgt = 0; });

    function frame() {
      cur += (tgt - cur) * ramp;
      if (Math.abs(tgt - cur) < 0.5) cur = tgt;
      history.push(cur);
      history.shift();

      const tgtEl = sl.querySelector('#rl_tgt');
      const curEl = sl.querySelector('#rl_cur');
      if (tgtEl) tgtEl.textContent = tgt.toFixed(0);
      if (curEl) curEl.textContent = cur.toFixed(1);

      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, W, H);

      /* Grid */
      ctx.strokeStyle = '#dde'; ctx.lineWidth = 1;
      [0, 25, 50, 75, 100].forEach(v => {
        const y = H - 20 - (v / 100) * (H - 40);
        ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 10, y); ctx.stroke();
        ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.textAlign = 'right';
        ctx.fillText(v, 36, y + 4);
      });
      /* Axis labels */
      ctx.fillStyle = '#555'; ctx.font = '12px Cairo,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('السرعة %', 18, H / 2);
      ctx.fillText('الوقت (فريمات) ←', W / 2, H - 4);

      /* Target line */
      const ty = H - 20 - (tgt / 100) * (H - 40);
      ctx.setLineDash([6, 4]); ctx.strokeStyle = '#e53935'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(40, ty); ctx.lineTo(W - 10, ty); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e53935'; ctx.font = '11px Cairo,sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('هدف ' + tgt, W - 60, ty - 4);

      /* Speed curve */
      ctx.strokeStyle = '#2b6fc0'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      history.forEach((v, i) => {
        const x = 40 + (i / history.length) * (W - 50);
        const y = H - 20 - (v / 100) * (H - 40);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      /* Fill under curve */
      ctx.fillStyle = 'rgba(43,111,192,.12)';
      ctx.beginPath();
      history.forEach((v, i) => {
        const x = 40 + (i / history.length) * (W - 50);
        const y = H - 20 - (v / 100) * (H - 40);
        if (i === 0) ctx.moveTo(x, H - 20); else ctx.lineTo(x, y);
      });
      ctx.lineTo(40 + (W-50), H - 20);
      ctx.closePath(); ctx.fill();

      /* Current speed dot */
      const cx2 = W - 10 - 15;
      const cy2 = H - 20 - (cur / 100) * (H - 40);
      ctx.beginPath(); ctx.arc(cx2, cy2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#2b6fc0'; ctx.fill();

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  },
});

})();
