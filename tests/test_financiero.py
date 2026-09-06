import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _crear_venta(admin_headers, precio=10000, cantidad=2):
    nombre_categoria = f"Cat-Financiero-{uuid.uuid4().hex[:8]}"
    cat = client.post("/categorias/", json={"nombre": nombre_categoria}, headers=admin_headers).json()
    prod = client.post(
        "/productos/",
        json={"nombre": "Producto Financiero", "precio": precio, "stock": 100, "categoria_id": cat["id"]},
        headers=admin_headers
    ).json()
    client.post(
        "/ventas/",
        json={"items": [{"producto_id": prod["id"], "cantidad": cantidad}]},
        headers=admin_headers
    )


def test_registrar_egreso_valida_valor_positivo(admin_headers):
    response = client.post(
        "/egresos/", json={"concepto": "Gas", "valor": -5000, "fecha": "2026-09-02"}, headers=admin_headers
    )
    assert response.status_code == 422


def test_ingresos_egresos_y_balance(admin_headers):
    _crear_venta(admin_headers, precio=20000, cantidad=1)
    client.post(
        "/egresos/", json={"concepto": "Arriendo", "valor": 5000, "fecha": "2026-09-02"}, headers=admin_headers
    )

    ingresos = client.get(
        "/financiero/ingresos?fecha_inicio=2026-09-02&fecha_fin=2026-09-02", headers=admin_headers
    ).json()
    egresos = client.get(
        "/financiero/egresos?fecha_inicio=2026-09-02&fecha_fin=2026-09-02", headers=admin_headers
    ).json()
    balance = client.get(
        "/financiero/balance?fecha_inicio=2026-09-02&fecha_fin=2026-09-02", headers=admin_headers
    ).json()

    assert ingresos["total_ingresos"] >= 20000
    assert egresos["total_egresos"] >= 5000
    assert balance["balance"] == balance["total_ingresos"] - balance["total_egresos"]


def test_periodo_sin_datos_devuelve_cero(admin_headers):
    response = client.get(
        "/financiero/balance?fecha_inicio=2030-01-01&fecha_fin=2030-01-01", headers=admin_headers
    )
    data = response.json()
    assert data["total_ingresos"] == 0
    assert data["total_egresos"] == 0
    assert data["balance"] == 0