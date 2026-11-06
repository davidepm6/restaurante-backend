function guardarSesion(token, rol) {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
}

function obtenerToken() {
    return localStorage.getItem('token');
}

function obtenerRol() {
    return localStorage.getItem('rol');
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    window.location.href = 'index.html';
}

function requiereSesion() {
    if (!obtenerToken()) {
        window.location.href = 'index.html';
    }
}

async function apiFetch(path, options = {}) {
    const headers = options.headers || {};
    headers['Authorization'] = `Bearer ${obtenerToken()}`;
    if (options.body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401) {
        cerrarSesion();
        throw new Error('Sesión expirada');
    }
    return res;
}