(() => {
    const mesTexto = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    let gastos = []

    async function loadListaMensual() {
        return new Promise((resolve, reject) => {
            let data_mes = { id_hogar: sessionStorage.getItem('id_hogar')};
            //let id_gasto_mensual = sessionStorage.getItem('id_gasto_mensual');
            //if (id_gasto_mensual) { data_mes['id'] = id_gasto_mensual;}
            $.ajax({
                url: URL_BACKEND + '/gastodelmes/obtener',
                type: 'GET',
                data: data_mes,
                success: function(response) {
                    sessionStorage.setItem('id_gasto_mensual', response.data.id);
                    resolve(response['data']['lista_gasto']);
                    document.querySelector('.mes_texto').textContent = `${mesTexto[response['data']['mes']-1]}  ${response['data']['anio']}`;
                    //toastr.success('Datos cargados correctamente', 'Success');
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    reject(error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }
            });
        });
    }

    const listaGastos = document.querySelector('#listaGastos tbody');

    async function renderizarGastos() {
        gastos = await loadListaMensual();

        if (!gastos || !Array.isArray(gastos)) {
            console.error('lista_gastos no es un array válido:', gastos);
            listaGastos.innerHTML = '<tr><td colspan="4">No hay gastos para mostrar</td></tr>';
            return;
        }
        // Ordena: primero los no pagados, luego los pagados
        gastos.sort((a, b) => {
            if (a.pagado === b.pagado) return a.nombre.localeCompare(b.nombre);
            return a.pagado ? 1 : -1;
        });
        listaGastos.innerHTML = '';
        
        gastos.forEach(gasto => {
            const row = listaGastos.insertRow();
            row.className = `gasto-info ${gasto.pagado ? 'pagado' : ''}`;
            row.innerHTML = `
                <td><label>${gasto.nombre}</label></td>
                <td>$${formatearValorPesos(gasto.monto)}</td>
                <td><label>${gasto.descripcion}</label></td>
                <td class="gasto-acciones">
                    <button class="btn-ver btn-ico btn light btn-info"  title='Ver'><i class="bi bi-search"></i></button>
                    <button class="btn-pagar btn-ico btn light btn-${gasto.pagado ? 'success' : 'purple'}" title=${gasto.pagado ? 'Pagado': 'Pagar'} id="gasto-${gasto.id}">${gasto.pagado ? '<i class="bi bi-check2-circle"></i>' : '<i class="bi bi-currency-dollar"></i>'}</button>
                    <button class="btn-editar btn-ico btn light btn-primary" title='Editar'><i class="bi bi-pencil-square"></i></button>
                    <button class="btn-eliminar btn-ico btn light btn-danger"  title='Eliminar'><i class="bi bi-trash"></i></button>
                </td>
            `;
            row.querySelector('.btn-pagar').addEventListener('click', () => togglePagado(gasto.id));
            row.querySelector('.btn-editar').addEventListener('click', () => editarGasto(gasto.id));
            row.querySelector('.btn-eliminar').addEventListener('click', () => eliminarGasto(gasto.id));
        });

        //ordenarGastos();
        actualizarResumen();
    }

    function ordenarGastos() {
        const items = Array.from(listaGastos.children);
    
        const noPagados = items.filter(item => item.querySelector('.btn-pagar')?.textContent.trim() === 'Pendiente');
        const pagados = items.filter(item => item.querySelector('.btn-pagar')?.textContent.trim() === 'Pagado');
        listaGastos.innerHTML = '';
        [...noPagados, ...pagados].forEach(item => listaGastos.appendChild(item));
    }

    const btnAgregarGasto = document.querySelector('.btn-agregar');
    btnAgregarGasto.addEventListener('click', () => agregarGasto());

    async function agregarGasto() {
        const formValues = await modalGasto();
        if (formValues) {
            const nombre = formValues.nombre;
            const descripcion = formValues.observacion;
            const monto = formValues.monto;
            if (nombre && monto) {
                const nuevoGasto = {
                    id_gasto_mensual: sessionStorage.getItem('id_gasto_mensual'),
                    nombre,
                    descripcion,
                    monto
                };
                $.ajax({
                    url: URL_BACKEND + '/gasto/agregar',
                    type: 'POST',
                    async: false,
                    data: nuevoGasto,
                success: function(response) {
                    toastr.success('Nuevo gasto agregado', 'Agregado');
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
            const nuevoNombre = formValues.nombre;
            const nuevaDescripcion = formValues.observacion;
            const nuevoMonto = formValues.monto;
            
            if (nuevoNombre !== null && nuevoMonto !== null) {
                const editarGasto = {
                    id,
                    nombre: nuevoNombre,
                    descripcion: nuevaDescripcion,
                    monto: nuevoMonto
                };
                $.ajax({
                    url: URL_BACKEND + '/gasto/editar',
                    type: 'PUT',
                    async: false,
                    data: editarGasto,
                success: function(response) {
                    toastr.success('Gasto editado correctamente', 'Editado');
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
                        icon: "info"
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
        const porcentaje = totalGastos ? (100 * totalPagado) / totalGastos : 0;

        document.querySelector('.progress-bar').style.width = `${porcentaje}%`;
        document.getElementById('totalGastos').textContent = formatearValorPesos(totalGastos);
        document.getElementById('totalPagado').textContent = formatearValorPesos(totalPagado);
        document.getElementById('pendientePagar').textContent = formatearValorPesos(pendientePagar);
        document.getElementById('totalPagadoBar').textContent = formatearValorPesos(totalPagado);
        const data_mensual = {
            'id':sessionStorage.getItem('id_gasto_mensual'),
            'gasto_pagado':totalPagado,
            'gasto_pendiente':pendientePagar,
            'gasto_total':totalGastos
        }
        ajaxResumen(data_mensual);
    }

    function ajaxResumen(data_mensual){
        $.ajax({
            url: URL_BACKEND + '/gasto_mensual/actualizar',
            type: 'PUT',
            async: false,
            data: data_mensual,
        success: function(response) {
            console.log(response)
        },
        error: function(xhr, status, error) {
            console.error('Error al cargar los datos:', error);
            toastr.error('Ha ocurrido un error inesperado', 'Error');
        }})
    }

    async function modalGasto(gasto = null){
        const { value: formValues = false } = await Swal.fire({
            title: gasto != null ? "Editar Gasto" :"Agregar Nuevo Gasto",
            html: `
            <div>
                <label for="nombre_cuenta" class="p-lg-3">Nombre</label>
                <input type="text" id="nombre_cuenta" class="swal2-input m-1" required placeholder="Nombre de la cuenta" value="${gasto != null ? gasto.nombre : ""}" required>
            </div>
            <div>
                <label for="monto" class="p-lg-4">Monto</label>
                <input type="number" id="monto" class="swal2-input m-1" required placeholder="Ingresa el monto" value="${gasto != null ? gasto.monto : ""}" required>
            </div>
            <div>
                <label for="descript">Observación</label>
                <input type="text" id="descript" class="swal2-input m-1" placeholder="Ingresa alguna observación" value="${gasto != null ? gasto.descripcion : ""}">
            </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: gasto != null ? " Editar ":"Agregar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const nombre = document.getElementById("nombre_cuenta").value.trim();
                const observacion = document.getElementById("descript").value.trim();
                const montoValue = document.getElementById("monto").value;
                const monto = parseFloat(montoValue);
                if (!nombre) {
                    Swal.showValidationMessage("El Nombre es obligatorio.");
                    return false;
                }
                if (!montoValue || isNaN(monto) || monto <= 0) {
                    Swal.showValidationMessage("El monto debe ser un número válido mayor a 0.");
                    return false;
                }
                return { nombre, observacion, monto };
            },
        });
        return formValues;
    }

    renderizarGastos();
})();