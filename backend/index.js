// backend/index.js
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./src/models');
const runSeeds = require('./src/seeders/runSeeds');
const errorHandler = require('./src/middlewares/errorHandler.middleware');

// RUTAS NECESARIAS PARA LOS GET Y POST
const authRoutes = require('./src/routes/auth.routes');
const authMaestros = require('./src/routes/maestro.routes');
const adminRoutes = require('./src/routes/admin.routes');
const alumnoRoutes = require('./src/routes/alumno.routes');
const generalRoutes = require('./src/routes/general.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES DE SEGURIDAD Y CONFIGURACIÓN
app.use(helmet()); // Cabeceras de seguridad HTTP
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// LOGGING (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// RUTAS
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

app.use('/api/auth', authRoutes);
app.use('/api/maestro', authMaestros);
app.use('/api/controlescolar', adminRoutes);
app.use('/api/alumno', alumnoRoutes);
app.use('/api', generalRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'API Sistema de Control Escolar',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      maestro: '/api/maestro',
      admin: '/api/controlescolar'
    }
  });
});

// Middleware de manejo de errores (debe ir al final, después de todas las rutas)
app.use(errorHandler);

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