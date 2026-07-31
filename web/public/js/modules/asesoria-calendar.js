App.registerModule('asesoria-calendar', {
    datos: [],
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    fechaSeleccionada: null,

    toDateStr(s) {
        if (!s) return '';
        return s.includes('T') ? s.split('T')[0] : s.split(' ')[0];
    },

    async render() {
        const el = document.getElementById('page-asesoria-calendar');
        el.innerHTML = `
            <style>
                .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
                .cal-dia{padding:10px;border:1px solid #e2e8f0;border-radius:10px;background:white;min-height:90px;cursor:pointer;transition:all .2s}
                .cal-dia:hover{box-shadow:0 4px 12px rgba(0,0,0,.06);transform:translateY(-1px)}
                .cal-dia.hoy{border:2px solid #3b82f6;background:#eff6ff}
                .cal-dia.vencido{background:#fef2f2;border-color:#fca5a5}
                .cal-dia.vencido.hoy{background:#fee2e2;border-color:#dc2626}
                .cal-dia-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
                .cal-dia-num{font-weight:700;font-size:14px;color:#0f172a}
                .cal-dia-count{font-size:10px;color:white;background:#dc2626;padding:2px 7px;border-radius:10px;font-weight:700}
                .cal-dia-count.soon{background:#f59e0b}
                .cal-dia-count.ok{background:#3b82f6}
                .cal-item{font-size:10px;padding:4px 6px;border-radius:4px;margin:2px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
                .cal-item.rojo{background:#fee2e2;color:#991b1b;border-left:3px solid #dc2626}
                .cal-item.amarillo{background:#fef3c7;color:#92400e;border-left:3px solid #f59e0b}
                .cal-item.verde{background:#d1fae5;color:#065f46;border-left:3px solid #22c55e}
                .cal-item.enviado{background:#dbeafe;color:#1e40af;border-left:3px solid #3b82f6}
                .cal-legend{display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap}
                .cal-legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b}
                .cal-legend-dot{width:12px;height:12px;border-radius:3px}
            </style>

            <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%);border-radius:16px;padding:28px 32px;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,.3)">
                <div style="position:relative;z-index:1">
                    <h2 style="margin:0;font-size:24px;font-weight:800;color:white"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Calendario de Vencimientos</h2>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7)">Dias de plazo final por solicitud</p>
                </div>
            </div>

            <div class="cal-legend">
                <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#fee2e2;border-left:3px solid #dc2626"></div> Vencido</div>
                <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#fef3c7;border-left:3px solid #f59e0b"></div> Por vencer</div>
                <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#d1fae5;border-left:3px solid #22c55e"></div> En plazo</div>
                <div class="cal-legend-item"><div class="cal-legend-dot" style="background:#dbeafe;border-left:3px solid #3b82f6"></div> Enviado</div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                <button onclick="App.modules['asesoria-calendar'].mesAnterior()" class="btn btn-outline">← Anterior</button>
                <h3 id="calHeader" style="margin:0;color:#0f172a;font-size:18px"></h3>
                <button onclick="App.modules['asesoria-calendar'].mesSiguiente()" class="btn btn-outline">Siguiente →</button>
            </div>

            <div style="display:flex;gap:6px;margin-bottom:8px;color:#64748b;font-size:11px;font-weight:600">
                <div style="flex:1;text-align:center">Dom</div>
                <div style="flex:1;text-align:center">Lun</div>
                <div style="flex:1;text-align:center">Mar</div>
                <div style="flex:1;text-align:center">Mie</div>
                <div style="flex:1;text-align:center">Jue</div>
                <div style="flex:1;text-align:center">Vie</div>
                <div style="flex:1;text-align:center">Sab</div>
            </div>

            <div id="calGrid" class="cal-grid"></div>

            <div id="calDetalle" style="display:none;margin-top:20px;background:white;border-radius:14px;padding:20px;border:1px solid #e2e8f0">
                <h3 id="calDetalleTitle" style="margin:0 0 16px;color:#0f172a"></h3>
                <div id="calDetalleList"></div>
            </div>
        `;

        await this.cargarDatos();
        this.renderCalendario();
    },

    async cargarDatos() {
        try {
            const inicioMes = new Date(this.year, this.month, 1).toISOString().split('T')[0];
            const finMes = new Date(this.year, this.month + 1, 0).toISOString().split('T')[0];

            const res = await apiFetch(`/api/asesorias`);
            const todas = await res.json();

            this.datos = todas.filter(d => {
                if (!d.plazo_final) return false;
                const pf = this.toDateStr(d.plazo_final);
                return pf >= inicioMes && pf <= finMes;
            });
        } catch (e) {
            console.error('Error calendar:', e);
        }
    },

    renderCalendario() {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        document.getElementById('calHeader').textContent = `${meses[this.month]} ${this.year}`;

        const grid = document.getElementById('calGrid');
        const primerDia = new Date(this.year, this.month, 1).getDay();
        const diasEnMes = new Date(this.year, this.month + 1, 0).getDate();
        const hoy = new Date();
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        let html = '';

        for (let i = 0; i < primerDia; i++) {
            html += '<div class="cal-dia" style="opacity:0;pointer-events:none"></div>';
        }

        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fecha = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const esHoy = fecha === hoyStr;
            const esVencido = fecha < hoyStr;
            const itemsDelDia = this.datos.filter(d => this.toDateStr(d.plazo_final) === fecha);

            const vencidos = itemsDelDia.filter(d => d.estado_actual !== 'enviado');
            const countClass = vencidos.length > 0 ? (esVencido ? '' : 'soon') : 'ok';

            let itemsHtml = '';
            itemsDelDia.slice(0, 3).forEach(d => {
                const esEnviado = d.estado_actual === 'enviado';
                let cls;
                if (esEnviado) {
                    cls = 'enviado';
                } else if (d.progreso_estado === 'rojo') {
                    cls = 'rojo';
                } else if (d.progreso_estado === 'amarillo') {
                    cls = 'amarillo';
                } else {
                    cls = 'verde';
                }
                itemsHtml += `<div class="cal-item ${cls}" title="${escapeHtml(d.codigo_identificacion)} - ${escapeHtml(d.remitente)} | ${escapeHtml(d.detalle_solicitud)}">${escapeHtml(d.codigo_identificacion)}</div>`;
            });
            if (itemsDelDia.length > 3) {
                itemsHtml += `<div style="font-size:9px;color:#94a3b8;text-align:center">+${itemsDelDia.length - 3} mas</div>`;
            }

            html += `
                <div class="cal-dia ${esHoy ? 'hoy' : ''} ${esVencido && vencidos.length > 0 ? 'vencido' : ''}" onclick="App.modules['asesoria-calendar'].verDia('${fecha}')">
                    <div class="cal-dia-header">
                        <span class="cal-dia-num">${dia}</span>
                        ${itemsDelDia.length > 0 ? `<span class="cal-dia-count ${countClass}">${itemsDelDia.length}</span>` : ''}
                    </div>
                    ${itemsHtml}
                </div>`;
        }

        grid.innerHTML = html;
    },

    async verDia(fecha) {
        this.fechaSeleccionada = fecha;
        const itemsDelDia = this.datos.filter(d => this.toDateStr(d.plazo_final) === fecha);
        const detalle = document.getElementById('calDetalle');
        const title = document.getElementById('calDetalleTitle');
        const list = document.getElementById('calDetalleList');

        const fechaFmt = new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const esVencido = fecha < new Date().toISOString().split('T')[0];
        title.textContent = `Vencimientos del ${fechaFmt} ${esVencido ? '(VENCIDO)' : ''}`;

        if (itemsDelDia.length === 0) {
            list.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:20px">Sin vencimientos para este dia</p>';
        } else {
            list.innerHTML = itemsDelDia.map(d => {
                const total = d.dias_transcurridos + d.dias_restantes;
                const pct = total > 0 ? Math.min((d.dias_transcurridos / total) * 100, 100) : 0;
                const color = d.progreso_estado === 'verde' ? 'verde' : d.progreso_estado === 'amarillo' ? 'amarillo' : 'rojo';
                const estadoClass = { 'en proceso': 'badge-info', 'en preparacion': 'badge-warning', 'enviado': 'badge-success' }[d.estado_actual] || 'badge-neutral';

                return `
                    <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;display:flex;align-items:center;gap:16px">
                        <div style="flex:1">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                <span style="font-weight:700;color:#3b82f6;font-size:14px">${escapeHtml(d.codigo_identificacion)}</span>
                                <span class="badge ${estadoClass}">${d.estado_actual}</span>
                            </div>
                            <div style="font-size:12px;color:#0f172a;font-weight:500">${escapeHtml(d.detalle_solicitud)}</div>
                            <div style="font-size:11px;color:#64748b;margin-top:2px">${escapeHtml(d.remitente)} | Llegada: ${this.fmtDate(d.fecha_llegada)}</div>
                        </div>
                        <div style="flex:1">
                            <div class="progress-container">
                                <div class="progress-bar ${color}" style="width:${pct}%"></div>
                                <div class="progress-text">${d.dias_transcurridos} / ${total} dias</div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }

        detalle.style.display = 'block';
        detalle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    async mesAnterior() {
        this.month--;
        if (this.month < 0) { this.month = 11; this.year--; }
        await this.cargarDatos();
        this.renderCalendario();
    },

    async mesSiguiente() {
        this.month++;
        if (this.month > 11) { this.month = 0; this.year++; }
        await this.cargarDatos();
        this.renderCalendario();
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
    }
});
