const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alumno = sequelize.define('Alumno', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  matricula: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY // Solo fecha, sin hora
  },
  grupo: {
    type: DataTypes.STRING(50)
  },
  semestre: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'alumnos',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

module.exports = Alumno;