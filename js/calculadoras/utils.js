// ============================================
// UTILIDADES COMPARTIDAS PARA CALCULADORAS
// ============================================

/**
 * Formatea un número como moneda mexicana
 * @param {number} valor - El número a formatear
 * @param {string} moneda - Símbolo de moneda (default: $)
 * @returns {string} - Texto formateado ej: "$ 1,234.56"
 */
function formatearMoneda(valor, moneda = '$') {
    const formato = new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${moneda} ${formato.format(valor)}`;
}

/**
 * Obtiene un valor numérico de un input, manejando valores vacíos
 * @param {string|HTMLElement} input - El input o su ID
 * @returns {number} - Valor numérico (0 si está vacío)
 */
function obtenerValorInput(input) {
    const elemento = typeof input === 'string' 
        ? document.getElementById(input) 
        : input;
    return parseFloat(elemento.value) || 0;
}

/**
 * Limpia el input permitiendo solo números y punto decimal
 * @param {HTMLElement} input - El elemento input
 */
function limpiarInputNumerico(input) {
    input.addEventListener('input', function() {
        if (this.value !== '' && isNaN(parseFloat(this.value))) {
            this.value = this.value.replace(/[^0-9.]/g, '');
        }
    });
}

/**
 * Formatea el input para mostrar 2 decimales al perder foco
 * @param {HTMLElement} input - El elemento input
 */
function formatearAlPerderFoco(input) {
    input.addEventListener('blur', function() {
        let valor = parseFloat(this.value);
        if (!isNaN(valor)) {
            this.value = valor.toFixed(2);
        }
    });
}