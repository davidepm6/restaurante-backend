import uuid
from datetime import timedelta

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.producto import Producto
from app.zona_horaria import hoy_negocio

client = TestClient(app)


def _producto(headers, stock=10, precio=1000) -> dict:
    cat = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=headers).json()
    r = client.post(
        "/productos/",
        json={"nombre": f"Prod-{uuid.uuid4().hex[:8]}", "precio": precio, "stock": stock, "categoria_id": cat["id"]},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def _vender(headers, items, metodo="EFECTIVO") -> dict:
    r = client.post("/ventas/", json={"items": items, "metodo_pago": metodo}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def _anular(headers, venta_id, motivo="Error de digitación"):
    return client.post(f"/ventas/{venta_id}/anular", json={"motivo": motivo}, headers=headers)


def _stock(headers, producto_id) -> int:
    return client.get(f"/productos/{producto_id}", headers=headers).json()["stock"]


def _ingresos_y_reporte(headers):
    hoy = hoy_negocio()
    desde = (hoy - timedelta(days=1)).isoformat()
    hasta = (hoy + timedelta(days=1)).isoformat()
    ingresos = client.get(
        f"/financiero/ingresos?fecha_inicio={desde}&fecha_fin={hasta}", headers=headers
    ).json()["total_ingresos"]
    reporte = client.get(f"/reportes/diario?fecha={hoy.isoformat()}", headers=headers).json()
    return ingresos, reporte


def test_anular_devuelve_el_stock_y_guarda_quien_motivo_y_cuando(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10)
    venta = _vender(admin_clerk_headers, [{"producto_id": p["id"], "cantidad": 3}])
    assert _stock(admin_clerk_headers, p["id"]) == 7

    r = _anular(admin_clerk_headers, venta["id"], "El cliente se arrepintió")
    assert r.status_code == 200
    datos = r.json()
    assert datos["estado"] == "ANULADA"
    assert datos["motivo_anulacion"] == "El cliente se arrepintió"
    assert datos["anulada_por_nombre"] == "Admin Pytest"
    assert datos["anulada_en"] is not None
    assert _stock(admin_clerk_headers, p["id"]) == 10


def test_anular_una_venta_con_varios_productos_devuelve_todos(admin_clerk_headers):
    a = _producto(admin_clerk_headers, stock=5)
    b = _producto(admin_clerk_headers, stock=8)
    venta = _vender(
        admin_clerk_headers,
        [{"producto_id": a["id"], "cantidad": 2}, {"producto_id": b["id"], "cantidad": 6}],
    )
    assert _anular(admin_clerk_headers, venta["id"]).status_code == 200
    assert _stock(admin_clerk_headers, a["id"]) == 5
    assert _stock(admin_clerk_headers, b["id"]) == 8


def test_no_se_puede_anular_dos_veces_ni_se_devuelve_el_stock_otra_vez(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10)
    venta = _vender(admin_clerk_headers, [{"producto_id": p["id"], "cantidad": 4}])
    assert _anular(admin_clerk_headers, venta["id"]).status_code == 200

    segunda = _anular(admin_clerk_headers, venta["id"])
    assert segunda.status_code == 409
    assert _stock(admin_clerk_headers, p["id"]) == 10


def test_un_empleado_no_puede_anular(admin_clerk_headers, empleado_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10)
    venta = _vender(empleado_clerk_headers, [{"producto_id": p["id"], "cantidad": 2}])
    assert _anular(empleado_clerk_headers, venta["id"]).status_code == 403
    assert _stock(admin_clerk_headers, p["id"]) == 8


def test_el_motivo_es_obligatorio_y_no_toca_nada(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10)
    venta = _vender(admin_clerk_headers, [{"producto_id": p["id"], "cantidad": 2}])

    sin_motivo = client.post(f"/ventas/{venta['id']}/anular", json={}, headers=admin_clerk_headers)
    muy_corto = _anular(admin_clerk_headers, venta["id"], "  a ")
    assert sin_motivo.status_code == 422
    assert muy_corto.status_code == 422
    assert _stock(admin_clerk_headers, p["id"]) == 8
    assert client.get(f"/ventas/{venta['id']}", headers=admin_clerk_headers).json()["estado"] == "COMPLETADA"


def test_anular_una_venta_inexistente_responde_404(admin_clerk_headers):
    assert _anular(admin_clerk_headers, 999999).status_code == 404


def test_si_el_producto_se_desactivo_el_stock_igual_se_devuelve(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10)
    venta = _vender(admin_clerk_headers, [{"producto_id": p["id"], "cantidad": 3}])
    assert client.delete(f"/productos/{p['id']}", headers=admin_clerk_headers).status_code == 200

    assert _anular(admin_clerk_headers, venta["id"]).status_code == 200
    db = SessionLocal()
    try:
        assert db.query(Producto).filter(Producto.id == p["id"]).first().stock == 10
    finally:
        db.close()


def test_la_venta_anulada_sigue_en_el_listado_pero_marcada(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10)
    venta = _vender(admin_clerk_headers, [{"producto_id": p["id"], "cantidad": 1}])
    _anular(admin_clerk_headers, venta["id"])

    hoy = hoy_negocio().isoformat()
    ventas = client.get(f"/ventas/?fecha_inicio={hoy}&fecha_fin={hoy}", headers=admin_clerk_headers).json()["items"]
    encontrada = next(v for v in ventas if v["id"] == venta["id"])
    assert encontrada["estado"] == "ANULADA"


def test_una_venta_anulada_deja_de_contar_en_ingresos_y_reportes(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=10, precio=20000)
    ingresos_antes, reporte_antes = _ingresos_y_reporte(admin_clerk_headers)

    venta = _vender(admin_clerk_headers, [{"producto_id": p["id"], "cantidad": 1}])
    ingresos_con, reporte_con = _ingresos_y_reporte(admin_clerk_headers)
    assert ingresos_con - ingresos_antes == 20000
    assert reporte_con["ventas_totales"] - reporte_antes["ventas_totales"] == 20000

    assert _anular(admin_clerk_headers, venta["id"]).status_code == 200
    ingresos_despues, reporte_despues = _ingresos_y_reporte(admin_clerk_headers)
    assert ingresos_despues == ingresos_antes
    assert reporte_despues["ventas_totales"] == reporte_antes["ventas_totales"]
    assert reporte_despues["balance"] == reporte_antes["balance"]
    assert p["nombre"] not in [x["producto"] for x in reporte_despues["productos_vendidos"]]