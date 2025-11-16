import axios from 'axios';
import { 
  MOCK_MEDICIONES, 
  MOCK_PREDIOS, 
  MOCK_RECOMENDACIONES,
  MOCK_USER 
} from './mockData';

// ═══════════════════════════════════════════════════════
// ⚙️ CONFIGURACIÓN - CAMBIAR SEGÚN ETAPA DEL PROYECTO
// ═══════════════════════════════════════════════════════

const USE_MOCK = false;  // ← true = datos dummy, false = backend real

const BACKEND_URL = 'http://localhost:8000';  // URL del backend de 

// ═══════════════════════════════════════════════════════

// Función auxiliar para simular delay de red
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════
// 🔐 AUTENTICACIÓN
// ═══════════════════════════════════════════════════════

export const login = async (username, password) => {
  if (USE_MOCK) {
    await mockDelay();
    
    // Validación simple para demo
    if (username === 'admin' && password === 'admin') {
      return {
        token: 'mock-token-123',
        user: MOCK_USER
      };
    }
    throw new Error('Credenciales inválidas');
  } else {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login/`, {
      username,
      password
    });
    return response.data;
  }
};

// ═══════════════════════════════════════════════════════
// 🏞️ PREDIOS
// ═══════════════════════════════════════════════════════

export const getPredios = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_PREDIOS;
  } else {
    const response = await axios.get(`${BACKEND_URL}/api/predios/`);
    return response.data;
  }
};

export const createPredio = async (data) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Predio creado (mock):', data);
    return { id: 99, ...data, fecha_creacion: new Date().toISOString() };
  } else {
    const response = await axios.post(`${BACKEND_URL}/api/predios/`, data);
    return response.data;
  }
};

export const updatePredio = async (id, data) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Predio actualizado (mock):', id, data);
    return { id, ...data };
  } else {
    const response = await axios.put(`${BACKEND_URL}/api/predios/${id}/`, data);
    return response.data;
  }
};

export const deletePredio = async (id) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Predio eliminado (mock):', id);
    return { message: 'Eliminado' };
  } else {
    const response = await axios.delete(`${BACKEND_URL}/api/predios/${id}/`);
    return response.data;
  }
};

// ═══════════════════════════════════════════════════════
// 📊 MEDICIONES
// ═══════════════════════════════════════════════════════

// ✅ ACTUALIZAR: getMediciones con filtros avanzados
export const getMediciones = async (predioId = null, filtros = {}) => {
  if (USE_MOCK) {
    await mockDelay();
    let resultado = MOCK_MEDICIONES;
    
    if (predioId) {
      resultado = resultado.filter(m => m.predio.toString() === predioId);
    }
    
    // Filtros adicionales para reportes
    if (filtros.fechaInicio) {
      resultado = resultado.filter(m => new Date(m.fecha) >= new Date(filtros.fechaInicio));
    }
    if (filtros.fechaFin) {
      resultado = resultado.filter(m => new Date(m.fecha) <= new Date(filtros.fechaFin));
    }
    
    return resultado;
  } else {
    let url = `${BACKEND_URL}/api/mediciones/`;
    const params = new URLSearchParams();
    
    if (predioId) params.append('predio', predioId);
    if (filtros.zona) params.append('zona', filtros.zona);
    if (filtros.fechaInicio) params.append('fecha_inicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fecha_fin', filtros.fechaFin);
    
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await axios.get(url);
    return response.data;
  }
};

export const createMedicion = async (data) => {
  if (USE_MOCK) {
    await mockDelay(1000);
    console.log('Medición creada (mock):', data);
    
    // Simular respuesta con recomendación
    return {
      id: 99,
      ...data,
      fecha: new Date().toISOString(),
      recomendacion: MOCK_RECOMENDACIONES
    };
  } else {
    const response = await axios.post(`${BACKEND_URL}/api/mediciones/`, data);
    return response.data;
  }
};

// ═══════════════════════════════════════════════════════
// 📈 DASHBOARD
// ═══════════════════════════════════════════════════════

export const getDashboardStats = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return {
      total_predios: MOCK_PREDIOS.length,
      total_superficie: MOCK_PREDIOS.reduce((sum, p) => sum + p.superficie, 0),
      total_mediciones: MOCK_MEDICIONES.length,
      ultima_medicion: MOCK_MEDICIONES[0]
    };
  } else {
    const response = await axios.get(`${BACKEND_URL}/api/dashboard/stats/`);
    return response.data;
  }
};

// 🆕 NUEVO: Obtener promedios semanales
export const getPromediosSemanales = async (predioId) => {
  if (USE_MOCK) {
    await mockDelay();
    // Tu frontend ya hace el cálculo en Mediciones.jsx
    // Pero cuando conectes al backend, este endpoint te lo dará listo
    return MOCK_MEDICIONES.filter(m => m.predio.toString() === predioId);
  } else {
    const response = await axios.get(
      `${BACKEND_URL}/api/mediciones/promedios-semanales/?predio=${predioId}`
    );
    return response.data;
  }
};

// 🆕 NUEVO: Generar recomendación por semana
export const generarRecomendacionSemanal = async (predioId, semanaInicio) => {
  if (USE_MOCK) {
    await mockDelay(1000);
    console.log('Generando recomendación semanal (mock):', predioId, semanaInicio);
    return MOCK_RECOMENDACIONES;
  } else {
    const response = await axios.post(
      `${BACKEND_URL}/api/recomendaciones/generar-por-semana/`,
      {
        predio_id: predioId,
        semana_inicio: semanaInicio
      }
    );
    return response.data;
  }
};
