/**
 * COMPRA APP - Lógica Multi-Vehículo
 * Incluye: Total = Inversión + Valor a Recibir, y Modal de Reinversión de Capital.
 */

// ==========================================
// MÓDULO 1: GESTIÓN DE DATOS
// ==========================================
let appData = { vehiculos: [], activeId: null };

const DataManager = {
    save: () => localStorage.setItem('compra_data_v5', JSON.stringify(appData)),
    load: () => {
        const stored = localStorage.getItem('compra_data_v5');
        if (stored) appData = JSON.parse(stored);
        
        const isDark = localStorage.getItem('compra_dark_mode') === 'true';
        if (isDark) document.body.classList.add('dark-mode');
    },
    clear: () => {
        appData = { vehiculos: [], activeId: null };
        DataManager.save();
    },
    getActive: () => appData.vehiculos.find(v => v.id === appData.activeId)
};

// ==========================================
// MÓDULO 2: CÁLCULOS Y UTILIDADES
// ==========================================
const Calc = {
    getTotalAportes: (v) => v ? v.inversionistas.reduce((sum, i) => sum + Number(i.aporte), 0) : 0,
    getTotalGastos: (v) => v ? v.gastos.reduce((sum, g) => sum + Number(g.valor), 0) : 0,
    getDineroARepartir: (v) => v ? (v.valorVenta || 0) - Calc.getTotalGastos(v) : 0,
    formatMoney: (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount),
    formatDate: (dateStr) => {
        if (!dateStr) return '---';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
};

// ==========================================
// MÓDULO 3: INTERFAZ DE USUARIO (UI)
// ==========================================
const UI = {
    init: () => {
        DataManager.load();
        UI.setupMobileMenu();
        UI.setupNavigation();
        UI.setupThemeToggle();
        UI.setupForms();
        UI.setupFileManagement();
        UI.setupImportFeature();
        UI.setupReinvertirFeature();
        UI.checkActiveVehicle();
        UI.renderAll();
    },

    setupThemeToggle: () => {
        document.getElementById('btn-theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('compra_dark_mode', document.body.classList.contains('dark-mode'));
        });
    },

    setupMobileMenu: () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggleMenu = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); };
        
        document.getElementById('open-menu').addEventListener('click', toggleMenu);
        document.getElementById('close-menu').addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', () => { if (window.innerWidth <= 850) toggleMenu(); });
        });
    },

    setupNavigation: () => {
        const buttons = document.querySelectorAll('.menu-btn');
        const views = document.querySelectorAll('.view');
        const title = document.getElementById('page-title');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.currentTarget.classList.contains('d-none')) return;

                buttons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const target = e.currentTarget.dataset.target;
                views.forEach(v => v.classList.remove('active'));
                document.getElementById(target).classList.add('active');
                
                title.textContent = e.currentTarget.textContent.trim();
            });
        });
    },

    checkActiveVehicle: () => {
        const badge = document.getElementById('active-placa-badge');
        const alertBox = document.getElementById('alerta-seleccion');
        const activeVeh = DataManager.getActive();
        const menuDependientes = document.querySelectorAll('.vehiculo-dependiente');

        UI.resetFormVehiculo(); UI.resetFormInv(); UI.resetFormGasto(); UI.resetFormVenta();

        if (activeVeh) {
            let transitoTxt = activeVeh.transito ? ` - ${activeVeh.transito}` : '';
            badge.textContent = `Vehículo: ${activeVeh.placa} | ${activeVeh.marca} ${activeVeh.modelo}${transitoTxt}`;
            badge.classList.add('active-badge');
            alertBox.style.display = 'none';
            menuDependientes.forEach(btn => btn.classList.remove('d-none'));
            UI.updateImportSelect(activeVeh.id);
        } else {
            badge.textContent = 'Ningún vehículo seleccionado';
            badge.classList.remove('active-badge');
            alertBox.style.display = 'block';
            menuDependientes.forEach(btn => btn.classList.add('d-none'));
            document.querySelector('.menu-btn[data-target="vehiculos"]').click();
        }
    },

    toggleForm: (panelId, btnId, show) => {
        const panel = document.getElementById(panelId);
        const btn = document.getElementById(btnId);
        if(show) { panel.classList.remove('d-none'); btn.classList.add('d-none'); } 
        else { panel.classList.add('d-none'); btn.classList.remove('d-none'); }
    },

    setupForms: () => {
        document.getElementById('btn-add-vehiculo').addEventListener('click', () => UI.toggleForm('panel-form-vehiculo', 'btn-add-vehiculo', true));
        document.getElementById('btn-add-inv').addEventListener('click', () => UI.toggleForm('panel-form-inv', 'btn-add-inv', true));
        document.getElementById('btn-add-gasto').addEventListener('click', () => UI.toggleForm('panel-form-gasto', 'btn-add-gasto', true));
        document.getElementById('btn-add-venta').addEventListener('click', () => UI.toggleForm('panel-form-venta', 'btn-add-venta', true));

        document.getElementById('btn-cancel-vehiculo').addEventListener('click', () => UI.resetFormVehiculo());
        document.getElementById('btn-cancel-inv').addEventListener('click', () => UI.resetFormInv());
        document.getElementById('btn-cancel-gasto').addEventListener('click', () => UI.resetFormGasto());
        document.getElementById('btn-cancel-venta').addEventListener('click', () => UI.resetFormVenta());

        document.getElementById('form-vehiculo').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('veh-id').value;
            const placa = document.getElementById('veh-placa').value.toUpperCase();
            const marca = document.getElementById('veh-marca').value;
            const modelo = document.getElementById('veh-modelo').value;
            const transito = document.getElementById('veh-transito').value;
            const obs = document.getElementById('veh-obs').value;
            
            if (id) {
                const veh = appData.vehiculos.find(v => v.id == id);
                if(veh) { veh.placa = placa; veh.marca = marca; veh.modelo = modelo; veh.transito = transito; veh.observaciones = obs; }
            } else {
                appData.vehiculos.push({
                    id: Date.now(), placa, marca, modelo, transito, observaciones: obs,
                    inversionistas: [], gastos: [], valorVenta: 0, fechaVenta: ''
                });
                appData.activeId = appData.vehiculos[appData.vehiculos.length-1].id;
            }
            UI.resetFormVehiculo(); DataManager.save(); UI.checkActiveVehicle(); UI.renderAll();
        });

        document.getElementById('form-inversionista').addEventListener('submit', (e) => {
            e.preventDefault();
            const veh = DataManager.getActive();
            if(!veh) return;

            const id = document.getElementById('inv-id').value;
            const nombre = document.getElementById('inv-nombre').value;
            const aporte = parseFloat(document.getElementById('inv-aporte').value);
            
            if (id) {
                const inv = veh.inversionistas.find(i => i.id == id);
                if(inv) { inv.nombre = nombre; inv.aporte = aporte; }
            } else { veh.inversionistas.push({ id: Date.now(), nombre, aporte }); }
            UI.resetFormInv(); DataManager.save(); UI.renderAll();
        });

        document.getElementById('form-gasto').addEventListener('submit', (e) => {
            e.preventDefault();
            const veh = DataManager.getActive();
            if(!veh) return;

            const id = document.getElementById('gasto-id').value;
            const fecha = document.getElementById('gasto-fecha').value;
            const concepto = document.getElementById('gasto-concepto').value;
            const desc = document.getElementById('gasto-desc').value;
            const valor = parseFloat(document.getElementById('gasto-valor').value);
            
            if (id) {
                const gas = veh.gastos.find(g => g.id == id);
                if(gas) { gas.fecha = fecha; gas.concepto = concepto; gas.desc = desc; gas.valor = valor; }
            } else { veh.gastos.push({ id: Date.now(), fecha, concepto, desc, valor }); }
            UI.resetFormGasto(); DataManager.save(); UI.renderAll();
        });

        document.getElementById('btn-guardar-venta').addEventListener('click', () => {
            const veh = DataManager.getActive();
            if(!veh) return;

            veh.valorVenta = parseFloat(document.getElementById('valor-venta-input').value) || 0;
            veh.fechaVenta = document.getElementById('fecha-venta-input').value || '';
            UI.resetFormVenta(); DataManager.save(); UI.renderAll();
        });
    },

    setupImportFeature: () => {
        document.getElementById('btn-import-inv').addEventListener('click', () => {
            const vehActual = DataManager.getActive();
            const fromId = document.getElementById('select-import-vehiculo').value;
            if(!vehActual || !fromId) { alert("Seleccione un vehículo origen para importar."); return; }

            const vehOrigen = appData.vehiculos.find(v => v.id == fromId);
            if(vehOrigen && vehOrigen.inversionistas.length > 0) {
                if(confirm(`¿Desea traer ${vehOrigen.inversionistas.length} inversionistas de la placa ${vehOrigen.placa}?`)) {
                    const copia = vehOrigen.inversionistas.map(i => ({ id: Date.now() + Math.random(), nombre: i.nombre, aporte: i.aporte }));
                    vehActual.inversionistas.push(...copia);
                    DataManager.save(); UI.renderAll(); UI.resetFormInv();
                }
            } else { alert("El vehículo seleccionado no tiene inversionistas."); }
        });
    },

    updateImportSelect: (currentId) => {
        const selects = [document.getElementById('select-import-vehiculo'), document.getElementById('reinv-destino')];
        
        selects.forEach(select => {
            if(!select) return;
            // Guardar opción "NEW" si existe en ese select
            const hasNewOption = select.querySelector('option[value="NEW"]');
            select.innerHTML = '<option value="">Seleccione vehículo...</option>';
            if(hasNewOption) {
                select.innerHTML += '<option value="NEW" style="font-weight:bold; color:var(--primary);">✨ CREAR UN NUEVO VEHÍCULO</option>';
            }
            
            appData.vehiculos.forEach(v => {
                // En reinversión no deberíamos ocultar el actual, pero para importar sí
                if (select.id === 'select-import-vehiculo' && v.id === currentId) return;
                select.innerHTML += `<option value="${v.id}">${v.placa} - ${v.marca} ${v.modelo}</option>`;
            });
        });
    },

    // ===== LÓGICA MODAL REINVERTIR =====
    setupReinvertirFeature: () => {
        // Controlar si muestra campos de vehículo nuevo
        document.getElementById('reinv-destino').addEventListener('change', (e) => {
            const fields = document.getElementById('reinv-new-veh-fields');
            const reqs = ['reinv-placa', 'reinv-marca', 'reinv-modelo'];
            if(e.target.value === 'NEW') {
                fields.classList.remove('d-none');
                reqs.forEach(id => document.getElementById(id).required = true);
            } else {
                fields.classList.add('d-none');
                reqs.forEach(id => document.getElementById(id).required = false);
            }
        });

        // Enviar formulario de reinversión
        document.getElementById('form-reinvertir').addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('reinv-nombre-val').value;
            const monto = parseFloat(document.getElementById('reinv-monto-val').value);
            const destino = document.getElementById('reinv-destino').value;

            if (destino === 'NEW') {
                const placa = document.getElementById('reinv-placa').value.toUpperCase();
                const marca = document.getElementById('reinv-marca').value;
                const modelo = document.getElementById('reinv-modelo').value;
                
                appData.vehiculos.push({
                    id: Date.now(), placa, marca, modelo, transito: '', observaciones: '',
                    inversionistas: [{ id: Date.now()+1, nombre, aporte: monto }], 
                    gastos: [], valorVenta: 0, fechaVenta: ''
                });
                alert(`¡Éxito! Vehículo ${placa} creado y capital transferido.`);
            } else {
                const vehDestino = appData.vehiculos.find(v => v.id == destino);
                if (vehDestino) {
                    vehDestino.inversionistas.push({ id: Date.now(), nombre, aporte: monto });
                    alert(`¡Éxito! Capital reinvertido en el vehículo ${vehDestino.placa}.`);
                }
            }
            
            DataManager.save();
            UI.closeReinvertirModal();
            UI.renderAll();
            UI.updateImportSelect(appData.activeId); // Actualizar selects
        });
    },

    closeReinvertirModal: () => {
        document.getElementById('modal-reinvertir').classList.add('d-none');
        document.getElementById('form-reinvertir').reset();
        document.getElementById('reinv-new-veh-fields').classList.add('d-none');
    },

    // --- Resetters ---
    resetFormVehiculo: () => {
        document.getElementById('form-vehiculo').reset(); document.getElementById('veh-id').value = '';
        document.getElementById('titulo-form-vehiculo').textContent = 'Registrar Nuevo Vehículo';
        document.getElementById('panel-form-vehiculo').classList.remove('edit-mode');
        UI.toggleForm('panel-form-vehiculo', 'btn-add-vehiculo', false);
    },
    resetFormInv: () => {
        document.getElementById('form-inversionista').reset(); document.getElementById('inv-id').value = '';
        document.getElementById('titulo-form-inv').textContent = 'Agregar Inversionista';
        document.getElementById('titulo-form-inv').parentNode.classList.remove('edit-mode');
        UI.toggleForm('panel-form-inv', 'btn-add-inv', false);
    },
    resetFormGasto: () => {
        document.getElementById('form-gasto').reset(); document.getElementById('gasto-id').value = '';
        document.getElementById('titulo-form-gasto').textContent = 'Registrar Gasto';
        document.getElementById('titulo-form-gasto').parentNode.classList.remove('edit-mode');
        UI.toggleForm('panel-form-gasto', 'btn-add-gasto', false);
    },
    resetFormVenta: () => {
        UI.toggleForm('panel-form-venta', 'btn-add-venta', false);
    },

    renderAll: () => {
        UI.renderVehiculosTable();
        const actVeh = DataManager.getActive();
        UI.renderDashboard(actVeh);
        UI.renderInversionistas(actVeh);
        UI.renderGastos(actVeh);
        UI.renderVenta(actVeh);
    },

    renderVehiculosTable: () => {
        const tbody = document.querySelector('#tabla-vehiculos tbody');
        tbody.innerHTML = '';
        
        appData.vehiculos.forEach(v => {
            const tr = document.createElement('tr');
            const isSelected = appData.activeId === v.id;
            if(isSelected) tr.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            
            tr.setAttribute('ondblclick', `AppActions.editVehiculo(${v.id})`);

            let detalles = `<small style="color:var(--text-muted)">`;
            if(v.transito) detalles += `Tránsito: ${v.transito} | `;
            if(v.observaciones) detalles += `Obs: ${v.observaciones}`;
            detalles += `</small>`;

            tr.innerHTML = `
                <td><strong>${v.placa}</strong></td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${detalles}</td>
                <td class="action-buttons">
                    ${isSelected ? `<span class="badge active-badge" style="margin-right:5px;">Activo</span>` : `<button class="btn-secondary btn-sm" onclick="AppActions.selectVehiculo(${v.id})">Abrir</button>`}
                    <button class="btn-warning btn-sm" onclick="AppActions.editVehiculo(${v.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger btn-sm" onclick="AppActions.deleteVehiculo(${v.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderDashboard: (vehiculo) => {
        document.getElementById('dash-aportes').textContent = Calc.formatMoney(Calc.getTotalAportes(vehiculo));
        document.getElementById('dash-gastos').textContent = Calc.formatMoney(Calc.getTotalGastos(vehiculo));
        document.getElementById('dash-venta').textContent = Calc.formatMoney(vehiculo ? vehiculo.valorVenta : 0);
        document.getElementById('dash-neto').textContent = Calc.formatMoney(Calc.getDineroARepartir(vehiculo));
    },

    renderInversionistas: (vehiculo) => {
        const tbody = document.querySelector('#tabla-inversionistas tbody');
        tbody.innerHTML = '';
        if(!vehiculo) return;

        const total = Calc.getTotalAportes(vehiculo);

        vehiculo.inversionistas.forEach(inv => {
            const porcentaje = total > 0 ? ((inv.aporte / total) * 100).toFixed(2) : 0;
            const tr = document.createElement('tr');
            tr.setAttribute('ondblclick', `AppActions.editInv(${inv.id})`);
            tr.innerHTML = `
                <td>${inv.nombre}</td>
                <td>${Calc.formatMoney(inv.aporte)}</td>
                <td>${porcentaje}%</td>
                <td class="action-buttons">
                    <button class="btn-warning btn-sm" onclick="AppActions.editInv(${inv.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger btn-sm" onclick="AppActions.deleteInv(${inv.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('inv-total-val').innerHTML = `<strong>${Calc.formatMoney(total)}</strong>`;
    },

    renderGastos: (vehiculo) => {
        const tbody = document.querySelector('#tabla-gastos tbody');
        tbody.innerHTML = '';
        if(!vehiculo) return;

        vehiculo.gastos.forEach(gas => {
            const tr = document.createElement('tr');
            tr.setAttribute('ondblclick', `AppActions.editGasto(${gas.id})`);
            tr.innerHTML = `
                <td>${Calc.formatDate(gas.fecha)}</td>
                <td><strong>${gas.concepto}</strong></td>
                <td>${gas.desc || '---'}</td>
                <td>${Calc.formatMoney(gas.valor)}</td>
                <td class="action-buttons">
                    <button class="btn-warning btn-sm" onclick="AppActions.editGasto(${gas.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-danger btn-sm" onclick="AppActions.deleteGasto(${gas.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const totalAportes = Calc.getTotalAportes(vehiculo);
        const totalGastos = Calc.getTotalGastos(vehiculo);
        const saldoRestante = totalAportes - totalGastos;

        document.getElementById('gas-total-val').innerHTML = `<strong>${Calc.formatMoney(totalGastos)}</strong>`;
        const colorSaldo = saldoRestante < 0 ? 'var(--danger)' : 'var(--primary)';
        document.getElementById('gas-saldo-val').innerHTML = `<strong style="color: ${colorSaldo};">${Calc.formatMoney(saldoRestante)}</strong>`;
    },

    renderVenta: (vehiculo) => {
        const inputValor = document.getElementById('valor-venta-input');
        const inputFecha = document.getElementById('fecha-venta-input');
        const dispValor = document.getElementById('disp-valor-venta');
        const dispFecha = document.getElementById('disp-fecha-venta');
        
        const tbody = document.querySelector('#tabla-distribucion tbody');
        const tfoot = document.querySelector('#tabla-distribucion tfoot');
        
        tbody.innerHTML = ''; tfoot.innerHTML = '';
        if(!vehiculo) { 
            inputValor.value = ''; inputFecha.value = ''; 
            dispValor.textContent = '$0'; dispFecha.textContent = '---'; 
            return; 
        }

        inputValor.value = vehiculo.valorVenta || '';
        inputFecha.value = vehiculo.fechaVenta || '';
        dispValor.textContent = Calc.formatMoney(vehiculo.valorVenta || 0);
        dispFecha.textContent = vehiculo.fechaVenta ? Calc.formatDate(vehiculo.fechaVenta) : 'Sin registrar';
        
        const totalAportes = Calc.getTotalAportes(vehiculo);
        const totalGastos = Calc.getTotalGastos(vehiculo);
        const dineroARepartir = Calc.getDineroARepartir(vehiculo); 
        
        let sumInversion = 0, sumFaltante = 0, sumRecibir = 0, sumGranTotal = 0;

        vehiculo.inversionistas.forEach(inv => {
            const pct = totalAportes > 0 ? (inv.aporte / totalAportes) : 0;
            const gastosProporcionales = totalGastos * pct;
            
            const inversionPersona = Math.min(gastosProporcionales, inv.aporte);
            const faltantePersona = gastosProporcionales > inv.aporte ? (gastosProporcionales - inv.aporte) : 0;
            const valorARecibir = dineroARepartir * pct; 
            
            // NUEVO CÁLCULO: Inversión + Valor a Recibir
            const granTotalPersona = inversionPersona + valorARecibir;

            sumInversion += inversionPersona;
            sumFaltante += faltantePersona;
            sumRecibir += valorARecibir;
            sumGranTotal += granTotalPersona;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${inv.nombre}</td>
                <td>${Calc.formatMoney(inv.aporte)}</td>
                <td>${(pct * 100).toFixed(2)}%</td>
                <td style="color: var(--danger); font-weight: 500;">${Calc.formatMoney(inversionPersona)}</td>
                <td style="color: var(--warning); font-weight: 500;">${Calc.formatMoney(faltantePersona)}</td>
                <td style="color: ${valorARecibir >= 0 ? 'var(--success)' : 'var(--danger)'};">${Calc.formatMoney(valorARecibir)}</td>
                <td style="font-weight: bold; font-size: 1.1em; color: var(--primary);">${Calc.formatMoney(granTotalPersona)}</td>
                <td>
                    <button class="btn-success btn-sm" onclick="AppActions.openReinvertir('${inv.nombre}', ${granTotalPersona})" title="Trasladar este capital a otro vehículo"><i class="fas fa-recycle"></i> Reinvertir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tfoot.innerHTML = `
            <tr class="table-total">
                <td colspan="3" style="text-align:right;"><strong>TOTALES:</strong></td>
                <td style="color: var(--danger);"><strong>${Calc.formatMoney(sumInversion)}</strong></td>
                <td style="color: var(--warning);"><strong>${Calc.formatMoney(sumFaltante)}</strong></td>
                <td style="color: ${sumRecibir >= 0 ? 'var(--success)' : 'var(--danger)'};"><strong>${Calc.formatMoney(sumRecibir)}</strong></td>
                <td style="color: var(--primary); font-size: 1.1em;"><strong>${Calc.formatMoney(sumGranTotal)}</strong></td>
                <td></td>
            </tr>
        `;
    },

    setupFileManagement: () => {
        document.getElementById('btn-export-json').addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
            const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", "backup_compra.json");
            document.body.appendChild(dl); dl.click(); dl.remove();
        });

        const inputImport = document.getElementById('input-import-json');
        document.getElementById('btn-import-json').addEventListener('click', () => inputImport.click());
        
        inputImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if(imported.vehiculos) { 
                        appData = imported; DataManager.save(); UI.checkActiveVehicle(); UI.renderAll();
                        alert("Backup restaurado exitosamente.");
                    } else { alert("Formato de archivo inválido."); }
                } catch (err) { alert("Error al leer el archivo JSON."); }
            };
            reader.readAsText(file);
        });

        document.getElementById('btn-export-html').addEventListener('click', () => ReportGenerator.generate('html'));
        document.getElementById('btn-export-pdf').addEventListener('click', () => ReportGenerator.generate('pdf'));

        document.getElementById('btn-clear-data').addEventListener('click', () => {
            if(confirm('¿BORRAR TODO EL SISTEMA? Esta acción es irreversible.')) {
                DataManager.clear(); UI.checkActiveVehicle(); UI.renderAll();
            }
        });
    }
};

// ==========================================
// MÓDULO 4: ACCIONES GLOBALES
// ==========================================
window.AppActions = {
    // Acción para abrir modal de reinversión
    openReinvertir: (nombre, monto) => {
        document.getElementById('reinv-nombre-val').value = nombre;
        document.getElementById('reinv-monto-val').value = monto;
        document.getElementById('reinv-nombre').textContent = nombre;
        document.getElementById('reinv-monto-display').textContent = Calc.formatMoney(monto);
        
        document.getElementById('reinv-destino').value = '';
        document.getElementById('reinv-new-veh-fields').classList.add('d-none');
        
        document.getElementById('modal-reinvertir').classList.remove('d-none');
    },

    selectVehiculo: (id) => {
        appData.activeId = id; DataManager.save(); UI.checkActiveVehicle(); UI.renderAll();
        document.querySelector('.menu-btn[data-target="dashboard"]').click();
    },
    deleteVehiculo: (id) => {
        if(confirm('¿Eliminar este vehículo y todos sus datos?')) {
            appData.vehiculos = appData.vehiculos.filter(v => v.id !== id);
            if(appData.activeId === id) appData.activeId = null;
            DataManager.save(); UI.checkActiveVehicle(); UI.renderAll();
        }
    },
    editVehiculo: (id) => {
        const veh = appData.vehiculos.find(v => v.id === id);
        if(!veh) return;
        document.getElementById('veh-id').value = veh.id;
        document.getElementById('veh-placa').value = veh.placa;
        document.getElementById('veh-marca').value = veh.marca || '';
        document.getElementById('veh-modelo').value = veh.modelo || '';
        document.getElementById('veh-transito').value = veh.transito || '';
        document.getElementById('veh-obs').value = veh.observaciones || '';
        
        document.getElementById('titulo-form-vehiculo').textContent = `Editando: ${veh.placa}`;
        document.getElementById('panel-form-vehiculo').classList.add('edit-mode');
        UI.toggleForm('panel-form-vehiculo', 'btn-add-vehiculo', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteInv: (id) => {
        const veh = DataManager.getActive();
        if(veh && confirm('¿Eliminar inversionista?')) {
            veh.inversionistas = veh.inversionistas.filter(i => i.id !== id); DataManager.save(); UI.renderAll();
        }
    },
    editInv: (id) => {
        const veh = DataManager.getActive();
        const inv = veh.inversionistas.find(i => i.id === id);
        if(!inv) return;
        
        document.getElementById('inv-id').value = inv.id;
        document.getElementById('inv-nombre').value = inv.nombre;
        document.getElementById('inv-aporte').value = inv.aporte;

        document.getElementById('titulo-form-inv').textContent = 'Editando Inversionista';
        document.getElementById('titulo-form-inv').parentNode.classList.add('edit-mode');
        UI.toggleForm('panel-form-inv', 'btn-add-inv', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    deleteGasto: (id) => {
        const veh = DataManager.getActive();
        if(veh && confirm('¿Eliminar gasto?')) {
            veh.gastos = veh.gastos.filter(g => g.id !== id); DataManager.save(); UI.renderAll();
        }
    },
    editGasto: (id) => {
        const veh = DataManager.getActive();
        const gas = veh.gastos.find(g => g.id === id);
        if(!gas) return;

        document.getElementById('gasto-id').value = gas.id;
        document.getElementById('gasto-fecha').value = gas.fecha || '';
        document.getElementById('gasto-concepto').value = gas.concepto;
        document.getElementById('gasto-desc').value = gas.desc || '';
        document.getElementById('gasto-valor').value = gas.valor;

        document.getElementById('titulo-form-gasto').textContent = 'Editando Gasto';
        document.getElementById('titulo-form-gasto').parentNode.classList.add('edit-mode');
        UI.toggleForm('panel-form-gasto', 'btn-add-gasto', true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ==========================================
// MÓDULO 5: GENERADOR DE REPORTES (PDF Y HTML)
// ==========================================
const ReportGenerator = {
    generate: (format) => {
        const vehiculo = DataManager.getActive();
        if (!vehiculo) { alert("No hay ningún vehículo seleccionado."); return; }

        const config = {
            resumen: document.getElementById('chk-resumen').checked,
            inversores: document.getElementById('chk-inversores').checked,
            gastos: document.getElementById('chk-gastos').checked,
            distribucion: document.getElementById('chk-distribucion').checked
        };

        const totalAportes = Calc.getTotalAportes(vehiculo);
        const totalGastos = Calc.getTotalGastos(vehiculo);
        const dineroARepartir = Calc.getDineroARepartir(vehiculo);

        let htmlContent = `
            <div id="print-area" style="font-family: Arial, sans-serif; color: #333; max-width: 900px; margin: 0 auto; background: white; padding: 20px;">
                <h1 style="color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Reporte del Negocio</h1>
                
                <div style="font-size: 1.1rem; color: #475569; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 5px solid #1e3a8a;">
                    <strong>Placa:</strong> ${vehiculo.placa} <br>
                    <strong>Marca:</strong> ${vehiculo.marca || 'N/A'} | <strong>Modelo (Año):</strong> ${vehiculo.modelo || 'N/A'}<br>
                    <strong>Tránsito:</strong> ${vehiculo.transito || 'N/A'} <br>
                    <strong>Observaciones:</strong> ${vehiculo.observaciones || 'Ninguna'}
                </div>
        `;

        const tableStyle = `width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; table-layout: fixed; word-wrap: break-word;`;
        const thStyle = `background-color: #f8fafc; padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;`;
        const tdStyle = `padding: 8px; border: 1px solid #ddd; text-align: left;`;

        if (config.resumen) {
            htmlContent += `
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; justify-content: space-between;">
                    <div style="flex: 1;">
                        <p style="margin: 5px 0;">Total Aportado: <strong>${Calc.formatMoney(totalAportes)}</strong></p>
                        <p style="margin: 5px 0;">Total Gastos: <strong>${Calc.formatMoney(totalGastos)}</strong></p>
                        <p style="margin: 5px 0;">Fondo Restante: <strong>${Calc.formatMoney(totalAportes - totalGastos)}</strong></p>
                    </div>
                    <div style="flex: 1; border-left: 2px solid #bfdbfe; padding-left: 15px;">
                        <p style="margin: 5px 0;">Fecha Venta: <strong>${Calc.formatDate(vehiculo.fechaVenta)}</strong></p>
                        <p style="margin: 5px 0;">Valor Venta: <strong>${Calc.formatMoney(vehiculo.valorVenta)}</strong></p>
                        <p style="margin: 5px 0; font-size: 1.1rem;">Dinero a Repartir: <strong>${Calc.formatMoney(dineroARepartir)}</strong></p>
                    </div>
                </div>
            `;
        }

        if (config.inversores && vehiculo.inversionistas.length > 0) {
            htmlContent += `<h2 style="color: #1e3a8a; font-size: 18px;">Inversionistas</h2><table style="${tableStyle}">
                <tr><th style="${thStyle}">Nombre</th><th style="${thStyle}">Aporte</th><th style="${thStyle}">%</th></tr>`;
            vehiculo.inversionistas.forEach(i => {
                const pct = totalAportes > 0 ? ((i.aporte/totalAportes)*100).toFixed(2) : 0;
                htmlContent += `<tr><td style="${tdStyle}">${i.nombre}</td><td style="${tdStyle}">${Calc.formatMoney(i.aporte)}</td><td style="${tdStyle}">${pct}%</td></tr>`;
            });
            htmlContent += `</table>`;
        }

        if (config.gastos && vehiculo.gastos.length > 0) {
            htmlContent += `<h2 style="color: #1e3a8a; font-size: 18px;">Gastos Registrados</h2><table style="${tableStyle}">
                <tr><th style="${thStyle}; width: 15%;">Fecha</th><th style="${thStyle}">Concepto</th><th style="${thStyle}">Valor</th></tr>`;
            vehiculo.gastos.forEach(g => {
                htmlContent += `<tr><td style="${tdStyle}">${Calc.formatDate(g.fecha)}</td><td style="${tdStyle}">${g.concepto}</td><td style="${tdStyle}">${Calc.formatMoney(g.valor)}</td></tr>`;
            });
            htmlContent += `<tr><td colspan="2" style="${tdStyle} text-align:right;"><strong>Total Gastos:</strong></td><td style="${tdStyle}"><strong>${Calc.formatMoney(totalGastos)}</strong></td></tr></table>`;
        }

        if (config.distribucion && vehiculo.inversionistas.length > 0) {
            let sumInv = 0, sumFalt = 0, sumRecibir = 0, sumGranTotal = 0;
            htmlContent += `<h2 style="color: #1e3a8a; font-size: 18px;">Distribución de Ganancias</h2><table style="${tableStyle}">
                <tr><th style="${thStyle}">Nombre</th><th style="${thStyle}">INVERSIÓN</th><th style="${thStyle}">FALTANTE</th><th style="${thStyle}">A Recibir</th><th style="${thStyle}">TOTAL</th></tr>`;
            
            vehiculo.inversionistas.forEach(inv => {
                const pct = totalAportes > 0 ? (inv.aporte / totalAportes) : 0;
                const gastosProporcionales = totalGastos * pct;
                const inversionPersona = Math.min(gastosProporcionales, inv.aporte);
                const faltantePersona = gastosProporcionales > inv.aporte ? (gastosProporcionales - inv.aporte) : 0;
                const valorARecibir = dineroARepartir * pct;
                const granTotalPersona = inversionPersona + valorARecibir;
                
                sumInv += inversionPersona; sumFalt += faltantePersona; sumRecibir += valorARecibir; sumGranTotal += granTotalPersona;
                
                htmlContent += `<tr><td style="${tdStyle}">${inv.nombre}</td><td style="${tdStyle} color:#ef4444;">${Calc.formatMoney(inversionPersona)}</td><td style="${tdStyle} color:#f59e0b;">${Calc.formatMoney(faltantePersona)}</td><td style="${tdStyle}">${Calc.formatMoney(valorARecibir)}</td><td style="${tdStyle} font-weight:bold; color:#1e3a8a;">${Calc.formatMoney(granTotalPersona)}</td></tr>`;
            });
            
            htmlContent += `<tr><td style="${tdStyle} text-align:right;"><strong>TOTALES:</strong></td><td style="${tdStyle} color:#ef4444;"><strong>${Calc.formatMoney(sumInv)}</strong></td><td style="${tdStyle} color:#f59e0b;"><strong>${Calc.formatMoney(sumFalt)}</strong></td><td style="${tdStyle}"><strong>${Calc.formatMoney(sumRecibir)}</strong></td><td style="${tdStyle} color:#1e3a8a;"><strong>${Calc.formatMoney(sumGranTotal)}</strong></td></tr></table>`;
        }

        htmlContent += `<p style="text-align:center; color:#777; margin-top:30px; font-size:12px;">Generado por App COMPRA - ${new Date().toLocaleDateString()}</p></div>`;

        if (format === 'html') {
            const blob = new Blob([`<html><head><meta charset="UTF-8"><title>Reporte ${vehiculo.placa}</title></head><body style="background:#f1f5f9; padding:20px;">${htmlContent}</body></html>`], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `Reporte_${vehiculo.placa}.html`;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
            const pdfContainer = document.getElementById('pdf-container');
            pdfContainer.innerHTML = htmlContent;
            pdfContainer.style.display = 'block'; 
            
            const opt = {
                margin:       10,
                filename:     `Reporte_${vehiculo.placa}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(pdfContainer.firstElementChild).save().then(() => {
                pdfContainer.style.display = 'none';
                pdfContainer.innerHTML = '';
            });
        }
    }
};

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', UI.init);