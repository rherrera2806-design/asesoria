const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const { query } = require('../config/database');

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

// Verifica un permiso granular (modulo x accion) del usuario autenticado.
// El admin tiene todos los permisos implicitos. Los demas necesitan la fila
// correspondiente en usuario_permisos.
// Uso: router.get('/x', authenticate, requirePermiso('asesoria', 'ver'), handler)
function requirePermiso(modulo, accion) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'No autenticado' });
            }
            if (req.user.rol === 'admin') return next();

            const r = await query(
                'SELECT 1 FROM usuario_permisos WHERE usuario_id = $1 AND modulo = $2 AND accion = $3',
                [req.user.id, modulo, accion]
            );
            if (r.rows.length === 0) {
                return res.status(403).json({
                    error: `No tienes permiso para ${accion === 'ver' ? 'ver' : accion} ${modulo}`
                });
            }
            next();
        } catch (e) {
            next(e);
        }
    };
}

// Devuelve los permisos del usuario como { modulo: [acciones] }.
// Admin => null (implicitamente todo). Sin permisos => {}.
async function getPermisosUsuario(usuarioId, rol) {
    if (rol === 'admin') return null;
    const r = await query(
        'SELECT modulo, accion FROM usuario_permisos WHERE usuario_id = $1 ORDER BY modulo, accion',
        [usuarioId]
    );
    const mapa = {};
    for (const row of r.rows) {
        if (!mapa[row.modulo]) mapa[row.modulo] = [];
        mapa[row.modulo].push(row.accion);
    }
    return mapa;
}

module.exports = { authenticate, requireAdmin, requirePermiso, getPermisosUsuario };
