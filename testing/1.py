import torchaudio
import sys
import traceback
try:
    info = torchaudio.info("C/Users/spandan/Downloads/2018/20180528-0900-PLENARY-23_en.ogg")
    print("✓ torchaudio can read it:", info)
except Exception as e:
    print("✗ torchaudio cannot read this .ogg:")
    traceback.print_exc()
