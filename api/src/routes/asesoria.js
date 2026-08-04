const express = require('express');
const router = express.Router();
const asesoria = require('../services/asesoria');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/api/asesorias', async (req, res, next) => {
    try {
        const { filtro, estado, plazo, fecha_desde, fecha_hasta } = req.query;
        res.json(await asesoria.getAsesorias({ filtro, estado, plazo, fechaDesde: fecha_desde, fechaHasta: fecha_hasta }));
    } catch (e) { next(e); }
});

router.get('/api/asesorias/stats', async (req, res, next) => {
    try { res.json(await asesoria.getStats()); }
    catch (e) { next(e); }
});

router.get('/api/asesorias/informes', async (req, res, next) => {
    try { res.json(await asesoria.getInformesMensual()); }
    catch (e) { next(e); }
});

router.get('/api/asesorias/calendario/:fecha', async (req, res, next) => {
    try { res.json(await asesoria.getPorFecha(req.params.fecha)); }
    catch (e) { next(e); }
});

router.get('/api/estados', async (req, res, next) => {
    try { res.json(await asesoria.getEstados()); }
    catch (e) { next(e); }
});

router.post('/api/estados', authenticate, requireAdmin, async (req, res, next) => {
    const { nombre, cierra_proceso } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    try {
        res.status(201).json(await asesoria.crearEstado(nombre, cierra_proceso || false));
    } catch (e) {
        if (e.message.includes('duplicate') || e.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un estado con ese nombre' });
        }
        next(e);
    }
});

router.delete('/api/estados/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        await asesoria.eliminarEstado(Number(req.params.id));
        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.put('/api/estados/:id', authenticate, requireAdmin, async (req, res, next) => {
    const { nombre, cierra_proceso } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    try {
        res.json(await asesoria.editarEstado(Number(req.params.id), nombre, cierra_proceso || false));
    } catch (e) {
        if (e.message.includes('duplicate') || e.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un estado con ese nombre' });
        }
        next(e);
    }
});

router.put('/api/estados/:id/orden', authenticate, requireAdmin, async (req, res, next) => {
    const { orden } = req.body;
    if (orden === undefined) return res.status(400).json({ error: 'Orden requerida' });
    try {
        await asesoria.reordenarEstado(Number(req.params.id), Number(orden));
        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.get('/api/asesorias/:id', async (req, res, next) => {
    try {
        const a = await asesoria.getAsesoriaById(Number(req.params.id));
        if (!a) return res.status(404).json({ error: 'No encontrada' });
        res.json(a);
    } catch (e) { next(e); }
});

router.get('/api/asesorias/:id/historial', async (req, res, next) => {
    try { res.json(await asesoria.getHistorial(Number(req.params.id))); }
    catch (e) { next(e); }
});

router.post('/api/asesorias', authenticate, requireAdmin, async (req, res, next) => {
    const { codigo_identificacion, remitente, detalle_solicitud } = req.body;
    if (!codigo_identificacion || !remitente || !detalle_solicitud) {
        return res.status(400).json({ error: 'Codigo, remitente y detalle son requeridos' });
    }
    try {
        const email = req.headers['x-user-email'] || 'sistema';
        res.status(201).json(await asesoria.crearAsesoria(req.body, email));
    } catch (e) {
        if (e.message.includes('duplicate') || e.code === '23505') {
            return res.status(400).json({ error: 'Ya existe una asesoria con ese codigo' });
        }
        res.status(500).json({ error: e.message });
    }
});

router.put('/api/asesorias/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const email = req.user.email;
        res.json(await asesoria.actualizarAsesoria(Number(req.params.id), req.body, email));
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/api/asesorias/:id/estado', authenticate, requireAdmin, async (req, res, next) => {
    const { estado, observacion } = req.body;
    if (!estado) return res.status(400).json({ error: 'Estado requerido' });
    try {
        const email = req.user.email;
        res.json(await asesoria.cambiarEstado(Number(req.params.id), estado, email, observacion));
    } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/api/asesorias/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        await asesoria.eliminarAsesoria(Number(req.params.id));
        res.json({ ok: true });
    } catch (e) { next(e); }
});

module.exports = router;
