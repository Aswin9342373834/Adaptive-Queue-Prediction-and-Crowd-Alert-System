"""
Alert Manager Module.
Handles state transitions for congestion alert levels (NORMAL, MODERATE, HIGH, CRITICAL),
deduplicates alert triggers, maintains an in-memory alert log,
and exposes a hardware-ready interface for downstream ESP32/LED/Buzzer integration.
"""

from typing import Dict, List, Tuple, Optional, Any
import time


class AlertManager:
    """
    Manages queue congestion alerts with event deduplication and hardware-ready state flags.
    """

    # Alert level color & priority mappings
    LEVEL_NORMAL = "NORMAL"
    LEVEL_MODERATE = "MODERATE"
    LEVEL_HIGH = "HIGH"
    LEVEL_CRITICAL = "CRITICAL"

    LEVEL_ICONS = {
        "NORMAL": "[NORMAL]",
        "MODERATE": "[MODERATE]",
        "HIGH": "[HIGH]",
        "CRITICAL": "[CRITICAL]",
    }

    def __init__(self):
        self.current_level = self.LEVEL_NORMAL
        self.current_message = "Queue operating normally"
        self.active_prediction: Optional[str] = None
        self.active_long_wait: bool = False
        self.last_event_time = time.time()
        self.alert_log: List[Dict[str, Any]] = []

        # Record initial baseline state
        self._record_alert(self.LEVEL_NORMAL, self.current_message, self.last_event_time)

    def _record_alert(self, level: str, message: str, timestamp: float) -> None:
        """Internal helper to log deduplicated alert events."""
        event = {
            "timestamp": timestamp,
            "level": level,
            "message": message,
        }
        self.alert_log.append(event)
        print(f"[ALERT] {level} - {message}")

    def process_telemetry(
        self,
        telemetry: Dict[str, Any],
        current_time: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates current analytics telemetry and updates alert status with deduplication.

        Returns:
            Dict[str, Any]: Structured alert state for HUD and hardware interface.
        """
        now = current_time if current_time is not None else time.time()

        level = telemetry.get("congestion_level", self.LEVEL_NORMAL)
        trend = telemetry.get("trend", "STABLE")
        predicted_alert = telemetry.get("predicted_alert")
        is_long_wait = telemetry.get("is_long_wait", False)
        max_wait_min = telemetry.get("max_wait_minutes", 0.0)

        # 1. Determine the primary alert message based on state and prediction
        if level == self.LEVEL_CRITICAL:
            primary_msg = "Severe congestion / excessive waiting detected"
        elif level == self.LEVEL_HIGH:
            primary_msg = "High congestion detected"
        elif level == self.LEVEL_MODERATE:
            if trend == "RAPIDLY INCREASING":
                primary_msg = "Queue is increasing rapidly"
            else:
                primary_msg = "Moderate queue load"
        else:
            primary_msg = "Queue operating normally"

        # If forward prediction anticipates higher congestion, prioritize early warning
        if predicted_alert:
            alert_banner = f"! {predicted_alert} (Queue {trend.lower()})"
        elif is_long_wait:
            alert_banner = f"! LONG WAIT ALERT (Max wait: {max_wait_min:.0f}m)"
        elif level != self.LEVEL_NORMAL:
            alert_banner = f"! {level} CONGESTION ({trend})"
        else:
            alert_banner = primary_msg

        # 2. Deduplication check: Has a meaningful alert threshold or state changed?
        state_changed = (
            (level != self.current_level)
            or (predicted_alert != self.active_prediction)
            or (is_long_wait != self.active_long_wait)
        )

        if state_changed:
            self.current_level = level
            self.current_message = primary_msg
            self.active_prediction = predicted_alert
            self.active_long_wait = is_long_wait
            self.last_event_time = now
            self._record_alert(level, alert_banner, now)

        # 3. Hardware-Ready Interface Payload
        # (Exposes clean digital flags ready for future ESP32 UART/WiFi payload)
        hardware_payload = {
            "level": level,
            "led_green": (level == self.LEVEL_NORMAL),
            "led_yellow": (level == self.LEVEL_MODERATE),
            "led_orange": (level == self.LEVEL_HIGH),
            "led_red": (level == self.LEVEL_CRITICAL),
            "buzzer": (level == self.LEVEL_CRITICAL or is_long_wait),
            "message": alert_banner,
        }

        return {
            "level": level,
            "primary_message": primary_msg,
            "alert_banner": alert_banner,
            "trend": trend,
            "predicted_alert": predicted_alert,
            "is_long_wait": is_long_wait,
            "hardware": hardware_payload,
        }
