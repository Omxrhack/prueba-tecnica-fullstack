// backend/src/routes/maestro.routes.js
const { Router } = require('express');
const { body, param } = require('express-validator');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const MaestroController = require('../controllers/maestro.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

/**
 * Nota:
 * - verifyToken: valida JWT y pone req.user
 * - checkRole([...roles]): asegura que req.user.rol esté en la lista
 *
 * Política propuesta:
 * - GET /alumnos: solo MAESTRO (consulta sus propios alumnos/califs)
 * - POST /calificaciones: MAESTRO puede crear/actualizar sus propias calificaciones.
 *   Además CONTROL_ESCOLAR (o rol administrativo) también puede crear/actualizar
 *   pasando maestro_id en el body.
 */

// Middleware: Todas las rutas requieren ser MAESTRO
const authMaestro = [verifyToken, checkRole(['MAESTRO'])];

// 1. RUTA GET (LISTAR MATERIAS ASIGNADAS) - SOLO MAESTRO
router.get(
    '/materias',
    ...authMaestro,
    MaestroController.getMateriasAsignadas
);

// 2. RUTA GET (LISTAR ALUMNOS) - SOLO MAESTRO
router.get(
    '/alumnos',
    ...authMaestro,
    MaestroController.getAlumnosAsignados
);

// Validaciones para parámetros
const paramsMaestroValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido')
];

const paramsAlumnoValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    param('alumnoID').isInt({ min: 1 }).withMessage('ID de alumno inválido')
];

// 3. RUTA GET (ALUMNOS POR MATERIA) - SOLO MAESTRO
router.get(
    '/alumnos/:materiaID',
    ...authMaestro,
    paramsMaestroValidations,
    validate,
    MaestroController.getAlumnosPorMateria
);

// 4. RUTA GET (DETALLE ALUMNO) - SOLO MAESTRO
router.get(
    '/alumnos/:materiaID/:alumnoID',
    ...authMaestro,
    paramsAlumnoValidations,
    validate,
    MaestroController.getDetalleAlumno
);

// Validaciones para registrar calificación
const calificacionValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    param('alumnoID').isInt({ min: 1 }).withMessage('ID de alumno inválido'),
    body('nota')
        .isFloat({ min: 0, max: 10 })
        .withMessage('La nota debe ser un número entre 0 y 10')
        .toFloat(),
    body('observaciones')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Las observaciones no pueden exceder 1000 caracteres')
];

// 5. RUTA POST (REGISTRAR/ACTUALIZAR CALIFICACION)
// Permitimos MAESTRO y CONTROL_ESCOLAR: el controller decidirá la política
router.post(
    '/calificaciones/:materiaID/:alumnoID',
    verifyToken,
    checkRole(['MAESTRO', 'CONTROL_ESCOLAR']),
    calificacionValidations,
    validate,
    MaestroController.registrarCalificacion
);

module.exports = router;
