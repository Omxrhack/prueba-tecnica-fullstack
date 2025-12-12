const { sequelize, Calificacion, Alumno, Materia, Usuario, Asignacion } = require('../models');
const bcrypt = require('bcryptjs');

const AdminController = {
    
    /**
     * Genera un reporte global de promedios por alumno.
     * GET /api/controlescolar/reporte
     */
    async getReporteGlobal(req, res) {
        try {
            // Consulta para calcular el promedio de la nota por cada alumno.
            // Filtramos por deleted_at IS NULL para excluir registros eliminados (soft delete)
            const reportes = await Calificacion.findAll({
                attributes: [
                    // Calcula el promedio de la nota
                    [sequelize.fn('AVG', sequelize.col('nota')), 'promedio_general']
                ],
                // Incluye datos del Alumno para agrupar y mostrar información relevante
                include: [
                    { 
                        model: Alumno, 
                        attributes: ['id', 'nombre', 'matricula', 'grupo'] 
                    },
                ],
                // Filtro para excluir registros eliminados (soft delete)
                where: {
                    deleted_at: null
                },
                // Agrupamos por los campos del Alumno
                group: ['Alumno.id', 'Alumno.nombre', 'Alumno.matricula', 'Alumno.grupo'],
                // Ordenamos por el promedio general de forma descendente
                order: [[sequelize.col('promedio_general'), 'DESC']]
            });

            // Formatear la salida para asegurar que el promedio sea un decimal legible (escala 0-10)
            const data = reportes.map(r => {
                const promedio = parseFloat(r.getDataValue('promedio_general'));
                // Asegurar que el promedio esté en escala 0-10
                const promedioNormalizado = Math.max(0, Math.min(10, promedio));
                return {
                    alumno: r.Alumno,
                    promedio_general: promedioNormalizado.toFixed(2)
                };
            });

            res.json({
                message: 'Reporte global de promedios por alumno generado con éxito.',
                data: data
            });

        } catch (error) {
            console.error('Error al generar reporte global:', error);
            res.status(500).json({ message: 'Error interno del servidor al generar reporte.' });
        }
    },

    /**
     * Elimina (Soft Delete) una calificación por la combinación de claves.
     * DELETE /api/controlescolar/calificaciones/{materiaID}/{alumnoID}
     */
    async deleteCalificacion(req, res) {
        // Lee los IDs de la URL (req.params)
        const alumnoID = req.params.alumnoID;
        const materiaID = req.params.materiaID;

        try {
            // Utilizamos .destroy() con el filtro 'where'
            const result = await Calificacion.destroy({
                where: {
                    alumno_id: alumnoID,
                    materia_id: materiaID,
                    // Soft delete ya configurado en el modelo
                }
            });

            if (result === 0) {
                // Si no se afectó ninguna fila, la calificación no existe o ya fue eliminada.
                return res.status(404).json({ 
                    message: 'Calificación no encontrada o ya eliminada.' 
                });
            }

            res.json({ 
                message: `Calificación (Alumno: ${alumnoID}, Materia: ${materiaID}) eliminada (soft delete) con éxito.`
            });

        } catch (error) {
            console.error('Error al eliminar calificación:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Actualiza una calificación por la combinación de claves.
     * PATCH /api/controlescolar/calificaciones/{materiaID}/{alumnoID}
     */
    async updateCalificacion(req, res) {
        // Lee los IDs de la URL (req.params)
        const alumnoID = req.params.alumnoID;
        const materiaID = req.params.materiaID;
        // Lee los datos a actualizar de req.body
        const { nota, observaciones } = req.body;

        try {
            const updateFields = {};

            // Validación y preparación de la nota
            if (nota !== undefined && !isNaN(parseFloat(nota))) {
                const notaNumerica = parseFloat(nota);
                if (notaNumerica < 0 || notaNumerica > 10) {
                     return res.status(400).json({ message: 'La nota debe estar entre 0 y 10.' });
                }
                updateFields.nota = notaNumerica;
            }
            
            // Preparación de observaciones
            if (observaciones !== undefined) {
                updateFields.observaciones = observaciones;
            }

            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
            }
            
            // 1. Ejecutamos la actualización con el filtro 'where'
            const [updatedRows, updatedRecords] = await Calificacion.update(
                updateFields,
                {
                    where: {
                        alumno_id: alumnoID,
                        materia_id: materiaID,
                    },
                    returning: true // Necesario para PostgreSQL para obtener el registro actualizado
                }
            );

            if (updatedRows === 0) {
                return res.status(404).json({ message: 'Calificación no encontrada o ya eliminada.' });
            }

            res.json({
                message: `Calificación (Alumno: ${alumnoID}, Materia: ${materiaID}) actualizada con éxito.`,
                data: updatedRecords[0] // Retorna el registro actualizado
            });

        } catch (error) {
            console.error('Error al actualizar calificación:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Asigna una materia a un maestro con un cupo máximo.
     * POST /api/controlescolar/asignacion
     */
    async asignarMateria(req, res) {
        const { maestro_id, materia_id, cupo_maximo } = req.body;

        if (!maestro_id || !materia_id) {
            return res.status(400).json({ message: 'Maestro y Materia son obligatorios.' });
        }

        try {
            // Buscar si ya existe una asignación para esta materia (con cualquier maestro)
            const asignacionExistente = await Asignacion.findOne({
                where: { materia_id }
            });

            if (asignacionExistente) {
                // Si existe, verificar si es el mismo maestro
                if (asignacionExistente.maestro_id === Number(maestro_id)) {
                    // Es el mismo maestro, solo actualizar el cupo si se proporcionó
                    if (cupo_maximo) {
                        await asignacionExistente.update({ cupo_maximo });
                    }
                    return res.json({ message: 'Asignación actualizada con éxito.', data: asignacionExistente });
                } else {
                    // Es un maestro diferente, reemplazar la asignación anterior
                    await asignacionExistente.update({
                        maestro_id: Number(maestro_id),
                        cupo_maximo: cupo_maximo || asignacionExistente.cupo_maximo
                    });
                    // Recargar la asignación actualizada
                    await asignacionExistente.reload();
                    return res.json({ 
                        message: 'Maestro reemplazado con éxito. La materia ahora está asignada al nuevo maestro.', 
                        data: asignacionExistente 
                    });
                }
            } else {
                // No existe asignación, crear una nueva
                const nuevaAsignacion = await Asignacion.create({
                    maestro_id: Number(maestro_id),
                    materia_id: Number(materia_id),
                    cupo_maximo: cupo_maximo || 40
                });
                return res.status(201).json({ 
                    message: 'Materia asignada con éxito.', 
                    data: nuevaAsignacion 
                });
            }

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                 return res.status(409).json({ message: 'Esa materia ya está asignada a ese maestro.' });
            }
            console.error('Error al asignar materia:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },
     // backend/src/controllers/admin.controller.js (Añadir al final del objeto AdminController)

    /**
     * Crea un nuevo Maestro (Usuario con rol 'MAESTRO').
     * POST /api/controlescolar/maestros
     */
    async crearMaestro(req, res) {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'Nombre, email y password son obligatorios.' });
        }

        try {
            // Aseguramos que solo se puedan crear con rol MAESTRO
            const HASHED_PASSWORD = bcrypt.hashSync(password, 10);
            
            // Normalizar email (lowercase y trim)
            const emailNormalizado = email.toLowerCase().trim();

            const nuevoMaestro = await Usuario.create({
                nombre,
                email: emailNormalizado,
                password_hash: HASHED_PASSWORD,
                rol: 'MAESTRO' // Rol fijo para esta ruta
            });

            res.status(201).json({ 
                message: 'Maestro creado con éxito.', 
                data: { id: nuevoMaestro.id, nombre: nuevoMaestro.nombre, email: nuevoMaestro.email, rol: nuevoMaestro.rol } 
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: 'Ya existe un usuario con este correo electrónico.' });
            }
            console.error('Error al crear maestro:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Crea un nuevo Alumno.
     * POST /api/controlescolar/alumnos
     */
    async crearAlumno(req, res) {
        const { nombre, matricula, grupo, fecha_nacimiento } = req.body;
        
        if (!nombre || !matricula || !grupo) {
             return res.status(400).json({ message: 'Nombre, matrícula y grupo son obligatorios.' });
        }

        try {
            const nuevoAlumno = await Alumno.create({
                nombre,
                matricula,
                grupo,
                fecha_nacimiento: fecha_nacimiento || null
            });

            res.status(201).json({ 
                message: 'Alumno creado con éxito.', 
                data: nuevoAlumno 
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: 'Ya existe un alumno con esta matrícula.' });
            }
            console.error('Error al crear alumno:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Crea una nueva Materia y opcionalmente la asigna a un maestro.
     * POST /api/controlescolar/materias
     * Body: { nombre, codigo, descripcion, maestro_id?, cupo_maximo? }
     */
    async crearMateria(req, res) {
        const { nombre, codigo, descripcion, maestro_id, cupo_maximo } = req.body;

        if (!nombre || !codigo) {
            return res.status(400).json({ message: 'Nombre y código son obligatorios.' });
        }

        try {
            // Crear la materia
            const nuevaMateria = await Materia.create({
                nombre,
                codigo,
                descripcion: descripcion || null
            });

            let asignacionCreada = null;

            // Si se proporcionó maestro_id, crear la asignación
            if (maestro_id) {
                // Verificar que el maestro existe y es de rol MAESTRO
                const maestro = await Usuario.findOne({ 
                    where: { 
                        id: maestro_id, 
                        rol: 'MAESTRO' 
                    } 
                });

                if (!maestro) {
                    // Si no es un maestro válido, eliminar la materia creada y retornar error
                    await nuevaMateria.destroy();
                    return res.status(400).json({ 
                        message: 'El maestro especificado no existe o no tiene rol MAESTRO.' 
                    });
                }

                // Crear la asignación
                asignacionCreada = await Asignacion.create({
                    maestro_id,
                    materia_id: nuevaMateria.id,
                    cupo_maximo: cupo_maximo || 40
                });
            }

            res.status(201).json({
                message: 'Materia creada con éxito' + (asignacionCreada ? ' y asignada al maestro.' : '.'),
                data: {
                    materia: nuevaMateria,
                    asignacion: asignacionCreada
                }
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: 'Ya existe una materia con este código o la asignación ya existe.' });
            }
            console.error('Error al crear materia:', error);
            throw error;
        }
    },

    /**
     * Asigna múltiples alumnos a una materia (crea calificaciones iniciales vacías).
     * POST /api/controlescolar/materias/:materiaID/alumnos
     * Body: { alumno_ids: [1, 2, 3], maestro_id }
     */
    async asignarAlumnosAMateria(req, res) {
        const { materiaID } = req.params;
        const { alumno_ids, maestro_id } = req.body;

        if (!alumno_ids || !Array.isArray(alumno_ids) || alumno_ids.length === 0) {
            return res.status(400).json({ message: 'Se requiere un array de IDs de alumnos (alumno_ids).' });
        }

        if (!maestro_id) {
            return res.status(400).json({ message: 'Se requiere el ID del maestro (maestro_id).' });
        }

        try {
            // Verificar que la materia existe
            const materia = await Materia.findByPk(materiaID);
            if (!materia) {
                return res.status(404).json({ message: 'Materia no encontrada.' });
            }

            // Verificar que el maestro existe y tiene rol MAESTRO
            const maestro = await Usuario.findOne({ 
                where: { 
                    id: maestro_id, 
                    rol: 'MAESTRO' 
                } 
            });
            if (!maestro) {
                return res.status(404).json({ message: 'Maestro no encontrado o no tiene rol MAESTRO.' });
            }

            // Verificar que existe una asignación de este maestro a esta materia
            const asignacion = await Asignacion.findOne({
                where: {
                    materia_id: materiaID,
                    maestro_id: maestro_id
                }
            });

            if (!asignacion) {
                return res.status(400).json({ 
                    message: 'El maestro no está asignado a esta materia. Primero debe asignar el maestro a la materia.' 
                });
            }

            // Verificar que no exceda el cupo máximo
            const calificacionesExistentes = await Calificacion.count({
                where: {
                    materia_id: materiaID,
                    deleted_at: null
                }
            });

            const cupoDisponible = asignacion.cupo_maximo - calificacionesExistentes;
            if (alumno_ids.length > cupoDisponible) {
                return res.status(400).json({ 
                    message: `Cupo insuficiente. Solo hay ${cupoDisponible} cupos disponibles de ${asignacion.cupo_maximo} totales.` 
                });
            }

            // Verificar que todos los alumnos existen
            const alumnos = await Alumno.findAll({
                where: {
                    id: alumno_ids
                }
            });

            if (alumnos.length !== alumno_ids.length) {
                return res.status(400).json({ message: 'Uno o más alumnos no existen.' });
            }

            // Crear calificaciones iniciales para los alumnos (sin nota, solo registro de inscripción)
            const calificacionesACrear = alumno_ids.map(alumno_id => ({
                alumno_id,
                materia_id: materiaID,
                maestro_id: maestro_id,
                nota: 0, // Nota inicial en 0 hasta que se califique
                observaciones: 'Alumno inscrito en la materia.'
            }));

            // Verificar cuáles calificaciones ya existen para no duplicarlas
            const calificacionesExistentesQuery = await Calificacion.findAll({
                where: {
                    materia_id: materiaID,
                    alumno_id: alumno_ids,
                    deleted_at: null
                },
                attributes: ['alumno_id']
            });

            const alumnosYaInscritos = calificacionesExistentesQuery.map(c => c.alumno_id);
            const alumnosNuevos = alumno_ids.filter(id => !alumnosYaInscritos.includes(id));

            if (alumnosNuevos.length === 0) {
                return res.status(409).json({ 
                    message: 'Todos los alumnos ya están inscritos en esta materia.' 
                });
            }

            const calificacionesNuevas = alumnosNuevos.map(alumno_id => ({
                alumno_id,
                materia_id: materiaID,
                maestro_id: maestro_id,
                nota: 0,
                observaciones: 'Alumno inscrito en la materia.'
            }));

            const calificacionesCreadas = await Calificacion.bulkCreate(calificacionesNuevas, { returning: true });

            res.status(201).json({
                message: `${calificacionesCreadas.length} alumno(s) asignado(s) a la materia exitosamente.`,
                data: {
                    materia: {
                        id: materia.id,
                        nombre: materia.nombre,
                        codigo: materia.codigo
                    },
                    alumnos_asignados: calificacionesCreadas.length,
                    alumnos_ya_inscritos: alumnosYaInscritos.length,
                    cupo_disponible: asignacion.cupo_maximo - (calificacionesExistentes + calificacionesCreadas.length),
                    cupo_maximo: asignacion.cupo_maximo
                }
            });

        } catch (error) {
            console.error('Error al asignar alumnos a materia:', error);
            throw error;
        }
    },

    /**
     * Crea un nuevo Usuario (Maestro, Alumno o Admin).
     * Si el rol es ALUMNO, también crea el registro en la tabla alumnos.
     * POST /api/controlescolar/usuarios
     */
    async crearUsuario(req, res) {
        const { nombre, email, password, rol, matricula, grupo, semestre, fecha_nacimiento } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({ message: 'Nombre, email, password y rol son obligatorios.' });
        }

        // Validar que el rol sea válido
        const rolesValidos = ['MAESTRO', 'CONTROL_ESCOLAR', 'ALUMNO'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ message: `Rol inválido. Roles permitidos: ${rolesValidos.join(', ')}` });
        }

        // Si es ALUMNO, validar campos adicionales
        if (rol === 'ALUMNO' && (!matricula || !grupo)) {
            return res.status(400).json({ message: 'Para crear un alumno, matrícula y grupo son obligatorios.' });
        }

        try {
            const HASHED_PASSWORD = bcrypt.hashSync(password, 10);
            
            // Normalizar email (lowercase y trim)
            const emailNormalizado = email.toLowerCase().trim();

            // Crear el usuario
            const nuevoUsuario = await Usuario.create({
                nombre,
                email: emailNormalizado,
                password_hash: HASHED_PASSWORD,
                rol
            });

            // Si es ALUMNO, crear también el registro en la tabla alumnos
            let alumnoCreado = null;
            if (rol === 'ALUMNO') {
                alumnoCreado = await Alumno.create({
                    nombre,
                    matricula,
                    grupo,
                    semestre: semestre ? parseInt(semestre) : null,
                    fecha_nacimiento: fecha_nacimiento || null,
                    usuario_id: nuevoUsuario.id
                });
            }

            res.status(201).json({
                message: 'Usuario creado con éxito.',
                data: {
                    usuario: {
                        id: nuevoUsuario.id,
                        nombre: nuevoUsuario.nombre,
                        email: nuevoUsuario.email,
                        rol: nuevoUsuario.rol
                    },
                    alumno: alumnoCreado ? {
                        id: alumnoCreado.id,
                        matricula: alumnoCreado.matricula,
                        grupo: alumnoCreado.grupo
                    } : null
                }
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                if (error.errors?.[0]?.path === 'email') {
                    return res.status(409).json({ message: 'Ya existe un usuario con este correo electrónico.' });
                }
                if (error.errors?.[0]?.path === 'matricula') {
                    return res.status(409).json({ message: 'Ya existe un alumno con esta matrícula.' });
                }
                return res.status(409).json({ message: 'Ya existe un registro con estos datos.' });
            }
            console.error('Error al crear usuario:', error);
            throw error;
        }
    },

    /**
     * OBTENER DETALLE DE CALIFICACIONES POR MATERIA
     * GET /api/controlescolar/reporte/:materiaID
     */
    async getReportePorMateria(req, res) {
        const { materiaID } = req.params;

        try {
            // Obtener calificaciones con maestros
            const calificaciones = await Calificacion.findAll({
                where: { 
                    materia_id: materiaID,
                    deleted_at: null // Filtro para excluir registros eliminados (soft delete)
                },
                attributes: ['id', 'nota', 'observaciones'],
                include: [
                    { 
                        model: Alumno, 
                        attributes: ['id', 'nombre', 'matricula', 'grupo'] 
                    },
                    { 
                        model: Usuario, // Incluimos al Maestro
                        as: 'Maestro', // Usar el alias definido en el modelo
                        attributes: ['id', 'nombre']
                    }
                ],
                order: [[Alumno, 'nombre', 'ASC']] // Ordenar alfabéticamente por alumno
            });

            // Obtener la asignación (maestro asignado) de la materia
            const asignacion = await Asignacion.findOne({
                where: { materia_id: materiaID },
                include: [
                    {
                        model: Usuario,
                        attributes: ['id', 'nombre']
                    }
                ]
            });

            const data = calificaciones.map(c => ({
                id: c.id,
                nota: c.nota,
                observaciones: c.observaciones,
                alumno: c.Alumno,
                maestro: c.Maestro
            }));

            // Incluir información del maestro asignado en la respuesta
            const maestroAsignado = asignacion && asignacion.Usuario ? {
                id: asignacion.Usuario.id,
                nombre: asignacion.Usuario.nombre
            } : null;

            res.json({
                message: 'Detalle de materia obtenido con éxito.',
                data: data,
                maestro: maestroAsignado // Incluir maestro asignado aunque no haya calificaciones
            });

        } catch (error) {
            console.error('Error al obtener reporte por materia:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
// ...
};

module.exports = AdminController;