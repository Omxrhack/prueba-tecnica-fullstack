// /frontend/src/services/admin.service.ts
import api from './api';
import axios from 'axios';
import type { AxiosError } from 'axios';

/**
 * INTERFACES
 */

// Estructura para el reporte global (Lista de promedios)
export interface ReporteItem {
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
    };
    promedio_general: string;
}

// Estructura para la vista detallada de calificaciones por materia
export interface CalificacionMateriaItem {
    id: number;
    nota: string; // El backend suele devolver decimales como string
    observaciones: string;
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
    };
    maestro?: {
        id: number;
        nombre: string;
    };
}

interface AsignacionPayload {
    maestro_id: number;
    materia_id: number;
    cupo_maximo?: number;
}

interface MaestroPayload {
    nombre: string;
    email: string;
    password?: string;
}

interface AlumnoPayload {
    nombre: string;
    matricula: string;
    grupo: string;
    fecha_nacimiento?: string;
}

/**
 * HELPERS DE ERROR
 */
function extractServerMessage(data: any, errMsgFallback?: string) {
    if (!data) return errMsgFallback ?? 'Error desconocido del servidor';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.msg) return data.msg;
        if (data.errors) {
            if (Array.isArray(data.errors)) return data.errors.join(', ');
            if (typeof data.errors === 'object') {
                return Object.values(data.errors).flat().join(', ');
            }
        }
    }
    return errMsgFallback ?? 'Error desconocido del servidor';
}

const withRetry = async <T>(apiCall: () => Promise<T>, fallbackMsg: string): Promise<T> => {
    const doCall = async (attempt = 1) => {
        try {
            return await apiCall();
        } catch (err: any) {
            const isAxios = axios.isAxiosError(err);
            const canRetry =
                isAxios &&
                attempt < 2 &&
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
 * SERVICIOS
 */


// 1. OBTENER REPORTE GLOBAL
export const getReporteGlobal = async (): Promise<ReporteItem[]> => {
    const apiCall = async () => {
        const res = await api.get<{ data: ReporteItem[] }>('/controlescolar/reporte', {
            timeout: 12000,
        });
        return res.data.data;
    };
    return withRetry(apiCall, 'Error al obtener reporte');
};

// 2. OBTENER CALIFICACIONES POR MATERIA (Detalle)
// Se asume que existe un endpoint filtrado o se usa el reporte filtrado en backend
export const getCalificacionesPorMateria = async (materiaID: number): Promise<CalificacionMateriaItem[]> => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) return [];

    const apiCall = async () => {
        // Ajusta esta ruta si tu backend usa otra (ej: /controlescolar/calificaciones/materia/:id)
        // Por ahora usamos /reporte/:id asumiendo que el backend lo soporta o fue creado.
        const res = await api.get<{ data: CalificacionMateriaItem[] }>(`/controlescolar/reporte/${materiaID}`, {
            timeout: 12000,
        });
        return res.data.data;
    };
    return withRetry(apiCall, 'Error al obtener detalle de materia');
};

// 3. ACTUALIZAR CALIFICACIÓN (PATCH)
export const updateCalificacionAdmin = async (
    materiaID: number,
    alumnoID: number,
    nota: number,
    observaciones?: string
) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) throw new Error('IDs inválidos.');
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('IDs inválidos.');

    // Validación 0-10
    if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
        throw new Error('Nota inválida. Debe ser un número entre 0 y 10.');
    }

    const payload = {
        nota: Number(nota.toFixed(2)),
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

// 4. ELIMINAR CALIFICACIÓN (DELETE)
export const deleteCalificacionAdmin = async (materiaID: number, alumnoID: number) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) throw new Error('IDs inválidos.');
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('IDs inválidos.');

    const apiCall = async () => {
        const res = await api.delete(`/controlescolar/calificaciones/${materiaID}/${alumnoID}`, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al eliminar calificación');
};

// 5. ASIGNAR MATERIA A MAESTRO (POST)
export const asignarMateriaMaestro = async (payload: AsignacionPayload) => {
    const apiCall = async () => {
        const res = await api.post('/controlescolar/asignacion', payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al asignar materia');
};

// 6. CREAR MAESTRO (POST)
export const crearMaestro = async (payload: MaestroPayload) => {
    const apiCall = async () => {
        const res = await api.post('/controlescolar/maestros', payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al crear maestro');
};

// 7. CREAR ALUMNO (POST)
export const crearAlumno = async (payload: AlumnoPayload) => {
    const apiCall = async () => {
        const res = await api.post('/controlescolar/alumnos', payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al crear alumno');
};

// 8. CREAR MATERIA (POST) - Ahora con asignación opcional de maestro
export interface CrearMateriaPayload {
    nombre: string;
    codigo: string;
    descripcion?: string;
    maestro_id?: number;
    cupo_maximo?: number;
}

export interface CrearMateriaResponse {
    message: string;
    data: {
        materia: {
            id: number;
            nombre: string;
            codigo: string;
            descripcion?: string;
        };
        asignacion?: {
            id: number;
            maestro_id: number;
            materia_id: number;
            cupo_maximo: number;
        } | null;
    };
}

export const crearMateria = async (payload: CrearMateriaPayload) => {
    const apiCall = async () => {
        const res = await api.post<CrearMateriaResponse>('/controlescolar/materias', payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al crear materia');
};

// 10. ASIGNAR ALUMNOS A MATERIA (POST)
export interface AsignarAlumnosPayload {
    alumno_ids: number[];
    maestro_id: number;
}

export interface AsignarAlumnosResponse {
    message: string;
    data: {
        materia: {
            id: number;
            nombre: string;
            codigo: string;
        };
        alumnos_asignados: number;
        alumnos_ya_inscritos: number;
        cupo_disponible: number;
        cupo_maximo: number;
    };
}

export const asignarAlumnosAMateria = async (materiaID: number, payload: AsignarAlumnosPayload) => {
    const apiCall = async () => {
        const res = await api.post<AsignarAlumnosResponse>(`/controlescolar/materias/${materiaID}/alumnos`, payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al asignar alumnos a la materia');
};

// 9. CREAR USUARIO (POST) - Universal para maestros, alumnos y admins
export interface CrearUsuarioPayload {
    nombre: string;
    email: string;
    password: string;
    rol: 'MAESTRO' | 'CONTROL_ESCOLAR' | 'ALUMNO';
    matricula?: string;
    grupo?: string;
    semestre?: number;
    fecha_nacimiento?: string;
}

export const crearUsuario = async (payload: CrearUsuarioPayload) => {
    const apiCall = async () => {
        const res = await api.post('/controlescolar/usuarios', payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al crear usuario');
};
