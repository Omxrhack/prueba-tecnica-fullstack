// frontend/src/services/alumno.service.ts
import api from './api';

export interface CalificacionUnidad {
    unidad: number;
    nota: number;
    observaciones?: string;
    fecha_registro: string;
}

export interface CalificacionAlumno {
    materia: {
        id: number;
        nombre: string;
        codigo: string;
        descripcion?: string;
        semestre: number;
    };
    maestro: {
        id: number;
        nombre: string;
    } | null;
    unidades: CalificacionUnidad[];
    promedio_materia: number;
    activa?: number; // 1 = cursando, 0 = no cursando
    cursando?: boolean; // boolean para compatibilidad
}

export interface MateriaPorSemestre {
    cursadas: CalificacionAlumno[];
    cursando: CalificacionAlumno[]; // Nuevo: materias activas (cursando)
    faltantes: {
        materia: {
            id: number;
            nombre: string;
            codigo: string;
            descripcion?: string;
            semestre: number;
        };
    }[];
    promedio_semestre: number;
}

export interface MisCalificacionesResponse {
    message: string;
    data: {
        alumno: {
            id: number;
            nombre: string;
            matricula: string;
            grupo: string;
            semestre_actual: number;
        };
        calificaciones: CalificacionAlumno[];
        materias_cursando: CalificacionAlumno[]; // Nuevo: todas las materias activas
        materias_por_semestre: { [key: number]: MateriaPorSemestre };
        promedio_general: number;
        promedio_general_semestres: number;
        total_materias: number;
        total_materias_cursando: number; // Nuevo: total de materias activas
        total_semestres: number;
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
        unidades: CalificacionUnidad[];
        promedio_materia: number;
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
