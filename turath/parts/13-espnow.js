/* المحور ١٣: ESP-NOW — المحطة تكلّم السيارة */
DECK.modules.push({ id: 'espnow', name: '📡 ESP-NOW', slides: [
  { t: 'section', num: '١٣', title: '📡 المحطة تكلّم السيارة', sub: 'ESP-NOW: رسالة مباشرة… بلا راوتر ولا إنترنت',
    notes: 'هذه اللحظة التي يتحول فيها المشروع من جهازين منفصلين إلى نظام واحد.' },
  { t: 'numlist', kicker: '🎯 بنهاية هذا المحور تستطيع أن', title: 'أهداف المحور',
    items: [
      { h: 'تعرف عنوان MAC لجهازك وتستخدمه' },
      { h: 'تصمم رسالة بـ struct فيها النوع والشدة والمنطقة' },
      { h: 'ترسل من المحطة وتستقبل في السيارة' },
    ]},
  { t: 'table', kicker: 'لماذا ESP-NOW؟', title: 'ثلاث طرق لربط جهازين',
    head: ['', 'واي فاي وإنترنت', 'بلوتوث', 'ESP-NOW'], widths: ['0.8fr', '1fr', '1fr', '1fr'],
    rows: [
      ['🛜 يحتاج راوتر؟', 'نعم', 'لا', 'لا'],
      ['⏱️ السرعة', 'بطيء نسبيًا', 'متوسط', 'أجزاء من الثانية'],
      ['📏 المدى', 'حسب الراوتر', 'قصير', 'حتى ٢٠٠ م في المكشوف'],
      ['🔗 الاقتران', 'كلمة مرور', 'اقتران', 'عنوان MAC فقط'],
    ],
    notes: 'في المعارض لا يوجد راوتر غالبًا، أو يكون مزدحمًا. ESP-NOW يعمل في أي مكان: مثالي لمشروع يُعرض في المدرسة والمعارض.' },
  { t: 'cards', kicker: 'ثلاث كلمات', title: 'العنوان… والرسالة… والتأكيد', cols: 3,
    cards: [
      { icon: '🏷️', h: 'MAC', b: 'رقم فريد لكل ESP32 مثل رقم الهوية: EC:E3:34:08:BE:D8' },
      { icon: '📦', h: 'struct', b: 'صندوق نرتب فيه البيانات: النوع والشدة والمنطقة' },
      { icon: '✅', h: 'Callback', b: 'دالة تُستدعى تلقائيًا حين تصل الرسالة' },
    ],
    notes: 'لمعرفة عنوان MAC: ارفع كودًا صغيرًا على السيارة يطبع WiFi.macAddress() في setup. انسخوه بدقة؛ حرف واحد خطأ = لا رسائل.' },
  { t: 'espnowlab', title: 'أرسل إنذارًا… وشاهد الرسالة تطير',
    notes: 'اضغط «لهب A»: الحزمة تطير من المحطة إلى السيارة، وتضيء أسطر الإرسال ثم أسطر الاستقبال، ويظهر في السجل زمن الوصول بالملي ثانية. اسأل: «لماذا نرسل المنطقة مع النوع؟» لأن السيارة تحتاج أن تعرف أين تذهب، لا ماذا حدث فقط.' },
  { t: 'code', reveal: true, kicker: '✍️ المحطة: المرسل', title: 'المحطة ترسل الإنذار', file: 'MasmakStation.ino',
    code: `#include <esp_now.h>
#include <WiFi.h>
typedef struct { int type; int level; int zone; } Msg;
uint8_t carMAC[] = {0xEC,0xE3,0x34,0x08,0xBE,0xD8};
Msg m;

void setup() {
  WiFi.mode(WIFI_STA);
  esp_now_init();
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, carMAC, 6);
  esp_now_add_peer(&peer);
}

void alarmCar(int type, int level, int zone) {
  m.type = type; m.level = level; m.zone = zone;
  esp_now_send(carMAC, (uint8_t*)&m, sizeof(m));
}`,
    steps: [
      { lines: [1, 2], text: 'مكتبتان مدمجتان في حزمة ESP32: لا تثبيت' },
      { lines: [3], text: 'شكل الرسالة: نوع الحدث (١ لهب، ٢ غاز)، وشدته، ومنطقته' },
      { lines: [4], text: 'عنوان السيارة: ستة أرقام بالنظام السداسي عشر' },
      { lines: [8, 9], text: 'وضع المحطة (STA) ثم تشغيل ESP-NOW' },
      { lines: [10, 11, 12], text: 'نسجّل السيارة «صديقًا» نرسل إليه' },
      { lines: [16, 17], text: 'نملأ الصندوق ونرسله' },
    ],
    notes: 'لا ترسلوا في كل دورة loop! أرسلوا مرة حين يبدأ الحدث فقط (حين يتغير fire من false إلى true). وإلا أغرقتم السيارة بمئات الرسائل في الثانية.' },
  { t: 'code', reveal: true, kicker: '✍️ السيارة: المستقبل', title: 'السيارة تسمع… وتتجهز', file: 'FireCar.ino',
    code: `typedef struct { int type; int level; int zone; } Msg;
Msg m;
volatile bool newAlarm = false;

void onReceive(const esp_now_recv_info *info,
               const uint8_t *data, int len) {
  memcpy(&m, data, sizeof(m));
  newAlarm = true;
}

void setup() {
  WiFi.mode(WIFI_STA);
  esp_now_init();
  esp_now_register_recv_cb(onReceive);
}`,
    steps: [
      { lines: [1], text: 'نفس شكل الرسالة تمامًا: حرفًا بحرف' },
      { lines: [3], text: 'علم صغير: «وصل إنذار جديد». و<code>volatile</code> لأنه يتغير من خارج loop' },
      { lines: [5, 6, 7], text: 'تُستدعى تلقائيًا عند الوصول: ننسخ البيانات إلى m' },
      { lines: [8], text: 'نرفع العلم فقط… ولا نقود السيارة داخل هذه الدالة!' },
      { lines: [14], text: 'نسجل الدالة لتُستدعى عند كل رسالة' },
    ],
    notes: 'قاعدة ذهبية: دالة الاستقبال تعمل في سياق خاص، فيجب أن تكون قصيرة جدًا. لا delay ولا قيادة. نرفع علمًا، وloop تتصرف. هذا نمط احترافي اسمه «العلم» Flag. ملاحظة: في حزمة ESP32 القديمة (2.x) تبدأ الدالة بـ const uint8_t *mac بدل info.' },
  { t: 'codecheck', title: 'صح أم خطأ؟ ESP-NOW',
    items: [
      { code: 'struct مختلف بين المحطة والسيارة', ok: false, why: 'يجب أن يتطابقا تمامًا وإلا فسدت البيانات' },
      { code: 'WiFi.mode(WIFI_STA);', ok: true, why: 'ESP-NOW يحتاج الواي فاي مفعّلًا بلا اتصال' },
      { code: 'delay(4000) داخل onReceive', ok: false, why: 'دالة الاستقبال قصيرة: ارفع علمًا فقط' },
      { code: 'إرسال الإنذار مرة عند بدء الحدث', ok: true, why: 'لا نغرق السيارة بالرسائل' },
    ]},
  { t: 'vote', tap: true, kicker: '✅ اختبر نفسك', title: 'المحطة ترسل لكن السيارة لا تستقبل شيئًا. ما أول ما تفحصه؟', correct: 1,
    options: ['البطارية', 'عنوان MAC للسيارة في كود المحطة', 'شاشة LCD'],
    why: [
      'ممكن، لكن السيارة تعمل وتضيء',
      'صحيح: حرف واحد خطأ في العنوان يكفي لضياع كل الرسائل',
      'الشاشة لا علاقة لها بالإرسال',
    ]},
  { t: 'glossary', title: 'مصطلحات المحور الثامن',
    terms: [
      { en: 'ESP-NOW', ar: 'الاتصال المباشر', b: 'بروتوكول من Espressif بلا راوتر' },
      { en: 'MAC Address', ar: 'العنوان الفيزيائي', b: 'هوية فريدة لكل لوحة' },
      { en: 'Peer', ar: 'الصديق', b: 'الجهاز المسجل للإرسال إليه' },
      { en: 'struct', ar: 'البنية', b: 'صندوق يجمع عدة قيم' },
      { en: 'Callback', ar: 'دالة الاستدعاء', b: 'تُنفذ تلقائيًا عند حدث' },
      { en: 'Flag', ar: 'العلم', b: 'متغير يقول «حدث شيء»' },
    ]},
  { t: 'statement', kicker: 'خلاصة المحور',
    text: 'ستة أرقام عنوانًا، وصندوق صغير رسالةً: والسيارة تسمع المحطة من آخر الساحة',
    notes: 'المحور التالي: السيارة تسمع… لكن ماذا لو جاءها إنذاران؟ عليها أن تقرر.' },
]});
