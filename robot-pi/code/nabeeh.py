"""
مكتبة نبيه — كل ما يحتاجه الطلاب لبرمجة الروبوت «نبيه» بأوامر بسيطة.

الاستعمال:
    import nabeeh
    nabeeh.forward()
    nabeeh.say("مرحبًا يا أبطال")

الأوامر:
    الحركة:   forward(steps=1) · backward(steps=1) · left(times=1) · right(times=1)
              go() · stop() · set_speed(level)
    الحساس:   distance()            ← المسافة إلى أقرب شيء أمام نبيه بالسنتيمتر
    الكاميرا: find_color(color)     ← يبحث عن كرة ملونة، ويرجع مكانها وحجمها
              take_photo(name)      ← يحفظ صورة مما يراه نبيه
    الوجوه:   add_friend(name)      ← يتعرّف على صديق جديد من الكاميرا
              who_is_there()        ← يرجع اسم الصديق الذي أمامه
    الصوت:    say(text) · listen(seconds=4) · ask(question)

كل جزء يُحمَّل عند أول استعمال فقط، فبرنامج المحركات يعمل حتى لو لم نثبّت مكتبات الكاميرا بعد.
"""

import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

# =====================================================================
#  إعدادات يغيّرها المعلم (الأرقام هنا تطابق مخططات التوصيل في الدورة)
# =====================================================================
PINS = {
    # لوحة L298N: نترك غطاءَي ENA و ENB في مكانهما، والسرعة تصل مع أمر الاتجاه نفسه
    "left_forward": 5,    # IN1
    "left_backward": 6,   # IN2
    "right_forward": 20,  # IN3
    "right_backward": 21, # IN4
    "trigger": 23,        # TRIG في حساس الألتراسونك
    "echo": 24,           # ECHO (عبر مقسّم الجهد!)
}
SPEED = 0.7        # سرعة المحركات من 0 إلى 1
STEP_TIME = 0.5    # كم ثانية تستغرق «الخطوة» الواحدة
TURN_TIME = 0.45   # كم ثانية تحتاج لفّة ربع دائرة (عايِرها على أرض الفصل)
CAMERA = 0         # رقم الكاميرا: 0 لأول كاميرا USB

HOME = os.path.join(os.path.expanduser("~"), "nabeeh")
FACES_DIR = os.path.join(HOME, "faces")
MODELS_DIR = os.path.join(HOME, "models")
VOICE_CACHE = os.path.join(HOME, "voice_cache")
KEY_FILE = os.path.join(HOME, "gemini_key.txt")

# نماذج Gemini: نجرّب الأول، وإن لم يتوفر ننتقل للذي بعده
AI_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"]
AI_RULES = (
    "أنت نبيه، روبوت صديق لطلاب المرحلة الابتدائية في مدرسة سعودية. "
    "أجب بالعربية الفصحى البسيطة، في جملة أو جملتين قصيرتين فقط، لأن جوابك سيُقرأ بصوت عالٍ. "
    "كن لطيفًا ومشجعًا. لا تذكر أي محتوى غير مناسب للأطفال. "
    "إن سُئلت عن أمر خطير أو شخصي، فانصح الطالب أن يسأل معلمه أو أهله."
)

# =====================================================================
#  الحركة
# =====================================================================
_robot = None


def _get_robot():
    """ينشئ المحركين مرة واحدة عند أول أمر حركة."""
    global _robot
    if _robot is None:
        from gpiozero import Motor, Robot
        _robot = Robot(
            left=Motor(PINS["left_forward"], PINS["left_backward"]),
            right=Motor(PINS["right_forward"], PINS["right_backward"]),
        )
    return _robot


def _move(action, seconds):
    robot = _get_robot()
    getattr(robot, action)(SPEED)
    time.sleep(seconds)
    robot.stop()


def forward(steps=1):
    """امشِ للأمام خطوة (أو عدة خطوات)."""
    _move("forward", STEP_TIME * steps)


def backward(steps=1):
    """ارجع للخلف خطوة (أو عدة خطوات)."""
    _move("backward", STEP_TIME * steps)


def left(times=1):
    """لف يسارًا ربع دائرة (أو عدة مرات)."""
    _move("left", TURN_TIME * times)


def right(times=1):
    """لف يمينًا ربع دائرة (أو عدة مرات)."""
    _move("right", TURN_TIME * times)


def go():
    """ابدأ المشي للأمام ولا تتوقف حتى نقول stop()."""
    _get_robot().forward(SPEED)


def stop():
    """توقف فورًا."""
    _get_robot().stop()


def set_speed(level):
    """غيّر السرعة: من 1 (بطيء جدًّا) إلى 10 (أسرع ما يمكن)."""
    global SPEED
    SPEED = max(1, min(10, level)) / 10


# =====================================================================
#  حساس المسافة (الألتراسونك)
# =====================================================================
_sensor = None


def distance():
    """المسافة إلى أقرب شيء أمام نبيه بالسنتيمتر (من 2 إلى 200)."""
    global _sensor
    if _sensor is None:
        from gpiozero import DistanceSensor
        _sensor = DistanceSensor(echo=PINS["echo"], trigger=PINS["trigger"], max_distance=2)
        time.sleep(0.1)  # الحساس يحتاج لحظة بعد التشغيل
    return round(_sensor.distance * 100)


# =====================================================================
#  الكاميرا والألوان
# =====================================================================
_camera = None

# نطاق كل لون في نظام HSV (اللون، والتشبع، والإضاءة). الأحمر في طرفي الدائرة فله نطاقان
COLORS = {
    "red": [((0, 120, 70), (8, 255, 255)), ((170, 120, 70), (180, 255, 255))],
    "orange": [((9, 120, 90), (22, 255, 255))],
    "yellow": [((23, 100, 100), (34, 255, 255))],
    "green": [((40, 70, 50), (85, 255, 255))],
    "blue": [((95, 120, 50), (128, 255, 255))],
}


class Ball:
    """مكان الكرة في الصورة: x من -100 (أقصى اليسار) إلى 100 (أقصى اليمين)، و size نسبتها من عرض الصورة."""

    def __init__(self, x, y, size):
        self.x, self.y, self.size = x, y, size

    def __repr__(self):
        return f"Ball(x={self.x}, y={self.y}, size={self.size})"


def _open_camera():
    global _camera
    import cv2
    if _camera is None or not _camera.isOpened():
        _camera = cv2.VideoCapture(CAMERA)
        _camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        _camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        _camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    return _camera


def see():
    """صورة واحدة مما تراه الكاميرا الآن (مصفوفة ألوان)، أو None إن لم تعمل الكاميرا."""
    cam = _open_camera()
    cam.grab()  # نرمي الصورة القديمة المخزنة لنأخذ صورة اللحظة
    ok, frame = cam.read()
    return frame if ok else None


def take_photo(name="photo"):
    """يحفظ صورة باسم name.jpg في مجلد نبيه، ويرجع مسارها."""
    import cv2
    frame = see()
    if frame is None:
        raise RuntimeError("الكاميرا لا تعمل: تأكد أنها موصولة بمنفذ USB")
    os.makedirs(HOME, exist_ok=True)
    path = os.path.join(HOME, f"{name}.jpg")
    cv2.imwrite(path, frame)
    return path


def color_mask(frame, color):
    """صورة بالأبيض والأسود: الأبيض حيث يوجد اللون المطلوب."""
    import cv2
    import numpy as np
    if color not in COLORS:
        raise ValueError(f"اللون {color} غير معروف. الألوان المتاحة: {', '.join(COLORS)}")
    hsv = cv2.cvtColor(cv2.GaussianBlur(frame, (9, 9), 0), cv2.COLOR_BGR2HSV)
    mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for low, high in COLORS[color]:
        mask |= cv2.inRange(hsv, np.array(low), np.array(high))
    kernel = np.ones((5, 5), np.uint8)
    return cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)  # نمسح النقاط الصغيرة المتناثرة


def find_color(color="red", frame=None, min_size=3):
    """يبحث عن أكبر شيء باللون المطلوب. يرجع Ball أو None إن لم يجده."""
    import cv2
    if frame is None:
        frame = see()
        if frame is None:
            return None
    contours, _ = cv2.findContours(color_mask(frame, color), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    (cx, cy), radius = cv2.minEnclosingCircle(max(contours, key=cv2.contourArea))
    h, w = frame.shape[:2]
    size = round(200 * radius / w)  # القطر كنسبة مئوية من عرض الصورة
    if size < min_size:
        return None
    return Ball(round((cx - w / 2) * 200 / w), round((cy - h / 2) * 200 / h), size)


# =====================================================================
#  التعرف على الوجوه (نموذجا YuNet و SFace من OpenCV، ويعملان على الجهاز دون إنترنت)
# =====================================================================
_face = {}
DETECT_MODEL = "face_detection_yunet_2023mar.onnx"
MATCH_MODEL = "face_recognition_sface_2021dec.onnx"
MATCH_LIMIT = 0.36  # إن كان التشابه أعلى من هذا الرقم فهو نفس الشخص (القيمة الموصى بها للنموذج)


def _face_models(width, height):
    import cv2
    if "detect" not in _face:
        for f in (DETECT_MODEL, MATCH_MODEL):
            if not os.path.exists(os.path.join(MODELS_DIR, f)):
                raise RuntimeError(f"ملف النموذج {f} غير موجود: شغّل install.sh أولًا")
        _face["detect"] = cv2.FaceDetectorYN.create(os.path.join(MODELS_DIR, DETECT_MODEL), "", (width, height), 0.8)
        _face["match"] = cv2.FaceRecognizerSF.create(os.path.join(MODELS_DIR, MATCH_MODEL), "")
    _face["detect"].setInputSize((width, height))
    return _face["detect"], _face["match"]


def _biggest_face(frame):
    """يرجع (بصمة أكبر وجه في الصورة، مربعه) أو (None, None)."""
    h, w = frame.shape[:2]
    detect, match = _face_models(w, h)
    _, faces = detect.detect(frame)
    if faces is None or len(faces) == 0:
        return None, None
    face = max(faces, key=lambda f: f[2] * f[3])
    return match.feature(match.alignCrop(frame, face)), face


def _friends():
    """كل الأصدقاء المحفوظين: {الاسم: [بصمات]}."""
    import numpy as np
    out = {}
    if os.path.isdir(FACES_DIR):
        for f in sorted(os.listdir(FACES_DIR)):
            if f.endswith(".npy"):
                out[f[:-4]] = np.load(os.path.join(FACES_DIR, f))
    return out


def add_friend(name, photos=5):
    """يلتقط عدة صور لوجه الصديق ويحفظ بصمته باسمه. يرجع عدد الصور التي نجحت."""
    import cv2
    import numpy as np
    os.makedirs(FACES_DIR, exist_ok=True)
    prints = []
    tries = 0
    while len(prints) < photos and tries < photos * 10:
        tries += 1
        frame = see()
        if frame is None:
            continue
        feature, face = _biggest_face(frame)
        if feature is not None:
            prints.append(feature[0])
            if len(prints) == 1:  # نحفظ صورة واحدة ليراها المعلم
                x, y, w, h = [int(v) for v in face[:4]]
                cv2.imwrite(os.path.join(FACES_DIR, f"{name}.jpg"), frame[max(0, y):y + h, max(0, x):x + w])
            time.sleep(0.3)
    if prints:
        np.save(os.path.join(FACES_DIR, f"{name}.npy"), np.array(prints))
    return len(prints)


def who_is_there(frame=None):
    """اسم الصديق الذي أمام الكاميرا، أو «غريب» إن كان وجهًا لا نعرفه، أو None إن لم يوجد وجه."""
    import cv2
    if frame is None:
        frame = see()
        if frame is None:
            return None
    feature, _ = _biggest_face(frame)
    if feature is None:
        return None
    match = _face["match"]
    best, best_score = "غريب", MATCH_LIMIT
    for name, prints in _friends().items():
        score = max(match.match(feature, p.reshape(1, -1), cv2.FaceRecognizerSF_FR_COSINE) for p in prints)
        if score > best_score:
            best, best_score = name, score
    return best


def forget_friend(name):
    """يحذف بصمة الصديق وصورته (حين يطلب ولي الأمر ذلك، أو في نهاية العام)."""
    for ext in (".npy", ".jpg"):
        path = os.path.join(FACES_DIR, name + ext)
        if os.path.exists(path):
            os.remove(path)


# =====================================================================
#  الصوت: الكلام والاستماع والسؤال
# =====================================================================
def say(text):
    """نبيه يقول الجملة بصوت عربي. الجمل التي قالها قبل تُحفظ، فيقولها بعدها حتى دون إنترنت."""
    text = str(text).strip()
    if not text:
        return
    os.makedirs(VOICE_CACHE, exist_ok=True)
    path = os.path.join(VOICE_CACHE, hashlib.md5(text.encode()).hexdigest() + ".mp3")
    if not os.path.exists(path):
        try:
            from gtts import gTTS
            gTTS(text, lang="ar").save(path)
        except Exception:
            if os.path.exists(path):
                os.remove(path)  # ملف ناقص من محاولة فاشلة
            return _say_offline(text)
    _play(path)


def _play(path):
    for player in (["mpg123", "-q"], ["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet"]):
        if shutil.which(player[0]):
            subprocess.run(player + [path], check=False)
            return
    raise RuntimeError("لا يوجد برنامج لتشغيل الصوت: شغّل install.sh أولًا")


def _say_offline(text):
    """صوت آلي بلا إنترنت (أقل جمالًا، لكنه يعمل دائمًا)."""
    if shutil.which("espeak-ng"):
        subprocess.run(["espeak-ng", "-v", "ar", "-s", "140", text], check=False)
    else:
        print("نبيه يقول:", text)


def listen(seconds=4):
    """يسجّل صوتك عدة ثوانٍ، ويرجع ما قلته نصًّا. يرجع "" إن لم يفهم."""
    wav = os.path.join(tempfile.gettempdir(), "nabeeh_listen.wav")
    subprocess.run(["arecord", "-q", "-d", str(seconds), "-f", "S16_LE", "-r", "16000", "-c", "1", wav], check=True)
    return listen_file(wav)


def listen_file(path):
    """يحوّل ملف صوت (wav) إلى نص عربي: بالعقل السحابي إن وُجد مفتاحه (أدق)، وإلا بخدمة جوجل المجانية."""
    if _api_key():
        text = _gemini([{"text": "اكتب الكلام العربي المسموع في هذا الملف كما هو، دون أي إضافة. إن لم يوجد كلام فاكتب: -"},
                        {"inline_data": {"mime_type": "audio/wav", "data": _b64(path)}}], rules=None)
        if text is not None:
            return "" if text.strip() == "-" else text
    import speech_recognition as sr
    rec = sr.Recognizer()
    rec.operation_timeout = 10
    with sr.AudioFile(path) as src:
        audio = rec.record(src)
    try:
        return rec.recognize_google(audio, language="ar-SA")
    except Exception:
        return ""  # لم يفهم الكلام، أو لا يوجد إنترنت


def _b64(path):
    import base64
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def _api_key():
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key and os.path.exists(KEY_FILE):
        with open(KEY_FILE, encoding="utf-8") as f:
            key = f.read().strip()
    return key


def ask(question):
    """يسأل العقل السحابي ويرجع جوابًا قصيرًا بالعربي."""
    if not _api_key():
        return "لم يضع المعلم مفتاح الذكاء السحابي بعد."
    return _gemini([{"text": str(question)}]) or "عذرًا، لا أستطيع الاتصال بالعقل السحابي الآن."


def _gemini(parts, rules=AI_RULES):
    """يرسل طلبًا للعقل السحابي ويرجع النص، أو None إن فشل الاتصال."""
    key = _api_key()
    if not key:
        return None
    req_body = {"contents": [{"role": "user", "parts": parts}],
                "generationConfig": {"maxOutputTokens": 150, "temperature": 0.6}}
    if rules:
        req_body["systemInstruction"] = {"parts": [{"text": rules}]}
    body = json.dumps(req_body).encode()
    for model in AI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json", "x-goog-api-key": key})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.load(r)
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue  # النموذج غير متوفر، نجرب الذي بعده
            return None
        except Exception:
            return None  # لا إنترنت، أو انتهى الوقت، أو جواب غير متوقع
    return None
