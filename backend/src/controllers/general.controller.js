const { Materia, Usuario, Alumno } = require('../models');
const { Op } = require('sequelize'); // Útil si queremos filtrar por rol en el futuro

const GeneralController = {
    
    /**
     * 1. Obtiene la lista completa de Materias para selectores.
     * GET /api/materias
     */
    async getMaterias(req, res) {
        try {
            // Obtener ID, nombre, código y semestre (sin límite, todas las materias)
            const materias = await Materia.findAll({ 
                attributes: ['id', 'nombre', 'codigo', 'descripcion', 'semestre'],
                order: [['semestre', 'ASC'], ['nombre', 'ASC']]
            });
            
            console.log(`[getMaterias] Total de materias encontradas: ${materias.length}`);
            
            res.json({
                message: 'Lista de materias obtenida con éxito.',
                data: materias
            });
        } catch (error) {
            console.error('Error al obtener materias:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * 2. Obtiene la lista completa de Usuarios (Maestros y Admin) para selectores.
     * GET /api/usuarios/list
     */
    async getUsuariosList(req, res) {
        try {
            // Obtenemos todos los usuarios, excluyendo el hash de la contraseña (sin límite)
            const usuarios = await Usuario.findAll({ 
                attributes: ['id', 'nombre', 'email', 'rol'],
                order: [['rol', 'ASC'], ['nombre', 'ASC']]
            });
            
            console.log(`[getUsuariosList] Total de usuarios encontrados: ${usuarios.length}`);
            const maestrosCount = usuarios.filter(u => u.rol === 'MAESTRO').length;
            console.log(`[getUsuariosList] Maestros: ${maestrosCount}, Alumnos: ${usuarios.filter(u => u.rol === 'ALUMNO').length}, Admin: ${usuarios.filter(u => u.rol === 'CONTROL_ESCOLAR').length}`);
            
            res.json({
                message: 'Lista de usuarios obtenida con éxito.',
                data: usuarios
            });
        } catch (error) {
            console.error('Error al obtener lista de usuarios:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * 3. Obtiene la lista completa de Alumnos para selectores.
     * GET /api/alumnos/list
     */
    async getAlumnosList(req, res) {
        try {
            // Obtener todos los alumnos (sin soft delete, incluir todos)
            const alumnos = await Alumno.findAll({ 
                attributes: ['id', 'nombre', 'matricula', 'grupo', 'semestre', 'usuario_id'],
                order: [['nombre', 'ASC']],
                paranoid: false // Incluir todos los alumnos incluso si están eliminados temporalmente
            });
            
            // Filtrar solo los activos (sin deleted_at) para el frontend
            const alumnosActivos = alumnos.filter(a => !a.deleted_at);
            
            console.log(`[getAlumnosList] Total de alumnos encontrados: ${alumnos.length} (activos: ${alumnosActivos.length})`);
            
            res.json({
                message: 'Lista de alumnos obtenida con éxito.',
                data: alumnosActivos
            });
        } catch (error) {
            console.error('Error al obtener lista de alumnos:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },
};

module.exports = GeneralController;