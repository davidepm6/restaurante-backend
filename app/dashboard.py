from datetime import date, timedelta

from app.schemas.dashboard import VentaDia


def rellenar_dias(desde: date, hasta: date, por_fecha: dict[date, tuple[int, float]]) -> list[VentaDia]:
    """Una entrada por cada día del rango, con ceros en los días sin ventas (así el gráfico no salta días)."""
    dias = (hasta - desde).days + 1
    salida = []
    for i in range(dias):
        dia = desde + timedelta(days=i)
        ventas, total = por_fecha.get(dia, (0, 0.0))
        salida.append(VentaDia(fecha=dia, ventas=ventas, total=total))
    return salida