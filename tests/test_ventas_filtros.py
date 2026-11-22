from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.venta import Venta

client = TestClient(app)

DIA = "2034-04-12"
BASE = datetime(2034, 4, 12, 15, 0, tzinfo=timezone.utc)  # 10:00 a. m. en Bogotá
ANA = "user_filtro_ana"
LUIS = "user_filtro_luis"
CARLOS = "user_filtro_carlos"

# (total, estado, método, id del empleado, nombre)
VENTAS = [
    (1000, "COMPLETADA", "EFECTIVO", ANA, "Ana"),
    (2000, "COMPLETADA", "TARJETA", ANA, "Ana"),
    (4000, "COMPLETADA", "TARJETA", LUIS, "Luis"),
    (8000, "ANULADA", "EFECTIVO", LUIS, "Luis"),
    (16000, "ANULADA", "TARJETA", ANA, "Ana"),
    (32000, "COMPLETADA", "TRANSFERENCIA", LUIS, "Luis"),
    (64000, "COMPLETADA", None, None, None),  # una venta antigua, sin método ni empleado identificado
]


@pytest.fixture(scope="module")
def ventas_sembradas():
    db = SessionLocal()
    try:
        for i, (total, estado, metodo, empleado, nombre) in enumerate(VENTAS):
            db.add(
                Venta(
                    total=total,
                    fecha=BASE + timedelta(minutes=i),
                    estado=estado,
                    metodo_pago=metodo,
                    registrada_por=empleado,
                    registrada_por_nombre=nombre,
                )
            )
        # Carlos cambió de nombre: la lista de empleados debe mostrar el de su venta más reciente.
        db.add(Venta(total=1, fecha=datetime(2034, 4, 13, 15, 0, tzinfo=timezone.utc),
                     registrada_por=CARLOS, registrada_por_nombre="Carlos Viejo"))
        db.add(Venta(total=1, fecha=datetime(2034, 4, 14, 15, 0, tzinfo=timezone.utc),
                     registrada_por=CARLOS, registrada_por_nombre="Carlos Nuevo"))
        db.commit()
    finally:
        db.close()


def _listar(headers, filtros: str = "", pagina: int = 1, tamanio: int = 25) -> dict:
    r = client.get(
        f"/ventas/?fecha_inicio={DIA}&fecha_fin={DIA}&pagina={pagina}&tamanio={tamanio}{filtros}",
        headers=headers,
    )
    assert r.status_code == 200, r.text
    return r.json()


def _resumen(total_vendido: float, completadas: int, anuladas: int) -> dict:
    return {"total_vendido": total_vendido, "completadas": completadas, "anuladas": anuladas}


def test_sin_filtros_se_listan_todas(admin_clerk_headers, ventas_sembradas):
    datos = _listar(admin_clerk_headers)
    assert datos["total"] == 7
    assert datos["resumen"] == _resumen(103000, 5, 2)


def test_filtro_por_estado(admin_clerk_headers, ventas_sembradas):
    anuladas = _listar(admin_clerk_headers, "&estado=ANULADA")
    assert anuladas["total"] == 2
    assert all(v["estado"] == "ANULADA" for v in anuladas["items"])
    assert anuladas["resumen"] == _resumen(0, 0, 2)

    completadas = _listar(admin_clerk_headers, "&estado=COMPLETADA")
    assert completadas["total"] == 5
    assert all(v["estado"] == "COMPLETADA" for v in completadas["items"])
    assert completadas["resumen"] == _resumen(103000, 5, 0)


def test_filtro_por_metodo_de_pago(admin_clerk_headers, ventas_sembradas):
    tarjeta = _listar(admin_clerk_headers, "&metodo_pago=TARJETA")
    assert tarjeta["total"] == 3
    assert tarjeta["resumen"] == _resumen(6000, 2, 1)

    efectivo = _listar(admin_clerk_headers, "&metodo_pago=EFECTIVO")
    assert efectivo["total"] == 2
    assert efectivo["resumen"] == _resumen(1000, 1, 1)

    transferencia = _listar(admin_clerk_headers, "&metodo_pago=TRANSFERENCIA")
    assert transferencia["total"] == 1
    assert transferencia["resumen"] == _resumen(32000, 1, 0)


def test_las_ventas_sin_metodo_solo_aparecen_sin_ese_filtro(admin_clerk_headers, ventas_sembradas):
    sin_filtro = [v["total"] for v in _listar(admin_clerk_headers)["items"]]
    con_filtro = [v["total"] for v in _listar(admin_clerk_headers, "&metodo_pago=TARJETA")["items"]]
    assert 64000 in sin_filtro
    assert 64000 not in con_filtro


def test_filtro_por_empleado(admin_clerk_headers, ventas_sembradas):
    ana = _listar(admin_clerk_headers, f"&empleado={ANA}")
    assert ana["total"] == 3
    assert all(v["registrada_por_nombre"] == "Ana" for v in ana["items"])
    assert ana["resumen"] == _resumen(3000, 2, 1)

    luis = _listar(admin_clerk_headers, f"&empleado={LUIS}")
    assert luis["total"] == 3
    assert luis["resumen"] == _resumen(36000, 2, 1)


def test_los_filtros_se_combinan(admin_clerk_headers, ventas_sembradas):
    uno = _listar(admin_clerk_headers, f"&empleado={LUIS}&estado=COMPLETADA&metodo_pago=TRANSFERENCIA")
    assert uno["total"] == 1
    assert uno["items"][0]["total"] == 32000
    assert uno["resumen"] == _resumen(32000, 1, 0)


def test_una_combinacion_sin_resultados_devuelve_ceros(admin_clerk_headers, ventas_sembradas):
    for filtros in (
        f"&empleado={ANA}&metodo_pago=TRANSFERENCIA",
        f"&empleado={LUIS}&metodo_pago=TARJETA&estado=ANULADA",
        "&empleado=user_que_no_existe",
    ):
        datos = _listar(admin_clerk_headers, filtros)
        assert datos["items"] == [], filtros
        assert datos["total"] == 0, filtros
        assert datos["paginas"] == 1, filtros
        assert datos["resumen"] == _resumen(0, 0, 0), filtros


def test_los_filtros_conviven_con_la_paginacion(admin_clerk_headers, ventas_sembradas):
    ids = []
    for n in (1, 2, 3):
        datos = _listar(admin_clerk_headers, "&estado=COMPLETADA", pagina=n, tamanio=2)
        assert datos["total"] == 5
        assert datos["paginas"] == 3
        assert datos["resumen"] == _resumen(103000, 5, 0)  # el mismo en todas las páginas
        ids += [v["id"] for v in datos["items"]]
    assert len(ids) == 5
    assert len(set(ids)) == 5


def test_un_valor_no_permitido_responde_422_en_espanol(admin_clerk_headers):
    estado = client.get("/ventas/?estado=OTRO", headers=admin_clerk_headers)
    assert estado.status_code == 422
    assert "estado: no es un valor permitido" in estado.json()["detail"]

    metodo = client.get("/ventas/?metodo_pago=CHEQUE", headers=admin_clerk_headers)
    assert metodo.status_code == 422
    assert "metodo_pago: no es un valor permitido" in metodo.json()["detail"]

    largo = client.get(f"/ventas/?empleado={'x' * 65}", headers=admin_clerk_headers)
    assert largo.status_code == 422
    assert "empleado: no puede superar 64 caracteres" in largo.json()["detail"]


def test_la_lista_de_empleados_usa_el_nombre_mas_reciente(admin_clerk_headers, ventas_sembradas):
    r = client.get("/ventas/empleados", headers=admin_clerk_headers)
    assert r.status_code == 200
    empleados = r.json()
    nombres = {e["id"]: e["nombre"] for e in empleados}

    assert nombres[ANA] == "Ana"
    assert nombres[LUIS] == "Luis"
    assert nombres[CARLOS] == "Carlos Nuevo"
    assert all(e["id"] for e in empleados)  # las ventas sin empleado identificado no aparecen
    assert len({e["id"] for e in empleados}) == len(empleados)  # cada empleado, una sola vez


def test_la_lista_de_empleados_esta_ordenada_por_nombre(admin_clerk_headers, ventas_sembradas):
    empleados = client.get("/ventas/empleados", headers=admin_clerk_headers).json()
    nombres = [(e["nombre"] or "~").lower() for e in empleados]
    assert nombres == sorted(nombres)


def test_un_empleado_no_puede_usar_los_filtros_ni_la_lista(empleado_clerk_headers):
    assert client.get("/ventas/empleados", headers=empleado_clerk_headers).status_code == 403
    assert client.get("/ventas/?estado=ANULADA", headers=empleado_clerk_headers).status_code == 403