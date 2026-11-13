import time

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
ORIGEN = "http://localhost:5173"


def _nuevo_par_de_claves():
    privada = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem_privada = privada.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    pem_publica = privada.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return pem_privada, pem_publica


@pytest.fixture(scope="module")
def claves():
    return _nuevo_par_de_claves()


@pytest.fixture(autouse=True)
def entorno_clerk(monkeypatch, claves):
    monkeypatch.setenv("CLERK_JWT_KEY", claves[1])
    monkeypatch.setenv("CLERK_AUTHORIZED_PARTIES", ORIGEN)
    monkeypatch.delenv("CLERK_SECRET_KEY", raising=False)


def _token(pem_privada, **cambios):
    ahora = int(time.time())
    claims = {
        "sub": "user_test123", "sid": "sess_test", "azp": ORIGEN,
        "iat": ahora, "nbf": ahora - 5, "exp": ahora + 60,
        "metadata": {"role": "ADMINISTRADOR"},
    }
    claims.update(cambios)
    return jwt.encode(claims, pem_privada, algorithm="RS256")


def _get_me(token=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.get("/me", headers=headers)


def test_token_valido_devuelve_usuario_y_rol(claves):
    r = _get_me(_token(claves[0]))
    assert r.status_code == 200
    assert r.json() == {"clerk_user_id": "user_test123", "role": "ADMINISTRADOR"}


def test_token_sin_rol_devuelve_rol_nulo(claves):
    r = _get_me(_token(claves[0], metadata={}))
    assert r.status_code == 200
    assert r.json()["role"] is None


def test_sin_token_responde_401():
    assert _get_me().status_code == 401


def test_token_expirado_responde_401(claves):
    ahora = int(time.time())
    r = _get_me(_token(claves[0], iat=ahora - 300, nbf=ahora - 300, exp=ahora - 120))
    assert r.status_code == 401


def test_firma_invalida_responde_401():
    otra_privada, _ = _nuevo_par_de_claves()
    assert _get_me(_token(otra_privada)).status_code == 401


def test_origen_no_autorizado_responde_401(claves):
    assert _get_me(_token(claves[0], azp="https://sitio-malicioso.com")).status_code == 401


def test_respuesta_401_es_generica(claves):
    r = _get_me(_token(claves[0], azp="https://sitio-malicioso.com"))
    assert r.json() == {"detail": "No autenticado"}
