# الوحدة ٥: رقصة نبيه الأولى
import nabeeh

nabeeh.say("انظروا… أنا أرقص!")

for i in range(2):
    nabeeh.forward()
    nabeeh.backward()

for i in range(4):   # أربع لفّات = دائرة كاملة
    nabeeh.right()

nabeeh.say("هل أعجبتكم رقصتي؟")
