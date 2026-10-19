"""صوت الراوي لعرضي «المصمك الذكي · سيف 2026» (العربي والإنجليزي)
كل شريحة مقاطع: المقطع الأول مع ظهور الشريحة، وكل مقطع بعده يُظهر عنصرًا واحدًا (بطاقة/خطوة/صف)
الناتج لكل لغة: audio/<الشريحة>.mp3 + audio/cues.js (بدايات المقاطع بالثواني)
التشغيل: python3 saif-masmak/narration-tts.py   (يحتاج edge-tts و ffmpeg)
نفس صوتَي الراوي في عروض المصمك: ar-SA-HamedNeural و en-GB-RyanNeural
"""
import asyncio, json, os, subprocess, tempfile
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
    'وثالثًا: حماية الأثر. حساسات تراقب الجو حول المجسم ليلًا ونهارًا.',
  ],
  'explore': [
    'نبدأ بالاستكشاف: تراث تتحكم فيه بعينك فقط.',
    'ينظر الزائر يمينًا أو يسارًا، فيدور القصر ببطء على منصته.',
    'ويثبّت نظره، فيتوقف القصر، وتحكي تلك الجهة قصتها.',
    'بلغة الإشارة للصمّ، وبالشرح الصوتي للمكفوفين.',
    'وكرسي متحرك بنيناه من مكعبات ليغو يوصل الزائر إلى المحطة.',
  ],
  'gate': [
    'ولأن الإنسان أولًا، أضفنا بوابة دخول ذكية.',
    'كل زائر يأخذ أسورة باسمه.',
    'يمرّرها على القارئ عند الدخول،',
    'فيفتح الحاجز، بضوء أخضر وصوت ترحيب،',
    'ويعرف المتحف في كل لحظة عدد من بداخله، وأسماءهم.',
    'وإذا حدث حريق، تفتح البوابة وحدها، وتصل أسماء كل من بالداخل إلى الدفاع المدني.',
  ],
  'artifact': [
    'وحماية الأثر نفسه لا تقل أهمية. داخل صندوق المصمك حساسات ترعاه.',
    'حساس للحرارة، لأن الحرارة تتلف الطين والخشب.',
    'وحساس للرطوبة، لأن الرطوبة تسبّب التشقق والبقع.',
    'وحساس لجودة الهواء، يرصد الغبار والتلوث.',
    'وتعرض شاشة القراءات لحظة بلحظة، وإذا صار الجو خطرًا على الأثر، ينبّه النظام ويتدخّل تلقائيًا.',
  ],
  'robots': [
    'أما الحريق، فيواجهه فريق روبوتات يتخذ القرار بنفسه.',
    'محطة الحساسات تكتشف اللهب والغاز، وتنبّه بشاشة وإنذار.',
    'والروبوت القائد يقرر: النار يذهب إليها بنفسه، والغاز يرسل له روبوت الغاز، وإذا وقعا معًا يتحرك الاثنان في وقت واحد.',
    'يقف كل روبوت عند الخط الأسود، يرش الماء أو يطرد الغاز، ثم يعود إلى مكانه.',
    'والقائد يعرف حدوده: إذا بقيت النار بعد خمس عشرة ثانية، يطلب المساعدة.',
  ],
  'civil': [
    'وهنا يأتي دور الإنسان: الدفاع المدني.',
    'تصل رسالة تلجرام فورًا: حريق في الجهة الشرقية، ومعها عدد من بالداخل.',
    'ثم طلب دعم، مع ممر آمن للدخول.',
    'ورجل الإطفاء يحرّك روبوتين بحركة يده، ويرى النار بكاميرا مباشرة، من مكان آمن.',
    'وروبوت الإنقاذ يرشد الزوار إلى المخرج.',
    'وبعد إطفاء الحريق، تصل الرسالة الأخيرة: متحف المصمك آمن.',
  ],
  'testing': [
    'جرّبنا كل جزء وحده، ثم جرّبنا المنظومة كاملة.',
    'التحكم بالعين على الجهات الأربع: نجح.',
    'النار وحدها: القائد يرش ويعود. نجح.',
    'الغاز وحده: روبوت الغاز يطرده ويعود. نجح.',
    'النار والغاز معًا: الروبوتان في وقت واحد. نجح.',
    'والنار التي لم تنطفئ: روبوتا الدعم بحركة اليد. نجح.',
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
    'Third: protect the artifact. Sensors watch the air around the model, day and night.',
  ],
  'explore': [
    'We start with exploring: heritage you control with your eyes only.',
    'The visitor looks right or left, and the palace turns slowly on its turntable.',
    'He holds his gaze, the palace stops, and that side tells its story.',
    'With sign language for deaf visitors, and audio narration for blind visitors.',
    'And a wheelchair we built from LEGO bricks brings the visitor to the station.',
  ],
  'gate': [
    'Because people come first, we added a smart entrance gate.',
    'Every visitor receives a wristband with his name.',
    'He taps it on the reader at the entrance,',
    'the barrier opens, with a green light and a welcome sound,',
    'and the museum always knows how many people are inside, and who they are.',
    'If there is a fire, the gate opens by itself, and the names of everyone inside are sent to Civil Defense.',
  ],
  'artifact': [
    'Protecting the artifact itself matters just as much. Inside the Masmak case, sensors take care of it.',
    'A temperature sensor, because heat damages mud and wood.',
    'A humidity sensor, because moisture causes cracks and stains.',
    'And an air quality sensor, for dust and pollution.',
    'A screen shows the readings live, and if the air becomes dangerous for the artifact, the system warns and acts automatically.',
  ],
  'robots': [
    'Fire is handled by a team of robots that decide by themselves.',
    'The sensor station detects flame and gas, and warns with a screen and an alarm.',
    'The Leader robot decides: fire, it goes itself. Gas, it sends the gas robot. Both at once, both robots move together.',
    'Each robot stops at the black line, sprays water or fans the gas away, then returns home.',
    'And the Leader knows its limit: if the fire is still burning after fifteen seconds, it calls for help.',
  ],
  'civil': [
    'This is where people come in: Civil Defense.',
    'A Telegram alert arrives at once: fire on the east side, and how many people are inside.',
    'Then a request for support, with a safe passage to enter.',
    'A firefighter drives two robots with hand gestures, watching the fire through a live camera, from a safe place.',
    'And a rescue robot guides the visitors to the exit.',
    'When the fire is out, the last message arrives: Masmak Museum is safe.',
  ],
  'testing': [
    'We tested every part alone, then the whole system together.',
    'Eye control on all four sides: passed.',
    'Fire only: the Leader sprays and returns. Passed.',
    'Gas only: the gas robot fans it away and returns. Passed.',
    'Fire and gas together: both robots at once. Passed.',
    'And a fire that does not go out: the hand-driven support robots. Passed.',
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
        with tempfile.TemporaryDirectory() as tmp:
            sil = os.path.join(tmp, 'gap.mp3')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', str(GAP), '-c:a', 'libmp3lame', '-b:a', '48k', sil], check=True)
            for key, segs in texts.items():
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
