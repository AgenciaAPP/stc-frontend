// CONFIGURACIÓN: Reemplaza esta URL por la de tu backend real desplegado en Vercel
const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

// VARIABLES GLOBALES DE SESIÓN SIMULADA
let currentUserRole = null; // 'contratista' o 'funcionario'
let currentUserData = null; // Guarda los datos del usuario logueado

document.addEventListener('DOMContentLoaded', () => {
  
  // === CAPTURA DE PANELES/VISTAS PRINCIPALES ===
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

  // === ELEMENTOS DE LOGIN ===
  const loginTitle = document.getElementById('login-title');
  const loginInstruction = document.getElementById('login-instruction');
  const inputLoginCedula = document.getElementById('login-cedula');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const loginLoader = document.getElementById('login-loader');

  // ==========================================
  // 1. CONTROL DE ENRUTAMIENTO (SPA VISTAS)
  // ==========================================
  function switchView(targetView) {
    // Ocultar todos los paneles principales
    [viewWelcome, viewLogin, viewContratistaDashboard, viewFormularioTransferencia, viewFuncionarioDashboard].forEach(view => {
      if(view) view.classList.remove('active');
    });
    // Mostrar la vista deseada
    targetView.classList.add('active');
  }

  // Selección de Rol: Contratista
  btnRoleContratista.addEventListener('click', () => {
    currentUserRole = 'contratista';
    loginTitle.innerText = 'Ingreso para Contratistas';
    loginInstruction.innerText = 'Introduce tu número de cédula para acceder a tu Acta de Transferencia de Conocimiento.';
    inputLoginCedula.value = '';
    switchView(viewLogin);
  });

  // Selección de Rol: Funcionario
  btnRoleFuncionario.addEventListener('click', () => {
    currentUserRole = 'funcionario';
    loginTitle.innerText = 'Ingreso para Funcionarios';
    loginInstruction.innerText = 'Acceso exclusivo para Talento Humano, Dirección Técnica y Supervisores de la Agencia APP.';
    inputLoginCedula.value = '';
    switchView(viewLogin);
  });

  // Botón Volver al Inicio
  btnBackToWelcome.addEventListener('click', () => {
    switchView(viewWelcome);
  });

  // Botones de Cerrar Sesión (Logout)
  btnLogoutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentUserRole = null;
      currentUserData = null;
      switchView(viewWelcome);
    });
  });


  // ==========================================
  // 2. LOGIC DINÁMICA DE INGRESO (LOGIN POR CÉDULA)
  // ==========================================
  btnSubmitLogin.addEventListener('click', () => {
    const cedula = inputLoginCedula.value.trim();
    if (!cedula) {
      alert('Por favor, ingresa tu número de documento.');
      return;
    }

    loginLoader.classList.remove('hidden');
    btnSubmitLogin.disabled = true;

    // SIMULACIÓN TÉCNICA DE ACCESO (Mientras conectamos con listas de SharePoint)
    setTimeout(() => {
      loginLoader.classList.add('hidden');
      btnSubmitLogin.disabled = false;

      if (currentUserRole === 'contratista') {
        // Simulamos que la cédula ingresada ya fue habilitada previamente por TH
        currentUserData = {
          cedula: cedula,
          nombre: "Cynthia Giraldo Gil",
          contrato: "PS2026001",
          objeto: "Prestación de servicios profesionales para el apoyo en la planeación, gestión, control y seguimiento del sistema presupuestal de la Agencia APP",
          estado: "En Diligenciamiento"
        };

        // Poblar Dashboard del Contratista
        document.getElementById('welcome-contratista').innerText = `Bienvenido(a), ${currentUserData.nombre}`;
        document.getElementById('dash-num-contrato').innerText = currentUserData.contrato;
        document.getElementById('dash-objeto-contrato').innerText = currentUserData.objeto;
        document.getElementById('dash-estado-acta').innerText = currentUserData.estado;
        
        switchView(viewContratistaDashboard);

      } else if (currentUserRole === 'funcionario') {
        // Lógica de perfiles por Cédula (Ejemplo didáctico)
        const badgeRol = document.getElementById('badge-rol-funcionario');
        const sectionTH = document.getElementById('section-th-actions');

        if (cedula === '123') { // Simulamos Cédula de Talento Humano
          badgeRol.innerText = 'Perfil: Talento Humano (Superusuario)';
          badgeRol.style.backgroundColor = '#1e3a8a';
          sectionTH.classList.remove('hidden'); // TH puede ver el buscador de SECOP II
        } else { // Cualquier otra cédula actúa como Supervisor / Dirección
          badgeRol.innerText = 'Perfil: Supervisor / Dirección Técnica';
          badgeRol.style.backgroundColor = '#0f766e';
          sectionTH.classList.add('hidden'); // Supervisores no habilitan, solo auditan
        }

        poblarTablaSeguimientoFuncionarios();
        switchView(viewFuncionarioDashboard);
      }
    }, 1000);
  });


  // ==========================================
  // 3. MÓDULO CONTRATISTA: ACCESO AL FORMULARIO Y PESTAÑAS
  // ==========================================
  const btnEmpezar = document.getElementById('btn-empezar-diligenciamiento');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  btnEmpezar.addEventListener('click', () => {
    // Autocompletamos los campos protegidos de la pestaña 1 con los datos de sesión simulada
    document.getElementById('cedula').value = currentUserData.cedula;
    document.getElementById('nombreContratista').value = currentUserData.nombre;
    document.getElementById('numeroContrato').value = currentUserData.contrato;
    document.getElementById('objetoContrato').value = currentUserData.objeto;
    document.getElementById('supervisor').value = "EDISON ALEXANDER MONTOYA VELEZ";

    switchView(viewFormularioTransferencia);
  });

  // Manejo visual interno de clics en pestañas (Tabs)
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const targetTab = button.getAttribute('data-tab');

      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      tabPanels.forEach(panel => panel.classList.remove('active'));
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // ENVIAR PESTAÑA 1 -> DESBLOQUEAR PESTAÑA 2
  document.getElementById('form-general').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡Paso 1 Guardado! Datos generales registrados temporalmente.');
    document.getElementById('tab-nav-acciones').disabled = false;
    document.getElementById('tab-nav-acciones').click();
  });

  // ENVIAR PESTAÑA 2 -> DESBLOQUEAR PESTAÑA 3
  document.getElementById('form-acciones').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡Paso 2 Guardado! Actividades y logros almacenados.');
    document.getElementById('tab-nav-asuntos').disabled = false;
    document.getElementById('tab-nav-asuntos').click();
  });

  // ENVIAR PESTAÑA 3 -> DESBLOQUEAR PESTAÑA 4
  document.getElementById('form-asuntos').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡Paso 3 Guardado! Pendientes y alertas registradas.');
    document.getElementById('tab-nav-sistemas').disabled = false;
    document.getElementById('tab-nav-sistemas').click();
  });

  // FINALIZAR TODO (PESTAÑA 4)
  document.getElementById('form-sistemas').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡CONTRATO FINALIZADO EXITOSAMENTE!\n\nTu Acta de Transferencia de Conocimiento ha sido consolidada. Se ha bloqueado tu edición y se notificó a Talento Humano y a tu Supervisor para la generación del PDF oficial.');
    switchView(viewWelcome);
  });


  // ==========================================
  // 4. MÓDULO TALENTO HUMANO: BÚSQUEDA SECOP II (INTEGRADA)
  // ==========================================
  const btnBuscarSecop = document.getElementById('btn-buscar-secop');
  const inputBuscarContrato = document.getElementById('search-contrato');
  const secopLoader = document.getElementById('secop-loader');
  const secopResultBox = document.getElementById('secop-result-box');
  const btnConfirmarHabilitacion = document.getElementById('btn-confirmar-habilitacion');

  // Variables para congelar el contrato encontrado
  let contratoEncontradoGlobal = null;

  btnBuscarSecop.addEventListener('click', async () => {
    const numeroContrato = inputBuscarContrato.value.trim();
    if (!numeroContrato) {
      alert('Por favor, ingresa una referencia de contrato válida.');
      return;
    }

    secopLoader.classList.remove('hidden');
    secopResultBox.classList.add('hidden');
    btnBuscarSecop.disabled = true;

    try {
      const response = await fetch(`${BACKEND_URL}/api/buscar-secop?contrato=${encodeURIComponent(numeroContrato)}`);
      const resultado = await response.json();

      if (resultado.status === 'success') {
        contratoEncontradoGlobal = resultado.datos;

        // Pintamos el bloque informativo para que TH verifique antes de habilitar
        document.getElementById('secop-res-nombre').innerText = contratoEncontradoGlobal.nombreContratista;
        document.getElementById('secop-res-cedula').innerText = contratoEncontradoGlobal.documentoContratista;
        document.getElementById('secop-res-objeto').innerText = contratoEncontradoGlobal.objetoContrato;

        secopResultBox.classList.remove('hidden');
      } else {
        alert(`Atención: ${resultado.message}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión al consultar SECOP II.');
    } finally {
      secopLoader.classList.add('hidden');
      btnBuscarSecop.disabled = false;
    }
  });

  // Botón Acción: Crear registro y habilitar en plataforma
  btnConfirmarHabilitacion.addEventListener('click', () => {
    alert(`¡Éxito institucional!\n\nEl contratista ${contratoEncontradoGlobal.nombreContratista} con Cédula N° ${contratoEncontradoGlobal.documentoContratista} ha sido formalmente HABILITADO en la plataforma.\n\nYa puede ingresar usando su número de documento.`);
    secopResultBox.classList.add('hidden');
    inputBuscarContrato.value = '';
    poblarTablaSeguimientoFuncionarios(); // Refrescar tablero informativo
  });


  // ==========================================
  // 5. RENDEREAR TABLA DE MONITOREO (TH / SUPERVISORES)
  // ==========================================
  function poblarTablaSeguimientoFuncionarios() {
    const tbody = document.getElementById('table-tracking-body');
    
    // MOCK DATA DE SEGUIMIENTO (Datos simulados del estado de la Agencia APP)
    const registrosEjemplo = [
      { nombre: "Cynthia Giraldo Gil", contrato: "PS2026001", supervisor: "EDISON MONTOYA", estado: "En Diligenciamiento", claseBadge: "badge-alert" },
      { nombre: "Andrés Moreira Fuentes", contrato: "PS2026045", supervisor: "DIRECTOR TÉCNICO", estado: "Finalizado", claseBadge: "badge-success" }
    ];

    tbody.innerHTML = '';

    registrosEjemplo.forEach(reg => {
      const tr = document.createElement('tr');
      
      // Armar la botonera condicional (Si está finalizado muestra el ojo y el PDF)
      let accionesHTML = `<button class="btn-action-view" onclick="alert('Abriendo vista de Solo Lectura para inspeccionar las pestañas de ${reg.nombre}...')">👁️ Ver</button>`;
      if (reg.estado === "Finalizado") {
        accionesHTML += ` <button class="btn-action-pdf" onclick="alert('Generando y descargando el Acta de Transferencia en PDF consolidada...')">📄 PDF</button>`;
      }

      tr.innerHTML = `
        <td><strong>${reg.nombre}</strong></td>
        <td>${reg.contrato}</td>
        <td><small>${reg.supervisor}</small></td>
        <td><span class="badge ${reg.claseBadge}">${reg.estado}</span></td>
        <td>${accionesHTML}</td>
      `;
      tbody.appendChild(tr);
    });
  }

});
