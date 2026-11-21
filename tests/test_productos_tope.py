import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.routers import productos as router_productos

client = TestClient(app)


def test_el_catalogo_completo_tiene_un_tope_de_seguridad(admin_clerk_headers, monkeypatch):
    cat = client.post(
        "/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=admin_clerk_headers
    ).json()
    for i in range(3):
        r = client.post(
            "/productos/",
            json={"nombre": f"Tope-{i}", "precio": 1000, "stock": 1, "categoria_id": cat["id"]},
            headers=admin_clerk_headers,
        )
        assert r.status_code == 201

    monkeypatch.setattr(router_productos, "MAXIMO_PRODUCTOS", 2)
    r = client.get("/productos/", headers=admin_clerk_headers)
    assert r.status_code == 200
    assert len(r.json()) == 2