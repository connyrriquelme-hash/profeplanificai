import { describe, it, expect } from 'vitest';
import { sanitizeApiError } from '../src/services/apiError';

describe('sanitizeApiError', () => {
  it('sanitizes Cloudflare HTML error pages', () => {
    const html = `<!DOCTYPE html><html><head><title>Worker threw exception</title></head><body>Cloudflare Ray ID: abc123</body></html>`;
    const result = sanitizeApiError(html, 500);
    expect(result).not.toContain('<!DOCTYPE');
    expect(result).not.toContain('<html');
    expect(result).not.toContain('Worker threw exception');
    expect(result).not.toContain('Cloudflare Ray ID');
    expect(result).toMatch(/Error del servidor/);
  });

  it('sanitizes Worker threw exception text', () => {
    const text = 'Worker threw exception';
    const result = sanitizeApiError(text, 500);
    expect(result).not.toContain('Worker threw exception');
    expect(result).toMatch(/Error del servidor/);
  });

  it('sanitizes replace_required to friendly message', () => {
    const result = sanitizeApiError('replace_required', 409);
    expect(result).toContain('contenido generado');
    expect(result).toContain('reemplazarlo');
  });

  it('sanitizes replace_required in longer text', () => {
    const result = sanitizeApiError('Error: replace_required detected', 409);
    expect(result).toContain('actividades generadas');
    expect(result).toContain('reemplazarlas');
  });

  it('returns clean JSON error messages', () => {
    const result = sanitizeApiError('Clase no encontrada', 404);
    expect(result).toBe('Clase no encontrada');
  });

  it('truncates long messages', () => {
    const long = 'A'.repeat(500);
    const result = sanitizeApiError(long, 500);
    expect(result.length).toBeLessThanOrEqual(300);
  });

  it('returns default for empty input', () => {
    const result = sanitizeApiError('', 500);
    expect(result).toMatch(/Error del servidor/);
  });

  it('returns specific message for 401 status', () => {
    const html = '<!DOCTYPE html>Unauthorized';
    const result = sanitizeApiError(html, 401);
    expect(result).toContain('Sesion');
  });

  it('returns specific message for 404 status', () => {
    const html = '<!DOCTYPE html>Not found';
    const result = sanitizeApiError(html, 404);
    expect(result).toContain('no encontrado');
  });

  it('handles non-string input gracefully', () => {
    const result = sanitizeApiError(null as any, 500);
    expect(result).toMatch(/Error del servidor/);
  });
});
