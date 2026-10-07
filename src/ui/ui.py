from pathlib import Path
import webview

# This is passed to js_api when creating webview window.
class Api:
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
    webview.start()

if __name__ == "__main__":
    run()