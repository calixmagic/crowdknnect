#!/bin/bash
# Audit des LLM locaux + version de Wispr Flow (macOS). Lecture seule.
echo "=== Wispr Flow ==="
for app in "/Applications/Wispr Flow.app" "$HOME/Applications/Wispr Flow.app"; do
  [ -d "$app" ] && { echo "Version: $(defaults read "$app/Contents/Info" CFBundleShortVersionString 2>/dev/null)"; echo "Build:   $(defaults read "$app/Contents/Info" CFBundleVersion 2>/dev/null)"; }
done
ls -la "$HOME/Library/Application Support/Wispr Flow" 2>/dev/null | head -20

echo; echo "=== Ollama ==="
command -v ollama >/dev/null && ollama list || echo "ollama absent"

echo; echo "=== LM Studio / Jan / GPT4All ==="
for d in "$HOME/.lmstudio/models" "$HOME/.cache/lm-studio/models" "$HOME/jan/models" "$HOME/Library/Application Support/nomic.ai/GPT4All"; do
  [ -d "$d" ] && { echo "[$d]"; find "$d" -type f \( -name '*.gguf' -o -name '*.safetensors' -o -name '*.bin' \) -size +50M -exec ls -lh {} \; | awk '{print $5, $9}'; }
done

echo; echo "=== Hugging Face / MLX ==="
ls "$HOME/.cache/huggingface/hub" 2>/dev/null | grep '^models--' | sed 's/models--//; s/--/\//g'

echo; echo "=== Tous les .gguf (>200 Mo) sur le disque ==="
mdfind -onlyin "$HOME" 'kMDItemFSName == "*.gguf"' 2>/dev/null | while read -r f; do ls -lh "$f" | awk '{print $5, $9}'; done

echo; echo "=== Modèles Whisper (transcription) ==="
find "$HOME" -maxdepth 6 \( -name 'ggml-*.bin' -o -name 'whisper*' -type d \) 2>/dev/null | head -20
ls "$HOME/.cache/whisper" 2>/dev/null
