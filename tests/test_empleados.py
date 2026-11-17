from types import SimpleNamespace as NS

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.admin_empleados import get_clerk

client = TestClient(app)


def _usuario(id_, nombre, email, rol, banned=False):
    return NS(
        id=id_, first_name=nombre, last_name="Prueba",
        email_addresses=[NS(id=f"e_{id_}", email_address=email)],
        primary_email_address_id=f"e_{id_}",
        public_metadata={"role": rol} if rol else {},
        banned=banned, last_sign_in_at=1700000000000,
    )


class ClerkFalso:
    def __init__(self):
        self.llamadas = []
        self.falla_red = False
        self.usuarios = [
            _usuario("user_pytest_admin", "Admin", "admin@correo.com", "ADMINISTRADOR"),
            _usuario("user_ana", "Ana", "ana@correo.com", "EMPLEADO"),
        ]
        self.users = NS(list=self._listar, update_metadata=self._metadata, ban=self._ban, unban=self._unban)
        self.invitations = NS(list=self._inv_listar, create=self._inv_crear, revoke=self._inv_revocar)

    def _buscar(self, user_id):
        return next(u for u in self.usuarios if u.id == user_id)

    def _listar(self, request=None):
        if self.falla_red:
            raise httpx.ConnectError("sin red")
        return self.usuarios

    def _metadata(self, user_id, public_metadata=None, **_):
        self.llamadas.append(("metadata", user_id, public_metadata))
        usuario = self._buscar(user_id)
        usuario.public_metadata = {**usuario.public_metadata, **(public_metadata or {})}
        return usuario

    def _ban(self, user_id):
        self.llamadas.append(("ban", user_id))
        usuario = self._buscar(user_id)
        usuario.banned = True
        return usuario

    def _unban(self, user_id):
        self.llamadas.append(("unban", user_id))
        usuario = self._buscar(user_id)
        usuario.banned = False
        return usuario

    def _inv_listar(self, **_):
        return [NS(id="inv_1", email_address="nuevo@correo.com", public_metadata={"role": "EMPLEADO"}, created_at=1700000000000)]

    def _inv_crear(self, request):
        self.llamadas.append(("invitar", request))
        return NS(id="inv_2", email_address=request["email_address"], public_metadata=request["public_metadata"], created_at=1700000000000)

    def _inv_revocar(self, invitation_id):
        self.llamadas.append(("revocar", invitation_id))
        return NS()


@pytest.fixture
def clerk(monkeypatch):
    falso = ClerkFalso()
    app.dependency_overrides[get_clerk] = lambda: falso
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:5173")
    yield falso
    app.dependency_overrides.pop(get_clerk, None)


def test_admin_lista_usuarios_e_invitaciones(clerk, admin_clerk_headers):
    r = client.get("/admin/empleados/", headers=admin_clerk_headers)
    assert r.status_code == 200
    datos = r.json()
    assert {u["email"] for u in datos["usuarios"]} == {"admin@correo.com", "ana@correo.com"}
    assert datos["invitaciones"][0]["email"] == "nuevo@correo.com"
    yo = next(u for u in datos["usuarios"] if u["id"] == "user_pytest_admin")
    assert yo["es_actual"] is True


def test_empleado_no_puede_listar(clerk, empleado_clerk_headers):
    assert client.get("/admin/empleados/", headers=empleado_clerk_headers).status_code == 403


def test_invitar_envia_rol_y_redireccion(clerk, admin_clerk_headers):
    r = client.post(
        "/admin/empleados/invitaciones",
        json={"email": "nuevo2@correo.com", "rol": "EMPLEADO"},
        headers=admin_clerk_headers,
    )
    assert r.status_code == 201
    _, peticion = clerk.llamadas[-1]
    assert peticion["public_metadata"] == {"role": "EMPLEADO"}
    assert peticion["redirect_url"] == "http://localhost:5173/sign-up"


def test_invitar_con_rol_invalido_responde_422(clerk, admin_clerk_headers):
    r = client.post(
        "/admin/empleados/invitaciones",
        json={"email": "x@correo.com", "rol": "SUPERADMIN"},
        headers=admin_clerk_headers,
    )
    assert r.status_code == 422


def test_cambiar_rol_de_otro_usuario(clerk, admin_clerk_headers):
    r = client.put("/admin/empleados/user_ana/rol", json={"rol": "ADMINISTRADOR"}, headers=admin_clerk_headers)
    assert r.status_code == 200
    assert r.json()["rol"] == "ADMINISTRADOR"
    assert clerk.llamadas[-1] == ("metadata", "user_ana", {"role": "ADMINISTRADOR"})


def test_no_puede_cambiarse_su_propio_rol(clerk, admin_clerk_headers):
    r = client.put("/admin/empleados/user_pytest_admin/rol", json={"rol": "EMPLEADO"}, headers=admin_clerk_headers)
    assert r.status_code == 400
    assert clerk.llamadas == []


def test_desactivar_y_reactivar_otro_usuario(clerk, admin_clerk_headers):
    r = client.put("/admin/empleados/user_ana/estado", json={"activo": False}, headers=admin_clerk_headers)
    assert r.status_code == 200 and r.json()["activo"] is False
    assert clerk.llamadas[-1] == ("ban", "user_ana")

    r = client.put("/admin/empleados/user_ana/estado", json={"activo": True}, headers=admin_clerk_headers)
    assert r.status_code == 200 and r.json()["activo"] is True
    assert clerk.llamadas[-1] == ("unban", "user_ana")


def test_no_puede_desactivarse_a_si_mismo(clerk, admin_clerk_headers):
    r = client.put("/admin/empleados/user_pytest_admin/estado", json={"activo": False}, headers=admin_clerk_headers)
    assert r.status_code == 400
    assert clerk.llamadas == []


def test_falla_de_red_responde_502(clerk, admin_clerk_headers):
    clerk.falla_red = True
    assert client.get("/admin/empleados/", headers=admin_clerk_headers).status_code == 502


def test_revocar_invitacion(clerk, admin_clerk_headers):
    r = client.delete("/admin/empleados/invitaciones/inv_1", headers=admin_clerk_headers)
    assert r.status_code == 204
    assert clerk.llamadas[-1] == ("revocar", "inv_1")