const { sequelize, Calificacion, Alumno, Materia, Usuario, Asignacion } = require('../models');
const { Op } = require('sequelize');
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
        const alumnoID = req.params.alumnoID;
        const materiaID = req.params.materiaID;
        const unidadID = req.params.unidadID ? parseInt(req.params.unidadID) : null;

        try {
            const whereClause = {
                alumno_id: alumnoID,
                materia_id: materiaID
            };

            if (unidadID) {
                whereClause.unidad = unidadID;
            }

            const result = await Calificacion.destroy({
                where: whereClause
            });

            if (result === 0) {
                return res.status(404).json({ 
                    message: 'Calificación no encontrada o ya eliminada.' 
                });
            }

            res.json({ 
                message: `Calificación ${unidadID ? `(Unidad ${unidadID})` : ''} eliminada con éxito.`
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
        const alumnoID = req.params.alumnoID;
        const materiaID = req.params.materiaID;
        const unidadID = req.params.unidadID ? parseInt(req.params.unidadID) : req.body.unidad;
        const { nota, observaciones, unidad } = req.body;

        try {
            // Validación de nota
            if (nota === undefined || isNaN(parseFloat(nota))) {
                return res.status(400).json({ message: 'La nota es obligatoria.' });
            }

            const notaNumerica = parseFloat(nota);
            if (notaNumerica < 0 || notaNumerica > 10) {
                return res.status(400).json({ message: 'La nota debe estar entre 0 y 10.' });
            }

            // Validación de unidad
            const unidadFinal = unidadID || (unidad ? parseInt(unidad) : 1);
            if (!unidadFinal || unidadFinal < 1 || unidadFinal > 5) {
                return res.status(400).json({ message: 'La unidad debe estar entre 1 y 5.' });
            }

            // Obtener el maestro asignado a la materia
            const asignacion = await Asignacion.findOne({
                where: { materia_id: materiaID }
            });

            if (!asignacion) {
                return res.status(404).json({ message: 'No hay maestro asignado a esta materia. Asigne un maestro primero.' });
            }

            const maestroId = asignacion.maestro_id;

            // Usar findOrCreate para crear si no existe, actualizar si existe
            const [calificacion, created] = await Calificacion.findOrCreate({
                where: {
                    alumno_id: Number(alumnoID),
                    materia_id: Number(materiaID),
                    maestro_id: maestroId,
                    unidad: unidadFinal
                },
                defaults: {
                    nota: notaNumerica,
                    observaciones: observaciones || null
                }
            });

            // Si ya existía, actualizar
            if (!created) {
                await calificacion.update({
                    nota: notaNumerica,
                    observaciones: observaciones !== undefined ? observaciones : calificacion.observaciones
                });
            }

            const mensaje = created 
                ? `Calificación de unidad ${unidadFinal} creada con éxito.`
                : `Calificación de unidad ${unidadFinal} actualizada con éxito.`;

            res.json({
                message: mensaje,
                data: calificacion
            });

        } catch (error) {
            console.error('Error al actualizar/crear calificación:', error);
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
        const { nombre, codigo, descripcion, maestro_id, cupo_maximo, semestre } = req.body;

        if (!nombre || !codigo) {
            return res.status(400).json({ message: 'Nombre y código son obligatorios.' });
        }

        if (semestre && (semestre < 1 || semestre > 8)) {
            return res.status(400).json({ message: 'El semestre debe estar entre 1 y 8.' });
        }

        try {
            // Crear la materia
            const nuevaMateria = await Materia.create({
                nombre,
                codigo,
                descripcion: descripcion || null,
                semestre: semestre ? parseInt(semestre) : 1 // Default a semestre 1 si no se especifica
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
            // Obtener calificaciones agrupadas por alumno y unidad
            const calificaciones = await Calificacion.findAll({
                where: { 
                    materia_id: materiaID,
                    deleted_at: null
                },
                attributes: ['id', 'nota', 'unidad', 'observaciones'],
                include: [
                    { 
                        model: Alumno, 
                        attributes: ['id', 'nombre', 'matricula', 'grupo'] 
                    },
                    { 
                        model: Usuario,
                        as: 'Maestro',
                        attributes: ['id', 'nombre']
                    }
                ],
                order: [[Alumno, 'nombre', 'ASC'], ['unidad', 'ASC']]
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

            // Agrupar por alumno
            // Filtrar calificaciones con Alumno null (alumnos eliminados)
            const alumnosMap = {};
            calificaciones
                .filter(c => c.Alumno && c.Alumno.id) // Filtrar calificaciones sin alumno válido
                .forEach(c => {
                    const alumnoId = c.Alumno.id;
                    
                    if (!alumnosMap[alumnoId]) {
                        alumnosMap[alumnoId] = {
                            alumno: c.Alumno,
                            unidades: [],
                            promedio_materia: 0
                        };
                    }

                    alumnosMap[alumnoId].unidades.push({
                        unidad: c.unidad || 1,
                        nota: parseFloat(c.nota),
                        observaciones: c.observaciones,
                        maestro: c.Maestro ? {
                            id: c.Maestro.id,
                            nombre: c.Maestro.nombre
                        } : null
                    });
                });

            // Calcular promedios por alumno
            const data = Object.values(alumnosMap).map(alumnoData => {
                const notas = alumnoData.unidades.map(u => u.nota);
                const promedio = notas.length > 0
                    ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length
                    : 0;

                return {
                    alumno: alumnoData.alumno,
                    unidades: alumnoData.unidades.sort((a, b) => a.unidad - b.unidad),
                    promedio_materia: parseFloat(promedio.toFixed(2))
                };
            });

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
    },

    /**
     * Elimina (Soft Delete) un alumno.
     * DELETE /api/controlescolar/alumnos/:alumnoID
     */
    async deleteAlumno(req, res) {
        const alumnoID = req.params.alumnoID;

        try {
            const alumno = await Alumno.findByPk(alumnoID);

            if (!alumno) {
                return res.status(404).json({ 
                    message: 'Alumno no encontrado.' 
                });
            }

            // Soft delete del alumno
            await alumno.destroy();

            res.json({ 
                message: `Alumno "${alumno.nombre}" eliminado con éxito.`
            });

        } catch (error) {
            console.error('Error al eliminar alumno:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Elimina (Soft Delete) una materia.
     * DELETE /api/controlescolar/materias/:materiaID
     */
    async deleteMateria(req, res) {
        const materiaID = req.params.materiaID;

        try {
            const materia = await Materia.findByPk(materiaID);

            if (!materia) {
                return res.status(404).json({ 
                    message: 'Materia no encontrada.' 
                });
            }

            // Soft delete de la materia
            await materia.destroy();

            res.json({ 
                message: `Materia "${materia.nombre}" eliminada con éxito.`
            });

        } catch (error) {
            console.error('Error al eliminar materia:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Actualiza una materia existente.
     * PATCH /api/controlescolar/materias/:materiaID
     */
    async updateMateria(req, res) {
        const { materiaID } = req.params;
        const { nombre, codigo, descripcion, semestre } = req.body;

        try {
            const materia = await Materia.findByPk(materiaID);

            if (!materia) {
                return res.status(404).json({ 
                    message: 'Materia no encontrada.' 
                });
            }

            // Actualizar solo los campos proporcionados
            if (nombre !== undefined) materia.nombre = nombre;
            if (codigo !== undefined) materia.codigo = codigo;
            if (descripcion !== undefined) materia.descripcion = descripcion || null;
            if (semestre !== undefined) {
                if (semestre < 1 || semestre > 8) {
                    return res.status(400).json({ message: 'El semestre debe estar entre 1 y 8.' });
                }
                materia.semestre = parseInt(semestre);
            }

            await materia.save();

            res.json({ 
                message: `Materia "${materia.nombre}" actualizada con éxito.`,
                data: materia
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: 'Ya existe una materia con este código.' });
            }
            console.error('Error al actualizar materia:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Actualiza un maestro existente.
     * PATCH /api/controlescolar/maestros/:maestroID
     */
    async updateMaestro(req, res) {
        const { maestroID } = req.params;
        const { nombre, email, password } = req.body;

        try {
            const maestro = await Usuario.findOne({
                where: {
                    id: maestroID,
                    rol: 'MAESTRO'
                }
            });

            if (!maestro) {
                return res.status(404).json({ 
                    message: 'Maestro no encontrado.' 
                });
            }

            // Actualizar solo los campos proporcionados
            if (nombre !== undefined) maestro.nombre = nombre;
            if (email !== undefined) {
                const emailNormalizado = email.toLowerCase().trim();
                maestro.email = emailNormalizado;
            }
            if (password !== undefined && password.length >= 6) {
                maestro.password_hash = bcrypt.hashSync(password, 10);
            } else if (password !== undefined && password.length > 0) {
                return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
            }

            await maestro.save();

            res.json({ 
                message: `Maestro "${maestro.nombre}" actualizado con éxito.`,
                data: {
                    id: maestro.id,
                    nombre: maestro.nombre,
                    email: maestro.email,
                    rol: maestro.rol
                }
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: 'Ya existe un usuario con este correo electrónico.' });
            }
            console.error('Error al actualizar maestro:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Actualiza un alumno existente.
     * PATCH /api/controlescolar/alumnos/:alumnoID
     */
    async updateAlumno(req, res) {
        const { alumnoID } = req.params;
        const { nombre, matricula, grupo, fecha_nacimiento, semestre, usuario_id } = req.body;

        try {
            const alumno = await Alumno.findByPk(alumnoID);

            if (!alumno) {
                return res.status(404).json({ 
                    message: 'Alumno no encontrado.' 
                });
            }

            // Actualizar solo los campos proporcionados
            if (nombre !== undefined) alumno.nombre = nombre;
            if (matricula !== undefined) alumno.matricula = matricula;
            if (grupo !== undefined) alumno.grupo = grupo;
            if (fecha_nacimiento !== undefined) alumno.fecha_nacimiento = fecha_nacimiento || null;
            if (semestre !== undefined) {
                if (semestre < 1 || semestre > 8) {
                    return res.status(400).json({ message: 'El semestre debe estar entre 1 y 8.' });
                }
                alumno.semestre = parseInt(semestre);
            }
            
            // Permitir vincular/desvincular usuario
            if (usuario_id !== undefined) {
                if (usuario_id === null || usuario_id === '') {
                    // Desvincular usuario
                    alumno.usuario_id = null;
                } else {
                    // Verificar que el usuario existe y tiene rol ALUMNO
                    const usuario = await Usuario.findByPk(usuario_id);
                    if (!usuario) {
                        return res.status(404).json({ message: 'Usuario no encontrado.' });
                    }
                    if (usuario.rol !== 'ALUMNO') {
                        return res.status(400).json({ 
                            message: `El usuario no tiene rol ALUMNO. Rol actual: ${usuario.rol}` 
                        });
                    }
                    
                    // Verificar que el usuario_id no esté ya vinculado a otro alumno
                    const otroAlumno = await Alumno.findOne({ 
                        where: { 
                            usuario_id: usuario_id,
                            id: { [Op.ne]: alumnoID }
                        } 
                    });
                    if (otroAlumno) {
                        return res.status(409).json({ 
                            message: `Este usuario ya está vinculado al alumno "${otroAlumno.nombre}" (Matrícula: ${otroAlumno.matricula}).` 
                        });
                    }
                    
                    alumno.usuario_id = parseInt(usuario_id);
                }
            }

            await alumno.save();

            res.json({ 
                message: `Alumno "${alumno.nombre}" actualizado con éxito.`,
                data: alumno
            });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                if (error.errors?.[0]?.path === 'matricula') {
                    return res.status(409).json({ message: 'Ya existe un alumno con esta matrícula.' });
                }
                if (error.errors?.[0]?.path === 'usuario_id') {
                    return res.status(409).json({ message: 'Este usuario ya está vinculado a otro alumno.' });
                }
                return res.status(409).json({ message: 'Ya existe un registro con estos datos.' });
            }
            console.error('Error al actualizar alumno:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Obtiene información detallada de un alumno (materias en curso, faltantes, promedios por semestre).
     * GET /api/controlescolar/alumnos/:alumnoID/detalle
     */
    async getDetalleAlumno(req, res) {
        const { alumnoID } = req.params;

        try {
            const alumno = await Alumno.findByPk(alumnoID);

            if (!alumno) {
                return res.status(404).json({ 
                    message: 'Alumno no encontrado.' 
                });
            }

            // Obtener todas las calificaciones del alumno (solo las activas, sin soft delete)
            console.log(`[getDetalleAlumno] Buscando calificaciones para alumno ${alumnoID}...`);
            const calificaciones = await Calificacion.findAll({
                where: {
                    alumno_id: alumnoID,
                    deleted_at: null
                },
                include: [
                    {
                        model: Materia,
                        attributes: ['id', 'nombre', 'codigo', 'descripcion', 'semestre'],
                        required: false
                    },
                    {
                        model: Usuario,
                        as: 'Maestro',
                        attributes: ['id', 'nombre', 'email'],
                        required: false
                    }
                ],
                order: [
                    ['unidad', 'ASC']
                ]
            });
            
            console.log(`[getDetalleAlumno] Calificaciones encontradas: ${calificaciones.length}`);
            calificaciones.forEach(c => {
                console.log(`  - Calificación ID: ${c.id}, Materia ID: ${c.materia_id}, Nota: ${c.nota}, Unidad: ${c.unidad}, Materia: ${c.Materia?.nombre || 'NULL'}`);
            });

            // Obtener todas las materias disponibles
            const todasMaterias = await Materia.findAll({
                attributes: ['id', 'nombre', 'codigo', 'descripcion', 'semestre'],
                order: [['semestre', 'ASC'], ['nombre', 'ASC']]
            });

            // Agrupar calificaciones por materia
            console.log(`[getDetalleAlumno] Agrupando calificaciones por materia...`);
            const materiasMap = {};
            let calificacionesSinMateria = 0;
            
            // Primero, identificar todas las materias únicas que necesitamos cargar
            const materiaIdsNecesarios = [...new Set(calificaciones.map(c => c.materia_id).filter(id => id))];
            const materiasCargadas = new Map();
            
            // Cargar todas las materias que faltan del include
            for (const c of calificaciones) {
                const materiaId = c.materia_id;
                
                if (!materiaId) {
                    console.warn(`[getDetalleAlumno] WARNING: Calificación ${c.id} sin materia_id, omitiendo`);
                    continue;
                }
                
                // Si no está en el mapa de materias cargadas, intentar cargarla
                if (!materiasCargadas.has(materiaId)) {
                    let materia = c.Materia;
                    
                    // Si no vino en el include, cargarla manualmente
                    if (!materia) {
                        console.log(`[getDetalleAlumno] Materia no vino en include, cargando manualmente materia_id: ${materiaId}`);
                        materia = await Materia.findByPk(materiaId);
                        if (!materia) {
                            console.warn(`[getDetalleAlumno] WARNING: Materia ${materiaId} no existe en la base de datos`);
                            calificacionesSinMateria++;
                            continue;
                        }
                    }
                    
                    materiasCargadas.set(materiaId, materia);
                }
            }
            
            // Ahora procesar las calificaciones con las materias cargadas
            for (const c of calificaciones) {
                const materiaId = c.materia_id;
                
                if (!materiaId || !materiasCargadas.has(materiaId)) {
                    continue;
                }
                
                const materia = materiasCargadas.get(materiaId);
                
                if (!materiasMap[materiaId]) {
                    const maestro = c.Maestro;
                    console.log(`[getDetalleAlumno] Creando entrada para materia ${materia.id} (${materia.nombre})`);

                    materiasMap[materiaId] = {
                        materia: {
                            id: materia.id,
                            nombre: materia.nombre,
                            codigo: materia.codigo || null,
                            descripcion: materia.descripcion || null,
                            semestre: materia.semestre
                        },
                        maestro: maestro ? {
                            id: maestro.id,
                            nombre: maestro.nombre
                        } : null,
                        unidades: [],
                        promedio_materia: 0
                    };
                }

                materiasMap[materiaId].unidades.push({
                    unidad: c.unidad || 1,
                    nota: parseFloat(c.nota),
                    observaciones: c.observaciones || '',
                    fecha_registro: c.created_at
                });
                console.log(`[getDetalleAlumno]   + Agregada unidad ${c.unidad || 1} con nota ${c.nota} a materia ${materia.nombre}`);
            }
            
            console.log(`[getDetalleAlumno] Materias agrupadas: ${Object.keys(materiasMap).length} materias únicas`);
            if (calificacionesSinMateria > 0) {
                console.warn(`[getDetalleAlumno] WARNING: ${calificacionesSinMateria} calificaciones sin Materia asociada`);
            }

            // Calcular promedios por materia y determinar si está activa (cursando)
            const calificacionesAgrupadas = Object.values(materiasMap).map(materiaData => {
                const notas = materiaData.unidades.map(u => u.nota);
                const promedio = notas.length > 0
                    ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length
                    : 0;

                // Una materia está activa (cursando) si tiene al menos una calificación con deleted_at: null
                const tieneNotasReales = notas.some(n => n > 0);
                const activa = notas.length > 0 ? 1 : 0; // Si tiene calificaciones (aunque sean 0), está activa

                return {
                    materia: materiaData.materia,
                    maestro: materiaData.maestro,
                    unidades: materiaData.unidades.sort((a, b) => a.unidad - b.unidad),
                    promedio_materia: parseFloat(promedio.toFixed(2)),
                    activa: activa, // 1 = cursando, 0 = no cursando
                    cursando: activa === 1 // boolean para compatibilidad
                };
            });

            // Agrupar materias por semestre
            const materiasPorSemestre = {};
            const materiasCursadasIds = new Set(calificacionesAgrupadas.map(c => c.materia.id));
            const materiasActivasIds = new Set(calificacionesAgrupadas.filter(c => c.activa === 1).map(c => c.materia.id));
            const semestreActualAlumno = alumno.semestre || 8;
            
            // Inicializar todos los semestres hasta el actual del alumno
            for (let i = 1; i <= semestreActualAlumno; i++) {
                materiasPorSemestre[i] = { cursadas: [], cursando: [], faltantes: [], promedio_semestre: 0 };
            }
            
            // Separar materias activas (cursando) de las completadas
            const materiasCursando = calificacionesAgrupadas.filter(c => c.activa === 1);
            
            // Materias cursadas por semestre (agrupar por el semestre de la materia)
            // Primero agregamos las materias activas (cursando) en una sección separada
            materiasCursando.forEach(calif => {
                const semMateria = calif.materia.semestre || 1;
                // Si el semestre de la materia es mayor al actual del alumno, mostrar en el semestre actual
                const semParaMostrar = semMateria <= semestreActualAlumno ? semMateria : semestreActualAlumno;
                
                if (!materiasPorSemestre[semParaMostrar]) {
                    materiasPorSemestre[semParaMostrar] = { cursadas: [], cursando: [], faltantes: [], promedio_semestre: 0 };
                }
                // Agregar a "cursando" (materias activas)
                const yaExisteCursando = materiasPorSemestre[semParaMostrar].cursando.some(c => c.materia.id === calif.materia.id);
                if (!yaExisteCursando) {
                    materiasPorSemestre[semParaMostrar].cursando.push(calif);
                }
                // También agregar a "cursadas" si tiene promedio > 0 (materias completadas)
                if (calif.promedio_materia > 0) {
                    const yaExisteCursada = materiasPorSemestre[semParaMostrar].cursadas.some(c => c.materia.id === calif.materia.id);
                    if (!yaExisteCursada) {
                        materiasPorSemestre[semParaMostrar].cursadas.push(calif);
                    }
                }
            });

            // Materias faltantes por semestre (hasta el semestre actual del alumno)
            // Solo incluir materias que NO estén activas (no tienen calificaciones)
            todasMaterias.forEach(materia => {
                const semMateria = materia.semestre || 1;
                // Solo agregar a faltantes si NO está en las materias activas
                if (semMateria <= semestreActualAlumno && !materiasActivasIds.has(materia.id)) {
                    if (!materiasPorSemestre[semMateria]) {
                        materiasPorSemestre[semMateria] = { cursadas: [], cursando: [], faltantes: [], promedio_semestre: 0 };
                    }
                    // Solo agregar si no está ya en faltantes
                    const yaExiste = materiasPorSemestre[semMateria].faltantes.some(f => f.materia.id === materia.id);
                    if (!yaExiste) {
                        materiasPorSemestre[semMateria].faltantes.push({
                            materia: {
                                id: materia.id,
                                nombre: materia.nombre,
                                codigo: materia.codigo,
                                descripcion: materia.descripcion,
                                semestre: materia.semestre
                            }
                        });
                    }
                }
            });

            // Calcular promedios por semestre
            // Usar las materias "cursadas" (que tienen promedio > 0) para el cálculo
            Object.keys(materiasPorSemestre).forEach(sem => {
                const cursadas = materiasPorSemestre[sem].cursadas;
                // Solo incluir materias con promedio > 0 en el cálculo
                const materiasConPromedio = cursadas.filter(c => c.promedio_materia > 0);
                if (materiasConPromedio.length > 0) {
                    const promedio = materiasConPromedio.reduce((sum, c) => sum + c.promedio_materia, 0) / materiasConPromedio.length;
                    materiasPorSemestre[sem].promedio_semestre = parseFloat(promedio.toFixed(2));
                }
            });

            // Calcular promedio general (promedio de todos los promedios por materia con promedio > 0)
            const materiasConPromedio = calificacionesAgrupadas.filter(m => m.promedio_materia > 0);
            const promedioGeneral = materiasConPromedio.length > 0
                ? materiasConPromedio.reduce((sum, m) => sum + m.promedio_materia, 0) / materiasConPromedio.length
                : 0;

            // Calcular promedio general por semestres
            const promediosSemestres = Object.values(materiasPorSemestre)
                .filter(s => s.promedio_semestre > 0)
                .map(s => s.promedio_semestre);
            const promedioGeneralSemestres = promediosSemestres.length > 0
                ? promediosSemestres.reduce((sum, p) => sum + p, 0) / promediosSemestres.length
                : 0;

            // Obtener todas las materias cursando (activas) agrupadas
            const materiasCursandoGlobal = calificacionesAgrupadas.filter(c => c.activa === 1);
            
            console.log(`[getDetalleAlumno] RESUMEN FINAL para alumno ${alumnoID}:`);
            console.log(`  - Total calificaciones encontradas: ${calificaciones.length}`);
            console.log(`  - Materias agrupadas: ${calificacionesAgrupadas.length}`);
            console.log(`  - Materias cursando (activas): ${materiasCursandoGlobal.length} de ${calificacionesAgrupadas.length} totales`);
            console.log(`  - Materias por semestre: ${Object.keys(materiasPorSemestre).length} semestres`);
            
            Object.keys(materiasPorSemestre).forEach(sem => {
                const datos = materiasPorSemestre[sem];
                console.log(`    Semestre ${sem}: ${datos.cursando?.length || 0} cursando, ${datos.cursadas?.length || 0} cursadas, ${datos.faltantes?.length || 0} faltantes`);
            });
            
            materiasCursandoGlobal.forEach(m => {
                console.log(`  MATERIA CURSANDO: ${m.materia.nombre} (ID: ${m.materia.id}): activa=${m.activa}, promedio=${m.promedio_materia}, unidades=${m.unidades.length}`);
            });

            const respuestaFinal = {
                message: 'Detalle del alumno obtenido con éxito.',
                data: {
                    alumno: {
                        id: alumno.id,
                        nombre: alumno.nombre,
                        matricula: alumno.matricula,
                        grupo: alumno.grupo,
                        semestre_actual: alumno.semestre || 1
                    },
                    calificaciones: calificacionesAgrupadas,
                    materias_cursando: materiasCursandoGlobal, // Nuevo campo: todas las materias activas (cursando)
                    materias_por_semestre: materiasPorSemestre,
                    promedio_general: parseFloat(promedioGeneral.toFixed(2)),
                    promedio_general_semestres: parseFloat(promedioGeneralSemestres.toFixed(2)),
                    total_materias_cursadas: calificacionesAgrupadas.length,
                    total_materias_cursando: materiasCursandoGlobal.length, // Total de materias activas
                    total_semestres: 8
                }
            };
            
            console.log(`[getDetalleAlumno] ENVIANDO RESPUESTA:`, {
                total_calificaciones: respuestaFinal.data.calificaciones.length,
                total_materias_cursando: respuestaFinal.data.total_materias_cursando,
                materias_cursando_array_length: respuestaFinal.data.materias_cursando.length
            });

            res.json(respuestaFinal);

        } catch (error) {
            console.error('Error al obtener detalle del alumno:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },

    /**
     * Asigna múltiples materias a un alumno.
     * POST /api/controlescolar/alumnos/:alumnoID/materias
     */
    async asignarMateriasAAlumno(req, res) {
        const { alumnoID } = req.params;
        const { materia_ids } = req.body;

        if (!materia_ids || !Array.isArray(materia_ids) || materia_ids.length === 0) {
            return res.status(400).json({ message: 'Se requiere un array de IDs de materias (materia_ids).' });
        }

        try {
            // Verificar que el alumno existe
            const alumno = await Alumno.findByPk(alumnoID);
            if (!alumno) {
                return res.status(404).json({ message: 'Alumno no encontrado.' });
            }

            // Verificar que todas las materias existen
            const materias = await Materia.findAll({
                where: {
                    id: materia_ids
                }
            });

            if (materias.length !== materia_ids.length) {
                return res.status(400).json({ message: 'Una o más materias no existen.' });
            }

            // Para cada materia, verificar que tenga un maestro asignado
            const asignaciones = await Asignacion.findAll({
                where: {
                    materia_id: materia_ids
                },
                include: [
                    {
                        model: Usuario,
                        attributes: ['id', 'nombre']
                    }
                ]
            });

            const materiasSinMaestro = materia_ids.filter(materiaId => {
                return !asignaciones.some(asig => asig.materia_id === materiaId);
            });

            if (materiasSinMaestro.length > 0) {
                const materiasSinMaestroInfo = await Materia.findAll({
                    where: { id: materiasSinMaestro },
                    attributes: ['id', 'nombre', 'codigo']
                });
                return res.status(400).json({
                    message: `Las siguientes materias no tienen un maestro asignado: ${materiasSinMaestroInfo.map(m => m.nombre).join(', ')}. Primero asigna un maestro a estas materias.`,
                    materias_sin_maestro: materiasSinMaestroInfo
                });
            }

            // Verificar cuáles calificaciones ya existen para no duplicarlas
            // Buscamos solo si existe al menos una calificación activa por materia
            const calificacionesExistentes = await Calificacion.findAll({
                where: {
                    alumno_id: alumnoID,
                    materia_id: materia_ids,
                    deleted_at: null
                },
                attributes: ['materia_id'],
                group: ['materia_id']
            });

            const materiasYaInscritas = new Set(calificacionesExistentes.map(c => c.materia_id));
            const materiasNuevas = materia_ids.filter(id => !materiasYaInscritas.has(id));

            if (materiasNuevas.length === 0) {
                return res.status(409).json({
                    message: `El alumno ya está inscrito en todas las materias seleccionadas. Materias ya inscritas: ${Array.from(materiasYaInscritas).join(', ')}`,
                    materias_ya_inscritas: Array.from(materiasYaInscritas),
                    debug: {
                        materia_ids_solicitadas: materia_ids,
                        calificaciones_encontradas: calificacionesExistentes.map(c => c.materia_id)
                    }
                });
            }

            // Verificar cupos disponibles para cada materia nueva
            const cuposInfo = [];
            for (const materiaId of materiasNuevas) {
                const asignacion = asignaciones.find(a => a.materia_id === materiaId);
                if (!asignacion) continue;

                const calificacionesMateria = await Calificacion.count({
                    where: {
                        materia_id: materiaId,
                        deleted_at: null
                    }
                });

                const cupoDisponible = asignacion.cupo_maximo - calificacionesMateria;
                if (cupoDisponible <= 0) {
                    const materiaInfo = materias.find(m => m.id === materiaId);
                    cuposInfo.push({
                        materia_id: materiaId,
                        nombre: materiaInfo?.nombre || 'Desconocida',
                        cupo_disponible: 0,
                        cupo_maximo: asignacion.cupo_maximo
                    });
                }
            }

            if (cuposInfo.length > 0) {
                return res.status(400).json({
                    message: `Las siguientes materias no tienen cupo disponible: ${cuposInfo.map(c => c.nombre).join(', ')}.`,
                    materias_sin_cupo: cuposInfo
                });
            }

            // Crear calificaciones iniciales para las materias nuevas
            const calificacionesACrear = materiasNuevas.map(materiaId => {
                const asignacion = asignaciones.find(a => a.materia_id === materiaId);
                return {
                    alumno_id: alumnoID,
                    materia_id: materiaId,
                    maestro_id: asignacion.maestro_id,
                    nota: 0, // Nota inicial en 0 hasta que se califique
                    unidad: 1, // Primera unidad por defecto
                    observaciones: 'Alumno inscrito en la materia.'
                };
            });

            const calificacionesCreadas = await Calificacion.bulkCreate(calificacionesACrear, { returning: true });

            console.log(`✅ ${calificacionesCreadas.length} calificación(es) creada(s) para alumno ${alumnoID}:`, 
                calificacionesCreadas.map(c => `Materia ${c.materia_id}, Unidad ${c.unidad}, Nota ${c.nota}`).join(', '));

            res.status(201).json({
                message: `${calificacionesCreadas.length} materia(s) asignada(s) al alumno exitosamente.`,
                data: {
                    alumno: {
                        id: alumno.id,
                        nombre: alumno.nombre,
                        matricula: alumno.matricula
                    },
                    materias_asignadas: calificacionesCreadas.length,
                    materias_ya_inscritas: materiasYaInscritas.size,
                    calificaciones_creadas: calificacionesCreadas.map(c => ({
                        id: c.id,
                        materia_id: c.materia_id,
                        unidad: c.unidad,
                        nota: c.nota
                    })),
                    materias_nuevas: materiasNuevas.map(id => {
                        const materia = materias.find(m => m.id === id);
                        const asignacion = asignaciones.find(a => a.materia_id === id);
                        return {
                            id: materia?.id,
                            nombre: materia?.nombre,
                            codigo: materia?.codigo,
                            maestro: asignacion?.Usuario ? {
                                id: asignacion.Usuario.id,
                                nombre: asignacion.Usuario.nombre
                            } : null
                        };
                    })
                }
            });

        } catch (error) {
            console.error('Error al asignar materias al alumno:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    }
};

module.exports = AdminController;