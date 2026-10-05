"""
Main Application Entry Point for Phase 6:
Real-Time Queue Congestion Prediction & Alert System with Live Webcam Vision Pipeline.
"""

import sys
import time
import cv2
import config
from camera import CameraStream
from tracker import PersonTracker
from roi_manager import ROIManager
from queue_manager import QueueManager
from estimator import WaitingTimeEstimator
from analytics import QueueAnalytics
from alerts import AlertManager
from ui_overlay import UIOverlay


def main():
    print("=" * 82)
    print("  PS 37 - Adaptive Queue Prediction & Crowd Alert System")
    print("  PHASE 6: Real-Time Queue Congestion Prediction & Alert System")
    print("=" * 82)

    # 1. Initialize YOLO Person Tracker
    try:
        tracker = PersonTracker(
            model_name=config.MODEL_NAME,
            conf_threshold=config.CONFIDENCE_THRESHOLD,
            tracker_type=config.TRACKER_TYPE,
        )
    except Exception as e:
        print(f"[FATAL] Unable to initialize Person Tracker: {e}")
        sys.exit(1)

    # 2. Initialize Waiting Area (ROI) Manager
    roi_mgr = ROIManager(roi_coords=config.WAITING_AREA_ROI)
    print(f"[INFO] Waiting Area configured at normalized coords: {config.WAITING_AREA_ROI}")

    # 3. Initialize Digital Queue Manager
    queue_mgr = QueueManager()
    print("[INFO] Digital Queue Manager initialized.")

    # 4. Initialize Waiting-Time Estimator
    estimator = WaitingTimeEstimator(bootstrap_service_time=config.BOOTSTRAP_SERVICE_TIME_SECONDS)
    print(f"[INFO] Waiting-Time Estimator ready (Bootstrap: {config.BOOTSTRAP_SERVICE_TIME_SECONDS}s).")

    # 5. Initialize Queue Analytics & Alert Manager
    analytics = QueueAnalytics(
        analysis_window=config.QUEUE_ANALYSIS_WINDOW_SECONDS,
        prediction_horizon=config.PREDICTION_HORIZON_SECONDS,
    )
    alert_mgr = AlertManager()
    print("[INFO] Queue Analytics & Alert Manager initialized.")

    # 6. Initialize Camera Stream
    camera = CameraStream(
        camera_index=config.CAMERA_INDEX,
        width=config.FRAME_WIDTH,
        height=config.FRAME_HEIGHT,
        fps=config.CAMERA_FPS,
    )

    if not camera.start():
        print("[FATAL] Camera could not be started. Please verify:")
        print("  1. Your webcam is physically plugged in / enabled.")
        print("  2. No other application (Zoom, Teams, Camera app) is using it.")
        print("  3. Camera privacy permissions are allowed for Python/desktop apps.")
        sys.exit(1)

    # 7. Initialize Visual Overlay
    overlay = UIOverlay()

    # Create named window and allow resizing
    cv2.namedWindow(config.WINDOW_NAME, cv2.WINDOW_NORMAL)

    print("\n[INFO] Real-time pipeline active.")
    print("=" * 82)
    print("  KEYBOARD CONTROLS (Press inside the video window):")
    print("    [N] : Generate New Token (e.g. C001, C002)")
    print("    [C] : Call Next Waiting Token (WAITING -> CALLED)")
    print("    [S] : Start Serving Token (CALLED -> SERVING)")
    print("    [D] : Complete Service (SERVING -> COMPLETED)")
    print("    [Q] : Quit Application")
    print("=" * 82 + "\n")

    # FPS Calculation tracking
    fps = 0.0
    prev_time = time.time()
    frame_count = 0
    fps_update_interval = 0.3  # Update FPS display every 300ms for smooth reading
    last_fps_time = prev_time

    try:
        while True:
            # Capture live frame from webcam
            ret, frame = camera.read_frame()
            if not ret or frame is None:
                print("[WARN] Failed to grab frame from webcam. Retrying...")
                time.sleep(0.01)
                continue

            # Step 1: Run real YOLO ByteTrack tracking strictly for 'person' class
            raw_tracks, active_tracks, total_detected = tracker.track(frame)

            # Step 2: Evaluate each tracked person against the Waiting Area ROI
            evaluated_tracks, waiting_count = roi_mgr.evaluate_tracks(raw_tracks, frame.shape)
            pixel_bounds = roi_mgr.get_pixel_bounds(frame.shape)

            # Step 3: Get queue snapshot & dynamic wait-time estimates
            curr_now = time.time()
            queue_summary = queue_mgr.get_summary()
            wait_estimates = estimator.get_queue_estimates(queue_mgr, current_time=curr_now)

            # Step 4: Run Telemetry Analytics & Congestion Alert Processing
            telemetry = analytics.update(
                waiting_people_count=waiting_count,
                evaluated_tracks=evaluated_tracks,
                queue_manager=queue_mgr,
                wait_estimates=wait_estimates,
                current_time=curr_now,
            )
            alert_state = alert_mgr.process_telemetry(telemetry, current_time=curr_now)

            # Step 5: Calculate FPS
            frame_count += 1
            if curr_now - last_fps_time >= fps_update_interval:
                fps = frame_count / (curr_now - last_fps_time)
                frame_count = 0
                last_fps_time = curr_now

            # Step 6: Render Waiting Area ROI boundary and label
            frame = overlay.draw_waiting_area(frame, pixel_bounds, waiting_count=waiting_count)

            # Step 7: Render tracked persons (ID, WAITING vs OUTSIDE badge, center point)
            frame = overlay.draw_tracks(frame, evaluated_tracks)

            # Step 8: Render System Diagnostics HUD and Smart Bank Queue & Congestion Alert Panel
            frame = overlay.draw_hud(
                frame,
                people_detected=total_detected,
                waiting_count=waiting_count,
                active_tracks=active_tracks,
                fps=fps,
                queue_summary=queue_summary,
                wait_estimates=wait_estimates,
                telemetry=telemetry,
                alert_state=alert_state,
                camera_status="CONNECTED" if camera.is_connected else "DISCONNECTED",
                yolo_status="RUNNING" if tracker.is_ready else "ERROR",
                tracking_status="RUNNING" if tracker.is_ready else "ERROR",
            )

            # Display processed frame
            cv2.imshow(config.WINDOW_NAME, frame)

            # Step 9: Handle keyboard input (1ms waitKey)
            key = cv2.waitKey(1) & 0xFF

            if key in [ord('q'), ord('Q'), 27]:  # 'q', 'Q', or ESC
                print("\n[INFO] Exit key pressed. Shutting down cleanly...")
                break
            elif key in [ord('n'), ord('N')]:
                queue_mgr.generate_token()
            elif key in [ord('c'), ord('C')]:
                queue_mgr.call_next()
            elif key in [ord('s'), ord('S')]:
                queue_mgr.start_service()
            elif key in [ord('d'), ord('D')]:
                queue_mgr.complete_service()

    except KeyboardInterrupt:
        print("\n[INFO] KeyboardInterrupt received. Shutting down...")
    except Exception as e:
        print(f"\n[ERROR] Unexpected error in main loop: {e}")
    finally:
        # Resource cleanup
        camera.release()
        cv2.destroyAllWindows()
        print("[SUCCESS] Application terminated safely.")


if __name__ == "__main__":
    main()
