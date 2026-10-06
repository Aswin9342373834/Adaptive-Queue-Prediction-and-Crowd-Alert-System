"""
FastAPI Real-Time Backend for Adaptive Queue Prediction & Crowd Alert System.
Integrates computer vision pipeline, token queue, wait-time estimation, telemetry analytics,
ESP32 physical hardware alert client, and real-time WebSocket broadcasting with live MJPEG camera feed.
"""

import asyncio
import os
import sys
import threading
import time
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure project root is in sys.path so root modules (config, camera, tracker, etc.) and backend package resolve
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import config
from camera import CameraStream
from tracker import PersonTracker
from roi_manager import ROIManager
from queue_manager import QueueManager
from estimator import WaitingTimeEstimator
from analytics import QueueAnalytics
from alerts import AlertManager
from hardware_client import HardwareClient
from ui_overlay import UIOverlay
from backend.websocket_manager import WebSocketManager


app = FastAPI(
    title="PS 37 - Adaptive Queue Prediction & ESP32 Hardware API",
    description="Real-time backend API, WebSocket server, and ESP32 physical hardware controller",
    version="1.0.0",
)

# Enable CORS for React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared Pipeline Singletons
camera = CameraStream(
    camera_index=config.CAMERA_INDEX,
    width=config.FRAME_WIDTH,
    height=config.FRAME_HEIGHT,
    fps=config.CAMERA_FPS,
)
tracker = PersonTracker(
    model_name=config.MODEL_NAME,
    conf_threshold=config.CONFIDENCE_THRESHOLD,
    tracker_type=config.TRACKER_TYPE,
)
roi_mgr = ROIManager(roi_coords=config.WAITING_AREA_ROI)
queue_mgr = QueueManager()
estimator = WaitingTimeEstimator(bootstrap_service_time=config.BOOTSTRAP_SERVICE_TIME_SECONDS)
analytics = QueueAnalytics(
    analysis_window=config.QUEUE_ANALYSIS_WINDOW_SECONDS,
    prediction_horizon=config.PREDICTION_HORIZON_SECONDS,
)
alert_mgr = AlertManager()
hardware_client = HardwareClient(
    esp32_ip=config.ESP32_IP,
    esp32_port=config.ESP32_PORT,
    enabled=config.ESP32_ENABLED,
)
overlay = UIOverlay()
ws_manager = WebSocketManager()

# Global State & Thread Synchronization
pipeline_thread: Optional[threading.Thread] = None
pipeline_running = False
latest_frame_lock = threading.Lock()
latest_jpeg_bytes: Optional[bytes] = None
latest_telemetry: Dict[str, Any] = {}
app_start_time = time.time()
async_loop: Optional[asyncio.AbstractEventLoop] = None


def vision_pipeline_worker():
    """
    Background worker running the continuous vision, tracking, analytics, and overlay loop.
    Encodes live frames into JPEG bytes, updates ESP32 hardware, and triggers WebSocket broadcast.
    """
    global latest_jpeg_bytes, latest_telemetry, pipeline_running

    print("[PIPELINE] Starting background vision pipeline worker...")
    if not camera.start():
        print("[ERROR] Camera failed to start in background worker.")
        pipeline_running = False
        return

    fps = 0.0
    frame_count = 0
    last_fps_time = time.time()
    last_broadcast_time = time.time()

    while pipeline_running:
        ret, frame = camera.read_frame()
        if not ret or frame is None:
            time.sleep(0.01)
            continue

        now = time.time()

        # 1. Vision & Tracking
        raw_tracks, active_cnt, total_det = tracker.track(frame)
        eval_tracks, waiting_cnt = roi_mgr.evaluate_tracks(raw_tracks, frame.shape)
        pixel_bounds = roi_mgr.get_pixel_bounds(frame.shape)

        # 2. Queue & Waiting-Time Estimation
        q_sum = queue_mgr.get_summary()
        w_est = estimator.get_queue_estimates(queue_mgr, current_time=now)

        # 3. Analytics & Alerts
        tele = analytics.update(
            waiting_people_count=waiting_cnt,
            evaluated_tracks=eval_tracks,
            queue_manager=queue_mgr,
            wait_estimates=w_est,
            current_time=now,
        )
        alert_st = alert_mgr.process_telemetry(tele, current_time=now)

        # 4. Automatic ESP32 Physical Alert Hardware Update (Non-blocking)
        hardware_client.send_hardware_state(alert_st.get("hardware", {}))

        # 5. FPS Measurement
        frame_count += 1
        if now - last_fps_time >= 0.3:
            fps = frame_count / (now - last_fps_time)
            frame_count = 0
            last_fps_time = now

        # 6. Render Visual Overlay for MJPEG Video Feed
        annotated_frame = frame.copy()
        annotated_frame = overlay.draw_waiting_area(annotated_frame, pixel_bounds, waiting_cnt)
        annotated_frame = overlay.draw_tracks(annotated_frame, eval_tracks)
        annotated_frame = overlay.draw_hud(
            annotated_frame,
            people_detected=total_det,
            waiting_count=waiting_cnt,
            active_tracks=active_cnt,
            fps=fps,
            queue_summary=q_sum,
            wait_estimates=w_est,
            telemetry=tele,
            alert_state=alert_st,
            camera_status="CONNECTED" if camera.is_connected else "DISCONNECTED",
            yolo_status="RUNNING" if tracker.is_ready else "ERROR",
            tracking_status="RUNNING" if tracker.is_ready else "ERROR",
        )

        # 7. Encode Frame to JPEG
        ret_enc, jpeg_buffer = cv2.imencode(".jpg", annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        if ret_enc:
            with latest_frame_lock:
                latest_jpeg_bytes = jpeg_buffer.tobytes()

        # 8. Package Structured Real-Time Telemetry Payload
        payload = {
            "timestamp": now,
            "system_online": True,
            "camera_connected": camera.is_connected,
            "yolo_running": tracker.is_ready,
            "tracking_running": tracker.is_ready,
            "esp32_connected": hardware_client.is_connected,
            "esp32_ip": hardware_client.esp32_ip,
            "fps": round(fps, 1),
            "people_detected": total_det,
            "waiting_area_count": waiting_cnt,
            "active_tracks": active_cnt,
            "current_token": q_sum.get("current_token_display", "None"),
            "next_token": q_sum.get("next_token_display", "None"),
            "tokens_waiting": q_sum.get("tokens_waiting_count", 0),
            "average_service_time_seconds": round(w_est.get("avg_service_time_seconds", 180.0), 1),
            "average_service_display": w_est.get("avg_display", "Waiting for data"),
            "is_measured_service_time": w_est.get("is_measured", False),
            "serving_token_id": w_est.get("serving_token_id", "None"),
            "serving_elapsed_str": w_est.get("serving_elapsed_str", "0:00"),
            "serving_remaining_str": w_est.get("serving_remaining_str", "0:00"),
            "max_wait_minutes": round(tele.get("max_wait_minutes", 0.0), 1),
            "arrival_rate": round(tele.get("arrival_rate", 0.0), 1),
            "service_rate": round(tele.get("service_rate", 0.0), 1),
            "queue_growth_rate": round(tele.get("growth_rate", 0.0), 1),
            "queue_trend": tele.get("trend", "STABLE"),
            "congestion_level": alert_st.get("level", "NORMAL"),
            "prediction": alert_st.get("predicted_alert") or "Queue operating normally",
            "alert_message": alert_st.get("alert_banner", "Queue operating normally"),
            "is_long_wait": alert_st.get("is_long_wait", False),
            "waiting_queue": [
                {
                    "token_id": item["token_id"],
                    "position": item["position"],
                    "status": "WAITING",
                    "estimated_wait": item["wait_str"],
                    "wait_seconds": item["wait_seconds"],
                    "customer_name": next((t.customer_name for t in queue_mgr.tokens if t.token_id == item["token_id"]), ""),
                    "mobile_number": next((t.mobile_number for t in queue_mgr.tokens if t.token_id == item["token_id"]), ""),
                    "service_type": next((t.service_type for t in queue_mgr.tokens if t.token_id == item["token_id"]), "General Banking"),
                    "assigned_counter": next((t.assigned_counter for t in queue_mgr.tokens if t.token_id == item["token_id"]), 3),
                    "customer_id": next((t.customer_id for t in queue_mgr.tokens if t.token_id == item["token_id"]), ""),
                    "created_at": next((t.created_at for t in queue_mgr.tokens if t.token_id == item["token_id"]), now),
                }
                for item in w_est.get("waiting_estimates", [])
            ],
            "counters": queue_mgr.get_counters_info(),
            "hardware_flags": alert_st.get("hardware", {}),
            "last_action": q_sum.get("last_action", "System ready"),
        }

        latest_telemetry = payload

        # Broadcast via WebSocket at ~10 Hz (every 100ms)
        if now - last_broadcast_time >= 0.10:
            last_broadcast_time = now
            if async_loop and async_loop.is_running():
                asyncio.run_coroutine_threadsafe(ws_manager.broadcast(payload), async_loop)

        time.sleep(0.01)

    camera.release()
    print("[PIPELINE] Vision pipeline stopped.")


@app.on_event("startup")
async def startup_event():
    """Starts the background vision pipeline when FastAPI starts."""
    global pipeline_thread, pipeline_running, async_loop
    async_loop = asyncio.get_running_loop()
    pipeline_running = True
    pipeline_thread = threading.Thread(target=vision_pipeline_worker, daemon=True)
    pipeline_thread.start()
    print("[API] Server started. Pipeline thread initiated.")


@app.on_event("shutdown")
async def shutdown_event():
    """Stops the pipeline gracefully on shutdown."""
    global pipeline_running
    pipeline_running = False
    if pipeline_thread and pipeline_thread.is_alive():
        pipeline_thread.join(timeout=2.0)
    print("[API] Server shutdown.")


# ==============================================================================
# REST API Endpoints
# ==============================================================================

@app.get("/api/health")
async def get_health():
    """Healthcheck endpoint."""
    return {
        "status": "ok",
        "uptime_seconds": round(time.time() - app_start_time, 1),
        "pipeline_running": pipeline_running,
    }


@app.get("/api/status")
async def get_system_status():
    """Returns complete diagnostic status across all modules including ESP32."""
    return {
        "system_online": True,
        "camera_connected": camera.is_connected,
        "yolo_running": tracker.is_ready,
        "tracking_running": tracker.is_ready,
        "queue_engine_running": True,
        "analytics_running": True,
        "esp32_connected": hardware_client.is_connected,
        "esp32_ip": hardware_client.esp32_ip,
        "active_ws_clients": len(ws_manager.active_connections),
        "latest_fps": latest_telemetry.get("fps", 0.0),
    }


@app.get("/api/queue")
async def get_queue_data():
    """Returns current queue state, active tokens, waiting estimates, and counters status."""
    now = time.time()
    q_sum = queue_mgr.get_summary()
    w_est = estimator.get_queue_estimates(queue_mgr, current_time=now)
    return {
        "summary": q_sum,
        "estimates": w_est,
        "tokens": [
            {
                "token_id": t.token_id,
                "status": t.status,
                "created_at": t.created_at,
                "called_at": t.called_at,
                "service_start_at": t.service_start_at,
                "completed_at": t.completed_at,
                "service_duration_seconds": t.service_duration_seconds,
                "customer_name": t.customer_name,
                "mobile_number": t.mobile_number,
                "service_type": t.service_type,
                "assigned_counter": t.assigned_counter,
                "customer_id": t.customer_id,
            }
            for t in queue_mgr.tokens
        ],
        "counters": queue_mgr.get_counters_info(),
    }


@app.get("/api/queue/public")
async def get_public_queue_data():
    """
    Public television queue display endpoint.
    Returns clean customer-facing queue status, now serving token, wait time, and next tokens.
    Guarantees that customer PII (names, phone numbers) is not exposed on public displays.
    """
    now = time.time()
    q_sum = queue_mgr.get_summary()
    w_est = estimator.get_queue_estimates(queue_mgr, current_time=now)

    serving_token_obj = queue_mgr.get_serving_token() or queue_mgr.get_current_token()
    now_serving = None
    if serving_token_obj:
        now_serving = {
            "token": serving_token_obj.token_id,
            "counter": serving_token_obj.assigned_counter,
        }

    waiting_tokens = [t for t in queue_mgr.tokens if t.status == "WAITING"]
    people_waiting = max(len(waiting_tokens), latest_telemetry.get("waiting_area_count", len(waiting_tokens)))

    avg_sec = w_est.get("avg_service_time_seconds", 180.0)
    est_wait = round((avg_sec / 60.0) * max(1, len(waiting_tokens)))

    next_list = []
    for tok in waiting_tokens[:8]:
        next_list.append({
            "token": tok.token_id,
            "counter": tok.assigned_counter,
        })

    counters_info = queue_mgr.get_counters_info()
    active_cnt = sum(1 for c in counters_info if c["active"])

    return {
        "nowServing": now_serving,
        "peopleWaiting": people_waiting,
        "estimatedWaitMinutes": est_wait,
        "activeCounters": active_cnt,
        "totalCounters": len(counters_info),
        "nextTokens": next_list,
    }


@app.get("/api/counters")
async def get_counters():
    """Returns real-time status and load for all bank service counters."""
    return {
        "counters": queue_mgr.get_counters_info(),
    }


@app.get("/api/counters/recommend")
async def get_counter_recommendation(service_type: str = "General Banking"):
    """Returns smart counter recommendation based on service type and shortest queue."""
    return queue_mgr.recommend_counter(service_type)


@app.get("/api/analytics")
async def get_analytics_data():
    """Returns analytics telemetry and in-memory history log."""
    return {
        "current_telemetry": latest_telemetry,
        "history": list(analytics.history),
    }


@app.get("/api/alerts")
async def get_alerts_data():
    """Returns current alert status and deduplicated alert history log."""
    return {
        "current_level": alert_mgr.current_level,
        "current_message": alert_mgr.current_message,
        "active_prediction": alert_mgr.active_prediction,
        "active_long_wait": alert_mgr.active_long_wait,
        "alert_log": alert_mgr.alert_log,
    }


# ==============================================================================
# Hardware Status & Test Endpoints (Phase 8)
# ==============================================================================

@app.get("/api/hardware/status")
async def get_hardware_status():
    """Returns the current ESP32 connection state, IP, and GPIO mapping."""
    return hardware_client.get_status()


@app.post("/api/hardware/test")
async def post_hardware_test(payload: Dict[str, Any] = Body(...)):
    """
    Safe testing endpoint to verify physical LEDs and Buzzer on the ESP32.
    Payload: {"level": "NORMAL" | "MODERATE" | "HIGH" | "CRITICAL"}
    """
    level = payload.get("level", "NORMAL")
    result = hardware_client.send_test_level(level)
    return {
        "mode": "DEMO / HARDWARE TEST MODE",
        "requested_level": level,
        "result": result,
    }


# ==============================================================================
# Token Action Endpoints (Counter-Aware & Registration-Enabled)
# ==============================================================================

@app.post("/api/tokens/generate")
async def api_generate_token(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """
    Generates a new token in WAITING state with customer metadata and assigned counter.
    Payload: { "customer_name": str, "mobile_number": str, "service_type": str, "assigned_counter": int, "customer_id": str }
    """
    data = payload or {}
    cust_name = data.get("customer_name", "")
    phone = data.get("mobile_number", "")
    service = data.get("service_type", "General Banking")
    counter = data.get("assigned_counter")
    cust_id = data.get("customer_id", "")

    tok = queue_mgr.generate_token(
        customer_name=cust_name,
        mobile_number=phone,
        service_type=service,
        assigned_counter=counter,
        customer_id=cust_id,
    )
    return {
        "status": "success",
        "token_id": tok.token_id,
        "token_status": tok.status,
        "customer_name": tok.customer_name,
        "mobile_number": tok.mobile_number,
        "service_type": tok.service_type,
        "assigned_counter": tok.assigned_counter,
        "customer_id": tok.customer_id,
        "created_at": tok.created_at,
    }


@app.post("/api/tokens/call_next")
async def api_call_next(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """
    Calls the next waiting token in line for a specific counter (or any waiting token).
    Payload: { "counter": int }
    """
    data = payload or {}
    counter = data.get("counter")
    tok = queue_mgr.call_next(counter=counter)
    if tok:
        return {
            "status": "success",
            "token_id": tok.token_id,
            "token_status": tok.status,
            "assigned_counter": tok.assigned_counter,
            "customer_name": tok.customer_name,
            "service_type": tok.service_type,
        }
    return {"status": "no_waiting_tokens", "token_id": None}


@app.post("/api/tokens/start_service")
async def api_start_service(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """
    Transitions the called token to SERVING.
    Payload: { "counter": int }
    """
    data = payload or {}
    counter = data.get("counter")
    tok = queue_mgr.start_service(counter=counter)
    if tok:
        return {
            "status": "success",
            "token_id": tok.token_id,
            "token_status": tok.status,
            "assigned_counter": tok.assigned_counter,
            "customer_name": tok.customer_name,
            "service_type": tok.service_type,
        }
    return {"status": "no_token_to_serve", "token_id": None}


@app.post("/api/tokens/complete_service")
async def api_complete_service(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """
    Completes the currently serving token.
    Payload: { "counter": int }
    """
    data = payload or {}
    counter = data.get("counter")
    tok = queue_mgr.complete_service(counter=counter)
    if tok:
        return {
            "status": "success",
            "token_id": tok.token_id,
            "token_status": tok.status,
            "assigned_counter": tok.assigned_counter,
            "customer_name": tok.customer_name,
            "service_type": tok.service_type,
        }
    return {"status": "no_active_service", "token_id": None}


# ==============================================================================
# Live MJPEG Video Stream
# ==============================================================================

def generate_mjpeg_stream():
    """Generator yielding JPEG multipart boundary chunks for live webcam stream."""
    while pipeline_running:
        with latest_frame_lock:
            frame_bytes = latest_jpeg_bytes

        if frame_bytes is not None:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
        time.sleep(0.04)  # ~25 FPS stream


@app.get("/api/video_feed")
async def video_feed():
    """Live MJPEG video streaming endpoint."""
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


# ==============================================================================
# Real-Time WebSocket Endpoint
# ==============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint streaming live telemetry JSON updates to connected dashboards.
    """
    await ws_manager.connect(websocket)
    try:
        if latest_telemetry:
            await websocket.send_json(latest_telemetry)

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
