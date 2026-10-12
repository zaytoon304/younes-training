# الوحدة ٦: نبيه يتجول وحده ولا يصطدم
import nabeeh
from time import sleep

LIMIT = 20   # إذا اقترب الجدار أكثر من ٢٠ سم… نتصرف

nabeeh.say("سأتجول الآن، ولن أصطدم بشيء")

while True:
    if nabeeh.distance() < LIMIT:
        nabeeh.stop()
        nabeeh.backward()
        nabeeh.right()
    else:
        nabeeh.go()
    sleep(0.05)
