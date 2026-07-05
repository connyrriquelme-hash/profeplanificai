const HTML_PATTERNS = [
  '<!DOCTYPE',
  '<!doctype',
  '<html',
  'Worker threw exception',
  'Cloudflare Ray ID',
  'cf-error',
  '/cdn-cgi/',
  '<head>',
  '<body>',
];

export function sanitizeApiError(raw: unknown, status = 500): string {
  const value = typeof raw === 'string' ? raw : String(raw || '');

  const looksLikeHtml =
    HTML_PATTERNS.some((p) => value.toLowerCase().includes(p.toLowerCase())) ||
    value.length > 500;

  if (looksLikeHtml) {
    if (status === 404) return 'Recurso no encontrado.';
    if (status === 401) return 'Sesion invalida. Inicia sesion nuevamente.';
    if (status === 403) return 'No tienes permiso para esta accion.';
    if (status === 429) return 'Demasiadas solicitudes. Intenta en unos segundos.';
    return `Error del servidor (${status}). Intenta nuevamente.`;
  }

  if (value === 'replace_required') {
    return 'La clase ya tiene contenido generado. Confirma si deseas reemplazarlo.';
  }

  if (value.includes('replace_required')) {
    return 'La clase ya tiene actividades generadas. Confirma si deseas reemplazarlas.';
  }

  return value.slice(0, 300) || `Error del servidor (${status}). Intenta nuevamente.`;
}
