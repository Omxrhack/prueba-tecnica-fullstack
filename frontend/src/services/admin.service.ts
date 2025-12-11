// /frontend/src/services/admin.service.ts
import api from './api';
import axios from 'axios';
import type { AxiosError } from 'axios';
import type { User } from '../types'; // Importamos User para tipar

/**
 * Estructura esperada por el reporte global
 */
export interface ReporteItem {
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
    };
    promedio_general: string; // viene como fixed(2)
}

interface AsignacionPayload {
    maestro_id: number;
    materia_id: number;
    cupo_maximo?: number;
}

/**
 * Extrae un mensaje legible de una posible respuesta de error del servidor.
 */
function extractServerMessage(data: any, errMsgFallback?: string) {
    if (!data) return errMsgFallback ?? 'Error desconocido del servidor';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.msg) return data.msg;
        // errores en forma { errors: { campo: ['msg'] } }
        if (data.errors) {
            if (Array.isArray(data.errors)) return data.errors.join(', ');
            if (typeof data.errors === 'object') {
                return Object.values(data.errors)
                    .flat()
                    .join(', ');
            }
        }
    }
    return errMsgFallback ?? 'Error desconocido del servidor';
}

/**
 * Función base para manejar reintentos en Axios.
 */
const withRetry = async <T>(apiCall: () => Promise<T>, fallbackMsg: string): Promise<T> => {
    const doCall = async (attempt = 1) => {
        try {
            return await apiCall();
        } catch (err: any) {
            const isAxios = axios.isAxiosError(err);
            const canRetry =
                isAxios &&
                attempt < 2 && // Solo reintentamos una vez
                (!err.response || err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout'));

            if (canRetry) {
                console.warn(`[API] Reintento en ${fallbackMsg}...`);
                return doCall(attempt + 1);
            }

            if (isAxios) {
                const status = (err as AxiosError).response?.status ?? 'desconocido';
                const serverMsg = extractServerMessage((err as AxiosError).response?.data, err.message);
                throw new Error(`${fallbackMsg}: ${serverMsg} (status ${status})`);
            }
            throw new Error(err?.message ?? fallbackMsg);
        }
    };
    return doCall();
};


/**
 * 1. OBTENER REPORTE GLOBAL
 * GET /api/controlescolar/reporte
 */
export const getReporteGlobal = async (): Promise<ReporteItem[]> => {
    const apiCall = async () => {
        const res = await api.get<{ data: ReporteItem[] }>('/controlescolar/reporte', {
            timeout: 12000,
        });
        return res.data.data;
    };
    return withRetry(apiCall, 'Error al obtener reporte');
};


/**
 * 2. ACTUALIZAR CALIFICACIÓN (PATCH /calificaciones/{materiaID}/{alumnoID})
 * Nota: La validación es para escala 0-10.
 */
export const updateCalificacionAdmin = async (
    materiaID: number,
    alumnoID: number,
    nota: number,
    observaciones?: string
) => {
    // Validaciones locales
    if (!Number.isFinite(materiaID) || materiaID <= 0) {
        throw new Error('IDs inválidos (materia).');
    }
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) {
        throw new Error('IDs inválidos (alumno).');
    }
    // 🚨 VALIDACIÓN CRÍTICA: NOTA DE 0 A 10
    if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
        throw new Error('Nota inválida. Debe ser un número entre 0 y 10.');
    }

    const payload = {
        nota: Number(nota.toFixed(2)), // Enviar a 2 decimales para precisión
        ...(observaciones ? { observaciones } : {}),
    };

    const apiCall = async () => {
        const response = await api.patch(`/controlescolar/calificaciones/${materiaID}/${alumnoID}`, payload, {
            timeout: 15000,
        });
        return response.data;
    };
    return withRetry(apiCall, 'Error al actualizar calificación');
};


/**
 * 3. ELIMINAR CALIFICACIÓN (DELETE /calificaciones/{materiaID}/{alumnoID})
 */
export const deleteCalificacionAdmin = async (materiaID: number, alumnoID: number) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) {
        throw new Error('IDs inválidos (materia).');
    }
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) {
        throw new Error('IDs inválidos (alumno).');
    }

    const apiCall = async () => {
        const res = await api.delete(`/controlescolar/calificaciones/${materiaID}/${alumnoID}`, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al eliminar calificación');
};


/**
 * 4. ASIGNAR MATERIA A MAESTRO (POST /asignacion)
 */
export const asignarMateriaMaestro = async (payload: AsignacionPayload) => {
    const apiCall = async () => {
        const res = await api.post('/controlescolar/asignacion', payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al asignar materia');
};