import yt_dlp

# This opens a video and audio stream of the specified url



DEFAULT_URL = "https://youtu.be/gqIBo-87Z8Y"

# YouTube download options
ydl_opts = {
    # JS runtime configuration for YouTube signature solving
    'js_runtimes': {
        'node': {},
    },
    'quiet': True,
}


def get_stream_url(url=DEFAULT_URL):
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Don't download
        info = ydl.extract_info(url, download=False)

        # When YouTube provides separate video and audio streams
        if 'requested_formats' in info:
            print("Separate video and audio stream URLs:")
            for fmt in info['requested_formats']:
                format_type = "Video" if fmt.get('vcodec') != 'none' else "Audio"
                print(f"  {format_type} ({fmt.get('format_id')}): {fmt['url']}")
        # When a single pre-merged video+audio stream is available
        elif 'url' in info:
            print(f"Combined Stream URL: {info['url']}")


def yt_dlp_test(url=DEFAULT_URL):
    get_stream_url(url)


if __name__ == "__main__":
    yt_dlp_test()