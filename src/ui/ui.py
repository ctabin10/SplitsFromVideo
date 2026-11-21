from pathlib import Path
import webview
from video_service import VideoService
import base64
import cv2
import numpy as np

try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None


class Api:

    def __init__(self):
        self.video_service = VideoService()
        self.split_frame_list = []
        self.split_times_list = []
        self.main_window = None
        self.current_frame_preview = 0
        self.ocr = self._init_ocr()

    def _init_ocr(self):
        if PaddleOCR is None:
            return None
        try:
            return PaddleOCR(
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
        except TypeError:
            # Fallback if an older PaddleOCR signature is installed
            try:
                return PaddleOCR(use_angle_cls=False, lang="en")
            except Exception as exc:
                print(f"Failed to initialize PaddleOCR: {exc}")
                return None
        except Exception as exc:
            print(f"Failed to initialize PaddleOCR: {exc}")
            return None

    def _extract_ocr_text(self, crop_bgr) -> str:
        if self.ocr is None or crop_bgr is None or crop_bgr.size == 0:
            return ""

        # Upscale small timer crops slightly so thin digits/colons read more reliably
        h, w = crop_bgr.shape[:2]
        if max(h, w) < 120:
            crop_bgr = cv2.resize(crop_bgr, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)

        texts = []
        if hasattr(self.ocr, "predict"):
            results = self.ocr.predict(crop_bgr)
            for res in results or []:
                rec_texts = None
                if isinstance(res, dict):
                    rec_texts = res.get("rec_texts")
                elif hasattr(res, "get"):
                    rec_texts = res.get("rec_texts")
                elif hasattr(res, "json") and isinstance(res.json, dict):
                    rec_texts = res.json.get("res", {}).get("rec_texts")

                if rec_texts:
                    texts.extend([str(t).strip() for t in rec_texts if str(t).strip()])
        else:
            # Fallback for older PaddleOCR versions using ocr()
            legacy_res = self.ocr.ocr(crop_bgr, cls=False)
            for page in legacy_res or []:
                for line in page or []:
                    if len(line) >= 2 and isinstance(line[1], (list, tuple)) and len(line[1]) >= 1:
                        val = str(line[1][0]).strip()
                        if val:
                            texts.append(val)

        return " ".join(texts).strip()

    def setup_video(self, url: str):
        self.video_service.setup_video(url)

    def capture_frame(self, frame_number: int):
        if frame_number is None:
            return None
        frame = self.video_service.get_video_frame(int(frame_number))
        return frame

    def capture_frame_from_seconds(self, seconds: float):
        frame = self.video_service.get_video_frame_from_seconds(seconds)
        return frame

    def add_to_split_frame_list(self, frame_number):
        if frame_number is None:
            return self.split_frame_list
        self.split_frame_list.append(int(frame_number))
        print(self.split_frame_list)
        self.calculate_splits_from_list()
        return self.split_frame_list

    def get_split_frame_list(self):
        return [f for f in self.split_frame_list if f is not None]

    def get_split_times_list(self):
        return self.split_times_list

    def format_timestamp(self, total_seconds: float) -> str:
        total_ms = round(total_seconds * 1000)

        ms = total_ms % 1000
        total_sec = total_ms // 1000
        seconds = total_sec % 60
        minutes = (total_sec // 60) % 60
        hours = total_sec // 3600

        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}.{ms:03d}"
        return f"{minutes}:{seconds:02d}.{ms:03d}"

    def calculate_splits_from_list(self):
        valid_frames = [f for f in self.split_frame_list if isinstance(f, (int, float))]
        split_times_list = []
        fps = self.get_video_fps() or 60
        for i in range(len(valid_frames) - 1):
            current_split_length = valid_frames[i] - valid_frames[i + 1]
            print("Current split length: " + str(current_split_length))
            split_times_list.append(self.format_timestamp(current_split_length / fps))
        self.split_times_list = split_times_list
        print(split_times_list)

    def handle_frame_popup(self, frame_number):
        safe_frame = int(float(frame_number)) if frame_number is not None else 0
        self.current_frame_preview = safe_frame
        self.split_frame_list.append(safe_frame)
        template_path = Path(__file__).parent / "frame_preview.html"

        webview.create_window(
            title=f"Frame Preview - #{safe_frame}",
            url=str(template_path.resolve()),
            width=1280,
            height=720,
            resizable=True,
            js_api=self
        )

    def get_video_fps(self):
        fps = self.video_service.get_video_fps()
        return fps if fps else 60

    def get_current_preview_frame(self):
        if self.current_frame_preview is None:
            self.current_frame_preview = 0
        return int(self.current_frame_preview)

    def fetch_frame_url(self, frame_number: int):
        if frame_number is None:
            frame_number = self.get_current_preview_frame()
        safe_frame = int(float(frame_number))
        self.current_frame_preview = safe_frame
        frame = self.capture_frame(safe_frame)
        if frame is not None:
            return self.video_service.get_frame_url(frame)
        return None

    def read_text_from_region(self, frame_number, region, region_key=None):
        if frame_number is None or not region:
            return ""
        raw_frame = self.video_service.get_raw_video_frame(int(float(frame_number)))
        if raw_frame is None:
            return ""

        h, w = raw_frame.shape[:2]
        x1 = max(0, min(w, int(float(region.get("x", 0)) * w)))
        y1 = max(0, min(h, int(float(region.get("y", 0)) * h)))
        x2 = max(x1 + 1, min(w, int((float(region.get("x", 0)) + float(region.get("width", 0))) * w)))
        y2 = max(y1 + 1, min(h, int((float(region.get("y", 0)) + float(region.get("height", 0))) * h)))

        crop = raw_frame[y1:y2, x1:x2]
        if crop.size == 0:
            return ""

        return self._extract_ocr_text(crop)

    def show_about(self):
        print("About clicked")
        return {"message": "SplitsFromVideo v1.0"}

    def show_instructions(self):
        print("How to use clicked")

    def open_settings(self):
        print("Settings clicked")

    def process_download(self, url, fmt, file_name):
        print(f"Downloading: URL={url}, Format={fmt}, Name={file_name}")
        return {"status": "success", "message": f"Saved {file_name or 'video'} as {fmt}!"}


def run():
    html_path = Path(__file__).parent / "ui.html"

    api = Api()
    api._main_window = webview.create_window(
        title="SplitsFromVideo",
        url=str(html_path.resolve()),
        js_api=api,
        width=960,
        height=620,
        resizable=True
    )
    webview.start(debug=True, http_server=True)


if __name__ == "__main__":
    run()