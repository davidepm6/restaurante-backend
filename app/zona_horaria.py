from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

ZONA_NEGOCIO = ZoneInfo("America/Bogota")


def hoy_negocio() -> date:
    """La fecha de hoy en Colombia, sin importar la zona horaria del servidor."""
    return datetime.now(ZONA_NEGOCIO).date()


def limites_dia(inicio: date, fin: date) -> tuple[datetime, datetime]:
    """Instantes [desde, hasta) que cubren desde el primer día hasta el último, en hora de Colombia."""
    desde = datetime.combine(inicio, time.min, tzinfo=ZONA_NEGOCIO)
    hasta = datetime.combine(fin + timedelta(days=1), time.min, tzinfo=ZONA_NEGOCIO)
    return desde, hasta