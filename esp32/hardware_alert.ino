/*
 * ==============================================================================
 * PS 37 — Adaptive Queue Prediction and Crowd Alert System
 * Phase 8: ESP32 Physical Hardware Alert Firmware
 * ==============================================================================
 * 
 * Target Board: ESP32 Dev Module / NodeMCU-32S
 * Communication: HTTP REST over Local Wi-Fi (Port 80)
 * 
 * Hardware Wiring:
 *   - GREEN LED  -> GPIO 25 (via 220Ω resistor to GND) [NORMAL Level]
 *   - YELLOW LED -> GPIO 26 (via 220Ω resistor to GND) [MODERATE Level]
 *   - ORANGE LED -> GPIO 27 (via 220Ω resistor to GND) [HIGH Level]
 *   - RED LED    -> GPIO 14 (via 220Ω resistor to GND) [CRITICAL Level]
 *   - BUZZER     -> GPIO 13 (Active/Passive Buzzer (+) to GPIO 13, (-) to GND)
 * 
 * Endpoints:
 *   - POST /hardware/status : Updates LED & Buzzer states from Python
 *   - GET  /hardware/status : Returns current hardware status
 *   - GET  /health          : Heartbeat check
 * ==============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>

// ==============================================================================
// 1. Wi-Fi Configuration (Update with your local Wi-Fi credentials)
// ==============================================================================
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ==============================================================================
// 2. GPIO Pin Mappings
// ==============================================================================
const int PIN_LED_GREEN  = 25;
const int PIN_LED_YELLOW = 26;
const int PIN_LED_ORANGE = 27;
const int PIN_LED_RED    = 14;
const int PIN_BUZZER     = 13;

// Web server on standard HTTP port 80
WebServer server(80);

// ==============================================================================
// 3. Current Hardware State Variables
// ==============================================================================
String currentLevel = "NORMAL";
bool stateLedGreen  = true;
bool stateLedYellow = false;
bool stateLedOrange = false;
bool stateLedRed    = false;
bool stateBuzzer    = false;

// Intermittent buzzer timing (300ms ON, 700ms OFF)
unsigned long previousBuzzerMillis = 0;
bool buzzerBeepState = false;
const unsigned long BUZZER_ON_TIME  = 300;
const unsigned long BUZZER_OFF_TIME = 700;

// ==============================================================================
// 4. Hardware Pin Update Routine
// ==============================================================================
void applyHardwareOutputs() {
  digitalWrite(PIN_LED_GREEN,  stateLedGreen  ? HIGH : LOW);
  digitalWrite(PIN_LED_YELLOW, stateLedYellow ? HIGH : LOW);
  digitalWrite(PIN_LED_ORANGE, stateLedOrange ? HIGH : LOW);
  digitalWrite(PIN_LED_RED,    stateLedRed    ? HIGH : LOW);

  if (!stateBuzzer) {
    digitalWrite(PIN_BUZZER, LOW);
    buzzerBeepState = false;
  }
}

// ==============================================================================
// 5. REST Endpoint Handlers
// ==============================================================================

// Handler: GET /health
void handleHealth() {
  String response = "{\"status\":\"online\",\"board\":\"ESP32\",\"uptime_ms\":" + String(millis()) + "}";
  server.send(200, "application/json", response);
}

// Handler: GET /hardware/status
void handleGetStatus() {
  String json = "{";
  json += "\"level\":\"" + currentLevel + "\",";
  json += "\"led_green\":" + String(stateLedGreen ? "true" : "false") + ",";
  json += "\"led_yellow\":" + String(stateLedYellow ? "true" : "false") + ",";
  json += "\"led_orange\":" + String(stateLedOrange ? "true" : "false") + ",";
  json += "\"led_red\":" + String(stateLedRed ? "true" : "false") + ",";
  json += "\"buzzer\":" + String(stateBuzzer ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

// Handler: POST /hardware/status
void handlePostStatus() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"Missing request body\"}");
    return;
  }

  String body = server.arg("plain");
  Serial.println("[HTTP] Received Hardware Payload: " + body);

  // Lightweight robust JSON field parsing
  if (body.indexOf("\"level\":\"CRITICAL\"") >= 0 || body.indexOf("'level': 'CRITICAL'") >= 0) {
    currentLevel = "CRITICAL";
    stateLedGreen  = false;
    stateLedYellow = false;
    stateLedOrange = false;
    stateLedRed    = true;
    stateBuzzer    = true;
  } else if (body.indexOf("\"level\":\"HIGH\"") >= 0 || body.indexOf("'level': 'HIGH'") >= 0) {
    currentLevel = "HIGH";
    stateLedGreen  = false;
    stateLedYellow = false;
    stateLedOrange = true;
    stateLedRed    = false;
    stateBuzzer    = false;
  } else if (body.indexOf("\"level\":\"MODERATE\"") >= 0 || body.indexOf("'level': 'MODERATE'") >= 0) {
    currentLevel = "MODERATE";
    stateLedGreen  = false;
    stateLedYellow = true;
    stateLedOrange = false;
    stateLedRed    = false;
    stateBuzzer    = false;
  } else {
    currentLevel = "NORMAL";
    stateLedGreen  = true;
    stateLedYellow = false;
    stateLedOrange = false;
    stateLedRed    = false;
    stateBuzzer    = false;
  }

  // Explicit buzzer override if present in JSON
  if (body.indexOf("\"buzzer\":true") >= 0 || body.indexOf("\"buzzer\": true") >= 0) {
    stateBuzzer = true;
  } else if (body.indexOf("\"buzzer\":false") >= 0 || body.indexOf("\"buzzer\": false") >= 0) {
    if (currentLevel != "CRITICAL") {
      stateBuzzer = false;
    }
  }

  applyHardwareOutputs();
  server.send(200, "application/json", "{\"status\":\"ok\",\"applied_level\":\"" + currentLevel + "\"}");
}

// ==============================================================================
// 6. Setup Routine
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n==============================================");
  Serial.println("  PS 37 Queue Alert Hardware (ESP32)");
  Serial.println("==============================================");

  // Initialize GPIO Pins
  pinMode(PIN_LED_GREEN,  OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_ORANGE, OUTPUT);
  pinMode(PIN_LED_RED,    OUTPUT);
  pinMode(PIN_BUZZER,     OUTPUT);

  // Power-on self test (Flash all LEDs sequentially)
  digitalWrite(PIN_LED_GREEN, HIGH);  delay(150); digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_YELLOW, HIGH); delay(150); digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_ORANGE, HIGH); delay(150); digitalWrite(PIN_LED_ORANGE, LOW);
  digitalWrite(PIN_LED_RED, HIGH);    delay(150); digitalWrite(PIN_LED_RED, LOW);

  // Connect to Local Wi-Fi
  Serial.print("[WIFI] Connecting to: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.print("[WIFI] Assigned ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.println("[WIFI] Set this IP in config.py under ESP32_IP.");
    
    // Normal state on startup
    stateLedGreen = true;
    applyHardwareOutputs();
  } else {
    Serial.println("\n[WIFI] Connection failed. Check SSID/Password.");
  }

  // Register HTTP Routes
  server.on("/health", HTTP_GET, handleHealth);
  server.on("/hardware/status", HTTP_GET, handleGetStatus);
  server.on("/hardware/status", HTTP_POST, handlePostStatus);

  server.begin();
  Serial.println("[HTTP] REST Server listening on port 80");
}

// ==============================================================================
// 7. Main Loop (Non-blocking buzzer pulsing & HTTP serving)
// ==============================================================================
void loop() {
  server.handleClient();

  // Non-blocking intermittent buzzer pulsing for CRITICAL level
  if (stateBuzzer) {
    unsigned long currentMillis = millis();
    unsigned long interval = buzzerBeepState ? BUZZER_ON_TIME : BUZZER_OFF_TIME;

    if (currentMillis - previousBuzzerMillis >= interval) {
      previousBuzzerMillis = currentMillis;
      buzzerBeepState = !buzzerBeepState;
      digitalWrite(PIN_BUZZER, buzzerBeepState ? HIGH : LOW);
    }
  }
}
