/* =====================================================================
   «لمسة تراث» — أدوات المجسّم الدوّار (المشروع الرئيسي كما في تقرير الفريق)
   الأنواع: exhibithero · systemlab · turntablelab · ledlab · kiosklab · udplab · eyelab · tourlab · pitch
   الأطراف الحقيقية: A4988 — STEP 26 · DIR 25 · EN 27 (يعمل على LOW) · NEMA17 بمصدر 12V مستقل · WS2812B على 23
   الأوامر عبر UDP: 'r' يمين · 'l' يسار · 's' توقف — وحارس يوقف المنصة إن انقطعت الرسائل أكثر من ثانية
   تتبع البؤبؤ: MediaPipe Face Landmarker (478 نقطة) · معايرة 2.5 ثانية · حارس الرمشة · النظر لأعلى = البوابة
   ===================================================================== */
(function () {
const { highlight, codeBlock } = window.ARD; const AR = n => String(n);
const { beep, clamp, car4 } = window.TUR;
const runLines = (sl, sel, arr) => sl.querySelectorAll(sel + ' .ln').forEach(l => l.classList.toggle('run', arr.includes(+l.dataset.n)));
const TAU = Math.PI * 2;

/* ================== الجهات الأربع ================== */
const FACES = [
  { n: 'Towers', en: 'The Towers', c: '#f0b429', ar: 'Four mud-brick towers guarding the fortress', e: 'Four mud-brick towers guarding the fortress' },
  { n: 'Courtyard', en: 'The Courtyard', c: '#2ecc71', ar: 'The open courtyard, the heart of the fortress', e: 'The open courtyard, the heart of the fortress' },
  { n: 'Mosque', en: 'The Mosque', c: '#3498db', ar: 'The mosque, with pillars and a tamarisk-wood roof', e: 'The mosque, with pillars and a tamarisk-wood roof' },
  { n: 'Majlis', en: 'The Majlis', c: '#a55eea', ar: 'The majlis, where guests were received', e: 'The majlis, where guests were received' },
];
const GATE = { n: 'Gate', en: 'The Gate', c: '#e67e22', ar: 'The wooden gate, with the famous spearhead from 1902', e: 'The wooden gate, with the famous spearhead from 1902' };
// صوت الراوي لكل جهة: الملفات في ../masmak-judges/audio (يعمل من الدورة ومن عرض المحكّمين)
const MSND = n => `../masmak-judges-en/audio/${n}.mp3`;
let mAudio = null;
function mPlay(src) { try { if (mAudio) mAudio.pause(); mAudio = new Audio(src); mAudio.play().catch(() => {}); } catch (e) {} }
function mStop() { try { if (mAudio) mAudio.pause(); } catch (e) {} mAudio = null; }
const faceAt = th => { const k = Math.round((((th % TAU) + TAU) % TAU) / (Math.PI / 2)) % 4; return k; };
window.TUR.FACES = FACES;

/* ================== المصمك ثلاثي الأبعاد ================== */
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.round(clamp(c * k, 0, 255)); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
function masmak3D(th, cx, cy, R, tilt = .42, opt = {}) {
  const c = Math.cos(th), s = Math.sin(th);
  const P = (X, Y, Z) => { const x = X * c + Z * s, z = -X * s + Z * c; return [cx + x * R, cy + z * R * tilt - Y * R, z]; };
  const pt = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const H = .62, out = [], L = [-.45, .3, .85];
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  if (!opt.noTable) {
    const rr = 1.75;
    out.push(`<ellipse cx="${cx}" cy="${cy + 16}" rx="${rr * R + 6}" ry="${rr * R * tilt + 6}" class="m3base"/><ellipse cx="${cx}" cy="${cy}" rx="${rr * R}" ry="${rr * R * tilt}" class="m3table"/>`);
    if (opt.ring) {                                                              // شريط WS2812B حول المنصة (ثابت لا يدور)
      const N = 24; for (let i = 0; i < N; i++) { const a = i / N * TAU, col = opt.ring(i, N); const x = cx + Math.cos(a) * rr * R * 1.04, y = cy + Math.sin(a) * rr * R * tilt * 1.04;
        out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(R * .055).toFixed(1)}" fill="${col || '#2a2f45'}" ${col ? `style="filter:drop-shadow(0 0 ${(R * .07).toFixed(0)}px ${col})"` : ''}/>`); }
    }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, p1 = P(Math.cos(a) * rr * .9, 0, Math.sin(a) * rr * .9), p2 = P(Math.cos(a) * rr * .97, 0, Math.sin(a) * rr * .97); out.push(`<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" class="m3tick${i % 6 ? '' : ' big'}"/>`); }
    out.push(`<polygon points="${corners.map(([x, z]) => P(x * 1.25, .001, z * 1.25)).map(pt).join(' ')}" class="m3sand"/>`);
  }
  const towers = corners.map(([x, z], i) => ({ x: x * 1.02, z: z * 1.02, h: i === 3 ? 1.25 : .95, r: i === 3 ? .26 : .2 }));
  const towerSVG = t => {
    const b = P(t.x, 0, t.z), tp = P(t.x, t.h, t.z), rb = t.r * R, rt = t.r * R * .78, ry = rt * tilt;
    const crn = Array.from({ length: 5 }, (_, k) => { const xx = tp[0] - rt + (k + .5) * (2 * rt / 5); return `<rect x="${(xx - R * .02).toFixed(1)}" y="${(tp[1] - ry - R * .06).toFixed(1)}" width="${(R * .04).toFixed(1)}" height="${(R * .07).toFixed(1)}" fill="#c39a66"/>`; }).join('');
    const sl = [0, 1].map(k => `<rect x="${(tp[0] - R * .015).toFixed(1)}" y="${(tp[1] + (b[1] - tp[1]) * (.22 + k * .3)).toFixed(1)}" width="${(R * .03).toFixed(1)}" height="${(R * .1).toFixed(1)}" rx="2" fill="#3e2a1a"/>`).join('');
    return `<path d="M${(b[0] - rb).toFixed(1)} ${b[1].toFixed(1)} L${(tp[0] - rt).toFixed(1)} ${tp[1].toFixed(1)} L${(tp[0] + rt).toFixed(1)} ${tp[1].toFixed(1)} L${(b[0] + rb).toFixed(1)} ${b[1].toFixed(1)} A ${rb} ${rb * tilt} 0 0 1 ${(b[0] - rb).toFixed(1)} ${b[1].toFixed(1)} Z" fill="url(#m3tw)"/>
      <ellipse cx="${tp[0].toFixed(1)}" cy="${tp[1].toFixed(1)}" rx="${rt.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#a77a4b"/>${crn}${sl}`;
  };
  const tw = towers.map(t => ({ d: -t.x * s + t.z * c, svg: towerSVG(t) }));
  tw.filter(t => t.d < 0).sort((a, b) => a.d - b.d).forEach(t => out.push(t.svg));
  for (let i = 0; i < 4; i++) {
    const [x1, z1] = corners[i], [x2, z2] = corners[(i + 1) % 4];
    const nx = -(z2 - z1) / 2, nz = (x2 - x1) / 2;
    const nzr = -nx * s + nz * c; if (nzr <= 0.001) continue;
    const nxr = nx * c + nz * s, lit = .62 + .38 * clamp(nxr * L[0] + nzr * L[2], 0, 1);
    const q = [P(x1, 0, z1), P(x2, 0, z2), P(x2, H, z2), P(x1, H, z1)];
    let g = `<polygon points="${q.map(pt).join(' ')}" fill="${shade('#c9a06d', lit)}" stroke="${shade('#8a6239', lit)}" stroke-width="1.5"/>`;
    const at = (t, y) => P(x1 + (x2 - x1) * t, y, z1 + (z2 - z1) * t);
    for (let k = 0; k < 9; k++) { const a = at((k + .5) / 9 - .02, H), b = at((k + .5) / 9 + .02, H), a2 = at((k + .5) / 9 + .02, H + .07), b2 = at((k + .5) / 9 - .02, H + .07); g += `<polygon points="${[a, b, a2, b2].map(pt).join(' ')}" fill="${shade('#c9a06d', lit * .95)}"/>`; }
    for (let k = 1; k < 6; k++) { if (i === 2 && (k === 2 || k === 3)) continue; const a = at(k / 6 - .012, H * .55), b = at(k / 6 + .012, H * .55), a2 = at(k / 6 + .012, H * .78), b2 = at(k / 6 - .012, H * .78); g += `<polygon points="${[a, b, a2, b2].map(pt).join(' ')}" fill="#3e2a1a"/>`; }
    for (let k = 0; k < 14; k++) { const a = at((k + .5) / 14, H * .9), b = at((k + .5) / 14 + .025, H * .82), cc = at((k + .5) / 14 - .025, H * .82); g += `<polygon points="${[a, b, cc].map(pt).join(' ')}" fill="${shade('#8a6239', lit)}" opacity=".7"/>`; }
    if (i === 2) {
      const g1 = at(.44, 0), g2 = at(.56, 0), g3 = at(.56, H * .42), g4 = at(.44, H * .42), g5 = at(.5, H * .5);
      g += `<path d="M${pt(g1)} L${pt(g4)} Q${pt(g5)} ${pt(g3)} L${pt(g2)} Z" fill="${opt.gateGlow ? '#e67e22' : '#6d4521'}" stroke="#3e2a1a" stroke-width="2"/>`;
      const m1 = at(.5, 0), m2 = at(.5, H * .44); g += `<line x1="${m1[0].toFixed(1)}" y1="${m1[1].toFixed(1)}" x2="${m2[0].toFixed(1)}" y2="${m2[1].toFixed(1)}" stroke="#3e2a1a" stroke-width="2"/>`;
    }
    out.push(g);
  }
  out.push(`<polygon points="${corners.map(([x, z]) => P(x, H, z)).map(pt).join(' ')}" fill="#b98f5e" stroke="#8a6239" stroke-width="1.5"/>`);
  out.push(`<polygon points="${corners.map(([x, z]) => P(x * .55, H, z * .55)).map(pt).join(' ')}" fill="#8a6239" opacity=".55"/>`);
  { const p = P(.25, H, -.1); out.push(`<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)} q 3 ${(-R * .25).toFixed(1)} 0 ${(-R * .42).toFixed(1)}" stroke="#6d4521" stroke-width="${Math.max(2, R * .025).toFixed(1)}" fill="none"/>${[-50, -15, 20, 55].map(a => `<path d="M${p[0].toFixed(1)} ${(p[1] - R * .42).toFixed(1)} q ${(Math.cos(a / 57.3) * R * .14).toFixed(1)} ${(-R * .05).toFixed(1)} ${(Math.cos(a / 57.3) * R * .24).toFixed(1)} ${(R * .06 + Math.sin(a / 57.3) * R * .05).toFixed(1)}" stroke="#2e7d32" stroke-width="${Math.max(2, R * .025).toFixed(1)}" fill="none"/>`).join('')}`); }
  tw.filter(t => t.d >= 0).sort((a, b) => a.d - b.d).forEach(t => out.push(t.svg));
  return out.join('');
}
const M3DEFS = `<defs><linearGradient id="m3tw" x1="0" x2="1"><stop offset="0" stop-color="#8a6239"/><stop offset=".45" stop-color="#d2ab78"/><stop offset="1" stop-color="#9c7246"/></linearGradient>
  <radialGradient id="m3spot" cx=".5" cy=".2" r=".7"><stop offset="0" stop-color="#fff6d8" stop-opacity=".35"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs>`;
window.TUR.masmak3D = masmak3D;

/* ================== مترجم لغة الإشارة (رسم متحرك) ================== */
const signer = (id, x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" id="${id}" class="signer">
  <circle r="74" class="sgbg"/><clipPath id="${id}clip"><circle r="72"/></clipPath>
  <g clip-path="url(#${id}clip)"><path d="M-60 80 Q -56 22 0 16 Q 56 22 60 80 Z" class="sgbody"/><rect x="-9" y="2" width="18" height="18" class="sgskin"/>
    <circle cy="-16" r="24" class="sgskin"/><path d="M-25 -20 Q -24 -46 0 -46 Q 24 -46 25 -20 Q 18 -36 0 -36 Q -18 -36 -25 -20 Z" class="sghair"/>
    <circle cx="-8" cy="-16" r="2.6" fill="#1c1f27"/><circle cx="8" cy="-16" r="2.6" fill="#1c1f27"/><path d="M-7 -4 Q 0 1 7 -4" class="sgmouth"/>
    <g class="sgarmL"><path d="M-40 34 L-26 10" class="sgsleeve"/><circle cx="-24" cy="6" r="9" class="sgskin"/><path d="M-30 -1 l-3 -9 M-25 -3 l-1 -10 M-20 -2 l2 -9" class="sgfing"/></g>
    <g class="sgarmR"><path d="M40 34 L26 10" class="sgsleeve"/><circle cx="24" cy="6" r="9" class="sgskin"/><path d="M30 -1 l3 -9 M25 -3 l1 -10 M20 -2 l-2 -9" class="sgfing"/></g></g>
  <circle r="72" fill="none" stroke="#f0cc7a" stroke-width="4"/></g>`;

/* ================== كرسي LEGO والزائر ================== */
const chairSVG = (id, glow) => `<g id="${id}" class="lchair"><rect x="-34" y="-8" width="68" height="14" rx="3" fill="#f5c400"/><rect x="-34" y="-48" width="12" height="44" rx="3" fill="#f5c400"/>
  ${[-24, 24].map(x => `<circle cx="${x}" cy="12" r="12" fill="#1c1f27"/><circle cx="${x}" cy="12" r="4" fill="#9aa3b8"/>`).join('')}<rect x="-6" y="-24" width="20" height="14" rx="3" fill="#fff" stroke="#1c1f27" stroke-width="2"/><circle cx="4" cy="-17" r="3" fill="#2b6fc0"/>
  <circle cx="-14" cy="-62" r="12" fill="#c99a74"/><path d="M-26 -50 Q -14 -46 -2 -50 L 4 -14 L -24 -14 Z" fill="#2b6fc0"/><path d="M-6 -20 L 22 -20 L 24 -2" stroke="#1b2340" stroke-width="7" fill="none" stroke-linecap="round"/>
  ${glow ? '<circle cx="-14" cy="-62" r="17" fill="none" stroke="#7ee2a8" stroke-width="3" stroke-dasharray="4 4"/>' : ''}</g>`;

/* ================== أكواد ================== */
const STEP_CODE = `const int STEP = 26, DIR = 25, EN = 27;
int wait = 1500;              // bigger = slower

void setup() {
  pinMode(STEP, OUTPUT); pinMode(DIR, OUTPUT);
  pinMode(EN, OUTPUT); digitalWrite(EN, HIGH);
}

void turn(bool right) {
  digitalWrite(EN, LOW);            // enable the motor
  digitalWrite(DIR, right);         // direction
  digitalWrite(STEP, HIGH); delayMicroseconds(wait);
  digitalWrite(STEP, LOW);  delayMicroseconds(wait);
}

void stopTable() { digitalWrite(EN, HIGH); }`;
const LED_CODE = `#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel ring(24, 23, NEO_GRB + NEO_KHZ800);
uint32_t faceColor[4];

void setup() {
  ring.begin(); ring.setBrightness(60);
  faceColor[0] = ring.Color(240, 180, 40);   // towers
  faceColor[1] = ring.Color(46, 204, 113);   // courtyard
  faceColor[2] = ring.Color(52, 152, 219);   // mosque
  faceColor[3] = ring.Color(165, 94, 234);   // majlis
}

void showFace(int f) { ring.fill(faceColor[f]); ring.show(); }

void wave(int t) {
  for (int i = 0; i < 24; i++)
    ring.setPixelColor(i, (i + t) % 6 == 0 ? 0xF0CC7A : 0);
  ring.show();
}`;
const UDP_CODE = `WiFiUDP udp;
char cmd = 's';
unsigned long lastMsg = 0;

void loop() {
  if (udp.parsePacket()) {
    cmd = udp.read();
    lastMsg = millis();
  }
  if (millis() - lastMsg > 1000) cmd = 's';   // watchdog
  if (cmd == 'r') turn(true);
  else if (cmd == 'l') turn(false);
  else stopTable();
}`;
const PY_SEND = `import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
ESP = ("192.168.1.50", 4210)

def send(cmd):            # 'r' or 'l' or 's'
    sock.sendto(cmd.encode(), ESP)`;
const EYE_CODE = `ratio = (iris.x - inner.x) / (outer.x - inner.x)

if eyes_closed:
    cmd = 's'                     # blink guard
elif ratio < center - 0.08:
    cmd = 'r'
elif ratio > center + 0.08:
    cmd = 'l'
elif looking_up:
    play("gate")                  # the gate, no rotation
else:
    cmd = 's'
send(cmd)`;

/* ================== المخطط الكامل ================== */
const SYS = [
  { k: 'cam', x: 110, y: 120, i: '📷', n: 'Eye-tracking camera', d: 'An ordinary camera in front of the visitor. No expensive sensors: computer vision is enough. (Next step: move it to a handheld iPad)' },
  { k: 'eye', x: 110, y: 330, i: '👁️', n: 'Pupil tracking', d: 'Python + MediaPipe Face Landmarker: 478 face points, locating the pupil inside the eye after a 2.5-second calibration.' },
  { k: 'pi', x: 400, y: 225, i: '🍓', n: 'Raspberry Pi: the central brain', d: 'Plays the sign-language video and the audio narration for each face (VLC and mpg123), and forwards eye commands instantly to the ESP32 over UDP.' },
  { k: 'screen', x: 400, y: 420, i: '📺', n: 'Screen and speaker', d: 'A sign-language video reviewed by a sign-language teacher from a school for the deaf, plus audio narration for the blind, at the same time.' },
  { k: 'esp', x: 690, y: 225, i: '🧠', n: 'ESP32 motion unit', d: 'Receives one letter over UDP: r right, l left, s stop. A watchdog stops the turntable if messages stop for more than a second.' },
  { k: 'motor', x: 900, y: 110, i: '⚙️', n: 'A4988 + NEMA17', d: 'A driver turning STEP (26), DIR (25) and EN (27, active LOW) pulses into precise steps, with a separate 12 V supply for the motor.' },
  { k: 'led', x: 900, y: 340, i: '🌈', n: 'WS2812B strip', d: 'On GPIO23: a different color for each face, a light wave while turning, with limited brightness to avoid excess current.' },
  { k: 'chair', x: 110, y: 520, i: '🦽', n: 'LEGO wheelchair', d: 'Built with LEGO SPIKE Prime for severe motor disabilities: “drive mode” brings the visitor closer, then “explore mode” controls the model.' },
  { k: 'safe', x: 760, y: 520, i: '🛡️', n: 'Safety robots', d: 'A gas and flame station on an ESP32 talks to two robots over ESP-NOW: the leader goes to the fire itself and returns, and orders the second robot to the gas. Protection for visitors in a crowded exhibition.' },
];
const SYS_LINKS = [['cam', 'eye'], ['eye', 'pi'], ['pi', 'screen'], ['pi', 'esp'], ['esp', 'motor'], ['esp', 'led'], ['chair', 'eye']];
const SYS_FLOW = [['cam', '1. The camera sees the visitor’s face'], ['eye', '2. The pupil moves right → command r'], ['pi', '3. The Raspberry Pi forwards the command instantly'], ['esp', '4. The ESP32 receives r over UDP'], ['motor', '5. The A4988 pulses and the model turns right'], ['led', '6. A light wave while turning'], ['eye', '7. The visitor looks ahead → s: stop'], ['screen', '8. Sign-language video and audio for this face']];

Object.assign(window.DECK_TYPES, {
  exhibithero: s => `<div class="slide dark exhero">
      <div class="kicker">${s.kicker}</div>
      <h1 class="htitle" style="font-size:70px">${s.title}</h1>
      <div class="exsnd ix"><button class="sndbtn" id="exsnd">🔇 Sound off</button>${[['welcome', '🎙️ Welcome'], ['gate', '🚪 ' + GATE.n], ...FACES.map((f, i) => ['f' + i, f.n])].map(([k, n]) => `<button class="exa" data-audio="${MSND(k)}">▶ ${n}</button>`).join('')}</div>
      <div class="mhwrap dygif"><svg viewBox="0 0 1600 560" class="exsvg">${M3DEFS}
        <rect width="1600" height="560" fill="#0d1226"/><ellipse cx="620" cy="60" rx="520" ry="560" fill="url(#m3spot)"/>
        ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 397) % 1600}" cy="${(i * 131) % 150 + 10}" r="${i % 3 ? 1.2 : 2}" fill="#fff" opacity=".5"/>`).join('')}
        <rect x="0" y="470" width="1600" height="90" fill="#191f3a"/>
        <g id="exm"></g>
        <g transform="translate(150 470)">${chairSVG('exch', true)}</g>
        <g transform="translate(250 330)"><rect x="-26" y="-18" width="52" height="36" rx="8" fill="#1c1f27" stroke="#f0cc7a" stroke-width="3"/><circle r="10" fill="#2b6fc0" stroke="#9ec5f2" stroke-width="3"/><text y="44" class="exlbl" style="font-size:16px">📷 Eye tracking</text></g>
        <path id="exgaze" d="M140 404 L 230 340" stroke="#7ee2a8" stroke-width="3" stroke-dasharray="6 6" class="spray"/>
        <text x="620" y="540" class="exlbl" id="exface"></text>
        <g transform="translate(1040 60)"><rect width="500" height="320" rx="18" fill="#1c1f27" stroke="#3a4266" stroke-width="6"/><rect x="16" y="16" width="468" height="264" rx="6" fill="#0b0f20"/>
          <g id="exart"></g>${signer('exsg', 420, 200, .62)}
          <rect x="16" y="236" width="380" height="44" fill="rgba(0,0,0,.6)"/><text x="206" y="265" class="excap" id="excap"></text>
          <rect x="220" y="320" width="60" height="60" fill="#2a3150"/><rect x="160" y="376" width="180" height="14" rx="6" fill="#2a3150"/>
          <g transform="translate(420 352)"><rect x="-46" y="-24" width="92" height="50" rx="6" fill="#2e9e6b"/><text y="6" class="exlbl" style="font-size:14px;fill:#fff">Raspberry Pi</text></g></g>
        <text x="1190" y="438" class="exlbl">📺 Sign language + narration</text>
        <g transform="translate(1420 505) scale(.9)">${car4('exc')}</g><g transform="translate(1520 470)"><rect x="-22" y="-30" width="44" height="34" rx="5" fill="#1c1f27" stroke="#f0cc7a" stroke-width="2"/><rect x="-16" y="-25" width="32" height="11" fill="#9fd356"/><circle cx="-8" cy="-6" r="4" class="m3led r"/><circle cx="8" cy="-6" r="4" class="m3led b"/></g>
        <text x="1470" y="548" class="exlbl" style="font-size:16px">🛡️ Safety robot</text>
      </svg></div></div>`,

  systemlab: s => `<div class="slide light">
      <div class="kicker">🗺️ The whole system</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="argrid">
        <div class="arleft ix"><svg viewBox="0 0 1010 600" class="archsvg sysvg">
            <rect x="20" y="20" width="560" height="450" rx="24" class="zone2"/><text x="300" y="54" class="zt">Eye, brain and content</text>
            <rect x="600" y="20" width="390" height="440" rx="24" class="zone1"/><text x="795" y="54" class="zt">Motion and lighting unit</text>
            ${SYS_LINKS.map(([a, b]) => { const A = SYS.find(x => x.k === a), B = SYS.find(x => x.k === b); return `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" class="alink" data-l="${a}-${b}"/>`; }).join('')}
            ${SYS.map(a => `<g class="anode" data-k="${a.k}" transform="translate(${a.x} ${a.y})"><circle r="52" class="acirc"/><text y="12" class="aico">${a.i}</text><text y="78" class="anm">${a.n.split(':')[0].replace('برنامج ', '')}</text></g>`).join('')}
          </svg><div class="arctl"><button class="clap" id="syplay">▶ Watch one glance</button><div class="arcap" id="sycap">👆 Click any part to learn about it</div></div></div>
        <div class="arinfo" id="syinfo"><div class="xi0">Nine parts… one experience led by the visitor’s eyes.</div></div>
      </div></div>`,

  turntablelab: s => `<div class="slide light">
      <div class="kicker">⚙️ The turntable · A4988 + NEMA17</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="ttgrid">
        <div class="ttleft ix"><svg viewBox="0 0 800 500" class="ttsvg">${M3DEFS}<rect width="800" height="500" fill="#141a33"/><ellipse cx="400" cy="40" rx="380" ry="520" fill="url(#m3spot)"/><g id="ttm"></g>
            <g transform="translate(30 24)"><rect width="200" height="96" rx="10" fill="#c0392b"/><text x="100" y="22" class="ttl">A4988</text>
              ${['STEP 26', 'DIR 25', 'EN 27'].map((t, i) => `<circle cx="${36 + i * 64}" cy="50" r="12" class="ttled" id="tp${i}"/><text x="${36 + i * 64}" y="82" class="ttl" style="font-size:12px">${t}</text>`).join('')}</g>
            <text x="770" y="56" class="ttface" id="ttface"></text></svg>
          <div class="ttpad"><button class="sndbtn" data-c="l">◀ l left</button><button class="clap" data-c="s">⏹ s stop</button><button class="sndbtn" data-c="r">r right ▶</button></div></div>
        <div class="ttright ix">
          <label class="lsl"><span>⏱️ wait between pulses: <b id="ttwv">1500</b> µs</span><input type="range" id="ttw" min="400" max="3000" value="1500" step="100"></label>
          <div class="lseg"><span>Microstepping</span><button class="lsb" data-m="1">Full ×1</button><button class="lsb" data-m="4">1/4</button><button class="lsb on" data-m="16">1/16</button></div>
          <div class="sofacts"><div class="ac"><span>Steps per turn</span><b id="ttspr">3200</b></div><div class="ac gold"><span>Angle</span><b id="tta">0°</b></div><div class="ac"><span>Turn time</span><b id="ttt">—</b></div></div>
          <div class="sowarn" id="ttwarn"></div>
          ${codeBlock(STEP_CODE, 'micro')}
        </div></div></div>`,

  ledlab: s => `<div class="slide light">
      <div class="kicker">🌈 WS2812B strip</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="ttgrid">
        <div class="ttleft ix"><svg viewBox="0 0 800 500" class="ttsvg">${M3DEFS}<rect width="800" height="500" fill="#0d1226"/><g id="lgm"></g><text x="400" y="480" class="ttface" style="text-anchor:middle" id="lgcap"></text></svg>
          <div class="lseg lgfaces">${FACES.map((f, i) => `<button class="lsb" data-f="${i}" style="border-color:${f.c}">${f.n}</button>`).join('')}<button class="lsb" data-f="w">🌊 Turning wave</button><button class="lsb" data-f="p">🎉 Interest reward</button></div></div>
        <div class="ttright ix">
          <label class="lsl"><span>☀️ Brightness: <b id="lgbv">60</b> of 255</span><input type="range" id="lgb" min="10" max="255" value="60" step="5"></label>
          <div class="sofacts"><div class="ac"><span>LEDs</span><b>24</b></div><div class="ac gold"><span>Approx. current</span><b id="lgma">—</b></div><div class="ac"><span>Data pin</span><b>GPIO23</b></div></div>
          <div class="sowarn" id="lgw"></div>
          ${codeBlock(LED_CODE, 'micro')}
        </div></div></div>`,

  kiosklab: s => `<div class="slide light">
      <div class="kicker">📺 Raspberry Pi and screen</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="kgrid">
        <div class="kleft ix"><svg viewBox="0 0 660 400" class="ksvg">${M3DEFS}<rect width="660" height="400" rx="16" fill="#1c1f27"/><rect x="14" y="14" width="632" height="356" rx="6" fill="#0b0f20"/>
            <g id="kmas"></g><g id="ksg">${signer('ksgn', 560, 190, .78)}</g>
            <rect x="14" y="20" width="200" height="40" rx="8" fill="rgba(0,0,0,.5)"/><text x="114" y="48" class="kcap" id="kface"></text>
            <rect x="14" y="296" width="632" height="74" fill="rgba(0,0,0,.6)"/><text x="330" y="326" class="kcap" id="kcap1"></text><text x="330" y="356" class="kcap en" id="kcap2"></text>
            <g id="kfrz" opacity="0"><rect x="430" y="70" width="150" height="34" rx="8" fill="#e0b400"/><text x="505" y="94" class="kcap" style="font-size:16px;fill:#1c1f27">❄️ Last frame frozen</text></g>
            <g id="kblank" opacity="0"><rect x="14" y="14" width="632" height="282" fill="#000"/><text x="330" y="160" class="kcap" style="fill:#888">⬛ The video ended… the audio goes on!</text></g></svg>
          <div class="ktl"><div class="ktrow"><span>🔊 Audio</span><div class="ktbar"><i id="ktaud"></i></div><b id="ktal"></b></div><div class="ktrow"><span>🎞️ Video</span><div class="ktbar"><i id="ktvid"></i><em id="ktfrz"></em></div><b id="ktvl"></b></div><div class="ktplay" id="ktplay"></div></div>
          <div class="kctl">${FACES.map((f, i) => `<button class="lsb${i ? '' : ' on'}" data-f="${i}">${f.n}</button>`).join('')}<button class="sndbtn" id="kfix">❌ No extension</button></div></div>
        <div class="kright"><div class="kpi"><div class="kpih"><b>🍓 Raspberry Pi · Python</b><span>Sign-language video + narration for each face</span></div>
            <pre class="kshell" dir="ltr"><i># extend the video by freezing the last frame</i>
ffmpeg -i face1.mp4 -vf
  "tpad=stop_mode=clone:stop_duration=7"
  face1_fixed.mp4

<i># play together: picture + sound</i>
subprocess.Popen(["cvlc", "--fullscreen",
  "--play-and-exit", "face1_fixed.mp4"])
subprocess.Popen(["mpg123", "face1.mp3"])</pre></div>
          <div class="sowarn" id="kinfo"></div></div>
      </div></div>`,

  udplab: s => `<div class="slide light">
      <div class="kicker">📶 UDP and the watchdog</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="udgrid">
        <div class="udleft ix"><svg viewBox="0 0 760 330" class="udsvg">${M3DEFS}<rect width="760" height="330" rx="20" fill="#141a33"/>
            <g transform="translate(110 150)"><rect x="-80" y="-60" width="160" height="110" rx="14" fill="#2e9e6b"/><text y="-22" class="ttl" style="font-size:18px">🍓 Raspberry Pi</text><text y="8" class="ttl" style="font-size:15px">send(cmd)</text><text y="34" class="udcmd" id="udsent">s</text></g>
            <g id="udpk"></g>
            <g transform="translate(400 150)"><rect x="-70" y="-50" width="140" height="94" rx="12" fill="#1f2a44" stroke="#f0cc7a" stroke-width="3"/><text y="-16" class="ttl" style="font-size:17px">🧠 ESP32</text><text y="20" class="udcmd" id="udcmd">s</text></g>
            <g id="udm"></g>
            <g transform="translate(400 280)"><rect x="-120" y="-18" width="240" height="30" rx="15" fill="#2a3150"/><rect x="-120" y="-18" width="0" height="30" rx="15" fill="#2ecc71" id="udwd"/><text y="3" class="ttl" style="font-size:14px" id="udwdt">Watchdog</text></g></svg>
          <div class="udctl"><button class="clap" id="udgo">👁️ Look right (press and hold)</button>
            <label class="lsl"><span>📉 Message loss: <b id="udlv">0%</b></span><input type="range" id="udl" min="0" max="60" value="0" step="5"></label>
            <button class="sndbtn on" id="udg">🛡️ Watchdog: on</button><button class="sndbtn" id="udcut">✂️ Cut the network</button></div></div>
        <div class="udright"><div class="sofacts"><div class="ac"><span>Sent</span><b id="udns">0</b></div><div class="ac"><span>Lost</span><b id="udnl">0</b></div><div class="ac gold"><span>Over-rotation</span><b id="udov">0°</b></div></div>
          <div class="sowarn" id="udw"></div>
          ${codeBlock(UDP_CODE, 'micro')}</div>
      </div></div>`,

  eyelab: s => `<div class="slide light">
      <div class="kicker">👁️ Pupil tracking</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="eygrid">
        <div class="eyleft ix"><svg viewBox="0 0 640 420" class="eysvg" id="eysv"><rect width="640" height="420" rx="22" fill="#1b2547"/>
            <ellipse cx="320" cy="215" rx="190" ry="235" fill="#d8a77f"/><path d="M130 160 Q 160 -30 320 -10 Q 480 -30 510 160 Q 470 70 320 70 Q 170 70 130 160 Z" fill="#2b1d14"/>
            <g id="eymesh"></g>
            ${[-1, 1].map(sd => `<g transform="translate(${320 + sd * 82} 200)"><path d="M-62 0 Q 0 -44 62 0 Q 0 44 -62 0 Z" fill="#fff" stroke="#3e2a1a" stroke-width="3" class="eyeball"/>
              <g class="iris" id="eyi${sd < 0 ? 'L' : 'R'}"><circle r="22" fill="#5b3a1e"/><circle r="10" fill="#111"/><circle cx="-6" cy="-7" r="4" fill="#fff"/></g>
              <path d="M-66 0 Q 0 -46 66 0" class="lid" id="eyl${sd < 0 ? 'L' : 'R'}" fill="#d8a77f"/>
              <circle cx="-62" cy="0" r="4" class="lm"/><circle cx="62" cy="0" r="4" class="lm"/><circle cx="0" cy="0" r="5" class="lm ir" id="eyd${sd < 0 ? 'L' : 'R'}"/>
              <text y="-58" class="eyidx" id="eyx${sd < 0 ? 'L' : 'R'}"></text></g>`).join('')}
            <path d="M300 290 Q 320 305 340 290" stroke="#6d3b2a" stroke-width="5" fill="none"/><path d="M280 345 Q 320 372 360 345" stroke="#8a3b2a" stroke-width="6" fill="none" stroke-linecap="round"/>
            <rect x="200" y="380" width="240" height="30" rx="15" fill="rgba(0,0,0,.45)"/><text x="320" y="401" class="eyst" id="eyst"></text></svg>
          <div class="eyctl"><button class="clap" id="eycal">🎯 Calibrate 2.5 s</button><button class="sndbtn" id="eyblink">😑 Blink</button><button class="sndbtn" id="eylong">😌 Long close</button><button class="sndbtn" id="eyidx">🔢 Indices: correct</button></div></div>
        <div class="eyright"><svg viewBox="0 0 520 250" class="eymini">${M3DEFS}<rect width="520" height="250" rx="18" fill="#141a33"/><g id="eym"></g><text x="500" y="34" class="ttface" id="eyface"></text></svg>
          <div class="sofacts"><div class="ac"><span>ratio</span><b id="eyr">0.50</b></div><div class="ac gold"><span>Command</span><b id="eyc">s</b></div><div class="ac"><span>Content</span><b id="eyv">—</b></div></div>
          ${codeBlock(EYE_CODE, 'micro')}</div>
      </div></div>`,

  tourlab: s => `<div class="slide light">
      <div class="kicker">🦽 The full tour</div>
      <h2 class="title" style="margin-bottom:10px">${s.title}</h2>
      <div class="pmgrid">
        <div class="pmleft ix"><svg viewBox="0 0 1000 540" class="tosvg">${M3DEFS}<rect width="1000" height="540" rx="22" fill="#141a33"/><ellipse cx="640" cy="40" rx="360" ry="480" fill="url(#m3spot)"/>
            <g id="tom"></g><g id="toch" transform="translate(110 470)">${chairSVG('toc', true)}</g>
            <g transform="translate(330 360)"><rect x="-22" y="-16" width="44" height="32" rx="6" fill="#1c1f27" stroke="#f0cc7a" stroke-width="2"/><circle r="8" fill="#2b6fc0"/></g>
            <g id="todist"><line x1="0" y1="0" x2="0" y2="0" stroke="#7ee2a8" stroke-width="3" stroke-dasharray="6 6" id="todl"/><text class="eyst" id="todt"></text></g>
            <g transform="translate(860 120)"><rect x="-120" y="-80" width="240" height="160" rx="12" fill="#1c1f27" stroke="#3a4266" stroke-width="5"/><rect x="-108" y="-68" width="216" height="120" fill="#0b0f20"/>${signer('tosg', 62, -10, .42)}<text y="-30" x="-40" class="kcap" style="font-size:15px" id="toscr"></text><text y="70" class="eyst" style="font-size:13px">📺 Screen</text></g>
            <rect x="30" y="20" width="270" height="44" rx="12" fill="rgba(0,0,0,.45)"/><text x="165" y="49" class="eyst" style="font-size:18px" id="tomode"></text></svg>
          <div class="mctl" style="grid-template-columns:repeat(4,1fr)"><button class="clap" id="tostart">▶ Start the tour</button><button class="sndbtn" data-g="l">◀ Look left</button><button class="sndbtn" data-g="r">Look right ▶</button><button class="sndbtn" data-g="u">⬆ Look up</button></div></div>
        <div class="pmright"><div class="mslog" id="tolog"></div><div class="tointer"><span>⭐ Interest measure (in development)</span>${FACES.map((f, i) => `<div class="toi"><b>${f.n}</b><div class="btbar"><i id="toi${i}" style="background:${f.c}"></i></div></div>`).join('')}</div></div>
      </div></div>`,

  pitch: s => `<div class="slide light">
      <div class="kicker">${s.kicker}</div>
      <h2 class="title" style="margin-bottom:14px">${s.title}</h2>
      <div class="ptgrid">${s.rows.map((r, i) => `<div class="ptrow" style="animation-delay:${i * .12}s"><div class="ptn">${AR(i + 1)}</div><div class="ptar">${r[0]}</div><div class="pten" dir="ltr">${r[1]}</div></div>`).join('')}</div></div>`,
});

/* ---------- السلوك ---------- */
const ringFor = (mode, th, t, face) => (i, N) => {
  if (mode === 'off') return null;
  if (mode === 'wave') return (i + Math.floor(t * 12)) % 6 === 0 ? '#f0cc7a' : (i + Math.floor(t * 12)) % 6 === 1 ? '#8a6d2e' : null;
  if (mode === 'party') return `hsl(${(i * 15 + t * 240) % 360} 90% 60%)`;
  return FACES[face].c;
};

Object.assign(window.DECK_BIND, {
  exhibithero(sl) {
    const m = sl.querySelector('#exm'), art = sl.querySelector('#exart'), cap = sl.querySelector('#excap'), sg = sl.querySelector('#exsg'), lab = sl.querySelector('#exface');
    let raf = 0, t0 = 0, k = -1, on = false, lastSnd = '';
    const btn = sl.querySelector('#exsnd');
    if (btn) btn.onclick = () => { on = !on; btn.textContent = on ? '🔊 Sound on' : '🔇 Sound off'; btn.classList.toggle('on', on); lastSnd = ''; if (!on) mStop(); };
    sl.querySelectorAll('.exsnd [data-audio]').forEach(b => b.onclick = () => mPlay(b.dataset.audio));
    // دورة: يدور 3 ث نحو جهة ثم يتوقف 11 ث (يتسع لصوت الراوي) ويعرض محتواها — كل شيء من الزمن t وحده (يصلح للتصوير إطارًا إطارًا)
    const frame = t => {
      const cyc = t % 14, moving = cyc < 3;
      const th = Math.floor(t / 14) * Math.PI / 2 + (moving ? cyc / 3 : 1) * Math.PI / 2;
      const face = faceAt(th);
      m.innerHTML = masmak3D(th, 620, 320, 140, .4, { ring: ringFor(moving ? 'wave' : 'face', th, t, face) });
      lab.textContent = moving ? '👁️ The visitor looks right… the model turns' : `⏸ Looking ahead: ${FACES[face].n}`;
      if (!moving && k !== face) { k = face; art.innerHTML = `<g>${masmak3D(face * Math.PI / 2 - .5, 190, 150, 62, .4, { noTable: true })}</g>`; sg.setAttribute('class', 'signer sg' + (face % 3)); }
      if (moving && k !== -1) { k = -1; art.innerHTML = ''; }
      cap.textContent = moving ? '…' : (Math.floor(cyc / 2.5) % 2 ? FACES[face].e : FACES[face].ar);
      const snd = moving ? '' : MSND('f' + face);
      if (on && snd && snd !== lastSnd) mPlay(snd);
      lastSnd = snd || lastSnd;
      if (moving) lastSnd = '';
    };
    const loop = now => { t0 = t0 || now; if (!window.DY_HOLD) frame((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    window.DY_ANIM = { draw: frame, period: 56 };
    window.DECK_CLEANUP.push(() => { cancelAnimationFrame(raf); mStop(); window.DY_ANIM = null; });
  },

  systemlab(sl) {
    const $ = id => sl.querySelector('#' + id), info = $('syinfo'); let timers = [];
    const pick = k => { const a = SYS.find(x => x.k === k); sl.querySelectorAll('.anode').forEach(n => n.classList.toggle('sel', n.dataset.k === k));
      info.innerHTML = `<div class="xi1">${a.i}</div><h3>${a.n}</h3><p>${a.d}</p>`; info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop'); };
    sl.querySelectorAll('.anode').forEach(n => n.addEventListener('pointerdown', () => pick(n.dataset.k)));
    $('syplay').onclick = () => { timers.forEach(clearTimeout); timers = []; sl.querySelectorAll('.alink').forEach(l => l.classList.remove('hot'));
      SYS_FLOW.forEach(([k, cap], i) => timers.push(setTimeout(() => { pick(k); $('sycap').textContent = cap; const prev = i ? SYS_FLOW[i - 1][0] : null;
        sl.querySelectorAll('.alink').forEach(l => { if (prev && (l.dataset.l === `${prev}-${k}` || l.dataset.l === `${k}-${prev}`)) l.classList.add('hot'); });
        if (k === 'screen') sl.querySelectorAll('.alink[data-l="pi-screen"]').forEach(l => l.classList.add('hot')); }, i * 1500))); };
    window.DECK_CLEANUP.push(() => timers.forEach(clearTimeout));
  },

  turntablelab(sl) {
    const $ = id => sl.querySelector('#' + id); let cmd = 's', ms = 16, th = 0, raf = 0, last = 0, acc = 0, t = 0;
    sl.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cmd = b.dataset.c; sl.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); });
    sl.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { ms = +b.dataset.m; sl.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); $('ttspr').textContent = AR(200 * ms); });
    $('ttw').oninput = () => { $('ttwv').textContent = AR($('ttw').value); const l = sl.querySelector('.ttright .ln[data-n="2"] .cl-src'); if (l) l.innerHTML = highlight(`int wait = ${$('ttw').value};              // أبطأ = أكبر`); };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt;
      const wait = +$('ttw').value, spr = 200 * ms, sps = 1e6 / (2 * wait), rev = spr / sps;  // خطوات في الثانية
      const stall = ms === 1 && wait < 700, moving = cmd !== 's' && !stall, w = $('ttwarn');
      if (moving) { th += (cmd === 'r' ? 1 : -1) * TAU * sps / spr * dt; acc += sps * dt; }
      const jit = cmd !== 's' && stall ? Math.sin(ts / 15) * .01 : 0;
      $('ttm').innerHTML = masmak3D(th + jit, 400, 300, 128, .42, { ring: ringFor(moving ? 'wave' : 'face', th, t, faceAt(th)) });
      $('tp0').classList.toggle('on', moving && Math.floor(t * 8) % 2 === 0); $('tp1').classList.toggle('on', cmd === 'r'); $('tp2').classList.toggle('on', cmd === 's');
      $('tta').textContent = AR(Math.round((((th % TAU) + TAU) % TAU) * 180 / Math.PI)) + '°'; $('ttt').textContent = AR(Math.round(rev)) + ' s';
      $('ttface').textContent = cmd === 's' ? '⏸ ' + FACES[faceAt(th)].n : '';
      if (stall) { w.className = 'sowarn bad'; w.textContent = '😵 Pulses too fast without microstepping: the motor loses steps and shakes. Slow down or enable microstepping'; }
      else if (cmd === 's') { w.className = 'sowarn ok'; w.textContent = 'EN = HIGH: the motor is disabled and draws no current, so it stays cool at rest'; }
      else { w.className = 'sowarn'; w.textContent = `Each STEP pulse = one step. ${AR(Math.round(sps))} pulses per second; a full turn takes ${AR(Math.round(rev))} s: deliberately slow for the eye to follow`; }
      runLines(sl, '.ttright', cmd === 's' ? [16] : stall ? [12, 13] : [10, 11, 12, 13]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  ledlab(sl) {
    const $ = id => sl.querySelector('#' + id); let mode = 0, raf = 0, t = 0, last = 0, th = 0;
    sl.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { mode = b.dataset.f; sl.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); });
    sl.querySelector('[data-f="0"]').classList.add('on');
    $('lgb').oninput = () => { $('lgbv').textContent = AR($('lgb').value); const l = sl.querySelector('.ttright .ln[data-n="6"] .cl-src'); if (l) l.innerHTML = highlight(`  ring.begin(); ring.setBrightness(${$('lgb').value});`); };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt;
      const isF = /^\d$/.test(mode), f = isF ? +mode : 0, target = f * Math.PI / 2;
      if (isF) { const d = target - (((th % TAU) + TAU) % TAU); th += clamp(Math.atan2(Math.sin(d), Math.cos(d)), -2 * dt, 2 * dt); } else if (mode === 'w') th += dt * .8;
      const ringMode = isF ? 'face' : mode === 'w' ? 'wave' : 'party';
      $('lgm').innerHTML = masmak3D(th, 400, 280, 128, .42, { ring: ringFor(ringMode, th, t, f) });
      const b = +$('lgb').value, lit = isF ? 24 : mode === 'w' ? 8 : 24, ma = Math.round(lit * 60 * b / 255 * (isF ? .6 : .5));
      $('lgma').textContent = AR(ma) + ' mA'; const w = $('lgw');
      if (ma > 900) { w.className = 'sowarn bad'; w.textContent = '⚠️ High current! USB or the board regulator cannot supply it: lower the brightness or power the strip from a separate 5 V supply'; }
      else { w.className = 'sowarn ok'; w.textContent = isF ? `Color “${FACES[f].n}”: the visitor knows the face by its color before hearing the story` : mode === 'w' ? 'A golden wave runs around the turntable while turning' : '🎉 In development: the visitor looked at a face for a long time… so the system rewards them with celebration lights'; }
      $('lgcap').textContent = isF ? FACES[f].n : mode === 'w' ? '🌊 While turning' : '🎉 Interest reward';
      runLines(sl, '.ttright', isF ? [14] : mode === 'w' ? [16, 17, 18, 19] : [6]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  kiosklab(sl) {
    const $ = id => sl.querySelector('#' + id);
    const LEN = [[42, 35], [38, 36], [47, 36], [40, 34]];                       // [الصوت، الفيديو] بالثواني: الفرق بين 2 و11 ثانية كما في تقرير الفريق
    let f = 0, fix = false, t = 0, last = 0, raf = 0;
    const setF = i => { f = i; t = 0; sl.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', +x.dataset.f === i)); const [a, v] = LEN[i];
      $('ktal').textContent = AR(a) + ' s'; $('ktvl').textContent = AR(v) + ' s'; $('kcap1').textContent = FACES[i].ar; $('kcap2').textContent = FACES[i].e; $('kface').textContent = FACES[i].n; $('ksgn').setAttribute('class', 'signer sg' + (i % 3)); };
    sl.querySelectorAll('[data-f]').forEach(b => b.onclick = () => setF(+b.dataset.f));
    $('kfix').onclick = () => { fix = !fix; $('kfix').textContent = fix ? '✅ Extend with last frame' : '❌ No extension'; $('kfix').classList.toggle('on', fix); t = 0; };
    setF(0);
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt * 6;                // ×6 لتسريع العرض
      const [a, v] = LEN[f]; if (t > a + 3) t = 0; const ended = t > v && t <= a;
      $('kmas').innerHTML = (ended && !fix) ? '' : masmak3D(f * Math.PI / 2 - .5 + (ended ? 0 : Math.min(t, v) * .015), 270, 175, 92, .42, { ring: ringFor('face', 0, 0, f) });
      $('kblank').setAttribute('opacity', ended && !fix ? 1 : 0); $('kfrz').setAttribute('opacity', ended && fix ? 1 : 0);
      $('ksgn').style.visibility = ended && !fix ? 'hidden' : 'visible';
      $('ktaud').style.width = clamp(t / a, 0, 1) * 100 + '%'; $('ktvid').style.width = clamp(Math.min(t, v) / a, 0, 1) * 100 + '%';
      $('ktfrz').style.left = v / a * 100 + '%'; $('ktfrz').style.width = fix ? (a - v) / a * 100 + '%' : '0';
      $('ktplay').textContent = `▶ ${AR(Math.min(Math.floor(t), a))} / ${AR(a)} s`;
      const k = $('kinfo'); k.className = 'sowarn ' + (ended ? (fix ? 'ok' : 'bad') : '');
      k.textContent = ended ? (fix ? `❄️ Last frame frozen ${AR(a - v)} s until the audio ends: the interpreter never disappears` : `⚠️ The audio is longer than the video by ${AR(a - v)} s: a black screen, and the deaf visitor lost the interpreter!`) : '🤟 The sign-language video and narration start together: the deaf see, the blind hear';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  udplab(sl) {
    const $ = id => sl.querySelector('#' + id); let hold = false, guard = true, cut = false, last = 0, raf = 0, th = 0, sendT = 0, lastMsg = 0, now = 0, cmd = 's', sent = 0, lost = 0, over = 0, pk = [], released = -1;
    const btn = $('udgo');
    btn.addEventListener('pointerdown', () => { hold = true; btn.classList.add('on'); }); ['pointerup', 'pointerleave'].forEach(e => btn.addEventListener(e, () => { if (hold) released = now; hold = false; btn.classList.remove('on'); }));
    $('udl').oninput = () => $('udlv').textContent = AR($('udl').value) + '%';
    $('udg').onclick = () => { guard = !guard; $('udg').textContent = guard ? '🛡️ Watchdog: on' : '🚫 Watchdog: off'; $('udg').classList.toggle('on', guard); };
    $('udcut').onclick = () => { cut = !cut; $('udcut').textContent = cut ? '🔌 Restore network' : '✂️ Cut the network'; $('udcut').classList.toggle('on', cut); };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; now += dt; sendT -= dt;
      const want = hold ? 'r' : 's';
      if (sendT <= 0 && (hold || now - released < .6)) {                               // يرسل كل 100 ملي ثانية ما دام ينظر، وعدة رسائل s بعد أن يتوقف
        sendT = .1; sent++; const drop = cut || Math.random() * 100 < +$('udl').value; if (drop) lost++;
        pk.push({ c: want, x: 0, drop });
      }
      pk.forEach(p => { p.x += dt * 2.6; if (!p.drop && p.x >= 1 && !p.done) { p.done = 1; cmd = p.c; lastMsg = now; } });
      pk = pk.filter(p => p.x < 1.05 && !(p.drop && p.x > .6));
      $('udpk').innerHTML = pk.map(p => `<g transform="translate(${190 + p.x * 140} ${150 - Math.sin(p.x * Math.PI) * 40})" opacity="${p.drop ? 1 - p.x : 1}"><rect x="-16" y="-14" width="32" height="28" rx="7" fill="${p.drop ? '#e74c3c' : '#f0cc7a'}"/><text y="6" class="udpkt">${p.c}</text></g>`).join('');
      const silent = now - lastMsg;
      if (guard && silent > 1 && cmd !== 's') cmd = 's';
      if (cmd === 'r') { th += dt * .9; if (!hold) over += dt * .9 * 180 / Math.PI; }
      $('udm').innerHTML = masmak3D(th, 625, 185, 58, .42, { ring: ringFor(cmd === 'r' ? 'wave' : 'face', th, now, faceAt(th)) });
      $('udsent').textContent = want; $('udcmd').textContent = cmd;
      $('udwd').setAttribute('width', 240 * clamp(1 - silent, 0, 1)); $('udwd').setAttribute('fill', silent > 1 ? '#e74c3c' : '#2ecc71');
      $('udwdt').textContent = guard ? `last message ${AR(Math.min(9.9, silent).toFixed(1))} s ago` : 'no watchdog';
      $('udns').textContent = AR(sent); $('udnl').textContent = AR(lost); $('udov').textContent = AR(Math.round(over)) + '°';
      const w = $('udw'), runaway = !hold && cmd === 'r';
      w.className = 'sowarn ' + (runaway ? 'bad' : (guard && silent > 1 && !hold && over > 0) ? 'ok' : '');
      w.textContent = runaway ? '😱 The visitor stopped looking but the s message was lost… and the turntable keeps turning!' : guard && silent > 1 ? '🛡️ No messages for over a second: the watchdog stopped the turntable safely' : hold ? 'An r message every 100 ms while the visitor looks right' : 'Press and hold “Look right”, then release. Raise the loss, cut the network, or turn off the watchdog';
      runLines(sl, '.udright', [6, 7, 8].filter(() => silent < .2).concat(guard && silent > 1 ? [10] : [], cmd === 'r' ? [11] : [13]));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  eyelab(sl) {
    const $ = id => sl.querySelector('#' + id), svg = $('eysv');
    let gx = 0, gy = 0, center = 0, calT = 0, blinkT = 0, longT = 0, swap = false, th = 0, last = 0, raf = 0, video = '—', still = 0, t = 0;
    const mesh = []; for (let i = 0; i < 70; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); mesh.push([320 + Math.cos(a) * r * 175, 215 + Math.sin(a) * r * 220]); }
    $('eymesh').innerHTML = mesh.map(([x, y]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.2" class="lmesh"/>`).join('');
    svg.addEventListener('pointermove', e => { const r = svg.getBoundingClientRect(); gx = clamp(((e.clientX - r.left) / r.width - .5) * 2.2, -1, 1); gy = clamp(((e.clientY - r.top) / r.height - .45) * 2.4, -1, 1); });
    svg.addEventListener('pointerleave', () => { gx = 0; gy = 0; });
    $('eycal').onclick = () => { calT = 2.5; };
    $('eyblink').onclick = () => { blinkT = .25; };
    $('eylong').onclick = () => { longT = 1.4; };
    $('eyidx').onclick = () => { swap = !swap; $('eyidx').textContent = swap ? '🔢 Indices: documented (wrong!)' : '🔢 Indices: correct'; $('eyidx').classList.toggle('on', swap); };
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt;
      calT = Math.max(0, calT - dt); blinkT = Math.max(0, blinkT - dt); const wasLong = longT > 0; longT = Math.max(0, longT - dt);
      const closed = blinkT > 0 || longT > 0, calib = calT > 0;
      const ix = calib ? 0 : gx, iy = calib ? 0 : gy;
      ['L', 'R'].forEach(s => { $('eyi' + s).setAttribute('transform', `translate(${ix * 34} ${iy * 12})`); $('eyd' + s).setAttribute('cx', ix * 34); $('eyd' + s).setAttribute('cy', iy * 12);
        $('eyl' + s).setAttribute('d', closed ? 'M-66 0 Q 0 46 66 0 Q 0 -46 -66 0 Z' : 'M-66 0 Q 0 -46 66 0 Q 0 -40 -66 0 Z'); });
      $('eyxL').textContent = swap ? '468?' : '473'; $('eyxR').textContent = swap ? '473?' : '468';
      if (calib) center = 0;
      let ratio = .5 - ix * .25 * (swap ? -1 : 1), c = 's', st;
      if (calib) { st = `🎯 Look ahead… ${AR(calT.toFixed(1))}`; }
      else if (closed) { c = 's'; st = longT > 0 ? '😌 Deliberate long close' : '😑 Blink: safety stop'; }
      else if (ratio < .42) { c = 'r'; st = '👉 Looking right'; }
      else if (ratio > .58) { c = 'l'; st = '👈 Looking left'; }
      else if (iy < -.45) { c = 's'; st = '⬆ Looking up: the gate'; }
      else st = '👁️ Looking ahead';
      if (c !== 's') { th += (c === 'r' ? 1 : -1) * dt * .9; still = 0; video = '—'; } else still += dt;
      if (!calib && !closed && iy < -.45) video = GATE.n;
      else if (wasLong && longT === 0) video = 'Explain: ' + FACES[faceAt(th)].n;
      else if (c === 's' && still > .6 && !closed && video === '—') video = FACES[faceAt(th)].n;
      $('eym').innerHTML = masmak3D(th, 260, 150, 70, .42, { ring: ringFor(c !== 's' ? 'wave' : 'face', th, t, faceAt(th)), gateGlow: video === GATE.n });
      $('eyface').textContent = c === 's' ? FACES[faceAt(th)].n : '';
      $('eyr').textContent = AR(ratio.toFixed(2)); $('eyc').textContent = c; $('eyv').textContent = video; $('eyst').textContent = st;
      runLines(sl, '.eyright', calib ? [] : [1, closed ? 4 : c === 'r' ? 6 : c === 'l' ? 8 : iy < -.45 ? 10 : 12, 13]);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },

  tourlab(sl) {
    const $ = id => sl.querySelector('#' + id); let state = 'idle', cx = 110, th = 0, gaze = 's', gT = 0, last = 0, raf = 0, t = 0, logs = [], interest = [0, 0, 0, 0], still = 0, shown = -1, upT = 0;
    const say = s => { logs.unshift(`<div>${s}</div>`); $('tolog').innerHTML = logs.slice(0, 8).join(''); };
    $('tolog').innerHTML = '<div>▶ Press “Start the tour” to see a full visitor experience</div>';
    $('tostart').onclick = () => { state = 'welcome'; cx = 110; th = 0; logs = []; interest = [0, 0, 0, 0]; shown = -1; t = 0; say('📷 The camera saw a face: a welcome in Arabic and English'); $('toscr').textContent = 'Welcome'; setTimeout(() => { if (state === 'welcome') { state = 'drive'; say('🦽 “Drive mode”: the chair brings the visitor to the model'); } }, 1800); };
    sl.querySelectorAll('[data-g]').forEach(b => { b.addEventListener('pointerdown', () => { gaze = b.dataset.g; gT = 99; b.classList.add('on'); }); ['pointerup', 'pointerleave'].forEach(e => b.addEventListener(e, () => { if (gaze === b.dataset.g) { gaze = 's'; } b.classList.remove('on'); })); });
    const loop = ts => {
      const dt = Math.min(50, ts - (last || ts)) / 1000; last = ts; t += dt;
      if (state === 'drive') { cx += dt * 90; if (cx >= 300) { cx = 300; state = 'explore'; say('📏 Distance sensor: under 40 cm → “explore mode” (next step)'); say('👁️ Now the eye drives the model: look right or left'); } }
      if (state === 'explore') {
        if (gaze === 'r' || gaze === 'l') { th += (gaze === 'r' ? 1 : -1) * dt * .9; still = 0; if (shown !== -1) { shown = -1; $('toscr').textContent = ''; } }
        else { still += dt; const f = faceAt(th);
          if (gaze === 'u') { if (upT === 0) say('⬆ Looked up: the gate content plays without turning'); upT += dt; $('toscr').textContent = GATE.n; }
          else { upT = 0; if (still > .5 && shown !== f) { shown = f; say(`⏸ Gaze held → stop · sign-language video and narration “${FACES[f].n}»`); $('toscr').textContent = FACES[f].n; } if (shown === f) interest[f] += dt; }
          if (interest.every(v => v > 1.5) && state === 'explore') { state = 'done'; const best = interest.indexOf(Math.max(...interest)); say(`🏁 Tour summary (in development): what caught you most: “${FACES[best].n}»`); say('🌍 Finale: a question and answer in English from the team'); }
        }
      }
      const f = faceAt(th), moving = state === 'explore' && (gaze === 'r' || gaze === 'l');
      $('tom').innerHTML = masmak3D(th, 600, 340, 118, .42, { ring: ringFor(moving ? 'wave' : interest[f] > 4 ? 'party' : 'face', th, t, f), gateGlow: gaze === 'u' && state === 'explore' });
      $('toch').setAttribute('transform', `translate(${cx} 470)`);
      $('todist').setAttribute('opacity', state === 'drive' || state === 'explore' ? 1 : 0); $('todl').setAttribute('x1', cx + 30); $('todl').setAttribute('y1', 460); $('todl').setAttribute('x2', 430); $('todl').setAttribute('y2', 430);
      const d = Math.round((430 - cx) * .4); $('todt').setAttribute('x', (cx + 430) / 2); $('todt').setAttribute('y', 425); $('todt').textContent = state === 'drive' || state === 'explore' ? AR(Math.max(0, d)) + ' cm' : '';
      $('tomode').textContent = { idle: 'Press Start the tour', welcome: '👋 Welcome', drive: '🦽 Drive mode', explore: '👁️ Explore mode', done: '🏁 Tour finished' }[state];
      interest.forEach((v, i) => $('toi' + i).style.width = clamp(v / 8, 0, 1) * 100 + '%');
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.DECK_CLEANUP.push(() => cancelAnimationFrame(raf));
  },
});
})();
