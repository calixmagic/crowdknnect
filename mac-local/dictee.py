#!/usr/bin/env python3
"""Dictée locale façon Wispr Flow. Un appel = démarre, le suivant = stoppe, transcrit, met en forme, colle.
Prérequis: brew install sox ; pipx install mlx-whisper ; ollama pull qwen2.5:7b-instruct
"""
import json, os, signal, subprocess, sys, urllib.request

PID, WAV = "/tmp/dictee.pid", "/tmp/dictee.wav"
WHISPER = os.environ.get("DICTEE_WHISPER", "mlx-community/whisper-large-v3-turbo")
LLM = os.environ.get("DICTEE_LLM", "qwen2.5:7b-instruct")
PROMPT = ("Tu mets en forme une dictée vocale en français. Supprime les hésitations (euh, ben, du coup répétés), "
          "les faux départs et répétitions, corrige la ponctuation, les majuscules et les paragraphes. "
          "Garde exactement le sens, le ton et les mots de l'auteur. Réponds UNIQUEMENT avec le texte final.")

def notify(msg):
    subprocess.run(["osascript", "-e", f'display notification "{msg}" with title "Dictée"'])

if os.path.exists(PID):  # 2e appel: stop + traitement
    os.kill(int(open(PID).read()), signal.SIGINT); os.remove(PID)
    import time; time.sleep(0.5)
    notify("Transcription…")
    out = subprocess.run(["mlx_whisper", WAV, "--model", WHISPER, "--language", "fr",
                          "--output-format", "txt", "--output-dir", "/tmp", "--verbose", "False"],
                         capture_output=True, text=True)
    raw = open("/tmp/dictee.txt").read().strip()
    if not raw: notify("Rien entendu"); sys.exit()
    req = urllib.request.Request("http://localhost:11434/api/chat", json.dumps({
        "model": LLM, "stream": False,
        "messages": [{"role": "system", "content": PROMPT}, {"role": "user", "content": raw}]}).encode(),
        {"Content-Type": "application/json"})
    try: text = json.load(urllib.request.urlopen(req, timeout=60))["message"]["content"].strip()
    except Exception: text = raw  # si Ollama est down, on colle le brut
    subprocess.run(["pbcopy"], input=text.encode())
    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "v" using command down'])
else:  # 1er appel: start
    p = subprocess.Popen(["rec", "-q", "-r", "16000", "-c", "1", WAV])
    open(PID, "w").write(str(p.pid)); notify("J'écoute… (re-appuie pour finir)")
