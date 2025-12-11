const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Alumno = require('./Alumno');
const Materia = require('./Materia');
const Calificacion = require('./Calificacion');
const Asignacion = require('./Asignacion');

// Definir Relaciones

// Un Alumno tiene muchas Calificaciones
Alumno.hasMany(Calificacion, { foreignKey: 'alumno_id' });
Calificacion.belongsTo(Alumno, { foreignKey: 'alumno_id' });

// Una Materia tiene muchas Calificaciones
Materia.hasMany(Calificacion, { foreignKey: 'materia_id' });
Calificacion.belongsTo(Materia, { foreignKey: 'materia_id' });

// Un Maestro (Usuario) registra muchas Calificaciones
Usuario.hasMany(Calificacion, { foreignKey: 'maestro_id' });
Calificacion.belongsTo(Usuario, { foreignKey: 'maestro_id' });

// Relaciones para la tabla Asignacion (Maestro-Materia)
Usuario.hasMany(Asignacion, { foreignKey: 'maestro_id' });
Asignacion.belongsTo(Usuario, { foreignKey: 'maestro_id' });

Materia.hasMany(Asignacion, { foreignKey: 'materia_id' });
Asignacion.belongsTo(Materia, { foreignKey: 'materia_id' });


// Exportamos los modelos ya relacionados y la conexión
module.exports = {
  sequelize,
  Usuario,
  Alumno,
  Materia,
  Calificacion,
  Asignacion
};