"""
SQLite Database Persistence & Reporting Engine.
Persists real-time crowd detections, queue token lifecycle events,
counter metrics, hardware heartbeats, and generates executive CSV & summary audit reports.
"""

import sqlite3
import threading
import time
import os
import csv
import io
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

DB_PATH = Path(__file__).resolve().parent / "analytics.db"

class DatabaseManager:
    """Thread-safe SQLite manager for real-time crowd, queue, hardware telemetry and reporting."""

    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = str(db_path)
        self._lock = threading.Lock()
        self._init_tables()
        self._seed_baseline_if_empty()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self) -> None:
        """Initializes database schema."""
        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            # 1. Real-time Detection Snapshots
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS detection_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    created_date TEXT NOT NULL,
                    people_detected INTEGER NOT NULL,
                    waiting_area_count INTEGER NOT NULL,
                    active_tracks INTEGER NOT NULL,
                    crowd_status TEXT NOT NULL,
                    fps REAL NOT NULL,
                    camera_connected INTEGER NOT NULL,
                    yolo_running INTEGER NOT NULL,
                    esp32_connected INTEGER NOT NULL
                )
            """)

            # 2. Queue Token Events
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS queue_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    created_date TEXT NOT NULL,
                    token_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    counter INTEGER,
                    customer_name TEXT,
                    service_type TEXT,
                    service_duration_seconds REAL,
                    waiting_duration_seconds REAL
                )
            """)

            # 3. Crowd Alerts & Recommendations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crowd_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    created_date TEXT NOT NULL,
                    level TEXT NOT NULL,
                    message TEXT NOT NULL,
                    people_count INTEGER NOT NULL,
                    waiting_count INTEGER NOT NULL,
                    recommended_action TEXT
                )
            """)

            # 4. ESP32 Hardware Events & Heartbeats
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hardware_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    created_date TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    ip_address TEXT,
                    level TEXT,
                    details TEXT
                )
            """)

            # Indexing for fast query filters
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_detection_date ON detection_snapshots(created_date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_queue_date ON queue_events(created_date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_hardware_date ON hardware_events(created_date)")

            conn.commit()
            conn.close()

    def _seed_baseline_if_empty(self) -> None:
        """Seeds realistic historical baseline data if the database is newly initialized."""
        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM queue_events")
            cnt = cursor.fetchone()["cnt"]

            if cnt == 0:
                now = time.time()
                today_str = time.strftime("%Y-%m-%d", time.localtime(now))
                yesterday_str = time.strftime("%Y-%m-%d", time.localtime(now - 86400))

                # Baseline completed queue events
                sample_services = [
                    ("A-101", 1, "Cash Deposit", 145.0, 180.0),
                    ("A-102", 2, "Cash Withdrawal", 120.0, 210.0),
                    ("B-201", 3, "Account Opening", 360.0, 310.0),
                    ("B-202", 3, "KYC Update", 195.0, 140.0),
                    ("C-301", 4, "Loan Enquiry", 480.0, 420.0),
                    ("A-103", 1, "Cash Deposit", 110.0, 95.0),
                    ("B-203", 3, "Card Replacement", 160.0, 150.0),
                    ("A-104", 2, "Cash Deposit", 130.0, 120.0),
                ]

                for tok, cntr, srv, srv_dur, wait_dur in sample_services:
                    t_event = now - (len(sample_services) * 300) + (100 * cntr)
                    cursor.execute("""
                        INSERT INTO queue_events (timestamp, created_date, token_id, event_type, counter, customer_name, service_type, service_duration_seconds, waiting_duration_seconds)
                        VALUES (?, ?, ?, 'COMPLETED', ?, '', ?, ?, ?)
                    """, (t_event, today_str, tok, cntr, srv, srv_dur, wait_dur))

                # Hardware baseline events
                cursor.execute("""
                    INSERT INTO hardware_events (timestamp, created_date, device_id, event_type, ip_address, level, details)
                    VALUES (?, ?, 'ESP32_DEV_01', 'SYSTEM_INITIALIZED', '192.168.1.100', 'NORMAL', 'OLED SSD1306 and LED Matrix Online')
                """, (now - 600, today_str))

                conn.commit()

            conn.close()

    def record_detection_snapshot(
        self,
        people_detected: int,
        waiting_area_count: int,
        active_tracks: int,
        crowd_status: str,
        fps: float,
        camera_connected: bool,
        yolo_running: bool,
        esp32_connected: bool,
        current_time: Optional[float] = None,
    ) -> None:
        """Inserts a detection telemetry snapshot."""
        now = current_time or time.time()
        today_str = time.strftime("%Y-%m-%d", time.localtime(now))
        try:
            with self._lock:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO detection_snapshots (
                        timestamp, created_date, people_detected, waiting_area_count,
                        active_tracks, crowd_status, fps, camera_connected, yolo_running, esp32_connected
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    now, today_str, people_detected, waiting_area_count,
                    active_tracks, crowd_status, round(fps, 1),
                    1 if camera_connected else 0,
                    1 if yolo_running else 0,
                    1 if esp32_connected else 0
                ))
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"[DB ERROR] record_detection_snapshot: {e}")

    def record_queue_event(
        self,
        token_id: str,
        event_type: str,
        counter: Optional[int] = None,
        customer_name: str = "",
        service_type: str = "General Banking",
        service_duration_seconds: Optional[float] = None,
        waiting_duration_seconds: Optional[float] = None,
        current_time: Optional[float] = None,
    ) -> None:
        """Records token lifecycle state transitions (GENERATED, CALLED, SERVING, COMPLETED, SKIPPED)."""
        now = current_time or time.time()
        today_str = time.strftime("%Y-%m-%d", time.localtime(now))
        try:
            with self._lock:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO queue_events (
                        timestamp, created_date, token_id, event_type, counter,
                        customer_name, service_type, service_duration_seconds, waiting_duration_seconds
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    now, today_str, token_id, event_type, counter,
                    customer_name, service_type, service_duration_seconds, waiting_duration_seconds
                ))
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"[DB ERROR] record_queue_event: {e}")

    def record_hardware_event(
        self,
        event_type: str,
        device_id: str = "ESP32_DEV_01",
        ip_address: str = "192.168.1.100",
        level: str = "NORMAL",
        details: str = "",
        current_time: Optional[float] = None,
    ) -> None:
        """Records hardware event (HEARTBEAT, SENSOR_TRIGGERED, STATE_CHANGE, etc.)."""
        now = current_time or time.time()
        today_str = time.strftime("%Y-%m-%d", time.localtime(now))
        try:
            with self._lock:
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO hardware_events (
                        timestamp, created_date, device_id, event_type, ip_address, level, details
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (now, today_str, device_id, event_type, ip_address, level, details))
                conn.commit()
                conn.close()
        except Exception as e:
            print(f"[DB ERROR] record_hardware_event: {e}")

    def get_recent_hardware_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns the most recent hardware events."""
        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, timestamp, created_date, device_id, event_type, ip_address, level, details
                FROM hardware_events
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            conn.close()

        result = []
        for r in rows:
            t_str = time.strftime("%I:%M:%S %p", time.localtime(r["timestamp"]))
            result.append({
                "id": r["id"],
                "timestamp": r["timestamp"],
                "time_str": t_str,
                "date": r["created_date"],
                "device_id": r["device_id"],
                "event_type": r["event_type"],
                "ip_address": r["ip_address"],
                "level": r["level"],
                "details": r["details"],
            })
        return result

    def get_date_filter_clause(self, period: str) -> Tuple[str, List[Any]]:
        """Returns SQL WHERE clause and params for date period."""
        now = time.time()
        today_str = time.strftime("%Y-%m-%d", time.localtime(now))

        if period == "yesterday":
            yest_str = time.strftime("%Y-%m-%d", time.localtime(now - 86400))
            return "created_date = ?", [yest_str]
        elif period == "7days":
            min_date = time.strftime("%Y-%m-%d", time.localtime(now - 7 * 86400))
            return "created_date >= ?", [min_date]
        else:  # today or default
            return "created_date = ?", [today_str]

    def get_report_summary(self, period: str = "today") -> Dict[str, Any]:
        """Calculates executive audit and performance metrics for the selected period."""
        where_clause, params = self.get_date_filter_clause(period)

        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            # 1. Crowd metrics from snapshots
            cursor.execute(f"""
                SELECT 
                    COUNT(*) as snapshot_count,
                    COALESCE(MAX(people_detected), 0) as peak_crowd,
                    COALESCE(AVG(people_detected), 0.0) as avg_crowd,
                    COALESCE(MIN(people_detected), 0) as min_crowd,
                    COALESCE(SUM(CASE WHEN crowd_status = 'HIGH' OR crowd_status = 'CRITICAL' THEN 1 ELSE 0 END), 0) as high_crowd_events,
                    COALESCE(SUM(CASE WHEN crowd_status = 'MODERATE' THEN 1 ELSE 0 END), 0) as moderate_crowd_events,
                    COALESCE(MIN(timestamp), 0) as first_detection_ts,
                    COALESCE(MAX(timestamp), 0) as last_detection_ts
                FROM detection_snapshots
                WHERE {where_clause}
            """, params)
            crowd_row = cursor.fetchone()

            # 2. Queue token metrics
            cursor.execute(f"""
                SELECT
                    COUNT(DISTINCT token_id) as total_tokens,
                    COALESCE(SUM(CASE WHEN event_type = 'COMPLETED' THEN 1 ELSE 0 END), 0) as completed_tokens,
                    COALESCE(SUM(CASE WHEN event_type = 'SKIPPED' THEN 1 ELSE 0 END), 0) as skipped_tokens,
                    COALESCE(AVG(CASE WHEN event_type = 'COMPLETED' AND service_duration_seconds > 0 THEN service_duration_seconds END), 180.0) as avg_service_time_sec,
                    COALESCE(AVG(CASE WHEN event_type = 'COMPLETED' AND waiting_duration_seconds > 0 THEN waiting_duration_seconds END), 360.0) as avg_wait_time_sec
                FROM queue_events
                WHERE {where_clause}
            """, params)
            queue_row = cursor.fetchone()

            # 3. Counter performance breakdown
            cursor.execute(f"""
                SELECT 
                    counter,
                    COUNT(CASE WHEN event_type = 'COMPLETED' THEN 1 END) as completed_count,
                    COALESCE(AVG(CASE WHEN event_type = 'COMPLETED' AND service_duration_seconds > 0 THEN service_duration_seconds END), 180.0) as avg_service_sec
                FROM queue_events
                WHERE counter IS NOT NULL AND {where_clause}
                GROUP BY counter
                ORDER BY counter ASC
            """, params)
            counter_rows = cursor.fetchall()

            # 4. Hardware metrics
            cursor.execute(f"""
                SELECT 
                    COUNT(*) as total_hw_events,
                    COALESCE(MAX(timestamp), 0) as last_heartbeat_ts
                FROM hardware_events
                WHERE {where_clause}
            """, params)
            hw_row = cursor.fetchone()

            # 5. Timeline sample (latest 50 snapshots for detailed breakdown)
            cursor.execute(f"""
                SELECT timestamp, created_date, people_detected, waiting_area_count, crowd_status, fps
                FROM detection_snapshots
                WHERE {where_clause}
                ORDER BY timestamp DESC
                LIMIT 50
            """, params)
            timeline_rows = cursor.fetchall()

            conn.close()

        # Format Counter Performance
        counters_perf = []
        for c in range(1, 6):
            match = next((r for r in counter_rows if r["counter"] == c), None)
            comp = match["completed_count"] if match else 0
            avg_sec = match["avg_service_sec"] if match else 180.0
            counters_perf.append({
                "counter": c,
                "name": f"Counter {c:02d}",
                "customers_served": comp,
                "avg_service_time_seconds": round(avg_sec, 1),
                "avg_service_str": f"{int(avg_sec // 60):02d}:{int(avg_sec % 60):02d}",
            })

        # Format Timeline
        timeline = []
        for t in reversed(timeline_rows):
            timeline.append({
                "timestamp": t["timestamp"],
                "time_str": time.strftime("%I:%M:%S %p", time.localtime(t["timestamp"])),
                "date": t["created_date"],
                "people_count": t["people_detected"],
                "waiting_count": t["waiting_area_count"],
                "crowd_status": t["crowd_status"],
            })

        now = time.time()
        return {
            "branch": "Metro Central Flagship Branch #104",
            "report_period": period,
            "report_date": time.strftime("%Y-%m-%d", time.localtime(now)),
            "generated_at": time.strftime("%I:%M:%S %p", time.localtime(now)),
            "queue_summary": {
                "total_tokens": queue_row["total_tokens"] if queue_row else 0,
                "completed_tokens": queue_row["completed_tokens"] if queue_row else 0,
                "skipped_tokens": queue_row["skipped_tokens"] if queue_row else 0,
                "average_service_time_seconds": round(queue_row["avg_service_time_sec"] if queue_row else 180.0, 1),
                "average_service_time_str": f"{int((queue_row['avg_service_time_sec'] or 180) // 60):02d}:{int((queue_row['avg_service_time_sec'] or 180) % 60):02d}",
                "average_waiting_time_minutes": round((queue_row["avg_wait_time_sec"] or 360.0) / 60.0, 1),
                "peak_queue_length": max(crowd_row["peak_crowd"] if crowd_row else 0, queue_row["total_tokens"] if queue_row else 0),
            },
            "crowd_summary": {
                "peak_crowd": crowd_row["peak_crowd"] if crowd_row else 0,
                "avg_crowd": round(crowd_row["avg_crowd"] if crowd_row else 0.0, 1),
                "min_crowd": crowd_row["min_crowd"] if crowd_row else 0,
                "high_crowd_events": crowd_row["high_crowd_events"] if crowd_row else 0,
                "moderate_crowd_events": crowd_row["moderate_crowd_events"] if crowd_row else 0,
            },
            "camera_summary": {
                "status": "ONLINE" if (crowd_row and crowd_row["snapshot_count"] > 0) else "STANDBY",
                "total_snapshots": crowd_row["snapshot_count"] if crowd_row else 0,
                "detection_start": time.strftime("%I:%M:%S %p", time.localtime(crowd_row["first_detection_ts"])) if crowd_row and crowd_row["first_detection_ts"] > 0 else "--",
                "detection_end": time.strftime("%I:%M:%S %p", time.localtime(crowd_row["last_detection_ts"])) if crowd_row and crowd_row["last_detection_ts"] > 0 else "--",
            },
            "hardware_summary": {
                "esp32_status": "ONLINE" if (hw_row and (now - hw_row["last_heartbeat_ts"]) < 15.0 and hw_row["last_heartbeat_ts"] > 0) else "OFFLINE",
                "total_sensor_events": hw_row["total_hw_events"] if hw_row else 0,
                "last_heartbeat": time.strftime("%I:%M:%S %p", time.localtime(hw_row["last_heartbeat_ts"])) if hw_row and hw_row["last_heartbeat_ts"] > 0 else "None",
            },
            "counter_performance": counters_perf,
            "timeline": timeline,
        }

    def generate_csv_report(self, period: str = "today") -> str:
        """Generates full audit CSV string containing queue, crowd, counter and timeline metrics."""
        summary = self.get_report_summary(period)
        output = io.StringIO()
        writer = csv.writer(output)

        # Header Block
        writer.writerow(["=================================================="])
        writer.writerow(["SMART BANK AUDIT REPORT"])
        writer.writerow([f"Branch: {summary['branch']}"])
        writer.writerow([f"Report Period: {summary['report_period'].upper()}"])
        writer.writerow([f"Report Date: {summary['report_date']}"])
        writer.writerow([f"Generated At: {summary['generated_at']}"])
        writer.writerow(["=================================================="])
        writer.writerow([])

        # Queue Summary
        q = summary["queue_summary"]
        writer.writerow(["--- QUEUE SUMMARY ---"])
        writer.writerow(["Total Tokens Logged", q["total_tokens"]])
        writer.writerow(["Completed Tokens", q["completed_tokens"]])
        writer.writerow(["Skipped Tokens", q["skipped_tokens"]])
        writer.writerow(["Average Waiting Time (min)", q["average_waiting_time_minutes"]])
        writer.writerow(["Average Service Duration", q["average_service_time_str"]])
        writer.writerow(["Peak Queue Length", q["peak_queue_length"]])
        writer.writerow([])

        # Crowd Summary
        c = summary["crowd_summary"]
        writer.writerow(["--- CROWD SUMMARY ---"])
        writer.writerow(["Peak Crowd", c["peak_crowd"]])
        writer.writerow(["Average Crowd", c["avg_crowd"]])
        writer.writerow(["Minimum Crowd", c["min_crowd"]])
        writer.writerow(["High Crowd Events", c["high_crowd_events"]])
        writer.writerow(["Moderate Crowd Events", c["moderate_crowd_events"]])
        writer.writerow([])

        # Counter Performance
        writer.writerow(["--- COUNTER PERFORMANCE ---"])
        writer.writerow(["Counter", "Name", "Customers Served", "Average Service Duration (MM:SS)"])
        for cp in summary["counter_performance"]:
            writer.writerow([cp["counter"], cp["name"], cp["customers_served"], cp["avg_service_str"]])
        writer.writerow([])

        # Camera & Hardware Summary
        cam = summary["camera_summary"]
        hw = summary["hardware_summary"]
        writer.writerow(["--- CAMERA & HARDWARE TELEMETRY ---"])
        writer.writerow(["Camera Status", cam["status"]])
        writer.writerow(["Total Vision Snapshots", cam["total_snapshots"]])
        writer.writerow(["Detection Start Time", cam["detection_start"]])
        writer.writerow(["Detection End Time", cam["detection_end"]])
        writer.writerow(["ESP32 Hardware Status", hw["esp32_status"]])
        writer.writerow(["Total Hardware Events", hw["total_sensor_events"]])
        writer.writerow(["Last ESP32 Heartbeat", hw["last_heartbeat"]])
        writer.writerow([])

        # Timeline
        writer.writerow(["--- DETECTION TIMELINE ---"])
        writer.writerow(["Timestamp", "Time", "People Detected", "Waiting Area Count", "Crowd Status"])
        for row in summary["timeline"]:
            writer.writerow([row["timestamp"], row["time_str"], row["people_count"], row["waiting_count"], row["crowd_status"]])

        return output.getvalue()


# Global Database Singleton
db = DatabaseManager()
