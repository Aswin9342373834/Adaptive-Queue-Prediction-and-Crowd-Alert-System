# PS 37 – Adaptive Queue Prediction and Crowd Alert System

## Phase 8: ESP32 Physical Alert Hardware Integration (Wi-Fi REST + Multi-LED & Buzzer)

Phase 8 connects the real-time Python AI vision and FastAPI backend with a physical **ESP32 microcontroller** over local Wi-Fi. The ESP32 drives 4 status LEDs (Green, Yellow, Orange, Red) and an active Buzzer to visually and acoustically signal crowd congestion levels in the physical facility.

---

### End-to-End System Architecture

```text
       [ Real Laptop/USB Webcam ]
                   │
                   ▼ (Continuous Video Stream)
       [ CameraStream (camera.py) ]
                   │
                   ▼ (Live 1280x720 BGR Frames)
      [ PersonTracker (tracker.py) ] ── (Ultralytics YOLO + ByteTrack MOT)
                   │
                   ▼
       [ ROIManager (roi_manager.py) ]
                   │
                   ▼
      [ QueueManager (queue_manager.py) ] ── (In-Memory Token Lifecycle)
                   │
                   ▼
    [ WaitingTimeEstimator (estimator.py) ]
                   │
                   ▼
       [ QueueAnalytics (analytics.py) ]
                   │
                   ▼
        [ AlertManager (alerts.py) ]
                   │
         ┌─────────┴────────────────────────┐
         ▼                                  ▼
[ FastAPI (backend/api.py) ]     [ HardwareClient (hardware_client.py) ]
 ├── Background Vision Worker               │ (Non-blocking HTTP POST /hardware/status)
 ├── MJPEG Stream (/api/video_feed)         ▼
 ├── REST API Endpoints (/api/*)   [ Physical ESP32 Hardware Unit ]
 └── WebSocket Server (/ws)                 ├── 🟢 GREEN LED  (GPIO 25) -> NORMAL
         │                                  ├── 🟡 YELLOW LED (GPIO 26) -> MODERATE
         ▼ (10 Hz Live Telemetry)           ├── 🟠 ORANGE LED (GPIO 27) -> HIGH
[ React Dashboard (frontend) ]              ├── 🔴 RED LED    (GPIO 14) -> CRITICAL
 ├── Live Vision & ROI HUD                  └── 🔊 BUZZER     (GPIO 13) -> Pulsing Alarm
 ├── KPI Telemetry & Charts
 ├── Digital Token Controls
 └── ESP32 Hardware Card & Diagnostics
```

---

### REST API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service health status and uptime. |
| `GET` | `/api/status` | Complete module execution status including ESP32 connection state. |
| `GET` | `/api/hardware/status` | ESP32 target IP, connection status, and GPIO pin assignments. |
| `POST` | `/api/hardware/test` | Manual hardware test dispatcher (`NORMAL`, `MODERATE`, `HIGH`, `CRITICAL`). |
| `GET` | `/api/queue` | Current queue tokens, serving status, and wait estimates. |
| `GET` | `/api/analytics` | Telemetry analytics and historical metrics. |
| `GET` | `/api/alerts` | Active alert level, message, and deduplicated event log. |
| `GET` | `/api/video_feed` | Live MJPEG annotated webcam video stream (`multipart/x-mixed-replace`). |
| `POST` | `/api/tokens/generate` | Generates a new customer token (`C001`, `C002`...). |
| `POST` | `/api/tokens/call_next` | Calls the next waiting token (`WAITING` &rarr; `CALLED`). |
| `POST` | `/api/tokens/start_service` | Starts counter service timer (`CALLED` &rarr; `SERVING`). |
| `POST` | `/api/tokens/complete_service` | Concludes service (`SERVING` &rarr; `COMPLETED`) & records duration. |
| `WS` | `/ws` | Real-time WebSocket connection streaming 10 Hz JSON telemetry. |

---

### ESP32 Physical Hardware Setup (Phase 8)

#### 1. Hardware Pinout & Wiring Schematic

| Component | ESP32 GPIO Pin | Current Limiting | Congestion Trigger State |
|:---|:---|:---|:---|
| 🟢 **Green LED** | `GPIO 25` | 220 &Omega; Resistor &rarr; GND | `NORMAL` State |
| 🟡 **Yellow LED** | `GPIO 26` | 220 &Omega; Resistor &rarr; GND | `MODERATE` Congestion |
| 🟠 **Orange LED** | `GPIO 27` | 220 &Omega; Resistor &rarr; GND | `HIGH` Congestion |
| 🔴 **Red LED** | `GPIO 14` | 220 &Omega; Resistor &rarr; GND | `CRITICAL` Congestion |
| 🔊 **Active Buzzer** | `GPIO 13` | Direct / NPN Transistor &rarr; GND | `CRITICAL` State (300ms ON / 700ms OFF) |

#### 2. Arduino IDE Firmware Upload
1. Open the Arduino IDE.
2. Open [`esp32/hardware_alert.ino`](file:///c:/Users/aswin/OneDrive/Desktop/Adaptive%20Queue%20Prediction%20and%20Crowd%20Alert%20System/esp32/hardware_alert.ino).
3. Set your Wi-Fi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Select board **ESP32 Dev Module** and choose the correct COM port.
5. Upload the sketch and open Serial Monitor at **115200 baud** to verify assigned IP address.
6. If the IP address differs from default, update `ESP32_IP` in `config.py`.

---

### Real-Time WebSocket Telemetry Payload

```json
{
  "timestamp": 1791091189.739,
  "system_online": true,
  "camera_connected": true,
  "yolo_running": true,
  "tracking_running": true,
  "fps": 28.5,
  "people_detected": 8,
  "waiting_area_count": 6,
  "active_tracks": 8,
  "current_token": "C024 (SERVING)",
  "next_token": "C025",
  "tokens_waiting": 5,
  "average_service_time_seconds": 190.0,
  "average_service_display": "3 min 10 sec",
  "is_measured_service_time": true,
  "serving_token_id": "C024",
  "serving_elapsed_str": "02:15",
  "serving_remaining_str": "00:55",
  "max_wait_minutes": 18.5,
  "arrival_rate": 1.2,
  "service_rate": 0.4,
  "queue_growth_rate": 0.6,
  "queue_trend": "INCREASING",
  "congestion_level": "HIGH",
  "prediction": "HIGH CONGESTION EXPECTED",
  "alert_message": "High congestion detected",
  "is_long_wait": false,
  "waiting_queue": [
    { "token_id": "C025", "position": 1, "status": "WAITING", "estimated_wait": "0:55 min", "wait_seconds": 55.0 },
    { "token_id": "C026", "position": 2, "status": "WAITING", "estimated_wait": "4:05 min", "wait_seconds": 245.0 }
  ],
  "hardware_flags": {
    "level": "HIGH",
    "led_green": false,
    "led_yellow": false,
    "led_orange": true,
    "led_red": false,
    "buzzer": false,
    "message": "! HIGH CONGESTION (INCREASING)"
  },
  "last_action": "Serving Token C024"
}
```

---

### Running the Application

#### Step 1: Start the FastAPI Backend
In your project directory:
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.api:app --host 0.0.0.0 --port 8000
```

#### Step 2: Start the React Frontend
In a second terminal window:
```powershell
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

### Standalone OpenCV Prototype (Phase 1–6 Mode)
To run the standalone OpenCV desktop window prototype:
```powershell
.\.venv\Scripts\python.exe main.py
```

---

### Project File Structure

```text
├── config.py                 # Central configuration (camera, ROI, thresholds, bootstrap)
├── camera.py                 # OpenCV webcam capture and resource manager
├── tracker.py                # ByteTrack real-time multi-object tracking
├── detector.py               # Standalone YOLO detection wrapper
├── roi_manager.py            # Waiting Area ROI geometric containment
├── queue_manager.py          # Digital token state machine and positions
├── estimator.py              # Dynamic waiting-time estimation engine
├── analytics.py              # Telemetry, flow rates, queue growth, forward prediction
├── alerts.py                 # Congestion levels, deduplication, hardware interface
├── ui_overlay.py             # OpenCV HUD and visual annotations overlay
├── main.py                   # Standalone OpenCV desktop application
├── requirements.txt          # Python dependencies
│
├── backend/
│   ├── api.py                # FastAPI REST, WebSocket & MJPEG video server
│   └── websocket_manager.py  # WebSocket connection manager
│
└── frontend/
    ├── package.json          # React, TypeScript, Vite, Recharts, Lucide dependencies
    ├── vite.config.ts        # Vite configuration with Tailwind CSS v4
    └── src/
        ├── types/queue.ts    # TypeScript telemetry and alert interfaces
        ├── services/api.ts   # REST API client
        ├── hooks/            # useQueueWebSocket auto-reconnecting hook
        ├── components/
        │   ├── Header.tsx            # Header with live system indicators
        │   ├── KpiCards.tsx          # 8 Live KPI metric cards
        │   ├── CongestionBanner.tsx  # Congestion status & alert banner
        │   ├── CurrentServicePanel.tsx# Active counter service timer
        │   ├── TokenControls.tsx     # Interactive token action buttons
        │   ├── LiveQueueTable.tsx    # Live waiting queue table
        │   ├── LiveCameraFeed.tsx    # Live MJPEG OpenCV AI vision stream
        │   ├── AnalyticsCharts.tsx   # 4 Recharts dynamic telemetry graphs
        │   ├── AlertsPanel.tsx       # Deduplicated alert history log
        │   └── SystemHealth.tsx      # Subsystem health diagnostics matrix
        └── App.tsx           # Responsive multi-tab banking dashboard
```
