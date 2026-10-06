export type CongestionLevel = 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';

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

export interface CounterInfo {
  counter: number;
  name: string;
  officer: string;
  services: string[];
  active: boolean;
  waiting_count: number;
  current_serving: string | null;
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

export interface TelemetryData {
  timestamp: number;
  system_online: boolean;
  camera_connected: boolean;
  yolo_running: boolean;
  tracking_running: boolean;
  esp32_connected?: boolean;
  esp32_ip?: string;
  fps: number;
  people_detected: number;
  waiting_area_count: number;
  active_tracks: number;
  current_token: string;
  next_token: string;
  tokens_waiting: number;
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
  waiting_queue: WaitingCustomer[];
  counters?: CounterInfo[];
  hardware_flags: HardwareFlags;
  last_action: string;
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
  active_ws_clients: number;
  latest_fps: number;
}

