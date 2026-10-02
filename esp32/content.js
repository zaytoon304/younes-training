/* =====================================================================
   «ESP32 للمعلمين — الجزء الأول» — بنفس خطوات دورة «الأردوينو للمعلمين» الأولى محورًا بمحور
   الأدوات: أدوات الأردوينو العامة (الرموز، لوح التوصيل، المقاومة…) + أدوات ESP32 (widgetsE*.js)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'ESP32 للمعلمين',
  subtitle: 'الجزء الأول: من أول وميض… إلى أول مشروع يصنعه طلابك',
  tag: 'مغامرات ESP32',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-what', '02-board', '03-power-ide', '04-wokwi', '05-circuits', '06-ohm', '07-blink', '08-traffic', '09-pwm-rgb', '10-buttons-touch', '11-final'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
