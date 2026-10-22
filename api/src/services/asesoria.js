const { query, withTransaction, appError } = require('../config/database');
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

const editarEstado = async (id, nombre, cierraProceso) => {
    const nombreNuevo = nombre.trim().toLowerCase();

    // Transaccion: si algo falla, no quedan estados renombrados a medias
    return withTransaction(async (q) => {
        const actual = await q('SELECT nombre FROM estados_config WHERE id = $1 AND activo = TRUE', [id]);
        if (actual.rows.length === 0) throw appError('Estado no encontrado', 404);
        const nombreViejo = actual.rows[0].nombre;

        const result = await q(
            'UPDATE estados_config SET nombre = $1, cierra_proceso = $2 WHERE id = $3 AND activo = TRUE RETURNING *',
            [nombreNuevo, cierraProceso, id]
        );

        if (nombreViejo !== nombreNuevo) {
            await q('UPDATE asesorias SET estado_actual = $1 WHERE estado_actual = $2', [nombreNuevo, nombreViejo]);
            await q('UPDATE asesorias_estados SET estado = $1 WHERE estado = $2', [nombreNuevo, nombreViejo]);
        }

        return result.rows[0];
    });
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

    const asesorias = result.rows.map(r => {
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

    const cierreResult = await query(`SELECT nombre FROM estados_config WHERE cierra_proceso = TRUE`);
    const estadosCierre = cierreResult.rows.map(r => r.nombre);

    // Una sola consulta para todas las cerradas (antes: una query por cada proceso cerrado)
    const cerradas = asesorias.filter(a => estadosCierre.includes(a.estado_actual));
    let cierresPorClave = {};
    if (cerradas.length > 0) {
        const histResult = await query(
            `SELECT asesoria_id, estado, MIN(fecha_hora) AS fecha_hora
             FROM asesorias_estados
             WHERE asesoria_id = ANY($1) AND estado = ANY($2)
             GROUP BY asesoria_id, estado`,
            [cerradas.map(a => a.id), cerradas.map(a => a.estado_actual)]
        );
        histResult.rows.forEach(r => { cierresPorClave[`${r.asesoria_id}|${r.estado}`] = r.fecha_hora; });
    }

    for (const a of asesorias) {
        a.es_cerrado = estadosCierre.includes(a.estado_actual);
        if (a.es_cerrado) {
            const fechaCierre = cierresPorClave[`${a.id}|${a.estado_actual}`];
            if (fechaCierre) {
                a.dias_habiles_total = calcularDiasHabilesTranscurridos(a.fecha_llegada);
                const fechaCierreDate = new Date(fechaCierre);
                const fechaLlegada = new Date(a.fecha_llegada);
                fechaLlegada.setHours(0, 0, 0, 0);
                fechaCierreDate.setHours(0, 0, 0, 0);
                if (fechaCierreDate > fechaLlegada) {
                    a.dias_habiles_total = calcularDiasHabilesTranscurridosConTope(a.fecha_llegada, fechaCierreDate);
                }
            } else {
                a.dias_habiles_total = calcularDiasHabilesTranscurridos(a.fecha_llegada);
            }
        }
    }

    return asesorias;
};

const calcularDiasHabilesTranscurridosConTope = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    fin.setHours(0, 0, 0, 0);
    let dias = 0;
    const current = new Date(inicio);
    while (current <= fin) {
        const dia = current.getDay();
        if (dia !== 0 && dia !== 6) {
            dias++;
        }
        current.setDate(current.getDate() + 1);
    }
    return dias;
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

    // Transaccion: registro + historial se crean juntos o no se crea ninguno
    return withTransaction(async (q) => {
        const result = await q(`
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

        await q(`
            INSERT INTO asesorias_estados (asesoria_id, estado, usuario_email, observacion)
            VALUES ($1, $2, $3, $4)
        `, [result.rows[0].id, 'en proceso', usuarioEmail, 'asesoria creada']);

        return result.rows[0];
    });
};

const actualizarAsesoria = async (id, body, usuarioEmail) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (body.codigo_identificacion !== undefined) { fields.push(`codigo_identificacion = $${idx++}`); values.push(body.codigo_identificacion); }
    if (body.remitente !== undefined) { fields.push(`remitente = $${idx++}`); values.push(body.remitente); }
    if (body.detalle_solicitud !== undefined) { fields.push(`detalle_solicitud = $${idx++}`); values.push(body.detalle_solicitud); }
    if (body.observacion !== undefined) { fields.push(`observacion = $${idx++}`); values.push(body.observacion); }
    if (body.fecha_llegada !== undefined) {
        fields.push(`fecha_llegada = $${idx++}`); values.push(body.fecha_llegada);
        const nuevoPlazo = calcularPlazoFinal(body.fecha_llegada);
        fields.push(`plazo_final = $${idx++}`); values.push(nuevoPlazo);
    }

    if (fields.length === 0) throw appError('Sin campos para actualizar', 400);

    return withTransaction(async (q) => {
        const existe = await q('SELECT id FROM asesorias WHERE id = $1 FOR UPDATE', [id]);
        if (existe.rows.length === 0) throw appError('Asesoria no encontrada', 404);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        await q(`UPDATE asesorias SET ${fields.join(', ')} WHERE id = $${idx}`, values);

        await q(`
            INSERT INTO asesorias_estados (asesoria_id, estado, usuario_email, observacion)
            VALUES ($1, $2, $3, $4)
        `, [id, 'editado', usuarioEmail, body.observacion || 'datos actualizados']);

        const r = await q('SELECT * FROM asesorias WHERE id = $1', [id]);
        return r.rows[0];
    });
};

const cambiarEstado = async (id, nuevoEstado, usuarioEmail, observacion) => {
    return withTransaction(async (q) => {
        const asesoria = await q('SELECT id FROM asesorias WHERE id = $1 FOR UPDATE', [id]);
        if (asesoria.rows.length === 0) throw appError('Asesoria no encontrada', 404);

        // El estado debe existir en la configuracion (evita estados inventados que rompen los ciclos de cierre)
        const estadoValido = await q('SELECT id FROM estados_config WHERE nombre = $1 AND activo = TRUE', [nuevoEstado]);
        if (estadoValido.rows.length === 0) throw appError('El estado indicado no existe en la configuracion', 400);

        await q('UPDATE asesorias SET estado_actual = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nuevoEstado, id]);

        await q(`
            INSERT INTO asesorias_estados (asesoria_id, estado, usuario_email, observacion)
            VALUES ($1, $2, $3, $4)
        `, [id, nuevoEstado, usuarioEmail, observacion || `estado cambiado a: ${nuevoEstado}`]);

        const r = await q('SELECT * FROM asesorias WHERE id = $1', [id]);
        return r.rows[0];
    });
};

const eliminarAsesoria = async (id) => {
    return withTransaction(async (q) => {
        const existe = await q('SELECT id FROM asesorias WHERE id = $1 FOR UPDATE', [id]);
        if (existe.rows.length === 0) throw appError('Asesoria no encontrada', 404);
        await q('DELETE FROM asesorias WHERE id = $1', [id]);
    });
};

const getStats = async () => {
    const cierreResult = await query(`SELECT nombre FROM estados_config WHERE cierra_proceso = TRUE AND activo = TRUE`);
    const estadosCierre = cierreResult.rows.map(r => r.nombre);

    const result = await query(`SELECT COUNT(*) as total FROM asesorias`);
    const total = Number(result.rows[0].total);

    if (estadosCierre.length === 0) {
        return { total, abiertas: total, cerrados: 0, vencidas: 0, cerrados_por_estado: {} };
    }

    const all = await query(`SELECT estado_actual, plazo_final FROM asesorias`);
    let abiertas = 0, cerrados = 0, vencidas = 0;
    const porEstado = {};
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const row of all.rows) {
        const esCierre = estadosCierre.includes(row.estado_actual);
        if (esCierre) {
            cerrados++;
            porEstado[row.estado_actual] = (porEstado[row.estado_actual] || 0) + 1;
        } else {
            abiertas++;
            if (row.plazo_final) {
                const [y, m, d] = row.plazo_final.split('-').map(Number);
                const plazo = new Date(y, m - 1, d, 12, 0, 0);
                if (plazo < hoy) vencidas++;
            }
        }
    }

    return { total, abiertas, cerrados, vencidas, cerrados_por_estado: porEstado };
};

const getPorFecha = async (fecha) => {
    const result = await query(
        'SELECT * FROM asesorias WHERE plazo_final = $1 ORDER BY fecha_llegada ASC',
        [fecha]
    );
    return result.rows.map(r => {
        const diasTranscurridos = calcularDiasHabilesTranscurridos(r.fecha_llegada);
        const diasRestantes = calcularDiasHabilesRestantes(r.plazo_final);
        const progresoEstado = getProgresoEstado(r.fecha_llegada, r.plazo_final);
        return { ...r, dias_transcurridos: diasTranscurridos, dias_restantes: diasRestantes, progreso_estado: progresoEstado };
    });
};

const getInformesMensual = async () => {
    const cierreResult = await query(`SELECT nombre FROM estados_config WHERE cierra_proceso = TRUE`);
    const estadosCierre = cierreResult.rows.map(r => r.nombre);

    if (estadosCierre.length === 0) return [];

    const placeholders = estadosCierre.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(`
        SELECT a.id, a.codigo_identificacion, a.remitente, a.detalle_solicitud,
               a.fecha_llegada, a.plazo_final, a.estado_actual,
               ae.fecha_hora as fecha_cierre
        FROM asesorias a
        JOIN asesorias_estados ae ON ae.asesoria_id = a.id
        WHERE a.estado_actual IN (${placeholders})
        AND ae.estado = a.estado_actual
        AND ae.id = (
            SELECT MIN(ae2.id) FROM asesorias_estados ae2
            WHERE ae2.asesoria_id = a.id AND ae2.estado = a.estado_actual
        )
    `, estadosCierre);

    const meses = {};
    for (const a of result.rows) {
        const cierreDate = new Date(a.fecha_cierre);
        const diasHabiles = calcularDiasHabilesTranscurridosConTope(a.fecha_llegada, cierreDate);
        const mesKey = `${cierreDate.getFullYear()}-${String(cierreDate.getMonth() + 1).padStart(2, '0')}`;
        const mesLabel = cierreDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });

        if (!meses[mesKey]) {
            meses[mesKey] = { mes: mesKey, mes_label: mesLabel, en_fecha: 0, fuera_de_fecha: 0, total: 0, detalles: [] };
        }
        meses[mesKey].total++;
        if (diasHabiles <= 10) {
            meses[mesKey].en_fecha++;
        } else {
            meses[mesKey].fuera_de_fecha++;
        }
        meses[mesKey].detalles.push({
            codigo: a.codigo_identificacion,
            remitente: a.remitente,
            detalle: a.detalle_solicitud,
            fecha_llegada: a.fecha_llegada,
            plazo_final: a.plazo_final,
            fecha_cierre: cierreDate.toISOString().split('T')[0],
            dias_habiles: diasHabiles,
            en_fecha: diasHabiles <= 10
        });
    }

    return Object.values(meses).sort((a, b) => b.mes.localeCompare(a.mes));
};

module.exports = {
    getEstados,
    crearEstado,
    editarEstado,
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
    getPorFecha,
    getInformesMensual
};
