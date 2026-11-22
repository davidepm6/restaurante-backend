import uuid
from datetime import date, datetime, time, timedelta, timezone

from fastapi.testclient import TestClient

from app.dashboard import rellenar_dias
from app.database import SessionLocal
from app.main import app
from app.models.venta import Venta
from app.zona_horaria import hoy_negocio

client = TestClient(app)


# ---------- La función que completa los días ----------

def test_rellenar_dias_completa_los_dias_sin_ventas_con_ceros():
    filas = rellenar_dias(date(2026, 11, 1), date(2026, 11, 5), {date(2026, 11, 2): (3, 9000.0), date(2026, 11, 5): (1, 500.0)})
    assert [f.fecha.day for f in filas] == [1, 2, 3, 4, 5]
    assert [(f.ventas, f.total) for f in filas] == [(0, 0.0), (3, 9000.0), (0, 0.0), (0, 0.0), (1, 500.0)]


def test_rellenar_dias_cruza_el_cambio_de_mes():
    filas = rellenar_dias(date(2026, 11, 29), date(2026, 12, 2), {})
    assert [f.fecha.isoformat() for f in filas] == ["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]


def test_rellenar_dias_un_solo_dia():
    assert len(rellenar_dias(date(2026, 11, 1), date(2026, 11, 1), {})) == 1


# ---------- Ayudas ----------

def _dashboard(headers, dias: int = 14) -> dict:
    r = client.get(f"/dashboard?dias={dias}", headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def _producto(headers, stock=100, precio=6000, minimo=0) -> dict:
    cat = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=headers).json()
    r = client.post(
        "/productos/",
        json={
            "nombre": f"Prod-{uuid.uuid4().hex[:8]}",
            "precio": precio,
            "stock": stock,
            "stock_minimo": minimo,
            "categoria_id": cat["id"],
        },
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def _vender(headers, producto_id: int, cantidad: int = 1, metodo: str = "EFECTIVO") -> dict:
    r = client.post(
        "/ventas/",
        json={"items": [{"producto_id": producto_id, "cantidad": cantidad}], "metodo_pago": metodo},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def _por_metodo(datos: dict, metodo: str) -> dict:
    return next((m for m in datos["por_metodo_pago"] if m["metodo"] == metodo), {"ventas": 0, "total": 0.0})


def _entrada_del_dia(datos: dict, fecha: date) -> dict:
    return next(d for d in datos["ventas_por_dia"] if d["fecha"] == fecha.isoformat())


# ---------- Estructura ----------

def test_la_respuesta_trae_todos_los_bloques_con_las_fechas_de_colombia(admin_clerk_headers):
    datos = _dashboard(admin_clerk_headers)
    hoy = hoy_negocio()

    assert datos["hoy"] == hoy.isoformat()
    assert datos["dia"]["desde"] == datos["dia"]["hasta"] == hoy.isoformat()
    assert datos["mes"]["desde"] == hoy.replace(day=1).isoformat()
    assert datos["mes"]["hasta"] == hoy.isoformat()
    for bloque in ("dia", "mes"):
        assert datos[bloque]["balance"] == round(datos[bloque]["ingresos"] - datos[bloque]["egresos"], 2)
    assert set(datos["stock_bajo"]) == {"cantidad", "productos"}


def test_el_grafico_trae_un_dia_por_cada_dia_pedido_terminando_hoy(admin_clerk_headers):
    datos = _dashboard(admin_clerk_headers, dias=14)
    fechas = [date.fromisoformat(d["fecha"]) for d in datos["ventas_por_dia"]]

    assert len(fechas) == 14
    assert fechas[-1] == hoy_negocio()
    assert all(b - a == timedelta(days=1) for a, b in zip(fechas, fechas[1:]))


def test_se_pueden_pedir_entre_7_y_31_dias_y_nada_fuera_de_ese_rango(admin_clerk_headers):
    assert len(_dashboard(admin_clerk_headers, dias=7)["ventas_por_dia"]) == 7
    assert len(_dashboard(admin_clerk_headers, dias=31)["ventas_por_dia"]) == 31
    for dias in (6, 32):
        r = client.get(f"/dashboard?dias={dias}", headers=admin_clerk_headers)
        assert r.status_code == 422
        assert "dias:" in r.json()["detail"]


# ---------- Las cifras cambian cuando cambian las ventas ----------

def test_una_venta_suma_al_dia_al_mes_al_grafico_y_a_su_metodo(admin_clerk_headers):
    p = _producto(admin_clerk_headers, precio=6000)
    antes = _dashboard(admin_clerk_headers)

    _vender(admin_clerk_headers, p["id"], cantidad=2, metodo="TRANSFERENCIA")
    despues = _dashboard(admin_clerk_headers)

    for bloque in ("dia", "mes"):
        assert despues[bloque]["ventas"] - antes[bloque]["ventas"] == 1
        assert despues[bloque]["ingresos"] - antes[bloque]["ingresos"] == 12000
        assert despues[bloque]["balance"] - antes[bloque]["balance"] == 12000

    hoy = hoy_negocio()
    assert _entrada_del_dia(despues, hoy)["total"] - _entrada_del_dia(antes, hoy)["total"] == 12000
    assert _entrada_del_dia(despues, hoy)["ventas"] - _entrada_del_dia(antes, hoy)["ventas"] == 1

    metodo_antes, metodo_despues = _por_metodo(antes, "TRANSFERENCIA"), _por_metodo(despues, "TRANSFERENCIA")
    assert metodo_despues["total"] - metodo_antes["total"] == 12000
    assert metodo_despues["ventas"] - metodo_antes["ventas"] == 1


def test_una_venta_anulada_deja_de_contar_en_todos_los_indicadores(admin_clerk_headers):
    p = _producto(admin_clerk_headers, precio=6000)
    antes = _dashboard(admin_clerk_headers)

    venta = _vender(admin_clerk_headers, p["id"], cantidad=3, metodo="TARJETA")
    anulada = client.post(f"/ventas/{venta['id']}/anular", json={"motivo": "Error de digitación"}, headers=admin_clerk_headers)
    assert anulada.status_code == 200
    despues = _dashboard(admin_clerk_headers)

    for bloque in ("dia", "mes"):
        assert despues[bloque]["ventas"] == antes[bloque]["ventas"]
        assert despues[bloque]["ingresos"] == antes[bloque]["ingresos"]
    hoy = hoy_negocio()
    assert _entrada_del_dia(despues, hoy) == _entrada_del_dia(antes, hoy)
    assert _por_metodo(despues, "TARJETA") == _por_metodo(antes, "TARJETA")


def test_un_egreso_baja_el_balance_del_dia_y_del_mes(admin_clerk_headers):
    antes = _dashboard(admin_clerk_headers)
    r = client.post(
        "/egresos/",
        json={"concepto": "Gas", "valor": 5000, "fecha": hoy_negocio().isoformat()},
        headers=admin_clerk_headers,
    )
    assert r.status_code == 201, r.text
    despues = _dashboard(admin_clerk_headers)

    for bloque in ("dia", "mes"):
        assert despues[bloque]["egresos"] - antes[bloque]["egresos"] == 5000
        assert despues[bloque]["balance"] - antes[bloque]["balance"] == -5000
        assert despues[bloque]["ingresos"] == antes[bloque]["ingresos"]


def test_una_venta_de_la_noche_cuenta_en_su_dia_de_colombia_y_no_en_el_siguiente(admin_clerk_headers):
    hoy = hoy_negocio()
    ayer = hoy - timedelta(days=1)
    antes = _dashboard(admin_clerk_headers)

    # 8:00 p. m. de ayer en Bogotá = 01:00 UTC de hoy
    db = SessionLocal()
    try:
        db.add(Venta(total=7777, fecha=datetime.combine(hoy, time(1, 0), tzinfo=timezone.utc), estado="COMPLETADA"))
        db.commit()
    finally:
        db.close()
    despues = _dashboard(admin_clerk_headers)

    assert _entrada_del_dia(despues, ayer)["total"] - _entrada_del_dia(antes, ayer)["total"] == 7777
    assert _entrada_del_dia(despues, hoy)["total"] == _entrada_del_dia(antes, hoy)["total"]
    assert despues["dia"]["ingresos"] == antes["dia"]["ingresos"]


def test_las_ventas_sin_metodo_se_agrupan_aparte(admin_clerk_headers):
    antes = _dashboard(admin_clerk_headers)
    db = SessionLocal()
    try:
        db.add(Venta(total=3333, fecha=datetime.now(timezone.utc), estado="COMPLETADA", metodo_pago=None))
        db.commit()
    finally:
        db.close()
    despues = _dashboard(admin_clerk_headers)

    assert _por_metodo(despues, "SIN_METODO")["total"] - _por_metodo(antes, "SIN_METODO")["total"] == 3333


def test_el_producto_mas_vendido_del_mes_aparece_primero_con_sus_totales(admin_clerk_headers):
    p = _producto(admin_clerk_headers, stock=1000, precio=100)
    _vender(admin_clerk_headers, p["id"], cantidad=500)

    mas_vendidos = _dashboard(admin_clerk_headers)["mas_vendidos"]
    assert len(mas_vendidos) <= 5
    assert mas_vendidos[0]["producto_id"] == p["id"]
    assert mas_vendidos[0]["cantidad"] == 500
    assert mas_vendidos[0]["total"] == 50000
    cantidades = [m["cantidad"] for m in mas_vendidos]
    assert cantidades == sorted(cantidades, reverse=True)


def test_el_stock_bajo_cuenta_los_productos_y_lista_los_mas_urgentes(admin_clerk_headers):
    antes = _dashboard(admin_clerk_headers)["stock_bajo"]
    _producto(admin_clerk_headers, stock=1, minimo=5)
    despues = _dashboard(admin_clerk_headers)["stock_bajo"]

    assert despues["cantidad"] - antes["cantidad"] == 1
    assert len(despues["productos"]) <= 5
    assert despues["cantidad"] >= len(despues["productos"])
    assert all(p["stock"] <= p["stock_minimo"] for p in despues["productos"])
    stocks = [p["stock"] for p in despues["productos"]]
    assert stocks == sorted(stocks)  # los más urgentes (menos unidades) primero


# ---------- Quién puede verlo ----------

def test_un_empleado_no_puede_ver_el_dashboard(empleado_clerk_headers):
    assert client.get("/dashboard", headers=empleado_clerk_headers).status_code == 403


def test_una_cuenta_sin_rol_tampoco(sin_rol_clerk_headers):
    assert client.get("/dashboard", headers=sin_rol_clerk_headers).status_code == 403


def test_sin_token_responde_401():
    assert client.get("/dashboard").status_code == 401