# PASO 18: Configurar panel de administración
# Archivo: backend/api/admin.py

from django.contrib import admin
from .models import Predio, Medicion, Recomendacion, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'email', 'nombre', 'apellido', 'rut', 'empresa', 'role', 'fecha_de_registro']
    search_fields = ['email', 'nombre', 'apellido', 'rut', 'empresa']
    list_filter = ['role']
    readonly_fields = ['id', 'fecha_de_registro', 'email'] # Fields populated by Supabase trigger


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
    list_display = ['predio', 'semana_inicio', 'urea_kg_ha', 'superfosfato_kg_ha', 'fecha_calculo']
    date_hierarchy = 'fecha_calculo'
    list_filter = ['predio__zona']
    search_fields = ['predio__nombre']