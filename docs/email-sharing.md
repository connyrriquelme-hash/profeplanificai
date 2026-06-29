# Compartir por correo electronico

## Como funciona

El boton "Enviar por correo" en Panel Compartido permite enviar el enlace de un documento compartido a un colega via email.

Flujo:

1. Usuario ingresa correo del destinatario y mensaje opcional
2. Frontend hace POST a /api/share/email
3. Backend intenta enviar usando el proveedor configurado
4. Si no hay proveedor, frontend abre mailto: como fallback
5. Se muestra confirmacion o error en la UI

## Seguridad

- No se envia el contenido completo del documento, solo el enlace
- El enlace usa token seguro generado por la app
- La URL debe pertenecer a profeplanificai.cl, planificaia-chile.pages.dev o localhost
- Rate limit: maximo 1 envio por IP cada 60 segundos
- Se valida formato de correo basico
- Se escapa HTML en asunto, mensaje y titulo
- Sin dependencias externas (SDK)

## Proveedores

### Opcion 1: Cloudflare Email Service

Requisitos:

- Binding EMAIL configurado en Cloudflare Pages
- Variable EMAIL_FROM con direccion de remitente

Configuracion en wrangler.toml:

```
[env.production]
name = "planificaia-chile"
[[env.production.bindings]]
type = "email"
name = "EMAIL"
```

Variable de entorno:

```
EMAIL_FROM = "ProfePlanificAI <no-reply@profeplanificai.cl>"
```

### Opcion 2: Resend

Requisitos:

- RESEND_API_KEY como secret
- EMAIL_FROM como variable o secret

Comandos:

```
wrangler pages secret put RESEND_API_KEY --project-name=planificaia-chile
wrangler pages secret put EMAIL_FROM --project-name=planificaia-chile
```

O configurar en Cloudflare Pages dashboard:

- Settings > Environment variables > Production
- RESEND_API_KEY: re_xxxxx
- EMAIL_FROM: ProfePlanificAI <no-reply@profeplanificai.cl>

### Sin proveedor (fallback mailto)

Si no se configura ningun proveedor:

- El endpoint responde 501 con code "provider_not_configured"
- El frontend muestra un mensaje informativo
- Se abre el cliente de correo del usuario via mailto:
- El mailto incluye asunto, cuerpo y enlace pre-llenados

## Archivos del sistema

### Backend

- functions/_lib/email.ts - Adaptador: buildEmailContent, sendEmail (Cloudflare Email + Resend), validateEmail, validateShareUrl, escapeHtml
- functions/api/share/email.ts - Endpoint POST /api/share/email: validacion, rate limit por IP, respuesta normalizada

### Frontend

- src/services/shareEmailService.ts - Servicio: sendSharedDocumentEmail (POST), buildMailtoUrl (fallback), validateEmail
- src/components/SharedPanelView.tsx - UI: formulario de correo con input, textarea, boton, estados

## Prueba del endpoint

```bash
curl -X POST https://planificaia-chile.pages.dev/api/share/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "colega@ejemplo.com",
    "documentTitle": "Planificacion Clase 1",
    "shareUrl": "https://profeplanificai.cl?shared=abc123",
    "message": "Revisa esta planificacion por favor",
    "documentType": "planificacion"
  }'
```

Respuesta esperada con proveedor:

```json
{ "ok": true, "provider": "resend" }
```

Respuesta sin proveedor:

```json
{ "ok": false, "code": "provider_not_configured", "message": "No hay proveedor de correo configurado." }
```

## Notas

- No exponer RESEND_API_KEY en frontend ni en codigo fuente
- No instalar SDK de Resend; usar fetch directo
- El rate limit es en memoria (se pierde al reiniciar)
- No guardar logs sensibles en D1 por ahora
- El usuario debe tener un cliente de correo configurado para el fallback mailto
