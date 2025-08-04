(() => {
    const mesTexto = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    let gastos = [];
    let gastoEditando = null;

    // Utilidad para formatear valores en pesos
    function formatearValorPesos(valor) {
        return Number(valor).toLocaleString('es-CL', { minimumFractionDigits: 0 });
    }

    // Carga la lista mensual de gastos
    async function loadListaMensual() {
        return new Promise((resolve, reject) => {
            const data_mes = { id_hogar: sessionStorage.getItem('id_hogar') };
            const id_gasto_mensual = sessionStorage.getItem('id_gasto_mensual');
            if (id_gasto_mensual) data_mes['id'] = id_gasto_mensual;
            $.ajax({
                url: URL_BACKEND + '/gastodelmes/obtener',
                type: 'GET',
                data: data_mes,
                success: function (response) {
                    sessionStorage.setItem('id_gasto_mensual', response.data.id);
                    document.getElementById('page-title-header').innerHTML =
                        `<i class="bi bi-cash-stack"></i> Lista de Pagos <span class="mes_texto text-primary">${mesTexto[response.data.mes - 1]}  ${response.data.anio}</span>`;
                    resolve(response.data.lista_gasto);
                },
                error: function (xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    reject(error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }
            });
        });
    }

    // Renderiza la tabla de gastos
    async function renderizarGastos() {
        gastos = await loadListaMensual();
        const listaGastos = document.querySelector('#listaGastos tbody');

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
            row.className = `gasto-info${gasto.pagado ? ' table-success' : ''}`;
            row.innerHTML = `
                <td><label>${gasto.nombre}</label></td>
                <td>$${formatearValorPesos(gasto.monto)}</td>
                <td><label>${gasto.descripcion}</label></td>
                <td class="gasto-acciones">
                    <button class="btn-ver btn-ico btn light btn-info" title='Ver'><i class="bi bi-search"></i></button>
                    <button class="btn-pagar btn-ico btn light btn-${gasto.pagado ? 'success disabled' : 'purple'}" title=${gasto.pagado ? 'Pagado' : 'Pagar'} id="gasto-${gasto.id}">${gasto.pagado ? '<i class="bi bi-check2-circle"></i>' : '<i class="bi bi-cash-coin"></i>'}</button>
                    <button class="btn-editar btn-ico btn light btn-primary" title='Editar'><i class="bi bi-pencil-square"></i></button>
                    <button class="btn-eliminar btn-ico btn light btn-danger"  title='Eliminar'><i class="bi bi-trash"></i></button>
                </td>
            `;
            row.querySelector('.btn-ver').addEventListener('click', () => verGasto(gasto.id));
            row.querySelector('.btn-pagar').addEventListener('click', () => togglePagado(gasto.id));
            row.querySelector('.btn-editar').addEventListener('click', () => editarGasto(gasto.id));
            row.querySelector('.btn-eliminar').addEventListener('click', () => eliminarGasto(gasto.id));
        });

        actualizarResumen();
    }

    // Actualiza el resumen de gastos
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
            id: sessionStorage.getItem('id_gasto_mensual'),
            gasto_pagado: totalPagado,
            gasto_pendiente: pendientePagar,
            gasto_total: totalGastos
        };
        ajaxResumen(data_mensual);
    }

    // Actualiza el resumen en backend
    function ajaxResumen(data_mensual) {
        $.ajax({
            url: URL_BACKEND + '/gasto_mensual/actualizar',
            type: 'PUT',
            async: false,
            data: data_mensual,
            success: function (response) {
                console.log(response);
            },
            error: function (xhr, status, error) {
                console.error('Error al cargar los datos:', error);
                toastr.error('Ha ocurrido un error inesperado', 'Error');
            }
        });
    }

    // Modal para agregar/editar gasto
    function abrirModalGasto(gasto = null) {
        const modal = new bootstrap.Modal(document.getElementById('modalGasto'));
        document.getElementById('formGasto').reset();
        gastoEditando = gasto;
        document.getElementById('modalGastoLabel').innerText = gasto ? "Editar Gasto" : "Agregar Nuevo Gasto";

        // Mostrar u ocultar campos especiales
        document.getElementById('comprobante').parentElement.style.display = gasto ? 'block' : 'none';
        document.getElementById('pagado').parentElement.style.display = gasto ? 'block' : 'none';
        document.getElementById('categoria').parentElement.style.display = gasto ? 'block' : 'none';
        document.getElementById('fecha_vencimiento').parentElement.style.display = gasto ? 'block' : 'none';

        if (gasto) {
            document.getElementById('nombre_cuenta').value = gasto.nombre || "";
            document.getElementById('monto').value = gasto.monto || "";
            document.getElementById('descript').value = gasto.descripcion || "";
            document.getElementById('comprobante').value = gasto.comprobante || "";
            document.getElementById('categoria').value = gasto.categoria || "";
            document.getElementById('pagado').value = gasto.pagado || "0";
            // Formatea la fecha para el input tipo date
            if (gasto.fecha_vencimiento) {
                const partes = gasto.fecha_vencimiento.split('-');
                if (partes.length === 3) {
                    // Si viene como DD-MM-YYYY, conviértelo a YYYY-MM-DD
                    const fechaFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                    document.getElementById('fecha_vencimiento').value = fechaFormateada;
                } else {
                    document.getElementById('fecha_vencimiento').value = gasto.fecha_vencimiento;
                }
            }
        }

        modal.show();
    }

    // Modal para registrar pago
    function togglePagado(id) {
        document.getElementById('pagoId').value = id;
        const now = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        document.getElementById('fecha_pago').value = now;
        new bootstrap.Modal(document.getElementById('modalPago')).show();
    }

    // Editar gasto
    async function editarGasto(id) {
        const gasto = gastos.find(g => g.id === id);
        const formValues = await abrirModalGasto(gasto);
        // El submit del modal maneja la edición
    }

    // Eliminar gasto
    function eliminarGasto(id) {
        const descripcion = gastos.find(gasto => gasto.id === id).descripcion;
        Swal.fire({
            title: "<h5>¿Estás seguro de que quieres eliminar este gasto?</h5>",
            html: `<p><strong>${descripcion}</strong></p>`,
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Si, Eliminar",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                const eliminarGasto = { id, estado: 0 };
                $.ajax({
                    url: URL_BACKEND + '/gasto/eliminar',
                    type: 'PUT',
                    async: false,
                    data: eliminarGasto,
                    success: function () {
                        Swal.fire({
                            title: "Eliminado!",
                            text: "Tu gasto ha sido eliminado.",
                            icon: "info"
                        });
                        renderizarGastos();
                    },
                    error: function (xhr, status, error) {
                        console.error('Error al cargar los datos:', error);
                        toastr.error('Ha ocurrido un error inesperado', 'Error');
                    }
                });
            }
        });
    }

    // Evento para agregar gasto
    document.querySelector('.btn-agregar').addEventListener('click', () => abrirModalGasto());

    // Evento para agregar/editar gasto desde el modal
    document.getElementById('formGasto').addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre_cuenta').value.trim();
        const montoValue = document.getElementById('monto').value;
        const monto = parseFloat(montoValue);
        const descripcion = document.getElementById('descript').value.trim();
        const comprobante = document.getElementById('comprobante').value.trim();
        const categoria = document.getElementById('categoria').value.trim();
        const pagado = parseInt(document.getElementById('pagado').value);
        const fecha_vencimiento_raw = document.getElementById('fecha_vencimiento').value;
        const fecha_vencimiento = fecha_vencimiento_raw ? fecha_vencimiento_raw : null;

        if (!nombre || isNaN(monto) || monto <= 0) {
            alert("Por favor completa correctamente los campos obligatorios.");
            return;
        }

        const datosGasto = {
            nombre,
            monto,
            descripcion,
            comprobante,
            categoria,
            pagado
        };

        if (fecha_vencimiento) {
            datosGasto.fecha_vencimiento = fecha_vencimiento;
        }

        if (gastoEditando) {
            datosGasto.id = gastoEditando.id;
            $.ajax({
                url: URL_BACKEND + '/gasto/editar',
                type: 'PUT',
                async: false,
                data: datosGasto,
                success: function () {
                    toastr.success('Gasto editado correctamente', 'Editado');
                    bootstrap.Modal.getInstance(document.getElementById('modalGasto')).hide();
                    renderizarGastos();
                },
                error: function (xhr, status, error) {
                    console.error('Error al editar el gasto:', error);
                    toastr.error('Error al editar el gasto', 'Error');
                }
            });
        } else {
            datosGasto.id_gasto_mensual = sessionStorage.getItem('id_gasto_mensual');
            $.ajax({
                url: URL_BACKEND + '/gasto/agregar',
                type: 'POST',
                async: false,
                data: datosGasto,
                success: function () {
                    toastr.success('Nuevo gasto agregado', 'Agregado');
                    bootstrap.Modal.getInstance(document.getElementById('modalGasto')).hide();
                    renderizarGastos();
                },
                error: function (xhr, status, error) {
                    console.error('Error al agregar el gasto:', error);
                    toastr.error('Error al agregar el gasto', 'Error');
                }
            });
        }

        gastoEditando = null;
    });

    // Evento para registrar pago desde el modal
    document.getElementById('formPago').addEventListener('submit', function (e) {
        e.preventDefault();

        const id = document.getElementById('pagoId').value;
        const fecha_pago = document.getElementById('fecha_pago').value;

        $.ajax({
            url: URL_BACKEND + '/gasto/pagado',
            type: 'PUT',
            async: false,
            data: {
                id: id,
                pagado: 1,
                fecha_pago
            },
            success: function () {
                toastr.success("Pago registrado correctamente", "Éxito");
                bootstrap.Modal.getInstance(document.getElementById('modalPago')).hide();
                renderizarGastos();
            },
            error: function () {
                toastr.error("Error al registrar el pago", "Error");
            }
        });
    });

    // Eliminar gasto
    function verGasto(id) {
        const gasto = gastos.find(g => g.id === id);
        if (!gasto) return;

        const modal = new bootstrap.Modal(document.getElementById('modalVerGasto'));
        document.getElementById('verNombre').textContent = gasto.nombre;
        document.getElementById('verMonto').textContent = `$${gasto.monto.toFixed(2)}`;
        document.getElementById('verDescripcion').textContent = gasto.descripcion || "-";
        document.getElementById('verComprobante').textContent = gasto.comprobante || "-";
        document.getElementById('verCategoria').textContent = gasto.categoria || "-";
        document.getElementById('verPagado').textContent = gasto.pagado ? "Sí" : "No";
        document.getElementById('verFechaVencimiento').textContent = gasto.fecha_vencimiento || "-";
        document.getElementById('verFechaPago').textContent = gasto.fecha_pago || "-";

        modal.show();
    }

    // Inicializa la vista
    renderizarGastos();
})();