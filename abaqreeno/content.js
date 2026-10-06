/* =====================================================================
   عبقرينو — لعبة الشبكة الذكية
   شبكة ٣×٣ · جزء أول (أزرار) · جزء ثانٍ (يد سحرية + MediaPipe)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'عبقرينو',
  subtitle: 'لعبة الذكاء الرياضي — شبكة الأرقام السحرية بالأزرار واليد',
  tag: 'منصة جذور · ألعاب تعليمية',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: [
    '00-open',
    '01-concept',
    '02-grid',
    '03-math',
    '04-play',
    '05-levels',
    '06-firebase',
    '07-hand',
    '08-mediapipe',
    '09-gestures',
    '10-handlevels',
    '11-classroom',
    '12-final'
  ],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
