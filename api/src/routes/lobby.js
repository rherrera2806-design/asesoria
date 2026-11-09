const express = require('express');
const router = express.Router();
const lobby = require('../services/lobby');
const { authenticate, requireAdmin, requirePermiso } = require('../middleware/auth');

// Verifica que el usuario sea admin o este en la lista de designados.
async function requireDesignado(req, res, next) {
    try {
        const acceso = await lobby.getAcceso(req.user);
        if (!acceso.puede_agendar) {
            return res.status(403).json({ error: 'Requiere ser usuario designado para agendar la sala' });
        }
        next();
    } catch (e) {
        next(e);
    }
}

// ── Acceso del usuario actual ──
router.get('/api/lobby/acceso', authenticate, requirePermiso('lobby', 'ver'), async (req, res, next) => {
    try { res.json(await lobby.getAcceso(req.user)); }
    catch (e) { next(e); }
});

// ── Reservas ──
router.get('/api/lobby/reservas', authenticate, requirePermiso('lobby', 'ver'), async (req, res, next) => {
    try {
        const { desde, hasta, estado } = req.query;
        res.json(await lobby.getReservas({ desde, hasta, estado }));
    } catch (e) { next(e); }
});

router.get('/api/lobby/reservas/dia/:fecha', authenticate, requirePermiso('lobby', 'ver'), async (req, res, next) => {
    try { res.json(await lobby.getReservasDia(req.params.fecha)); }
    catch (e) { next(e); }
});

router.post('/api/lobby/reservas', authenticate, requirePermiso('lobby', 'editar'), requireDesignado, async (req, res, next) => {
    try {
        res.status(201).json(await lobby.crearReserva(req.body, req.user));
    } catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        if (e.code === '23503') return res.status(400).json({ error: 'Usuario invalido' });
        console.error('[LOBBY] Error al crear reserva:', e.message);
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
});

router.put('/api/lobby/reservas/:id', authenticate, requirePermiso('lobby', 'editar'), requireDesignado, async (req, res, next) => {
    try {
        res.json(await lobby.editarReserva(Number(req.params.id), req.body, req.user));
    } catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        console.error('[LOBBY] Error al editar reserva:', e.message);
        res.status(500).json({ error: 'Error al editar la reserva' });
    }
});

router.put('/api/lobby/reservas/:id/cancelar', authenticate, requirePermiso('lobby', 'eliminar'), requireDesignado, async (req, res, next) => {
    try {
        res.json(await lobby.cancelarReserva(Number(req.params.id), req.user));
    } catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        console.error('[LOBBY] Error al cancelar reserva:', e.message);
        res.status(500).json({ error: 'Error al cancelar la reserva' });
    }
});

// ── Designados (solo admin) ──
router.get('/api/lobby/designados', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const [designados, disponibles] = await Promise.all([
            lobby.getDesignados(),
            lobby.getDisponibles()
        ]);
        res.json({ designados, disponibles });
    } catch (e) { next(e); }
});

router.post('/api/lobby/designados', authenticate, requireAdmin, async (req, res, next) => {
    try {
        res.status(201).json(await lobby.agregarDesignado(Number(req.body.usuario_id)));
    } catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        next(e);
    }
});

router.delete('/api/lobby/designados/:usuario_id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        res.json(await lobby.eliminarDesignado(Number(req.params.usuario_id)));
    } catch (e) {
        if (e.expose) return res.status(e.status || 400).json({ error: e.message });
        next(e);
    }
});

module.exports = router;
