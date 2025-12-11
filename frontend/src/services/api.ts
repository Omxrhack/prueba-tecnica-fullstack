// /frontend/src/services/api.ts
import axios from 'axios';

// Asegúrate de que esta URL coincida con tu .env o Docker Compose
// En Docker Compose usamos VITE_API_URL, si ejecutas en local, define esta variable.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// INTERCEPTOR DE SOLICITUDES: Adjuntar el token JWT automáticamente
api.interceptors.request.use((config) => {
    // 1. Obtener el token del almacenamiento local (o de un estado global como Redux/Context)
    const token = localStorage.getItem('token');

    // 2. Si existe un token, adjuntarlo al header de Autorización
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// INTERCEPTOR DE RESPUESTAS: Manejar errores globales, como token expirado (403/401)
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
        console.error("Token expirado o inválido. Redirigiendo a Login...");

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    return Promise.reject(error);
});


export default api;