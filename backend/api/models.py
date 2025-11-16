# backend/api/models.py
# (Los modelos base siguen igual, pero agrego un método útil)

from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta

class Predio(models.Model):
    """Modelo sin cambios, pero ahora más usado por zona"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predios')
    nombre = models.CharField(max_length=100)
    superficie = models.DecimalField(max_digits=10, decimal_places=2)
    zona = models.CharField(max_length=50, choices=[
        ('Puerto Montt', 'Puerto Montt'),
        ('Osorno', 'Osorno'),
        ('Río Bueno', 'Río Bueno'),
    ])
    tipo_suelo = models.CharField(max_length=50, choices=[
        ('Andisol', 'Andisol'),
        ('Ultisol', 'Ultisol'),
        ('Alfisol', 'Alfisol'),
    ])
    cultivo_actual = models.CharField(max_length=100, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'predios'
        ordering = ['zona', 'nombre']  # ← CAMBIO: Ordenar por zona primero
    
    def __str__(self):
        return f"{self.zona} - {self.nombre}"


class Medicion(models.Model):
    """Modelo con índice para optimizar consultas por semana"""
    predio = models.ForeignKey(Predio, on_delete=models.CASCADE, related_name='mediciones')
    fecha = models.DateTimeField(auto_now_add=True)
    
    # Datos del Wemos
    ph = models.DecimalField(max_digits=4, decimal_places=2)
    temperatura = models.DecimalField(max_digits=5, decimal_places=2)
    humedad = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Datos NPK (ahora más importantes)
    nitrogeno = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    fosforo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    potasio = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)
    
    origen = models.CharField(max_length=20, choices=[
        ('wemos', 'Sensor Wemos'),
        ('manual', 'Ingreso Manual'),
    ], default='manual')
    
    class Meta:
        db_table = 'mediciones'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['predio', '-fecha']),  # ← NUEVO: Optimizar queries
        ]
    
    def get_semana_inicio(self):
        """Método para obtener el lunes de la semana de esta medición"""
        fecha_obj = self.fecha
        dias_desde_lunes = (fecha_obj.weekday() + 1) % 7
        lunes = fecha_obj - timedelta(days=dias_desde_lunes)
        return lunes.date()
    
    def __str__(self):
        return f"{self.predio.nombre} - {self.fecha.strftime('%Y-%m-%d')}"


class Recomendacion(models.Model):
    """
    CAMBIO IMPORTANTE: Ahora puede estar asociada a:
    - Una medición específica (medicion)
    - O a un grupo de mediciones (semana_inicio)
    """
    medicion = models.OneToOneField(
        Medicion, 
        on_delete=models.CASCADE, 
        related_name='recomendacion',
        null=True,  # ← NUEVO: Puede ser null
        blank=True
    )
    predio = models.ForeignKey(
        Predio, 
        on_delete=models.CASCADE, 
        related_name='recomendaciones',
        null=True,  # ← NUEVO
        blank=True
    )
    semana_inicio = models.DateField(null=True, blank=True)  # ← NUEVO: Para promedios semanales
    
    fecha_calculo = models.DateTimeField(auto_now_add=True)
    
    # Datos de entrada promediados
    ph_promedio = models.DecimalField(max_digits=4, decimal_places=2, null=True)
    temp_promedio = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    humedad_promedio = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    n_promedio = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    p_promedio = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    k_promedio = models.DecimalField(max_digits=10, decimal_places=4, null=True)
    
    # Resultados del cálculo
    urea_kg_ha = models.DecimalField(max_digits=10, decimal_places=2)
    superfosfato_kg_ha = models.DecimalField(max_digits=10, decimal_places=2)
    muriato_potasio_kg_ha = models.DecimalField(max_digits=10, decimal_places=2)
    cal_kg_ha = models.DecimalField(max_digits=10, decimal_places=2)
    
    urea_total = models.DecimalField(max_digits=10, decimal_places=2)
    superfosfato_total = models.DecimalField(max_digits=10, decimal_places=2)
    muriato_potasio_total = models.DecimalField(max_digits=10, decimal_places=2)
    cal_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    factor_zona = models.DecimalField(max_digits=4, decimal_places=2)
    factor_suelo = models.DecimalField(max_digits=4, decimal_places=2)
    factor_precipitacion = models.DecimalField(max_digits=4, decimal_places=2)
    
    class Meta:
        db_table = 'recomendaciones'
        ordering = ['-fecha_calculo']
    
    def __str__(self):
        if self.semana_inicio:
            return f"Recomendación semanal {self.predio.nombre} - Semana {self.semana_inicio}"
        return f"Recomendación {self.medicion.predio.nombre}"