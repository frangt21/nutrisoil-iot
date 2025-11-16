# PASO 17: Incluir URLs de la API en el proyecto principal
# Archivo: backend/nutrisoil_project/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # ← Agregar esta línea
]