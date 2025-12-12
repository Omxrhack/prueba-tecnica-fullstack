// backend/src/middlewares/errorHandler.middleware.js

/**
 * Middleware de manejo centralizado de errores
 * Captura todos los errores y los formatea de manera consistente
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error capturado:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Errores de Sequelize
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(e => e.message).join(', ');
        return res.status(400).json({
            message: 'Error de validación de datos',
            errors: errors
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            message: 'El registro ya existe o viola una restricción única',
            field: err.errors?.[0]?.path
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            message: 'Error de referencia: el registro relacionado no existe'
        });
    }

    if (err.name === 'SequelizeDatabaseError') {
        return res.status(500).json({
            message: 'Error en la base de datos',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Error JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expirado'
        });
    }

    // Errores personalizados con status code
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            message: err.message || 'Error del servidor'
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
