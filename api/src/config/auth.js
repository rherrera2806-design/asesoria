const bcrypt = require('bcryptjs');
const { query } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'asesoria-secret-key-2026';
const JWT_EXPIRES = '30d';

const defaultUsers = [
    { nombre: 'Administrador', email: 'admin@asesoria.cl', password: 'admin', rol: 'admin' },
    { nombre: 'Visita', email: 'visita@asesoria.cl', password: 'visita', rol: 'visita' }
];

async function seedUsers() {
    const result = await query('SELECT COUNT(*) as c FROM usuarios');
    if (Number(result.rows[0].c) === 0) {
        for (const u of defaultUsers) {
            const hash = await bcrypt.hash(u.password, 10);
            await query(
                'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
                [u.nombre, u.email, hash, u.rol]
            );
        }
        console.log('[AUTH] Usuarios por defecto creados: admin@asesoria.cl / visita@asesoria.cl');
    }
}

module.exports = { JWT_SECRET, JWT_EXPIRES, seedUsers };
