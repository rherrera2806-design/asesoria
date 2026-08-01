App.registerModule('usuarios', {
    users: [],

    async render() {
        const el = document.getElementById('page-usuarios');
        el.innerHTML = `
            <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%);border-radius:16px;padding:28px 32px;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,.3)">
                <div style="position:relative;z-index:1">
                    <h2 style="margin:0;font-size:24px;font-weight:800;color:white;letter-spacing:-.5px">👤 Usuarios</h2>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7)">Gestionar contrasenas de usuarios del sistema</p>
                </div>
            </div>

            <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden">
                <div id="usuariosList" style="padding:20px">
                    <div style="text-align:center;padding:40px;color:#94a3b8">Cargando usuarios...</div>
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

        el.innerHTML = `
            <style>
                .user-card{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:10px;transition:all .2s}
                .user-card:hover{background:#f8fafc;border-color:#cbd5e1}
                .user-info{display:flex;align-items:center;gap:14px}
                .user-avatar-sm{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:white}
                .user-avatar-admin{background:linear-gradient(135deg,#3b82f6,#2563eb)}
                .user-avatar-visita{background:linear-gradient(135deg,#22c55e,#16a34a)}
                .user-name{font-weight:600;color:#0f172a;font-size:14px}
                .user-email{font-size:12px;color:#64748b;margin-top:2px}
                .user-role-badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}
                .pwd-input{padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;width:180px;outline:none;transition:border-color .15s}
                .pwd-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}
                .btn-save{padding:8px 16px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
                .btn-save:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,.3)}
                .btn-save:disabled{opacity:.5;cursor:not-allowed;transform:none}
                .save-ok{color:#22c55e;font-size:12px;font-weight:600;margin-left:8px}
            </style>

            ${this.users.map(u => `
                <div class="user-card" id="user-card-${u.id}">
                    <div class="user-info">
                        <div class="user-avatar-sm ${u.rol === 'admin' ? 'user-avatar-admin' : 'user-avatar-visita'}">
                            ${(u.nombre || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="user-name">${escapeHtml(u.nombre || u.email)}</div>
                            <div class="user-email">${escapeHtml(u.email)}</div>
                        </div>
                        <span class="user-role-badge" style="background:${u.rol === 'admin' ? 'rgba(59,130,246,.15);color:#3b82f6' : 'rgba(34,197,94,.15);color:#16a34a'}">${u.rol}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <input type="password" class="pwd-input" id="pwd-${u.id}" placeholder="Nueva contrasena" autocomplete="new-password">
                        <button class="btn-save" onclick="App.modules.usuarios.cambiarPassword(${u.id})">Guardar</button>
                        <span class="save-ok" id="ok-${u.id}" style="display:none">✓ Guardado</span>
                    </div>
                </div>
            `).join('')}
        `;
    },

    async cambiarPassword(userId) {
        const input = document.getElementById(`pwd-${userId}`);
        const okMsg = document.getElementById(`ok-${userId}`);
        const newPwd = input.value.trim();

        if (!newPwd) {
            App.showAlert('Ingrese una contrasena', 'danger');
            return;
        }

        if (newPwd.length < 4) {
            App.showAlert('Minimo 4 caracteres', 'danger');
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
