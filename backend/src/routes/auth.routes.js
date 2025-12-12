// backend/src/routes/auth.routes.js
const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

// Validaciones para login
const loginValidations = [
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// POST /api/auth/login
router.post('/login', loginValidations, validate, AuthController.login);

module.exports = router;