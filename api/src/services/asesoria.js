const { query } = require('../config/database');
const { calcularPlazoFinal, calcularDiasHabilesTranscurridos, calcularDiasHabilesRestantes, getProgresoEstado } = require('../config/dbSchema');

const getEstados = async () => {
    const result = await query('SELECT * FROM estados_config WHERE activo = TRUE ORDER BY orden ASC');
    return result.rows;
};

const crearEstado = async (nombre, cierraProceso = false) => {
    const maxOrden = await query('SELECT COALESCE(MAX(orden), 0) + 1 as next FROM estados_config');
    const orden = maxOrden.rows[0].next;
    const result = await query(
        'INSERT INTO estados_config (nombre, orden, cierra_proceso) VALUES ($1, $2, $3) RETURNING *',
        [nombre.trim().toLowerCase(), orden, cierraProceso]
    );
    return result.rows[0];
};

const eliminarEstado = async (id) => {
    await query('UPDATE estados_config SET activo = FALSE WHERE id = $1', [id]);
};

const reordenarEstado = async (id, nuevaPosicion) => {
    await query('UPDATE estados_config SET orden = $1 WHERE id = $2', [nuevaPosicion, id]);
};

const esEstadoCierre = async (nombreEstado) => {
    const result = await query('SELECT cierra_proceso FROM estados_config WHERE nombre = $1', [nombreEstado]);
    return result.rows.length > 0 ? result.rows[0].cierra_proceso : false;
};

const getAsesorias = async ({ filtro = '', estado = '', plazo = '', fechaDesde = '', fechaHasta = '' }) => {
    let sqlSimple = `SELECT a.* FROM asesorias a WHERE 1=1`;
    const params = [];

    if (filtro) {
        sqlSimple += ` AND (a.codigo_identificacion ILIKE $${params.length + 1} OR a.remitente ILIKE $${params.length + 1} OR a.detalle_solicitud ILIKE $${params.length + 1})`;
        params.push(`%${filtro}%`);
    }
    if (estado) {
        sqlSimple += ` AND a.estado_actual = $${params.length + 1}`;
        params.push(estado);
    }
    if (fechaDesde) {
        sqlSimple += ` AND a.fecha_llegada >= $${params.length + 1}`;
        params.push(fechaDesde);
    }
    if (fechaHasta) {
        sqlSimple += ` AND a.fecha_llegada <= $${params.length + 1}`;
        params.push(fechaHasta);
    }

    sqlSimple += ' ORDER BY a.plazo_final ASC, a.fecha_llegada DESC';

    const result = await query(sqlSimple, params);

    return result.rows.map(r => {
        const diasTranscurridos = calcularDiasHabilesTranscurridos(r.fecha_llegada);
        const diasRestantes = calcularDiasHabilesRestantes(r.plazo_final);
        const progresoEstado = getProgresoEstado(r.fecha_llegada, r.plazo_final);
        return {
            ...r,
            dias_transcurridos: diasTranscurridos,
            dias_restantes: diasRestantes,
            progreso_estado: progresoEstado
        };
    });
};

const getAsesoriaById = async (id) => {
    const result = await query('SELECT * FROM asesorias WHERE id = $1', [id]);
    return result.rows[0];
};

const getHistorial = async (asesoriaId) => {
    const result = await query(
        'SELECT * FROM asesorias_estados WHERE asesoria_id = $1 ORDER BY fecha_hora DESC',
        [asesoriaId]
    );
    return result.rows;
};

const crearAsesoria = async (body, usuarioEmail) => {
    const fechaLlegada = body.fecha_llegada || new Date().toISOString().split('T')[0];
    const plazoFinal = calcularPlazoFinal(fechaLlegada);

    const result = await query(`
        INSERT INTO asesorias (codigo_identificacion, remitente, detalle_solicitud, observacion, fecha_llegada, plazo_final, estado_actual, creado_por)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [
        body.codigo_identificacion,
        body.remitente,
        body.detalle_solicitud,
        body.observacion || '',
        fechaLlegada,
        plazoFinal,
        'en proceso',
        usuarioEmail
    ]);

    await query(`
        INSERT INTO asesorias_estados (asesoria_id, estado, usuario_email, observacion)
        VALUES ($1, $2, $3, $4)
    `, [result.rows[0].id, 'en proceso', usuarioEmail, 'asesoria creada']);

    return result.rows[0];
};

const actualizarAsesoria = async (id, body, usuarioEmail) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (body.remitente !== undefined) { fields.push(`remitente = $${idx++}`); values.push(body.remitente); }
    if (body.detalle_solicitud !== undefined) { fields.push(`detalle_solicitud = $${idx++}`); values.push(body.detalle_solicitud); }
    if (body.observacion !== undefined) { fields.push(`observacion = $${idx++}`); values.push(body.observacion); }

    if (fields.length === 0) throw new Error('Sin campos para actualizar');

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(`UPDATE asesorias SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    await query(`
        INSERT INTO asesorias_estados (asesoria_id, estado, usuario_email, observacion)
        VALUES ($1, $2, $3, $4)
    `, [id, 'editado', usuarioEmail, body.observacion || 'datos actualizados']);

    return await getAsesoriaById(id);
};

const cambiarEstado = async (id, nuevoEstado, usuarioEmail, observacion) => {
    const asesoria = await getAsesoriaById(id);
    if (!asesoria) throw new Error('Asesoria no encontrada');

    await query('UPDATE asesorias SET estado_actual = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nuevoEstado, id]);

    await query(`
        INSERT INTO asesorias_estados (asesoria_id, estado, usuario_email, observacion)
        VALUES ($1, $2, $3, $4)
    `, [id, nuevoEstado, usuarioEmail, observacion || `estado cambiado a: ${nuevoEstado}`]);

    return await getAsesoriaById(id);
};

const eliminarAsesoria = async (id) => {
    await query('DELETE FROM asesorias WHERE id = $1', [id]);
};

const getStats = async () => {
    const result = await query(`
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE estado_actual NOT IN ('respondido y cerrado', 'enviado y cerrado')) as abiertas,
            COUNT(*) FILTER (WHERE estado_actual = 'respondido y cerrado') as respondido_cerrado,
            COUNT(*) FILTER (WHERE estado_actual = 'enviado y cerrado') as enviado_cerrado,
            COUNT(*) FILTER (WHERE plazo_final < CURRENT_DATE AND estado_actual NOT IN ('respondido y cerrado', 'enviado y cerrado')) as vencidas
        FROM asesorias
    `);
    return result.rows[0];
};

const getPorFecha = async (fecha) => {
    const result = await query(
        'SELECT * FROM asesorias WHERE fecha_llegada = $1 ORDER BY plazo_final ASC',
        [fecha]
    );
    return result.rows;
};

module.exports = {
    getEstados,
    crearEstado,
    eliminarEstado,
    reordenarEstado,
    esEstadoCierre,
    getAsesorias,
    getAsesoriaById,
    getHistorial,
    crearAsesoria,
    actualizarAsesoria,
    cambiarEstado,
    eliminarAsesoria,
    getStats,
    getPorFecha
};
