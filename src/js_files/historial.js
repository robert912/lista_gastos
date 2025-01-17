(() => {

    const monthlyTotalsTable = document.getElementById('monthly-totals').getElementsByTagName('tbody')[0];
    let chart;

    async function renderizarHistorial(){
        const dataMensuales = await loadListaAnual();
        if (dataMensuales) {
            updateMonthlyTotals(dataMensuales);
            updateChart(dataMensuales);
        }
    }

    function updateMonthlyTotals(dataMensuales) {
        const totals = {};
        dataMensuales.forEach(data => {
            const month = `${data.anio}-${String(data.mes).padStart(2, '0')}`; // Formato YYYY-MM
            if (!totals[month]) {
                totals[month] = { id:data.id ,total: 0, paid: 0, pending: 0 };
            }
            totals[month].total += data.gasto_total;
            totals[month].paid += data.gasto_pagado;
            totals[month].pending += data.gasto_pendiente;
        });

        monthlyTotalsTable.innerHTML = '';
        Object.entries(totals).sort((a, b) => a[0].localeCompare(b[0])).forEach(([month, data]) => {
            const row = monthlyTotalsTable.insertRow();
            row.innerHTML = `
            <td>${month}</td>
            <td>$${formatearValorPesos(data.total)}</td>
            <td>$${formatearValorPesos(data.paid)}</td>
            <td>$${formatearValorPesos(data.pending)}</td>
            <td class="gasto-acciones"><button class="btn-ver btn-ico btn light btn-primary" title='Ver gastos'><i class="bi bi-eye"></i></button></td>
            `;
            row.querySelector('.btn-ver').addEventListener('click', () => verGasto(data.id));
        });
    }

    async function updateChart(dataMensuales) {
        const totals = {};
        dataMensuales.forEach(data => {
            const month = `${data.anio}-${String(data.mes).padStart(2, '0')}`; // Formato YYYY-MM
            if (!totals[month]) {
                totals[month] = { total: 0, paid: 0, pending: 0 };
            }
            totals[month].total += data.gasto_total;
            totals[month].paid += data.gasto_pagado;
            totals[month].pending += data.gasto_pendiente;
        });

        // Ordenamos los meses
        const sortedMonths = Object.keys(totals).sort();
        const data = {
            labels: sortedMonths,
            datasets: [
                {
                    label: 'Total',
                    data: sortedMonths.map(month => totals[month].total),
                    backgroundColor: 'rgba(53, 162, 235, 0.5)', // Sin relleno
                    //borderColor: 'rgb(34, 89, 126)', // Color del borde
                    //borderWidth: 1, // Grosor del borde
                    stack: 'background',
                },
                {
                    label: 'Pagado',
                    data: sortedMonths.map(month => totals[month].paid),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)', // Relleno para "Pagado"
                    stack: 'expenses',
                },
                {
                    label: 'Pendiente',
                    data: sortedMonths.map(month => totals[month].pending),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)', // Relleno para "Pendiente"
                    stack: 'expenses',
                },
            ]
        };

        // Actualizamos el gráfico
        if (chart) {
            chart.data = data;
            chart.update();
        } else {
            const ctx = document.getElementById('expenseChart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    //plugins: {tooltip: {mode: 'index',}},
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true }
                    },
                    elements: {
                        bar: {
                            borderSkipped: false // Asegura que los bordes se vean completos
                        }
                    }
                }
            });
        }
    }


    async function loadListaAnual() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: URL_BACKEND + '/gasto_mensual/obtener',
                type: 'GET',
                data: { id_usuario: sessionStorage.getItem('idUsuario') },
                success: function (response) {
                    resolve(response['data']);
                },
                error: function (xhr, status, error) {
                    console.error('Error al cargar los datos:', error);
                    reject(error);
                    toastr.error('Ha ocurrido un error inesperado', 'Error');
                }
            });
        });
    }

    async function verGasto(id) {
        sessionStorage.setItem('id_gasto_mensual', id);
        loadPage('inicio');
    }

    renderizarHistorial();
})();