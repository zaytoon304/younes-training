"""صوت راوي القصة الكاملة لعرض «المصمك الذكي · سيف 2026» (عربي + إنجليزي): مقطع لكل مشهد
الناتج: saif-masmak/audio/story_<key>.mp3 و saif-masmak-en/audio/story_<key>.mp3، والمدد في saif-masmak/story-dur.js
التشغيل: python3 saif-masmak/story-tts.py   (يحتاج edge-tts و ffprobe)"""
import asyncio, json, os, subprocess
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS = ['intro', 'gate', 'v2', 'v3', 'v4', 'v5', 'care', 's1', 's2', 's3', 'f1', 'f2', 'f3', 'rescue', 'f4', 'end']
EN = [
    "Welcome to Smart Al Masmak. Heritage belongs to everyone, so we built one museum that works for visitors with motor, hearing and visual disabilities, and keeps every visitor safe.",
    "It starts at the smart gate. Every visitor gets a wristband with his name. He scans its barcode at the reader, the barrier opens, and the counter goes up. The museum always knows how many people are inside, and who they are.",
    "A visitor arrives in a LEGO wheelchair. The chair brings him close to the model. The camera sees his face and welcomes him in Arabic and English.",
    "Now his eyes are in control. He looks right, and the palace turns right, with a golden wave of light. He looks left, and it turns left.",
    "He holds his gaze. The palace stops, the side lights up in its own color, and the story begins: sign language for deaf visitors, and audio narration for blind visitors, together.",
    "If he blinks, the turntable stops at once for his safety. And if the connection is lost for more than one second, a watchdog stops it too.",
    "The artifact is protected too. Inside its case, sensors watch the temperature, the humidity and the air. When the humidity rises, the screen warns, and the system turns on a fan by itself, until the air is safe again.",
    "A safety station watches for fire and gas. A flame appears. The leader robot drives itself to the black line, sprays until the fire is out, then returns home.",
    "Now a gas leak. The leader stays in place and sends robot two over ESP-NOW. Robot two drives to the gas, clears it with its fan, and returns.",
    "Fire and gas at the same time. The leader decides: the fire is mine, and robot two goes to the gas. Civil Defense receives a Telegram report, with the number of people inside. The gas clears, but the fire keeps growing, and the fifteen-second limit runs out.",
    "Time is up. The leader knows its limit. It asks for support on Telegram, and both robots back away safely.",
    "A Civil Defense officer arrives with two more robots. Robot three carries a hose and a camera that streams the fire to his laptop. Robot four carries a second hose.",
    "He drives them with his hands in front of the laptop camera. An open hand: the robots advance. A fist: they stop and spray. Moving the fist raises or lowers the hose.",
    "And the visitors? The gate opens by itself, and never locks anyone in. The rescue robot comes in, and helps each visitor in his own way. The deaf visitor sees its flashing light, its exit arrow, and an emergency message in sign language on the screen. The blind visitor hears its voice: follow my voice. And the wheelchair follows the robot by itself, with its distance sensor. As each visitor leaves, the counter goes down, and Civil Defense knows exactly who is still inside.",
    "The fire is out. The last message arrives: Masmak Museum is safe now. Every robot returns home.",
    "Smart Al Masmak: a museum that welcomes everyone, and protects everyone. An innovative idea from Saudi Arabia, the land of innovation.",
]
AR = [
    "أهلًا بكم في المصمك الذكي. التراث للجميع، لذلك بنينا متحفًا واحدًا يخدم ذوي الإعاقة الحركية والسمعية والبصرية، ويحمي كل زائر.",
    "تبدأ الرحلة عند البوابة الذكية. كل زائر يأخذ أسورة باسمه، يمرّر الباركود على القارئ، فيفتح الحاجز، ويزيد العدّاد. والمتحف يعرف في كل لحظة كم شخصًا بداخله، ومن هم.",
    "يصل زائر على كرسي متحرك من ليغو. يقرّبه الكرسي من المجسّم، فترى الكاميرا وجهه، وترحّب به بالعربية والإنجليزية.",
    "الآن عيناه هما المتحكّم. ينظر يمينًا فيدور القصر يمينًا، مع موجة ضوء ذهبية. وينظر يسارًا فيدور يسارًا.",
    "يثبّت نظره، فيتوقف القصر، وتضيء الجهة بلونها، وتبدأ الحكاية: لغة إشارة للصم، وسرد صوتي للمكفوفين، معًا.",
    "وإذا رمش، توقفت المنصة فورًا حفاظًا على سلامته. وإذا انقطع الاتصال أكثر من ثانية، أوقفها الحارس أيضًا.",
    "والأثر نفسه محميّ أيضًا. داخل صندوقه حساسات تراقب الحرارة والرطوبة والهواء. وعندما ترتفع الرطوبة، تنبّه الشاشة، ويشغّل النظام مروحة بنفسه، حتى يعود الجو آمنًا.",
    "ومحطة أمان تراقب اللهب والغاز. يظهر لهب، فيذهب الروبوت القائد بنفسه حتى الخط الأسود، ويرش حتى تنطفئ النار، ثم يعود إلى مكانه.",
    "والآن تسرّب غاز. يبقى القائد مكانه، ويرسل الروبوت الثاني عبر إي إس بي ناو. فيذهب إلى الغاز، ويبدده بمروحته، ثم يعود.",
    "لهب وغاز في الوقت نفسه. يقرر القائد: اللهب لي، والروبوت الثاني إلى الغاز. ويصل الدفاعَ المدني بلاغ بتلجرام، ومعه عدد من بالداخل. يتبدد الغاز، لكن النار تكبر، ومهلة الخمس عشرة ثانية تنفد.",
    "انتهت المهلة. القائد يعرف حدوده، فيطلب الدعم بتلجرام، ويعود الروبوتان للخلف بأمان.",
    "يصل رجل الدفاع المدني ومعه روبوتان آخران. الروبوت الثالث يحمل خرطومًا وكاميرا تبث الحريق إلى حاسوبه المحمول، والروبوت الرابع يحمل خرطومًا ثانيًا.",
    "يحرّكهما بيديه أمام كاميرا الحاسوب. يد مفتوحة: يتقدم الروبوتان. قبضة: يقفان ويرشّان. وتحريك القبضة يرفع الخرطوم أو يخفضه.",
    "والزوار؟ تفتح البوابة وحدها، ولا تُغلق على أحد. ويدخل روبوت الإنقاذ، فيساعد كل زائر بطريقته. الأصم يرى ضوءه الوامض، وسهمه نحو المخرج، ورسالة طوارئ بلغة الإشارة على الشاشة. والكفيف يسمع صوته: اتبع صوتي. وكرسي القعيد يلحق الروبوت وحده، بحساس المسافة. ومع خروج كل زائر ينقص العدّاد، ويعرف الدفاع المدني بالضبط من بقي في الداخل.",
    "انطفأت النار. وتصل الرسالة الأخيرة: متحف المصمك آمن الآن. ويعود كل روبوت إلى مكانه.",
    "المصمك الذكي: متحف يرحّب بالجميع، ويحمي الجميع. فكرة مبتكرة من المملكة العربية السعودية، أرض الإبداع.",
]
LANGS = {'ar': ('saif-masmak', 'ar-SA-HamedNeural', AR), 'en': ('saif-masmak-en', 'en-GB-RyanNeural', EN)}


def dur(f):
    return round(float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f])), 2)


async def main():
    assert len(EN) == len(AR) == len(KEYS)
    out = {}
    for lang, (folder, voice, texts) in LANGS.items():
        d = os.path.join(ROOT, folder, 'audio'); os.makedirs(d, exist_ok=True)
        out[lang] = []
        for k, txt in zip(KEYS, texts):
            f = os.path.join(d, f'story_{k}.mp3')
            # يُعاد التوليد فقط لو الملف ناقص أو أقدم من هذا السكربت (FORCE=1 يعيد الكل)
            if os.environ.get('FORCE') or not os.path.exists(f) or os.path.getmtime(f) < os.path.getmtime(__file__):
                for tries in range(8):
                    try:
                        await edge_tts.Communicate(txt, voice).save(f)
                        if os.path.getsize(f) > 1000: break
                    except Exception as e:
                        print('retry', k, type(e).__name__)
                    await asyncio.sleep(2 + tries * 2)
                else:
                    raise SystemExit(f'تعذّر توليد صوت: {lang} {k}')
            out[lang].append(dur(f))
        with open(os.path.join(d, 'story-scripts.txt'), 'w', encoding='utf-8') as fh:
            fh.write(f'voice: {voice}\n' + ''.join(f'story_{k}.mp3: {t}\n' for k, t in zip(KEYS, texts)))
        print(lang, out[lang], round(sum(out[lang]), 1), 's')
    with open(os.path.join(ROOT, 'saif-masmak', 'story-dur.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* مدد مقاطع راوي قصة سيف بالثواني (يولّدها saif-masmak/story-tts.py — لا تعدّلها يدويًا) */\n'
                 f'window.SAIF_STORY_DUR = {json.dumps(out)};\n')

asyncio.run(main())
