const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/auth');
const { query } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/api/auth/login', async (req, res) => {
    const { rol, password } = req.body;

    if (!rol || !password) {
        return res.status(400).json({ error: 'Rol y password son requeridos' });
    }

    try {
        const result = await query('SELECT * FROM usuarios WHERE rol = $1 AND activo = TRUE', [rol]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contrasena incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.json({
            token,
            user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
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
        res.json({ user: result.rows[0] });
    } catch (e) {
        return res.status(401).json({ error: 'Token invalido' });
    }
});

router.get('/api/auth/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await query('SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY id');
        res.json(result.rows);
    } catch (e) {
        console.error('[AUTH] Error listar usuarios:', e.message);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

router.put('/api/auth/password', authenticate, requireAdmin, async (req, res) => {
    const { user_id, new_password } = req.body;

    if (!user_id || !new_password) {
        return res.status(400).json({ error: 'user_id y new_password son requeridos' });
    }

    if (new_password.length < 4) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
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
