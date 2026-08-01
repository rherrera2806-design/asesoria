const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token invalido o expirado' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Requiere rol de administrador' });
    }
    next();
}

module.exports = { authenticate, requireAdmin };
