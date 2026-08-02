import React from 'react';

type TableLike = {
  title?: string;
  titulo?: string;
  columns?: unknown[];
  columnas?: unknown[];
  headers?: unknown[];
  encabezados?: unknown[];
  rows?: unknown[][];
  filas?: unknown[][];
};

type CalloutLike = {
  type?: string;
  tipo?: string;
  title?: string;
  titulo?: string;
  text?: string;
  texto?: string;
};

type ChartLike = {
  type?: string;
  tipo?: string;
  title?: string;
  titulo?: string;
  data?: Array<{ label?: string; value?: number }>;
  datos?: Array<{ label?: string; value?: number }>;
};

const EXTRA_KEYS = new Set(['tablas', 'tables', 'callouts', 'graficos', 'charts', 'checklist', 'images', 'visuales', 'imagos']);
const TECHNICAL_KEYS = new Set([
  'id', 'resourceId', 'prompt', 'promptText', 'model', 'tokens', 'warnings',
  'raw', 'rawPayload', 'rawResponse', 'debug', 'trace', 'latency',
  'aiGenerated', 'teacherEditable', 'generatedAt', 'kind', 'action',
  'provider',
  'code', 'type', 'courseId', 'subjectId', 'axisId',
  'officialText', 'normalizedText', 'skillTagsJson', 'attitudeTagsJson',
  'sourceUrl', 'sourceName', 'licenseNote', 'updatedAt', 'importedAt', 'createdAt',
  'course_id', 'subject_id', 'axis_id',
  'official_text', 'normalized_text', 'skill_tags_json', 'attitude_tags_json',
  'source_url', 'source_name', 'license_note', 'updated_at', 'imported_at', 'created_at',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function isRenderableValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.some(isRenderableValue);
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

export function isTechnicalKey(key: string): boolean {
  if (EXTRA_KEYS.has(key) || TECHNICAL_KEYS.has(key)) return true;
  const lower = key.toLowerCase();
  if (lower.endsWith('id') || lower.endsWith('json')) return true;
  return false;
}

export function formatProductLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function PremiumCallout({ callout }: { callout: CalloutLike }) {
  const type = callout.type || callout.tipo || 'importante';
  const title = callout.title || callout.titulo || {
    docente: 'Nota para el docente',
    familia: 'Conexión con la familia',
    estudiante: 'Para el estudiante',
    dua: 'Ajuste DUA',
    evaluacion: 'Evaluación formativa',
    importante: 'Importante',
  }[type] || 'Importante';
  const text = callout.text || callout.texto || '';
  const palette = {
    docente: 'border-violet-200 bg-violet-50 text-violet-900',
    familia: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    estudiante: 'border-sky-200 bg-sky-50 text-sky-900',
    dua: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900',
    evaluacion: 'border-amber-200 bg-amber-50 text-amber-900',
    importante: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  }[type] || 'border-indigo-200 bg-indigo-50 text-indigo-900';

  if (!text) return null;

  return (
    <aside className={`rounded-2xl border p-4 break-inside-avoid ${palette}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{title}</p>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
    </aside>
  );
}

export function PremiumTable({ table }: { table: TableLike }) {
  const title = asString(table.title || table.titulo || 'Tabla de trabajo');
  const columns = (table.columns || table.columnas || table.headers || table.encabezados || []).map(asString).filter(Boolean);
  const rows = (table.rows || table.filas || []).map((row) => Array.isArray(row) ? row.map(asString) : []);

  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm break-inside-avoid">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h4 className="text-sm font-black text-slate-900">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--primary-tint)]">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-[var(--primary-ink)]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/60">
                {columns.map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top text-slate-700 leading-relaxed">
                    {row[cellIndex] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PremiumChart({ chart }: { chart: ChartLike }) {
  const title = asString(chart.title || chart.titulo || 'Progreso sugerido');
  const data = (chart.data || chart.datos || []).filter((item) => typeof item?.label === 'string');
  const max = Math.max(1, ...data.map((item) => Number(item.value || 0)));

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid">
      <h4 className="text-sm font-black text-slate-900 mb-4">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => {
          const value = Number(item.value || 0);
          const width = Math.max(8, Math.round((value / max) * 100));
          return (
            <div key={index}>
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600 mb-1">
                <span>{item.label}</span>
                <span>{value}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PremiumChecklist({ items }: { items: unknown[] }) {
  const normalized = items.map(asString).filter(Boolean);
  if (normalized.length === 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 break-inside-avoid">
      <h4 className="text-sm font-black text-emerald-900 mb-3">Checklist de uso docente</h4>
      <ul className="grid gap-2 sm:grid-cols-2">
        {normalized.map((item, index) => (
          <li key={index} className="flex items-start gap-2 rounded-xl bg-white/80 border border-emerald-100 px-3 py-2 text-sm text-emerald-900">
            <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ImageLike = {
  url?: string;
  src?: string;
  image?: string;
  alt?: string;
  title?: string;
  caption?: string;
  attribution?: string;
  source?: string;
  width?: number;
  height?: number;
};

interface ProductImageProps {
  image: ImageLike;
  className?: string;
  compact?: boolean;
  loading?: boolean;
  onRegenerate?: () => void;
}

export function ProductImage({ image, className, compact = false, loading = false, onRegenerate }: ProductImageProps) {
  const src = image.url || image.src || image.image || '';
  if (!src && !loading) return null;

  const alt = asString(image.alt || image.title || 'Imagen educativa');
  const caption = asString(image.caption || image.attribution || '');

  if (loading) {
    return (
      <div className={`product-image-skeleton rounded-xl border border-slate-200 bg-slate-50 overflow-hidden animate-pulse ${compact ? 'float-right ml-4 mb-3 w-[220px]' : 'w-full'} ${className || ''}`}>
        <div className="bg-slate-200 h-32 w-full" />
        <div className="px-3 py-2 space-y-2">
          <div className="bg-slate-200 h-3 rounded w-3/4" />
          <div className="bg-slate-200 h-3 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <figure className={`product-image-frame rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden break-inside-avoid group ${compact ? 'float-right ml-4 mb-3 w-[220px]' : 'w-full'} ${className || ''}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
      {caption && (
        <figcaption className="px-3 py-1.5 text-[10px] text-slate-500 border-t border-slate-100 leading-tight">
          {caption}
        </figcaption>
      )}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-slate-600 hover:text-[var(--primary)] rounded-lg px-2 py-1 text-[10px] font-medium shadow-sm border border-slate-200 print:hidden"
          title="Regenerar imagen"
        >
          ↻ Regenerar
        </button>
      )}
    </figure>
  );
}

export function ProductImageGallery({ images, titles }: { images: ImageLike[]; titles?: string[] }) {
  if (!images.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((image, index) => (
        <ProductImage
          key={index}
          image={{ ...image, title: titles?.[index] || image.title }}
          compact
        />
      ))}
    </div>
  );
}

const MAX_RENDER_DEPTH = 4;

function renderNestedValue(value: unknown, depth: number): React.ReactNode {
  if (depth >= MAX_RENDER_DEPTH && typeof value === 'object' && value !== null) {
    return <p className="mt-2 text-sm leading-relaxed text-slate-500">Contenido estructurado disponible para revisión docente.</p>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
        {value.filter(isRenderableValue).map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-[var(--primary)] mt-0.5">•</span>
            <span className="min-w-0 flex-1">
              {asRecord(item) ? <PremiumKeyValueGrid data={item} depth={depth + 1} /> : asString(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const record = asRecord(value);
  if (record) {
    return (
      <div className="mt-3">
        <PremiumKeyValueGrid data={record} depth={depth + 1} />
      </div>
    );
  }

  return <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{asString(value)}</p>;
}

export function PremiumKeyValueGrid({ data, depth = 0 }: { data: Record<string, unknown>; depth?: number }) {
  const entries = Object.entries(data)
    .filter(([key, value]) => !isTechnicalKey(key) && isRenderableValue(value));

  if (entries.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{formatProductLabel(key)}</p>
          {renderNestedValue(value, depth)}
        </div>
      ))}
    </div>
  );
}

export function ProductPremiumExtras({ data }: { data: Record<string, unknown> }) {
  const tables = [...(Array.isArray(data.tablas) ? data.tablas : []), ...(Array.isArray(data.tables) ? data.tables : [])];
  const callouts = Array.isArray(data.callouts) ? data.callouts : [];
  const charts = [...(Array.isArray(data.graficos) ? data.graficos : []), ...(Array.isArray(data.charts) ? data.charts : [])];
  const checklist = Array.isArray(data.checklist) ? data.checklist : [];
  const images = [...(Array.isArray(data.images) ? data.images : []), ...(Array.isArray(data.visuales) ? data.visuales : [])];
  const imageTitles = Array.isArray(data.imageTitles) ? data.imageTitles.map(asString) : [];

  const hasAny = tables.length > 0 || callouts.length > 0 || charts.length > 0 || checklist.length > 0 || images.length > 0;
  if (!hasAny) return null;

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ProductImageGallery images={images.map(img => asRecord(img) || { url: asString(img) })} titles={imageTitles} />
      )}

      {callouts.map((item, index) => {
        const callout = asRecord(item);
        return callout ? <PremiumCallout key={`callout-${index}`} callout={callout} /> : null;
      })}

      {tables.map((item, index) => {
        const table = asRecord(item);
        return table ? <PremiumTable key={`table-${index}`} table={table} /> : null;
      })}

      {charts.map((item, index) => {
        const chart = asRecord(item);
        return chart ? <PremiumChart key={`chart-${index}`} chart={chart} /> : null;
      })}

      <PremiumChecklist items={checklist} />
    </div>
  );
}
