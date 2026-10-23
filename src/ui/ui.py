from pathlib import Path
import webview
from video_service import VideoService 
import base64


# This is passed to js_api when creating webview window.
class Api:

    def __init__(self):
        self.video_service = VideoService()

    def setup_video(self, url: str):
        self.video_service.setup_video(url)

    def capture_frame(self, frame_number: int):
        frame = self.video_service.get_video_frame(frame_number)
        return frame
    

    def capture_frame_from_seconds(self, frame_number: int):
        frame = self.video_service.get_video_frame_from_seconds(frame_number)
        return frame


    def handle_frame_popup(self, frame_number):
        frame = self.capture_frame(frame_number)
        if frame is None:
            return {"status": "error", "message": "Could not capture frame"}

        frame_url = self.video_service.get_frame_url(frame)

        # Read the HTML template file
        template_path = Path(__file__).parent / "frame_preview.html"
        html_template = template_path.read_text(encoding="utf-8")

        # 5. Inject the image data and frame number into the template
        rendered_html = html_template.replace("{{FRAME_DATA}}", frame_url)\
                                     .replace("{{FRAME_NUMBER}}", str(frame_number))

        # 6. Open the window displaying the populated HTML
        webview.create_window(
            title=f"Frame Preview - #{frame_number}",
            html=rendered_html,
            width=800,
            height=550,
            resizable=True
        )
        


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
    webview.create_window(
        title="SplitsFromVideo",
        url=str(html_path.resolve()),
        js_api=api,
        width=960,
        height=620,
        resizable=True
    )
    webview.start(http_server=True)

if __name__ == "__main__":
    run()