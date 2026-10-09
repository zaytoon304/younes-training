"""يولّد widgetsD_en.js (النسخة الإنجليزية) من widgetsD.js بترجمة كل نص عربي.
التشغيل بعد أي تعديل على widgetsD.js:  python make-en.py
إن بقي نص عربي بلا ترجمة يتوقف ويطبعه، فتضيفه هنا."""
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
src = open('widgetsD.js', encoding='utf8').read()

PAIRS = [
 # الأرقام: النسخة الإنجليزية بأرقام لاتينية
 ("const AR = n => String(n).replace(/\\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);", "const AR = n => String(n);"),
 # المحطات والأزرار والمقاطع
 ("'مقر الحكم في الدولة السعودية الأولى'", "'Seat of rule of the First Saudi State'"),
 ("'مسجد الإمام محمد بن سعود'", "'Imam Mohammed bin Saud Mosque'"),
 ("'الصلاة وحلقات العلم'", "'Prayer and circles of learning'"),
 ("'شريان الحياة: ماء ونخيل'", "'The lifeline: water and palms'"),
 ("'أهلًا بكم في ليالي الدرعية'", "'Welcome to the Nights of Diriyah'"),
 ("'نعرّف الناس بقيمة الدرعية'", "'People learn the value of Diriyah'"),
 ("'كل زائر شريك في حمايتها'", "'Every visitor protects it'"),
 ("'التقنية تحرس التراث'", "'Technology guards heritage'"),
 ("'الترحيب (بعد صوت الباب)'", "'Welcome (after the door)'"),
 ("'محطة قصر سلوى'", "'Station: Salwa Palace'"),
 ("'محطة المسجد'", "'Station: the Mosque'"),
 ("'محطة وادي حنيفة'", "'Station: Wadi Hanifa'"),
 ("'نتيجة التوعية'", "'Result: Awareness'"),
 ("'نتيجة المشاركة'", "'Result: Participation'"),
 ("'نتيجة الابتكار'", "'Result: Innovation'"),
 ("'الخاتمة'", "'Closing'"),
 ("'شرح إضافي: قصر سلوى'", "'Extra: Salwa Palace'"),
 ("'شرح إضافي: المسجد'", "'Extra: the Mosque'"),
 ("'شرح إضافي: وادي حنيفة'", "'Extra: Wadi Hanifa'"),
 ("'صوت الباب القديم (الافتتاح)'", "'Old door sound (opening)'"),
 ("'قصر سلوى'", "'Salwa Palace'"),
 ("'وادي حنيفة'", "'Wadi Hanifa'"),
 ("'الترحيب'", "'Welcome'"), ("'التوعية'", "'Awareness'"), ("'المشاركة'", "'Participation'"), ("'الابتكار'", "'Innovation'"),
 # المشهد البطل
 ("'صوت باب قديم يُفتح… والمحرك الخطوي يرفع الستارة لأعلى ('", "'An old door creaks open… and the stepper motor raises the curtain ('"),
 ("'الراوي يرحّب بالزوار ('", "'The narrator welcomes visitors ('"),
 ("')… والدرعية تنبض في الليل'", "')… and Diriyah comes alive at night'"),
 ("`حساس IR عند «${ST[st].n}» رأى الزائر ← إرسال ${L(\"'\" + ST[st].trk + \"'\")} لاسلكيًا عبر ESP-NOW`", "`The IR sensor at “${ST[st].n}” sees the visitor → sends ${L(\"'\" + ST[st].trk + \"'\")} wirelessly over ESP-NOW`"),
 ("`${ST[st].n}: الكشاف والألوان + الراوي (${L('000' + ST[st].trk + '.mp3')}) · تبقى ${AR(Math.max(0, Math.ceil(12 - since)))} ث`", "`${ST[st].n}: spotlight, colors + narrator (${L('000' + ST[st].trk + '.mp3')}) · ${AR(Math.max(0, Math.ceil(12 - since)))} s left`"),
 ("'لحظة القرار: كيف نحافظ على تراث الدرعية للأجيال القادمة؟'", "'Decision time: how do we protect Diriyah for future generations?'"),
 ("`الزائر اختار «${BTN[choice].n}» ← صوت النتيجة ${L('000' + BTN[choice].trk + '.mp3')} + الإضاءة تحكي الدرعية بعد ٥٠ سنة`", "`The visitor chose “${BTN[choice].n}” → result sound ${L('000' + BTN[choice].trk + '.mp3')} + the lights tell Diriyah in 50 years`"),
 ("'الستارة تنزل… وتنتظر الزائر التالي'", "'The curtain comes down… waiting for the next visitor'"),
 ("'الزائر يتنقل… والنظام يراقب أين يقف'", "'The visitor moves on… the system watches where they stop'"),
 ("وحدة التحكم (خلف المجسّم)", "Control unit (behind the model)"),
 ("'الحساسات والإضاءة'", "'Sensors & lights'"),
 ("'الصوت', S.track > 0", "'Sound', S.track > 0"),
 ("📶 ESP-NOW بلا أسلاك", "📶 ESP-NOW, no wires"),
 (">أزرار القرار<", ">Decision buttons<"),
 # المنظومة
 ("'حساسات IR ×٣'", "'IR sensors ×3'"),
 ("'تكتشف وقوف الزائر أمام كل محطة. GPIO 18 و19 و23. القراءة LOW تعني «يوجد زائر».'", "'Detect a visitor standing at each station. GPIO 18, 19 and 23. A LOW reading means “someone is here”.'"),
 ("'ESP32 · الحساسات والإضاءة'", "'ESP32 · Sensors & lights'"),
 ("'يقرأ الحساسات ويقرر المحطة النشطة (الأولوية للمحطة ١)، ويُبقيها ١٢ ثانية حتى يكتمل صوتها، ثم يرسل رقم المقطع لاسلكيًا.'", "'Reads the sensors and decides the active station (station 1 has priority), holds it 12 seconds so its narration finishes, and sends the track number wirelessly.'"),
 ("'وحدة PWM بـ ١٦ قناة على I2C (SDA 21، SCL 22، العنوان 0x40). تقود ٣ ليدات RGB بتسع قنوات بدقة ٤٠٩٦ درجة.'", "'A 16-channel PWM driver on I2C (SDA 21, SCL 22, address 0x40). Drives 3 RGB LEDs on nine channels with 4096 levels.'"),
 ("'RGB ×٣'", "'RGB ×3'"),
 ("'ضوء ملوّن يدور بألوان قوس قزح في المحطة النشطة فقط: درجة لونية جديدة كل ١٥ مللي ثانية.'", "'Rainbow light cycling only at the active station: a new hue every 15 milliseconds.'"),
 ("'كشافات ×٣'", "'Spotlights ×3'"),
 ("'إضاءة بيضاء تكشف مجسّم المحطة النشطة. GPIO 25 و26 و27، والباقي يُطفأ.'", "'White light revealing the active station model. GPIO 25, 26 and 27; the others switch off.'"),
 ("'اتصال لاسلكي مباشر بين اللوحتين بلا راوتر ولا أسلاك: بايت واحد (\\'2\\' أو \\'3\\' أو \\'4\\') يكفي.'", "'Direct wireless link between boards, no router and no wires: one byte (\\'2\\', \\'3\\' or \\'4\\') is enough.'"),
 ("'ESP32 · الصوت'", "'ESP32 · Sound'"),
 ("'يستقبل رقم المحطة فيشغّل مقطعها، ويقرأ أزرار القرار محليًا، ويرحّب تلقائيًا بعد ١٠ ثوانٍ من التشغيل.'", "'Receives the station number and plays its track, reads the decision buttons locally, and welcomes visitors automatically.'"),
 ("'DFPlayer + سماعة'", "'DFPlayer + speaker'"),
 ("'مشغّل MP3 من بطاقة SD: ٨ مقاطع مرقّمة 0001…0008. يتصل عبر UART2 (16 و17) مع مقاومة 1kΩ.'", "'MP3 player from an SD card: numbered tracks 0001…0012. Connected over UART2 (16 and 17) with a 1kΩ resistor.'"),
 ("'أزرار القرار ×٤'", "'Decision buttons ×4'"),
 ("'أصفر 33 للترحيب، أخضر 26 للتوعية، أزرق 27 للمشاركة، أحمر 25 للابتكار. INPUT_PULLUP وضغطة واحدة = تشغيل واحد.'", "'Yellow 33 welcome, green 26 awareness, blue 27 participation, red 25 innovation. INPUT_PULLUP, and one press = one play.'"),
 ("'لوحة ٣ · الستارة والقافلة'", "'Board 3 · Curtain & caravan'"),
 ("'لوحة ESP32 ثالثة: محرك خطوي 28BYJ-48 ودرايفر ULN2003 (14، 27، 26، 25) يلف بكرة فترتفع الستارة لأعلى خلال ١٠ ثوانٍ، ولحظة البدء ترسل «D» فيُسمع صوت الباب القديم. وتحرّك أيضًا القافلة على سكة أمام المحطات بمحرك NEMA17 وسير GT2.'", "'A third ESP32: a 28BYJ-48 stepper and ULN2003 driver (14, 27, 26, 25) wind a spool that raises the curtain in 10 seconds; at the start it sends “D” so the old door sound plays. It also drives the caravan along a rail in front of the stations with a NEMA17 and a GT2 belt.'"),
 ("لوحة ١ · الحساسات والإضاءة", "Board 1 · Sensors & lights"),
 ("لوحة ٢ · الصوت والقرار", "Board 2 · Sound & decision"),
 # الستارة
 ("⚠️ تجاوزت الستارة أعلى نقطة!", "⚠️ The curtain overshot the top!"),
 (">البكرة<", ">Spool<"),
 ("['⏳ جاهز… ٣ ثوانٍ', '🚪▲ صوت الباب… وتُرفع ١٠ ثوانٍ', '⏸ مرفوعة', '▼ تنزل: ١٠ ثوانٍ', '✓ نزلت']", "['⏳ Ready… 3 seconds', '🚪▲ Door sound… rising for 10 s', '⏸ Up', '▼ Lowering: 10 s', '✓ Down']"),
 ("الإضاءات مُبطّأة لترى التتابع: الحقيقي ${AR(Math.round(1000 / d))} خطوة في الثانية", "Lights slowed down so you can see the sequence: really ${AR(Math.round(1000 / d))} steps per second"),
 ("RGB المحطة ${AR(st + 1)} · مهبط مشترك", "Station ${AR(st + 1)} RGB · common cathode"),
 (">حساسات IR الثلاثة<", ">The three IR sensors<"),
 ("'بانتظار…'", "'Waiting…'"),
 ("إشارة GPIO${BTN[sel].pin} · زر ${BTN[sel].n}", "GPIO${BTN[sel].pin} signal · ${BTN[sel].n} button"),
 ("النقطة الذهبية = لحظة «ضغطة جديدة» فقط · الضغط المستمر لا يكرر التشغيل", "Gold dot = the moment of a new press only · holding the button does not replay"),
 ("🔇 الصوت مغلق", "🔇 Sound off"), ("🔊 الصوت يعمل", "🔊 Sound on"),
 ("🧩 المكوّنات وكيف تتصل", "🧩 The parts and how they connect"),
 ("🎭 الستارة · محرك خطوي 28BYJ-48 + ULN2003", "🎭 The curtain · 28BYJ-48 stepper + ULN2003"),
 (">خطوات في ١٠ ث<", ">Steps in 10 s<"), (">دورات المحور<", ">Shaft turns<"),
 ("' دورة'", "' turns'"),
 ("👁️ كشف الزائر · ٣ حساسات IR", "👁️ Detecting the visitor · 3 IR sensors"),
 (">مدة البقاء HOLD<", ">HOLD time<"),
 ("🚶 زائر عند ${AR(i + 1)}", "🚶 Visitor at ${AR(i + 1)}"),
 ("▶ تلقائي", "▶ Auto"),
 ("🌈 الإضاءة · PCA9685 + RGB", "🌈 Lighting · PCA9685 + RGB"),
 (">درجة لونية<", ">hue<"), (">القطاع region<", ">region<"), (">دورة كاملة<", ">Full cycle<"),
 ("⏱️ كل <b id=\"dyrmv\">15</b> مللي ثانية: درجة +١", "⏱️ Every <b id=\"dyrmv\">15</b> ms: hue +1"),
 ("محطة ${AR(i + 1)}</button>", "Station ${AR(i + 1)}</button>"),
 ("⏸ تجميد", "⏸ Freeze"), ("▶ تشغيل", "▶ Play"),
 ("📶 لوحتان تتكلمان بلا أسلاك · ESP-NOW", "📶 Two boards talking without wires · ESP-NOW"),
 (">أرسل '${x.trk}'<", ">Send '${x.trk}'<"),
 (">حجم الرسالة<", ">Message size<"), (">١ بايت<", ">1 byte<"), (">راوتر؟<", ">Router?<"), (">لا يلزم<", ">Not needed<"),
 ("🗳️ لحظة القرار · ٤ أزرار", "🗳️ Decision time · 4 buttons"),
 ("🛠️ طريقة البناء · كيف وصلنا للتصميم النهائي", "🛠️ How we built it · reaching the final design"),
 # مختبر الحساسات
 ("${p[i] ? 'زائر' : 'لا أحد'}", "${p[i] ? 'visitor' : 'nobody'}"),
 ("`<b>المحطة النشطة: ${AR(sim.act)}</b><span>${ignored ? '🔒 حساس آخر رأى زائرًا… لكن المحطة لم تُكمل صوتها، فيُتجاهل مؤقتًا' : p.filter(Boolean).length > 1 ? '⚖️ أكثر من زائر: الأولوية للمحطة الأصغر رقمًا' : '✓ الكشاف + RGB + صوتها'}</span>`", "`<b>Active station: ${AR(sim.act)}</b><span>${ignored ? '🔒 Another sensor sees a visitor… but this station has not finished speaking, so it is ignored for now' : p.filter(Boolean).length > 1 ? '⚖️ More than one visitor: the lower station number wins' : '✓ Spotlight + RGB + its narration'}</span>`"),
 ("'<b>لا محطة نشطة</b><span>كل الأضواء مطفأة… بانتظار زائر</span>'", "'<b>No active station</b><span>All lights off… waiting for a visitor</span>'"),
 ("${s ? 'محطة نشطة: ' + AR(s) : 'لا زائر — الكل مطفأ'}", "${s ? 'Active station: ' + AR(s) : 'No visitor — all off'}"),
 ("' ث' : '—'", "' s' : '—'"),
 ("${AR(x.toFixed(1))} ث</code>", "${AR(x.toFixed(1))} s</code>"),
 ("AR((360 * ms / 1000).toFixed(1)) + ' ث'", "AR((360 * ms / 1000).toFixed(1)) + ' s'"),
 ("'اضغط زرًا (أو انتظر العرض التلقائي)'", "'Press a button (or wait for the auto demo)'"),
 # الإضافات
 (">١. قصر سلوى<", ">1. Salwa Palace<"),
 ("'🟢 التوعية: الوعي ينتشر فتعود المحطات معًا'", "'🟢 Awareness: knowledge spreads, all stations return together'"),
 ("'🔵 المشاركة: كل زائر يضيف… محطة بعد محطة'", "'🔵 Participation: every visitor adds… station by station'"),
 ("'🔴 الابتكار: التقنية تفحص وتحرس… ثم يعود النور'", "'🔴 Innovation: technology scans and guards… then the light returns'"),
 ("'لو أهملناها… الطين يتآكل والضوء يخبو'", "'If we neglect it… the mud erodes and the light fades'"),
 ("'الدرعية باقية للأجيال ✓'", "'Diriyah endures for generations ✓'"),
 ("'محطة نشطة ⇐ الملخص (0002)'", "'Station active ⇒ summary (0002)'"),
 ("\"الزائر مهتم ⇐ 'A' ⇐ شرح إضافي (0009)\"", "\"Visitor is interested ⇒ 'A' ⇒ extra narration (0009)\""),
 ("'انتهى — الإضاءة تُطفأ'", "'Done — lights off'"),
 ("🆕 الإضافة ١ · الراوي يفهم الزائر", "🆕 New 1 · The narrator understands the visitor"),
 (">الملخص<", ">Summary<"), ("0002 · ١٢ ث", "0002 · 12 s"), (">شرح إضافي<", ">Extra narration<"), ("0009 · ٢٠ ث", "0009 · 20 s"),
 ("'✋ ضع اليد'", "'✋ Place hand'"), (">✋ ضع اليد<", ">✋ Place hand<"), ("'🖐️ ارفع اليد'", "'🖐️ Lift hand'"),
 ("🆕 الإضافة ٢ · الدرعية بعد ٥٠ سنة", "🆕 New 2 · Diriyah in 50 years"),
 ("<b>١</b> ٤ ث «الإهمال»: الضوء يرتعش ويخبو", "<b>1</b> 4 s “neglect”: the light flickers and fades"),
 ("<b>٢</b> ١٠ ث «الاستعادة» بأسلوب القرار", "<b>2</b> 10 s “restore” in the style of the choice"),
 (">من لوحة الصوت<", ">From the sound board<"), (">إلى لوحة الإضاءة<", ">To the light board<"),
 ("`<b>الملخص يعمل…</b><span>${p ? '✋ اليد ما زالت موجودة' : '🖐️ رُفعت اليد'} · بعد ${left} ث يقرر النظام</span>`", "`<b>Summary playing…</b><span>${p ? '✋ Hand still there' : '🖐️ Hand lifted'} · the system decides in ${left} s</span>`"),
 ("`<b>🧠 قرار: الزائر مهتم</b><span>بقيت اليد بعد الملخص ⇐ شرح إضافي 0009 · ${left} ث</span>`", "`<b>🧠 Decision: the visitor is interested</b><span>Hand stayed after the summary ⇒ extra narration 0009 · ${left} s</span>`"),
 ("'<b>✓ انتهى الشرح الإضافي</b><span>ارفع اليد لتبدأ زيارة جديدة</span>'", "'<b>✓ Extra narration finished</b><span>Lift your hand to start a new visit</span>'"),
 ("'<b>🧠 قرار: يكفيه الملخص</b><span>رُفعت اليد قبل نهاية الملخص ⇐ لا شرح إضافي</span>'", "'<b>🧠 Decision: the summary is enough</b><span>Hand lifted before the summary ended ⇒ no extra narration</span>'"),
 ("'<b>بانتظار زائر…</b><span>ضع يدك أمام الحساس (أو انتظر العرض التلقائي)</span>'", "'<b>Waiting for a visitor…</b><span>Put your hand in front of the sensor (or wait for the auto demo)</span>'"),
 # القافلة
 ("\"لوحة الحركة ترسل 'T': بدأت جولة القافلة\"", "\"The motion board sends 'T': the caravan tour begins\""),
 ("'القافلة تسير على السكة… والحساسات تراقب'", "'The caravan moves along the rail… the sensors watch'"),
 ("'انتهت المحطات… القافلة تكمل لنهاية السكة'", "'Stations done… the caravan rolls to the end of the rail'"),
 ("'وقت القرار: الزائر يختار كيف تُحمى الدرعية'", "'Decision time: the visitor chooses how to protect Diriyah'"),
 ("'العودة للبداية حتى مفتاح النهاية'", "'Returning home until the limit switch'"),
 ("\"في البداية… الزر الأصفر يرسل 'R' لجولة جديدة\"", "\"At home… the yellow button sends 'R' for a new tour\""),
 ("'لوحة ١ · الحساسات'", "'Board 1 · Sensors'"), ("'لوحة ٣ · الحركة'", "'Board 3 · Motion'"),
 ("`حساس «${ST[g.st].n}» رأى القافلة ⇐ لوحة ١ ترسل 'S' ⇐ لوحة ٣ توقف المحرك`", "`The “${ST[g.st].n}” sensor sees the caravan ⇒ board 1 sends 'S' ⇒ board 3 stops the motor`"),
 ("`${ST[g.st].n}: الكشاف والألوان + الراوي · بعد ${AR(Math.ceil((CV.hold - S.since) * 2))} ث ترسل 'G'`", "`${ST[g.st].n}: spotlight, colors + narrator · 'G' in ${AR(Math.ceil((CV.hold - S.since) * 2))} s`"),
 ("\"انتهى الكلام ⇐ 'G' ⇐ القافلة تتحرك للمحطة التالية\"", "\"Narration over ⇒ 'G' ⇒ the caravan moves to the next station\""),
 ("🐪 القافلة على طريقها التاريخي · NEMA17 + A4988 + سير GT2", "🐪 The caravan on its historic road · NEMA17 + A4988 + GT2 belt"),
 ("[['T', 'لوحة ٣ ← لوحة ١', 'بدأت الجولة'], ['S', 'لوحة ١ ← لوحة ٣', 'قف هنا'], ['G', 'لوحة ١ ← لوحة ٣', 'تحرك'], ['R', 'لوحة ٢ ← لوحة ٣', 'جولة جديدة']]", "[['T', 'board 3 → board 1', 'Tour started'], ['S', 'board 1 → board 3', 'Stop here'], ['G', 'board 1 → board 3', 'Go'], ['R', 'board 2 → board 3', 'New tour']]"),
 (">السرعة<", ">Speed<"), (">~٣ سم/ث<", ">~3 cm/s<"), (">أمان<", ">Safety<"), (">تقف وحدها<", ">Stops itself<"),
 ("إن لم يرَ الحساس القافلة خلال ٨٠ سم تقريبًا، تقف وحدها. وبعد الجولة يعود العرض لوضع «الاستكشاف باليد».", "If no sensor sees the caravan within about 80 cm, it stops by itself. After the tour, the show returns to “explore by hand” mode."),
 # المختبرات: بقية الكلمات
 ("'الصوت', playing", "'Sound', playing"),
 ("<text y=\"60\" class=\"dyt\" style=\"font-size:16px;fill:#e9e2cf\">${b.n}</text>", "<text y=\"${60 + (i % 2) * 18}\" class=\"dyt\" style=\"font-size:14px;fill:#e9e2cf\">${b.n}</text>"),
]
out = src
# الأسماء الإنجليزية أطول: خط أصغر للاسم الطويل
out = re.sub(r"\$\{s\.n\.length > 14 \? (\d+)", lambda m: "${s.n.length > 22 ? " + str(round(int(m.group(1)) * .8)), out)
missing = []
for a, b in PAIRS:
    if a not in out: missing.append(a)
    out = out.replace(a, b)
# الصوت: ملفات النسخة الإنجليزية في مجلدها هي (audio/ بجانب الصفحة)
out = out.replace('أدوات عرض «نبض الدرعية ولياليها» أمام لجنة التحكيم', 'English build — generated by make-en.py from widgetsD.js')
code_only = re.sub(r'/\*.*?\*/', '', out, flags=re.S)
code_only = '\n'.join(re.sub(r'(?<![:"\'])//.*$', '', l) for l in code_only.split('\n'))
left = sorted(set(m.strip() for m in re.findall(r"[^'`\"<>{}\n]*[؀-ۿ][^'`\"<>{}\n]*", code_only)))
if missing: print('NOT FOUND:'); [print('  ', m[:90]) for m in missing]
if left: print('UNTRANSLATED:'); [print('  ', x) for x in left]
open('widgetsD_en.js', 'w', encoding='utf8').write(out)
print('written widgetsD_en.js', 'OK' if not left and not missing else 'WITH ISSUES')
