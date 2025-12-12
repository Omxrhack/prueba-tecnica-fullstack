const bcrypt = require('bcryptjs');

const HASHED_PASSWORD = bcrypt.hashSync('password123', 10);

// Nombres y apellidos para generar datos realistas
const nombres = [
    'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Carmen', 'Diego', 'Patricia',
    'Fernando', 'Mónica', 'Ricardo', 'Sandra', 'Roberto', 'Andrea', 'Miguel', 'Claudia', 'Javier', 'Gabriela',
    'Daniel', 'Beatriz', 'Alejandro', 'Lucía', 'Andrés', 'Mariana', 'Manuel', 'Alejandra', 'Sergio', 'Verónica',
    'Francisco', 'Adriana', 'Eduardo', 'Norma', 'Antonio', 'Silvia', 'José', 'Rosa', 'Arturo', 'Martha',
    'Rafael', 'Teresa', 'Oscar', 'Dolores', 'Pablo', 'Guadalupe', 'Ramón', 'Angélica', 'Alberto', 'Isabel'
];

const apellidos = [
    'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores',
    'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos', 'Mendoza',
    'Hernández', 'Ruiz', 'Jiménez', 'Vargas', 'Moreno', 'Castro', 'Medina', 'Álvarez', 'Romero', 'Navarro',
    'Silva', 'Vega', 'Reyes', 'Ortega', 'Delgado', 'Mora', 'Villalobos', 'Campos', 'Sosa', 'Valdez',
    'Rojas', 'Pacheco', 'Salazar', 'Vargas', 'Ibarra', 'Juárez', 'Cortés', 'Guerrero', 'Cárdenas', 'Barrera'
];

// Materias por semestre
const materiasPorSemestre = {
    1: [
        'Álgebra Lineal', 'Cálculo Diferencial', 'Introducción a la Programación', 'Física I', 'Metodología de la Investigación',
        'Química General', 'Inglés I', 'Habilidades del Pensamiento'
    ],
    2: [
        'Cálculo Integral', 'Programación Orientada a Objetos', 'Física II', 'Estructuras de Datos', 'Inglés II',
        'Matemáticas Discretas', 'Fundamentos de Bases de Datos', 'Desarrollo de Habilidades'
    ],
    3: [
        'Cálculo Vectorial', 'Análisis y Diseño de Algoritmos', 'Fundamentos de Ingeniería de Software', 'Base de Datos',
        'Ecuaciones Diferenciales', 'Inglés III', 'Taller de Investigación I', 'Estadística'
    ],
    4: [
        'Álgebra Superior', 'Arquitectura de Computadoras', 'Ingeniería de Software', 'Administración de Proyectos',
        'Inglés IV', 'Desarrollo Web', 'Taller de Investigación II', 'Probabilidad y Estadística'
    ],
    5: [
        'Redes de Computadoras', 'Sistemas Operativos', 'Desarrollo Móvil', 'Seguridad Informática',
        'Inteligencia Artificial', 'Interacción Humano-Computadora', 'Metodologías Ágiles', 'Emprendimiento'
    ],
    6: [
        'Compiladores', 'Computación Distribuida', 'Tópicos Avanzados de Programación', 'Gestión de TI',
        'Minería de Datos', 'Realidad Virtual', 'Proyecto Integrador I', 'Ética Profesional'
    ],
    7: [
        'Arquitectura de Software', 'Computación en la Nube', 'Machine Learning', 'Gestión de Calidad de Software',
        'Proyecto Integrador II', 'Seminario de Tesis', 'Optativa I', 'Innovación Tecnológica'
    ],
    8: [
        'Servicio Social', 'Residencia Profesional', 'Trabajo de Tesis', 'Optativa II', 'Optativa III'
    ]
};

function generarEmail(nombre, apellido, indice, rol) {
    const nombreLower = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const apellidoLower = apellido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `${nombreLower}.${apellidoLower}${indice}@escuela.com`;
}

function generarMatricula(semestre, indice) {
    const año = 2024;
    const grupo = String.fromCharCode(65 + (indice % 2)); // A o B
    return `A${año}${String(semestre).padStart(2, '0')}${String(indice + 1).padStart(3, '0')}${grupo}`;
}

function generarFechaNacimiento() {
    const año = 1998 + Math.floor(Math.random() * 5); // Entre 1998-2002
    const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const dia = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
}

// Generar 50 maestros
function generarMaestros() {
    const maestros = [];
    const indicesUsados = new Set();
    
    for (let i = 0; i < 50; i++) {
        let nombreIdx, apellidoIdx, indice;
        
        do {
            nombreIdx = Math.floor(Math.random() * nombres.length);
            apellidoIdx = Math.floor(Math.random() * apellidos.length);
            indice = nombreIdx * 100 + apellidoIdx * 10 + i;
        } while (indicesUsados.has(indice));
        
        indicesUsados.add(indice);
        
        const nombre = `${nombres[nombreIdx]} ${apellidos[apellidoIdx]}`;
        const email = generarEmail(nombres[nombreIdx], apellidos[apellidoIdx], i, 'MAESTRO');
        
        maestros.push({
            nombre: `Prof. ${nombre}`,
            email,
            password_hash: HASHED_PASSWORD,
            rol: 'MAESTRO'
        });
    }
    
    return maestros;
}

// Generar 50 materias distribuidas en 8 semestres
function generarMaterias() {
    const materias = [];
    let codigoCounter = 1;
    
    for (let semestre = 1; semestre <= 8; semestre++) {
        const materiasDelSemestre = materiasPorSemestre[semestre];
        const materiasPorSemestreCount = Math.ceil(50 / 8);
        const materiasASeleccionar = materiasDelSemestre.slice(0, materiasPorSemestreCount);
        
        materiasASeleccionar.forEach((nombreMateria, idx) => {
            const codigo = `MAT${String(semestre).padStart(2, '0')}${String(codigoCounter).padStart(3, '0')}`;
            materias.push({
                codigo,
                nombre: nombreMateria,
                descripcion: `Materia del semestre ${semestre} - ${nombreMateria}`,
                semestre: semestre
            });
            codigoCounter++;
        });
    }
    
    // Asegurar que tengamos exactamente 50 materias
    while (materias.length < 50) {
        const semestre = Math.floor(Math.random() * 8) + 1;
        const codigo = `MAT${String(semestre).padStart(2, '0')}${String(codigoCounter).padStart(3, '0')}`;
        materias.push({
            codigo,
            nombre: `Materia ${codigoCounter} - Semestre ${semestre}`,
            descripcion: `Materia del semestre ${semestre}`,
            semestre: semestre
        });
        codigoCounter++;
    }
    
    return materias.slice(0, 50);
}

// Generar 50 alumnos
function generarAlumnos(usuariosAlumnos) {
    const alumnos = [];
    const indicesUsados = new Set();
    
    for (let i = 0; i < 50; i++) {
        let nombreIdx, apellidoIdx, indice;
        
        do {
            nombreIdx = Math.floor(Math.random() * nombres.length);
            apellidoIdx = Math.floor(Math.random() * apellidos.length);
            indice = nombreIdx * 1000 + apellidoIdx * 100 + i;
        } while (indicesUsados.has(indice));
        
        indicesUsados.add(indice);
        
        const nombre = `${nombres[nombreIdx]} ${apellidos[apellidoIdx]}`;
        const semestre = Math.floor(Math.random() * 8) + 1; // Semestre aleatorio entre 1-8
        const grupo = String.fromCharCode(65 + (i % 2)); // A o B alternado
        
        alumnos.push({
            nombre: `Alumno ${nombre}`,
            matricula: generarMatricula(semestre, i),
            grupo,
            semestre,
            fecha_nacimiento: generarFechaNacimiento(),
            usuario_id: usuariosAlumnos[i].id
        });
    }
    
    return alumnos;
}

// Generar usuarios alumnos
function generarUsuariosAlumnos() {
    const usuarios = [];
    const indicesUsados = new Set();
    
    for (let i = 0; i < 50; i++) {
        let nombreIdx, apellidoIdx, indice;
        
        do {
            nombreIdx = Math.floor(Math.random() * nombres.length);
            apellidoIdx = Math.floor(Math.random() * apellidos.length);
            indice = nombreIdx * 2000 + apellidoIdx * 200 + i;
        } while (indicesUsados.has(indice));
        
        indicesUsados.add(indice);
        
        const nombre = `${nombres[nombreIdx]} ${apellidos[apellidoIdx]}`;
        const email = generarEmail(nombres[nombreIdx], apellidos[apellidoIdx], i + 100, 'ALUMNO');
        
        usuarios.push({
            nombre: `Alumno ${nombre}`,
            email,
            password_hash: HASHED_PASSWORD,
            rol: 'ALUMNO'
        });
    }
    
    return usuarios;
}

module.exports = {
    generarMaestros,
    generarMaterias,
    generarUsuariosAlumnos,
    generarAlumnos
};
