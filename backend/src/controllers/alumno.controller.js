const { Calificacion, Materia, Alumno, Usuario, sequelize } = require('../models');

const AlumnoController = {
    
    /**
     * Obtiene todas las calificaciones del alumno autenticado.
     * GET /api/alumno/calificaciones
     */
    async getMisCalificaciones(req, res) {
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(400).json({ message: 'ID de usuario no encontrado en el token.' });
        }

        try {
            // Buscar el alumno vinculado a este usuario
            const alumno = await Alumno.findOne({ where: { usuario_id: usuarioId } });

            if (!alumno) {
                return res.status(404).json({ message: 'Alumno no encontrado para este usuario.' });
            }

            // Obtener todas las calificaciones del alumno (excluyendo soft deletes)
            // Con paranoid: true, Sequelize automáticamente filtra deleted_at: null
            const calificaciones = await Calificacion.findAll({
                where: {
                    alumno_id: alumno.id
                },
                include: [
                    {
                        model: Materia,
                        attributes: ['id', 'nombre', 'codigo', 'descripcion']
                    },
                    {
                        model: Usuario,
                        as: 'Maestro',
                        attributes: ['id', 'nombre', 'email'],
                        required: false
                    }
                ],
                order: [[Materia, 'nombre', 'ASC']]
            });

            // Formatear respuesta - con validación de relaciones
            const data = await Promise.all(calificaciones.map(async (c) => {
                // Si Materia no se cargó en el include, cargarla manualmente
                let materia = c.Materia;
                if (!materia) {
                    materia = await Materia.findByPk(c.materia_id);
                }

                // Si Maestro no se cargó en el include, cargarlo manualmente
                let maestro = c.Maestro;
                if (!maestro && c.maestro_id) {
                    maestro = await Usuario.findByPk(c.maestro_id);
                }

                if (!materia) {
                    console.warn(`Materia con ID ${c.materia_id} no encontrada para calificación ${c.id}`);
                    return null;
                }

                return {
                    id: c.id,
                    materia: {
                        id: materia.id,
                        nombre: materia.nombre,
                        codigo: materia.codigo || null,
                        descripcion: materia.descripcion || null
                    },
                    maestro: maestro ? {
                        id: maestro.id,
                        nombre: maestro.nombre
                    } : null,
                    nota: parseFloat(c.nota),
                    observaciones: c.observaciones || '',
                    fecha_registro: c.created_at
                };
            }));

            // Filtrar nulls (calificaciones con materias no encontradas)
            const dataFiltrada = data.filter(item => item !== null);

            // Calcular promedio general
            const promedio = calificaciones.length > 0
                ? calificaciones.reduce((sum, c) => sum + parseFloat(c.nota || 0), 0) / calificaciones.length
                : 0;

            res.json({
                message: 'Calificaciones obtenidas con éxito',
                data: {
                    alumno: {
                        id: alumno.id,
                        nombre: alumno.nombre,
                        matricula: alumno.matricula,
                        grupo: alumno.grupo
                    },
                    calificaciones: dataFiltrada,
                    promedio_general: parseFloat(promedio.toFixed(2)),
                    total_materias: dataFiltrada.length
                }
            });

        } catch (error) {
            console.error('Error al obtener calificaciones del alumno:', error);
            throw error;
        }
    },

    /**
     * Obtiene las calificaciones del alumno filtradas por materia.
     * GET /api/alumno/calificaciones/:materiaID
     */
    async getCalificacionesPorMateria(req, res) {
        const usuarioId = req.user?.id;
        const materiaId = parseInt(req.params.materiaID);

        if (!usuarioId) {
            return res.status(400).json({ message: 'ID de usuario no encontrado en el token.' });
        }

        try {
            // Buscar el alumno vinculado a este usuario
            const alumno = await Alumno.findOne({ where: { usuario_id: usuarioId } });

            if (!alumno) {
                return res.status(404).json({ message: 'Alumno no encontrado para este usuario.' });
            }

            // Verificar que la materia existe
            const materiaVerificada = await Materia.findByPk(materiaId);
            if (!materiaVerificada) {
                return res.status(404).json({ message: 'Materia no encontrada.' });
            }

            // Obtener calificaciones del alumno en esta materia
            // Con paranoid: true, Sequelize automáticamente filtra deleted_at: null
            const calificacion = await Calificacion.findOne({
                where: {
                    alumno_id: alumno.id,
                    materia_id: materiaId
                },
                include: [
                    {
                        model: Materia,
                        attributes: ['id', 'nombre', 'codigo', 'descripcion']
                    },
                    {
                        model: Usuario,
                        as: 'Maestro',
                        attributes: ['id', 'nombre', 'email'],
                        required: false
                    }
                ]
            });

            if (!calificacion) {
                return res.json({
                    message: 'No hay calificación registrada para esta materia',
                    data: {
                        materia: {
                            id: materiaVerificada.id,
                            nombre: materiaVerificada.nombre,
                            codigo: materiaVerificada.codigo
                        },
                        calificacion: null
                    }
                });
            }

            // Validar que la materia se cargó correctamente desde el include
            let materiaCalificacion = calificacion.Materia;
            if (!materiaCalificacion) {
                materiaCalificacion = await Materia.findByPk(calificacion.materia_id);
            }

            // Validar que el maestro se cargó correctamente
            let maestro = calificacion.Maestro;
            if (!maestro && calificacion.maestro_id) {
                maestro = await Usuario.findByPk(calificacion.maestro_id);
            }

            if (!materiaCalificacion) {
                return res.status(404).json({ message: 'Materia no encontrada para esta calificación.' });
            }

            res.json({
                message: 'Calificación obtenida con éxito',
                data: {
                    materia: {
                        id: materiaCalificacion.id,
                        nombre: materiaCalificacion.nombre,
                        codigo: materiaCalificacion.codigo || null,
                        descripcion: materiaCalificacion.descripcion || null
                    },
                    maestro: maestro ? {
                        id: maestro.id,
                        nombre: maestro.nombre
                    } : null,
                    nota: parseFloat(calificacion.nota),
                    observaciones: calificacion.observaciones || '',
                    fecha_registro: calificacion.created_at
                }
            });

        } catch (error) {
            console.error('Error al obtener calificación por materia:', error);
            throw error;
        }
    },

    /**
     * Obtiene el promedio general del alumno y estadísticas.
     * GET /api/alumno/promedio
     */
    async getMiPromedio(req, res) {
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(400).json({ message: 'ID de usuario no encontrado en el token.' });
        }

        try {
            // Buscar el alumno vinculado a este usuario
            const alumno = await Alumno.findOne({ where: { usuario_id: usuarioId } });

            if (!alumno) {
                return res.status(404).json({ message: 'Alumno no encontrado para este usuario.' });
            }

            // Calcular promedio usando Sequelize
            // Con paranoid: true, Sequelize automáticamente filtra deleted_at: null
            const resultado = await Calificacion.findOne({
                attributes: [
                    [sequelize.fn('AVG', sequelize.col('nota')), 'promedio'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_materias'],
                    [sequelize.fn('MIN', sequelize.col('nota')), 'nota_minima'],
                    [sequelize.fn('MAX', sequelize.col('nota')), 'nota_maxima']
                ],
                where: {
                    alumno_id: alumno.id
                },
                raw: true
            });

            const promedio = resultado?.promedio ? parseFloat(resultado.promedio) : 0;
            const totalMaterias = parseInt(resultado?.total_materias || 0);

            res.json({
                message: 'Promedio obtenido con éxito',
                data: {
                    alumno: {
                        id: alumno.id,
                        nombre: alumno.nombre,
                        matricula: alumno.matricula,
                        grupo: alumno.grupo
                    },
                    promedio_general: parseFloat(promedio.toFixed(2)),
                    total_materias: totalMaterias,
                    nota_minima: resultado?.nota_minima ? parseFloat(resultado.nota_minima).toFixed(2) : null,
                    nota_maxima: resultado?.nota_maxima ? parseFloat(resultado.nota_maxima).toFixed(2) : null
                }
            });

        } catch (error) {
            console.error('Error al obtener promedio del alumno:', error);
            throw error;
        }
    }
};

module.exports = AlumnoController;
