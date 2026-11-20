import uuid

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.venta import Venta

client = TestClient(app)


def _crear_producto(headers, stock=10, precio=15000, nombre="Hamburguesa") -> dict:
    cat = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=headers)
    assert cat.status_code == 201, cat.text
    prod = client.post(
        "/productos/",
        json={"nombre": nombre, "precio": precio, "stock": stock, "categoria_id": cat.json()["id"]},
        headers=headers,
    )
    assert prod.status_code == 201, prod.text
    return prod.json()


def _vender(headers, items, metodo="EFECTIVO"):
    cuerpo = {"items": items}
    if metodo is not None:
        cuerpo["metodo_pago"] = metodo
    return client.post("/ventas/", json=cuerpo, headers=headers)


def _stock(headers, producto_id) -> int:
    return client.get(f"/productos/{producto_id}", headers=headers).json()["stock"]


def test_registrar_venta_calcula_total_y_actualiza_stock(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=10)
    r = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 3}])
    assert r.status_code == 201
    assert r.json()["total"] == 45000
    assert r.json()["metodo_pago"] == "EFECTIVO"
    assert _stock(admin_clerk_headers, producto["id"]) == 7


def test_rechaza_venta_sin_stock_suficiente(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=2)
    r = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 5}])
    assert r.status_code == 400
    assert _stock(admin_clerk_headers, producto["id"]) == 2


def test_sin_metodo_de_pago_responde_422_y_no_toca_el_stock(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=4)
    r = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 1}], metodo=None)
    assert r.status_code == 422
    assert _stock(admin_clerk_headers, producto["id"]) == 4


def test_metodo_de_pago_desconocido_responde_422(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=4)
    r = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 1}], metodo="CHEQUE")
    assert r.status_code == 422
    assert _stock(admin_clerk_headers, producto["id"]) == 4


@pytest.mark.parametrize("metodo", ["EFECTIVO", "TARJETA", "TRANSFERENCIA"])
def test_cada_metodo_de_pago_valido_se_acepta(admin_clerk_headers, metodo):
    producto = _crear_producto(admin_clerk_headers, stock=5)
    r = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 1}], metodo=metodo)
    assert r.status_code == 201
    assert r.json()["metodo_pago"] == metodo


def test_el_metodo_de_pago_queda_guardado_en_la_base(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=5)
    r = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 1}], metodo="TARJETA")
    db = SessionLocal()
    try:
        assert db.query(Venta).filter(Venta.id == r.json()["id"]).first().metodo_pago == "TARJETA"
    finally:
        db.close()


def test_el_mismo_producto_en_varias_lineas_no_supera_el_stock(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=5)
    items = [{"producto_id": producto["id"], "cantidad": 3}, {"producto_id": producto["id"], "cantidad": 3}]
    r = _vender(admin_clerk_headers, items)
    assert r.status_code == 400
    assert _stock(admin_clerk_headers, producto["id"]) == 5


def test_el_mismo_producto_en_varias_lineas_se_suma_en_una_sola(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=5, precio=1000)
    items = [{"producto_id": producto["id"], "cantidad": 2}, {"producto_id": producto["id"], "cantidad": 3}]
    r = _vender(admin_clerk_headers, items)
    assert r.status_code == 201
    assert len(r.json()["detalles"]) == 1
    assert r.json()["detalles"][0]["cantidad"] == 5
    assert r.json()["total"] == 5000
    assert _stock(admin_clerk_headers, producto["id"]) == 0


def test_un_empleado_puede_registrar_ventas(admin_clerk_headers, empleado_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=5)
    r = _vender(empleado_clerk_headers, [{"producto_id": producto["id"], "cantidad": 1}], metodo="TRANSFERENCIA")
    assert r.status_code == 201


def test_venta_sin_productos_responde_400(admin_clerk_headers):
    assert _vender(admin_clerk_headers, []).status_code == 400


def test_producto_inexistente_responde_404(admin_clerk_headers):
    assert _vender(admin_clerk_headers, [{"producto_id": 999999, "cantidad": 1}]).status_code == 404


def test_la_consulta_de_una_venta_incluye_el_metodo_de_pago(admin_clerk_headers):
    producto = _crear_producto(admin_clerk_headers, stock=5)
    creada = _vender(admin_clerk_headers, [{"producto_id": producto["id"], "cantidad": 1}], metodo="TARJETA").json()
    r = client.get(f"/ventas/{creada['id']}", headers=admin_clerk_headers)
    assert r.status_code == 200
    assert r.json()["metodo_pago"] == "TARJETA"