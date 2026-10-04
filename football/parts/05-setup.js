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
      { icon: '❓', h: 'ما دورها؟', b: 'تضيف دالة servo.write() التي تحوّل الزاوية (مثل ١٣٠) إلى إشارة PWM يفهمها سيرفو MG996R.' },
      { icon: '⬇️', h: 'كيف تثبّتها؟', b: 'في Arduino IDE:\n١- افتح Sketch → Include Library → Manage Libraries\n٢- ابحث عن: ESP32Servo\n٣- اختر المكتبة باسم "ESP32Servo" by Kevin Harrington\n٤- اضغط Install وانتظر' },
      { icon: '💻', h: 'السطر في الكود', b: '#include <ESP32Servo.h>' },
    ],
    notes: 'هذه هي المكتبة الوحيدة التي تحتاج تثبيتًا يدويًا. اعطِ المتدربين ٣ دقائق لتثبيتها قبل المتابعة.' },

  { t: 'code', reveal: true, kicker: '💻 كود setup() — لنقرأه معًا سطرًا بسطر', title: 'إعداد السيارة الأومنية',
    file: 'OmniCar.ino',
    code: `#include <esp_now.h>
#include <WiFi.h>
#include <ESP32Servo.h>

// === أرجل L298N (من المرجع الدولي) ===
#define W1_IN1 21  #define W1_IN2 19  #define W1_EN 32  // أمامي
#define W2_IN1 27  #define W2_IN2 14  #define W2_EN 13  // يمين-خلف
#define W3_IN1 22  #define W3_IN2 23  #define W3_EN 26  // يسار-خلف
#define SERVO_PIN 25

Servo servo;

// === بنية البيانات اللاسلكية ===
typedef struct {
  int vx, vy, rot;
  bool kick;
} OmniData;
OmniData data;

// === متغيرات Ramping ===
const float RAMP = 0.12f;
const uint16_t LOOP_MS = 20;
float tgt1=0, tgt2=0, tgt3=0;
float cur1=0, cur2=0, cur3=0;
unsigned long lastLoop = 0;

void setup() {
  WiFi.mode(WIFI_STA);
  Serial.begin(115200);
  Serial.println(WiFi.macAddress());
  int pins[] = {W1_IN1,W1_IN2,W1_EN,
                W2_IN1,W2_IN2,W2_EN,
                W3_IN1,W3_IN2,W3_EN};
  for (int p : pins) pinMode(p, OUTPUT);
  servo.attach(SERVO_PIN);
  servo.write(0);
  esp_now_init();
  esp_now_register_recv_cb(onReceive);
}`,
    steps: [
      { lines: [1], text: '📦 #include <esp_now.h> — ندخل مكتبة التواصل اللاسلكي. بدونها: ESP32 لا يعرف كيف يتكلم مع الجويستيك.' },
      { lines: [2], text: '📦 #include <WiFi.h> — لا نتصل بالإنترنت، لكن ESP-NOW تطلبها لأنها تعمل فوقها. مثل تشغيل التلفاز بدون ضبط قناة.' },
      { lines: [3], text: '📦 #include <ESP32Servo.h> — مكتبة السيرفو التي ثبّتناها من Library Manager. تمنحنا دالة servo.write() بسطر واحد.' },
      { lines: [6, 7, 8, 9], text: '📌 أرجل L298N من المرجع الدولي — W1(21,19,32), W2(27,14,13), W3(22,23,26). SERVO_PIN=25. هذه الأرقام ثابتة ومجرَّبة. لا تغيّرها إلا لو غيّرت التوصيل الفعلي.' },
      { lines: [11], text: '🦾 نصنع كائن servo. مثل قلم: تُعلن عنه أولًا قبل أن تستخدمه في أي مكان في الكود.' },
      { lines: [14, 15, 16, 17, 18], text: '📦 OmniData هو الصندوق الذي يُرسله الجويستيك ونستقبله في السيارة. vx = يمين/يسار، vy = أمام/خلف، rot = دوران، kick = تسديد.' },
      { lines: [21, 22, 23, 24, 25, 26], text: '🎛️ متغيرات الـ Ramping — نُعرّفها هنا مرة واحدة وتُستخدم في كل مكان. RAMP=0.12 (السرعة الموصى بها دوليًا)، LOOP_MS=20 (50 تحديث/ثانية). tgt = هدف، cur = حالي.' },
      { lines: [28], text: '📡 WIFI_STA = وضع المستخدم (Station). ESP-NOW يحتاج هذا الوضع. لا نريد اتصالًا بالإنترنت، لكن الكتبة تطلب هذا الإعداد.' },
      { lines: [29, 30], text: '🖥️ Serial.begin يفتح شاشة الـ Serial Monitor. ثم نطبع العنوان MAC — رقم هوية ESP32. نحتاجه لاحقًا لإخبار الجويستيك: «أرسل لهذا العنوان».' },
      { lines: [31, 32, 33, 34], text: '⚙️ نجمع كل الأرجل التسعة في مصفوفة ونجعلها مخرجات بحلقة واحدة. أقصر من كتابة pinMode تسع مرات!' },
      { lines: [35, 36], text: '🦾 servo.attach تقول للمكتبة: «هذا السيرفو على الرجل 25». ثم servo.write(0) تضع الذراع في وضع الاستراحة. لو تركناها بدون هذا السطر ستتحرك عشوائيًا عند التشغيل.' },
      { lines: [37, 38], text: '📡 esp_now_init() يفتح قناة الاتصال. esp_now_register_recv_cb يقول: «عندما تصل رسالة لاسلكية، نادِ دالة onReceive». مثل تسجيل رقم الطوارئ.' },
    ],
    notes: 'اطلب من المتدربين قراءة كل سطر وقول ما يفعله بكلمات عربية بسيطة قبل الانتقال للسطر التالي.' },
]});
