import cv2
import yt_dlp

# This downloads frame 300 of the inputted YouTube video.


URL = "https://youtu.be/gqIBo-87Z8Y"

ydl_opts = {
    # Instruct yt-dlp to use Node.js as the JavaScript engine
    'js_runtimes': {
        'node': {},
    },
    'format': 'bestvideo[ext=mp4]/bestvideo/best',
    'quiet': True,
}

# 1. Get video URL using yt-dlp
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(URL, download=False)

    if 'requested_formats' in info:
        video_url = info['requested_formats'][0]['url']
    else:
        video_url = info['url']

# 2. Open stream with OpenCV
cap = cv2.VideoCapture(video_url)

# 3. Seek and capture frame 300
target_frame = 300
cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)

ret, frame = cap.read()
if ret:
    cv2.imwrite(f"output/frame_{target_frame}.jpg", frame)
    print(f"Successfully saved frame {target_frame}")
else:
    print("Failed to read frame")

cap.release()