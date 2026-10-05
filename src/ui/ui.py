import webview

class Api:
    def on_about_clicked(self):
        print("Python: About opened")

    def on_how_to_use_clicked(self):
        print("Python: How to use opened")

    def on_settings_clicked(self):
        print("Python: Settings opened")

    def on_url_changed(self, url):
        print(f"Python: URL changed to {url}")

    def on_format_selected(self, format_type):
        print(f"Python: Format selected - {format_type}")

    def on_filename_changed(self, filename):
        print(f"Python: Filename changed - {filename}")

    def on_download_clicked(self, data):
        print(f"Python: Download triggered with data - {data}")

if __name__ == '__main__':
    api = Api()
    window = webview.create_window(
        'SplitsFromVideo', 
        'ui.html', 
        js_api=api,
        width=850,
        height=550,
        resizable=False
    )
    webview.start()