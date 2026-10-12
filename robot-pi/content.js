/* =====================================================================
   دورة «روبوتي الذكي» — نبني الروبوت «نبيه» على Raspberry Pi 4
   للطلاب من الصف الرابع إلى السادس الابتدائي.
   المحتوى مقسّم على ملفات parts/ (وحدة لكل ملف) بالترتيب المذكور هنا.
   الأدوات التفاعلية الخاصة بالدورة في widgets.js
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'روبوتي الذكي',
  subtitle: 'نبني معًا «نبيه»… الروبوت الذي يمشي ويرى ويتكلم',
  tag: 'مغامرات نبيه',
  author: 'أ. محمد زيتون',
  sectionLabel: 'الوحدة',
  mapStart: 0,
  parts: ['00-open', '01-pi', '02-setup', '03-python', '04-gpio', '05-motors', '06-sonar', '07-camera', '08-faces', '09-voice'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
