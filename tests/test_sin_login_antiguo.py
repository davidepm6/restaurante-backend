import time

import jwt as pyjwt
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

RUTAS_PROTEGIDAS = [
    "/categorias/",
    "/productos/",
    "/ventas/",
    "/egresos/",
    "/financiero/balance?fecha_inicio=2026-01-01&fecha_fin=2026-01-02",
    "/reportes/diario",
    "/admin/empleados/",
    "/me",
]


def test_el_login_antiguo_ya_no_existe():
    r = client.post("/auth/login", json={"email": "a@correo.com", "password": "x"})
    assert r.status_code == 404


def test_un_token_del_login_antiguo_ya_no_vale():
    ahora = int(time.time())
    token = pyjwt.encode(
        {"sub": "admin@correo.com", "rol": "ADMINISTRADOR", "exp": ahora + 600},
        "una-clave-cualquiera",
        algorithm="HS256",
    )
    r = client.get("/categorias/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_todos_los_endpoints_de_negocio_exigen_token():
    for ruta in RUTAS_PROTEGIDAS:
        assert client.get(ruta).status_code == 401, ruta


def test_una_cuenta_sin_rol_recibe_403_con_mensaje(sin_rol_clerk_headers):
    r = client.get("/categorias/", headers=sin_rol_clerk_headers)
    assert r.status_code == 403
    assert r.json()["detail"] == "Cuenta pendiente de asignación de rol"