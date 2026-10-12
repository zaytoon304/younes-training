# الوحدة ٧: نبيه يلحق الكرة الحمراء
import nabeeh

COLOR = "red"
CLOSE = 45   # إذا صار حجم الكرة أكبر من هذا الرقم، فهي قريبة جدًّا

nabeeh.set_speed(5)          # نبدأ بسرعة متوسطة حتى لا تهرب الكرة من الكاميرا
nabeeh.TURN_TIME = 0.12      # لفّات قصيرة لنصحّح الاتجاه بدقة

while True:
    ball = nabeeh.find_color(COLOR)
    if ball is None:
        nabeeh.right()       # لا أرى الكرة: ألتفت لأبحث عنها
    elif ball.size > CLOSE:
        nabeeh.stop()        # وصلت!
    elif ball.x < -25:
        nabeeh.left()
    elif ball.x > 25:
        nabeeh.right()
    else:
        nabeeh.forward()
