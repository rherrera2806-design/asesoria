App.registerModule('informes', {
    datos: [],
    mesSeleccionado: null,

    async render() {
        const el = document.getElementById('page-informes');
        el.innerHTML = `
            <style>
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                .inf-bar-group{display:flex;gap:4px;align-items:end;height:120px;padding:0 8px}
                .inf-bar{border-radius:4px 4px 0 0;transition:height .4s ease;min-width:28px;cursor:pointer;position:relative}
                .inf-bar:hover{opacity:.85}
                .inf-bar-label{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:9px;color:#64748b;white-space:nowrap}
                .inf-bar-valor{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;white-space:nowrap}
                .inf-legend{display:flex;gap:16px;justify-content:center;margin-top:24px}
                .inf-legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b}
                .inf-legend-color{width:12px;height:12px;border-radius:3px}
                .inf-mes-btn{padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:12px;font-weight:600;color:#334155;transition:all .15s}
                .inf-mes-btn:hover{background:#f8fafc;border-color:#cbd5e1}
                .inf-mes-btn.active{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border-color:#3b82f6;box-shadow:0 2px 8px rgba(59,130,246,.3)}
                @media(max-width:768px){
                    .inf-mes-btns{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
                    .inf-mes-btn{flex-shrink:0;font-size:11px;padding:6px 10px}
                    .inf-chart-bar{height:80px!important}
                    .inf-legend{gap:10px}
                    .inf-legend-item{font-size:10px}
                }
            </style>

            <div class="m-page">
                <div class="m-hero">
                    <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <h2><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Informes</h2>
                            <p>Completados por mes</p>
                        </div>
                    </div>
                </div>

                <div id="infResumen" class="m-stats" style="grid-template-columns:repeat(3,1fr)"></div>

                <div class="m-card" style="margin-bottom:16px">
                    <div class="m-card-header">
                        <h3>Progresion mensual</h3>
                        <div id="infLegend" class="inf-legend" style="margin:0"></div>
                    </div>
                    <div class="m-card-body" id="infChart" style="padding-bottom:24px"></div>
                </div>

                <div id="infMesesBtns" class="inf-mes-btns" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>

                <div class="m-card">
                    <div class="m-table-wrap" style="max-height:50vh;overflow:auto">
                        <table>
                            <thead>
                                <tr>
                                    <th>Codigo</th><th>Remitente</th><th>Detalle</th><th>Llegada</th><th>Plazo</th><th>Cierre</th><th>Dias</th><th>Estado</th>
                                </tr>
                            </thead>
                            <tbody id="infTablaBody">
                                <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">Cargando informes...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="m-cards-mobile" id="infCardsMobile"></div>
                </div>
            </div>
        `;

        await this.cargarDatos();
    },

    async cargarDatos() {
        try {
            const res = await apiFetch('/api/asesorias/informes');
            this.datos = await res.json();
            this.renderResumen();
            this.renderChart();
            this.renderMesesBtns();
            this.renderTabla();
        } catch (e) {
            console.error('Error cargando informes:', e);
        }
    },

    renderResumen() {
        const el = document.getElementById('infResumen');
        if (!el || !this.datos.length) return;

        let totalEnFecha = 0, totalFuera = 0, totalGeneral = 0;
        this.datos.forEach(m => {
            totalEnFecha += m.en_fecha;
            totalFuera += m.fuera_de_fecha;
            totalGeneral += m.total;
        });

        const pctEnFecha = totalGeneral > 0 ? Math.round((totalEnFecha / totalGeneral) * 100) : 0;

        el.innerHTML = `
            <div class="m-stat-card stat-green"><div class="m-stat-value">${totalEnFecha}</div><div class="m-stat-label">En fecha</div><div style="font-size:9px;color:#059669;font-weight:600;margin-top:2px">${pctEnFecha}%</div></div>
            <div class="m-stat-card stat-red"><div class="m-stat-value">${totalFuera}</div><div class="m-stat-label">Fuera de fecha</div><div style="font-size:9px;color:#dc2626;font-weight:600;margin-top:2px">${100 - pctEnFecha}%</div></div>
            <div class="m-stat-card stat-info"><div class="m-stat-value">${totalGeneral}</div><div class="m-stat-label">Total cerrados</div></div>
        `;
    },

    renderChart() {
        const el = document.getElementById('infChart');
        const legendEl = document.getElementById('infLegend');
        if (!el || !this.datos.length) return;

        const meses = [...this.datos].reverse();
        const maxVal = Math.max(...meses.map(m => m.total), 1);

        let barsHtml = '<div class="inf-bar-group" style="justify-content:space-between">';
        meses.forEach(m => {
            const hEnFecha = (m.en_fecha / maxVal) * 100;
            const hFuera = (m.fuera_de_fecha / maxVal) * 100;
            const mesCorto = m.mes_label.split(' ').slice(0, 1).join('').substring(0, 3);
            barsHtml += `
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0">
                    <div style="display:flex;gap:3px;align-items:end;height:120px;width:100%;justify-content:center">
                        <div class="inf-bar" style="height:${Math.max(hEnFecha, 4)}%;background:linear-gradient(180deg,#22c55e,#16a34a);width:18px" title="En fecha: ${m.en_fecha}">
                            <div class="inf-bar-valor" style="color:#16a34a">${m.en_fecha}</div>
                        </div>
                        <div class="inf-bar" style="height:${Math.max(hFuera, 4)}%;background:linear-gradient(180deg,#ef4444,#dc2626);width:18px" title="Fuera de fecha: ${m.fuera_de_fecha}">
                            <div class="inf-bar-valor" style="color:#dc2626">${m.fuera_de_fecha || ''}</div>
                        </div>
                    </div>
                    <div style="font-size:10px;color:#64748b;margin-top:6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px">${mesCorto}</div>
                </div>
            `;
        });
        barsHtml += '</div>';
        el.innerHTML = barsHtml;

        legendEl.innerHTML = `
            <div class="inf-legend-item"><div class="inf-legend-color" style="background:#22c55e"></div>En fecha</div>
            <div class="inf-legend-item"><div class="inf-legend-color" style="background:#ef4444"></div>Fuera de fecha</div>
        `;
    },

    renderMesesBtns() {
        const el = document.getElementById('infMesesBtns');
        if (!el || !this.datos.length) return;

        let html = `<button class="inf-mes-btn ${!this.mesSeleccionado ? 'active' : ''}" onclick="App.modules.informes.seleccionarMes(null)">Todos</button>`;
        this.datos.forEach(m => {
            html += `<button class="inf-mes-btn ${this.mesSeleccionado === m.mes ? 'active' : ''}" onclick="App.modules.informes.seleccionarMes('${m.mes}')">${m.mes_label}</button>`;
        });
        el.innerHTML = html;
    },

    seleccionarMes(mes) {
        this.mesSeleccionado = mes;
        this.renderMesesBtns();
        this.renderTabla();
    },

    renderTabla() {
        const el = document.getElementById('infTablaBody');
        const cardsMobile = document.getElementById('infCardsMobile');
        if (!el) return;

        let detalles = [];
        if (this.mesSeleccionado) {
            const mes = this.datos.find(m => m.mes === this.mesSeleccionado);
            if (mes) detalles = mes.detalles;
        } else {
            this.datos.forEach(m => detalles.push(...m.detalles));
        }

        if (!detalles.length) {
            el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">No hay datos para mostrar</td></tr>';
            if (cardsMobile) cardsMobile.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">No hay datos para mostrar</div>';
            return;
        }

        let tableHtml = '';
        let cardsHtml = '';

        detalles.forEach(d => {
            const estadoBadge = d.en_fecha
                ? '<span class="badge badge-success" style="font-size:10px">En fecha</span>'
                : '<span class="badge badge-danger" style="font-size:10px">Fuera de fecha</span>';

            const diasBadge = `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700;${d.en_fecha
                ? 'background:#d1fae5;color:#065f46'
                : 'background:#fee2e2;color:#991b1b'
            }">
                ${d.en_fecha
                    ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
                    : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
                }
                ${d.dias_habiles}d
            </span>`;

            tableHtml += `<tr style="animation:fadeUp .3s ease">
                <td style="font-weight:600;color:#3b82f6">${d.codigo}</td>
                <td style="font-weight:500">${d.remitente}</td>
                <td style="color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.detalle}</td>
                <td>${d.fecha_llegada}</td>
                <td>${d.plazo_final}</td>
                <td>${d.fecha_cierre}</td>
                <td style="text-align:center">${diasBadge}</td>
                <td>${estadoBadge}</td>
            </tr>`;

            cardsHtml += `<div class="m-mobile-card" style="animation:fadeUp .3s ease">
                <div class="m-mobile-card-header">
                    <div>
                        <div class="m-mobile-card-title">${d.codigo}</div>
                        <div class="m-mobile-card-subtitle">${d.remitente}</div>
                    </div>
                    ${estadoBadge}
                </div>
                <div class="m-mobile-card-detail">${d.detalle}</div>
                <div class="m-mobile-card-footer">
                    <div class="m-mobile-card-meta">Llegada: ${d.fecha_llegada} | Plazo: ${d.plazo_final} | Cierre: ${d.fecha_cierre}</div>
                    ${diasBadge}
                </div>
            </div>`;
        });

        el.innerHTML = tableHtml;
        if (cardsMobile) cardsMobile.innerHTML = cardsHtml;
    }
});
