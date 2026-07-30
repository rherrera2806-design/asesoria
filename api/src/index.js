const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./config/dbSchema');
const { requestLogger } = require('./config/logger');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use(require('./routes/asesoria'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
        app.listen(PORT, () => {
            console.log(`[ASESORIA] Servidor corriendo en puerto ${PORT}`);
        });
    } catch (e) {
        console.error('[ASESORIA] Error al iniciar:', e.message);
        process.exit(1);
    }
}

start();
