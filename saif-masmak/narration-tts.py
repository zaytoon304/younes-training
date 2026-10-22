"""صوت الراوي لعرضي «المصمك الذكي · سيف 2026» (العربي والإنجليزي)
كل شريحة مقاطع: المقطع الأول مع ظهور الشريحة، وكل مقطع بعده يُظهر عنصرًا واحدًا (بطاقة/خطوة/صف)
الناتج لكل لغة: audio/<الشريحة>.mp3 + audio/cues.js (بدايات المقاطع بالثواني)
التشغيل: python3 saif-masmak/narration-tts.py [أسماء شرائح بس، مثل challenges1]   (يحتاج edge-tts و ffmpeg)
نفس صوتَي الراوي في عروض المصمك: ar-SA-HamedNeural و en-GB-RyanNeural
"""
import asyncio, json, os, re, subprocess, sys, tempfile
import edge_tts

GAP = 0.35   # سكتة بين المقاطع (ثانية)

AR = {
  'cover': ['السادة أعضاء لجنة التحكيم، أهلًا بكم. يسعدنا أن نقدّم لكم مشروعنا: المصمك الذكي… متحف تراثي يرحّب بالجميع، ويحمي الجميع.'],
  'problem': [
    'التراث لنا جميعًا… لكن الوصول إليه ليس سهلًا للجميع.',
    'صاحب الإعاقة الحركية يصعب عليه التنقّل حول المجسمات الثابتة.',
    'وصاحب الإعاقة السمعية لا يصله شرح المرشد.',
    'وصاحب الإعاقة البصرية لا يرى التفاصيل المعروضة.',
    'والتراث المبني من الطين والخشب يحترق بسرعة، والزوار في الزحام يحتاجون وقتًا للخروج.',
  ],
  'solution': [
    'فبنينا متحفًا ذكيًا واحدًا يحمي الإنسان والأثر معًا.',
    'أولًا: الاستكشاف. الزائر يدير القصر بعينه، مع لغة الإشارة والشرح الصوتي.',
    'ثانيًا: حماية الإنسان. بوابة ذكية تعرف من بالداخل، وفريق روبوتات يواجه الحريق.',
    'وثالثًا: حماية الأثر. حساسات تراقب الجو حول المجسم ليلًا ونهارًا. شاهدوا القصة كاملة.',
  ],
  'testing': [
    'جرّبنا كل جزء وحده، ثم جرّبنا المنظومة كاملة.',
    'التحكم بالعين على الجهات الأربع: نجح.',
    'النار وحدها: القائد يرش ويعود. نجح.',
    'الغاز وحده: روبوت الغاز يطرده ويعود. نجح.',
    'النار والغاز معًا: الروبوتان في وقت واحد. نجح.',
    'والنار التي لم تنطفئ: روبوتا الدعم بحركة اليد. نجح.',
  ],
  'challenges1': [
    'لم يكن الطريق سهلًا. هذه تحديات واجهناها في بناء المصمك، وكيف حللناها.',
    'نسينا كلمة مرور الراسبيري: فشغّلناه بوضع الإصلاح من كرت الذاكرة، وكتبنا كلمة مرور جديدة دون أن نفقد ملفًا واحدًا.',
    'والكاميرا لم تعمل على الراسبيري مباشرة: فنقلنا تتبع العين إلى كاميرا اللابتوب، وهي ترسل الأوامر بالواي فاي.',
    'ومؤشرات البؤبؤ كانت معكوسة: فطبعنا الأرقام الخام وحرّكنا عيوننا، وصحّحنا الترتيب.',
    'ورسالة ضائعة جعلت المصمك يدور أكثر من اللازم: فأضفنا حارسًا يوقفه إذا مرّت ثانية بلا رسالة.',
    'والفيديو كان أقصر من صوته: فكرّرنا آخر صورة حتى ينتهي الصوت، واحتفظنا بالنسخ الأصلية.',
    'والصوت كان خافتًا جدًا: فرفعناه من ثلاثة أماكن: كرت الصوت، والنظام، والمشغّل.',
    'والكاميرا كانت تنقطع حين ينام اللابتوب: فمنعنا النوم، وأضفنا حارسًا يعيد تشغيلها وحده.',
    'واللوحة والراسبيري تبادلا العناوين فلم تصل الأوامر: فثبّتنا عنوانًا لكل جهاز.',
  ],
  'challenges2': [
    'ثم واجهنا تحديات جديدة في روبوتات السلامة والإضافات.',
    'حساس اللهب كان في الحقيقة حساس حرارة: فجرّبناه بشمعة، واستبدلناه بحساس لهب حقيقي.',
    'واحترقت لوحة، لأن البطارية المكتوب عليها خمسة فولت كانت سبعة فاصلة أربعة: فصرنا نقيس بالملتيميتر، ووضعنا محوّل خمسة فولت، وشغّلنا اللوحة من باور بانك.',
    'والعجلات مشت وحدها بأقصى سرعة: فأضفنا سلكًا أرضيًا مستقلًا.',
    'والروبوت القائد كان يفوّت الخط الأسود: فأوقفنا وضع توفير الطاقة في الواي فاي.',
    'والروبوتات لم تجد شبكة الآيفون: فشغّلنا وضع زيادة التوافق، وفتحنا صفحة الهوت سبوت قبل التشغيل.',
    'والكرسي كان يعمل بالسلك فقط: فركّبنا عليه نظامًا يعمل بالبلوتوث، ويقف وحده إن انقطع الاتصال.',
  ],
  'impact': ['المصمك مجرد نموذج… وأي متحف في العالم يستطيع استخدام نظامنا. فكرة مبتكرة من المملكة العربية السعودية، أرض الإبداع.'],
  'live': ['والآن… نقدّم لكم المشروع على الطبيعة.'],
}
EN = {
  'cover': ['Honorable judges, welcome. We are proud to present our project: Smart Al Masmak… a heritage museum that welcomes everyone, and protects everyone.'],
  'problem': [
    'Heritage belongs to all of us… but not everyone can reach it.',
    'Visitors with motor disabilities struggle to move around fixed models.',
    "Visitors with hearing disabilities miss the guide's explanation.",
    'Visitors with visual disabilities cannot see the details on display.',
    'And heritage built of mud and wood burns fast, while crowds need time to get out.',
  ],
  'solution': [
    'So we built one smart museum that protects people and heritage together.',
    'First: explore. The visitor turns the palace with his eyes, with sign language and audio.',
    'Second: protect people. A smart gate knows who is inside, and a team of robots fights fire.',
    'Third: protect the artifact. Sensors watch the air around the model, day and night. Let us watch the whole story.',
  ],
  'testing': [
    'We tested every part alone, then the whole system together.',
    'Eye control on all four sides: passed.',
    'Fire only: the Leader sprays and returns. Passed.',
    'Gas only: the gas robot fans it away and returns. Passed.',
    'Fire and gas together: both robots at once. Passed.',
    'And a fire that does not go out: the hand-driven support robots. Passed.',
  ],
  'challenges1': [
    'The road was not easy. These are the challenges we faced building Masmak, and how we solved them.',
    'We forgot the Raspberry Pi password: we booted it in repair mode from the SD card and set a new one, without losing a single file.',
    'The camera did not work on the Raspberry Pi: so we moved eye tracking to the laptop camera, which sends commands over Wi-Fi.',
    'The pupil indices were reversed: we printed the raw numbers, moved our eyes, and fixed the order.',
    'A lost message made Masmak over-rotate: we added a watchdog that stops it after one second with no message.',
    'Videos were shorter than their audio: we repeated the last frame until the audio ended, and kept the originals.',
    'The audio was far too quiet: we raised it in three places: the sound card, the system, and the player.',
    'The camera dropped when the laptop slept: we blocked sleep, and added a guard that restarts it by itself.',
    'The board and the Pi swapped addresses, so commands got lost: we gave every device a fixed address.',
  ],
  'challenges2': [
    'Then the safety robots and add-ons brought new challenges.',
    'The flame sensor was actually a heat sensor: we tested it with a candle and replaced it with a real flame sensor.',
    'A board burned, because a battery labelled five volts was really seven point four: now we measure with a multimeter, use a five-volt converter, and power the board from a power bank.',
    'The wheels ran by themselves at full speed: we added a separate ground wire.',
    'The Leader robot missed the black line: we turned off Wi-Fi power saving.',
    'The robots could not find the iPhone hotspot: we turned on maximize compatibility, and opened the hotspot page before starting.',
    'The wheelchair worked only by cable: we installed a system that works over Bluetooth, and it stops by itself if the link drops.',
  ],
  'impact': ['Masmak is only our model… any museum in the world can use our system. An innovative idea from Saudi Arabia, the land of innovation.'],
  'live': ['And now… we present the project to you, live.'],
}
LANGS = {'ar': ('saif-masmak', 'ar-SA-HamedNeural', AR), 'en': ('saif-masmak-en', 'en-GB-RyanNeural', EN)}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def dur(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))


async def main():
    for lang, (folder, voice, texts) in LANGS.items():
        out = os.path.join(ROOT, folder, 'audio'); os.makedirs(out, exist_ok=True)
        cues = {}
        only = sys.argv[1:]                 # أسماء شرائح محددة؟ نولّدها بس ونبقي صوت الباقي
        cues_file = os.path.join(out, 'cues.js')
        if only and os.path.exists(cues_file):
            cues = json.loads(re.search(r'=\s*(\{.*\})\s*;', open(cues_file, encoding='utf-8').read(), re.S).group(1))
        with tempfile.TemporaryDirectory() as tmp:
            sil = os.path.join(tmp, 'gap.mp3')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', str(GAP), '-c:a', 'libmp3lame', '-b:a', '48k', sil], check=True)
            for key, segs in texts.items():
                if only and key not in only:
                    continue
                parts, starts, t = [], [], 0.0
                for i, txt in enumerate(segs):
                    f = os.path.join(tmp, f'{key}_{i}.mp3')
                    # الخدمة تتعثر أحيانًا: نعيد حتى يخرج ملف صوت حقيقي
                    for attempt in range(8):
                        try:
                            await edge_tts.Communicate(txt, voice).save(f)
                            if os.path.getsize(f) > 1000: break
                        except Exception as e:
                            print('retry', key, i, type(e).__name__)
                        await asyncio.sleep(2 + attempt * 2)
                    else:
                        raise SystemExit(f'تعذّر توليد صوت: {key} {i}')
                    if i: parts.append(sil); t += GAP
                    starts.append(round(t, 2)); parts.append(f); t += dur(f)
                lst = os.path.join(tmp, f'{key}.txt')
                open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
                dst = os.path.join(out, f'{key}.mp3')
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', dst], check=True)
                cues[key] = {'starts': starts, 'dur': round(dur(dst), 2)}
                print(lang, key, cues[key])
        open(os.path.join(out, 'cues.js'), 'w').write('/* يولّده saif-masmak/narration-tts.py — لا تعدّله يدويًا */\nwindow.NARR_CUES = ' + json.dumps(cues) + ';\n')
        with open(os.path.join(out, 'scripts.txt'), 'w', encoding='utf-8') as fh:
            fh.write(f'voice: {voice}\n' + ''.join(f'{k}.mp3: {" ".join(v)}\n' for k, v in texts.items()))

asyncio.run(main())
