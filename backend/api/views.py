# backend/api/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Avg
from datetime import timedelta, datetime
from collections import defaultdict

from .models import Predio, Medicion, Recomendacion
from .serializers import (
    PredioSerializer, MedicionSerializer, MedicionCreateSerializer,
    RecomendacionSerializer, PromedioSemanalSerializer,
    GenerarRecomendacionSemanalSerializer
)
from calculadora.motor_calculo import MotorFertilizacion

# Ya no se importan las utilidades de autenticación manual,
# DRF lo gestiona a través de la clase en 'api/authentication.py'


# ═══════════════════════════════════════════════════════
# PREDIOS (Refactorizado para usar la autenticación de DRF)
# ═══════════════════════════════════════════════════════

class PredioViewSet(viewsets.ModelViewSet):
    serializer_class = PredioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Usamos `getattr` para obtener `request.profile` de forma segura
        profile = getattr(self.request, 'profile', None)
        if profile:
            # ¡SOLUCIÓN! Filtramos por el objeto Profile, no por el User.
            return Predio.objects.filter(usuario=profile)
        return Predio.objects.none()

    def perform_create(self, serializer):
        profile = getattr(self.request, 'profile', None)
        if profile:
            # ¡SOLUCIÓN! Guardamos usando el objeto Profile.
            serializer.save(usuario=profile)


# ═══════════════════════════════════════════════════════
# MEDICIONES (Refactorizado para usar la autenticación de DRF)
# ═══════════════════════════════════════════════════════

from .filters import MedicionFilter
from .pagination import StandardResultsSetPagination


class MedicionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filterset_class = MedicionFilter

    def get_serializer_class(self):
        if self.action == 'create':
            return MedicionCreateSerializer
        return MedicionSerializer

    def get_queryset(self):
        """
        Filtra las mediciones para que un usuario solo vea
        aquellas que pertenecen a SUS propios predios.
        El filtrado por predio y fecha ahora lo maneja DjangoFilter.
        """
        profile = getattr(self.request, 'profile', None)
        if not profile:
            return Medicion.objects.none()
        
        return Medicion.objects.filter(predio__usuario=profile).select_related('predio').order_by('-fecha')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Asegurar que el predio pertenezca al usuario antes de guardar
        predio_id = request.data.get('predio')
        if not Predio.objects.filter(id=predio_id, usuario=request.user.profile).exists():
             # Nota: request.user.profile asume que el usuario tiene perfil, 
             # lo cual debería ser cierto si pasó la autenticación y el middleware.
             # Pero para ser consistentes con get_queryset, podríamos usar getattr(request, 'profile', None)
             # Sin embargo, filter(usuario=request.user.profile) es lo que se espera si el modelo Predio apunta a Profile.
             # Si el modelo Predio apuntara a User, sería filter(usuario=request.user).
             # Dado el error anterior "Predio.usuario must be a Profile instance", sabemos que apunta a Profile.
            return Response({'error': 'Predio no válido o no pertenece al usuario'}, status=status.HTTP_403_FORBIDDEN)
        
        medicion = serializer.save()
        
        if all([medicion.nitrogeno, medicion.fosforo, medicion.potasio]):
            try:
                self._calcular_y_guardar_recomendacion(medicion)
            except Exception as e:
                print(f"Error al calcular recomendación: {e}")
        
        output_serializer = MedicionSerializer(medicion)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='promedios-semanales')
    def promedios_semanales(self, request):
        predio_id = request.query_params.get('predio')
        if not predio_id:
            return Response({'error': 'Debe especificar el parámetro ?predio=X'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Ajuste aquí también para usar profile si es necesario, 
            # pero Predio.usuario es un Profile. request.user es un User.
            # Django hace la magia si la relación es User, pero si es Profile, necesitamos el profile.
            profile = getattr(request, 'profile', None)
            if not profile:
                 return Response({'error': 'Usuario sin perfil'}, status=status.HTTP_403_FORBIDDEN)
            predio = Predio.objects.get(id=predio_id, usuario=profile)
        except Predio.DoesNotExist:
            return Response({'error': 'Predio no encontrado o no tiene permiso'}, status=status.HTTP_404_NOT_FOUND)

        mediciones = Medicion.objects.filter(predio=predio).order_by('fecha')
        if not mediciones.exists():
            return Response([])

        grupos_semanales = defaultdict(list)
        for medicion in mediciones:
            semana_inicio = medicion.get_semana_inicio()
            grupos_semanales[semana_inicio].append(medicion)

        resultados = []
        for semana_inicio, mediciones_semana in sorted(grupos_semanales.items(), reverse=True):
            promedios = {
                'semana_inicio': semana_inicio,
                'predio_id': predio.id,
                'predio_nombre': predio.nombre,
                'cantidad_mediciones': len(mediciones_semana),
                'fecha_primera': min(m.fecha for m in mediciones_semana),
                'fecha_ultima': max(m.fecha for m in mediciones_semana),
            }
            for campo in ['ph', 'temperatura', 'humedad', 'nitrogeno', 'fosforo', 'potasio']:
                valores = [getattr(m, campo) for m in mediciones_semana if getattr(m, campo) is not None]
                promedios[f'{campo}_promedio'] = round(sum(float(v) for v in valores) / len(valores), 2) if valores else None
            resultados.append(promedios)
            
        serializer = PromedioSemanalSerializer(resultados, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='generar-recomendacion')
    def generar_recomendacion(self, request, pk=None):
        """
        Genera o actualiza una recomendación para una medición específica.
        """
        try:
            medicion = self.get_object()
        except Medicion.DoesNotExist:
            return Response({'error': 'Medición no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if not all([medicion.nitrogeno, medicion.fosforo, medicion.potasio]):
            return Response(
                {'error': 'La medición debe tener valores de N, P y K.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recomendacion = self._calcular_y_guardar_recomendacion(medicion)
            serializer = RecomendacionSerializer(recomendacion)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'Error al generar recomendación: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _calcular_y_guardar_recomendacion(self, medicion):
        predio = medicion.predio
        calculos = MotorFertilizacion.calcular_recomendacion_completa(medicion, predio)
        
        recomendacion, created = Recomendacion.objects.update_or_create(
            medicion=medicion,
            defaults={
                'predio': predio,
                'semana_inicio': medicion.get_semana_inicio(),
                'ph_promedio': medicion.ph,
                'temp_promedio': medicion.temperatura,
                'humedad_promedio': medicion.humedad,
                'n_promedio': medicion.nitrogeno,
                'p_promedio': medicion.fosforo,
                'k_promedio': medicion.potasio,
                **calculos
            }
        )
        return recomendacion


# ═══════════════════════════════════════════════════════
# VISTAS BASADAS EN FUNCIONES (Refactorizadas)
# ═══════════════════════════════════════════════════════

@api_view(['POST'])
def generar_recomendacion_semanal(request):
    serializer = GenerarRecomendacionSemanalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    predio_id = serializer.validated_data['predio_id']
    semana_inicio = serializer.validated_data['semana_inicio']

    try:
        profile = getattr(request, 'profile', None)
        if not profile:
             return Response({'error': 'Usuario sin perfil'}, status=status.HTTP_403_FORBIDDEN)
        predio = Predio.objects.get(id=predio_id, usuario=profile)
    except Predio.DoesNotExist:
        return Response({'error': 'Predio no encontrado o no tiene permiso'}, status=status.HTTP_404_NOT_FOUND)

    semana_fin = semana_inicio + timedelta(days=6)
    mediciones_semana = Medicion.objects.filter(
        predio=predio, fecha__date__gte=semana_inicio, fecha__date__lte=semana_fin
    )
    if not mediciones_semana.exists():
        return Response({'error': 'No hay mediciones para esa semana'}, status=status.HTTP_404_NOT_FOUND)

    promedios = mediciones_semana.aggregate(
        ph=Avg('ph'), temperatura=Avg('temperatura'), humedad=Avg('humedad'),
        nitrogeno=Avg('nitrogeno'), fosforo=Avg('fosforo'), potasio=Avg('potasio')
    )
    if not all([promedios['nitrogeno'], promedios['fosforo'], promedios['potasio']]):
        return Response({'error': 'Faltan datos de NPK en las mediciones de esta semana'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Usamos un objeto simple (como un dict) para pasar al motor de cálculo
    medicion_promedio_dict = {
        'ph': promedios['ph'], 'temperatura': promedios['temperatura'], 'humedad': promedios['humedad'],
        'nitrogeno': promedios['nitrogeno'], 'fosforo': promedios['fosforo'], 'potasio': promedios['potasio']
    }
    
    resultado = MotorFertilizacion.calcular_recomendacion_completa(medicion_promedio_dict, predio)
    
    recomendacion, created = Recomendacion.objects.update_or_create(
        predio=predio, semana_inicio=semana_inicio, defaults={**resultado, **promedios}
    )
    
    serializer_response = RecomendacionSerializer(recomendacion)
    return Response(serializer_response.data, status=status.HTTP_201_CREATED)


from .utils import generar_alertas


@api_view(['GET'])
def dashboard_stats(request):
    profile = getattr(request, 'profile', None)
    if not profile:
        return Response({
            'total_predios': 0, 'total_superficie': 0, 'total_mediciones': 0,
            'ultima_medicion': None, 'tendencia_npk': [],
            'comparativa_predios': [], 'alertas': []
        })

    predios = Predio.objects.filter(usuario=profile)
    mediciones_usuario = Medicion.objects.filter(predio__usuario=profile).order_by('-fecha')

    # --- KPIs Generales ---
    total_predios = predios.count()
    total_superficie = sum(p.superficie for p in predios if p.superficie is not None)
    total_mediciones = mediciones_usuario.count()
    ultima_medicion = mediciones_usuario.first()

    # --- Datos para Gráfico de Tendencia (últimos 30 días) ---
    fecha_hace_30_dias = datetime.now() - timedelta(days=30)
    tendencia_npk = mediciones_usuario.filter(fecha__gte=fecha_hace_30_dias).order_by('fecha')
    
    # --- Datos para Gráfico de Comparativa y Alertas ---
    comparativa_predios = []
    alertas = []

    for predio in predios:
        ultima_medicion_predio = Medicion.objects.filter(predio=predio).order_by('-fecha').first()
        if ultima_medicion_predio:
            # Para la comparativa, añadimos todos los nutrientes
            comparativa_predios.append({
                'name': predio.nombre,
                'nitrogeno': ultima_medicion_predio.nitrogeno,
                'fosforo': ultima_medicion_predio.fosforo,
                'potasio': ultima_medicion_predio.potasio
            })
            # Para las alertas
            alertas_predio = generar_alertas(ultima_medicion_predio)
            # Añadir contexto a las alertas
            for alerta in alertas_predio:
                alerta['mensaje'] = f"En {predio.nombre}: {alerta['mensaje']}"
            alertas.extend(alertas_predio)

    return Response({
        'total_predios': total_predios,
        'total_superficie': float(total_superficie),
        'total_mediciones': total_mediciones,
        'ultima_medicion_kpis': MedicionSerializer(ultima_medicion).data if ultima_medicion else None,
        'tendencia_npk': MedicionSerializer(tendencia_npk, many=True).data,
        'comparativa_predios': comparativa_predios,
        'alertas': alertas,
    })


# NOTA SOBRE WEMOS: Esta vista ahora debería tener su propia autenticación,
# por ejemplo, basada en una API Key, ya que no tendrá un token de usuario.
# La dejaremos comentada por ahora, ya que requiere un mecanismo diferente.
#
#     ...
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def recibir_datos_wemos(request):
    """
    Endpoint para recibir datos desde el dispositivo Wemos/ESP32.
    Autenticación simple por token en el header o body.
    """
    # 1. Validación de Seguridad Simple
    device_token = request.data.get('token') or request.headers.get('X-Device-Token')
    if device_token != 'NUTRISOIL_IOT_SECRET_2024': # Hardcoded por ahora para prototipo
        return Response({'error': 'Token de dispositivo inválido'}, status=status.HTTP_403_FORBIDDEN)

    # 2. Extraer datos
    predio_id = request.data.get('predio_id')
    humedad = request.data.get('humedad')
    
    # Wemos podría enviar otros datos en el futuro
    temperatura = request.data.get('temperatura') 
    ph = request.data.get('ph')

    if not predio_id:
        return Response({'error': 'Falta predio_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    if humedad is None:
        return Response({'error': 'Falta dato de humedad'}, status=status.HTTP_400_BAD_REQUEST)

    # 3. Validar Predio
    try:
        predio = Predio.objects.get(id=predio_id)
    except Predio.DoesNotExist:
        return Response({'error': 'Predio no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    # 4. Crear Medición
    try:
        medicion = Medicion.objects.create(
            predio=predio,
            humedad=humedad,
            temperatura=temperatura, # Puede ser None
            ph=ph, # Puede ser None
            origen='wemos'
        )
        return Response({'status': 'success', 'id': medicion.id}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)