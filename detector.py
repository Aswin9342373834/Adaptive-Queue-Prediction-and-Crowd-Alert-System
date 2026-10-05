"""
Person Detector Module using Ultralytics YOLO.
Exclusively filters and tracks the 'person' class in real-time.
"""

from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from ultralytics import YOLO
import config


class PersonDetector:
    """
    Handles YOLO model loading, inference, and filtering strictly for person detections.
    """

    def __init__(
        self,
        model_name: str = config.MODEL_NAME,
        conf_threshold: float = config.CONFIDENCE_THRESHOLD,
    ):
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        self.model: Optional[YOLO] = None
        self.is_ready = False
        self._load_model()

    def _load_model(self) -> None:
        """
        Loads the YOLO model. Automatically downloads the pretrained weights if not found locally.
        """
        try:
            print(f"[INFO] Loading YOLO model: '{self.model_name}'...")
            self.model = YOLO(self.model_name)
            self.is_ready = True
            print(f"[SUCCESS] YOLO model '{self.model_name}' loaded and ready for inference.")
        except Exception as e:
            self.is_ready = False
            print(f"[ERROR] Failed to load YOLO model: {e}")
            raise RuntimeError(f"Could not load YOLO model '{self.model_name}': {e}")

    def detect(self, frame: np.ndarray) -> Tuple[List[Dict[str, Any]], int]:
        """
        Runs YOLO inference on a single frame and extracts only person detections.

        Args:
            frame (np.ndarray): BGR image frame from the webcam.

        Returns:
            Tuple[List[Dict[str, Any]], int]:
                - List of detection dictionaries:
                    [
                        {
                            "bbox": (x1, y1, x2, y2),
                            "confidence": float,
                            "class_id": int,
                            "class_name": "person"
                        }, ...
                    ]
                - Total count of detected people in this frame.
        """
        if not self.is_ready or self.model is None:
            raise RuntimeError("YOLO model is not initialized.")

        # Run inference filtering specifically for class 0 ('person') to optimize processing
        results = self.model(
            frame,
            conf=self.conf_threshold,
            classes=[config.PERSON_CLASS_ID],
            verbose=False
        )

        detections: List[Dict[str, Any]] = []

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes

            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    
                    # Ensure it is strictly person class
                    if cls_id == config.PERSON_CLASS_ID:
                        coords = box.xyxy[0].cpu().numpy().astype(int)
                        x1, y1, x2, y2 = coords[0], coords[1], coords[2], coords[3]
                        
                        detections.append({
                            "bbox": (int(x1), int(y1), int(x2), int(y2)),
                            "confidence": conf,
                            "class_id": cls_id,
                            "class_name": "person"
                        })

        count = len(detections)
        return detections, count
