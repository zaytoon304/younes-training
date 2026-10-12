# الوحدة ٩: حوار مع نبيه — يسمع سؤالك، ويفكر، ويجيب بصوته
import nabeeh

nabeeh.say("اسألني أي سؤال، وقل: مع السلامة، لننهي الحوار")

while True:
    print("🎤 تكلّم الآن…")
    question = nabeeh.listen(5)
    print("سمعت:", question)

    if question == "":
        nabeeh.say("لم أسمعك جيدًا، أعد من فضلك")
    elif "السلامة" in question:
        nabeeh.say("مع السلامة يا صديقي")
        break
    else:
        answer = nabeeh.ask(question)
        print("نبيه:", answer)
        nabeeh.say(answer)
