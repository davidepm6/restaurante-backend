from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_crear_categoria():
    response = client.post("/categorias/", json={"nombre": "Bebidas", "descripcion": "Bebidas frías y calientes"})
    assert response.status_code == 201
    assert response.json()["nombre"] == "Bebidas"

def test_crear_categoria_duplicada():
    client.post("/categorias/", json={"nombre": "Postres"})
    response = client.post("/categorias/", json={"nombre": "Postres"})
    assert response.status_code == 400