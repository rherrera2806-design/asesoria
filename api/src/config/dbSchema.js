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
        fecha_llegada TEXT NOT NULL DEFAULT to_char(CURRENT_DATE, 'YYYY-MM-DD'),
        plazo_final TEXT NOT NULL,
        estado_actual VARCHAR(100) DEFAULT 'en proceso',
        creado_por VARCHAR(255) DEFAULT 'sistema',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await query(`DO $$ BEGIN
        ALTER TABLE asesorias ALTER COLUMN fecha_llegada TYPE TEXT USING to_char(fecha_llegada::date, 'YYYY-MM-DD');
        ALTER TABLE asesorias ALTER COLUMN plazo_final TYPE TEXT USING to_char(plazo_final::date, 'YYYY-MM-DD');
    EXCEPTION WHEN OTHERS THEN NULL;
    END $$`);

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

    const closedStates = await query('SELECT nombre FROM estados_config WHERE cierra_proceso = TRUE');
    const closedNames = closedStates.rows.map(r => r.nombre);
    if (closedNames.length > 0) {
        const placeholders = closedNames.map((_, i) => `$${i + 1}`).join(',');
        const openResult = await query(
            `SELECT id, fecha_llegada FROM asesorias WHERE estado_actual NOT IN (${placeholders})`,
            closedNames
        );
        for (const row of openResult.rows) {
            const nuevoPlazo = calcularPlazoFinal(row.fecha_llegada);
            await query('UPDATE asesorias SET plazo_final = $1 WHERE id = $2', [nuevoPlazo, row.id]);
        }
        if (openResult.rows.length > 0) {
            console.log(`[ASESORIA] Plazos recalculados: ${openResult.rows.length} procesos abiertos`);
        }
    }
}

function calcularPlazoFinal(fechaLlegada) {
    const parts = fechaLlegada.split('-');
    const fecha = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    let diasHabiles = 1;
    const dia = fecha.getDay();
    if (dia === 0 || dia === 6) {
        while (fecha.getDay() === 0 || fecha.getDay() === 6) {
            fecha.setDate(fecha.getDate() + 1);
        }
    }
    while (diasHabiles < 10) {
        fecha.setDate(fecha.getDate() + 1);
        const d = fecha.getDay();
        if (d !== 0 && d !== 6) {
            diasHabiles++;
        }
    }
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function calcularDiasHabilesTranscurridos(fechaLlegada) {
    const parts = fechaLlegada.split('-');
    const inicio = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
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
    const parts = plazoFinal.split('-');
    const fin = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    if (fin <= hoy) return 0;
    let dias = 0;
    const current = new Date(hoy);
    while (current < fin) {
        current.setDate(current.getDate() + 1);
        const dia = current.getDay();
        if (dia !== 0 && dia !== 6) {
            dias++;
        }
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
