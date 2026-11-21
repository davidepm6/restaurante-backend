import uuid

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import _origenes_permitidos, app

client = TestClient(app)


def _categoria(headers) -> int:
    r = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_un_dato_obligatorio_faltante_se_explica_en_espanol(admin_clerk_headers):
    r = client.post("/ventas/", json={"items": []}, headers=admin_clerk_headers)
    assert r.status_code == 422
    cuerpo = r.json()
    assert isinstance(cuerpo["detail"], str)
    assert "metodo_pago: es obligatorio" in cuerpo["detail"]
    assert {"campo": "metodo_pago", "mensaje": "es obligatorio"} in cuerpo["errores"]


def test_un_valor_fuera_de_rango_indica_el_limite(admin_clerk_headers):
    cat = _categoria(admin_clerk_headers)
    r = client.post(
        "/productos/",
        json={"nombre": "Prod", "precio": 0, "stock": -1, "categoria_id": cat},
        headers=admin_clerk_headers,
    )
    assert r.status_code == 422
    detalle = r.json()["detail"]
    assert "precio: debe ser mayor que" in detalle
    assert "stock: no puede ser menor que 0" in detalle


def test_un_texto_demasiado_largo_indica_el_maximo(admin_clerk_headers):
    r = client.post("/categorias/", json={"nombre": "x" * 101}, headers=admin_clerk_headers)
    assert r.status_code == 422
    assert "nombre: no puede superar 100 caracteres" in r.json()["detail"]


def test_una_fecha_mal_escrita_se_explica(admin_clerk_headers):
    r = client.get("/ventas/?fecha_inicio=ayer", headers=admin_clerk_headers)
    assert r.status_code == 422
    assert "fecha_inicio: debe ser una fecha válida" in r.json()["detail"]


def test_un_error_inesperado_responde_json_legible_y_con_cabecera_cors(admin_clerk_headers):
    def _base_de_datos_rota():
        raise RuntimeError("fallo simulado")

    origen = _origenes_permitidos()[0]
    app.dependency_overrides[get_db] = _base_de_datos_rota
    try:
        # Con raise_server_exceptions=False el cliente de pruebas se comporta como un navegador real.
        cliente = TestClient(app, raise_server_exceptions=False)
        r = cliente.get("/categorias/", headers={**admin_clerk_headers, "Origin": origen})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert r.status_code == 500
    assert r.json() == {"detail": "Error interno del servidor. Intenta de nuevo."}
    assert r.headers["access-control-allow-origin"] == origen


def test_un_origen_no_permitido_no_recibe_la_cabecera_cors_ni_siquiera_en_un_error(admin_clerk_headers):
    def _base_de_datos_rota():
        raise RuntimeError("fallo simulado")

    app.dependency_overrides[get_db] = _base_de_datos_rota
    try:
        cliente = TestClient(app, raise_server_exceptions=False)
        r = cliente.get("/categorias/", headers={**admin_clerk_headers, "Origin": "https://sitio-ajeno.example"})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert r.status_code == 500
    assert "access-control-allow-origin" not in r.headers