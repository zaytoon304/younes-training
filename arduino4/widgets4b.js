/* =====================================================================
   «المزرعة الذكية والمنزل الذكي» — أدوات المزرعة (المرحلتان ٢ و٣)
   الأنواع: soillab (أصيص حي والتخلّف) · greenlab (بيت محمي على مدار اليوم) · tanklab (خزان ومطر) · farmday (يوم كامل مسرّع)
   دوائر البناء: soilwire · greenwire
   النماذج تقريبية لكنها تحترم الاتجاهات الحقيقية: الشمس والحرارة تزيدان التبخر، والتخلّف يمنع ارتجاف المضخة.
   ===================================================================== */
(function () {
const { AR, highlight, codeBlock } = window.ARD;
const { B2, col, pinX, botX, base, wire } = window.ARD2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const f0 = v => AR(Math.round(v)), f1 = v => AR((Math.round(v * 10) / 10).toFixed(1)).replace('.', '٫');
const hhmm = h => AR(String(Math.floor(h) % 24).padStart(2, '0')) + ':' + AR(String(Math.floor((h % 1) * 60)).padStart(2, '0'));
const outT = h => 22 + 12 * Math.sin((h - 9) / 24 * 2 * Math.PI);    // حرارة الخارج: أعلاها نحو ٣٤ عصرًا وأدناها نحو ١٠ فجرًا
const sunAt = h => clamp(Math.sin((h - 6) / 12 * Math.PI), 0, 1);
/* رسم بياني بعدة خطوط */
const chartSVG = (id, lines, lo, hi, marks = []) => `<svg viewBox="0 0 600 170" class="chart4" id="${id}" preserveAspectRatio="none">
  ${[0, 0.5, 1].map(f => `<line x1="0" x2="600" y1="${10 + f * 150}" y2="${10 + f * 150}" class="cg"/>`).join('')}
  ${marks.map((m, i) => `<line x1="0" x2="600" class="cm" data-m="${i}" y1="0" y2="0"/>`).join('')}
  ${lines.map((c, i) => `<polyline class="cl" data-l="${i}" style="stroke:${c}" points=""/>`).join('')}</svg>`;
function chartFeed(svg, bufs, lo, hi, n = 120) {
  bufs.forEach((b, i) => { while (b.length > n) b.shift(); svg.querySelector(`[data-l="${i}"]`).setAttribute('points', b.map((v, k) => `${k / (n - 1) * 600},${160 - (clamp(v, lo, hi) - lo) / (hi - lo) * 150}`).join(' ')); });
}
const chartMark = (svg, i, v, lo, hi) => { const m = svg.querySelector(`[data-m="${i}"]`); if (!m) return; const y = 160 - (v - lo) / (hi - lo) * 150; m.setAttribute('y1', y); m.setAttribute('y2', y); };

/* ================== الأصيص الحي ================== */
const potSVG = () => `<svg viewBox="0 0 460 460" class="potsvg">
  <circle cx="390" cy="60" r="36" class="psun" id="psun"/>
  <g id="pplant" transform="translate(230 250)"><path d="M0 0 L0 -120" class="stem"/>
    ${[[-1, -40], [1, -60], [-1, -85], [1, -105]].map(([s, y], i) => `<g transform="translate(0 ${y})"><path class="leaf" data-i="${i}" d="M0 0 C ${s * 30} -20, ${s * 70} -10, ${s * 80} 10 C ${s * 50} 14, ${s * 20} 8, 0 0 Z"/></g>`).join('')}
    <circle cx="0" cy="-124" r="14" class="flower" id="pflower"/></g>
  <path d="M110 250 L350 250 L325 430 L135 430 Z" class="potb"/><rect x="100" y="236" width="260" height="26" rx="6" class="potr"/>
  <path d="M116 262 L344 262 L322 422 L138 422 Z" id="psoil" class="soil"/>
  <g transform="translate(300 230)"><rect x="-10" y="0" width="20" height="150" rx="4" class="sens"/><rect x="-16" y="-34" width="32" height="40" rx="5" class="senh"/><text x="0" y="-42" class="psm">A0</text></g>
  <g id="pdrops" opacity="0">${Array.from({ length: 8 }, (_, i) => `<line x1="${150 + i * 18}" y1="180" x2="${146 + i * 18}" y2="200" class="wdrop" style="animation-delay:${i * .07}s"/>`).join('')}
    <path d="M120 150 L260 150 L260 175" class="hose"/></g>
</svg>`;
const SOIL_CODE = {
  hys: `int soil = map(analogRead(A0), 600, 270, 0, 100);
if (soil < low)  digitalWrite(pump, HIGH);
if (soil > high) digitalWrite(pump, LOW);`,
  one: `int soil = map(analogRead(A0), 600, 270, 0, 100);
if (soil < limit) digitalWrite(pump, HIGH);
else digitalWrite(pump, LOW);`,
};

/* ================== البيت المحمي ================== */
const ghSVG = () => `<svg viewBox="0 0 640 400" class="ghsvg">
  <rect width="640" height="400" id="ghsky" fill="#bfe3f7"/><circle id="ghsun" r="30" fill="#ffd23f"/>
  <rect y="320" width="640" height="80" fill="#7cb342"/>
  <path d="M90 320 L90 170 Q 320 30 550 170 L550 320 Z" class="ghshell"/>
  <g id="ghwin" style="transform-origin:420px 110px"><path d="M420 110 L520 160 L515 172 L415 122 Z" class="ghwin"/></g>
  <g transform="translate(130 240)"><circle r="30" class="fanb"/><g id="ghfan">${[0, 120, 240].map(a => `<path d="M0 0 C -6 -12, -3 -26, 6 -26 C 12 -16, 6 -6, 0 0" fill="#5b6275" transform="rotate(${a})"/>`).join('')}</g><text y="52" class="ghl">مروحة</text></g>
  <g id="ghlamp">${[230, 320, 410].map(x => `<rect x="${x - 34}" y="150" width="68" height="10" rx="4" class="lamp"/><path d="M${x - 30} 160 L${x - 44} 230 L${x + 44} 230 L${x + 30} 160 Z" class="lampglow"/>`).join('')}</g>
  ${[200, 260, 320, 380, 440].map((x, i) => `<g transform="translate(${x} 318)" class="ghp"><path d="M0 0 L0 -50" stroke="#2e7d32" stroke-width="5"/><path d="M0 -20 C -20 -30, -30 -20, -34 -8 C -20 -8, -8 -12, 0 -20 M0 -34 C 20 -44, 30 -34, 34 -22 C 20 -22, 8 -26, 0 -34" fill="#43a047"/><circle cy="-54" r="7" class="ghfruit"/></g>`).join('')}
  <g transform="translate(560 250)"><rect x="-26" y="-18" width="52" height="36" rx="6" fill="#fff" stroke="#5b6275" stroke-width="3"/><text y="7" class="ghl">DHT</text></g>
  <text x="20" y="40" class="ghclk" id="ghclk">٠٦:٠٠</text>
</svg>`;
const GH_CODE = `float t = dht.readTemperature();
if (t > 28) digitalWrite(fan, HIGH);
if (t < 26) digitalWrite(fan, LOW);
window.write(constrain(map(t, 24, 32, 0, 90), 0, 90));
digitalWrite(growLight, analogRead(A1) < 300);
delay(2000);`;

/* ================== الخزان والمطر ================== */
const tankSVG = () => `<svg viewBox="0 0 520 460" class="tksvg">
  <rect width="520" height="460" fill="#e8f4fb"/>
  <g id="tkcloud" opacity="0"><ellipse cx="300" cy="50" rx="110" ry="34" fill="#9eacbf"/><ellipse cx="240" cy="62" rx="70" ry="28" fill="#9eacbf"/>
    ${Array.from({ length: 16 }, (_, i) => `<line x1="${200 + i * 13}" y1="82" x2="${194 + i * 13}" y2="104" class="tkdrop" style="animation-delay:${(i % 6) * .08}s"/>`).join('')}</g>
  <rect x="380" y="380" width="110" height="34" rx="6" fill="#5b6275"/><rect id="rains" x="390" y="386" width="90" height="22" rx="3" class="rains"/><text x="435" y="436" class="tkl">حساس المطر A2</text>
  <rect x="120" y="120" width="200" height="300" rx="10" class="tkbody"/>
  <rect id="tkw" x="128" y="300" width="184" height="112" rx="4" class="tkwater"/>
  <line id="tksurf" x1="128" y1="300" x2="312" y2="300" class="tksurf"/>
  <g transform="translate(220 112)"><rect x="-40" y="-16" width="80" height="22" rx="4" fill="#1f5fae"/><circle cx="-18" cy="-5" r="8" fill="#dfe3ea"/><circle cx="18" cy="-5" r="8" fill="#dfe3ea"/></g>
  <path id="tkping" class="tkping" d=""/><text id="tkd" x="236" y="200" class="tkdist"></text>
  ${[0, 25, 50, 75, 100].map(p => `<text x="110" y="${412 - p * 2.92 + 6}" class="tkpct">${AR(p)}٪</text>`).join('')}
  <g transform="translate(30 380)"><rect width="70" height="44" rx="8" fill="#455a64"/><text x="35" y="28" class="tkl w">بئر</text></g>
  <path d="M100 400 C 112 400, 112 140, 126 140" class="tkpipe" id="tkin"/>
  <path d="M320 400 L 370 400" class="tkpipe" id="tkout"/><text x="345" y="388" class="tkl">ري</text>
</svg>`;
const TANK_CODE = `long d = readDistance();
int level = map(d, 100, 5, 0, 100);
if (level < 20) digitalWrite(wellPump, HIGH);
if (level > 90) digitalWrite(wellPump, LOW);
bool raining = analogRead(A2) < 500;
if (raining) digitalWrite(irrigation, LOW);`;

/* ================== مشهد المزرعة الحية (يوم كامل) ================== */
const fdScene = () => `<svg viewBox="0 0 900 420" class="fdscene">
  <rect width="900" height="420" id="fdsky" fill="#bfe3f7"/>
  <g id="fdstars" opacity="0">${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 293) % 900}" cy="${(i * 97) % 170}" r="${1 + i % 2}" fill="#fff"/>`).join('')}</g>
  <circle id="fdsunc" r="34" fill="#ffd23f"/><circle id="fdmoon" r="22" fill="#f4f1ea"/>
  <g id="fdcloud" opacity="0"><ellipse cx="300" cy="70" rx="120" ry="36" fill="#9eacbf"/><ellipse cx="230" cy="84" rx="70" ry="28" fill="#9eacbf"/>
    ${Array.from({ length: 18 }, (_, i) => `<line x1="${190 + i * 14}" y1="104" x2="${184 + i * 14}" y2="128" class="tkdrop" style="animation-delay:${(i % 6) * .08}s"/>`).join('')}</g>
  <path d="M0 250 C 250 225, 600 240, 900 230 L900 420 L0 420 Z" fill="#7cb342" id="fdgrass"/>
  ${Array.from({ length: 4 }, (_, r) => `<path d="M30 ${300 + r * 30} L470 ${296 + r * 30}" stroke="#8d6e48" stroke-width="13" stroke-linecap="round" class="fdrow"/>
    ${Array.from({ length: 8 }, (_, k) => `<g class="fdpl" transform="translate(${60 + k * 54} ${296 + r * 30})"><path d="M0 0 C -9 -12, -13 -18, -4 -24 M0 0 C 9 -12, 13 -20, 4 -26" stroke-width="5" fill="none" stroke="#2e7d32"/><circle cx="0" cy="-28" r="4.5" class="fdfr"/></g>`).join('')}`).join('')}
  <g id="fdspray" opacity="0">${[110, 250, 390].map(x => `<g transform="translate(${x} 282)"><line x1="0" y1="0" x2="0" y2="-20" stroke="#5b6275" stroke-width="5"/>${[-55, -25, 0, 25, 55].map(a => `<path d="M0 -20 q ${a} -36 ${a * 1.7} 10" fill="none" stroke="#4fc3f7" stroke-width="3" stroke-dasharray="4 6" class="spray"/>`).join('')}</g>`).join('')}</g>
  <g transform="translate(520 150)"><rect x="0" y="10" width="56" height="150" rx="8" fill="#b0bec5" stroke="#78909c" stroke-width="4"/><rect id="fdtw" x="6" y="40" width="44" height="114" rx="4" fill="#4fc3f7"/>
    <rect x="-6" y="0" width="68" height="14" rx="5" fill="#78909c"/><text x="28" y="182" class="ghl">الخزان</text>
    <g transform="translate(28 214)"><circle r="20" fill="#cfd8dc" stroke="#78909c" stroke-width="3"/><g id="fdpump">${[0, 90, 180, 270].map(a => `<rect x="-3" y="-16" width="6" height="12" rx="3" fill="#1b2340" transform="rotate(${a})"/>`).join('')}</g></g>
    <path d="M8 214 C -120 214, -260 240, -410 260" id="fdpipe" class="fdpipe"/></g>
  <g transform="translate(640 150)"><path d="M0 120 L0 40 Q 110 -40 220 40 L220 120 Z" fill="rgba(200,235,255,.55)" stroke="#9fc5d8" stroke-width="4"/>
    <g id="fdlight" opacity="0">${[60, 110, 160].map(x => `<rect x="${x - 26}" y="30" width="52" height="8" rx="3" fill="#ce93d8"/><path d="M${x - 22} 38 L${x - 34} 110 L${x + 34} 110 L${x + 22} 38 Z" fill="rgba(206,147,216,.35)"/>`).join('')}</g>
    ${[40, 85, 130, 175].map(x => `<path d="M${x} 118 c -6 -16, -2 -30, 8 -36 c 4 12, 2 26, -8 36" fill="#43a047" class="fdgh"/>`).join('')}
    <g transform="translate(190 64)"><circle r="16" fill="#dfe6f0" stroke="#5b6275" stroke-width="3"/><g id="fdfan">${[0, 120, 240].map(a => `<path d="M0 0 C -4 -7, -2 -14, 4 -14 C 7 -9, 4 -4, 0 0" fill="#5b6275" transform="rotate(${a})"/>`).join('')}</g></g>
    <text x="110" y="146" class="ghl">البيت المحمي</text></g>
</svg>`;

/* ================== دوائر البناء ================== */
B2.soilwire = { flow: 6, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'نظام الري الآلي الكامل لأصيص واحد.' },
  { h: 'حساس التربة السعوي', b: 'ثلاثة أطراف: GND وVCC وAOUT. يُغرس في التربة حتى الخط المرسوم عليه فقط.' },
  { h: 'الطاقة · وAOUT ← A0', b: 'القراءة تقل كلما زادت الرطوبة: نحو ٦٠٠ جاف، ونحو ٢٧٠ في الماء.' },
  { h: 'الريليه على المنفذ 4', b: 'كما في المحور الأول: VCC وGND وIN.' },
  { h: 'المضخة على NO مع بطارية منفصلة', b: 'خرطوم صغير من المضخة المغمورة في خزان إلى الأصيص.' },
  { h: 'اترك التربة تجف!', b: 'حين تنخفض الرطوبة تحت الحد تعمل المضخة، وتتوقف عند الحد الأعلى.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 slw">
  ${base({ 4: '4' }, { 0: '5V', 1: 'GND', 2: 'A0' })}
  <g class="bs" data-s="2"><rect x="${col(1) - 14}" y="90" width="${col(3) - col(1) + 28}" height="180" rx="10" fill="#1b2340"/><path d="M${col(1)} 150 L${col(3)} 150 M${col(1)} 190 L${col(3)} 190" stroke="#f0cc7a" stroke-width="3"/>
    <text x="${col(2)}" y="232" class="lbl" style="font-size:11px;fill:#cfe">v1.2</text>
    ${['GND', 'VCC', 'AOUT'].map((t, i) => `<line x1="${col(1 + i)}" y1="270" x2="${col(1 + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(1 + i)}" y="286" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}</g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}
  ${wire(`M${col(2)} 336 L${col(2)} 404`, 3, '#e74c3c')}${wire(`M${col(1)} 336 L${col(1)} 456`, 3, '#1b2340')}
  ${wire(`M${botX(2)} 425 C ${botX(2)} 480, ${col(3) + 30} 480, ${col(3) + 20} 380 C ${col(3) + 10} 350, ${col(3)} 350, ${col(3)} 336`, 3, '#e0b400')}
  <g class="bs" data-s="4"><rect x="${col(6) - 14}" y="200" width="${col(8) - col(6) + 70}" height="80" rx="8" fill="#1f5fae"/><circle cx="${col(7)}" cy="216" r="6" class="rlled"/>
    ${['VCC', 'GND', 'IN'].map((t, i) => `<line x1="${col(6 + i)}" y1="280" x2="${col(6 + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(6 + i)}" y="274" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}</g>
  ${wire(`M${col(6)} 336 L${col(6)} 404`, 4, '#e74c3c')}${wire(`M${col(7)} 336 L${col(7)} 456`, 4, '#1b2340')}
  ${wire(`M${pinX(4)} 150 C ${pinX(4)} 70, ${col(8) + 20} 70, ${col(8)} 312`, 4, '#2e9e6b')}
  <g class="bs" data-s="5"><g transform="translate(800 120)"><rect x="-50" y="-30" width="100" height="70" rx="10" fill="#4fc3f7" opacity=".5"/><circle r="22" fill="#cfd8dc" stroke="#78909c" stroke-width="3"/><g class="rlpump">${[0, 90, 180, 270].map(a => `<rect x="-3" y="-18" width="6" height="14" rx="3" fill="#1b2340" transform="rotate(${a})"/>`).join('')}</g><text y="62" class="lbl" style="font-size:13px">مضخة في خزان</text></g>
    <rect x="760" y="250" width="80" height="40" rx="6" fill="#1c1f27"/><text x="800" y="276" class="lbl" style="font-size:13px;fill:#f0cc7a">5V</text>
    <path d="M${col(8) + 50} 230 C 760 230, 770 160, 780 140" fill="none" stroke="#e74c3c" stroke-width="5"/><path d="M820 140 C 860 180, 850 250, 830 250" fill="none" stroke="#1b2340" stroke-width="5"/>
    <path d="M800 90 C 800 40, 680 40, 640 70" fill="none" stroke="#4fc3f7" stroke-width="7" class="rlwater"/></g>
</svg>` };

B2.greenwire = { flow: 6, steps: [
  { h: 'اللوحة ولوح التوصيل', b: 'دماغ البيت المحمي.' },
  { h: 'حساس DHT22', b: 'يقيس الحرارة والرطوبة معًا. أطرافه في الوحدة: VCC وDATA وGND.' },
  { h: 'الطاقة · وDATA ← 2', b: 'إشارة رقمية واحدة تحمل الرقمين. يُقرأ مرة كل ثانيتين على الأكثر.' },
  { h: 'المروحة عبر ريليه ← 5', b: 'مروحة ١٢ فولت تطرد الهواء الساخن.' },
  { h: 'سيرفو النافذة ← 6', b: 'يفتح النافذة من ٠ إلى ٩٠ درجة حسب الحرارة.' },
  { h: 'شغّل!', b: 'الحرارة ترتفع… المروحة تعمل… والنافذة تنفتح تدريجيًا.' },
], svg: `<svg viewBox="0 0 900 520" class="bsvg b2 ghw">
  ${base({ 2: '2', 3: '5', 4: '6' }, { 0: '5V', 1: 'GND' })}
  <g class="bs" data-s="2"><rect x="${col(1) - 16}" y="150" width="${col(3) - col(1) + 32}" height="120" rx="8" fill="#f4f1ea" stroke="#9aa1b3" stroke-width="3"/>${Array.from({ length: 5 }, (_, i) => `<line x1="${col(1)}" y1="${170 + i * 18}" x2="${col(3)}" y2="${170 + i * 18}" stroke="#c9c3b3" stroke-width="4"/>`).join('')}
    <text x="${col(2)}" y="140" class="lbl" style="font-size:14px">DHT22</text>
    ${['VCC', 'DATA', 'GND'].map((t, i) => `<line x1="${col(1 + i)}" y1="270" x2="${col(1 + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(1 + i)}" y="290" class="lbl" style="font-size:9px">${t}</text>`).join('')}</g>
  ${wire(`M${botX(0)} 425 C ${botX(0)} 500, 500 500, 500 404`, 3, '#e74c3c')}${wire(`M${botX(1)} 425 C ${botX(1)} 510, 480 510, 480 456`, 3, '#1b2340')}
  ${wire(`M${col(1)} 336 L${col(1)} 404`, 3, '#e74c3c')}${wire(`M${col(3)} 336 L${col(3)} 456`, 3, '#1b2340')}
  ${wire(`M${pinX(2)} 150 C ${pinX(2)} 90, 420 100, 420 250 C 420 350, ${col(2) - 16} 340, ${col(2)} 336`, 3, '#e0b400')}
  <g class="bs" data-s="4"><rect x="${col(6) - 14}" y="210" width="${col(8) - col(6) + 28}" height="70" rx="8" fill="#1f5fae"/>${['VCC', 'GND', 'IN'].map((t, i) => `<line x1="${col(6 + i)}" y1="280" x2="${col(6 + i)}" y2="312" stroke="#9aa1b3" stroke-width="5"/><text x="${col(6 + i)}" y="274" class="lbl" style="font-size:9px;fill:#fff">${t}</text>`).join('')}
    <g transform="translate(${col(7)} 120)"><circle r="40" fill="#dfe6f0" stroke="#5b6275" stroke-width="4"/><g class="ghfan2">${[0, 120, 240].map(a => `<path d="M0 0 C -8 -16, -4 -34, 8 -34 C 16 -20, 8 -8, 0 0" fill="#5b6275" transform="rotate(${a})"/>`).join('')}</g></g></g>
  ${wire(`M${col(6)} 336 L${col(6)} 404`, 4, '#e74c3c')}${wire(`M${col(7)} 336 L${col(7)} 456`, 4, '#1b2340')}
  ${wire(`M${pinX(3)} 150 C ${pinX(3)} 40, ${col(8) + 30} 40, ${col(8)} 312`, 4, '#2e9e6b')}
  <g class="bs" data-s="5"><rect x="${col(11) - 30}" y="150" width="60" height="44" rx="6" fill="#2b6fc0"/><g class="ghservo" style="transform-origin:${col(11)}px 160px"><rect x="${col(11)}" y="154" width="70" height="12" rx="6" fill="#fff"/></g>
    ${[['#6b3e1f', 10], ['#d62828', 11], ['#f08a24', 12]].map(([c, k]) => `<path d="M${col(11) - 12 + (k - 10) * 12} 194 L${col(k)} 240" fill="none" stroke="${c}" stroke-width="5"/>`).join('')}<text x="${col(11)}" y="140" class="lbl" style="font-size:13px">نافذة</text></g>
  ${wire(`M${col(11)} 264 L${col(11)} 404`, 5, '#e74c3c')}${wire(`M${col(10)} 264 L${col(10)} 456`, 5, '#1b2340')}
  ${wire(`M${pinX(4)} 150 C ${pinX(4)} 24, 890 24, 890 260 C 890 330, ${col(12) + 20} 330, ${col(12)} 312`, 5, '#8e44ad')}
</svg>` };

/* ---------- الأنواع ---------- */
Object.assign(window.DECK_TYPES, {
  soillab: s => `<div class="slide light">
      <div class="kicker">🌱 أصيص حي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="sogrid">
        <div class="soleft ix">
          <div class="lseg"><span>الطريقة</span><button class="lsb on" data-m="one">حد واحد</button><button class="lsb" data-m="hys">تخلّف (حدّان)</button></div>
          <label class="lsl"><span>⬇ تشغيل تحت: <b id="solv">40</b>٪</span><input type="range" id="sol" min="15" max="60" value="40"></label>
          <label class="lsl" id="sohw"><span>⬆ إيقاف فوق: <b id="sohv">65</b>٪</span><input type="range" id="soh" min="40" max="90" value="65"></label>
          <label class="lsl"><span>☀️ الشمس والحرارة: <b id="sosv">٢</b></span><input type="range" id="sos" min="1" max="3" value="2"></label>
          <div class="socode" id="socode"></div>
        </div>
        <div class="somid">${potSVG()}</div>
        <div class="soright">
          <div class="sofacts"><div class="ac"><span>analogRead</span><b id="soraw">—</b></div><div class="ac gold"><span>الرطوبة</span><b id="sopct">—</b></div><div class="ac"><span>المضخة</span><b id="sopump">—</b></div></div>
          <div class="plot4">${chartSVG('soch', ['#2e9e6b'], 0, 100, [0, 1])}</div>
          <div class="sofacts"><div class="ac"><span>مرات التشغيل</span><b id="sosw">٠</b></div><div class="ac"><span>صحة النبتة</span><b id="soh2">١٠٠٪</b></div></div>
          <div class="sowarn" id="sowarn"></div>
        </div>
      </div></div>`,

  greenlab: s => `<div class="slide light">
      <div class="kicker">🌡️ البيت المحمي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="ghgrid">
        <div class="ghleft">${ghSVG()}
          <div class="ghctl ix"><button class="clap" id="ghauto">🤖 التحكم الآلي: يعمل</button><label class="lsl"><span>⏩ سرعة اليوم</span><input type="range" id="ghsp" min="1" max="6" value="3"></label></div></div>
        <div class="ghright">
          <div class="sofacts"><div class="ac"><span>داخل</span><b id="ghin">—</b></div><div class="ac"><span>خارج</span><b id="ghout">—</b></div><div class="ac gold"><span>النافذة</span><b id="ghw">—</b></div><div class="ac"><span>المروحة</span><b id="ghf">—</b></div></div>
          <div class="plot4"><div class="plh"><i style="background:#e74c3c"></i>داخل البيت <i style="background:#2b6fc0"></i>خارج البيت <i style="background:#2e9e6b"></i>المنطقة المثالية ١٨–٢٧</div>${chartSVG('ghch', ['#e74c3c', '#2b6fc0'], 5, 50, [0, 1])}</div>
          <div class="ghgrow"><span>🌿 نمو النباتات</span><div class="btbar"><i id="ghg"></i></div></div>
          ${codeBlock(GH_CODE, 'micro')}
        </div>
      </div></div>`,

  tanklab: s => `<div class="slide light">
      <div class="kicker">💧 الخزان الذكي</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="tkgrid">
        <div class="tkleft">${tankSVG()}</div>
        <div class="tkright ix">
          <div class="sofacts"><div class="ac"><span>d (سم)</span><b id="tkdv">—</b></div><div class="ac gold"><span>المستوى</span><b id="tklv">—</b></div><div class="ac"><span>البئر</span><b id="tkwp">—</b></div><div class="ac"><span>الري</span><b id="tkir">—</b></div></div>
          <div class="tkbtns"><button class="clap" id="tkirb">🌱 ري المزرعة</button><button class="sndbtn" id="tkrain">🌧️ أمطري!</button><button class="sndbtn" id="tkleak">🕳️ تسريب</button></div>
          <div class="sowarn" id="tkmsg"></div>
          ${codeBlock(TANK_CODE, 'micro')}
        </div>
      </div></div>`,

  farmday: s => `<div class="slide light">
      <div class="kicker">🚜 مزرعة حية · يوم كامل في ٦٠ ثانية</div>
      <h2 class="title" style="margin-bottom:8px">${s.title}</h2>
      <div class="fdgrid">
        <div class="fdleft">${fdScene()}
          <div class="fdlcd"><div class="lcdglass lit" id="fdlcd">${Array.from({ length: 32 }, () => '<i></i>').join('')}</div></div></div>
        <div class="fdright ix">
          <div class="fdtop"><div class="fdclock"><b id="fdclk">٠٠:٠٠</b><span id="fdsun">🌙</span></div><button class="clap" id="fdgo">▶ ابدأ اليوم</button><button class="sndbtn" id="fdrain">🌧️ مطر</button></div>
          <div class="lseg"><span>الري</span><button class="lsb on" data-r="sched">⏰ فجرًا ومساءً</button><button class="lsb" data-r="any">🕛 أي وقت</button></div>
          <div class="fdch"><div class="plh"><i style="background:#2e9e6b"></i>التربة <i style="background:#e74c3c"></i>حرارة البيت المحمي <i style="background:#2b6fc0"></i>الخزان</div>${chartSVG('fdc1', ['#2e9e6b', '#e74c3c', '#2b6fc0'], 0, 100)}</div>
          <div class="fdlog" id="fdlog"></div>
          <div class="fdsum"><div class="ac"><span>ماء مستهلك</span><b id="fdwater">٠ لتر</b></div><div class="ac"><span>ضاع بالتبخر</span><b id="fdlost">٠ لتر</b></div><div class="ac gold"><span>صحة المحصول</span><b id="fdhealth">١٠٠٪</b></div></div>
        </div>
      </div></div>`,
});

Object.assign(window.DECK_BIND, {
  soillab(sl) {
    const $ = id => sl.querySelector('#' + id), ch = $('soch'), buf = [];
    let mode = 'one', m = 55, pump = false, sw = 0, health = 100, water = 0, last = 0, raf = 0, acc = 0, flick = [];
    const setCode = () => { $('socode').innerHTML = codeBlock(SOIL_CODE[mode], 'micro'); $('sohw').style.opacity = mode === 'hys' ? 1 : .35; };
    const ui = () => { $('solv').textContent = $('sol').value; $('sohv').textContent = $('soh').value; $('sosv').textContent = AR($('sos').value);
      chartMark(ch, 0, +$('sol').value, 0, 100); chartMark(ch, 1, mode === 'hys' ? +$('soh').value : +$('sol').value, 0, 100); };
    sl.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; sl.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); sw = 0; flick = []; setCode(); ui(); });
    ['sol', 'soh', 'sos'].forEach(id => $(id).oninput = ui);
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; acc += dt;
      while (acc > 0.1) { acc -= 0.1;                                       // كل خطوة = دقيقة محاكاة
        const sun = +$('sos').value; m += -0.12 * sun * (0.6 + m / 120) + (pump ? 2.2 : 0); m = clamp(m, 0, 100);
        const raw = Math.round(600 - m / 100 * 330 + (Math.random() - .5) * 14), read = clamp(Math.round((600 - raw) / 330 * 100), 0, 100);
        const lo = +$('sol').value, hi = +$('soh').value, was = pump;
        if (mode === 'one') pump = read < lo; else { if (read < lo) pump = true; if (read > hi) pump = false; }
        if (pump && !was) { sw++; flick.push(ts); }
        if (pump) water += 0.05;
        health = clamp(health + (m < 20 ? -0.6 : m > 88 ? -0.4 : 0.25), 0, 100);
        buf.push(m); chartFeed(ch, [buf], 0, 100);
        $('soraw').textContent = AR(raw); $('sopct').textContent = f0(read) + '٪';
      }
      flick = flick.filter(t => ts - t < 6000);
      $('sopump').textContent = pump ? 'تعمل 💧' : 'متوقفة'; $('sopump').classList.toggle('on', pump);
      $('sosw').textContent = AR(sw); $('soh2').textContent = f0(health) + '٪';
      const w = $('sowarn'); w.className = 'sowarn ' + (flick.length > 4 ? 'bad' : mode === 'hys' ? 'ok' : '');
      w.textContent = flick.length > 4 ? '⚠️ الريليه يرتجف! المضخة تعمل وتتوقف كل لحظة بسبب تذبذب القراءة حول الحد. هذا يتلف المضخة.' : mode === 'hys' ? '✅ التخلّف: المضخة تعمل دفعة طويلة واحدة ثم ترتاح. بين الحدين لا يتغير شيء.' : 'راقب المضخة حين تقترب الرطوبة من الحد…';
      $('psoil').style.fill = `hsl(28, ${45 + m * .1}%, ${58 - m * .38}%)`;
      $('pdrops').setAttribute('opacity', pump ? 1 : 0);
      $('psun').style.opacity = 0.35 + $('sos').value * .22;
      const droop = health < 60 ? (60 - health) * 1.4 : 0;
      sl.querySelectorAll('.leaf').forEach((l, i) => l.setAttribute('transform', `rotate(${(i % 2 ? 1 : -1) * droop})`)); sl.querySelectorAll('.leaf').forEach(l => l.style.fill = health > 50 ? '#43a047' : health > 25 ? '#9e9d24' : '#8d6e48');
      $('pflower').style.fill = health > 70 ? '#ffb300' : '#a1887f';
      raf = requestAnimationFrame(loop);
    };
    setCode(); ui(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  greenlab(sl) {
    const $ = id => sl.querySelector('#' + id), ch = $('ghch'), bi = [], bo = [];
    let h = 6, Tin = 16, auto = true, fan = false, win = 0, grow = 0, last = 0, raf = 0, acc = 0;
    chartMark(ch, 0, 18, 5, 50); chartMark(ch, 1, 27, 5, 50);
    $('ghauto').onclick = e => { auto = !auto; e.target.textContent = auto ? '🤖 التحكم الآلي: يعمل' : '✋ التحكم الآلي: مطفأ'; e.target.classList.toggle('off', !auto); };
    const lines = sl.querySelectorAll('.ghright .ln');
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts; acc += dt * $('ghsp').value;
      while (acc > 0.05) { acc -= 0.05; h = (h + 0.05) % 24;                     // كل خطوة = ٣ دقائق
        const To = outT(h), S = sunAt(h);
        if (auto) { if (Tin > 28) fan = true; if (Tin < 26) fan = false; win = clamp((Tin - 24) / 8 * 90, 0, 90); } else { fan = false; win = 0; }
        Tin += ((To - Tin) * 0.02 + S * 0.55 - (fan ? 0.09 : 0) * (Tin - To) - win / 90 * 0.05 * (Tin - To)) * 1.0;
        const lamp = auto && S < 0.25 && h > 5 && h < 20;
        grow = clamp(grow + (Tin > 18 && Tin < 27 && (S > 0.25 || lamp) ? 0.05 : Tin > 35 ? -0.08 : 0), 0, 100);
        bi.push(Tin); bo.push(To);
        $('ghlamp').style.opacity = lamp ? 1 : 0;
      }
      chartFeed(ch, [bi, bo], 5, 50, 160);
      const S = sunAt(h); $('ghsky').setAttribute('fill', S > 0 ? `hsl(200,70%,${55 + S * 30}%)` : '#1b2850');
      const a = (h - 6) / 12 * Math.PI; $('ghsun').setAttribute('cx', 320 - Math.cos(a) * 280); $('ghsun').setAttribute('cy', 330 - Math.sin(a) * 300); $('ghsun').setAttribute('opacity', S > 0 ? 1 : 0);
      $('ghclk').textContent = hhmm(h);
      $('ghin').textContent = f1(Tin) + '°'; $('ghin').classList.toggle('on', Tin > 32); $('ghout').textContent = f1(outT(h)) + '°';
      $('ghw').textContent = f0(win) + '°'; $('ghf').textContent = fan ? 'تعمل' : 'متوقفة';
      $('ghfan').setAttribute('transform', `rotate(${fan ? (ts / 1.5) % 360 : 0})`); $('ghwin').style.transform = `rotate(${-win * 0.5}deg)`;
      $('ghg').style.width = grow + '%'; $('ghg').style.background = Tin > 35 ? '#e74c3c' : '#2e9e6b';
      sl.querySelectorAll('.ghfruit').forEach(f => f.style.fill = grow > 30 ? '#e53935' : '#9ccc65');
      sl.querySelectorAll('.ghp').forEach(p => p.style.transform = `translateY(0) scale(1, ${Tin > 38 ? .7 : 1})`);
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', auto && ((fan && n === 2) || (!fan && n === 3) || (win > 0 && n === 4))); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  tanklab(sl) {
    const $ = id => sl.querySelector('#' + id);
    let L = 55, well = false, irr = false, rainT = 0, leak = false, ping = 0, last = 0, raf = 0;
    const lines = sl.querySelectorAll('.tkright .ln');
    $('tkirb').onclick = () => { irr = !irr; $('tkirb').textContent = irr ? '⏹ أوقف الري' : '🌱 ري المزرعة'; };
    $('tkrain').onclick = () => { rainT = 10; };
    $('tkleak').onclick = e => { leak = !leak; e.target.classList.toggle('on', leak); e.target.textContent = leak ? '🔧 أصلح التسريب' : '🕳️ تسريب'; };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      const raining = rainT > 0; rainT = Math.max(0, rainT - dt);
      if (L < 20) well = true; if (L > 90) well = false;
      const irrigating = irr && !raining;
      L = clamp(L + dt * ((well ? 6 : 0) + (raining ? 4 : 0) - (irrigating ? 5 : 0) - (leak ? 2.5 : 0)), 0, 100);
      const d = 5 + (100 - L) * 0.95;                                     // سم من الحساس إلى سطح الماء (خزان عمقه ١٠٠ سم)
      const y = 412 - L * 2.92; $('tkw').setAttribute('y', y); $('tkw').setAttribute('height', 412 - y); $('tksurf').setAttribute('y1', y); $('tksurf').setAttribute('y2', y);
      ping = (ping + dt * 1.6) % 1; const py = 122 + (y - 122) * (ping < .5 ? ping * 2 : 2 - ping * 2);
      $('tkping').setAttribute('d', `M196 ${py} q 24 ${ping < .5 ? 8 : -8} 48 0`); $('tkd').textContent = `d = ${Math.round(d)} cm`; $('tkd').setAttribute('y', (122 + y) / 2);
      $('tkcloud').setAttribute('opacity', raining ? 1 : 0); $('rains').classList.toggle('wet', raining);
      $('tkin').classList.toggle('flow', well); $('tkout').classList.toggle('flow', irrigating);
      $('tkdv').textContent = AR(Math.round(d)); $('tklv').textContent = f0(L) + '٪'; $('tkwp').textContent = well ? 'يضخ' : 'متوقف'; $('tkir').textContent = irrigating ? 'يعمل' : raining && irr ? 'أُلغي ☔' : 'متوقف';
      const msg = $('tkmsg');
      msg.className = 'sowarn ' + (raining ? 'ok' : L < 20 ? 'bad' : '');
      msg.textContent = raining ? '🌧️ حساس المطر مبتل (القراءة أقل من ٥٠٠): أُلغي الري، والمطر يملأ الخزان مجانًا!' : well ? '⛽ المستوى انخفض تحت ٢٠٪: البئر يملأ الخزان حتى ٩٠٪' : leak ? '🕳️ المستوى ينخفض وحده بلا ري… تسريب! (تحدٍّ: اكتشفه بالكود)' : 'المستوى = (١٠٠ − d) تقريبًا، فكلما ارتفع الماء قصرت المسافة d';
      lines.forEach(l => { const n = +l.dataset.n; l.classList.toggle('run', [1, 2].includes(n) || (well && n === 3) || (!well && L > 90 && n === 4) || (raining && [5, 6].includes(n))); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  farmday(sl) {
    const $ = id => sl.querySelector('#' + id), c1 = $('fdc1'), lcd = [...sl.querySelectorAll('#fdlcd i')];
    const lcdShow = (a, b) => [a.padEnd(16).slice(0, 16), b.padEnd(16).slice(0, 16)].join('').split('').forEach((ch, i) => lcd[i].textContent = ch === ' ' ? '' : ch);
    const hh = x => String(Math.floor(x) % 24).padStart(2, '0') + ':' + String(Math.floor((x % 1) * 60)).padStart(2, '0');
    let run = false, h = 0, soil = 45, Tin = 14, tank = 70, health = 100, water = 0, lost = 0, pump = false, fan = false, rain = 0, rainAt, b1, b2, b2o, b3, log, rule = 'sched', last = 0, raf = 0, acc = 0, ended = false;
    const reset = () => { h = 0; soil = 45; Tin = 14; tank = 70; health = 100; water = 0; lost = 0; pump = false; fan = false; rain = 0; rainAt = 13 + Math.random() * 3; b1 = []; b2 = []; b2o = []; b3 = []; log = []; ended = false; $('fdlog').innerHTML = ''; };
    const say = t => { log.unshift(`<div><b>${hhmm(h)}</b> ${t}</div>`); $('fdlog').innerHTML = log.slice(0, 9).join(''); };
    sl.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { rule = b.dataset.r; sl.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x === b)); });
    $('fdgo').onclick = () => { if (!run || ended) { reset(); run = true; $('fdgo').textContent = '⏸ إيقاف'; say('▶ بدأ يوم جديد'); } else { run = false; $('fdgo').textContent = '▶ ابدأ اليوم'; } };
    $('fdrain').onclick = () => { if (run) { rain = 1.2; say('🌧️ بدأ المطر: أُلغي الري وامتلأ الخزان'); } };
    const loop = ts => {
      const dt = Math.min(40, ts - (last || ts)) / 1000; last = ts;
      if (run && !ended) { acc += dt;
        while (acc > 0.05 && !ended) { acc -= 0.05; h += 0.02;                 // ٢٤ ساعة في ٦٠ ثانية
          if (!rain && Math.abs(h - rainAt) < 0.011) { rain = 1; say('🌧️ مطر مفاجئ! حساس المطر يلغي الري'); }
          const S = sunAt(h), To = outT(h); rain = Math.max(0, rain - 0.02);
          const allowed = rule === 'any' || (h > 4.5 && h < 8) || (h > 18 && h < 20.5);
          const wasP = pump;
          const start = rule === 'any' ? soil < 35 : ((allowed && soil < 50) || soil < 18);   // قاعدة طوارئ: تحت ١٨٪ نسقي في أي وقت
          if (start && !rain && tank > 5) pump = true; if (soil > 65 || rain || tank <= 5) pump = false;
          if (pump && !wasP) say(`🌱 التربة ${f0(soil)}٪ ← تشغيل الري`); if (!pump && wasP) say('💧 اكتمل الري ← إيقاف المضخة');
          const eff = 1 - 0.65 * S;                                         // في الظهيرة يتبخر جزء كبير من ماء الري قبل أن يصل للجذور
          if (pump) { soil += 1.6 * eff; tank -= 0.35; water += 2; lost += 2 * (1 - eff); }
          if (rain) { soil += 0.9; tank = Math.min(100, tank + 0.6); }
          soil = clamp(soil - 0.02 - 0.08 * S * (To > 30 ? 1.3 : 1), 0, 100);
          const wasF = fan; if (Tin > 28) fan = true; if (Tin < 26) fan = false; if (fan && !wasF) say(`🌡️ ${f0(Tin)}° ← المروحة تعمل`);
          Tin += (To - Tin) * 0.03 + S * 0.5 - (fan ? 0.1 : 0) * (Tin - To);
          if (tank < 20 && !rain) { tank += 0.5; if (Math.random() < 0.02) say('⛽ الخزان منخفض ← البئر يملأ'); }
          health = clamp(health + (soil < 20 ? -0.15 : 0.03) + (Tin > 36 ? -0.1 : 0), 0, 100);
          b1.push(soil); b2.push(Tin); b2o.push(To); b3.push(tank);
          if (h >= 24) { ended = true; run = false; $('fdgo').textContent = '▶ يوم جديد'; say(`🏁 انتهى اليوم: ${f0(water)} لترًا، ضاع منها ${f0(lost)} بالتبخر`); }
        }
      }
      if (b1) chartFeed(c1, [b1, b2.map(t => t * 2), b3], 0, 100, 1200);
      const S = sunAt(h), dk = S <= 0;
      $('fdsky').setAttribute('fill', dk ? '#1b2850' : `hsl(200,70%,${52 + S * 30}%)`); $('fdstars').setAttribute('opacity', dk ? 1 : 0);
      const a = (h - 6) / 12 * Math.PI; $('fdsunc').setAttribute('cx', 450 - Math.cos(a) * 400); $('fdsunc').setAttribute('cy', 240 - Math.sin(a) * 200); $('fdsunc').setAttribute('opacity', dk ? 0 : 1);
      const b = ((h + 6) % 24) / 12 * Math.PI; $('fdmoon').setAttribute('cx', 450 - Math.cos(b) * 380); $('fdmoon').setAttribute('cy', 240 - Math.sin(b) * 180); $('fdmoon').setAttribute('opacity', dk ? 1 : 0);
      $('fdgrass').setAttribute('fill', dk ? '#3e5a26' : '#7cb342');
      $('fdcloud').setAttribute('opacity', rain ? 1 : 0); $('fdspray').setAttribute('opacity', pump ? 1 : 0); $('fdpipe').classList.toggle('flow', !!pump);
      $('fdpump').setAttribute('transform', `rotate(${pump ? (ts / 2) % 360 : 0})`); $('fdfan').setAttribute('transform', `rotate(${fan ? (ts / 1.5) % 360 : 0})`);
      const lamp = S < 0.2 && h > 5 && h < 21; $('fdlight').setAttribute('opacity', lamp ? 1 : 0);
      const tw = clamp(tank, 0, 100) / 100 * 114; $('fdtw').setAttribute('y', 40 + 114 - tw); $('fdtw').setAttribute('height', tw);
      const leafC = soil < 20 ? '#a1887f' : soil < 30 ? '#9e9d24' : '#2e7d32';
      sl.querySelectorAll('.fdpl path').forEach(pp => pp.setAttribute('stroke', leafC)); sl.querySelectorAll('.fdfr').forEach(f => f.style.fill = health > 70 ? '#e53935' : '#8d6e48');
      sl.querySelectorAll('.fdrow').forEach(r => r.setAttribute('stroke', `hsl(28,40%,${50 - soil * .3}%)`));
      lcdShow(`${hh(h)} Soil:${Math.round(soil)}%`, rain ? 'RAIN! no water' : pump ? `PUMP ON Tank:${Math.round(tank)}%` : `T:${Math.round(Tin)}C Tank:${Math.round(tank)}%`);
      $('fdclk').textContent = hhmm(Math.min(h, 23.99)); $('fdsun').textContent = sunAt(h) > 0 ? (sunAt(h) > .7 ? '☀️' : '🌤️') : '🌙';
      if (water !== undefined) { $('fdwater').textContent = f0(water) + ' لتر'; $('fdlost').textContent = f0(lost) + ' لتر'; $('fdhealth').textContent = f0(health) + '٪'; }
      raf = requestAnimationFrame(loop);
    };
    reset(); raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
