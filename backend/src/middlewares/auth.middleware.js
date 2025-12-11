const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
    // 1. Obtener el token del header (Bearer Token)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado o formato incorrecto.' });
    }

    // Extraer el token (quitando "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 3. Adjuntar la información del usuario al request para usarla en los controladores
        req.user = decoded; 
        
        // 4. Continuar al siguiente middleware/controlador
        next(); 
    } catch (error) {
        // El token es inválido o ha expirado
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};


const checkRole = (roles) => (req, res, next) => {
    // Los roles deben ser un array de strings, ej: ['MAESTRO', 'CONTROL_ESCOLAR']
    if (!roles.includes(req.user.rol)) {
        return res.status(403).json({ 
            message: `Acceso prohibido. Rol requerido: ${roles.join(' o ')}. Su rol es: ${req.user.rol}` 
        });
    }
    next();
};

// Exportar ambos middlewares
module.exports = {
    verifyToken,
    checkRole 
};
