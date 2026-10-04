/* =====================================================================
   سيارة كرة القدم الأومني — أدوات التفاعل
   omnilab · omnimath · nowlab · omnilab2 · wireanm
   فيزياء الأومني: M1=vy, M2=-vy/2+vx*0.87, M3=-vy/2-vx*0.87
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* حساب سرعات المحركات الثلاثة */
function omniCalc(vx, vy, rot) {
  const M1 = clamp(vy + rot, -255, 255);
  const M2 = clamp(-vy / 2 + vx * 87 / 100 + rot, -255, 255);
  const M3 = clamp(-vy / 2 - vx * 87 / 100 + rot, -255, 255);
  return [M1, M2, M3];
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
    const arrowLen = Math.abs(spd) / 255 * 22;
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
          <b>المعادلة:</b><br>
          M1 = vy<br>
          M2 = −vy/2 + vx × 0.87<br>
          M3 = −vy/2 − vx × 0.87
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
        const pct = Math.abs(v) / 255 * 120;
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
    <div class="kicker">⚽ ملعب التجربة الكامل</div>
    <h2 class="title" style="margin-bottom:8px">${s.title||'سيارة أومني — جرّب الحركة الكاملة'}</h2>
    <div class="fb-lab2 ix">
      <div class="fb-lab2-left">
        <div class="fb-score"><span>🔵 <b id="fl_s0">٠</b></span><span>🔴 <b id="fl_s1">٠</b></span></div>
        <div class="fb-wheel-bars">
          <div class="fb-wb-row"><span>M1</span><div class="fb-wb-track"><div class="fb-wb-fill" id="fl_m1"></div></div></div>
          <div class="fb-wb-row"><span>M2</span><div class="fb-wb-track"><div class="fb-wb-fill" id="fl_m2"></div></div></div>
          <div class="fb-wb-row"><span>M3</span><div class="fb-wb-track"><div class="fb-wb-fill" id="fl_m3"></div></div></div>
        </div>
        <div id="fl_st" style="font-size:12px;font-family:Cairo,sans-serif;font-weight:700;color:#555">جاهز للعب</div>
        <div class="fb-lab2-btns">
          <button id="fl_ul">↖</button><button id="fl_up">⬆</button><button id="fl_ur">↗</button>
          <button id="fl_lt">⬅</button><button id="fl_kick">⚽</button><button id="fl_rt">➡</button>
          <button id="fl_dl">↙</button><button id="fl_dn">⬇</button><button id="fl_dr">↘</button>
          <button id="fl_rotl">↺</button><span></span><button id="fl_rotr">↻</button>
        </div>
      </div>
      <canvas class="fb-lab2-field" width="480" height="300"></canvas>
    </div></div>`,
});

Object.assign(window.DECK_BIND, {
  omnilab2(sl) {
    const canvas = sl.querySelector('.fb-lab2-field');
    const ctx = canvas.getContext('2d');
    const FW = 480, FH = 300;
    const BALL_R = 9, GOAL_Y0 = 100, GOAL_Y1 = 200;
    const score = [0, 0];
    let goalFlash = 0, flashSide = 0;
    let last = 0, raf;

    const robot = { x: FW / 2, y: FH / 2, angle: 0 };
    const ball = { x: FW / 2 + 40, y: FH / 2, vx: 0, vy: 0, free: false };
    const servo = { angle: 0, active: false, timer: 0 };

    let vx = 0, vy = 0, rot = 0, kickReq = false;

    const CMD = {
      fl_up: [0, -100, 0], fl_dn: [0, 100, 0], fl_lt: [-100, 0, 0], fl_rt: [100, 0, 0],
      fl_ul: [-80, -80, 0], fl_ur: [80, -80, 0], fl_dl: [-80, 80, 0], fl_dr: [80, 80, 0],
      fl_rotl: [0, 0, -80], fl_rotr: [0, 0, 80],
    };
    const held = {};
    const updateCmd = () => {
      let _vx = 0, _vy = 0, _rot = 0;
      Object.keys(held).forEach(k => { if (held[k] && CMD[k]) { _vx += CMD[k][0]; _vy += CMD[k][1]; _rot += CMD[k][2]; } });
      vx = clamp(_vx, -100, 100); vy = clamp(_vy, -100, 100); rot = clamp(_rot, -80, 80);
    };
    Object.keys(CMD).forEach(id => {
      const btn = sl.querySelector('#' + id);
      if (!btn) return;
      btn.addEventListener('pointerdown', e => { e.preventDefault(); held[id] = true; updateCmd(); });
      btn.addEventListener('pointerup', () => { held[id] = false; updateCmd(); });
      btn.addEventListener('pointerleave', () => { held[id] = false; updateCmd(); });
    });
    const kickBtn = sl.querySelector('#fl_kick');
    if (kickBtn) kickBtn.addEventListener('pointerdown', e => { e.preventDefault(); kickReq = true; });

    function updateWheelBars(M1, M2, M3) {
      [M1, M2, M3].forEach((v, i) => {
        const el = sl.querySelector('#fl_m' + (i + 1));
        if (!el) return;
        const pct = Math.abs(v) / 255 * 50;
        el.style.width = pct + '%';
        el.style.marginLeft = v >= 0 ? '50%' : (50 - pct) + '%';
        el.style.background = v >= 0 ? '#43a047' : '#e53935';
      });
    }

    function frame(ts) {
      const dt = Math.min(ts - last, 50);
      last = ts;
      const [M1, M2, M3] = omniCalc(vx, vy, rot);
      updateWheelBars(M1, M2, M3);

      /* حركة الروبوت */
      const spd = 0.28;
      const cosA = Math.cos(robot.angle), sinA = Math.sin(robot.angle);
      const worldVx = (cosA * vx - sinA * vy) * spd * dt / 40;
      const worldVy = (sinA * vx + cosA * vy) * spd * dt / 40;
      robot.x = clamp(robot.x + worldVx, 40, FW - 40);
      robot.y = clamp(robot.y + worldVy, 40, FH - 40);
      robot.angle += rot * 0.003 * dt / 16;

      /* السيرفو */
      if (kickReq && !servo.active) {
        servo.active = true; servo.timer = 350; kickReq = false;
        /* دفع الكرة */
        const kickDirX = Math.cos(robot.angle - Math.PI / 2);
        const kickDirY = Math.sin(robot.angle - Math.PI / 2);
        ball.vx = kickDirX * 7; ball.vy = kickDirY * 7; ball.free = true;
        const st = sl.querySelector('#fl_st'); if (st) st.textContent = '⚽ تسديدة!';
      }
      if (servo.active) {
        servo.timer -= dt;
        servo.angle = servo.timer > 0 ? 120 : 0;
        if (servo.timer <= 0) { servo.active = false; servo.angle = 0; }
      }

      /* الكرة */
      if (!ball.free) {
        const fwd = 36;
        ball.x = robot.x + Math.cos(robot.angle - Math.PI / 2) * fwd;
        ball.y = robot.y + Math.sin(robot.angle - Math.PI / 2) * fwd;
      } else {
        ball.x += ball.vx; ball.y += ball.vy;
        ball.vx *= 0.96; ball.vy *= 0.96;
        if (ball.x < BALL_R || ball.x > FW - BALL_R) ball.vx *= -0.7;
        if (ball.y < BALL_R) ball.vy *= -0.7;
        if (ball.y > FH - BALL_R) { ball.vy *= -0.7; ball.y = FH - BALL_R; }
        if (Math.abs(ball.vx) + Math.abs(ball.vy) < 0.3) { ball.free = false; }

        /* هدف يسار */
        if (ball.x < 16 && ball.y > GOAL_Y0 && ball.y < GOAL_Y1) {
          score[0]++; goalFlash = 60; flashSide = 0;
          const el = sl.querySelector('#fl_s0');
          if (el) { el.textContent = AR(score[0]); el.classList.add('gol'); setTimeout(() => el.classList.remove('gol'), 600); }
          ball.x = FW / 2; ball.y = FH / 2; ball.vx = 0; ball.vy = 0; ball.free = false;
          robot.x = FW / 2; robot.y = FH / 2 + 60; robot.angle = 0;
          const st = sl.querySelector('#fl_st'); if (st) st.textContent = '🎉 هدف!';
        }
        /* هدف يمين */
        if (ball.x > FW - 16 && ball.y > GOAL_Y0 && ball.y < GOAL_Y1) {
          score[1]++; goalFlash = 60; flashSide = 1;
          const el = sl.querySelector('#fl_s1');
          if (el) { el.textContent = AR(score[1]); el.classList.add('gol'); setTimeout(() => el.classList.remove('gol'), 600); }
          ball.x = FW / 2; ball.y = FH / 2; ball.vx = 0; ball.vy = 0; ball.free = false;
          robot.x = FW / 2; robot.y = FH / 2 + 60; robot.angle = 0;
          const st = sl.querySelector('#fl_st'); if (st) st.textContent = '🎉 هدف!';
        }
      }
      if (goalFlash > 0) goalFlash--;

      /* رسم الملعب */
      ctx.fillStyle = '#2d8a4e'; ctx.fillRect(0, 0, FW, FH);
      /* خطوط */
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, FW - 24, FH - 24);
      ctx.beginPath(); ctx.moveTo(FW / 2, 12); ctx.lineTo(FW / 2, FH - 12); ctx.stroke();
      ctx.beginPath(); ctx.arc(FW / 2, FH / 2, 40, 0, Math.PI * 2); ctx.stroke();
      /* مرميان */
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.strokeRect(0, GOAL_Y0, 16, GOAL_Y1 - GOAL_Y0); /* يسار */
      ctx.strokeRect(FW - 16, GOAL_Y0, 16, GOAL_Y1 - GOAL_Y0); /* يمين */

      /* تأثير هدف */
      if (goalFlash > 0) {
        ctx.fillStyle = `rgba(255,215,0,${goalFlash / 60 * 0.3})`;
        ctx.fillRect(0, 0, FW, FH);
      }

      /* رسم الروبوت مع السيرفو */
      ctx.save();
      ctx.translate(robot.x, robot.y);
      ctx.rotate(robot.angle);
      /* جسم مثلث */
      ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(-24, 18); ctx.lineTo(24, 18); ctx.closePath();
      ctx.fillStyle = '#2b6fc0'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      /* رأس */
      ctx.beginPath(); ctx.arc(0, -28, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#4dc8c6'; ctx.fill();
      /* ذراع السيرفو */
      const sa = (servo.angle - 90) * Math.PI / 180;
      ctx.save();
      ctx.translate(0, -18);
      ctx.rotate(sa);
      ctx.fillStyle = '#f4d35e';
      ctx.fillRect(-3, -18, 6, 18);
      ctx.restore();
      ctx.restore();

      /* الكرة */
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.stroke();
      /* تفاصيل كرة */
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.stroke();

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(ts => { last = ts; frame(ts); });
    return () => cancelAnimationFrame(raf);
  },
});

})();
