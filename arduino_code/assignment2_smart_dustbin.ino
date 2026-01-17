#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>
#include <DHT.h>

// --- CONFIGURATION ---
const char* ssid = "cslab";
const char* password = "aksesg31";
const char* mqtt_server = "34.134.235.249";

// --- PINS ---
#define IR_PIN 13
#define TRIG_PIN 5
#define ECHO_PIN 18
#define SERVO_PIN 14
#define LED_GREEN 26
#define LED_RED 27

#define DHTPIN 4        // DHT22 data pin
#define DHTTYPE DHT22   // DHT 22

WiFiClient espClient;
PubSubClient client(espClient);
Servo lidServo;
DHT dht(DHTPIN, DHTTYPE);

bool motionDetected = false;
bool lidOpen = false;
unsigned long lidOpenTime = 0;
const unsigned long LID_OPEN_DURATION = 3000; // 3 seconds

long lastMsg = 0;
const int BIN_HEIGHT = 20;

void setup() {
  Serial.begin(115200);

  // Hardware Setup
  pinMode(IR_PIN, INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  lidServo.setPeriodHertz(50);
  lidServo.attach(SERVO_PIN, 500, 2400);
  lidServo.write(0);

  // Start DHT
  dht.begin();

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi Connected");

  // Setup MQTT
  client.setServer(mqtt_server, 1883);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // --- 1. REAL-TIME MOTION DETECTION ---
  if (digitalRead(IR_PIN) == LOW) {
    motionDetected = true;

    if (!lidOpen) {
      lidServo.write(90);
      lidOpen = true;
      lidOpenTime = millis();
    }
  } else {
    motionDetected = false;
  }

  // Close lid after 3 seconds (non-blocking)
  if (lidOpen && millis() - lidOpenTime >= LID_OPEN_DURATION) {
    lidServo.write(0);
    lidOpen = false;
  }

  // --- 2. UPLOAD LOGIC (Every 1 sec) ---
  long now = millis();
  if (now - lastMsg > 1000) {
    lastMsg = now;

    // Measure Distance
    digitalWrite(TRIG_PIN, LOW); 
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH); 
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH);
    int distance = duration * 0.034 / 2;
    int fill = map(distance, BIN_HEIGHT, 0, 0, 100);
    fill = constrain(fill, 0, 100);

    // LEDs
    if (fill < 80) {
      digitalWrite(LED_GREEN, HIGH);
      digitalWrite(LED_RED, LOW);
    } else {
      digitalWrite(LED_GREEN, LOW);
      digitalWrite(LED_RED, HIGH);
    }

    // Read DHT22
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); // Celsius

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // MQTT JSON payload
    String payload = "{";
    payload += "\"level\": " + String(fill) + ",";
    payload += "\"motion\": " + String(motionDetected ? "true" : "false") + ",";
    payload += "\"temperature\": " + String(temperature, 1) + ",";
    payload += "\"humidity\": " + String(humidity, 1);
    payload += "}";

    Serial.print("Publishing: ");
    Serial.println(payload);

    client.publish("bin/data", payload.c_str());
  }
}
