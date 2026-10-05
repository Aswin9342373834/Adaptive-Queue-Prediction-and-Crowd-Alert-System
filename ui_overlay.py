"""
UI and HUD Overlay Module.
Renders real-time Waiting Area ROI, tracking badges, vision counts,
Smart Bank Digital Queue, Waiting-Time Estimation, and Congestion Prediction & Alert HUD.
"""

from typing import List, Dict, Any, Tuple
import cv2
import numpy as np
import config


class UIOverlay:
    """
    Renders visual overlays, ROI bounds, tracking badges, and the Bank Queue & Alert HUD.
    """

    def __init__(self):
        self.font = cv2.FONT_HERSHEY_SIMPLEX

    def draw_waiting_area(
        self,
        frame: np.ndarray,
        pixel_bounds: Tuple[int, int, int, int],
        waiting_count: int = 0,
    ) -> np.ndarray:
        """
        Draws the Waiting Area ROI rectangle with translucent fill, borders, and header badge.
        """
        rx1, ry1, rx2, ry2 = pixel_bounds

        # 1. Semi-transparent ROI fill
        overlay = frame.copy()
        cv2.rectangle(overlay, (rx1, ry1), (rx2, ry2), config.ROI_FILL_COLOR, -1)
        cv2.addWeighted(overlay, config.ROI_FILL_ALPHA, frame, 1 - config.ROI_FILL_ALPHA, 0, frame)

        # 2. Main ROI Border (vibrant gold/amber)
        cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), config.ROI_BORDER_COLOR, 2)

        # 3. Corner Brackets
        corner_len = min(25, (rx2 - rx1) // 6, (ry2 - ry1) // 6)
        if corner_len > 0:
            accent_col = (255, 255, 255)
            # Top-Left
            cv2.line(frame, (rx1, ry1), (rx1 + corner_len, ry1), accent_col, 3)
            cv2.line(frame, (rx1, ry1), (rx1, ry1 + corner_len), accent_col, 3)
            # Top-Right
            cv2.line(frame, (rx2, ry1), (rx2 - corner_len, ry1), accent_col, 3)
            cv2.line(frame, (rx2, ry1), (rx2, ry1 + corner_len), accent_col, 3)
            # Bottom-Left
            cv2.line(frame, (rx1, ry2), (rx1 + corner_len, ry2), accent_col, 3)
            cv2.line(frame, (rx1, ry2), (rx1, ry2 - corner_len), accent_col, 3)
            # Bottom-Right
            cv2.line(frame, (rx2, ry2), (rx2 - corner_len, ry2), accent_col, 3)
            cv2.line(frame, (rx2, ry2), (rx2, ry2 - corner_len), accent_col, 3)

        # 4. ROI Header Label Badge
        roi_header = f"{config.ROI_LABEL} (Count: {waiting_count})"
        (tw, th), _ = cv2.getTextSize(roi_header, self.font, 0.58, 2)
        badge_x = rx1 + 10
        badge_y = max(0, ry1 - th - 12)

        cv2.rectangle(
            frame,
            (badge_x - 4, badge_y),
            (badge_x + tw + 14, badge_y + th + 10),
            config.ROI_BORDER_COLOR,
            -1,
        )
        cv2.putText(
            frame,
            roi_header,
            (badge_x + 3, badge_y + th + 4),
            self.font,
            0.58,
            (0, 0, 0),
            2,
            cv2.LINE_AA,
        )

        return frame

    def draw_tracks(self, frame: np.ndarray, tracks: List[Dict[str, Any]]) -> np.ndarray:
        """
        Draws bounding boxes, persistent Tracking IDs, WAITING/OUTSIDE status badges,
        and center point crosshairs.
        """
        for trk in tracks:
            x1, y1, x2, y2 = trk["bbox"]
            conf = trk["confidence"]
            track_id = trk["track_id"]
            is_waiting = trk.get("is_waiting", False)
            center = trk.get("center", (int((x1 + x2) / 2), int((y1 + y2) / 2)))

            if is_waiting:
                box_color = config.COLOR_WAITING
                status_text = "WAITING"
            else:
                box_color = config.COLOR_OUTSIDE
                status_text = "OUTSIDE"

            if track_id is not None:
                label = f"ID: {track_id:02d} -> {status_text} ({conf:.0%})"
            else:
                label = f"Person -> {status_text} ({conf:.0%})"

            thickness = 2 if is_waiting else 1
            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, thickness)

            (w, h), _ = cv2.getTextSize(label, self.font, 0.50, 1)
            y_label_top = max(0, y1 - h - 10)
            cv2.rectangle(
                frame,
                (x1, y_label_top),
                (x1 + w + 8, y_label_top + h + 8),
                box_color,
                -1,
            )

            text_color = (0, 0, 0) if is_waiting else (255, 255, 255)
            cv2.putText(
                frame,
                label,
                (x1 + 4, y_label_top + h + 3),
                self.font,
                0.50,
                text_color,
                1 if not is_waiting else 2,
                cv2.LINE_AA,
            )

            cx, cy = center
            cv2.circle(frame, (cx, cy), 4, box_color, -1)
            cv2.circle(frame, (cx, cy), 8, (255, 255, 255), 1)
            cv2.line(frame, (cx - 8, cy), (cx + 8, cy), box_color, 1)
            cv2.line(frame, (cx, cy - 8), (cx, cy + 8), box_color, 1)

        return frame

    def draw_hud(
        self,
        frame: np.ndarray,
        people_detected: int,
        waiting_count: int,
        active_tracks: int,
        fps: float,
        queue_summary: Dict[str, Any],
        wait_estimates: Dict[str, Any],
        telemetry: Dict[str, Any],
        alert_state: Dict[str, Any],
        camera_status: str = "CONNECTED",
        yolo_status: str = "RUNNING",
        tracking_status: str = "RUNNING",
    ) -> np.ndarray:
        """
        Draws the top-left system diagnostics HUD and the right-side SMART BANK QUEUE & Congestion Alert HUD.
        """
        h_frame, w_frame = frame.shape[:2]

        # ======================================================================
        # 1. Top-Left System Status Panel
        # ======================================================================
        sys_w, sys_h = 230, 130
        sys_x, sys_y = 15, 15

        overlay = frame.copy()
        cv2.rectangle(overlay, (sys_x, sys_y), (sys_x + sys_w, sys_y + sys_h), config.STATUS_BG_COLOR, -1)
        cv2.addWeighted(overlay, 0.80, frame, 0.20, 0, frame)
        cv2.rectangle(frame, (sys_x, sys_y), (sys_x + sys_w, sys_y + sys_h), (70, 70, 70), 1)

        cv2.putText(frame, "SYSTEM STATUS", (sys_x + 12, sys_y + 20), self.font, 0.48, config.HUD_ACCENT_COLOR, 1, cv2.LINE_AA)
        cv2.line(frame, (sys_x + 10, sys_y + 25), (sys_x + sys_w - 10, sys_y + 25), (60, 60, 60), 1)

        status_items = [
            ("CAMERA:", camera_status, (0, 255, 0) if camera_status == "CONNECTED" else (0, 0, 255)),
            ("YOLO:", yolo_status, (0, 255, 0) if yolo_status == "RUNNING" else (0, 0, 255)),
            ("TRACKING:", tracking_status, (0, 255, 0) if tracking_status == "RUNNING" else (0, 0, 255)),
            ("FPS:", f"{fps:.1f}", (0, 255, 0) if fps >= 20 else (0, 165, 255)),
        ]

        y_off = sys_y + 45
        for label, val, val_col in status_items:
            cv2.putText(frame, label, (sys_x + 12, y_off), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
            cv2.putText(frame, val, (sys_x + 110, y_off), self.font, 0.40, val_col, 1, cv2.LINE_AA)
            y_off += 20

        # ======================================================================
        # 2. Right Side SMART BANK QUEUE & Congestion Alert Panel
        # ======================================================================
        q_w, q_h = 375, 590
        q_x = w_frame - q_w - 15
        q_y = 15

        # Background panel
        overlay = frame.copy()
        cv2.rectangle(overlay, (q_x, q_y), (q_x + q_w, q_y + q_h), config.QUEUE_PANEL_BG, -1)
        cv2.addWeighted(overlay, 0.90, frame, 0.10, 0, frame)

        # Dynamic Border Color based on Congestion Level
        level = alert_state.get("level", "NORMAL")
        if level == "CRITICAL":
            border_color = (0, 0, 255)     # Red
        elif level == "HIGH":
            border_color = (0, 140, 255)   # Orange
        elif level == "MODERATE":
            border_color = (0, 220, 255)   # Yellow
        else:
            border_color = (0, 255, 120)   # Green

        cv2.rectangle(frame, (q_x, q_y), (q_x + q_w, q_y + q_h), border_color, 2)

        # Header
        cv2.putText(frame, "SMART BANK QUEUE", (q_x + 85, q_y + 26), self.font, 0.65, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.line(frame, (q_x + 15, q_y + 34), (q_x + q_w - 15, q_y + 34), (80, 80, 80), 1)

        # Section 1: Live Counts
        tokens_waiting = queue_summary.get("tokens_waiting_count", 0)
        cv2.putText(frame, "PEOPLE DETECTED:", (q_x + 16, q_y + 54), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"{people_detected}", (q_x + 280, q_y + 54), self.font, 0.46, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.putText(frame, "WAITING AREA:", (q_x + 16, q_y + 74), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"{waiting_count}", (q_x + 280, q_y + 74), self.font, 0.48, config.COLOR_WAITING, 2, cv2.LINE_AA)

        cv2.putText(frame, "TOKENS WAITING:", (q_x + 16, q_y + 94), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"{tokens_waiting}", (q_x + 280, q_y + 94), self.font, 0.48, (0, 255, 255), 2, cv2.LINE_AA)

        cv2.line(frame, (q_x + 15, q_y + 106), (q_x + q_w - 15, q_y + 106), (60, 60, 60), 1)

        # Section 2: Flow Rates & Timings
        avg_display = wait_estimates.get("avg_display", "3 min")
        max_wait_min = telemetry.get("max_wait_minutes", 0.0)
        arrival_rate = telemetry.get("arrival_rate", 0.0)
        service_rate = telemetry.get("service_rate", 0.0)

        cv2.putText(frame, "AVG SERVICE TIME:", (q_x + 16, q_y + 126), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"{avg_display}", (q_x + 160, q_y + 126), self.font, 0.38, (0, 220, 255), 1, cv2.LINE_AA)

        cv2.putText(frame, "MAX WAIT TIME:", (q_x + 16, q_y + 146), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        max_wait_str = f"{max_wait_min:.1f} min" if max_wait_min > 0 else "0.0 min"
        cv2.putText(frame, max_wait_str, (q_x + 160, q_y + 146), self.font, 0.40, (0, 255, 255), 2, cv2.LINE_AA)

        cv2.putText(frame, "ARRIVAL RATE:", (q_x + 16, q_y + 166), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"{arrival_rate:.1f} / min", (q_x + 160, q_y + 166), self.font, 0.38, (255, 255, 255), 1, cv2.LINE_AA)

        cv2.putText(frame, "SERVICE RATE:", (q_x + 16, q_y + 186), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"{service_rate:.1f} / min", (q_x + 160, q_y + 186), self.font, 0.38, (255, 255, 255), 1, cv2.LINE_AA)

        cv2.line(frame, (q_x + 15, q_y + 198), (q_x + q_w - 15, q_y + 198), (60, 60, 60), 1)

        # Section 3: Congestion Status & Alert Level Badge
        cv2.putText(frame, "CONGESTION STATUS:", (q_x + 16, q_y + 220), self.font, 0.40, (180, 180, 180), 1, cv2.LINE_AA)

        level_text = f"[{level}]"
        (lw, lh), _ = cv2.getTextSize(level_text, self.font, 0.52, 2)
        badge_box_x = q_x + 190
        cv2.rectangle(frame, (badge_box_x, q_y + 204), (badge_box_x + lw + 16, q_y + 228), border_color, -1)
        cv2.putText(frame, level_text, (badge_box_x + 8, q_y + 222), self.font, 0.52, (0, 0, 0), 2, cv2.LINE_AA)

        # Section 4: Alert / Prediction Warning Box
        alert_banner = alert_state.get("alert_banner", "Queue operating normally")
        trend = telemetry.get("trend", "STABLE")

        warn_box_h = 44
        warn_box_y = q_y + 238
        cv2.rectangle(frame, (q_x + 12, warn_box_y), (q_x + q_w - 12, warn_box_y + warn_box_h), (25, 25, 25), -1)
        cv2.rectangle(frame, (q_x + 12, warn_box_y), (q_x + q_w - 12, warn_box_y + warn_box_h), border_color, 1)

        # Truncate or render cleanly inside box
        cv2.putText(frame, alert_banner[:38], (q_x + 18, warn_box_y + 18), self.font, 0.38, border_color, 1, cv2.LINE_AA)
        cv2.putText(frame, f"Trend: {trend}", (q_x + 18, warn_box_y + 36), self.font, 0.34, (160, 160, 160), 1, cv2.LINE_AA)

        cv2.line(frame, (q_x + 15, q_y + 292), (q_x + q_w - 15, q_y + 292), (60, 60, 60), 1)

        # Section 5: Current Serving & Queue Wait Times
        current_tok_str = queue_summary.get("current_token_display", "None")
        cv2.putText(frame, f"SERVING: {current_tok_str}", (q_x + 16, q_y + 312), self.font, 0.40, (0, 255, 255), 1, cv2.LINE_AA)

        waiting_est = wait_estimates.get("waiting_estimates", [])
        q_pos_y = q_y + 332

        if not waiting_est:
            cv2.putText(frame, "(No customers waiting in queue)", (q_x + 20, q_pos_y), self.font, 0.36, (140, 140, 140), 1, cv2.LINE_AA)
            q_pos_y += 18
        else:
            for item in waiting_est[:3]:
                tok_id = item["token_id"]
                pos = item["position"]
                wait_text = item["wait_str"]
                cv2.putText(frame, f"{tok_id}", (q_x + 18, q_pos_y), self.font, 0.40, (255, 255, 255), 2, cv2.LINE_AA)
                cv2.putText(frame, f"Pos {pos}", (q_x + 95, q_pos_y), self.font, 0.38, (180, 180, 180), 1, cv2.LINE_AA)
                cv2.putText(frame, f"{wait_text}", (q_x + 230, q_pos_y), self.font, 0.40, (0, 220, 255), 2, cv2.LINE_AA)
                q_pos_y += 19

        cv2.line(frame, (q_x + 15, q_y + 400), (q_x + q_w - 15, q_y + 400), (60, 60, 60), 1)

        # Section 6: Controls
        cv2.putText(frame, "KEYBOARD CONTROLS:", (q_x + 16, q_y + 420), self.font, 0.40, config.HUD_ACCENT_COLOR, 1, cv2.LINE_AA)
        controls = [
            ("[N]", "Generate Token"),
            ("[C]", "Call Next"),
            ("[S]", "Start Service"),
            ("[D]", "Complete Service"),
            ("[Q]", "Quit Application"),
        ]
        c_y = q_y + 442
        for key_code, desc in controls:
            cv2.putText(frame, key_code, (q_x + 18, c_y), self.font, 0.38, (0, 255, 255), 1, cv2.LINE_AA)
            cv2.putText(frame, desc, (q_x + 65, c_y), self.font, 0.36, (200, 200, 200), 1, cv2.LINE_AA)
            c_y += 20

        # ======================================================================
        # 3. Bottom Bar: Event Status & Feedback
        # ======================================================================
        last_action = queue_summary.get("last_action", "Ready")
        footer_text = f"Queue: {last_action}  |  Alert: {alert_banner}  |  [N/C/S/D/Q]"
        (fw, fh), _ = cv2.getTextSize(footer_text, self.font, 0.42, 1)
        footer_x = 15
        footer_y = h_frame - 15

        cv2.rectangle(frame, (footer_x - 6, footer_y - fh - 6), (footer_x + fw + 10, footer_y + 6), (15, 15, 15), -1)
        cv2.rectangle(frame, (footer_x - 6, footer_y - fh - 6), (footer_x + fw + 10, footer_y + 6), border_color, 1)
        cv2.putText(frame, footer_text, (footer_x, footer_y), self.font, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

        return frame
