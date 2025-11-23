
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;  // URL del backend

// ═══════════════════════════════════════════════════════

// Función auxiliar para simular delay de red
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════
// 🔐 MANEJO DEL TOKEN DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════

// Variable para mantener el token accesible de forma síncrona
let currentAccessToken = null;

// Función para que AuthContext actualice el token
export const setAuthToken = (token) => {
  currentAccessToken = token;
};

// ═══════════════════════════════════════════════════════
// 🔐 CONFIGURACIÓN DE AXIOS CON TOKEN DE SUPABASE
// ═══════════════════════════════════════════════════════

// Interceptor para agregar el token a todas las peticiones
axios.interceptors.request.use(
  async (config) => {
    if (USE_MOCK) {
      return config;
    }

    // 1. Intentar usar el token de la variable global
    let token = currentAccessToken;

    // 2. Si no hay token global, intentar obtenerlo de Supabase (fallback)
    if (!token) {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
      if (token) {
        setAuthToken(token); // Actualizar global
      }
    }

    // 3. Si tenemos token, agregarlo al header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Solo cerrar sesión si realmente no hay token válido
      // No cerrar sesión si es solo un problema temporal de carga
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No hay sesión, redirigir al login
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        // Hay sesión pero el token puede estar expirado, intentar refrescar
        console.warn('Token puede estar expirado, intentando refrescar sesión');
      }
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════
// 🔐 AUTENTICACIÓN (ahora manejada por Supabase)
// ═══════════════════════════════════════════════════════

// Esta función ya no se usa, pero la mantenemos por compatibilidad
export const login = async (email, password) => {
  if (USE_MOCK) {
    await mockDelay();
    return {
      token: 'mock-token-123',
      user: MOCK_USER
    };
  } else {
    // La autenticación ahora se maneja en Login.jsx con useAuth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  }
};

// ═══════════════════════════════════════════════════════
// 👤 PERFIL
// ═══════════════════════════════════════════════════════

export const getProfile = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return { ...MOCK_USER, role: 'admin' }; // Mock admin role
  } else {
    const response = await axios.get(`${BACKEND_URL}/api/profiles/me/`);
    return response.data;
  }
};

export const updateProfile = async (id, data) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Perfil actualizado (mock):', id, data);
    return { id, ...data };
  } else {
    const response = await axios.patch(`${BACKEND_URL}/api/profiles/${id}/`, data);
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

// ✅ ACTUALIZADO: getMediciones ahora acepta un objeto de parámetros
export const getMediciones = async (params = {}) => {
  if (USE_MOCK) {
    await mockDelay();
    let resultado = MOCK_MEDICIONES;

    if (params.predio) {
      resultado = resultado.filter(m => m.predio.toString() === params.predio);
    }
    if (params.fecha_gte) {
      resultado = resultado.filter(m => new Date(m.fecha) >= new Date(params.fecha_gte));
    }
    if (params.fecha_lte) {
      resultado = resultado.filter(m => new Date(m.fecha) <= new Date(params.fecha_lte));
    }

    return resultado;
  } else {
    const urlParams = new URLSearchParams();
    for (const key in params) {
      if (params[key]) {
        urlParams.append(key, params[key]);
      }
    }

    let url = `${BACKEND_URL}/api/mediciones/`;
    if (urlParams.toString()) {
      url += `?${urlParams.toString()}`;
    }

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

export const updateMedicion = async (id, data) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Medición actualizada (mock):', id, data);
    return { id, ...data };
  } else {
    const response = await axios.put(`${BACKEND_URL}/api/mediciones/${id}/`, data);
    return response.data;
  }
};

export const deleteMedicion = async (id) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Medición eliminada (mock):', id);
    return { message: 'Eliminado' };
  } else {
    const response = await axios.delete(`${BACKEND_URL}/api/mediciones/${id}/`);
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

// ═══════════════════════════════════════════════════════
// 📈 RECOMENDACIONES (Individuales)
// ═══════════════════════════════════════════════════════

export const createRecomendacionIndividual = async (medicionId) => {
  if (USE_MOCK) {
    await mockDelay(1000);
    console.log('Generando recomendación individual (mock):', medicionId);
    return MOCK_RECOMENDACIONES[0]; // Retorna una mock recomendación
  } else {
    const response = await axios.post(
      `${BACKEND_URL}/api/recomendaciones/generar-individual/`,
      { medicion_id: medicionId }
    );
    return response.data;
  }
};

export const getRecomendacionDetail = async (id) => {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_RECOMENDACIONES.find(rec => rec.id === id) || MOCK_RECOMENDACIONES[0];
  } else {
    const response = await axios.get(`${BACKEND_URL}/api/recomendaciones/${id}/`);
    return response.data;
  }
};

export const getRecomendaciones = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return MOCK_RECOMENDACIONES; // Retorna todas las recomendaciones mock
  } else {
    const response = await axios.get(`${BACKEND_URL}/api/recomendaciones/`);
    return response.data;
  }
};


// ═══════════════════════════════════════════════════════
// 👥 GESTIÓN DE USUARIOS (ADMIN)
// ═══════════════════════════════════════════════════════

export const getAdminUsers = async () => {
  if (USE_MOCK) {
    await mockDelay();
    return [MOCK_USER]; // Retornar lista mock
  } else {
    const response = await axios.get(`${BACKEND_URL}/api/admin/users/`);
    return response.data;
  }
};

export const createAdminUser = async (data) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Usuario creado (mock):', data);
    return { id: 'new-id', ...data };
  } else {
    const response = await axios.post(`${BACKEND_URL}/api/admin/users/`, data);
    return response.data;
  }
};

export const updateAdminUser = async (id, data) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Usuario actualizado (mock):', id, data);
    return { id, ...data };
  } else {
    const response = await axios.put(`${BACKEND_URL}/api/admin/users/${id}/`, data);
    return response.data;
  }
};

export const suspendAdminUser = async (id) => {
  if (USE_MOCK) {
    await mockDelay();
    console.log('Usuario suspendido (mock):', id);
    return { message: 'Suspendido' };
  } else {
    const response = await axios.delete(`${BACKEND_URL}/api/admin/users/${id}/`);
    return response.data;
  }
};
