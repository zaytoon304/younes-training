/* =====================================================================
   «الأردوينو للمعلمين — الجزء الثاني: الحساسات والمحركات» — ملف المحتوى الرئيسي
   المحتوى مقسّم على ملفات parts/ (محور لكل ملف) بالترتيب المذكور هنا.
   الأدوات التفاعلية: أدوات الجزء الأول (../arduino/widgets.js) + أدوات هذا الجزء (widgets2.js)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'الأردوينو للمعلمين — الجزء الثاني',
  subtitle: 'الحساسات والمحركات: حين يحسّ الأردوينو بالعالم… ويحرّكه',
  tag: 'مغامرات الأردوينو ٢',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-analog', '02-ldr', '03-temp', '04-sonar', '05-pir-ir', '06-sound', '07-servo', '08-dc', '09-stepper', '10-robot', '11-final'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
