"""
Alert Manager Module.
Handles state transitions for congestion alert levels (NORMAL, MODERATE, HIGH, CRITICAL),
deduplicates alert triggers, maintains an in-memory and persistent SQLite alert log,
generates adaptive counter recommendations, and exposes a hardware-ready interface for ESP32.
"""

from typing import Dict, List, Tuple, Optional, Any
import time

try:
    from database import db
except Exception:
    db = None


class AlertManager:
    """
    Manages queue congestion alerts with event deduplication and hardware-ready state flags.
    """

    LEVEL_NORMAL = "NORMAL"
    LEVEL_MODERATE = "MODERATE"
    LEVEL_HIGH = "HIGH"
    LEVEL_CRITICAL = "CRITICAL"

    def __init__(self):
        self.current_level = self.LEVEL_NORMAL
        self.current_message = "Queue operating normally"
        self.active_prediction: Optional[str] = None
        self.active_long_wait: bool = False
        self.last_event_time = time.time()
        self.alert_log: List[Dict[str, Any]] = []

        # Record initial baseline state
        self._record_alert(self.LEVEL_NORMAL, self.current_message, self.last_event_time)

    def _record_alert(
        self,
        level: str,
        message: str,
        timestamp: float,
        people_count: int = 0,
        waiting_count: int = 0,
        recommended_action: str = ""
    ) -> None:
        """Internal helper to log deduplicated alert events."""
        event = {
            "timestamp": timestamp,
            "time_str": time.strftime("%I:%M:%S %p", time.localtime(timestamp)),
            "level": level,
            "message": message,
            "people_count": people_count,
            "waiting_count": waiting_count,
            "recommended_action": recommended_action,
        }
        self.alert_log.append(event)
        if len(self.alert_log) > 100:
            self.alert_log = self.alert_log[-100:]

        print(f"[ALERT] {level} - {message}")

    def process_telemetry(
        self,
        telemetry: Dict[str, Any],
        current_time: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates current analytics telemetry and updates alert status with deduplication.
        """
        now = current_time if current_time is not None else time.time()

        level = telemetry.get("congestion_level", self.LEVEL_NORMAL)
        crowd_status = telemetry.get("crowd_status", "NORMAL")
        trend = telemetry.get("trend", "STABLE")
        predicted_alert = telemetry.get("predicted_alert")
        is_long_wait = telemetry.get("is_long_wait", False)
        max_wait_min = telemetry.get("max_wait_minutes", 0.0)
        people_detected = telemetry.get("people_detected", 0)
        tokens_waiting = telemetry.get("tokens_waiting", 0)

        # 1. Determine primary alert message
        if level == self.LEVEL_CRITICAL:
            primary_msg = "Severe congestion / excessive waiting detected"
        elif level == self.LEVEL_HIGH or crowd_status == "HIGH":
            primary_msg = f"High crowd detected ({people_detected} people)"
        elif level == self.LEVEL_MODERATE or crowd_status == "MODERATE":
            if trend == "RAPIDLY INCREASING":
                primary_msg = "Queue is increasing rapidly"
            else:
                primary_msg = "Moderate queue load"
        else:
            primary_msg = "Queue operating normally"

        # Construct banner
        if crowd_status == "HIGH" or level in [self.LEVEL_HIGH, self.LEVEL_CRITICAL]:
            alert_banner = f"⚠ HIGH CROWD DETECTED: {people_detected} people present"
        elif predicted_alert:
            alert_banner = f"! {predicted_alert} (Queue {trend.lower()})"
        elif is_long_wait:
            alert_banner = f"! LONG WAIT ALERT (Max wait: {max_wait_min:.0f}m)"
        elif level != self.LEVEL_NORMAL:
            alert_banner = f"! {level} CONGESTION ({trend})"
        else:
            alert_banner = primary_msg

        # 2. Adaptive Counter Recommendation
        # When crowd is HIGH and waiting queue is high -> recommend opening another counter
        is_crowd_high = (crowd_status == "HIGH" or level in [self.LEVEL_HIGH, self.LEVEL_CRITICAL])
        is_queue_high = (tokens_waiting >= 4 or is_long_wait)

        recommendation_active = is_crowd_high or is_queue_high
        if is_crowd_high and is_queue_high:
            rec_title = "⚠ HIGH CROWD DETECTED"
            rec_msg = "Consider opening another service counter."
            rec_action = "Counter 05 can be activated."
            rec_counter = 5
        elif is_crowd_high:
            rec_title = "⚠ HIGH CROWD DETECTED"
            rec_msg = "Physical crowd is above normal threshold."
            rec_action = "Monitor counter pacing and prepare auxiliary Counter 05."
            rec_counter = 5
        elif is_queue_high:
            rec_title = "QUEUE LOAD NOTICE"
            rec_msg = "Waiting queue is growing beyond target SLA."
            rec_action = "Ensure all active service counters remain staffed."
            rec_counter = 4
        else:
            rec_title = "OPTIMAL OPERATIONS"
            rec_msg = "Capacity is balanced with customer demand."
            rec_action = "Maintain standard counter schedule."
            rec_counter = None

        recommendation = {
            "active": recommendation_active,
            "title": rec_title,
            "message": rec_msg,
            "action": rec_action,
            "suggested_counter": rec_counter,
            "current_crowd": people_detected,
        }

        # 3. Deduplication check
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
            self._record_alert(
                level,
                alert_banner,
                now,
                people_count=people_detected,
                waiting_count=tokens_waiting,
                recommended_action=rec_action
            )

        # 4. Hardware-Ready Interface Payload
        hardware_payload = {
            "level": level,
            "led_green": (level == self.LEVEL_NORMAL),
            "led_yellow": (level == self.LEVEL_MODERATE),
            "led_orange": (level == self.LEVEL_HIGH),
            "led_red": (level == self.LEVEL_CRITICAL),
            "buzzer": (level == self.LEVEL_CRITICAL or (is_long_wait and level != self.LEVEL_NORMAL)),
            "message": alert_banner,
        }

        return {
            "level": level,
            "crowd_status": crowd_status,
            "primary_message": primary_msg,
            "alert_banner": alert_banner,
            "trend": trend,
            "predicted_alert": predicted_alert,
            "is_long_wait": is_long_wait,
            "recommendation": recommendation,
            "hardware": hardware_payload,
        }
