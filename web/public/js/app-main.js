const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://asesoria-api.onrender.com';

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function apiFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, options);
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
        page.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">Cargando...</div>';

        const navItem = document.querySelector(`.nav-item[data-page="${name}"]`);
        if (navItem) navItem.classList.add('active');
        this.currentPage = name;

        if (this.modules[name]) {
            try { await this.modules[name].render(); }
            catch (e) { page.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`; console.error(e); }
        }
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
    asesoria: ['asesoria', 'asesoria-calendar']
};

function getUser() {
    try { return JSON.parse(localStorage.getItem('asesoria_user')); } catch { return null; }
}

function hasSection(section) { return SIDEBAR_SECTIONS[section] !== undefined; }
function canSeeItem(item, section) { return true; }

function toggleSection(section) {
    const group = document.getElementById(`section-${section}`);
    const sectionEl = group?.previousElementSibling;
    if (group) {
        group.classList.toggle('collapsed');
        if (sectionEl) sectionEl.classList.toggle('collapsed');
    }
}

function navI(page, label, icon) {
    return `<div class="nav-item" data-page="${page}" onclick="App.loadModule('${page}')">
        <span class="nav-icon">${icon}</span><span>${label}</span></div>`;
}

const SVG = {
    list: '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
};

function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    let html = '';

    if (hasSection('asesoria')) {
        html += `<div class="nav-section" onclick="toggleSection('asesoria')"><span>ASESORIA</span><span class="toggle-icon">▼</span></div>`;
        html += `<div class="nav-section-group" id="section-asesoria">`;
        html += navI('asesoria', 'Solicitudes', SVG.list);
        html += navI('asesoria-calendar', 'Calendario', SVG.calendar);
        html += `</div>`;
    }

    nav.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (user) {
        document.getElementById('userName').textContent = user.nombre || user.email || 'Usuario';
        document.getElementById('userAvatar').textContent = (user.nombre || 'U').charAt(0).toUpperCase();
    }

    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    renderSidebar();
    App.loadModule('asesoria');
});
