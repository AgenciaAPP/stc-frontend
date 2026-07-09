const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

let currentUserRole = null; 
let currentUserData = null; 

let listadoAcciones = [];
let listadoAsuntos = [];
let listadoSistemas = [];
let listadoDirectorio = [];

let listadoMonitoreo = [
  { name: "Cynthia Giraldo Gil", contract: "PS2026001", boss: "EDISON MONTOYA", status: "EN DILIGENCIAMIENTO" },
  { name: "Andrés Moreira Fuentes", contract: "PS2026045", boss: "DIRECTOR TÉCNICO", status: "FINALIZADO" }
];

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

  btnBackToWelcome.addEventListener('click', () => switchView(viewWelcome));

  btnLogoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentUserRole = null;
      currentUserData = null;
      switchView(viewWelcome);
    });
  });

  btnSavePreliminary.addEventListener('click', async () => {
    await enviarActaASharePoint(false);
  });

  btnSubmitLogin.addEventListener('click', () => {
    const cedula = inputLoginCedula.value.trim();
    if (!cedula) {
      alert('Por favor, ingresa tu número de documento.');
      return;
    }

    loginLoader.classList.remove('hidden');
    btnSubmitLogin.disabled = true;

    setTimeout(() => {
      loginLoader.classList.add('hidden');
      btnSubmitLogin.disabled = false;

      if (currentUserRole === 'contratista') {
        currentUserData = {
          cedula: cedula,
          nombre: "Cynthia Giraldo Gil",
          contract: "PS2026001",
          objeto: "Prestación de servicios profesionales para el apoyo en la planeación, gestión, control y seguimiento del sistema presupuestal de la Agencia APP",
          estado: "En Diligenciamiento",
          fechaInicio: "2026-01-15"
        };

        document.getElementById('welcome-contratista').innerText = `BIENVENIDO(A), ${currentUserData.nombre.toUpperCase()}`;
        document.getElementById('dash-num-contrato').innerText = currentUserData.contract;
        document.getElementById('dash-objeto-contrato').innerText = currentUserData.objeto;
        
        const labelEstado = document.getElementById('dash-estado-acta');
        labelEstado.innerText = currentUserData.estado.toUpperCase();
        labelEstado.className = "badge badge-alert";
        
        switchView(viewContratistaDashboard);

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

        poblarTablaSeguimientoFuncionarios();
        switchView(viewFuncionarioDashboard);
      }
    }, 1200);
  });

  btnEmpezar.addEventListener('click', () => {
    document.getElementById('cedula').value = currentUserData.cedula;
    document.getElementById('nombreContratista').value = currentUserData.nombre;
    document.getElementById('numeroContrato').value = currentUserData.contract;
    document.getElementById('objetoContrato').value = currentUserData.objeto;
    document.getElementById('supervisor').value = "EDISON ALEXANDER MONTOYA VELEZ";

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

  // ENVÍO DE FORMULARIO: POP-UP ACCIONES ADAPTADO A LA NUEVA COLUMNA OBLIGATORIA
  document.getElementById('form-modal-acciones').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevaAccion = {
      proceso: document.getElementById('modal-acc-proceso').value,
      prioridad: document.getElementById('modal-acc-prioridad').value,
      productos: document.getElementById('modal-acc-productos').value,
      // INCLUSIÓN TÉCNICA DEL NUEVO CAMPO TEXTO ADICIONAL REQUERIDO
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

  // ==========================================
  // 6. CONEXIÓN EN VIVO: CONSULTA SECOP II
  // ==========================================
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
      const response = await fetch(`${BACKEND_URL}/api/buscar-secop?contrato=${encodeURIComponent(contratoInput)}`);
      const data = await response.json();

      if (data.success) {
        document.getElementById('secop-res-nombre').textContent = data.nombre;
        document.getElementById('secop-res-cedula').textContent = data.cedula;
        document.getElementById('secop-res-objeto').textContent = data.objeto;

        // CORRECCIÓN CLAVE: Se unificó el nombre de la variable global a 'contratoTemporalValidado'
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
        alert(`❌ ${data.message || 'Contrato no encontrado en los registros de la Agencia APP.'}`);
      }
    } catch (error) {
      console.error('Error al consultar SECOP:', error);
      alert('❌ Hubo un problema al conectarse con el servidor de la Agencia APP.');
    } finally {
      loader.classList.add('hidden');
    }
  });

  // CONFIRMAR HABILITACIÓN SÍNCRONA CORREGIDA
  document.getElementById('btn-confirmar-habilitacion').addEventListener('click', () => {
    if (window.contratoTemporalValidado) {
      
      const existe = listadoMonitoreo.some(reg => reg.contract === window.contratoTemporalValidado.contrato);
      
      if (!existe) {
        listadoMonitoreo.push({
          name: window.contratoTemporalValidado.nombre,
          contract: window.contratoTemporalValidado.contrato,
          boss: window.contratoTemporalValidado.nombreSupervisor.toUpperCase(),
          status: "EN DILIGENCIAMIENTO",
          cedulaSupervisor: window.contratoTemporalValidado.cedulaSupervisor,
          fechaInicio: window.contratoTemporalValidado.fechaInicio
        });
      }

      alert(`🎉 ¡ÉXITO INSTITUCIONAL!\n\nLa cédula ${window.contratoTemporalValidado.cedula} asociada al contrato ${window.contratoTemporalValidado.contrato} ha sido autorizada en este módulo técnico.\n\nEl supervisor asignado es: ${window.contratoTemporalValidado.nombreSupervisor}.`);
      
      poblarTablaSeguimientoFuncionarios();
      
      document.getElementById('secop-result-box').classList.add('hidden');
      document.getElementById('search-contrato').value = '';
    }
  });

  // ==========================================
  // 7. CONEXIÓN EN VIVO: COMPILACIÓN & SINK SHAREPOINT
  // ==========================================
  async function enviarActaASharePoint(isFinalSubmit) {
    const payload = {
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
        fechaInicio: currentUserData?.fechaInicio || '',
        isFinal: isFinalSubmit
      },
      acciones: listadoAcciones,
      asuntos: listadoAsuntos,
      sistemas: listadoSistemas,
      directorio: listadoDirectorio
    };

    if (!payload.datosGenerales.correoContratista || !payload.datosGenerales.dependencia) {
      alert('⚠️ Por favor completa el Correo Electrónico y la Dependencia en la pestaña de Datos Generales.');
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
          alert('🔒 ¡CONTRATO FINALIZADO CON ÉXITO INSTITUCIONAL!\n\nTu Acta de Transferencia ha sido compilada e inyectada con todos sus multirregistros en SharePoint de la Agencia APP. Se cerró el canal de edición.');
          switchView(viewWelcome);
        } else {
          alert('💾 ¡Progreso guardado con éxito localmente!\n\nPuedes cerrar la pestaña y reanudar el diligenciamiento cuando desees.');
          switchView(viewContratistaDashboard);
        }
      } else {
        const detalleError = resData.detail ? (resData.detail.message || JSON.stringify(resData.detail)) : resData.message;
        alert(`❌ Error al guardar en SharePoint: ${detalleError}`);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Error crítico de comunicación con el backend de Vercel.');
    }
  }

  document.getElementById('btn-submit-final').addEventListener('click', async () => {
    await enviarActaASharePoint(true);
  });

  function poblarTablaSeguimientoFuncionarios() {
    const tbody = document.getElementById('table-tracking-body');
    tbody.innerHTML = '';
    
    listadoMonitoreo.forEach(reg => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${reg.name}</strong></td>
        <td>${reg.contract}</td>
        <td>${reg.boss}</td>
        <td><span class="badge ${reg.status === 'FINALIZADO' ? 'badge-success' : 'badge-alert'}">${reg.status}</span></td>
        <td>
          <button class="btn-action-view">👁️ Ver</button>
          ${reg.status === 'FINALIZADO' ? '<button class="btn-action-pdf">📄 PDF</button>' : ''}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
});
