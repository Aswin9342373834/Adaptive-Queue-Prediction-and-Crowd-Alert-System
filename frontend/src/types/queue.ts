export type CongestionLevel = 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type CrowdStatus = 'NORMAL' | 'MODERATE' | 'HIGH';

export interface WaitingCustomer {
  token_id: string;
  position: number;
  status: string;
  estimated_wait: string;
  wait_seconds: number;
  customer_name?: string;
  mobile_number?: string;
  service_type?: string;
  assigned_counter?: number;
  customer_id?: string;
  created_at?: number;
}

export interface ActiveCounterToken {
  token_id: string;
  status: string;
  customer_name?: string;
  mobile_number?: string;
  service_type?: string;
  assigned_counter?: number;
  customer_id?: string;
  called_at?: number;
  service_start_at?: number;
  elapsed_seconds?: number;
  elapsed_str?: string;
}

export interface CounterInfo {
  counter: number;
  name: string;
  officer: string;
  services: string[];
  active: boolean;
  waiting_count: number;
  current_serving: string | null;
  current_status?: string;
  active_token?: ActiveCounterToken | null;
}

export interface CounterRecommendation {
  recommended_counter: number;
  counter_name: string;
  officer_name: string;
  waiting_count: number;
  reason: string;
}

export interface GenerateTokenPayload {
  customer_name: string;
  mobile_number: string;
  service_type: string;
  assigned_counter?: number;
  customer_id?: string;
}

export interface HardwareFlags {
  level: CongestionLevel;
  led_green: boolean;
  led_yellow: boolean;
  led_orange: boolean;
  led_red: boolean;
  buzzer: boolean;
  message: string;
}

export interface HardwareEvent {
  id: number;
  timestamp: number;
  time_str: string;
  date: string;
  device_id: string;
  event_type: string;
  ip_address: string;
  level: string;
  details: string;
}

export interface HardwareStatus {
  enabled: boolean;
  device_id?: string;
  esp32_ip?: string;
  esp32_port?: number;
  is_connected: boolean;
  sensor_status?: string;
  wifi_status?: string;
  last_sent_level?: string;
  last_sent_time?: number;
  last_heartbeat_time?: number;
  last_heartbeat_ago?: string;
  last_error?: string | null;
  recent_events?: HardwareEvent[];
}

export interface SystemRecommendation {
  active: boolean;
  title: string;
  message: string;
  action: string;
  suggested_counter?: number | null;
  current_crowd?: number;
}

export interface CrowdTrendPoint {
  time: string;
  timestamp?: number;
  count: number;
  waiting?: number;
  status: CrowdStatus | string;
}

export interface TelemetryData {
  timestamp: number;
  time_str?: string;
  system_online: boolean;
  camera_connected: boolean;
  camera_status?: 'online' | 'offline' | string;
  detection_status?: 'active' | 'offline' | string;
  yolo_running: boolean;
  tracking_running: boolean;
  esp32_connected?: boolean;
  esp32_ip?: string;
  fps: number;

  // Real-time Crowd Analytics
  people_count?: number;
  people_detected: number;
  waiting_area_count: number;
  active_tracks: number;
  crowd_status?: CrowdStatus | string;
  peak_crowd?: number;
  avg_crowd?: number;
  people_entering?: number;
  people_leaving?: number;
  in_service_count?: number;
  other_area_estimated?: number;
  last_detection_timestamp?: number;
  last_detection_time_str?: string;
  chart_history?: CrowdTrendPoint[];

  // Digital Queue & Tokens
  current_token: string;
  next_token: string;
  tokens_waiting: number;
  tokens_completed?: number;
  average_service_time_seconds: number;
  average_service_display: string;
  is_measured_service_time: boolean;
  serving_token_id: string;
  serving_elapsed_str: string;
  serving_remaining_str: string;
  max_wait_minutes: number;
  arrival_rate: number;
  service_rate: number;
  queue_growth_rate: number;
  queue_trend: 'STABLE' | 'INCREASING' | 'RAPIDLY INCREASING' | 'DECREASING';
  congestion_level: CongestionLevel;
  prediction: string;
  alert_message: string;
  is_long_wait: boolean;

  // Recommendations & Alerts
  recommendation?: SystemRecommendation;

  // Arrays & Hardware
  waiting_queue: WaitingCustomer[];
  counters?: CounterInfo[];
  hardware_flags: HardwareFlags;
  hardware_status?: HardwareStatus;
  hardware_events?: HardwareEvent[];
  last_action: string;
  thresholds?: {
    normal_max: number;
    moderate_max: number;
  };
}

export interface AlertEvent {
  timestamp: number;
  level: CongestionLevel;
  message: string;
}

export interface PublicNowServing {
  token: string | null;
  counter: number | null;
}

export interface PublicNextToken {
  token: string;
  counter: number;
}

export interface PublicQueueData {
  nowServing: PublicNowServing | null;
  peopleWaiting: number;
  estimatedWaitMinutes: number;
  activeCounters: number;
  totalCounters: number;
  nextTokens: PublicNextToken[];
}

export interface SystemStatus {
  system_online: boolean;
  camera_connected: boolean;
  yolo_running: boolean;
  tracking_running: boolean;
  queue_engine_running: boolean;
  analytics_running: boolean;
  esp32_connected?: boolean;
  esp32_ip?: string;
  active_ws_clients: number;
  latest_fps: number;
  people_detected?: number;
  crowd_status?: string;
}

export interface ReportCounterPerformance {
  counter: number;
  name: string;
  customers_served: number;
  avg_service_time_seconds: number;
  avg_service_str: string;
}

export interface ReportSummaryResponse {
  branch: string;
  report_period: string;
  report_date: string;
  generated_at: string;
  queue_summary: {
    total_tokens: number;
    completed_tokens: number;
    skipped_tokens: number;
    average_service_time_seconds: number;
    average_service_time_str: string;
    average_waiting_time_minutes: number;
    peak_queue_length: number;
  };
  crowd_summary: {
    peak_crowd: number;
    avg_crowd: number;
    min_crowd: number;
    high_crowd_events: number;
    moderate_crowd_events: number;
  };
  camera_summary: {
    status: string;
    total_snapshots: number;
    detection_start: string;
    detection_end: string;
  };
  hardware_summary: {
    esp32_status: string;
    total_sensor_events: number;
    last_heartbeat: string;
  };
  counter_performance: ReportCounterPerformance[];
  timeline: Array<{
    timestamp: number;
    time_str: string;
    date: string;
    people_count: number;
    waiting_count: number;
    crowd_status: string;
  }>;
}
