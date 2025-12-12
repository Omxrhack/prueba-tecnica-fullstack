// frontend/src/services/maestro.service.ts
import api from './api';

export interface MateriaAsignada {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    cupo_maximo: number;
}

export interface AlumnoCalificacion {
    id: number;
    nombre: string;
    matricula: string;
    grupo: string;
    calificaciones: {
        calificacion_id: number;
        materia: string;
        nota: number | string;
        fecha_registro: string;
    }[];
}

export interface AlumnoPorMateria {
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
    };
    calificaciones: {
        unidad: number;
        nota: number;
        observaciones?: string;
        fecha_registro: string;
    }[];
    promedio_materia: number;
    unidades_calificadas: number;
}

export interface DetalleAlumno {
    alumno: {
        id: number;
        nombre: string;
        matricula: string;
        grupo: string;
        fecha_nacimiento?: string;
    };
    materia: {
        id: number;
        nombre: string;
        codigo: string;
        descripcion?: string;
    };
    calificaciones: {
        unidad: number;
        nota: number;
        observaciones?: string;
        fecha_registro: string;
        fecha_actualizacion: string;
    }[];
    promedio_materia: number;
}

/**
 * Obtiene las materias asignadas al maestro autenticado
 * GET /api/maestro/materias
 */
export const getMateriasAsignadas = async (): Promise<MateriaAsignada[]> => {
    const response = await api.get<{ data: MateriaAsignada[], message?: string }>('/maestro/materias');
    return response.data.data || [];
};

/**
 * Obtiene los alumnos asignados al maestro con sus calificaciones
 * GET /api/maestro/alumnos
 */
export const getAlumnosAsignados = async (): Promise<AlumnoCalificacion[]> => {
    const response = await api.get<{ data: AlumnoCalificacion[] }>('/maestro/alumnos');
    return response.data.data;
};

/**
 * Obtiene los alumnos de una materia específica
 * GET /api/maestro/alumnos/{materiaID}
 */
export const getAlumnosPorMateria = async (materiaID: number): Promise<AlumnoPorMateria[]> => {
    const response = await api.get<{ data: AlumnoPorMateria[] }>(`/maestro/alumnos/${materiaID}`);
    return response.data.data;
};

/**
 * Obtiene el detalle de un alumno específico en una materia
 * GET /api/maestro/alumnos/{materiaID}/{alumnoID}
 */
export const getDetalleAlumno = async (materiaID: number, alumnoID: number): Promise<DetalleAlumno> => {
    const response = await api.get<{ data: DetalleAlumno }>(`/maestro/alumnos/${materiaID}/${alumnoID}`);
    return response.data.data;
};

/**
 * Registra o actualiza una calificación por unidad
 * POST /api/maestro/calificaciones/{materiaID}/{alumnoID}
 */
export const registrarCalificacion = async (
    materiaID: number,
    alumnoID: number,
    nota: number,
    unidad: number,
    observaciones?: string
): Promise<any> => {
    const payload: { nota: number; unidad: number; observaciones?: string } = { nota, unidad };
    if (observaciones) {
        payload.observaciones = observaciones;
    }

    const response = await api.post(`/maestro/calificaciones/${materiaID}/${alumnoID}`, payload);
    return response.data;
};
