"""
Waiting Area (ROI) Management Module.
Handles geometric Region of Interest (ROI) mapping, containment verification, and waiting counts.
"""

from typing import List, Tuple, Dict, Any
import numpy as np
import config


class ROIManager:
    """
    Manages the Waiting Area ROI geometry, point containment calculations,
    and classifies tracked people as WAITING vs OUTSIDE.
    """

    def __init__(self, roi_coords: Tuple[float, float, float, float] = config.WAITING_AREA_ROI):
        """
        Args:
            roi_coords: Tuple of (xmin, ymin, xmax, ymax), either as normalized ratios (0.0 to 1.0)
                        or absolute pixel coordinates.
        """
        self.roi_coords = roi_coords

    def get_pixel_bounds(self, frame_shape: Tuple[int, int, ...]) -> Tuple[int, int, int, int]:
        """
        Converts the ROI coordinates into absolute pixel coordinates for the given frame shape.

        Args:
            frame_shape: Shape of the image frame (height, width, ...).

        Returns:
            Tuple[int, int, int, int]: (rx1, ry1, rx2, ry2) in pixel coordinates.
        """
        h, w = frame_shape[:2]
        x1, y1, x2, y2 = self.roi_coords

        # If values are normalized ratios (<= 1.0), scale to frame dimensions
        if max(x1, y1, x2, y2) <= 1.0:
            rx1 = int(x1 * w)
            ry1 = int(y1 * h)
            rx2 = int(x2 * w)
            ry2 = int(y2 * h)
        else:
            rx1 = int(x1)
            ry1 = int(y1)
            rx2 = int(x2)
            ry2 = int(y2)

        # Clamp within frame boundaries
        rx1 = max(0, min(rx1, w - 1))
        ry1 = max(0, min(ry1, h - 1))
        rx2 = max(rx1 + 1, min(rx2, w - 1))
        ry2 = max(ry1 + 1, min(ry2, h - 1))

        return rx1, ry1, rx2, ry2

    @staticmethod
    def get_person_center(bbox: Tuple[int, int, int, int]) -> Tuple[int, int]:
        """
        Calculates the center point (cx, cy) of a person's bounding box.
        """
        x1, y1, x2, y2 = bbox
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)
        return cx, cy

    def is_point_inside(self, point: Tuple[int, int], pixel_bounds: Tuple[int, int, int, int]) -> bool:
        """
        Determines whether a 2D point (cx, cy) is inside the ROI rectangle.
        """
        cx, cy = point
        rx1, ry1, rx2, ry2 = pixel_bounds
        return (rx1 <= cx <= rx2) and (ry1 <= cy <= ry2)

    def evaluate_tracks(
        self,
        tracks: List[Dict[str, Any]],
        frame_shape: Tuple[int, int, ...],
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Evaluates each tracked person against the Waiting Area ROI.

        Args:
            tracks: List of track dictionaries from PersonTracker.
            frame_shape: Frame dimensions (height, width, ...).

        Returns:
            Tuple[List[Dict[str, Any]], int]:
                - Enriched tracks with 'is_waiting' (bool) and 'center' (Tuple[int, int]).
                - Total count of people currently inside the Waiting Area.
        """
        pixel_bounds = self.get_pixel_bounds(frame_shape)
        evaluated_tracks: List[Dict[str, Any]] = []
        waiting_count = 0

        for trk in tracks:
            trk_copy = dict(trk)
            bbox = trk["bbox"]
            center = self.get_person_center(bbox)
            is_inside = self.is_point_inside(center, pixel_bounds)

            trk_copy["center"] = center
            trk_copy["is_waiting"] = is_inside
            trk_copy["status"] = "WAITING" if is_inside else "OUTSIDE"

            if is_inside:
                waiting_count += 1

            evaluated_tracks.append(trk_copy)

        return evaluated_tracks, waiting_count
