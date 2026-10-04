/* أكاديمية سيارة الروبوت — المحور ١٤: روبوت كرة القدم
   الأنواع: footballab
   فيزياء: قيادة تفاضلية (Differential Drive) حقيقية، تسديد بسيرفو متحرك
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));

/* كود loop() الذي يظهر في لوحة اليسار */
const FBALL_LOOP_CODE =
`void loop(){
  if(data.kick){
    servo.write(120); delay(300);
    servo.write(0);   return;
  }
  if(data.dribble){
    setLeft(200); setRight(100); return;
  }
  int L = data.y + data.x;
  int R = data.y - data.x;
  setLeft(L); setRight(R);
}`;

/* ===== قالب الشريحة ===== */
Object.assign(window.DECK_TYPES, {
  footballab: s => `<div class="slide light">
    <div class="kicker">⚽ ملعب التجربة</div>
    <h2 class="title" style="margin-bottom:8px">${s.title}</h2>
    <div class="fgrid">
      <div class="fleft ix">${codeBlock(FBALL_LOOP_CODE,'micro')}
        <div class="fwheels">
          <div class="fwcol"><span class="fwlabel">أ.يسار</span><div class="fwtrack"><div class="fwfill pos" id="fwFL_pos"></div><div class="fwfill neg" id="fwFL_neg"></div></div></div>
          <div class="fwcol"><span class="fwlabel">أ.يمين</span><div class="fwtrack"><div class="fwfill pos" id="fwFR_pos"></div><div class="fwfill neg" id="fwFR_neg"></div></div></div>
          <div class="fwcol"><span class="fwlabel">خ.يسار</span><div class="fwtrack"><div class="fwfill pos" id="fwBL_pos"></div><div class="fwfill neg" id="fwBL_neg"></div></div></div>
          <div class="fwcol"><span class="fwlabel">خ.يمين</span><div class="fwtrack"><div class="fwfill pos" id="fwBR_pos"></div><div class="fwfill neg" id="fwBR_neg"></div></div></div>
        </div>
        <div class="irdec" id="fst">جاهز للعب</div>
      </div>
      <div class="fright ix">
        <div class="fcscore"><span>🔵 <b id="fsc0">٠</b></span><span>🔴 <b id="fsc1">٠</b></span></div>
        <canvas class="ffield" width="480" height="300"></canvas>
        <div class="fbtns">
          <button class="clap" id="ffwd">⬆ أمام</button>
          <button class="clap" id="fleft">⬅ يسار</button>
          <button class="sndbtn" id="fkick">⚽ سدّد</button>
          <button class="clap" id="fback">⬇ خلف</button>
          <button class="clap" id="fright">➡ يمين</button>
          <button class="sndbtn" id="fdribble">🔄 دريبل</button>
        </div>
      </div>
    </div></div>`,
});

/* ===== منطق التفاعل ===== */
Object.assign(window.DECK_BIND, {
  footballab(sl) {
    const canvas = sl.querySelector('.ffield');
    const ctx = canvas.getContext('2d');
    const FW = 480, FH = 300;

    /* ثوابت الفيزياء */
    const WB = 34;            /* عرض القاعدة بالبكسل */
    const SPD_SCALE = 0.00055;/* px/ms لكل وحدة PWM */
    const BALL_R = 8;
    const GOAL_Y0 = 110, GOAL_Y1 = 190;

    /* الحالة */
    let lSpd = 0, rSpd = 0, mode = 'idle';
    let kickAngle = 0, kickDir = 1, kickActive = false;
    let goalFlash = 0, goalFlashSide = -1;
    const score = [0, 0];
    let last = 0, raf;
    const robot = { x: 240, y: 150, th: 0 };
    const ball  = { x: 275, y: 150, vx: 0, vy: 0, free: false, cd: 0 };

    const resetPos = () => {
      robot.x = 240; robot.y = 150; robot.th = 0;
      ball.x = robot.x + Math.cos(robot.th) * 35;
      ball.y = robot.y + Math.sin(robot.th) * 35;
      ball.vx = 0; ball.vy = 0; ball.free = false; ball.cd = 0;
      kickActive = false; kickAngle = 0;
    };

    /* تحديث أشرطة العجلات */
    const updateWheels = (L, R) => {
      [['FL', L], ['FR', R], ['BL', L], ['BR', R]].forEach(([id, spd]) => {
        const pos = sl.querySelector('#fw' + id + '_pos');
        const neg = sl.querySelector('#fw' + id + '_neg');
        if (!pos) return;
        const h = clamp(Math.abs(spd) / 255 * 32, 0, 32) + 'px';
        if (spd >= 0) { pos.style.height = h; neg.style.height = '0'; }
        else          { neg.style.height = h; pos.style.height = '0'; }
      });
    };

    const setStatus = t => { const el = sl.querySelector('#fst'); if (el) el.textContent = t; };

    /* أزرار الحركة: hold للتحريك المستمر */
    const held = {};
    ['ffwd', 'fback', 'fleft', 'fright'].forEach(id => {
      const el = sl.querySelector('#' + id);
      if (!el) return;
      el.addEventListener('pointerdown', e => { held[id] = true; e.preventDefault(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => { held[id] = false; }));
    });

    /* زر التسديد */
    sl.querySelector('#fkick')?.addEventListener('pointerdown', e => {
      if (!kickActive) {
        kickActive = true; kickAngle = 0; kickDir = 1;
        ball.free = true; ball.cd = 1500;
        ball.vx = Math.cos(robot.th) * 0.55;
        ball.vy = Math.sin(robot.th) * 0.55;
      }
      e.preventDefault();
    });

    /* زر الدريبل: toggle */
    let dribbleOn = false;
    sl.querySelector('#fdribble')?.addEventListener('click', () => {
      dribbleOn = !dribbleOn;
      sl.querySelector('#fdribble').classList.toggle('on', dribbleOn);
    });

    /* ===== رسم الملعب ===== */
    const drawField = () => {
      /* عشب */
      ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, 0, FW, FH);
      /* خطوط داخلية */
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, FW - 28, FH - 28);
      ctx.beginPath(); ctx.moveTo(FW / 2, 14); ctx.lineTo(FW / 2, FH - 14); ctx.stroke();
      /* الدائرة الوسطى */
      ctx.beginPath(); ctx.arc(FW / 2, FH / 2, 38, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(FW / 2, FH / 2, 3, 0, Math.PI * 2); ctx.fill();
      /* منطقة الجزاء */
      ctx.strokeRect(14, GOAL_Y0 - 20, 54, GOAL_Y1 - GOAL_Y0 + 40);
      ctx.strokeRect(FW - 68, GOAL_Y0 - 20, 54, GOAL_Y1 - GOAL_Y0 + 40);
      /* المرمى الأيسر */
      if (goalFlash > 0 && goalFlashSide === 0)
        ctx.fillStyle = 'rgba(255,215,0,.5)';
      else ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(0, GOAL_Y0, 14, GOAL_Y1 - GOAL_Y0);
      ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, GOAL_Y0); ctx.lineTo(14, GOAL_Y0); ctx.lineTo(14, GOAL_Y1); ctx.lineTo(0, GOAL_Y1); ctx.stroke();
      /* المرمى الأيمن */
      if (goalFlash > 0 && goalFlashSide === 1)
        ctx.fillStyle = 'rgba(255,215,0,.5)';
      else ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(FW - 14, GOAL_Y0, 14, GOAL_Y1 - GOAL_Y0);
      ctx.beginPath(); ctx.moveTo(FW, GOAL_Y0); ctx.lineTo(FW - 14, GOAL_Y0); ctx.lineTo(FW - 14, GOAL_Y1); ctx.lineTo(FW, GOAL_Y1); ctx.stroke();
    };

    /* ===== رسم الروبوت ===== */
    const drawRobot = () => {
      ctx.save();
      ctx.translate(robot.x, robot.y);
      ctx.rotate(robot.th);
      /* ظل */
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(-24, 16, 50, 7);
      /* هيكل */
      ctx.fillStyle = '#1565c0'; ctx.fillRect(-25, -18, 50, 36);
      /* مقدمة ملونة */
      ctx.fillStyle = '#42a5f5'; ctx.fillRect(15, -13, 10, 26);
      /* عجلات */
      ctx.fillStyle = '#111';
      [[-26, -22], [-26, 14], [14, -22], [14, 14]].forEach(([wx, wy]) => ctx.fillRect(wx, wy, 12, 8));
      /* سهم الاتجاه */
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(14, -5); ctx.lineTo(14, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      /* ذراع السيرفو — دائماً مرئي */
      ctx.save();
      ctx.translate(robot.x, robot.y);
      ctx.rotate(robot.th);
      /* ذراع السيرفو يتحرك من 0 (راحة) إلى -90° (تسديد) */
      ctx.rotate(-kickAngle * Math.PI / 1.5);
      /* جسم السيرفو */
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(14, -5, 8, 10);
      /* الذراع */
      ctx.fillStyle = '#ff6f00';
      ctx.fillRect(22, -4, 30, 8);
      /* الكرة المصغّرة على طرف الذراع */
      ctx.beginPath(); ctx.arc(54, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = kickActive ? '#ffd740' : '#ffa726'; ctx.fill();
      ctx.strokeStyle = '#e65100'; ctx.lineWidth = 1.5; ctx.stroke();
      /* تسمية السيرفو */
      ctx.rotate(kickAngle * Math.PI / 1.5);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = 'bold 9px Cairo,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('سيرفو', 30, -12);
      ctx.restore();
    };

    /* ===== رسم الكرة ===== */
    const drawBall = () => {
      ctx.save();
      /* ظل */
      ctx.fillStyle = 'rgba(0,0,0,.13)';
      ctx.beginPath(); ctx.ellipse(ball.x + 2, ball.y + 4, BALL_R, BALL_R * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      /* الكرة */
      const g = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, BALL_R);
      g.addColorStop(0, '#fff'); g.addColorStop(1, '#bbb');
      ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    };

    /* ===== حلقة الرسوم المتحركة ===== */
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)); last = ts;

      /* تحديد السرعات */
      if (dribbleOn)      { lSpd = 200; rSpd = 100; mode = 'dribble'; }
      else if (held.ffwd) { lSpd = 200; rSpd = 200; mode = 'forward'; }
      else if (held.fback){ lSpd = -200; rSpd = -200; mode = 'back'; }
      else if (held.fleft){ lSpd = -160; rSpd = 160; mode = 'left'; }
      else if (held.fright){ lSpd = 160; rSpd = -160; mode = 'right'; }
      else { lSpd = 0; rSpd = 0; mode = kickActive ? 'kick' : 'idle'; }

      /* فيزياء الروبوت */
      if (lSpd !== 0 || rSpd !== 0) {
        const v = (lSpd + rSpd) / 2 * SPD_SCALE;
        const omega = (lSpd - rSpd) / WB * SPD_SCALE;
        robot.th += omega * dt;
        robot.x = clamp(robot.x + Math.cos(robot.th) * v * dt, 28, FW - 28);
        robot.y = clamp(robot.y + Math.sin(robot.th) * v * dt, 24, FH - 24);
      }

      /* فيزياء الكرة */
      ball.cd = Math.max(0, ball.cd - dt);
      if (!ball.free) {
        ball.x = robot.x + Math.cos(robot.th) * 35;
        ball.y = robot.y + Math.sin(robot.th) * 35;
      } else {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.vx *= Math.pow(0.996, dt / 16);
        ball.vy *= Math.pow(0.996, dt / 16);
        const inGoalY = ball.y > GOAL_Y0 + 4 && ball.y < GOAL_Y1 - 4;
        if (ball.x < 12 + BALL_R && !inGoalY) { ball.x = 12 + BALL_R; ball.vx = Math.abs(ball.vx) * 0.65; }
        if (ball.x > FW - 12 - BALL_R && !inGoalY) { ball.x = FW - 12 - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.65; }
        if (ball.y < 12 + BALL_R) { ball.y = 12 + BALL_R; ball.vy = Math.abs(ball.vy) * 0.65; }
        if (ball.y > FH - 12 - BALL_R) { ball.y = FH - 12 - BALL_R; ball.vy = -Math.abs(ball.vy) * 0.65; }
        /* هدف */
        if (ball.x < 5 && inGoalY) {
          score[1]++; goalFlash = 700; goalFlashSide = 0;
          const el = sl.querySelector('#fsc1'); if (el) { el.textContent = AR(score[1]); el.classList.remove('gol'); void el.offsetWidth; el.classList.add('gol'); }
          setTimeout(resetPos, 900);
        } else if (ball.x > FW - 5 && inGoalY) {
          score[0]++; goalFlash = 700; goalFlashSide = 1;
          const el = sl.querySelector('#fsc0'); if (el) { el.textContent = AR(score[0]); el.classList.remove('gol'); void el.offsetWidth; el.classList.add('gol'); }
          setTimeout(resetPos, 900);
        }
        /* إعادة ربط الكرة */
        if (ball.cd <= 0) {
          const fx = robot.x + Math.cos(robot.th) * 30, fy = robot.y + Math.sin(robot.th) * 30;
          if (Math.hypot(ball.x - fx, ball.y - fy) < 22) ball.free = false;
        }
      }
      goalFlash = Math.max(0, goalFlash - dt);

      /* حركة ذراع السيرفو */
      if (kickActive) {
        kickAngle += kickDir * dt * 0.0042;
        if (kickAngle >= 1)  kickDir = -1;
        if (kickAngle <= 0 && kickDir === -1) { kickActive = false; kickAngle = 0; }
      }

      /* تحديث أشرطة العجلات */
      updateWheels(lSpd, rSpd);

      /* تحديث الكود المضاء */
      const ln = mode === 'kick' ? [2, 3, 4] : mode === 'dribble' ? [6, 7] : mode !== 'idle' ? [9, 10, 11] : [];
      runLines(sl, '.fleft', ln);

      /* الحالة النصية */
      const stMap = { forward: 'للأمام ⬆', back: 'للخلف ⬇', left: 'دوران يسار ↰', right: 'دوران يمين ↱', dribble: '🔄 يناور بالكرة', kick: '⚽ تسديد!', idle: 'جاهز للعب' };
      setStatus(stMap[mode] || 'جاهز');

      /* رسم الإطار */
      drawField();
      drawRobot();
      drawBall();

      raf = requestAnimationFrame(loop);
    };

    resetPos();
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
