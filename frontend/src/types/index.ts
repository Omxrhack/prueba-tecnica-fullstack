// /frontend/src/types/index.ts

export type Rol = 'MAESTRO' | 'CONTROL_ESCOLAR';

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
    fecha_nacimiento?: string;
}

export interface Materia {
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
}

export interface CalificacionDetalle {
    calificacion_id: number;
    materia: string;
    nota: string; // La nota es un string/decimal en JS
    fecha_registro: string;
}