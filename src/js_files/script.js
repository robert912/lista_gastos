let loadPage;
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const content = document.getElementById('content');
    const menuLinks = document.querySelectorAll('.menu-link');
    const pageTitle = document.querySelector('.page-title');
    const imageUrl = sessionStorage.getItem('avatar')?.trim();
    if (imageUrl && imageUrl != 'null') {
        const logoImg = document.querySelector('.logo-img');
        logoImg.src = imageUrl;
        logoImg.onload = () => console.log('Imagen cargada correctamente.');
        logoImg.onerror = () => logoImg.src = 'src/icons/ic_profile.png';
    }
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

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