# Backlog del Producto — Sistema de Gestión de Ventas e Inventario para Restaurante

**Proyecto:** Sistema de Gestión de Ventas e Inventario para Restaurante (Proyecto Integrador — Parquesoft)
**Estudiante / Product Owner:** David Peña
**Metodología:** Scrum / Ágil (4 sprints)
**Stack:** Python + FastAPI · PostgreSQL · SQLAlchemy · Pydantic · JWT · ReportLab · HTML/CSS/JS · Pytest
**Última actualización:** 2026-08-26
**Fuente:** `proyectoRES.docx` (documento oficial del proyecto)
**Documento hermano:** [`progress.MD`](./progress.MD) — seguimiento de implementación, pruebas y validación.

> Este backlog **transcribe y formaliza** las 20 historias de usuario (HU01–HU20) del documento oficial en formato **Gherkin (Dado / Cuando / Entonces)**, para que sean directamente verificables mediante pruebas Pytest. No se agregan historias, roles ni tecnologías fuera de las definidas en el documento oficial.

---

## 1. Convenciones

### 1.1 Priorización MoSCoW
- **Must** — imprescindible; su ausencia bloquea la entrega.
- **Should** — importante; mejora el sistema pero no bloquea la entrega.
- **Could** — deseable; se hace si el sprint da tiempo.

### 1.2 Estimación
Puntos de historia (SP) con escala Fibonacci (1, 2, 3, 5, 8, 13) mediante Planning Poker, tal como se estimaron en el documento oficial.

### 1.3 Formato de historia
Cada historia sigue la plantilla *Como [rol], quiero [necesidad], para [beneficio]* (tomada literalmente del documento oficial cuando existe) e incluye criterios de aceptación en Gherkin, derivados de los criterios en viñetas del documento oficial o, cuando no estaban detallados, inferidos de la descripción del módulo correspondiente (§10).

### 1.4 Definición de Terminado (DoD) — aplica a todas las historias
- El código fue desarrollado y cumple los criterios de aceptación.
- Existen pruebas Pytest correspondientes y pasan en verde.
- No existen errores críticos conocidos.
- La funcionalidad está integrada con el resto del sistema.
- El código está almacenado en GitHub.
- La documentación correspondiente fue actualizada.
- El Product Owner validó la funcionalidad.
- **La fila correspondiente en `progress.MD` fue actualizada.**

### 1.5 Roles
- **Administrador** — gestiona categorías, productos, inventario; consulta ventas, ingresos, egresos, balance y reportes.
- **Empleado / Cajero** — consulta productos disponibles y registra ventas.

---

## 2. Épicas (módulos del documento oficial, §10)

| Épica | Nombre | Descripción |
|-------|--------|-------------|
| **A** | Usuarios y autenticación | Inicio de sesión, autenticación JWT y control de acceso por rol. |
| **B** | Categorías | Crear, editar, eliminar y consultar categorías de productos. |
| **C** | Productos | Registrar, modificar, eliminar y consultar productos; control de stock. |
| **D** | Ventas | Consulta de catálogo por el empleado, registro de venta, cálculo de totales, actualización de stock, consulta de ventas. |
| **E** | Financiero | Registro y consulta de ingresos, egresos y balance. |
| **F** | Reportes | Reportes diarios, mensuales y generación de PDF. |

---

## 3. Modelo de datos (referencia para las historias)

No existe un modelo de datos explícito en el documento oficial más allá de las entidades mencionadas en el flujo y los módulos; se propone el siguiente esquema mínimo, consistente con SQLAlchemy/PostgreSQL, para soportar las 20 historias:

- **Usuario** — `id`, `nombre`, `email`, `password_hash`, `rol` (`ADMINISTRADOR | EMPLEADO`), `activo`, `creado_en`.
- **Categoria** — `id`, `nombre`, `descripcion`, `creado_en`.
- **Producto** — `id`, `nombre`, `precio`, `stock`, `categoria_id → Categoria`, `activo`, `creado_en`.
- **Venta** — `id`, `usuario_id → Usuario`, `fecha`, `total`.
- **DetalleVenta** — `id`, `venta_id → Venta`, `producto_id → Producto`, `cantidad`, `precio_unitario`, `subtotal`.
- **Egreso** — `id`, `concepto`, `descripcion`, `valor`, `fecha`.

> Los "ingresos" no requieren tabla propia: un ingreso de un período es la suma de `Venta.total` en ese rango de fechas (ver HU15).

---

## 4. Historias de usuario

### Épica A — Usuarios y autenticación

#### HU01 — Inicio de sesión · `Must` · `5 SP`
*Como administrador, quiero iniciar sesión para acceder de forma segura al sistema.*

```gherkin
Dado un usuario registrado con correo/usuario y contraseña válidos
Cuando envía sus credenciales al endpoint de login
Entonces el sistema valida las credenciales contra el hash almacenado
Y si son correctas, genera y devuelve un token JWT junto con el rol del usuario
Y si son incorrectas, devuelve un error genérico sin indicar si el usuario existe
Y las contraseñas nunca se almacenan ni se comparan en texto plano
```

---

### Épica B — Categorías

#### HU02 — Crear categorías · `Must` · `3 SP`
*Como administrador, quiero crear categorías para organizar los productos del restaurante.*

```gherkin
Dado un administrador autenticado
Cuando crea una categoría con un nombre
Entonces la categoría se almacena en la base de datos
Y aparece en el listado de categorías
Y si el nombre ya existe, el sistema rechaza la creación con un mensaje claro
```

#### HU03 — Editar categorías · `Must` · `3 SP`
*Como administrador, quiero editar categorías para mantener actualizada la información.*

```gherkin
Dado un administrador autenticado y una categoría existente
Cuando actualiza su nombre o descripción
Entonces los cambios se guardan y se reflejan en el listado
Y si la categoría no existe, el sistema devuelve un error 404
```

#### HU04 — Eliminar categorías · `Must` · `3 SP`
*Como administrador, quiero eliminar categorías para mantener organizado el sistema.*

```gherkin
Dado un administrador autenticado y una categoría existente
Cuando solicita eliminarla
Entonces la categoría se elimina si no tiene productos asociados
Y si tiene productos asociados, el sistema rechaza la eliminación y explica el motivo
```

---

### Épica C — Productos

#### HU05 — Registrar productos · `Must` · `5 SP`
*Como administrador, quiero registrar productos para ponerlos a la venta.*

```gherkin
Dado un administrador autenticado
Cuando registra un producto con nombre, precio, categoría y stock inicial
Entonces el sistema valida que el precio sea mayor que cero
Y valida que la categoría exista
Y el producto se almacena correctamente y aparece en el catálogo
```

#### HU06 — Modificar productos · `Must` · `3 SP`
*Como administrador, quiero modificar productos para actualizar su información.*

```gherkin
Dado un administrador autenticado y un producto existente
Cuando actualiza su nombre, precio, categoría o stock
Entonces el sistema valida nuevamente que el precio sea mayor que cero
Y los cambios se guardan y se reflejan en el catálogo
```

#### HU07 — Eliminar productos · `Must` · `3 SP`
*Como administrador, quiero eliminar productos para retirar productos que ya no se venden.*

```gherkin
Dado un administrador autenticado y un producto existente
Cuando solicita eliminarlo (o desactivarlo)
Entonces el producto deja de aparecer en el catálogo disponible para la venta
Y su historial en ventas anteriores permanece intacto
```

---

### Épica D — Ventas

#### HU08 — Empleado consulta productos disponibles · `Must` · `3 SP`
*Como empleado, quiero consultar los productos disponibles para realizar ventas.*

```gherkin
Dado un empleado autenticado
Cuando consulta el catálogo de productos
Entonces ve nombre, precio, categoría y stock disponible de cada producto activo
```

#### HU09 — Registrar venta · `Must` · `8 SP`
*Como empleado, quiero registrar una venta para almacenar las compras realizadas por los clientes.*

```gherkin
Dado un empleado autenticado
Cuando selecciona uno o varios productos con sus cantidades y confirma la venta
Entonces el sistema calcula el subtotal de cada producto y el total de la venta (ver HU11)
Y valida que exista suficiente stock antes de confirmar (ver HU12)
Y la venta y su detalle se almacenan en la base de datos
Y el stock se actualiza después de completar la venta (ver HU12)
Y si algún producto no tiene stock suficiente, la venta se rechaza y no se guarda ningún cambio
```

#### HU10 — Seleccionar cantidades de productos · `Must` · `5 SP`
*Como empleado, quiero seleccionar cantidades de productos para calcular correctamente el valor de la venta.*

```gherkin
Dado un empleado construyendo una venta
Cuando indica la cantidad de un producto seleccionado
Entonces el sistema no permite una cantidad mayor al stock disponible
Y no permite cantidades negativas o iguales a cero
```

#### HU11 — Cálculo automático del total · `Must` · `3 SP`
*Como sistema, quiero calcular automáticamente el total de la venta para evitar errores manuales.*

```gherkin
Dado una venta con una o más líneas de producto y cantidad
Cuando se agrega, edita o elimina una línea
Entonces el subtotal de cada línea se calcula como precio_unitario × cantidad
Y el total de la venta se calcula como la suma de todos los subtotales
```

#### HU12 — Actualización de stock tras venta · `Must` · `5 SP`
*Como sistema, quiero actualizar el stock después de una venta para mantener actualizado el inventario.*

```gherkin
Dado que una venta fue confirmada exitosamente
Cuando se completa la transacción de la venta
Entonces el stock de cada producto vendido disminuye en la cantidad correspondiente
Y esta actualización ocurre en la misma transacción que el registro de la venta
Y si la transacción falla, ni la venta ni la actualización de stock se persisten (rollback)
```

#### HU13 — Consultar ventas realizadas · `Must` · `5 SP`
*Como administrador, quiero consultar las ventas realizadas para conocer el movimiento del negocio.*

```gherkin
Dado un administrador autenticado
Cuando consulta el listado de ventas
Entonces puede filtrar por rango de fechas (día, semana, mes)
Y ve fecha, usuario que registró la venta, productos vendidos y total de cada venta
```

---

### Épica E — Financiero

#### HU14 — Registrar gastos · `Must` · `5 SP`
*Como administrador, quiero registrar gastos para controlar el dinero saliente del restaurante.*

```gherkin
Dado un administrador autenticado
Cuando registra un gasto con concepto, valor y fecha
Entonces el sistema valida que el valor sea mayor que cero
Y el gasto se almacena en la base de datos
Y aparece reflejado en el total de egresos del período correspondiente
```

#### HU15 — Consultar ingresos · `Must` · `3 SP`
*Como administrador, quiero consultar los ingresos para conocer cuánto dinero ha entrado al negocio.*

```gherkin
Dado un administrador autenticado
Cuando selecciona un rango de fechas
Entonces el sistema muestra el total de ingresos como la suma de los totales de venta en ese período
Y si no hay ventas en el período, el ingreso se muestra como 0
```

#### HU16 — Consultar egresos · `Must` · `3 SP`
*Como administrador, quiero consultar los egresos para conocer cuánto dinero ha salido del negocio.*

```gherkin
Dado un administrador autenticado
Cuando selecciona un rango de fechas
Entonces el sistema muestra el listado y el total de egresos registrados en ese período
Y si no hay egresos en el período, el total se muestra como 0
```

#### HU17 — Consultar balance · `Must` · `5 SP`
*Como administrador, quiero consultar el balance para conocer la diferencia entre ingresos y egresos.*

```gherkin
Dado un administrador autenticado
Cuando selecciona un período
Entonces el sistema calcula el total de ingresos y el total de egresos de ese período
Y muestra el balance como ingresos − egresos
Y los valores corresponden exactamente a la información almacenada en ese rango de fechas
```

---

### Épica F — Reportes

#### HU18 — Consultar reportes diarios · `Should` · `5 SP`
*Como administrador, quiero consultar reportes diarios para analizar las operaciones del día.*

```gherkin
Dado un administrador autenticado
Cuando solicita el reporte del día actual (o de un día específico)
Entonces el sistema muestra ventas totales, ingresos, egresos, balance y productos vendidos de ese día
```

#### HU19 — Consultar reportes mensuales · `Should` · `5 SP`
*Como administrador, quiero consultar reportes mensuales para analizar el comportamiento del negocio.*

```gherkin
Dado un administrador autenticado
Cuando solicita el reporte de un mes específico
Entonces el sistema muestra ventas totales, ingresos, egresos, balance y productos más vendidos de ese mes
```

#### HU20 — Generar reportes en PDF · `Could` · `5 SP`
*Como administrador, quiero generar reportes en PDF para disponer de información fácilmente compartible.*

```gherkin
Dado un administrador autenticado
Cuando solicita generar el reporte (diario, mensual o de stock bajo) en PDF
Entonces el sistema construye el documento con ReportLab, incluyendo la fecha de generación y los datos del período
Y devuelve un archivo PDF descargable
```

---

## 5. Resumen de priorización

| MoSCoW | Historias | Total SP |
|--------|-----------|----------|
| **Must** | HU01, HU02, HU03, HU04, HU05, HU06, HU07, HU08, HU09, HU10, HU11, HU12, HU13, HU14, HU15, HU16, HU17 | 70 |
| **Should** | HU18, HU19 | 10 |
| **Could** | HU20 | 5 |

Total historias: **20** · Total SP estimados: **85**.

---

## 6. Mapeo a sprints (según §13–16 del documento oficial)

### Sprint 1 — Base del sistema
**Meta:** construir la estructura inicial del sistema y permitir la administración básica de categorías y productos.
- Configuración: repositorio GitHub, entorno FastAPI, conexión a PostgreSQL, estructura de carpetas.
- HU02, HU03, HU04 — CRUD de categorías.
- HU05, HU06, HU07 — CRUD de productos.
- **SP del sprint: 20**

### Sprint 2 — Gestión de ventas
**Meta:** implementar el proceso completo de registro de ventas y la actualización automática del inventario.
- HU08 — Empleado consulta productos disponibles.
- HU09, HU10, HU11 — Registro de venta, selección de cantidades, cálculo de totales.
- HU12 — Actualización automática de stock.
- HU13 — Consulta de ventas realizadas.
- **SP del sprint: 29**

### Sprint 3 — Ingresos, egresos y balance
**Meta:** implementar el control financiero del restaurante.
- HU14 — Registrar gastos.
- HU15 — Consultar ingresos.
- HU16 — Consultar egresos.
- HU17 — Consultar balance.
- **SP del sprint: 16**

### Sprint 4 — Seguridad, reportes y finalización
**Meta:** completar la seguridad, los reportes, las pruebas y la documentación del sistema.
- HU01 — Autenticación JWT y control de acceso (se activa la protección de todos los endpoints construidos en los sprints anteriores).
- HU18, HU19 — Reportes diarios y mensuales.
- HU20 — Generación de reportes en PDF.
- Pruebas de integración, corrección de errores, documentación de la API y preparación de la entrega final.
- **SP del sprint: 20**

---

## 7. Trazabilidad con los objetivos SMART (documento oficial §4)

| Objetivo SMART original | Historias que lo cubren |
|---------------------------|--------------------------|
| Sprint 1 — Estructura del proyecto y conexión a BD | Configuración inicial (sin HU numerada) |
| Sprint 1 — Módulo de categorías | HU02, HU03, HU04 |
| Sprint 1 — Módulo básico de productos | HU05, HU06, HU07 |
| Sprint 2 — Registro de ventas con cálculo automático | HU08, HU09, HU10, HU11 |
| Sprint 2 — Actualización automática de stock | HU12 |
| Sprint 2 — Consulta de ventas por período | HU13 |
| Sprint 3 — Registro de ingresos por ventas | HU15 |
| Sprint 3 — Registro de gastos/egresos | HU14, HU16 |
| Sprint 3 — Cálculo de balance | HU17 |
| Sprint 3 — Consulta por día/semana/mes | HU13, HU15, HU16, HU17 |
| Sprint 4 — Autenticación y control de acceso | HU01 |
| Sprint 4 — Pruebas funcionales y corrección de errores | Todas (regresión) |
| Sprint 4 — Documentación de la entrega final | HU18, HU19, HU20 + documentación técnica |

---

## 8. Sincronización con `progress.MD`

Cada historia de este backlog tiene **exactamente una fila** en [`progress.MD`](./progress.MD), identificada por su ID (HU01…HU20). La regla de oro: **al mover una historia a "Terminada" en la DoD, se actualiza su fila en `progress.MD`** (estado de implementación, pruebas Pytest, resultado y validación). Ninguna historia se considera cerrada sin su registro de pruebas en verde.
