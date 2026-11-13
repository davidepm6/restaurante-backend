# Seguimiento de Progreso — Fase 2 · Sistema de Gestión de Ventas e Inventario para Restaurante

**Documento hermano:** [`Backlog_Fase2.MD`](./Backlog_Fase2.MD)
**Última actualización:** 2026-10-30
**Frameworks de pruebas:** Pytest (backend) · Vitest + Testing Library (frontend)
**Estado global de la fase:** 🔴 No iniciada (0 / 33 historias terminadas · 0 / 114 SP comprometidos)
**Fase 1:** ✅ terminada (HU01–HU20, 85 SP) — archivada en `docs/fase-1/`.

> Este archivo se **sincroniza uno a uno** con `Backlog_Fase2.MD`: cada historia (HU21…HU53) tiene una fila. Una historia solo se marca ✅ **Terminada** cuando cumple la [Definición de Terminado](./Backlog_Fase2.MD#14-definición-de-terminado-dod--aplica-a-todas-las-historias): implementada, con pruebas en verde, CI en verde, desplegada (si aplica) y validada por el Product Owner.

---

## 1. Leyenda de estados

**Implementación**
- ⬜ `Pendiente` — no iniciada.
- 🟦 `En progreso` — en desarrollo.
- 🟩 `Implementada` — código completo, en revisión (pull request).
- ✅ `Terminada` — cumple la DoD completa.

**Pruebas** — `impl/plan` (implementadas / planeadas). Se registra por separado la lógica de backend (Pytest) y de interfaz (Vitest) cuando ambas aplican, p. ej. `4/6 + 2/3`.

**Resultado:** ⬜ `N/A` · 🟢 `Pass` · 🔴 `Fail` (bloquea el cierre).

**Validado** (criterios verificados por el Product Owner): ⬜ `No` · ✅ `Sí`.

**Desplegado:** ⬜ `No` · ✅ `Sí` (verificado en Render/Vercel) · `N/A` (no afecta al sistema desplegado).

---

## 2. Tablero de seguimiento (sincronizado con el backlog)

| ID | Historia | Épica | Sprint | MoSCoW | Implementación | Módulo / Archivos | Pruebas (impl/plan) | Resultado | Validado | Desplegado |
|----|----------|-------|--------|--------|----------------|-------------------|---------------------|-----------|----------|------------|
| HU27 | Migraciones con Alembic | H | 5 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU28 | Entorno de pruebas aislado y datos semilla | H | 5 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | N/A |
| HU33 | Estructura base de la SPA y sistema de diseño | I | 5 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU21 | Registro e inicio de sesión con Clerk | G | 5 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU22 | Validación del token de Clerk en el backend | G | 5 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU23 | Roles mediante metadata de Clerk | G | 6 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU24 | Gestión de empleados por el administrador | G | 6 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU25 | Migración de usuarios y retiro del login propio | G | 6 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU29 | Frontend desplegado en Vercel | H | 6 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU30 | Backend en Render con configuración de producción | H | 6 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU31 | Integración continua con GitHub Actions | H | 6 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | N/A |
| HU34 | Navegación y rutas protegidas por rol | I | 7 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU35 | Edición completa desde la interfaz | I | 7 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU42 | Punto de venta con buscador y pedido | K | 7 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU43 | Método de pago de la venta | K | 7 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU44 | Anulación de ventas con reversión de stock | K | 7 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU49 | Dashboard de indicadores | L | 8 | Must | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU39 | Alertas de stock bajo | J | 8 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU32 | Rendimiento y endurecimiento de la API | H | 8 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU36 | Listados con búsqueda, filtros y paginación | I | 8 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU37 | Feedback y manejo de errores consistentes | I | 8 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU45 | Detalle de venta y comprobante PDF | K | 8 | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU26 | Sincronización de usuarios por webhooks | G | Reserva | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU38 | Reabastecimiento y movimientos de inventario | J | Reserva | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU46 | Historial de ventas propias del empleado | K | Reserva | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU50 | Egresos con categorías, edición y filtros | L | Reserva | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU51 | Reporte semanal y por rango personalizado | L | Reserva | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU52 | Reportes por método de pago y por empleado | L | Reserva | Should | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU40 | Imagen y descripción del producto | J | Reserva | Could | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU41 | Reactivar productos desactivados | J | Reserva | Could | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU47 | Efectivo recibido y cambio | K | Reserva | Could | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU48 | Mesas y comandas abiertas | K | Reserva | Could | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |
| HU53 | Exportación a CSV | L | Reserva | Could | ⬜ Pendiente | _(por definir)_ | 0/0 | ⬜ N/A | ⬜ No | ⬜ No |

---

## 3. Avance por sprint

| Sprint | Historias | Terminadas | SP comprometidos | SP terminados | Estado |
|--------|-----------|------------|------------------|---------------|--------|
| Sprint 5 — Cimientos: identidad y base de la interfaz | HU27, HU28, HU33, HU21, HU22 | 0/5 | 27 | 0 | 🔴 No iniciado |
| Sprint 6 — Roles, empleados y despliegue de producción | HU23, HU24, HU25, HU29, HU30, HU31 | 0/6 | 31 | 0 | 🔴 No iniciado |
| Sprint 7 — Operación de ventas | HU34, HU35, HU42, HU43, HU44 | 0/5 | 27 | 0 | 🔴 No iniciado |
| Sprint 8 — Analítica, pulido y cierre | HU49, HU39, HU32, HU36, HU37, HU45 | 0/6 | 29 | 0 | 🔴 No iniciado |
| **Total comprometido** | 22 historias | 0/22 | **114** | 0 | — |
| Reserva — Should | HU26, HU38, HU46, HU50, HU51, HU52 | 0/6 | 29 | 0 | No comprometida |
| Reserva — Could | HU40, HU41, HU47, HU48, HU53 | 0/5 | 23 | 0 | No comprometida |

**Velocidad real por sprint (se completa al cierre de cada uno):**

| Sprint | SP comprometidos | SP terminados | Velocidad | Ajuste de capacidad |
|--------|------------------|---------------|-----------|---------------------|
| 5 | 27 | — | — | Revisar R8 al cerrar |
| 6 | 31 | — | — | — |
| 7 | 27 | — | — | — |
| 8 | 29 | — | — | — |

---

## 4. Resumen de pruebas y calidad

| Métrica | Valor |
|---------|-------|
| Pruebas Pytest implementadas (heredadas de la fase 1: 18) | 18 |
| Pruebas Pytest nuevas de la fase 2 | 0 |
| Pruebas Vitest implementadas | 0 |
| Pruebas en verde (Pass) | — |
| Flujo de GitHub Actions (HU31) | ⬜ no configurado |
| Despliegue backend (Render) | ✅ activo (fase 1) |
| Despliegue frontend (Vercel) | ⬜ pendiente (HU29) |

> **Política de calidad:**
> - **HU22 y HU23** (token y roles): pruebas de token ausente, expirado, con firma inválida, de origen no autorizado y de usuario sin rol; ningún endpoint de negocio debe responder sin token.
> - **HU42, HU43, HU44** (venta, pago, anulación): casos límite de stock (cantidad igual al stock, mayor al stock, cero/negativa), venta atómica ante fallo a mitad de transacción, doble anulación y reversión exacta del stock.
> - **HU27**: cada migración se prueba primero en la rama de pruebas de Neon; respaldo previo antes de tocar producción.
> - **HU28**: ninguna prueba debe escribir en la base de uso real.

---

## 5. Cómo actualizar este archivo

1. Al pasar una historia a **🟦 En progreso**, registra el módulo/archivos donde se trabaja (p. ej. `app/routers/ventas.py`, `frontend/src/pages/PuntoDeVenta.tsx`).
2. Al escribir cada prueba, incrementa el contador `impl/plan` de esa historia.
3. Ejecuta `pytest` y `npm test` (o confirma el flujo de GitHub Actions). Si todo está en verde, marca **Resultado = 🟢 Pass**.
4. Verifica los criterios de aceptación del backlog como Product Owner → **Validado = ✅ Sí**.
5. Si la historia afecta al sistema desplegado, verifica en Render/Vercel → **Desplegado = ✅ Sí**.
6. Solo cuando implementación ✅, pruebas 🟢, validado ✅ (y desplegado ✅ cuando aplica) coinciden, la historia pasa a **✅ Terminada** y suma sus SP al sprint.
7. Actualiza la fecha de "Última actualización", el "Estado global" y la tabla de velocidad al cerrar el sprint.

---

## 6. Registro de decisiones y spikes

| Fecha | Tipo | Decisión / hallazgo |
|-------|------|---------------------|
| 2026-10-30 | Decisión | Identidad con **Clerk**; frontend **React + TypeScript + Vite** desplegado en **Vercel**; backend se mantiene en **Render**; base de datos en NeonDB. |
| 2026-10-30 | Decisión | Se conserva la decisión de la fase 1 de no usar capa `services/` separada; se revisará si la lógica nueva lo justifica. |
| _(pendiente)_ | Spike HU22 | `clerk-backend-api` vs. PyJWT + JWKS: resultado y compatibilidad con la versión de Python. |

---

## 7. Bitácora de cambios

| Fecha | Cambio |
|-------|--------|
| 2026-10-30 | Creación de `Backlog_Fase2.MD` y `progress_Fase2.MD`: 33 historias nuevas (HU21–HU53), épicas G–L, sprints 5–8 y reserva. La fase 1 (HU01–HU20) queda archivada en `docs/fase-1/`. |
