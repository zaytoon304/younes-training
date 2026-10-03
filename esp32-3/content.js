/* =====================================================================
   «ESP32 للمعلمين — الجزء الثالث: أكاديمية الروبوت»
   سلّم من سبعة روبوتات: كل روبوت = السابق + قطعة جديدة… حتى روبوت كرة القدم بثلاثة محركات
   الأدوات: أدوات الأردوينو العامة + أدوات ESP32 (الجزأين ١ و٢) + أدوات الجزء الثالث (widgetsG*)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'ESP32 للمعلمين ٣',
  subtitle: 'أكاديمية الروبوت: من السيارة الأولى… إلى ملعب كرة القدم',
  tag: 'سلّم الروبوتات السبعة',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-parts', '02-build', '03-car', '04-joy', '05-sonar', '06-line', '07-combo', '08-sumo', '09-smart', '10-omni', '11-kiwi', '12-soccer', '13-match', '14-final'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
