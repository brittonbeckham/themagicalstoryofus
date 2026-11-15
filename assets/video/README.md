Background videos for the home page Begin here cards: our-story.mp4, astrology.mp4, offerings.mp4. Until a file exists, the card shows its photo. On desktop a clip loops while the card is hovered and pauses in place when the mouse leaves. On touch screens it loops while the card is on screen.

To shrink a Grok clip (keeps full frame, drops audio):
ffmpeg -i in.mp4 -map 0:v:0 -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart out.mp4
