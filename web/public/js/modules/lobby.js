App.registerModule('lobby', {
    vista: 'dia',          // 'dia' | 'semana'
    fecha: null,           // 'YYYY-MM-DD' del dia seleccionado
    datos: [],             // reservas del rango cargado
    acceso: { puede_agendar: false, es_admin: false },

    // ── Utilidades de fecha ──
    hoyStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    strToDate(s) { return new Date(`${s}T12:00:00`); },
    dateToStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    addDays(s, n) {
        const d = this.strToDate(s);
        d.setDate(d.getDate() + n);
        return this.dateToStr(d);
    },
    lunesDe(s) {
        const d = this.strToDate(s);
        const dow = d.getDay(); // 0=dom
        const diff = dow === 0 ? -6 : 1 - dow;
        d.setDate(d.getDate() + diff);
        return this.dateToStr(d);
    },
    min(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    },
    hhmm(mins) {
        return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    },
    esFinDeSemana(fecha) {
        const dow = this.strToDate(fecha).getDay();
        return dow === 0 || dow === 6;
    },
    fmtFechaLarga(fecha) {
        return this.strToDate(fecha).toLocaleDateString('es-CL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    },
    fmtFechaCorta(fecha) {
        return this.strToDate(fecha).toLocaleDateString('es-CL', {
            weekday: 'short', day: '2-digit', month: '2-digit'
        });
    },

    // ── Render principal ──
    async render() {
        if (!this.fecha) this.fecha = this.hoyStr();

        const el = document.getElementById('page-lobby');
        el.innerHTML = `
            <style>
                .lb-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap}
                .lb-nav{display:flex;align-items:center;gap:8px}
                .lb-nav h3{margin:0;color:#0f172a;font-size:15px;min-width:210px;text-align:center}
                .lb-toggle{display:flex;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
                .lb-toggle button{padding:8px 16px;border:none;background:none;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
                .lb-toggle button.on{background:#3b82f6;color:white}
                .lb-grid{display:grid;grid-template-columns:70px 1fr;grid-auto-rows:46px;position:relative;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:white}
                .lb-hora{grid-column:1;font-size:11px;font-weight:600;color:#94a3b8;display:flex;align-items:flex-start;justify-content:flex-end;padding:4px 8px 0 0;border-right:1px solid #e2e8f0;border-bottom:1px dashed #f1f5f9;user-select:none}
                .lb-slot{grid-column:2;border-bottom:1px dashed #f1f5f9;cursor:pointer;transition:background .12s}
                .lb-slot:hover{background:#eff6ff}
                .lb-slot:hover::after{content:'＋ Reservar';position:absolute;left:50%;transform:translateX(-50%);font-size:11px;font-weight:600;color:#3b82f6;pointer-events:none}
                .lb-slot{position:relative}
                .lb-block{grid-column:2;margin:3px 6px;padding:7px 11px;border-radius:9px;cursor:pointer;overflow:hidden;z-index:2;
                    background:linear-gradient(135deg,#eff6ff,#dbeafe);border-left:4px solid #3b82f6;color:#1e40af;transition:transform .12s,box-shadow .12s}
                .lb-block:hover{transform:translateX(2px);box-shadow:0 4px 12px rgba(59,130,246,.2)}
                .lb-block.pasada{opacity:.55;filter:grayscale(.3)}
                .lb-block.cancelada{background:#f1f5f9;border-left-color:#94a3b8;color:#64748b;text-decoration:line-through}
                .lb-block .t{font-size:12px;font-weight:700;line-height:1.2}
                .lb-block .m{font-size:11px;font-weight:600;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .lb-block .o{font-size:10px;opacity:.75;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
                .lb-week{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
                .lb-day{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:8px;min-height:150px}
                .lb-day.finde{background:#f8fafc;opacity:.7}
                .lb-day.hoy{border:2px solid #3b82f6;background:#eff6ff}
                .lb-day-h{font-size:11px;font-weight:700;color:#0f172a;text-align:center;padding:4px 0 8px;border-bottom:1px solid #f1f5f9;margin-bottom:6px;cursor:pointer}
                .lb-chip{font-size:10px;padding:6px 7px;border-radius:6px;margin-bottom:5px;cursor:pointer;font-weight:600;
                    background:#eff6ff;color:#1e40af;border-left:3px solid #3b82f6;transition:transform .1s}
                .lb-chip:hover{transform:translateX(2px)}
                .lb-chip.pasada{opacity:.55}
                .lb-chip.cancelada{background:#f1f5f9;border-left-color:#94a3b8;color:#64748b;text-decoration:line-through}
                .lb-free{font-size:10px;color:#cbd5e1;text-align:center;padding:8px 2px;cursor:pointer;border:1px dashed #e2e8f0;border-radius:6px;transition:all .15s}
                .lb-free:hover{border-color:#3b82f6;color:#3b82f6;background:#f8fbff}
                .lb-mes{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
                .lb-mes-h{font-size:11px;font-weight:700;color:#64748b;text-align:center;padding:4px 0}
                .lb-mes-dia{padding:6px;border:1px solid #e2e8f0;border-radius:10px;background:white;min-height:96px;cursor:pointer;transition:all .2s;overflow:hidden}
                .lb-mes-dia:hover{box-shadow:0 4px 12px rgba(0,0,0,.06);transform:translateY(-1px)}
                .lb-mes-dia.outro{opacity:.35;pointer-events:none;background:#f8fafc}
                .lb-mes-dia.hoy{border:2px solid #3b82f6;background:#eff6ff}
                .lb-mes-dia.finde{background:#f8fafc}
                .lb-mes-num{font-weight:700;font-size:13px;color:#0f172a;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
                .lb-mes-count{font-size:10px;color:white;background:#3b82f6;padding:1px 7px;border-radius:10px;font-weight:700}
                .lb-mes-chip{font-size:9px;padding:3px 5px;border-radius:4px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;background:#eff6ff;color:#1e40af;border-left:2px solid #3b82f6;cursor:pointer}
                .lb-mes-chip:hover{background:#dbeafe}
                .lb-mes-chip.cancelada{background:#f1f5f9;border-left-color:#94a3b8;color:#64748b;text-decoration:line-through}
                .lb-mes-chip.pasada{opacity:.55}
                .lb-mes-more{font-size:9px;color:#94a3b8;text-align:center;margin-top:3px}
                .lb-info{display:flex;gap:8px;align-items:center;font-size:11px;color:#64748b;margin-bottom:12px;flex-wrap:wrap}
                @media(max-width:768px){
                    .lb-grid{grid-auto-rows:42px}
                    .lb-hora{font-size:10px;padding-right:5px}
                    .lb-block{margin:2px 4px;padding:5px 8px}
                    .lb-week{grid-template-columns:1fr;gap:6px}
                    .lb-day{min-height:0}
                    .lb-nav h3{min-width:0;font-size:13px}
                    .lb-toolbar{flex-direction:column;align-items:stretch}
                    .lb-nav{justify-content:center}
                    .lb-mes{gap:3px}
                    .lb-mes-dia{min-height:64px;padding:4px;border-radius:8px}
                    .lb-mes-num{font-size:11px;margin-bottom:2px}
                    .lb-mes-count{font-size:9px;padding:0 5px}
                    .lb-mes-chip{font-size:8px;padding:2px 3px}
                    .lb-mes-more{font-size:8px}
                    .lb-mes-h{font-size:10px}
                }
            </style>

            <div class="m-page">
                <div class="m-hero">
                    <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
                        <div>
                            <h2>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px"><path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/></svg>
                                Lobby
                            </h2>
                            <p>Agendamiento de la sala de reuniones</p>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap">
                            ${this.acceso.es_admin ? `<button class="btn btn-outline" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.35);color:white" onclick="App.modules.lobby.showDesignadosModal()">Designados</button>` : ''}
                            ${this.acceso.puede_agendar ? `<button class="btn btn-outline" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.35);color:white" onclick="App.modules.lobby.nuevo()">＋ Nueva reserva</button>` : ''}
                        </div>
                    </div>
                </div>

                <div class="lb-toolbar">
                    <div class="lb-nav">
                        <button class="btn btn-outline btn-sm" onclick="App.modules.lobby.mover(-1)">←</button>
                        <button class="btn btn-outline btn-sm" onclick="App.modules.lobby.hoy()">Hoy</button>
                        <h3 id="lbHeader"></h3>
                        <button class="btn btn-outline btn-sm" onclick="App.modules.lobby.mover(1)">→</button>
                    </div>
                    <div class="lb-toggle">
                        <button id="lbTabDia" class="on" onclick="App.modules.lobby.setVista('dia')">Día</button>
                        <button id="lbTabSem" onclick="App.modules.lobby.setVista('semana')">Semana</button>
                        <button id="lbTabMes" onclick="App.modules.lobby.setVista('mes')">Mes</button>
                    </div>
                </div>

                <div class="lb-info" id="lbInfo"></div>
                <div id="lbContent"></div>
            </div>
        `;

        await this.cargarAcceso();
        await this.cargarDatos();
        this.renderVista();
    },

    async cargarAcceso() {
        try {
            const res = await apiFetch('/api/lobby/acceso');
            this.acceso = await res.json();
        } catch (e) {
            console.error('Error acceso lobby:', e);
            this.acceso = { puede_agendar: false, es_admin: false };
        }
    },

    rangoActual() {
        if (this.vista === 'semana') {
            const lun = this.lunesDe(this.fecha);
            return { desde: lun, hasta: this.addDays(lun, 6) };
        }
        if (this.vista === 'mes') {
            const d = this.strToDate(this.fecha);
            const desde = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
            const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            const hasta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
            return { desde, hasta };
        }
        return { desde: this.fecha, hasta: this.fecha };
    },

    async cargarDatos() {
        try {
            const { desde, hasta } = this.rangoActual();
            const res = await apiFetch(`/api/lobby/reservas?desde=${desde}&hasta=${hasta}`);
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            this.datos = await res.json();
        } catch (e) {
            console.error('Error lobby:', e);
            this.datos = [];
            const c = document.getElementById('lbContent');
            if (c) c.innerHTML = `<div class="alert alert-danger">Error al cargar reservas: ${escapeHtml(e.message)}</div>`;
        }
    },

    renderVista() {
        const header = document.getElementById('lbHeader');
        const info = document.getElementById('lbInfo');
        if (!header) return;

        document.getElementById('lbTabDia').classList.toggle('on', this.vista === 'dia');
        document.getElementById('lbTabSem').classList.toggle('on', this.vista === 'semana');
        document.getElementById('lbTabMes').classList.toggle('on', this.vista === 'mes');

        if (this.vista === 'dia') {
            header.textContent = this.fmtFechaLarga(this.fecha);
        } else if (this.vista === 'semana') {
            const lun = this.lunesDe(this.fecha);
            header.textContent = `Semana del ${this.fmtFechaCorta(lun)} al ${this.fmtFechaCorta(this.addDays(lun, 6))}`;
        } else {
            const d = this.strToDate(this.fecha);
            header.textContent = d.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        }

        let infoHtml = '';
        if (!this.acceso.puede_agendar) {
            infoHtml = `<span class="badge badge-info">Solo consulta</span> Eres usuario designado para agendar la sala? Contacta al administrador.`;
        } else {
            const mias = this.datos.filter(d => d.estado === 'confirmada' && !d.es_pasada).length;
            infoHtml = `<span class="badge badge-success">${mias} reserva${mias === 1 ? '' : 's'} activa${mias === 1 ? '' : 's'}</span> en el periodo · Clic en un hueco libre para reservar`;
        }
        info.innerHTML = infoHtml;

        if (this.vista === 'dia') this.renderDia();
        else if (this.vista === 'semana') this.renderSemana();
        else this.renderMes();
    },

    // ── Vista día: grilla de 30 min ──
    renderDia() {
        const cont = document.getElementById('lbContent');
        const reservasDia = this.datos.filter(d => d.fecha === this.fecha);

        // Rango de la grilla: 08:00–19:00 por defecto, expandido si hay reservas fuera
        let ini = 8 * 60, fin = 19 * 60;
        reservasDia.forEach(r => {
            ini = Math.min(ini, this.min(r.hora_inicio));
            fin = Math.max(fin, this.min(r.hora_fin));
        });
        ini = Math.floor(ini / 30) * 30;
        fin = Math.ceil(fin / 30) * 30;

        const totalSlots = (fin - ini) / 30;

        // Reservas -> filas ocupadas
        const bloques = reservasDia.map(r => {
            const start = Math.max(this.min(r.hora_inicio), ini);
            const end = Math.min(this.min(r.hora_fin), fin);
            const rowStart = Math.round((start - ini) / 30) + 1;
            const span = Math.max(1, Math.round((end - start) / 30));
            return { r, rowStart, span };
        });

        const ocupadas = new Set();
        bloques.forEach(b => {
            for (let i = 0; i < b.span; i++) ocupadas.add(b.rowStart + i);
        });

        const user = Auth.getUser();
        let html = '<div class="lb-grid">';

        for (let i = 0; i < totalSlots; i++) {
            const row = i + 1;
            const t = this.hhmm(ini + i * 30);
            html += `<div class="lb-hora" style="grid-row:${row};grid-column:1">${i % 2 === 0 ? t : ''}</div>`;
            if (!ocupadas.has(row)) {
                // Hoy no se ofrecen slots ya transcurridos
                const slotPasado = this.fecha === this.hoyStr() && (ini + i * 30) <= (new Date().getHours() * 60 + new Date().getMinutes());
                const puedeReservar = this.acceso.puede_agendar && !this.esFinDeSemana(this.fecha) && !slotPasado;
                html += puedeReservar
                    ? `<div class="lb-slot" style="grid-row:${row};grid-column:2" onclick="App.modules.lobby.nuevo('${t}')" title="Reservar ${t}"></div>`
                    : `<div class="lb-slot" style="grid-row:${row};grid-column:2;cursor:default;${slotPasado ? 'background:#f8fafc' : ''}"></div>`;
            }
        }

        bloques.forEach(({ r, rowStart, span }) => {
            const cls = r.estado === 'cancelada' ? 'cancelada' : (r.es_pasada ? 'pasada' : '');
            const puedeGestionar = r.estado === 'confirmada' && !r.es_pasada &&
                (this.acceso.es_admin || (user && r.organizador_id === user.id));
            const badge = r.estado === 'cancelada' ? ' · CANCELADA' : (r.es_pasada ? ' · finalizada' : '');
            html += `
                <div class="lb-block ${cls}" style="grid-row:${rowStart} / span ${span};grid-column:2"
                     onclick="App.modules.lobby.detalle(${r.id})"
                     title="${escapeHtml(r.motivo)} (${r.hora_inicio}–${r.hora_fin})">
                    <div class="t">${r.hora_inicio}–${r.hora_fin}${badge}</div>
                    <div class="m">${escapeHtml(r.motivo)}</div>
                    ${span > 1 ? `<div class="o">${escapeHtml(r.organizador_nombre || r.organizador_email)}</div>` : ''}
                </div>`;
        });

        html += '</div>';

        if (reservasDia.length === 0) {
            html += `<div style="text-align:center;padding:18px;color:#94a3b8;font-size:12px">Sin reservas para este día</div>`;
        }

        cont.innerHTML = html;
    },

    // ── Vista semana: 7 columnas ──
    renderSemana() {
        const cont = document.getElementById('lbContent');
        const lun = this.lunesDe(this.fecha);
        const hoy = this.hoyStr();
        const user = Auth.getUser();

        let html = '<div class="lb-week">';
        for (let i = 0; i < 7; i++) {
            const fecha = this.addDays(lun, i);
            const finde = this.esFinDeSemana(fecha);
            const delDia = this.datos.filter(d => d.fecha === fecha);
            const confirmadas = delDia.filter(d => d.estado === 'confirmada').length;

            html += `
                <div class="lb-day ${finde ? 'finde' : ''} ${fecha === hoy ? 'hoy' : ''}">
                    <div class="lb-day-h" onclick="App.modules.lobby.irADia('${fecha}')" title="Ver agenda del día">
                        ${this.fmtFechaCorta(fecha)} ${confirmadas ? `<span style="color:#3b82f6">${confirmadas}</span>` : ''}
                    </div>`;

            delDia.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)).forEach(r => {
                const cls = r.estado === 'cancelada' ? 'cancelada' : (r.es_pasada ? 'pasada' : '');
                html += `
                    <div class="lb-chip ${cls}" onclick="App.modules.lobby.detalle(${r.id})"
                         title="${escapeHtml(r.motivo)} — ${escapeHtml(r.organizador_nombre || r.organizador_email)}">
                        <div>${r.hora_inicio}–${r.hora_fin}</div>
                        <div style="font-weight:500;opacity:.9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(r.motivo)}</div>
                    </div>`;
            });

            if (delDia.length === 0 && !finde && this.acceso.puede_agendar) {
                html += `<div class="lb-free" onclick="App.modules.lobby.nuevo(null,'${fecha}')">＋ Reservar</div>`;
            } else if (delDia.length === 0) {
                html += `<div style="font-size:10px;color:#cbd5e1;text-align:center;padding:6px">—</div>`;
            }

            html += '</div>';
        }
        html += '</div>';
        cont.innerHTML = html;
    },

    // ── Vista mes: calendario mensual con chips de reserva ──
    renderMes() {
        const cont = document.getElementById('lbContent');
        const d = this.strToDate(this.fecha);
        const anio = d.getFullYear();
        const mes = d.getMonth();
        const hoy = this.hoyStr();

        const primerDia = new Date(anio, mes, 1);
        const diasEnMes = new Date(anio, mes + 1, 0).getDate();
        const offset = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1; // lunes primero

        const totalCeldas = Math.ceil((offset + diasEnMes) / 7) * 7;

        let html = `
            <div class="lb-mes">
                <div class="lb-mes-h">Lun</div><div class="lb-mes-h">Mar</div><div class="lb-mes-h">Mié</div>
                <div class="lb-mes-h">Jue</div><div class="lb-mes-h">Vie</div><div class="lb-mes-h">Sáb</div><div class="lb-mes-h">Dom</div>
            </div>
            <div class="lb-mes" style="margin-top:2px">`;

        for (let i = 0; i < totalCeldas; i++) {
            const numDia = i - offset + 1;
            const esDelMes = numDia >= 1 && numDia <= diasEnMes;
            const fecha = esDelMes
                ? `${anio}-${String(mes + 1).padStart(2, '0')}-${String(numDia).padStart(2, '0')}`
                : null;

            if (!esDelMes) {
                html += '<div class="lb-mes-dia outro"></div>';
                continue;
            }

            const finde = this.esFinDeSemana(fecha);
            const delDia = this.datos.filter(x => x.fecha === fecha)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
            const activas = delDia.filter(x => x.estado === 'confirmada');

            let chips = '';
            delDia.slice(0, 3).forEach(r => {
                const cls = r.estado === 'cancelada' ? 'cancelada' : (r.es_pasada ? 'pasada' : '');
                chips += `<div class="lb-mes-chip ${cls}" onclick="event.stopPropagation();App.modules.lobby.detalle(${r.id})" title="${escapeHtml(r.motivo)} (${r.hora_inicio}–${r.hora_fin})">${r.hora_inicio} ${escapeHtml(r.motivo)}</div>`;
            });
            if (delDia.length > 3) {
                chips += `<div class="lb-mes-more">+${delDia.length - 3} más</div>`;
            }

            html += `
                <div class="lb-mes-dia ${finde ? 'finde' : ''} ${fecha === hoy ? 'hoy' : ''}" onclick="App.modules.lobby.irADia('${fecha}')">
                    <div class="lb-mes-num">
                        <span>${numDia}</span>
                        ${activas.length ? `<span class="lb-mes-count">${activas.length}</span>` : ''}
                    </div>
                    ${chips}
                </div>`;
        }

        html += '</div>';
        cont.innerHTML = html;
    },

    // ── Navegacion ──
    async setVista(v) {
        this.vista = v;
        await this.cargarDatos();
        this.renderVista();
    },
    async mover(dir) {
        if (this.vista === 'mes') {
            const d = this.strToDate(this.fecha);
            d.setMonth(d.getMonth() + dir);
            this.fecha = this.dateToStr(d);
        } else {
            this.fecha = this.addDays(this.fecha, this.vista === 'semana' ? 7 * dir : dir);
        }
        await this.cargarDatos();
        this.renderVista();
    },
    async hoy() {
        this.fecha = this.hoyStr();
        await this.cargarDatos();
        this.renderVista();
    },
    async irADia(fecha) {
        this.fecha = fecha;
        this.vista = 'dia';
        await this.cargarDatos();
        this.renderVista();
    },

    // ── Modal crear / editar ──
    opcionesHora(desdeMin = 8 * 60, hastaMin = 19 * 60) {
        let opts = '';
        for (let m = desdeMin; m <= hastaMin; m += 30) {
            opts += `<option value="${this.hhmm(m)}">${this.hhmm(m)}</option>`;
        }
        return opts;
    },

    nuevo(horaInicio = null, fecha = null) {
        if (!this.acceso.puede_agendar) {
            App.showAlert('Solo los usuarios designados pueden agendar la sala', 'warning');
            return;
        }
        const f = fecha || this.fecha;
        if (this.esFinDeSemana(f)) {
            App.showAlert('La sala solo se agenda en días hábiles (lunes a viernes)', 'warning');
            return;
        }
        const ini = horaInicio || '09:00';
        const fin = this.hhmm(Math.min(this.min(ini) + 60, 19 * 60));
        this.showFormReserva({ fecha: f, hora_inicio: ini, hora_fin: fin });
    },

    showFormReserva(r = null) {
        const esEdicion = !!r && !!r.id;
        const html = `
            <div class="form-group">
                <label class="form-label">Fecha *</label>
                <input type="date" id="lbFecha" class="form-control" value="${r.fecha || this.fecha}" min="${this.hoyStr()}">
            </div>
            <div style="display:flex;gap:10px">
                <div class="form-group" style="flex:1">
                    <label class="form-label">Hora inicio *</label>
                    <select id="lbIni" class="form-control" onchange="App.modules.lobby.syncFin()">${this.opcionesHora()}</select>
                </div>
                <div class="form-group" style="flex:1">
                    <label class="form-label">Hora fin *</label>
                    <select id="lbFin" class="form-control">${this.opcionesHora(8 * 60 + 30, 19 * 60 + 30)}</select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Motivo *</label>
                <input type="text" id="lbMotivo" class="form-control" maxlength="200" placeholder="Ej: Reunión con dirección, visita externa..." value="${r ? escapeHtml(r.motivo) : ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Detalle</label>
                <textarea id="lbDetalle" class="form-control" rows="3" placeholder="Participantes, equipos necesarios, observaciones...">${r ? escapeHtml(r.detalle) : ''}</textarea>
            </div>
        `;
        App.showModal(html, { title: esEdicion ? 'Editar reserva' : 'Nueva reserva' });

        document.getElementById('lbIni').value = r.hora_inicio || '09:00';
        document.getElementById('lbFin').value = r.hora_fin || '10:00';
        this.syncFin();

        const footer = document.querySelector('#modalOverlay .modal-footer');
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="App.hideModal()">Cancelar</button>
            <button class="btn btn-primary" id="lbSaveBtn" onclick="App.modules.lobby.guardar(${esEdicion ? r.id : 'null'})">${esEdicion ? 'Guardar cambios' : 'Reservar'}</button>
        `;
    },

    syncFin() {
        const ini = document.getElementById('lbIni').value;
        const finSel = document.getElementById('lbFin');
        const minIni = this.min(ini);
        // Ocultar opciones de fin no validas (deben ser > inicio y alineadas a 30)
        Array.from(finSel.options).forEach(o => {
            o.disabled = this.min(o.value) <= minIni;
        });
        if (this.min(finSel.value) <= minIni) {
            finSel.value = this.hhmm(minIni + 30);
        }
    },

    async guardar(id) {
        const fecha = document.getElementById('lbFecha').value;
        const hora_inicio = document.getElementById('lbIni').value;
        const hora_fin = document.getElementById('lbFin').value;
        const motivo = document.getElementById('lbMotivo').value.trim();
        const detalle = document.getElementById('lbDetalle').value.trim();

        // Validaciones en cliente (las del servidor son la autoridad)
        if (!fecha || !motivo) { App.showAlert('Fecha y motivo son requeridos', 'danger'); return; }
        if (this.esFinDeSemana(fecha)) { App.showAlert('La sala solo se agenda en días hábiles', 'danger'); return; }
        if (fecha < this.hoyStr()) { App.showAlert('No se pueden agendar reservas en el pasado', 'danger'); return; }
        if (fecha === this.hoyStr()) {
            const ahora = new Date();
            const minsAhora = ahora.getHours() * 60 + ahora.getMinutes();
            // Al editar se permite horario de inicio pasado mientras la reserva no haya terminado
            const corte = id ? this.min(hora_fin) : this.min(hora_inicio);
            if (corte <= minsAhora) {
                App.showAlert(id ? 'La hora de fin ya pasó' : 'La hora de inicio ya pasó', 'danger');
                return;
            }
        }
        if (hora_fin <= hora_inicio) { App.showAlert('La hora de fin debe ser posterior al inicio', 'danger'); return; }

        const btn = document.getElementById('lbSaveBtn');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            const res = await apiFetch(id ? `/api/lobby/reservas/${id}` : '/api/lobby/reservas', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify({ fecha, hora_inicio, hora_fin, motivo, detalle })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            App.hideModal();
            App.showAlert(id ? 'Reserva actualizada' : 'Reserva creada correctamente');
            this.fecha = fecha;
            await this.cargarDatos();
            this.renderVista();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
            btn.disabled = false;
            btn.textContent = id ? 'Guardar cambios' : 'Reservar';
        }
    },

    // ── Detalle ──
    detalle(id) {
        const r = this.datos.find(x => x.id === id);
        if (!r) return;
        const user = Auth.getUser();
        const puedeGestionar = r.estado === 'confirmada' && !r.es_pasada &&
            (this.acceso.es_admin || (user && r.organizador_id === user.id));

        const estadoBadge = r.estado === 'cancelada'
            ? '<span class="badge badge-neutral">Cancelada</span>'
            : (r.es_pasada ? '<span class="badge badge-warning">Finalizada</span>' : '<span class="badge badge-success">Confirmada</span>');

        const html = `
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
                <span style="font-size:16px;font-weight:800;color:#3b82f6">${r.hora_inicio} – ${r.hora_fin}</span>
                ${estadoBadge}
            </div>
            <div class="form-group">
                <label class="form-label">Motivo</label>
                <div style="font-size:14px;font-weight:600;color:#0f172a">${escapeHtml(r.motivo)}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Fecha</label>
                <div style="font-size:13px;color:#0f172a">${this.fmtFechaLarga(r.fecha)}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Organizado por</label>
                <div style="font-size:13px;color:#0f172a">${escapeHtml(r.organizador_nombre || r.organizador_email || '—')}</div>
            </div>
            <div class="form-group">
                <label class="form-label">Detalle</label>
                <div style="font-size:13px;color:#334155;white-space:pre-wrap">${r.detalle ? escapeHtml(r.detalle) : '<span style="color:#94a3b8">Sin detalle</span>'}</div>
            </div>
        `;

        App.showModal(html, { title: 'Detalle de reserva' });

        const footer = document.querySelector('#modalOverlay .modal-footer');
        let btns = '<button class="btn btn-outline" onclick="App.hideModal()">Cerrar</button>';
        if (puedeGestionar) {
            btns = `
                <button class="btn btn-outline" onclick="App.hideModal()">Cerrar</button>
                <button class="btn btn-warning" onclick="App.modules.lobby.editar(${r.id})">Editar</button>
                <button class="btn btn-danger" onclick="App.modules.lobby.cancelar(${r.id})">Cancelar reserva</button>`;
        }
        footer.innerHTML = btns;
    },

    editar(id) {
        const r = this.datos.find(x => x.id === id);
        if (!r) return;
        this.showFormReserva(r);
    },

    async cancelar(id) {
        const ok = await App.confirm('¿Seguro que quieres cancelar esta reserva? Esta acción no se puede deshacer.');
        if (!ok) return;
        try {
            const res = await apiFetch(`/api/lobby/reservas/${id}/cancelar`, { method: 'PUT' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            App.hideModal();
            App.showAlert('Reserva cancelada');
            await this.cargarDatos();
            this.renderVista();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    // ── Designados (admin) ──
    async showDesignadosModal() {
        const html = '<div id="lbDesList" style="text-align:center;padding:20px;color:#94a3b8">Cargando...</div>';
        App.showModal(html, { title: 'Usuarios designados para agendar' });
        await this.cargarDesignados();
    },

    async cargarDesignados() {
        const cont = document.getElementById('lbDesList');
        if (!cont) return;
        try {
            const res = await apiFetch('/api/lobby/designados');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const designadosHtml = data.designados.length
                ? data.designados.map(u => `
                    <div class="user-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:6px;gap:8px;flex-wrap:wrap">
                        <div style="min-width:0">
                            <div style="font-weight:600;font-size:13px;color:#0f172a">${escapeHtml(u.nombre || u.email)}</div>
                            <div style="font-size:11px;color:#64748b">${escapeHtml(u.email)}</div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="App.modules.lobby.quitarDesignado(${u.id})">Quitar</button>
                    </div>`).join('')
                : '<div style="font-size:12px;color:#94a3b8;padding:10px">No hay usuarios designados aún.</div>';

            const disponiblesHtml = data.disponibles.length
                ? `<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
                        <select id="lbSelUser" class="form-control" style="flex:1;min-width:180px">
                            ${data.disponibles.map(u => `<option value="${u.id}">${escapeHtml(u.nombre || u.email)} (${escapeHtml(u.email)})</option>`).join('')}
                        </select>
                        <button class="btn btn-primary" onclick="App.modules.lobby.agregarDesignado()">Agregar</button>
                   </div>`
                : '<div style="font-size:12px;color:#94a3b8;margin-top:12px">Todos los usuarios activos ya están designados.</div>';

            cont.innerHTML = `
                <div style="font-size:12px;color:#64748b;margin-bottom:10px">Los usuarios designados pueden agendar la sala de reuniones.</div>
                ${designadosHtml}
                ${disponiblesHtml}
            `;
        } catch (e) {
            cont.innerHTML = `<div class="alert alert-danger">${escapeHtml(e.message)}</div>`;
        }
    },

    async agregarDesignado() {
        const sel = document.getElementById('lbSelUser');
        if (!sel || !sel.value) return;
        try {
            const res = await apiFetch('/api/lobby/designados', {
                method: 'POST',
                body: JSON.stringify({ usuario_id: Number(sel.value) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            App.showAlert('Usuario designado');
            await this.cargarDesignados();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    },

    async quitarDesignado(id) {
        try {
            const res = await apiFetch(`/api/lobby/designados/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            App.showAlert('Designación removida');
            await this.cargarDesignados();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        }
    }
});
