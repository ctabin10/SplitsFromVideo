import webview






def main():
    # Create a native window pointing to HTML content or a URL
    webview.create_window("pywebview Setup Test", "ui.html")
    # webview.start(icon="resources/icon.png")



if __name__ == "__main__":
    main()