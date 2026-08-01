const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./config/dbSchema');
const { query } = require('./config/database');
const { requestLogger } = require('./config/logger');
const { seedUsers } = require('./config/auth');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

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
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 10000;

async function start() {
    try {
        await initDB();
        console.log('[ASESORIA] Base de datos inicializada');
        await seedUsers();
        app.listen(PORT, () => {
            console.log(`[ASESORIA] Servidor corriendo en puerto ${PORT}`);
        });
    } catch (e) {
        console.error('[ASESORIA] Error al iniciar:', e.message);
        process.exit(1);
    }
}

start();
