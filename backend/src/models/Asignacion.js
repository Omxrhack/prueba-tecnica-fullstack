const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario'); // Importamos para la relación
const Materia = require('./Materia'); // Importamos para la relación

const Asignacion = sequelize.define('Asignacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cupo_maximo: {
    type: DataTypes.INTEGER,
    defaultValue: 40,
    validate: {
      min: 1
    }
  },
  // Sequelize crea automáticamente maestro_id y materia_id
}, {
  tableName: 'asignaciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // Restricción única sobre la combinación maestro_id y materia_id
  indexes: [{ unique: true, fields: ['maestro_id', 'materia_id'] }]
});

module.exports = Asignacion;