# Touch of Heritage — full-story explainer (English narration)

Plays FIRST in both judging decks (Arabic and English), as one animated scene with an English voice-over.
Each block = one chapter of the animation; the voice for each block must fit its time window.
Voice: edge-tts `en-GB-RyanNeural` (same narrator as the rest of the English deck).

## Chapter 0 — The visitor (≈ 50 s)
0a. "Welcome to Touch of Heritage: the fully interactive Masmak Fortress. Heritage belongs to everyone, so we built one experience that works for visitors with motor, hearing and visual disabilities, all at the same time."
0b. "A visitor arrives in a LEGO wheelchair. In drive mode, the chair brings him close to the model. The camera sees his face and welcomes him in Arabic and English."
0c. "Now his eyes are in control. He looks right, and the fortress turns right, with a golden wave of light around it. He looks left, and it turns left."
0d. "He holds his gaze. The fortress stops, the face lights up in its own color, and the story begins: a sign-language video for deaf visitors, and an audio narration for blind visitors, together."
0e. "If he blinks, the turntable stops at once for his safety. And if the connection is ever lost for more than one second, a watchdog stops it too."

## Chapter 1 — Fire only (≈ 14 s)
"Behind the scenes, a safety station watches for fire and gas. A flame appears. The leader robot drives itself to the black strip, sprays until the fire is out, then backs up the same way to its place."

## Chapter 2 — Gas only (≈ 14 s)
"Now a gas leak. The leader stays in place and gives robot two permission over ESP-NOW. Robot two drives to the gas, clears it with its fan, and returns."

## Chapter 3 — Fire and gas together (≈ 15 s)
"Fire and gas at the same time. The leader decides: the fire is mine. It orders robot two to the gas, and the station sends a Telegram report to Civil Defense. The gas clears, but the fire keeps growing, and the thirty-second limit is running out."

## Chapter 4 — A fire too big for the robots (≈ 35 s)
4a. "Time is up. The leader decides by itself that it needs help, sends an urgent Telegram message, and both robots back away safely."
4b. "A Civil Defense officer arrives with two more robots. Robot three carries a hose and an ESP32 camera that streams the fire to his laptop. Robot four carries a second hose."
4c. "He controls them with his hand in front of the laptop camera. An open hand: the robots advance. A fist: they stop and spray. Moving the fist right or left raises or lowers the hose."
4d. "The fire is out. A final message arrives: the museum is safe now. Every robot returns home."

## Ending (≈ 8 s)
"Touch of Heritage: heritage open to everyone, and protected by smart technology. We look at the past, with the eyes of the future."

---
## Build plan (next session — shell was blocked when this was written)
1. Extend `fullstory` in `turath/widgetsT5.js` with Chapter 0 (wheelchair visitor, eye control, sign-language screen + audio, blink stop) before the 4 safety chapters; retime so each block above fits; add an «Ending» card.
2. Generate one TTS clip per block (`masmak-judges-en/audio/story_*.mp3`), measure durations, then set the chapter times from the real durations (scene waits for its voice).
3. Web: the slide has a 🔊 button; when on, each block's clip plays exactly when its chapter starts (same mechanism as the Diriyah hero).
4. PowerPoint: render the scene frame-by-frame + mix the clips into ONE MP4 (pip `imageio-ffmpeg` provides ffmpeg), insert it as the FIRST content slide (after the cover) of both pptx, set to play automatically and full width.
5. Test both decks, rebuild both pptx + `shared/pptx-audio-triggers.ps1`, push.
