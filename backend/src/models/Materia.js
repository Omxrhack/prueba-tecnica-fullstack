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
  estatus: {
    type: DataTypes.INTEGER, // Byte en SQL suele mapearse a Integer o Boolean en ORMs
    defaultValue: 1
  }
}, {
  tableName: 'materias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Materia;