const { query, appError } = require('../config/database');

// ── CONFIGURACION DEL SISTEMA: tema (paleta de colores) y logo ──
// Todo se guarda como JSON en la clave 'tema' de config_sistema.

const CLAVE = 'tema';

// Colores por defecto: los mismos que trae variables.css (estado actual de la app)
const DEFAULTS = {
    colores: {
        info: '#3b82f6',        // azul primario (botones, links, activos)
        accent: '#f59e0b',      // acento/amarillo
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        sidebar: '#0f172a',     // base del degradado del sidebar
        hero: '#1e40af',        // color final del degradado de los heroes
        bg: '#f8fafc'           // fondo de la app
    },
    logo: '',                    // data URL (png/jpg/svg) o vacio para el icono por defecto
    app_nombre: 'Asesoria',
    favicon: ''                  // data URL opcional para el favicon
};

function sanitizarTema(body) {
    const out = JSON.parse(JSON.stringify(DEFAULTS));
    if (!body || typeof body !== 'object') return out;

    if (body.colores && typeof body.colores === 'object') {
        for (const key of Object.keys(out.colores)) {
            const v = body.colores[key];
            // Solo hex de 3 o 6 caracteres: evita inyeccion de CSS arbitrario
            if (typeof v === 'string' && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) {
                out.colores[key] = v.toLowerCase();
            }
        }
    }

    if (typeof body.logo === 'string') {
        // data URL de imagen, rutas relativas propias, o vacio
        if (body.logo === '' || /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(body.logo)) {
            out.logo = body.logo;
        } else if (/^\/[\w\-./]+$/.test(body.logo)) {
            out.logo = body.logo;
        } else {
            throw appError('Logo invalido: se aceptan imagenes subidas (data URL) o rutas locales');
        }
        if (out.logo.length > 800 * 1024) {
            throw appError('El logo supera el maximo de 800 KB');
        }
    }

    if (typeof body.favicon === 'string') {
        if (body.favicon === '' || /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(body.favicon)) {
            out.favicon = body.favicon;
        }
        if (out.favicon.length > 200 * 1024) {
            throw appError('El favicon supera el maximo de 200 KB');
        }
    }

    if (typeof body.app_nombre === 'string' && body.app_nombre.trim()) {
        const n = body.app_nombre.trim().slice(0, 40);
        if (!/[<>]/.test(n)) out.app_nombre = n;
    }

    return out;
}

async function getTema() {
    const r = await query('SELECT valor FROM config_sistema WHERE clave = $1', [CLAVE]);
    if (r.rows.length === 0 || !r.rows[0].valor) {
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
    try {
        const guardado = JSON.parse(r.rows[0].valor);
        // Fusionar con defaults para tolerar claves faltantes en futuras versiones
        return { ...JSON.parse(JSON.stringify(DEFAULTS)), ...guardado, colores: { ...DEFAULTS.colores, ...(guardado.colores || {}) } };
    } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
}

async function setTema(body) {
    const tema = sanitizarTema(body);
    await query(
        `INSERT INTO config_sistema (clave, valor, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = CURRENT_TIMESTAMP`,
        [CLAVE, JSON.stringify(tema)]
    );
    return tema;
}

module.exports = { getTema, setTema, DEFAULTS };
