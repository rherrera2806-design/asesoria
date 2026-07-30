App.registerModule('asesoria', {
    datos: [],
    stats: null,
    estados: [],
    filtros: { busqueda: '', estado: '', plazo: 'todos' },

    async render() {
        const el = document.getElementById('page-asesoria');
        el.innerHTML = `
            <style>
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                .as-card{transition:all .3s cubic-bezier(.4,0,.2,1)}
                .as-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.06)!important;transform:translateY(-1px)}
                .as-table{width:100%;font-size:12px;border-collapse:collapse}
                .as-table th{padding:10px 12px;background:#f8fafc;color:#64748b;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0;position:sticky;top:0;z-index:1}
                .as-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9}
                .as-table tbody tr{transition:background .15s}
                .as-table tbody tr:hover{background:#f8fafc!important}
                .progress-container{height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;position:relative;min-width:200px}
                .progress-bar{height:100%;border-radius:10px;transition:width .6s ease}
                .progress-bar.verde{background:linear-gradient(90deg,#22c55e,#16a34a)}
                .progress-bar.amarillo{background:linear-gradient(90deg,#f59e0b,#d97706)}
                .progress-bar.rojo{background:linear-gradient(90deg,#ef4444,#dc2626)}
                .progress-text{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:#475569}
                .estado-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;background:white}
                .estado-item:hover{background:#f8fafc}
                .estado-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:#dbeafe;color:#1e40af}
                .estado-cierre{background:#d1fae5;color:#065f46}
            </style>

            <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%);border-radius:16px;padding:28px 32px;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,.3)">
                <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(59,130,246,.2) 0%,transparent 70%);border-radius:50%"></div>
                <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <h2 style="margin:0;font-size:24px;font-weight:800;color:white;letter-spacing:-.5px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Asesoria</h2>
                        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7)">Seguimiento de solicitudes - Plazo 8 dias habiles</p>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button onclick="App.modules.asesoria.showEstadosModal()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(255,255,255,.15);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.25);border-radius:10px;color:white;font-size:13px;font-weight:600;cursor:pointer"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Estados</button>
                        <button onclick="App.modules.asesoria.showCrearModal()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(59,130,246,.3)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nueva Solicitud</button>
                    </div>
                </div>
            </div>

            <div id="asResumen" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px"></div>

            <div style="background:white;border-radius:14px;padding:20px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-bottom:20px">
                <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end">
                    <div style="flex:2;min-width:200px">
                        <label class="form-label">Buscar</label>
                        <input type="text" id="asBusqueda" placeholder="Codigo, remitente, detalle..." oninput="App.modules.asesoria.aplicarFiltros()" class="form-control">
                    </div>
                    <div style="flex:1;min-width:140px">
                        <label class="form-label">Estado</label>
                        <select id="asEstado" onchange="App.modules.asesoria.aplicarFiltros()" class="form-control">
                            <option value="">Todos</option>
                        </select>
                    </div>
                    <div style="flex:1;min-width:140px">
                        <label class="form-label">Plazo</label>
                        <select id="asPlazo" onchange="App.modules.asesoria.aplicarFiltros()" class="form-control">
                            <option value="todos">Todos</option>
                            <option value="vencido">Vencidos</option>
                            <option value="por_vencer">Por vencer</option>
                            <option value="en_plazo">En plazo</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden">
                <div style="overflow-x:auto">
                    <table class="as-table">
                        <thead><tr>
                            <th>Codigo</th><th>Remitente</th><th>Detalle</th><th>Llegada</th><th>Plazo</th>
                            <th>Progreso (dias habiles)</th><th>Estado</th><th>Acciones</th>
                        </tr></thead>
                        <tbody id="asTabla">
                            <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">Cargando...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        await this.cargarDatos();
    },

    async cargarDatos() {
        try {
            const [res, statsRes, estRes] = await Promise.all([
                apiFetch('/api/asesorias'),
                apiFetch('/api/asesorias/stats'),
                apiFetch('/api/estados')
            ]);

            this.datos = await res.json();
            this.stats = await statsRes.json();
            this.estados = await estRes.json();

            if (this.filtros.busqueda) {
                const f = this.filtros.busqueda.toLowerCase();
                this.datos = this.datos.filter(d =>
                    d.codigo_identificacion.toLowerCase().includes(f) ||
                    d.remitente.toLowerCase().includes(f) ||
                    d.detalle_solicitud.toLowerCase().includes(f)
                );
            }
            if (this.filtros.estado) {
                this.datos = this.datos.filter(d => d.estado_actual === this.filtros.estado);
            }
            if (this.filtros.plazo !== 'todos') {
                this.datos = this.datos.filter(d => d.progreso_estado === this.filtros.plazo);
            }

            this.poblarFiltros();
            this.renderResumen();
            this.renderTabla();
        } catch (e) {
            console.error('Error:', e);
            document.getElementById('asTabla').innerHTML = `<tr><td colspan="8" class="alert alert-danger">Error: ${e.message}</td></tr>`;
        }
    },

    poblarFiltros() {
        const sel = document.getElementById('asEstado');
        if (!sel) return;
        const val = sel.value;
        sel.innerHTML = '<option value="">Todos</option>' +
            this.estados.map(e => `<option value="${e.nombre}" ${e.nombre === val ? 'selected' : ''}>${e.nombre}</option>`).join('');
    },

    renderResumen() {
        const el = document.getElementById('asResumen');
        if (!el || !this.stats) return;
        const s = this.stats;
        el.innerHTML = `
            <div class="as-card stat-card"><div class="stat-value" style="color:#0f172a">${s.total || 0}</div><div class="stat-label">Total</div></div>
            <div class="as-card stat-card"><div class="stat-value" style="color:#3b82f6">${s.abiertas || 0}</div><div class="stat-label">Abiertas</div></div>
            <div class="as-card stat-card"><div class="stat-value" style="color:#22c55e">${s.respondido_cerrado || 0}</div><div class="stat-label">Respondido y Cerrado</div></div>
            <div class="as-card stat-card"><div class="stat-value" style="color:#8b5cf6">${s.enviado_cerrado || 0}</div><div class="stat-label">Enviado y Cerrado</div></div>
            <div class="as-card stat-card"><div class="stat-value" style="color:#dc2626">${s.vencidas || 0}</div><div class="stat-label">Vencidas</div></div>
        `;
    },

    renderTabla() {
        const tbody = document.getElementById('asTabla');
        if (!this.datos.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">Sin resultados</td></tr>';
            return;
        }
        tbody.innerHTML = this.datos.map(d => {
            const total = d.dias_transcurridos + d.dias_restantes;
            const pct = total > 0 ? Math.min((d.dias_transcurridos / total) * 100, 100) : 0;
            const color = d.progreso_estado === 'verde' ? 'verde' : d.progreso_estado === 'amarillo' ? 'amarillo' : 'rojo';
            const esCerrado = d.estado_actual === 'respondido y cerrado' || d.estado_actual === 'enviado y cerrado';

            return `<tr style="${esCerrado ? 'opacity:.6' : ''}">
                <td style="font-weight:600;color:#3b82f6">${escapeHtml(d.codigo_identificacion)}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(d.remitente)}">${escapeHtml(d.remitente)}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(d.detalle_solicitud)}">${escapeHtml(d.detalle_solicitud)}</td>
                <td>${this.fmtDate(d.fecha_llegada)}</td>
                <td>${this.fmtDate(d.plazo_final)}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar ${color}" style="width:${pct}%"></div>
                        <div class="progress-text">${d.dias_transcurridos} / ${total} dias</div>
                    </div>
                </td>
                <td><span class="badge ${esCerrado ? 'badge-success' : 'badge-info'}">${d.estado_actual}</span></td>
                <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                        <button onclick="App.modules.asesoria.verHistorial(${d.id})" class="btn btn-sm btn-outline" title="Ver historial">Ver</button>
                        <button onclick="App.modules.asesoria.showEditarModal(${d.id})" class="btn btn-sm btn-outline" title="Editar" style="color:#d97706;border-color:#f59e0b">Editar</button>
                        <button onclick="App.modules.asesoria.eliminar(${d.id}, '${escapeHtml(d.codigo_identificacion)}')" class="btn btn-sm btn-outline" title="Eliminar" style="color:#dc2626;border-color:#fca5a5">Eliminar</button>
                        ${!esCerrado ? `<button onclick="App.modules.asesoria.showCambiarEstadoModal(${d.id}, '${d.estado_actual}')" class="btn btn-sm btn-primary" title="Cambiar estado">Estado</button>` : ''}
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    async verHistorial(id) {
        try {
            const [histRes, estRes] = await Promise.all([
                apiFetch(`/api/asesorias/${id}/historial`),
                apiFetch('/api/estados')
            ]);
            const historial = await histRes.json();
            const estados = await estRes.json();
            const asesoria = this.datos.find(d => d.id === id);

            let html = `
                <div style="margin-bottom:16px;padding:16px;background:#f8fafc;border-radius:10px">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
                        <div><strong>Codigo:</strong> ${escapeHtml(asesoria?.codigo_identificacion)}</div>
                        <div><strong>Remitente:</strong> ${escapeHtml(asesoria?.remitente)}</div>
                        <div style="grid-column:span 2"><strong>Detalle:</strong> ${escapeHtml(asesoria?.detalle_solicitud)}</div>
                        <div><strong>Llegada:</strong> ${this.fmtDate(asesoria?.fecha_llegada)}</div>
                        <div><strong>Plazo:</strong> ${this.fmtDate(asesoria?.plazo_final)}</div>
                    </div>
                </div>
                <h4 style="margin:0 0 12px;color:#0f172a">Historial de Cambios</h4>
            `;

            if (historial.length === 0) {
                html += '<p style="color:#94a3b8;font-size:13px">Sin historial</p>';
            } else {
                html += '<div style="position:relative;padding-left:20px">';
                historial.forEach((h, i) => {
                    const esCierre = estados.find(e => e.nombre === h.estado)?.cierra_proceso;
                    const color = esCierre ? '#22c55e' : '#3b82f6';
                    html += `
                        <div style="position:relative;padding:12px 0 12px 20px;border-left:2px solid ${i === 0 ? color : '#e2e8f0'}">
                            <div style="position:absolute;left:-7px;top:16px;width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white"></div>
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <span style="font-weight:600;font-size:13px;text-transform:uppercase;color:${color}">${h.estado}</span>
                                <span style="font-size:11px;color:#94a3b8">${new Date(h.fecha_hora).toLocaleString('es-CL')}</span>
                            </div>
                            <div style="font-size:12px;color:#64748b;margin-top:4px">${escapeHtml(h.observacion || '')}</div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:2px">por ${escapeHtml(h.usuario_email)}</div>
                        </div>`;
                });
                html += '</div>';
            }

            App.showModal(html, { title: 'Historial de Asesoria' });
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    showCrearModal() {
        const html = `
            <div class="form-group">
                <label class="form-label">Codigo de Identificacion *</label>
                <input type="text" id="asCrearCodigo" class="form-control" placeholder="Ej: AS-2026-001">
            </div>
            <div class="form-group">
                <label class="form-label">Remitente *</label>
                <input type="text" id="asCrearRemitente" class="form-control" placeholder="Nombre del remitente">
            </div>
            <div class="form-group">
                <label class="form-label">Detalle de Solicitud *</label>
                <textarea id="asCrearDetalle" class="form-control" placeholder="Descripcion de la solicitud"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Observacion</label>
                <textarea id="asCrearObservacion" class="form-control" placeholder="Observaciones iniciales"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Fecha de Llegada</label>
                <input type="date" id="asCrearFecha" class="form-control" value="${new Date().toISOString().split('T')[0]}">
            </div>
        `;
        App.showModal(html, { title: 'Nueva Solicitud' });
        const footer = document.querySelector('#modalOverlay .modal-footer');
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="App.hideModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="App.modules.asesoria.crear()">Crear Solicitud</button>
        `;
    },

    async crear() {
        const codigo = document.getElementById('asCrearCodigo').value.trim();
        const remitente = document.getElementById('asCrearRemitente').value.trim();
        const detalle = document.getElementById('asCrearDetalle').value.trim();
        const observacion = document.getElementById('asCrearObservacion').value.trim();
        const fecha = document.getElementById('asCrearFecha').value;

        if (!codigo || !remitente || !detalle) {
            App.showAlert('Codigo, remitente y detalle son requeridos', 'danger');
            return;
        }

        try {
            const res = await apiFetch('/api/asesorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-email': 'admin@asesoria.cl' },
                body: JSON.stringify({ codigo_identificacion: codigo, remitente, detalle_solicitud: detalle, observacion, fecha_llegada: fecha })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            App.hideModal();
            App.showAlert('Solicitud creada correctamente');
            await this.cargarDatos();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    showEditarModal(id) {
        const d = this.datos.find(x => x.id === id);
        if (!d) return;
        const html = `
            <div class="form-group">
                <label class="form-label">Codigo de Identificacion *</label>
                <input type="text" id="asEditCodigo" class="form-control" value="${escapeHtml(d.codigo_identificacion)}">
            </div>
            <div class="form-group">
                <label class="form-label">Remitente *</label>
                <input type="text" id="asEditRemitente" class="form-control" value="${escapeHtml(d.remitente)}">
            </div>
            <div class="form-group">
                <label class="form-label">Detalle de Solicitud *</label>
                <textarea id="asEditDetalle" class="form-control">${escapeHtml(d.detalle_solicitud)}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Fecha de Llegada</label>
                <input type="date" id="asEditFecha" class="form-control" value="${d.fecha_llegada ? d.fecha_llegada.split('T')[0] : ''}">
            </div>
        `;
        App.showModal(html, { title: 'Editar Solicitud' });
        const footer = document.querySelector('#modalOverlay .modal-footer');
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="App.hideModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="App.modules.asesoria.editar(${id})">Guardar Cambios</button>
        `;
    },

    async editar(id) {
        const codigo = document.getElementById('asEditCodigo').value.trim();
        const remitente = document.getElementById('asEditRemitente').value.trim();
        const detalle = document.getElementById('asEditDetalle').value.trim();
        const fecha = document.getElementById('asEditFecha').value;

        if (!codigo || !remitente || !detalle) {
            App.showAlert('Codigo, remitente y detalle son requeridos', 'danger');
            return;
        }

        try {
            const res = await apiFetch(`/api/asesorias/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-email': 'admin@asesoria.cl' },
                body: JSON.stringify({ codigo_identificacion: codigo, remitente, detalle_solicitud: detalle, fecha_llegada: fecha })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            App.hideModal();
            App.showAlert('Solicitud actualizada');
            await this.cargarDatos();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    async eliminar(id, codigo) {
        if (!await App.confirm(`Eliminar la asesoria "${codigo}"? Esta accion no se puede deshacer.`)) return;
        try {
            const res = await apiFetch(`/api/asesorias/${id}`, { method: 'DELETE' });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            App.showAlert('Solicitud eliminada');
            await this.cargarDatos();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    showCambiarEstadoModal(id, estadoActual) {
        const disponibles = this.estados.filter(e => e.nombre !== estadoActual);
        if (disponibles.length === 0) {
            App.showAlert('No hay mas estados disponibles', 'warning');
            return;
        }
        const html = `
            <div class="form-group">
                <label class="form-label">Nuevo Estado</label>
                <select id="asNuevoEstado" class="form-control">
                    ${disponibles.map(e => `<option value="${e.nombre}">${e.nombre}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Observacion</label>
                <textarea id="asEstadoObservacion" class="form-control" placeholder="Motivo del cambio de estado"></textarea>
            </div>
        `;
        App.showModal(html, { title: 'Cambiar Estado' });
        const footer = document.querySelector('#modalOverlay .modal-footer');
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="App.hideModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="App.modules.asesoria.cambiarEstado(${id})">Guardar</button>
        `;
    },

    async cambiarEstado(id) {
        const estado = document.getElementById('asNuevoEstado').value;
        const observacion = document.getElementById('asEstadoObservacion').value.trim();

        try {
            const res = await apiFetch(`/api/asesorias/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-user-email': 'admin@asesoria.cl' },
                body: JSON.stringify({ estado, observacion })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            App.hideModal();
            App.showAlert('Estado actualizado');
            await this.cargarDatos();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    showEstadosModal() {
        let html = `
            <div style="margin-bottom:16px">
                <div style="display:flex;gap:8px;margin-bottom:16px">
                    <input type="text" id="nuevoEstadoNombre" class="form-control" placeholder="Nombre del nuevo estado" style="flex:1">
                    <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b;white-space:nowrap">
                        <input type="checkbox" id="nuevoEstadoCierra"> Cierra proceso
                    </label>
                    <button onclick="App.modules.asesoria.agregarEstado()" class="btn btn-primary btn-sm">Agregar</button>
                </div>
                <div id="estadosLista">
                    ${this.estados.map((e, i) => `
                        <div class="estado-item" draggable="true" data-id="${e.id}" data-orden="${e.orden}">
                            <div style="display:flex;align-items:center;gap:10px">
                                <span style="color:#94a3b8;cursor:grab;font-size:16px" title="Arrastrar para reordenar">☰</span>
                                <span style="font-weight:600;font-size:13px">${i + 1}.</span>
                                <span class="estado-badge ${e.cierra_proceso ? 'estado-cierre' : ''}">${e.nombre}</span>
                                ${e.cierra_proceso ? '<span style="font-size:10px;color:#065f46;background:#d1fae5;padding:2px 6px;border-radius:10px">CIERRA</span>' : ''}
                            </div>
                            <button onclick="App.modules.asesoria.eliminarEstado(${e.id}, '${escapeHtml(e.nombre)}')" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px" title="Eliminar">✕</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        App.showModal(html, { title: 'Gestionar Estados' });
    },

    async agregarEstado() {
        const nombre = document.getElementById('nuevoEstadoNombre').value.trim();
        const cierra = document.getElementById('nuevoEstadoCierra').checked;
        if (!nombre) { App.showAlert('Ingresa un nombre', 'danger'); return; }

        try {
            const res = await apiFetch('/api/estados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, cierra_proceso: cierra })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            App.showAlert('Estado agregado');
            this.estados = await (await apiFetch('/api/estados')).json();
            this.showEstadosModal();
            this.poblarFiltros();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    async eliminarEstado(id, nombre) {
        if (!await App.confirm(`Eliminar estado "${nombre}"?`)) return;
        try {
            await apiFetch(`/api/estados/${id}`, { method: 'DELETE' });
            App.showAlert('Estado eliminado');
            this.estados = await (await apiFetch('/api/estados')).json();
            this.showEstadosModal();
            this.poblarFiltros();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    aplicarFiltros() {
        this.filtros.busqueda = document.getElementById('asBusqueda')?.value || '';
        this.filtros.estado = document.getElementById('asEstado')?.value || '';
        this.filtros.plazo = document.getElementById('asPlazo')?.value || 'todos';
        this.cargarDatos();
    },

    fmtDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
});
