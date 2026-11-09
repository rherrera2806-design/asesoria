const { query, withTransaction, appError } = require('../config/database');
const { fechaTexto, diaUtilChileno } = require('../config/dbSchema');

// ── LOBBY: servicio de agendamiento de la sala de reuniones ──
// Reglas: dias habiles (lun-vie, no feriado), horarios alineados a 30 min,
// sin solapamientos (bloqueo por fecha dentro de transaccion).

const HORA_MIN = '08:00';
const HORA_MAX = '19:00';

// Normaliza 'HH:MM:SS' | 'HH:MM' | Date a 'HH:MM'
function horaTexto(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) {
        return `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
    }
    const s = String(v);
    return s.length >= 5 ? s.slice(0, 5) : s;
}

function esHoraValida(h) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
}

function esAlineada30(h) {
    const [, m] = h.split(':');
    return Number(m) % 30 === 0;
}

function hoyTexto() {
    return fechaTexto(new Date());
}

// Clave de bloqueo (advisory lock) por fecha: serializa los INSERT del mismo dia
// para que dos usuarios no puedan solapar reservas en la misma transaccion.
function lockKey(fecha) {
    return `lobby:${fecha}`;
}

function validarReserva(body, esEdicion = false) {
    const { fecha, hora_inicio, hora_fin, motivo, detalle } = body || {};
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw appError('Fecha requerida con formato YYYY-MM-DD');
    }
    if (!esHoraValida(hora_inicio) || !esHoraValida(hora_fin)) {
        throw appError('Horas requeridas con formato HH:MM (24h)');
    }
    if (!esAlineada30(hora_inicio) || !esAlineada30(hora_fin)) {
        throw appError('Los horarios deben estar alineados a bloques de 30 minutos');
    }
    if (hora_fin <= hora_inicio) {
        throw appError('La hora de fin debe ser posterior a la de inicio');
    }
    if (!motivo || !String(motivo).trim()) {
        throw appError('El motivo es requerido');
    }
    if (String(motivo).length > 200) {
        throw appError('El motivo no puede superar 200 caracteres');
    }

    // Solo dias habiles (lunes a viernes y no feriado)
    const f = new Date(`${fecha}T12:00:00`);
    if (isNaN(f.getTime())) throw appError('Fecha invalida');
    if (!diaUtilChileno(f)) {
        throw appError('La sala solo se puede agendar en dias habiles (lunes a viernes, no feriados)');
    }

    // Sin reservas en el pasado (en edicion se permite si la reserva aun no termina)
    const hoy = hoyTexto();
    const ahora = horaTexto(new Date());
    if (!esEdicion) {
        if (fecha < hoy || (fecha === hoy && hora_inicio <= ahora)) {
            throw appError('No se pueden agendar reservas en el pasado');
        }
    } else if (fecha < hoy || (fecha === hoy && hora_fin <= ahora)) {
        throw appError('No se pueden mover reservas a un horario ya pasado');
    }

    return {
        fecha,
        hora_inicio,
        hora_fin,
        motivo: String(motivo).trim(),
        detalle: String(detalle || '').trim()
    };
}

function mapear(r) {
    return {
        id: r.id,
        fecha: fechaTexto(r.fecha),
        hora_inicio: horaTexto(r.hora_inicio),
        hora_fin: horaTexto(r.hora_fin),
        motivo: r.motivo,
        detalle: r.detalle || '',
        organizador_id: r.organizador_id,
        organizador_nombre: r.organizador_nombre || '',
        organizador_email: r.organizador_email || '',
        estado: r.estado,
        es_pasada: fechaTexto(r.fecha) < hoyTexto() ||
            (fechaTexto(r.fecha) === hoyTexto() && horaTexto(r.hora_fin) <= horaTexto(new Date()))
    };
}

// ── Lectura ──

async function getReservas({ desde = '', hasta = '', estado = '' } = {}) {
    const params = [];
    let sql = 'SELECT r.* FROM lobby_reservas r WHERE 1 = 1';

    let i = 1;
    if (desde) { sql += ` AND r.fecha >= $${i++}`; params.push(desde); }
    if (hasta) { sql += ` AND r.fecha <= $${i++}`; params.push(hasta); }
    if (estado) { sql += ` AND r.estado = $${i++}`; params.push(estado); }
    sql += ' ORDER BY r.fecha, r.hora_inicio';

    const result = await query(sql, params);
    return result.rows.map(mapear);
}

async function getReservasDia(fecha) {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw appError('Fecha requerida con formato YYYY-MM-DD');
    }
    const result = await query(
        'SELECT * FROM lobby_reservas WHERE fecha = $1 ORDER BY hora_inicio',
        [fecha]
    );
    return result.rows.map(mapear);
}

async function getAcceso(user) {
    if (user.rol === 'admin') {
        return { puede_agendar: true, es_admin: true };
    }
    const r = await query('SELECT 1 FROM lobby_designados WHERE usuario_id = $1', [user.id]);
    return { puede_agendar: r.rows.length > 0, es_admin: false };
}

// ── Escritura ──

async function crearReserva(body, user) {
    const datos = validarReserva(body);

    return withTransaction(async (q) => {
        // Bloqueo por fecha: nadie mas puede insertar reservas de este dia
        // mientras se verifica el solapamiento.
        await q('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey(datos.fecha)]);

        const solape = await q(
            `SELECT id, motivo, hora_inicio, hora_fin FROM lobby_reservas
             WHERE fecha = $1 AND estado = 'confirmada'
               AND hora_inicio < $2 AND hora_fin > $3`,
            [datos.fecha, datos.hora_fin, datos.hora_inicio]
        );
        if (solape.rows.length > 0) {
            const s = solape.rows[0];
            throw appError(
                `Horario ocupado: "${s.motivo}" ya usa la sala de ${horaTexto(s.hora_inicio)} a ${horaTexto(s.hora_fin)}`,
                409
            );
        }

        const ins = await q(
            `INSERT INTO lobby_reservas (fecha, hora_inicio, hora_fin, motivo, detalle, organizador_id, organizador_nombre, organizador_email)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [datos.fecha, datos.hora_inicio, datos.hora_fin, datos.motivo, datos.detalle,
             user.id, user.nombre || '', user.email || '']
        );
        return mapear(ins.rows[0]);
    });
}

async function editarReserva(id, body, user) {
    const datos = validarReserva(body, true);

    return withTransaction(async (q) => {
        await q('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey(datos.fecha)]);

        const act = await q('SELECT * FROM lobby_reservas WHERE id = $1 FOR UPDATE', [id]);
        if (act.rows.length === 0) throw appError('Reserva no encontrada', 404);

        const actual = act.rows[0];
        if (user.rol !== 'admin' && actual.organizador_id !== user.id) {
            throw appError('Solo el organizador o un administrador pueden editar esta reserva', 403);
        }
        if (actual.estado !== 'confirmada') {
            throw appError('Solo se pueden editar reservas confirmadas');
        }

        const solape = await q(
            `SELECT id, motivo, hora_inicio, hora_fin FROM lobby_reservas
             WHERE fecha = $1 AND estado = 'confirmada' AND id <> $4
               AND hora_inicio < $2 AND hora_fin > $3`,
            [datos.fecha, datos.hora_fin, datos.hora_inicio, id]
        );
        if (solape.rows.length > 0) {
            const s = solape.rows[0];
            throw appError(
                `Horario ocupado: "${s.motivo}" ya usa la sala de ${horaTexto(s.hora_inicio)} a ${horaTexto(s.hora_fin)}`,
                409
            );
        }

        const upd = await q(
            `UPDATE lobby_reservas
             SET fecha = $1, hora_inicio = $2, hora_fin = $3, motivo = $4, detalle = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 RETURNING *`,
            [datos.fecha, datos.hora_inicio, datos.hora_fin, datos.motivo, datos.detalle, id]
        );
        return mapear(upd.rows[0]);
    });
}

async function cancelarReserva(id, user) {
    const act = await query('SELECT * FROM lobby_reservas WHERE id = $1', [id]);
    if (act.rows.length === 0) throw appError('Reserva no encontrada', 404);

    const r = act.rows[0];
    if (user.rol !== 'admin' && r.organizador_id !== user.id) {
        throw appError('Solo el organizador o un administrador pueden cancelar esta reserva', 403);
    }
    if (r.estado !== 'confirmada') {
        throw appError('La reserva ya esta cancelada');
    }

    const upd = await query(
        `UPDATE lobby_reservas SET estado = 'cancelada', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [id]
    );
    return mapear(upd.rows[0]);
}

// ── Designados ──

async function getDesignados() {
    const result = await query(`
        SELECT u.id, u.nombre, u.email, u.rol
        FROM lobby_designados d
        JOIN usuarios u ON u.id = d.usuario_id
        WHERE u.activo = TRUE
        ORDER BY u.nombre`);
    return result.rows;
}

async function agregarDesignado(usuarioId) {
    const u = await query('SELECT id, nombre, email FROM usuarios WHERE id = $1 AND activo = TRUE', [usuarioId]);
    if (u.rows.length === 0) throw appError('Usuario no encontrado', 404);

    await query('INSERT INTO lobby_designados (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO NOTHING', [usuarioId]);
    return { ok: true, usuario: u.rows[0] };
}

async function eliminarDesignado(usuarioId) {
    const del = await query('DELETE FROM lobby_designados WHERE usuario_id = $1 RETURNING usuario_id', [usuarioId]);
    if (del.rows.length === 0) throw appError('El usuario no estaba designado', 404);
    return { ok: true };
}

// Usuarios que aun no son designados (para el selector del modal)
async function getDisponibles() {
    const result = await query(`
        SELECT u.id, u.nombre, u.email, u.rol
        FROM usuarios u
        WHERE u.activo = TRUE
          AND NOT EXISTS (SELECT 1 FROM lobby_designados d WHERE d.usuario_id = u.id)
        ORDER BY u.nombre`);
    return result.rows;
}

module.exports = {
    getReservas,
    getReservasDia,
    getAcceso,
    crearReserva,
    editarReserva,
    cancelarReserva,
    getDesignados,
    agregarDesignado,
    eliminarDesignado,
    getDisponibles,
    HORA_MIN,
    HORA_MAX
};
