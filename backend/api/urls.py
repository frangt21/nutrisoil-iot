# backend/api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'predios', views.PredioViewSet, basename='predio')
router.register(r'mediciones', views.MedicionViewSet, basename='medicion')

urlpatterns = [
    # Router automático
    path('', include(router.urls)),
    
    # Autenticación
    path('auth/login/', views.login_view, name='login'),
    
    # Wemos IoT
    path('wemos/datos/', views.recibir_datos_wemos, name='wemos-datos'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # 🆕 NUEVO: Recomendación por semana
    path('recomendaciones/generar-por-semana/', 
         views.generar_recomendacion_semanal, 
         name='generar-recomendacion-semanal'),
]