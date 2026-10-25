import cv2
import yt_dlp
import base64

DEFAULT_FPS = 60

# This class is used to handle operations with and on the video

ydl_opts = {
    # Instruct yt-dlp to use Node.js as the JavaScript engine
    'js_runtimes': {
        'node': {},
    },
    'format': 'bestvideo[ext=mp4]/bestvideo/best',
    'quiet': True
}

class VideoService:
    def __init__(self):
        self.video_url = None
        self.video_frame_rate = DEFAULT_FPS
        self.video_stream = None
        self.video_capture = None


    def get_video_fps(self):
        return self.video_frame_rate
        

    # This calls the functions that set the video stream and capture
    def setup_video(self, url):
        self.set_video_stream(url)
        self.set_video_capture(self.video_stream)


    def set_video_stream(self, url):
        self.video_url = url
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            if 'requested_formats' in info:
                self.video_stream = info['requested_formats'][0]['url']
            else:
                self.video_stream = info['url']

    def set_video_capture(self, video_stream):
        self.video_capture = cv2.VideoCapture(video_stream)
   
    def set_video_framerate(self):
        pass

    def get_video_frame(self, frame_number):
        raw_frame = self.get_raw_video_frame(frame_number)
        success, frame = cv2.imencode('.jpg', raw_frame)
        if success:
            return frame
        else:
            return None

    def get_frame_url(self, frame):
        base64_str = base64.b64encode(frame).decode('utf-8')
        image_data_url = f"data:image/jpeg;base64,{base64_str}"
        return image_data_url

    def get_raw_video_frame(self, frame_number):
        if self.video_capture is None:
            print("Error: Video capture not initialized. Please enter a URL first.")
            return None
        self.video_capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame_image = self.video_capture.read()
        if ret:
            return frame_image
        else:
            return None


    def get_video_frame_from_seconds(self, seconds):
        if self.video_frame_rate is not None:
            raw_frame = self.get_raw_video_frame(seconds/self.video_frame_rate)
            success, frame = cv2.imencode('.jpg', raw_frame)
            if success:
                return frame
            else:
                return None

