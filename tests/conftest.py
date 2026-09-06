import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario
from app.security.hashing import hash_password

client = TestClient(app)


@pytest.fixture(scope="session")
def admin_headers():
    db = SessionLocal()
    email = "admin_pytest@correo.com"
    if not db.query(Usuario).filter(Usuario.email == email).first():
        db.add(Usuario(
            nombre="Admin Pytest", email=email,
            password_hash=hash_password("clave123"),
            rol=RolUsuario.ADMINISTRADOR
        ))
        db.commit()
    db.close()

    token = client.post("/auth/login", json={"email": email, "password": "clave123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def empleado_headers():
    db = SessionLocal()
    email = "empleado_pytest@correo.com"
    if not db.query(Usuario).filter(Usuario.email == email).first():
        db.add(Usuario(
            nombre="Empleado Pytest", email=email,
            password_hash=hash_password("clave123"),
            rol=RolUsuario.EMPLEADO
        ))
        db.commit()
    db.close()

    token = client.post("/auth/login", json={"email": email, "password": "clave123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}