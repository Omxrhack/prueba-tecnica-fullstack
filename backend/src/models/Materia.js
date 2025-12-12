const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Materia = sequelize.define('Materia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(50),
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  semestre: {
    type: DataTypes.INTEGER,
    allowNull: true, // Temporalmente nullable para permitir migración
    validate: {
      min: 1,
      max: 8
    },
    defaultValue: 1,
    comment: 'Semestre al que pertenece la materia (1-8)'
  },
  estatus: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'materias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Materia;