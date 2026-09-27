/* =====================================================================
   دورة «الأردوينو للمعلمين» — ملف المحتوى الرئيسي
   المحتوى مقسّم على ملفات parts/ (محور لكل ملف) بالترتيب المذكور هنا.
   الأدوات التفاعلية الخاصة بالدورة في widgets.js
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'الأردوينو للمعلمين',
  subtitle: 'من أول دائرة… إلى أول مشروع يصنعه طلابك',
  tag: 'مغامرات الأردوينو',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-what', '02-board', '03-power-ide', '04-tinkercad', '05-circuits', '06-components', '07-blink'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
