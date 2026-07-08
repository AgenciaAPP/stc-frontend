// CONFIGURACIÓN: Endpoint de conexión real con el backend de Vercel
const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

// VARIABLES GLOBALES DE SESIÓN SIMULADA
let currentUserRole = null; 
let currentUserData = null; 

// ARRAYS PARA ALMACENAR LOS MULTIRREGISTROS TEMPORALES
let listadoAcciones = [];
let listadoAsuntos = [];
let listadoSistemas = [];
let listadoDirectorio = [];

document.addEventListener('DOMContentLoaded', () => {
  
  // === CAPTURA DE PANELES/VISTAS PRINCIPALES (SPA) ===
  const viewWelcome = document.getElementById('view-welcome');
  const viewLogin = document.getElementById('view-login');
  const viewContratistaDashboard = document.getElementById('view-contratista-dashboard');
  const viewFormularioTransferencia = document.getElementById('view-formulario-transferencia');
  const viewFuncionarioDashboard = document.getElementById('view-funcionario-dashboard');

  // === BOTONES DE NAVEGACIÓN GENERAL ===
  const btnRoleContratista = document.getElementById('btn-role-contratista');
  const btnRoleFuncionario = document.getElementById('btn-role-funcionario');
  const btnBackToWelcome = document.getElementById('btn-back-to-welcome');
  const btnLogoutButtons = document.querySelectorAll('.btn-logout');
  const btnSavePreliminary = document.getElementById('btn-save-preliminary');

  // === ELEMENTOS DE LOGIN ===
  const loginTitle = document.getElementById('login-title');
  const loginInstruction = document.getElementById('login-instruction');
  const inputLoginCedula = document.getElementById('login-cedula');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const loginLoader = document.getElementById('login-loader');

  // === NAVEGACIÓN POR PESTAÑAS ===
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const btnEmpezar = document.getElementById('btn-empezar-diligenciamiento');

  // ==========================================
  // 1. CONTROL DE ENRUTAMIENTO (SPA)
  // ==========================================
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

  btnSavePreliminary.addEventListener('click', () => {
    alert('💾 ¡Progreso guardado preliminarmente!\n\nLos datos ingresados en las tablas y campos se han congelado en el estado actual del servidor. Puedes reanudar el diligenciamiento cuando desees.');
    switchView(viewContratistaDashboard);
  });

  // ==========================================
  // 2. ACCESO POR CÉDULA
  // ==========================================
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
          estado: "En Diligenciamiento"
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

  // ==========================================
  // 3. ENTRADA AL FORMULARIO Y PESTAÑAS LIBRES
  // ==========================================
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

  // ==========================================
  // 4. CONTROLADORES DE MODALES MULTIRREGISTRO
  // ==========================================
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

  // ENVÍO DE FORMULARIO: POP-UP ACCIONES
  document.getElementById('form-modal-acciones').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevaAccion = {
      proceso: document.getElementById('modal-acc-proceso').value,
      prioridad: document.getElementById('modal-acc-prioridad').value,
      productos: document.getElementById('modal-acc-productos').value,
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

  // ENVÍO DE FORMULARIO: POP-UP ASUNTOS (MAPPING ACTUALIZADO DE CAMPOS)
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

  // ENVÍO DE FORMULARIO: POP-UP SISTEMAS
  document.getElementById('form-modal-sistemas').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoSistema = {
      nombre: document.getElementById('modal-sis-nombre').value,
      tipo: document.getElementById('modal-sis-tipo').value,
      rol: document.getElementById('modal-sis-rol').value,
      estado: document.getElementById('modal-sis-estado').value
    };
    listadoSistemas.push(nuevoSistema);
    renderTableSistemas();
    document.getElementById('form-modal-sistemas').reset();
    closeModal('modal-sistemas');
  });

  // ENVÍO DE FORMULARIO: POP-UP DIRECTORIO
  document.getElementById('form-modal-directorio').addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContacto = {
      nombre: document.getElementById('modal-dir-nombre').value,
      entidad: document.getElementById('modal-dir-entidad').value,
      tel: document.getElementById('modal-dir-tel').value,
      correo: document.getElementById('modal-dir-correo').value,
      asunto: document.getElementById('modal-dir-asunto').value
    };
    listadoDirectorio.push(nuevoContacto);
    renderTableDirectorio();
    document.getElementById('form-modal-directorio').reset();
    closeModal('modal-directorio');
  });

  // ==========================================
  // 5. RENDEREAR TABLAS MULTIRREGISTRO
  // ==========================================
  function renderTableAcciones() {
    const tbody = document.getElementById('table-acciones-body');
    tbody.innerHTML = '';
    if(listadoAcciones.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center">No se han agregado registros.</td></tr>`;
      return;
    }
    listadoAcciones.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.proceso}</strong></td>
        <td><span class="badge ${item.prioridad === 'Alta' ? 'badge-danger' : 'badge-alert'}">${item.prioridad}</span></td>
        <td>${item.productos}</td>
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

  // Actualizado para reflejar las nuevas claves semánticas de Asuntos
  function renderTableAsuntos() { 
    renderTableGeneric('table-asuntos-body', listadoAsuntos, ['tramite', 'estado', 'entidad', 'accionesPendientes', 'fecha']); 
  }
  function renderTableSistemas() { renderTableGeneric('table-sistemas-body', listadoSistemas, ['nombre', 'tipo', 'rol', 'estado']); }
  function renderTableDirectorio() { renderTableGeneric('table-directorio-body', listadoDirectorio, ['nombre', 'entidad', 'tel', 'correo', 'asunto']); }

  // CONSOLIDAR TODO Y FINALIZAR
  document.getElementById('btn-submit-final').addEventListener('click', () => {
    alert('🔒 ¡CONTRATO FINALIZADO CON ÉXITO INSTITUCIONAL!\n\nTu Acta de Transferencia ha sido compilada con todos sus multirregistros. Se ha cerrado el canal de edición y enviado la notificación a tu supervisor (Edison Alexander Montoya) para la firma digital del PDF.');
    switchView(viewWelcome);
  });

  // ==========================================
  // 6. DASHBOARD DE FUNCIONARIOS
  // ==========================================
  function poblarTablaSeguimientoFuncionarios() {
    const tbody = document.getElementById('table-tracking-body');
    const registrosEjemplo = [
      { name: "Cynthia Giraldo Gil", contract: "PS2026001", boss: "EDISON MONTOYA", status: "EN DILIGENCIAMIENTO" },
      { name: "Andrés Moreira Fuentes", contract: "PS2026045", boss: "DIRECTOR TÉCNICO", status: "FINALIZADO" }
    ];

    tbody.innerHTML = '';
    registrosEjemplo.forEach(reg => {
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
