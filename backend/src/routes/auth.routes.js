// backend/src/routes/auth.routes.js
const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/login
router.post('/login', AuthController.login);

module.exports = router;