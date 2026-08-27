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
                .progress-container{height:20px;background:#e2e8f0;border-radius:10px;overflow:hidden;position:relative;min-width:200px}
                .progress-bar{height:100%;border-radius:10px;transition:width .6s ease}
                .progress-bar.verde{background:linear-gradient(90deg,#22c55e,#16a34a)}
                .progress-bar.amarillo{background:linear-gradient(90deg,#f59e0b,#d97706)}
                .progress-bar.rojo{background:linear-gradient(90deg,#ef4444,#dc2626)}
                .progress-text{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:#475569}
                .dias-totales{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:20px;font-size:12px;font-weight:700;color:#065f46;border:1px solid #6ee7b7}
                .dias-totales svg{width:14px;height:14px;stroke:#065f46;fill:none;stroke-width:2}
                .estado-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;background:white}
                .estado-item:hover{background:#f8fafc}
                .estado-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:#dbeafe;color:#1e40af}
                .estado-cierre{background:#d1fae5;color:#065f46}
                .icon-btn{padding:6px!important;min-width:30px!important;min-height:30px!important;display:inline-flex!important;align-items:center;justify-content:center}
                .icon-btn svg{flex-shrink:0}
                .warning-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:6px;vertical-align:middle;animation:shake 0.5s ease-in-out infinite}
                @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}
            </style>

            <div class="m-page">
                <div class="m-hero">
                    <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(59,130,246,.2) 0%,transparent 70%);border-radius:50%"></div>
                    <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Asesoria</h2>
                            <p>Seguimiento de solicitudes</p>
                        </div>
                        <div class="m-hero-btns">
                            <button onclick="App.modules.asesoria.exportarExcel()" class="btn btn-outline" style="color:white;border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.15)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Excel</button>
                            <button onclick="App.modules.asesoria.exportarPDF()" class="btn btn-outline" style="color:white;border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.15)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> PDF</button>
                            ${Auth.isAdmin() ? `<button onclick="App.modules.asesoria.showEstadosModal()" class="btn btn-outline" style="color:white;border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.15)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Estados</button>` : ''}
                            ${Auth.isAdmin() ? `<button onclick="App.modules.asesoria.showCrearModal()" class="btn btn-primary"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nueva Solicitud</button>` : ''}
                        </div>
                    </div>
                </div>

                <div id="asResumen" class="m-stats"></div>

                <div class="m-card" style="margin-bottom:20px">
                    <div class="m-card-body">
                        <div class="m-filters" style="align-items:end">
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
                </div>

                <div class="m-card">
                    <div class="m-table-wrap" style="max-height:60vh;overflow:auto">
                        <table>
                            <thead><tr>
                                <th>Codigo</th><th>Remitente</th><th>Detalle</th><th>Llegada</th><th>Plazo</th>
                                <th>Progreso (dias habiles)</th><th>Estado</th><th>Acciones</th>
                            </tr></thead>
                            <tbody id="asTabla">
                                <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">Cargando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="m-cards-mobile" id="asCardsMobile"></div>
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

            if (!res.ok) throw new Error('Error al cargar asesorias');
            if (!statsRes.ok) throw new Error('Error al cargar estadisticas');
            if (!estRes.ok) throw new Error('Error al cargar estados');

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
            if (this.filtros.estado === 'abiertas') {
                this.datos = this.datos.filter(d => !d.es_cerrado);
            } else if (this.filtros.estado) {
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
            document.getElementById('asTabla').innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#dc2626">Error al cargar datos: ${e.message}</td></tr>`;
        }
    },

    poblarFiltros() {
        const sel = document.getElementById('asEstado');
        if (!sel) return;
        const val = sel.value;
        sel.innerHTML = '<option value="">Todos</option>' +
            '<option value="abiertas" ' + (val === 'abiertas' ? 'selected' : '') + '>Abiertas (sin cerradas)</option>' +
            this.estados.map(e => `<option value="${e.nombre}" ${e.nombre === val ? 'selected' : ''}>${e.nombre}</option>`).join('');
    },

    renderResumen() {
        const el = document.getElementById('asResumen');
        if (!el || !this.stats) return;
        const s = this.stats;
        const cerrados = s.cerrados_por_estado || {};
        const estadoKeys = Object.keys(cerrados);
        const statClasses = ['stat-info', 'stat-green', 'stat-purple', 'stat-amber', 'stat-red'];

        let cardsHtml = `
            <div class="m-stat-card stat-info"><div class="m-stat-value">${s.total || 0}</div><div class="m-stat-label">Total</div></div>
            <div class="m-stat-card stat-blue"><div class="m-stat-value">${s.abiertas || 0}</div><div class="m-stat-label">Abiertas</div></div>
        `;

        estadoKeys.forEach((nombre, i) => {
            const cls = statClasses[i % statClasses.length];
            const label = nombre.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            cardsHtml += `<div class="m-stat-card ${cls}"><div class="m-stat-value">${cerrados[nombre] || 0}</div><div class="m-stat-label">${label}</div></div>`;
        });

        cardsHtml += `<div class="m-stat-card stat-red"><div class="m-stat-value">${s.vencidas || 0}</div><div class="m-stat-label">Vencidas</div></div>`;

        el.innerHTML = cardsHtml;
    },

    renderTabla() {
        const tbody = document.getElementById('asTabla');
        const cardsMobile = document.getElementById('asCardsMobile');
        if (!this.datos.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">Sin resultados</td></tr>';
            if (cardsMobile) cardsMobile.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">Sin resultados</div>';
            return;
        }

        let tableHtml = '';
        let cardsHtml = '';

        this.datos.forEach(d => {
            const esCerrado = d.es_cerrado === true;
            const diasTranscurridos = d.dias_transcurridos || 0;
            const proximoVencer = !esCerrado && diasTranscurridos >= 8;

            let progresoHtml;
            if (esCerrado) {
                const dias = d.dias_habiles_total || d.dias_transcurridos || 0;
                progresoHtml = `
                    <div class="dias-totales">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        ${dias} dia${dias !== 1 ? 's' : ''} habile${dias !== 1 ? 's' : ''} (cerrado)
                    </div>`;
            } else {
                const total = d.dias_transcurridos + d.dias_restantes;
                const pct = total > 0 ? Math.min((d.dias_transcurridos / total) * 100, 100) : 0;
                const color = d.progreso_estado === 'verde' ? 'verde' : d.progreso_estado === 'amarillo' ? 'amarillo' : 'rojo';
                progresoHtml = `
                    <div class="progress-container">
                        <div class="progress-bar ${color}" style="width:${pct}%"></div>
                        <div class="progress-text">${d.dias_transcurridos} / ${total} dias</div>
                    </div>`;
            }

            const badgeClass = esCerrado ? 'badge-success' : 'badge-info';
            const estadoLabel = d.estado_actual;

            const accionesHtml = `
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button onclick="App.modules.asesoria.verHistorial(${d.id})" class="btn btn-sm btn-outline icon-btn" title="Ver historial"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                    ${Auth.isAdmin() ? `<button onclick="App.modules.asesoria.showEditarModal(${d.id})" class="btn btn-sm btn-outline icon-btn" title="Editar" style="color:#d97706;border-color:#f59e0b"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` : ''}
                    ${Auth.isAdmin() ? `<button onclick="App.modules.asesoria.eliminar(${d.id}, '${escapeHtml(d.codigo_identificacion)}')" class="btn btn-sm btn-outline icon-btn" title="Eliminar" style="color:#dc2626;border-color:#fca5a5"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>` : ''}
                    ${!esCerrado && Auth.isAdmin() ? `<button onclick="App.modules.asesoria.showCambiarEstadoModal(${d.id}, '${d.estado_actual}')" class="btn btn-sm btn-primary icon-btn" title="Cambiar estado"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51l.06.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>` : ''}
                </div>`;

            tableHtml += `<tr style="${esCerrado ? 'opacity:.6' : ''}">
                <td style="font-weight:600;color:#3b82f6">${escapeHtml(d.codigo_identificacion)}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(d.remitente)}">${escapeHtml(d.remitente)}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(d.detalle_solicitud)}">${escapeHtml(d.detalle_solicitud)}</td>
                <td>${this.fmtDate(d.fecha_llegada)}</td>
                <td>${this.fmtDate(d.plazo_final)}</td>
                <td>${progresoHtml}</td>
                <td>
                    <span class="badge ${badgeClass}">${estadoLabel}</span>
                    ${proximoVencer ? `<span class="warning-badge" title="Proximo a vencer"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>` : ''}
                </td>
                <td>${accionesHtml}</td>
            </tr>`;

            cardsHtml += `<div class="m-mobile-card" style="${esCerrado ? 'opacity:.6' : ''}">
                <div class="m-mobile-card-header">
                    <div>
                        <div class="m-mobile-card-title">${escapeHtml(d.codigo_identificacion)}</div>
                        <div class="m-mobile-card-subtitle">${escapeHtml(d.remitente)}</div>
                    </div>
                    <span class="badge ${badgeClass}">${estadoLabel}</span>
                </div>
                <div class="m-mobile-card-detail">${escapeHtml(d.detalle_solicitud)}</div>
                <div style="margin-bottom:8px">${progresoHtml}</div>
                <div class="m-mobile-card-footer">
                    <div class="m-mobile-card-meta">
                        Llegada: ${this.fmtDate(d.fecha_llegada)} | Plazo: ${this.fmtDate(d.plazo_final)}
                        ${proximoVencer ? ' <span style="color:#f59e0b;font-weight:600">Proximo a vencer</span>' : ''}
                    </div>
                    ${accionesHtml}
                </div>
            </div>`;
        });

        tbody.innerHTML = tableHtml;
        if (cardsMobile) cardsMobile.innerHTML = cardsHtml;
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
                        <div class="estado-item" id="estado-item-${e.id}" data-id="${e.id}" data-orden="${e.orden}">
                            <div style="display:flex;align-items:center;gap:10px">
                                <span style="color:#94a3b8;cursor:grab;font-size:16px" title="Arrastrar para reordenar">☰</span>
                                <span style="font-weight:600;font-size:13px">${i + 1}.</span>
                                <span class="estado-badge ${e.cierra_proceso ? 'estado-cierre' : ''}" id="estado-nombre-${e.id}">${e.nombre}</span>
                                ${e.cierra_proceso ? '<span style="font-size:10px;color:#065f46;background:#d1fae5;padding:2px 6px;border-radius:10px">CIERRA</span>' : ''}
                            </div>
                            <div style="display:flex;gap:4px">
                                <button onclick="App.modules.asesoria.showEditarEstadoInline(${e.id}, '${escapeHtml(e.nombre)}', ${e.cierra_proceso})" style="background:none;border:none;color:#d97706;cursor:pointer;font-size:14px" title="Editar nombre">✏️</button>
                                <button onclick="App.modules.asesoria.eliminarEstado(${e.id}, '${escapeHtml(e.nombre)}')" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px" title="Eliminar">✕</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        App.showModal(html, { title: 'Gestionar Estados' });
    },

    showEditarEstadoInline(id, nombreActual, cierraActual) {
        const item = document.getElementById(`estado-item-${id}`);
        if (!item) return;
        item.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;flex:1">
                <span style="color:#94a3b8;font-size:16px">☰</span>
                <input type="text" id="editEstadoNombre-${id}" class="form-control" value="${escapeHtml(nombreActual)}" style="flex:1;font-size:13px;padding:6px 10px">
                <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;white-space:nowrap">
                    <input type="checkbox" id="editEstadoCierra-${id}" ${cierraActual ? 'checked' : ''}> Cierra
                </label>
            </div>
            <div style="display:flex;gap:4px">
                <button onclick="App.modules.asesoria.guardarEstadoEditado(${id})" style="background:#22c55e;color:white;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;font-weight:600">Guardar</button>
                <button onclick="App.modules.asesoria.showEstadosModal()" style="background:#e2e8f0;color:#475569;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px">Cancelar</button>
            </div>
        `;
        document.getElementById(`editEstadoNombre-${id}`).focus();
    },

    async guardarEstadoEditado(id) {
        const nombre = document.getElementById(`editEstadoNombre-${id}`).value.trim();
        const cierra = document.getElementById(`editEstadoCierra-${id}`).checked;
        if (!nombre) { App.showAlert('Ingresa un nombre', 'danger'); return; }

        try {
            const res = await apiFetch(`/api/estados/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, cierra_proceso: cierra })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            App.showAlert('Estado actualizado');
            this.estados = await (await apiFetch('/api/estados')).json();
            this.showEstadosModal();
            this.poblarFiltros();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
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
        let d;
        if (dateStr.includes('T')) {
            d = new Date(dateStr);
        } else {
            d = new Date(dateStr + 'T12:00:00');
        }
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    getDiasHabiles(d) {
        const esCerrado = d.estado_actual === 'respondido y cerrado' || d.estado_actual === 'enviado y cerrado';
        if (esCerrado) return d.dias_habiles_total || d.dias_transcurridos || 0;
        return d.dias_transcurridos || 0;
    },

    exportarExcel() {
        if (!this.datos.length) {
            App.showAlert('No hay datos para exportar', 'warning');
            return;
        }

        const rows = this.datos.map(d => ({
            'Codigo': d.codigo_identificacion,
            'Remitente': d.remitente,
            'Detalle': d.detalle_solicitud,
            'Fecha Llegada': this.fmtDate(d.fecha_llegada),
            'Plazo Final': this.fmtDate(d.plazo_final),
            'Dias Habiles': this.getDiasHabiles(d),
            'Estado': d.estado_actual
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 15 }, { wch: 25 }, { wch: 40 },
            { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 25 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asesorias');
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `asesorias_${fecha}.xlsx`);
        App.showAlert('Excel exportado correctamente');
    },

    exportarPDF() {
        if (!this.datos.length) {
            App.showAlert('No hay datos para exportar', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        const fecha = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Informe de Asesorias', 14, 15);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Fecha: ${fecha}`, 14, 22);

        const s = this.stats || {};
        doc.setFontSize(9);
        doc.text(`Total: ${s.total || 0}  |  Abiertas: ${s.abiertas || 0}  |  Respondido y Cerrado: ${s.respondido_cerrado || 0}  |  Enviado y Cerrado: ${s.enviado_cerrado || 0}  |  Vencidas: ${s.vencidas || 0}`, 14, 29);

        const rows = this.datos.map(d => [
            d.codigo_identificacion,
            d.remitente,
            d.detalle_solicitud.length > 40 ? d.detalle_solicitud.substring(0, 40) + '...' : d.detalle_solicitud,
            this.fmtDate(d.fecha_llegada),
            this.fmtDate(d.plazo_final),
            String(this.getDiasHabiles(d)),
            d.estado_actual
        ]);

        doc.autoTable({
            startY: 34,
            head: [['Codigo', 'Remitente', 'Detalle', 'Llegada', 'Plazo', 'Dias Habiles', 'Estado']],
            body: rows,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 35 },
                2: { cellWidth: 60 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 18, halign: 'center' },
                6: { cellWidth: 35 }
            },
            margin: { left: 14 }
        });

        doc.save(`asesorias_${new Date().toISOString().split('T')[0]}.pdf`);
        App.showAlert('PDF exportado correctamente');
    }
});
