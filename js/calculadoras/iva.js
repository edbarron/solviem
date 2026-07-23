// ============================================
// CALCULADORA DE IVA - LÓGICA PRINCIPAL
// ============================================

// Referencias a elementos DOM
const precioBase = document.getElementById('precioBase');
const tasaIVA = document.getElementById('tasaIVA');
const sinIVA = document.getElementById('sinIVA');
const ivaCalculado = document.getElementById('ivaCalculado');
const totalConIVA = document.getElementById('totalConIVA');
const tasaMostrada = document.getElementById('tasaMostrada');

const precioTotal = document.getElementById('precioTotal');
const tasaIVA2 = document.getElementById('tasaIVA2');
const totalConIVA2 = document.getElementById('totalConIVA2');
const ivaCalculado2 = document.getElementById('ivaCalculado2');
const sinIVA2 = document.getElementById('sinIVA2');
const tasaMostrada2 = document.getElementById('tasaMostrada2');

// ============================================
// FUNCIÓN 1: Calcular Precio + IVA
// ============================================
function calcularConIVA() {
    const base = obtenerValorInput(precioBase);
    const tasa = parseFloat(tasaIVA.value);
    
    tasaMostrada.textContent = tasa;
    
    const iva = base * (tasa / 100);
    const total = base + iva;
    
    sinIVA.textContent = formatearMoneda(base);
    ivaCalculado.textContent = formatearMoneda(iva);
    totalConIVA.textContent = formatearMoneda(total);
}

// ============================================
// FUNCIÓN 2: Calcular Precio - IVA
// ============================================
function calcularSinIVA() {
    const total = obtenerValorInput(precioTotal);
    const tasa = parseFloat(tasaIVA2.value);
    
    tasaMostrada2.textContent = tasa;
    
    const base = total / (1 + (tasa / 100));
    const iva = total - base;
    
    totalConIVA2.textContent = formatearMoneda(total);
    ivaCalculado2.textContent = formatearMoneda(iva);
    sinIVA2.textContent = formatearMoneda(base);
}

// ============================================
// CONFIGURAR EVENT LISTENERS
// ============================================

// Calculadora 1
precioBase.addEventListener('input', calcularConIVA);
tasaIVA.addEventListener('change', calcularConIVA);

// Calculadora 2
precioTotal.addEventListener('input', calcularSinIVA);
tasaIVA2.addEventListener('change', calcularSinIVA);

// ============================================
// INICIALIZAR
// ============================================

// Limpiar y formatear inputs
limpiarInputNumerico(precioBase);
limpiarInputNumerico(precioTotal);
formatearAlPerderFoco(precioBase);
formatearAlPerderFoco(precioTotal);

// Calcular valores iniciales
calcularConIVA();
calcularSinIVA();

// ============================================
// ATAJO DE TECLADO: Enter para recalcular
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active === precioBase || active === precioTotal) {
            e.preventDefault();
            calcularConIVA();
            calcularSinIVA();
        }
    }
});

console.log('✅ Calculadora de IVA cargada correctamente');