/* =====================================================================
   «لمسات تراث: حراسة المصمك بالروبوتات الذكية» — الدورة الخامسة في سلسلة الأردوينو للمعلمين
   مبنية على مشروع أ. محمد زيتون الحقيقي: محطة أمان للهب والغاز على ESP32 + سيارة روبوت تقرر وتُطفئ
   الأدوات: أدوات الأجزاء السابقة + أدوات هذه الدورة (widgetsT*.js)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'لمسة تراث',
  subtitle: 'قصر المصمك التفاعلي الشامل: العين تقود… والروبوت يحرس',
  tag: 'الأردوينو للمعلمين · الدورة الخامسة',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-system', '02-esp32', '03-turntable', '04-leds', '05-screen', '06-udp', '07-eyes', '08-tour', '09-flame', '10-gas', '11-station', '12-car', '12b-relay', '13-espnow', '14-decision', '15a-path', '15b-mission', '16-final'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
