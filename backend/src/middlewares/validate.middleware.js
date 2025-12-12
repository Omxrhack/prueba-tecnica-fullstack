// backend/src/middlewares/validate.middleware.js
const { validationResult } = require('express-validator');

/**
 * Middleware para validar los resultados de express-validator
 * Debe usarse después de los validators en las rutas
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Error de validación',
            errors: errors.array().map(e => ({
                field: e.param || e.msg,
                message: e.msg,
                value: e.value
            }))
        });
    }
    
    next();
};

module.exports = validate;
