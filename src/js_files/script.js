let loadPage;
document.addEventListener('DOMContentLoaded', async () => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const content = document.getElementById('content');
    const menuLinks = document.querySelectorAll('.menu-link');
    const pageTitle = document.querySelector('.page-title');
    const imageUrl = sessionStorage.getItem('avatar')?.trim();
    const btnListarHogar = document.getElementById('btnListarHogar');
    const nombreUser = document.getElementById('nom_user');
    const nombreHogar = sessionStorage.getItem('nombre_hogar') || 'Administrador';
    const nombreUsuario = sessionStorage.getItem('nombre_user') || 'Administrador';
    btnListarHogar.textContent = nombreHogar;
    nombreUser.textContent = nombreUsuario;
    

    btnListarHogar.addEventListener('click', function() {
        loadListaHogar();
    });

    if (imageUrl && imageUrl != 'null') {
        const logoImg = document.querySelector('.logo-img');
        logoImg.src = imageUrl;
        logoImg.onload = () => console.log('Imagen cargada correctamente.');
        logoImg.onerror = () => logoImg.src = 'src/icons/ic_profile.png';
    }
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    document.addEventListener('click', function(event) {
        // Solo en modo móvil
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            // Si el sidebar está abierto y el clic NO fue dentro del sidebar ni en el botón de menú
            if (
                sidebar.classList.contains('open') &&
                !sidebar.contains(event.target) &&
                event.target !== menuToggle &&
                !menuToggle.contains(event.target)
            ) {
                sidebar.classList.remove('open');
            }
        }
    });

    if (!sessionStorage.getItem('id_hogar')) {
        await loadListaHogar();
    } 
    // Función para cargar el contenido de la página
    loadPage = async function(page) {
        if (page === 'salir'){return 0}
        try {
            // Simulamos la carga de contenido
            const response = await fetch(`src/pages/${page}.html`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const html = await response.text();
                content.innerHTML = html;
            pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
            const scriptUrl = `src/js_files/${page}.js?v=${VERSION_JS}`;
            console.log(scriptUrl)
            loadScript(scriptUrl)
                .then(() => {
                    console.log('Script de inicio cargado');
                    // Aquí puedes inicializar funciones de inicio.js si es necesario
                })
                .catch((error) => {
                    console.error('Error al cargar el script de inicio:', error);
                })
        } catch (e) {
            console.error('Error al cargar la página:', e);
            content.innerHTML = '<p>Error al cargar el contenido. Por favor, intenta de nuevo.</p>';
        }
    }

    function removeScript(url) {
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            existingScript.remove();
        }
    }

    function loadScript(url) {
        removeScript(url)
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Manejar clics en los enlaces del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            sessionStorage.removeItem('id_gasto_mensual');
            loadPage(page);

            // Actualizar clase activa
            menuLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');

            // Cerrar el menú en dispositivos móviles después de hacer clic
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
        }
    });

    // Cargar la página de inicio por defecto
    loadPage('inicio');
});

function formatearValorPesos(numero) {
    var value = numero.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return value;
}

async function obtenerHogares() {
    return new Promise((resolve, reject) => {
        let data_user = { id_usuario: sessionStorage.getItem('idUsuario') };
        $.ajax({
            url: URL_BACKEND + '/hogar/obtener',
            type: 'GET',
            data: data_user,
            success: function(response) {
                if (response.success && Array.isArray(response.data)) {
                    resolve(response.data);
                } else {
                    resolve([]); // Retornar array vacío si no hay hogares
                }
            },
            error: function(xhr, status, error) {
                console.error('Error al obtener hogares:', error);
                reject(error);
            }
        });
    });
}

async function mostrarModalHogares(hogares) {
    return new Promise((resolve) => {
        let cardsHtml = `<div id="hogarCardList" style="max-height: 300px; overflow-y: auto;">`;

        hogares.forEach(hogarItem => {
            const datos = hogarItem.datos_hogar[0];
            const id = datos.id;
            const nombre = datos.nombre;
            const rol = hogarItem.rol;

            cardsHtml += `
                <div class="hogar-card" data-id="${id}" data-nombre="${nombre}">
                    <h4 style="margin-bottom: 5px;">${nombre}</h4>
                    <p><strong>Rol:</strong> ${rol}</p>
                </div>
            `;
        });

        cardsHtml += `</div>`;

        Swal.fire({
            title: 'Selecciona un hogar',
            html: cardsHtml,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                const cards = document.querySelectorAll('.hogar-card');
                cards.forEach(card => {
                    card.addEventListener('mouseenter', () => card.classList.add('hovered'));
                    card.addEventListener('mouseleave', () => card.classList.remove('hovered'));
                    card.addEventListener('click', () => {
                        cards.forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');

                        const id = card.getAttribute('data-id');
                        const nombre = card.getAttribute('data-nombre');

                        //sessionStorage.removeItem('id_gasto_mensual');
                        sessionStorage.setItem('id_hogar', id);
                        sessionStorage.setItem('nombre_hogar', nombre);
                        Swal.close();
                        if (window.innerWidth <= 768) {
                            sidebar.classList.remove('open');
                        }
                        toastr.success(`Hogar "${nombre}" seleccionado`);
                        btnListarHogar.textContent = nombre;
                        resolve({ id, nombre });
                    });
                });
            }
        });
    });
}

async function crearHogar(nombre) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: URL_BACKEND + '/hogar/crear',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                nombre: nombre,
                id_usuario: sessionStorage.getItem('idUsuario')
            }),
            success: function(res) {
                if (res.success && res.data) {
                    sessionStorage.setItem('id_hogar', res.data.id);
                    toastr.success('Hogar creado exitosamente');
                    resolve(res.data);
                } else {
                    Swal.fire('Error', 'No se pudo crear el hogar', 'error');
                    reject(res.message || 'Error al crear hogar');
                }
            },
            error: function(xhr, status, error) {
                Swal.fire('Error', 'Ocurrió un error al crear el hogar', 'error');
                reject(error);
            }
        });
    });
}

async function loadListaHogar() {
    try {
        const hogares = await obtenerHogares();
        if (hogares.length > 0) {
            await mostrarModalHogares(hogares);
        } else {
            const { value: nombre } = await Swal.fire({
                title: 'Crear hogar',
                text: 'Por favor, ingresa el nombre de tu hogar',
                input: 'text',
                inputPlaceholder: 'Ej: Casa Central',
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: 'Guardar',
                showCancelButton: false,
                inputValidator: (value) => {
                    if (!value) return 'Debes ingresar un nombre';
                }
            });

            if (nombre) {
                await crearHogar(nombre);
                return await loadListaHogar(); // vuelve a cargar hogares
            } else {
                throw 'No se ingresó nombre del hogar';
            }
        }
        // Al finalizar, cargar la página de inicio
        if (typeof loadPage === 'function') {
            loadPage('inicio');
        }
    } catch (error) {
        console.error('Error en loadListaHogar:', error);
        toastr.error('Ha ocurrido un error inesperado', 'Error');
        throw error;
    }
}