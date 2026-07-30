const { query } = require('./database');

async function initDB() {
    await query(`CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'usuario',
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS estados_config (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        orden INTEGER NOT NULL DEFAULT 0,
        cierra_proceso BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS asesorias (
        id SERIAL PRIMARY KEY,
        codigo_identificacion VARCHAR(50) UNIQUE NOT NULL,
        remitente VARCHAR(200) NOT NULL,
        detalle_solicitud TEXT NOT NULL,
        observacion TEXT DEFAULT '',
        fecha_llegada DATE NOT NULL DEFAULT CURRENT_DATE,
        plazo_final DATE NOT NULL,
        estado_actual VARCHAR(100) DEFAULT 'en proceso',
        creado_por VARCHAR(255) DEFAULT 'sistema',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE TABLE IF NOT EXISTS asesorias_estados (
        id SERIAL PRIMARY KEY,
        asesoria_id INTEGER NOT NULL REFERENCES asesorias(id) ON DELETE CASCADE,
        estado VARCHAR(100) NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        usuario_email VARCHAR(255) NOT NULL,
        observacion TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`CREATE INDEX IF NOT EXISTS idx_asesorias_plazo ON asesorias(plazo_final)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_asesorias_estado ON asesorias(estado_actual)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_asesorias_fecha ON asesorias(fecha_llegada)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_asesorias_estados_id ON asesorias_estados(asesoria_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_asesorias_codigo ON asesorias(codigo_identificacion)`);

    const estCount = await query('SELECT COUNT(*) as c FROM estados_config');
    if (Number(estCount.rows[0].c) === 0) {
        const defaults = [
            { nombre: 'en proceso', orden: 1, cierra: false },
            { nombre: 'enviar para respuesta tecnica', orden: 2, cierra: false },
            { nombre: 'respuesta recibida', orden: 3, cierra: false },
            { nombre: 'preparando ord respuesta', orden: 4, cierra: false },
            { nombre: 'respondido y cerrado', orden: 5, cierra: true },
            { nombre: 'enviado y cerrado', orden: 6, cierra: true }
        ];
        for (const e of defaults) {
            await query(
                'INSERT INTO estados_config (nombre, orden, cierra_proceso) VALUES ($1, $2, $3) ON CONFLICT (nombre) DO NOTHING',
                [e.nombre, e.orden, e.cierra]
            );
        }
        console.log('[ASESORIA] Estados por defecto creados');
    }
}

function calcularPlazoFinal(fechaLlegada) {
    const fecha = new Date(fechaLlegada);
    let diasHabiles = 0;
    while (diasHabiles < 8) {
        fecha.setDate(fecha.getDate() + 1);
        const dia = fecha.getDay();
        if (dia !== 0 && dia !== 6) {
            diasHabiles++;
        }
    }
    return fecha.toISOString().split('T')[0];
}

function calcularDiasHabilesTranscurridos(fechaLlegada) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(fechaLlegada);
    inicio.setHours(0, 0, 0, 0);
    let dias = 0;
    const current = new Date(inicio);
    while (current <= hoy) {
        const dia = current.getDay();
        if (dia !== 0 && dia !== 6) {
            dias++;
        }
        current.setDate(current.getDate() + 1);
    }
    return dias;
}

function calcularDiasHabilesRestantes(plazoFinal) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fin = new Date(plazoFinal);
    fin.setHours(0, 0, 0, 0);
    if (fin < hoy) return 0;
    let dias = 0;
    const current = new Date(hoy);
    while (current <= fin) {
        const dia = current.getDay();
        if (dia !== 0 && dia !== 6) {
            dias++;
        }
        current.setDate(current.getDate() + 1);
    }
    return dias;
}

function getProgresoEstado(fechaLlegada, plazoFinal) {
    const transcurridos = calcularDiasHabilesTranscurridos(fechaLlegada);
    const restantes = calcularDiasHabilesRestantes(plazoFinal);
    const total = transcurridos + restantes;
    const pct = total > 0 ? (transcurridos / total) * 100 : 0;
    if (pct <= 50) return 'verde';
    if (pct <= 75) return 'amarillo';
    return 'rojo';
}

module.exports = {
    initDB,
    calcularPlazoFinal,
    calcularDiasHabilesTranscurridos,
    calcularDiasHabilesRestantes,
    getProgresoEstado
};
