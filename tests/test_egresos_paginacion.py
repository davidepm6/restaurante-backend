import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

DIA = "2018-05-10"
OTRO_DIA = "2018-05-11"


@pytest.fixture(scope="module")
def egresos_sembrados(admin_clerk_headers):
    """7 egresos el 10 de mayo (1000, 2000, … 7000) y uno el 11 de mayo (500)."""
    for i in range(1, 8):
        r = client.post(
            "/egresos/",
            json={"concepto": f"Gasto {i}", "valor": i * 1000, "fecha": DIA},
            headers=admin_clerk_headers,
        )
        assert r.status_code == 201, r.text
    r = client.post(
        "/egresos/", json={"concepto": "Gasto aparte", "valor": 500, "fecha": OTRO_DIA}, headers=admin_clerk_headers
    )
    assert r.status_code == 201, r.text


def _pagina(headers, pagina: int, tamanio: int, inicio: str = DIA, fin: str = DIA) -> dict:
    r = client.get(
        f"/egresos/?fecha_inicio={inicio}&fecha_fin={fin}&pagina={pagina}&tamanio={tamanio}", headers=headers
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_las_paginas_se_reparten_sin_repetir_ni_perder_egresos(admin_clerk_headers, egresos_sembrados):
    ids, cantidades = [], []
    for n in (1, 2, 3):
        datos = _pagina(admin_clerk_headers, n, 3)
        assert datos["total"] == 7
        assert datos["paginas"] == 3
        assert datos["pagina"] == n
        assert datos["tamanio"] == 3
        cantidades.append(len(datos["items"]))
        ids += [e["id"] for e in datos["items"]]

    assert cantidades == [3, 3, 1]
    assert len(set(ids)) == 7
    assert ids == sorted(ids, reverse=True)  # misma fecha: el más reciente primero, de forma estable


def test_el_total_cubre_todo_el_rango_y_no_solo_la_pagina(admin_clerk_headers, egresos_sembrados):
    for n in (1, 2, 3):
        assert _pagina(admin_clerk_headers, n, 3)["total_egresos"] == 28000


def test_el_filtro_de_fechas_incluye_ambos_extremos(admin_clerk_headers, egresos_sembrados):
    ambos = _pagina(admin_clerk_headers, 1, 25, inicio=DIA, fin=OTRO_DIA)
    assert ambos["total"] == 8
    assert ambos["total_egresos"] == 28500

    solo_el_segundo = _pagina(admin_clerk_headers, 1, 25, inicio=OTRO_DIA, fin=OTRO_DIA)
    assert solo_el_segundo["total"] == 1
    assert solo_el_segundo["items"][0]["concepto"] == "Gasto aparte"


def test_los_egresos_de_fechas_distintas_salen_de_la_mas_reciente_a_la_mas_antigua(
    admin_clerk_headers, egresos_sembrados
):
    items = _pagina(admin_clerk_headers, 1, 25, inicio=DIA, fin=OTRO_DIA)["items"]
    fechas = [e["fecha"] for e in items]
    assert fechas == sorted(fechas, reverse=True)
    assert fechas[0] == OTRO_DIA


def test_una_pagina_fuera_de_rango_devuelve_lista_vacia_con_los_mismos_totales(
    admin_clerk_headers, egresos_sembrados
):
    datos = _pagina(admin_clerk_headers, 99, 3)
    assert datos["items"] == []
    assert datos["total"] == 7
    assert datos["total_egresos"] == 28000


def test_un_rango_sin_egresos_devuelve_ceros(admin_clerk_headers):
    datos = _pagina(admin_clerk_headers, 1, 25, inicio="2017-01-01", fin="2017-01-02")
    assert datos["items"] == []
    assert datos["total"] == 0
    assert datos["paginas"] == 1
    assert datos["total_egresos"] == 0


def test_sin_filtros_se_listan_todos_paginados(admin_clerk_headers, egresos_sembrados):
    r = client.get("/egresos/?tamanio=2", headers=admin_clerk_headers)
    assert r.status_code == 200
    datos = r.json()
    assert len(datos["items"]) == 2
    assert datos["total"] >= 8


def test_los_parametros_invalidos_responden_422_con_mensaje(admin_clerk_headers):
    for consulta in ("pagina=0", "tamanio=0", "tamanio=101", "fecha_inicio=ayer"):
        r = client.get(f"/egresos/?{consulta}", headers=admin_clerk_headers)
        assert r.status_code == 422, consulta
        assert isinstance(r.json()["detail"], str), consulta


def test_la_fecha_inicial_posterior_a_la_final_responde_400(admin_clerk_headers):
    r = client.get(f"/egresos/?fecha_inicio={OTRO_DIA}&fecha_fin={DIA}", headers=admin_clerk_headers)
    assert r.status_code == 400
    assert r.json()["detail"] == "La fecha inicial no puede ser posterior a la final"


def test_cada_egreso_conserva_sus_campos(admin_clerk_headers, egresos_sembrados):
    egreso = _pagina(admin_clerk_headers, 1, 1, inicio=OTRO_DIA, fin=OTRO_DIA)["items"][0]
    assert egreso["concepto"] == "Gasto aparte"
    assert egreso["valor"] == 500
    assert egreso["fecha"] == OTRO_DIA


def test_un_empleado_no_puede_listar_egresos(empleado_clerk_headers):
    assert client.get("/egresos/", headers=empleado_clerk_headers).status_code == 403