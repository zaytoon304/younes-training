/* =====================================================================
   «صانع الذكريات التراثية» — الدورة السادسة في سلسلة الأردوينو للمعلمين
   مبنية على ملف فريق Al arqam inventors في WRO 2026 · Future Innovators · Elementary
   المنهج: كل مكوّن وحده (فكرته، توصيله، كوده) ← ثم دمجه مع ما قبله ← حتى المشروع الكامل
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'صانع الذكريات التراثية',
  subtitle: 'تراث نعيشه… وذكرى نحملها',
  tag: 'الأردوينو للمعلمين · الدورة السادسة',
  author: 'أ. محمد زيتون',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-system', '02-sonar', '03-lcd', '04-buttons', '05-stepper', '06-calib', '07-sound', '08-answer', '09-coin', '10-power', '11-states', '12-decision', '13-tour', '14-booth'],
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
