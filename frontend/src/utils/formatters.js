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
 * Valida un RUT chileno.
 * @param {string} rut - El RUT a validar.
 * @returns {boolean} - true si el RUT es válido, false en caso contrario.
 */
export const validateRut = (rut) => {
  if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rut)) {
    return false;
  }
  const tmp = rut.split('-');
  let digv = tmp[1];
  let rutBody = tmp[0];

  if (digv === 'K') digv = 'k';

  let M = 0;
  let S = 1;
  for (; rutBody; S = (S + rutBody % 10 * (9 - M++ % 6)) % 11, rutBody = Math.floor(rutBody / 10));

  return (S ? S - 1 : 'k') === digv;
};
