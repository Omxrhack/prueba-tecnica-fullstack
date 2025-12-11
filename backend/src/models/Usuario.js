const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('MAESTRO', 'CONTROL_ESCOLAR'),
    allowNull: false
  }
}, {
  tableName: 'usuarios', // Para que coincida con tu SQL
  timestamps: true,      // Crea created_at y updated_at automáticamente
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Usuario;