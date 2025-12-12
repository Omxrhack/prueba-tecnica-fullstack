import api from './api';
import type { Materia, User } from '../types';

// Definimos un tipo simplificado para los usuarios que son Maestros
export interface MaestroListItem extends User {
    // Solo necesitamos id y nombre para la lista
}

/**
 * 1. Obtiene la lista completa de Materias.
 * GET /api/materias
 */
export const getMaterias = async (): Promise<Materia[]> => {
    // Asumimos que el backend retorna { data: Materia[] }
    const response = await api.get<{ data: Materia[] }>('/materias');
    return response.data.data;
};

/**
 * 2. Obtiene la lista de Maestros (Usuarios con rol MAESTRO).
 * Suponemos que tienes un endpoint para listar usuarios filtrables.
 * Si no tienes un endpoint específico, usaríamos /api/usuarios/list
 */
export const getMaestros = async (): Promise<MaestroListItem[]> => {
    // Usaremos un endpoint para listar todos los usuarios y el Front-end filtra
    // Si tu Backend tiene un endpoint: /api/usuarios?rol=MAESTRO, úsalo aquí.
    const response = await api.get<{ data: User[] }>('/usuarios/list');

    // Filtramos para asegurar que solo se muestren los Maestros
    const maestros = response.data.data.filter(u => u.rol === 'MAESTRO');

    // Proyectamos el resultado para simplificar el tipo
    return maestros.map(m => ({
        id: m.id,
        nombre: m.nombre,
        email: m.email,
        rol: m.rol
    })) as MaestroListItem[];
};

/**
 * 3. Obtiene todas las calificaciones de una Materia (Usado en Admin Dashboard).
 * Nota: El endpoint ideal sería /api/controlescolar/calificaciones/{materiaID}
 * Usaremos la función placeholder temporal hasta que ese endpoint se implemente.
 * * Por ahora, la lógica de carga en AdminDashboard.tsx usa datos placeholder para simular este resultado.
 * Si decides implementar este endpoint en el Backend, reemplaza el código placeholder.
 */
// export const getCalificacionesByMateria = async (materiaID: number) => { ... }


/**
 * 3. Obtiene la lista completa de Alumnos.
 * GET /api/alumnos/list
 */
export interface AlumnoListItem {
    id: number;
    nombre: string;
    matricula: string;
    grupo: string;
    semestre?: number;
    usuario_id?: number | null;
}

export const getAlumnos = async (): Promise<AlumnoListItem[]> => {
    const response = await api.get<{ data: AlumnoListItem[] }>('/alumnos/list');
    return response.data.data;
};

/**
 * Obtiene la lista de usuarios con rol ALUMNO que no tienen un alumno vinculado.
 * GET /api/usuarios/list
 */
export const getUsuariosAlumnosDisponibles = async (): Promise<User[]> => {
    const response = await api.get<{ data: User[] }>('/usuarios/list');
    // Filtrar solo usuarios con rol ALUMNO
    return response.data.data.filter(u => u.rol === 'ALUMNO');
};

// Exportamos solo los servicios esenciales que necesita la UI.