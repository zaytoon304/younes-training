/* المحور ٥: كود الإعداد — الخطوات قبل الحركة */
DECK.modules.push({ id: 'setup', name: 'كود الإعداد', slides: [
  { t: 'section', num: '٥', title: 'كود الإعداد',
    sub: 'قبل أي حركة — ESP32 يتعرّف على نفسه',
    notes: 'قل: «setup() تعمل مرة واحدة فقط عند التشغيل. مثل تهيئة الجندي قبل المعركة — يلبس بدلته ويتعرف على بندقيته».' },

  /* --- المكتبات: كل مكتبة بشريحة مستقلة مع طريقة التثبيت --- */
  { t: 'cards', kicker: '📦 المكتبة الأولى', title: 'مكتبة ESP-NOW — التحكم اللاسلكي',
    cards: [
      { icon: '❓', h: 'ما دورها؟', b: 'تُتيح لـ ESP32 إرسال واستقبال البيانات مباشرةً لجهاز آخر — بدون واي فاي ولا إنترنت ولا راوتر.' },
      { icon: '✅', h: 'هل تحتاج تثبيتًا؟', b: 'لا! هي مدمجة مع حزمة ESP32 التي ثبّتها مسبقًا. فقط اكتب #include <esp_now.h> في الكود.' },
      { icon: '💻', h: 'السطر في الكود', b: '#include <esp_now.h>' },
    ],
    notes: 'إذا ظهر خطأ "esp_now.h not found": اذهب للـ Boards Manager وتأكد أن ESP32 by Espressif مثبّتة.' },

  { t: 'cards', kicker: '📦 المكتبة الثانية', title: 'مكتبة WiFi — أساس الاتصال',
    cards: [
      { icon: '❓', h: 'ما دورها؟', b: 'ESP-NOW يعتمد عليها من تحت حتى لو لم نتصل بالإنترنت. يحتاجها ليضع ESP32 في وضع WIFI_STA.' },
      { icon: '✅', h: 'هل تحتاج تثبيتًا؟', b: 'لا! مدمجة أيضًا. فقط أضفها في الكود.' },
      { icon: '💻', h: 'السطر في الكود', b: '#include <WiFi.h>' },
    ],
    notes: 'سؤال للمتدربين: لماذا نضم مكتبة WiFi بينما نحن لا نستخدم الإنترنت؟ الإجابة: لأن ESP-NOW مبنية فوقها.' },

  { t: 'cards', kicker: '📦 المكتبة الثالثة', title: 'مكتبة ESP32Servo — التحكم في السيرفو',
    cards: [
      { icon: '❓', h: 'ما دورها؟', b: 'تضيف دالة servo.write() التي تحوّل الزاوية (مثل ١٢٠) إلى إشارة PWM يفهمها سيرفو MG996R.' },
      { icon: '⬇️', h: 'كيف تثبّتها؟', b: 'في Arduino IDE:\n١- افتح Sketch → Include Library → Manage Libraries\n٢- ابحث عن: ESP32Servo\n٣- اختر المكتبة باسم "ESP32Servo" by Kevin Harrington\n٤- اضغط Install وانتظر' },
      { icon: '💻', h: 'السطر في الكود', b: '#include <ESP32Servo.h>' },
    ],
    notes: 'هذه هي المكتبة الوحيدة التي تحتاج تثبيتًا يدويًا. اعطِ المتدربين ٣ دقائق لتثبيتها قبل المتابعة.' },

  { t: 'code', reveal: true, kicker: '💻 كود setup() — لنقرأه معًا سطرًا بسطر', title: 'إعداد السيارة الأومنية',
    file: 'OmniCar.ino',
    code: `#include <esp_now.h>
#include <WiFi.h>
#include <ESP32Servo.h>

/* ===== أرجل L9110S (ابدل بأرجل L298N إذا استخدمته) ===== */
#define IA1 27  #define IB1 26  // محرك ١ أمامي
#define IA2 25  #define IB2 33  // محرك ٢ يمين-خلف
#define IA3 32  #define IB3 14  // محرك ٣ يسار-خلف
#define SERVO_PIN 13

Servo servo;

typedef struct {
  int vx, vy, rot;
  bool kick;
} OmniData;

OmniData data;

void setup() {
  WiFi.mode(WIFI_STA);
  Serial.begin(115200);
  Serial.println(WiFi.macAddress());
  int pins[] = {IA1,IB1,IA2,IB2,IA3,IB3};
  for (int p : pins) pinMode(p, OUTPUT);
  servo.attach(SERVO_PIN);
  servo.write(0);
  esp_now_init();
  esp_now_register_recv_cb(onReceive);
}`,
    steps: [
      { lines: [1], text: '📦 #include <esp_now.h> — ندخل مكتبة التواصل اللاسلكي التي شرحناها. بدونها: ESP32 لا يعرف كيف يتكلم مع الجويستيك.' },
      { lines: [2], text: '📦 #include <WiFi.h> — ندخل مكتبة الواي فاي. لا نتصل بالإنترنت، لكن ESP-NOW تطلبها لأنها تعمل فوقها. مثل تشغيل التلفاز بدون ضبط قناة.' },
      { lines: [3], text: '📦 #include <ESP32Servo.h> — مكتبة السيرفو التي ثبّتناها من Library Manager. تمنحنا دالة servo.write() بسطر واحد.' },
      { lines: [6, 7, 8, 9], text: '📌 نعرّف أرقام الأرجل هنا مرة واحدة فقط. إذا غيّرت التوصيل غدًا، تغيّر هذا السطر فقط ولا تبحث في باقي الكود.' },
      { lines: [11], text: '🦾 نصنع كائن servo. مثل قلم: تُعلن عنه أولًا قبل أن تستخدمه في أي مكان في الكود.' },
      { lines: [13, 14, 15, 16], text: '📦 هذا الصندوق (struct) هو الرسالة بين الجويستيك والسيارة. vx = يمين/يسار، vy = أمام/خلف، rot = دوران، kick = تسديد.' },
      { lines: [18], text: '📦 نصنع نسخة من الصندوق اسمها data. هنا ستُخزَّن البيانات القادمة لاسلكيًا من الجويستيك.' },
      { lines: [21], text: '📡 WIFI_STA = وضع المستخدم (Station). ESP-NOW يحتاج هذا الوضع. لا نريد اتصالًا بالإنترنت، لكن الكتبة تطلب هذا الإعداد.' },
      { lines: [22, 23], text: '🖥️ Serial.begin يفتح شاشة الـ Serial Monitor. ثم نطبع العنوان MAC — رقم هوية ESP32. نحتاجه لاحقًا لإخبار الجويستيك: «أرسل لهذا العنوان».' },
      { lines: [24, 25], text: '⚙️ نجمع كل الأرجل في مصفوفة ونجعلها مخرجات بحلقة واحدة. أقصر من كتابة pinMode ست مرات!' },
      { lines: [26, 27], text: '🦾 servo.attach تقول للمكتبة: «هذا السيرفو على الرجل 13». ثم servo.write(0) تضع الذراع في وضع الاستراحة. لو تركناها بدون هذا السطر ستتحرك عشوائيًا عند التشغيل.' },
      { lines: [28, 29], text: '📡 esp_now_init() يفتح قناة الاتصال. esp_now_register_recv_cb يقول: «عندما تصل رسالة لاسلكية، نادِ دالة onReceive». مثل تسجيل رقم الطوارئ.' },
    ],
    notes: 'اطلب من المتدربين قراءة كل سطر وقول ما يفعله بكلمات عربية بسيطة قبل الانتقال للسطر التالي.' },

  { t: 'cards', kicker: '🔀 نسخة L298N', title: 'تغيير الأرجل لمن يستخدم L298N',
    cols: 2,
    cards: [
      { icon: '🟢', h: 'L9110S (المُوصى به)', b: '#define IA1 27  #define IB1 26\n#define IA2 25  #define IB2 33\n#define IA3 32  #define IB3 14\nالدالة: analogWrite(ia, spd)' },
      { icon: '🔴', h: 'L298N (البديل)', b: '#define ENA1 27 #define IN1 26 #define IN2 25\n#define ENB1 33 #define IN3 32 #define IN4 14\n#define ENA2 4  #define IN5 16 #define IN6 17\nالدالة: analogWrite(en, spd) + digitalWrite(inA/inB)' },
    ],
    notes: 'الكود الرئيسي (moveOmni) يبقى كما هو. التغيير الوحيد في دالة setMotor فقط.' },
]});
