// ============================================
// COTIZADOR - LÓGICA PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', function () {

    // ---- Referencias DOM ----
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    const logoTitulo = document.getElementById('logoTitulo');

    const cotNumero = document.getElementById('cotNumero');
    const cotFecha = document.getElementById('cotFecha');
    const cotValidez = document.getElementById('cotValidez');
    const cotColor = document.getElementById('cotColor');
    const cotMoneda = document.getElementById('cotMoneda');
    const formaPago = document.getElementById('formaPago');

    const camposEmpresa = ['empNombre', 'empRFC', 'empDireccion', 'empWeb', 'empEjecutivo', 'empEmail', 'empTelefono'];
    const camposCliente = ['cliNombre', 'cliRFC', 'cliDireccion', 'cliContacto', 'cliEmail', 'cliTelefono'];

    const notasTexto = document.getElementById('notasTexto');
    const condicionesTexto = document.getElementById('condicionesTexto');

    const itemsBody = document.getElementById('itemsBody');
    const addItemBtn = document.getElementById('addItemBtn');
    const duplicateItemBtn = document.getElementById('duplicateItemBtn');

    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const descGlobalPorcentaje = document.getElementById('descGlobalPorcentaje');
    const descGlobalMonto = document.getElementById('descGlobalMonto');
    const impuestoPorcentaje = document.getElementById('impuestoPorcentaje');
    const impuestoMonto = document.getElementById('impuestoMonto');
    const totalFinal = document.getElementById('totalFinal');

    const cotizacionPreview = document.getElementById('cotizacionPreview');
    const descargarPdfBtn = document.getElementById('descargarPdfBtn');
    const descargarImagenBtn = document.getElementById('descargarImagenBtn');
    const limpiarBtn = document.getElementById('limpiarBtn');
    const autosaveStatus = document.getElementById('autosaveStatus');

    const STORAGE_KEY = 'solviem_cotizador_v1';
    let itemCounter = 0;
    let autosaveTimeout = null;

    // ---- Símbolos de moneda ----
    const SIMBOLOS_MONEDA = { MXN: '$', USD: 'US$' };

    function formatearMonto(valor) {
        const simbolo = SIMBOLOS_MONEDA[cotMoneda.value] || '$';
        const formato = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${simbolo} ${formato.format(valor || 0)}`;
    }

    // ---- Fechas por defecto ----
    function inicializarFechas() {
        const hoy = new Date();
        const validez = new Date();
        validez.setDate(validez.getDate() + 15);
        cotFecha.value = hoy.toISOString().split('T')[0];
        cotValidez.value = validez.toISOString().split('T')[0];
    }

    // ---- Color de acento ----
    function aplicarColor() {
        cotizacionPreview.style.setProperty('--cot-accent', cotColor.value);
    }

    // ---- Titular junto al logo (nombre de la empresa) ----
    function actualizarLogoTitulo() {
        const nombre = document.getElementById('empNombre').value.trim();
        if (nombre) {
            logoTitulo.textContent = nombre;
            logoTitulo.classList.remove('vacio');
        } else {
            logoTitulo.textContent = 'Nombre de tu empresa';
            logoTitulo.classList.add('vacio');
        }
    }

    // ---- Logo ----
    function manejarLogo() {
        const archivo = logoInput.files[0];
        if (!archivo) return;
        if (!archivo.type.startsWith('image/')) {
            alert('Por favor sube un archivo de imagen (PNG, JPG o SVG).');
            return;
        }
        const lector = new FileReader();
        lector.onload = function (e) {
            logoPreview.src = e.target.result;
            logoPreview.style.display = 'block';
            logoPlaceholder.style.display = 'none';
            guardarEnLocalStorage();
        };
        lector.readAsDataURL(archivo);
    }

    // ---- Filas de productos ----
    function crearFila(datos = {}) {
        itemCounter++;
        const fila = document.createElement('tr');
        fila.dataset.id = itemCounter;
        fila.innerHTML = `
            <td><input type="text" class="item-descripcion" placeholder="Producto o servicio" value="${escaparHtml(datos.descripcion || '')}"></td>
            <td><input type="number" class="item-cantidad" min="0" step="1" value="${datos.cantidad ?? 1}"></td>
            <td><input type="number" class="item-precio" min="0" step="0.01" value="${datos.precio ?? 0}"></td>
            <td><input type="number" class="item-descuento" min="0" max="100" step="1" value="${datos.descuento ?? 0}"></td>
            <td class="item-total">${formatearMonto(0)}</td>
            <td class="no-pdf"><button type="button" class="btn-remove-item" title="Eliminar ítem" aria-label="Eliminar ítem">×</button></td>
        `;
        itemsBody.appendChild(fila);
        return fila;
    }

    function escaparHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    function eliminarFila(fila) {
        if (itemsBody.children.length <= 1) return;
        fila.remove();
        recalcularTodo();
    }

    function duplicarUltimaFila() {
        const filas = itemsBody.querySelectorAll('tr');
        if (filas.length === 0) return;
        const ultima = filas[filas.length - 1];
        const datos = {
            descripcion: ultima.querySelector('.item-descripcion').value,
            cantidad: ultima.querySelector('.item-cantidad').value,
            precio: ultima.querySelector('.item-precio').value,
            descuento: ultima.querySelector('.item-descuento').value
        };
        crearFila(datos);
        recalcularTodo();
    }

    // ---- Cálculos ----
    function calcularTotalFila(fila) {
        const cantidad = parseFloat(fila.querySelector('.item-cantidad').value) || 0;
        const precio = parseFloat(fila.querySelector('.item-precio').value) || 0;
        const descuento = parseFloat(fila.querySelector('.item-descuento').value) || 0;
        const bruto = cantidad * precio;
        const totalFila = bruto - (bruto * descuento / 100);
        fila.querySelector('.item-total').textContent = formatearMonto(totalFila);
        return totalFila;
    }

    function recalcularTodo() {
        let subtotal = 0;
        itemsBody.querySelectorAll('tr').forEach(fila => {
            subtotal += calcularTotalFila(fila);
        });

        const descPorc = parseFloat(descGlobalPorcentaje.value) || 0;
        const descMonto = subtotal * (descPorc / 100);

        const baseImponible = subtotal - descMonto;
        const impPorc = parseFloat(impuestoPorcentaje.value) || 0;
        const impMonto = baseImponible * (impPorc / 100);

        const total = baseImponible + impMonto;

        subtotalDisplay.textContent = formatearMonto(subtotal);
        descGlobalMonto.textContent = formatearMonto(descMonto);
        impuestoMonto.textContent = formatearMonto(impMonto);
        totalFinal.textContent = formatearMonto(total);

        guardarEnLocalStorage();
    }

    // ---- Guardado local (borrador en el navegador del usuario) ----
    function guardarEnLocalStorage() {
        try {
            const datos = {
                logo: (logoPreview.style.display === 'block') ? logoPreview.src : null,
                cotNumero: cotNumero.value,
                cotFecha: cotFecha.value,
                cotValidez: cotValidez.value,
                cotColor: cotColor.value,
                cotMoneda: cotMoneda.value,
                formaPago: formaPago.value,
                empresa: camposEmpresa.reduce((acc, id) => { acc[id] = document.getElementById(id).value; return acc; }, {}),
                cliente: camposCliente.reduce((acc, id) => { acc[id] = document.getElementById(id).value; return acc; }, {}),
                notas: notasTexto.value,
                condiciones: condicionesTexto.value,
                items: Array.from(itemsBody.querySelectorAll('tr')).map(fila => ({
                    descripcion: fila.querySelector('.item-descripcion').value,
                    cantidad: fila.querySelector('.item-cantidad').value,
                    precio: fila.querySelector('.item-precio').value,
                    descuento: fila.querySelector('.item-descuento').value
                })),
                descGlobalPorcentaje: descGlobalPorcentaje.value,
                impuestoPorcentaje: impuestoPorcentaje.value
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
            if (autosaveStatus) {
                autosaveStatus.textContent = 'Guardado ✓';
                clearTimeout(autosaveTimeout);
                autosaveTimeout = setTimeout(() => {
                    autosaveStatus.textContent = 'Guardado local activo';
                }, 1500);
            }
        } catch (err) {
            // Si localStorage no está disponible (modo privado, cuota llena, etc.) simplemente no autoguardamos
            console.warn('No se pudo autoguardar la cotización:', err);
        }
    }

    function cargarDeLocalStorage() {
        let datos;
        try {
            datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (err) {
            return false;
        }
        if (!datos) return false;

        if (datos.logo) {
            logoPreview.src = datos.logo;
            logoPreview.style.display = 'block';
            logoPlaceholder.style.display = 'none';
        }
        if (datos.cotNumero) cotNumero.value = datos.cotNumero;
        if (datos.cotFecha) cotFecha.value = datos.cotFecha;
        if (datos.cotValidez) cotValidez.value = datos.cotValidez;
        if (datos.cotColor) cotColor.value = datos.cotColor;
        if (datos.cotMoneda) cotMoneda.value = datos.cotMoneda;
        if (datos.formaPago) formaPago.value = datos.formaPago;

        camposEmpresa.forEach(id => {
            if (datos.empresa && datos.empresa[id] !== undefined) document.getElementById(id).value = datos.empresa[id];
        });
        camposCliente.forEach(id => {
            if (datos.cliente && datos.cliente[id] !== undefined) document.getElementById(id).value = datos.cliente[id];
        });

        if (datos.notas !== undefined) notasTexto.value = datos.notas;
        if (datos.condiciones !== undefined) condicionesTexto.value = datos.condiciones;
        if (datos.descGlobalPorcentaje !== undefined) descGlobalPorcentaje.value = datos.descGlobalPorcentaje;
        if (datos.impuestoPorcentaje !== undefined) impuestoPorcentaje.value = datos.impuestoPorcentaje;

        if (Array.isArray(datos.items) && datos.items.length > 0) {
            itemsBody.innerHTML = '';
            datos.items.forEach(item => crearFila(item));
        }

        return true;
    }

    function limpiarFormulario() {
        const confirmado = confirm('¿Seguro que quieres borrar todos los datos de esta cotización? Esta acción no se puede deshacer.');
        if (!confirmado) return;
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }

    // ---- Captura del documento (compartida entre PDF e imagen) ----
    function capturarDocumento() {
        if (typeof html2canvas === 'undefined') {
            return Promise.reject(new Error('html2canvas no disponible'));
        }

        return html2canvas(cotizacionPreview, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            // Al clonar el documento para capturarlo, cambiamos cada input/textarea
            // por texto plano: html2canvas no siempre calcula bien la línea base del
            // texto dentro de campos de formulario y lo corta a la mitad.
            onclone: function (clonedDoc) {
                const clonedPreview = clonedDoc.getElementById('cotizacionPreview');
                if (!clonedPreview) return;

                clonedPreview.querySelectorAll('input, textarea').forEach(function (campo) {
                    // Los campos marcados como no-pdf (botón de subir logo, input de archivo, etc.)
                    // ya están ocultos vía CSS en el clon; si los reemplazamos igual, el elemento
                    // nuevo pierde esa clase/estado oculto y termina imprimiéndose (ej. la ruta
                    // fake del input de archivo). Los dejamos tal cual, sin reemplazar.
                    if (campo.classList.contains('no-pdf') || campo.type === 'file') return;

                    const estilos = window.getComputedStyle(campo);
                    const reemplazo = document.createElement(campo.tagName === 'TEXTAREA' ? 'div' : 'span');

                    if (campo.type === 'color') {
                        // El selector de color se sustituye por un swatch, no por su valor hexadecimal
                        reemplazo.style.display = 'inline-block';
                        reemplazo.style.width = '28px';
                        reemplazo.style.height = '28px';
                        reemplazo.style.borderRadius = '6px';
                        reemplazo.style.background = campo.value;
                        reemplazo.style.border = '1px solid #e5e7eb';
                    } else if (campo.tagName === 'SELECT') {
                        reemplazo.textContent = campo.options[campo.selectedIndex] ? campo.options[campo.selectedIndex].text : '';
                    } else {
                        reemplazo.textContent = campo.value || '';
                    }

                    // Copiamos el tipo de letra, tamaño, color y alineación tal cual se ven en pantalla
                    reemplazo.style.font = estilos.font;
                    reemplazo.style.color = estilos.color;
                    reemplazo.style.textAlign = estilos.textAlign;
                    reemplazo.style.padding = estilos.padding;
                    reemplazo.style.whiteSpace = campo.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
                    reemplazo.style.width = estilos.width;
                    reemplazo.style.display = campo.type === 'color' ? 'inline-block' : (campo.tagName === 'TEXTAREA' ? 'block' : 'inline-block');

                    campo.replaceWith(reemplazo);
                });

                // También reemplazamos el <select> de moneda si quedó alguno suelto fuera del bucle anterior
                clonedPreview.querySelectorAll('select').forEach(function (sel) {
                    const span = document.createElement('span');
                    span.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
                    sel.replaceWith(span);
                });
            }
        });
    }

    function nombreArchivoBase() {
        return (cotNumero.value || 'cotizacion').trim().replace(/[^a-z0-9\-_]/gi, '_');
    }

    // ---- Generar PDF ----
    async function descargarPDF() {
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            alert('No se pudo cargar el generador de PDF. Revisa tu conexión a internet e intenta de nuevo.');
            return;
        }

        descargarPdfBtn.disabled = true;
        const textoOriginal = descargarPdfBtn.textContent;
        descargarPdfBtn.textContent = 'Generando PDF...';
        cotizacionPreview.classList.add('capturando-pdf');

        try {
            const canvas = await capturarDocumento();

            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');

            // Tamaño del PDF a la medida exacta de lo capturado, para que siempre quepa en una sola página
            const pxToPt = 0.75; // 1px (96dpi) ≈ 0.75pt
            const pdfWidth = (canvas.width / 2) * pxToPt;   // /2 porque se capturó con scale: 2
            const pdfHeight = (canvas.height / 2) * pxToPt;

            const pdf = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${nombreArchivoBase()}.pdf`);
        } catch (err) {
            console.error('Error generando PDF:', err);
            alert('Ocurrió un error al generar el PDF. Por favor intenta de nuevo.');
        } finally {
            cotizacionPreview.classList.remove('capturando-pdf');
            descargarPdfBtn.disabled = false;
            descargarPdfBtn.textContent = textoOriginal;
        }
    }

    // ---- Generar imagen (PNG), pensada para compartir por WhatsApp ----
    async function descargarImagen() {
        if (typeof html2canvas === 'undefined') {
            alert('No se pudo cargar el generador de imagen. Revisa tu conexión a internet e intenta de nuevo.');
            return;
        }

        descargarImagenBtn.disabled = true;
        const textoOriginal = descargarImagenBtn.textContent;
        descargarImagenBtn.textContent = 'Generando imagen...';
        cotizacionPreview.classList.add('capturando-pdf');

        try {
            const canvas = await capturarDocumento();
            const enlace = document.createElement('a');
            enlace.download = `${nombreArchivoBase()}.png`;
            enlace.href = canvas.toDataURL('image/png');
            enlace.click();
        } catch (err) {
            console.error('Error generando la imagen:', err);
            alert('Ocurrió un error al generar la imagen. Por favor intenta de nuevo.');
        } finally {
            cotizacionPreview.classList.remove('capturando-pdf');
            descargarImagenBtn.disabled = false;
            descargarImagenBtn.textContent = textoOriginal;
        }
    }

    // ---- Event listeners ----
    logoInput.addEventListener('change', manejarLogo);
    cotColor.addEventListener('input', aplicarColor);
    cotMoneda.addEventListener('change', recalcularTodo);

    itemsBody.addEventListener('input', function (e) {
        if (e.target.matches('.item-cantidad, .item-precio, .item-descuento')) {
            recalcularTodo();
        } else if (e.target.matches('.item-descripcion')) {
            guardarEnLocalStorage();
        }
    });

    itemsBody.addEventListener('click', function (e) {
        const boton = e.target.closest('.btn-remove-item');
        if (boton) eliminarFila(boton.closest('tr'));
    });

    addItemBtn.addEventListener('click', function () {
        crearFila();
        recalcularTodo();
    });

    duplicateItemBtn.addEventListener('click', duplicarUltimaFila);

    descGlobalPorcentaje.addEventListener('input', recalcularTodo);
    impuestoPorcentaje.addEventListener('input', recalcularTodo);
    descargarPdfBtn.addEventListener('click', descargarPDF);
    descargarImagenBtn.addEventListener('click', descargarImagen);
    if (limpiarBtn) limpiarBtn.addEventListener('click', limpiarFormulario);

    [cotNumero, cotFecha, cotValidez, formaPago, notasTexto, condicionesTexto].forEach(el => {
        el.addEventListener('input', guardarEnLocalStorage);
    });
    [...camposEmpresa, ...camposCliente].forEach(id => {
        document.getElementById(id).addEventListener('input', guardarEnLocalStorage);
    });
    document.getElementById('empNombre').addEventListener('input', actualizarLogoTitulo);

    // ---- Inicialización ----
    inicializarFechas();
    const restaurado = cargarDeLocalStorage();
    if (!restaurado) {
        crearFila();
    }
    aplicarColor();
    actualizarLogoTitulo();
    recalcularTodo();

    console.log('✅ Cotizador cargado correctamente');
});