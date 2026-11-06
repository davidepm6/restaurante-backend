# Backlog del Producto — Fase 2: Evolución del Sistema de Gestión de Ventas e Inventario para Restaurante

**Proyecto:** Sistema de Gestión de Ventas e Inventario para Restaurante (Proyecto Integrador — Parquesoft)
**Estudiante / Product Owner:** David Peña
**Metodología:** Scrum / Ágil (4 sprints: Sprint 5 al Sprint 8; la numeración continúa la de la fase 1)
**Stack objetivo:** Python + FastAPI · PostgreSQL (NeonDB) · SQLAlchemy · Alembic · **Clerk** (identidad) · **React + TypeScript + Vite** · Pytest · Vitest · GitHub Actions · **Render** (backend) · **Vercel** (frontend)
**Última actualización:** 2026-10-30
**Documentos hermanos:** [`progress_Fase2.MD`](./progress_Fase2.MD) (seguimiento) · [`CLAUDE.md`](./CLAUDE.md) (contexto técnico vigente) · Fase 1 archivada en `docs/fase-1/` (HU01–HU20, todas terminadas).

> Este backlog parte de un sistema **ya funcional** (fase 1: API REST con 20 historias terminadas, JWT propio, frontend en HTML/CSS/JS). La fase 2 no reconstruye lo hecho: lo **endurece, lo despliega con una arquitectura de producción, reemplaza la autenticación propia por Clerk, reconstruye la interfaz en React y amplía el alcance funcional** (pagos registrados, anulaciones, inventario con historial, analítica).

---

## 1. Convenciones

### 1.1 Priorización MoSCoW
- **Must** — imprescindible para considerar cumplida la fase.
- **Should** — importante; entra al sprint si la capacidad lo permite.
- **Could** — deseable; solo si sobra tiempo (no se compromete).

### 1.2 Estimación
Puntos de historia (SP), escala Fibonacci (1, 2, 3, 5, 8, 13), con Planning Poker. La velocidad observada en la fase 1 fue de **~21 SP por sprint** (85 SP en 4 sprints). Para esta fase se asume una capacidad de **~28 SP por sprint** porque parte del trabajo reutiliza la API existente; **esta suposición se revisa al cerrar el Sprint 5** (ver §10, R8).

### 1.3 Formato de historia
*Como [rol], quiero [necesidad], para [beneficio]*, con criterios de aceptación en Gherkin (Dado / Cuando / Entonces), verificables con pruebas automatizadas.

### 1.4 Definición de Terminado (DoD) — aplica a todas las historias
- El código cumple los criterios de aceptación y está integrado en `main` mediante pull request.
- Existen pruebas automatizadas y pasan en verde: **Pytest** (backend) y **Vitest + Testing Library** para la lógica de interfaz crítica (frontend).
- El flujo de **GitHub Actions** (a partir de HU31) pasa en verde.
- Si la historia cambia el esquema de la base de datos, incluye su **migración Alembic** (aplicada primero en la rama de pruebas de Neon).
- No hay secretos en el repositorio (`.env*` ignorados; claves solo en variables de entorno de Render/Vercel/GitHub).
- Las historias que afectan al sistema desplegado están **desplegadas** (Render / Vercel) y verificadas allí.
- No hay errores críticos conocidos; la interfaz funciona desde 390 px y tiene foco de teclado visible.
- La documentación (README, `CLAUDE.md`) está actualizada.
- El Product Owner validó la funcionalidad y **la fila en `progress_Fase2.MD` fue actualizada**.

### 1.5 Roles (se mantienen los de la fase 1)
- **Administrador** — categorías, productos, inventario, egresos, ventas (consulta y anulación), analítica, reportes y **gestión de empleados**.
- **Empleado / Cajero** — consulta productos y registra ventas; ve solo sus propias ventas.
- **Sin rol asignado** — cuenta autenticada en Clerk pero sin rol: no accede a nada de negocio.

---

## 2. Contexto y objetivos de la fase

### 2.1 Punto de partida (fin de la fase 1)
API REST en FastAPI desplegada en Render, base de datos en NeonDB, autenticación JWT propia con dos roles, 18 pruebas Pytest, frontend básico en HTML/CSS/JS (login, categorías, productos, ventas, financiero, reportes) con un rediseño en curso. Limitaciones conocidas: usuarios creados por script, la interfaz solo crea/elimina (no edita), no hay método de pago ni anulación de ventas, el stock no tiene historial, no hay analítica, el esquema se crea con `create_all` (sin migraciones), CORS abierto (`*`) y las pruebas compartían base de datos con el uso real.

### 2.2 Objetivos de la fase 2

| ID | Objetivo | Sprints |
|----|----------|---------|
| **O1** | **Identidad:** reemplazar la autenticación propia por Clerk, con roles verificados en el backend y administración de empleados desde la aplicación. | 5–6 |
| **O2** | **Interfaz:** reconstruir el frontend en React + TypeScript con diseño consistente, edición completa y un punto de venta con búsqueda de productos. | 5–8 |
| **O3** | **Despliegue y calidad:** backend en Render, frontend en Vercel, CI con GitHub Actions, migraciones, entorno de pruebas aislado y configuración segura de producción. | 5–6 |
| **O4** | **Alcance funcional:** método de pago, anulación de ventas, comprobantes, historial de inventario. | 7–8 |
| **O5** | **Analítica:** panel de indicadores y reportes más completos. | 8 |

### 2.3 Alcance
**Incluye:** integración con Clerk (frontend y backend) · gestión de empleados · SPA en React · despliegue Render + Vercel · CI · migraciones Alembic · punto de venta con búsqueda · método de pago registrado · anulación con reversión de stock · comprobante PDF · dashboard · mejoras de egresos y reportes.

**No incluye (por ahora):** aplicación móvil nativa · pasarelas de pago reales / cobro electrónico · facturación electrónica oficial · integración con domicilios · hardware de punto de venta · inteligencia artificial · multi-restaurante (multi-tenant) · Clerk Organizations.

---

## 3. Arquitectura objetivo (resumen)

```
Navegador ── React + TS (Vercel) ──▶ Clerk (sesión, login, token de 60 s)
     │                                   │
     └── Authorization: Bearer <token> ──▶ FastAPI (Render) ──▶ NeonDB (PostgreSQL)
                                          │  verifica token (clave pública de Clerk)
                                          │  autoriza por rol (claim en el token)
                                          └─▶ Clerk Backend API (invitar/rol/desactivar empleados)
Clerk ──webhook firmado (opcional, HU26)──▶ FastAPI /webhooks/clerk
```

- El navegador **nunca** recibe `CLERK_SECRET_KEY`; solo la *publishable key*.
- El rol vive en `publicMetadata` del usuario en Clerk y viaja en el token mediante un *custom claim*; el backend es siempre quien autoriza.
- Los cambios de rol se reflejan en la siguiente renovación del token (hasta ~1 minuto).

---

## 4. Épicas

| Épica | Nombre | Descripción |
|-------|--------|-------------|
| **G** | Identidad y accesos (Clerk) | Login con Clerk, validación del token en la API, roles, gestión de empleados, retiro del login propio. |
| **H** | Plataforma, despliegue y calidad | Migraciones, entorno de pruebas, despliegue en Vercel y Render, CI, rendimiento y endurecimiento. |
| **I** | Interfaz React | Base de la SPA y sistema de diseño, navegación por rol, edición completa, listados, manejo de errores. |
| **J** | Catálogo e inventario | Movimientos de stock, alertas, imágenes, reactivación de productos. |
| **K** | Ventas | Punto de venta con buscador, método de pago, anulación, comprobante, historial propio, mesas. |
| **L** | Finanzas, analítica y reportes | Dashboard, egresos mejorados, reportes ampliados, exportación. |

---

## 5. Modelo de datos — cambios sobre la fase 1

Se conservan `Categoria`, `Producto`, `Venta`, `DetalleVenta` y `Egreso`. Cambios (todos mediante migraciones Alembic, HU27):

- **Usuario (local):** deja de ser la fuente de identidad (la fuente es Clerk). Se retira con HU25. Si se implementa HU26 vuelve como **espejo de solo lectura**: `clerk_user_id` (único), `email`, `nombre`, `rol`, `eliminado`.
- **Venta:** `+ registrada_por` (clerk_user_id), `+ registrada_por_nombre` (instantánea del nombre), `+ metodo_pago` (`EFECTIVO | TARJETA | TRANSFERENCIA`), `+ estado` (`COMPLETADA | ANULADA`), `+ anulada_en`, `+ anulada_por`, `+ motivo_anulacion`. La columna `usuario_id` de la fase 1 se conserva (nullable) solo para ventas históricas.
- **Producto:** `+ stock_minimo` (HU39), `+ descripcion`, `+ imagen_url` (HU40).
- **MovimientoInventario** (HU38, nueva): `id`, `producto_id`, `tipo` (`ENTRADA | VENTA | ANULACION | AJUSTE`), `cantidad`, `stock_resultante`, `motivo`, `registrado_por`, `fecha`.
- **Egreso:** `+ categoria` (`INSUMOS | NOMINA | SERVICIOS | ARRIENDO | OTROS`), `+ anulado` (HU50).
- **Mesa / Comanda / DetalleComanda** (HU48, Could): solo si se implementa.

> Los ingresos siguen sin tabla propia: son la suma de `Venta.total` de ventas **no anuladas** en el período.

---

## 6. Historias de usuario

### Épica G — Identidad y accesos (Clerk)

#### HU21 — Registro e inicio de sesión con Clerk · `Must` · `5 SP`
*Como usuario del restaurante, quiero iniciar sesión con mi cuenta mediante Clerk, para acceder de forma segura sin que el sistema administre mis contraseñas.*

```gherkin
Dado un usuario con cuenta en Clerk (creada por invitación del administrador)
Cuando inicia sesión desde la aplicación React
Entonces Clerk valida sus credenciales y establece la sesión
Y la aplicación lo lleva al panel correspondiente a su rol
Y si no tiene sesión activa, cualquier ruta protegida lo redirige a la pantalla de acceso
Y la pantalla de acceso está en español y mantiene la identidad visual del sistema
```

#### HU22 — Validación del token de Clerk en el backend · `Must` · `8 SP`
*Como sistema, quiero verificar el token de sesión de Clerk en cada solicitud protegida, para rechazar cualquier petición que no provenga de un usuario autenticado.*

```gherkin
Dado una solicitud con encabezado Authorization: Bearer <token de sesión de Clerk> válido
Cuando llega a un endpoint protegido
Entonces la API verifica la firma y la vigencia del token antes de ejecutar la lógica de negocio
Y obtiene del token el identificador del usuario (clerk_user_id) y su rol

Dado una solicitud sin token, con token expirado, con firma inválida o emitido para un origen no autorizado
Cuando llega a un endpoint protegido
Entonces la API responde 401 con un mensaje genérico
Y las pruebas Pytest cubren estos casos sin llamar a Clerk (tokens firmados con una clave de prueba)
```
*Incluye un spike al inicio del sprint: elegir entre el SDK `clerk-backend-api` y verificación manual con PyJWT + JWKS (ver R1).*

#### HU23 — Roles mediante metadata de Clerk · `Must` · `5 SP`
*Como administrador, quiero que cada cuenta tenga un rol (Administrador o Empleado), para que cada persona vea y haga solo lo que le corresponde.*

```gherkin
Dado un usuario autenticado cuyo token incluye el claim de rol (ADMINISTRADOR o EMPLEADO)
Cuando invoca un endpoint
Entonces la API autoriza o rechaza (403) según la matriz de permisos de la fase 1

Dado un usuario autenticado sin rol asignado
Cuando invoca cualquier endpoint de negocio
Entonces recibe 403 con el mensaje "Cuenta pendiente de asignación de rol"

Y el primer administrador se asigna manualmente desde el panel de Clerk, y el procedimiento queda documentado en el README
```

#### HU24 — Gestión de empleados por el administrador · `Must` · `8 SP`
*Como administrador, quiero invitar, asignar rol y desactivar empleados desde la aplicación, para controlar quién accede sin usar scripts ni el panel de Clerk.*

```gherkin
Dado un administrador autenticado
Cuando invita a una persona indicando su correo y su rol
Entonces la persona recibe una invitación y, al aceptarla, ingresa con el rol indicado

Cuando cambia el rol de un usuario o lo desactiva
Entonces el cambio se aplica en su próxima renovación de sesión
Y el usuario desactivado pierde el acceso

Y el sistema impide que el único administrador se quite el rol o se desactive a sí mismo
Y un empleado que intenta acceder a esta sección recibe 403
```
*El backend usa la API de Clerk con `CLERK_SECRET_KEY`; el registro público se restringe para que solo se ingrese por invitación.*

#### HU25 — Migración de usuarios y retiro del login propio · `Must` · `3 SP`
*Como equipo de desarrollo, quiero retirar la autenticación propia de la fase 1, para tener una única fuente de identidad.*

```gherkin
Dado que el acceso con Clerk está operativo y los usuarios vigentes fueron recreados en Clerk
Cuando se despliega esta historia
Entonces el endpoint /auth/login, el hash de contraseñas y los scripts crear_admin y cambiar_rol dejan de existir
Y las ventas históricas conservan su información (usuario_id heredado)
Y la tabla usuarios y las variables SECRET_KEY, ALGORITHM y ACCESS_TOKEN_EXPIRE_MINUTES se retiran mediante migración y configuración
Y la documentación refleja el nuevo flujo de acceso
```

#### HU26 — Sincronización de usuarios por webhooks · `Should` · `5 SP`
*Como administrador, quiero ver el nombre del empleado que registró cada venta, para saber quién atendió.*

```gherkin
Dado un webhook de Clerk con evento user.created, user.updated o user.deleted
Cuando llega al endpoint /webhooks/clerk
Entonces la API verifica la firma sobre el cuerpo sin modificar; si es inválida, rechaza y no procesa
Y actualiza la tabla espejo de usuarios mediante un upsert idempotente por clerk_user_id
Y un usuario eliminado en Clerk se marca como eliminado, sin borrar el historial de sus ventas
```
*Alternativa sin esta historia: guardar el nombre del empleado en cada venta al registrarla (`registrada_por_nombre`). Esta historia solo es necesaria para listados de empleados y reportes por empleado actualizados (HU52).*

---

### Épica H — Plataforma, despliegue y calidad

#### HU27 — Migraciones con Alembic · `Must` · `3 SP`
*Como equipo, quiero versionar los cambios de esquema, para evolucionar la base de datos productiva sin perder datos.*

```gherkin
Dado el esquema actual en NeonDB generado en la fase 1
Cuando se agrega o modifica una tabla o columna
Entonces se genera una migración Alembic revisable y reversible
Y se aplica con "alembic upgrade head" primero en la rama de pruebas y luego en producción
Y existe una migración inicial que refleja el esquema actual sin alterar datos
Y create_all deja de ejecutarse al arrancar la aplicación
```

#### HU28 — Entorno de pruebas aislado y datos semilla · `Must` · `3 SP`
*Como equipo, quiero que las pruebas nunca toquen los datos reales, para ejecutar la suite sin ensuciar la base de uso.*

```gherkin
Dado la rama de Neon dedicada a pruebas (.env.test)
Cuando se ejecuta pytest
Entonces ninguna prueba escribe en la base de datos de uso real
Y los datos de prueba usan identificadores únicos y se limpian al terminar la sesión de pruebas
Y un script de datos semilla carga categorías y productos de demostración cuando se solicita explícitamente
```

#### HU29 — Frontend desplegado en Vercel · `Must` · `5 SP`
*Como usuario, quiero abrir la aplicación desde una URL pública, para usarla sin instalar nada.*

```gherkin
Dado el repositorio en GitHub con el frontend en la carpeta frontend/
Cuando se hace push a main
Entonces Vercel construye y publica la aplicación automáticamente
Y las variables VITE_CLERK_PUBLISHABLE_KEY y VITE_API_URL se configuran en Vercel, no en el repositorio
Y la URL pública carga la aplicación desde la raíz, sin /frontend/ en la ruta
Y al recargar una ruta interna (por ejemplo /ventas) la aplicación carga sin error 404
```

#### HU30 — Backend en Render con configuración de producción · `Must` · `5 SP`
*Como equipo, quiero que el backend corra con una configuración segura de producción, para no exponer datos ni credenciales.*

```gherkin
Dado el servicio web del backend en Render
Cuando se despliega
Entonces CORS acepta únicamente el dominio del frontend en Vercel (y localhost en desarrollo), no "*"
Y las claves (DATABASE_URL, CLERK_SECRET_KEY y demás) viven solo en variables de entorno de Render
Y existe un endpoint /health sin autenticación
Y la versión de Python está fijada y coincide con la usada en desarrollo
Y cuando el servicio está "dormido" por inactividad, la interfaz muestra "Conectando con el servidor…" y reintenta en lugar de mostrar un error
```

#### HU31 — Integración continua con GitHub Actions · `Must` · `5 SP`
*Como equipo, quiero que cada cambio se valide automáticamente, para detectar errores antes de fusionar.*

```gherkin
Dado un pull request o un push a main
Cuando se ejecuta el flujo de GitHub Actions
Entonces corre pytest contra la rama de pruebas de la base de datos (con secretos del repositorio)
Y corre el lint, las pruebas y la compilación del frontend
Y si algún paso falla, el cambio no puede fusionarse a main
Y la rama main queda protegida: solo admite fusiones con el flujo en verde
```

#### HU32 — Rendimiento y endurecimiento de la API · `Should` · `5 SP`
*Como usuario, quiero que las listas carguen rápido aunque haya muchos datos, para no esperar al operar.*

```gherkin
Dado los listados de ventas, productos y egresos
Cuando se consultan
Entonces aceptan paginación (límite y desplazamiento) con un máximo por página
Y el listado de ventas ejecuta un número constante de consultas SQL, independiente de la cantidad de ventas devueltas (sin N+1)
Y las columnas usadas para filtrar (fecha de venta, nombre de producto) tienen índices
Y todos los errores devuelven un formato JSON uniforme con código y mensaje
```

---

### Épica I — Interfaz React

#### HU33 — Estructura base de la SPA y sistema de diseño · `Must` · `8 SP`
*Como usuario, quiero una interfaz coherente y rápida, para operar el restaurante sin fricción.*

```gherkin
Dado el proyecto frontend creado con React, TypeScript y Vite
Cuando se ejecuta la aplicación
Entonces existe un layout con barra lateral, barra superior (usuario y cierre de sesión) y enrutamiento por páginas
Y un cliente HTTP único adjunta el token de sesión de Clerk a cada llamada a la API
Y los contratos de la API están tipados en TypeScript
Y existen tokens de diseño (color, tipografía, espaciado) y componentes reutilizables (botón, campo, tabla, diálogo, aviso)
Y la interfaz es usable desde 390 px de ancho y muestra foco de teclado visible
```

#### HU34 — Navegación y rutas protegidas por rol · `Must` · `3 SP`
*Como usuario, quiero ver solo lo que mi rol permite, para no perderme entre opciones que no puedo usar.*

```gherkin
Dado un usuario autenticado
Cuando ve el menú
Entonces solo aparecen las secciones permitidas para su rol

Cuando escribe en el navegador la ruta de una sección no permitida
Entonces ve la pantalla "Sin acceso" y no se solicitan datos a la API

Y aunque la interfaz fallara, el backend sigue rechazando con 403 (la seguridad no depende del frontend)
```

#### HU35 — Edición completa desde la interfaz · `Must` · `5 SP`
*Como administrador, quiero editar categorías y productos desde la aplicación, para mantener el catálogo al día sin eliminar y volver a crear.*

```gherkin
Dado un administrador autenticado
Cuando edita una categoría o un producto (nombre, precio, stock, categoría) desde la interfaz
Entonces el formulario valida los datos antes de enviarlos (nombre obligatorio, precio mayor que cero)
Y los cambios se reflejan en el listado sin recargar la página
Y las acciones destructivas (eliminar, desactivar) piden confirmación en un diálogo propio de la aplicación
```

#### HU36 — Listados con búsqueda, filtros y paginación · `Should` · `5 SP`
*Como usuario, quiero encontrar registros rápido, para no recorrer listas largas.*

```gherkin
Dado un listado de categorías, productos, ventas o egresos
Cuando el usuario escribe en el buscador, aplica un filtro (categoría, rango de fechas) o cambia de página
Entonces la lista se actualiza sin recargar la página
Y si no hay resultados se muestra un estado vacío que indica qué hacer
```

#### HU37 — Feedback y manejo de errores consistentes · `Should` · `3 SP`
*Como usuario, quiero entender qué pasó cuando algo falla, para saber cómo continuar.*

```gherkin
Dado cualquier acción que llama a la API
Cuando está en curso
Entonces se muestra un indicador de carga

Cuando termina bien
Entonces se muestra una confirmación breve que usa el mismo verbo de la acción

Cuando falla
Entonces se explica qué pasó y cómo resolverlo según el código:
  401 → volver a iniciar sesión · 403 → sin permisos · 422 → errores por campo · 5xx → reintentar
```

---

### Épica J — Catálogo e inventario

#### HU38 — Reabastecimiento y movimientos de inventario · `Should` · `8 SP`
*Como administrador, quiero registrar entradas de stock y ver su historial, para saber por qué cambió el inventario.*

```gherkin
Dado un administrador autenticado
Cuando registra una entrada de stock para un producto (cantidad y motivo)
Entonces el stock aumenta y se crea un movimiento con tipo, cantidad, stock resultante, usuario y fecha
Y las ventas y las anulaciones también generan su movimiento correspondiente
Y el historial por producto es consultable y filtrable por fechas
Y no se permiten cantidades menores o iguales a cero
```

#### HU39 — Alertas de stock bajo · `Should` · `3 SP`
*Como administrador, quiero saber qué productos se están agotando, para reponerlos a tiempo.*

```gherkin
Dado un producto con stock mínimo definido
Cuando su stock es menor o igual al mínimo
Entonces aparece marcado como "stock bajo" en el listado y en el punto de venta
Y existe una lista de productos con stock bajo para el administrador
```

#### HU40 — Imagen y descripción del producto · `Could` · `3 SP`
*Como administrador, quiero agregar una descripción y una imagen a cada producto, para reconocerlo más rápido en el punto de venta.*

```gherkin
Dado un administrador autenticado
Cuando agrega una descripción y una URL de imagen opcionales a un producto
Entonces se guardan y se muestran en el catálogo y en el punto de venta
Y si la imagen no carga, se muestra un marcador visual sin romper el diseño
```

#### HU41 — Reactivar productos desactivados · `Could` · `2 SP`
*Como administrador, quiero reactivar un producto desactivado, para volver a venderlo sin recrearlo.*

```gherkin
Dado un producto desactivado
Cuando el administrador lo reactiva
Entonces vuelve a aparecer en el catálogo y en el punto de venta con su stock actual
```

---

### Épica K — Ventas

#### HU42 — Punto de venta con buscador y pedido · `Must` · `8 SP`
*Como empleado, quiero buscar productos escribiendo y armar el pedido en pantalla, para registrar ventas rápido y sin errores.*

```gherkin
Dado un empleado o administrador autenticado en el punto de venta
Cuando escribe parte del nombre de un producto
Entonces ve resultados filtrados en tiempo real con precio y stock, y puede filtrar por categoría
Y al elegir un resultado se agrega al pedido; elegirlo de nuevo aumenta su cantidad hasta el stock disponible
Y el pedido muestra cantidades editables, subtotal por línea y total actualizado al instante
Y no permite superar el stock ni cantidades menores a 1
Y al confirmar, registra la venta, vacía el pedido y actualiza el stock mostrado
Y puede completarse usando solo el teclado (buscar, seleccionar con Enter, confirmar)
```

#### HU43 — Método de pago de la venta · `Should` · `3 SP`
*Como empleado, quiero registrar cómo pagó el cliente, para que el cierre de caja cuadre.*

```gherkin
Dado el pedido listo para confirmar
Cuando el empleado selecciona efectivo, tarjeta o transferencia
Entonces la venta guarda el método elegido (solo registro: el sistema no procesa pagos)
Y no se puede confirmar una venta sin método de pago
```

#### HU44 — Anulación de ventas con reversión de stock · `Should` · `8 SP`
*Como administrador, quiero anular una venta registrada por error, para corregir el inventario y las cifras sin borrar el historial.*

```gherkin
Dado un administrador autenticado y una venta completada
Cuando la anula indicando un motivo
Entonces la venta pasa a estado ANULADA sin borrarse
Y el stock de cada producto se restituye en la misma transacción
Y la venta anulada deja de contar en ingresos, balance y reportes (diario, mensual y financiero)
Y una venta ya anulada no puede anularse de nuevo
Y se registra quién la anuló y cuándo
```

#### HU45 — Detalle de venta y comprobante PDF · `Should` · `5 SP`
*Como usuario autorizado, quiero ver el detalle de una venta y descargar su comprobante, para resolver consultas de clientes.*

```gherkin
Dado una venta registrada
Cuando la abre un administrador (o el empleado que la registró)
Entonces ve productos, cantidades, precios, total, método de pago, fecha y empleado
Y puede descargar un comprobante en PDF generado con ReportLab (no es factura electrónica oficial)
```

#### HU46 — Historial de ventas propias del empleado · `Should` · `3 SP`
*Como empleado, quiero ver mis ventas del día, para revisar mi caja al cerrar el turno.*

```gherkin
Dado un empleado autenticado
Cuando abre "Mis ventas"
Entonces ve solo las ventas que él registró, por defecto las del día
Y no puede ver ventas de otros empleados ni información financiera
```

#### HU47 — Efectivo recibido y cambio · `Could` · `2 SP`
*Como empleado, quiero que el sistema calcule el cambio, para no equivocarme al devolver dinero.*

```gherkin
Dado una venta pagada en efectivo
Cuando el empleado ingresa el monto recibido
Entonces la pantalla calcula el cambio a devolver
Y no permite confirmar si el monto recibido es menor al total
```

#### HU48 — Mesas y comandas abiertas · `Could` · `13 SP`
*Como empleado, quiero abrir una comanda por mesa y agregarle productos durante el servicio, para cobrar al final.*

```gherkin
Dado un empleado autenticado
Cuando abre una comanda en una mesa y agrega productos en distintos momentos
Entonces la comanda queda abierta y visible en el tablero de mesas
Y al cerrarla se convierte en una venta con el flujo normal (validación de stock y descuento atómico)
Y una mesa no puede tener dos comandas abiertas a la vez
```

---

### Épica L — Finanzas, analítica y reportes

#### HU49 — Dashboard de indicadores · `Must` · `8 SP`
*Como administrador, quiero ver el estado del negocio de un vistazo, para decidir sin abrir reportes.*

```gherkin
Dado un administrador autenticado
Cuando abre el panel principal
Entonces ve ventas del día, número de ventas, ticket promedio, egresos del mes y balance del mes
Y un gráfico de ventas de los últimos 7 y 30 días y el ranking de los 5 productos más vendidos
Y la cantidad de productos con stock bajo (HU39)
Y los datos provienen de endpoints de analítica del backend, no se calculan en el navegador
Y el panel indica el período mostrado y presenta estados de carga y de vacío
```

#### HU50 — Egresos con categorías, edición y filtros · `Should` · `5 SP`
*Como administrador, quiero clasificar y corregir los gastos, para entender en qué se va el dinero.*

```gherkin
Dado un administrador autenticado
Cuando registra un egreso eligiendo una categoría (insumos, nómina, servicios, arriendo, otros)
Entonces el egreso se guarda con su categoría
Y puede editar o anular un egreso, conservando el registro
Y puede filtrar el listado por rango de fechas y por categoría
```

#### HU51 — Reporte semanal y por rango personalizado · `Should` · `3 SP`
*Como administrador, quiero reportes de cualquier rango, para analizar períodos que no son un día ni un mes.*

```gherkin
Dado un administrador autenticado
Cuando elige una semana o un rango de fechas
Entonces obtiene el mismo resumen del reporte diario y mensual (ventas, ingresos, egresos, balance, productos vendidos)
Y puede descargarlo en PDF
Y si el rango es inválido (fin anterior al inicio), recibe un error claro
```

#### HU52 — Reportes por método de pago y por empleado · `Should` · `5 SP`
*Como administrador, quiero ver cuánto se vendió por método de pago y por empleado, para auditar la caja.*

```gherkin
Dado un administrador autenticado y ventas con método de pago
Cuando consulta el reporte de un período
Entonces ve el total vendido por método de pago y por empleado
Y las ventas anuladas no se incluyen
```

#### HU53 — Exportación a CSV · `Could` · `3 SP`
*Como administrador, quiero exportar datos a CSV, para analizarlos en una hoja de cálculo.*

```gherkin
Dado un listado (ventas, egresos o productos) o un reporte
Cuando el administrador pulsa "Exportar CSV"
Entonces se descarga un archivo CSV con los datos del filtro vigente, en UTF-8
```

---

## 7. Resumen de priorización

| MoSCoW | Historias | Cantidad | Total SP |
|--------|-----------|----------|----------|
| **Must** | HU21, HU22, HU23, HU24, HU25, HU27, HU28, HU29, HU30, HU31, HU33, HU34, HU35, HU42, HU49 | 15 | 82 |
| **Should** | HU26, HU32, HU36, HU37, HU38, HU39, HU43, HU44, HU45, HU46, HU50, HU51, HU52 | 13 | 61 |
| **Could** | HU40, HU41, HU47, HU48, HU53 | 5 | 23 |

Total historias: **33** · Total SP estimados: **166** · **Comprometido para la fase: 114 SP** (todas las Must + 7 Should); el resto queda como **reserva**.

---

## 8. Mapeo a sprints

### Sprint 5 — Cimientos: identidad y base de la interfaz
**Meta:** un usuario inicia sesión con Clerk en la nueva SPA React y consume un endpoint protegido de la API validando el token; el esquema se gestiona con migraciones y las pruebas no tocan datos reales.
- HU27 — Migraciones con Alembic (3)
- HU28 — Entorno de pruebas aislado y datos semilla (3)
- HU33 — Estructura base de la SPA y sistema de diseño (8)
- HU21 — Registro e inicio de sesión con Clerk (5)
- HU22 — Validación del token de Clerk en el backend (8) — incluye spike (R1)
- **SP del sprint: 27**

### Sprint 6 — Roles, empleados y despliegue de producción
**Meta:** roles y gestión de empleados operativos, login propio retirado, y el sistema corriendo en Vercel + Render con CI.
- HU23 — Roles mediante metadata de Clerk (5)
- HU24 — Gestión de empleados por el administrador (8)
- HU25 — Migración de usuarios y retiro del login propio (3)
- HU29 — Frontend desplegado en Vercel (5)
- HU30 — Backend en Render con configuración de producción (5)
- HU31 — Integración continua con GitHub Actions (5)
- **SP del sprint: 31** (sprint más cargado; si la velocidad real del Sprint 5 es baja, HU31 se desplaza al Sprint 7)

### Sprint 7 — Operación de ventas
**Meta:** el punto de venta con buscador, método de pago y anulación funcionando de extremo a extremo, con el catálogo editable desde la interfaz.
- HU34 — Navegación y rutas protegidas por rol (3)
- HU35 — Edición completa desde la interfaz (5)
- HU42 — Punto de venta con buscador y pedido (8)
- HU43 — Método de pago de la venta (3)
- HU44 — Anulación de ventas con reversión de stock (8)
- **SP del sprint: 27**

### Sprint 8 — Analítica, pulido y cierre
**Meta:** panel de indicadores, rendimiento, experiencia de errores consistente y cierre de la fase (regresión completa, documentación final e informe).
- HU49 — Dashboard de indicadores (8)
- HU39 — Alertas de stock bajo (3)
- HU32 — Rendimiento y endurecimiento de la API (5)
- HU36 — Listados con búsqueda, filtros y paginación (5)
- HU37 — Feedback y manejo de errores consistentes (3)
- HU45 — Detalle de venta y comprobante PDF (5)
- Cierre: pruebas de regresión, retiro del frontend antiguo, documentación e informe final.
- **SP del sprint: 29**

### Reserva (no comprometida; se incorpora si hay capacidad)
- **Should (29 SP):** HU26 (5), HU38 (8), HU46 (3), HU50 (5), HU51 (3), HU52 (5).
- **Could (23 SP):** HU40 (3), HU41 (2), HU47 (2), HU48 (13), HU53 (3).

> Las fechas de cada sprint se definen con el docente; este backlog no asume un calendario.

---

## 9. Dependencias clave

| Historia | Depende de | Motivo |
|----------|-----------|--------|
| HU21 | HU33 | Necesita la SPA base para integrar Clerk. |
| HU22, HU23, HU24 | HU21 | El backend valida tokens emitidos por la sesión de Clerk. |
| HU24 | HU22, HU23 | Solo un administrador verificado puede gestionar empleados. |
| HU25 | HU24 | Antes de retirar el login propio, la gestión de usuarios debe vivir en Clerk. |
| HU29 | HU33 | Despliega la SPA. |
| HU31 | HU28, HU33 | El flujo necesita la base de pruebas aislada y el proyecto frontend. |
| HU43, HU44, HU39, HU50 | HU27 | Agregan columnas o tablas: requieren migraciones. |
| HU44 | HU43 (opcional) | La anulación y los reportes por método comparten el estado de la venta. |
| HU45 | HU43 | El comprobante muestra el método de pago. |
| HU49 | HU39, HU44 | Muestra stock bajo y excluye ventas anuladas. |
| HU52 | HU43, HU26 | Necesita método de pago y nombres de empleados actualizados. |

---

## 10. Riesgos y supuestos

| ID | Riesgo / supuesto | Mitigación |
|----|-------------------|-----------|
| **R1** | El SDK `clerk-backend-api` podría no ser compatible con la versión de Python local (3.14) o la de Render. | Spike de 1 día al inicio de HU22; alternativa: verificar el JWT con PyJWT + JWKS de Clerk. Fijar la misma versión de Python en local y Render (HU30). |
| **R2** | Los servicios gratuitos de Render se duermen tras ~15 min sin tráfico; la primera petición tarda (arranque en frío). | HU30: la interfaz informa "Conectando con el servidor…" y reintenta; opcionalmente un ping externo periódico (no es una solución garantizada). |
| **R3** | Cambiar el esquema de la base productiva puede perder datos. | Alembic (HU27); respaldo previo (rama de Neon o `pg_dump`); aplicar siempre primero en la rama de pruebas. |
| **R4** | Curva de aprendizaje de React, TypeScript y Clerk. | Priorizar las Must, spikes cortos, reutilizar la API de la fase 1, historias pequeñas. |
| **R5** | Los cambios de rol llegan al token en la siguiente renovación (hasta ~1 min). | Aceptado y documentado; el backend siempre autoriza con el claim del token vigente. |
| **R6** | Sin restringir el registro, cualquiera podría crear cuenta en Clerk. | Registro solo por invitación (HU24) + usuarios sin rol reciben 403 (HU23). |
| **R7** | Límites o condiciones de los planes gratuitos (Clerk, Vercel, Render, Neon) pueden cambiar. | Verificar los límites vigentes en cada proveedor antes de la entrega; Vercel Hobby es para uso personal/no comercial (adecuado para el contexto académico). |
| **R8** | 114 SP comprometidos superan la velocidad de la fase 1 (~21 SP/sprint). | Revisar capacidad al cerrar el Sprint 5; si es menor a 24 SP, mover al reserva las Should del Sprint 8. |
| **R9** | Los webhooks de Clerk exigen URL pública y verificar la firma sobre el cuerpo sin modificar. | HU26 está en reserva; se prueba contra Render ya desplegado. |
| **S1** | Se mantiene la decisión de la fase 1 de no usar una capa `services/` separada. | Revisar si la lógica nueva (anulación, analítica) la justifica; ver `CLAUDE.md` §3. |

---

## 11. Trazabilidad con los objetivos de la fase

| Objetivo | Historias que lo cubren |
|----------|--------------------------|
| **O1** Identidad con Clerk | HU21, HU22, HU23, HU24, HU25, HU26 |
| **O2** Interfaz React | HU33, HU34, HU35, HU36, HU37, HU42, HU49 |
| **O3** Despliegue y calidad | HU27, HU28, HU29, HU30, HU31, HU32 |
| **O4** Alcance funcional | HU38, HU39, HU40, HU41, HU43, HU44, HU45, HU46, HU47, HU48, HU50, HU51, HU52, HU53 |
| **O5** Analítica | HU49, HU51, HU52, HU53 |

---

## 12. Sincronización con `progress_Fase2.MD`

Cada historia de este backlog tiene **exactamente una fila** en [`progress_Fase2.MD`](./progress_Fase2.MD), identificada por su ID (HU21…HU53). Regla de oro: **al mover una historia a "Terminada" según la DoD (§1.4), se actualiza su fila** (implementación, pruebas, resultado, validación y despliegue). Ninguna historia se cierra sin sus pruebas en verde.
