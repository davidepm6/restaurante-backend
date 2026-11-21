import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _categoria(headers) -> int:
    r = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _producto(headers, categoria_id: int, stock: int, minimo: int | None = None, nombre: str | None = None) -> dict:
    cuerpo = {
        "nombre": nombre or f"Prod-{uuid.uuid4().hex[:8]}",
        "precio": 1000,
        "stock": stock,
        "categoria_id": categoria_id,
    }
    if minimo is not None:
        cuerpo["stock_minimo"] = minimo
    r = client.post("/productos/", json=cuerpo, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def _poner_stock(headers, producto_id: int, stock: int) -> dict:
    r = client.put(f"/productos/{producto_id}", json={"stock": stock}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def _lista_stock_bajo(headers, categoria_id: int) -> list[dict]:
    r = client.get("/productos/stock-bajo", headers=headers)
    assert r.status_code == 200, r.text
    return [p for p in r.json() if p["categoria_id"] == categoria_id]


def test_un_producto_sin_minimo_no_tiene_alerta(admin_clerk_headers):
    p = _producto(admin_clerk_headers, _categoria(admin_clerk_headers), stock=1)
    assert p["stock_minimo"] == 0
    assert p["stock_bajo"] is False


def test_un_producto_agotado_sin_minimo_tampoco_tiene_alerta(admin_clerk_headers):
    p = _producto(admin_clerk_headers, _categoria(admin_clerk_headers), stock=0, minimo=0)
    assert p["stock_bajo"] is False


def test_el_stock_bajo_se_activa_al_llegar_al_minimo_y_no_antes(admin_clerk_headers):
    p = _producto(admin_clerk_headers, _categoria(admin_clerk_headers), stock=10, minimo=5)
    assert p["stock_bajo"] is False
    assert _poner_stock(admin_clerk_headers, p["id"], 6)["stock_bajo"] is False
    assert _poner_stock(admin_clerk_headers, p["id"], 5)["stock_bajo"] is True   # igual al mínimo: ya es bajo
    assert _poner_stock(admin_clerk_headers, p["id"], 0)["stock_bajo"] is True   # agotado con mínimo definido


def test_un_producto_creado_por_debajo_de_su_minimo_nace_con_alerta(admin_clerk_headers):
    p = _producto(admin_clerk_headers, _categoria(admin_clerk_headers), stock=2, minimo=5)
    assert p["stock_bajo"] is True


def test_se_puede_cambiar_solo_el_minimo(admin_clerk_headers):
    p = _producto(admin_clerk_headers, _categoria(admin_clerk_headers), stock=4)
    r = client.put(f"/productos/{p['id']}", json={"stock_minimo": 10}, headers=admin_clerk_headers)
    assert r.status_code == 200
    assert r.json()["stock_minimo"] == 10
    assert r.json()["stock"] == 4
    assert r.json()["stock_bajo"] is True


def test_el_minimo_no_puede_ser_negativo_ni_exagerado(admin_clerk_headers):
    cat = _categoria(admin_clerk_headers)
    base = {"nombre": "Prod", "precio": 1000, "stock": 1, "categoria_id": cat}
    negativo = client.post("/productos/", json={**base, "stock_minimo": -1}, headers=admin_clerk_headers)
    enorme = client.post("/productos/", json={**base, "stock_minimo": 1_000_001}, headers=admin_clerk_headers)
    assert negativo.status_code == 422
    assert enorme.status_code == 422


def test_la_lista_solo_incluye_productos_con_stock_bajo_y_ordena_por_urgencia(admin_clerk_headers):
    cat = _categoria(admin_clerk_headers)
    bajo_3 = _producto(admin_clerk_headers, cat, stock=3, minimo=5, nombre="B-bajo")
    agotado = _producto(admin_clerk_headers, cat, stock=0, minimo=5, nombre="A-agotado")
    _producto(admin_clerk_headers, cat, stock=50, minimo=5, nombre="C-normal")
    _producto(admin_clerk_headers, cat, stock=1, nombre="D-sin-minimo")

    lista = _lista_stock_bajo(admin_clerk_headers, cat)
    assert [p["id"] for p in lista] == [agotado["id"], bajo_3["id"]]  # el agotado primero
    assert all(p["stock_bajo"] for p in lista)


def test_un_producto_desactivado_no_aparece_en_la_lista(admin_clerk_headers):
    cat = _categoria(admin_clerk_headers)
    p = _producto(admin_clerk_headers, cat, stock=1, minimo=5)
    assert len(_lista_stock_bajo(admin_clerk_headers, cat)) == 1

    assert client.delete(f"/productos/{p['id']}", headers=admin_clerk_headers).status_code == 200
    assert _lista_stock_bajo(admin_clerk_headers, cat) == []


def test_una_venta_que_baja_el_stock_activa_la_alerta(admin_clerk_headers):
    p = _producto(admin_clerk_headers, _categoria(admin_clerk_headers), stock=5, minimo=3)
    assert p["stock_bajo"] is False

    venta = client.post(
        "/ventas/",
        json={"items": [{"producto_id": p["id"], "cantidad": 3}], "metodo_pago": "EFECTIVO"},
        headers=admin_clerk_headers,
    )
    assert venta.status_code == 201

    actual = client.get(f"/productos/{p['id']}", headers=admin_clerk_headers).json()
    assert actual["stock"] == 2
    assert actual["stock_bajo"] is True


def test_el_empleado_ve_la_marca_en_el_catalogo_pero_no_la_lista_de_reposicion(
    admin_clerk_headers, empleado_clerk_headers
):
    cat = _categoria(admin_clerk_headers)
    p = _producto(admin_clerk_headers, cat, stock=1, minimo=5)

    catalogo = client.get("/productos/", headers=empleado_clerk_headers)
    assert catalogo.status_code == 200
    visto = next(x for x in catalogo.json() if x["id"] == p["id"])
    assert visto["stock_bajo"] is True

    assert client.get("/productos/stock-bajo", headers=empleado_clerk_headers).status_code == 403


def test_la_lista_de_stock_bajo_exige_autenticacion():
    assert client.get("/productos/stock-bajo").status_code == 401