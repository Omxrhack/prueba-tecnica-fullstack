const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Calificacion = sequelize.define('Calificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nota: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 10
    }
  },
  unidad: {
    type: DataTypes.INTEGER,
    allowNull: true, // Temporalmente nullable para permitir migración
    validate: {
      min: 1,
      max: 5
    },
    defaultValue: 1,
    comment: 'Número de unidad (1-5)'
  },
  observaciones: {
    type: DataTypes.TEXT
  },
  // Las claves foráneas (alumno_id, etc.) se agregan automáticamente con las asociaciones
}, {
  tableName: 'calificaciones',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = Calificacion;