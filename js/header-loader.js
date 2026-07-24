// Inyecta el header compartido en cualquier página que tenga
// <div id="header-placeholder"></div>
fetch('/header.html')
    .then(function (res) { return res.text(); })
    .then(function (html) {
        var placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.outerHTML = html;
        }
    })
    .catch(function (err) {
        console.error('No se pudo cargar el header:', err);
    });

// Dropdowns del nav (Empresa / Herramientas / Blog).
// Usa delegación de eventos sobre "document" para que funcione
// sin importar si el header ya terminó de cargar o no.
document.addEventListener('click', function (e) {
    var toggle = e.target.closest('.nav-toggle');

    if (toggle) {
        e.stopPropagation();
        var item = toggle.closest('.has-dropdown');
        var isOpen = item.classList.contains('open');

        document.querySelectorAll('.has-dropdown.open').forEach(function (openItem) {
            openItem.classList.remove('open');
            openItem.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
            item.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
        }
        return;
    }

    // Click fuera de cualquier dropdown: cierra todos
    document.querySelectorAll('.has-dropdown.open').forEach(function (item) {
        item.classList.remove('open');
        item.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
    });
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.has-dropdown.open').forEach(function (item) {
            item.classList.remove('open');
            item.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false');
        });
    }
});