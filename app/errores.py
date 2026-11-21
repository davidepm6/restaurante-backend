from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def _traducir(error: dict) -> str:
    tipo = error.get("type", "")
    ctx = error.get("ctx") or {}
    if tipo == "missing":
        return "es obligatorio"
    if tipo == "greater_than":
        return f"debe ser mayor que {ctx.get('gt')}"
    if tipo == "greater_than_equal":
        return f"no puede ser menor que {ctx.get('ge')}"
    if tipo == "less_than":
        return f"debe ser menor que {ctx.get('lt')}"
    if tipo == "less_than_equal":
        return f"no puede superar {ctx.get('le')}"
    if tipo == "string_too_short":
        return f"debe tener al menos {ctx.get('min_length')} caracteres"
    if tipo == "string_too_long":
        return f"no puede superar {ctx.get('max_length')} caracteres"
    if tipo in ("int_parsing", "int_from_float", "int_type"):
        return "debe ser un número entero"
    if tipo in ("float_parsing", "float_type"):
        return "debe ser un número"
    if tipo == "enum":
        return "no es un valor permitido"
    if tipo.startswith("date"):
        return "debe ser una fecha válida (AAAA-MM-DD)"
    if tipo == "json_invalid":
        return "el cuerpo de la solicitud no es un JSON válido"
    return error.get("msg", "no es válido")


def _campo(error: dict) -> str:
    if error.get("type") == "json_invalid":
        return ""
    return ".".join(str(p) for p in error.get("loc", ()) if p not in ("body", "query", "path"))


def _cabeceras_cors(request: Request, origenes_permitidos: list[str]) -> dict[str, str]:
    origen = request.headers.get("origin", "")
    if origen.rstrip("/") in origenes_permitidos:
        return {"Access-Control-Allow-Origin": origen, "Vary": "Origin"}
    return {}


def registrar_manejadores(app: FastAPI, origenes_permitidos: list[str]) -> None:
    @app.exception_handler(RequestValidationError)
    async def datos_no_validos(request: Request, exc: RequestValidationError):
        errores = [{"campo": _campo(e), "mensaje": _traducir(e)} for e in exc.errors()]
        detalle = "; ".join(f"{e['campo']}: {e['mensaje']}" if e["campo"] else e["mensaje"] for e in errores)
        return JSONResponse(
            status_code=422,
            content={"detail": f"Datos no válidos — {detalle}", "errores": errores},
        )

    @app.exception_handler(Exception)
    async def error_inesperado(request: Request, exc: Exception):
        # Los errores no controlados salen por una capa que está FUERA del middleware de CORS, así que
        # sin estas cabeceras el navegador oculta el mensaje y solo muestra «Failed to fetch».
        return JSONResponse(
            status_code=500,
            content={"detail": "Error interno del servidor. Intenta de nuevo."},
            headers=_cabeceras_cors(request, origenes_permitidos),
        )