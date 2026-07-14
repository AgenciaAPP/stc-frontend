const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

let currentUserRole = null; 
let currentUserData = null; 
let isReadOnlyMode = false; 
let loggedSupervisorCedula = ''; 
let loggedSupervisorPin = '';    

let listadoAcciones = [];
let listadoAsuntos = [];
let listadoSistemas = [];
let listadoDirectorio = [];
let listadoMonitoreo = [];

// VARIABLES GLOBALES PARA EL CONTROL DE EDICIÓN SEGURO
let editIndexAccion = -1;
let editIndexAsunto = -1;
let editIndexSistema = -1;
let editIndexDirectorio = -1;

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
  const btnDescargarPDFGlobal = document.getElementById('btn-descargar-pdf-global');

  const loginTitle = document.getElementById('login-title');
  const loginInstruction = document.getElementById('login-instruction');
  const inputLoginCedula = document.getElementById('login-cedula');
  const inputLoginPin = document.getElementById('login-pin');
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
    editIndexAccion = -1; editIndexAsunto = -1; editIndexSistema = -1; editIndexDirectorio = -1;
    renderTableAcciones(); renderTableAsuntos(); renderTableSistemas(); renderTableDirectorio();
    viewFormularioTransferencia.querySelectorAll('textarea, input').forEach(el => el.value = '');

    let btnReabrirExistente = document.getElementById('btn-reabrir-dinamico-supervisor');
    if(btnReabrirExistente) btnReabrirExistente.remove();

    let btnRegresarContratista = document.getElementById('btn-regresar-dinamico-contratista');
    if(btnRegresarContratista) btnRegresarContratista.remove();

    if(btnDescargarPDFGlobal) btnDescargarPDFGlobal.classList.add('hidden');
  }

  function inyectarBotonRegresoAuditoria() {
    let btnExistente = document.getElementById('btn-regresar-auditoria-flotante');
    if (btnExistente) btnExistente.remove();

    if (isReadOnlyMode && currentUserRole === 'funcionario') {
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
    currentUserRole = 'contratista'; loginTitle.innerText = 'INGRESAR COMO CONTRATISTA'; inputLoginCedula.value = ''; if(inputLoginPin) inputLoginPin.value = ''; switchView(viewLogin);
  });

  btnRoleFuncionario.addEventListener('click', () => {
    currentUserRole = 'funcionario'; loginTitle.innerText = 'INGRESAR COMO FUNCIONARIO'; inputLoginCedula.value = ''; if(inputLoginPin) inputLoginPin.value = ''; switchView(viewLogin);
  });

  btnBackToWelcome.addEventListener('click', (e) => {
    e.preventDefault();
    let btnFlotante = document.getElementById('btn-regresar-auditoria-flotante'); if (btnFlotante) btnFlotante.remove();
    let btnReabrirExistente = document.getElementById('btn-reabrir-dinamico-supervisor'); if(btnReabrirExistente) btnReabrirExistente.remove();
    let btnRegresarContratista = document.getElementById('btn-regresar-dinamico-contratista'); if(btnRegresarContratista) btnRegresarContratista.remove();
    
    if (isReadOnlyMode && currentUserRole === 'funcionario') { isReadOnlyMode = false; switchView(viewFuncionarioDashboard); } 
    else if (currentUserRole === 'contratista' && currentUserData !== null) { switchView(viewContratistaDashboard); }
    else { currentUserRole = null; currentUserData = null; switchView(viewWelcome); }
  });

  btnLogoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentUserRole = null; currentUserData = null; isReadOnlyMode = false; loggedSupervisorCedula = ''; loggedSupervisorPin = '';
      let btnFlotante = document.getElementById('btn-regresar-auditoria-flotante'); if (btnFlotante) btnFlotante.remove();
      let btnReabrirExistente = document.getElementById('btn-reabrir-dinamico-supervisor'); if(btnReabrirExistente) btnReabrirExistente.remove();
      let btnRegresarContratista = document.getElementById('btn-regresar-dinamico-contratista'); if(btnRegresarContratista) btnRegresarContratista.remove();
      switchView(viewWelcome);
    });
  });

  btnSavePreliminary.addEventListener('click', async () => { await enviarActaASharePoint(false); });

  btnSubmitLogin.addEventListener('click', async () => {
    const cedula = inputLoginCedula.value.trim();
    const pin = inputLoginPin ? inputLoginPin.value.trim() : '';
    
    if (!cedula) { alert('⚠️ Por favor, ingresa tu número de documento.'); return; }
    if (!pin) { alert('⚠️ Por favor, ingresa tu PIN de acceso de 4 dígitos.'); return; }
    
    loginLoader.classList.remove('hidden'); btnSubmitLogin.disabled = true;

    try {
      if (currentUserRole === 'funcionario') {
        const sectionTH = document.getElementById('section-th-actions');
        loggedSupervisorCedula = cedula; 
        loggedSupervisorPin = pin; 

        if (cedula === '123') {
          document.getElementById('badge-rol-funcionario').innerText = 'Perfil: Talento Humano (Superusuario)';
          if (sectionTH) sectionTH.classList.remove('hidden');
        } else {
          document.getElementById('badge-rol-funcionario').innerText = 'Perfil: Supervisor / Dirección Técnica';
          if (sectionTH) sectionTH.classList.add('hidden');
        }
        
        const loginExitoso = await consultarContratosEnVivo(); 
        if (loginExitoso) {
          switchView(viewFuncionarioDashboard);
        } else {
          loggedSupervisorCedula = ''; 
          loggedSupervisorPin = '';
        }
        return; 
      }

      if (currentUserRole === 'contratista') {
        const response = await fetch(`${BACKEND_URL}/api/login-contratista?cedula=${encodeURIComponent(cedula)}&pin=${encodeURIComponent(pin)}`);
        
        if (response.status === 401) {
          const errData = await response.json();
          alert(`❌ ${errData.message}`);
          return;
        }

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
          labelEstado.className = currentUserData.estado.toUpperCase() === 'FINALIZADO' ? "badge badge-success" : "badge badge-alert";
          
          switchView(viewContratistaDashboard);
        } else {
          alert('❌ Tu documento no se encuentra registrado ni habilitado por Talento Humano.');
        }
      }
    } catch (error) {
      alert('❌ Error consultando la pasarela de autenticación central o PIN incorrecto.');
    } finally {
      loginLoader.classList.add('hidden'); btnSubmitLogin.disabled = false;
    }
  });

  btnEmpezar.addEventListener('click', () => {
    const yaFinalizado = currentUserData && currentUserData.estado.toUpperCase() === 'FINALIZADO';
    isReadOnlyMode = yaFinalizado; 
    ajustarModoLecturaFormulario(yaFinalizado);

    if(yaFinalizado) {
      if(btnDescargarPDFGlobal) btnDescargarPDFGlobal.classList.remove('hidden');

      let btnSaveContainer = document.getElementById('btn-save-preliminary').parentElement;
      let btnRegresarExistente = document.getElementById('btn-regresar-dinamico-contratista');
      if(btnRegresarExistente) btnRegresarExistente.remove();

      let btnRegresarContratista = document.createElement('button');
      btnRegresarContratista.id = 'btn-regresar-dinamico-contratista'; btnRegresarContratista.type = 'button'; btnRegresarContratista.innerText = '⬅️ Volver al Tablero';
      btnRegresarContratista.style.padding = '10px 20px'; btnRegresarContratista.style.backgroundColor = '#6c757d'; btnRegresarContratista.style.color = '#fff'; btnRegresarContratista.style.border = 'none'; btnRegresarContratista.style.borderRadius = '4px'; btnRegresarContratista.style.fontWeight = 'bold'; btnRegresarContratista.style.cursor = 'pointer'; btnRegresarContratista.style.marginLeft = '10px';
      btnRegresarContratista.onclick = function() { btnRegresarContratista.remove(); switchView(viewContratistaDashboard); };
      btnSaveContainer.appendChild(btnRegresarContratista);
    } else {
      if(btnDescargarPDFGlobal) btnDescargarPDFGlobal.classList.add('hidden');
    }

    document.getElementById('cedula').value = currentUserData.cedula;
    document.getElementById('nombreContratista').value = currentUserData.nombre;
    document.getElementById('numeroContrato').value = currentUserData.contract;
    document.getElementById('objetoContrato').value = currentUserData.objeto;
    document.getElementById('supervisor').value = currentUserData.supervisor; 
    document.getElementById('correoContratista').value = currentUserData.correo || '';
    
    const selectDep = document.getElementById('dependencia');
    let valorDep = currentUserData.dependencia ? currentUserData.dependencia.trim() : 'Dirección General';
    if (!Array.from(selectDep.options).some(opt => opt.value === valorDep):) {
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
    editIndexAccion = -1; editIndexAsunto = -1; editIndexSistema = -1; editIndexDirectorio = -1;
  }

  document.getElementById('form-modal-acciones').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevaAccion = {
      proceso: document.getElementById('modal-acc-proceso').value, 
      prioridad: document.getElementById('modal-acc-prioridad').value, 
      productos: document.getElementById('modal-acc-productos').value,
      accionConocimiento: document.getElementById('modal-acc-conocimiento').value, 
      ejecucion: document.getElementById('modal-acc-ejecucion').value,
      fecha: document.getElementById('modal-acc-fecha').value, 
      ruta: document.getElementById('modal-acc-ruta').value, 
      obs: document.getElementById('modal-acc-obs').value || 'Ninguna'
    };
    if (editIndexAccion >= 0) { listadoAcciones[editIndexAccion] = nuevaAccion; editIndexAccion = -1; } else { listadoAcciones.push(nuevaAccion); }
    renderTableAcciones(); document.getElementById('form-modal-acciones').reset(); closeModal('modal-acciones');
  });

  document.getElementById('form-modal-asuntos').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoAsunto = {
      tramite: document.getElementById('modal-asu-tramite').value, estado: document.getElementById('modal-asu-estado').value, entidad: document.getElementById('modal-asu-entidad').value,
      accionesPendientes: document.getElementById('modal-asu-acciones-pendientes').value, fecha: document.getElementById('modal-asu-fecha').value
    };
    if (editIndexAsunto >= 0) { listadoAsuntos[editIndexAsunto] = nuevoAsunto; editIndexAsunto = -1; } else { listadoAsuntos.push(nuevoAsunto); }
    renderTableAsuntos(); document.getElementById('form-modal-asuntos').reset(); closeModal('modal-asuntos');
  });

  document.getElementById('form-modal-sistemas').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoSistema = { nombre: document.getElementById('modal-sis-nombre').value, usuario: document.getElementById('modal-sis-usuario').value, contrasena: document.getElementById('modal-sis-pass').value, obs: document.getElementById('modal-sis-obs').value || 'Ninguna' };
    if (editIndexSistema >= 0) { listadoSistemas[editIndexSistema] = nuevoSistema; editIndexSistema = -1; } else { listadoSistemas.push(nuevoSistema); }
    renderTableSistemas(); document.getElementById('form-modal-sistemas').reset(); closeModal('modal-sistemas');
  });

  document.getElementById('form-modal-directorio').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContacto = { nombre: document.getElementById('modal-dir-nombre').value, tel: document.getElementById('modal-dir-tel').value, correo: document.getElementById('modal-dir-correo').value, tipo: document.getElementById('modal-dir-tipo').value, entidad: document.getElementById('modal-dir-entidad').value, reco: document.getElementById('modal-dir-reco').value || 'Ninguna' };
    if (editIndexDirectorio >= 0) { listadoDirectorio[editIndexDirectorio] = nuevoContacto; editIndexDirectorio = -1; } else { listadoDirectorio.push(nuevoContacto); }
    renderTableDirectorio(); document.getElementById('form-modal-directorio').reset(); closeModal('modal-directorio');
  });

  window.eliminarFilaAccion = function(index) { if(!isReadOnlyMode) { listadoAcciones.splice(index, 1); renderTableAcciones(); } };
  window.eliminarFilaAsunto = function(index) { if(!isReadOnlyMode) { listadoAsuntos.splice(index, 1); renderTableAsuntos(); } };
  window.eliminarFilaSistema = function(index) { if(!isReadOnlyMode) { listadoSistemas.splice(index, 1); renderTableSistemas(); } };
  window.eliminarFilaContacto = function(index) { if(!isReadOnlyMode) { listadoDirectorio.splice(index, 1); renderTableDirectorio(); } };

  window.editarFilaAccion = function(index) {
    if(isReadOnlyMode) return;
    const item = listadoAcciones[index];
    editIndexAccion = index; 
    document.getElementById('modal-acc-proceso').value = item.proceso;
    document.getElementById('modal-acc-prioridad').value = item.prioridad;
    document.getElementById('modal-acc-productos').value = item.productos;
    if(document.getElementById('modal-acc-conocimiento')) document.getElementById('modal-acc-conocimiento').value = item.accionConocimiento || '';
    document.getElementById('modal-acc-ejecucion').value = item.ejecucion;
    document.getElementById('modal-acc-fecha').value = item.fecha;
    document.getElementById('modal-acc-ruta').value = item.ruta;
    document.getElementById('modal-acc-obs').value = item.obs === 'Ninguna' ? '' : item.obs;
    openModal('modal-accion');
  };

  window.editarFilaAsunto = function(index) {
    if(isReadOnlyMode) return;
    const item = listadoAsuntos[index];
    editIndexAsunto = index;
    document.getElementById('modal-asu-tramite').value = item.tramite;
    document.getElementById('modal-asu-estado').value = item.estado;
    document.getElementById('modal-asu-entidad').value = item.entidad;
    document.getElementById('modal-asu-acciones-pendientes').value = item.accionesPendientes;
    document.getElementById('modal-asu-fecha').value = item.fecha;
    openModal('modal-asunto');
  };

  window.editarFilaSistema = function(index) {
    if(isReadOnlyMode) return;
    const item = listadoSistemas[index];
    editIndexSistema = index;
    document.getElementById('modal-sis-nombre').value = item.nombre;
    document.getElementById('modal-sis-usuario').value = item.usuario;
    document.getElementById('modal-sis-pass').value = item.contrasena;
    document.getElementById('modal-sis-obs').value = item.obs === 'Ninguna' ? '' : item.obs;
    openModal('modal-sistema');
  };

  window.editarFilaContacto = function(index) {
    if(isReadOnlyMode) return;
    const item = listadoDirectorio[index];
    editIndexDirectorio = index;
    document.getElementById('modal-dir-nombre').value = item.nombre;
    document.getElementById('modal-dir-tel').value = item.tel;
    document.getElementById('modal-dir-correo').value = item.correo;
    document.getElementById('modal-dir-tipo').value = item.tipo;
    document.getElementById('modal-dir-entidad').value = item.entidad;
    document.getElementById('modal-dir-reco').value = item.reco === 'Ninguna' ? '' : item.reco;
    openModal('modal-directorio');
  };

  function renderTableAcciones() {
    const tableContainer = document.getElementById('table-acciones-body').parentElement;
    tableContainer.innerHTML = `
      <thead><tr><th>PROCESO CLAVE</th><th>PRIORIDAD</th><th>PRODUCTOS ENTREGA</th><th>ACCIÓN TRANSFERENCIA</th><th>EVIDENCIAS Y EJECUCIÓN</th><th>FECHA EJECUCIÓN</th><th>RUTA REPOSITORIO</th><th>OBSERVACIONES</th>${!isReadOnlyMode ? '<th>ACCIONES</th>' : ''}</tr></thead>
      <tbody id="table-acciones-body"></tbody>
    `;
    const tbody = document.getElementById('table-acciones-body');
    if(listadoAcciones.length === 0) { tbody.innerHTML = `<tr><td colspan="${!isReadOnlyMode ? '9' : '8'}" class="text-center text-muted">Ningún registro agregado.</td></tr>`; return; }
    listadoAcciones.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${item.proceso}</strong></td><td><span class="badge ${item.prioridad === 'Alta' ? 'badge-danger' : 'badge-alert'}">${item.prioridad}</span></td><td>${item.productos}</td><td><span class="badge badge-neutral" style="background-color:#e9ecef; color:#495057; font-weight:bold; padding:4px 8px; border-radius:4px; font-size:7.5px;">${item.accionConocimiento || 'No registrada'}</span></td><td><small>${item.ejecucion}</small></td><td><small>${item.fecha || 'Sin registrar'}</small></td><td><small>${item.ruta || 'Sin registrar'}</small></td><td><small>${item.obs}</small></td>
      ${!isReadOnlyMode ? `<td><button type="button" onclick="editarFilaAccion(${index})" style="background-color:#007bff; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; margin-right:4px;">✏️</button><button type="button" onclick="eliminarFilaAccion(${index})" style="background-color:#dc3545; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️</button></td>` : ''}`;
      tbody.appendChild(tr);
    });
  }

  function renderTableGenericWithActions(elementId, dataset, fields, editFn, deleteFn) {
    const tbody = document.getElementById(elementId);
    const thParent = tbody.parentElement.querySelector('thead tr');
    if(thParent && !thParent.querySelector('.col-action-head') && !isReadOnlyMode) {
      const th = document.createElement('th'); th.className = 'col-action-head'; th.innerText = 'ACCIONES'; thParent.appendChild(th);
    }
    tbody.innerHTML = '';
    if(dataset.length === 0) { tbody.innerHTML = `<tr><td colspan="${!isReadOnlyMode ? fields.length + 1 : fields.length}" class="text-center text-muted">Ningún registro.</td></tr>`; return; }
    dataset.forEach((item, index) => {
      const tr = document.createElement('tr'); let html = ''; fields.forEach(f => { html += `<td>${item[f]}</td>`; });
      if(!isReadOnlyMode) html += `<td><button type="button" onclick="${editFn}(${index})" style="background-color:#007bff; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; margin-right:4px;">✏️</button><button type="button" onclick="${deleteFn}(${index})" style="background-color:#dc3545; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️</button></td>`;
      tr.innerHTML = html; tbody.appendChild(tr);
    });
  }

  function renderTableAsuntos() { renderTableGenericWithActions('table-asuntos-body', listadoAsuntos, ['tramite', 'estado', 'entidad', 'accionesPendientes', 'fecha'], 'editarFilaAsunto', 'eliminarFilaAsunto'); }
  function renderTableSistemas() { renderTableGenericWithActions('table-sistemas-body', listadoSistemas, ['nombre', 'usuario', 'contrasena', 'obs'], 'editarFilaSistema', 'eliminarFilaSistema'); }
  function renderTableDirectorio() { renderTableGenericWithActions('table-directorio-body', listadoDirectorio, ['nombre', 'tel', 'correo', 'tipo', 'entidad', 'reco'], 'editarFilaContacto', 'eliminarFilaContacto'); }

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
        if (document.getElementById('secop-res-correo')) document.getElementById('secop-res-correo').value = '';
        window.contratoTemporalValidado = { cedula: data.cedula, nombre: data.nombre, contract: contratoInput, objeto: data.objeto, nombreSupervisor: data.nombreSupervisor, cedulaSupervisor: data.cedulaSupervisor, fechaInicio: data.fechaFirma };
        resultBox.classList.remove('hidden');
      } else { alert(`❌ ${data.message || 'Contrato no encontrado.'}`); }
    } catch (error) { alert('❌ Error de comunicación.'); } finally { loader.classList.remove('hidden'); }
  });

  document.getElementById('btn-confirmar-habilitacion').addEventListener('click', async () => {
    if (window.contratoTemporalValidado) {
      const correoIngresado = document.getElementById('secop-res-correo') ? document.getElementById('secop-res-correo').value.trim() : '';
      if (!correoIngresado) { alert('⚠️ Por favor ingresa el correo de notification del contratista.'); return; }

      const p = { 
        contrato: window.contratoTemporalValidado.contract, 
        contratista: window.contratoTemporalValidado.nombre, 
        cedula: window.contratoTemporalValidado.cedula, 
        objeto: window.contratoTemporalValidado.objeto, 
        supervisor: window.contratoTemporalValidado.nombreSupervisor, 
        cedulaSupervisor: window.contratoTemporalValidado.cedulaSupervisor, 
        fechaInicio: window.contratoTemporalValidado.fechaInicio,
        correoNotificacion: correoIngresado 
      };
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/habilitar-contrato`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
        const resData = await response.json();
        if (resData.success) { alert('🎉 ¡CONTRATO INYECTADO Y PIN NOTIFICADO CON ÉXITO AL CORREO!'); await consultarContratosEnVivo(); document.getElementById('secop-result-box').classList.add('hidden'); document.getElementById('search-contrato').value = ''; }
      } catch (error) { alert('❌ Error de comunicación.'); }
    }
  });

  async function consultarContratosEnVivo() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contratos?queryCedula=${encodeURIComponent(loggedSupervisorCedula)}&queryPin=${encodeURIComponent(loggedSupervisorPin)}`); 
      if (!response.ok) {
        const errData = await response.json(); alert(`❌ ${errData.message || 'Acceso denegado.'}`); return false;
      }
      const resData = await response.json();
      if (resData.success) { listadoMonitoreo = resData.data; poblarTablaSeguimientoFuncionarios(); return true; }
      return false;
    } catch (e) { alert('❌ Error de red consultando la matriz de contratos o credenciales inválidas.'); return false; }
  }

  window.reabrirActaSupervisor = async function(idSharePoint) {
    if(!confirm("¿Estás seguro de reabrir esta Acta? Esto le devolverá los permisos de edición al contratista.")) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/reabrir-acta`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idSharePoint }) });
      const resData = await response.json();
      if(resData.success) {
        alert("🔓 ¡Acta reabierta con éxito! El contratista ya puede ingresar a editar de nuevo.");
        let btnFlotante = document.getElementById('btn-regresar-auditoria-flotante'); if (btnFlotante) btnFlotante.remove();
        isReadOnlyMode = false; await consultarContratosEnVivo(); switchView(viewFuncionarioDashboard);
      }
    } catch (e) { alert("❌ Error reabriendo el acta en el servidor."); }
  };

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
          currentUserData.estado = 'FINALIZADO'; 
          switchView(viewWelcome); 
        } else { 
          alert('💾 ¡Progreso preliminar guardado en SharePoint de forma persistente!'); 
          switchView(viewContratistaDashboard); 
        }
      } else { alert(`❌ Error al guardar en SharePoint: ${resData.message}`); }
    } catch (error) { alert('❌ Error de comunicación.'); }
  }

  document.getElementById('btn-submit-final').addEventListener('click', async () => { await enviarActaASharePoint(true); });

  function ajustarModoLecturaFormulario(isReadOnly) {
    const inputs = viewFormularioTransferencia.querySelectorAll('input, select, textarea');
    inputs.forEach(el => { if(el.id !== 'btn-back-to-welcome') { el.disabled = isReadOnly; } });
    const btnSave = document.getElementById('btn-save-preliminary'); const btnSubmit = document.getElementById('btn-submit-final');
    const btnAdders = viewFormularioTransferencia.querySelectorAll('.btn-add-row');
    if(isReadOnly) {
      if(btnSave) btnSave.classList.add('hidden'); if(btnSubmit) btnSubmit.classList.add('hidden'); btnAdders.forEach(b => b.classList.add('hidden'));
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

        if(actaSeleccionada.status === 'FINALIZADO') {
          if(btnDescargarPDFGlobal) btnDescargarPDFGlobal.classList.remove('hidden');
        } else {
          if(btnDescargarPDFGlobal) btnDescargarPDFGlobal.classList.add('hidden');
        }

        if(actaSeleccionada.status === 'FINALIZADO' && currentUserRole === 'funcionario') {
          let btnSaveContainer = document.getElementById('btn-save-preliminary').parentElement;
          let btnReabrirExistente = document.getElementById('btn-reabrir-dinamico-supervisor');
          if(btnReabrirExistente) btnReabrirExistente.remove();
          
          let btnReabrir = document.createElement('button');
          btnReabrir.id = 'btn-reabrir-dinamico-supervisor'; btnReabrir.type = 'button'; btnReabrir.innerText = '🔓 Abrir Acta para Correcciones';
          btnReabrir.style.padding = '10px 20px'; btnReabrir.style.backgroundColor = '#ffc107'; btnReabrir.style.color = '#000'; btnReabrir.style.border = 'none'; btnReabrir.style.borderRadius = '4px'; btnReabrir.style.fontWeight = 'bold'; btnReabrir.style.cursor = 'pointer'; btnReabrir.style.marginLeft = '10px';
          btnReabrir.onclick = function() { reabrirActaSupervisor(actaSeleccionada.idSharePoint); };
          btnSaveContainer.appendChild(btnReabrir);
        }

        currentUserData = {
          cedula: actaSeleccionada.cedula,
          nombre: actaSeleccionada.name,
          contract: actaSeleccionada.contract,
          supervisor: actaSeleccionada.boss,
          objeto: actaSeleccionada.objeto,
          dependencia: actaSeleccionada.dependencia,
          estado: actaSeleccionada.status,
          lineamientos: actaSeleccionada.lineamientos,
          recomendaciones: actaSeleccionada.recomendaciones
        };

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

        tabButtons.forEach(b => b.classList.remove('active')); 
        tabPanels.forEach(p => p.classList.remove('active'));
        
        tabButtons[0].classList.add('active'); 
        document.getElementById('tab-general').classList.add('active');

        switchView(viewFormularioTransferencia);
        setTimeout(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, 50);
      });
    });
  }

  // =========================================================================
  // MOTOR DE GENERACIÓN PDF: MAQUETADO DE LA PLANTILLA OFICIAL FO-GITH-060
  // =========================================================================
  async function exportarFormatoOficialPDF() {
    if (!currentUserData) { alert("❌ No hay datos de contrato en memoria."); return; }

    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let htmlRowsAcciones = '';
    if(listadoAcciones.length === 0) {
      htmlRowsAcciones = `<tr><td colspan="7" style="border: 1px solid #000; padding: 4px; text-align:center; color:#555;">Ninguna acción de transferencia registrada.</td></tr>`;
    } else {
      listadoAcciones.forEach(item => {
        htmlRowsAcciones += `
          <tr>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.proceso}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; text-align:center;">${item.prioridad}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.productos}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.accionConocimiento}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.ejecucion}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; text-align:center;">${item.fecha || '---'}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; word-break:break-all; max-width:180px;">${item.ruta}</td>
          </tr>`;
      });
    }

    let htmlRowsAsuntos = '';
    if(listadoAsuntos.length === 0) {
      htmlRowsAsuntos = `<tr><td colspan="5" style="border: 1px solid #000; padding: 4px; text-align:center; color:#555;">Ningún asunto pendiente registrado.</td></tr>`;
    } else {
      listadoAsuntos.forEach(item => {
        htmlRowsAsuntos += `
          <tr>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.tramite}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; text-align:center;">${item.estado}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.entidad}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.accionesPendientes}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; text-align:center;">${item.fecha || '---'}</td>
          </tr>`;
      });
    }

    let htmlRowsSistemas = '';
    if(listadoSistemas.length === 0) {
      htmlRowsSistemas = `<tr><td colspan="4" style="border: 1px solid #000; padding: 4px; text-align:center; color:#555;">Ningún acceso a sistemas registrado.</td></tr>`;
    } else {
      listadoSistemas.forEach(item => {
        htmlRowsSistemas += `
          <tr>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.nombre}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.usuario}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.contrasena}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.obs || 'Ninguna'}</td>
          </tr>`;
      });
    }

    let htmlRowsDirectorio = '';
    if(listadoDirectorio.length === 0) {
      htmlRowsDirectorio = `<tr><td colspan="6" style="border: 1px solid #000; padding: 4px; text-align:center; color:#555;">Ningún contacto clave registrado.</td></tr>`;
    } else {
      listadoDirectorio.forEach(item => {
        htmlRowsDirectorio += `
          <tr>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.nombre}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; text-align:center;">${item.tel}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.correo}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px; text-align:center;">${item.tipo}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.entidad}</td>
            <td style="border:1px solid #000; padding:4px; font-size:8px;">${item.reco || 'Ninguna'}</td>
          </tr>`;
      });
    }

    const elementoImpresion = document.createElement('div');
    elementoImpresion.style.padding = '2px';
    elementoImpresion.innerHTML = `
      <style>
          /* MARGEN SUPERIOR DE 36mm RESERVADO EXCLUSIVAMENTE PARA ACOMODAR EL ENCABEZADO VECTORIAL FIJO */
          @page { size: letter landscape; margin: 36mm 10mm 15mm 10mm; }
          
          /* RESET Y CONTROL DE CAJA COMPLETO */
          * { box-sizing: border-box !important; -webkit-box-sizing: border-box !important; }
          
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #000000; line-height: 1.3; font-size: 9px; }
          
          /* CONTENEDOR MAESTRO DE DATOS */
          .contenedor-impresion-raiz { width: 97.5%; margin: 0 auto; padding-top: 2px; }
          
          /* PROTECCIÓN TOTAL CONTRA CORTES HORIZONTALES EN FILAS MULTILÍNEA */
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          
          /* Estilos de Bloques y Tablas de Datos */
          .header-bloque { background-color: #F2F2F2; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 9px; padding: 4px; border: 1px solid #000000; margin-top: 10px; margin-bottom: 0px; page-break-inside: avoid !important; break-inside: avoid !important; }
          table.datos-tabla { width: 100%; border-collapse: collapse; margin-bottom: 0px; table-layout: fixed; }
          table.datos-tabla td, table.datos-tabla th { border: 1px solid #000000; padding: 4px; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; word-break: break-all !important; }
          table.datos-tabla th { background-color: #F2F2F2; font-weight: bold; text-align: center; font-size: 8px; }
          .label-fija { font-weight: bold; background-color: #F2F2F2; width: 15%; }
          .nota-pie { border: 1px solid #000000; padding: 6px; font-size: 8px; font-weight: bold; margin-top: 15px; text-align: justify; page-break-inside: avoid !important; break-inside: avoid !important; }
      </style>

      <div class="contenedor-impresion-raiz">
          <table class="datos-tabla">
              <tr>
                  <td class="label-fija" style="width: 15%;">Contrato No.</td>
                  <td style="font-weight: bold; width: 35%; color: #1e3a8a;">${currentUserData.contract || '---'}</td>
                  <td class="label-fija" style="width: 15%;">Supervisor</td>
                  <td style="width: 35%;">${currentUserData.supervisor || '---'}</td>
              </tr>
              <tr>
                  <td class="label-fija">Objeto contractual</td>
                  <td colspan="3" style="text-align: justify;">${currentUserData.objeto || '---'}</td>
              </tr>
              <tr>
                  <td class="label-fija">Fecha de inicio del contrato</td>
                  <td>---</td>
                  <td class="label-fija">Dependencia (Dirección o Subdirección)</td>
                  <td>${currentUserData.dependencia || '---'}</td>
              </tr>
              <tr>
                  <td class="label-fija">Contratista</td>
                  <td>${currentUserData.nombre || '---'}</td>
                  <td class="label-fija">Fecha de diligenciamiento</td>
                  <td>${fechaHoy}</td>
              </tr>
              <tr>
                  <td class="label-fija">NIT/CC</td>
                  <td colspan="3">${currentUserData.cedula || '---'}</td>
              </tr>
          </table>

          <div class="header-bloque">Acciones de Transferencia de Conocimiento del Contratista</div>
          <table class="datos-tabla">
              <thead>
                  <tr>
                      <th style="width:20%;">Proceso clave</th>
                      <th style="width:7%;">Prioridad</th>
                      <th style="width:15%;">Productos entrega</th>
                      <th style="width:15%;">Acción transferencia</th>
                      <th style="width:20%;">Evidencias / Ejecución</th>
                      <th style="width:8%;">Fecha</th>
                      <th style="width:15%;">Ruta Repositorio</th>
                  </tr>
              </thead>
              <tbody>${htmlRowsAcciones}</tbody>
          </table>

          <div class="header-bloque">Asuntos Pendientes o en Trámite</div>
          <table class="datos-tabla">
              <thead>
                  <tr>
                      <th style="width: 25%;">Asunto pendiente o en trámite</th>
                      <th style="width: 12%;">Estado Actual</th>
                      <th style="width: 20%;">Entidad / Dependencia</th>
                      <th style="width: 31%;">Acciones pendientes por realizar</th>
                      <th style="width: 12%;">Fecha Límite</th>
                  </tr>
              </thead>
              <tbody>${htmlRowsAsuntos}</tbody>
          </table>

          <div class="header-bloque">Accesos a Sistemas / Aplicativos</div>
          <table class="datos-tabla">
              <thead>
                  <tr>
                      <th style="width: 25%;">Sistema / aplicativo</th>
                      <th style="width: 20%;">Usuario</th>
                      <th style="width: 20%;">Contraseña</th>
                      <th style="width: 35%;">Observaciones</th>
                  </tr>
              </thead>
              <tbody>${htmlRowsSistemas}</tbody>
          </table>

          <div class="header-bloque">Directorio de Contactos Claves Relacionados con el Alcance del Contrato</div>
          <table class="datos-tabla">
              <thead>
                  <tr>
                      <th style="width: 20%;">Nombre</th>
                      <th style="width: 12%;">Teléfono</th>
                      <th style="width: 18%;">Email</th>
                      <th style="width: 15%;">Tipo de contacto</th>
                      <th style="width: 15%;">Entidad / dependencia</th>
                      <th style="width: 20%;">Recomendaciones</th>
                  </tr>
              </thead>
              <tbody>${htmlRowsDirectorio}</tbody>
          </table>

          <div class="header-bloque">Lineamientos Técnicos, Normativos u Operativos Esenciales</div>
          <table class="datos-tabla">
              <tr><td style="padding: 6px; text-align: justify; min-height: 45px; white-space: pre-line;">${document.getElementById('lineamientos').value || 'Ninguno registrado.'}</td></tr>
          </table>

          <div class="header-bloque">Recomendaciones y Observaciones</div>
          <table class="datos-tabla">
              <tr><td style="padding: 6px; text-align: justify; min-height: 60px; white-space: pre-line;">${document.getElementById('recomendaciones-acciones').value || 'Ninguna recomendación registrada.'}</td></tr>
          </table>

          <table class="datos-tabla" style="margin-top: 30px; border: none; width:100%; page-break-inside: avoid !important; break-inside: avoid !important;">
              <tr style="border: none;">
                  <td style="width: 50%; border: none; padding-top: 25px; font-size:9px;">Firma contratista: ___________________________</td>
                  <td style="width: 50%; border: none; padding-top: 25px; font-size:9px;">C.C./NIT: ___________________________</td>
              </tr>
              <tr style="border: none;">
                  <td colspan="2" style="border: none; padding-top: 4px; font-weight: bold; font-size:9px;">Nombre del Contratista: ${currentUserData.nombre.toUpperCase()}</td>
              </tr>
              <tr style="border: none;">
                  <td style="width: 50%; border: none; padding-top: 25px; font-size:9px;">Firma supervisor: ___________________________</td>
                  <td style="width: 50%; border: none; padding-top: 25px; font-size:9px;">C.C. ___________________________</td>
              </tr>
              <tr style="border: none;">
                  <td colspan="2" style="border: none; padding-top: 4px; font-weight: bold; font-size:9px;">Nombre del Supervisor del Contrato: ${currentUserData.supervisor.toUpperCase()}</td>
              </tr>
              <tr style="border: none;">
                  <td style="width: 50%; border: none; padding-top: 25px; font-size:9px;">Firma del servidor Público del nivel directivo: ___________________________</td>
                  <td style="width: 50%; border: none; padding-top: 25px; font-size:9px;">C.C. ___________________________</td>
              </tr>
              <tr style="border: none;">
                  <td colspan="2" style="border: none; padding-top: 4px; font-weight: bold; font-size:9px;">Nombre del servidor Público del nivel directivo: ____________________________________________________</td>
              </tr>
          </table>

          <div class="nota-pie">
              Nota: Este formato debidamente diligenciado debe ser remitido por el supervisor junto con las evidencias de la transferencia del conocimiento . Las evidencias de las acciones de transferencia deberán ser almacenadas en la carpeta asignada por el supervisor la cual deberá ser almacenada en el OneDrive.
          </div>
      </div>
    `;

    // CONFIGURACIÓN DE MÁRGENES FÍSICOS COMPATIBLES CON LA REPETICIÓN VECTORIAL NATIVA
    const opcionesConfig = {
      margin:       [36, 10, 15, 10],
      filename:     `FO-GITH-060_STC_${currentUserData.contract}_${currentUserData.cedula}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'landscape' }
    };

    // Pre-cargar el logo institucional nítido desde raw.githubusercontent sin problemas de CORS
    const logoImg = new Image();
    logoImg.crossOrigin = "Anonymous";
    logoImg.src = "https://raw.githubusercontent.com/AgenciaAPP/Imagenes-Varias/main/logoappencabezado.png";

    logoImg.onload = function() {
      html2pdf().set(opcionesConfig).from(elementoImpresion).toPdf().get('pdf').then(function(pdf) {
        const totalPaginas = pdf.internal.getNumberOfPages();
        
        for (let i = 1; i <= totalPaginas; i++) {
          pdf.setPage(i);
          
          // --- STAMP DE ENCABEZADO OFICIAL REPETITIVO REFACTORIZADO POR COORDENADAS ARQUITECTÓNICAS BIEN ALINEADAS ---
          pdf.setFillColor(255, 255, 255);
          pdf.rect(11.5, 7, 256, 22, 'F'); // Limpieza del lienzo superior
          
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.25);
          pdf.rect(11.5, 7, 256, 22);   // Cuadro exterior maestro negro
          pdf.line(58.5, 7, 58.5, 29);   // Separador del logo
          pdf.line(201.5, 7, 201.5, 29); // Separador de metadatos derechos
          pdf.line(58.5, 18, 201.5, 18); // División horizontal interna central

          // Posicionamiento centrado y proporcional del logotipo oficial
          pdf.addImage(logoImg, 'PNG', 13.5, 8.5, 43, 19);

          // Inyección central del Proceso y el Formato (Centrado exacto en eje X: 130)
          pdf.setFont("Helvetica", "Bold");
          pdf.setFontSize(8.5);
          pdf.text("PROCESO", 130, 11, { align: "center" });
          pdf.text("GESTIÓN INTEGRAL DEL TALENTO HUMANO", 130, 15, { align: "center" });
          
          pdf.text("FORMATO", 130, 22, { align: "center" });
          pdf.setFontSize(6.5);
          pdf.text("TRANSFERENCIA DE CONOCIMIENTO GENERADO EN EL MARCO DE CONTRATOS CON PERSONAS NATURALES O JURÍDICAS", 130, 26, { align: "center" });

          // Inyección alineada a la izquierda dentro del recuadro derecho de metadatos (Inicio X: 203.5)
          pdf.setFont("Helvetica", "Bold");
          pdf.setFontSize(7.5);
          pdf.text("Código: FO-GITH-060", 203.5, 12);
          
          pdf.line(201.5, 15.5, 267.5, 15.5); // Línea horizontal interna de metadatos derecha
          pdf.text("Versión: 1", 203.5, 19.5);
          
          pdf.line(201.5, 22.5, 267.5, 22.5); // Línea horizontal interna baja de metadatos derecha
          pdf.setFontSize(6.5);
          pdf.text("Fecha de entrada en vigencia: 08/05/2026", 203.5, 26.5);

          // --- PIE DE PÁGINA NATIVO ---
          pdf.setFont("Helvetica", "Normal");
          pdf.setFontSize(8);
          pdf.text(`Página ${i} de ${totalPaginas}`, 267.5, 205, { align: "right" });
        }
      }).save();
    };
  }

  if(btnDescargarPDFGlobal) {
    pdfGlobal = document.getElementById('btn-descargar-pdf-global');
    if(pdfGlobal) {
      pdfGlobal.addEventListener('click', exportarFormatoOficialPDF);
    }
  }
});
