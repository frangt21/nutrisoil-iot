// src/utils/formatters.js

/**
 * Formatea un número a una cantidad específica de decimales.
 * @param {number|string} num - El número a formatear.
 * @param {number} decimalPlaces - La cantidad de decimales a mostrar.
 * @returns {string} - El número formateado o '--' si la entrada no es válida.
 */
export const formatNumber = (num, decimalPlaces = 1) => {
  const number = parseFloat(num);
  if (isNaN(number)) {
    return '--';
  }
  return number.toFixed(decimalPlaces);
};

/**
 * Valida un RUT chileno. Acepta formatos con o sin puntos y con guion.
 * @param {string} rut - El RUT a validar (ej: "12.345.678-9" o "12345678-9").
 * @returns {boolean} - true si el RUT es válido, false en caso contrario.
 */
export const validateRut = (rut) => {
  if (typeof rut !== 'string') {
    return false;
  }

  // Limpiar el RUT: quitar puntos y el guion
  const rutLimpio = rut.replace(/\./g, '').replace('-', '');

  // Separar el cuerpo del dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  let dv = rutLimpio.slice(-1).toUpperCase();

  // Validar que el cuerpo sea numérico y el dv sea válido
  if (!/^[0-9]+$/.test(cuerpo)) {
    return false;
  }

  // --- Algoritmo Módulo 11 ---
  let suma = 0;
  let multiplo = 2;

  // Recorrer el cuerpo del RUT de derecha a izquierda
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperado = 11 - (suma % 11);

  // Convertir el resultado a el dígito verificador esperado
  let dvFinal;
  if (dvEsperado === 11) {
    dvFinal = '0';
  } else if (dvEsperado === 10) {
    dvFinal = 'K';
  } else {
    dvFinal = dvEsperado.toString();
  }

  // Comparar el dígito verificador calculado con el ingresado
  return dvFinal === dv;
};