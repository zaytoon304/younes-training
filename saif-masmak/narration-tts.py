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
  'cover': ['السادة أعضاء لجنة التحكيم، أهلًا بكم. نقدّم لكم: المصمك الذكي… متحف تراثي يرحّب بالجميع، ويحمي الجميع.'],
  'problem': [
    'التراث لنا جميعًا… لكن ليس الجميع يصل إليه.',
    'صاحب الإعاقة الحركية لا يستطيع التنقّل حول المجسّم.',
    'وصاحب الإعاقة السمعية لا يصله شرح المرشد.',
    'وصاحب الإعاقة البصرية لا يرى التفاصيل.',
    'والطين والخشب يحترقان بسرعة، والزحام يحتاج وقتًا للخروج.',
  ],
  'solution': [
    'فبنينا متحفًا ذكيًا واحدًا يحمي الإنسان والأثر.',
    'الزائر يدير القصر بعينه أو يده أو صوته، مع لغة الإشارة والشرح الصوتي.',
    'وبوابة تعرف من بالداخل، وروبوتات تواجه الحريق وتساعد الزوار على الخروج.',
    'وحساسات تحمي الأثر. التقنية هنا لا تحسّن تجربة موجودة… بل تصنع تجربة لم تكن ممكنة.',
  ],
  'claims': [
    'ونقدّم لكم ادعاءين، ونثبتهما بالدليل.',
    'الأول: الزائر من ذوي الإعاقة يستكشف المصمك وحده، بلا مساعدة.',
    'والثاني: الحريق يُكتشف ويُعالج تلقائيًا في ثوانٍ، والدفاع المدني يُبلَّغ وحده. شاهدوا القصة.',
  ],
  'method': [
    'اختبرنا كل جزء وحده بالظروف نفسها، ثم المنظومة كاملة، وسجّلنا رقمًا لكل اختبار.',
    'التحكم بالمصمك: بالعين ثم اليد ثم الصوت.',
    'ومحطة الأمان: بلهب ولّاعة، وغاز، والاثنين معًا.',
    'والدفاع المدني: بنار لا تنطفئ.',
    'والكرسي: بأمر صوتي، وحاجز، وقطع الاتصال.',
  ],
  'claim1': [
    'الدليل الأول.',
    'افترضنا أن الزائر يستطيع إدارة المصمك وحده.',
    'فاختبرنا العين، ثم اليد، ثم الصوت، على الجهات الأربع.',
    'ووجدنا أنه يدور ويقف بالطرق الثلاث، والمعايرة تستغرق ثانيتين ونصفًا فقط.',
    'لكن رسالة ضائعة جعلت المنصة تدور أكثر من اللازم، فأضفنا حارسًا يوقفها خلال ثانية.',
    'والنتيجة: زائر لم يكن يستطيع… صار يستطيع.',
    'بلا أزرار، ولا تدريب، والصوت يعمل دون إنترنت.',
  ],
  'claim2': [
    'الدليل الثاني: مقارنة بين متحف بدون نظامنا، ومتحف معه.',
    'بدون نظامنا ننتظر أن يلاحظ أحد الخطر. ومعه، تقرأ المحطة اللهب والغاز كل خُمس ثانية.',
    'وأمام الولاعة قفزت قراءة حساس الغاز من مئتين وخمسة وخمسين إلى ثلاثة آلاف وستمئة وسبعة وعشرين.',
    'ثم يذهب الروبوت القائد وحده، ويرش خمس عشرة ثانية كحدٍّ أقصى.',
    'ويصل الدفاعَ المدني بلاغ تلجرام تلقائي، فيه مكان الحريق والممر الآمن.',
    'وإن لم تنطفئ النار، لا يقاتلها الروبوت بلا نهاية: بعد خمس عشرة ثانية يطلب الدعم ويتراجع.',
  ],
  'reliable': [
    'وسألنا أنفسنا الأسئلة الأربعة.',
    'هل يعمل؟ نجحت السيناريوهات الخمسة كلها.',
    'هل هو سهل؟ معايرة تلقائية، والكرسي يفهم خمسة أوامر صوتية.',
    'هل هو مفيد؟ تجربة واحدة لثلاث إعاقات، وحماية للزائر والأثر.',
    'وهل يُعتمد عليه؟ إن انقطع الاتصال يقف وحده: روبوت الدعم خلال نصف ثانية، والكرسي خلال ثانية ونصف.',
  ],
  'limits': [
    'ونقولها بصراحة: هذه حدود دليلنا اليوم.',
    'جرّبه فريقنا، والخطوة التالية خمسة زوار من خارج الفريق.',
    'والصوت يلتقط كلام من حوله، والحل سماعة بمايك قريب.',
    'وهو نموذج مصغّر، والخطوة التالية متحف حقيقي.',
  ],
  'impact': ['المصمك مجرد نموذج… وأي متحف في العالم يستطيع استخدام نظامنا. فكرة مبتكرة من المملكة العربية السعودية، أرض الإبداع.'],
  'live': ['والآن… نقدّم لكم المشروع على الطبيعة.'],
  'challenges1': [
    'لم يكن الطريق سهلًا. وفي كل مشكلة غيّرنا شيئًا واحدًا فقط، ثم جرّبنا من جديد. هذه تحديات بناء المصمك، وكيف حللناها.',
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
}
EN = {
  'cover': ['Honorable judges, welcome. We present: Smart Al Masmak… a heritage museum that welcomes everyone, and protects everyone.'],
  'problem': [
    'Heritage belongs to all of us… but not everyone can reach it.',
    'A visitor with a motor disability cannot move around the model.',
    "A visitor with a hearing disability misses the guide's explanation.",
    'A visitor with a visual disability cannot see the details.',
    'And mud and wood burn fast, while crowds need time to get out.',
  ],
  'solution': [
    'So we built one smart museum that protects people and heritage.',
    'The visitor turns the palace with his eyes, hand or voice, with sign language and audio.',
    'A gate that knows who is inside, and robots that fight fire and help visitors out.',
    'And sensors that protect the artifact. Technology here does not improve an old experience… it creates one that was not possible.',
  ],
  'claims': [
    'We make two claims, and we back them with evidence.',
    'First: a visitor with a disability explores Masmak alone, without help.',
    'Second: fire is detected and handled automatically in seconds, and Civil Defense is alerted by itself. Watch the story.',
  ],
  'method': [
    'We tested each part alone under the same conditions, then the whole system, and recorded a number for every test.',
    'Masmak control: eyes, then hand, then voice.',
    'The safety station: a lighter flame, gas, and both together.',
    'Civil Defense: a fire that does not go out.',
    'The wheelchair: a voice command, an obstacle, and a cut link.',
  ],
  'claim1': [
    'Evidence one.',
    'We assumed the visitor could run Masmak alone.',
    'So we tested eyes, then hand, then voice, on all four sides.',
    'We found it turns and stops all three ways, and calibration takes only two and a half seconds.',
    'But a lost message made the turntable over-rotate, so we added a watchdog that stops it within one second.',
    'The result: a visitor who could not… now can.',
    'No buttons, no training, and voice works with no internet.',
  ],
  'claim2': [
    'Evidence two: a museum without our system, and with it.',
    'Without it, we wait for someone to notice. With it, the station reads flame and gas every fifth of a second.',
    'At the lighter, the gas sensor jumped from two hundred fifty-five to three thousand six hundred twenty-seven.',
    'Then the Leader robot goes by itself, and sprays for fifteen seconds at most.',
    'Civil Defense gets an automatic Telegram report, with the fire location and a safe passage.',
    'And if the fire does not go out, the robot does not fight forever: after fifteen seconds it asks for help and backs away.',
  ],
  'reliable': [
    'Then we asked the four questions.',
    'Does it work? All five scenarios passed.',
    'Is it easy? Automatic calibration, and the wheelchair understands five voice commands.',
    'Is it useful? One experience for three disabilities, protecting visitors and heritage.',
    'Is it reliable? If the link drops, it stops by itself: the support robot in half a second, the wheelchair in one and a half.',
  ],
  'limits': [
    'And honestly: these are the limits of our evidence today.',
    'Our team tested it; next, five visitors from outside the team.',
    'Voice hears people nearby; the fix is a headset microphone.',
    'It is a scale model; next, a real museum.',
  ],
  'impact': ['Masmak is only our model… any museum in the world can use our system. An innovative idea from Saudi Arabia, the land of innovation.'],
  'live': ['And now… we present the project to you, live.'],
  'challenges1': [
    'The road was not easy. For every problem, we changed one thing only, then tested again. These are the challenges of building Masmak, and how we solved them.',
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
                            # حد زمني: الخدمة أحيانًا تعلق بلا رد
                            await asyncio.wait_for(edge_tts.Communicate(txt, voice).save(f), 60)
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
