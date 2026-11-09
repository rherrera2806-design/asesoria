const { query, withTransaction, appError } = require('../config/database');
const { getPermisosUsuario } = require('../middleware/auth');

// ── PERMISOS GRANULARES: modulo x accion (ver / editar / eliminar) ──
// Catalogo valido de modulos. Debe mantenerse en sincronia con el frontend
// (web/public/js/modules/usuarios.js define la misma lista para la matriz).
const MODULOS = [
    { clave: 'asesoria', nombre: 'Asesorias (Solicitudes)' },
    { clave: 'asesoria-calendar', nombre: 'Calendario' },
    { clave: 'informes', nombre: 'Informes' },
    { clave: 'lobby', nombre: 'Lobby (Sala de Reuniones)' },
    { clave: 'usuarios', nombre: 'Usuarios' },
    { clave: 'configuracion', nombre: 'Apariencia (Tema y Logo)' }
];

const ACCIONES = ['ver', 'editar', 'eliminar'];

function validarPermiso(modulo, accion) {
    if (!MODULOS.some(m => m.clave === modulo)) {
        throw appError(`Modulo invalido: ${modulo}`);
    }
    if (!ACCIONES.includes(accion)) {
        throw appError(`Accion invalida: ${accion}`);
    }
}

// Permisos de un usuario: { modulo: [accion, ...] } (null si es admin)
async function getPermisos(usuarioId) {
    const u = await query('SELECT id, rol FROM usuarios WHERE id = $1 AND activo = TRUE', [usuarioId]);
    if (u.rows.length === 0) throw appError('Usuario no encontrado', 404);
    return getPermisosUsuario(usuarioId, u.rows[0].rol);
}

// Permisos de todos los usuarios: { [usuarioId]: { modulo: [...] } }
async function getTodosPermisos() {
    const usuarios = await query(
        'SELECT id, nombre, email, rol FROM usuarios WHERE activo = TRUE ORDER BY id'
    );
    const permisos = await query('SELECT usuario_id, modulo, accion FROM usuario_permisos');
    const mapa = {};
    for (const row of permisos.rows) {
        if (!mapa[row.usuario_id]) mapa[row.usuario_id] = {};
        if (!mapa[row.usuario_id][row.modulo]) mapa[row.usuario_id][row.modulo] = [];
        mapa[row.usuario_id][row.modulo].push(row.accion);
    }
    return {
        modulos: MODULOS,
        acciones: ACCIONES,
        usuarios: usuarios.rows.map(u => ({
            ...u,
            permisos: u.rol === 'admin' ? null : (mapa[u.id] || {})
        }))
    };
}

// Reemplaza todos los permisos de un usuario por la matriz enviada.
// Body: { permisos: { modulo: [accion, ...], ... } }
async function setPermisos(usuarioId, permisos) {
    const u = await query('SELECT id, rol FROM usuarios WHERE id = $1 AND activo = TRUE', [usuarioId]);
    if (u.rows.length === 0) throw appError('Usuario no encontrado', 404);
    if (u.rows[0].rol === 'admin') {
        throw appError('El administrador tiene todos los permisos implicitos y no se puede modificar');
    }
    if (!permisos || typeof permisos !== 'object' || Array.isArray(permisos)) {
        throw appError('permisos debe ser un objeto { modulo: [acciones] }');
    }

    // Validar toda la matriz antes de escribir
    const filas = [];
    for (const [modulo, acciones] of Object.entries(permisos)) {
        if (!Array.isArray(acciones)) throw appError(`Acciones de ${modulo} deben ser una lista`);
        for (const accion of acciones) {
            validarPermiso(modulo, accion);
            filas.push([usuarioId, modulo, accion]);
        }
    }

    return withTransaction(async (q) => {
        await q('DELETE FROM usuario_permisos WHERE usuario_id = $1', [usuarioId]);
        for (const [uid, modulo, accion] of filas) {
            await q(
                'INSERT INTO usuario_permisos (usuario_id, modulo, accion) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [uid, modulo, accion]
            );
        }
        return { ok: true, total: filas.length };
    });
}

module.exports = { MODULOS, ACCIONES, getPermisos, getTodosPermisos, setPermisos };
