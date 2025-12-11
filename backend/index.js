// backend/index.js
require('dotenv').config(); 

const express = require('express');
const cors = require('cors'); 
const { sequelize } = require('./src/models');
const runSeeds = require('./src/seeders/runSeeds'); 

// RUTAS NECESARIAS PARA LOS GET Y POST
const authRoutes = require('./src/routes/auth.routes');
const authMaestros = require('./src/routes/maestro.routes');
const adminRoutes = require('./src/routes/admin.routes');
const generalRoutes = require('./src/routes/general.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 2. CONFIGURACIÓN DEL MIDDLEWARE CORS
// Esto permite que el Front-end (http://localhost:5173) se conecte.
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// RUTAS DEL BACKEND
app.use(express.json()); // El middleware JSON debe ir después de CORS.
app.use('/api/auth', authRoutes);
app.use('/api/maestro', authMaestros);
app.use('/api/controlescolar', adminRoutes);
app.use('/api', generalRoutes);
app.get('/', (req, res) => {
  res.send('API NexGen Funcionando ');
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Conexión a la Base de Datos establecida correctamente.');

    // Sincronizar modelos (crear/actualizar tablas)
    await sequelize.sync({ alter: true });
    console.log(' Modelos y Relaciones sincronizados.');


    await runSeeds(); 

    // Arrancar servidor Express
    app.listen(PORT, () => {
      console.log(` Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error(' Error al iniciar el servidor:', error);
  }
};

startServer();