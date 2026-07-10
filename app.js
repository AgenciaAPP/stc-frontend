const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

let currentUserRole = null; 
let currentUserData = null; 
let isReadOnlyMode = false; 
let loggedSupervisorCedula = ''; // Almacena de forma segura la cédula del supervisor o TH en sesión

let listadoAcciones = [];
let listadoAsuntos = [];
let listadoSistemas = [];
let listadoDirectorio = [];
let listadoMonitoreo = [];

document.addEventListener('DOMContentLoaded', () => {
  
  const viewWelcome = document.getElementById('view-welcome');
  const viewLogin = document.getElementById('view-login');
  const viewContratistaDashboard = document.getElementById('view-contratista-dashboard');
  const viewFormularioTransferencia = document.getElementById('view-formulario-transferencia');
  const viewFuncionarioDashboard = document.getElementById('view-funcionario-dashboard');

  const btnRoleContratista = document.getElementById('btn-role-contratista');
  const btnRoleFuncionario = document.getElementById('btn-role-funcionario');
  const btnBackToWelcome = document.getElementById('btn-back-to-welcome');
  const btnLogoutButtons = document.querySelectorAll('.btn-logout');
  const btnSavePreliminary = document.getElementById('btn-save-preliminary');

  const loginTitle = document.getElementById('login-title');
  const loginInstruction = document.getElementById('login-instruction');
  const inputLoginCedula = document.getElementById('login-cedula');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const loginLoader = document.getElementById('login-loader');

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const btnEmpezar = document.getElementById('btn-empezar-diligenciamiento');

  function switchView(targetView) {
    [viewWelcome, viewLogin, viewContratistaDashboard, viewFormularioTransferencia, viewFuncionarioDashboard].forEach(view => {
      if(view) view.classList.remove('active');
    });
    targetView.classList.add('active');
  }

  function limpiarCamposAuditoria() {
    listadoAcciones = []; listadoAsuntos = []; listadoSistemas = []; listadoDirectorio = [];
    renderTableAcciones(); renderTableAsuntos(); renderTableSistemas(); renderTableDirectorio();
    viewFormularioTransferencia.querySelectorAll('textarea, input').forEach(el => el.value = '');
  }

  function inyectarBotonRegresoAuditoria() {
    let btnExistente = document.getElementById('btn-regresar-auditoria-flotante');
    if (btnExistente) btnExistente.remove();

    if (isReadOnlyMode) {
      const btnRegresar = document.createElement('button');
      btnRegresar.id = 'btn-regresar-auditoria-flotante';
      btnRegresar.innerText = '⬅️ Volver al Panel de Monitoreo';
      btnRegresar.style.position = 'fixed'; btnRegresar.style.top = '20px'; btnRegresar.style.right = '20px'; btnRegresar.style.zIndex = '9999';
      btnRegresar.style.padding = '12px 20px'; btnRegresar.style.backgroundColor = '#0056b3'; btnRegresar.style.color = '#fff';
      btnRegresar.style.border = 'none'; btnRegresar.style.borderRadius = '5px'; btnRegresar.style.cursor = 'pointer'; btnRegresar.style.fontWeight = 'bold';
      btnRegresar.style.boxShadow = '0px 4px 6px rgba(0,0,0,0.1)';

      btnRegresar.addEventListener('click', (e) => {
        e.preventDefault(); isReadOnlyMode = false; btnRegresar.remove(); switchView(viewFuncionarioDashboard);
      });
      document.body.appendChild(btnRegresar);
    }
  }

  btnRoleContratista.addEventListener('click', () => {
    currentUserRole = 'contratista'; loginTitle.innerText = 'INGRESAR COMO CONTRATISTA'; inputLoginCedula.value = ''; switchView(viewLogin);
  });

  btnRoleFuncionario.addEventListener('click', () => {
    currentUserRole = 'funcionario'; loginTitle.innerText = 'INGRESAR COMO FUNCIONARIO'; inputLoginCedula.value = ''; switchView(viewLogin);
  });

  btnBackToWelcome.addEventListener('click', (e) => {
    e.preventDefault();
    let btnFlotante = document.getElementById('btn-regresar-auditoria-flotante'); if (btnFlotante) btnFlotante.remove();
    if (isReadOnlyMode) { isReadOnlyMode = false; switchView(viewFuncionarioDashboard); } else { switchView(viewWelcome); }
  });

  btnLogoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentUserRole = null; currentUserData = null; isReadOnlyMode = false; loggedSupervisorCedula = '';
      let btnFlotante = document.getElementById('btn-regresar-auditoria-flotante'); if (btnFlotante) btnFlotante.remove();
      switchView(viewWelcome);
    });
  });

  btnSavePreliminary.addEventListener('click', async () => { await enviarActaASharePoint(false); });

  // CORREGIDO: Flujo dinámico de autenticación restrictiva y ruteo dinámico con Cédula Maestra 123
  btnSubmitLogin.addEventListener('click', async () => {
    const cedula = inputLoginCedula.value.trim();
    if (!cedula) { alert('⚠️ Por favor, ingresa tu número de documento.'); return; }
    loginLoader.classList.remove('hidden'); btnSubmitLogin.disabled = true;

    try {
      if (currentUserRole === 'funcionario') {
        const sectionTH = document.getElementById('section-th-actions');
        loggedSupervisorCedula = cedula; // Guardamos temporalmente en sesión para evaluar la petición

        if (cedula === '123') {
          document.getElementById('badge-rol-funcionario').innerText = 'Perfil: Talento Humano (Superusuario)';
          if (sectionTH) sectionTH.classList.remove('hidden');
        } else {
          document.getElementById('badge-rol-funcionario').innerText = 'Perfil: Supervisor / Dirección Técnica';
          if (sectionTH) sectionTH.classList.add('hidden');
        }
        
        // El login depende directamente de la validación estricta del backend
        const loginExitoso = await consultarContratosEnVivo(); 
        if (loginExitoso) {
          switchView(viewFuncionarioDashboard);
        } else {
          loggedSupervisorCedula = ''; // Limpiamos credencial errónea si falla
        }
        return; 
      }

      if (currentUserRole === 'contratista') {
        const response = await fetch(`${BACKEND_URL}/api/login-contratista?cedula=${encodeURIComponent(cedula)}`);
        const resData = await response.json();

        if (resData.success && resData.exists) {
          currentUserData = {
            idSharePoint: resData.idSharePoint, cedula: cedula, nombre: resData.nombre, contract: resData.contract, objeto: resData.objeto,
            supervisor: resData.supervisor, estado: resData.estado, correo: resData.correo, dependencia: resData.dependencia,
            lineamientos: resData.lineamientos, recomendaciones: resData.recomendaciones
          };

          const respHijos = await fetch(`${BACKEND_URL}/api/obtener-detalles-hijos?cedula=${encodeURIComponent(cedula)}`);
          const dataHijos = await respHijos.json();
          if(dataHijos.success) {
            listadoAcciones = dataHijos.acciones || [];
            listadoAsuntos = dataHijos.asuntos || [];
            listadoSistemas = dataHijos.sistemas || [];
            listadoDirectorio = dataHijos.directorio || [];
          }

          document.getElementById('welcome-contratista').innerText = `BIENVENIDO(A), ${currentUserData.nombre.toUpperCase()}`;
          document.getElementById('dash-num-contrato').innerText = currentUserData.contract;
          document.getElementById('dash-objeto-contrato').innerText = currentUserData.objeto;
          
          const labelEstado = document.getElementById('dash-estado-acta');
          labelEstado.innerText = currentUserData.estado.toUpperCase();
          labelEstado.className = currentUserData.estado === 'Finalizado' ? "badge badge-success" : "badge badge-alert";
          
          isReadOnlyMode = false; switchView(viewContratistaDashboard);
        } else {
          alert('❌ Tu documento no se encuentra registrado ni habilitado por Talento Humano.');
        }
      }
    } catch (error) {
      alert('❌ Error consultando la pasarela de autenticación central.');
    } finally {
      loginLoader.classList.add('hidden'); btnSubmitLogin.disabled = false;
    }
  });

  // AJUSTADO: Validación dinámica de modo lectura inmediato si el contratista ya finalizó su acta
  btnEmpezar.addEventListener('click', () => {
    const yaFinalizado = currentUserData && currentUserData.estado === 'Finalizado';
    isReadOnlyMode = yaFinalizado; 
    ajustarModoLecturaFormulario(yaFinalizado);

    document.getElementById('cedula').value = currentUserData.cedula;
    document.getElementById('nombreContratista').value = currentUserData.nombre;
    document.getElementById('numeroContrato').value = currentUserData.contract;
    document.getElementById('objetoContrato').value = currentUserData.objeto;
    document.getElementById('supervisor').value = currentUserData.supervisor; 
    document.getElementById('correoContratista').value = currentUserData.correo || '';
    
    const selectDep = document.getElementById('dependencia');
    let valorDep = currentUserData.dependencia ? currentUserData.dependencia.trim() : 'Dirección General';
    if (!Array.from(selectDep.options).some(opt => opt.value === valorDep)) {
      const optNueva = document.createElement('option'); optNueva.value = valorDep; optNueva.text = valorDep; selectDep.add(optNueva);
    }
    selectDep.value = valorDep;

    document.getElementById('lineamientos').value = currentUserData.lineamientos || '';
    document.getElementById('recomendaciones-acciones').value = currentUserData.recomendaciones || '';

    renderTableAcciones(); renderTableAsuntos(); renderTableSistemas(); renderTableDirectorio();

    tabButtons.forEach(btn => btn.classList.remove('active')); tabPanels.forEach(pnl => pnl.classList.remove('active'));
    tabButtons[0].classList.add('active'); document.getElementById('tab-general').classList.add('active');

    switchView(viewFormularioTransferencia);
  });

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active');
      tabPanels.forEach(panel => panel.classList.remove('active')); document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  window.openModal = function(modalType) {
    if(isReadOnlyMode) return; 
    let targetId = '';
    if(modalType === 'modal-accion') targetId = 'modal-acciones';
    if(modalType === 'modal-asunto') targetId = 'modal-asuntos';
    if(modalType === 'modal-sistema') targetId = 'modal-sistemas';
    if(modalType === 'modal-directorio') targetId = 'modal-directorio';
    const modal = document.getElementById(targetId); if(modal) modal.classList.add('active');
  }

  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId); if(modal) modal.classList.remove('active');
  }

  document.getElementById('form-modal-acciones').addEventListener('submit', (e) => {
    e.preventDefault();
    listadoAcciones.push({
      proceso: document.getElementById('modal-acc-proceso').value, 
      prioridad: document.getElementById('modal-acc-prioridad').value,
      productos: document.getElementById('modal-acc-productos').value,
      accionConocimiento: document.getElementById('modal-acc-conocimiento')?.value || 'No registrada', 
      ejecucion: document.getElementById('modal-acc-ejecucion').value,
      fecha: document.getElementById('modal-acc-fecha').value,
      ruta: document.getElementById('modal-acc-ruta').value,
      obs: document.getElementById('modal-acc-obs').value || 'Ninguna'
    });
    renderTableAcciones(); document.getElementById('form-modal-acciones').reset(); closeModal('modal-acciones');
  });

  document.getElementById('form-modal-asuntos').addEventListener('submit', (e) => {
    e.preventDefault();
    listadoAsuntos.push({
      tramite: document.getElementById('modal-asu-tramite').value, estado: document.getElementById('modal-asu-estado').value, entidad: document.getElementById('modal-asu-entidad').value,
      accionesPendientes: document.getElementById('modal-asu-acciones-pendientes').value, fecha: document.getElementById('modal-asu-fecha').value
    });
    renderTableAsuntos(); document.getElementById('form-modal-asuntos').reset(); closeModal('modal-asuntos');
  });

  document.getElementById('form-modal-sistemas').addEventListener('submit', (e) => {
    e.preventDefault();
    listadoSistemas.push({ nombre: document.getElementById('modal-sis-nombre').value, usuario: document.getElementById('modal-sis-usuario').value, contrasena: document.getElementById('modal-sis-pass').value, obs: document.getElementById('modal-sis-obs').value || 'Ninguna' });
    renderTableSistemas(); document.getElementById('form-modal-sistemas').reset(); closeModal('modal-sistemas');
  });

  document.getElementById('form-modal-directorio').addEventListener('submit', (e) => {
    e.preventDefault();
    listadoDirectorio.push({ nombre: document.getElementById('modal-dir-nombre').value, tel: document.getElementById('modal-dir-tel').value, correo: document.getElementById('modal-dir-correo').value, tipo: document.getElementById('modal-dir-tipo').value, entidad: document.getElementById('modal-dir-entidad').value, reco: document.getElementById('modal-dir-reco').value || 'Ninguna' });
    renderTableDirectorio(); document.getElementById('form-modal-directorio').reset(); closeModal('modal-directorio');
  });

  // FUNCIONES DE ELIMINACIÓN LOCAL TRANSACCIONAL
  window.eliminarFilaAccion = function(index) {
    if(isReadOnlyMode) return;
    listadoAcciones.splice(index, 1); renderTableAcciones();
  };
  window.eliminarFilaAsunto = function(index) {
    if(isReadOnlyMode) return;
    listadoAsuntos.splice(index, 1); renderTableAsuntos();
  };
  window.eliminarFilaSistema = function(index) {
    if(isReadOnlyMode) return;
    listadoSistemas.splice(index, 1); renderTableSistemas();
  };
  window.eliminarFilaContacto = function(index) {
    if(isReadOnlyMode) return;
    listadoDirectorio.splice(index, 1); renderTableDirectorio();
  };

  // AJUSTADO: Renderizado robusto de 9 columnas incluyendo la columna transaccional de borrado
  function renderTableAcciones() {
    const tableContainer = document.getElementById('table-acciones-body').parentElement;
    
    tableContainer.innerHTML = `
      <thead>
        <tr>
          <th>PROCESO CLAVE</th>
          <th>PRIORIDAD</th>
          <th>PRODUCTOS ENTREGA</th>
          <th>ACCIÓN TRANSFERENCIA</th>
          <th>EVIDENCIAS Y EJECUCIÓN</th>
          <th>FECHA EJECUCIÓN</th>
          <th>RUTA REPOSITORIO</th>
          <th>OBSERVACIONES</th>
          ${!isReadOnlyMode ? '<th>ACCIONES</th>' : ''}
        </tr>
      </thead>
      <tbody id="table-acciones-body"></tbody>
    `;

    const tbody = document.getElementById('table-acciones-body');
    if(listadoAcciones.length === 0) { 
      tbody.innerHTML = `<tr><td colspan="${!isReadOnlyMode ? '9' : '8'}" class="text-center text-muted">Ningún registro agregado.</td></tr>`; 
      return; 
    }
    
    listadoAcciones.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.proceso}</strong></td>
        <td><span class="badge ${item.prioridad === 'Alta' ? 'badge-danger' : 'badge-alert'}">${item.prioridad}</span></td>
        <td>${item.productos}</td>
        <td>${item.accionConocimiento}</td>
        <td><small>${item.ejecucion}</small></td>
        <td><small>${item.fecha || 'Sin registrar'}</small></td>
        <td><small>${item.ruta || 'Sin registrar'}</small></td>
        <td><small>${item.obs}</small></td>
        ${!isReadOnlyMode ? `<td><button type="button" class="btn-delete-row" onclick="eliminarFilaAccion(${index})" style="background-color:#dc3545; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️ Eliminar</button></td>` : ''}
      `;
      tbody.appendChild(tr);
    });
  }

  // AJUSTADO: Inyección dinámica de botones de borrado para las subtablas genéricas
  function renderTableAsuntos() {
    const tbody = document.getElementById('table-asuntos-body');
    const thParent = tbody.parentElement.querySelector('thead tr');
    if(thParent && !thParent.querySelector('.col-action-head') && !isReadOnlyMode) {
      const th = document.createElement('th'); th.className = 'col-action-head'; th.innerText = 'ACCIONES'; thParent.appendChild(th);
    }
    tbody.innerHTML = '';
    if(listadoAsuntos.length === 0) { tbody.innerHTML = `<tr><td colspan="${!isReadOnlyMode ? '6' : '5'}" class="text-center text-muted">Ningún registro.</td></tr>`; return; }
    listadoAsuntos.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.tramite}</td><td>${item.estado}</td><td>${item.entidad}</td><td>${item.accionesPendientes}</td><td>${item.fecha}</td>
      ${!isReadOnlyMode ? `<td><button type="button" onclick="eliminarFilaAsunto(${index})" style="background-color:#dc3545; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️ Borrar</button></td>` : ''}`;
      tbody.appendChild(tr);
    });
  }

  function renderTableSistemas() {
    const tbody = document.getElementById('table-sistemas-body');
    const thParent = tbody.parentElement.querySelector('thead tr');
    if(thParent && !thParent.querySelector('.col-action-head') && !isReadOnlyMode) {
      const th = document.createElement('th'); th.className = 'col-action-head'; th.innerText = 'ACCIONES'; thParent.appendChild(th);
    }
    tbody.innerHTML = '';
    if(listadoSistemas.length === 0) { tbody.innerHTML = `<tr><td colspan="${!isReadOnlyMode ? '5' : '4'}" class="text-center text-muted">Ningún registro.</td></tr>`; return; }
    listadoSistemas.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.nombre}</td><td>${item.usuario}</td><td>${item.contrasena}</td><td>${item.obs}</td>
      ${!isReadOnlyMode ? `<td><button type="button" onclick="eliminarFilaSistema(${index})" style="background-color:#dc3545; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️ Borrar</button></td>` : ''}`;
      tbody.appendChild(tr);
    });
  }

  function renderTableDirectorio() {
    const tbody = document.getElementById('table-directorio-body');
    const thParent = tbody.parentElement.querySelector('thead tr');
    if(thParent && !thParent.querySelector('.col-action-head') && !isReadOnlyMode) {
      const th = document.createElement('th'); th.className = 'col-action-head'; th.innerText = 'ACCIONES'; thParent.appendChild(th);
    }
    tbody.innerHTML = '';
    if(listadoDirectorio.length === 0) { tbody.innerHTML = `<tr><td colspan="${!isReadOnlyMode ? '7' : '6'}" class="text-center text-muted">Ningún registro.</td></tr>`; return; }
    listadoDirectorio.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.nombre}</td><td>${item.tel}</td><td>${item.correo}</td><td>${item.tipo}</td><td>${item.entidad}</td><td>${item.reco}</td>
      ${!isReadOnlyMode ? `<td><button type="button" onclick="eliminarFilaContacto(${index})" style="background-color:#dc3545; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️ Borrar</button></td>` : ''}`;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('btn-buscar-secop').addEventListener('click', async () => {
    const contratoInput = document.getElementById('search-contrato').value.trim();
    const loader = document.getElementById('secop-loader'); const resultBox = document.getElementById('secop-result-box');
    if (!contratoInput) { alert('⚠️ Ingresa una referencia de contrato.'); return; }
    loader.classList.remove('hidden'); resultBox.classList.add('hidden');
    try {
      const response = await fetch(`${BACKEND_URL}/api/buscar-secop?contrato=${encodeURIComponent(contratoInput)}`);
      const data = await response.json();
      if (data.success) {
        document.getElementById('secop-res-nombre').textContent = data.nombre; document.getElementById('secop-res-cedula').textContent = data.cedula; document.getElementById('secop-res-objeto').textContent = data.objeto;
        window.contratoTemporalValidado = { 
          cedula: data.cedula, nombre: data.nombre, contract: contratoInput, objeto: data.objeto, 
          nombreSupervisor: data.nombreSupervisor, cedulaSupervisor: data.cedulaSupervisor, fechaInicio: data.fechaFirma 
        };
        resultBox.classList.remove('hidden');
      } else { alert(`❌ ${data.message || 'Contrato no encontrado.'}`); }
    } catch (error) { alert('❌ Error de comunicación.'); } finally { loader.classList.add('hidden'); }
  });

  document.getElementById('btn-confirmar-habilitacion').addEventListener('click', async () => {
    if (window.contratoTemporalValidado) {
      const p = { 
        contrato: window.contratoTemporalValidado.contract, 
        contratista: window.contratoTemporalValidado.nombre, 
        cedula: window.contratoTemporalValidado.cedula, 
        objeto: window.contratoTemporalValidado.objeto, 
        supervisor: window.contratoTemporalValidado.nombreSupervisor, 
        cedulaSupervisor: window.contratoTemporalValidado.cedulaSupervisor, 
        fechaInicio: window.contratoTemporalValidado.fechaInicio 
      };
      try {
        const response = await fetch(`${BACKEND_URL}/api/habilitar-contrato`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
        const resData = await response.json();
        if (resData.success) { alert('🎉 ¡CONTRATO INYECTADO EN SHAREPOINT CON ÉXITO!'); await consultarContratosEnVivo(); document.getElementById('secop-result-box').classList.add('hidden'); document.getElementById('search-contrato').value = ''; }
      } catch (error) { alert('❌ Error de comunicación.'); }
    }
  });

  async function consultarContratosEnVivo() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contratos?queryCedula=${encodeURIComponent(loggedSupervisorCedula)}`); 
      
      if (!response.ok) {
        const errData = await response.json();
        alert(`❌ ${errData.message || 'Acceso denegado.'}`);
        return false;
      }
      
      const resData = await response.json();
      if (resData.success) { 
        listadoMonitoreo = resData.data; 
        poblarTablaSeguimientoFuncionarios(); 
        return true;
      }
      return false;
    } catch (e) { 
      console.error(e);
      alert('❌ Error de red consultando la matriz de contratos.');
      return false;
    }
  }

  async function enviarActaASharePoint(isFinalSubmit) {
    const payload = {
      idSharePoint: currentUserData.idSharePoint, 
      datosGenerales: {
        cedula: document.getElementById('cedula').value, nombreContratista: document.getElementById('nombreContratista').value, numeroContrato: document.getElementById('numeroContrato').value,
        supervisor: document.getElementById('supervisor').value, objetoContrato: document.getElementById('objetoContrato').value, correoContratista: document.getElementById('correoContratista').value,
        dependencia: document.getElementById('dependencia').value, lineamientos: document.getElementById('lineamientos').value, recomendacionesAcciones: document.getElementById('recomendaciones-acciones').value,
        isFinal: isFinalSubmit
      },
      acciones: listadoAcciones, asuntos: listadoAsuntos, sistemas: listadoSistemas, directorio: listadoDirectorio
    };

    if (!payload.datosGenerales.correoContratista || !payload.datosGenerales.dependencia) { alert('⚠️ Por favor completa el Correo y la Dependencia.'); return; }

    try {
      const response = await fetch(`${BACKEND_URL}/api/save-acta`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const resData = await response.json();
      if (resData.success) {
        if (isFinalSubmit) { 
          alert('🔒 ¡ACTA FINALIZADA E INYECTADA CON ÉXITO!'); 
          currentUserData.estado = 'Finalizado'; // Forzado de estado local inmediato
          switchView(viewWelcome); 
        } else { 
          alert('💾 ¡Progreso preliminar guardado en SharePoint de forma persistente!'); 
          switchView(viewContratistaDashboard); 
        }
      } else {
        const detalleError = resData.detail ? (resData.detail.message || JSON.stringify(resData.detail)) : resData.message;
        alert(`❌ Error al guardar en SharePoint: ${detalleError}`);
      }
    } catch (error) { alert('❌ Error de comunicación.'); }
  }

  document.getElementById('btn-submit-final').addEventListener('click', async () => { await enviarActaASharePoint(true); });

  function ajustarModoLecturaFormulario(isReadOnly) {
    const inputs = viewFormularioTransferencia.querySelectorAll('input, select, textarea');
    inputs.forEach(el => { if(el.id !== 'btn-back-to-welcome') { el.disabled = isReadOnly; } });
    const btnSave = document.getElementById('btn-save-preliminary'); const btnSubmit = document.getElementById('btn-submit-final');
    const btnAdders = viewFormularioTransferencia.querySelectorAll('.btn-add-row');
    if(isReadOnly) {
      if(btnSave) btnSave.classList.add('hidden'); if(btnSubmit) btnSubmit.add('hidden'); btnAdders.forEach(b => b.classList.add('hidden'));
    } else {
      if(btnSave) btnSave.classList.remove('hidden'); if(btnSubmit) btnSubmit.classList.remove('hidden'); btnAdders.forEach(b => b.classList.remove('hidden'));
    }
  }

  function poblarTablaSeguimientoFuncionarios() {
    const tbody = document.getElementById('table-tracking-body'); tbody.innerHTML = '';
    if (listadoMonitoreo.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay actas registradas para este perfil de supervisión.</td></tr>`; return; }

    listadoMonitoreo.forEach((reg, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${reg.name || 'Sin nombre'}</strong></td><td>${reg.contract}</td><td>${reg.boss || 'Sin asignar'}</td><td><span class="badge ${reg.status === 'FINALIZADO' ? 'badge-success' : 'badge-alert'}">${reg.status}</span></td><td><button class="btn-action-view" data-index="${index}">👁️ Ver</button></td>`;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-action-view').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = e.target.getAttribute('data-index'); const actaSeleccionada = listadoMonitoreo[index];

        limpiarCamposAuditoria(); isReadOnlyMode = true; ajustarModoLecturaFormulario(true); inyectarBotonRegresoAuditoria();

        document.getElementById('cedula').value = actaSeleccionada.cedula || '';
        document.getElementById('nombreContratista').value = actaSeleccionada.name || '';
        document.getElementById('numeroContrato').value = actaSeleccionada.contract || '';
        document.getElementById('objetoContrato').value = actaSeleccionada.objeto || ''; 
        document.getElementById('supervisor').value = actaSeleccionada.boss || '';
        document.getElementById('correoContratista').value = actaSeleccionada.correo || ''; 
        document.getElementById('lineamientos').value = actaSeleccionada.lineamientos || '';
        document.getElementById('recomendaciones-acciones').value = actaSeleccionada.recomendaciones || '';
        
        const selectDep = document.getElementById('dependencia'); let valorDep = actaSeleccionada.dependencia ? actaSeleccionada.dependencia.trim() : 'Dirección General';
        if (!Array.from(selectDep.options).some(opt => opt.value === valorDep)) {
          const optNueva = document.createElement('option'); optNueva.value = valorDep; optNueva.text = valorDep; selectDep.add(optNueva);
        }
        selectDep.value = valorDep;

        const responseHijos = await fetch(`${BACKEND_URL}/api/obtener-detalles-hijos?cedula=${encodeURIComponent(actaSeleccionada.cedula)}`);
        const dataHijos = await responseHijos.json();
        if(dataHijos.success) {
          listadoAcciones = dataHijos.acciones || []; listadoAsuntos = dataHijos.asuntos || []; listadoSistemas = dataHijos.sistemas || []; listadoDirectorio = dataHijos.directorio || [];
          renderTableAcciones(); renderTableAsuntos(); renderTableSistemas(); renderTableDirectorio();
        }

        tabButtons.forEach(b => b.classList.remove('active')); tabPanels.forEach(p => p.classList.remove('active'));
        tabButtons[0].classList.add('active'); document.getElementById('tab-general').classList.add('active');

        switchView(viewFormularioTransferencia);
        setTimeout(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, 50);
      });
    });
  }
});
