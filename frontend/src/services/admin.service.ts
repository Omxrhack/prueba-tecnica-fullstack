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
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
    };
    unidades: {
        unidad: number;
        nota: number;
        observaciones?: string;
        maestro?: {
            id: number;
            nombre: string;
        };
    }[];
    promedio_materia: number;
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
    observaciones?: string,
    unidad?: number
) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) throw new Error('IDs inválidos.');
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('IDs inválidos.');
    if (!Number.isFinite(nota) || nota < 0 || nota > 10) throw new Error('Nota inválida (0-10).');

    const payload: { nota: number; observaciones?: string; unidad?: number } = {
        nota: Number(nota.toFixed(2))
    };
    if (observaciones) payload.observaciones = observaciones;
    if (unidad) payload.unidad = unidad;

    const endpoint = unidad
        ? `/controlescolar/calificaciones/${materiaID}/${alumnoID}/${unidad}`
        : `/controlescolar/calificaciones/${materiaID}/${alumnoID}`;

    const apiCall = async () => {
        const response = await api.patch(endpoint, payload, {
            timeout: 15000,
        });
        return response.data;
    };
    return withRetry(apiCall, 'Error al actualizar calificación');
};

// 4. ELIMINAR CALIFICACIÓN (DELETE)
export const deleteCalificacionAdmin = async (materiaID: number, alumnoID: number, unidad?: number) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) throw new Error('IDs inválidos.');
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('IDs inválidos.');

    const endpoint = unidad
        ? `/controlescolar/calificaciones/${materiaID}/${alumnoID}/${unidad}`
        : `/controlescolar/calificaciones/${materiaID}/${alumnoID}`;

    const apiCall = async () => {
        const res = await api.delete(endpoint, {
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
    semestre?: number;
}

export interface UpdateMateriaPayload {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    semestre?: number;
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

// 13. ACTUALIZAR MATERIA (PATCH)
export const updateMateriaAdmin = async (materiaID: number, payload: UpdateMateriaPayload) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) throw new Error('ID de materia inválido.');

    const apiCall = async () => {
        const res = await api.patch(`/controlescolar/materias/${materiaID}`, payload, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al actualizar materia');
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

// 14. ASIGNAR MATERIAS A ALUMNO (POST)
export interface AsignarMateriasPayload {
    materia_ids: number[];
}

export interface AsignarMateriasResponse {
    message: string;
    data: {
        alumno: {
            id: number;
            nombre: string;
            matricula: string;
        };
        materias_asignadas: number;
        materias_ya_inscritas: number;
        materias_nuevas: Array<{
            id: number;
            nombre: string;
            codigo: string;
            maestro: {
                id: number;
                nombre: string;
            } | null;
        }>;
    };
}

export const asignarMateriasAAlumno = async (alumnoID: number, payload: AsignarMateriasPayload) => {
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('ID de alumno inválido.');
    if (!payload.materia_ids || !Array.isArray(payload.materia_ids) || payload.materia_ids.length === 0) {
        throw new Error('Debe proporcionar al menos una materia para asignar.');
    }

    const apiCall = async () => {
        const res = await api.post<AsignarMateriasResponse>(`/controlescolar/alumnos/${alumnoID}/materias`, payload);
        return res.data;
    };
    return withRetry(apiCall, 'Error al asignar materias al alumno');
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

// 11. ELIMINAR ALUMNO (DELETE)
export const deleteAlumnoAdmin = async (alumnoID: number) => {
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('ID de alumno inválido.');

    const apiCall = async () => {
        const res = await api.delete(`/controlescolar/alumnos/${alumnoID}`, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al eliminar alumno');
};

// 12. ELIMINAR MATERIA (DELETE)
export const deleteMateriaAdmin = async (materiaID: number) => {
    if (!Number.isFinite(materiaID) || materiaID <= 0) throw new Error('ID de materia inválido.');

    const apiCall = async () => {
        const res = await api.delete(`/controlescolar/materias/${materiaID}`, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al eliminar materia');
};

// 14. ACTUALIZAR MAESTRO (PATCH)
export interface UpdateMaestroPayload {
    nombre?: string;
    email?: string;
    password?: string;
}

export const updateMaestroAdmin = async (maestroID: number, payload: UpdateMaestroPayload) => {
    if (!Number.isFinite(maestroID) || maestroID <= 0) throw new Error('ID de maestro inválido.');

    const apiCall = async () => {
        const res = await api.patch(`/controlescolar/maestros/${maestroID}`, payload, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al actualizar maestro');
};

// 15. ACTUALIZAR ALUMNO (PATCH)
export interface UpdateAlumnoPayload {
    nombre?: string;
    matricula?: string;
    grupo?: string;
    fecha_nacimiento?: string;
    semestre?: number;
    usuario_id?: number | null;
}

export const updateAlumnoAdmin = async (alumnoID: number, payload: UpdateAlumnoPayload) => {
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('ID de alumno inválido.');

    const apiCall = async () => {
        const res = await api.patch(`/controlescolar/alumnos/${alumnoID}`, payload, {
            timeout: 12000,
        });
        return res.data;
    };
    return withRetry(apiCall, 'Error al actualizar alumno');
};

// 16. OBTENER DETALLE DE ALUMNO (GET)
export interface DetalleAlumnoResponse {
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
        semestre_actual: number;
    };
    calificaciones: Array<{
        materia: {
            id: number;
            nombre: string;
            codigo: string;
            semestre: number;
        };
        maestro: {
            id: number;
            nombre: string;
        } | null;
        unidades: Array<{
            unidad: number;
            nota: number;
            observaciones?: string;
        }>;
        promedio_materia: number;
        activa?: number; // 1 = cursando, 0 = no cursando
        cursando?: boolean;
    }>;
    materias_cursando?: Array<{
        materia: {
            id: number;
            nombre: string;
            codigo: string;
            semestre: number;
        };
        maestro: {
            id: number;
            nombre: string;
        } | null;
        unidades: Array<{
            unidad: number;
            nota: number;
            observaciones?: string;
        }>;
        promedio_materia: number;
        activa?: number;
        cursando?: boolean;
    }>;
    materias_por_semestre: Record<number, {
        cursadas: Array<{
            materia: {
                id: number;
                nombre: string;
                codigo: string;
                semestre: number;
            };
            maestro: {
                id: number;
                nombre: string;
            } | null;
            unidades: Array<{
                unidad: number;
                nota: number;
                observaciones?: string;
            }>;
            promedio_materia: number;
            activa?: number;
            cursando?: boolean;
        }>;
        cursando?: Array<{
            materia: {
                id: number;
                nombre: string;
                codigo: string;
                semestre: number;
            };
            maestro: {
                id: number;
                nombre: string;
            } | null;
            unidades: Array<{
                unidad: number;
                nota: number;
                observaciones?: string;
            }>;
            promedio_materia: number;
            activa?: number;
            cursando?: boolean;
        }>;
        faltantes: Array<{ materia: { id: number; nombre: string; codigo: string; semestre: number } }>;
        promedio_semestre: number;
    }>;
    promedio_general: number;
    promedio_general_semestres: number;
    total_materias_cursadas: number;
    total_materias_cursando?: number;
    total_semestres: number;
}

export const getDetalleAlumnoAdmin = async (alumnoID: number): Promise<DetalleAlumnoResponse> => {
    if (!Number.isFinite(alumnoID) || alumnoID <= 0) throw new Error('ID de alumno inválido.');

    const apiCall = async () => {
        const res = await api.get<{ data: DetalleAlumnoResponse }>(`/controlescolar/alumnos/${alumnoID}/detalle`, {
            timeout: 12000,
        });
        return res.data.data;
    };
    return withRetry(apiCall, 'Error al obtener detalle del alumno');
};
