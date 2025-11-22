# 🌱 NutriSoil IoT

**Plataforma de Agricultura de Precisión con Backend en Django, Frontend en React y Servicios de Supabase.**

## 📄 Resumen del Proyecto

NutriSoil IoT es una aplicación web full-stack diseñada para optimizar la fertilización de suelos en la Región de Los Lagos, Chile. La plataforma centraliza el monitoreo de la salud del suelo, integra datos de dispositivos IoT (Wemos/ESP32) y genera recomendaciones agronómicas precisas.

---

## 🚀 Características Principales

*   **Autenticación Híbrida:** Gestión de usuarios con Supabase Auth y validación de tokens JWT en Django.
*   **Gestión de Predios y Usuarios:**
    *   CRUD completo de predios.
    *   Perfil de usuario con validación de RUT chileno.
    *   Roles de usuario (Admin/Usuario) con permisos diferenciados.
*   **Monitoreo y Mediciones:**
    *   Ingreso manual de mediciones (pH, Temperatura, Humedad, NPK) con validación de rangos en tiempo real.
    *   **Ingesta IoT:** Endpoint dedicado para recibir datos de humedad desde dispositivos Wemos D1 Mini / ESP32.
    *   Visualización de promedios semanales y tendencias.
*   **Motor de Recomendaciones:**
    *   Algoritmo agronómico en el backend que calcula la fertilización necesaria (Urea, Superfosfato Triple, Cloruro de Potasio).
    *   Manejo de datos parciales (NULLs) para sensores que no miden todos los parámetros.
*   **Dashboard Interactivo:** Gráficos (Recharts) y KPIs para la toma de decisiones.

---

## 🏗️ Arquitectura

*   **Frontend (React + Bootstrap):** Interfaz de usuario moderna con Bootstrap. Se comunica con Supabase para Auth y con Django para datos.
*   **Backend (Django REST Framework):** API central. Maneja la lógica de negocio, validaciones, motor de cálculo y conexión a la BD.
*   **Base de Datos (PostgreSQL en Supabase):** Almacenamiento persistente.
*   **IoT (C++ / Arduino):** Firmware para dispositivos Wemos que envían datos vía HTTP POST.

---

## 🛠️ Configuración y Puesta en Marcha

### Prerrequisitos
*   Python 3.10+
*   Node.js 18+
*   Cuenta en Supabase

### 1. Backend (Django)

```bash
cd backend
# Crear entorno virtual
python -m venv venv
# Activar entorno (Windows)
.\venv\Scripts\activate
# Instalar dependencias
pip install -r requirements.txt
```

**Configuración .env (`backend/.env`):**
```env
DEBUG=True
SECRET_KEY=tu_secret_key_django
# Puedes crear una secret key con el comando: python python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_JWT_SECRET=tu_jwt_secret
SUPABASE_SERVICE_KEY=tu_service_key
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_db_password
DB_HOST=db.tu-proyecto.supabase.co
DB_PORT=tu_puerto
```

**Ejecutar:**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 2. Frontend (React)

```bash
cd frontend
npm install
```

**Configuración .env (`frontend/.env`):**
```env
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_anon_key
```

**Ejecutar:**
```bash
npm start
```

### 3. IoT (Wemos/ESP32)

1.  Abrir `docs/wemos_example.ino` en Arduino IDE.
2.  Instalar librerías necesarias (`ESP8266WiFi` o `WiFi`, `HTTPClient`).
3.  Configurar SSID, Password y la IP de tu servidor backend.
4.  Cargar en el dispositivo.

---

## 🔒 Seguridad

*   **Backend:** Django valida el JWT de Supabase en cada petición protegida.
*   **IoT:** Endpoint protegido por token de dispositivo (`NUTRISOIL_IOT_SECRET_2024` para prototipo).
*   **Datos:** Validación estricta de tipos y rangos en frontend y backend.

---

## 👥 Contribución

1.  Proximammente...