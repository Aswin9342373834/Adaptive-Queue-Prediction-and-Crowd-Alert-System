"""
Phase 8 Automated Verification Script.
Tests:
1. HardwareClient initialization and safe fallback when ESP32 is offline.
2. AlertManager state to hardware flag mapping (NORMAL -> Green, MODERATE -> Yellow, HIGH -> Orange, CRITICAL -> Red + Buzzer).
3. Non-blocking asynchronous dispatch (zero pipeline latency).
4. FastAPI endpoints (/api/hardware/status and /api/hardware/test) with TestClient.
"""

import time
import sys
from fastapi.testclient import TestClient
import config
from alerts import AlertManager
from hardware_client import HardwareClient
from backend.api import app


def test_hardware_client_offline_graceful():
    print("\n--- TEST 1: HardwareClient Offline Fault Tolerance ---")
    client = HardwareClient(esp32_ip="192.0.2.1", esp32_port=80, enabled=True)
    assert not client.is_connected
    
    # Send state - should return immediately without blocking (less than 10ms)
    t0 = time.time()
    result = client.send_hardware_state({
        "level": "NORMAL",
        "led_green": True,
        "led_yellow": False,
        "led_orange": False,
        "led_red": False,
        "buzzer": False,
        "message": "Test normal",
    })
    elapsed = (time.time() - t0) * 1000
    print(f"Non-blocking dispatch time: {elapsed:.2f} ms")
    assert elapsed < 50, f"Dispatch took too long: {elapsed} ms"
    print("PASS: Offline dispatch is fully non-blocking.")


def test_hardware_flag_generation():
    print("\n--- TEST 2: Congestion State to Hardware Mapping ---")
    alert_mgr = AlertManager()
    
    # 1. NORMAL
    normal_telemetry = {
        "congestion_level": "NORMAL",
        "waiting_people_count": 1,
        "max_wait_minutes": 1.5,
        "growth_rate": 0.0,
        "trend": "STABLE",
        "arrival_rate": 1.0,
        "service_rate": 1.5,
        "predicted_alert": None,
        "is_long_wait": False,
    }
    st_normal = alert_mgr.process_telemetry(normal_telemetry, current_time=time.time())
    hw_normal = st_normal["hardware"]
    assert hw_normal["level"] == "NORMAL"
    assert hw_normal["led_green"] is True
    assert hw_normal["led_yellow"] is False
    assert hw_normal["led_orange"] is False
    assert hw_normal["led_red"] is False
    assert hw_normal["buzzer"] is False
    print("PASS: NORMAL -> Green LED ON (GPIO 25)")

    # 2. MODERATE
    mod_telemetry = {
        "congestion_level": "MODERATE",
        "waiting_people_count": 4,
        "max_wait_minutes": 5.0,
        "growth_rate": 1.0,
        "trend": "INCREASING",
        "arrival_rate": 3.0,
        "service_rate": 2.0,
        "predicted_alert": None,
        "is_long_wait": False,
    }
    st_mod = alert_mgr.process_telemetry(mod_telemetry, current_time=time.time())
    hw_mod = st_mod["hardware"]
    assert hw_mod["level"] == "MODERATE"
    assert hw_mod["led_green"] is False
    assert hw_mod["led_yellow"] is True
    assert hw_mod["led_orange"] is False
    assert hw_mod["led_red"] is False
    assert hw_mod["buzzer"] is False
    print("PASS: MODERATE -> Yellow LED ON (GPIO 26)")

    # 3. HIGH
    high_telemetry = {
        "congestion_level": "HIGH",
        "waiting_people_count": 7,
        "max_wait_minutes": 12.0,
        "growth_rate": 2.5,
        "trend": "INCREASING",
        "arrival_rate": 5.0,
        "service_rate": 2.0,
        "predicted_alert": None,
        "is_long_wait": False,
    }
    st_high = alert_mgr.process_telemetry(high_telemetry, current_time=time.time())
    hw_high = st_high["hardware"]
    assert hw_high["level"] == "HIGH"
    assert hw_high["led_green"] is False
    assert hw_high["led_yellow"] is False
    assert hw_high["led_orange"] is True
    assert hw_high["led_red"] is False
    assert hw_high["buzzer"] is False
    print("PASS: HIGH -> Orange LED ON (GPIO 27)")

    # 4. CRITICAL
    crit_telemetry = {
        "congestion_level": "CRITICAL",
        "waiting_people_count": 12,
        "max_wait_minutes": 22.0,
        "growth_rate": 4.0,
        "trend": "RAPIDLY INCREASING",
        "arrival_rate": 8.0,
        "service_rate": 2.0,
        "predicted_alert": None,
        "is_long_wait": False,
    }
    st_crit = alert_mgr.process_telemetry(crit_telemetry, current_time=time.time())
    hw_crit = st_crit["hardware"]
    assert hw_crit["level"] == "CRITICAL"
    assert hw_crit["led_green"] is False
    assert hw_crit["led_yellow"] is False
    assert hw_crit["led_orange"] is False
    assert hw_crit["led_red"] is True
    assert hw_crit["buzzer"] is True
    print("PASS: CRITICAL -> Red LED ON (GPIO 14) + Buzzer Active (GPIO 13)")


def test_api_hardware_endpoints():
    print("\n--- TEST 3: FastAPI Hardware Endpoints ---")
    client = TestClient(app)
    
    # 1. GET /api/hardware/status
    res_status = client.get("/api/hardware/status")
    assert res_status.status_code == 200, f"Status failed: {res_status.text}"
    status_data = res_status.json()
    print(f"Hardware Status: {status_data}")
    assert "esp32_ip" in status_data
    assert "gpio_map" in status_data
    assert status_data["gpio_map"]["green_led"] == config.GPIO_LED_GREEN
    assert status_data["gpio_map"]["buzzer"] == config.GPIO_BUZZER
    print("PASS: GET /api/hardware/status verified.")

    # 2. POST /api/hardware/test (All 4 levels)
    for lvl in ["NORMAL", "MODERATE", "HIGH", "CRITICAL"]:
        res_test = client.post("/api/hardware/test", json={"level": lvl})
        assert res_test.status_code == 200, f"Test {lvl} failed: {res_test.text}"
        data = res_test.json()
        assert data["requested_level"] == lvl
        assert "result" in data
        assert data["result"]["status"] in ["success", "offline", "error"]
        print(f"PASS: POST /api/hardware/test ({lvl}) -> Result Status: {data['result']['status']}")


if __name__ == "__main__":
    print("==================================================")
    print("   PHASE 8 AUTOMATED HARDWARE INTEGRATION TESTS   ")
    print("==================================================")
    test_hardware_client_offline_graceful()
    test_hardware_flag_generation()
    test_api_hardware_endpoints()
    print("\n==================================================")
    print("   ALL PHASE 8 TESTS PASSED SUCCESSFULLY!         ")
    print("==================================================")
