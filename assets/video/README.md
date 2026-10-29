Background videos for the home page Begin here cards: our-story.mp4, astrology.mp4, offerings.mp4. Until a file exists, the card shows its photo. A clip plays once and rests on its last frame unless its <video> tag in beta/index.html has the loop attribute (use loop only when the end matches the start).

To shrink a Grok clip (keeps full frame, drops audio):
ffmpeg -i in.mp4 -map 0:v:0 -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart out.mp4
