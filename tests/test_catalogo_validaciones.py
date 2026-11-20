import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _nombre() -> str:
    return f"Cat-{uuid.uuid4().hex[:8]}"


def _crear_categoria(headers, nombre: str | None = None) -> dict:
    r = client.post("/categorias/", json={"nombre": nombre or _nombre()}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_el_nombre_se_guarda_sin_espacios_sobrantes(admin_clerk_headers):
    nombre = _nombre()
    r = client.post("/categorias/", json={"nombre": f"   {nombre}   "}, headers=admin_clerk_headers)
    assert r.status_code == 201
    assert r.json()["nombre"] == nombre


def test_nombre_vacio_o_solo_espacios_responde_422(admin_clerk_headers):
    for valor in ["", "    "]:
        r = client.post("/categorias/", json={"nombre": valor}, headers=admin_clerk_headers)
        assert r.status_code == 422


def test_descripcion_demasiado_larga_responde_422(admin_clerk_headers):
    r = client.post(
        "/categorias/", json={"nombre": _nombre(), "descripcion": "x" * 256}, headers=admin_clerk_headers
    )
    assert r.status_code == 422


def test_crear_con_nombre_repetido_ignorando_mayusculas_responde_400(admin_clerk_headers):
    existente = _crear_categoria(admin_clerk_headers)
    r = client.post("/categorias/", json={"nombre": existente["nombre"].upper()}, headers=admin_clerk_headers)
    assert r.status_code == 400


def test_renombrar_a_un_nombre_repetido_responde_400(admin_clerk_headers):
    a = _crear_categoria(admin_clerk_headers)
    b = _crear_categoria(admin_clerk_headers)
    r = client.put(f"/categorias/{b['id']}", json={"nombre": a["nombre"]}, headers=admin_clerk_headers)
    assert r.status_code == 400
    assert r.json()["detail"] == "Ya existe una categoría con ese nombre"


def test_renombrar_ignorando_mayusculas_tambien_responde_400(admin_clerk_headers):
    a = _crear_categoria(admin_clerk_headers)
    b = _crear_categoria(admin_clerk_headers)
    r = client.put(f"/categorias/{b['id']}", json={"nombre": a["nombre"].upper()}, headers=admin_clerk_headers)
    assert r.status_code == 400


def test_actualizar_una_categoria_con_su_propio_nombre_es_valido(admin_clerk_headers):
    cat = _crear_categoria(admin_clerk_headers)
    r = client.put(
        f"/categorias/{cat['id']}",
        json={"nombre": cat["nombre"], "descripcion": "Nueva descripción"},
        headers=admin_clerk_headers,
    )
    assert r.status_code == 200
    assert r.json()["descripcion"] == "Nueva descripción"


def test_eliminar_categoria_con_productos_explica_la_causa(admin_clerk_headers):
    cat = _crear_categoria(admin_clerk_headers)
    p = client.post(
        "/productos/",
        json={"nombre": "Producto X", "precio": 5000, "stock": 3, "categoria_id": cat["id"]},
        headers=admin_clerk_headers,
    )
    assert p.status_code == 201
    r = client.delete(f"/categorias/{cat['id']}", headers=admin_clerk_headers)
    assert r.status_code == 400
    assert "producto" in r.json()["detail"]


def test_producto_con_nombre_vacio_responde_422(admin_clerk_headers):
    cat = _crear_categoria(admin_clerk_headers)
    r = client.post(
        "/productos/",
        json={"nombre": "   ", "precio": 5000, "stock": 3, "categoria_id": cat["id"]},
        headers=admin_clerk_headers,
    )
    assert r.status_code == 422