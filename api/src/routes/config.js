const express = require('express');
const router = express.Router();
const config = require('../services/config');
const { query } = require('../config/database');
const { authenticate, requirePermiso } = require('../middleware/auth');

// Lectura publica (el login tambien muestra logo/tema, aun sin sesion)
router.get('/api/config', async (req, res, next) => {
    try { res.json(await config.getTema()); }
    catch (e) { next(e); }
});

// Escritura: requiere permiso 'editar' del modulo configuracion (admin implicito)
router.put('/api/config', authenticate, requirePermiso('configuracion', 'editar'), async (req, res, next) => {
    try { res.json(await config.setTema(req.body)); }
    catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        next(e);
    }
});

// Restaurar los valores por defecto
router.delete('/api/config', authenticate, requirePermiso('configuracion', 'editar'), async (req, res, next) => {
    try {
        await query('DELETE FROM config_sistema WHERE clave = $1', ['tema']);
        res.json(await config.getTema());
    } catch (e) { next(e); }
});

module.exports = router;
