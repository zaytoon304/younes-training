# الوحدة ٨: نبيه يسلّم على أصحابه بأسمائهم
import nabeeh
from time import sleep

last = None   # آخر شخص سلّمنا عليه، حتى لا نكرر السلام

while True:
    name = nabeeh.who_is_there()
    if name is not None and name != last:
        if name == "غريب":
            nabeeh.say("مرحبًا! لا أعرفك بعد")
        else:
            nabeeh.say("أهلًا يا " + name)
        last = name
    if name is None:
        last = None   # ذهب الشخص… نسلّم عليه مرة أخرى إذا رجع
    sleep(0.5)
