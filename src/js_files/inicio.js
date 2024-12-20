let gastos = [
    { id: 1, descripcion: 'Alquiler', monto: 800, pagado: false },
    { id: 2, descripcion: 'Electricidad', monto: 50, pagado: false },
    { id: 3, descripcion: 'Agua', monto: 30, pagado: false },
    { id: 4, descripcion: 'Internet', monto: 60, pagado: false },
    { id: 5, descripcion: 'Teléfono', monto: 40, pagado: false },
];

const token = sessionStorage.getItem('access_token');
if (!token) {
    window.location.href = 'login.html';
}
function loadPersons() {
    $.ajax({
        url: 'http://localhost:5000/gastodelmes/obtener',
        type: 'GET',
        data: { id_usuario: 1},
        headers: {
            'Authorization': token
        },
        success: function(response) {
            toastr.success('Ha ocurrido nada inesperado', 'Success');
        },
        error: function() {
            toastr.error('Ha ocurrido un error inesperado', 'Error');
        }
    });
}

loadPersons();

const listaGastos = document.getElementById('listaGastos');
//const form = document.getElementById('nuevoGastoForm');
const descripcionInput = document.getElementById('descripcion');
const montoInput = document.getElementById('monto');

function renderizarGastos() {
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
                id: Date.now(),
                descripcion,
                monto,
                pagado: false
            };
            gastos.push(nuevoGasto);
            renderizarGastos();
        }
      }
}

function togglePagado(id) {
    gastos = gastos.map(gasto =>
        gasto.id === id ? { ...gasto, pagado: !gasto.pagado } : gasto
    );
    renderizarGastos();
}

async function editarGasto(id) {
    const gasto = gastos.find(g => g.id === id);
    const formValues = await modalGasto(gasto);
    if (formValues) {
        const nuevaDescripcion = formValues.descripcion;
        const nuevoMonto = formValues.monto;
        
        if (nuevaDescripcion !== null && nuevoMonto !== null) {
            gastos = gastos.map(g =>
                g.id === id ? { ...g, descripcion: nuevaDescripcion, monto: parseFloat(nuevoMonto) } : g
            );
            renderizarGastos();
        }
    }
}

function eliminarGasto(id) {
    Swal.fire({
        title: "<h5>¿Estás seguro de que quieres eliminar este gasto?</h5>",
        html: `
          <div>
            <label for="descript">Descripción</label>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Si, Eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            gastos = gastos.filter(gasto => gasto.id !== id);
            renderizarGastos();
            Swal.fire({
                title: "Eliminado!",
                text: "Tu gasto ha sido eliminado.",
                icon: "success"
            });
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