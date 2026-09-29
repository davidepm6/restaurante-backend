requiereSesion();

const rol = obtenerRol();
document.getElementById('rol-label').textContent = `Rol: ${rol}`;

if (rol !== 'ADMINISTRADOR') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }

    // --- Navegación (sidebar) ---
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(btn => {
    btn.addEventListener('click', () => {
        navItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(sec => sec.classList.add('hidden'));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
    });
    const primerVisible = Array.from(navItems).find(b => !b.classList.contains('hidden'));
    if (primerVisible) primerVisible.classList.add('active');

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
        <td class="admin-only"><button class="btn-ghost" onclick="eliminarCategoria(${c.id})">Eliminar</button></td>
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

    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) {
    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('cat-nombre').value;
        const descripcion = document.getElementById('cat-descripcion').value;
        const res = await apiFetch('/categorias/', { method: 'POST', body: JSON.stringify({ nombre, descripcion }) });
        if (res.ok) { e.target.reset(); mostrarToast('Categoría creada', 'ok'); cargarCategorias(); }
        else { const err = await res.json(); mostrarToast(err.detail, 'err'); }
    });
    }

    async function eliminarCategoria(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const res = await apiFetch(`/categorias/${id}`, { method: 'DELETE' });
    if (res.ok) { mostrarToast('Categoría eliminada', 'ok'); cargarCategorias(); }
    else { const err = await res.json(); mostrarToast(err.detail, 'err'); }
    }

    // --- Productos ---
    async function cargarProductos() {
    const res = await apiFetch('/productos/');
    const productos = await res.json();
    productosDisponibles = productos;
    const tbody = document.querySelector('#tabla-productos tbody');
    tbody.innerHTML = '';
    productos.forEach(p => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
        <td>${p.id}</td><td>${p.nombre}</td><td>${formatoMoneda(p.precio)}</td><td>${p.stock}</td><td>${p.categoria_id}</td>
        <td class="admin-only"><button class="btn-ghost" onclick="eliminarProducto(${p.id})">Desactivar</button></td>
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
        if (res.ok) { e.target.reset(); mostrarToast('Producto creado', 'ok'); cargarProductos(); }
        else { const err = await res.json(); mostrarToast(err.detail, 'err'); }
    });
    }

    async function eliminarProducto(id) {
    if (!confirm('¿Desactivar este producto?')) return;
    const res = await apiFetch(`/productos/${id}`, { method: 'DELETE' });
    if (res.ok) { mostrarToast('Producto desactivado', 'ok'); cargarProductos(); }
    }

    // --- Ventas: buscador + pedido ---
    let productosDisponibles = [];
    let pedidoActual = []; // { producto_id, nombre, precio, cantidad, stockDisponible }

    const inputBuscar = document.getElementById('buscar-producto');
    const listaResultados = document.getElementById('resultados-busqueda');

    if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
        const termino = inputBuscar.value.trim().toLowerCase();
        if (!termino) { listaResultados.classList.add('hidden'); listaResultados.innerHTML = ''; return; }

        const coincidencias = productosDisponibles
        .filter(p => p.nombre.toLowerCase().includes(termino))
        .slice(0, 8);

        listaResultados.innerHTML = '';
        if (coincidencias.length === 0) {
        listaResultados.innerHTML = `<li class="r-empty">Sin resultados para "${inputBuscar.value}"</li>`;
        } else {
        coincidencias.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `
            <span class="r-nombre">${p.nombre}</span>
            <span class="r-meta">${formatoMoneda(p.precio)} · stock ${p.stock}</span>
            `;
            li.addEventListener('click', () => {
            agregarAlPedido(p);
            inputBuscar.value = '';
            listaResultados.classList.add('hidden');
            listaResultados.innerHTML = '';
            inputBuscar.focus();
            });
            listaResultados.appendChild(li);
        });
        }
        listaResultados.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.venta-buscador')) {
        listaResultados.classList.add('hidden');
        }
    });
    }

    function agregarAlPedido(producto) {
    const existente = pedidoActual.find(i => i.producto_id === producto.id);
    if (existente) {
        if (existente.cantidad < producto.stock) existente.cantidad += 1;
        else mostrarToast(`No hay más stock disponible de "${producto.nombre}"`, 'err');
    } else {
        if (producto.stock < 1) { mostrarToast(`"${producto.nombre}" no tiene stock disponible`, 'err'); return; }
        pedidoActual.push({
        producto_id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        stockDisponible: producto.stock
        });
    }
    renderizarPedido();
    }

    function cambiarCantidad(producto_id, delta) {
    const item = pedidoActual.find(i => i.producto_id === producto_id);
    if (!item) return;
    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad < 1) {
        pedidoActual = pedidoActual.filter(i => i.producto_id !== producto_id);
    } else if (nuevaCantidad > item.stockDisponible) {
        mostrarToast('No puedes superar el stock disponible', 'err');
        return;
    } else {
        item.cantidad = nuevaCantidad;
    }
    renderizarPedido();
    }

    function quitarDelPedido(producto_id) {
    pedidoActual = pedidoActual.filter(i => i.producto_id !== producto_id);
    renderizarPedido();
    }

    function renderizarPedido() {
    const contenedor = document.getElementById('items-venta');
    const vacio = document.getElementById('pedido-vacio');
    const btnRegistrar = document.getElementById('btn-registrar-venta');

    contenedor.querySelectorAll('.pedido-item').forEach(el => el.remove());

    if (pedidoActual.length === 0) {
        vacio.style.display = 'block';
        btnRegistrar.disabled = true;
    } else {
        vacio.style.display = 'none';
        btnRegistrar.disabled = false;
        pedidoActual.forEach(item => {
        const fila = document.createElement('div');
        fila.className = 'pedido-item';
        fila.innerHTML = `
            <span class="pi-nombre">${item.nombre}</span>
            <div class="qty-control">
            <button type="button" onclick="cambiarCantidad(${item.producto_id}, -1)">−</button>
            <span>${item.cantidad}</span>
            <button type="button" onclick="cambiarCantidad(${item.producto_id}, 1)">+</button>
            </div>
            <span class="pi-precio">${formatoMoneda(item.precio * item.cantidad)}</span>
            <button type="button" class="pi-quitar" onclick="quitarDelPedido(${item.producto_id})">Quitar</button>
        `;
        contenedor.appendChild(fila);
        });
    }

    const total = pedidoActual.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    document.getElementById('venta-total').textContent = formatoMoneda(total);
    }

    const btnRegistrarVenta = document.getElementById('btn-registrar-venta');
    if (btnRegistrarVenta) {
    btnRegistrarVenta.addEventListener('click', async () => {
        const msg = document.getElementById('venta-msg');
        if (pedidoActual.length === 0) return;

        const items = pedidoActual.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad }));
        const res = await apiFetch('/ventas/', { method: 'POST', body: JSON.stringify({ items }) });
        const data = await res.json();

        if (res.ok) {
        msg.className = 'form-msg ok';
        msg.textContent = `Venta registrada. Total: ${formatoMoneda(data.total)}`;
        mostrarToast('Venta registrada correctamente', 'ok');
        pedidoActual = [];
        renderizarPedido();
        cargarProductos();
        if (rol === 'ADMINISTRADOR') cargarVentas();
        } else {
        msg.className = 'form-msg err';
        msg.textContent = data.detail;
        mostrarToast(data.detail, 'err');
        }
    });
    }

    async function cargarVentas() {
    const res = await apiFetch('/ventas/');
    if (!res.ok) return;
    const ventas = await res.json();
    const tbody = document.querySelector('#tabla-ventas tbody');
    tbody.innerHTML = '';
    ventas.forEach(v => {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${v.id}</td><td>${new Date(v.fecha).toLocaleString('es-CO')}</td><td>${formatoMoneda(v.total)}</td>`;
        tbody.appendChild(fila);
    });
    }

    // --- Financiero ---
    const btnFinanciero = document.getElementById('btn-consultar-financiero');
    if (btnFinanciero) {
    btnFinanciero.addEventListener('click', async () => {
        const desde = document.getElementById('fin-desde').value;
        const hasta = document.getElementById('fin-hasta').value;
        if (!desde || !hasta) { mostrarToast('Selecciona ambas fechas', 'err'); return; }
        const res = await apiFetch(`/financiero/balance?fecha_inicio=${desde}&fecha_fin=${hasta}`);
        const data = await res.json();
        const balancePositivo = data.balance >= 0;
        document.getElementById('resultado-financiero').innerHTML = `
        <div class="result-card"><div class="rc-label">Ingresos</div><div class="rc-value">${formatoMoneda(data.total_ingresos)}</div></div>
        <div class="result-card"><div class="rc-label">Egresos</div><div class="rc-value">${formatoMoneda(data.total_egresos)}</div></div>
        <div class="result-card ${balancePositivo ? 'positivo' : 'negativo'}"><div class="rc-label">Balance</div><div class="rc-value">${formatoMoneda(data.balance)}</div></div>
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
        if (res.ok) { e.target.reset(); mostrarToast('Egreso registrado', 'ok'); }
        else { const err = await res.json(); mostrarToast(JSON.stringify(err.detail), 'err'); }
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
        if (!anio || !mes) { mostrarToast('Indica año y mes', 'err'); return; }
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
        if (!anio || !mes) { mostrarToast('Indica año y mes', 'err'); return; }
        await descargarPdf(`/reportes/mensual/pdf?anio=${anio}&mes=${mes}`, `reporte_${anio}_${mes}.pdf`);
    });
    }

    function mostrarReporte(data) {
    const productos = data.productos_vendidos.map(p => `<li><span>${p.producto}</span><span>${p.cantidad} unidades</span></li>`).join('');
    const balancePositivo = data.balance >= 0;
    document.getElementById('resultado-reporte').innerHTML = `
        <p class="page-sub" style="margin:1rem 0;">Período: ${data.fecha_inicio} a ${data.fecha_fin}</p>
        <div class="result-cards">
        <div class="result-card"><div class="rc-label">Ventas totales</div><div class="rc-value">${formatoMoneda(data.ventas_totales)}</div></div>
        <div class="result-card"><div class="rc-label">Ingresos</div><div class="rc-value">${formatoMoneda(data.ingresos)}</div></div>
        <div class="result-card"><div class="rc-label">Egresos</div><div class="rc-value">${formatoMoneda(data.egresos)}</div></div>
        <div class="result-card ${balancePositivo ? 'positivo' : 'negativo'}"><div class="rc-label">Balance</div><div class="rc-value">${formatoMoneda(data.balance)}</div></div>
        </div>
        <h3 style="margin:1.6rem 0 0.4rem;">Productos vendidos</h3>
        <ul class="product-list">${productos || '<li>Sin ventas en el período</li>'}</ul>
    `;
    }

    async function descargarPdf(path, nombreArchivo) {
    const res = await apiFetch(path);
    if (!res.ok) { mostrarToast('No se pudo generar el PDF', 'err'); return; }
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
if (rol === 'ADMINISTRADOR') cargarVentas();