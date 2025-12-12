const { Router } = require('express');
const GeneralController = require('../controllers/general.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

// Estas rutas son de solo lectura (listados) y deben estar protegidas por JWT.
// Cualquier usuario autenticado (Maestro o Admin) puede acceder a ellas.

// 1. OBTENER LISTA COMPLETA DE MATERIAS
// GET /api/materias
router.get(
    '/materias', 
    verifyToken, 
    GeneralController.getMaterias
);

// 2. OBTENER LISTA COMPLETA DE USUARIOS (Maestros, Admins)
// GET /api/usuarios/list
router.get(
    '/usuarios/list', 
    verifyToken, 
    GeneralController.getUsuariosList
);

// 3. OBTENER LISTA COMPLETA DE ALUMNOS
// GET /api/alumnos/list
router.get(
    '/alumnos/list', 
    verifyToken, 
    GeneralController.getAlumnosList
);

module.exports = router;