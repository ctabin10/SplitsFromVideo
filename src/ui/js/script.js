document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadBtn');
    const urlInput = document.getElementById('urlInput');
    const formatSelect = document.getElementById('formatSelect');
    const fileNameInput = document.getElementById('fileNameInput');
    const videoPlayer = document.getElementById('videoPlayer');

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