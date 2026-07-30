const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'asesoria' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length > 1 ? ' ' + JSON.stringify(meta) : '';
                    return `${timestamp} [${level}] ${message}${metaStr}`;
                })
            )
        })
    ]
});

if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
    logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

const requestLogger = () => {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            if (req.url !== '/api/health') {
                logger.info(`${req.method} ${req.url}`, { status: res.statusCode, duration, ip: req.ip });
            }
        });
        next();
    };
};

module.exports = { logger, requestLogger };
