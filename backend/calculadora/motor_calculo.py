# PASO 14: Trasladar fórmulas del prototipo HTML a Python
# Archivo: backend/calculadora/motor_calculo.py

from decimal import Decimal

class MotorFertilizacion:
    """
    Motor de cálculo de fertilización basado en el prototipo NutriSoilWise.Web
    Fórmulas extraídas del archivo HTML original
    """
    
    # Tabla de requerimientos por cultivo (kg/ha)
    REQUERIMIENTOS_CULTIVOS = {
        'Papa temprana': {'N': 200, 'P2O5': 135, 'K2O': 225},
        'Avena forrajera': {'N': 135, 'P2O5': 90, 'K2O': 110},
        'Ballica perenne': {'N': 225, 'P2O5': 70, 'K2O': 200},
    }
    
    # Factores de corrección por zona
    FACTORES_ZONA = {
        'Puerto Montt': 1.2,
        'Osorno': 1.1,
        'Río Bueno': 1.0,
    }
    
    # Factores de fijación de fósforo por tipo de suelo
    FACTORES_SUELO = {
        'Andisol': 2.5,  # Suelos volcánicos fijan mucho P
        'Ultisol': 2.0,
        'Alfisol': 1.5,
    }
    
    # Precipitación promedio por zona (mm/año)
    PRECIPITACION_ZONA = {
        'Puerto Montt': 2200,
        'Osorno': 1800,
        'Río Bueno': 1600,
    }
    
    @staticmethod
    def calcular_factor_precipitacion(zona):
        """Factor de corrección por lixiviación"""
        precip = MotorFertilizacion.PRECIPITACION_ZONA.get(zona, 1600)
        if precip > 2000:
            return 1.3
        elif precip > 1500:
            return 1.1
        else:
            return 1.0
    
    @staticmethod
    def calcular_eficiencia_n(tipo_suelo):
        """Eficiencia de uso de nitrógeno según tipo de suelo"""
        if tipo_suelo == 'Andisol':
            return 0.7  # Suelos volcánicos retienen menos N
        return 0.85
    
    @staticmethod
    def calcular_nitrogeno(medicion, predio):
        """
        Cálculo de Nitrógeno (Urea)
        Basado en fórmulas del prototipo HTML
        """
        # Paso 1: Convertir NO3- (ppm) a kg N/ha
        # Fórmula: NO3_ppm * 2.24 = kg N/ha
        n_disponible = float(medicion.nitrogeno or 0) * 2.24
        
        # Paso 2: Obtener requerimiento del cultivo
        cultivo = predio.cultivo_actual or 'Papa temprana'
        n_requerido = MotorFertilizacion.REQUERIMIENTOS_CULTIVOS.get(cultivo, {}).get('N', 200)
        
        # Paso 3: Calcular déficit
        n_deficit = n_requerido - n_disponible
        
        # Paso 4: Aplicar factores de corrección
        factor_zona = MotorFertilizacion.FACTORES_ZONA.get(predio.zona, 1.0)
        factor_precip = MotorFertilizacion.calcular_factor_precipitacion(predio.zona)
        eficiencia_n = MotorFertilizacion.calcular_eficiencia_n(predio.tipo_suelo)
        
        # Paso 5: Calcular N neto requerido
        n_neto = n_deficit * factor_zona * factor_precip / eficiencia_n
        
        # Paso 6: Convertir a Urea (46% N)
        urea_kg_ha = n_neto / 0.46
        
        return max(0, urea_kg_ha)  # No puede ser negativo
    
    @staticmethod
    def calcular_fosforo(medicion, predio):
        """
        Cálculo de Fósforo (Superfosfato Triple)
        """
        # Paso 1: Convertir P-Olsen (ppm) a kg P2O5/ha
        # Fórmula: P_ppm * 2.29 = kg P2O5/ha
        p_disponible = float(medicion.fosforo or 0) * 2.29
        
        # Paso 2: Obtener requerimiento del cultivo
        cultivo = predio.cultivo_actual or 'Papa temprana'
        p_requerido = MotorFertilizacion.REQUERIMIENTOS_CULTIVOS.get(cultivo, {}).get('P2O5', 135)
        
        # Paso 3: Calcular déficit
        p_deficit = p_requerido - p_disponible
        
        # Paso 4: Aplicar factor de fijación del suelo
        factor_suelo = MotorFertilizacion.FACTORES_SUELO.get(predio.tipo_suelo, 2.0)
        
        # Paso 5: Calcular P2O5 neto
        p_neto = p_deficit * factor_suelo
        
        # Paso 6: Convertir a Superfosfato Triple (46% P2O5)
        sft_kg_ha = p_neto / 0.46
        
        return max(0, sft_kg_ha)
    
    @staticmethod
    def calcular_potasio(medicion, predio):
        """
        Cálculo de Potasio (Muriato de Potasio)
        """
        # Paso 1: Convertir K intercambiable (cmol/kg) a kg K2O/ha
        # Fórmula: K_cmol/kg * 94.2 * 1.205 = kg K2O/ha
        k_disponible = float(medicion.potasio or 0) * 94.2 * 1.205
        
        # Paso 2: Obtener requerimiento del cultivo
        cultivo = predio.cultivo_actual or 'Papa temprana'
        k_requerido = MotorFertilizacion.REQUERIMIENTOS_CULTIVOS.get(cultivo, {}).get('K2O', 225)
        
        # Paso 3: Calcular déficit
        k_deficit = k_requerido - k_disponible
        
        # Paso 4: Aplicar factor de precipitación (lixiviación)
        factor_precip = MotorFertilizacion.calcular_factor_precipitacion(predio.zona)
        
        # Paso 5: Calcular K2O neto
        k_neto = k_deficit * factor_precip
        
        # Paso 6: Convertir a Muriato de Potasio (60% K2O)
        kcl_kg_ha = k_neto / 0.60
        
        return max(0, kcl_kg_ha)
    
    @staticmethod
    def calcular_cal(medicion, predio):
        """
        Cálculo de Cal Agrícola para corrección de pH
        """
        # Paso 1: Determinar pH objetivo según zona
        ph_objetivo_zona = {
            'Puerto Montt': 6.0,
            'Osorno': 6.2,
            'Río Bueno': 5.8,
        }
        ph_objetivo = ph_objetivo_zona.get(predio.zona, 6.0)
        
        # Paso 2: Calcular diferencia de pH
        ph_actual = float(medicion.ph)
        diferencia_ph = ph_objetivo - ph_actual
        
        if diferencia_ph <= 0:
            return 0  # No necesita encalado
        
        # Paso 3: Capacidad tampón del suelo
        capacidad_tampon = {
            'Andisol': 4.5,
            'Ultisol': 3.0,
            'Alfisol': 2.0,
        }
        tampon = capacidad_tampon.get(predio.tipo_suelo, 3.0)
        
        # Paso 4: Calcular cantidad de cal (CaCO3)
        # Fórmula: diferencia_pH * capacidad_tampón * 1780 kg/ha
        cal_kg_ha = diferencia_ph * tampon * 1780
        
        return max(0, cal_kg_ha)
    
    @classmethod
    def calcular_recomendacion_completa(cls, medicion, predio):
        """
        Método principal que calcula toda la recomendación
        """
        # Calcular cada fertilizante
        urea_kg_ha = cls.calcular_nitrogeno(medicion, predio)
        sft_kg_ha = cls.calcular_fosforo(medicion, predio)
        kcl_kg_ha = cls.calcular_potasio(medicion, predio)
        cal_kg_ha = cls.calcular_cal(medicion, predio)
        
        # Calcular totales para el predio
        superficie = float(predio.superficie)
        urea_total = urea_kg_ha * superficie
        sft_total = sft_kg_ha * superficie
        kcl_total = kcl_kg_ha * superficie
        cal_total = cal_kg_ha * superficie
        
        # Calcular factores aplicados
        factor_zona = cls.FACTORES_ZONA.get(predio.zona, 1.0)
        factor_suelo = cls.FACTORES_SUELO.get(predio.tipo_suelo, 2.0)
        factor_precip = cls.calcular_factor_precipitacion(predio.zona)
        
        return {
            'urea_kg_ha': round(urea_kg_ha, 2),
            'superfosfato_kg_ha': round(sft_kg_ha, 2),
            'muriato_potasio_kg_ha': round(kcl_kg_ha, 2),
            'cal_kg_ha': round(cal_kg_ha, 2),
            'urea_total': round(urea_total, 2),
            'superfosfato_total': round(sft_total, 2),
            'muriato_potasio_total': round(kcl_total, 2),
            'cal_total': round(cal_total, 2),
            'factor_zona': factor_zona,
            'factor_suelo': factor_suelo,
            'factor_precipitacion': factor_precip,
        }