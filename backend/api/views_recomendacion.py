from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta

from django.db import transaction # Para asegurar la consistencia

from .models import Medicion, Recomendacion, Predio
from .serializers import (
    MedicionSerializer, RecomendacionSerializer,
    GenerarRecomendacionIndividualSerializer # Nuevo serializador para la entrada
)
from calculadora.motor_calculo import MotorFertilizacion
from .utils import generar_alertas # Importar la función

class RecomendacionViewSet(mixins.RetrieveModelMixin,
                           mixins.ListModelMixin,
                           viewsets.GenericViewSet):
    serializer_class = RecomendacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Este queryset se usa para las acciones 'list' y 'retrieve'.
        Filtra las recomendaciones para que un usuario solo vea las suyas.
        """
        profile = getattr(self.request, 'profile', None)
        if profile:
            return Recomendacion.objects.filter(predio__usuario=profile).select_related('predio', 'medicion').order_by('-fecha_calculo')
        return Recomendacion.objects.none()

    # Endpoint para generar una recomendación individual
    @action(detail=False, methods=['post'], url_path='generar-individual')
    def generar_individual(self, request):
        serializer = GenerarRecomendacionIndividualSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        medicion_id = serializer.validated_data['medicion_id']

        try:
            # Asegurarse de que la medición pertenezca al usuario autenticado
            profile = getattr(request, 'profile', None)
            if not profile:
                return Response({'error': 'Usuario sin perfil'}, status=status.HTTP_403_FORBIDDEN)

            medicion = Medicion.objects.get(pk=medicion_id, predio__usuario=profile)
            predio = medicion.predio

        except Medicion.DoesNotExist:
            return Response({'error': 'Medición no encontrada o no pertenece al usuario'}, status=status.HTTP_404_NOT_FOUND)

        # Validar que la medición tenga datos NPK completos para calcular
        if not all([medicion.nitrogeno, medicion.fosforo, medicion.potasio]):
            return Response(
                {'error': 'La medición debe tener valores de Nitrógeno, Fósforo y Potasio para generar una recomendación.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calcular recomendación usando el motor
        with transaction.atomic(): # Aseguramos que la operación sea atómica
            try:
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
            except Exception as e:
                return Response({'error': f'Error en el motor de cálculo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = self.get_serializer(recomendacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """
        Obtiene el detalle de una recomendación específica.
        La seguridad es manejada por get_queryset.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # Generar y añadir alertas dinámicamente
        alertas = generar_alertas(instance.medicion)
        data = serializer.data
        data['alertas'] = alertas
        return Response(data)