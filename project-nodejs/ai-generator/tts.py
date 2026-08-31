import sys
import os
from gtts import gTTS

def generate_tts(text, lang, output_path):
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_path)
        print(f"SUCCESS:{output_path}")
        return 0
    except Exception as e:
        print(f"ERROR:{str(e)}")
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("ERROR: Thiếu tham số. Cần: text, lang, output_path")
        sys.exit(1)
    
    text = sys.argv[1]
    lang = sys.argv[2]
    output_path = sys.argv[3]
    
    sys.exit(generate_tts(text, lang, output_path))