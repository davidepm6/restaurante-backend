from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.venta import Venta
from app.zona_horaria import hoy_negocio, limites_dia

client = TestClient(app)


def _crear_venta(fecha_utc: datetime, total: int) -> None:
    db = SessionLocal()
    try:
        db.add(Venta(total=total, fecha=fecha_utc))
        db.commit()
    finally:
        db.close()


def _diario(headers, fecha: str) -> dict:
    return client.get(f"/reportes/diario?fecha={fecha}", headers=headers).json()


def test_limites_del_dia_son_en_hora_de_colombia():
    desde, hasta = limites_dia(date(2031, 5, 9), date(2031, 5, 9))
    assert desde.astimezone(timezone.utc) == datetime(2031, 5, 9, 5, 0, tzinfo=timezone.utc)
    assert hasta.astimezone(timezone.utc) == datetime(2031, 5, 10, 5, 0, tzinfo=timezone.utc)


def test_hoy_negocio_devuelve_una_fecha():
    assert isinstance(hoy_negocio(), date)


def test_venta_nocturna_cuenta_en_el_dia_de_colombia(admin_clerk_headers):
    # 8:00 p. m. del 9 de mayo en Bogotá = 01:00 UTC del 10 de mayo
    _crear_venta(datetime(2031, 5, 10, 1, 0, tzinfo=timezone.utc), 10000)
    assert _diario(admin_clerk_headers, "2031-05-09")["ventas_totales"] == 10000
    assert _diario(admin_clerk_headers, "2031-05-10")["ventas_totales"] == 0


def test_limites_a_las_23_59_y_a_las_00_00(admin_clerk_headers):
    # 11:59:59 p. m. del 11 de mayo en Bogotá = 04:59:59 UTC del 12 → día 11
    _crear_venta(datetime(2031, 5, 12, 4, 59, 59, tzinfo=timezone.utc), 1000)
    # 12:00:00 a. m. del 12 de mayo en Bogotá = 05:00:00 UTC del 12 → día 12
    _crear_venta(datetime(2031, 5, 12, 5, 0, 0, tzinfo=timezone.utc), 2000)
    assert _diario(admin_clerk_headers, "2031-05-11")["ventas_totales"] == 1000
    assert _diario(admin_clerk_headers, "2031-05-12")["ventas_totales"] == 2000


def test_ingresos_usan_el_dia_de_colombia(admin_clerk_headers):
    # 9:00 p. m. del 1 de julio en Bogotá = 02:00 UTC del 2 de julio
    _crear_venta(datetime(2031, 7, 2, 2, 0, tzinfo=timezone.utc), 7000)
    dia1 = client.get("/financiero/ingresos?fecha_inicio=2031-07-01&fecha_fin=2031-07-01", headers=admin_clerk_headers).json()
    dia2 = client.get("/financiero/ingresos?fecha_inicio=2031-07-02&fecha_fin=2031-07-02", headers=admin_clerk_headers).json()
    assert dia1["total_ingresos"] == 7000
    assert dia2["total_ingresos"] == 0


def test_reporte_mensual_incluye_la_noche_del_ultimo_dia(admin_clerk_headers):
    # 10:00 p. m. del 31 de agosto en Bogotá = 03:00 UTC del 1 de septiembre
    _crear_venta(datetime(2031, 9, 1, 3, 0, tzinfo=timezone.utc), 5000)
    agosto = client.get("/reportes/mensual?anio=2031&mes=8", headers=admin_clerk_headers).json()
    septiembre = client.get("/reportes/mensual?anio=2031&mes=9", headers=admin_clerk_headers).json()
    assert agosto["ventas_totales"] == 5000
    assert septiembre["ventas_totales"] == 0