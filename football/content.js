/* =====================================================================
   سيارة كرة القدم الأومني — الدورة السادسة في سلسلة الأردوينو للمعلمين
   ٣ عجلات أومني · دريفر L9110S · ESP32 · ESP-NOW
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'سيارة كرة القدم الأومني',
  subtitle: 'ثلاث عجلات تتحرك في كل الاتجاهات — نبني روبوتًا يلعب كرة القدم',
  tag: 'الأردوينو للمعلمين · الدورة السادسة',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: [
    '00-open', '01-omni', '02-parts', '03-driver',
    '04-wiring', '04b-chassis', '05-setup', '06-motor', '07-car',
    '08-espnow', '09-joystick', '10-servo', '11-lab', '12-final'
  ],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
