const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./config/dbSchema');
const { query } = require('./config/database');
const { requestLogger } = require('./config/logger');
const { seedUsers } = require('./config/auth');

const app = express();

// Detras de Render/Supabase hay un proxy: confiar en 1 salto para conocer la IP real
// (necesario para que el rate limit por IP funcione).
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
const CORS_ORIGINS = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
    : true;
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Demasiadas peticiones, intente mas tarde' });
    }
});
app.use('/api/', limiter);

// Limite estricto solo para login: evita fuerza bruta sobre la contrasena.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ error: 'Demasiados intentos de inicio de sesion. Espera unos minutos.' });
    }
});
app.use('/api/auth/login', loginLimiter);

app.use(require('./routes/auth'));
app.use(require('./routes/asesoria'));

app.get('/api/health', async (req, res) => {
    try {
        await query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (e) {
        res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
    }
});

app.use((err, req, res, next) => {
    // Se loguea el detalle completo, pero al cliente solo se envia un mensaje seguro.
    console.error('[ERROR]', err.message, err.stack);
    const status = err.status || 500;
    const mensaje = err.expose || status < 500 ? err.message : 'Error interno del servidor';
    res.status(status).json({ error: mensaje });
});

const PORT = process.env.PORT || 10000;

async function start() {
    const MAX_INTENTOS = 6;
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
            await initDB();
            console.log('[ASESORIA] Base de datos inicializada');
            await seedUsers();
            break;
        } catch (e) {
            console.error(`[ASESORIA] Error al conectar con la base de datos (intento ${intento}/${MAX_INTENTOS}):`, e.message);
            if (intento === MAX_INTENTOS) {
                console.error('[ASESORIA] Se supero el maximo de intentos. Revisa DATABASE_URL y que la base este activa.');
                process.exit(1);
            }
            console.log(`[ASESORIA] Reintentando en 10 segundos...`);
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    app.listen(PORT, () => {
        console.log(`[ASESORIA] Servidor corriendo en puerto ${PORT}`);
    });
}

start();
