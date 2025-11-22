# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import views_admin
from . import views_recomendacion
from .views_profile import ProfileViewSet

# El router de DRF se encarga de generar las URLs para los ViewSets
router = DefaultRouter()
router.register(r'predios', views.PredioViewSet, basename='predio')
router.register(r'mediciones', views.MedicionViewSet, basename='medicion')
router.register(r'admin/users', views_admin.AdminUserViewSet, basename='admin-users')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'recomendaciones', views_recomendacion.RecomendacionViewSet, basename='recomendacion')

# Aquí definimos las URLs para nuestras vistas basadas en funciones
urlpatterns = [
    # 1. Incluye todas las URLs generadas por el router
    #    Esto crea automáticamente:
    #    - /api/predios/ (GET, POST)
    #    - /api/predios/<id>/ (GET, PUT, DELETE)
    #    - /api/mediciones/ (GET, POST)
    #    - /api/mediciones/<id>/ (GET, PUT, DELETE)
    #    - /api/mediciones/promedios-semanales/ (la @action personalizada)
    path('', include(router.urls)),
    
    # 2. URLs para las vistas basadas en funciones que quedan
    
    # URL para las estadísticas del Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),

    # URL para ingesta de datos IoT (Wemos)
    path('iot/wemos/ingest/', views.recibir_datos_wemos, name='wemos-ingest'),
]