const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/auth');
const { query } = require('../config/database');
const { authenticate, requireAdmin, requirePermiso, getPermisosUsuario } = require('../middleware/auth');

const router = express.Router();

router.post('/api/auth/login', async (req, res) => {
    const { email, rol, password } = req.body;

    if ((!email && !rol) || !password) {
        return res.status(400).json({ error: 'Correo o usuario y contrasena son requeridos' });
    }

    try {
        let result;
        if (email && String(email).includes('@')) {
            result = await query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) AND activo = TRUE', [String(email).trim()]);
        } else {
            // Retrocompatible: inicio de sesion por rol (usuarios antiguos)
            result = await query('SELECT * FROM usuarios WHERE rol = $1 AND activo = TRUE ORDER BY id ASC LIMIT 1', [rol]);
        }

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        // Permisos granulares (modulo x accion). Admin => null (todo implicito).
        const permisos = await getPermisosUsuario(user.id, user.rol);

        res.json({
            token,
            user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, permisos }
        });
    } catch (e) {
        console.error('[AUTH] Error login:', e.message);
        res.status(500).json({ error: 'Error al autenticar' });
    }
});

router.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await query('SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND activo = TRUE', [decoded.id]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        const user = result.rows[0];
        const permisos = await getPermisosUsuario(user.id, user.rol);
        res.json({ user: { ...user, permisos } });
    } catch (e) {
        return res.status(401).json({ error: 'Token invalido' });
    }
});

router.get('/api/auth/users', authenticate, requirePermiso('usuarios', 'ver'), async (req, res) => {
    try {
        const result = await query('SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY id');
        res.json(result.rows);
    } catch (e) {
        console.error('[AUTH] Error listar usuarios:', e.message);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

router.put('/api/auth/password', authenticate, requirePermiso('usuarios', 'editar'), async (req, res) => {
    const { user_id, new_password } = req.body;

    if (!user_id || !new_password) {
        return res.status(400).json({ error: 'user_id y new_password son requeridos' });
    }

    if (String(new_password).length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        const hash = await bcrypt.hash(new_password, 10);
        const result = await query(
            'UPDATE usuarios SET password = $1 WHERE id = $2 AND activo = TRUE RETURNING id, nombre, email',
            [hash, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ ok: true, user: result.rows[0] });
    } catch (e) {
        console.error('[AUTH] Error cambiar password:', e.message);
        res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
});

module.exports = router;
