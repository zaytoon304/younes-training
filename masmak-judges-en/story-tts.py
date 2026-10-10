"""صوت الراوي للقصة الكاملة (عربي + إنجليزي): مقطع لكل فصل، ثم تُكتب المدد في turath/story-dur.js
التشغيل: python masmak-judges-en/story-tts.py   (يحتاج edge-tts و imageio-ffmpeg)"""
import asyncio, json, os, re, subprocess
import edge_tts, imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS = ['v1', 'v2', 'v3', 'v4', 'v5', 's1', 's2', 's3', 'f1', 'f2', 'f3', 'f4', 'end']
EN = [
    "Welcome to Touch of Heritage: the fully interactive Masmak Fortress. Heritage belongs to everyone, so we built one experience that works for visitors with motor, hearing and visual disabilities, all at the same time.",
    "A visitor arrives in a LEGO wheelchair. In drive mode, the chair brings him close to the model. The camera sees his face and welcomes him in Arabic and English.",
    "Now his eyes are in control. He looks right, and the fortress turns right, with a golden wave of light around it. He looks left, and it turns left.",
    "He holds his gaze. The fortress stops, the face lights up in its own color, and the story begins: a sign-language video for deaf visitors, and an audio narration for blind visitors, together.",
    "If he blinks, the turntable stops at once for his safety. And if the connection is ever lost for more than one second, a watchdog stops it too.",
    "Behind the scenes, a safety station watches for fire and gas. A flame appears. The leader robot drives itself to the black strip, sprays until the fire is out, then backs up the same way to its place.",
    "Now a gas leak. The leader stays in place and gives robot two permission over ESP-NOW. Robot two drives to the gas, clears it with its fan, and returns.",
    "Fire and gas at the same time. The leader decides: the fire is mine. It orders robot two to the gas, and the station sends a Telegram report to Civil Defense. The gas clears, but the fire keeps growing, and the thirty-second limit is running out.",
    "Time is up. The leader decides by itself that it needs help, sends an urgent Telegram message, and both robots back away safely.",
    "A Civil Defense officer arrives with two more robots. Robot three carries a hose and an ESP32 camera that streams the fire to his laptop. Robot four carries a second hose.",
    "He controls them with his hand in front of the laptop camera. An open hand: the robots advance. A fist: they stop and spray. Moving the fist right or left raises or lowers the hose.",
    "The fire is out. A final message arrives: the museum is safe now. Every robot returns home.",
    "Touch of Heritage: heritage open to everyone, and protected by smart technology. We look at the past, with the eyes of the future.",
]
AR = [
    "أهلًا بكم في لمسة تراث: قصر المصمك التفاعلي بالكامل. التراث للجميع، لذلك بنينا تجربة واحدة تخدم ذوي الإعاقة الحركية والسمعية والبصرية، في الوقت نفسه.",
    "يصل زائر على كرسي متحرك من ليغو. في وضع القيادة يقرّبه الكرسي من المجسّم، فترى الكاميرا وجهه، وترحّب به بالعربية والإنجليزية.",
    "الآن عيناه هما المتحكّم. ينظر يمينًا فيدور القصر يمينًا، مع موجة ضوء ذهبية حوله. وينظر يسارًا فيدور يسارًا.",
    "يثبّت نظره، فيتوقف القصر، وتضيء الجهة بلونها، وتبدأ الحكاية: فيديو بلغة الإشارة للصم، وسرد صوتي للمكفوفين، معًا.",
    "وإذا رمش، توقفت المنصة فورًا حفاظًا على سلامته. وإذا انقطع الاتصال أكثر من ثانية واحدة، أوقفها الحارس أيضًا.",
    "وخلف الكواليس، محطة أمان تراقب اللهب والغاز. يظهر لهب، فيذهب الروبوت القائد بنفسه حتى الشريط الأسود، ويرش حتى تنطفئ النار، ثم يعود للخلف بالطريق نفسه إلى مكانه.",
    "والآن تسرّب غاز. يبقى القائد مكانه، ويعطي الروبوت الثاني الإذن عبر إي إس بي ناو. فيذهب الروبوت الثاني إلى الغاز، ويبدده بمروحته، ثم يعود.",
    "لهب وغاز في الوقت نفسه. يقرر القائد: اللهب لي. ويأمر الروبوت الثاني بالذهاب إلى الغاز، وترسل المحطة بلاغًا بتيليجرام إلى الدفاع المدني. يتبدد الغاز، لكن النار تكبر، ومهلة الثلاثين ثانية تنفد.",
    "انتهت المهلة. يقرر القائد وحده أنه يحتاج دعمًا، فيرسل رسالة عاجلة بتيليجرام، ويعود الروبوتان للخلف بأمان.",
    "يصل رجل الدفاع المدني ومعه روبوتان آخران. الروبوت الثالث يحمل خرطومًا، وكاميرا تبث الحريق إلى حاسوبه المحمول. والروبوت الرابع يحمل خرطومًا ثانيًا.",
    "يتحكم بهما بيده أمام كاميرا الحاسوب. يد مفتوحة: يتقدم الروبوتان. قبضة: يقفان ويرشّان. وتحريك القبضة يمينًا أو يسارًا يرفع الخرطوم أو يخفضه.",
    "انطفأت النار. وتصل رسالة أخيرة: المتحف آمن الآن. ويعود كل روبوت إلى مكانه.",
    "لمسة تراث: تراثٌ مفتوح للجميع، تحميه التقنية الذكية. ننظر إلى الماضي، بعيون المستقبل.",
]
LANGS = {'ar': ('masmak-judges', 'ar-SA-HamedNeural', AR), 'en': ('masmak-judges-en', 'en-GB-RyanNeural', EN)}
FF = imageio_ffmpeg.get_ffmpeg_exe()

def dur(f):
    err = subprocess.run([FF, '-i', f], capture_output=True, text=True).stderr
    h, m, s = re.search(r'Duration: (\d+):(\d+):([\d.]+)', err).groups()
    return round(int(h) * 3600 + int(m) * 60 + float(s), 2)

async def main():
    out = {}
    for lang, (folder, voice, texts) in LANGS.items():
        d = os.path.join(ROOT, folder, 'audio')
        out[lang] = []
        for k, txt in zip(KEYS, texts):
            f = os.path.join(d, f'story_{k}.mp3')
            # يُعاد توليد المقطع فقط إن لم يوجد أو كان أقدم من هذا الملف (FORCE=1 لإعادة الكل)، مع إعادة المحاولة عند انقطاع الشبكة
            if os.environ.get('FORCE') or not os.path.exists(f) or os.path.getmtime(f) < os.path.getmtime(__file__):
                for tries in range(5):
                    try: await edge_tts.Communicate(txt, voice).save(f); break
                    except Exception as e: print('retry', k, e); await asyncio.sleep(3)
            out[lang].append(dur(f))
        with open(os.path.join(d, 'story-scripts.txt'), 'w', encoding='utf-8') as fh:
            fh.write(f'voice: {voice}\n' + ''.join(f'story_{k}.mp3: {t}\n' for k, t in zip(KEYS, texts)))
        print(lang, out[lang], round(sum(out[lang]), 1), 's')
    with open(os.path.join(ROOT, 'turath', 'story-dur.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* مدد مقاطع راوي القصة الكاملة بالثواني (يولّدها masmak-judges-en/story-tts.py — لا تعدّلها يدويًا) */\n'
                 f'window.STORY_DUR = {json.dumps(out)};\n')

asyncio.run(main())
