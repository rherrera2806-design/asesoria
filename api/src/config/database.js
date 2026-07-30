const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/asesoria',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
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

module.exports = { pool, query };
