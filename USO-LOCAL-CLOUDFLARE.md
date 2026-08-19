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
npm run seed:objectives:local
npm run local:dev
```

### `seed:objectives:local` — currículum completo (courses/subjects/objectives)

`local:setup` solo aplica migraciones: no trae el contenido curricular en
inglés (`courses`/`subjects`/`axes`/`objectives`/`skills`/`attitudes`),
porque en producción esas tablas se llenan con un crawler en vivo contra
curriculumnacional.cl, no con una migración. Sin este paso, el selector de
Objetivos de Aprendizaje en Flujo Docente solo muestra un puñado de OA
(un fallback legacy mucho más chico), no los ~2600 reales.

`npm run seed:objectives:local` exporta esas tablas en vivo desde la D1 de
producción (`wrangler d1 export --remote`, solo lectura) y las carga en tu
D1 local. Requiere `wrangler` autenticado con acceso a esa base
(`npx wrangler whoami`). No es un seed de una sola vez: el currículum de
producción puede cambiar, así que conviene re-correrlo si notás que faltan
objetivos o si reseteaste tu D1 local. Ver el comentario al inicio de
`scripts/seed-objectives-en.mjs` para más detalle.

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
- `GEMINI_API_KEY` (opcional): proveedor alternativo cuando Workers AI (`env.AI`) no está configurado o agotó su cupo diario de neurons — ver `callAIConValidacion()` en `functions/core/AIEngine.ts`. Sin esta variable, el comportamiento es el mismo de siempre (solo Workers AI). Consíguela en [Google AI Studio](https://aistudio.google.com/apikey) y nunca la hardcodees — solo va en `.dev.vars` local (gitignored) o como variable de entorno en Cloudflare Pages → Settings → Environment variables para producción.

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
