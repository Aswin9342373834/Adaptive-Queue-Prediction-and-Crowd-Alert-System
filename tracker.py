"""
Person Tracker Module using Ultralytics YOLO with ByteTrack.
Tracks detected people across consecutive video frames and assigns persistent session IDs.
"""

from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from ultralytics import YOLO
import config


class PersonTracker:
    """
    Handles real-time person detection and multi-object tracking (MOT) using ByteTrack.
    """

    def __init__(
        self,
        model_name: str = config.MODEL_NAME,
        conf_threshold: float = config.CONFIDENCE_THRESHOLD,
        tracker_type: str = config.TRACKER_TYPE,
    ):
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        self.tracker_type = tracker_type
        self.model: Optional[YOLO] = None
        self.is_ready = False
        self._load_model()

    def _load_model(self) -> None:
        """
        Loads the YOLO model for detection and tracking.
        """
        try:
            print(f"[INFO] Initializing YOLO Tracker model: '{self.model_name}'...")
            self.model = YOLO(self.model_name)
            self.is_ready = True
            print(f"[SUCCESS] YOLO Tracker model '{self.model_name}' ready with tracker '{self.tracker_type}'.")
        except Exception as e:
            self.is_ready = False
            print(f"[ERROR] Failed to initialize YOLO Tracker: {e}")
            raise RuntimeError(f"Could not load YOLO Tracker '{self.model_name}': {e}")

    def track(self, frame: np.ndarray) -> Tuple[List[Dict[str, Any]], int, int]:
        """
        Runs YOLO tracking on a single frame with state persistence across frames.

        Args:
            frame (np.ndarray): BGR image frame from the webcam.

        Returns:
            Tuple[List[Dict[str, Any]], int, int]:
                - List of track dictionaries:
                    [
                        {
                            "track_id": int or None,
                            "bbox": (x1, y1, x2, y2),
                            "confidence": float,
                            "class_id": int,
                            "class_name": "person"
                        }, ...
                    ]
                - active_tracks_count (int): Count of persons with confirmed active track IDs.
                - total_detected_count (int): Total number of detected persons in the frame.
        """
        if not self.is_ready or self.model is None:
            raise RuntimeError("YOLO Tracker model is not initialized.")

        try:
            # Run tracking with ByteTrack, persist=True ensures IDs persist across frames
            results = self.model.track(
                frame,
                persist=True,
                tracker=self.tracker_type,
                conf=self.conf_threshold,
                classes=[config.PERSON_CLASS_ID],
                verbose=False,
            )
        except Exception as e:
            print(f"[WARN] Tracker execution exception: {e}. Falling back to standard detection...")
            results = self.model(
                frame,
                conf=self.conf_threshold,
                classes=[config.PERSON_CLASS_ID],
                verbose=False,
            )

        tracks: List[Dict[str, Any]] = []
        active_tracks_count = 0
        total_detected_count = 0

        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes

            if boxes is not None and len(boxes) > 0:
                # Extract track IDs if available from ByteTrack
                has_ids = hasattr(boxes, "id") and boxes.id is not None
                track_ids = boxes.id.cpu().numpy().astype(int) if has_ids else None

                for idx, box in enumerate(boxes):
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())

                    # Strictly filter for person class
                    if cls_id == config.PERSON_CLASS_ID:
                        total_detected_count += 1
                        coords = box.xyxy[0].cpu().numpy().astype(int)
                        x1, y1, x2, y2 = coords[0], coords[1], coords[2], coords[3]

                        # Assign persistent track ID
                        track_id = int(track_ids[idx]) if (track_ids is not None and idx < len(track_ids)) else None
                        if track_id is not None:
                            active_tracks_count += 1

                        tracks.append({
                            "track_id": track_id,
                            "bbox": (int(x1), int(y1), int(x2), int(y2)),
                            "confidence": conf,
                            "class_id": cls_id,
                            "class_name": "person",
                        })

        return tracks, active_tracks_count, total_detected_count
