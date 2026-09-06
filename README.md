[README.md](https://github.com/user-attachments/files/31890572/README.md)
# Sistema de Gestión de Ventas e Inventario para Restaurante

Proyecto Integrador (Parquesoft) — API REST para administrar categorías, productos, ventas, inventario e información financiera (ingresos, egresos y balance) de un restaurante, con autenticación por roles y generación de reportes en PDF.

> Documentación relacionada: [`Backlog.MD`](./Backlog.MD) (historias de usuario) · [`progress.MD`](./progress.MD) (seguimiento de implementación) · [`CLAUDE.md`](./CLAUDE.md) (contexto y lineamientos técnicos del proyecto).

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Python + FastAPI |
| Base de datos | PostgreSQL (alojada en [NeonDB](https://neon.tech)) |
| ORM | SQLAlchemy |
| Validación | Pydantic |
| Autenticación | JWT (esquema `HTTPBearer`) |
| Reportes PDF | ReportLab |
| Frontend | HTML, CSS y JavaScript (vanilla) |
| Pruebas | Pytest |
| Despliegue backend | Render |

---

## Funcionalidades

- Autenticación con JWT y dos roles: **Administrador** y **Empleado/Cajero**.
- CRUD de categorías y productos (con control de stock).
- Registro de ventas con cálculo automático de subtotales/total y actualización de inventario en una transacción atómica.
- Registro de egresos y consulta de ingresos (derivados de las ventas), egresos y balance por período.
- Reportes diarios y mensuales, con descarga en PDF.
- Frontend básico que consume la API (login + gestión de categorías/productos/ventas/financiero/reportes, con visibilidad ajustada según el rol).

---

## Estructura del proyecto

```
restaurante-backend/
├── app/
│   ├── main.py                 # Punto de entrada FastAPI
│   ├── database.py             # Conexión SQLAlchemy (NeonDB)
│   ├── models/                 # Modelos SQLAlchemy
│   ├── schemas/                # Esquemas Pydantic
│   ├── routers/                # Endpoints (auth, categorías, productos, ventas, egresos, financiero, reportes)
│   └── security/                # Hashing, JWT y dependencias de autorización por rol
├── scripts/
│   ├── crear_admin.py          # Crea un usuario (Administrador o Empleado)
│   └── cambiar_rol.py          # Cambia el rol de un usuario existente
├── tests/                      # Pruebas Pytest (una suite por módulo)
├── frontend/                   # Interfaz web (HTML/CSS/JS) que consume la API
│   ├── index.html              # Login
│   ├── dashboard.html          # Panel principal
│   ├── css/
│   └── js/
├── requirements.txt
└── .env                        # Variables de entorno (no versionado)
```

---

## Requisitos previos

- Python 3.11 o superior
- Git
- Una cuenta de [NeonDB](https://neon.tech) (o cualquier PostgreSQL accesible por connection string)
- Visual Studio Code (recomendado) con la extensión **Live Server** para ejecutar el frontend

---

## Instalación (entorno local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/restaurante-backend.git
cd restaurante-backend
```

### 2. Crear y activar entorno virtual

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```
DATABASE_URL=postgresql://usuario:password@ep-xxxx-xxxx.region.aws.neon.tech/neondb?sslmode=require
SECRET_KEY=una-clave-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Genera una clave segura para `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

`DATABASE_URL` debe apuntar a tu propia base de datos en NeonDB (o cualquier PostgreSQL con `sslmode=require` si aplica).

### 5. Levantar el servidor

```bash
uvicorn app.main:app --reload
```

Las tablas se crean automáticamente al arrancar. Verifica que todo funcione entrando a:
- API activa: http://127.0.0.1:8000/
- Documentación interactiva (Swagger): http://127.0.0.1:8000/docs

### 6. Crear el primer usuario

No existe un endpoint público de registro (por diseño, según el backlog). Los usuarios se crean por script:

```bash
python -m scripts.crear_admin
```

Sigue las instrucciones en pantalla e indica el rol (`ADMINISTRADOR` o `EMPLEADO`). Para cambiar el rol de un usuario existente:

```bash
python -m scripts.cambiar_rol
```

---

## Cómo autenticarse

1. `POST /auth/login` con `{"email": "...", "password": "..."}` → devuelve un `access_token` y el `rol`.
2. En Swagger (`/docs`), usa el botón **Authorize** y pega **solo el token** (sin la palabra "Bearer", Swagger la agrega automáticamente).
3. Para llamadas manuales (curl, Postman, frontend), envía el header:
   ```
   Authorization: Bearer <access_token>
   ```

**Permisos por rol:**
- **Administrador**: acceso completo (categorías, productos, ventas —incluida consulta—, egresos, financiero, reportes).
- **Empleado/Cajero**: puede consultar productos y registrar ventas; el resto de endpoints responde `403 Forbidden`.

---

## Ejecutar el frontend

El frontend es estático (HTML/CSS/JS) y vive en la carpeta `frontend/`, independiente del backend.

1. Ajusta la URL de la API en `frontend/js/config.js`:
   ```javascript
   const API_BASE = "http://127.0.0.1:8000";   // backend local
   // const API_BASE = "https://tu-url.onrender.com";  // backend desplegado
   ```
2. Abre `frontend/index.html` con la extensión **Live Server** de VS Code (clic derecho → "Open with Live Server"). Esto evita problemas de CORS que ocurren al abrir el archivo directamente con `file://`.
3. Inicia sesión con un usuario creado por script y navega el panel — las pestañas visibles se ajustan automáticamente según el rol.

---

## Pruebas

El proyecto incluye una suite de Pytest que cubre autenticación, control de acceso por rol, categorías, productos, ventas (incluida la transacción de stock), financiero y reportes.

```bash
pytest -v
```

> Las pruebas se ejecutan contra la base de datos configurada en `DATABASE_URL`, generando y limpiando datos de prueba con nombres únicos para evitar colisiones entre corridas.

---

## Despliegue

El backend está preparado para desplegarse en [Render](https://render.com) (o cualquier plataforma compatible con Python/ASGI):

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Variables de entorno:** las mismas del archivo `.env` (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`), configuradas directamente en el panel de la plataforma — nunca subidas al repositorio.

El frontend puede ejecutarse en local apuntando a la URL desplegada, o publicarse como sitio estático en cualquier proveedor (Netlify, GitHub Pages, Vercel, el propio Render, etc.), ajustando `API_BASE` en `frontend/js/config.js`.

---

## Roadmap del proyecto (por sprints)

| Sprint | Alcance | Estado |
|--------|---------|--------|
| Sprint 1 | Configuración base, CRUD de categorías y productos | ✅ Terminado |
| Sprint 2 | Registro de ventas, cálculo de totales, actualización de stock | ✅ Terminado |
| Sprint 3 | Egresos, ingresos derivados de ventas y balance por período | ✅ Terminado |
| Sprint 4 | Autenticación JWT, control de acceso por rol, reportes diarios/mensuales y PDF | ✅ Terminado |

Detalle completo de historias y criterios de aceptación en [`Backlog.MD`](./Backlog.MD).

---

## Autor

David Peña — Proyecto Integrador, Parquesoft.
