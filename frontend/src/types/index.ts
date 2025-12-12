// /frontend/src/types/index.ts

export type Rol = 'MAESTRO' | 'CONTROL_ESCOLAR' | 'ALUMNO';

export interface User {
    id: number;
    nombre: string;
    email: string;
    rol: Rol;
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export interface Alumno {
    id: number;
    nombre: string;
    matricula: string;
    grupo: string;
    semestre?: number;
    fecha_nacimiento?: string;
}

export interface Materia {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    semestre?: number;
}

export interface CalificacionUnidad {
    unidad: number;
    nota: number;
    observaciones?: string;
    fecha_registro?: string;
    fecha_actualizacion?: string;
    maestro?: {
        id: number;
        nombre: string;
    };
}

export interface CalificacionDetalle {
    calificacion_id: number;
    materia: string;
    nota: string;
    fecha_registro: string;
}