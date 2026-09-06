import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_crear_categoria(admin_headers):
    nombre = f"Bebidas-{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/categorias/",
        json={"nombre": nombre, "descripcion": "Bebidas frías y calientes"},
        headers=admin_headers
    )
    assert response.status_code == 201
    assert response.json()["nombre"] == nombre


def test_crear_categoria_duplicada(admin_headers):
    nombre = f"Postres-{uuid.uuid4().hex[:8]}"
    client.post("/categorias/", json={"nombre": nombre}, headers=admin_headers)
    response = client.post("/categorias/", json={"nombre": nombre}, headers=admin_headers)
    assert response.status_code == 400