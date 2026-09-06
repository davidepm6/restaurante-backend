from datetime import date
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_reporte_diario_admin(admin_headers):
    hoy = date.today().isoformat()
    response = client.get(f"/reportes/diario?fecha={hoy}", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    for campo in ["fecha_inicio", "fecha_fin", "ventas_totales", "ingresos", "egresos", "balance", "productos_vendidos"]:
        assert campo in data


def test_reporte_mensual_admin(admin_headers):
    hoy = date.today()
    response = client.get(f"/reportes/mensual?anio={hoy.year}&mes={hoy.month}", headers=admin_headers)
    assert response.status_code == 200
    assert "balance" in response.json()


def test_reporte_diario_rechaza_empleado(empleado_headers):
    hoy = date.today().isoformat()
    response = client.get(f"/reportes/diario?fecha={hoy}", headers=empleado_headers)
    assert response.status_code == 403


def test_reporte_mensual_rechaza_empleado(empleado_headers):
    hoy = date.today()
    response = client.get(f"/reportes/mensual?anio={hoy.year}&mes={hoy.month}", headers=empleado_headers)
    assert response.status_code == 403


def test_reporte_diario_pdf(admin_headers):
    hoy = date.today().isoformat()
    response = client.get(f"/reportes/diario/pdf?fecha={hoy}", headers=admin_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 0


def test_reporte_mensual_pdf(admin_headers):
    hoy = date.today()
    response = client.get(f"/reportes/mensual/pdf?anio={hoy.year}&mes={hoy.month}", headers=admin_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"