from pathlib import Path
import webview
from video_service import VideoService 
import base64


# This is passed to js_api when creating webview window.
class Api:

    def __init__(self):
        self.video_service = VideoService()
        self.split_frame_list = []
        self.split_times_list = []
        self.main_window = None

    def setup_video(self, url: str):
        self.video_service.setup_video(url)

    def capture_frame(self, frame_number: int):
        frame = self.video_service.get_video_frame(frame_number)
        return frame
    

    def capture_frame_from_seconds(self, frame_number: int):
        frame = self.video_service.get_video_frame_from_seconds(frame_number)
        return frame



    def add_to_split_frame_list(self, frame_number):
        self.split_frame_list.append(frame_number)
        print(self.split_frame_list)
        self.calculate_splits_from_list()
        # If there are more than one splits, start adding them to the UI
        # if len(self.split_frame_list) > 1:
        #     self.handle_ui_split_update()


    def get_split_frame_list(self):
        return self.split_frame_list

    def get_split_times_list(self):
        return self.split_times_list

    def format_timestamp(self, total_seconds: float) -> str:
        # Convert to total milliseconds to ensure safe integer rounding
        total_ms = round(total_seconds * 1000)
        
        ms = total_ms % 1000
        total_sec = total_ms // 1000
        seconds = total_sec % 60
        minutes = (total_sec // 60) % 60
        hours = total_sec // 3600

        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}.{ms:03d}"
        return f"{minutes}:{seconds:02d}.{ms:03d}"
    

    # This function takes the list of split frames and then converts 
    # them to string timestamps and puts them in split_times_list
    def calculate_splits_from_list(self):
        split_times_list = []
        for i in range(len(self.split_frame_list)-1):
            current_split_length = self.split_frame_list[i]-self.split_frame_list[i+1]
            print("Current split length: " + str(current_split_length))
            split_times_list.append(self.format_timestamp(current_split_length/self.get_video_fps()))
        # Overwriting the whole list here. This is bad for big inputs but fine for this.
        self.split_times_list = split_times_list
        print(split_times_list)
        print(self.split_times_list)


        

    

    def handle_frame_popup(self, frame_number):
        self.split_frame_list.append(frame_number)
        self.current_frame_preview = frame_number
        template_path = Path(__file__).parent / "frame_preview.html"
        
        webview.create_window(
            title=f"Frame Preview - #{frame_number}",
            url=str(template_path.resolve()), # Uses the HTTP server
            width=1280,
            height=720,
            resizable=True,
            js_api=self
        )    

    def get_video_fps(self):
        fps = self.video_service.get_video_fps();
        return fps

    def get_current_preview_frame(self):
        return self.current_frame_preview


    def fetch_frame_url(self, frame_number: int):
        frame = self.capture_frame(int(frame_number))
        if frame is not None:
            return self.video_service.get_frame_url(frame)
        return None


    def show_about(self):
        print("About clicked")
        return {"message": "SplitsFromVideo v1.0"}

    def show_instructions(self):
        print("How to use clicked")

    def open_settings(self):
        print("Settings clicked")

    


    def process_download(self, url, fmt, file_name):
        print(f"Downloading: URL={url}, Format={fmt}, Name={file_name}")
        # Add your YouTube download / split logic here
        return {"status": "success", "message": f"Saved {file_name or 'video'} as {fmt}!"}



    

def run():
    # Resolve exact path to ui.html regardless of execution working dir
    html_path = Path(__file__).parent / "ui.html"
    
    api = Api()
    api._main_window = webview.create_window(
        title="SplitsFromVideo",
        url=str(html_path.resolve()),
        js_api=api,
        width=960,
        height=620,
        resizable=True
    )
    webview.start(debug=True, http_server=True)

if __name__ == "__main__":
    run()