import os

import pytest
from dotenv import dotenv_values, load_dotenv

# --- Guardia de seguridad (HU28): las pruebas SOLO corren contra la base de pruebas ---
_url_real = dotenv_values(".env").get("DATABASE_URL")
load_dotenv(".env.test", override=True)
_url_pruebas = os.getenv("DATABASE_URL")
if not _url_pruebas or _url_pruebas == _url_real:
    pytest.exit(
        "ABORTADO: las pruebas deben usar la base de pruebas (.env.test), distinta a la de uso real.",
        returncode=2,
    )

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.database import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.usuario import RolUsuario, Usuario  # noqa: E402
from app.security.hashing import hash_password  # noqa: E402

client = TestClient(app)

TABLAS = "detalle_ventas, ventas, productos, categorias, egresos, usuarios"


def _vaciar_tablas() -> None:
    with engine.begin() as conexion:
        conexion.execute(text(f"TRUNCATE TABLE {TABLAS} RESTART IDENTITY CASCADE"))


@pytest.fixture(scope="session", autouse=True)
def base_de_pruebas_limpia():
    _vaciar_tablas()
    yield
    _vaciar_tablas()


def _headers_para(email: str, rol: RolUsuario) -> dict:
    db = SessionLocal()
    if not db.query(Usuario).filter(Usuario.email == email).first():
        db.add(Usuario(nombre=email, email=email, password_hash=hash_password("clave123"), rol=rol))
        db.commit()
    db.close()
    token = client.post("/auth/login", json={"email": email, "password": "clave123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def admin_headers():
    return _headers_para("admin_pytest@correo.com", RolUsuario.ADMINISTRADOR)


@pytest.fixture(scope="session")
def empleado_headers():
    return _headers_para("empleado_pytest@correo.com", RolUsuario.EMPLEADO)