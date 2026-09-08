const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://asesoria-api.onrender.com';

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

const Auth = {
    getToken() { return localStorage.getItem('auth_token'); },
    getUser() { try { return JSON.parse(localStorage.getItem('auth_user')); } catch { return null; } },
    isLoggedIn() { return !!this.getToken(); },
    isAdmin() { const u = this.getUser(); return u && u.rol === 'admin'; },
    isVisitor() { const u = this.getUser(); return u && u.rol === 'visita'; },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = 'login.html';
    }
};

async function apiFetch(path, options = {}, retries = 2) {
    const token = Auth.getToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
            clearTimeout(timeout);

            if (res.status === 401) {
                const container = document.getElementById('alertContainer');
                if (container) {
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-warning';
                    alert.innerHTML = '<strong>Sesion expirada</strong><br>Tu sesion ha caducado. Seras redirigido al inicio de sesion...';
                    container.appendChild(alert);
                }
                setTimeout(() => Auth.logout(), 2000);
                throw new Error('Sesion expirada, inicie sesion novamente');
            }

            if (res.status === 503 && attempt < retries) {
                console.warn(`[API] 503 en ${path}, reintentando (${attempt + 1}/${retries})...`);
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }

            return res;
        } catch (e) {
            clearTimeout(timeout);
            if (e.name === 'AbortError' && attempt < retries) {
                console.warn(`[API] Timeout en ${path}, reintentando (${attempt + 1}/${retries})...`);
                await new Promise(r => setTimeout(r, 3000));
                continue;
            }
            if (e.name === 'AbortError') {
                throw new Error('El servidor tardo demasiado en responder. Intenta nuevamente.');
            }
            throw e;
        }
    }
}

const App = {
    modules: {},
    currentPage: null,

    registerModule(name, handler) { this.modules[name] = handler; },

    async loadModule(name) {
        if (this.currentPage === name) return;
        document.querySelectorAll('#mainContent .page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        this.closeSidebar();

        let page = document.getElementById(`page-${name}`);
        if (!page) {
            page = document.createElement('div');
            page.id = `page-${name}`;
            page.className = 'page active';
            document.getElementById('mainContent').appendChild(page);
        }
        page.classList.add('active');
        page.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b" id="loadingMsg">Cargando...</div>';
        const loadingTimer = setTimeout(() => {
            const lm = document.getElementById('loadingMsg');
            if (lm && lm.parentElement) lm.innerHTML = '<div style="text-align:center;padding:40px"><div style="margin-bottom:12px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg></div><div style="color:#64748b;font-size:13px">El servidor esta iniciando, por favor espera...</div><div style="color:#94a3b8;font-size:11px;margin-top:4px">Render free tier puede tardar hasta 60 seg en despertar</div></div><style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>';
        }, 5000);

        const navItem = document.querySelector(`.nav-item[data-page="${name}"]`);
        if (navItem) navItem.classList.add('active');
        this.currentPage = name;

        if (this.modules[name]) {
            try { await this.modules[name].render(); }
            catch (e) { page.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`; console.error(e); }
        }
        clearTimeout(loadingTimer);
    },

    showModal(html, options = {}) {
        const overlay = document.getElementById('modalOverlay');
        overlay.querySelector('.modal-body').innerHTML = html;
        const header = overlay.querySelector('.modal-header h3');
        if (header) header.textContent = options.title || '';
        const footer = overlay.querySelector('.modal-footer');
        footer.innerHTML = '<button class="btn btn-outline" onclick="App.hideModal()">Cerrar</button>';
        overlay.classList.add('show');
    },

    hideModal() { document.getElementById('modalOverlay').classList.remove('show'); },

    showAlert(message, type = 'success') {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        container.appendChild(alert);
        setTimeout(() => alert.remove(), 4000);
    },

    toast(message, type) { this.showAlert(message, type); },

    confirm(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('modalOverlay');
            overlay.querySelector('.modal-body').innerHTML = `<p>${message}</p>`;
            const footer = overlay.querySelector('.modal-footer');
            footer.innerHTML = '';
            const btnCancel = document.createElement('button');
            btnCancel.className = 'btn btn-outline';
            btnCancel.textContent = 'Cancelar';
            btnCancel.onclick = () => { overlay.classList.remove('show'); resolve(false); };
            const btnConfirm = document.createElement('button');
            btnConfirm.className = 'btn btn-danger';
            btnConfirm.textContent = 'Confirmar';
            btnConfirm.onclick = () => { overlay.classList.remove('show'); resolve(true); };
            footer.appendChild(btnCancel);
            footer.appendChild(btnConfirm);
            overlay.classList.add('show');
        });
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('show', sidebar.classList.contains('open'));
    },

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('show');
    },

    toggleCollapse() {
        const sidebar = document.getElementById('sidebar');
        const layout = document.querySelector('.app-layout');
        sidebar.classList.toggle('collapsed');
        layout.classList.toggle('sidebar-collapsed');
        const icon = document.querySelector('#sidebarCollapseBtn svg polyline');
        if (sidebar.classList.contains('collapsed')) {
            icon.setAttribute('points', '9 18 15 12 9 6');
        } else {
            icon.setAttribute('points', '15 18 9 12 15 6');
        }
        localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
    },

    setSidebarBadge(page, count) {
        const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (!navItem) return;
        let badge = navItem.querySelector('.nav-badge');
        if (count > 0) {
            if (!badge) { badge = document.createElement('span'); badge.className = 'nav-badge'; navItem.appendChild(badge); }
            badge.textContent = count;
        } else if (badge) { badge.remove(); }
    }
};

const SIDEBAR_SECTIONS = {
    asesoria: ['asesoria', 'asesoria-calendar', 'informes'],
    config: ['usuarios']
};

function getUser() { return Auth.getUser(); }

function hasSection(section) { return SIDEBAR_SECTIONS[section] !== undefined; }
function canSeeItem(item, section) { return true; }

function toggleSection(section) {
    const group = document.getElementById(`section-${section}`);
    const sectionEl = group?.previousElementSibling;
    if (group) {
        group.classList.toggle('collapsed');
        if (sectionEl) {
            sectionEl.classList.toggle('collapsed');
            const isExpanded = !sectionEl.classList.contains('collapsed');
            sectionEl.setAttribute('aria-expanded', isExpanded);
        }
    }
}

function navI(page, label, icon) {
    return `<div class="nav-item" data-page="${page}" onclick="App.loadModule('${page}')" onkeydown="if(event.key==='Enter')App.loadModule('${page}')" role="button" tabindex="0" aria-label="${label}" data-tooltip="${label}">
        <span class="nav-icon" aria-hidden="true">${icon}</span><span>${label}</span></div>`;
}

const SVG = {
    list: '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};

function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const user = Auth.getUser();
    let html = '';

    // User profile section
    if (user) {
        const initial = (user.nombre || 'U').charAt(0).toUpperCase();
        const roleClass = user.rol === 'admin' ? 'sidebar-role-admin' : 'sidebar-role-visita';
        html += `
            <div class="sidebar-profile" data-tooltip="${user.nombre || user.email}">
                <div class="sidebar-profile-avatar ${roleClass}">${initial}</div>
                <div class="sidebar-profile-info">
                    <div class="sidebar-profile-name">${escapeHtml(user.nombre || user.email)}</div>
                    <div class="sidebar-profile-role">${user.rol === 'admin' ? 'Administrador' : 'Visita'}</div>
                </div>
            </div>
        `;
    }

    // Quick actions
    if (Auth.isAdmin()) {
        html += `
            <div class="sidebar-quick-actions">
                <button class="sidebar-quick-btn" onclick="App.modules.asesoria?.showCrearModal()" data-tooltip="Nueva solicitud" aria-label="Nueva solicitud">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Nueva</span>
                </button>
            </div>
        `;
    }

    // Divider
    html += '<div class="sidebar-divider"></div>';

    // Navigation sections
    if (hasSection('asesoria')) {
        html += `<div class="nav-section" onclick="toggleSection('asesoria')" role="button" tabindex="0" aria-expanded="true" aria-controls="section-asesoria"><span>ASESORIA</span><span class="toggle-icon" aria-hidden="true">▼</span></div>`;
        html += `<div class="nav-section-group" id="section-asesoria" role="group">`;
        html += navI('asesoria', 'Solicitudes', SVG.list);
        html += navI('asesoria-calendar', 'Calendario', SVG.calendar);
        html += navI('informes', 'Informes', SVG.chart);
        html += `</div>`;
    }

    // Divider
    html += '<div class="sidebar-divider"></div>';

    if (Auth.isAdmin() && hasSection('config')) {
        html += `<div class="nav-section" onclick="toggleSection('config')" role="button" tabindex="0" aria-expanded="true" aria-controls="section-config"><span>CONFIGURACION</span><span class="toggle-icon" aria-hidden="true">▼</span></div>`;
        html += `<div class="nav-section-group" id="section-config" role="group">`;
        html += navI('usuarios', 'Usuarios', SVG.users);
        html += `</div>`;
    }

    nav.innerHTML = html;

    // Footer with logout and version
    const logoutHtml = `
        <div class="sidebar-footer">
            <div class="sidebar-version">v1.0.0</div>
            <div id="sidebarLogout" onclick="Auth.logout()" class="sidebar-logout" role="button" tabindex="0" aria-label="Cerrar sesion" data-tooltip="Cerrar sesion">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Cerrar sesion</span>
            </div>
        </div>`;
    nav.insertAdjacentHTML('beforeend', logoutHtml);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.requireAuth()) return;

    const user = Auth.getUser();
    if (user) {
        document.getElementById('userName')?.remove();
    }

    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    renderSidebar();
    App.loadModule('asesoria');

    if (localStorage.getItem('sidebar_collapsed') === 'true') {
        document.getElementById('sidebar').classList.add('collapsed');
        document.querySelector('.app-layout').classList.add('sidebar-collapsed');
        document.querySelector('#sidebarCollapseBtn svg polyline').setAttribute('points', '9 18 15 12 9 6');
    }
});
