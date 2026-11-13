# CLAUDE.md — Contexto e instrucciones del proyecto (Fase 2)

> Archivo de contexto para Claude. Define **el objetivo**, el **stack vigente**, las **decisiones de arquitectura** y los **lineamientos** que Claude debe seguir en cualquier sesión de trabajo sobre este proyecto. Léelo antes de proponer o implementar cambios.
>
> Reemplaza a la versión de la fase 1 (archivada en `docs/fase-1/CLAUDE_fase1.md`). Está sincronizado con [`Backlog_Fase2.MD`](./Backlog_Fase2.MD) y [`progress_Fase2.MD`](./progress_Fase2.MD). Proyecto Integrador — Parquesoft · Product Owner: David Peña.

---

## 0. Qué cambió respecto a la fase 1

| Tema | Fase 1 | Fase 2 |
|------|--------|--------|
| Autenticación | JWT propio (login, hash, scripts de usuarios) | **Clerk** (login, usuarios, invitaciones); el backend solo **verifica** tokens |
| Frontend | HTML, CSS y JavaScript | **React + TypeScript + Vite** |
| Despliegue frontend | Local / sitio estático en Render | **Vercel** |
| Despliegue backend | Render | Render (con configuración de producción: CORS restringido, `/health`, versión de Python fijada) |
| Esquema de BD | `create_all` al arrancar | **Migraciones Alembic** |
| Pruebas | Pytest | Pytest + **Vitest/Testing Library** + CI en **GitHub Actions** |
| Base de datos | NeonDB | NeonDB (sin cambios) |
| Alcance | 20 historias (HU01–HU20), terminadas | 33 historias nuevas (HU21–HU53), sprints 5–8 |

---

## 1. Objetivo del proyecto

Sistema de Gestión de Ventas e Inventario para Restaurante: una API REST y una aplicación web que centralizan categorías, productos, ventas, inventario e información financiera (ingresos, egresos, balance), con acceso por roles.

**Visión de la fase 2:** llevar el sistema funcional de la fase 1 a una arquitectura de producción: identidad gestionada por Clerk, interfaz React profesional con un punto de venta ágil (búsqueda de productos), despliegue automatizado (Render + Vercel + CI), y mayor alcance funcional (método de pago, anulación de ventas, comprobantes, historial de inventario, dashboard).

**Fuera de alcance:** app móvil nativa · pasarelas de pago reales · facturación electrónica oficial · integración con domicilios · hardware de punto de venta · inteligencia artificial · multi-restaurante · Clerk Organizations.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Python + FastAPI (versión de Python **fijada** y la misma en local y Render) |
| Base de datos | PostgreSQL en **NeonDB** (rama de producción/uso y rama de pruebas) |
| ORM / migraciones | SQLAlchemy + **Alembic** |
| Validación | Pydantic |
| Identidad | **Clerk** — frontend `@clerk/react`; backend: verificación del token con `clerk-backend-api` o con PyJWT + JWKS (se decide en el spike de HU22) |
| Reportes PDF | ReportLab |
| Frontend | **React + TypeScript + Vite**, React Router |
| Pruebas | Pytest (backend) · Vitest + Testing Library (frontend) |
| CI/CD | **GitHub Actions**; Render (auto-deploy del backend) y Vercel (auto-deploy del frontend) desde GitHub |
| Control de versiones | Git + GitHub |
| Editor / SO | Visual Studio Code · Windows (PowerShell) |

**Librerías propuestas (confirmar en el Sprint 5):** TanStack Query (caché y estados de carga de la API) · Recharts (gráficos del dashboard) · CSS con tokens de diseño propios (sin librería de componentes).

> **Verifica siempre la documentación vigente de Clerk antes de escribir código con su SDK.** Con Core 3 (marzo de 2026) el paquete `@clerk/clerk-react` pasó a llamarse `@clerk/react` y los componentes `<SignedIn>`, `<SignedOut>` y `<Protect>` se unificaron en `<Show>`; muchos tutoriales antiguos están desactualizados. Core 3 exige Node.js 20.9 o superior.

El stack no se cambia sin acuerdo explícito del Product Owner. **No se usan** Next.js, Prisma ni Auth.js.

---

## 3. Decisiones de arquitectura vigentes

### 3.1 Identidad y autorización (Clerk)
1. **Clerk es la única fuente de identidad.** El backend no almacena contraseñas ni emite tokens (se retira el login propio en HU25).
2. **Flujo:** el navegador inicia sesión con Clerk → obtiene el token de sesión (JWT de vida corta, ~60 s) con `getToken()` **en cada llamada** → lo envía como `Authorization: Bearer <token>` → la API lo verifica **antes de cualquier lógica de negocio**.
3. **Verificación:** firma y vigencia con la clave pública de Clerk (JWKS o `CLERK_JWT_KEY`), y **partes autorizadas** (`authorized_parties`: los dominios del frontend) para rechazar tokens emitidos para otros orígenes. Confirmar el nombre exacto de la opción en el spike de HU22.
4. **Roles:** `publicMetadata.role` del usuario en Clerk (`ADMINISTRADOR` | `EMPLEADO`), expuesto en el token con un *custom claim* (Clerk Dashboard → Sessions → Customize session token: `{"metadata": "{{user.public_metadata}}"}`). El backend lee `claims["metadata"]["role"]` y autoriza con una dependencia de FastAPI (equivalente a `requiere_rol` de la fase 1). `has({ role })` de Clerk **no** aplica a roles en metadata (solo a Organizations): se compara el claim directamente. Los claims personalizados tienen un límite de tamaño pequeño (~1,2 KB): solo se incluye el rol.
5. **Sin rol = sin acceso:** una cuenta autenticada sin rol recibe `403` ("Cuenta pendiente de asignación de rol").
6. **Registro restringido:** solo por invitación del administrador (HU24). El primer administrador se asigna a mano en el panel de Clerk (procedimiento en el README).
7. **Cambios de rol/desactivación** se aplican en la siguiente renovación del token (hasta ~1 min); es un comportamiento aceptado y documentado.
8. **Gestión de empleados** (invitar, cambiar rol, desactivar): el backend llama a la API de Clerk con `CLERK_SECRET_KEY`. Un administrador no puede quitarse el rol ni desactivarse si es el único.
9. **Webhooks (HU26, reserva):** eventos `user.created`, `user.updated`, `user.deleted`; verificar la firma Svix sobre el **cuerpo sin modificar**; *upsert* idempotente por `clerk_user_id`; no borrar el historial de ventas de un usuario eliminado.
10. **Autorización siempre en el backend.** Ocultar opciones en React es solo UX; cada endpoint protegido valida token y rol.
11. Respuestas: `401` = no autenticado (mensaje genérico) · `403` = sin permisos.

### 3.2 Datos y transacciones (se conservan de la fase 1)
12. **Integridad transaccional:** registrar una venta + su detalle + descontar stock es **una sola transacción**; la anulación (HU44) restituye el stock **en la misma transacción**. Si algo falla, nada queda a medias.
13. **Validación de negocio con Pydantic** antes de tocar la base (precios y valores > 0, cantidades ≥ 1, nombres únicos).
14. **Ingresos derivados de ventas:** no hay tabla de ingresos; son la suma de `Venta.total` de ventas **no anuladas** en el período. Los egresos sí son una entidad propia.
15. **Categoría estructural:** todo producto pertenece a una categoría; no se elimina una categoría con productos asociados.
16. **Migraciones:** todo cambio de esquema pasa por Alembic. Se prueba primero en la **rama de pruebas de Neon**; antes de tocar producción se hace respaldo. `create_all` no se usa al arrancar.
17. **Pruebas aisladas:** `pytest` usa la rama de pruebas (`.env.test`), nunca la base de uso real. Los datos de prueba llevan identificadores únicos y se limpian.

### 3.3 Estructura del código
18. **Backend:** se mantiene la decisión de la fase 1 de **no usar una capa `services/` separada**; la lógica de negocio vive en los routers y se prueba con `TestClient`. *Recomendación abierta:* extraer a `app/services/` la lógica nueva que supere ~40 líneas o se reutilice (anulación de venta, analítica). Hasta que el Product Owner lo confirme, no se cambia la estructura.
19. **Frontend:** las llamadas HTTP viven solo en `src/api/` (cliente único que adjunta el token); los componentes no llaman a `fetch` directamente. Los totales que muestra la interfaz son informativos: **el backend recalcula** todo.

### 3.4 Despliegue
20. **Backend (Render):** CORS solo para el dominio del frontend en Vercel (lista en variable de entorno) y `localhost` en desarrollo — nunca `*` en producción; endpoint `/health` sin autenticación; versión de Python fijada con la variable `PYTHON_VERSION` (confirmar en la documentación de Render). El plan gratuito se duerme tras ~15 minutos sin tráfico: la interfaz debe mostrar "Conectando con el servidor…" y reintentar.
21. **Frontend (Vercel):** *Root Directory* = `frontend`, preset Vite, variables `VITE_*` configuradas en Vercel, y un `vercel.json` con *rewrite* a `/index.html` para que las rutas internas de la SPA funcionen al recargar.
22. **CI (HU31):** GitHub Actions ejecuta pytest (contra la rama de pruebas), lint, pruebas y compilación del frontend; `main` protegida.

---

## 4. Estructura de carpetas objetivo

```
restaurante/
├── app/                       # Backend FastAPI
│   ├── main.py
│   ├── database.py
│   ├── models/  schemas/  routers/
│   └── security/              # Verificación de token Clerk y dependencias de rol
├── alembic/  alembic.ini      # Migraciones
├── scripts/                   # seed (datos de demostración)
├── tests/                     # Pytest + conftest.py (BD de pruebas)
├── frontend/                  # React + TypeScript + Vite (raíz del proyecto en Vercel)
│   └── src/
│       ├── main.tsx           # ClerkProvider
│       ├── App.tsx            # Rutas
│       ├── api/               # Cliente HTTP único y tipos de la API
│       ├── components/        # ui/ (botón, campo, tabla, diálogo, aviso) y layout/
│       ├── pages/             # Dashboard, Categorias, Productos, PuntoDeVenta, Ventas, Finanzas, Reportes, Empleados, SinAcceso
│       ├── hooks/
│       └── styles/            # Tokens de diseño
├── frontend-legacy/           # Frontend HTML/CSS/JS de la fase 1 (se elimina al cierre del Sprint 8)
├── docs/fase-1/               # Backlog.MD, progress.MD y CLAUDE_fase1.md
├── .github/workflows/         # CI
├── Backlog_Fase2.MD  progress_Fase2.MD  CLAUDE.md  README.md
└── requirements.txt
```

---

## 5. Variables de entorno (solo nombres; los valores nunca se versionan)

**Backend (Render y `.env` local, ambos ignorados por Git):** `DATABASE_URL` · `CLERK_SECRET_KEY` · `CLERK_JWT_KEY` (opcional, verificación sin red) · `CLERK_AUTHORIZED_PARTIES` (dominios del frontend) · `ALLOWED_ORIGINS` (CORS) · `CLERK_WEBHOOK_SECRET` (solo si se implementa HU26) · `PYTHON_VERSION` (Render).
**Pruebas:** `.env.test` con la `DATABASE_URL` de la rama de pruebas de Neon.
**Frontend (Vercel y `.env.local`):** `VITE_CLERK_PUBLISHABLE_KEY` · `VITE_API_URL`.
**Se retiran con HU25:** `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`.

`CLERK_SECRET_KEY` **jamás** va al frontend ni al repositorio. Si una credencial queda expuesta (captura, commit, chat), se **rota** de inmediato y se actualiza en Render/Vercel/GitHub.

---

## 6. Lineamientos de desarrollo

### 6.1 Backend
- Tipado explícito y esquemas Pydantic en la entrada y salida de la API.
- Listados con paginación y sin consultas N+1 (HU32); errores con formato JSON uniforme.
- Verificar el token **primero** en cada endpoint protegido; no registrar tokens en logs.

### 6.2 Frontend
- TypeScript estricto, sin `any`; contratos de la API tipados en `src/api/`.
- Rutas protegidas con los componentes de Clerk (`<Show>`) y guardas por rol; pantalla "Sin acceso".
- Estados de carga, vacío y error en toda pantalla que consulte la API; confirmaciones con diálogo propio (no `window.confirm`).
- Diseño con tokens (color, tipografía, espaciado); responsive desde 390 px, foco de teclado visible, contraste suficiente.
- Textos de interfaz en español, en minúscula tras la primera letra, con verbos de acción consistentes ("Guardar cambios", y el aviso dice "Cambios guardados"). Los errores explican qué pasó y cómo resolverlo, sin disculpas.

### 6.3 Seguridad
- Secretos solo en variables de entorno; `.env*` en `.gitignore`.
- CORS restringido; HTTPS en Render y Vercel.
- Webhooks: verificar firma antes de procesar.
- Principio de mínimo privilegio: el empleado solo ve sus ventas y el catálogo.

### 6.4 Pruebas (obligatorias)
- **Backend:** Pytest con tokens firmados localmente con una clave de prueba (sin llamar a Clerk); casos de token ausente/expirado/inválido/origen no autorizado, sin rol, por rol, stock límite, doble anulación y atomicidad de la venta.
- **Frontend:** Vitest + Testing Library para la lógica crítica (pedido del punto de venta, cálculo de totales mostrados, guardas por rol).
- Ninguna historia se cierra con pruebas en rojo ni con CI en rojo.

### 6.5 Definición de Terminado
La de [`Backlog_Fase2.MD` §1.4](./Backlog_Fase2.MD): código integrado por pull request · pruebas y CI en verde · migración Alembic si cambia el esquema · sin secretos en el repo · desplegada y verificada (si aplica) · documentación actualizada · validada por el Product Owner · **fila de `progress_Fase2.MD` actualizada**.

---

## 7. Flujo de trabajo con el backlog

- El backlog está en [`Backlog_Fase2.MD`](./Backlog_Fase2.MD): 33 historias (HU21–HU53), criterios en Gherkin, MoSCoW y puntos de historia, en 4 sprints (5–8) más una reserva.
- El seguimiento está en [`progress_Fase2.MD`](./progress_Fase2.MD), una fila por historia.
- **Sprint 5 — Cimientos:** HU27, HU28, HU33, HU21, HU22.
- **Sprint 6 — Roles, empleados y despliegue de producción:** HU23, HU24, HU25, HU29, HU30, HU31.
- **Sprint 7 — Operación de ventas:** HU34, HU35, HU42, HU43, HU44.
- **Sprint 8 — Analítica, pulido y cierre:** HU49, HU39, HU32, HU36, HU37, HU45.
- **Reserva:** Should (HU26, HU38, HU46, HU50, HU51, HU52) y Could (HU40, HU41, HU47, HU48, HU53).
- Al cerrar el Sprint 5 se revisa la capacidad real (riesgo R8).

---

## 8. Cómo debe trabajar Claude en este proyecto

1. **Antes de implementar**, ubicar la historia en `Backlog_Fase2.MD` y usar sus criterios de aceptación como especificación.
2. **Para Clerk, Vercel y Render, consultar la documentación vigente** antes de escribir código o configuración: los nombres de paquetes y opciones cambian.
3. Escribir **código y pruebas juntos**, respetando las decisiones de §3. Si algo las contradice, señalarlo y proponer una alternativa antes de continuar.
4. Cambios de esquema **siempre con migración Alembic**; nunca editar la base productiva a mano ni con `create_all`.
5. Tras implementar, **actualizar `progress_Fase2.MD`** (implementación, pruebas, resultado, validación, despliegue) y las fechas.
6. Cambios pequeños y verificables; no ampliar el alcance sin acuerdo.
7. Ante decisiones abiertas o irreversibles (estructura `services/`, librerías propuestas, retiro de datos), consultar al Product Owner en lugar de asumir.
8. No pedir ni repetir credenciales; si aparece una en una captura o texto, avisar y recomendar rotarla.
9. Recordar que en Windows un **entorno virtual de Python no es portable**: si se mueve la carpeta del proyecto, hay que recrearlo.

---

## 9. Riesgos a vigilar

Detalle completo en [`Backlog_Fase2.MD` §10](./Backlog_Fase2.MD). Los principales: compatibilidad del SDK de Clerk con la versión de Python (R1) · arranque en frío de Render (R2) · pérdida de datos al migrar (R3) · curva de aprendizaje de React/TypeScript/Clerk (R4) · registro abierto en Clerk (R6) · capacidad frente a los 114 SP comprometidos (R8).

---

## 10. Comandos de referencia (PowerShell)

```powershell
# Backend
python -m venv venv ; .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
pytest -v

# Frontend
cd frontend
npm install
npm run dev
npm run lint ; npm test ; npm run build
```

---

_Última actualización: 2026-10-30 · Documentos relacionados: [`Backlog_Fase2.MD`](./Backlog_Fase2.MD) · [`progress_Fase2.MD`](./progress_Fase2.MD) · Fase 1 en `docs/fase-1/`_
