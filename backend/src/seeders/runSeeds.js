const { sequelize, Usuario, Materia, Alumno, Calificacion , Asignacion} = require('../models');
const bcrypt = require('bcryptjs'); // Necesitas importar bcryptjs
const { Op } = require('sequelize');

// --- Datos de Prueba (Ahora con IDs Fijos) ---
const SEED_PASSWORD = 'password123';
const HASHED_PASSWORD = bcrypt.hashSync(SEED_PASSWORD, 10); 

const users = [
    // Asignamos IDs fijos: 1, 2, 3
    { id: 1, nombre: 'Admin Control Escolar', email: 'admin@escuela.com', password_hash: HASHED_PASSWORD, rol: 'CONTROL_ESCOLAR' },
    { id: 2, nombre: 'Maestro Juan Pérez', email: 'juan.perez@escuela.com', password_hash: HASHED_PASSWORD, rol: 'MAESTRO' },
    { id: 3, nombre: 'Maestra Ana López', email: 'ana.lopez@escuela.com', password_hash: HASHED_PASSWORD, rol: 'MAESTRO' }
];

const subjects = [
    // Asignamos IDs fijos: 1, 2, 3
    { id: 1, codigo: 'MAT101', nombre: 'Matemáticas Avanzadas', descripcion: 'Álgebra y Cálculo.' },
    { id: 2, codigo: 'PRO201', nombre: 'Programación Web', descripcion: 'Desarrollo Full Stack.' },
    { id: 3, codigo: 'HIS301', nombre: 'Historia Universal', descripcion: 'Desde la Edad Media al S. XXI.' }
];

const students = [
   
    { id: 1, nombre: 'Alumno Raúl Castro', matricula: 'A1001', grupo: 'A' },
    { id: 2, nombre: 'Alumno Sofía García', matricula: 'A1002', grupo: 'A' },
    { id: 3, nombre: 'Alumno Luis Hernández', matricula: 'B2001', grupo: 'B' },
    { id: 4, nombre: 'Alumno Carolina Díaz', matricula: 'B2002', grupo: 'B' },
];

async function runSeeds() {
    console.log('\n-Creando datos de prueba');
    try {
        
        // 1. Limpieza total de datos (empezando por la tabla hija)
        await Calificacion.destroy({ where: {}, truncate: true }); 
        await Usuario.destroy({ where: {}, truncate: true, cascade: true }); 
        await Materia.destroy({ where: {}, truncate: true, cascade: true }); 
        await Alumno.destroy({ where: {}, truncate: true, cascade: true }); 
        
        console.log('--- Tablas limpiadas.');

        // 2. Creación de datos usando los IDs fijos
        const createdUsers = await Usuario.bulkCreate(users, { returning: true });
        console.log(`---- ${createdUsers.length} Usuarios (Admin/Maestros) creados.`);

        const createdSubjects = await Materia.bulkCreate(subjects, { returning: true });
        console.log(`---- ${createdSubjects.length} Materias creadas.`);

        const createdStudents = await Alumno.bulkCreate(students, { returning: true });
        console.log(`---- ${createdStudents.length} Alumnos creados.`);

        await sequelize.query(`ALTER SEQUENCE usuarios_id_seq RESTART WITH ${users.length + 1}`);
        await sequelize.query(`ALTER SEQUENCE materias_id_seq RESTART WITH ${subjects.length + 1}`);
        await sequelize.query(`ALTER SEQUENCE alumnos_id_seq RESTART WITH ${students.length + 1}`);

        console.log('---- Secuencias de IDs reiniciadas.');

        const grades = [
            // Raúl en Matemáticas por Juan
            { alumno_id: 1, materia_id: 1, maestro_id: 2, nota: 95.5, observaciones: 'Excelente trabajo.' },
            // Sofía en Matemáticas por Juan
            { alumno_id: 2, materia_id: 1, maestro_id: 2, nota: 88.0, observaciones: 'Buen desempeño, puede mejorar.' },
        ];

        const createdGrades = await Calificacion.bulkCreate(grades, { returning: true });
        console.log(`---- ${createdGrades.length} Calificaciones de prueba creadas.`);
 
        const assignmentGrades = [
            { maestro_id: 2, materia_id: 1, cupo_maximo: 40 }, // Juan -> Matemáticas
            { maestro_id: 2, materia_id: 2, cupo_maximo: 40 }, // Juan -> Programación
            { maestro_id: 3, materia_id: 3, cupo_maximo: 40 }, // Ana -> Historia
        ];
    
        await Asignacion.bulkCreate(assignmentGrades);
        console.log(` ${assignmentGrades.length} Asignaciones (Maestro-Materia) creadas.`);
    } catch (error) {
        console.error('Error en el proceso de Seeders:', error);
    } finally {
        console.log('Ya se crearon los sheeder');
    }
}

// Exportamos la función para ejecutarla desde index.js
module.exports = runSeeds;