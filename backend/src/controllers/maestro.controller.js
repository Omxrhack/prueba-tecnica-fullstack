const { Alumno, Calificacion, Materia } = require('../models');

const MaestroController = {
    

    /**
     * Obtiene la lista de alumnos a los que el maestro autenticado ha calificado,
     * junto con el detalle de las materias y calificaciones.
     * GET /api/maestro/alumnos
     */
    async getAlumnosAsignados(req, res) {
        // El ID del maestro se obtiene del token JWT (req.user.id)
        const maestroId = req.user.id; 

        try {
            // Buscamos todas las calificaciones registradas por este maestro.
            const calificaciones = await Calificacion.findAll({
                where: { maestro_id: maestroId },
                include: [
                    { 
                        model: Alumno, 
                        attributes: ['id', 'nombre', 'matricula', 'grupo'] 
                    },
                    { 
                        model: Materia, 
                        attributes: ['id', 'nombre', 'codigo'] 
                    }
                ],
                // Ordenamos por Alumno, luego por Materia
                order: [
                    [Alumno, 'nombre', 'ASC'], 
                    [Materia, 'nombre', 'ASC']
                ]
            });

            // Procesar los datos para agrupar las calificaciones por alumno
            const alumnosMap = {};
            calificaciones.forEach(c => {
                const alumnoId = c.Alumno.id;
                
                if (!alumnosMap[alumnoId]) {
                    alumnosMap[alumnoId] = {
                        id: alumnoId,
                        nombre: c.Alumno.nombre,
                        matricula: c.Alumno.matricula,
                        grupo: c.Alumno.grupo,
                        calificaciones: []
                    };
                }

                alumnosMap[alumnoId].calificaciones.push({
                    calificacion_id: c.id,
                    materia: c.Materia.nombre,
                    nota: c.nota,
                    fecha_registro: c.fecha_registro
                });
            });

            const alumnosList = Object.values(alumnosMap);

            res.json({
                message: `Alumnos y calificaciones encontradas para el maestro ID ${maestroId}`,
                data: alumnosList
            });
        } catch (error) {
            console.error('Error al obtener alumnos asignados:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener datos.' });
        }
    },
    /**
     * Crea o actualiza una calificación.
     * POST /api/maestro/calificaciones
     */
    async registrarCalificacion(req, res) {
        // IDs leídos de la URL (req.params)
        const alumno_id = req.params.alumnoID;
        const materia_id = req.params.materiaID;
        // Nota y observaciones del Body (req.body)
        const { nota, observaciones } = req.body;
        const maestro_id = req.user.id;
    
        // 1. Validación básica
        if (!alumno_id || !materia_id || nota === undefined || isNaN(nota)) {
            return res.status(400).json({ message: 'Alumno, Materia y Nota son obligatorios.' });
        }
    
        const notaNumerica = parseFloat(nota);
        if (notaNumerica < 0 || notaNumerica > 10) {
            return res.status(400).json({ message: 'La nota debe estar entre 0 y 10.' });
        }
    
        // 2. Determinar maestro_id final con política explícita:
        // - Si el usuario autenticado tiene rol 'CONTROL_ESCOLAR' (o admin),
        //   permitimos que pase maestro_id en el body para asignar notas a otros maestros.
        // - En cualquier otro caso, siempre usamos el id del usuario autenticado.
        let maestroId;
        if (authUserRol === 'CONTROL_ESCOLAR') {
            // Si control escolar envía maestro_id en body lo usamos, si no usamos su id
            maestroId = (req.body.maestro_id !== undefined && req.body.maestro_id !== null)
                ? Number(req.body.maestro_id)
                : Number(authUserId);
        } else {
            // Para maestros normales: forzamos que la nota sea del maestro autenticado
            maestroId = Number(authUserId);
        }
    
        // Validar que maestroId sea número válido
        if (!maestroId || isNaN(maestroId)) {
            return res.status(400).json({ message: 'No se pudo determinar el ID del maestro (auth inválida).' });
        }
    
        try {
            // 3. findOrCreate / update
            const [calificacion, created] = await Calificacion.findOrCreate({
                where: {
                    alumno_id: Number(alumno_id),
                    materia_id: Number(materia_id),
                    maestro_id: maestroId
                },
                defaults: {
                    nota: notaNumerica,
                    observaciones: observaciones
                }
            });
    
            let mensaje = '';
            if (created) {
                mensaje = 'Calificación registrada con éxito.';
            } else {
                await calificacion.update({
                    nota: notaNumerica,
                    observaciones: observaciones
                });
                mensaje = 'Calificación actualizada con éxito.';
            }
    
            return res.status(created ? 201 : 200).json({
                message: mensaje,
                data: calificacion
            });
    
        } catch (error) {
            // Log extendido para debugging (no exponer detalles en producción)
            console.error('Error al registrar/actualizar calificación:', error);
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).json({ message: 'Referencia inválida: alumno/materia/maestro no existe.' });
            }
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    
};

module.exports = MaestroController;