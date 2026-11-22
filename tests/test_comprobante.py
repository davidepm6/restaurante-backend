import re
import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.comprobante import armar_lineas, fecha_hora, generar_pdf, moneda, seguro
from app.main import app

client = TestClient(app)


# ---------- Piezas pequeñas ----------

def test_moneda_usa_punto_de_miles_y_coma_para_centavos():
    assert moneda(12000) == "$12.000"
    assert moneda(0) == "$0"
    assert moneda(1234567) == "$1.234.567"
    assert moneda(1500.5) == "$1.500,50"
    assert moneda(12000.0) == "$12.000"


def test_seguro_conserva_acentos_y_cambia_lo_que_no_se_puede_dibujar():
    assert seguro("Café ñandú") == "Café ñandú"
    assert seguro("Pizza 🍕 grande") == "Pizza ? grande"


def test_seguro_normaliza_espacios_y_saltos_de_linea():
    assert seguro("  Jugo \n  de\tmora  ") == "Jugo de mora"


def test_la_fecha_se_muestra_en_hora_de_colombia():
    assert fecha_hora(datetime(2031, 5, 10, 1, 0, tzinfo=timezone.utc)) == "09/05/2031 20:00"


# ---------- Contenido del comprobante (sin dibujar nada) ----------

def _venta(**cambios):
    detalles = [
        SimpleNamespace(id=2, cantidad=1, precio_unitario=22000, subtotal=22000, producto=SimpleNamespace(nombre="Hamburguesa clásica")),
        SimpleNamespace(id=1, cantidad=2, precio_unitario=6000, subtotal=12000, producto=SimpleNamespace(nombre="Limonada")),
    ]
    datos = dict(
        id=7,
        fecha=datetime(2026, 11, 20, 23, 15, tzinfo=timezone.utc),
        total=34000,
        metodo_pago="TARJETA",
        estado="COMPLETADA",
        registrada_por_nombre="Ana Pérez",
        anulada_en=None,
        anulada_por_nombre=None,
        motivo_anulacion=None,
        detalles=detalles,
    )
    datos.update(cambios)
    return SimpleNamespace(**datos)


def _textos(lineas) -> list[str]:
    return [f"{l.izquierda} {l.derecha}".strip() for l in lineas if l.tipo in ("texto", "par")]


def test_el_comprobante_incluye_los_datos_de_la_venta():
    textos = _textos(armar_lineas(_venta(), "Mi Restaurante"))
    assert "Mi Restaurante" in textos
    assert "N.º 7" in textos
    assert "Fecha 20/11/2026 18:15" in textos  # 23:15 UTC = 6:15 p. m. en Bogotá
    assert "Atendió Ana Pérez" in textos
    assert "Pago Tarjeta" in textos
    assert "TOTAL $34.000" in textos
    assert "¡Gracias por su compra!" in textos


def test_los_productos_salen_en_el_orden_en_que_se_registraron():
    textos = _textos(armar_lineas(_venta(), "R"))
    assert textos.index("Limonada") < textos.index("Hamburguesa clásica")
    assert "2 x $6.000 $12.000" in textos
    assert "1 x $22.000 $22.000" in textos


def test_una_venta_completada_no_dice_anulada():
    assert not any("ANULADA" in t.upper() for t in _textos(armar_lineas(_venta(), "R")))


def test_una_venta_anulada_lo_dice_con_motivo_y_responsable():
    venta = _venta(
        estado="ANULADA",
        motivo_anulacion="Producto equivocado",
        anulada_por_nombre="Admin",
        anulada_en=datetime(2026, 11, 21, 15, 0, tzinfo=timezone.utc),
    )
    textos = _textos(armar_lineas(venta, "R"))
    assert "VENTA ANULADA" in textos
    assert "Motivo: Producto equivocado" in textos
    assert "Anulada el 21/11/2026 10:00 por Admin" in textos
    assert "Este comprobante no es válido" in textos
    assert "¡Gracias por su compra!" not in textos


def test_los_datos_que_faltan_se_muestran_con_un_guion():
    textos = _textos(armar_lineas(_venta(metodo_pago=None, registrada_por_nombre=None), "R"))
    assert "Atendió -" in textos
    assert "Pago -" in textos


def test_un_producto_eliminado_no_rompe_el_comprobante():
    detalle = SimpleNamespace(id=1, cantidad=1, precio_unitario=1000, subtotal=1000, producto=None)
    textos = _textos(armar_lineas(_venta(detalles=[detalle], total=1000), "R"))
    assert "Producto eliminado" in textos


# ---------- El PDF ----------

def _alto_de_pagina(pdf: bytes) -> float:
    m = re.search(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]", pdf)
    assert m, "no se encontró el tamaño de página"
    return float(m.group(2))


def test_el_pdf_es_un_pdf_valido():
    pdf = generar_pdf(_venta(), "Mi Restaurante")
    assert pdf.startswith(b"%PDF")
    assert b"%%EOF" in pdf[-32:]


def test_la_pagina_crece_con_la_cantidad_de_productos():
    def con_productos(n: int):
        detalles = [
            SimpleNamespace(id=i, cantidad=1, precio_unitario=1000, subtotal=1000, producto=SimpleNamespace(nombre=f"Producto {i}"))
            for i in range(n)
        ]
        return _venta(detalles=detalles, total=1000 * n)

    assert _alto_de_pagina(generar_pdf(con_productos(30))) > _alto_de_pagina(generar_pdf(con_productos(1)))


def test_los_nombres_largos_se_parten_en_lineas_y_los_raros_no_rompen_nada():
    detalle = SimpleNamespace(
        id=1,
        cantidad=3,
        precio_unitario=15500.5,
        subtotal=46501.5,
        producto=SimpleNamespace(nombre="Sándwich especial de la casa con muchísimos ingredientes 🍕 y salsa " * 3),
    )
    largo = generar_pdf(_venta(detalles=[detalle], total=46501.5))
    corto = generar_pdf(_venta())
    assert largo.startswith(b"%PDF")
    assert _alto_de_pagina(largo) > _alto_de_pagina(corto)


def test_el_pdf_de_una_venta_anulada_se_genera():
    venta = _venta(estado="ANULADA", motivo_anulacion="x" * 300, anulada_por_nombre="Admin")
    assert generar_pdf(venta).startswith(b"%PDF")


# ---------- El endpoint ----------

def _producto(headers, stock=10, precio=6000) -> dict:
    cat = client.post("/categorias/", json={"nombre": f"Cat-{uuid.uuid4().hex[:8]}"}, headers=headers).json()
    r = client.post(
        "/productos/",
        json={"nombre": f"Prod-{uuid.uuid4().hex[:8]}", "precio": precio, "stock": stock, "categoria_id": cat["id"]},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def _vender(headers, producto_id: int, cantidad: int = 1) -> dict:
    r = client.post(
        "/ventas/",
        json={"items": [{"producto_id": producto_id, "cantidad": cantidad}], "metodo_pago": "EFECTIVO"},
        headers=headers,
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_el_administrador_descarga_el_comprobante(admin_clerk_headers):
    p = _producto(admin_clerk_headers)
    venta = _vender(admin_clerk_headers, p["id"], 2)

    r = client.get(f"/ventas/{venta['id']}/comprobante", headers=admin_clerk_headers)

    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert f'filename="comprobante-{venta["id"]}.pdf"' in r.headers["content-disposition"]
    assert r.content.startswith(b"%PDF")


def test_un_empleado_descarga_el_comprobante_de_su_propia_venta(admin_clerk_headers, empleado_clerk_headers):
    p = _producto(admin_clerk_headers)
    venta = _vender(empleado_clerk_headers, p["id"])
    assert client.get(f"/ventas/{venta['id']}/comprobante", headers=empleado_clerk_headers).status_code == 200


def test_un_empleado_no_puede_ver_el_comprobante_de_una_venta_ajena(admin_clerk_headers, empleado_clerk_headers):
    p = _producto(admin_clerk_headers)
    venta_del_admin = _vender(admin_clerk_headers, p["id"])
    r = client.get(f"/ventas/{venta_del_admin['id']}/comprobante", headers=empleado_clerk_headers)
    assert r.status_code == 404  # no se revela que existe


def test_el_administrador_puede_ver_el_comprobante_de_una_venta_de_un_empleado(admin_clerk_headers, empleado_clerk_headers):
    p = _producto(admin_clerk_headers)
    venta = _vender(empleado_clerk_headers, p["id"])
    assert client.get(f"/ventas/{venta['id']}/comprobante", headers=admin_clerk_headers).status_code == 200


def test_una_venta_anulada_conserva_su_comprobante(admin_clerk_headers):
    p = _producto(admin_clerk_headers)
    venta = _vender(admin_clerk_headers, p["id"])
    client.post(f"/ventas/{venta['id']}/anular", json={"motivo": "Error de digitación"}, headers=admin_clerk_headers)
    r = client.get(f"/ventas/{venta['id']}/comprobante", headers=admin_clerk_headers)
    assert r.status_code == 200
    assert r.content.startswith(b"%PDF")


def test_el_comprobante_sigue_disponible_si_el_producto_se_desactivo(admin_clerk_headers):
    p = _producto(admin_clerk_headers)
    venta = _vender(admin_clerk_headers, p["id"])
    assert client.delete(f"/productos/{p['id']}", headers=admin_clerk_headers).status_code == 200
    assert client.get(f"/ventas/{venta['id']}/comprobante", headers=admin_clerk_headers).status_code == 200


def test_una_venta_inexistente_responde_404(admin_clerk_headers):
    assert client.get("/ventas/999999/comprobante", headers=admin_clerk_headers).status_code == 404


def test_sin_token_no_hay_comprobante():
    assert client.get("/ventas/1/comprobante").status_code == 401


def test_una_cuenta_sin_rol_no_obtiene_comprobantes(sin_rol_clerk_headers):
    assert client.get("/ventas/1/comprobante", headers=sin_rol_clerk_headers).status_code == 403