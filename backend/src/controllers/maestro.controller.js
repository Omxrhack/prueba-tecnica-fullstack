const { Alumno, Calificacion, Materia, Asignacion, Usuario } = require('../models');

const MaestroController = {
    
    /**
     * Obtiene la lista de materias asignadas al maestro autenticado.
     * GET /api/maestro/materias
     */
    async getMateriasAsignadas(req, res) {
        const maestroId = req.user?.id;

        if (!maestroId) {
            return res.status(400).json({ message: 'ID de maestro no encontrado en el token.' });
        }

        try {
            // Convertir a número por si acaso viene como string
            const maestroIdNum = Number(maestroId);
            
            // Buscar asignaciones del maestro
            const asignaciones = await Asignacion.findAll({
                where: { 
                    maestro_id: maestroIdNum 
                },
                include: [
                    {
                        model: Materia,
                        attributes: ['id', 'nombre', 'codigo', 'descripcion']
                    }
                ],
                raw: false
            });
            
            // Mapear asignaciones a formato de respuesta
            // Si las materias no se cargaron en el include, cargarlas manualmente
            const materias = await Promise.all(asignaciones.map(async (a) => {
                try {
                    // Intentar obtener la materia de la relación primero
                    let materia = a.Materia;
                    
                    // Si no está en la relación, cargarla manualmente
                    if (!materia) {
                        materia = await Materia.findByPk(a.materia_id);
                    }
                    
                    if (!materia) {
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(`Materia con ID ${a.materia_id} no existe en la BD`);
                        }
                        return null;
                    }
                    
                    // Convertir a objeto plano si es necesario
                    const materiaData = materia.toJSON ? materia.toJSON() : materia;
                    
                    return {
                        id: materiaData.id,
                        nombre: materiaData.nombre,
                        codigo: materiaData.codigo || null,
                        descripcion: materiaData.descripcion || null,
                        cupo_maximo: a.cupo_maximo || 40
                    };
                } catch (mapError) {
                    console.error('Error al mapear asignación:', mapError);
                    return null;
                }
            }));
            
            // Filtrar nulls
            const materiasFiltradas = materias.filter(m => m !== null);

            res.json({
                message: `Materias asignadas al maestro ID ${maestroId}`,
                data: materiasFiltradas
            });
        } catch (error) {
            console.error('Error al obtener materias asignadas:', error);
            throw error; // El middleware de errores se encargará de formatear la respuesta
        }
    },

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
            // Filtramos por deleted_at IS NULL para excluir registros eliminados (soft delete)
            const calificaciones = await Calificacion.findAll({
                where: { 
                    maestro_id: maestroId,
                    deleted_at: null
                },
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
        const authUserId = req.user.id;
        const authUserRol = req.user.rol;
        
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
    },

    /**
     * Obtiene los alumnos inscritos en una materia específica asignada al maestro.
     * GET /api/maestro/alumnos/{materiaID}
     */
    async getAlumnosPorMateria(req, res) {
        const maestroId = req.user.id;
        const materiaId = req.params.materiaID;

        try {
            // Verificar que el maestro tenga asignada esta materia
            const asignacion = await Asignacion.findOne({
                where: { maestro_id: maestroId, materia_id: materiaId }
            });

            if (!asignacion) {
                return res.status(403).json({ 
                    message: 'No tienes asignada esta materia.' 
                });
            }

            const calificaciones = await Calificacion.findAll({
                where: { 
                    maestro_id: maestroId,
                    materia_id: materiaId,
                    deleted_at: null
                },
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
                order: [[Alumno, 'nombre', 'ASC']]
            });

            const alumnos = calificaciones.map(c => ({
                alumno: c.Alumno,
                nota: c.nota,
                observaciones: c.observaciones,
                fecha_registro: c.created_at
            }));

            res.json({
                message: `Alumnos de la materia ${materiaId} asignados al maestro ID ${maestroId}`,
                data: alumnos
            });
        } catch (error) {
            console.error('Error al obtener alumnos por materia:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Obtiene el detalle de un alumno específico dentro de una materia específica.
     * GET /api/maestro/alumnos/{materiaID}/{alumnoID}
     */
    async getDetalleAlumno(req, res) {
        const maestroId = req.user.id;
        const materiaId = req.params.materiaID;
        const alumnoId = req.params.alumnoID;

        try {
            // Verificar que el maestro tenga asignada esta materia
            const asignacion = await Asignacion.findOne({
                where: { maestro_id: maestroId, materia_id: materiaId }
            });

            if (!asignacion) {
                return res.status(403).json({ 
                    message: 'No tienes asignada esta materia.' 
                });
            }

            const calificacion = await Calificacion.findOne({
                where: { 
                    maestro_id: maestroId,
                    materia_id: materiaId,
                    alumno_id: alumnoId,
                    deleted_at: null
                },
                include: [
                    {
                        model: Alumno,
                        attributes: ['id', 'nombre', 'matricula', 'grupo', 'fecha_nacimiento']
                    },
                    {
                        model: Materia,
                        attributes: ['id', 'nombre', 'codigo', 'descripcion']
                    }
                ]
            });

            if (!calificacion) {
                return res.status(404).json({ 
                    message: 'Calificación no encontrada o no tienes acceso a este registro.' 
                });
            }

            res.json({
                message: 'Detalle de alumno obtenido con éxito.',
                data: {
                    alumno: calificacion.Alumno,
                    materia: calificacion.Materia,
                    nota: calificacion.nota,
                    observaciones: calificacion.observaciones,
                    fecha_registro: calificacion.created_at,
                    fecha_actualizacion: calificacion.updated_at
                }
            });
        } catch (error) {
            console.error('Error al obtener detalle de alumno:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
    
};

module.exports = MaestroController;