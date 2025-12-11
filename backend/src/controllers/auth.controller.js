const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Obtener la clave secreta del entorno
const JWT_SECRET = process.env.JWT_SECRET; 

const AuthController = {

    async login(req, res) {
        // AGREGAR ESTO PARA DIAGNÓSTICO
        console.log('Datos recibidos en req.body:', req.body);
        // FIN DIAGNÓSTICO
        
        const { email, password } = req.body;

        if (!email || !password) {
            // El servidor cae aquí si req.body es {}, o si email y password son undefined
            return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
        }

        try {
            // 1. Buscar usuario por email
            const user = await Usuario.findOne({ where: { email } });

            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas.' });
            }

            // 2. Comparar la contraseña (usamos bcryptjs)
            const isMatch = await bcrypt.compare(password, user.password_hash);

            if (!isMatch) {
                return res.status(401).json({ message: 'Credenciales inválidas.' });
            }

            // 3. Generar el Token JWT
            const payload = {
                id: user.id,
                rol: user.rol,
                email: user.email
            };
            
            // El token expira en 24 horas (opcional)
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); 
            
            // 4. Retornar éxito
            res.json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    rol: user.rol
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error del servidor durante el login.' });
        }
    }
    
};

module.exports = AuthController;