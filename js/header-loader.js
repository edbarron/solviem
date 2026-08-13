// Inyecta el header compartido en cualquier página que tenga
// <div id="header-placeholder"></div>
fetch('/header.html')
    .then(function (res) { return res.text(); })
    .then(function (html) {
        var placeholder = document.getElementById('header-placeholder');
        if (placeholder) {
            placeholder.outerHTML = html;
        }
        // Una vez que el header ya está en el DOM, poblamos los dropdowns
        // dinámicos. Si algo falla aquí, los <li> estáticos que ya vienen
        // en header.html se quedan tal cual (funcionan como respaldo).
        poblarDropdownHerramientas();
        poblarDropdownBlog();
    })
    .catch(function (err) {
        console.error('No se pudo cargar el header:', err);
    });

// ============================================
// DROPDOWN "HERRAMIENTAS": se arma solo a partir
// de /calculadoras/index.html, tomando únicamente
// las tarjetas marcadas como disponibles (<a class="grid-item">,
// las "próximamente" son <div> y se ignoran), ordenadas A-Z.
// ============================================
function poblarDropdownHerramientas() {
    var lista = document.getElementById('navHerramientasList');
    if (!lista) return;

    fetch('/calculadoras/index.html')
        .then(function (res) { return res.text(); })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var tarjetas = doc.querySelectorAll('a.grid-item');

            var items = [];
            tarjetas.forEach(function (a) {
                var href = a.getAttribute('href');
                var h3 = a.querySelector('h3');
                var nombre = h3 ? h3.textContent.trim() : '';
                if (href && nombre) {
                    items.push({ href: href, nombre: nombre });
                }
            });

            items.sort(function (a, b) {
                return a.nombre.localeCompare(b.nombre, 'es');
            });

            insertarItemsEnDropdown(lista, items.map(function (item) {
                return {
                    // El index de calculadoras usa rutas relativas (ej. "iva/"),
                    // las volvemos absolutas para que funcionen desde cualquier página.
                    href: '/calculadoras/' + item.href.replace(/^\.?\/?/, ''),
                    texto: item.nombre
                };
            }));
        })
        .catch(function (err) {
            console.error('No se pudo cargar el listado de herramientas para el menú:', err);
        });
}

// ============================================
// DROPDOWN "BLOG": se arma solo a partir de
// /blog/index.html, usando el atributo data-date
// (formato ISO) de cada tarjeta para ordenar de la
// más reciente a la más antigua, mostrando solo las
// primeras 3.
// ============================================
function poblarDropdownBlog() {
    var lista = document.getElementById('navBlogList');
    if (!lista) return;

    var MAX_ARTICULOS = 3;

    fetch('/blog/index.html')
        .then(function (res) { return res.text(); })
        .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var tarjetas = doc.querySelectorAll('a.blog-card');

            var items = [];
            tarjetas.forEach(function (a) {
                var href = a.getAttribute('href');
                var h2 = a.querySelector('h2');
                var titulo = h2 ? h2.textContent.trim() : '';
                var fecha = a.getAttribute('data-date') || '';
                if (href && titulo) {
                    items.push({ href: href, titulo: titulo, fecha: fecha });
                }
            });

            // Orden cronológico (más cercano a más lejano) usando fechas ISO,
            // no el orden en que aparecen en el HTML.
            items.sort(function (a, b) {
                return b.fecha.localeCompare(a.fecha);
            });

            insertarItemsEnDropdown(lista, items.slice(0, MAX_ARTICULOS).map(function (item) {
                return {
                    href: '/blog/' + item.href.replace(/^\.?\/?/, ''),
                    texto: item.titulo
                };
            }));
        })
        .catch(function (err) {
            console.error('No se pudo cargar el listado del blog para el menú:', err);
        });
}

// Reemplaza los <li> de un dropdown (excepto el de "Ver todo/todas →")
// por la lista de items generada dinámicamente.
function insertarItemsEnDropdown(listaUl, items) {
    var verTodoLi = listaUl.querySelector('.dropdown-viewall');

    listaUl.querySelectorAll('li:not(.dropdown-viewall)').forEach(function (li) {
        li.remove();
    });

    items.forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.texto;
        li.appendChild(a);
        listaUl.insertBefore(li, verTodoLi);
    });
}

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