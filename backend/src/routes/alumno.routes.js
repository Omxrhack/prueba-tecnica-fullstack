// backend/src/routes/alumno.routes.js
const { Router } = require('express');
const { param } = require('express-validator');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const AlumnoController = require('../controllers/alumno.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

// Middleware: Todas las rutas requieren ser ALUMNO
const authAlumno = [verifyToken, checkRole(['ALUMNO'])];

// Validaciones para parámetros
const paramsMateriaValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido')
];

// 1. RUTA GET (LISTAR TODAS LAS CALIFICACIONES DEL ALUMNO) - SOLO ALUMNO
router.get(
    '/calificaciones',
    ...authAlumno,
    AlumnoController.getMisCalificaciones
);

// 2. RUTA GET (CALIFICACIÓN POR MATERIA) - SOLO ALUMNO
router.get(
    '/calificaciones/:materiaID',
    ...authAlumno,
    paramsMateriaValidations,
    validate,
    AlumnoController.getCalificacionesPorMateria
);

// 3. RUTA GET (PROMEDIO GENERAL) - SOLO ALUMNO
router.get(
    '/promedio',
    ...authAlumno,
    AlumnoController.getMiPromedio
);

module.exports = router;
