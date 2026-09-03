from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def _crear_venta(precio=10000, cantidad=2):
    cat = client.post("/categorias/", json={"nombre": "Cat-Financiero"}).json()
    prod = client.post("/productos/", json={
        "nombre": "Producto Financiero", "precio": precio, "stock": 100, "categoria_id": cat["id"]
    }).json()
    client.post("/ventas/", json={"items": [{"producto_id": prod["id"], "cantidad": cantidad}]})

def test_registrar_egreso_valida_valor_positivo():
    response = client.post("/egresos/", json={"concepto": "Gas", "valor": -5000, "fecha": "2026-09-02"})
    assert response.status_code == 422  # Pydantic rechaza valor <= 0

def test_ingresos_egresos_y_balance():
    _crear_venta(precio=20000, cantidad=1)  # ingreso = 20000
    client.post("/egresos/", json={"concepto": "Arriendo", "valor": 5000, "fecha": "2026-09-02"})

    ingresos = client.get("/financiero/ingresos?fecha_inicio=2026-09-02&fecha_fin=2026-09-02").json()
    egresos = client.get("/financiero/egresos?fecha_inicio=2026-09-02&fecha_fin=2026-09-02").json()
    balance = client.get("/financiero/balance?fecha_inicio=2026-09-02&fecha_fin=2026-09-02").json()

    assert ingresos["total_ingresos"] >= 20000
    assert egresos["total_egresos"] >= 5000
    assert balance["balance"] == balance["total_ingresos"] - balance["total_egresos"]

def test_periodo_sin_datos_devuelve_cero():
    response = client.get("/financiero/balance?fecha_inicio=2030-01-01&fecha_fin=2030-01-01")
    data = response.json()
    assert data["total_ingresos"] == 0
    assert data["total_egresos"] == 0
    assert data["balance"] == 0