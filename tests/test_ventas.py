import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _crear_categoria_y_producto(admin_headers, nombre_prod="Hamburguesa", stock=10):
    nombre_categoria = f"Cat-{nombre_prod}-{uuid.uuid4().hex[:8]}"

    respuesta_categoria = client.post(
        "/categorias/", json={"nombre": nombre_categoria}, headers=admin_headers
    )
    assert respuesta_categoria.status_code == 201, respuesta_categoria.text
    categoria = respuesta_categoria.json()

    respuesta_producto = client.post(
        "/productos/",
        json={"nombre": nombre_prod, "precio": 15000, "stock": stock, "categoria_id": categoria["id"]},
        headers=admin_headers
    )
    assert respuesta_producto.status_code == 201, respuesta_producto.text
    return respuesta_producto.json()


def test_registrar_venta_calcula_total_y_actualiza_stock(admin_headers):
    producto = _crear_categoria_y_producto(admin_headers, stock=10)
    response = client.post(
        "/ventas/",
        json={"items": [{"producto_id": producto["id"], "cantidad": 3}]},
        headers=admin_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 45000

    producto_actualizado = client.get(f"/productos/{producto['id']}", headers=admin_headers).json()
    assert producto_actualizado["stock"] == 7


def test_rechaza_venta_sin_stock_suficiente(admin_headers):
    producto = _crear_categoria_y_producto(admin_headers, stock=2)
    response = client.post(
        "/ventas/",
        json={"items": [{"producto_id": producto["id"], "cantidad": 5}]},
        headers=admin_headers
    )
    assert response.status_code == 400

    producto_sin_cambios = client.get(f"/productos/{producto['id']}", headers=admin_headers).json()
    assert producto_sin_cambios["stock"] == 2