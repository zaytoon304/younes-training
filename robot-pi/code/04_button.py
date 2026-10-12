# الوحدة ٤: الزر يشغّل الليد — الزر بين GPIO27 (الدبوس ١٣) و GND
from gpiozero import LED, Button
from signal import pause

led = LED(17)
button = Button(27)

button.when_pressed = led.on    # حين نضغط الزر: أضئ
button.when_released = led.off  # حين نترك الزر: أطفئ

pause()  # انتظر للأبد… والزر يعمل وحده
