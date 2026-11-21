from sqlalchemy import Index

from app.models.detalle_venta import DetalleVenta
from app.models.egreso import Egreso
from app.models.venta import Venta

# Filtrar las ventas por rango de fechas es lo más frecuente (listado, reportes, balance).
Index("ix_ventas_fecha", Venta.fecha)
# PostgreSQL no indexa solo las claves foráneas: estas dos aceleran las uniones de los reportes.
Index("ix_detalle_ventas_venta_id", DetalleVenta.venta_id)
Index("ix_detalle_ventas_producto_id", DetalleVenta.producto_id)
Index("ix_egresos_fecha", Egreso.fecha)