# الوحدة ٨: نبيه يتعرّف على صديق جديد (بإذن ولي الأمر)
import nabeeh

name = input("ما اسم الصديق الجديد؟ ")
nabeeh.say("انظر إلى الكاميرا من فضلك")
count = nabeeh.add_friend(name)

if count > 0:
    print("حفظت وجه", name, "من", count, "صور")
    nabeeh.say("تشرفت بمعرفتك")
else:
    print("لم أجد وجهًا. اقترب من الكاميرا وتأكد أن الإضاءة جيدة")
