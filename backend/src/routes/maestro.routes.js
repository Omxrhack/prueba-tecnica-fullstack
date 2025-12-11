// backend/src/routes/maestro.routes.js
const { Router } = require('express');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const MaestroController = require('../controllers/maestro.controller');

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

// 1. RUTA GET (LISTAR ALUMNOS) - SOLO MAESTRO
router.get(
    '/alumnos',
    verifyToken,
    checkRole(['MAESTRO']),
    MaestroController.getAlumnosAsignados
);

// 2. RUTA POST (REGISTRAR/ACTUALIZAR CALIFICACION)
// Permitimos MAESTRO y CONTROL_ESCOLAR: el controller decidirá la política
router.post(
    '/calificaciones/:materiaID/:alumnoID',
    verifyToken,
    checkRole(['MAESTRO', 'CONTROL_ESCOLAR']), // <-- aquí permitimos ambos roles
    MaestroController.registrarCalificacion
);

module.exports = router;
