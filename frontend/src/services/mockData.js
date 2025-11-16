// Datos de prueba para desarrollo sin backend

export const MOCK_MEDICIONES = [
  {
    id: 1,
    fecha: '2024-11-15',
    ph: 5.4,
    temperatura: 18.0,
    humedad: 65.0,
    nitrogeno: 15.0,
    fosforo: 12.0,
    potasio: 0.4,
    predio: 1,
    predio_nombre: 'Potrero Norte',
    origen: 'manual'
  },
  {
    id: 2,
    fecha: '2024-11-14',
    ph: 5.6,
    temperatura: 19.0,
    humedad: 63.0,
    nitrogeno: 14.0,
    fosforo: 13.0,
    potasio: 0.45,
    predio: 1,
    predio_nombre: 'Potrero Norte',
    origen: 'wemos'
  },
  {
    id: 3,
    fecha: '2024-11-13',
    ph: 5.5,
    temperatura: 17.5,
    humedad: 68.0,
    nitrogeno: 16.0,
    fosforo: 11.5,
    potasio: 0.38,
    predio: 2,
    predio_nombre: 'Lote Sur',
    origen: 'manual'
  }
];

export const MOCK_PREDIOS = [
  {
    id: 1,
    nombre: 'Potrero Norte',
    superficie: 5.0,
    zona: 'Osorno',
    tipo_suelo: 'Andisol',
    cultivo_actual: 'Papa temprana',
    fecha_creacion: '2024-11-01'
  },
  {
    id: 2,
    nombre: 'Lote Sur',
    superficie: 3.5,
    zona: 'Puerto Montt',
    tipo_suelo: 'Ultisol',
    cultivo_actual: 'Avena forrajera',
    fecha_creacion: '2024-11-05'
  },
  {
    id: 3,
    nombre: 'Sector Este',
    superficie: 7.2,
    zona: 'Río Bueno',
    tipo_suelo: 'Alfisol',
    cultivo_actual: 'Ballica perenne',
    fecha_creacion: '2024-11-10'
  }
];

export const MOCK_RECOMENDACIONES = {
  urea_kg_ha: 362.0,
  superfosfato_kg_ha: 608.0,
  muriato_potasio_kg_ha: 389.0,
  cal_kg_ha: 6408.0,
  urea_total: 1810.0,
  superfosfato_total: 3040.0,
  muriato_potasio_total: 1945.0,
  cal_total: 32040.0
};

export const MOCK_USER = {
  id: 1,
  username: 'admin',
  email: 'admin@nutrisoil.com',
  first_name: 'Usuario',
  last_name: 'Demo'
};
