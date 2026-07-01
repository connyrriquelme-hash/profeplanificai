# Uso local completo con Cloudflare Pages

Este modo levanta frontend, login, D1 local, biblioteca, recursos y `/api/images/generate` en un solo servidor local.

## Inicio rápido

1. Abre esta carpeta.
2. Haz doble clic en `INICIAR-LOCAL-CLOUDFLARE.bat`.
3. Entra a `http://localhost:8788`.
4. Registra una cuenta local desde la pantalla de login.

## Comandos manuales

```powershell
npm install
npm run local:setup
npm run local:dev
```

## Validación

```powershell
npm run local:check
```

## Imágenes educativas

El generador de recursos usa backend local de Cloudflare:

- Primero busca imágenes libres en Wikimedia Commons.
- Luego intenta Pollinations como fallback sin clave.
- Si todo falla, genera un SVG local seguro.

No se exponen claves en el navegador. Para usar IA con secretos locales, copia `.dev.vars.example` a `.dev.vars` y configura valores propios.

## Variables locales

El archivo `.dev.vars` no debe subirse a Git. Incluye valores de desarrollo para:

- `JWT_SECRET`
- `ADMIN_TOKEN`
- `IMAGE_PROVIDER_ORDER`
- `ENABLE_IMAGE_AI`
- `IMAGE_CACHE_TTL_DAYS`

## Base de datos local

Wrangler guarda la D1 local dentro de `.wrangler/state`. Si necesitas reiniciar todo, cierra el servidor, borra esa carpeta y ejecuta:

```powershell
npm run local:setup
```

En esta preparación local dejé activas solo las migraciones compatibles con el esquema actual:

- `001_init.sql`
- `002_curriculum.sql`
- `003_images.sql`

Las migraciones antiguas/experimentales que fallaban en local quedaron preservadas en `migrations.disabled-local/`.
