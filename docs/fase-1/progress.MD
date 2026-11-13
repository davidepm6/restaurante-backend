# Seguimiento de Progreso — Sistema de Gestión de Ventas e Inventario para Restaurante

**Documento hermano:** [`Backlog.MD`](./Backlog.MD)
**Última actualización:** 2026-08-26
**Framework de pruebas:** Pytest · Testing enfocado a lógica de negocio y seguridad
**Estado global del proyecto:** 🔴 No iniciado (0 / 20 historias terminadas)

> Este archivo se **sincroniza uno a uno** con `Backlog.MD`: cada historia (HU01…HU20) tiene una fila. Una historia solo se marca ✅ **Terminada** cuando está implementada, tiene pruebas Pytest en verde y sus criterios de aceptación están validados por el Product Owner (ver [Definición de Terminado](./Backlog.MD#14-definición-de-terminado-dod--aplica-a-todas-las-historias)).

---

## 1. Leyenda de estados

**Implementación**
- ⬜ `Pendiente` — no iniciada.
- 🟦 `En progreso` — en desarrollo.
- 🟩 `Implementada` — código completo, en revisión (PR).
- ✅ `Terminada` — cumple la DoD completa (código + pruebas verdes + validada).

**Pruebas unitarias**
- `0/0` — (implementadas / totales planeadas). Se registra la cobertura por historia.

**Resultado de pruebas**
- ⬜ `N/A` — sin pruebas aún.
- 🟢 `Pass` — todas en verde.
- 🔴 `Fail` — hay pruebas en rojo (bloquea el cierre).

**Validado** (criterios de aceptación verificados por el Product Owner)
- ⬜ `No` · ✅ `Sí`

---

## 2. Tablero de seguimiento (sincronizado con el backlog)

| ID | Historia | Épica | Sprint | MoSCoW | Implementación | Módulo / Archivos | Pruebas (impl/plan) | Resultado | Validado |
|----|----------|-------|--------|--------|----------------|-------------------|---------------------|-----------|----------|
| HU02 | Crear categorías | B | 1 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU03 | Editar categorías | B | 1 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU04 | Eliminar categorías | B | 1 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU05 | Registrar productos | C | 1 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU06 | Modificar productos | C | 1 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU07 | Eliminar productos | C | 1 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU08 | Empleado consulta productos disponibles | D | 2 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU09 | Registrar venta | D | 2 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU10 | Seleccionar cantidades de productos | D | 2 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU11 | Cálculo automático del total | D | 2 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU12 | Actualización de stock tras venta | D | 2 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU13 | Consultar ventas realizadas | D | 2 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU14 | Registrar gastos | E | 3 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU15 | Consultar ingresos | E | 3 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU16 | Consultar egresos | E | 3 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU17 | Consultar balance | E | 3 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU01 | Inicio de sesión (JWT) | A | 4 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU18 | Consultar reportes diarios | F | 4 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU19 | Consultar reportes mensuales | F | 4 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |
| HU20 | Generar reportes en PDF | F | 4 | Could | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No |

---

## 3. Avance por sprint

| Sprint | Historias | Terminadas | SP total | SP terminados | Estado |
|--------|-----------|------------|----------|---------------|--------|
| Sprint 1 — Base del sistema | HU02, HU03, HU04, HU05, HU06, HU07 | 0/6 | 20 | 0 | 🔴 No iniciado |
| Sprint 2 — Gestión de ventas | HU08, HU09, HU10, HU11, HU12, HU13 | 0/6 | 29 | 0 | 🔴 No iniciado |
| Sprint 3 — Ingresos, egresos y balance | HU14, HU15, HU16, HU17 | 0/4 | 16 | 0 | 🔴 No iniciado |
| Sprint 4 — Seguridad, reportes y finalización | HU01, HU18, HU19, HU20 | 0/4 | 20 | 0 | 🔴 No iniciado |

---

## 4. Resumen de pruebas

| Métrica | Valor |
|---------|-------|
| Pruebas Pytest implementadas | 0 |
| Pruebas en verde (Pass) | 0 |
| Historias con pruebas de integridad crítica (venta + stock, validaciones de negocio) | 0 / 3 previstas (HU09, HU10, HU12) |
| Historias con pruebas de seguridad (autenticación/autorización) | 0 / 1 prevista (HU01) |
| Cobertura de lógica de negocio | — (aún sin suite) |

> **Política de calidad:** HU09, HU10 y HU12 (registro de venta, selección de cantidades y actualización de stock) deben incluir pruebas de casos límite (stock insuficiente, cantidades en cero o negativas, fallo a mitad de transacción) antes de considerarse validadas. HU01 debe incluir pruebas de credenciales inválidas y de acceso a rutas protegidas sin token.

---

## 5. Cómo actualizar este archivo

1. Al pasar una historia a **🟦 En progreso**, registra el módulo/archivos donde se trabaja (p. ej. `app/routers/categorias.py`).
2. Al escribir cada prueba, incrementa el contador `impl/plan` de esa historia (p. ej. `4/6`).
3. Ejecuta `pytest`. Si todo está en verde, marca **Resultado = 🟢 Pass**.
4. Verifica manualmente los criterios de aceptación del backlog junto al Product Owner. Si se cumplen, marca **Validado = ✅ Sí**.
5. Solo cuando implementación ✅, pruebas 🟢 y validado ✅ coinciden, la historia pasa a **✅ Terminada** y suma sus SP al avance del sprint.
6. Actualiza la fecha de "Última actualización" y el "Estado global del proyecto" en el encabezado.

---

## 6. Bitácora de cambios

| Fecha | Cambio |
|-------|--------|
| 2026-08-26 | Reescritura completa de `progress.MD` para alinearlo con el documento oficial `proyectoRES.docx`: stack Python/FastAPI/SQLAlchemy/JWT/ReportLab/Pytest, 20 historias (HU01–HU20) y 4 sprints, reemplazando la versión previa (Next.js/Prisma, US01–US28, 5 sprints) que no correspondía al proyecto real. |
