Character avatars for the speech-to-speech page (linked from speech-to-speech.html).

These 320px JPEGs are now the ONLY copies of this art - the 500px source PNGs
were deleted (2026-07-12). Do not delete these; to change an avatar, re-export
the art and re-cut with:

  ffmpeg -i NEW.png -vf "scale=320:320:force_original_aspect_ratio=increase,crop=320:320" -q:v 4 <name>-av.jpg
