# PlanificaIA Chile

Plataforma docente chilena para crear planificaciones, guías, evaluaciones, rúbricas, recursos DUA, reportes, colaboración docente y exportación de materiales alineados al Currículum Nacional MINEDUC.

> **Versión portable:** `index-portable-v2.html` — archivo único (330 KB, ~2890 líneas) que funciona sin servidor, sin Node.js y sin conexión a internet. Ábrelo directamente en cualquier navegador moderno.

## Versión portable (`index-portable-v2.html`)

El archivo `index-portable-v2.html` contiene **todo** el proyecto en un solo archivo: CSS (glassmorphism oscuro con 60+ variables de diseño), JavaScript con 8 módulos funcionales, y 53 OA curriculares. No requiere build, npm, ni servidor.

### Cómo usar

1. **Abrir**: Haz doble clic en `index-portable-v2.html` o ábrelo desde el navegador (`Ctrl+O`).
2. **Navegar**: Usa el menú lateral para cambiar entre módulos. Los badges muestran conteos en vivo.
3. **Generar contenido**: Selecciona nivel, asignatura, OA y haz clic en "Generar planificación/recurso/evaluación".
4. **Exportar**: Usa los botones HTML, TXT, Copiar, Imprimir o PDF en cualquier resultado.
5. **Guardar**: Los materiales se guardan automáticamente en localStorage al hacer clic en "Guardar".
6. **Conectar IA**: Ve a "Conectar IA" para usar Gemini, OpenRouter o Hugging Face. Sin API key, funciona en modo local.

### Almacenamiento

| Clave localStorage | Contenido |
|---|---|
| `planificaia_plans` | Planificaciones guardadas |
| `planificaia_recursos` | Recursos DUA guardados |
| `planificaia_evals` | Evaluaciones guardadas |
| `planificaia_config` | Configuración de IA (`{provider, apiKey}`) |
| `planificaia_compact` | Modo compacto activado (`true`/`false`) |
| `planificaia_publicados` | Publicaciones de colaboración |
| `planificaia_drive` | Documentos en Drive docente |
| `planificaia_carpetas` | Carpetas del Drive |
| `planificaia_historial` | Historial de navegación |
| `planificaia_favs` | OA favoritos |
| `planificaia_alumnos` | Lista de estudiantes |

### Módulos

1. **Dashboard** — Resumen con métricas (planificaciones, recursos, evaluaciones, total) y acceso rápido.
2. **Planificador** — Genera planificaciones clase a clase (inicio, desarrollo, cierre, DUA, evaluación formativa).
3. **Recursos DUA** — Guías, presentaciones, infografías, actividades colaborativas, juegos, rúbricas, tickets de salida.
4. **Evaluaciones + SIMCE** — Evaluaciones diagnósticas, formativas, sumativas y simulacros tipo SIMCE con pauta.
5. **Currículum** — Buscador de OA con filtros por nivel y asignatura; 53 OA pre-cargados.
6. **Reportes** — Reportes de curso y por estudiante con generación simulada y exportación.
7. **Colaboración** — Publica, comenta y gestiona recursos compartidos entre docentes.
8. **Drive** — Almacena y organiza documentos en carpeta virtual con rename y eliminación.

### Exportación

Un solo sistema de exportación (`exportarDocumento`) con 5 modos:
- **HTML** — Vista previa en nueva ventana con diseño letter-size
- **TXT** — Texto plano sin formato
- **Copiar** — Copia al portapapeles con `execCommand` / Clipboard API
- **Imprimir** — Diálogo de impresión del navegador con `@page letter`
- **PDF** — `window.print()` con destino "Guardar como PDF"

Todos los resultados usan `generarHTMLImprimible()` que produce HTML autónomo con metadatos (Nivel, Asignatura, OA, Fecha), header "PlanificaIA Chile" y footer institucional.

### Diseño

- **Glassmorphism oscuro** con 60+ variables CSS, `backdrop-filter: blur()`, gradientes.
- **Responsive**: 3 breakpoints (1300, 1000, 600 px); menú colapsable a scroll horizontal.
- **Modo compacto**: Reduce padding y fuente para más información en pantalla.
- **Skeleton loaders**: Shimmer CSS-only durante generación.
- **Focus trap**: Modales con `trapModal()` y ARIA completo (`aria-modal`, `aria-hidden`, `aria-label`).
- **Toast**: Notificaciones con gradiente según tipo (ok/err/warn) y animación slideUp.
- **Accesibilidad**: Roles ARIA, `prefers-reduced-motion`, `focus-visible` outline.

### Solución de problemas

- **No se ve el menú**: El diseño responsive oculta el menú en pantallas < 1000 px; usa los botones de vista en la parte superior.
- **No genera contenido**: Verifica que seleccionaste nivel, asignatura y OA. Sin API key, usa generación local.
- **Error al exportar**: Usa "Copiar" como alternativa; el PDF usa `window.print()` y requiere seleccionar manualmente "Guardar como PDF".
- **Se ve diferente al original**: `index-portable-v2.html.bak` es el backup pre-overhaul.

## Características (versión completa con Node.js)

- **Planificador de clases** - Crea planificaciones clase a clase con inicio, desarrollo, cierre, DUA y evaluación formativa.
- **Generador de recursos** - Guías, presentaciones, infografías, actividades colaborativas, juegos, rúbricas y tickets de salida.
- **Evaluaciones y SIMCE** - Evaluaciones diagnósticas, formativas, sumativas y ensayos tipo SIMCE con pauta y retroalimentación.
- **Banco curricular** - Busca OA por nivel y asignatura, guarda tus OA frecuentes.
- **Recursos DUA** - Múltiples formas de representación, acción y participación.
- **Editor WYSIWYG** - Editor de texto enriquecido TipTap con formato bold, listas, tablas y más.
- **Exportación PDF profesional** - Exportación con html2canvas + jsPDF para documentos de alta calidad.
- **PWA offline** - Progressive Web App con service worker para uso sin conexión.
- **Colaboración docente** - Publica recursos, comenta y da like.
- **Drive docente** - Almacena y organiza tus documentos.
- **IA opcional** - Conecta Gemini, OpenRouter o Hugging Face para respuestas más ricas.
- **Modo local** - Funciona completamente sin API key, sin enviar datos a externos.
- **Server-side AI proxy** - Endpoints proxy en Express para evitar límites CORS del navegador.
- **Autenticación local** - Sistema de login/registro con persistencia en localStorage.

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm (incluido con Node.js)
- Navegador moderno (Chrome, Edge, Firefox)

## Instalación en Windows

```powershell
# 1. Abre PowerShell o terminal en la carpeta del proyecto
cd PlanificaIA-Chile-Portable

# 2. Instala dependencias
npm.cmd install --no-audit --no-fund

# 3. Compila y verifica
npm.cmd run build
```

## Ejecución local

```powershell
# Solo frontend (desarrollo)
npm.cmd run dev
# Abre http://localhost:5173

# Frontend + servidor Express
npm.cmd run dev:all
# Frontend: http://localhost:5173
# API: http://localhost:3001

# Solo servidor
npm.cmd run server
```

## Configuración de .env.local

Copia `.env.example` como `.env.local`:

```powershell
copy .env.example .env.local
```

Edita `.env.local` con tus claves API (opcional). Sin claves, la app funciona en modo local.

### Modo local (sin API key)

La app funciona completamente sin API key. Los materiales se generan localmente con contenido pedagógico estructurado. Ideal para:
- Uso inmediato sin configuración
- Entornos sin conexión
- Privacidad total de datos

### Conectar Gemini API

1. Obtén API key gratuita en https://aistudio.google.com/apikey
2. En la app, ve a "Conectar IA" > selecciona Gemini API
3. Pega tu API key y guarda
4. Opcional: configura `GEMINI_API_KEY` en `.env.local`

### Conectar OpenRouter

1. Regístrate en https://openrouter.ai
2. Genera API key en https://openrouter.ai/keys
3. En la app, ve a "Conectar IA" > selecciona OpenRouter
4. Pega tu API key
5. Opcional: configura `OPENROUTER_API_KEY` en `.env.local`

### Conectar Hugging Face

1. Regístrate en https://huggingface.co
2. Genera token en https://huggingface.co/settings/tokens
3. En la app, ve a "Conectar IA" > selecciona Hugging Face Router
4. Pega tu token
5. Opcional: configura `HUGGINGFACE_API_KEY` en `.env.local`

## Cómo generar materiales

1. **Planificación**: Ve a "Planificador de clases" > completa nivel, asignatura, OA, duración > "Generar planificación".
2. **Recurso**: Ve a "Generador de recursos" > selecciona tipo (guía, rúbrica, ticket...) > "Generar recurso".
3. **Evaluación**: Ve a "Evaluaciones y SIMCE" > selecciona tipo, número de preguntas > "Generar evaluación".
4. **Mini SIMCE**: Desde Evaluaciones > "Generar mini SIMCE".

### Guardar materiales

Cada vista tiene un botón "Guardar material" que persiste en localStorage. Puedes ver y cargar tus materiales guardados desde cada sección.

### Exportar a PDF

Usa el botón "Imprimir / PDF" en cualquier resultado. Se abrirá el diálogo de impresión del navegador:
1. Selecciona "Guardar como PDF" como destino
2. Configura márgenes y escala
3. Haz clic en "Guardar"

La vista imprimible oculta la barra lateral y los botones automáticamente.

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm.cmd run dev` | Inicia servidor de desarrollo Vite |
| `npm.cmd run build` | Compila TypeScript y construye frontend |
| `npm.cmd run lint` | Verifica tipos TypeScript sin emitir código |
| `npm.cmd run preview` | Previsualiza build de producción |
| `npm.cmd run server` | Inicia servidor Express |
| `npm.cmd run dev:all` | Inicia frontend y servidor simultáneamente |

## Despliegue en Cloudflare

### Frontend (Cloudflare Pages)

```powershell
# 1. Build
npm.cmd run build

# 2. Despliega con wrangler
npx wrangler pages deploy dist --project-name=planificaia-chile

# O sube manualmente la carpeta dist/ desde el dashboard de Cloudflare Pages
```

### API (Cloudflare Workers)

El servidor Express puede ejecutarse como Cloudflare Worker adaptando los endpoints a `src/worker.ts`:

```powershell
# Despliega el worker
npx wrangler deploy

# Configura variables secretas
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put HUGGINGFACE_API_KEY
```

### Variables de entorno necesarias

- `GEMINI_API_KEY` - Para usar Gemini API
- `OPENROUTER_API_KEY` - Para usar OpenRouter
- `HUGGINGFACE_API_KEY` - Para usar Hugging Face

## Solución de problemas comunes

### Error: "npm no se reconoce como un comando"

Asegúrate de tener Node.js instalado. Descarga desde https://nodejs.org

### Error: "Permissions denied" en PowerShell

```powershell
# Ejecuta como Administrador
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Error de compilación en Windows

```powershell
npm.cmd cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm.cmd install --no-audit --no-fund
```

### Error: "Cannot find module"

```powershell
npm.cmd install
```

### La app no conecta con IA externa

1. Verifica que la API key sea correcta
2. Algunos proveedores bloquean CORS desde el navegador
3. Usa el botón "Probar IA" en Configuración
4. Si falla, la app vuelve automáticamente a modo local

### El servidor Express no inicia

```powershell
# Verifica que el puerto no esté ocupado
netstat -ano | findstr :3001
# O cambia el puerto en .env.local
PORT=3002
```

## Scripts de prueba

```powershell
# Ejecutar todos los tests
npm.cmd run test

# Tests en modo watch
npm.cmd run test:watch

# Ver cobertura
npx vitest run --coverage
```

## Estructura del proyecto

```
PlanificaIA-Chile-Portable/
├── index.html              # Entry point Vite
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts        # Configuración de tests
├── postcss.config.js
├── wrangler.toml           # Config Cloudflare
├── .env.example
├── server.ts               # Express backend
├── public/
│   ├── favicon.svg
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service Worker offline
├── data/
│   └── oa-curriculares.json # 35+ OA MINEDUC oficiales
├── src/
│   ├── main.tsx            # Entry point React
│   ├── App.tsx             # Componente principal
│   ├── index.css           # Estilos globales oscuros
│   ├── types.ts            # Tipos TypeScript
│   ├── vite-env.d.ts       # Tipos Vite/import.meta.env
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── DashboardView.tsx
│   │   ├── PlanificadorView.tsx
│   │   ├── RecursosView.tsx
│   │   ├── EvaluacionesView.tsx
│   │   ├── CurriculoView.tsx
│   │   ├── ConfigView.tsx
│   │   ├── ColaboracionView.tsx
│   │   ├── DriveView.tsx
│   │   └── RichTextEditor.tsx  # Editor WYSIWYG TipTap
│   ├── services/
│   │   ├── storageService.ts   # Persistencia localStorage
│   │   ├── localGenerator.ts   # Generación local contenidos
│   │   ├── aiService.ts        # AI calls (client + server proxy)
│   │   └── databaseService.ts  # Abstracción D1/localStorage
│   ├── contexts/
│   │   └── AuthContext.tsx     # Login/registro local
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── utils/
│   │   ├── curriculum.ts       # 35+ OA curriculares chilenos
│   │   ├── htmlUtils.ts        # Markdown → HTML
│   │   ├── exportUtils.ts      # Exportación HTML/print
│   │   └── exportPdf.ts        # Exportación PDF (jspdf+html2canvas)
│   └── __tests__/
│       ├── setup.ts
│       ├── htmlUtils.test.ts   # 10 tests
│       ├── localGenerator.test.ts # 10 tests
│       └── curriculum.test.ts  # 10 tests
```

## Mejoras implementadas recientemente

- **PWA offline**: Service worker con caché de assets, manifest.json, theme-color, apple-touch-icon.
- **OA JSON**: 35+ OA curriculares desde 1° básico a 4° medio en Lenguaje y Matemática, cargados desde `data/oa-curriculares.json`.
- **PDF profesional**: Exportación con html2canvas + jsPDF que captura el contenido como imagen y genera PDF A4 multihojas.
- **Editor WYSIWYG**: Editor de texto enriquecido TipTap con botones de formato (bold, italic, underline, headings, listas, alineación, resaltado, undo/redo).
- **Server-side AI proxy**: Endpoints `/api/ai/gemini`, `/api/ai/openrouter`, `/api/ai/huggingface` en Express para evitar límites CORS. El frontend puede usar `VITE_USE_SERVER_AI=true`.
- **Tests automatizados**: 30 tests con Vitest + Testing Library (htmlUtils, localGenerator, curriculum). Cobertura configurable con c8/v8.
- **Autenticación local**: AuthContext con login/registro basado en localStorage, preparado para migrar a Firebase/Supabase.
- **Base de datos D1**: `databaseService.ts` con abstracción para migrar de localStorage a Cloudflare D1. Tablas SQL ya definidas.
- **Editor WYSIWYG integrado**: Componente `RichTextEditor` basado en TipTap con toolbar completo y soporte para contenido HTML.

## Próximas mejoras recomendadas

### Para la versión portable (`index-portable-v2.html`)

- [ ] **Parser HTML** — Reemplazar el renderizado de markdown actual con un parser HTML robusto para mejor soporte de tablas, listas anidadas y estilos en línea.
- [ ] **Editor de texto enriquecido** — Integrar un editor WYSIWYG ligero (TipTap o Quill) para editar resultados antes de exportar.
- [ ] **Tema claro** — Alternativa de tema claro manteniendo el glassmorphism; usar las variables CSS ya definidas.
- [ ] **Gráficos en dashboard** — Agregar gráficos simples (Chart.js CDN o canvas nativo) para visualizar distribución de materiales por asignatura.
- [ ] **Búsqueda y filtros** — Buscador en Drive y lista de materiales guardados con filtros por tipo, asignatura y fecha.
- [ ] **Confirmación antes de eliminar** — Modal de confirmación en todas las acciones destructivas (eliminar plan, recurso, evaluación, publicación, carpeta).
- [ ] **Drag & drop en Drive** — Reordenar documentos y carpetas arrastrando.
- [ ] **Tags en materiales** — Sistema de etiquetas para categorizar y filtrar planificaciones, recursos y evaluaciones.
- [ ] **Importar/exportar JSON** — Backup completo de todos los datos localStorage a un archivo JSON descargable.
- [ ] **Deshacer última acción** — Botón "Deshacer" después de guardar, eliminar o modificar.
- [ ] **Modo oscuro/claro configurable** — Alternar entre temas con persistencia.
- [ ] **Soporte para imágenes** — Subir imágenes (base64 en localStorage) para usar en recursos y evaluaciones.
- [ ] **Tutorial interactivo** — Guía paso a paso al primer uso destacando las funciones principales.
- [ ] **Responsive mejorado** — Menú tipo hamburguesa para móviles en lugar de scroll horizontal.

### Para la versión completa (Node.js + React + Vite)

- [ ] Base de datos persistente (Firebase, Supabase o Cloudflare D1)
- [ ] Autenticación de usuarios (AuthContext ya preparado)
- [ ] Sincronización multidispositivo
- [ ] Carga de OA oficiales desde JSON ministerial
- [ ] Editor visual WYSIWYG para materiales
- [ ] Exportación PDF con librería (html2canvas + jsPDF)
- [ ] Modo oscuro/claro configurable
- [ ] Tests automatizados
- [ ] Soporte para imágenes subidas por el usuario
- [ ] Integración con Google Drive / OneDrive
- [ ] App móvil con PWA

## Licencia

Uso educativo gratuito. Proyecto de código abierto para la comunidad docente chilena.
# Arquitectura curricular D1 e IA (v2.1)

PlanificaIA usa React + Vite en el frontend y Cloudflare Pages Functions como backend. Las claves de IA y administración viven únicamente como secretos de Cloudflare. La fuente curricular es [Currículum Nacional — MINEDUC Chile](https://www.curriculumnacional.cl/curriculum); cada OA conserva código, texto oficial, URL y fecha de importación.

## Instalación y validación

```powershell
npm install
npm run dev
npm test
npm run build
npx wrangler pages functions build
```

## Base D1 y migraciones

El proyecto existente usa `planificaia-db`, enlazado como `DB` en `wrangler.toml`.

```powershell
# Solo para una instalación nueva:
npx wrangler d1 create planificaia_curriculum

npx wrangler d1 migrations apply planificaia-db --local
npx wrangler d1 migrations apply planificaia-db --remote
```

Las migraciones son versionadas e idempotentes:

- `001_init.sql`: usuarios y datos docentes.
- `002_curriculum.sql`: cursos, asignaturas, ejes, OA, habilidades, actitudes, recursos, preguntas, actividades y logs.

## Secretos

```powershell
npx wrangler pages secret put JWT_SECRET --project-name planificaia-chile
npx wrangler pages secret put GEMINI_API_KEY --project-name planificaia-chile
npx wrangler pages secret put ADMIN_TOKEN --project-name planificaia-chile
# Opcional:
npx wrangler pages secret put HMAC_SECRET --project-name planificaia-chile
```

Nunca uses variables `VITE_*` para estas credenciales: todo `VITE_*` se incorpora al frontend.

## Importación curricular controlada

El endpoint servidor aplica allowlist a `https://www.curriculumnacional.cl/curriculum`, caché de seis horas, pausa mínima de 350 ms, límite máximo de 20 páginas por lote y upsert por código OA.

```powershell
$env:ADMIN_TOKEN='secreto-configurado-en-cloudflare'
$env:MAX_PAGES='8'
npm run import:curriculum
```

También puedes importar una ficha concreta:

```http
POST /api/admin/import-url
x-admin-token: ...
Content-Type: application/json

{"url":"https://www.curriculumnacional.cl/curriculum/..."}
```

## API

- `GET /api/health`
- `GET /api/courses`
- `GET /api/subjects?course=1B`
- `GET /api/objectives?course=1B&subject=subject-lenguaje-y-comunicacion&q=comprender`
- `GET /api/objectives/LE01%20OA%2001`
- `POST /api/generate-activity` (sesión requerida)
- `POST /api/admin/import-curriculum` (`ADMIN_TOKEN` o HMAC)
- `POST /api/admin/import-url` (`ADMIN_TOKEN` o HMAC)

Si Gemini o Workers AI no están configurados, `/api/generate-activity` devuelve una estructura pedagógica determinística válida junto con una advertencia visible; la aplicación no se rompe.

## Despliegue

```powershell
npm run build
npx wrangler pages deploy dist --project-name planificaia-chile
```

La interfaz permite filtrar OA oficiales, abrir su ficha con atribución, generar una actividad, editar su JSON, copiarla, exportarla a PDF y guardarla.
