"""
Real-Time Waiting Time Estimator Module.
Learns average service duration from completed tokens during the session
and calculates live dynamic waiting times for queued customers based on timestamps and queue position.
"""

from typing import List, Dict, Tuple, Optional, Any
import time
import config
from queue_manager import QueueManager, Token


class WaitingTimeEstimator:
    """
    Computes dynamic queue waiting times based on real-time session service metrics.
    """

    def __init__(self, bootstrap_service_time: float = config.BOOTSTRAP_SERVICE_TIME_SECONDS):
        self.bootstrap_service_time = float(bootstrap_service_time)

    @staticmethod
    def format_duration(seconds: float, format_style: str = "short") -> str:
        """
        Formats seconds into clean time strings.

        Args:
            seconds: Duration in seconds.
            format_style: 'short' -> 'M:SS' (e.g. '2:15')
                          'verbose' -> 'X min Y sec' (e.g. '3 min 25 sec')
                          'min_suffix' -> 'M:SS min' (e.g. '4:35 min')
        """
        total_sec = max(0, int(round(seconds)))
        minutes = total_sec // 60
        secs = total_sec % 60

        if format_style == "verbose":
            if minutes == 0:
                return f"{secs} sec"
            elif secs == 0:
                return f"{minutes} min"
            return f"{minutes} min {secs:02d} sec"
        elif format_style == "min_suffix":
            return f"{minutes}:{secs:02d} min"
        else:
            return f"{minutes}:{secs:02d}"

    def calculate_average_service_time(self, completed_durations: List[float]) -> Tuple[float, bool]:
        """
        Calculates the average service duration from completed sessions.

        Returns:
            Tuple[float, bool]: (effective_avg_seconds, is_measured_from_real_data)
        """
        if len(completed_durations) > 0:
            avg_time = sum(completed_durations) / len(completed_durations)
            return avg_time, True
        return self.bootstrap_service_time, False

    def calculate_remaining_service_time(
        self,
        serving_token: Optional[Token],
        avg_service_time: float,
        current_time: float,
    ) -> Tuple[float, float]:
        """
        Calculates elapsed and remaining service time for the active customer.

        Returns:
            Tuple[float, float]: (elapsed_seconds, remaining_seconds >= 0.0)
        """
        if serving_token is not None and serving_token.service_start_at is not None:
            elapsed = max(0.0, current_time - serving_token.service_start_at)
            remaining = max(0.0, avg_service_time - elapsed)
            return elapsed, remaining
        return 0.0, 0.0

    def calculate_customer_wait_time(
        self,
        queue_position: int,
        has_serving_customer: bool,
        remaining_service_time: float,
        avg_service_time: float,
    ) -> float:
        """
        Calculates estimated waiting time for a token at a given 1-indexed queue position.

        Formula:
            If customer currently SERVING:
                Wait = Remaining_Serving_Time + (Position - 1) * Avg_Service_Time
            If NO customer currently SERVING:
                Wait = Position * Avg_Service_Time

        Returns:
            float: Estimated wait time in seconds (always >= 0.0).
        """
        pos = max(1, queue_position)
        if has_serving_customer:
            est = remaining_service_time + ((pos - 1) * avg_service_time)
        else:
            est = pos * avg_service_time

        return max(0.0, est)

    def get_queue_estimates(
        self,
        queue_manager: QueueManager,
        current_time: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive snapshot of service times and individual customer estimates.
        """
        now = current_time if current_time is not None else time.time()

        # 1. Measured completed service times
        completed_durations = queue_manager.get_completed_service_durations()
        avg_service_time, is_measured = self.calculate_average_service_time(completed_durations)

        # Format average service time string
        if is_measured:
            avg_str = self.format_duration(avg_service_time, format_style="verbose")
            avg_display = f"{avg_str}"
        else:
            boot_str = self.format_duration(avg_service_time, format_style="verbose")
            avg_display = f"Waiting for data ({boot_str} initial est)"

        # 2. Currently serving customer metrics
        serving_token = queue_manager.get_serving_token()
        has_serving = (serving_token is not None)
        elapsed_sec, remaining_sec = self.calculate_remaining_service_time(
            serving_token, avg_service_time, now
        )

        # 3. Individual customer wait time calculations
        waiting_tuples = queue_manager.get_waiting_tokens()
        waiting_estimates = []

        for token, pos in waiting_tuples:
            wait_sec = self.calculate_customer_wait_time(
                queue_position=pos,
                has_serving_customer=has_serving,
                remaining_service_time=remaining_sec,
                avg_service_time=avg_service_time,
            )
            waiting_estimates.append({
                "token_id": token.token_id,
                "position": pos,
                "wait_seconds": wait_sec,
                "wait_str": self.format_duration(wait_sec, format_style="min_suffix"),
                "wait_short": self.format_duration(wait_sec, format_style="short"),
            })

        return {
            "avg_service_time_seconds": avg_service_time,
            "is_measured": is_measured,
            "completed_services_count": len(completed_durations),
            "avg_display": avg_display,
            "has_serving": has_serving,
            "serving_token_id": serving_token.token_id if serving_token else "None",
            "serving_elapsed_seconds": elapsed_sec,
            "serving_elapsed_str": self.format_duration(elapsed_sec, format_style="short"),
            "serving_remaining_seconds": remaining_sec,
            "serving_remaining_str": self.format_duration(remaining_sec, format_style="short"),
            "waiting_estimates": waiting_estimates,
        }
