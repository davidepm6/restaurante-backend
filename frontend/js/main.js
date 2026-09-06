requiereSesion();

const rol = obtenerRol();
document.getElementById('rol-label').textContent = `Rol: ${rol}`;

if (rol !== 'ADMINISTRADOR') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
}

// --- Tabs ---
const tabButtons = document.querySelectorAll('.tab-btn');
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
});
tabButtons[0].classList.add('active');

// --- Categorías ---
async function cargarCategorias() {
    const res = await apiFetch('/categorias/');
    const categorias = await res.json();
    const tbody = document.querySelector('#tabla-categorias tbody');
    tbody.innerHTML = '';
    const selectProd = document.getElementById('prod-categoria');
    if (selectProd) selectProd.innerHTML = '';
    categorias.forEach(c => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${c.id}</td><td>${c.nombre}</td><td>${c.descripcion ?? ''}</td>
        <td class="admin-only"><button onclick="eliminarCategoria(${c.id})">Eliminar</button></td>
    `;
    tbody.appendChild(fila);
    if (selectProd) {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        selectProd.appendChild(opt);
    }
    });
if (rol !== 'ADMINISTRADOR') document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
}

document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('cat-nombre').value;
    const descripcion = document.getElementById('cat-descripcion').value;
    const res = await apiFetch('/categorias/', { method: 'POST', body: JSON.stringify({ nombre, descripcion }) });
    if (res.ok) { e.target.reset(); cargarCategorias(); }
    else { const err = await res.json(); alert(err.detail); }
});

async function eliminarCategoria(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const res = await apiFetch(`/categorias/${id}`, { method: 'DELETE' });
    if (res.ok) cargarCategorias();
    else { const err = await res.json(); alert(err.detail); }
}

// --- Productos ---
async function cargarProductos() {
    const res = await apiFetch('/productos/');
    const productos = await res.json();
    const tbody = document.querySelector('#tabla-productos tbody');
    tbody.innerHTML = '';
    productos.forEach(p => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${p.id}</td><td>${p.nombre}</td><td>$${p.precio}</td><td>${p.stock}</td><td>${p.categoria_id}</td>
        <td class="admin-only"><button onclick="eliminarProducto(${p.id})">Desactivar</button></td>
    `;
    tbody.appendChild(fila);
    });
    if (rol !== 'ADMINISTRADOR') document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
}

const formProducto = document.getElementById('form-producto');
if (formProducto) {
    formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        nombre: document.getElementById('prod-nombre').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        categoria_id: parseInt(document.getElementById('prod-categoria').value)
    };
    const res = await apiFetch('/productos/', { method: 'POST', body: JSON.stringify(body) });
    if (res.ok) { e.target.reset(); cargarProductos(); }
    else { const err = await res.json(); alert(err.detail); }
    });
}

async function eliminarProducto(id) {
    if (!confirm('¿Desactivar este producto?')) return;
    const res = await apiFetch(`/productos/${id}`, { method: 'DELETE' });
    if (res.ok) cargarProductos();
}

// --- Ventas ---
let productosDisponibles = [];

async function cargarProductosParaVenta() {
    const res = await apiFetch('/productos/');
    productosDisponibles = await res.json();
}

function agregarItemVenta() {
    const div = document.createElement('div');
    div.className = 'item-venta inline-form';
    const opciones = productosDisponibles.map(p => `<option value="${p.id}">${p.nombre} (stock: ${p.stock})</option>`).join('');
    div.innerHTML = `
    <select class="venta-producto">${opciones}</select>
    <input type="number" class="venta-cantidad" min="1" value="1" style="width:70px">
    <button onclick="this.parentElement.remove()">Quitar</button>
    `;
    document.getElementById('items-venta').appendChild(div);
}

document.getElementById('btn-agregar-item').addEventListener('click', agregarItemVenta);

document.getElementById('btn-registrar-venta').addEventListener('click', async () => {
    const items = Array.from(document.querySelectorAll('.item-venta')).map(div => ({
        producto_id: parseInt(div.querySelector('.venta-producto').value),
        cantidad: parseInt(div.querySelector('.venta-cantidad').value)
}));
    const msg = document.getElementById('venta-msg');
    if (items.length === 0) { msg.textContent = 'Agrega al menos un producto'; return; }
    const res = await apiFetch('/ventas/', { method: 'POST', body: JSON.stringify({ items }) });
    const data = await res.json();
    if (res.ok) {
    msg.style.color = 'green';
    msg.textContent = `Venta registrada. Total: $${data.total}`;
    document.getElementById('items-venta').innerHTML = '';
    cargarProductosParaVenta();
    cargarProductos();
    if (rol === 'ADMINISTRADOR') cargarVentas();
} else {
    msg.style.color = 'red';
    msg.textContent = data.detail;
}
});

async function cargarVentas() {
    const res = await apiFetch('/ventas/');
    if (!res.ok) return;
    const ventas = await res.json();
    const tbody = document.querySelector('#tabla-ventas tbody');
    tbody.innerHTML = '';
    ventas.forEach(v => {
    const fila = document.createElement('tr');
    fila.innerHTML = `<td>${v.id}</td><td>${new Date(v.fecha).toLocaleString()}</td><td>$${v.total}</td>`;
    tbody.appendChild(fila);
    });
}

// --- Financiero ---
const btnFinanciero = document.getElementById('btn-consultar-financiero');
if (btnFinanciero) {
    btnFinanciero.addEventListener('click', async () => {
        const desde = document.getElementById('fin-desde').value;
        const hasta = document.getElementById('fin-hasta').value;
        if (!desde || !hasta) { alert('Selecciona ambas fechas'); return; }
        const res = await apiFetch(`/financiero/balance?fecha_inicio=${desde}&fecha_fin=${hasta}`);
        const data = await res.json();
        document.getElementById('resultado-financiero').innerHTML = `
        <p>Ingresos: $${data.total_ingresos}</p>
        <p>Egresos: $${data.total_egresos}</p>
        <p><strong>Balance: $${data.balance}</strong></p>
    `;
    });
}

const formEgreso = document.getElementById('form-egreso');
if (formEgreso) {
    formEgreso.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        concepto: document.getElementById('egreso-concepto').value,
        valor: parseFloat(document.getElementById('egreso-valor').value),
        fecha: document.getElementById('egreso-fecha').value
    };
    const res = await apiFetch('/egresos/', { method: 'POST', body: JSON.stringify(body) });
    if (res.ok) { e.target.reset(); alert('Egreso registrado'); }
    else { const err = await res.json(); alert(JSON.stringify(err.detail)); }
    });
}

// --- Reportes ---
const btnRepDiario = document.getElementById('btn-reporte-diario');
if (btnRepDiario) {
btnRepDiario.addEventListener('click', async () => {
    const fecha = document.getElementById('rep-fecha').value || new Date().toISOString().slice(0, 10);
    const res = await apiFetch(`/reportes/diario?fecha=${fecha}`);
    const data = await res.json();
    mostrarReporte(data);
});

document.getElementById('btn-reporte-mensual').addEventListener('click', async () => {
    const anio = document.getElementById('rep-anio').value;
    const mes = document.getElementById('rep-mes').value;
    const res = await apiFetch(`/reportes/mensual?anio=${anio}&mes=${mes}`);
    const data = await res.json();
    mostrarReporte(data);
});

document.getElementById('btn-pdf-diario').addEventListener('click', async () => {
    const fecha = document.getElementById('rep-fecha').value || new Date().toISOString().slice(0, 10);
    await descargarPdf(`/reportes/diario/pdf?fecha=${fecha}`, `reporte_${fecha}.pdf`);
});

document.getElementById('btn-pdf-mensual').addEventListener('click', async () => {
    const anio = document.getElementById('rep-anio').value;
    const mes = document.getElementById('rep-mes').value;
    await descargarPdf(`/reportes/mensual/pdf?anio=${anio}&mes=${mes}`, `reporte_${anio}_${mes}.pdf`);
});
}

function mostrarReporte(data) {
const productos = data.productos_vendidos.map(p => `<li>${p.producto}: ${p.cantidad} unidades</li>`).join('');
document.getElementById('resultado-reporte').innerHTML = `
    <p>Período: ${data.fecha_inicio} a ${data.fecha_fin}</p>
    <p>Ventas totales: $${data.ventas_totales}</p>
    <p>Ingresos: $${data.ingresos} · Egresos: $${data.egresos} · Balance: $${data.balance}</p>
    <h4>Productos vendidos</h4>
    <ul>${productos || '<li>Sin ventas en el período</li>'}</ul>
    `;
}

async function descargarPdf(path, nombreArchivo) {
    const res = await apiFetch(path);
    if (!res.ok) { alert('No se pudo generar el PDF'); return; }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// --- Carga inicial ---
cargarCategorias();
cargarProductos();
cargarProductosParaVenta();
if (rol === 'ADMINISTRADOR') cargarVentas();