const { sequelize, Usuario, Materia, Alumno, Calificacion, Asignacion } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { generarMaestros, generarMaterias, generarUsuariosAlumnos, generarAlumnos } = require('./generateSeeds');

const SEED_PASSWORD = 'password123';
const HASHED_PASSWORD = bcrypt.hashSync(SEED_PASSWORD, 10);

async function runSeeds() {
    console.log('\n=== Generando datos masivos (50 maestros, 50 materias, 50 alumnos) ===');
    try {
        // Verificar si ya existen los 50 datos
        const countMaestros = await Usuario.count({ where: { rol: 'MAESTRO' } });
        const countMaterias = await Materia.count();
        const countAlumnos = await Alumno.count();
        const adminExistente = await Usuario.findOne({ where: { email: 'admin@escuela.com' } });
        
        console.log(`[Seeds] Estado actual: ${countMaestros} maestros, ${countMaterias} materias, ${countAlumnos} alumnos`);
        
        // Si ya existen los datos completos y no se fuerza regeneración, no hacer nada
        if (countMaestros >= 50 && countMaterias >= 50 && countAlumnos >= 50 && process.env.SEED_FORCE !== 'true') {
            console.log('✓ Datos ya existen (50 maestros, 50 materias, 50 alumnos). Usa SEED_FORCE=true para regenerar.');
            return;
        }
        
        // Si se fuerza o no existen todos los datos, continuar
        if (process.env.SEED_FORCE === 'true') {
            console.log('⚠️ SEED_FORCE=true detectado. Regenerando todos los datos...');
        } else if (countMaestros < 50 || countMaterias < 50 || countAlumnos < 50) {
            console.log('⚠️ Faltan datos. Generando los faltantes...');
        }

        if (process.env.SEED_FORCE === 'true') {
            console.log(' Limpiando datos existentes...');
            await Calificacion.destroy({ where: {}, truncate: true, force: true, cascade: true });
            await Asignacion.destroy({ where: {}, truncate: true, force: true, cascade: true });
            await Alumno.destroy({ where: {}, truncate: true, force: true, cascade: true });
            await Materia.destroy({ where: {}, truncate: true, force: true, cascade: true });
            await Usuario.destroy({ where: {}, truncate: true, force: true, cascade: true });
            console.log('--- Tablas limpiadas.');
        }

        // 1. Crear Admin (solo si no existe)
        let admin = await Usuario.findOne({ where: { email: 'admin@escuela.com' } });
        if (!admin) {
            admin = await Usuario.create({
                nombre: 'Admin Control Escolar',
                email: 'admin@escuela.com',
                password_hash: HASHED_PASSWORD,
                rol: 'CONTROL_ESCOLAR'
            });
            console.log('✓ Admin creado.');
        } else {
            console.log('✓ Admin ya existe.');
        }

        // 2. Crear 50 maestros (solo si faltan)
        let maestrosUsuarios = [];
        const maestrosActuales = await Usuario.findAll({ where: { rol: 'MAESTRO' }, attributes: ['id', 'nombre', 'email'] });
        if (maestrosActuales.length < 50) {
            const maestrosNecesarios = 50 - maestrosActuales.length;
            console.log(`Creando ${maestrosNecesarios} maestros adicionales...`);
            const maestrosData = generarMaestros();
            // Filtrar emails que ya existen
            const emailsExistentes = new Set(maestrosActuales.map(m => m.email));
            const maestrosNuevos = maestrosData.filter(m => !emailsExistentes.has(m.email)).slice(0, maestrosNecesarios);
            
            if (maestrosNuevos.length > 0) {
                const maestrosCreados = await Usuario.bulkCreate(maestrosNuevos, { returning: true });
                maestrosUsuarios = [...maestrosActuales, ...maestrosCreados];
                console.log(`✓ ${maestrosCreados.length} maestros nuevos creados. Total: ${maestrosUsuarios.length}`);
            } else {
                maestrosUsuarios = maestrosActuales;
                console.log(`✓ Ya existen ${maestrosActuales.length} maestros.`);
            }
        } else {
            maestrosUsuarios = maestrosActuales;
            console.log(`✓ Ya existen ${maestrosActuales.length} maestros.`);
        }

        // 3. Crear 50 materias (solo si faltan)
        let materias = [];
        const materiasActuales = await Materia.findAll({ attributes: ['id', 'codigo', 'nombre', 'semestre'] });
        if (materiasActuales.length < 50) {
            const materiasNecesarias = 50 - materiasActuales.length;
            console.log(`Creando ${materiasNecesarias} materias adicionales...`);
            const materiasData = generarMaterias();
            // Filtrar códigos que ya existen
            const codigosExistentes = new Set(materiasActuales.map(m => m.codigo));
            const materiasNuevas = materiasData.filter(m => !codigosExistentes.has(m.codigo)).slice(0, materiasNecesarias);
            
            if (materiasNuevas.length > 0) {
                const materiasCreadas = await Materia.bulkCreate(materiasNuevas, { returning: true });
                materias = [...materiasActuales, ...materiasCreadas];
                console.log(`✓ ${materiasCreadas.length} materias nuevas creadas. Total: ${materias.length}`);
            } else {
                materias = materiasActuales;
                console.log(`✓ Ya existen ${materiasActuales.length} materias.`);
            }
        } else {
            materias = materiasActuales;
            console.log(`✓ Ya existen ${materiasActuales.length} materias.`);
        }

        // 4. Crear usuarios alumnos (solo si faltan)
        let usuariosAlumnos = [];
        const usuariosAlumnosActuales = await Usuario.findAll({ where: { rol: 'ALUMNO' }, attributes: ['id', 'nombre', 'email'] });
        if (usuariosAlumnosActuales.length < 50) {
            const usuariosNecesarios = 50 - usuariosAlumnosActuales.length;
            console.log(`Creando ${usuariosNecesarios} usuarios alumnos adicionales...`);
            const usuariosAlumnosData = generarUsuariosAlumnos();
            // Filtrar emails que ya existen
            const emailsExistentes = new Set(usuariosAlumnosActuales.map(u => u.email));
            const usuariosNuevos = usuariosAlumnosData.filter(u => !emailsExistentes.has(u.email)).slice(0, usuariosNecesarios);
            
            if (usuariosNuevos.length > 0) {
                const usuariosCreados = await Usuario.bulkCreate(usuariosNuevos, { returning: true });
                usuariosAlumnos = [...usuariosAlumnosActuales, ...usuariosCreados];
                console.log(`✓ ${usuariosCreados.length} usuarios alumnos nuevos creados. Total: ${usuariosAlumnos.length}`);
            } else {
                usuariosAlumnos = usuariosAlumnosActuales;
                console.log(`✓ Ya existen ${usuariosAlumnosActuales.length} usuarios alumnos.`);
            }
        } else {
            usuariosAlumnos = usuariosAlumnosActuales;
            console.log(`✓ Ya existen ${usuariosAlumnosActuales.length} usuarios alumnos.`);
        }

        // 5. Crear 50 alumnos (solo si faltan)
        let alumnos = [];
        const alumnosActuales = await Alumno.findAll({ attributes: ['id', 'matricula', 'nombre', 'semestre', 'usuario_id'] });
        if (alumnosActuales.length < 50) {
            const alumnosNecesarios = 50 - alumnosActuales.length;
            console.log(`Creando ${alumnosNecesarios} alumnos adicionales...`);
            
            // Obtener usuarios alumnos que NO están asociados a un alumno aún
            const usuariosConAlumno = new Set(alumnosActuales.map(a => a.usuario_id));
            const usuariosDisponibles = usuariosAlumnos.filter(u => !usuariosConAlumno.has(u.id));
            
            if (usuariosDisponibles.length >= alumnosNecesarios) {
                const alumnosData = generarAlumnos(usuariosDisponibles.slice(0, alumnosNecesarios));
                // Filtrar matrículas que ya existen
                const matriculasExistentes = new Set(alumnosActuales.map(a => a.matricula));
                const alumnosNuevos = alumnosData.filter(a => !matriculasExistentes.has(a.matricula));
                
                if (alumnosNuevos.length > 0) {
                    const alumnosCreados = await Alumno.bulkCreate(alumnosNuevos, { returning: true });
                    alumnos = [...alumnosActuales, ...alumnosCreados];
                    console.log(`✓ ${alumnosCreados.length} alumnos nuevos creados. Total: ${alumnos.length}`);
                } else {
                    alumnos = alumnosActuales;
                    console.log(`✓ Ya existen ${alumnosActuales.length} alumnos.`);
                }
            } else {
                alumnos = alumnosActuales;
                console.log(`⚠️ No hay suficientes usuarios alumnos disponibles. Solo ${usuariosDisponibles.length} disponibles, se necesitan ${alumnosNecesarios}.`);
            }
        } else {
            alumnos = alumnosActuales;
            console.log(`✓ Ya existen ${alumnosActuales.length} alumnos.`);
        }
        
        // Obtener todas las listas completas después de crear los nuevos registros
        maestrosUsuarios = await Usuario.findAll({ where: { rol: 'MAESTRO' }, attributes: ['id', 'nombre', 'email'] });
        materias = await Materia.findAll({ attributes: ['id', 'codigo', 'nombre', 'semestre'] });
        alumnos = await Alumno.findAll({ attributes: ['id', 'matricula', 'nombre', 'semestre', 'usuario_id'] });
        
        console.log(`\n✓ Total final: ${maestrosUsuarios.length} maestros, ${materias.length} materias, ${alumnos.length} alumnos`);

        // 6. Asignar materias a maestros (cada maestro tiene 1-3 materias)
        // Verificar qué asignaciones ya existen
        const asignacionesExistentes = await Asignacion.findAll({ attributes: ['maestro_id', 'materia_id'] });
        const asignacionesSet = new Set(asignacionesExistentes.map(a => `${a.maestro_id}-${a.materia_id}`));
        
        const nuevasAsignaciones = [];
        let materiaIndex = 0;
        for (const maestro of maestrosUsuarios) {
            const materiasPorMaestro = Math.floor(Math.random() * 3) + 1; // 1-3 materias
            for (let i = 0; i < materiasPorMaestro && materiaIndex < materias.length; i++) {
                const key = `${maestro.id}-${materias[materiaIndex].id}`;
                if (!asignacionesSet.has(key)) {
                    nuevasAsignaciones.push({
                        maestro_id: maestro.id,
                        materia_id: materias[materiaIndex].id,
                        cupo_maximo: 40
                    });
                    asignacionesSet.add(key);
                }
                materiaIndex++;
            }
        }
        
        let asignacionesCreadas = asignacionesExistentes;
        if (nuevasAsignaciones.length > 0) {
            const asignacionesCreadasNew = await Asignacion.bulkCreate(nuevasAsignaciones, { returning: true });
            asignacionesCreadas = [...asignacionesExistentes, ...asignacionesCreadasNew];
            console.log(`✓ ${nuevasAsignaciones.length} nuevas asignaciones (maestro-materia) creadas. Total: ${asignacionesCreadas.length}`);
        } else {
            console.log(`✓ Ya existen ${asignacionesExistentes.length} asignaciones.`);
        }

        // 7. Asignar materias a alumnos según su semestre actual (solo si no tienen calificaciones)
        // Verificar qué calificaciones ya existen
        const calificacionesExistentes = await Calificacion.findAll({ 
            attributes: ['alumno_id', 'materia_id', 'unidad'],
            where: { deleted_at: null }
        });
        const calificacionesSet = new Set(
            calificacionesExistentes.map(c => `${c.alumno_id}-${c.materia_id}-${c.unidad}`)
        );
        
        const nuevasCalificaciones = [];
        for (const alumno of alumnos) {
            // Obtener materias del semestre actual y anteriores
            const materiasDisponibles = materias.filter(m => m.semestre <= alumno.semestre);
            // Verificar si el alumno ya tiene calificaciones
            const calificacionesAlumno = calificacionesExistentes.filter(c => c.alumno_id === alumno.id);
            const materiasAlumno = [...new Set(calificacionesAlumno.map(c => c.materia_id))];
            
            // Si el alumno no tiene materias asignadas o tiene menos de 2, asignar algunas
            let materiasACursar = [];
            if (materiasAlumno.length === 0) {
                // Asignar 2-4 materias aleatorias
                materiasACursar = materiasDisponibles
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Math.floor(Math.random() * 3) + 2);
            } else if (materiasAlumno.length < 2) {
                // Asignar 1-2 materias adicionales
                const materiasSinAsignar = materiasDisponibles.filter(m => !materiasAlumno.includes(m.id));
                materiasACursar = materiasSinAsignar
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Math.floor(Math.random() * 2) + 1);
            }

            for (const materia of materiasACursar) {
                // Buscar maestro asignado a esta materia
                const asignacion = asignacionesCreadas.find(a => a.materia_id === materia.id);
                if (asignacion) {
                    // Crear calificaciones por unidades (1-3 unidades calificadas por materia)
                    const unidadesACalificar = Math.floor(Math.random() * 3) + 1;
                    for (let unidad = 1; unidad <= unidadesACalificar && unidad <= 5; unidad++) {
                        const key = `${alumno.id}-${materia.id}-${unidad}`;
                        if (!calificacionesSet.has(key)) {
                            nuevasCalificaciones.push({
                                alumno_id: alumno.id,
                                materia_id: materia.id,
                                maestro_id: asignacion.maestro_id,
                                nota: parseFloat((Math.random() * 4 + 6).toFixed(2)), // Notas entre 6-10
                                unidad: unidad,
                                observaciones: `Calificación de unidad ${unidad} - Semestre ${materia.semestre}`
                            });
                            calificacionesSet.add(key);
                        }
                    }
                }
            }
        }
        
        let calificacionesCreadas = calificacionesExistentes;
        if (nuevasCalificaciones.length > 0) {
            const calificacionesCreadasNew = await Calificacion.bulkCreate(nuevasCalificaciones, { returning: true });
            calificacionesCreadas = [...calificacionesExistentes, ...calificacionesCreadasNew];
            console.log(`✓ ${nuevasCalificaciones.length} nuevas calificaciones por unidades creadas. Total: ${calificacionesCreadas.length}`);
        } else {
            console.log(`✓ Ya existen ${calificacionesExistentes.length} calificaciones.`);
        }

        console.log('\n Todos los datos masivos creados exitosamente!');
        console.log(` Resumen:`);
        console.log(`   - 1 Admin`);
        console.log(`   - ${maestrosUsuarios.length} Maestros`);
        console.log(`   - ${materias.length} Materias (distribuidas en 8 semestres)`);
        console.log(`   - ${alumnos.length} Alumnos (con semestres 1-8)`);
        console.log(`   - ${asignacionesCreadas.length} Asignaciones`);
        console.log(`   - ${calificacionesCreadas.length} Calificaciones por unidades`);

    } catch (error) {
        console.error('❌ Error en el proceso de Seeders:', error);
        throw error;
    }
}



module.exports = runSeeds;