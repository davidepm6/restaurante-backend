const API_BASE = "https://restaurante-backend-491b.onrender.com";

/*2. Abre el frontend con Live Server** (clic derecho sobre `frontend/index.html` → "Open with Live Server"), **sin** necesidad de tener `uvicorn` corriendo en paralelo — todas las peticiones van a Render.

**3. Inicia sesión** con cualquiera de tus usuarios (admin o empleado) y usa el sistema normalmente; los datos se guardan en tu NeonDB real, igual que en local.

Así, para usar el programa en el día a día, solo necesitas: abrir `frontend/index.html` con Live Server. Nada más — el backend y la base de datos ya están siempre disponibles en la nube (con la salvedad de que el plan gratuito de Render "duerme" tras inactividad, así que la primera petición del día puede tardar unos segundos en responder).

Si en algún momento quieres volver a probar contra tu backend local (por ejemplo mientras desarrollas un cambio nuevo), simplemente cambia `API_BASE` de vuelta a `http://127.0.0.1:8000` y levanta `uvicorn` como siempre.*/