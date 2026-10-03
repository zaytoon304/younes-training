/* =====================================================================
   «ESP32 للمعلمين — الجزء الثاني: يحسّ… يتحرك… ويتصل بالعالم»
   كل مشروع من دورة «الأردوينو ٢» يُبنى هنا على ESP32 ثم يُوصَل بالجوال والشبكة
   الأدوات: أدوات الأردوينو العامة + أدوات ESP32 الأولى + «الشرح الوافي» (widgetsE3) + أدوات الجزء الثاني (widgetsF*)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'ESP32 للمعلمين ٢',
  subtitle: 'الجزء الثاني: يحسّ… يتحرك… ويتصل بالعالم',
  tag: 'مغامرات ESP32 المتصلة',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-analog', '02-ldr', '03-dht', '04-sonar', '05-pir-sound', '06-servo', '07-motor', '08-wifi', '09-web', '10-dashboard', '11-espnow', '12-car', '13-final'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
