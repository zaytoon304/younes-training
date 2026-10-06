/* =====================================================================
   عبقرينو — ويدجات تفاعلية
   gridLab | handDemo | levelProgress | difficultyComp
   timerDemo | firebaseDiagram | pinchAnim
   ===================================================================== */

/* helpers */
function abRand(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function abShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* =====================================================================
   Puzzle generator — شبكة 3×3 بمجاميع صفوف وأعمدة
   يعيد { grid[3][3], rowSums[3], colSums[3], solution[3][3] }
   hints = عدد الأرقام المعطاة مسبقاً (4/2/1)
   ===================================================================== */
function abGenPuzzle(hints) {
  // نرتب 1..9 عشوائياً ونضعها في 3×3
  const nums = abShuffle([1,2,3,4,5,6,7,8,9]);
  const sol = [
    [nums[0], nums[1], nums[2]],
    [nums[3], nums[4], nums[5]],
    [nums[6], nums[7], nums[8]],
  ];
  const rowSums = sol.map(r => r[0]+r[1]+r[2]);
  const colSums = [0,1,2].map(c => sol[0][c]+sol[1][c]+sol[2][c]);

  // نختار خلايا تُظهر للاعب (hints)
  const positions = abShuffle([[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]);
  const shown = new Set(positions.slice(0, hints).map(p => p[0]*3+p[1]));

  const grid = sol.map((r, ri) => r.map((v, ci) => shown.has(ri*3+ci) ? v : 0));
  return { grid, rowSums, colSums, solution: sol };
}

/* =====================================================================
   DECK_TYPES — قوالب HTML للشرائح
   ===================================================================== */
Object.assign(window.DECK_TYPES || (window.DECK_TYPES = {}), {

  /* --- gridLab: شبكة تفاعلية كاملة --- */
  gridLab(sl) {
    return `
<div class="slide light ab-gridlab-slide">
  <div class="ab-gl-header">
    <div class="ab-gl-title">
      <div class="kicker" style="font-size:20px">${sl.kicker||'🎮 مختبر عبقرينو'}</div>
      <h2 style="margin:0;font-size:48px">${sl.title||'جرّب بنفسك!'}</h2>
    </div>
    <div class="ab-diff-btns" style="gap:12px">
      <button class="ab-diff-btn active" data-d="4">🟢 سهل</button>
      <button class="ab-diff-btn" data-d="2">🟡 متوسط</button>
      <button class="ab-diff-btn" data-d="1">🔴 صعب</button>
    </div>
  </div>
  <div class="ab-gl-main">
    <div class="ab-grid-msg" id="ab_msg">اختر رقمًا ثم انقر على خلية فارغة</div>
    <div class="ab-grid-board" id="ab_board"></div>
    <div class="ab-picker" id="ab_picker"></div>
    <div class="ab-grid-btns">
      <button id="ab_new">🔄 لغز جديد</button>
      <button id="ab_check">✅ تحقق</button>
      <button id="ab_solve">💡 الحل</button>
    </div>
  </div>
</div>`;
  },

  /* --- difficultyComp: مقارنة مستويات الصعوبة --- */
  difficultyComp(sl) {
    return `
<div class="slide light">
  <div class="kicker">${sl.kicker||'⚙️ مستويات الصعوبة'}</div>
  <h2>${sl.title||'ثلاثة مستويات لكل لاعب'}</h2>
  <div class="ab-diffcomp">
    <div class="ab-diff-card easy">
      <div class="title">سهل 🟢</div>
      <span class="tag">للمبتدئين</span>
      <ul>
        <li>٤ أرقام مكشوفة</li>
        <li>٥ خانات فارغة</li>
        <li>وقت أكثر</li>
        <li>مناسب للصف الأول</li>
      </ul>
    </div>
    <div class="ab-diff-card medium">
      <div class="title">متوسط 🟡</div>
      <span class="tag">للمتوسط</span>
      <ul>
        <li>رقمان مكشوفان فقط</li>
        <li>٧ خانات فارغة</li>
        <li>وقت أقل</li>
        <li>مناسب للصف الثاني والثالث</li>
      </ul>
    </div>
    <div class="ab-diff-card hard">
      <div class="title">صعب 🔴</div>
      <span class="tag">للمتقدمين</span>
      <ul>
        <li>رقم واحد فقط</li>
        <li>٨ خانات فارغة</li>
        <li>وقت ضيّق</li>
        <li>للمتحدّين والموهوبين</li>
      </ul>
    </div>
  </div>
</div>`;
  },

  /* --- levelProgress: مستويات اللعبة الخمسة --- */
  levelProgress(sl) {
    const levels = [
      { n:'١', name:'المبتدئ', desc:'أرقام إضافية · وقت ٩٠ ثانية' },
      { n:'٢', name:'المتعلم',  desc:'وقت ٦٠ ثانية · تحدّي أكبر' },
      { n:'٣', name:'المحترف', desc:'وقت ٤٥ ثانية · صعوبة حقيقية' },
      { n:'٤', name:'الخبير',  desc:'وقت ٣٠ ثانية · للنخبة' },
      { n:'٥', name:'الأسطورة', desc:'وقت ٢٠ ثانية · تحدٍّ أسطوري' },
    ];
    return `
<div class="slide light">
  <div class="kicker">${sl.kicker||'🏆 المراحل'}</div>
  <h2>${sl.title||'خمس مراحل تصاعدية'}</h2>
  <div class="ab-levels">
    <div class="ab-level-track" id="ab_lvtrack">
      ${levels.map((l,i)=>`
      <div class="ab-level-node">
        <div class="ab-level-circle ${i===0?'active':''}" id="ablv_${i}">${l.n}</div>
        <div class="ab-level-lbl">${l.name}</div>
        <div class="ab-level-sub">${l.desc}</div>
      </div>`).join('')}
    </div>
    <div class="ab-level-detail">
      ${levels.map((l,i)=>`
      <div class="ab-level-card" id="ablvc_${i}" style="cursor:pointer">
        <div class="num">${l.n}</div>
        <div class="name">${l.name}</div>
        <div class="desc">${l.desc}</div>
      </div>`).join('')}
    </div>
  </div>
</div>`;
  },

  /* --- timerDemo: المؤقت الدائري --- */
  timerDemo(sl) {
    return `
<div class="slide light">
  <div class="kicker">${sl.kicker||'⏱️ المؤقت'}</div>
  <h2>${sl.title||'المؤقت الدائري'}</h2>
  <div style="display:flex;gap:32px;align-items:center;flex:1;flex-wrap:wrap;direction:rtl">
    <div class="ab-timer-wrap">
      <canvas id="ab_timer" width="220" height="220" style="border-radius:50%;box-shadow:0 4px 18px rgba(0,0,0,.2)"></canvas>
    </div>
    <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:14px;font-family:Cairo,sans-serif">
      <p style="font-size:22px;font-weight:700;color:#1b2340;margin:0;line-height:1.6">${sl.body||'المؤقت يبدأ أخضر ويتحول برتقالياً ثم أحمر كلما اقترب الوقت من النهاية.'}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <span style="background:#e8f5e9;color:#2e7d32;padding:8px 18px;border-radius:20px;font-weight:800;font-size:16px">🟢 وقت كافٍ</span>
        <span style="background:#fff8e1;color:#f57f17;padding:8px 18px;border-radius:20px;font-weight:800;font-size:16px">🟡 تنبّه!</span>
        <span style="background:#ffebee;color:#c62828;padding:8px 18px;border-radius:20px;font-weight:800;font-size:16px">🔴 ينتهي!</span>
      </div>
    </div>
  </div>
</div>`;
  },

  /* --- firebaseDiagram: مخطط تدفق Firebase --- */
  firebaseDiagram(sl) {
    return `
<div class="slide light">
  <div class="kicker">${sl.kicker||'☁️ Firebase'}</div>
  <h2>${sl.title||'لوحة الصدارة العالمية'}</h2>
  <div class="ab-fb-diagram">
    <canvas id="ab_fb" width="920" height="460" style="width:100%;max-width:920px;height:auto"></canvas>
  </div>
</div>`;
  },

  /* --- pinchAnim: القرصة المتحركة --- */
  pinchAnim(sl) {
    return `
<div class="slide light">
  <div class="kicker">${sl.kicker||'🤏 القرصة'}</div>
  <h2>${sl.title||'كيف تمسك الرقم بيدك؟'}</h2>
  <div class="ab-pinch-anim">
    <canvas id="ab_pinch" width="460" height="460" style="width:460px;height:460px"></canvas>
    <div class="ab-pinch-steps">
      <div class="ab-pinch-step active" id="abps_0"><span class="snum">١</span><span class="stxt">افتح يدك أمام الكاميرا</span></div>
      <div class="ab-pinch-step" id="abps_1"><span class="snum">٢</span><span class="stxt">اقرّب الإبهام والسبابة — نسبة القرصة &lt; 0.3</span></div>
      <div class="ab-pinch-step" id="abps_2"><span class="snum">٣</span><span class="stxt">حافظ على القرصة ٣ إطارات = إمساك ✅</span></div>
      <div class="ab-pinch-step" id="abps_3"><span class="snum">٤</span><span class="stxt">حرّك يدك لتضع الرقم في خانته</span></div>
      <div class="ab-pinch-step" id="abps_4"><span class="snum">٥</span><span class="stxt">افتح أصابعك (نسبة &gt; 0.45) = إفلات</span></div>
    </div>
  </div>
</div>`;
  },

});

/* =====================================================================
   DECK_BIND — سلوك الشرائح التفاعلية
   ===================================================================== */
Object.assign(window.DECK_BIND || (window.DECK_BIND = {}), {

  /* -------- gridLab -------- */
  gridLab(sl) {
    let puzzle = null;
    let selectedNum = null;
    let hints = 4;
    let userGrid = null;

    function buildPuzzle() {
      puzzle = abGenPuzzle(hints);
      selectedNum = null;
      userGrid = puzzle.grid.map(r => [...r]);
      render();
    }

    function render() {
      const board = sl.querySelector('#ab_board');
      const picker = sl.querySelector('#ab_picker');
      const msg = sl.querySelector('#ab_msg');
      if (!board) return;

      // 5×5 grid: row[0..2] + col sums, corner
      // layout: col0..2 = data cols, col3 = row sum labels
      // we'll use a 4×4 display: 3 data + 1 sum per axis
      board.innerHTML = '';
      board.style.gridTemplateColumns = 'repeat(4,1fr)';
      board.style.gridTemplateRows = 'repeat(4,1fr)';

      for (let ri = 0; ri < 4; ri++) {
        for (let ci = 0; ci < 4; ci++) {
          const cell = document.createElement('div');
          cell.className = 'ab-cell';
          if (ri < 3 && ci < 3) {
            const v = userGrid[ri][ci];
            const given = puzzle.grid[ri][ci] !== 0;
            if (given) {
              cell.className = 'ab-cell given';
              cell.textContent = v;
            } else {
              cell.className = 'ab-cell ' + (v ? 'user-ok' : 'empty');
              cell.textContent = v || '';
              cell.dataset.ri = ri;
              cell.dataset.ci = ci;
              cell.onclick = () => {
                if (!selectedNum) { msg.textContent = 'اختر رقمًا من الأسفل أولاً!'; return; }
                userGrid[ri][ci] = selectedNum;
                render();
              };
            }
          } else if (ri === 3 && ci < 3) {
            cell.className = 'ab-cell sum-cell';
            cell.textContent = puzzle.colSums[ci];
          } else if (ci === 3 && ri < 3) {
            cell.className = 'ab-cell sum-cell';
            cell.textContent = puzzle.rowSums[ri];
          } else {
            cell.className = 'ab-cell corner-cell';
            cell.textContent = '∑';
            cell.style.fontSize = '28px';
            cell.style.color = '#999';
            cell.style.fontWeight = '900';
          }
          board.appendChild(cell);
        }
      }

      // picker
      picker.innerHTML = '';
      const used = new Set();
      for (let r=0;r<3;r++) for(let c=0;c<3;c++) {
        if (userGrid[r][c]) used.add(userGrid[r][c]);
      }
      for (let n=1;n<=9;n++) {
        const btn = document.createElement('button');
        btn.className = 'ab-pick-btn' + (used.has(n)?' used':'') + (selectedNum===n?' selected':'');
        btn.textContent = n;
        btn.onclick = () => {
          if (used.has(n)) return;
          selectedNum = (selectedNum === n) ? null : n;
          render();
        };
        picker.appendChild(btn);
      }

      if (msg.textContent === '') msg.textContent = 'اختر رقمًا من الأسفل ثم انقر على خلية فارغة.';
    }

    function check() {
      const msg = sl.querySelector('#ab_msg');
      // check all filled
      let allFilled = true;
      for (let r=0;r<3;r++) for(let c=0;c<3;c++) { if (!userGrid[r][c]) { allFilled=false; break; } }
      if (!allFilled) { msg.textContent = '⚠️ أكمل تعبئة جميع الخانات أولاً.'; msg.className='ab-grid-msg'; return; }

      // check solution
      let correct = true;
      for (let r=0;r<3;r++) for(let c=0;c<3;c++) {
        if (userGrid[r][c] !== puzzle.solution[r][c]) { correct=false; break; }
      }
      if (correct) {
        msg.textContent = '🎉 أحسنت! الإجابة صحيحة!';
        msg.className = 'ab-grid-msg win';
      } else {
        // mark errors
        const board = sl.querySelector('#ab_board');
        const cells = [...board.querySelectorAll('[data-ri]')];
        cells.forEach(cell => {
          const ri = +cell.dataset.ri, ci = +cell.dataset.ci;
          if (userGrid[ri][ci] && userGrid[ri][ci] !== puzzle.solution[ri][ci]) {
            cell.className = 'ab-cell user-err';
          }
        });
        msg.textContent = '❌ هناك أخطاء — الخلايا الحمراء غير صحيحة.';
        msg.className = 'ab-grid-msg err';
      }
    }

    sl.addEventListener('click', e => {
      const d = e.target.dataset.d;
      if (d) {
        hints = +d;
        sl.querySelectorAll('.ab-diff-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        buildPuzzle();
      }
    });
    sl.querySelector('#ab_new')?.addEventListener('click', buildPuzzle);
    sl.querySelector('#ab_check')?.addEventListener('click', check);
    sl.querySelector('#ab_solve')?.addEventListener('click', () => {
      if (!puzzle) return;
      userGrid = puzzle.solution.map(r=>[...r]);
      const msg = sl.querySelector('#ab_msg');
      msg.textContent = '💡 هذا هو الحل — لاحظ كيف تتوافق المجاميع!';
      msg.className = 'ab-grid-msg win';
      render();
    });

    buildPuzzle();
  },

  /* -------- difficultyComp -------- */
  difficultyComp(sl) {
    // no-op — purely static
  },

  /* -------- levelProgress -------- */
  levelProgress(sl) {
    let active = 0;
    function setLevel(i) {
      active = i;
      for (let j=0;j<5;j++) {
        const c = sl.querySelector(`#ablv_${j}`);
        const card = sl.querySelector(`#ablvc_${j}`);
        if (!c) continue;
        c.className = 'ab-level-circle ' + (j<i?'done':j===i?'active':'');
        if (card) card.style.borderColor = j===i ? 'var(--gold,#c9a227)' : '';
      }
    }
    for (let j=0;j<5;j++) {
      sl.querySelector(`#ablvc_${j}`)?.addEventListener('click', () => setLevel(j));
    }
    setLevel(0);
    // auto-advance demo
    let t = setInterval(() => {
      if (active < 4) setLevel(active+1); else setLevel(0);
    }, 1800);
    return () => clearInterval(t);
  },

  /* -------- timerDemo -------- */
  timerDemo(sl) {
    const cv = sl.querySelector('#ab_timer');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let start = null;
    const TOTAL = 3000;
    let raf;

    function draw(ts) {
      if (!start) start = ts;
      let elapsed = (ts - start) % TOTAL;
      let frac = 1 - elapsed / TOTAL;

      ctx.clearRect(0, 0, cv.width, cv.height);
      // bg circle
      ctx.beginPath();
      ctx.arc(110, 110, 96, 0, Math.PI*2);
      ctx.fillStyle = '#1b2340';
      ctx.fill();
      // colored arc
      const clr = frac > 0.5 ? '#43a047' : frac > 0.25 ? '#f9a825' : '#e53935';
      ctx.beginPath();
      ctx.strokeStyle = clr;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      const start_a = -Math.PI/2;
      ctx.arc(110, 110, 80, start_a, start_a + Math.PI*2*frac);
      ctx.stroke();
      // time text
      const secs = Math.ceil(elapsed / 1000);
      const rem = 3 - secs + 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 54px Cairo,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.max(0, 3 - Math.floor(elapsed/1000)), 110, 110);

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  },

  /* -------- firebaseDiagram -------- */
  firebaseDiagram(sl) {
    const cv = sl.querySelector('#ab_fb');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let raf, t = 0;

    const nodes = [
      { x:110, y:230, w:170, h:72, lbl:'اللاعب', icon:'👤', clr:'#1b2340' },
      { x:375, y:230, w:170, h:72, lbl:'المتصفح', icon:'🌐', clr:'#1a3a8f' },
      { x:640, y:230, w:170, h:72, lbl:'Firebase', icon:'🔥', clr:'#b84a00' },
      { x:375, y:70,  w:170, h:72, lbl:'localStorage', icon:'💾', clr:'#2e7d32' },
    ];

    function drawNode(n) {
      ctx.fillStyle = n.clr;
      ctx.beginPath(); ctx.roundRect(n.x, n.y, n.w, n.h, 12); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Cairo,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.icon + ' ' + n.lbl, n.x + n.w/2, n.y + n.h/2 + 7);
    }

    function arrow(x1,y1,x2,y2, clr, lbl, offset) {
      ctx.beginPath();
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      ctx.strokeStyle = clr; ctx.lineWidth = 3;
      ctx.setLineDash([7,5]); ctx.stroke(); ctx.setLineDash([]);
      // arrowhead
      const ang = Math.atan2(y2-y1, x2-x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 15*Math.cos(ang-0.4), y2 - 15*Math.sin(ang-0.4));
      ctx.lineTo(x2 - 15*Math.cos(ang+0.4), y2 - 15*Math.sin(ang+0.4));
      ctx.closePath(); ctx.fillStyle = clr; ctx.fill();
      // label
      ctx.fillStyle = clr; ctx.font = '16px Cairo,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lbl, (x1+x2)/2, (y1+y2)/2 - 10 + (offset||0));
    }

    // animated packet position
    function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#f4f6fb';
      ctx.fillRect(0, 0, cv.width, cv.height);

      nodes.forEach(drawNode);

      // arrows
      arrow(280,266, 375,266, '#f9a825','يحفظ النتيجة');
      arrow(545,266, 640,266, '#43a047','يرفع للسحابة',0);
      arrow(460,230, 460,142, '#1a7fd4','نسخة احتياطية',0);
      arrow(640,310, 545,322, '#e53935','يسترجع الصدارة', 20);

      // animated packet
      const phase = (t % 180) / 180;
      let px, py, clr2;
      if (phase < 0.33) {
        px = 280 + (375-280)*(phase/0.33);
        py = 266;
        clr2 = '#f9a825';
      } else if (phase < 0.66) {
        px = 545 + (640-545)*((phase-0.33)/0.33);
        py = 266;
        clr2 = '#43a047';
      } else {
        px = 640 - (640-545)*((phase-0.66)/0.34);
        py = 318;
        clr2 = '#e53935';
      }
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI*2);
      ctx.fillStyle = clr2;
      ctx.fill();

      t++;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  },

  /* -------- pinchAnim -------- */
  pinchAnim(sl) {
    const cv = sl.querySelector('#ab_pinch');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let raf, t = 0;

    // 5 phases, each 80 frames
    const PHASE_LEN = 80;
    const PHASES = 5;

    function lerp(a, b, f) { return a + (b-a)*f; }

    function drawHand(pinchRatio, openRatio) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, cv.width, cv.height);

      const cx = 230, cy = 250;
      // palm
      ctx.beginPath();
      ctx.ellipse(cx, cy+25, 70, 82, 0, 0, Math.PI*2);
      ctx.fillStyle = '#f0c080';
      ctx.fill();

      // thumb (finger 0)
      const tx = cx - 78 + pinchRatio*52;
      const ty = cy - 38 + pinchRatio*38;
      ctx.beginPath();
      ctx.moveTo(cx-52, cy+12);
      ctx.quadraticCurveTo(cx-90, cy-25, tx, ty);
      ctx.strokeStyle = '#f0c080'; ctx.lineWidth = 30; ctx.lineCap = 'round';
      ctx.stroke();

      // index finger (points toward thumb)
      const ix = cx - 38 + pinchRatio*38;
      const iy = cy - 100 + pinchRatio*75;
      ctx.beginPath();
      ctx.moveTo(cx-26, cy-25);
      ctx.quadraticCurveTo(cx-38, cy-76, ix, iy);
      ctx.strokeStyle = '#f0c080'; ctx.lineWidth = 23; ctx.lineCap = 'round';
      ctx.stroke();

      // middle finger
      ctx.beginPath();
      ctx.moveTo(cx+6, cy-35);
      ctx.lineTo(cx+6, cy - 108*openRatio);
      ctx.strokeStyle = '#f0c080'; ctx.lineWidth = 22; ctx.stroke();

      // ring
      ctx.beginPath();
      ctx.moveTo(cx+35, cy-28);
      ctx.lineTo(cx+38, cy - 100*openRatio);
      ctx.strokeStyle = '#f0c080'; ctx.lineWidth = 20; ctx.stroke();

      // pinky
      ctx.beginPath();
      ctx.moveTo(cx+60, cy-13);
      ctx.lineTo(cx+65, cy - 82*openRatio);
      ctx.strokeStyle = '#f0c080'; ctx.lineWidth = 18; ctx.stroke();

      // pinch ratio indicator
      const clr = pinchRatio < 0.3 ? '#43a047' : '#f9a825';
      ctx.fillStyle = clr;
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('نسبة: ' + pinchRatio.toFixed(2), cx, 428);

      // dot at fingertips
      [[tx,ty,'#ff4444'],[ix,iy,'#4499ff']].forEach(([x,y,c]) => {
        ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2);
        ctx.fillStyle=c; ctx.fill();
      });
      // line between fingertips
      ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(ix,iy);
      ctx.strokeStyle='rgba(255,255,0,.6)'; ctx.lineWidth=3; ctx.setLineDash([5,5]);
      ctx.stroke(); ctx.setLineDash([]);
    }

    function frame() {
      const phase = Math.floor(t / PHASE_LEN) % PHASES;
      const frac = (t % PHASE_LEN) / PHASE_LEN;

      // highlight active step
      sl.querySelectorAll('.ab-pinch-step').forEach((s,i) => {
        s.classList.toggle('active', i===phase);
      });

      let pinch, open;
      if (phase===0)       { pinch=0.8; open=1; }
      else if (phase===1)  { pinch=lerp(0.8,0.2,frac); open=lerp(1,0.7,frac); }
      else if (phase===2)  { pinch=0.2; open=0.7; }
      else if (phase===3)  { pinch=0.2; open=0.7; }
      else                 { pinch=lerp(0.2,0.8,frac); open=lerp(0.7,1,frac); }

      drawHand(pinch, open);
      t++;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  },

});
