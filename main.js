const BACKEND_URL = 'https://stc-backend-nine.vercel.app';

document.addEventListener('DOMContentLoaded', () => {
  
  // === CONTROL DE PESTAÑAS (TABS) ===
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // Cambiar estado activo en botones
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Cambiar estado activo en paneles
      tabPanels.forEach(panel => panel.classList.remove('active'));
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });

  // === CONSULTA INTELIGENTE SECOP II ===
  const btnBuscarSecop = document.getElementById('btn-buscar-secop');
  const inputBuscarContrato = document.getElementById('search-contrato');
  const secopLoader = document.getElementById('secop-loader');

  // Elementos del formulario a autocompletar
  const txtCedula = document.getElementById('cedula');
  const txtNombre = document.getElementById('nombreContratista');
  const txtNumeroContrato = document.getElementById('numeroContrato');
  const txtObjeto = document.getElementById('objetoContrato');
  const txtSupervisor = document.getElementById('supervisor');

  btnBuscarSecop.addEventListener('click', async () => {
    const numeroContrato = inputBuscarContrato.value.trim();

    if (!numeroContrato) {
      alert('Por favor, ingresa un número de contrato válido.');
      return;
    }

    // Mostrar cargando y limpiar errores previos
    secopLoader.classList.remove('hidden');
    btnBuscarSecop.disabled = true;

    try {
      // Llamar a tu API en Vercel pasándole el contrato como parámetro
      const response = await fetch(`${BACKEND_URL}/api/buscar-secop?contrato=${encodeURIComponent(numeroContrato)}`);
      const resultado = await response.json();

      if (resultado.status === 'success') {
        // ¡Éxito! Rellenamos los campos protegidos con la data oficial de SECOP II
        const datos = resultado.datos;
        
        txtCedula.value = datos.documentoContratista || '';
        txtNombre.value = datos.nombreContratista || '';
        txtNumeroContrato.value = datos.numeroContrato || '';
        txtObjeto.value = datos.objetoContrato || '';
        
        // Si SECOP trae supervisor o dependencia, los sugerimos
        if (datos.supervisor) {
          txtSupervisor.value = datos.supervisor;
        }

        alert('¡Contrato encontrado! La información oficial ha sido cargada automáticamente.');
      } else {
        alert(`Atención: ${resultado.message}`);
      }

    } catch (error) {
      console.error('Error al consultar SECOP:', error);
      alert('No se pudo conectar con el servidor para consultar SECOP II. Verifica la URL del backend.');
    } finally {
      // Ocultar el cargando
      secopLoader.classList.add('hidden');
      btnBuscarSecop.disabled = false;
    }
  });

  // === GUARDAR DATOS GENERALES (ENVIAR A SHAREPOINT) ===
  const formGeneral = document.getElementById('form-general');

  formGeneral.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar que la página se recargue

    const camposFormulario = {
      cedula: txtCedula.value,
      nombreContratista: txtNombre.value,
      correoContratista: document.getElementById('correoContratista').value,
      numeroContrato: txtNumeroContrato.value,
      objetoContrato: txtObjeto.value,
      supervisor: txtSupervisor.value,
      dependencia: document.getElementById('dependencia').value
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/guardar-general`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camposFormulario)
      });

      const resultado = await response.json();

      if (resultado.status === 'success') {
        alert('¡Paso 1 Completado! Datos guardados exitosamente en SharePoint.');
        
        // Habilitar la siguiente pestaña de manera dinámica
        const btnAcciones = document.querySelector('[data-tab="acciones"]');
        btnAcciones.disabled = false;
        btnAcciones.click(); // Mover automáticamente al usuario a la Pestaña 2
      } else {
        alert(`Error al guardar: ${resultado.message}`);
      }

    } catch (error) {
      console.error('Error al guardar en SharePoint:', error);
      alert('Hubo un error de conexión al intentar registrar los datos.');
    }
  });

});
