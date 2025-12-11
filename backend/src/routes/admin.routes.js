// backend/src/routes/admin.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const AdminController = require('../controllers/admin.controller'); 

const router = Router();

// Todas las rutas requieren autenticación y rol de CONTROL_ESCOLAR
const authAdmin = [verifyToken, checkRole(['CONTROL_ESCOLAR'])];

// 1. REPORTE GLOBAL (GET)
router.get(
    '/reporte', 
    authAdmin, 
    AdminController.getReporteGlobal 
);

// 2. ELIMINAR CALIFICACIÓN (DELETE - Soft Delete)
// Requerimiento: DELETE /api/controlescolar/calificaciones/{materiaID}/{alumnoID}
router.delete(
    '/calificaciones/:materiaID/:alumnoID', // <-- CORRECCIÓN: Usa MateriaID y AlumnoID
    authAdmin,
    AdminController.deleteCalificacion
);

// 3. ACTUALIZAR CALIFICACIÓN (PATCH)
// Requerimiento: PATCH /api/controlescolar/calificaciones/{materiaID}/{alumnoID}
router.patch(
    '/calificaciones/:materiaID/:alumnoID', 
    authAdmin,
    AdminController.updateCalificacion
);

// 4. ASIGNAR MATERIAS A MAESTROS (POST)
// Requerimiento: POST /api/controlescolar/asignacion
router.post(
    '/asignacion',
    authAdmin,
    AdminController.asignarMateria
);

module.exports = router;