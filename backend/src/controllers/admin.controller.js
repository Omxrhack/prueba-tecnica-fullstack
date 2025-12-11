const { sequelize, Calificacion, Alumno, Materia, Usuario, Asignacion } = require('../models');

const AdminController = {
    
    /**
     * Genera un reporte global de promedios por alumno.
     * GET /api/controlescolar/reporte
     */
    async getReporteGlobal(req, res) {
        try {
            // Consulta para calcular el promedio de la nota por cada alumno.
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
                // Agrupamos por los campos del Alumno
                group: ['Alumno.id', 'Alumno.nombre', 'Alumno.matricula', 'Alumno.grupo'],
                // Ordenamos por el promedio general de forma descendente
                order: [[sequelize.col('promedio_general'), 'DESC']]
            });

            // Formatear la salida para asegurar que el promedio sea un decimal legible
            const data = reportes.map(r => ({
                alumno: r.Alumno,
                promedio_general: parseFloat(r.getDataValue('promedio_general')).toFixed(2)
            }));

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
            const [asignacion, created] = await Asignacion.findOrCreate({
                where: { maestro_id, materia_id },
                defaults: { cupo_maximo: cupo_maximo || 40 }
            });

            if (!created) {
                // Si ya existía, actualizamos el cupo (si se proporcionó)
                if (cupo_maximo) {
                    await asignacion.update({ cupo_maximo });
                }
                return res.json({ message: 'Asignación actualizada con éxito.', data: asignacion });
            }

            res.status(201).json({ message: 'Materia asignada con éxito.', data: asignacion });

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                 return res.status(409).json({ message: 'Esa materia ya está asignada a ese maestro.' });
            }
            console.error('Error al asignar materia:', error);
            res.status(500).json({ message: 'Error interno del servidor.' });
        }
    },
};

module.exports = AdminController;