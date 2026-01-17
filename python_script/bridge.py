import json
import paho.mqtt.client as mqtt
from pymongo import MongoClient
from datetime import datetime
from urllib.parse import quote_plus
import certifi  # <--- NEW IMPORT

# --- CONFIGURATION ---
username = quote_plus("") 
# CHANGE 'pass' IF NEEDED
password = quote_plus("") 

cluster_url = "smartbin.fop4q2q.mongodb.net"
MONGO_URI = f"mongodb+srv://{username}:{password}@{cluster_url}/?appName=SmartBin&retryWrites=true&w=majority"

MQTT_TOPIC = "bin/data"

# --- SETUP MONGODB ---
try:
    print("Connecting to MongoDB Atlas...")
    
    # FIX: We explicitly tell Mongo to use the 'certifi' certificates
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    
    db = client['smart_bin_db']
    collection = db['readings']
    
    # Test connection
    client.admin.command('ping')
    print("SUCCESS: Connected to MongoDB Atlas!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")

# --- MQTT CALLBACKS ---
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"SUCCESS: Connected to Local MQTT Broker!")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"Failed to connect to MQTT. Error Code: {rc}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode("utf-8")
        print(f"Received: {payload}")
        
        data = json.loads(payload)
        data['timestamp'] = datetime.now()
        
        # Save to Mongo
        result = collection.insert_one(data)
        print(f"Saved to MongoDB with ID: {result.insertedId}")
        
    except Exception as e:
        print(f"Error processing message: {e}")

# --- MAIN LOOP ---
# FIX: Updated to VERSION2 to remove the DeprecationWarning
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

try:
    mqtt_client.connect("localhost", 1883, 60)
    print("Bridge Service Started. Waiting for ESP32 data...")
    mqtt_client.loop_forever()
except ConnectionRefusedError:
    print("Error: Mosquitto broker is not running. Run: sudo systemctl start mosquitto")