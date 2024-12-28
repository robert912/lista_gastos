(() => {
    let gastos = []

    function loadListaMensual() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: URL_BACKEND + '/gastodelmes/obtener',
                type: 'GET',
                data: { id_usuario: sessionStorage.getItem('idUsuario')},
                success: function(response) {
                    sessionStorage.setItem('id_gasto_mensual', response.data.id);
                    resolve(response['data']['lista_gasto']);
                    toastr.success('Datos cargados correctamente', 'Success');
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    reject(error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }
            });
        });
    }

    const listaGastos = document.getElementById('listaGastos');
    const descripcionInput = document.getElementById('descripcion');
    const montoInput = document.getElementById('monto');

    async function renderizarGastos() {
        gastos = await loadListaMensual();
        if (!gastos || !Array.isArray(gastos)) {
            console.error('lista_gastos no es un array válido:', gastos);
            listaGastos.innerHTML = '<li>No hay gastos para mostrar</li>';
            return;
        }
        listaGastos.innerHTML = '';
        gastos.forEach(gasto => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="gasto-info ${gasto.pagado ? 'pagado' : ''}">
                    <input type="checkbox" id="gasto-${gasto.id}" ${gasto.pagado ? 'checked' : ''}>
                    <label for="gasto-${gasto.id}">${gasto.descripcion}: $${gasto.monto}</label>
                </div>
                <div class="gasto-acciones">
                    <button class="btn-editar btn light btn-primary">Editar</button>
                    <button class="btn-eliminar btn light btn-danger">Eliminar</button>
                </div>
            `;

            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => togglePagado(gasto.id));

            const btnEditar = li.querySelector('.btn-editar');
            btnEditar.addEventListener('click', () => editarGasto(gasto.id));

            const btnEliminar = li.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', () => eliminarGasto(gasto.id));

            const btnAgregarGasto = document.querySelector('.btn-agregar');
            btnAgregarGasto.addEventListener('click', () => agregarGasto());

            listaGastos.appendChild(li);
        });
        actualizarResumen();
    }

    async function agregarGasto() {
        const formValues = await modalGasto();
        if (formValues) {
            const descripcion = formValues.descripcion;
            const monto = formValues.monto;
            if (descripcion && monto) {
                const nuevoGasto = {
                    id_gasto_mensual: sessionStorage.getItem('id_gasto_mensual'),
                    descripcion,
                    monto
                };
                $.ajax({
                    url: URL_BACKEND + '/gasto/agregar',
                    type: 'POST',
                    async: false,
                    data: nuevoGasto,
                success: function(response) {
                    toastr.success('Datos cargados correctamente', 'Success');
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }})
                renderizarGastos();
            }
        }
    }

    function togglePagado(id) {
        const gastoEncontrado = gastos.find(gasto => gasto.id === id).pagado;
        $.ajax({
            url: URL_BACKEND + '/gasto/pagado',
            type: 'PUT',
            async:false,
            data: { id: id,
                pagado: gastoEncontrado ? 0 : 1
            }
        });
        renderizarGastos();
    }

    async function editarGasto(id) {
        const gasto = gastos.find(g => g.id === id);
        const formValues = await modalGasto(gasto);
        if (formValues) {
            const nuevaDescripcion = formValues.descripcion;
            const nuevoMonto = formValues.monto;
            
            if (nuevaDescripcion !== null && nuevoMonto !== null) {
                const editarGasto = {
                    id,
                    descripcion: nuevaDescripcion,
                    monto: nuevoMonto
                };
                $.ajax({
                    url: URL_BACKEND + '/gasto/editar',
                    type: 'PUT',
                    async: false,
                    data: editarGasto,
                success: function(response) {
                    toastr.success('Datos cargados correctamente', 'Success');
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }})
                renderizarGastos();
            }
        }
    }

    function eliminarGasto(id) {
        const descripcion = gastos.find(gasto => gasto.id === id).descripcion;
        Swal.fire({
            title: "<h5>¿Estás seguro de que quieres eliminar este gasto?</h5>",
            html: `
                <p><strong>${descripcion}</strong></p>
            `,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Si, Eliminar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                const eliminarGasto = {
                    id,
                    estado: 0
                };
                $.ajax({
                    url: URL_BACKEND + '/gasto/eliminar',
                    type: 'PUT',
                    async: false,
                    data: eliminarGasto,
                success: function(response) {
                    Swal.fire({
                        title: "Eliminado!",
                        text: "Tu gasto ha sido eliminado.",
                        icon: "success"
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }})
                renderizarGastos();
            }
        });
    }

    function actualizarResumen() {
        const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);
        const totalPagado = gastos.filter(gasto => gasto.pagado).reduce((sum, gasto) => sum + gasto.monto, 0);
        const pendientePagar = totalGastos - totalPagado;

        document.getElementById('totalGastos').textContent = totalGastos;
        document.getElementById('totalPagado').textContent = totalPagado;
        document.getElementById('pendientePagar').textContent = pendientePagar;
    }

    renderizarGastos();


    async function modalGasto(gasto = null){
        const { value: formValues = false } = await Swal.fire({
            title: gasto != null ? "Editar Gasto" :"Agregar Nuevo Gasto",
            html: `
            <div>
                <label for="descript">Descripción</label>
                <input type="text" id="descript" class="swal2-input m-1" required placeholder="Ingresa la descripción" value="${gasto != null ? gasto.descripcion : ""}">
            </div>
            <div>
                <label for="monto" class="p-lg-4">Monto</label>
                <input type="number" id="monto" class="swal2-input m-1" required placeholder="Ingresa el monto" value="${gasto != null ? gasto.monto : ""}">
            </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: gasto != null ? " Editar ":"Agregar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const descripcion = document.getElementById("descript").value.trim();
                const montoValue = document.getElementById("monto").value;
                const monto = parseFloat(montoValue);
                if (!descripcion) {
                    Swal.showValidationMessage("La descripción es obligatoria.");
                    return false;
                }
                if (!montoValue || isNaN(monto) || monto <= 0) {
                    Swal.showValidationMessage("El monto debe ser un número válido mayor a 0.");
                    return false;
                }
                return { descripcion, monto };
            },
        });
        return formValues;
    }
})();