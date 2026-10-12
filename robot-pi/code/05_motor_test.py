# الوحدة ٥: اختبار كل عجلة وحدها (ارفع نبيه عن الأرض أولًا!)
from gpiozero import Motor
from time import sleep
import nabeeh

left = Motor(nabeeh.PINS["left_forward"], nabeeh.PINS["left_backward"])
right = Motor(nabeeh.PINS["right_forward"], nabeeh.PINS["right_backward"])

for name, motor in (("اليسرى", left), ("اليمنى", right)):
    print("العجلة", name, "للأمام")
    motor.forward(0.6)
    sleep(2)
    motor.stop()
    sleep(1)

print("انتهى الاختبار. إن دارت عجلة للخلف، اعكس سلكَي محركها في لوحة L298N")
