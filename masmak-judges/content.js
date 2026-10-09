/* =====================================================================
   «المصمك أمام لجنة التحكيم» — عرض مختصر لمشروع «لمسة تراث» أمام المحكّمين
   لا محتوى منسوخ: الشرائح تُقرأ من دورة turath نفسها ثم يختار pick.js منها بالترتيب
   (كل تحديث في الدورة يصل إلى هذا العرض تلقائيًا)
   ===================================================================== */
(function (root) {
root.DECK = {
  title: 'لمسة تراث',
  subtitle: 'قصر المصمك التفاعلي الشامل',
  tag: 'WRO 2026 · Future Innovators · عرض لجنة التحكيم',
  author: 'فريق al arqam innovators · مدارس الأرقم',
  sectionLabel: 'المحور',
  mapStart: 0,
  parts: ['00-open', '01-system', '02-esp32', '03-turntable', '04-leds', '05-screen', '06-udp', '07-eyes', '08-tour', '09-flame', '10-gas', '11-station', '12-car', '12b-relay', '13-espnow', '14-decision', '15a-path', '15b-mission', '15c-alert', '15d-firefighter', '16-final']
    .map(p => '../../turath/parts/' + p).concat(['../pick']),
  modules: [],
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.DECK;
})(typeof window !== 'undefined' ? window : globalThis);
