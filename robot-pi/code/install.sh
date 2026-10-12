#!/bin/bash
# =====================================================================
#  تثبيت كل ما يحتاجه نبيه على Raspberry Pi OS (يشغّله المعلم مرة واحدة)
#  الأمر في الطرفية:
#    curl -sL https://zaytoon304.github.io/younes-training/robot-pi/code/install.sh | bash
# =====================================================================
set -e
SITE="https://zaytoon304.github.io/younes-training/robot-pi/code"
DIR="$HOME/nabeeh"

echo "١/٤ برامج النظام (الصوت والتسجيل)…"
sudo apt-get update -qq
sudo apt-get install -y -qq python3-gpiozero python3-pip mpg123 espeak-ng alsa-utils flac

echo "٢/٤ مكتبات Python (الكاميرا والصوت وصفحة الجوال)…"
pip install --break-system-packages -q "numpy<2" "opencv-python-headless==4.10.0.84" gTTS SpeechRecognition flask

echo "٣/٤ ملفات نبيه…"
mkdir -p "$DIR/templates" "$DIR/models" "$DIR/faces" "$DIR/voice_cache"
for f in nabeeh.py 04_blink.py 04_button.py 05_motor_test.py 05_dance.py 06_distance.py 06_avoid.py \
         07_find_ball.py 07_follow_ball.py 08_add_friend.py 08_greet.py 09_say.py 09_chat.py 10_brain.py 11_remote.py; do
  curl -fsSL -o "$DIR/$f" "$SITE/$f"
done
curl -fsSL -o "$DIR/templates/remote.html" "$SITE/templates/remote.html"

echo "٤/٤ نموذجا التعرف على الوجوه (يعملان دون إنترنت بعد التحميل)…"
ZOO="https://github.com/opencv/opencv_zoo/raw/main/models"
[ -s "$DIR/models/face_detection_yunet_2023mar.onnx" ] || curl -fsSL -o "$DIR/models/face_detection_yunet_2023mar.onnx" "$ZOO/face_detection_yunet/face_detection_yunet_2023mar.onnx"
[ -s "$DIR/models/face_recognition_sface_2021dec.onnx" ] || curl -fsSL -o "$DIR/models/face_recognition_sface_2021dec.onnx" "$ZOO/face_recognition_sface/face_recognition_sface_2021dec.onnx"

python3 -c "import gpiozero, cv2, gtts, speech_recognition, flask; print('✅ كل المكتبات تعمل · OpenCV', cv2.__version__)"
echo ""
echo "🎉 تم! برامج نبيه في المجلد: $DIR"
echo "   افتح Thonny، ثم File ← Open، واختر المجلد nabeeh"
echo "   (اختياري) مفتاح العقل السحابي:  echo \"المفتاح\" > $DIR/gemini_key.txt"
