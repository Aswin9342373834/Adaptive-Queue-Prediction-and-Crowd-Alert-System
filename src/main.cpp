#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Screen dimensions in pixels
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
// -1 means sharing Arduino reset pin / no dedicated reset pin
#define OLED_RESET -1        
#define SCREEN_ADDRESS 0x3C  // Default I2C address for 128x64 OLEDs (0x3C or 0x3D)

// Standard ESP32 I2C Pins
#define I2C_SDA 21
#define I2C_SCL 22

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println(F("\n--- ESP32 OLED Display Startup ---"));

  // 1. Initialize I2C communication on GPIO 21 (SDA) and GPIO 22 (SCL)
  Wire.begin(I2C_SDA, I2C_SCL);

  // 2. Initialize OLED with internal charge pump voltage
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("[WARN] SSD1306 not found at 0x3C. Trying alternate address 0x3D..."));
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
      Serial.println(F("[ERROR] SSD1306 allocation failed. Check wiring (SDA=21, SCL=22, VCC, GND)."));
      while (true) {
        delay(1000);
      }
    }
  }

  Serial.println(F("[INFO] SSD1306 OLED initialized successfully!"));

  // 3. Clear display buffer
  display.clearDisplay();

  // 4. Configure text styling
  display.setTextSize(2);               // 2X scale typography
  display.setTextColor(SSD1306_WHITE);  // Solid white text color

  // 5. First line: "WELCOME"
  display.setCursor(22, 14);
  display.println(F("WELCOME"));

  // 6. Second line: "ASWIN" below it
  display.setCursor(34, 38);
  display.println(F("ASWIN"));

  // 7. Render display buffer to the physical OLED screen
  display.display();
}

void loop() {
  // Static welcome screen — no repetitive action required
  delay(1000);
}
