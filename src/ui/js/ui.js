document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const getFrameBtn = document.getElementById('getFrameBtn');
    const urlInput = document.getElementById('urlInput');
    const frameInput = document.getElementById('frameInput');
    const formatSelect = document.getElementById('formatSelect');
    const fileNameInput = document.getElementById('fileNameInput');
    const videoPlayer = document.getElementById('videoPlayer');

    function getYouTubeEmbedUrl(url) {
        if (!url) return 'about:blank';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return 'about:blank';
    }

    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const embedUrl = getYouTubeEmbedUrl(url);
        videoPlayer.src = embedUrl;
        if (window.pywebview?.api?.setup_video) {
            window.pywebview.api.setup_video(url);
        }
    });

    window.addEventListener('pywebviewready', () => {
        console.log('pywebview JS bridge ready');
        const initialUrl = urlInput.value.trim();
        if (initialUrl && window.pywebview?.api?.setup_video) {
            window.pywebview.api.setup_video(initialUrl);
        }
    });

    document.getElementById('aboutBtn').addEventListener('click', () => {
        if (window.pywebview?.api?.show_about) window.pywebview.api.show_about();
    });

    document.getElementById('howToUseBtn').addEventListener('click', () => {
        if (window.pywebview?.api?.show_instructions) window.pywebview.api.show_instructions();
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        if (window.pywebview?.api?.open_settings) window.pywebview.api.open_settings();
    });

    getFrameBtn.addEventListener('click', async () => {
        const parsedFrame = parseInt(frameInput.value, 10);
        if (Number.isNaN(parsedFrame)) return;

        if (window.pywebview?.api?.handle_frame_popup) {
            getFrameBtn.textContent = 'Loading...';
            getFrameBtn.disabled = true;

            try {
                await window.pywebview.api.handle_frame_popup(parsedFrame);
            } catch (err) {
                console.error("Error opening frame:", err);
            } finally {
                getFrameBtn.textContent = 'Select Frame';
                getFrameBtn.disabled = false;
            }
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        const format = formatSelect.value;
        const fileName = fileNameInput.value.trim();

        if (!url) {
            alert('Please enter a YouTube URL.');
            return;
        }

        downloadBtn.textContent = 'Processing...';
        downloadBtn.disabled = true;

        if (window.pywebview?.api?.process_download) {
            try {
                const response = await window.pywebview.api.process_download(url, format, fileName);
                alert(response.message || 'Download Complete!');
            } catch (err) {
                console.error(err);
            }
        } else {
            console.log('Running in standard browser (pywebview API mock)');
        }

        downloadBtn.textContent = 'Download';
        downloadBtn.disabled = false;
    });
});