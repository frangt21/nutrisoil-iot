# backend/api/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Min, Max, Q
from datetime import datetime, timedelta
from collections import defaultdict

from .models import Predio, Medicion, Recomendacion
from .serializers import (
    PredioSerializer, MedicionSerializer, MedicionCreateSerializer,
    RecomendacionSerializer, UserSerializer,
    PromedioSemanalSerializer, GenerarRecomendacionSemanalSerializer
)
from calculadora.motor_calculo import MotorFertilizacion


# ═══════════════════════════════════════════════════════
# AUTENTICACIÓN (sin cambios)
# ═══════════════════════════════════════════════════════

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        return Response({
            'token': f'mock-token-{user.id}',
            'user': UserSerializer(user).data
        })
    else:
        return Response(
            {'error': 'Credenciales inválidas'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )


# ═══════════════════════════════════════════════════════
# PREDIOS (sin cambios, ya soporta agrupación por zona)
# ═══════════════════════════════════════════════════════

class PredioViewSet(viewsets.ModelViewSet):
    queryset = Predio.objects.all()
    serializer_class = PredioSerializer
    
    def get_queryset(self):
        """Opcional: filtrar por zona"""
        queryset = Predio.objects.all().order_by('zona', 'nombre')
        
        zona = self.request.query_params.get('zona', None)
        if zona:
            queryset = queryset.filter(zona=zona)
        
        return queryset
    
    def perform_create(self, serializer):
        usuario = User.objects.first()
        serializer.save(usuario=usuario)


# ═══════════════════════════════════════════════════════
# 🆕 MEDICIONES - Con soporte para promedios semanales
# ═══════════════════════════════════════════════════════

class MedicionViewSet(viewsets.ModelViewSet):
    queryset = Medicion.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MedicionCreateSerializer
        return MedicionSerializer
    
    def get_queryset(self):
        queryset = Medicion.objects.all().select_related('predio')
        
        # Filtro por predio (CRÍTICO para tu frontend)
        predio_id = self.request.query_params.get('predio', None)
        if predio_id:
            queryset = queryset.filter(predio_id=predio_id)
        
        # Filtros opcionales para reportes
        zona = self.request.query_params.get('zona', None)
        if zona:
            queryset = queryset.filter(predio__zona=zona)
        
        fecha_inicio = self.request.query_params.get('fecha_inicio', None)
        if fecha_inicio:
            queryset = queryset.filter(fecha__gte=fecha_inicio)
        
        fecha_fin = self.request.query_params.get('fecha_fin', None)
        if fecha_fin:
            queryset = queryset.filter(fecha__lte=fecha_fin)
        
        return queryset.order_by('-fecha')
    
    def create(self, request, *args, **kwargs):
        """Crear medición (opcionalmente calcular recomendación)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        medicion = serializer.save()
        
        # Si tiene datos NPK completos, calcular recomendación
        if all([medicion.nitrogeno, medicion.fosforo, medicion.potasio]):
            try:
                self._calcular_y_guardar_recomendacion(medicion)
            except Exception as e:
                print(f"Error al calcular recomendación: {e}")
        
        output_serializer = MedicionSerializer(medicion)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    # ═══════════════════════════════════════════════════════
    # 🆕 NUEVO ENDPOINT: Promedios semanales
    # ═══════════════════════════════════════════════════════
    
    @action(detail=False, methods=['get'], url_path='promedios-semanales')
    def promedios_semanales(self, request):
        """
        GET /api/mediciones/promedios-semanales/?predio=1
        
        Agrupa las mediciones del predio por semana y calcula promedios.
        Esto es lo que tu frontend necesita para mostrar la tabla semanal.
        """
        predio_id = request.query_params.get('predio')
        
        if not predio_id:
            return Response(
                {'error': 'Debe especificar el parámetro ?predio=X'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            predio = Predio.objects.get(id=predio_id)
        except Predio.DoesNotExist:
            return Response(
                {'error': 'Predio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener mediciones del predio
        mediciones = Medicion.objects.filter(predio=predio).order_by('fecha')
        
        if not mediciones.exists():
            return Response([])
        
        # Agrupar por semana
        grupos_semanales = defaultdict(list)
        
        for medicion in mediciones:
            semana_inicio = medicion.get_semana_inicio()
            grupos_semanales[semana_inicio].append(medicion)
        
        # Calcular promedios para cada semana
        resultados = []
        
        for semana_inicio, mediciones_semana in sorted(grupos_semanales.items(), reverse=True):
            # Promedios
            promedios = {
                'semana_inicio': semana_inicio,
                'predio_id': predio.id,
                'predio_nombre': predio.nombre,
                'cantidad_mediciones': len(mediciones_semana),
                'fecha_primera': min(m.fecha for m in mediciones_semana),
                'fecha_ultima': max(m.fecha for m in mediciones_semana),
            }
            
            # Calcular promedios numéricos
            for campo in ['ph', 'temperatura', 'humedad', 'nitrogeno', 'fosforo', 'potasio']:
                valores = [getattr(m, campo) for m in mediciones_semana if getattr(m, campo) is not None]
                if valores:
                    promedio = sum(float(v) for v in valores) / len(valores)
                    promedios[f'{campo}_promedio'] = round(promedio, 2)
                else:
                    promedios[f'{campo}_promedio'] = None
            
            resultados.append(promedios)
        
        serializer = PromedioSemanalSerializer(resultados, many=True)
        return Response(serializer.data)
    
    def _calcular_y_guardar_recomendacion(self, medicion):
        """Método auxiliar para calcular recomendación de una medición"""
        predio = medicion.predio
        resultado = MotorFertilizacion.calcular_recomendacion_completa(medicion, predio)
        
        recomendacion, created = Recomendacion.objects.update_or_create(
            medicion=medicion,
            defaults={
                **resultado,
                'predio': predio,
                'ph_promedio': medicion.ph,
                'temp_promedio': medicion.temperatura,
                'humedad_promedio': medicion.humedad,
                'n_promedio': medicion.nitrogeno,
                'p_promedio': medicion.fosforo,
                'k_promedio': medicion.potasio,
            }
        )
        
        return recomendacion


# ═══════════════════════════════════════════════════════
# 🆕 NUEVO ENDPOINT: Generar recomendación por semana
# ═══════════════════════════════════════════════════════

@api_view(['POST'])
def generar_recomendacion_semanal(request):
    """
    POST /api/recomendaciones/generar-por-semana/
    
    Body:
    {
        "predio_id": 1,
        "semana_inicio": "2024-11-11"
    }
    
    Calcula la recomendación basada en el promedio de mediciones de esa semana.
    """
    serializer = GenerarRecomendacionSemanalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    predio_id = serializer.validated_data['predio_id']
    semana_inicio = serializer.validated_data['semana_inicio']
    
    try:
        predio = Predio.objects.get(id=predio_id)
    except Predio.DoesNotExist:
        return Response(
            {'error': 'Predio no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calcular fin de semana (domingo)
    semana_fin = semana_inicio + timedelta(days=6)
    
    # Obtener mediciones de esa semana
    mediciones_semana = Medicion.objects.filter(
        predio=predio,
        fecha__date__gte=semana_inicio,
        fecha__date__lte=semana_fin
    )
    
    if not mediciones_semana.exists():
        return Response(
            {'error': 'No hay mediciones para esa semana'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Calcular promedios
    promedios = mediciones_semana.aggregate(
        ph_prom=Avg('ph'),
        temp_prom=Avg('temperatura'),
        humedad_prom=Avg('humedad'),
        n_prom=Avg('nitrogeno'),
        p_prom=Avg('fosforo'),
        k_prom=Avg('potasio'),
    )
    
    # Validar que tengamos datos NPK
    if not all([promedios['n_prom'], promedios['p_prom'], promedios['k_prom']]):
        return Response(
            {'error': 'Faltan datos de NPK en las mediciones de esta semana'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Crear objeto temporal para el cálculo
    class MedicionPromedio:
        def __init__(self, ph, temp, humedad, n, p, k):
            self.ph = ph
            self.temperatura = temp
            self.humedad = humedad
            self.nitrogeno = n
            self.fosforo = p
            self.potasio = k
    
    medicion_promedio = MedicionPromedio(
        ph=promedios['ph_prom'],
        temp=promedios['temp_prom'],
        humedad=promedios['humedad_prom'],
        n=promedios['n_prom'],
        p=promedios['p_prom'],
        k=promedios['k_prom']
    )
    
    # Calcular recomendación
    resultado = MotorFertilizacion.calcular_recomendacion_completa(medicion_promedio, predio)
    
    # Guardar recomendación
    recomendacion, created = Recomendacion.objects.update_or_create(
        predio=predio,
        semana_inicio=semana_inicio,
        defaults={
            **resultado,
            'ph_promedio': promedios['ph_prom'],
            'temp_promedio': promedios['temp_prom'],
            'humedad_promedio': promedios['humedad_prom'],
            'n_promedio': promedios['n_prom'],
            'p_promedio': promedios['p_prom'],
            'k_promedio': promedios['k_prom'],
        }
    )
    
    serializer_response = RecomendacionSerializer(recomendacion)
    return Response(serializer_response.data, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════
# ENDPOINT WEMOS (sin cambios)
# ═══════════════════════════════════════════════════════

@api_view(['POST'])
def recibir_datos_wemos(request):
    """
    POST /api/wemos/datos/
    
    Body:
    {
        "predio_id": 1,
        "ph": 5.4,
        "temperatura": 18.5,
        "humedad": 65.2
    }
    """
    try:
        predio_id = request.data.get('predio_id')
        predio = Predio.objects.get(id=predio_id)
        
        medicion = Medicion.objects.create(
            predio=predio,
            ph=request.data.get('ph'),
            temperatura=request.data.get('temperatura'),
            humedad=request.data.get('humedad'),
            origen='wemos'
        )
        
        return Response({
            'status': 'success',
            'message': 'Datos recibidos correctamente',
            'medicion_id': medicion.id
        }, status=status.HTTP_201_CREATED)
        
    except Predio.DoesNotExist:
        return Response(
            {'error': 'Predio no encontrado'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


# ═══════════════════════════════════════════════════════
# DASHBOARD (sin cambios)
# ═══════════════════════════════════════════════════════

@api_view(['GET'])
def dashboard_stats(request):
    usuario = User.objects.first()
    
    if not usuario:
        return Response({'error': 'No hay usuarios'}, status=404)
    
    predios = Predio.objects.filter(usuario=usuario)
    total_predios = predios.count()
    total_superficie = sum(p.superficie for p in predios)
    
    ultima_medicion = Medicion.objects.filter(
        predio__usuario=usuario
    ).order_by('-fecha').first()
    
    total_mediciones = Medicion.objects.filter(predio__usuario=usuario).count()
    
    return Response({
        'total_predios': total_predios,
        'total_superficie': float(total_superficie),
        'total_mediciones': total_mediciones,
        'ultima_medicion': MedicionSerializer(ultima_medicion).data if ultima_medicion else None,
    })