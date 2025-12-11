const { Materia, Usuario } = require('../models');
const { Op } = require('sequelize'); // Útil si queremos filtrar por rol en el futuro

const GeneralController = {
    
    /**
     * 1. Obtiene la lista completa de Materias para selectores.
     * GET /api/materias
     */
    async getMaterias(req, res) {
        try {
            // Solo obtener ID, nombre y código para ser ligero
            const materias = await Materia.findAll({ 
                attributes: ['id', 'nombre', 'codigo'] 
            });
            
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
            // Obtenemos todos los usuarios, excluyendo el hash de la contraseña
            const usuarios = await Usuario.findAll({ 
                attributes: ['id', 'nombre', 'email', 'rol'] 
            });
            
            res.json({
                message: 'Lista de usuarios obtenida con éxito.',
                data: usuarios
            });
        } catch (error) {
            console.error('Error al obtener lista de usuarios:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },
};

module.exports = GeneralController;