/* =====================================================================
   دورة «مواقف صفية» — ملف المحتوى الرئيسي
   منه يُبنى العرض داخل منصة جذور، ويُبنى ملف البوربوينت أيضًا،
   فيبقى الاثنان متطابقين دائمًا.

   المحتوى نفسه مقسّم على ملفات في مجلد parts/ (محطة لكل ملف)،
   وترتيبها هنا في «parts». كل ملف يضيف محطته بـ MAWAQIF.modules.push(...)
   كل شريحة: { t: نوع الشريحة, ...بياناتها, notes: ملاحظات المدرب }
   ===================================================================== */
(function (root) {
const MAWAQIF = root.MAWAQIF = {
  title: 'مواقف صفية',
  subtitle: 'من ردّة الفعل… إلى التصرّف الواعي',
  tag: 'الإدارة الصفية التطبيقية',
  author: 'أ. محمد زيتون',
  parts: [
    '01-intro', '02-niyyah', '03-open', '04-myths', '05-toolbox',
    '06-leadership', '07-rules', '08-family', '09-digital', '10-clinic',
  ],
  modules: [],
};

/* ---------------------------------------------------------------------
   بناء «بطاقة التدخّل» لأي موقف بترتيب ثابت:
   الغلاف ← القصة ← التصويت ← لماذا؟ ← أول خطوة ← ماذا تقول؟
   ← (سلّم التدخّل اختياري) ← الخطأ والبديل ← (شرائح إضافية) ← الخلاصة
   --------------------------------------------------------------------- */
MAWAQIF.scenario = function (d) {
  const img = d.img ? `assets/scenes/${d.img}.jpg` : null;
  const S = [];
  S.push({ t: 'mcover', num: d.num, cat: d.cat, title: d.title, icon: d.icon, img,
    notes: d.coverNotes || 'اعرض الصورة واسأل: «ماذا تتوقعون أن يحدث هنا؟» — دقيقة واحدة فقط لتشويق القاعة قبل القصة.' });
  S.push({ t: 'story', title: d.story.title || 'ماذا حدث؟', paras: d.story.paras, img,
    notes: d.story.notes || 'اقرأ القصة بنبرة تمثيلية، فقرة فقرة مع كل نقرة، وتوقف عند الجملة الأخيرة ثوانيَ قبل الانتقال.' });
  S.push({ t: 'vote', kicker: 'صوّت قبل أن نكشف', title: d.vote.title, options: d.vote.options, correct: d.vote.correct, why: d.vote.why,
    notes: d.vote.notes || 'اطلب رفع الأيدي لكل خيار، أو ناقش في المجموعات دقيقتين. ثم اكشف الإجابة ومعها سبب كل خيار.' });
  S.push({ t: 'why', title: d.why.title || 'لماذا يحدث هذا؟', sub: d.why.sub || 'وراء كل سلوك حاجة', causes: d.why.causes, key: d.why.key,
    notes: d.why.notes || 'اسأل القاعة أولًا: «ما الأسباب المحتملة؟»، ثم اكشف البطاقات واحدة واحدة وقارن بإجاباتهم.' });
  S.push({ t: 'first10', title: d.first.title || 'أول ١٠ ثوانٍ', sub: d.first.sub || 'ماذا تفعل فورًا؟', clock: d.first.clock, steps: d.first.steps,
    notes: d.first.notes || 'مثّل الخطوات أمامهم فعليًا إن أمكن؛ التمثيل هنا أقوى من أي شرح.' });
  S.push({ t: 'script', kicker: 'الجُمل الجاهزة', title: 'ماذا تقول بالحرف؟', lines: d.script.lines, warn: d.script.warn,
    notes: d.script.notes || 'اطلب من متدربَين تمثيل الحوار: أحدهما المعلم والآخر الطالب. ثم اسأل «الطالب»: كيف شعرت؟' });
  if (d.ladder) S.push({ t: 'ladder', title: 'سلّم التدخّل', sub: 'اصعد درجة فقط إذا لم تنجح التي قبلها', steps: d.ladder.steps,
    notes: d.ladder.notes || 'أكّد: لا تقفز إلى الدرجات العليا مبكرًا، فتستهلك أقوى أدواتك في البداية.' });
  S.push({ t: 'dodont', title: d.dodont.title || 'أخطاء شائعة… وبدائلها', rows: d.dodont.rows,
    notes: d.dodont.notes || 'اعرض الخطأ أولًا، واطلب من القاعة اقتراح البديل قبل كشفه، ثم اكشفه بنقرة.' });
  (d.extra || []).forEach(x => S.push(x));
  S.push({ t: 'statement', kicker: 'خلاصة الموقف', text: d.statement,
    notes: d.statementNotes || 'اطلب من كل متدرب أن يكتب جملة واحدة سيقولها غدًا لو واجه الموقف نفسه.' });
  return { id: d.id, name: 'موقف: ' + d.title, slides: S };
};

if (typeof module !== 'undefined' && module.exports) module.exports = MAWAQIF;
})(typeof window !== 'undefined' ? window : globalThis);
