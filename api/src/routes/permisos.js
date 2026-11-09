const express = require('express');
const router = express.Router();
const permisos = require('../services/permisos');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Matriz completa de permisos (solo admin)
router.get('/api/permisos', authenticate, requireAdmin, async (req, res, next) => {
    try { res.json(await permisos.getTodosPermisos()); }
    catch (e) { next(e); }
});

// Permisos de un usuario puntual (admin, o el propio usuario consultandose)
router.get('/api/permisos/usuario/:id', authenticate, async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (req.user.rol !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ error: 'Solo puedes ver tus propios permisos' });
        }
        res.json(await permisos.getPermisos(id));
    } catch (e) { next(e); }
});

// Reemplazar la matriz de permisos de un usuario (solo admin)
router.put('/api/permisos/usuario/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        res.json(await permisos.setPermisos(Number(req.params.id), req.body.permisos));
    } catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        next(e);
    }
});

module.exports = router;
