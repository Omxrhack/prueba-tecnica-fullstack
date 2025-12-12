// backend/src/routes/admin.routes.js
const { Router } = require('express');
const { body, param } = require('express-validator');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const AdminController = require('../controllers/admin.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

// Middleware: Todas las rutas requieren ser Admin (CONTROL_ESCOLAR)
const authAdmin = [verifyToken, checkRole(['CONTROL_ESCOLAR'])];

// ===== VALIDACIONES (declaradas antes de usar) =====

// Validaciones para parámetros de rutas
const paramsValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    param('alumnoID').isInt({ min: 1 }).withMessage('ID de alumno inválido')
];

// Validaciones para actualizar calificación
const updateCalificacionValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    param('alumnoID').isInt({ min: 1 }).withMessage('ID de alumno inválido'),
    body('nota')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0, max: 10 })
        .withMessage('La nota debe ser un número entre 0 y 10')
        .toFloat(),
    body('observaciones')
        .optional({ checkFalsy: true })
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Las observaciones no pueden exceder 1000 caracteres')
];

// Validaciones para asignación
const asignacionValidations = [
    body('maestro_id').isInt({ min: 1 }).withMessage('ID de maestro inválido'),
    body('materia_id').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    body('cupo_maximo')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('El cupo máximo debe ser un número mayor a 0')
];

// Validaciones para crear maestro
const crearMaestroValidations = [
    body('nombre').notEmpty().trim().isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener entre 2 y 120 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Debe ser un email válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para crear alumno
const crearAlumnoValidations = [
    body('nombre').notEmpty().trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
    body('matricula').notEmpty().trim().withMessage('La matrícula es obligatoria'),
    body('grupo').notEmpty().trim().withMessage('El grupo es obligatorio'),
    body('fecha_nacimiento').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha de nacimiento inválida')
];

// Validaciones para crear materia
const crearMateriaValidations = [
    body('nombre').notEmpty().trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
    body('codigo').notEmpty().trim().withMessage('El código es obligatorio'),
    body('descripcion').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
    body('maestro_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('ID de maestro inválido'),
    body('cupo_maximo').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('El cupo máximo debe ser mayor a 0')
];

// Validaciones para asignar alumnos a materia
const asignarAlumnosValidations = [
    param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    body('alumno_ids').isArray({ min: 1 }).withMessage('Debe ser un array con al menos un ID de alumno'),
    body('alumno_ids.*').isInt({ min: 1 }).withMessage('Cada ID de alumno debe ser un número válido'),
    body('maestro_id').isInt({ min: 1 }).withMessage('ID de maestro inválido')
];

// Validaciones para crear usuario (universal para maestros, alumnos y admins)
const crearUsuarioValidations = [
    body('nombre').notEmpty().trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('Debe ser un email válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').isIn(['MAESTRO', 'CONTROL_ESCOLAR', 'ALUMNO']).withMessage('Rol inválido. Debe ser MAESTRO, CONTROL_ESCOLAR o ALUMNO'),
    body('matricula').optional({ checkFalsy: true }).trim().isString().withMessage('La matrícula debe ser un texto válido'),
    body('grupo').optional({ checkFalsy: true }).trim().isString().withMessage('El grupo debe ser un texto válido'),
    body('semestre').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }).withMessage('El semestre debe ser un número entre 1 y 12'),
    body('fecha_nacimiento').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha de nacimiento inválida')
];

// ===== RUTAS =====

// --- REPORTES ---
router.get('/reporte', authAdmin, AdminController.getReporteGlobal);
router.get('/reporte/:materiaID', authAdmin, [param('materiaID').isInt({ min: 1 }).withMessage('ID de materia inválido'), validate], AdminController.getReportePorMateria);

// --- GESTIÓN DE CALIFICACIONES ---
router.patch('/calificaciones/:materiaID/:alumnoID', authAdmin, updateCalificacionValidations, validate, AdminController.updateCalificacion);
router.delete('/calificaciones/:materiaID/:alumnoID', authAdmin, paramsValidations, validate, AdminController.deleteCalificacion);

// --- ASIGNACIONES (Maestro -> Materia) ---
router.post('/asignacion', authAdmin, asignacionValidations, validate, AdminController.asignarMateria);

// --- CRUD DE ENTIDADES ---
router.post('/materias', authAdmin, crearMateriaValidations, validate, AdminController.crearMateria);
router.post('/materias/:materiaID/alumnos', authAdmin, asignarAlumnosValidations, validate, AdminController.asignarAlumnosAMateria);
router.post('/usuarios', authAdmin, crearUsuarioValidations, validate, AdminController.crearUsuario);
router.post('/maestros', authAdmin, crearMaestroValidations, validate, AdminController.crearMaestro);
router.post('/alumnos', authAdmin, crearAlumnoValidations, validate, AdminController.crearAlumno);

module.exports = router;