import uuid
from fastapi.testclient import TestClient
from app.main import app
from datetime import date, datetime, timedelta, timezone

client = TestClient(app)

def _hoy_utc() -> date:
    # La base guarda las ventas en UTC y las consultas del backend comparan por día UTC.
    return datetime.now(timezone.utc).date()


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

    hoy = _hoy_utc().isoformat()
    client.post(
        "/egresos/",
        json={"concepto": "Arriendo", "valor": 5000, "fecha": hoy},
        headers=admin_headers,
    )

    ingresos = client.get(
        f"/financiero/ingresos?fecha_inicio={hoy}&fecha_fin={hoy}",
        headers=admin_headers,
    ).json()
    egresos = client.get(
        f"/financiero/egresos?fecha_inicio={hoy}&fecha_fin={hoy}",
        headers=admin_headers,
    ).json()
    balance = client.get(
        f"/financiero/balance?fecha_inicio={hoy}&fecha_fin={hoy}",
        headers=admin_headers,
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