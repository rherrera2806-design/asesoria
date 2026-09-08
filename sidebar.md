# Sidebar Component

Componente de sidebar reutilizable con perfil de usuario, secciones colapsables, tooltips, quick actions y accesibilidad.

## Características

- Perfil de usuario con avatar, nombre y rol
- Secciones colapsables con toggle
- Quick actions (botón rápido)
- Tooltips en estado colapsado
- Badges de notificación
- Indicador de versión
- Accesibilidad completa (ARIA, focus visible, keyboard nav)
- Responsive (drawer en mobile)
- Estado colapsado (48px) con solo íconos

## Estructura HTML

```html
<div class="app-layout" id="appLayout">
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">L</div>
            <div class="sidebar-title">
                Mi App
                <small>Subtítulo</small>
            </div>
            <button onclick="toggleCollapse()" id="sidebarCollapseBtn" class="sidebar-collapse-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
        </div>
        <nav class="sidebar-nav" id="sidebarNav">
            <!-- Se llena dinámicamente con renderSidebar() -->
        </nav>
    </aside>
    <div class="sidebar-backdrop" id="sidebarBackdrop" onclick="toggleSidebar()"></div>
    <header class="header">
        <!-- Header content -->
    </header>
    <main class="main-content" id="mainContent">
        <!-- Page content -->
    </main>
</div>
```

## CSS

```css
/* ═══════════════════════════════════════════════════════════
   Sidebar Component
   ═══════════════════════════════════════════════════════════ */

:root {
    --sidebar-width: 260px;
    --header-height: 56px;
    --accent: #f59e0b;
    --accent-dark: #d97706;
    --gray-800: #1f2937;
    --gray-900: #111827;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --transition-fast: 0.15s ease;
    --transition-base: 0.2s ease;
    --transition-slow: 0.3s ease;
}

/* ── App Layout ── */
.app-layout {
    display: grid;
    grid-template-columns: var(--sidebar-width) 1fr;
    grid-template-rows: var(--header-height) 1fr;
    height: 100vh;
    grid-template-areas: "sidebar header" "sidebar main";
    transition: grid-template-columns var(--transition-slow);
}
.app-layout.sidebar-collapsed {
    grid-template-columns: 48px 1fr;
}

/* ── Sidebar ── */
.sidebar {
    grid-area: sidebar;
    background: linear-gradient(180deg, var(--gray-900) 0%, #121d33 50%, #1a2744 100%);
    color: white;
    overflow-y: auto;
    z-index: 200;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: width var(--transition-slow);
}
.sidebar.collapsed {
    width: 48px;
    min-width: 48px;
    overflow: hidden;
}

/* Collapsed state - hide text, show icons */
.sidebar.collapsed .sidebar-title,
.sidebar.collapsed .nav-item > span:last-child,
.sidebar.collapsed .nav-section span,
.sidebar.collapsed .nav-section .toggle-icon,
.sidebar.collapsed .nav-section::after,
.sidebar.collapsed .nav-badge,
.sidebar.collapsed > div:last-child {
    display: none;
}
.sidebar.collapsed .sidebar-nav {
    padding: var(--space-2) 0;
    overflow: hidden;
}
.sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 10px 0;
    margin: 1px var(--space-1);
}
.sidebar.collapsed .nav-section {
    justify-content: center;
    padding: var(--space-3) 0;
}
.sidebar.collapsed .nav-section-group {
    max-height: none !important;
}
.sidebar.collapsed .nav-section-group.collapsed {
    max-height: 0 !important;
}

/* Sidebar background texture */
.sidebar::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
        radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.06) 0%, transparent 50%),
        url("data:image/svg+xml,%3csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='1' height='1' x='12' y='12' fill='rgba(255,255,255,0.025)'/%3e%3c/svg%3e");
    pointer-events: none;
    z-index: 0;
}
.sidebar > * { position: relative; z-index: 1; }
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* ── Sidebar Header ── */
.sidebar-header {
    padding: var(--space-5) var(--space-5);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
}
.sidebar.collapsed .sidebar-header {
    padding: var(--space-4) var(--space-2);
    justify-content: center;
    border-bottom: none;
    cursor: pointer;
}
.sidebar.collapsed .sidebar-header:hover .sidebar-logo {
    transform: scale(1.1);
}
.sidebar-logo {
    width: 42px; height: 42px;
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 800; color: var(--gray-900);
    box-shadow: 0 2px 12px rgba(245,158,11,0.35);
    animation: logoPulse 3s ease-in-out infinite;
}
.sidebar.collapsed .sidebar-logo {
    margin: 0;
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
}
@keyframes logoPulse {
    0%, 100% { box-shadow: 0 2px 12px rgba(245,158,11,0.3); }
    50% { box-shadow: 0 2px 24px rgba(245,158,11,0.5); }
}
.sidebar-title {
    font-size: 0.9375rem; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em;
}
.sidebar-title small {
    display: block; font-size: 0.5625rem; font-weight: 600;
    opacity: 0.4; letter-spacing: 0.12em; margin-top: 3px; text-transform: uppercase;
}
.sidebar.collapsed #sidebarCollapseBtn {
    display: none;
}

/* ── Sidebar Profile ── */
.sidebar-profile {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: relative;
}
.sidebar.collapsed .sidebar-profile {
    justify-content: center;
    padding: var(--space-4) var(--space-2);
}
.sidebar.collapsed .sidebar-profile-info { display: none; }
.sidebar-profile-avatar {
    width: 36px; height: 36px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.875rem; font-weight: 700; color: white; flex-shrink: 0;
}
.sidebar-role-admin { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.sidebar-role-visita { background: linear-gradient(135deg, #22c55e, #16a34a); }
.sidebar-profile-info { min-width: 0; flex: 1; }
.sidebar-profile-name {
    font-size: 0.8125rem; font-weight: 600; color: white;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar-profile-role {
    font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.08em; color: rgba(255,255,255,0.4); margin-top: 1px;
}

/* ── Sidebar Quick Actions ── */
.sidebar-quick-actions {
    padding: var(--space-2) var(--space-4);
}
.sidebar.collapsed .sidebar-quick-actions { display: none; }
.sidebar-quick-btn {
    display: flex; align-items: center; gap: var(--space-2);
    width: 100%; padding: 8px 12px;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
    border-radius: var(--radius-md); color: var(--accent);
    font-size: 0.75rem; font-weight: 600; cursor: pointer;
    transition: all var(--transition-fast);
}
.sidebar-quick-btn:hover {
    background: rgba(245,158,11,0.2); border-color: rgba(245,158,11,0.4);
    transform: translateX(2px);
}

/* ── Sidebar Divider ── */
.sidebar-divider {
    height: 1px; margin: var(--space-2) var(--space-5);
    background: linear-gradient(90deg, rgba(255,255,255,0.06), transparent);
}
.sidebar.collapsed .sidebar-divider { margin: var(--space-2) var(--space-2); }

/* ── Sidebar Nav ── */
.sidebar-nav { flex: 1; overflow-y: auto; padding: var(--space-2) 0; }

/* ── Nav Sections ── */
.nav-section {
    padding: var(--space-4) var(--space-5) var(--space-2);
    font-size: 0.5625rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: rgba(255,255,255,0.22);
    cursor: pointer; display: flex; justify-content: space-between; align-items: center;
    user-select: none; transition: color var(--transition-fast); margin-top: var(--space-1);
}
.nav-section::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent);
    margin-left: var(--space-3);
}
.nav-section:hover { color: rgba(255,255,255,0.45); }
.nav-section .toggle-icon {
    font-size: 0.5625rem; transition: transform var(--transition-base); margin-left: var(--space-2);
}
.nav-section.collapsed .toggle-icon { transform: rotate(-90deg); }
.nav-section-group {
    overflow: hidden; transition: max-height var(--transition-slow); max-height: 500px;
}
.nav-section-group.collapsed { max-height: 0 !important; }

/* ── Nav Items ── */
.nav-item {
    display: flex; align-items: center; gap: var(--space-3);
    padding: 10px var(--space-5); margin: 1px var(--space-2);
    border-radius: var(--radius-md); cursor: pointer;
    transition: all var(--transition-base); color: rgba(255,255,255,0.42);
    text-decoration: none; font-size: 0.8125rem; font-weight: 500;
    position: relative; overflow: hidden;
}
.nav-item::before {
    content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
    width: 3px; height: 55%; background: var(--accent);
    border-radius: 0 2px 2px 0; transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.nav-item:hover {
    background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); transform: translateX(4px);
}
.nav-item.active {
    background: rgba(245,158,11,0.1); color: white; transform: translateX(0);
}
.nav-item.active::before {
    transform: translateY(-50%) scaleY(1); box-shadow: 0 0 12px rgba(245,158,11,0.5);
}
.nav-icon {
    width: 22px; height: 22px; text-align: center; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm); transition: all var(--transition-base);
}
.nav-item.active .nav-icon {
    background: rgba(245,158,11,0.15); color: var(--accent);
}
.nav-icon svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.8; }

/* ── Nav Badge ── */
.nav-badge {
    margin-left: auto; padding: 2px 7px;
    background: #ef4444; color: white;
    font-size: 0.625rem; font-weight: 700;
    border-radius: var(--radius-full);
    min-width: 18px; text-align: center;
    line-height: 1.4;
}

/* ── Sidebar Footer ── */
.sidebar-footer {
    margin-top: auto; padding: var(--space-3) var(--space-4);
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column; gap: var(--space-2);
}
.sidebar.collapsed .sidebar-footer {
    padding: var(--space-3) var(--space-2);
    align-items: center;
}
.sidebar-version {
    font-size: 0.625rem; color: rgba(255,255,255,0.25);
    text-align: center; font-weight: 500; letter-spacing: 0.05em;
}
.sidebar.collapsed .sidebar-version { display: none; }
.sidebar-logout {
    display: flex; align-items: center; gap: var(--space-3);
    padding: 10px 14px; border-radius: var(--radius-md);
    cursor: pointer; transition: all var(--transition-fast);
    color: rgba(255,255,255,0.6); font-size: 0.8125rem; font-weight: 500;
}
.sidebar-logout:hover {
    background: rgba(239,68,68,0.1); color: #fca5a5;
}
.sidebar.collapsed .sidebar-logout {
    justify-content: center; padding: 10px;
}
.sidebar.collapsed .sidebar-logout span { display: none; }

/* ── Tooltips (collapsed state) ── */
.sidebar.collapsed [data-tooltip] { position: relative; }
.sidebar.collapsed [data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute; left: calc(100% + 12px); top: 50%;
    transform: translateY(-50%);
    background: var(--gray-800); color: white;
    padding: 6px 12px; border-radius: var(--radius-md);
    font-size: 0.75rem; font-weight: 500;
    white-space: nowrap; pointer-events: none;
    opacity: 0; transition: opacity var(--transition-fast);
    z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.sidebar.collapsed [data-tooltip]:hover::after { opacity: 1; }

/* ── Focus states for accessibility ── */
.nav-item:focus-visible,
.nav-section:focus-visible,
.sidebar-quick-btn:focus-visible,
.sidebar-logout:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

/* ── Sidebar Backdrop (mobile) ── */
.sidebar-backdrop {
    display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5);
    z-index: 250; backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);
}
.sidebar-backdrop.show { display: block; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .app-layout {
        grid-template-columns: 1fr;
        grid-template-areas: "header" "main";
    }
    .sidebar {
        position: fixed; left: calc(-1 * var(--sidebar-width)); top: 0; bottom: 0;
        width: var(--sidebar-width); transition: left var(--transition-slow); z-index: 300;
    }
    .sidebar.open { left: 0; }
    .nav-item { padding: 14px var(--space-5); font-size: 0.875rem; min-height: 48px; }
}
```

## JavaScript

```javascript
// ── Sidebar State ──
let sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';

// ── Toggle Sidebar (mobile) ──
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('show', sidebar.classList.contains('open'));
}

// ── Close Sidebar (mobile) ──
function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
}

// ── Toggle Collapse ──
function toggleCollapse() {
    const sidebar = document.getElementById('sidebar');
    const layout = document.querySelector('.app-layout');
    sidebar.classList.toggle('collapsed');
    layout.classList.toggle('sidebar-collapsed');

    // Update collapse button icon
    const icon = document.querySelector('#sidebarCollapseBtn svg polyline');
    if (sidebar.classList.contains('collapsed')) {
        icon.setAttribute('points', '9 18 15 12 9 6');
    } else {
        icon.setAttribute('points', '15 18 9 12 15 6');
    }

    localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
}

// ── Toggle Section ──
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

// ── Nav Item Helper ──
function navI(page, label, icon) {
    return `<div class="nav-item" data-page="${page}" 
                 onclick="loadModule('${page}')" 
                 onkeydown="if(event.key==='Enter')loadModule('${page}')" 
                 role="button" tabindex="0" aria-label="${label}" 
                 data-tooltip="${label}">
        <span class="nav-icon" aria-hidden="true">${icon}</span>
        <span>${label}</span>
    </div>`;
}

// ── SVG Icons ──
const SVG = {
    list: '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};

// ── Render Sidebar ──
function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const user = getUser(); // Implementar según tu Auth
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

    // Quick actions (optional)
    html += `
        <div class="sidebar-quick-actions">
            <button class="sidebar-quick-btn" onclick="showCreateModal()" data-tooltip="Nuevo" aria-label="Nuevo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Nuevo</span>
            </button>
        </div>
    `;

    // Divider
    html += '<div class="sidebar-divider"></div>';

    // Navigation sections
    html += `<div class="nav-section" onclick="toggleSection('main')" role="button" tabindex="0" aria-expanded="true" aria-controls="section-main"><span>PRINCIPAL</span><span class="toggle-icon" aria-hidden="true">▼</span></div>`;
    html += `<div class="nav-section-group" id="section-main" role="group">`;
    html += navI('dashboard', 'Dashboard', SVG.chart);
    html += navI('items', 'Items', SVG.list);
    html += `</div>`;

    html += '<div class="sidebar-divider"></div>';

    html += `<div class="nav-section" onclick="toggleSection('config')" role="button" tabindex="0" aria-expanded="true" aria-controls="section-config"><span>CONFIGURACION</span><span class="toggle-icon" aria-hidden="true">▼</span></div>`;
    html += `<div class="nav-section-group" id="section-config" role="group">`;
    html += navI('users', 'Usuarios', SVG.users);
    html += navI('settings', 'Ajustes', SVG.settings);
    html += `</div>`;

    nav.innerHTML = html;

    // Footer with logout and version
    const logoutHtml = `
        <div class="sidebar-footer">
            <div class="sidebar-version">v1.0.0</div>
            <div onclick="logout()" class="sidebar-logout" role="button" tabindex="0" aria-label="Cerrar sesion" data-tooltip="Cerrar sesion">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Cerrar sesion</span>
            </div>
        </div>`;
    nav.insertAdjacentHTML('beforeend', logoutHtml);

    // Restore collapsed state
    if (sidebarCollapsed) {
        document.getElementById('sidebar').classList.add('collapsed');
        document.querySelector('.app-layout').classList.add('sidebar-collapsed');
        const icon = document.querySelector('#sidebarCollapseBtn svg polyline');
        if (icon) icon.setAttribute('points', '9 18 15 12 9 6');
    }
}

// ── Set Badge ──
function setSidebarBadge(page, count) {
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (!navItem) return;
    let badge = navItem.querySelector('.nav-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'nav-badge';
            navItem.appendChild(badge);
        }
        badge.textContent = count;
    } else if (badge) {
        badge.remove();
    }
}

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
});
```

## Uso

1. Copiar el HTML en tu layout
2. Copiar el CSS en tu stylesheet
3. Copiar el JavaScript y adaptar las funciones `getUser()`, `loadModule()`, `showCreateModal()`, `logout()` a tu sistema
4. Personalizar las secciones e íconos en `renderSidebar()`

## Personalización

- **Color de acento**: Cambiar `--accent` en CSS
- **Íconos**: Agregar/modificar en el objeto `SVG`
- **Secciones**: Modificar `renderSidebar()` según tus necesidades
- **Quick actions**: Agregar botones en la sección `.sidebar-quick-actions`
- **Badges**: Usar `setSidebarBadge('pagina', cantidad)` para mostrar notificaciones
