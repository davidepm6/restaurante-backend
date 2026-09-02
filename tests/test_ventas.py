from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _crear_categoria_y_producto(nombre_prod="Hamburguesa", stock=10):
    cat = client.post("/categorias/", json={"nombre": f"Cat-{nombre_prod}"}).json()
    prod = client.post("/productos/", json={
        "nombre": nombre_prod, "precio": 15000, "stock": stock, "categoria_id": cat["id"]
    }).json()
    return prod

def test_registrar_venta_calcula_total_y_actualiza_stock():
    producto = _crear_categoria_y_producto(stock=10)
    response = client.post("/ventas/", json={"items": [{"producto_id": producto["id"], "cantidad": 3}]})
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == 45000

    producto_actualizado = client.get(f"/productos/{producto['id']}").json()
    assert producto_actualizado["stock"] == 7

def test_rechaza_venta_sin_stock_suficiente():
    producto = _crear_categoria_y_producto(stock=2)
    response = client.post("/ventas/", json={"items": [{"producto_id": producto["id"], "cantidad": 5}]})
    assert response.status_code == 400

    producto_sin_cambios = client.get(f"/productos/{producto['id']}").json()
    assert producto_sin_cambios["stock"] == 2  # no se tocó el stock