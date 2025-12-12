const { sequelize, Usuario, Materia, Alumno, Calificacion , Asignacion} = require('../models');
const bcrypt = require('bcryptjs'); // Necesitas importar bcryptjs
const { Op } = require('sequelize');

// --- Datos de Prueba (Ahora con IDs Fijos) ---
const SEED_PASSWORD = 'password123';
const HASHED_PASSWORD = bcrypt.hashSync(SEED_PASSWORD, 10); 

const users = [
    // Asignamos IDs fijos: 1, 2, 3 para admin y maestros
    { id: 1, nombre: 'Admin Control Escolar', email: 'admin@escuela.com', password_hash: HASHED_PASSWORD, rol: 'CONTROL_ESCOLAR' },
    { id: 2, nombre: 'Maestro Juan Pérez', email: 'juan.perez@escuela.com', password_hash: HASHED_PASSWORD, rol: 'MAESTRO' },
    { id: 3, nombre: 'Maestra Ana López', email: 'ana.lopez@escuela.com', password_hash: HASHED_PASSWORD, rol: 'MAESTRO' },
    // Usuarios ALUMNO (IDs: 4, 5, 6, 7)
    { id: 4, nombre: 'Alumno Raúl Castro', email: 'raul.castro@escuela.com', password_hash: HASHED_PASSWORD, rol: 'ALUMNO' },
    { id: 5, nombre: 'Alumno Sofía García', email: 'sofia.garcia@escuela.com', password_hash: HASHED_PASSWORD, rol: 'ALUMNO' },
    { id: 6, nombre: 'Alumno Luis Hernández', email: 'luis.hernandez@escuela.com', password_hash: HASHED_PASSWORD, rol: 'ALUMNO' },
    { id: 7, nombre: 'Alumno Carolina Díaz', email: 'carolina.diaz@escuela.com', password_hash: HASHED_PASSWORD, rol: 'ALUMNO' }
];

const subjects = [
    // Asignamos IDs fijos: 1, 2, 3
    { id: 1, codigo: 'MAT101', nombre: 'Matemáticas Avanzadas', descripcion: 'Álgebra y Cálculo.' },
    { id: 2, codigo: 'PRO201', nombre: 'Programación Web', descripcion: 'Desarrollo Full Stack.' },
    { id: 3, codigo: 'HIS301', nombre: 'Historia Universal', descripcion: 'Desde la Edad Media al S. XXI.' }
];

const students = [
    // Vincular con usuarios: usuario_id 4, 5, 6, 7 corresponden a alumnos
    { id: 1, nombre: 'Alumno Raúl Castro', matricula: 'A1001', grupo: 'A', usuario_id: 4 },
    { id: 2, nombre: 'Alumno Sofía García', matricula: 'A1002', grupo: 'A', usuario_id: 5 },
    { id: 3, nombre: 'Alumno Luis Hernández', matricula: 'B2001', grupo: 'B', usuario_id: 6 },
    { id: 4, nombre: 'Alumno Carolina Díaz', matricula: 'B2002', grupo: 'B', usuario_id: 7 },
];

async function runSeeds() {
    console.log('\n=== Verificando datos de prueba ===');
    try {
        // Verificar si ya existen datos (usando el admin predeterminado)
        const adminExistente = await Usuario.findOne({ where: { email: 'admin@escuela.com' } });
        
        if (adminExistente) {
            console.log('✅ Datos de prueba ya existen. Saltando seeders para preservar datos existentes.');
            console.log('💡 Para recrear los datos de prueba, elimina manualmente los registros o configura SEED_FORCE=true');
            return;
        }

        console.log('📦 Creando datos de prueba iniciales...');
        
        // Solo limpiar si SEED_FORCE está configurado (para desarrollo/testing)
        if (process.env.SEED_FORCE === 'true') {
            console.log('⚠️  SEED_FORCE=true detectado. Limpiando datos existentes...');
            // 1. Limpieza total de datos (empezando por la tabla hija)
            await Calificacion.destroy({ where: {}, truncate: true, force: true }); 
            await Asignacion.destroy({ where: {}, truncate: true, force: true });
            await Usuario.destroy({ where: {}, truncate: true, cascade: true, force: true }); 
            await Materia.destroy({ where: {}, truncate: true, cascade: true, force: true }); 
            await Alumno.destroy({ where: {}, truncate: true, cascade: true, force: true }); 
            console.log('--- Tablas limpiadas.');
        }

        // 2. Creación de datos usando los IDs fijos
        const createdUsers = await Usuario.bulkCreate(users, { returning: true });
        console.log(`---- ${createdUsers.length} Usuarios (Admin/Maestros/Alumnos) creados.`);

        const createdSubjects = await Materia.bulkCreate(subjects, { returning: true });
        console.log(`---- ${createdSubjects.length} Materias creadas.`);

        const createdStudents = await Alumno.bulkCreate(students, { returning: true });
        console.log(`---- ${createdStudents.length} Alumnos creados.`);

        await sequelize.query(`ALTER SEQUENCE usuarios_id_seq RESTART WITH ${users.length + 1}`).catch(() => {});
        await sequelize.query(`ALTER SEQUENCE materias_id_seq RESTART WITH ${subjects.length + 1}`);
        await sequelize.query(`ALTER SEQUENCE alumnos_id_seq RESTART WITH ${students.length + 1}`);

        console.log('---- Secuencias de IDs reiniciadas.');

        const grades = [
            // Raúl en Matemáticas por Juan (escala 0-10)
            { alumno_id: 1, materia_id: 1, maestro_id: 2, nota: 9.5, observaciones: 'Excelente trabajo.' },
            // Sofía en Matemáticas por Juan (escala 0-10)
            { alumno_id: 2, materia_id: 1, maestro_id: 2, nota: 8.8, observaciones: 'Buen desempeño, puede mejorar.' },
            // Luis en Programación por Juan (escala 0-10)
            { alumno_id: 3, materia_id: 2, maestro_id: 2, nota: 7.5, observaciones: 'Desempeño satisfactorio.' },
            // Carolina en Historia por Ana (escala 0-10)
            { alumno_id: 4, materia_id: 3, maestro_id: 3, nota: 6.5, observaciones: 'Requiere más dedicación.' },
        ];

        const createdGrades = await Calificacion.bulkCreate(grades, { returning: true });
        console.log(`---- ${createdGrades.length} Calificaciones de prueba creadas.`);
 
        const assignmentGrades = [
            { maestro_id: 2, materia_id: 1, cupo_maximo: 40 }, // Juan -> Matemáticas
            { maestro_id: 2, materia_id: 2, cupo_maximo: 40 }, // Juan -> Programación
            { maestro_id: 3, materia_id: 3, cupo_maximo: 40 }, // Ana -> Historia
        ];
    
        const createdAssignments = await Asignacion.bulkCreate(assignmentGrades, { returning: true });
        console.log(` ${createdAssignments.length} Asignaciones (Maestro-Materia) creadas.`);
        console.log('Detalles de asignaciones creadas:', createdAssignments.map(a => ({
            id: a.id,
            maestro_id: a.maestro_id,
            materia_id: a.materia_id,
            cupo_maximo: a.cupo_maximo
        })));
        
        console.log('\n✅ Datos de prueba creados exitosamente!');
    } catch (error) {
        console.error('❌ Error en el proceso de Seeders:', error);
        throw error;
    }
}

// Exportamos la función para ejecutarla desde index.js
module.exports = runSeeds;