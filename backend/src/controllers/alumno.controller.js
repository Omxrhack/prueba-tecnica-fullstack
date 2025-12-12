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
            // Verificar que el usuario existe y tiene rol ALUMNO
            const usuario = await Usuario.findByPk(usuarioId);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }
            
            if (usuario.rol !== 'ALUMNO') {
                return res.status(403).json({ 
                    message: `El usuario no tiene rol de ALUMNO. Rol actual: ${usuario.rol}` 
                });
            }

            // Buscar el alumno vinculado a este usuario (sin filtro deleted_at porque el modelo puede no tenerlo activado todavía)
            const alumno = await Alumno.findOne({ 
                where: { 
                    usuario_id: usuarioId
                } 
            });

            if (!alumno) {
                console.error(`Usuario ${usuarioId} (${usuario.email}) no tiene un registro de Alumno asociado.`);
                return res.status(404).json({ 
                    message: 'No se encontró un registro de alumno asociado a tu usuario. Contacta al administrador para vincular tu cuenta con un registro de alumno.' 
                });
            }

            // Obtener todas las calificaciones del alumno (agrupadas por materia y unidad, solo activas)
            // IMPORTANTE: required: false para incluir calificaciones incluso si la materia fue eliminada (soft delete)
            const calificaciones = await Calificacion.findAll({
                where: {
                    alumno_id: alumno.id,
                    deleted_at: null
                },
                include: [
                    {
                        model: Materia,
                        attributes: ['id', 'nombre', 'codigo', 'descripcion', 'semestre'],
                        required: false // Incluir calificaciones incluso si la materia fue eliminada
                    },
                    {
                        model: Usuario,
                        as: 'Maestro',
                        attributes: ['id', 'nombre', 'email'],
                        required: false
                    }
                ],
                order: [
                    // Ordenar por unidad primero (siempre disponible), luego ordenaremos por materia en el código
                    ['unidad', 'ASC']
                ]
            });

            // Log de depuración: contar calificaciones encontradas
            console.log(`[getMisCalificaciones] Alumno ${alumno.id} (${alumno.matricula}): ${calificaciones.length} calificaciones encontradas`);
            const calificacionesSinMateria = calificaciones.filter(c => !c.Materia);
            if (calificacionesSinMateria.length > 0) {
                console.warn(`[getMisCalificaciones] ⚠️  ${calificacionesSinMateria.length} calificaciones sin Materia asociada (materia_id: ${calificacionesSinMateria.map(c => c.materia_id).join(', ')})`);
            }

            // Obtener todas las materias disponibles agrupadas por semestre
            const todasMaterias = await Materia.findAll({
                attributes: ['id', 'nombre', 'codigo', 'descripcion', 'semestre'],
                order: [['semestre', 'ASC'], ['nombre', 'ASC']]
            });

            // Agrupar calificaciones por materia
            const materiasMap = {};
            const materiasIdNecesarias = new Set(calificaciones.map(c => c.materia_id).filter(id => id != null));
            
            // Si hay calificaciones sin Materia cargada, obtener las materias manualmente
            if (materiasIdNecesarias.size > 0) {
                const materiasFaltantes = await Materia.findAll({
                    where: {
                        id: Array.from(materiasIdNecesarias)
                    },
                    attributes: ['id', 'nombre', 'codigo', 'descripcion', 'semestre']
                });
                
                // Crear un mapa de materias para acceso rápido
                const materiasMapa = {};
                materiasFaltantes.forEach(m => {
                    materiasMapa[m.id] = m;
                });
                
                // Agregar las materias faltantes a las calificaciones
                calificaciones.forEach(c => {
                    if (!c.Materia && c.materia_id && materiasMapa[c.materia_id]) {
                        c.Materia = materiasMapa[c.materia_id];
                    }
                });
            }
            
            calificaciones.forEach((c) => {
                const materiaId = c.materia_id;
                
                // Saltar si no hay materia_id o si la materia no existe
                if (!materiaId) {
                    console.warn(`[getMisCalificaciones] Calificación ${c.id} sin materia_id, omitiendo`);
                    return;
                }
                
                if (!materiasMap[materiaId]) {
                    let materia = c.Materia;
                    
                    // Si aún no tenemos la materia, intentar obtenerla
                    if (!materia) {
                        console.warn(`[getMisCalificaciones] Calificación ${c.id} sin Materia asociada para materia_id ${materiaId}, omitiendo`);
                        return;
                    }

                    let maestro = c.Maestro;
                    if (!maestro && c.maestro_id) {
                        // Se cargará después si es necesario
                    }

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

                // Agregar unidad
                materiasMap[materiaId].unidades.push({
                    unidad: c.unidad || 1,
                    nota: parseFloat(c.nota),
                    observaciones: c.observaciones || '',
                    fecha_registro: c.created_at
                });
            });
            
            console.log(`[getMisCalificaciones] Materias agrupadas: ${Object.keys(materiasMap).length} materias con calificaciones`);
            
            // Log de depuración: mostrar materias encontradas
            Object.values(materiasMap).forEach(m => {
                console.log(`  - Materia ${m.materia.id} (${m.materia.nombre}): ${m.unidades.length} unidades, notas: ${m.unidades.map(u => u.nota).join(', ')}`);
            });

            // Calcular promedios por materia y determinar si está activa (cursando)
            // Ordenar por semestre y nombre de materia
            const calificacionesAgrupadas = Object.values(materiasMap)
                .sort((a, b) => {
                    // Ordenar por semestre primero
                    const semA = a.materia.semestre || 999;
                    const semB = b.materia.semestre || 999;
                    if (semA !== semB) return semA - semB;
                    // Luego por nombre
                    return (a.materia.nombre || '').localeCompare(b.materia.nombre || '');
                })
                .map(materiaData => {
                const notas = materiaData.unidades.map(u => u.nota);
                const promedio = notas.length > 0
                    ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length
                    : 0;

                // Una materia está activa (cursando) si tiene al menos una calificación con deleted_at: null
                // Consideramos que está "cursando" si tiene al menos una unidad con nota > 0 O todas las unidades tienen nota = 0 pero existen calificaciones
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
            const semestreActualAlumno = alumno.semestre || 1;
            
            // Inicializar todos los semestres hasta el actual del alumno
            for (let i = 1; i <= semestreActualAlumno; i++) {
                materiasPorSemestre[i] = { cursadas: [], cursando: [], faltantes: [], promedio_semestre: 0 };
            }
            
            // Separar materias activas (cursando) de las completadas
            const materiasCursando = calificacionesAgrupadas.filter(c => c.activa === 1);
            const materiasCompletadas = calificacionesAgrupadas.filter(c => c.activa === 1 && c.promedio_materia > 0);
            
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
            const promediosPorSemestre = {};
            Object.keys(materiasPorSemestre).forEach(sem => {
                const semNum = parseInt(sem);
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
            
            console.log(`[getMisCalificaciones] Materias cursando (activas): ${materiasCursandoGlobal.length} de ${calificacionesAgrupadas.length} totales`);
            materiasCursandoGlobal.forEach(m => {
                console.log(`  - ${m.materia.nombre} (ID: ${m.materia.id}): activa=${m.activa}, promedio=${m.promedio_materia}, unidades=${m.unidades.length}`);
            });

            res.json({
                message: 'Calificaciones obtenidas con éxito',
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
                    total_materias: calificacionesAgrupadas.length,
                    total_materias_cursando: materiasCursandoGlobal.length, // Total de materias activas
                    total_semestres: 8
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
            // Buscar el alumno vinculado a este usuario (solo activos, sin soft delete)
            const alumno = await Alumno.findOne({ 
                where: { 
                    usuario_id: usuarioId,
                    deleted_at: null
                } 
            });

            if (!alumno) {
                return res.status(404).json({ message: 'Alumno no encontrado para este usuario.' });
            }

            // Verificar que la materia existe
            const materiaVerificada = await Materia.findByPk(materiaId);
            if (!materiaVerificada) {
                return res.status(404).json({ message: 'Materia no encontrada.' });
            }

            // Obtener todas las calificaciones del alumno en esta materia (puede haber múltiples por unidad, solo activas)
            const calificaciones = await Calificacion.findAll({
                where: {
                    alumno_id: alumno.id,
                    materia_id: materiaId,
                    deleted_at: null
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
                order: [['unidad', 'ASC']]
            });

            if (calificaciones.length === 0) {
                return res.json({
                    message: 'No hay calificaciones registradas para esta materia',
                    data: {
                        materia: {
                            id: materiaVerificada.id,
                            nombre: materiaVerificada.nombre,
                            codigo: materiaVerificada.codigo,
                            descripcion: materiaVerificada.descripcion || null
                        },
                        unidades: [],
                        promedio_materia: 0
                    }
                });
            }

            // Validar relaciones
            let materiaCalificacion = calificaciones[0].Materia;
            if (!materiaCalificacion) {
                materiaCalificacion = await Materia.findByPk(calificaciones[0].materia_id);
            }

            let maestro = calificaciones[0].Maestro;
            if (!maestro && calificaciones[0].maestro_id) {
                maestro = await Usuario.findByPk(calificaciones[0].maestro_id);
            }

            if (!materiaCalificacion) {
                return res.status(404).json({ message: 'Materia no encontrada para esta calificación.' });
            }

            // Formatear unidades
            const unidades = calificaciones.map(c => ({
                unidad: c.unidad || 1,
                nota: parseFloat(c.nota),
                observaciones: c.observaciones || '',
                fecha_registro: c.created_at
            }));

            // Calcular promedio
            const notas = unidades.map(u => u.nota);
            const promedio = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;

            res.json({
                message: 'Calificaciones obtenidas con éxito',
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
                    unidades: unidades,
                    promedio_materia: parseFloat(promedio.toFixed(2))
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
            // Buscar el alumno vinculado a este usuario (solo activos, sin soft delete)
            const alumno = await Alumno.findOne({ 
                where: { 
                    usuario_id: usuarioId,
                    deleted_at: null
                } 
            });

            if (!alumno) {
                return res.status(404).json({ message: 'Alumno no encontrado para este usuario.' });
            }

            // Calcular promedio usando Sequelize (promedio de promedios por materia)
            const calificacionesPorMateria = await Calificacion.findAll({
                attributes: [
                    'materia_id',
                    [sequelize.fn('AVG', sequelize.col('nota')), 'promedio_materia']
                ],
                where: {
                    alumno_id: alumno.id
                },
                group: ['materia_id'],
                raw: true
            });

            // Calcular promedio general (promedio de promedios por materia)
            const promedios = calificacionesPorMateria.map(r => parseFloat(r.promedio_materia || 0));
            const promedioGeneral = promedios.length > 0
                ? promedios.reduce((sum, prom) => sum + prom, 0) / promedios.length
                : 0;

            // Estadísticas adicionales
            const todasCalificaciones = await Calificacion.findAll({
                attributes: ['nota'],
                where: {
                    alumno_id: alumno.id
                },
                raw: true
            });

            const todasNotas = todasCalificaciones.map(c => parseFloat(c.nota || 0));
            const notaMinima = todasNotas.length > 0 ? Math.min(...todasNotas) : null;
            const notaMaxima = todasNotas.length > 0 ? Math.max(...todasNotas) : null;

            res.json({
                message: 'Promedio obtenido con éxito',
                data: {
                    alumno: {
                        id: alumno.id,
                        nombre: alumno.nombre,
                        matricula: alumno.matricula,
                        grupo: alumno.grupo
                    },
                    promedio_general: parseFloat(promedioGeneral.toFixed(2)),
                    total_materias: calificacionesPorMateria.length,
                    nota_minima: notaMinima !== null ? parseFloat(notaMinima.toFixed(2)) : null,
                    nota_maxima: notaMaxima !== null ? parseFloat(notaMaxima.toFixed(2)) : null
                }
            });

        } catch (error) {
            console.error('Error al obtener promedio del alumno:', error);
            throw error;
        }
    }
};

module.exports = AlumnoController;
