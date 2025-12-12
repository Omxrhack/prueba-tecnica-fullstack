// frontend/src/services/alumno.service.ts
import api from './api';

export interface CalificacionAlumno {
    id: number;
    materia: {
        id: number;
        nombre: string;
        codigo: string;
        descripcion?: string;
    };
    maestro: {
        id: number;
        nombre: string;
    } | null;
    nota: number;
    observaciones: string;
    fecha_registro: string;
}

export interface MisCalificacionesResponse {
    message: string;
    data: {
        alumno: {
            id: number;
            nombre: string;
            matricula: string;
            grupo: string;
        };
        calificaciones: CalificacionAlumno[];
        promedio_general: number;
        total_materias: number;
    };
}

export interface CalificacionPorMateriaResponse {
    message: string;
    data: {
        materia: {
            id: number;
            nombre: string;
            codigo: string;
            descripcion?: string;
        };
        maestro: {
            id: number;
            nombre: string;
        } | null;
        nota: number;
        observaciones: string;
        fecha_registro: string;
    };
}

export interface PromedioResponse {
    message: string;
    data: {
        alumno: {
            id: number;
            nombre: string;
            matricula: string;
            grupo: string;
        };
        promedio_general: number;
        total_materias: number;
        nota_minima: string | null;
        nota_maxima: string | null;
    };
}

/**
 * Obtiene todas las calificaciones del alumno autenticado
 */
export const getMisCalificaciones = async (): Promise<MisCalificacionesResponse['data']> => {
    const response = await api.get<MisCalificacionesResponse>('/alumno/calificaciones');
    return response.data.data;
};

/**
 * Obtiene la calificación del alumno para una materia específica
 */
export const getCalificacionPorMateria = async (materiaID: number): Promise<CalificacionPorMateriaResponse['data']> => {
    const response = await api.get<CalificacionPorMateriaResponse>(`/alumno/calificaciones/${materiaID}`);
    return response.data.data;
};

/**
 * Obtiene el promedio general y estadísticas del alumno
 */
export const getMiPromedio = async (): Promise<PromedioResponse['data']> => {
    const response = await api.get<PromedioResponse>('/alumno/promedio');
    return response.data.data;
};
