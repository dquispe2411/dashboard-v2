async function cargarDatos() {
    const response = await fetch('data/Reporte.csv');
    const text = await response.text();
    const rows = text.split('\n').map(row => row.split(';'));
    const headers = rows.shift();
    const datos = rows.map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim());
        return obj;
    });

    generarKPI(datos);
    generarGraficos(datos);
    generarTabla(datos);
}

function generarKPI(data) {
    const total = data.reduce((acc, d) => acc + (parseInt(d['Valor SKU Total']) || 0), 0);
    const cantidad = data.length;
    const promedio = cantidad > 0 ? total / cantidad : 0;

    document.getElementById('kpis').innerText = `🎯 Ticket Promedio: $${promedio.toFixed(0)}`;
}

function generarGraficos(data) {
    const porDia = {};
    const porProducto = {};
    const porCanal = {};
    const porMetodo = {};
    const porRegion = {};
    const retiroTienda = {};

    data.forEach(d => {
        const fecha = d['Fecha Trx'];
        const producto = d['Producto'];
        const canal = d['Canal'];
        const metodo = d['Método de Entrega'];
        const region = d['Región'];
        const sucursal = d['Sucursal'];

        const valor = parseInt(d['Valor SKU Total']) || 0;

        if (fecha) porDia[fecha] = (porDia[fecha] || 0) + valor;
        if (producto) porProducto[producto] = (porProducto[producto] || 0) + valor;
        if (canal) porCanal[canal] = (porCanal[canal] || 0) + valor;
        if (metodo) porMetodo[metodo] = (porMetodo[metodo] || 0) + valor;
        if (region) porRegion[region] = (porRegion[region] || 0) + valor;
        if (metodo === 'Retiro en Tienda' && sucursal) retiroTienda[sucursal] = (retiroTienda[sucursal] || 0) + valor;
    });

    crearGrafico('ventasPorDia', 'Venta diaria', porDia);
    crearGrafico('productoMasVendido', 'Producto más vendido', porProducto, true);
    crearGrafico('ventasPorCanal', 'Ventas por canal', porCanal);
    crearGrafico('ventasPorMetodoEntrega', 'Método de entrega', porMetodo);
    crearGrafico('ventasPorRegion', 'Región con más ventas', porRegion);
    crearGrafico('retiroEnTienda', 'Ranking tiendas (retiro)', retiroTienda);
}

function crearGrafico(id, label, datos, top10 = false) {
    let labels = Object.keys(datos);
    let valores = Object.values(datos);
    if (top10) {
        const combinado = labels.map((l, i) => ({ label: l, value: valores[i] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
        labels = combinado.map(c => c.label);
        valores = combinado.map(c => c.value);
    }

    new Chart(document.getElementById(id), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: valores,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        }
    });
}

function generarTabla(data) {
    const tabla = document.getElementById('tablaDatos');
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);

    let html = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    html += data.map(row => '<tr>' + headers.map(h => `<td>${row[h]}</td>`).join('') + '</tr>').join('');
    html += '</tbody>';

    tabla.innerHTML = html;
}

function filtrarTabla() {
    const q = document.getElementById('buscador').value.toLowerCase();
    const filas = document.querySelectorAll('#tablaDatos tbody tr');
    filas.forEach(fila => {
        const texto = fila.innerText.toLowerCase();
        fila.style.display = texto.includes(q) ? '' : 'none';
    });
}

cargarDatos();