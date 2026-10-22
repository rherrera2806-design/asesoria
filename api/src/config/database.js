const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/asesoria',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
});

pool.on('error', (err) => {
    console.error('[DB] Error inesperado:', err.message);
});

const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 1000) console.log('[DB] Query lenta:', { text: text.substring(0, 80), duration, rows: result.rowCount });
        return result;
    } catch (e) {
        console.error('[DB] Error query:', { text: text.substring(0, 80), error: e.message });
        throw e;
    }
};

// Ejecuta varias queries en una transaccion: si algo falla, se revierte todo.
// Uso: await withTransaction(async (q) => { await q('...'); await q('...'); })
const withTransaction = async (fn) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultado = await fn((text, params) => client.query(text, params));
        await client.query('COMMIT');
        return resultado;
    } catch (e) {
        try { await client.query('ROLLBACK'); } catch { /* noop */ }
        throw e;
    } finally {
        client.release();
    }
};

// Error con mensaje seguro para mostrar al cliente (no se filtran errores internos/SQL)
const appError = (message, status = 400) => {
    const e = new Error(message);
    e.status = status;
    e.expose = true;
    return e;
};

module.exports = { pool, query, withTransaction, appError };
