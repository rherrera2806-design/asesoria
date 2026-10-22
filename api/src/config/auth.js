const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('./database');

// Si no hay JWT_SECRET en el entorno, se deriva de DATABASE_URL (estable entre reinicios,
// y no publico como el antiguo 'asesoria-secret-key-2026').
const JWT_SECRET = process.env.JWT_SECRET
    || (process.env.DATABASE_URL
        ? 'derived:' + crypto.createHash('sha256').update(process.env.DATABASE_URL).digest('hex')
        : 'asesoria-secret-key-2026');

if (!process.env.JWT_SECRET) {
    console.warn('[AUTH] AVISO: JWT_SECRET no esta definido en el entorno. Se deriva de DATABASE_URL. Recomendado: definir JWT_SECRET explicito.');
}

const JWT_EXPIRES = '30d';

const defaultUsers = [
    { nombre: 'Administrador', email: 'admin@asesoria.cl', password: 'admin', rol: 'admin' },
    { nombre: 'Visita', email: 'visita@asesoria.cl', password: 'visita', rol: 'visita' }
];

async function seedUsers() {
    const result = await query('SELECT COUNT(*) as c FROM usuarios');
    if (Number(result.rows[0].c) !== 0) return;

    // Solo crea usuarios por defecto (credenciales debiles) si se pide explicitamente.
    if (process.env.SEED_DEFAULT_USERS !== 'true') {
        console.log('[AUTH] Tabla de usuarios vacia. No se crean usuarios por defecto: define SEED_DEFAULT_USERS=true para crear admin/visita.');
        return;
    }

    for (const u of defaultUsers) {
        const hash = await bcrypt.hash(u.password, 10);
        await query(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            [u.nombre, u.email, hash, u.rol]
        );
    }
    console.log('[AUTH] Usuarios por defecto creados: admin@asesoria.cl / visita@asesoria.cl');
}

module.exports = { JWT_SECRET, JWT_EXPIRES, seedUsers };
