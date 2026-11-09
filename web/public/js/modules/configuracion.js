App.registerModule('configuracion', {
    cfg: null,
    original: null,

    // Campos editables del formulario
    CAMPOS: [
        { clave: 'info', nombre: 'Color primario', desc: 'Botones, enlaces y elementos activos' },
        { clave: 'hero', nombre: 'Color de encabezados', desc: 'Degradado de los banners de cada pagina' },
        { clave: 'sidebar', nombre: 'Color del menu lateral', desc: 'Degradado del sidebar' },
        { clave: 'accent', nombre: 'Color de acento', desc: 'Destacados y logo por defecto' },
        { clave: 'success', nombre: 'Exito', desc: 'Confirmaciones y estados positivos' },
        { clave: 'warning', nombre: 'Advertencia', desc: 'Avisos y plazos por vencer' },
        { clave: 'danger', nombre: 'Peligro', desc: 'Errores y acciones destructivas' },
        { clave: 'bg', nombre: 'Fondo de pagina', desc: 'Color de fondo de la aplicacion' }
    ],

    // Paletas predefinidas "de una sola pulsacion"
    PRESETS: [
        { nombre: 'Azul corporativo', icono: '🔵', colores: { info: '#3b82f6', hero: '#1e40af', sidebar: '#0f172a', accent: '#f59e0b', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', bg: '#f8fafc' } },
        { nombre: 'Verde institucional', icono: '🟢', colores: { info: '#059669', hero: '#047857', sidebar: '#022c22', accent: '#f59e0b', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', bg: '#f8fafc' } },
        { nombre: 'Purpura elegante', icono: '🟣', colores: { info: '#7c3aed', hero: '#5b21b6', sidebar: '#1e1b4b', accent: '#f59e0b', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', bg: '#f8fafc' } },
        { nombre: 'Rojo ejecutivo', icono: '🔴', colores: { info: '#dc2626', hero: '#991b1b', sidebar: '#1c1917', accent: '#f59e0b', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', bg: '#f8fafc' } },
        { nombre: 'Grafito oscuro', icono: '⚫', colores: { info: '#0ea5e9', hero: '#0369a1', sidebar: '#0c0f14', accent: '#f59e0b', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', bg: '#f1f5f9' } },
        { nombre: 'Cobalto cielo', icono: '🔷', colores: { info: '#2563eb', hero: '#1d4ed8', sidebar: '#172554', accent: '#f59e0b', success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', bg: '#eff6ff' } }
    ],

    async render() {
        const el = document.getElementById('page-configuracion');
        el.innerHTML = `
            <style>
                .theme-wrap{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
                .theme-card{background:white;border:1px solid var(--border);border-radius:14px;overflow:hidden}
                .theme-card-h{padding:12px 16px;border-bottom:1px solid var(--border-light);font-weight:700;font-size:13px;color:var(--text);display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:wrap}
                .theme-card-b{padding:16px}
                .preset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
                .preset{border:2px solid var(--border);border-radius:10px;padding:10px;cursor:pointer;transition:all .15s;background:white;text-align:center}
                .preset:hover{border-color:var(--info);transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
                .preset.on{border-color:var(--info);box-shadow:0 0 0 3px color-mix(in srgb, var(--info) 25%, transparent)}
                .preset-swatches{display:flex;justify-content:center;gap:4px;margin-bottom:6px}
                .preset-swatches i{width:18px;height:18px;border-radius:50%;display:block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}
                .preset span{font-size:11px;font-weight:600;color:var(--text-secondary)}
                .color-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px dashed var(--border-light)}
                .color-row:last-child{border-bottom:none}
                .color-swatch{width:42px;height:42px;border-radius:10px;border:1px solid var(--border);overflow:hidden;flex-shrink:0;position:relative;cursor:pointer}
                .color-swatch input[type=color]{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);border:none;padding:0;cursor:pointer;background:none}
                .color-meta{flex:1;min-width:0}
                .color-meta b{display:block;font-size:12.5px;color:var(--text)}
                .color-meta small{font-size:11px;color:var(--text-muted)}
                .color-hex{font-family:ui-monospace,monospace;font-size:11px;color:var(--text-secondary);background:var(--gray-100);padding:3px 8px;border-radius:6px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border)}
                .color-hex:hover{border-color:var(--info);color:var(--info)}
                .logo-drop{border:2px dashed var(--border);border-radius:12px;padding:24px 16px;text-align:center;cursor:pointer;transition:all .15s;background:var(--gray-50)}
                .logo-drop:hover,.logo-drop.over{border-color:var(--info);background:color-mix(in srgb, var(--info) 6%, white)}
                .logo-preview{max-height:90px;max-width:100%;object-fit:contain;border-radius:8px;background:white;padding:6px;border:1px solid var(--border)}
                .live-preview{border-radius:12px;overflow:hidden;border:1px solid var(--border)}
                .lp-hero{padding:14px 16px;color:white}
                .lp-hero b{font-size:13px;display:block}
                .lp-hero small{font-size:10px;opacity:.75}
                .lp-body{padding:12px 16px;background:var(--bg);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
                .lp-side{background:linear-gradient(180deg,var(--sidebar-from),var(--sidebar-mid),var(--sidebar-to));padding:10px 12px;color:white;font-size:11px;display:flex;gap:8px;align-items:center}
                .lp-side .lp-logo{width:26px;height:26px;border-radius:7px;background:var(--info);display:flex;align-items:center;justify-content:center;font-weight:800;overflow:hidden}
                .lp-side .lp-logo img{width:100%;height:100%;object-fit:contain}
                .theme-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
                .logo-thumb{width:64px;height:64px;border-radius:10px;border:1px solid var(--border);background:white;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
                .logo-thumb img{max-width:100%;max-height:100%;object-fit:contain}
                .id-field{margin-bottom:16px}
                .id-field:last-child{margin-bottom:0}
                .id-field>label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:6px}
                .id-field>label b{color:var(--info);font-variant-numeric:tabular-nums}
                .id-switch{display:flex;align-items:center;gap:8px;margin-top:9px;font-size:12px;color:var(--text-secondary);cursor:pointer;text-transform:none;letter-spacing:0;font-weight:500}
                .id-switch input{width:16px;height:16px;accent-color:var(--info);cursor:pointer}
                .id-range{width:100%;accent-color:var(--info);cursor:pointer}
                .id-scale{display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-top:2px}
                .lp-side .lp-logo{transition:width .15s, height .15s}
                @media(max-width:900px){ .theme-wrap{grid-template-columns:1fr} }
            </style>

            <div class="m-page">
                <div class="m-hero">
                    <div style="position:relative;z-index:1">
                        <h2>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-4px;margin-right:8px"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                            Apariencia
                        </h2>
                        <p>Paleta de colores, logo y nombre del sistema</p>
                    </div>
                </div>

                <div class="theme-wrap">
                    <div>
                        <div class="theme-card" style="margin-bottom:16px">
                            <div class="theme-card-h">Paletas rapidas</div>
                            <div class="theme-card-b">
                                <div class="preset-grid" id="tcPresets"></div>
                            </div>
                        </div>

                        <div class="theme-card" style="margin-bottom:16px">
                            <div class="theme-card-h">
                                Colores personalizados
                                <button class="btn btn-sm btn-outline" onclick="App.modules.configuracion.resetColores()">Restaurar colores</button>
                            </div>
                            <div class="theme-card-b" id="tcColores"></div>
                        </div>

                        <div class="theme-card">
                            <div class="theme-card-h">Marca y textos</div>
                            <div class="theme-card-b">
                                <div class="id-field">
                                    <label for="tcNombre">Nombre principal</label>
                                    <input type="text" id="tcNombre" class="form-control" maxlength="40" placeholder="Asesoria" oninput="App.modules.configuracion.cambioTexto()">
                                    <label class="id-switch">
                                        <input type="checkbox" id="tcMostrarNombre" checked onchange="App.modules.configuracion.cambioTexto()">
                                        Mostrar en el menu lateral
                                    </label>
                                </div>

                                <div class="id-field">
                                    <label for="tcSubtitulo">Subtitulo</label>
                                    <input type="text" id="tcSubtitulo" class="form-control" maxlength="30" placeholder="Seguimiento" oninput="App.modules.configuracion.cambioTexto()">
                                    <label class="id-switch">
                                        <input type="checkbox" id="tcMostrarSub" checked onchange="App.modules.configuracion.cambioTexto()">
                                        Mostrar debajo del nombre
                                    </label>
                                </div>

                                <div class="id-field">
                                    <label for="tcSize">Tamano del logo — <b id="tcSizeVal">42</b> px</label>
                                    <input type="range" id="tcSize" class="id-range" min="24" max="72" step="2" value="42"
                                        oninput="App.modules.configuracion.cambioTamano(this.value)">
                                    <div class="id-scale"><span>24 px</span><span>72 px</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="theme-card" style="margin-bottom:16px">
                            <div class="theme-card-h">Vista previa</div>
                            <div class="theme-card-b">
                                <div class="live-preview">
                                    <div class="lp-side" id="tcPvSide">
                                        <div class="lp-logo" id="tcPvLogo">A</div>
                                        <div><b id="tcPvNombre" style="font-size:12px">Asesoria</b><br><small id="tcPvSub" style="opacity:.6;font-size:9px">Seguimiento</small></div>
                                    </div>
                                    <div class="lp-hero" id="tcPvHero">
                                        <b>Encabezado de pagina</b>
                                        <small>Ejemplo del degradado actual</small>
                                    </div>
                                    <div class="lp-body">
                                        <button class="btn btn-primary btn-sm" style="pointer-events:none">Principal</button>
                                        <span class="badge badge-success">OK</span>
                                        <span class="badge badge-warning">Alerta</span>
                                        <span class="badge badge-danger">Error</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="theme-card" style="margin-bottom:16px">
                            <div class="theme-card-h">Logo del sistema</div>
                            <div class="theme-card-b">
                                <div class="logo-drop" id="tcDrop" onclick="document.getElementById('tcFile').click()">
                                    <div id="tcDropInner">
                                        <div style="font-size:22px;margin-bottom:4px">🎨</div>
                                        <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">Click o arrastra una imagen</div>
                                        <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">PNG, JPG, SVG o WebP · max 800 KB</div>
                                    </div>
                                </div>
                                <input type="file" id="tcFile" accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif" style="display:none" onchange="App.modules.configuracion.onFile(this)">
                                <div id="tcLogoActual" style="display:none;margin-top:10px"></div>
                            </div>
                        </div>

                        <div class="theme-actions">
                            <button class="btn btn-primary" id="tcSave" onclick="App.modules.configuracion.guardar()" style="flex:1">Guardar cambios</button>
                            <button class="btn btn-outline" onclick="App.modules.configuracion.resetTodo()">Restaurar todo</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.cargar();
        this.bindDrag();
    },

    async cargar() {
        try {
            const res = await apiFetch('/api/config');
            if (!res.ok) throw new Error('No se pudo cargar la configuracion');
            this.cfg = await res.json();
        } catch (e) {
            this.cfg = { colores: this.PRESETS[0].colores, logo: '', app_nombre: 'Asesoria', app_subtitulo: 'Seguimiento', mostrar_nombre: true, mostrar_subtitulo: true, logo_tamano: 42 };
            App.showAlert('Usando colores por defecto: ' + e.message, 'warning');
        }
        this.original = JSON.parse(JSON.stringify(this.cfg));
        this.pintar();
    },

    pintar() {
        const c = this.cfg.colores;

        // Presets
        document.getElementById('tcPresets').innerHTML = this.PRESETS.map((p, i) => `
            <div class="preset ${this.esPreset(p) ? 'on' : ''}" onclick="App.modules.configuracion.aplicarPreset(${i})">
                <div class="preset-swatches">
                    <i style="background:${p.colores.info}"></i>
                    <i style="background:${p.colores.hero}"></i>
                    <i style="background:${p.colores.sidebar}"></i>
                    <i style="background:${p.colores.accent}"></i>
                </div>
                <span>${p.icono} ${p.nombre}</span>
            </div>
        `).join('');

        // Fila por color
        document.getElementById('tcColores').innerHTML = this.CAMPOS.map(campo => `
            <div class="color-row">
                <div class="color-swatch" style="background:${c[campo.clave]}">
                    <input type="color" value="${c[campo.clave]}" oninput="App.modules.configuracion.cambioColor('${campo.clave}', this.value)">
                </div>
                <div class="color-meta">
                    <b>${campo.nombre}</b>
                    <small>${campo.desc}</small>
                </div>
                <button class="color-hex" title="Copiar codigo" onclick="App.modules.configuracion.copiarHex('${c[campo.clave]}')">${c[campo.clave]}</button>
            </div>
        `).join('');

        document.getElementById('tcNombre').value = this.cfg.app_nombre || '';
        const sub = document.getElementById('tcSubtitulo');
        if (sub) sub.value = this.cfg.app_subtitulo == null ? 'Seguimiento' : this.cfg.app_subtitulo;
        const mn = document.getElementById('tcMostrarNombre');
        if (mn) mn.checked = this.cfg.mostrar_nombre !== false;
        const ms = document.getElementById('tcMostrarSub');
        if (ms) ms.checked = this.cfg.mostrar_subtitulo !== false;
        const size = document.getElementById('tcSize');
        if (size) {
            size.value = this.cfg.logo_tamano || 42;
            document.getElementById('tcSizeVal').textContent = size.value;
        }
        this.pintarLogo();
        this.preview();
    },

    pintarLogo() {
        const cont = document.getElementById('tcLogoActual');
        const drop = document.getElementById('tcDropInner');
        if (this.cfg.logo) {
            cont.style.display = 'block';
            cont.innerHTML = `
                <div style="display:flex;gap:10px;align-items:center">
                    <div class="logo-thumb"><img src="${this.cfg.logo}" alt="Logo actual"></div>
                    <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:#fca5a5" onclick="App.modules.configuracion.quitarLogo()">Quitar logo</button>
                </div>`;
            drop.innerHTML = `
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">Click o arrastra para reemplazar</div>
                <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">PNG, JPG, SVG o WebP · max 800 KB</div>`;
        } else {
            cont.style.display = 'none';
            cont.innerHTML = '';
            drop.innerHTML = `
                <div style="font-size:22px;margin-bottom:4px">🎨</div>
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">Click o arrastra una imagen</div>
                <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">PNG, JPG, SVG o WebP · max 800 KB</div>`;
        }
    },

    esPreset(p) {
        const c = this.cfg.colores;
        return Object.keys(p.colores).every(k => (c[k] || '').toLowerCase() === p.colores[k].toLowerCase());
    },

    aplicarPreset(i) {
        const p = this.PRESETS[i];
        Object.assign(this.cfg.colores, p.colores);
        this.aplicarEnVivo();
        this.pintar();
    },

    cambioColor(clave, valor) {
        this.cfg.colores[clave] = valor;
        this.aplicarEnVivo();
        // Actualizar hex de la fila sin repintar todo (evita cerrar el picker)
        const fila = event.target.closest('.color-row');
        if (fila) {
            fila.querySelector('.color-swatch').style.background = valor;
            fila.querySelector('.color-hex').textContent = valor;
        }
        // Quitar marca de preset si ya no coincide
        document.querySelectorAll('#tcPresets .preset').forEach((el, i) => {
            el.classList.toggle('on', this.esPreset(this.PRESETS[i]));
        });
    },

    cambioTexto() {
        this.cfg.app_nombre = document.getElementById('tcNombre').value.trim() || 'Asesoria';
        const sub = document.getElementById('tcSubtitulo');
        if (sub) this.cfg.app_subtitulo = sub.value.trim();
        const mn = document.getElementById('tcMostrarNombre');
        if (mn) this.cfg.mostrar_nombre = mn.checked;
        const ms = document.getElementById('tcMostrarSub');
        if (ms) this.cfg.mostrar_subtitulo = ms.checked;
        this.aplicarEnVivo();
    },

    cambioTamano(v) {
        this.cfg.logo_tamano = parseInt(v, 10) || 42;
        const lbl = document.getElementById('tcSizeVal');
        if (lbl) lbl.textContent = this.cfg.logo_tamano;
        this.aplicarEnVivo();
    },

    // Aplica en vivo en la pagina real (sin guardar) para vista previa inmediata
    aplicarEnVivo() {
        if (window.Theme) Theme.aplicar({ ...this.cfg });
        this.preview();
    },

    preview() {
        const nombre = this.cfg.app_nombre || 'Asesoria';
        const sub = this.cfg.app_subtitulo == null ? 'Seguimiento' : this.cfg.app_subtitulo;
        const el = document.getElementById('tcPvNombre');
        if (!el) return;

        el.textContent = nombre;
        el.style.display = this.cfg.mostrar_nombre === false ? 'none' : '';

        const subEl = document.getElementById('tcPvSub');
        if (subEl) {
            subEl.textContent = sub;
            subEl.style.display = (this.cfg.mostrar_subtitulo === false || !sub) ? 'none' : '';
        }

        const logo = document.getElementById('tcPvLogo');
        logo.innerHTML = this.cfg.logo
            ? `<img src="${this.cfg.logo}" alt="">`
            : nombre.charAt(0).toUpperCase();
        // Mismo tamano relativo que en el sidebar real
        const px = Math.max(16, Math.min(44, Math.round((this.cfg.logo_tamano || 42) * 0.62)));
        logo.style.width = px + 'px';
        logo.style.height = px + 'px';
    },

    copiarHex(hex) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(hex).then(() => App.showAlert(`${hex} copiado`));
        }
    },

    resetColores() {
        const def = this.original && this.original.colores ? this.original.colores : this.PRESETS[0].colores;
        Object.assign(this.cfg.colores, JSON.parse(JSON.stringify(def)));
        this.aplicarEnVivo();
        this.pintar();
        App.showAlert('Colores restaurados (no guardados aun)', 'info');
    },

    resetTodo() {
        // Volver al estado con que se abrio el modulo
        this.cfg = JSON.parse(JSON.stringify(this.original));
        if (window.Theme) Theme.aplicar({ ...this.cfg });
        this.pintar();
        App.showAlert('Se restauro el ultimo estado guardado', 'info');
    },

    // ── Logo ──
    bindDrag() {
        const drop = document.getElementById('tcDrop');
        if (!drop) return;
        ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
            e.preventDefault(); drop.classList.add('over');
        }));
        ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
            e.preventDefault(); drop.classList.remove('over');
        }));
        drop.addEventListener('drop', e => {
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) this.procesarArchivo(file);
        });
    },

    onFile(input) {
        const file = input.files && input.files[0];
        if (file) this.procesarArchivo(file);
        input.value = '';
    },

    procesarArchivo(file) {
        const tiposOk = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
        if (!tiposOk.includes(file.type)) {
            App.showAlert('Formato no soportado: usa PNG, JPG, SVG o WebP', 'danger');
            return;
        }
        if (file.size > 800 * 1024) {
            App.showAlert(`La imagen pesa ${(file.size / 1024).toFixed(0)} KB (max 800 KB)`, 'danger');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            this.cfg.logo = reader.result;
            this.aplicarEnVivo();
            this.pintarLogo();
            this.preview();
        };
        reader.readAsDataURL(file);
    },

    quitarLogo() {
        this.cfg.logo = '';
        this.aplicarEnVivo();
        this.pintarLogo();
        this.preview();
    },

    // ── Guardar ──
    async guardar() {
        const btn = document.getElementById('tcSave');
        btn.disabled = true;
        btn.textContent = 'Guardando...';
        try {
            const res = await apiFetch('/api/config', {
                method: 'PUT',
                body: JSON.stringify(this.cfg)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            this.cfg = data;
            this.original = JSON.parse(JSON.stringify(data));
            if (window.Theme) Theme.aplicar({ ...data });
            App.showAlert('Apariencia guardada. Se aplica en toda la aplicacion.');
            this.pintar();
        } catch (e) {
            App.showAlert('Error: ' + e.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Guardar cambios';
        }
    }
});
