import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from app.database import SessionLocal, engine
from app.main import app
from app.models.venta import Venta
from app.paginacion import total_paginas
from app.zona_horaria import hoy_negocio

client = TestClient(app)

DIA = "2032-03-10"  # un día que ninguna otra prueba usa, para que los totales sean exactos
BASE = datetime(2032, 3, 10, 15, 0, tzinfo=timezone.utc)  # 10:00 a. m. en Bogotá


@pytest.fixture(scope="module")
def ventas_sembradas():
    """7 ventas en el día de prueba: 5 completadas (1000, 2000, 4000, 5000 y 7000) y 2 anuladas."""
    db = SessionLocal()
    try:
        for i in range(7):
            anulada = i in (2, 5)
            db.add(
                Venta(
                    total=(i + 1) * 1000,
                    fecha=BASE + timedelta(minutes=i),
                    estado="ANULADA" if anulada else "COMPLETADA",
                )
            )
        db.commit()
    finally:
        db.close()


def _pagina(headers, pagina: int, tamanio: int) -> dict:
    r = client.get(
        f"/ventas/?fecha_inicio={DIA}&fecha_fin={DIA}&pagina={pagina}&tamanio={tamanio}", headers=headers
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_total_de_paginas():
    assert total_paginas(0, 25) == 1
    assert total_paginas(25, 25) == 1
    assert total_paginas(26, 25) == 2
    assert total_paginas(7, 3) == 3


def test_las_paginas_se_reparten_sin_repetir_ni_perder_ventas(admin_clerk_headers, ventas_sembradas):
    ids, cantidades = [], []
    for n in (1, 2, 3):
        datos = _pagina(admin_clerk_headers, n, 3)
        assert datos["total"] == 7
        assert datos["paginas"] == 3
        assert datos["pagina"] == n
        assert datos["tamanio"] == 3
        cantidades.append(len(datos["items"]))
        ids += [v["id"] for v in datos["items"]]

    assert cantidades == [3, 3, 1]
    assert len(set(ids)) == 7
    assert ids == sorted(ids, reverse=True)  # la más reciente primero, de forma estable


def test_el_resumen_cubre_todo_el_rango_y_no_solo_la_pagina(admin_clerk_headers, ventas_sembradas):
    for n in (1, 2, 3):
        resumen = _pagina(admin_clerk_headers, n, 3)["resumen"]
        assert resumen == {"total_vendido": 19000, "completadas": 5, "anuladas": 2}


def test_una_pagina_fuera_de_rango_devuelve_lista_vacia_con_los_mismos_totales(
    admin_clerk_headers, ventas_sembradas
):
    datos = _pagina(admin_clerk_headers, 99, 3)
    assert datos["items"] == []
    assert datos["total"] == 7


def test_un_rango_sin_ventas_devuelve_ceros(admin_clerk_headers):
    r = client.get("/ventas/?fecha_inicio=2033-01-01&fecha_fin=2033-01-01", headers=admin_clerk_headers)
    datos = r.json()
    assert datos["items"] == []
    assert datos["total"] == 0
    assert datos["paginas"] == 1
    assert datos["resumen"] == {"total_vendido": 0, "completadas": 0, "anuladas": 0}


def test_los_parametros_de_paginacion_invalidos_responden_422_con_mensaje(admin_clerk_headers):
    for consulta in ("pagina=0", "tamanio=0", "tamanio=101"):
        r = client.get(f"/ventas/?{consulta}", headers=admin_clerk_headers)
        assert r.status_code == 422, consulta
        assert isinstance(r.json()["detail"], str), consulta


def _contar_consultas(llamada) -> int:
    contador = {"n": 0}

    def escuchar(*_args, **_kwargs):
        contador["n"] += 1

    event.listen(engine, "before_cursor_execute", escuchar)
    try:
        llamada()
    finally:
        event.remove(engine, "before_cursor_execute", escuchar)
    return contador["n"]


def test_el_listado_no_hace_una_consulta_por_cada_venta(admin_clerk_headers):
    cat = client.post(
        "/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=admin_clerk_headers
    ).json()
    productos = [
        client.post(
            "/productos/",
            json={"nombre": f"P{i}-{uuid.uuid4().hex[:6]}", "precio": 1000, "stock": 100, "categoria_id": cat["id"]},
            headers=admin_clerk_headers,
        ).json()
        for i in range(2)
    ]
    for _ in range(10):
        r = client.post(
            "/ventas/",
            json={"items": [{"producto_id": p["id"], "cantidad": 1} for p in productos], "metodo_pago": "EFECTIVO"},
            headers=admin_clerk_headers,
        )
        assert r.status_code == 201

    hoy = hoy_negocio().isoformat()
    respuesta = {}

    def pedir():
        respuesta["r"] = client.get(
            f"/ventas/?fecha_inicio={hoy}&fecha_fin={hoy}&tamanio=10", headers=admin_clerk_headers
        )

    consultas = _contar_consultas(pedir)

    assert respuesta["r"].status_code == 200
    items = respuesta["r"].json()["items"]
    assert len(items) == 10
    assert all(len(v["detalles"]) == 2 for v in items)
    # Totales + ventas + detalles + productos = 4. Antes eran más de 20 para estas 10 ventas.
    assert consultas <= 6, f"se hicieron {consultas} consultas"