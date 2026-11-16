from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_responde_sin_autenticacion():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"estado": "ok"}


def test_cors_permite_el_origen_configurado():
    r = client.options(
        "/me",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rechaza_origenes_desconocidos():
    r = client.options(
        "/me",
        headers={"Origin": "https://sitio-malicioso.com", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in r.headers