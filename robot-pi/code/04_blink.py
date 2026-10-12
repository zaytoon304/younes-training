# الوحدة ٤: الليد يومض — الليد على GPIO17 (الدبوس ١١) مع مقاومة ٢٢٠ أوم
from gpiozero import LED
from time import sleep

led = LED(17)

while True:
    led.on()      # أضئ
    sleep(1)      # انتظر ثانية
    led.off()     # أطفئ
    sleep(1)
