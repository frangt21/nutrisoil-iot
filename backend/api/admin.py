# PASO 18: Configurar panel de administración
# Archivo: backend/api/admin.py

from django.contrib import admin
from .models import Predio, Medicion, Recomendacion


@admin.register(Predio)
class PredioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'usuario', 'superficie', 'zona', 'tipo_suelo', 'fecha_creacion']
    list_filter = ['zona', 'tipo_suelo']
    search_fields = ['nombre', 'usuario__username']


@admin.register(Medicion)
class MedicionAdmin(admin.ModelAdmin):
    list_display = ['predio', 'fecha', 'ph', 'temperatura', 'humedad', 'origen']
    list_filter = ['origen', 'fecha', 'predio']
    date_hierarchy = 'fecha'


@admin.register(Recomendacion)
class RecomendacionAdmin(admin.ModelAdmin):
    list_display = ['medicion', 'urea_kg_ha', 'superfosfato_kg_ha', 'fecha_calculo']
    date_hierarchy = 'fecha_calculo'