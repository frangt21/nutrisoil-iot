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

  // 1. Limpiar el RUT: Dejar solo números y k/K
  // Esto maneja puntos, guiones, espacios, etc.
  const rutLimpio = rut.replace(/[^0-9kK]+/g, '').toUpperCase();

  // 2. Validaciones básicas de longitud (mínimo cuerpo + dv)
  if (rutLimpio.length < 2) {
    return false;
  }

  // 3. Separar cuerpo y dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // 4. Validar que el cuerpo sean solo números
  // (Si había una K en el medio, rutLimpio la tiene, pero aquí fallará)
  if (!/^[0-9]+$/.test(cuerpo)) {
    return false;
  }

  // 5. Algoritmo Módulo 11
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperado = 11 - (suma % 11);

  let dvCalculado;
  if (dvEsperado === 11) {
    dvCalculado = '0';
  } else if (dvEsperado === 10) {
    dvCalculado = 'K';
  } else {
    dvCalculado = dvEsperado.toString();
  }

  return dvCalculado === dv;
};