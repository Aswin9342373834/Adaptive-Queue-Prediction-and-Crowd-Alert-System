"""
Configuration settings for Real-Time People Detection, Tracking, Waiting Area (ROI),
Digital Queue, Waiting-Time Estimation, Queue Congestion Prediction, and ESP32 Hardware Integration.
"""

import os

# ==============================================================================
# 1. Camera Settings
# ==============================================================================
CAMERA_INDEX = 0      # Default webcam (0 for built-in, 1 or 2 for external USB cameras)
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720
CAMERA_FPS = 30

# ==============================================================================
# 2. YOLO Model & Tracking Settings
# ==============================================================================
MODEL_NAME = "yolov8n.pt"
CONFIDENCE_THRESHOLD = 0.45      # Detection confidence threshold for person class
PERSON_CLASS_ID = 0              # Class index 0 is 'person' in COCO dataset
TRACKER_TYPE = "bytetrack.yaml"  # ByteTrack algorithm configuration

# ==============================================================================
# 3. Waiting Area Region of Interest (ROI) Configuration
# ==============================================================================
# Normalized coordinates (0.0 to 1.0) of [xmin, ymin, xmax, ymax]
WAITING_AREA_ROI = (0.15, 0.20, 0.85, 0.85)

# Waiting Area visual styling
ROI_LABEL = "WAITING AREA"
ROI_BORDER_COLOR = (0, 200, 255)   # Amber / Vivid Gold (BGR)
ROI_FILL_COLOR = (0, 160, 220)     # Semi-transparent overlay fill (BGR)
ROI_FILL_ALPHA = 0.12              # Subtle transparency for the zone

# Status Colors for Tracked Individuals
COLOR_WAITING = (0, 255, 120)      # Vivid Green for people INSIDE Waiting Area
COLOR_OUTSIDE = (160, 160, 160)    # Muted Gray for people OUTSIDE Waiting Area

# ==============================================================================
# 4. Digital Queue & Token Management Settings
# ==============================================================================
TOKEN_PREFIX = "C"
TOKEN_START_NUMBER = 1
TOKEN_DIGITS = 3       # Formats token IDs like C001, C002, etc.

# ==============================================================================
# 5. Waiting Time Estimation Settings
# ==============================================================================
# Initial bootstrap estimate in seconds (3 minutes) used ONLY until actual completed
# services provide measured average service durations.
BOOTSTRAP_SERVICE_TIME_SECONDS = 180.0

# ==============================================================================
# 6. Congestion Prediction & Alert System Thresholds (Phase 6)
# ==============================================================================
# People / Token threshold levels for congestion classification
CONGESTION_MODERATE_THRESHOLD = 5    # >= 5 waiting triggers MODERATE
CONGESTION_HIGH_THRESHOLD = 10       # >= 10 waiting triggers HIGH
CONGESTION_CRITICAL_THRESHOLD = 15   # >= 15 waiting triggers CRITICAL

# Maximum waiting time threshold for long-wait alert (in minutes)
MAX_WAIT_ALERT_MINUTES = 20.0

# Observation window for computing arrival rate and queue growth trend (seconds)
QUEUE_ANALYSIS_WINDOW_SECONDS = 60.0

# Forward prediction horizon for anticipating congestion levels (seconds)
PREDICTION_HORIZON_SECONDS = 300.0   # 5-minute forward horizon

# In-memory history retention limit
MAX_HISTORY_ENTRIES = 500

# ==============================================================================
# 7. ESP32 Physical Hardware Alert Integration (Phase 8)
# ==============================================================================
ESP32_ENABLED = True
ESP32_IP = os.getenv("ESP32_IP", "192.168.1.100")
ESP32_PORT = int(os.getenv("ESP32_PORT", "80"))
ESP32_TIMEOUT_SECONDS = 0.8
ESP32_HEARTBEAT_INTERVAL_SECONDS = 4.0

# ESP32 Pin Mapping Reference
GPIO_LED_GREEN = 25    # Normal Alert Level
GPIO_LED_YELLOW = 26   # Moderate Alert Level
GPIO_LED_ORANGE = 27   # High Alert Level
GPIO_LED_RED = 14      # Critical Alert Level
GPIO_BUZZER = 13       # Critical / Long-Wait Intermittent Alarm

# ==============================================================================
# 8. UI & Display Settings
# ==============================================================================
WINDOW_NAME = "PS 37 - Adaptive Queue & Crowd Alert System [Phase 8: ESP32 Hardware Integration]"
STATUS_BG_COLOR = (20, 20, 20)     # Dark panel background for HUD
HUD_ACCENT_COLOR = (0, 180, 255)   # Amber/Orange HUD accent
TEXT_COLOR = (255, 255, 255)       # White
QUEUE_PANEL_BG = (15, 15, 15)      # Deep dark panel for Bank Queue HUD

# Distinct color palette for tracked individuals (BGR format)
TRACK_PALETTE = [
    (0, 220, 255),   # Cyan
    (0, 255, 128),   # Emerald Green
    (255, 128, 0),   # Vivid Blue
    (255, 0, 200),   # Magenta
    (0, 165, 255),   # Orange
    (200, 255, 0),   # Lime
    (180, 105, 255), # Hot Pink / Purple
    (0, 215, 255),   # Bright Gold
]
