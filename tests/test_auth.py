from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario
from app.security.hashing import hash_password

client = TestClient(app)

def _crear_usuario(email, password="clave123", rol=RolUsuario.ADMINISTRADOR):
    db = SessionLocal()
    if not db.query(Usuario).filter(Usuario.email == email).first():
        db.add(Usuario(nombre="Test", email=email, password_hash=hash_password(password), rol=rol))
        db.commit()
    db.close()

def test_login_credenciales_validas():
    _crear_usuario("admin_test@correo.com")
    response = client.post("/auth/login", json={"email": "admin_test@correo.com", "password": "clave123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_credenciales_invalidas():
    _crear_usuario("admin_test2@correo.com")
    response = client.post("/auth/login", json={"email": "admin_test2@correo.com", "password": "incorrecta"})
    assert response.status_code == 401

def test_ruta_protegida_sin_token():
    response = client.get("/financiero/balance?fecha_inicio=2026-09-01&fecha_fin=2026-09-01")
    assert response.status_code == 401

def test_empleado_no_accede_a_financiero():
    _crear_usuario("empleado_test@correo.com", rol=RolUsuario.EMPLEADO)
    token = client.post("/auth/login", json={"email": "empleado_test@correo.com", "password": "clave123"}).json()["access_token"]
    response = client.get(
        "/financiero/balance?fecha_inicio=2026-09-01&fecha_fin=2026-09-01",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403

def test_admin_accede_a_financiero():
    _crear_usuario("admin_test3@correo.com")
    token = client.post("/auth/login", json={"email": "admin_test3@correo.com", "password": "clave123"}).json()["access_token"]
    response = client.get(
        "/financiero/balance?fecha_inicio=2026-09-01&fecha_fin=2026-09-01",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200