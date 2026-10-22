const { query } = require('./database');
const { esFeriado, cargarExtras } = require('./feriados');

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

    // Migracion: si las columnas de fecha quedaron como TEXT (esquema antiguo), se pasan a DATE.
    // Se valida antes que todos los valores tengan formato YYYY-MM-DD para no romper el arranque.
    const cols = await query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 'asesorias' AND column_name IN ('fecha_llegada', 'plazo_final')`
    );
    for (const col of cols.rows) {
        if (col.data_type !== 'text') continue;
        const invalidas = await query(
            `SELECT COUNT(*) AS c FROM asesorias
             WHERE ${col.column_name} IS NULL OR ${col.column_name} !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`
        );
        if (Number(invalidas.rows[0].c) > 0) {
            console.error(`[ASESORIA] Columna ${col.column_name} tiene valores no validos: se mantiene como TEXT.`);
            continue;
        }
        await query(`ALTER TABLE asesorias ALTER COLUMN ${col.column_name} TYPE DATE USING (${col.column_name}::date)`);
        console.log(`[ASESORIA] Columna ${col.column_name} migrada a DATE`);
    }

    await query(`CREATE TABLE IF NOT EXISTS feriados_extras (
        fecha TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Feriados extras (elecciones, plebiscitos, etc.) deben estar cargados antes de recalcular plazos
    await cargarExtras();

    const closedStates = await query('SELECT nombre FROM estados_config WHERE cierra_proceso = TRUE');
    const closedNames = closedStates.rows.map(r => r.nombre);
    if (closedNames.length > 0) {
        const placeholders = closedNames.map((_, i) => `$${i + 1}`).join(',');
        const openResult = await query(
            `SELECT id, to_char(fecha_llegada, 'YYYY-MM-DD') AS fecha_llegada
             FROM asesorias WHERE estado_actual NOT IN (${placeholders})`,
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

    const allEstados = await query('SELECT nombre FROM estados_config WHERE activo = TRUE');
    const estadosValidos = allEstados.rows.map(r => r.nombre);
    if (estadosValidos.length > 0) {
        const ph = estadosValidos.map((_, i) => `$${i + 1}`).join(',');
        const orphans = await query(
            `SELECT id, estado_actual FROM asesorias WHERE estado_actual NOT IN (${ph})`,
            estadosValidos
        );
        for (const row of orphans.rows) {
            const viejo = row.estado_actual.toLowerCase();
            let nuevo = null;
            if (viejo.includes('respondido') && viejo.includes('cerrado')) {
                nuevo = estadosValidos.find(e => e.includes('respondido') && e.includes('cerrado'));
            } else if (viejo.includes('enviado') && viejo.includes('cerrado')) {
                nuevo = estadosValidos.find(e => e.includes('enviado') && e.includes('cerrado'));
            }
            if (nuevo) {
                await query('UPDATE asesorias SET estado_actual = $1 WHERE id = $2', [nuevo, row.id]);
                await query('UPDATE asesorias_estados SET estado = $1 WHERE asesoria_id = $2 AND estado = $3', [nuevo, row.id, row.estado_actual]);
            }
        }
        if (orphans.rows.length > 0) {
            console.log(`[ASESORIA] Estados sincronizados: ${orphans.rows.length} registros actualizados`);
        }
    }
}

function calcularPlazoFinal(fechaLlegada) {
    const parts = String(fechaLlegada).slice(0, 10).split('-');
    const fecha = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);

    // Dia util = de lunes a viernes y no feriado (ley chilena)
    const esUtil = (f) => {
        const d = f.getDay();
        if (d === 0 || d === 6) return false;
        const y = f.getFullYear();
        const m = String(f.getMonth() + 1).padStart(2, '0');
        const dd = String(f.getDate()).padStart(2, '0');
        return !esFeriado(`${y}-${m}-${dd}`);
    };

    let diasHabiles = 1;
    while (!esUtil(fecha)) {
        fecha.setDate(fecha.getDate() + 1);
    }
    while (diasHabiles < 10) {
        fecha.setDate(fecha.getDate() + 1);
        if (esUtil(fecha)) diasHabiles++;
    }

    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function diaUtilChileno(f) {
    const dia = f.getDay();
    if (dia === 0 || dia === 6) return false;
    const y = f.getFullYear();
    const m = String(f.getMonth() + 1).padStart(2, '0');
    const d = String(f.getDate()).padStart(2, '0');
    return !esFeriado(`${y}-${m}-${d}`);
}

function calcularDiasHabilesTranscurridos(fechaLlegada) {
    const parts = String(fechaLlegada).slice(0, 10).split('-');
    const inicio = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    let dias = 0;
    const current = new Date(inicio);
    while (current <= hoy) {
        if (diaUtilChileno(current)) dias++;
        current.setDate(current.getDate() + 1);
    }
    return dias;
}

function calcularDiasHabilesRestantes(plazoFinal) {
    const parts = String(plazoFinal).slice(0, 10).split('-');
    const fin = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    if (fin <= hoy) return 0;
    let dias = 0;
    const current = new Date(hoy);
    while (current < fin) {
        current.setDate(current.getDate() + 1);
        if (diaUtilChileno(current)) dias++;
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
    diaUtilChileno,
    getProgresoEstado
};
