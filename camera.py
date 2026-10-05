"""
Camera Stream Module using OpenCV.
Handles robust webcam acquisition, resolution setup, and clean resource release.
"""

from typing import Optional, Tuple
import cv2
import numpy as np
import config


class CameraStream:
    """
    Manages live camera capture with error handling and parameter configuration.
    """

    def __init__(
        self,
        camera_index: int = config.CAMERA_INDEX,
        width: int = config.FRAME_WIDTH,
        height: int = config.FRAME_HEIGHT,
        fps: int = config.CAMERA_FPS,
    ):
        self.camera_index = camera_index
        self.target_width = width
        self.target_height = height
        self.target_fps = fps
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_connected = False

    def start(self) -> bool:
        """
        Initializes and opens the camera capture device.
        """
        print(f"[INFO] Attempting to open webcam device at index {self.camera_index}...")
        # DirectShow backend on Windows is often faster and more stable
        self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
        
        if not self.cap.isOpened():
            # Fallback to default backend if DSHOW fails
            print("[WARN] CAP_DSHOW not supported, falling back to default backend...")
            self.cap = cv2.VideoCapture(self.camera_index)

        if not self.cap.isOpened():
            self.is_connected = False
            print(f"[ERROR] Failed to open camera device at index {self.camera_index}.")
            return False

        # Configure camera stream properties
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.target_width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.target_height)
        self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)

        # Read a test frame to ensure stream is active
        ret, frame = self.cap.read()
        if not ret or frame is None:
            self.is_connected = False
            print("[ERROR] Camera opened but failed to grab initial frame.")
            return False

        self.is_connected = True
        actual_w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"[SUCCESS] Camera connected successfully (Resolution: {actual_w}x{actual_h}).")
        return True

    def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Reads the next frame from the camera stream.
        """
        if not self.is_connected or self.cap is None:
            return False, None

        ret, frame = self.cap.read()
        if not ret or frame is None:
            self.is_connected = False
            return False, None

        return True, frame

    def release(self) -> None:
        """
        Safely releases the webcam capture device.
        """
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        self.is_connected = False
        print("[INFO] Camera stream released.")
