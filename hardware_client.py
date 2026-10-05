"""
ESP32 Hardware Alert Client.
Dispatches real-time congestion alert states (LEDs & Buzzer) to the physical ESP32 board over local Wi-Fi.
Uses asynchronous non-blocking thread workers so computer vision & live video streaming never freeze.
"""

import threading
import time
from typing import Dict, Any, Optional
import requests
import config


class HardwareClient:
    """
    Communicates with the ESP32 physical hardware alert unit over HTTP REST.
    """

    def __init__(
        self,
        esp32_ip: str = config.ESP32_IP,
        esp32_port: int = config.ESP32_PORT,
        enabled: bool = config.ESP32_ENABLED,
        timeout: float = config.ESP32_TIMEOUT_SECONDS,
    ):
        self.esp32_ip = esp32_ip
        self.esp32_port = esp32_port
        self.enabled = enabled
        self.timeout = timeout
        self.base_url = f"http://{self.esp32_ip}:{self.esp32_port}"

        self.is_connected = False
        self.last_sent_level: Optional[str] = None
        self.last_sent_time = 0.0
        self.last_error: Optional[str] = None

        # Lock for thread-safe state tracking
        self._lock = threading.Lock()
        self._worker_thread: Optional[threading.Thread] = None

    def _send_payload_worker(self, payload: Dict[str, Any]) -> None:
        """Background thread worker for non-blocking HTTP dispatch."""
        url = f"{self.base_url}/hardware/status"
        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                with self._lock:
                    self.is_connected = True
                    self.last_sent_level = payload.get("level")
                    self.last_sent_time = time.time()
                    self.last_error = None
            else:
                with self._lock:
                    self.is_connected = False
                    self.last_error = f"HTTP {resp.status_code}"
        except Exception as e:
            with self._lock:
                self.is_connected = False
                self.last_error = str(e)

    def send_hardware_state(self, hardware_flags: Dict[str, Any], force: bool = False) -> None:
        """
        Sends current hardware status flags (LEDs + Buzzer) to the ESP32.
        Deduplicates requests so network traffic is only sent on state transitions or heartbeat.
        """
        if not self.enabled:
            return

        now = time.time()
        level = hardware_flags.get("level", "NORMAL")

        # Deduplication check: state changed OR heartbeat interval elapsed
        level_changed = (level != self.last_sent_level)
        heartbeat_due = (now - self.last_sent_time >= config.ESP32_HEARTBEAT_INTERVAL_SECONDS)

        if not force and not level_changed and not heartbeat_due:
            return

        payload = {
            "level": level,
            "led_green": hardware_flags.get("led_green", level == "NORMAL"),
            "led_yellow": hardware_flags.get("led_yellow", level == "MODERATE"),
            "led_orange": hardware_flags.get("led_orange", level == "HIGH"),
            "led_red": hardware_flags.get("led_red", level == "CRITICAL"),
            "buzzer": hardware_flags.get("buzzer", level == "CRITICAL"),
        }

        # Dispatch asynchronously in background thread to avoid blocking webcam frame loop
        thread = threading.Thread(target=self._send_payload_worker, args=(payload,), daemon=True)
        thread.start()

    def send_test_level(self, level: str) -> Dict[str, Any]:
        """
        Sends a manual test level (NORMAL, MODERATE, HIGH, CRITICAL) for hardware verification.
        """
        payload = {
            "level": level,
            "led_green": (level == "NORMAL"),
            "led_yellow": (level == "MODERATE"),
            "led_orange": (level == "HIGH"),
            "led_red": (level == "CRITICAL"),
            "buzzer": (level == "CRITICAL"),
        }
        url = f"{self.base_url}/hardware/status"
        try:
            resp = requests.post(url, json=payload, timeout=self.timeout)
            if resp.status_code == 200:
                with self._lock:
                    self.is_connected = True
                    self.last_sent_level = level
                    self.last_sent_time = time.time()
                    self.last_error = None
                return {"status": "success", "level": level, "applied": True}
            else:
                with self._lock:
                    self.is_connected = False
                return {"status": "error", "error": f"HTTP {resp.status_code}"}
        except Exception as e:
            with self._lock:
                self.is_connected = False
                self.last_error = str(e)
            return {"status": "offline", "error": str(e), "message": "ESP32 offline or unreachable on local Wi-Fi"}

    def check_health(self) -> bool:
        """Pings the ESP32 /health endpoint synchronously."""
        if not self.enabled:
            return False
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=self.timeout)
            connected = (resp.status_code == 200)
            with self._lock:
                self.is_connected = connected
            return connected
        except Exception:
            with self._lock:
                self.is_connected = False
            return False

    def get_status(self) -> Dict[str, Any]:
        """Returns structured hardware status summary."""
        with self._lock:
            return {
                "enabled": self.enabled,
                "esp32_ip": self.esp32_ip,
                "esp32_port": self.esp32_port,
                "is_connected": self.is_connected,
                "last_sent_level": self.last_sent_level or "NORMAL",
                "last_sent_time": self.last_sent_time,
                "last_error": self.last_error,
                "gpio_map": {
                    "green_led": config.GPIO_LED_GREEN,
                    "yellow_led": config.GPIO_LED_YELLOW,
                    "orange_led": config.GPIO_LED_ORANGE,
                    "red_led": config.GPIO_LED_RED,
                    "buzzer": config.GPIO_BUZZER,
                }
            }
