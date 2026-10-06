"""
FastAPI Real-Time Backend for Adaptive Queue Prediction & Crowd Alert System.
Integrates computer vision pipeline (YOLO & ByteTrack), token queue engine, wait-time estimation,
real-time crowd analytics, ESP32 physical hardware client & endpoints,
SQLite persistence, downloadable audit reports, and real-time WebSocket broadcasting with MJPEG stream.
"""

import asyncio
import os
import sys
import threading
import time
from pathlib import Path
from typing import Dict, Any, Optional, List

# Ensure project root is in sys.path so root modules resolve
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, PlainTextResponse

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
from database import db
from backend.websocket_manager import WebSocketManager


app = FastAPI(
    title="Smart Bank - Adaptive Queue Prediction & Crowd Alert API",
    description="Real-time banking queue management, computer vision crowd monitor, ESP32 hardware gateway, and audit reporting engine",
    version="2.0.0",
)

# Enable CORS for React frontend dashboards
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

# Global State & Synchronization
pipeline_thread: Optional[threading.Thread] = None
pipeline_running = False
latest_frame_lock = threading.Lock()
latest_jpeg_bytes: Optional[bytes] = None
latest_telemetry: Dict[str, Any] = {}
last_detection_timestamp: float = 0.0
last_db_snapshot_time: float = 0.0
app_start_time = time.time()
async_loop: Optional[asyncio.AbstractEventLoop] = None


def vision_pipeline_worker():
    """
    Background worker running the continuous vision, tracking, analytics, and overlay loop.
    Encodes live frames into JPEG bytes, updates ESP32 hardware, logs to SQLite, and triggers WebSocket broadcast.
    """
    global latest_jpeg_bytes, latest_telemetry, pipeline_running, last_detection_timestamp, last_db_snapshot_time

    print("[PIPELINE] Starting background vision pipeline worker...")
    camera_started = camera.start()
    if not camera_started:
        print("[WARN] Camera device offline on initial start. Running pipeline in fallback mode.")

    fps = 0.0
    frame_count = 0
    last_fps_time = time.time()
    last_broadcast_time = time.time()

    while pipeline_running:
        ret, frame = camera.read_frame()
        now = time.time()

        if not ret or frame is None:
            # Camera offline / standby handling
            total_det = 0
            waiting_cnt = 0
            active_cnt = 0
            eval_tracks = []
            pixel_bounds = (100, 100, 500, 400)
            annotated_frame = None
        else:
            last_detection_timestamp = now

            # 1. Vision & Tracking
            raw_tracks, active_cnt, total_det = tracker.track(frame)
            eval_tracks, waiting_cnt = roi_mgr.evaluate_tracks(raw_tracks, frame.shape)
            pixel_bounds = roi_mgr.get_pixel_bounds(frame.shape)

            # 2. FPS Measurement
            frame_count += 1
            if now - last_fps_time >= 0.3:
                fps = frame_count / max(0.01, now - last_fps_time)
                frame_count = 0
                last_fps_time = now

            # 3. Render Visual Overlay for MJPEG Video Feed
            annotated_frame = frame.copy()
            annotated_frame = overlay.draw_waiting_area(annotated_frame, pixel_bounds, waiting_cnt)
            annotated_frame = overlay.draw_tracks(annotated_frame, eval_tracks)

        # 4. Queue & Waiting-Time Estimation
        q_sum = queue_mgr.get_summary()
        w_est = estimator.get_queue_estimates(queue_mgr, current_time=now)

        # 5. Analytics & Alerts
        tele = analytics.update(
            waiting_people_count=waiting_cnt,
            evaluated_tracks=eval_tracks,
            queue_manager=queue_mgr,
            wait_estimates=w_est,
            total_people_detected=total_det,
            current_time=now,
        )
        alert_st = alert_mgr.process_telemetry(tele, current_time=now)

        # 6. Automatic ESP32 Physical Alert Hardware Update (Non-blocking)
        hardware_client.send_hardware_state(alert_st.get("hardware", {}))

        # 7. Render HUD onto frame if camera is active
        if annotated_frame is not None:
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
            ret_enc, jpeg_buffer = cv2.imencode(".jpg", annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if ret_enc:
                with latest_frame_lock:
                    latest_jpeg_bytes = jpeg_buffer.tobytes()

        # 8. Record snapshot into database every 2 seconds
        if now - last_db_snapshot_time >= 2.0:
            last_db_snapshot_time = now
            if db:
                db.record_detection_snapshot(
                    people_detected=total_det,
                    waiting_area_count=waiting_cnt,
                    active_tracks=active_cnt,
                    crowd_status=tele.get("crowd_status", "NORMAL"),
                    fps=fps if camera.is_connected else 0.0,
                    camera_connected=camera.is_connected,
                    yolo_running=tracker.is_ready,
                    esp32_connected=hardware_client.is_connected,
                    current_time=now,
                )

        # 9. Structured Real-Time Telemetry Payload
        hw_status = hardware_client.get_status()
        last_det_str = (
            time.strftime("%I:%M:%S %p", time.localtime(last_detection_timestamp))
            if last_detection_timestamp > 0
            else "No detections yet"
        )

        payload = {
            "timestamp": now,
            "time_str": time.strftime("%I:%M:%S %p", time.localtime(now)),
            "system_online": True,
            "camera_connected": camera.is_connected,
            "camera_status": "online" if camera.is_connected else "offline",
            "detection_status": "active" if (camera.is_connected and tracker.is_ready) else "offline",
            "yolo_running": tracker.is_ready,
            "tracking_running": tracker.is_ready,
            "esp32_connected": hardware_client.is_connected,
            "esp32_ip": hardware_client.esp32_ip,
            "fps": round(fps, 1) if camera.is_connected else 0.0,
            
            # People & Crowd Analytics
            "people_count": total_det,
            "people_detected": total_det,
            "waiting_area_count": waiting_cnt,
            "active_tracks": active_cnt,
            "crowd_status": tele.get("crowd_status", "NORMAL"),
            "peak_crowd": tele.get("peak_crowd", total_det),
            "avg_crowd": tele.get("avg_crowd", float(total_det)),
            "people_entering": tele.get("people_entering", 0),
            "people_leaving": tele.get("people_leaving", 0),
            "in_service_count": tele.get("in_service_count", 0),
            "other_area_estimated": tele.get("other_area_estimated", 0),
            "last_detection_timestamp": last_detection_timestamp,
            "last_detection_time_str": last_det_str,
            "chart_history": tele.get("chart_history", []),

            # Queue & Waiting Times
            "current_token": q_sum.get("current_token_display", "None"),
            "next_token": q_sum.get("next_token_display", "None"),
            "tokens_waiting": q_sum.get("tokens_waiting_count", 0),
            "tokens_completed": len(queue_mgr.get_completed_tokens()),
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
            
            # Recommendation & Alert
            "recommendation": alert_st.get("recommendation", {}),

            # Counters & Tokens
            "counters": queue_mgr.get_counters_info(),
            "waiting_queue": [
                {
                    "token_id": item["token_id"],
                    "position": item["position"],
                    "status": "WAITING",
                    "estimated_wait": item["wait_str"],
                    "wait_seconds": item["wait_seconds"],
                    "customer_name": next((t.customer_name for t in queue_mgr.tokens if t.token_id == item["token_id"]), ""),
                    "service_type": next((t.service_type for t in queue_mgr.tokens if t.token_id == item["token_id"]), "General Banking"),
                    "assigned_counter": next((t.assigned_counter for t in queue_mgr.tokens if t.token_id == item["token_id"]), 3),
                    "customer_id": next((t.customer_id for t in queue_mgr.tokens if t.token_id == item["token_id"]), ""),
                    "created_at": next((t.created_at for t in queue_mgr.tokens if t.token_id == item["token_id"]), now),
                }
                for item in w_est.get("waiting_estimates", [])
            ],

            # Hardware Info & Events
            "hardware_flags": alert_st.get("hardware", {}),
            "hardware_status": hw_status,
            "hardware_events": hw_status.get("recent_events", []),
            "last_action": q_sum.get("last_action", "System ready"),
            "thresholds": tele.get("thresholds", {"normal_max": 15, "moderate_max": 30}),
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
        "people_detected": latest_telemetry.get("people_detected", 0),
        "crowd_status": latest_telemetry.get("crowd_status", "NORMAL"),
    }


@app.get("/api/crowd/status")
async def get_crowd_status_endpoint():
    """Returns real-time camera-based crowd detection status."""
    return {
        "people_count": latest_telemetry.get("people_detected", 0),
        "timestamp": latest_telemetry.get("timestamp", time.time()),
        "crowd_status": latest_telemetry.get("crowd_status", "NORMAL"),
        "camera_status": "online" if camera.is_connected else "offline",
        "detection_status": "active" if (camera.is_connected and tracker.is_ready) else "offline",
        "fps": latest_telemetry.get("fps", 0.0),
        "peak_crowd": latest_telemetry.get("peak_crowd", 0),
        "avg_crowd": latest_telemetry.get("avg_crowd", 0.0),
        "last_detection_time": latest_telemetry.get("last_detection_time_str", "--"),
    }


@app.get("/api/config/thresholds")
async def get_thresholds():
    """Returns configurable crowd alert thresholds."""
    return {
        "normal_max": analytics.threshold_normal_max,
        "moderate_max": analytics.threshold_moderate_max,
        "high_min": analytics.threshold_moderate_max + 1,
    }


@app.post("/api/config/thresholds")
async def set_thresholds(payload: Dict[str, Any] = Body(...)):
    """Configures crowd alert thresholds dynamically."""
    norm_max = int(payload.get("normal_max", 15))
    mod_max = int(payload.get("moderate_max", 30))
    analytics.set_thresholds(norm_max, mod_max)
    return {
        "status": "success",
        "normal_max": analytics.threshold_normal_max,
        "moderate_max": analytics.threshold_moderate_max,
        "high_min": analytics.threshold_moderate_max + 1,
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
    Guarantees zero customer PII exposure on public screens.
    """
    now = time.time()
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
    """Returns current alert status, recommendations, and alert history log."""
    return {
        "current_level": alert_mgr.current_level,
        "current_message": alert_mgr.current_message,
        "active_prediction": alert_mgr.active_prediction,
        "active_long_wait": alert_mgr.active_long_wait,
        "alert_log": alert_mgr.alert_log,
    }


# ==============================================================================
# Audit Reports & Data Export Endpoints
# ==============================================================================

@app.get("/api/reports/summary")
async def get_reports_summary(period: str = Query("today", regex="^(today|yesterday|7days)$")):
    """Returns executive audit report summary for the specified period (today, yesterday, 7days)."""
    if db:
        return db.get_report_summary(period=period)
    return {"error": "Database not initialized"}


@app.get("/api/reports/export")
async def export_reports(
    format: str = Query("csv", regex="^(csv)$"),
    period: str = Query("today", regex="^(today|yesterday|7days)$"),
):
    """Downloads real collected data as CSV audit report."""
    if db:
        csv_data = db.generate_csv_report(period=period)
        filename = f"smart_bank_report_{period}_{time.strftime('%Y%m%d')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    return PlainTextResponse("Error: Database unavailable", status_code=500)


# ==============================================================================
# ESP32 Hardware Integration Endpoints
# ==============================================================================

@app.get("/api/hardware/status")
async def get_hardware_status():
    """Returns current ESP32 status, IP, connection state, and recent hardware events."""
    return hardware_client.get_status()


@app.post("/api/hardware/test")
async def post_hardware_test(payload: Dict[str, Any] = Body(...)):
    """
    Manual test endpoint to verify physical LEDs and Buzzer on the ESP32.
    Payload: {"level": "NORMAL" | "MODERATE" | "HIGH" | "CRITICAL"}
    """
    level = payload.get("level", "NORMAL")
    result = hardware_client.send_test_level(level)
    return {
        "mode": "DEMO / HARDWARE TEST MODE",
        "requested_level": level,
        "result": result,
    }


@app.post("/api/esp32/heartbeat")
async def esp32_push_heartbeat(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint for ESP32 to push its heartbeat, uptime, and Wi-Fi RSSI to FastAPI.
    """
    device_id = payload.get("device_id", "ESP32_DEV_MODULE_01")
    ip = payload.get("ip", "")
    hardware_client.record_external_heartbeat(device_id=device_id, ip=ip, details=payload)
    return {"status": "ack", "server_time": time.time()}


@app.post("/api/esp32/event")
async def esp32_push_event(payload: Dict[str, Any] = Body(...)):
    """
    Endpoint for ESP32 to push sensor trigger events (PIR motion, button press, OLED status).
    """
    event_type = payload.get("event_type", "SENSOR_TRIGGERED")
    details = payload.get("details", "Hardware sensor trigger")
    hardware_client.record_sensor_event(event_type=event_type, details=details)
    return {"status": "recorded", "server_time": time.time()}


# ==============================================================================
# Token Action Endpoints
# ==============================================================================

@app.post("/api/tokens/generate")
async def api_generate_token(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """Generates a new token in WAITING state with customer metadata and assigned counter."""
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
        "service_type": tok.service_type,
        "assigned_counter": tok.assigned_counter,
        "customer_id": tok.customer_id,
        "created_at": tok.created_at,
    }


@app.post("/api/tokens/call_next")
async def api_call_next(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """Calls the next waiting token in line for a specific counter."""
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
    """Transitions the called token to SERVING."""
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
    """Completes the currently serving token for a counter."""
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
            "completed_at": tok.completed_at,
            "service_duration_seconds": tok.service_duration_seconds,
        }
    return {"status": "no_active_service", "token_id": None}


@app.post("/api/tokens/skip")
async def api_skip_token(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """Skips the currently called/serving token for a counter."""
    data = payload or {}
    counter = data.get("counter")
    tok = queue_mgr.skip_token(counter=counter)
    if tok:
        return {
            "status": "success",
            "token_id": tok.token_id,
            "token_status": tok.status,
            "assigned_counter": tok.assigned_counter,
            "customer_name": tok.customer_name,
            "service_type": tok.service_type,
        }
    return {"status": "no_token_to_skip", "token_id": None}


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
