/* المحور ٨: ESP-NOW — لاسلكي بدون إنترنت */
DECK.modules.push({ id: 'espnow', name: 'ESP-NOW', slides: [
  { t: 'section', num: '٨', title: 'ESP-NOW',
    sub: 'لاسلكي مباشر — بدون راوتر، بدون إنترنت، بدون تأخير',
    notes: 'قل: «تخيّل أنك تتكلم مع صديقك مباشرة بصوتك، بدون هاتف. هذا بالضبط ما يفعله ESP-NOW».' },

  { t: 'cards', kicker: '📡 ثلاثة طرق للاتصال اللاسلكي', title: 'لماذا ESP-NOW وليس WiFi أو Bluetooth؟',
    cards: [
      { icon: '📶', h: 'WiFi التقليدي', b: 'يحتاج راوتر → يتصل بالإنترنت → يرسل → يُستقبل. زمن التأخير: ٥٠–٥٠٠ ملّي ثانية. هذا كثير جدًا لروبوت يلعب كرة القدم!' },
      { icon: '🦷', h: 'Bluetooth', b: 'مباشر أكثر من WiFi لكن إعداده أصعب، مداه أقل، ويحتاج جهة اتصال. زمن التأخير: ١٠–٥٠ms.' },
      { icon: '⚡', h: 'ESP-NOW', b: 'مباشر device-to-device. لا راوتر، لا إنترنت. زمن التأخير: أقل من ١ms. المدى: ٢٠٠–٤٠٠ متر في الفضاء المفتوح!' },
    ],
    notes: 'أهم ميزة في المسابقات: ESP-NOW يعمل حتى لو الإنترنت في الملعب مقطوع. WiFi يتأثر بتداخل الشبكات الأخرى.' },

  { t: 'cards', kicker: '🔑 عنوان MAC', title: 'كيف يعرف الجويستيك إلى أين يُرسل؟',
    cards: [
      { icon: '🆔', h: 'العنوان MAC', b: 'رقم هوية فريد لكل جهاز ESP32 في العالم. مثل بصمة الإصبع — لا يتكرر.' },
      { icon: '📖', h: 'كيف تقرأه؟', b: 'الكود: Serial.println(WiFi.macAddress())\nيطبع مثلًا: EC:E3:34:08:BE:D9\nاكتب هذا الرقم في كود الجويستيك.' },
      { icon: '📮', h: 'يُستخدم في الإرسال', b: 'uint8_t carMAC[] = {0xEC,0xE3,0x34,0x08,0xBE,0xD9};\nهذا عنوان السيارة. الجويستيك يرسل إليه فقط.' },
    ],
    notes: 'اطلب من كل متدرب تشغيل السيارة وتسجيل عنوان MAC الخاص بها. هذا الرقم ستحتاجه في كود الجويستيك.' },

  { t: 'nowlab', kicker: '🎮 جرّب ESP-NOW', title: 'شاهد الرسالة وهي تطير',
    notes: 'اضغط «أرسل» وشاهد الرسالة تنتقل من الجويستيك للسيارة مع محتويات البيانات.' },

  { t: 'code', reveal: true, kicker: '💻 كود الجويستيك — إعداد ESP-NOW', title: 'تسجيل السيارة كمستقبِل',
    file: 'OmniJoy.ino',
    code: `#include <esp_now.h>
#include <WiFi.h>

uint8_t carMAC[] = {0xEC,0xE3,0x34,0x08,0xBE,0xD9};

esp_now_peer_info_t peer;

void setupESPNOW() {
  WiFi.mode(WIFI_STA);
  esp_now_init();
  memcpy(peer.peer_addr, carMAC, 6);
  peer.channel = 0;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}`,
    steps: [
      { lines: [4], text: '📮 عنوان MAC السيارة. استبدله بالرقم الفعلي الذي طبعه Serial Monitor. كل بايت يُكتب بـ 0x قبله (hexadecimal = نظام السادس عشر).' },
      { lines: [6], text: '📋 peer = "نظير" أو "صديق الاتصال". هذا الصندوق يحتوي معلومات السيارة التي نريد الاتصال بها.' },
      { lines: [9], text: '📡 WiFi.mode(WIFI_STA) = وضع المستخدم. مثل شبكة WiFi العادية لكن بدون الاتصال بالراوتر.' },
      { lines: [10], text: '🔌 esp_now_init() يفتح قناة ESP-NOW. مثل فتح جهاز الراديو للإذاعة.' },
      { lines: [11], text: '📦 memcpy ينسخ عنوان MAC السيارة للصندوق peer.peer_addr. الـ 6 = ستة بايتات في كل MAC.' },
      { lines: [12, 13], text: '📻 channel=0 = القناة صفر (ESP32 يختارها تلقائيًا). encrypt=false = لا تشفير. كافٍ للمسابقات.' },
      { lines: [14], text: '✅ esp_now_add_peer يُسجّل السيارة كمستقبِل مسموح. الآن يمكن الإرسال.' },
    ],
    notes: 'تذكير: عنوان MAC يتغير في بعض الأحيان بين شحنات الـ ESP32. افحص دائمًا قبل المسابقة.' },
]});
