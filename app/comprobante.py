"""Comprobante de venta en PDF: un ticket de 80 mm cuyo alto se ajusta a su contenido."""
from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Callable

from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.zona_horaria import ZONA_NEGOCIO

ANCHO = 80 * mm
MARGEN = 5 * mm
ANCHO_UTIL = ANCHO - 2 * MARGEN
INTERLINEADO = 1.35

NORMAL = "Helvetica"
NEGRITA = "Helvetica-Bold"

METODOS = {"EFECTIVO": "Efectivo", "TARJETA": "Tarjeta", "TRANSFERENCIA": "Transferencia"}


def seguro(texto) -> str:
    """Normaliza los espacios y deja solo caracteres que las fuentes estándar del PDF pueden dibujar.

    Lo que no se puede dibujar (por ejemplo, un emoji) se cambia por «?», para que un nombre raro
    nunca rompa la generación del comprobante.
    """
    limpio = " ".join(str(texto).split())
    return limpio.encode("cp1252", "replace").decode("cp1252")


def moneda(valor: float) -> str:
    """Pesos con punto de miles: $12.000. Si trae centavos, con coma decimal: $1.500,50."""
    if abs(valor - round(valor)) < 0.005:
        return "$" + f"{round(valor):,}".replace(",", ".")
    texto = f"{valor:,.2f}"  # 1,500.50
    return "$" + texto.replace(",", "X").replace(".", ",").replace("X", ".")


def fecha_hora(instante) -> str:
    """Fecha y hora en Colombia, en formato de 24 horas."""
    return instante.astimezone(ZONA_NEGOCIO).strftime("%d/%m/%Y %H:%M")


@dataclass(frozen=True)
class Linea:
    tipo: str  # "texto" | "par" | "separador" | "espacio"
    izquierda: str = ""
    derecha: str = ""
    fuente: str = NORMAL
    tamano: float = 9
    centrada: bool = False


def armar_lineas(venta, nombre_negocio: str) -> list[Linea]:
    """El contenido del comprobante, línea por línea y sin dibujar nada (se puede probar sin PDF)."""
    anulada = venta.estado == "ANULADA"
    lineas = [
        Linea("texto", nombre_negocio, fuente=NEGRITA, tamano=13, centrada=True),
        Linea("texto", "Comprobante de venta", tamano=9, centrada=True),
        Linea("texto", f"N.º {venta.id}", fuente=NEGRITA, tamano=11, centrada=True),
    ]
    if anulada:
        lineas += [Linea("espacio"), Linea("texto", "VENTA ANULADA", fuente=NEGRITA, tamano=13, centrada=True)]

    lineas += [
        Linea("separador"),
        Linea("par", "Fecha", fecha_hora(venta.fecha)),
        Linea("par", "Atendió", venta.registrada_por_nombre or "-"),
        Linea("par", "Pago", METODOS.get(venta.metodo_pago or "", "-")),
        Linea("separador"),
    ]

    for detalle in sorted(venta.detalles, key=lambda d: d.id):
        nombre = detalle.producto.nombre if detalle.producto else "Producto eliminado"
        lineas.append(Linea("texto", nombre, fuente=NEGRITA, tamano=9))
        lineas.append(
            Linea("par", f"{detalle.cantidad} x {moneda(float(detalle.precio_unitario))}", moneda(float(detalle.subtotal)))
        )

    lineas += [
        Linea("separador"),
        Linea("par", "TOTAL", moneda(float(venta.total)), fuente=NEGRITA, tamano=11),
    ]

    if anulada:
        lineas.append(Linea("espacio"))
        lineas.append(Linea("texto", f"Motivo: {venta.motivo_anulacion or '-'}", tamano=8))
        cuando = f" el {fecha_hora(venta.anulada_en)}" if venta.anulada_en else ""
        quien = f" por {venta.anulada_por_nombre}" if venta.anulada_por_nombre else ""
        lineas.append(Linea("texto", f"Anulada{cuando}{quien}", tamano=8))
        lineas.append(Linea("espacio"))
        lineas.append(Linea("texto", "Este comprobante no es válido", fuente=NEGRITA, tamano=9, centrada=True))
    else:
        lineas.append(Linea("espacio"))
        lineas.append(Linea("texto", "¡Gracias por su compra!", tamano=9, centrada=True))

    return lineas


Bloque = tuple[float, Callable[[canvas.Canvas, float], None]]  # (alto, función que dibuja desde la coordenada y)


def _bloque(linea: Linea) -> Bloque:
    tamano = linea.tamano
    paso = tamano * INTERLINEADO

    if linea.tipo == "espacio":
        return 3 * mm, lambda c, y: None

    if linea.tipo == "separador":

        def dibujar_separador(c: canvas.Canvas, y: float) -> None:
            c.setDash(1, 2)
            c.setLineWidth(0.5)
            c.line(MARGEN, y - 2 * mm, ANCHO - MARGEN, y - 2 * mm)
            c.setDash()

        return 4 * mm, dibujar_separador

    if linea.tipo == "texto":
        partes = simpleSplit(seguro(linea.izquierda), linea.fuente, tamano, ANCHO_UTIL) or [""]

        def dibujar_texto(c: canvas.Canvas, y: float) -> None:
            c.setFont(linea.fuente, tamano)
            base = y - tamano
            for parte in partes:
                if linea.centrada:
                    c.drawCentredString(ANCHO / 2, base, parte)
                else:
                    c.drawString(MARGEN, base, parte)
                base -= paso

        return len(partes) * paso, dibujar_texto

    # "par": texto a la izquierda y valor a la derecha; si el texto no cabe, continúa en líneas siguientes.
    derecha = seguro(linea.derecha)
    ancho_derecha = stringWidth(derecha, linea.fuente, tamano)
    partes = simpleSplit(seguro(linea.izquierda), linea.fuente, tamano, max(ANCHO_UTIL - ancho_derecha - 3 * mm, 10 * mm)) or [""]

    def dibujar_par(c: canvas.Canvas, y: float) -> None:
        c.setFont(linea.fuente, tamano)
        base = y - tamano
        for i, parte in enumerate(partes):
            c.drawString(MARGEN, base, parte)
            if i == 0:
                c.drawRightString(ANCHO - MARGEN, base, derecha)
            base -= paso

    return len(partes) * paso, dibujar_par


def generar_pdf(venta, nombre_negocio: str = "Restaurante") -> bytes:
    """Dibuja el comprobante. El alto de la página se calcula a partir del contenido."""
    bloques = [_bloque(linea) for linea in armar_lineas(venta, seguro(nombre_negocio) or "Restaurante")]
    alto = sum(altura for altura, _ in bloques) + 2 * MARGEN

    buffer = BytesIO()
    lienzo = canvas.Canvas(buffer, pagesize=(ANCHO, alto))
    lienzo.setTitle(f"Comprobante de venta {venta.id}")

    y = alto - MARGEN
    for altura, dibujar in bloques:
        dibujar(lienzo, y)
        y -= altura

    lienzo.save()
    return buffer.getvalue()