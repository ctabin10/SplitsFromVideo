document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const getFrameBtn = document.getElementById('getFrameBtn');
    const urlInput = document.getElementById('urlInput');
    const frameInput = document.getElementById('frameInput');
    const formatSelect = document.getElementById('formatSelect');
    const fileNameInput = document.getElementById('fileNameInput');
    const videoPlayer = document.getElementById('videoPlayer');

    

    function timeToSeconds(timeString) {
        // Converts "1:15" to 75, or "1:02:30" to 3750
        return timeString.split(':').reduce((acc, time) => (60 * acc) + Number(time), 0);
    }

    // Helper: Extract YouTube ID from standard, shortened, or embed URLs
    function getYouTubeEmbedUrl(url) {
        if (!url) return 'about:blank';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return 'about:blank';
    }


    // Dynamic Video Preview Update
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const embedUrl = getYouTubeEmbedUrl(url);
        videoPlayer.src = embedUrl;
        window.pywebview.api.setup_video(url);
    });

    // Handle pywebview API readiness
    window.addEventListener('pywebviewready', () => {
        console.log('pywebview JS bridge ready');
    });

    // Top Bar Buttons
    document.getElementById('aboutBtn').addEventListener('click', () => {
        if (window.pywebview) window.pywebview.api.show_about();
    });

    document.getElementById('howToUseBtn').addEventListener('click', () => {
        if (window.pywebview) window.pywebview.api.show_instructions();
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        if (window.pywebview) window.pywebview.api.open_settings();
    });



    getFrameBtn.addEventListener('click', async () => {
        if (frameInput.value) {
            if (window.pywebview) {
                // 1. Set loading state
                getFrameBtn.textContent = 'Loading...';
                getFrameBtn.disabled = true;

                try {
                    // 2. Wait for the Python backend to fetch the frame and open the window
                    await window.pywebview.api.handle_frame_popup(parseFloat(frameInput.value));
                } catch (err) {
                    console.error("Error opening frame:", err);
                } finally {
                    // 3. Reset the button back to its original state
                    getFrameBtn.textContent = 'Select Frame';
                    getFrameBtn.disabled = false;
                }
            }
        }
    });

    // Download Handler
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

        if (window.pywebview) {
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