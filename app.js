const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

let currentUserRole = null; 
let currentUserData = null; 
let isReadOnlyMode = false; // Variable global de control de flujo de visualización

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

  btnRoleContratista.addEventListener('click', () => {
    currentUserRole = 'contratista';
    loginTitle.innerText = 'INGRESAR COMO CONTRATISTA';
    loginInstruction.innerText = 'Introduce tu número de cédula para acceder a tu Acta de Transferencia de Conocimiento.';
    inputLoginCedula.value = '';
    switchView(viewLogin);
  });

  btnRoleFuncionario.addEventListener('click', () => {
    currentUserRole = 'funcionario';
    loginTitle.innerText = 'INGRESAR COMO FUNCIONARIO';
    loginInstruction.innerText = 'Acceso exclusivo para Talento Humano, Dirección Técnica y Supervisores de la Agencia APP.';
    inputLoginCedula.value = '';
    switchView(viewLogin);
  });

  // CONTROL INTERMUTADOR EN EL BOTÓN REGRESAR / SALIR (SOLUCIÓN PUNTO 2)
  btnBackToWelcome.addEventListener('click', () => {
    if (isReadOnlyMode) {
      // Si estaba auditando, lo devuelve seguro a su mesa de control institucional
      switchView(viewFuncionarioDashboard);
    } else {
      // Si es el contratista saliendo de su panel normal
      switchView(viewWelcome);
    }
  });

  btnLogoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentUserRole = null;
      currentUserData = null;
      isReadOnlyMode = false;
      switchView(viewWelcome);
    });
  });

  btnSavePreliminary.addEventListener('click', async () => {
    await enviarActaASharePoint(false);
  });

  btnSubmitLogin.addEventListener('click', async () => {
    const cedula = inputLoginCedula.value.trim();
    if (!cedula) {
      alert('Por favor, ingresa tu número de documento.');
      return;
    }

    loginLoader.classList.remove('hidden');
    btnSubmitLogin.disabled = true;

    try {
      if (currentUserRole === 'contratista') {
        const response = await fetch(`${BACKEND_URL}/api/login-contratista?cedula=${encodeURIComponent(cedula)}`);
        const resData = await response.json();

        if (resData.success && resData.exists) {
          currentUserData = {
            idSharePoint: resData.idSharePoint,
            cedula: cedula,
            nombre: resData.nombre,
            contract: resData.contract,
            objeto: resData.objeto,
            estado: resData.estado,
            correo: resData.correo,
            dependencia: resData.dependencia
          };

          document.getElementById('welcome-contratista').innerText = `BIENVENIDO(A), ${currentUserData.nombre.toUpperCase()}`;
          document.getElementById('dash-num-contrato').innerText = currentUserData.contract;
          document.getElementById('dash-objeto-contrato').innerText = currentUserData.objeto;
          
          const labelEstado = document.getElementById('dash-estado-acta');
          labelEstado.innerText = currentUserData.estado.toUpperCase();
          labelEstado.className = currentUserData.estado === 'Finalizado' ? "badge badge-success" : "badge badge-alert";
          
          isReadOnlyMode = false;
          switchView(viewContratistaDashboard);
        } else {
          alert('❌ Tu documento no se encuentra registrado ni habilitado por Talento Humano.');
        }
      } else if (currentUserRole === 'funcionario') {
        const badgeRol = document.getElementById('badge-rol-funcionario');
        const sectionTH = document.getElementById('section-th-actions');

        if (cedula === '123') {
          badgeRol.innerText = 'Perfil: Talento Humano (Superusuario)';
          sectionTH.classList.remove('hidden');
        } else {
          badgeRol.innerText = 'Perfil: Supervisor / Dirección Técnica';
          sectionTH.classList.add('hidden');
        }

        await consultarContratosEnVivo();
        switchView(viewFuncionarioDashboard);
      }
    } catch (error) {
      alert('❌ Ocurrió un error consultando la autenticación central.');
    } finally {
      loginLoader.classList.add('hidden');
      btnSubmitLogin.disabled = false;
    }
  });

  btnEmpezar.addEventListener('click', () => {
    isReadOnlyMode = false;
    ajustarModoLecturaFormulario(false);

    document.getElementById('cedula').value = currentUserData.cedula;
    document.getElementById('nombreContratista').value = currentUserData.nombre;
    document.getElementById('numeroContrato').value = currentUserData.contract;
    document.getElementById('objetoContrato').value = currentUserData.objeto;
    document.getElementById('correoContratista').value = currentUserData.correo || '';
    document.getElementById('dependencia').value = currentUserData.dependencia || 'Dirección General';

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(pnl => pnl.classList.remove('active'));
    tabButtons[0].classList.add('active');
    document.getElementById('tab-general').classList.add('active');

    switchView(viewFormularioTransferencia);
  });

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      tabPanels.forEach(panel => panel.classList.remove('active'));
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  window.openModal = function(modalType) {
    if(isReadOnlyMode) return; // Bloqueo de adición en auditoría
    let targetId = '';
    if(modalType === 'modal-accion') targetId = 'modal-acciones';
    if(modalType === 'modal-asunto') targetId = 'modal-asuntos';
    if(modalType === 'modal-sistema') targetId = 'modal-sistemas';
    if(modalType === 'modal-directorio') targetId = 'modal-directorio';

    const modal = document.getElementById(targetId);
    if(modal) modal.classList.add('active');
  }

  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('active');
  }

  document.getElementById('form-modal-acciones').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevaAccion = {
      proceso: document.getElementById('modal-acc-proceso').value,
      prioridad: document.getElementById('modal-acc-prioridad').value,
      productos: document.getElementById('modal-acc-productos').value,
      accionConocimiento: document.getElementById('modal-acc-conocimiento')?.value || 'No registrada', 
      ejecucion: document.getElementById('modal-acc-ejecucion').value,
      fecha: document.getElementById('modal-acc-fecha').value,
      ruta: document.getElementById('modal-acc-ruta').value,
      obs: document.getElementById('modal-acc-obs').value || 'Ninguna'
    };
    listadoAcciones.push(nuevaAccion);
    renderTableAcciones();
    document.getElementById('form-modal-acciones').reset();
    closeModal('modal-acciones');
  });

  document.getElementById('form-modal-asuntos').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoAsunto = {
      tramite: document.getElementById('modal-asu-tramite').value,
      estado: document.getElementById('modal-asu-estado').value,
      entidad: document.getElementById('modal-asu-entidad').value,
      accionesPendientes: document.getElementById('modal-asu-acciones-pendientes').value,
      fecha: document.getElementById('modal-asu-fecha').value
    };
    listadoAsuntos.push(nuevoAsunto);
    renderTableAsuntos();
    document.getElementById('form-modal-asuntos').reset();
    closeModal('modal-asuntos');
  });

  document.getElementById('form-modal-sistemas').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoSistema = {
      nombre: document.getElementById('modal-sis-nombre').value,
      usuario: document.getElementById('modal-sis-usuario').value,
      contrasena: document.getElementById('modal-sis-pass').value,
      obs: document.getElementById('modal-sis-obs').value || 'Ninguna'
    };
    listadoSistemas.push(nuevoSistema);
    renderTableSistemas();
    document.getElementById('form-modal-sistemas').reset();
    closeModal('modal-sistemas');
  });

  document.getElementById('form-modal-directorio').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContacto = {
      nombre: document.getElementById('modal-dir-nombre').value,
      tel: document.getElementById('modal-dir-tel').value,
      correo: document.getElementById('modal-dir-correo').value,
      tipo: document.getElementById('modal-dir-tipo').value,
      entidad: document.getElementById('modal-dir-entidad').value,
      reco: document.getElementById('modal-dir-reco').value || 'Ninguna'
    };
    listadoDirectorio.push(nuevoContacto);
    renderTableDirectorio();
    document.getElementById('form-modal-directorio').reset();
    closeModal('modal-directorio');
  });

  function renderTableAcciones() {
    const tbody = document.getElementById('table-acciones-body');
    tbody.innerHTML = '';
    if(listadoAcciones.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted text-center">No se han agregado registros.</td></tr>`;
      return;
    }
    listadoAcciones.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.proceso}</strong></td>
        <td><span class="badge ${item.prioridad === 'Alta' ? 'badge-danger' : 'badge-alert'}">${item.prioridad}</span></td>
        <td>${item.productos}</td>
        <td>${item.accionConocimiento}</td>
        <td><small>${item.ejecucion}</small></td>
        <td><a href="${item.ruta}" target="_blank" class="btn-link">Ver repositorio</a></td>
        <td><small>${item.obs}</small></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderTableGeneric(elementId, dataset, fields) {
    const tbody = document.getElementById(elementId);
    tbody.innerHTML = '';
    if(dataset.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${fields.length}" class="text-muted text-center">No se han agregado registros.</td></tr>`;
      return;
    }
    dataset.forEach(item => {
      const tr = document.createElement('tr');
      let html = '';
      fields.forEach(f => {
        html += `<td>${item[f]}</td>`;
      });
      tr.innerHTML = html;
      tbody.appendChild(tr);
    });
  }

  function renderTableAsuntos() { renderTableGeneric('table-asuntos-body', listadoAsuntos, ['tramite', 'estado', 'entidad', 'accionesPendientes', 'fecha']); }
  function renderTableSistemas() { renderTableGeneric('table-sistemas-body', listadoSistemas, ['nombre', 'usuario', 'contrasena', 'obs']); }
  function renderTableDirectorio() { renderTableGeneric('table-directorio-body', listadoDirectorio, ['nombre', 'tel', 'correo', 'tipo', 'entidad', 'reco']); }

  document.getElementById('btn-buscar-secop').addEventListener('click', async () => {
    const contratoInput = document.getElementById('search-contrato').value.trim();
    const loader = document.getElementById('secop-loader');
    const resultBox = document.getElementById('secop-result-box');

    if (!contratoInput) {
      alert('⚠️ Por favor, ingresa una referencia de contrato primero.');
      return;
    }

    loader.classList.remove('hidden');
    resultBox.classList.add('hidden');

    try {
      const response = await fetch(`${BACKEND_URL}/api/buscar-secop?contract=${encodeURIComponent(contratoInput)}`);
      const data = await response.json();

      if (data.success) {
        document.getElementById('secop-res-nombre').textContent = data.nombre;
        document.getElementById('secop-res-cedula').textContent = data.cedula;
        document.getElementById('secop-res-objeto').textContent = data.objeto;

        window.contratoTemporalValidado = {
          cedula: data.cedula,
          nombre: data.nombre,
          contrato: contratoInput,
          objeto: data.objeto,
          nombreSupervisor: data.nombreSupervisor,
          cedulaSupervisor: data.cedulaSupervisor,
          fechaInicio: data.fechaFirma
        };

        resultBox.classList.remove('hidden');
      } else {
        alert(`❌ ${data.message || 'Contrato no encontrado.'}`);
      }
    } catch (error) {
      alert('❌ Hubo un problema al conectarse con el servidor.');
    } finally {
      loader.classList.add('hidden');
    }
  });

  document.getElementById('btn-confirmar-habilitacion').addEventListener('click', async () => {
    if (window.contratoTemporalValidado) {
      const payloadHabilitar = {
        contrato: window.contratoTemporalValidado.contrato,
        contratista: window.contratoTemporalValidado.nombre,
        cedula: window.contratoTemporalValidado.cedula,
        objeto: window.contratoTemporalValidado.objeto,
        supervisor: window.contratoTemporalValidado.nombreSupervisor,
        fechaInicio: window.contratoTemporalValidado.fechaInicio
      };

      try {
        const response = await fetch(`${BACKEND_URL}/api/habilitar-contrato`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadHabilitar)
        });
        const resData = await response.json();

        if (resData.success) {
          alert('🎉 ¡CONTRATO INYECTADO EN SHAREPOINT CON ÉXITO INSTITUCIONAL!');
          await consultarContratosEnVivo();
          document.getElementById('secop-result-box').classList.add('hidden');
          document.getElementById('search-contrato').value = '';
        } else {
          alert(`❌ Error: ${resData.message}`);
        }
      } catch (error) {
        alert('❌ Error de comunicación.');
      }
    }
  });

  async function consultarContratosEnVivo() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/contratos`);
      const resData = await response.json();
      if (resData.success) {
        listadoMonitoreo = resData.data;
        poblarTablaSeguimientoFuncionarios();
      }
    } catch (e) {
      console.error("Error cargando monitoreo", e);
    }
  }

  async function enviarActaASharePoint(isFinalSubmit) {
    const payload = {
      idSharePoint: currentUserData.idSharePoint, 
      datosGenerales: {
        cedula: document.getElementById('cedula').value,
        nombreContratista: document.getElementById('nombreContratista').value,
        numeroContrato: document.getElementById('numeroContrato').value,
        supervisor: document.getElementById('supervisor').value,
        objetoContrato: document.getElementById('objetoContrato').value,
        correoContratista: document.getElementById('correoContratista').value,
        dependencia: document.getElementById('dependencia').value,
        lineamientos: document.getElementById('lineamientos').value,
        recomendacionesAcciones: document.getElementById('recomendaciones-acciones').value,
        isFinal: isFinalSubmit
      },
      acciones: listadoAcciones,
      asuntos: listadoAsuntos,
      sistemas: listadoSistemas,
      directorio: listadoDirectorio
    };

    if (!payload.datosGenerales.correoContratista || !payload.datosGenerales.dependencia) {
      alert('⚠️ Por favor completa el Correo Electrónico y la Dependencia.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/save-acta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await response.json();

      if (resData.success) {
        if (isFinalSubmit) {
          alert('🔒 ¡CONTRATO FINALIZADO E INYECTADO EN SHAREPOINT CON ÉXITO!');
          switchView(viewWelcome);
        } else {
          alert('💾 ¡Progreso guardado (PATCH) con éxito en SharePoint!');
          switchView(viewContratistaDashboard);
        }
      } else {
        alert('❌ Error actualizando campos.');
      }
    } catch (error) {
      alert('❌ Error de comunicación backend.');
    }
  }

  document.getElementById('btn-submit-final').addEventListener('click', async () => {
    await enviarActaASharePoint(true);
  });

  function ajustarModoLecturaFormulario(isReadOnly) {
    const inputs = viewFormularioTransferencia.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
      if(el.id !== 'btn-back-to-welcome') {
        el.disabled = isReadOnly;
      }
    });
    
    const btnSave = document.getElementById('btn-save-preliminary');
    const btnSubmit = document.getElementById('btn-submit-final');
    // Ocultar botones de acción masiva de edición en los popups de adición
    const btnAdders = viewFormularioTransferencia.querySelectorAll('.btn-add-row');
    
    if(isReadOnly) {
      if(btnSave) btnSave.classList.add('hidden');
      if(btnSubmit) btnSubmit.classList.add('hidden');
      btnAdders.forEach(b => b.classList.add('hidden'));
    } else {
      if(btnSave) btnSave.classList.remove('hidden');
      if(btnSubmit) btnSubmit.classList.remove('hidden');
      btnAdders.forEach(b => b.classList.remove('hidden'));
    }
  }

  function poblarTablaSeguimientoFuncionarios() {
    const tbody = document.getElementById('table-tracking-body');
    tbody.innerHTML = '';
    
    if (listadoMonitoreo.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay actas registradas en SharePoint.</td></tr>`;
      return;
    }

    listadoMonitoreo.forEach((reg, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${reg.name || 'Sin nombre'}</strong></td>
        <td>${reg.contract}</td>
        <td>${reg.boss || 'Sin asignar'}</td>
        <td><span class="badge ${reg.status === 'FINALIZADO' ? 'badge-success' : 'badge-alert'}">${reg.status}</span></td>
        <td>
          <button class="btn-action-view" data-index="${index}">👁️ Ver</button>
          ${reg.status === 'FINALIZADO' ? `<button class="btn-action-pdf" data-index="${index}">📄 PDF</button>` : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-action-view').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = e.target.getAttribute('data-index');
        const actaSeleccionada = listadoMonitoreo[index];

        // ACTIVACIÓN DE MODO LECTURA AUDITORÍA
        isReadOnlyMode = true;
        ajustarModoLecturaFormulario(true);

        document.getElementById('cedula').value = actaSeleccionada.cedula || '';
        document.getElementById('nombreContratista').value = actaSeleccionada.name || '';
        document.getElementById('numeroContrato').value = actaSeleccionada.contract || '';
        document.getElementById('supervisor').value = actaSeleccionada.boss || '';
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        tabButtons[0].classList.add('active');
        document.getElementById('tab-general').classList.add('active');

        switchView(viewFormularioTransferencia);
      });
    });
  }
});
