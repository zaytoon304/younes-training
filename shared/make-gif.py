"""تجميع إطارات PNG في صورة متحركة GIF (يستدعيه capture-pptx.js)
التشغيل: python make-gif.py <مجلد الإطارات> <ملف الناتج> <الإطارات في الثانية> <العرض الأقصى>"""
import sys, glob, os
from PIL import Image
src, out, fps, maxw = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
files = sorted(glob.glob(os.path.join(src, '*.png')))
frames = []
for f in files:
    im = Image.open(f).convert('RGB')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    frames.append(im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
frames[0].save(out, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0, optimize=True, disposal=1)
print(out, len(frames), 'frames', round(os.path.getsize(out) / 1e6, 1), 'MB')
