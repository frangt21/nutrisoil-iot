# backend/api/utils.py

def generar_alertas(medicion):
    """
    Genera una lista de alertas basadas en los rangos definidos para una medición.
    """
    alertas = []

    if not medicion:
        return alertas

    # Rangos para las Alertas
    # pH del Suelo
    if medicion.ph is not None:
        ph = float(medicion.ph)
        if ph < 5.0 or ph > 7.5:
            alertas.append({'tipo': 'critico', 'parametro': 'pH', 'mensaje': f'🔴 Crítico: pH ({ph}) fuera de rango (5.0-7.5).'})
        elif (ph >= 5.0 and ph < 5.5) or (ph > 7.0 and ph <= 7.5):
            alertas.append({'tipo': 'advertencia', 'parametro': 'pH', 'mensaje': f'🟡 Advertencia: pH ({ph}) en nivel de advertencia (5.0-5.5 o 7.0-7.5).'})
        else:
            alertas.append({'tipo': 'optimo', 'parametro': 'pH', 'mensaje': f'🟢 Óptimo: pH ({ph}) dentro del rango (5.5-7.0).'})

    # Temperatura del Suelo
    if medicion.temperatura is not None:
        temp = float(medicion.temperatura)
        if temp < 5.0 or temp > 35.0:
            alertas.append({'tipo': 'critico', 'parametro': 'Temperatura', 'mensaje': f'🔴 Crítico: Temperatura ({temp}°C) fuera de rango (5-35°C).'})
        elif temp >= 15.0 and temp <= 25.0:
            alertas.append({'tipo': 'optimo', 'parametro': 'Temperatura', 'mensaje': f'🟢 Óptimo: Temperatura ({temp}°C) dentro del rango (15-25°C).'})
        else:
            alertas.append({'tipo': 'informativo', 'parametro': 'Temperatura', 'mensaje': f'ℹ️ Nota: Temperatura ({temp}°C) fuera del rango óptimo (15-25°C).'})


    # Humedad del Suelo
    if medicion.humedad is not None:
        humedad = float(medicion.humedad)
        if humedad < 20.0 or humedad > 90.0:
            alertas.append({'tipo': 'critico', 'parametro': 'Humedad', 'mensaje': f'🔴 Crítico: Humedad ({humedad}%) fuera de rango (20-90%).'})
        elif humedad >= 40.0 and humedad <= 70.0:
            alertas.append({'tipo': 'optimo', 'parametro': 'Humedad', 'mensaje': f'🟢 Óptimo: Humedad ({humedad}%) dentro del rango (40-70%).'})
        else:
            alertas.append({'tipo': 'informativo', 'parametro': 'Humedad', 'mensaje': f'ℹ️ Nota: Humedad ({humedad}%) fuera del rango óptimo (40-70%).'})


    # Nitrógeno (N)
    if medicion.nitrogeno is not None:
        n = float(medicion.nitrogeno)
        if n < 10.0:
            alertas.append({'tipo': 'critico', 'parametro': 'Nitrógeno', 'mensaje': f'🔴 Bajo: Nitrógeno ({n} ppm) es críticamente bajo (<10 ppm).'})
        elif n >= 15.0 and n <= 40.0:
            alertas.append({'tipo': 'optimo', 'parametro': 'Nitrógeno', 'mensaje': f'🟢 Óptimo: Nitrógeno ({n} ppm) dentro del rango (15-40 ppm).'})
        elif n > 50.0:
            alertas.append({'tipo': 'advertencia', 'parametro': 'Nitrógeno', 'mensaje': f'🟡 Alto: Nitrógeno ({n} ppm) es alto (>50 ppm).'})
        else:
            alertas.append({'tipo': 'informativo', 'parametro': 'Nitrógeno', 'mensaje': f'ℹ️ Nota: Nitrógeno ({n} ppm) fuera del rango óptimo (15-40 ppm).'})

    # Fósforo (P)
    if medicion.fosforo is not None:
        p = float(medicion.fosforo)
        if p < 8.0:
            alertas.append({'tipo': 'critico', 'parametro': 'Fósforo', 'mensaje': f'🔴 Bajo: Fósforo ({p} ppm) es críticamente bajo (<8 ppm).'})
        elif p >= 12.0 and p <= 30.0:
            alertas.append({'tipo': 'optimo', 'parametro': 'Fósforo', 'mensaje': f'🟢 Óptimo: Fósforo ({p} ppm) dentro del rango (12-30 ppm).'})
        elif p > 30.0:
            alertas.append({'tipo': 'advertencia', 'parametro': 'Fósforo', 'mensaje': f'🟡 Alto: Fósforo ({p} ppm) es alto (>30 ppm).'})
        else:
            alertas.append({'tipo': 'informativo', 'parametro': 'Fósforo', 'mensaje': f'ℹ️ Nota: Fósforo ({p} ppm) fuera del rango óptimo (12-30 ppm).'})

    # Potasio (K)
    if medicion.potasio is not None:
        k = float(medicion.potasio)
        if k < 0.2:
            alertas.append({'tipo': 'critico', 'parametro': 'Potasio', 'mensaje': f'🔴 Bajo: Potasio ({k} cmol/kg) es críticamente bajo (<0.2 cmol/kg).'})
        elif k >= 0.3 and k <= 0.8:
            alertas.append({'tipo': 'optimo', 'parametro': 'Potasio', 'mensaje': f'🟢 Óptimo: Potasio ({k} cmol/kg) dentro del rango (0.3-0.8 cmol/kg).'})
        elif k > 0.8:
            alertas.append({'tipo': 'advertencia', 'parametro': 'Potasio', 'mensaje': f'🟡 Alto: Potasio ({k} cmol/kg) es alto (>0.8 cmol/kg).'})
        else:
            alertas.append({'tipo': 'informativo', 'parametro': 'Potasio', 'mensaje': f'ℹ️ Nota: Potasio ({k} cmol/kg) fuera del rango óptimo (0.3-0.8 cmol/kg).'})

    alertas.append({'tipo': 'informativo', 'parametro': 'General', 'mensaje': 'ℹ️ Nota: Los cálculos se hicieron para un tipo de suelo y zona específicos.'})

    return alertas
