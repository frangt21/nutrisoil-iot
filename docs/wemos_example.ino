/*
 * Wemos D1 Mini / ESP32 Example for NutriSoil IoT
 * 
 * Este código conecta el dispositivo a WiFi y envía datos de humedad
 * al backend de NutriSoil.
 * 
 * Requisitos:
 * - Librería ESP8266WiFi (si usas Wemos D1 Mini) o WiFi (si usas ESP32)
 * - Librería ESP8266HTTPClient (Wemos) o HTTPClient (ESP32)
 */

#if defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
#elif defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
#endif

// --- CONFIGURACIÓN ---
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// URL del backend (ajusta la IP a la de tu servidor Django)
// Si pruebas localmente, usa la IP de tu PC, no localhost
const char* serverUrl = "http://192.168.1.100:8000/api/iot/wemos/ingest/";

// Token de seguridad (debe coincidir con el backend)
const char* deviceToken = "token_super_secreto";

// ID del Predio al que pertenece este dispositivo (debe existir en la BD)
const int predioId = 1; 

// Pin del sensor (ejemplo analógico)
const int sensorPin = A0; 

void setup() {
  Serial.begin(115200);
  delay(1000);

  WiFi.begin(ssid, password);
  Serial.println("Conectando a WiFi...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nConectado a WiFi!");
}

void loop() {
  // 1. Leer sensor (Simulado o Real)
  // int rawValue = analogRead(sensorPin);
  // float humedad = map(rawValue, 1024, 0, 0, 100); // Ejemplo de mapeo
  float humedad = 45.5; // Valor simulado para prueba

  // 2. Enviar datos
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    Serial.print("Enviando datos a: ");
    Serial.println(serverUrl);

    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Crear JSON manual
    String jsonPayload = "{";
    jsonPayload += "\"token\": \"" + String(deviceToken) + "\",";
    jsonPayload += "\"predio_id\": " + String(predioId) + ",";
    jsonPayload += "\"humedad\": " + String(humedad);
    // jsonPayload += ",\"temperatura\": 25.0"; // Opcional
    // jsonPayload += ",\"ph\": 6.5"; // Opcional
    jsonPayload += "}";

    Serial.println("Payload: " + jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Código HTTP: " + String(httpResponseCode));
      Serial.println("Respuesta: " + response);
    } else {
      Serial.print("Error enviando POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi desconectado");
  }

  // Esperar 1 minuto antes de la siguiente lectura
  delay(60000);
}
