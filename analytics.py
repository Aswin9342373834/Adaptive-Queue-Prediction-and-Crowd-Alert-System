"""
Queue Analytics Module.
Calculates real-time queue growth, arrival rates, service completion rates,
and predicts forward congestion horizons based on live stream data.
"""

from collections import deque
from typing import List, Dict, Any, Optional
import time
import config
from queue_manager import QueueManager


class QueueAnalytics:
    """
    Computes statistical telemetry, arrival rates, service rates, and forward congestion prediction.
    """

    def __init__(
        self,
        analysis_window: float = config.QUEUE_ANALYSIS_WINDOW_SECONDS,
        prediction_horizon: float = config.PREDICTION_HORIZON_SECONDS,
        max_history: int = config.MAX_HISTORY_ENTRIES,
    ):
        self.analysis_window = float(analysis_window)
        self.prediction_horizon = float(prediction_horizon)
        self.session_start_time = time.time()
        self.history: deque = deque(maxlen=max_history)

        # Unique person arrival tracking (track_id -> first arrival timestamp)
        self.seen_waiting_track_ids: Dict[int, float] = {}
        self.arrivals_in_window: List[float] = []

    def update(
        self,
        waiting_people_count: int,
        evaluated_tracks: List[Dict[str, Any]],
        queue_manager: QueueManager,
        wait_estimates: Dict[str, Any],
        current_time: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Processes the current frame metrics and updates arrival/service/congestion telemetry.
        """
        now = current_time if current_time is not None else time.time()
        tokens_waiting_count = len(queue_manager.get_waiting_tokens())
        effective_waiting_load = max(waiting_people_count, tokens_waiting_count)

        # ======================================================================
        # 1. Arrival Rate Tracking (Unique persons entering Waiting Area)
        # ======================================================================
        for trk in evaluated_tracks:
            track_id = trk.get("track_id")
            is_waiting = trk.get("is_waiting", False)

            if is_waiting and track_id is not None:
                if track_id not in self.seen_waiting_track_ids:
                    self.seen_waiting_track_ids[track_id] = now
                    self.arrivals_in_window.append(now)

        # Purge arrivals older than analysis window
        self.arrivals_in_window = [t for t in self.arrivals_in_window if (now - t) <= self.analysis_window]

        elapsed_session_sec = max(1.0, now - self.session_start_time)
        window_duration_sec = min(elapsed_session_sec, self.analysis_window)
        window_duration_min = max(0.1, window_duration_sec / 60.0)

        arrival_rate_per_min = len(self.arrivals_in_window) / window_duration_min

        # ======================================================================
        # 2. Service Rate Calculation
        # ======================================================================
        completed_durations = queue_manager.get_completed_service_durations()
        completed_count = len(completed_durations)
        elapsed_session_min = max(0.1, elapsed_session_sec / 60.0)

        # Empirical service rate (completed services / elapsed session minutes)
        empirical_service_rate_per_min = completed_count / elapsed_session_min

        # Expected service rate based on current average service time
        avg_service_sec = wait_estimates.get("avg_service_time_seconds", config.BOOTSTRAP_SERVICE_TIME_SECONDS)
        expected_service_rate_per_min = (60.0 / avg_service_sec) if avg_service_sec > 0 else 0.0

        # Effective service rate displayed
        display_service_rate = (
            empirical_service_rate_per_min if completed_count > 0 else expected_service_rate_per_min
        )

        # ======================================================================
        # 3. Queue Growth Rate & Trend
        # ======================================================================
        past_load = effective_waiting_load
        target_past_time = now - self.analysis_window

        # Find historical entry closest to target_past_time
        for h in self.history:
            if h["timestamp"] >= target_past_time:
                past_load = h["effective_load"]
                break

        delta_load = effective_waiting_load - past_load
        growth_rate_per_min = delta_load / window_duration_min

        if growth_rate_per_min > 2.0:
            trend_label = "RAPIDLY INCREASING"
        elif growth_rate_per_min > 0.4:
            trend_label = "INCREASING"
        elif growth_rate_per_min < -0.4:
            trend_label = "DECREASING"
        else:
            trend_label = "STABLE"

        # ======================================================================
        # 4. Congestion Level Classification
        # ======================================================================
        if effective_waiting_load >= config.CONGESTION_CRITICAL_THRESHOLD:
            congestion_level = "CRITICAL"
        elif effective_waiting_load >= config.CONGESTION_HIGH_THRESHOLD:
            congestion_level = "HIGH"
        elif effective_waiting_load >= config.CONGESTION_MODERATE_THRESHOLD:
            congestion_level = "MODERATE"
        else:
            congestion_level = "NORMAL"

        # ======================================================================
        # 5. Forward Congestion Prediction
        # ======================================================================
        horizon_min = self.prediction_horizon / 60.0  # e.g. 5 minutes
        predicted_load = max(0.0, effective_waiting_load + (growth_rate_per_min * horizon_min))

        predicted_alert = None
        if predicted_load >= config.CONGESTION_CRITICAL_THRESHOLD and congestion_level != "CRITICAL":
            predicted_alert = "CRITICAL CONGESTION EXPECTED"
        elif predicted_load >= config.CONGESTION_HIGH_THRESHOLD and congestion_level not in ["CRITICAL", "HIGH"]:
            predicted_alert = "HIGH CONGESTION EXPECTED"
        elif predicted_load >= config.CONGESTION_MODERATE_THRESHOLD and congestion_level == "NORMAL":
            predicted_alert = "MODERATE CONGESTION EXPECTED"

        # ======================================================================
        # 6. Max Wait Time & Long Wait Alert
        # ======================================================================
        waiting_estimates = wait_estimates.get("waiting_estimates", [])
        max_wait_seconds = max([w["wait_seconds"] for w in waiting_estimates], default=0.0)
        max_wait_minutes = max_wait_seconds / 60.0

        is_long_wait = (max_wait_minutes >= config.MAX_WAIT_ALERT_MINUTES)

        # ======================================================================
        # 7. Record Telemetry in History
        # ======================================================================
        telemetry_entry = {
            "timestamp": now,
            "waiting_people": waiting_people_count,
            "tokens_waiting": tokens_waiting_count,
            "effective_load": effective_waiting_load,
            "arrival_rate": arrival_rate_per_min,
            "service_rate": display_service_rate,
            "growth_rate": growth_rate_per_min,
            "trend": trend_label,
            "congestion_level": congestion_level,
            "predicted_alert": predicted_alert,
            "max_wait_minutes": max_wait_minutes,
            "is_long_wait": is_long_wait,
        }
        self.history.append(telemetry_entry)

        return telemetry_entry
