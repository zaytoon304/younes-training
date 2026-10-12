# الوحدة ٧: أين الكرة الحمراء؟
import nabeeh
from time import sleep

while True:
    ball = nabeeh.find_color("red")
    if ball is None:
        print("لا أرى الكرة")
    elif ball.x < -25:
        print("الكرة على اليسار")
    elif ball.x > 25:
        print("الكرة على اليمين")
    else:
        print("الكرة أمامي! حجمها", ball.size)
    sleep(0.3)
