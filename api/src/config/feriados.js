// Calendario de feriados nacionales de Chile, calculado en codigo (sin dependencia externa).
//
// Fuentes: Ley 2977 (1915) y modificaciones vigentes:
//   - Ley 19668 (2000): traslado al lunes de San Pedro y San Pablo (29/6) y
//     del Dia del Encuentro de Dos Mundos (12/10) si caen mar/jue -> lunes anterior,
//     o viernes -> lunes posterior.
//   - Ley 20148 (2007): Virgen del Carmen (16/7) reemplaza a Corpus Christi.
//   - Ley 20215 (2007): puentes de septiembre (lun 17 y vie 20).
//   - Ley 20299 (2008): Dia Nacional de las Iglesias Evangelicas (31/10) se mueve a
//     viernes si cae martes o miercoles.
//   - Ley 20983 (2016): puente del 2 de enero (si es lunes) y del 17 de septiembre (si es viernes).
//   - Ley 21357 (2021): Dia Nacional de los Pueblos Indigenas (21/6, solsticio de invierno).
//   - Ascension del Senor y Corpus Christi NO son feriados (derogados por la ley 16840/1987+20148).
//
// Feriados puntuales (elecciones, plebiscitos, censos) se cargan de la tabla
// `feriados_extras` para que puedan agregarse con SQL sin tocar el codigo.

const { query } = require('./database');

// ---------- utilidades de fecha (trabajan en UTC para evitar problemas de zona horaria) ----------
const iso = (f) => `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, '0')}-${String(f.getUTCDate()).padStart(2, '0')}`;
const crear = (anio, mes, dia) => new Date(Date.UTC(anio, mes - 1, dia));
const sumarDias = (f, n) => new Date(f.getTime() + n * 86400000);
const diaSemana = (f) => f.getUTCDay(); // 0=domingo ... 6=sabado

// Domingo de Pascua (algoritmo gregoriano)
function domingoPascua(anio) {
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return crear(anio, mes, dia);
}

// Ley 19668: mar/jue -> lunes anterior ; viernes -> lunes posterior ; resto se mantiene
function trasladarLunes(f) {
    const d = diaSemana(f);
    if (d === 2) return sumarDias(f, -1);
    if (d === 3) return sumarDias(f, -2);
    if (d === 4) return sumarDias(f, -3);
    if (d === 5) return sumarDias(f, 3);
    return f;
}

// Ley 20299 (31/10): martes -> viernes anterior ; miercoles -> viernes posterior
function trasladarViernes(f) {
    const d = diaSemana(f);
    if (d === 2) return sumarDias(f, -3);
    if (d === 3) return sumarDias(f, 2);
    return f;
}

// Devuelve [{ fecha: 'YYYY-MM-DD', nombre }] con los feriados nacionales de un anio
function feriadosDeAnio(anio) {
    const out = [];
    const add = (f, nombre) => out.push({ fecha: iso(f), nombre });

    // Feriados fijos
    [
        [1, 1, 'Año Nuevo'],
        [5, 1, 'Día Nacional del Trabajo'],
        [5, 21, 'Día de las Glorias Navales'],
        [6, 21, 'Día Nacional de los Pueblos Indígenas'],
        [7, 16, 'Virgen del Carmen'],
        [8, 15, 'Asunción de la Virgen'],
        [9, 18, 'Fiestas Patrias'],
        [9, 19, 'Día de las Glorias del Ejército'],
        [11, 1, 'Día de Todos los Santos'],
        [12, 8, 'Inmaculada Concepción'],
        [12, 25, 'Navidad']
    ].forEach(([mes, dia, nombre]) => add(crear(anio, mes, dia), nombre));

    // Con traslado al lunes (ley 19668)
    add(trasladarLunes(crear(anio, 6, 29)), 'San Pedro y San Pablo');
    add(trasladarLunes(crear(anio, 10, 12)), 'Día del Encuentro de Dos Mundos');

    // 31 de octubre con traslado a viernes (ley 20299)
    add(trasladarViernes(crear(anio, 10, 31)), 'Día Nacional de las Iglesias Evangélicas y Protestantes');

    // Semana Santa (ley 2977): viernes y sábado santos
    const pascua = domingoPascua(anio);
    add(sumarDias(pascua, -2), 'Viernes Santo');
    add(sumarDias(pascua, -1), 'Sábado Santo');

    // Puentes
    if (diaSemana(crear(anio, 1, 2)) === 1) add(crear(anio, 1, 2), 'Puente de Año Nuevo (ley 20983)');
    if (diaSemana(crear(anio, 9, 17)) === 1) add(crear(anio, 9, 17), 'Puente de Fiestas Patrias (ley 20215)');
    if (diaSemana(crear(anio, 9, 17)) === 5) add(crear(anio, 9, 17), 'Puente de Fiestas Patrias (ley 20983)');
    if (diaSemana(crear(anio, 9, 20)) === 5) add(crear(anio, 9, 20), 'Puente de Fiestas Patrias (ley 20215)');

    return out.sort((x, y) => x.fecha.localeCompare(y.fecha));
}

// ---------- cache ----------
const cacheAnios = new Set();
const feriadosSet = new Set();
let extrasSet = new Set();

function cargarAnio(anio) {
    const clave = `${anio}`;
    if (cacheAnios.has(clave)) return;
    feriadosDeAnio(anio).forEach(f => feriadosSet.add(f.fecha));
    cacheAnios.add(clave);
}

// Feriados puntuales definidos por el usuario (elecciones, etc.)
async function cargarExtras() {
    try {
        const r = await query('SELECT fecha FROM feriados_extras');
        extrasSet = new Set(r.rows.map(x => String(x.fecha).slice(0, 10)));
    } catch (e) {
        console.error('[FERIADOS] Error cargando feriados_extras:', e.message);
    }
}

// Consulta sincrona usada por el calculo de dias habiles
function esFeriado(fecha) {
    if (!fecha || typeof fecha !== 'string' || fecha.length < 10) return false;
    const anio = Number(fecha.slice(0, 4));
    if (!Number.isFinite(anio)) return false;
    cargarAnio(anio);
    cargarAnio(anio - 1);
    cargarAnio(anio + 1);
    const clave = fecha.slice(0, 10);
    return feriadosSet.has(clave) || extrasSet.has(clave);
}

module.exports = { esFeriado, feriadosDeAnio, cargarExtras };
