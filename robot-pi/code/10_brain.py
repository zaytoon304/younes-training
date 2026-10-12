# الوحدة ١٠: عقل نبيه — ثلاثة أوضاع في برنامج واحد
import nabeeh
from time import sleep

MODE = "explore"   # غيّرها إلى: "explore" (مستكشف) أو "guard" (حارس) أو "hide" (الغميضة)
FRIEND = "سارة"    # الصديق الذي يبحث عنه نبيه في لعبة الغميضة


def explore():
    """المستكشف: يتجول دون أن يصطدم، ويخبرنا بالكرات الملونة التي يراها."""
    if nabeeh.distance() < 20:
        nabeeh.stop()
        nabeeh.backward()
        nabeeh.right()
    elif nabeeh.find_color("red") is not None:
        nabeeh.stop()
        nabeeh.say("وجدت شيئًا أحمر!")
        nabeeh.right(2)
    else:
        nabeeh.forward()


def guard():
    """الحارس: يقف مكانه، ويسلّم على الأصدقاء، وينبّه إذا رأى غريبًا."""
    name = nabeeh.who_is_there()
    if name == "غريب":
        nabeeh.say("تنبيه! يوجد شخص لا أعرفه")
        sleep(3)
    elif name is not None:
        nabeeh.say("أهلًا يا " + name + "، المكان آمن")
        sleep(3)


def hide_and_seek():
    """الغميضة: يلفّ ويبحث عن صديقه، ويفرح إذا وجده."""
    if nabeeh.who_is_there() == FRIEND:
        nabeeh.say("وجدتك يا " + FRIEND + "!")
        for i in range(4):
            nabeeh.right()
        return True
    nabeeh.right()
    return False


nabeeh.say("أنا جاهز!")
while True:
    if MODE == "explore":
        explore()
    elif MODE == "guard":
        guard()
    elif MODE == "hide":
        if hide_and_seek():
            break
    sleep(0.1)
