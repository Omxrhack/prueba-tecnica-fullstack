const { Sequelize } = require('sequelize');

// Usamos las variables de entorno que definimos en docker-compose.yml
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nombre de la DB
  process.env.DB_USER,      // Usuario
  process.env.DB_PASSWORD,  // Contraseña
  {
    host: process.env.DB_HOST, // Host (en Docker es el nombre del servicio: 'db')
    dialect: 'postgres',
    logging: false,            // Poner true si quieres ver las consultas SQL en la terminal
  }
);

module.exports = sequelize;