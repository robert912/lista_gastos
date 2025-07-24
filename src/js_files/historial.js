(() => {
    // Título con icono
    document.getElementById('page-title-header').innerHTML = `<i class="bi bi-graph-up-arrow"></i> Historial de Gastos Mensuales`;

    const monthlyTotalsTable = document.getElementById('monthly-totals').getElementsByTagName('tbody')[0];
    let chart;

    // Renderiza historial completo
    async function renderizarHistorial() {
        try {
            const dataMensuales = await loadListaAnual();
            if (dataMensuales && dataMensuales.length) {
                updateMonthlyTotals(dataMensuales);
                updateChart(dataMensuales);
            } else {
                monthlyTotalsTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay datos para mostrar</td></tr>`;
                if (chart) chart.destroy();
            }
        } catch (error) {
            monthlyTotalsTable.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar historial</td></tr>`;
        }
    }

    // Actualiza la tabla de totales mensuales
    function updateMonthlyTotals(dataMensuales) {
        const totals = {};
        dataMensuales.forEach(data => {
            const month = `${data.anio}-${String(data.mes).padStart(2, '0')}`;
            if (!totals[month]) {
                totals[month] = { id: data.id, total: 0, paid: 0, pending: 0 };
            }
            totals[month].total += data.gasto_total;
            totals[month].paid += data.gasto_pagado;
            totals[month].pending += data.gasto_pendiente;
        });

        monthlyTotalsTable.innerHTML = '';
        Object.entries(totals)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .forEach(([month, data]) => {
                const row = monthlyTotalsTable.insertRow();
                row.innerHTML = `
                    <td class="fw-semibold">${formatMonth(month)}</td>
                    <td class="text-danger fw-bold">$${formatearValorPesos(data.total)}</td>
                    <td class="text-success fw-bold">$${formatearValorPesos(data.paid)}</td>
                    <td class="text-warning fw-bold">$${formatearValorPesos(data.pending)}</td>
                    <td class="gasto-acciones text-center">
                        <button class="btn-ico btn light btn-info btn-ver" title="Ver gastos del mes">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                `;
                row.querySelector('.btn-ver').addEventListener('click', () => verGasto(data.id));
            });
    }

    // Actualiza el gráfico de barras
    function updateChart(dataMensuales) {
        const totals = {};
        dataMensuales.forEach(data => {
            const month = `${data.anio}-${String(data.mes).padStart(2, '0')}`;
            if (!totals[month]) {
                totals[month] = { total: 0, paid: 0, pending: 0 };
            }
            totals[month].total += data.gasto_total;
            totals[month].paid += data.gasto_pagado;
            totals[month].pending += data.gasto_pendiente;
        });

        const sortedMonths = Object.keys(totals).sort();
        const data = {
            labels: sortedMonths.map(formatMonth),
            datasets: [
                {
                    label: 'Total',
                    data: sortedMonths.map(month => totals[month].total),
                    backgroundColor: 'rgba(53, 162, 235, 0.3)', // Color más suave
                    borderColor: 'rgb(34, 89, 126)',
                    borderWidth: 1,
                    stack: 'total', // <-- stack diferente
                    type: 'line',   // Opcional: lo puedes mostrar como línea para destacar que es el total
                    fill: false
                },
                {
                    label: 'Pagado',
                    data: sortedMonths.map(month => totals[month].paid),
                    backgroundColor: 'rgba(25, 135, 84, 0.7)', // Bootstrap success
                    stack: 'expenses',
                },
                {
                    label: 'Pendiente',
                    data: sortedMonths.map(month => totals[month].pending),
                    backgroundColor: 'rgba(255, 193, 7, 0.7)', // Bootstrap warning
                    stack: 'expenses',
                },
            ]
        };

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
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index' }
                    },
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true }
                    },
                    elements: {
                        bar: { borderSkipped: false }
                    }
                }
            });
        }
    }

    // Carga los datos anuales
    async function loadListaAnual() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: URL_BACKEND + '/gasto_mensual/obtener',
                type: 'GET',
                data: { id_hogar: sessionStorage.getItem('id_hogar') },
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

    // Navega al detalle de gastos del mes
    async function verGasto(id) {
        sessionStorage.setItem('id_gasto_mensual', id);
        loadPage('inicio');
    }

    // Formatea el mes YYYY-MM a texto legible
    function formatMonth(monthStr) {
        const [anio, mes] = monthStr.split('-');
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${meses[parseInt(mes, 10) - 1]} ${anio}`;
    }

    // Utilidad para formatear valores en pesos
    function formatearValorPesos(valor) {
        return Number(valor).toLocaleString('es-CL', { minimumFractionDigits: 0 });
    }

    // Inicializa historial
    renderizarHistorial();
})();