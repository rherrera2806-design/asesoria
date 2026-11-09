App.registerModule('usuarios', {
    users: [],

    async render() {
        const el = document.getElementById('page-usuarios');
        el.innerHTML = `
            <style>
                .user-card{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;transition:all .2s;flex-wrap:wrap;gap:8px}
                .user-card:hover{background:#f8fafc;border-color:#cbd5e1}
                .user-info{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
                .user-avatar-sm{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:white;flex-shrink:0}
                .user-avatar-admin{background:linear-gradient(135deg,#3b82f6,#2563eb)}
                .user-avatar-visita{background:linear-gradient(135deg,#22c55e,#16a34a)}
                .user-name{font-weight:600;color:#0f172a;font-size:13px}
                .user-email{font-size:11px;color:#64748b;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .user-role-badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;flex-shrink:0}
                .pwd-input{padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;width:140px;outline:none;transition:border-color .15s}
                .pwd-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
                .btn-save{padding:6px 14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s}
                .btn-save:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}
                .btn-save:disabled{opacity:.5;cursor:not-allowed;transform:none}
                .save-ok{color:#22c55e;font-size:11px;font-weight:600;margin-left:6px}
                @media(max-width:768px){
                    .user-card{flex-direction:column;align-items:stretch}
                    .user-info{margin-bottom:4px}
                    .pwd-input{width:100%}
                    .user-actions{display:flex;gap:6px;align-items:center}
                    .user-actions .btn-save{flex-shrink:0}
                }
            </style>

            <div class="m-page">
                <div class="m-hero">
                    <div style="position:relative;z-index:1">
                        <h2>Usuarios</h2>
                        <p>Gestionar contrasenas del sistema</p>
                    </div>
                </div>

                <div class="m-card">
                    <div class="m-card-body" id="usuariosList">
                        <div style="text-align:center;padding:40px;color:#94a3b8">Cargando usuarios...</div>
                    </div>
                </div>
            </div>
        `;

        await this.cargarUsuarios();
    },

    async cargarUsuarios() {
        try {
            const res = await apiFetch('/api/auth/users');
            this.users = await res.json();
            this.renderList();
        } catch (e) {
            console.error('Error:', e);
            document.getElementById('usuariosList').innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
        }
    },

    renderList() {
        const el = document.getElementById('usuariosList');
        if (!this.users.length) {
            el.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">No hay usuarios</div>';
            return;
        }

        el.innerHTML = this.users.map(u => `
            <div class="user-card" id="user-card-${u.id}">
                <div class="user-info">
                    <div class="user-avatar-sm ${u.rol === 'admin' ? 'user-avatar-admin' : 'user-avatar-visita'}">
                        ${(u.nombre || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div style="min-width:0">
                        <div class="user-name">${escapeHtml(u.nombre || u.email)}</div>
                        <div class="user-email">${escapeHtml(u.email)}</div>
                    </div>
                    <span class="user-role-badge" style="background:${u.rol === 'admin' ? 'rgba(59,130,246,.15);color:#3b82f6' : 'rgba(34,197,94,.15);color:#16a34a'}">${escapeHtml(u.rol)}</span>
                </div>
                <div class="user-actions" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <button class="btn btn-sm btn-outline" onclick="App.modules.usuarios.showPermisos(${u.id})" title="Permisos de modulos y acciones">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Permisos
                    </button>
                    <input type="password" class="pwd-input" id="pwd-${u.id}" placeholder="Nueva contrasena" autocomplete="new-password">
                    <button class="btn-save" onclick="App.modules.usuarios.cambiarPassword(${u.id})">Guardar</button>
                    <span class="save-ok" id="ok-${u.id}" style="display:none">✓</span>
                </div>
            </div>
        `).join('');
    },

    // ── Permisos granulares (matriz modulo x accion) ──
    async showPermisos(userId) {
        const u = this.users.find(x => x.id === userId);
        if (!u) return;

        if (u.rol === 'admin') {
            App.showModal(`
                <div style="text-align:center;padding:10px">
                    <div style="font-size:34px;margin-bottom:8px">🔑</div>
                    <div style="font-weight:700;color:var(--text);font-size:14px">${escapeHtml(u.nombre || u.email)}</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;line-height:1.6">
                        El administrador tiene <strong>todos los permisos</strong> de forma automatica:<br>
                        ver, editar y eliminar en todos los modulos.
                    </div>
                </div>
            `, { title: 'Permisos' });
            return;
        }

        App.showModal('<div id="permMatrix" style="text-align:center;padding:24px;color:#94a3b8">Cargando permisos...</div>', { title: `Permisos — ${u.nombre || u.email}` });
        await this.cargarPermisos(userId);
    },

    async cargarPermisos(userId) {
        const cont = document.getElementById('permMatrix');
        if (!cont) return;
        try {
            const res = await apiFetch(`/api/permisos/usuario/${userId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // data: { modulo: [acciones] } o null (admin)
            this._permBackup = JSON.parse(JSON.stringify(data || {}));
            this._permActual = JSON.parse(JSON.stringify(data || {}));

            const resMod = await apiFetch('/api/permisos');
            const matriz = await resMod.json();
            if (!resMod.ok) throw new Error(matriz.error);
            this._modulos = matriz.modulos;
            this._acciones = matriz.acciones;

            this.pintarMatrix(userId);
        } catch (e) {
            cont.innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
        }
    },

    pintarMatrix(userId) {
        const cont = document.getElementById('permMatrix');
        if (!cont) return;
        this._permUserId = userId;
        const perm = this._permActual;

        const acciones = this._acciones;

        let html = `
            <style>
                .pm-table{width:100%;border-collapse:collapse;font-size:12.5px}
                .pm-table th,.pm-table td{padding:9px 8px;border-bottom:1px solid var(--border-light);text-align:center}
                .pm-table th:first-child,.pm-table td:first-child{text-align:left}
                .pm-table thead th{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);font-weight:700}
                .pm-check{width:19px;height:19px;accent-color:var(--info);cursor:pointer}
                .pm-mod b{display:block;color:var(--text);font-size:12.5px}
                .pm-mod small{color:var(--text-muted);font-size:10.5px}
                .pm-quick{display:flex;gap:6px;justify-content:center;margin-bottom:12px;flex-wrap:wrap}
            </style>
            <div class="pm-quick">
                <button class="btn btn-sm btn-outline" onclick="App.modules.usuarios.permTodo(${userId},true)">Marcar todo</button>
                <button class="btn btn-sm btn-outline" onclick="App.modules.usuarios.permTodo(${userId},false)">Limpiar todo</button>
            </div>
            <table class="pm-table">
                <thead><tr>
                    <th>Modulo</th>
                    ${acciones.map(a => `<th>${a === 'ver' ? '👁 Ver' : a === 'editar' ? '✎ Editar' : '🗑 Eliminar'}</th>`).join('')}
                </tr></thead>
                <tbody>
        `;

        for (const m of this._modulos) {
            const accionesMod = perm[m.clave] || [];
            html += `
                <tr>
                    <td class="pm-mod"><b>${m.nombre}</b><small>${m.clave}</small></td>
                    ${acciones.map(a => `
                        <td><input type="checkbox" class="pm-check" ${accionesMod.includes(a) ? 'checked' : ''}
                            onchange="App.modules.usuarios.permToggle('${m.clave}','${a}',this.checked)"></td>
                    `).join('')}
                </tr>`;
        }

        html += `
                </tbody>
            </table>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:12px;line-height:1.5">
                <strong>Ver</strong>: accede al modulo y consulta la informacion ·
                <strong>Editar</strong>: crea y modifica registros (incluye Ver) ·
                <strong>Eliminar</strong>: borra o cancela registros.
            </div>
        `;

        cont.innerHTML = html;

        const footer = document.querySelector('#modalOverlay .modal-footer');
        if (footer) {
            footer.innerHTML = `
                <button class="btn btn-outline" onclick="App.modules.usuarios.cancelarPermisos()">Cancelar</button>
                <button class="btn btn-primary" id="permSaveBtn" onclick="App.modules.usuarios.guardarPermisos(${userId})">Guardar permisos</button>
            `;
        }
    },

    permToggle(modulo, accion, checked) {
        const perm = this._permActual;
        if (!perm[modulo]) perm[modulo] = [];
        if (checked) {
            if (!perm[modulo].includes(accion)) perm[modulo].push(accion);
            // Dependencias: editar/eliminar implican ver
            if (accion !== 'ver' && !perm[modulo].includes('ver')) perm[modulo].push('ver');
        } else if (accion === 'ver') {
            // Sin "ver" no tiene sentido editar/eliminar
            perm[modulo] = [];
        } else {
            perm[modulo] = perm[modulo].filter(a => a !== accion);
        }
        this.pintarMatrix(this._permUserId);
    },

    permTodo(userId, todo) {
        const perm = {};
        for (const m of this._modulos) {
            perm[m.clave] = todo ? [...this._acciones] : [];
        }
        this._permActual = perm;
        this._permUserId = userId;
        this.pintarMatrix(userId);
    },

    cancelarPermisos() {
        this._permActual = JSON.parse(JSON.stringify(this._permBackup || {}));
        App.hideModal();
    },

    async guardarPermisos(userId) {
        const btn = document.getElementById('permSaveBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
        try {
            const res = await apiFetch(`/api/permisos/usuario/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ permisos: this._permActual })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            this._permBackup = JSON.parse(JSON.stringify(this._permActual));
            App.hideModal();
            App.showAlert(`Permisos actualizados (${data.total} asignados)`);
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
            if (btn) { btn.disabled = false; btn.textContent = 'Guardar permisos'; }
        }
    },

    async cambiarPassword(userId) {
        const input = document.getElementById(`pwd-${userId}`);
        const okMsg = document.getElementById(`ok-${userId}`);
        const newPwd = input.value.trim();

        if (!newPwd) {
            App.showAlert('Ingrese una contrasena', 'danger');
            return;
        }

        if (newPwd.length < 8) {
            App.showAlert('Minimo 8 caracteres', 'danger');
            return;
        }

        const btn = input.nextElementSibling;
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            const res = await apiFetch('/api/auth/password', {
                method: 'PUT',
                body: JSON.stringify({ user_id: userId, new_password: newPwd })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            input.value = '';
            okMsg.style.display = 'inline';
            App.showAlert(`Contrasena actualizada para ${data.user.email}`, 'success');
            setTimeout(() => okMsg.style.display = 'none', 3000);
        } catch (e) {
            App.showAlert(e.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Guardar';
        }
    }
});
