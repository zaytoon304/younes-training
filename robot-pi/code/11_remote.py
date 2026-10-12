# الوحدة ١١: تحكّم بنبيه من الجوال، وشاهد ما تراه عينه
# شغّل البرنامج، ثم افتح في متصفح الجوال (على نفس الواي فاي):  http://nabeeh.local:5000
import threading
import time

import cv2
from flask import Flask, Response, render_template, request

import nabeeh

app = Flask(__name__)
lock = threading.Lock()        # الكاميرا يقرؤها جزء واحد من البرنامج في كل لحظة
last_command = time.time()     # وقت آخر أمر وصل من الجوال
moving = False

ACTIONS = {
    "forward": lambda r: r.forward(nabeeh.SPEED),
    "backward": lambda r: r.backward(nabeeh.SPEED),
    "left": lambda r: r.left(nabeeh.SPEED),
    "right": lambda r: r.right(nabeeh.SPEED),
}


@app.route("/")
def home():
    return render_template("remote.html")


@app.route("/move", methods=["POST"])
def move():
    """الجوال يرسل الاتجاه ما دام الزر مضغوطًا، و stop حين نرفع الإصبع."""
    global last_command, moving
    action = request.form.get("action", "stop")
    last_command = time.time()
    robot = nabeeh._get_robot()
    if action in ACTIONS:
        ACTIONS[action](robot)
        moving = True
    else:
        robot.stop()
        moving = False
    return "ok"


@app.route("/say", methods=["POST"])
def say():
    text = request.form.get("text", "")[:120]
    threading.Thread(target=nabeeh.say, args=(text,), daemon=True).start()
    return "ok"


def frames():
    """بث مباشر: صورة بعد صورة بصيغة JPEG."""
    while True:
        with lock:
            frame = nabeeh.see()
        if frame is None:
            time.sleep(0.5)
            continue
        ok, jpg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        if ok:
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpg.tobytes() + b"\r\n"
        time.sleep(0.05)


@app.route("/camera")
def camera():
    return Response(frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


def safety():
    """حارس الأمان: إذا انقطع الاتصال بالجوال ونبيه يمشي، يتوقف بعد ثانية."""
    global moving
    while True:
        if moving and time.time() - last_command > 1:
            nabeeh.stop()
            moving = False
        time.sleep(0.2)


if __name__ == "__main__":
    threading.Thread(target=safety, daemon=True).start()
    print("افتح في متصفح الجوال:  http://nabeeh.local:5000")
    app.run(host="0.0.0.0", port=5000, threaded=True)
