document.addEventListener('DOMContentLoaded', () => {
    const nextFrameBtn = document.getElementById('nextFrameBtn');    
    const timeInput = document.getElementById('timeInput');


    function timeToSeconds(timeString) {
        // Converts "1:15" to 75, or "1:02:30" to 3750
        return timeString.split(':').reduce((acc, time) => (60 * acc) + Number(time), 0);
    }

    
});