document.addEventListener('DOMContentLoaded', () => {
    const nextFrameBtn = document.getElementById('nextFrameBtn');    
    const timeInput = document.getElementById('timeInput');
    const imgElement = document.querySelector('.frame-preview-img');
    let currentFrame = 0;



    function timeToSeconds(timeString) {
        // Converts "1:15" to 75, or "1:02:30" to 3750
        return timeString.split(':').reduce((acc, time) => (60 * acc) + Number(time), 0);
    }

    // Seconds is a float
    async function frameFromSeconds(seconds) {
        videoFPS = await window.pywebview.api.get_video_fps();
        // Flooring here loses some frame precision maybe. If we are lower than a frame, return 1
        return Math.max(Math.ceil(seconds*videoFPS), 1)
    }
    


    // 1. Initial Load: Runs as soon as Python is ready
    window.addEventListener('pywebviewready', async () => {
        currentFrame = await window.pywebview.api.get_current_preview_frame(); 
        const initialImgData = await window.pywebview.api.fetch_frame_url(currentFrame);
        
        if (initialImgData) {
            console.log(initialImgData)
            imgElement.src = initialImgData;
            imgElement.alt = "Frame " + currentFrame;
        }
    });
    
    // 2. Manual Load: Runs when you type a new frame number and click the button
    nextFrameBtn.addEventListener('click', async () => {
        const calculatedFrame = await frameFromSeconds(timeToSeconds(timeInput.value));
        const frameDelta = parseInt(calculatedFrame);
        currentFrame = currentFrame - frameDelta;
        console.log("Next frame: " + currentFrame);

        nextFrameBtn.textContent = "Loading...";
        const newImgData = await window.pywebview.api.fetch_frame_url(currentFrame);
        
        if (newImgData) {
            imgElement.src = newImgData;
            imgElement.alt = "Frame " + currentFrame;
        }
        nextFrameBtn.textContent = "Next frame";
    });
});


