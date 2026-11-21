document.addEventListener('DOMContentLoaded', () => {
    const nextFrameBtn = document.getElementById('nextFrameBtn');
    const timeInput = document.getElementById('timeInput');
    const recordSplitBtn = document.getElementById('recordSplitBtn');
    const imgElement = document.querySelector('.frame-preview-img');

    const overlayEl = document.getElementById('regionOverlay') || imgElement?.parentElement;
    const splitBoxEl = document.getElementById('splitRegionBox');
    const totalBoxEl = document.getElementById('totalRegionBox');
    const selectSplitBtn = document.getElementById('selectSplitRegionBtn');
    const selectTotalBtn = document.getElementById('selectTotalRegionBtn');
    const splitTimeInput = document.getElementById('splitTimeInput') || timeInput;
    const totalRunInput = document.getElementById('totalRunInput');

    let currentFrame = 0;

    let isSelectingRegion = false;
    let isDraggingRegion = false;
    let activeRegionKey = 'splitTimer';
    let dragStartX = 0;
    let dragStartY = 0;
    let liveDisplayRegion = null;

    const displayRegions = {
        splitTimer: null,
        totalRun: null
    };

    const normalizedRegions = {
        splitTimer: null,
        totalRun: null
    };

    function timeToSeconds(timeString) {
        if (!timeString) return NaN;
        return String(timeString)
            .trim()
            .split(':')
            .reduce((acc, time) => (60 * acc) + Number(time), 0);
    }

    async function frameFromSeconds(seconds) {
        const videoFPS = await window.pywebview.api.get_video_fps();
        const safeFps = Number(videoFPS) > 0 ? Number(videoFPS) : 60;
        return Math.max(Math.ceil(seconds * safeFps), 1);
    }

    function isZeroTimer(text) {
        if (!text) return false;
        const cleaned = String(text).trim();
        if (cleaned === '0:00' || cleaned === '00:00' || cleaned === '0:00.000' || cleaned === '00:00.000') {
            return true;
        }
        const seconds = timeToSeconds(cleaned);
        return !Number.isNaN(seconds) && seconds === 0;
    }

    function getBoxElementForKey(key) {
        return key === 'totalRun' ? totalBoxEl : splitBoxEl;
    }

    function getTargetBounds() {
        const imgRect = imgElement?.getBoundingClientRect();
        if (imgRect && imgRect.width > 0 && imgRect.height > 0) {
            return imgRect;
        }
        const overlayRect = overlayEl?.getBoundingClientRect();
        if (overlayRect && overlayRect.width > 0 && overlayRect.height > 0) {
            return overlayRect;
        }
        return null;
    }

    function renderSingleBox(boxEl, region) {
        if (!boxEl) return;
        if (!region) {
            boxEl.style.display = 'none';
            return;
        }
        const bounds = getTargetBounds();
        const overlayRect = overlayEl?.getBoundingClientRect();
        const offsetX = bounds && overlayRect ? (bounds.left - overlayRect.left) : 0;
        const offsetY = bounds && overlayRect ? (bounds.top - overlayRect.top) : 0;

        boxEl.style.display = 'block';
        boxEl.style.left = `${offsetX + region.left}px`;
        boxEl.style.top = `${offsetY + region.top}px`;
        boxEl.style.width = `${region.width}px`;
        boxEl.style.height = `${region.height}px`;
    }

    function renderAllRegionBoxes() {
        renderSingleBox(splitBoxEl, displayRegions.splitTimer);
        renderSingleBox(totalBoxEl, displayRegions.totalRun);

        if (isDraggingRegion && liveDisplayRegion) {
            renderSingleBox(getBoxElementForKey(activeRegionKey), liveDisplayRegion);
        }
    }

    function syncDisplayRegionsFromNormalized() {
        const bounds = getTargetBounds();
        if (!bounds) return;

        for (const key of ['splitTimer', 'totalRun']) {
            const norm = normalizedRegions[key];
            if (!norm) {
                displayRegions[key] = null;
            } else {
                displayRegions[key] = {
                    left: norm.x * bounds.width,
                    top: norm.y * bounds.height,
                    width: norm.width * bounds.width,
                    height: norm.height * bounds.height
                };
            }
        }
        renderAllRegionBoxes();
    }

    function updateSelectionButtonState() {
        selectSplitBtn?.classList.toggle('is-active', isSelectingRegion && activeRegionKey === 'splitTimer');
        selectTotalBtn?.classList.toggle('is-active', isSelectingRegion && activeRegionKey === 'totalRun');
    }

    function startRegionSelection(key) {
        activeRegionKey = key;
        isSelectingRegion = true;
        updateSelectionButtonState();
    }

    selectSplitBtn?.addEventListener('click', () => startRegionSelection('splitTimer'));
    selectTotalBtn?.addEventListener('click', () => startRegionSelection('totalRun'));

    if (overlayEl) {
        overlayEl.addEventListener('pointerdown', (event) => {
            if (!isSelectingRegion) return;
            const bounds = getTargetBounds();
            if (!bounds) return;

            isDraggingRegion = true;
            dragStartX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
            dragStartY = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);
            liveDisplayRegion = { left: dragStartX, top: dragStartY, width: 0, height: 0 };
            overlayEl.setPointerCapture(event.pointerId);
            renderAllRegionBoxes();
        });

        overlayEl.addEventListener('pointermove', (event) => {
            if (!isDraggingRegion) return;
            const bounds = getTargetBounds();
            if (!bounds) return;

            const currentX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width);
            const currentY = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height);

            liveDisplayRegion = {
                left: Math.min(dragStartX, currentX),
                top: Math.min(dragStartY, currentY),
                width: Math.abs(currentX - dragStartX),
                height: Math.abs(currentY - dragStartY)
            };
            renderAllRegionBoxes();
        });

        overlayEl.addEventListener('pointerup', (event) => {
            if (!isDraggingRegion) return;
            isDraggingRegion = false;
            isSelectingRegion = false;
            updateSelectionButtonState();

            if (overlayEl.hasPointerCapture(event.pointerId)) {
                overlayEl.releasePointerCapture(event.pointerId);
            }

            const bounds = getTargetBounds();
            if (!liveDisplayRegion || liveDisplayRegion.width < 4 || liveDisplayRegion.height < 4 || !bounds) {
                liveDisplayRegion = null;
                renderAllRegionBoxes();
                return;
            }

            displayRegions[activeRegionKey] = { ...liveDisplayRegion };
            normalizedRegions[activeRegionKey] = {
                x: liveDisplayRegion.left / bounds.width,
                y: liveDisplayRegion.top / bounds.height,
                width: liveDisplayRegion.width / bounds.width,
                height: liveDisplayRegion.height / bounds.height
            };
            liveDisplayRegion = null;
            renderAllRegionBoxes();
        });
    }

    imgElement?.addEventListener('load', syncDisplayRegionsFromNormalized);
    window.addEventListener('resize', syncDisplayRegionsFromNormalized);

    async function readAndFillRegion(regionKey, targetInputEl) {
        const region = normalizedRegions[regionKey];
        if (!region || !targetInputEl || !window.pywebview?.api?.read_text_from_region) {
            return null;
        }

        const extractedText = await window.pywebview.api.read_text_from_region(
            currentFrame,
            region,
            regionKey
        );

        if (extractedText !== null && extractedText !== undefined) {
            const cleanedText = String(extractedText).trim();
            targetInputEl.value = cleanedText;
            targetInputEl.dispatchEvent(new Event('input', { bubbles: true }));
            return cleanedText;
        }
        return null;
    }

    async function reverseUntilSplitZero(maxSteps = 500) {
        if (!window.pywebview?.api) return;

        for (let step = 0; step < maxSteps; step++) {
            const splitText = await readAndFillRegion('splitTimer', splitTimeInput);
            await readAndFillRegion('totalRun', totalRunInput);

            if (isZeroTimer(splitText) || currentFrame <= 0) {
                break;
            }

            const stepSeconds = timeToSeconds(timeInput?.value || splitText || '0:01');
            const safeSeconds = Number.isNaN(stepSeconds) || stepSeconds <= 0 ? 1 : stepSeconds;
            const calculatedFrame = await frameFromSeconds(safeSeconds);
            const frameDelta = parseInt(calculatedFrame, 10);

            currentFrame = Math.max(0, currentFrame - frameDelta);

            const newImgData = await window.pywebview.api.fetch_frame_url(currentFrame);
            if (newImgData && imgElement) {
                imgElement.src = newImgData;
                imgElement.alt = 'Frame ' + currentFrame;
            }
        }
    }

    async function loadInitialFrame() {
        if (!window.pywebview?.api) return;
        const previewFrame = await window.pywebview.api.get_current_preview_frame();
        currentFrame = Number.isFinite(Number(previewFrame)) ? parseInt(previewFrame, 10) : 0;

        const initialImgData = await window.pywebview.api.fetch_frame_url(currentFrame);
        if (initialImgData && imgElement) {
            imgElement.src = initialImgData;
            imgElement.alt = 'Frame ' + currentFrame;
            syncDisplayRegionsFromNormalized();
        }
    }

    if (window.pywebview?.api) {
        loadInitialFrame();
    } else {
        window.addEventListener('pywebviewready', loadInitialFrame);
    }

    nextFrameBtn.addEventListener('click', async () => {
        nextFrameBtn.disabled = true;
        const originalText = nextFrameBtn.textContent;
        nextFrameBtn.textContent = 'Scanning...';

        try {
            if (normalizedRegions.splitTimer && window.pywebview?.api?.read_text_from_region) {
                await reverseUntilSplitZero();
            } else {
                const parsedSeconds = timeToSeconds(timeInput.value);
                const safeSeconds = Number.isNaN(parsedSeconds) ? 0 : parsedSeconds;
                const calculatedFrame = await frameFromSeconds(safeSeconds);
                const frameDelta = parseInt(calculatedFrame, 10);
                currentFrame = Math.max(0, currentFrame - frameDelta);

                const newImgData = await window.pywebview.api.fetch_frame_url(currentFrame);
                if (newImgData && imgElement) {
                    imgElement.src = newImgData;
                    imgElement.alt = 'Frame ' + currentFrame;
                    syncDisplayRegionsFromNormalized();
                }
            }
        } finally {
            nextFrameBtn.disabled = false;
            nextFrameBtn.textContent = originalText || 'Next frame';
        }
    });

    recordSplitBtn.addEventListener('click', async () => {
        const safeFrame = Number.isFinite(Number(currentFrame)) ? parseInt(currentFrame, 10) : 0;
        currentFrame = safeFrame;
        await window.pywebview.api.add_to_split_frame_list(safeFrame);
        await window.pywebview.api.get_split_frame_list();
    });
});