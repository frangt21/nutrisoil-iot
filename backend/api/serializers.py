# backend/api/serializers.py

from rest_framework import serializers
from .models import Predio, Medicion, Recomendacion, Profile
from django.contrib.auth.models import User
from datetime import datetime, timedelta


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'nombre', 'apellido', 'rut', 'empresa', 'role', 'email']



class PredioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Predio
        fields = ['id', 'nombre', 'superficie', 'zona', 'tipo_suelo', 
                  'cultivo_actual', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class RecomendacionSerializer(serializers.ModelSerializer):
    predio_detalle = PredioSerializer(source='predio', read_only=True) # Nested serializer for predio details

    class Meta:
        model = Recomendacion
        fields = [
            'id', 'medicion', 'predio', 'predio_detalle', 'semana_inicio', 'fecha_calculo',
            'ph_promedio', 'temp_promedio', 'humedad_promedio', 'n_promedio', 'p_promedio', 'k_promedio',
            'urea_kg_ha', 'superfosfato_kg_ha', 'muriato_potasio_kg_ha', 'cal_kg_ha',
            'urea_total', 'superfosfato_total', 'muriato_potasio_total', 'cal_total',
            'factor_zona', 'factor_suelo', 'factor_precipitacion'
        ]


class MedicionSerializer(serializers.ModelSerializer):
    predio_nombre = serializers.CharField(source='predio.nombre', read_only=True)
    predio_zona = serializers.CharField(source='predio.zona', read_only=True)
    recomendacion = RecomendacionSerializer(read_only=True)
    
    class Meta:
        model = Medicion
        fields = ['id', 'predio', 'predio_nombre', 'predio_zona', 'fecha', 'ph', 'temperatura', 
                  'humedad', 'nitrogeno', 'fosforo', 'potasio', 'origen', 'recomendacion']
        read_only_fields = ['id', 'fecha']


class MedicionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicion
        fields = ['predio', 'ph', 'temperatura', 'humedad', 
                  'nitrogeno', 'fosforo', 'potasio', 'origen']
    
    def validate_ph(self, value):
        if value < 0 or value > 14:
            raise serializers.ValidationError("El pH debe estar entre 0 y 14")
        return value


# ═══════════════════════════════════════════════════════
# 🆕 NUEVO: Serializer para promedios semanales
# ═══════════════════════════════════════════════════════

class PromedioSemanalSerializer(serializers.Serializer):
    """Serializer para datos agrupados por semana"""
    semana_inicio = serializers.DateField()
    predio_id = serializers.IntegerField()
    predio_nombre = serializers.CharField()
    
    # Promedios
    ph_promedio = serializers.DecimalField(max_digits=4, decimal_places=2)
    temperatura_promedio = serializers.DecimalField(max_digits=5, decimal_places=2)
    humedad_promedio = serializers.DecimalField(max_digits=5, decimal_places=2)
    nitrogeno_promedio = serializers.DecimalField(max_digits=10, decimal_places=2)
    fosforo_promedio = serializers.DecimalField(max_digits=10, decimal_places=2)
    potasio_promedio = serializers.DecimalField(max_digits=10, decimal_places=4)
    
    # Metadatos
    cantidad_mediciones = serializers.IntegerField()
    fecha_primera = serializers.DateTimeField()
    fecha_ultima = serializers.DateTimeField()


# ═══════════════════════════════════════════════════════
# 🆕 NUEVO: Serializer para crear recomendación desde promedio
# ═══════════════════════════════════════════════════════

class GenerarRecomendacionSemanalSerializer(serializers.Serializer):
    """Input para generar recomendación desde datos promedio"""
    predio_id = serializers.IntegerField()
    semana_inicio = serializers.DateField()
    
    # Datos promedio (opcionales, se calculan automáticamente si no se envían)
    ph = serializers.DecimalField(max_digits=4, decimal_places=2, required=False)
    temperatura = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    humedad = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    nitrogeno = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    fosforo = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    potasio = serializers.DecimalField(max_digits=10, decimal_places=4, required=False)


class GenerarRecomendacionIndividualSerializer(serializers.Serializer):
    medicion_id = serializers.IntegerField()