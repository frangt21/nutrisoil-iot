# backend/api/serializers.py

from rest_framework import serializers
from .models import Predio, Medicion, Recomendacion
from django.contrib.auth.models import User
from datetime import datetime, timedelta


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class PredioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Predio
        fields = ['id', 'nombre', 'superficie', 'zona', 'tipo_suelo', 
                  'cultivo_actual', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class RecomendacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recomendacion
        fields = '__all__'


class MedicionSerializer(serializers.ModelSerializer):
    predio_nombre = serializers.CharField(source='predio.nombre', read_only=True)
    recomendacion = RecomendacionSerializer(read_only=True)
    
    class Meta:
        model = Medicion
        fields = ['id', 'predio', 'predio_nombre', 'fecha', 'ph', 'temperatura', 
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