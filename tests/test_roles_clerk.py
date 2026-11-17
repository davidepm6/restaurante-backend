import uuid

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.venta import Venta

client = TestClient(app)
FECHAS = "fecha_inicio=2026-01-01&fecha_fin=2026-12-31"


def test_admin_con_clerk_accede_a_financiero(admin_clerk_headers):
    assert client.get(f"/financiero/balance?{FECHAS}", headers=admin_clerk_headers).status_code == 200


def test_empleado_con_clerk_no_accede_a_financiero(empleado_clerk_headers):
    assert client.get(f"/financiero/balance?{FECHAS}", headers=empleado_clerk_headers).status_code == 403


def test_empleado_con_clerk_puede_consultar_productos(empleado_clerk_headers):
    assert client.get("/productos/", headers=empleado_clerk_headers).status_code == 200


def test_empleado_con_clerk_no_puede_crear_categorias(empleado_clerk_headers):
    r = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=empleado_clerk_headers)
    assert r.status_code == 403


def test_cuenta_sin_rol_recibe_403_con_mensaje(sin_rol_clerk_headers):
    r = client.get("/categorias/", headers=sin_rol_clerk_headers)
    assert r.status_code == 403
    assert r.json()["detail"] == "Cuenta pendiente de asignación de rol"


def test_token_invalido_responde_401():
    r = client.get("/categorias/", headers={"Authorization": "Bearer esto-no-es-un-token"})
    assert r.status_code == 401


def test_venta_con_clerk_guarda_quien_la_registro(admin_clerk_headers, empleado_clerk_headers):
    cat = client.post(
        "/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=admin_clerk_headers
    ).json()
    prod = client.post(
        "/productos/",
        json={"nombre": "Producto Clerk", "precio": 10000, "stock": 5, "categoria_id": cat["id"]},
        headers=admin_clerk_headers,
    ).json()

    r = client.post(
        "/ventas/",
        json={"items": [{"producto_id": prod["id"], "cantidad": 2}]},
        headers=empleado_clerk_headers,
    )
    assert r.status_code == 201

    db = SessionLocal()
    try:
        venta = db.query(Venta).filter(Venta.id == r.json()["id"]).first()
        assert venta.registrada_por == "user_pytest_empleado"
        assert venta.registrada_por_nombre == "Empleado Pytest"
        assert venta.usuario_id is None
    finally:
        db.close()