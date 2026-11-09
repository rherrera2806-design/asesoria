/* ═══════════════════════════════════════════════════════════
   Theme — carga la paleta de colores y el logo del sistema
   desde el API y los aplica en :root (app.html y login.html)
   ═══════════════════════════════════════════════════════════ */

const Theme = (() => {
    const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:10000'
        : 'https://asesoria-api.onrender.com';

    // ── Utilidades de color (hex → mezclas) ──
    function hexRgb(hex) {
        const h = hex.replace('#', '');
        const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
    }
    function rgbHex(r, g, b) {
        const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
        return `#${c(r)}${c(g)}${c(b)}`;
    }
    // Mezcla c1 con c2 (t = 0 => c1, t = 1 => c2)
    function mix(c1, c2, t) {
        const a = hexRgb(c1), b = hexRgb(c2);
        return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    }
    const darken = (c, t) => mix(c, '#000000', t);
    const lighten = (c, t) => mix(c, '#ffffff', t);

    // Degradados derivados de un color base (equivalente visual a los defaults)
    function derivar(colores) {
        const info = colores.info;
        const side = colores.sidebar;
        const hero = colores.hero;
        return {
            info,
            infoDark: darken(info, 0.22),
            accent: colores.accent,
            accentDark: darken(colores.accent, 0.2),
            success: colores.success,
            warning: colores.warning,
            danger: colores.danger,
            bg: colores.bg,
            // Sidebar: base oscura → tinte azulado
            sidebarFrom: side,
            sidebarMid: mix(side, '#1e3a5f', 0.25),
            sidebarTo: mix(side, '#1e40af', 0.35),
            // Heroes: oscuro → azul del tema
            heroFrom: darken(hero, 0.78),
            heroMid: darken(hero, 0.5),
            heroTo: hero,
            // Login: degradado neutro derivado del color base del sidebar
            loginFrom: side,
            loginMid: lighten(side, 0.12),
            loginTo: lighten(side, 0.26)
        };
    }

    function setVar(nombre, valor) {
        document.documentElement.style.setProperty(nombre, valor);
    }

    function aplicarColores(colores) {
        const d = derivar(colores);
        setVar('--info', d.info);
        setVar('--info-dark', d.infoDark);
        setVar('--accent', d.accent);
        setVar('--accent-dark', d.accentDark);
        setVar('--success', d.success);
        setVar('--warning', d.warning);
        setVar('--danger', d.danger);
        setVar('--bg', d.bg);
        setVar('--gray-50', d.bg);
        setVar('--sidebar-from', d.sidebarFrom);
        setVar('--sidebar-mid', d.sidebarMid);
        setVar('--sidebar-to', d.sidebarTo);
        setVar('--hero-from', d.heroFrom);
        setVar('--hero-mid', d.heroMid);
        setVar('--hero-to', d.heroTo);
        setVar('--login-from', d.loginFrom);
        setVar('--login-mid', d.loginMid);
        setVar('--login-to', d.loginTo);
        // Glass (usado en hero buttons) derivado del color primario
        setVar('--glass', `${d.info}26`);
        setVar('--glass-border', `${d.info}33`);

        // theme-color del navegador
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', d.heroTo);
    }

    // Escapa texto antes de inyectarlo al DOM
    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Encabezado del sidebar: nombre, subtitulo, visibilidad y tamano del logo
    function aplicarMarca(cfg) {
        const nombre = cfg.app_nombre || 'Asesoria';
        const subtitulo = cfg.app_subtitulo == null ? 'Seguimiento' : cfg.app_subtitulo;
        const mostrarNombre = cfg.mostrar_nombre !== false;
        const mostrarSub = cfg.mostrar_subtitulo !== false;
        const tam = Number(cfg.logo_tamano) || 42;

        // Tamano del logo (sidebar y login, este un poco mayor)
        setVar('--sidebar-logo-size', `${tam}px`);
        setVar('--login-logo-size', `${Math.min(96, tam + 14)}px`);

        // Textos del encabezado del sidebar
        const titulo = document.querySelector('.sidebar-title');
        if (titulo) {
            const partes = [];
            if (mostrarNombre) partes.push(`<span class="st-nombre">${esc(nombre)}</span>`);
            if (mostrarSub && subtitulo) partes.push(`<small>${esc(subtitulo)}</small>`);
            const html = partes.join('');
            if (titulo.innerHTML !== html) titulo.innerHTML = html;
        }

        // Titulo del login: sigue al nombre de la aplicacion
        const h1 = document.querySelector('.login-header h1');
        if (h1 && h1.textContent !== nombre) h1.textContent = nombre;

        // Titulo de la pagina
        const esLogin = !!document.querySelector('.login-card');
        if (esLogin) {
            if (nombre !== 'Asesoria') document.title = `${nombre} - Iniciar Sesion`;
        } else {
            document.title = (mostrarSub && subtitulo) ? `${nombre} - ${subtitulo}` : nombre;
        }
    }

    function aplicarLogo(cfg) {
        // Logo del sidebar / login
        const targets = document.querySelectorAll('.sidebar-logo, .login-logo');
        targets.forEach(el => {
            if (cfg.logo) {
                if (el.dataset.conLogo !== cfg.logo) {
                    el.innerHTML = `<img src="${cfg.logo}" alt="${cfg.app_nombre || 'Logo'}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit">`;
                    el.dataset.conLogo = cfg.logo;
                }
            } else if (el.dataset.conLogo) {
                // Restaurar el icono por defecto de cada pagina
                if (el.classList.contains('login-logo')) el.textContent = '⚖';
                else el.textContent = (cfg.app_nombre || 'A').charAt(0).toUpperCase();
                delete el.dataset.conLogo;
            }
        });

        // Favicon
        if (cfg.favicon) {
            let link = document.querySelector('link[rel="icon"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = cfg.favicon;
        }
    }

    function aplicar(cfg) {
        if (!cfg) return;
        this.cfg = cfg;
        try { localStorage.setItem('app_theme', JSON.stringify(cfg)); } catch (e) { /* cuota */ }
        if (cfg.colores) aplicarColores(cfg.colores);
        aplicarMarca(cfg);
        aplicarLogo(cfg);
    }

    // Aplica la copia cacheada al instante (sin parpadeo) y luego refresca desde el API
    async function init() {
        try {
            const cache = localStorage.getItem('app_theme');
            if (cache) aplicar(JSON.parse(cache));
        } catch (e) { /* ignore */ }

        try {
            const res = await fetch(`${API}/api/config`, { headers: { Accept: 'application/json' } });
            if (res.ok) {
                const cfg = await res.json();
                aplicar(cfg);
            }
        } catch (e) { /* sin conexion: se mantiene el cache */ }
    }

    return { init, aplicar, mix, darken, lighten };
})();

// Exponer en window: los bindings `const` a nivel de script NO crean propiedades de window
window.Theme = Theme;

Theme.init();
