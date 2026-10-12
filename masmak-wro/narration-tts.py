"""صوت الراوي لعرضي «لمسة تراث WRO» (العربي والإنجليزي)
كل شريحة مقاطع: المقطع الأول مع ظهور الشريحة، وكل مقطع بعده يُظهر عنصرًا واحدًا (بطاقة/صف)
الناتج لكل لغة: audio/<الشريحة>.mp3 (المقاطع مدموجة بسكتة قصيرة) + audio/cues.js (بدايات المقاطع بالثواني)
التشغيل: python3 masmak-wro/narration-tts.py   (يحتاج edge-tts و ffmpeg)
نفس صوتَي الراوي في عرض المحكّمين: ar-SA-HamedNeural و en-GB-RyanNeural
"""
import asyncio, json, os, subprocess, tempfile
import edge_tts

GAP = 0.35   # سكتة بين المقاطع (ثانية)

AR = {
  'cover': ['السادة أعضاء لجنة التحكيم، أهلًا بكم. يسعدنا أن نقدّم لكم مشروعنا: لمسة تراث… قصر المصمك التفاعلي الشامل.'],
  'problem': [
    'التراث لنا جميعًا… لكن الوصول إليه ليس سهلًا للجميع.',
    'صاحب الإعاقة الحركية يصعب عليه التنقل حول المجسمات الثابتة،',
    'وصاحب الإعاقة السمعية لا يصله شرح المرشد،',
    'وصاحب الإعاقة البصرية لا يرى التفاصيل المعروضة.',
  ],
  'idea': ['فكرتنا واجهة واحدة بسيطة وطبيعية: حركة العين… تخدم الفئات الثلاث في وقت واحد. ومعها منظومة حماية ذكية تحرس المتحف وزوّاره. شاهدوا القصة كاملة.'],
  'challenges': [
    'لم يكن الطريق سهلًا. واجه الفريق خمسة تحديات حقيقية.',
    'فيديو أقصر من صوته: فمدّدناه بتجميد آخر إطار.',
    'ورسالة ضائعة تجعل المنصة تدور أكثر من اللازم: فأضفنا حارسًا يوقفها بعد ثانية من الصمت.',
    'ومؤشرات البؤبؤ معكوسة: فتحققنا بالإحداثيات الخام بأنفسنا.',
    'وصوت خافت جدًا: فرفعناه من النظام ومن المشغّل معًا.',
    'وكلمة مرور منسية للراسبيري: فأعدنا ضبطها دون أن نفقد ملفًا واحدًا.',
  ],
  'live': ['والآن… نقدّم لكم المشروع على الطبيعة.'],
}
EN = {
  'cover': ['Honorable judges, welcome. We are proud to present our project: Touch of Heritage… the fully interactive Masmak Fortress.'],
  'problem': [
    'Heritage belongs to all of us… but it is not easy for everyone to reach.',
    'Visitors with motor disabilities struggle to move around fixed models.',
    "Visitors with hearing disabilities miss the guide's explanation.",
    'And visitors with visual disabilities cannot see the details on display.',
  ],
  'idea': ['Our idea is one simple, natural interface: eye movement… serving all three groups at once. And a smart safety system protects the museum and its visitors. Let’s watch the whole story.'],
  'challenges': [
    'The road was not easy. The team faced five real challenges.',
    'Videos shorter than their audio: we froze each video’s last frame.',
    'A lost message made the turntable over-rotate: we added a watchdog that stops it after one second of silence.',
    'Reversed pupil indices: we checked the raw coordinates ourselves.',
    'Very quiet audio: we raised the volume in the system and in the player.',
    'A forgotten Raspberry Pi password: we reset it without losing a single file.',
  ],
  'live': ['And now… we present the project to you, live.'],
}
LANGS = {'ar': ('masmak-wro', 'ar-SA-HamedNeural', AR), 'en': ('masmak-wro-en', 'en-GB-RyanNeural', EN)}
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
                    for _ in range(3):
                        try: await edge_tts.Communicate(txt, voice).save(f); break
                        except Exception as e: print('retry', key, i, e)
                    if i: parts.append(sil); t += GAP
                    starts.append(round(t, 2)); parts.append(f); t += dur(f)
                lst = os.path.join(tmp, f'{key}.txt')
                open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
                dst = os.path.join(out, f'{key}.mp3')
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-ar', '24000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', dst], check=True)
                cues[key] = {'starts': starts, 'dur': round(dur(dst), 2)}
                print(lang, key, cues[key])
        open(os.path.join(out, 'cues.js'), 'w').write('/* يولّده masmak-wro/narration-tts.py — لا تعدّله يدويًا */\nwindow.NARR_CUES = ' + json.dumps(cues) + ';\n')
        with open(os.path.join(out, 'scripts.txt'), 'w', encoding='utf-8') as fh:
            fh.write(f'voice: {voice}\n' + ''.join(f'{k}.mp3: {" ".join(v)}\n' for k, v in texts.items()))

asyncio.run(main())
