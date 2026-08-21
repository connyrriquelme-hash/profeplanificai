/**
 * DocumentPreview — Editable Word-like document renderer
 *
 * Renders any PedagogicalProduct as a fully editable Word-like document.
 * Users can click to edit any text field directly inline.
 * Changes propagate back via onProductChange callback.
 */

import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { PedagogicalProduct } from './types';
import { formatProductLabel } from './ProductPremiumBlocks';

interface DocumentPreviewProps {
  product: PedagogicalProduct;
  onProductChange?: (updated: PedagogicalProduct) => void;
  className?: string;
  style?: React.CSSProperties;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return '';
}

function getSectionIcon(key: string): string {
  const lower = key.toLowerCase();
  if (lower.includes('objetivo') || lower.includes('meta')) return '🎯';
  if (lower.includes('actividad') || lower.includes('tarea')) return '📝';
  if (lower.includes('evaluacion') || lower.includes('rubrica')) return '📊';
  if (lower.includes('indicador') || lower.includes('criterio')) return '📏';
  if (lower.includes('recurso') || lower.includes('material')) return '📚';
  if (lower.includes('tiempo') || lower.includes('duracion')) return '⏱️';
  if (lower.includes('instruccion') || lower.includes('procedimiento')) return '📋';
  if (lower.includes('clase') || lower.includes('sesion')) return '🏫';
  if (lower.includes('nivel') || lower.includes('curso')) return '🎓';
  if (lower.includes('contenido') || lower.includes('tema')) return '📖';
  if (lower.includes('pregunta') || lower.includes('interrogante')) return '❓';
  if (lower.includes('respuesta') || lower.includes('solucion')) return '✅';
  if (lower.includes('nota') || lower.includes('observacion')) return '💡';
  if (lower.includes('seccion') || lower.includes('apartado')) return '📄';
  if (lower.includes('texto') || lower.includes('lectura')) return '📰';
  if (lower.includes('estrategia') || lower.includes('metodo')) return '🧠';
  if (lower.includes('acreditacion') || lower.includes('adaptacion')) return '♿';
  return '•';
}

const SKIP_KEYS = new Set(['ai_model', 'generated_at', 'template_id', 'templateName', 'generatedBy']);

/* ─── Editable primitives ─────────────────────────────────────────────── */

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
  placeholder?: string;
}

function EditableText({ value, onChange, tag: Tag = 'p', className, placeholder }: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group">
      <Tag
        ref={ref as React.Ref<HTMLDivElement>}
        contentEditable
        suppressContentEditableWarning
        className={`${className || ''} outline-none rounded px-1 -mx-1 transition-all ${
          isFocused ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (ref.current) {
            const text = ref.current.innerText || '';
            if (text !== value) onChange(text);
          }
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
      {!value && !isFocused && (
        <span className="absolute inset-0 flex items-center px-1 text-gray-300 pointer-events-none text-inherit">
          {placeholder || 'Escribir aqui...'}
        </span>
      )}
    </div>
  );
}

interface EditableListItemProps {
  value: string;
  onChange: (val: string) => void;
  onRemove: () => void;
  index: number;
}

function EditableListItem({ value, onChange, onRemove, index }: EditableListItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <li className="flex items-start gap-2 group">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`flex-1 text-[13px] text-[var(--ink)] leading-relaxed outline-none rounded px-1 -mx-1 transition-all ${
          isFocused ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'
        }`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (ref.current) {
            const text = ref.current.innerText || '';
            if (text !== value) onChange(text);
          }
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
        title="Eliminar"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </li>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */

export function DocumentPreview({ product, onProductChange, className, style }: DocumentPreviewProps) {
  const { metadata, data, type } = product;

  const updateMetadata = useCallback((field: keyof typeof metadata, value: string | number) => {
    if (!onProductChange) return;
    onProductChange({
      ...product,
      metadata: { ...product.metadata, [field]: value },
    });
  }, [product, onProductChange]);

  const updateDataField = useCallback((key: string, value: unknown) => {
    if (!onProductChange) return;
    onProductChange({
      ...product,
      data: { ...product.data, [key]: value },
    });
  }, [product, onProductChange]);

  const updateArrayItem = useCallback((key: string, index: number, newValue: string) => {
    if (!onProductChange) return;
    const arr = product.data[key];
    if (!Array.isArray(arr)) return;
    const updated = arr.map((item, i) => (i === index ? newValue : item));
    onProductChange({ ...product, data: { ...product.data, [key]: updated } });
  }, [product, onProductChange]);

  const removeArrayItem = useCallback((key: string, index: number) => {
    if (!onProductChange) return;
    const arr = product.data[key];
    if (!Array.isArray(arr)) return;
    const updated = arr.filter((_, i) => i !== index);
    onProductChange({ ...product, data: { ...product.data, [key]: updated } });
  }, [product, onProductChange]);

  const addArrayItem = useCallback((key: string) => {
    if (!onProductChange) return;
    const arr = product.data[key];
    if (!Array.isArray(arr)) return;
    onProductChange({ ...product, data: { ...product.data, [key]: [...arr, ''] } });
  }, [product, onProductChange]);

  const sections = Object.entries(data).filter(([key, value]) => {
    if (SKIP_KEYS.has(key)) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (isRecord(value) && Object.keys(value).length === 0) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`document-preview ${className || ''}`}
      style={style}
    >
      <div className="bg-white rounded-lg shadow-[0_1px_8px_rgba(0,0,0,0.08)] border border-[var(--border)] max-w-4xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-[var(--ink-soft)]">
              {formatProductLabel(type)}
            </span>
            {metadata.level && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600">
                {metadata.level}
              </span>
            )}
            {metadata.subject && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600">
                {metadata.subject}
              </span>
            )}
          </div>

          <EditableText
            value={metadata.title}
            onChange={(v) => updateMetadata('title', v)}
            tag="h1"
            className="text-2xl font-bold text-[var(--ink)] leading-tight tracking-tight"
            placeholder="Titulo del producto..."
          />

          <EditableText
            value={metadata.subtitle || ''}
            onChange={(v) => updateMetadata('subtitle', v)}
            tag="p"
            className="mt-2 text-base text-[var(--ink-soft)] leading-relaxed"
            placeholder="Subtitulo (opcional)..."
          />

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {metadata.oaCode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 font-mono font-semibold text-[var(--ink-soft)]">
                {metadata.oaCode}
              </span>
            )}
            {metadata.oaText && (
              <span className="text-[var(--ink-soft)]">{metadata.oaText}</span>
            )}
            {metadata.topic && !metadata.oaCode && (
              <span>Tema: <strong className="text-[var(--ink-mid)]">{metadata.topic}</strong></span>
            )}
            {metadata.date && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {metadata.date}
              </span>
            )}
            {metadata.estimatedTime && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {metadata.estimatedTime} min
              </span>
            )}
          </div>
        </div>

        {/* ── Content body ───────────────────────────────────────── */}
        <div className="px-8 py-6">
          {sections.length === 0 ? (
            <div className="py-12 text-center text-gray-400 border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-sm">Sin contenido disponible</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map(([key, value], idx) => {
                const icon = getSectionIcon(key);
                const label = formatProductLabel(key);

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="group/section"
                  >
                    {/* Section heading */}
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-sm" aria-hidden="true">{icon}</span>
                      <h2 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wide">
                        {label}
                      </h2>
                    </div>

                    {/* Section content — editable */}
                    <div className="pl-1">
                      <EditableSectionContent
                        sectionKey={key}
                        value={value}
                        onChange={(v) => updateDataField(key, v)}
                        onArrayItemChange={(i, v) => updateArrayItem(key, i, v)}
                        onArrayItemRemove={(i) => removeArrayItem(key, i)}
                        onArrayItemAdd={() => addArrayItem(key)}
                        canEdit={!!onProductChange}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
            Generado por ProfePlanificAI
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Editable section content renderer ────────────────────────────────── */

interface EditableSectionContentProps {
  sectionKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
  onArrayItemChange: (index: number, val: string) => void;
  onArrayItemRemove: (index: number) => void;
  onArrayItemAdd: () => void;
  canEdit: boolean;
}

function EditableSectionContent({
  sectionKey,
  value,
  onChange,
  onArrayItemChange,
  onArrayItemRemove,
  onArrayItemAdd,
  canEdit,
}: EditableSectionContentProps) {
  /* ── String value ── */
  if (typeof value === 'string') {
    if (canEdit) {
      return (
        <EditableText
          value={value}
          onChange={onChange}
          tag="p"
          className="text-[13px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap"
          placeholder="Escribir contenido..."
        />
      );
    }
    return (
      <p className="text-[13px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap">{value}</p>
    );
  }

  /* ── Number / Boolean ── */
  if (typeof value === 'number' || typeof value === 'boolean') {
    return (
      <p className="text-[13px] text-[var(--ink)] leading-relaxed">{String(value)}</p>
    );
  }

  /* ── Array of strings ── */
  if (Array.isArray(value)) {
    const validItems = value.filter(item => {
      if (item === null || item === undefined || item === '') return false;
      if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item as object).length === 0) return false;
      return true;
    });

    if (validItems.length === 0 && !canEdit) return null;

    return (
      <div>
        <ul className="space-y-1.5 ml-1">
          {validItems.map((item, i) => {
            if (typeof item === 'string' || typeof item === 'number') {
              if (canEdit) {
                return (
                  <EditableListItem
                    key={i}
                    value={String(item)}
                    onChange={(v) => onArrayItemChange(i, v)}
                    onRemove={() => onArrayItemRemove(i)}
                    index={i}
                  />
                );
              }
              return (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--ink)] leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  <span>{String(item)}</span>
                </li>
              );
            }
            if (isRecord(item)) {
              const entries = Object.entries(item).filter(([, v]) => v !== null && v !== undefined && v !== '');
              return (
                <li key={i} className="pl-4 border-l-2 border-[var(--border)] py-1">
                  {entries.map(([k, v]) => (
                    <p key={k} className="text-[13px] text-[var(--ink)] leading-relaxed">
                      <span className="font-semibold text-[var(--ink)]">{formatProductLabel(k)}: </span>
                      {Array.isArray(v) ? (
                        <EditableSectionContent
                          sectionKey={`${sectionKey}.${i}.${k}`}
                          value={v}
                          onChange={() => {}}
                          onArrayItemChange={() => {}}
                          onArrayItemRemove={() => {}}
                          onArrayItemAdd={() => {}}
                          canEdit={false}
                        />
                      ) : (
                        formatValue(v)
                      )}
                    </p>
                  ))}
                </li>
              );
            }
            return null;
          })}
        </ul>
        {canEdit && (
          <button
            type="button"
            onClick={onArrayItemAdd}
            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Agregar elemento
          </button>
        )}
      </div>
    );
  }

  /* ── Object (nested sections) ── */
  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, v]) => {
      if (v === null || v === undefined || v === '') return false;
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) return false;
      return true;
    });

    if (entries.length === 0) return null;

    return (
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {formatProductLabel(k)}
            </p>
            <EditableSectionContent
              sectionKey={`${sectionKey}.${k}`}
              value={v}
              onChange={(newV) => {
                const parent = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
                onChange({ ...parent, [k]: newV });
              }}
              onArrayItemChange={() => {}}
              onArrayItemRemove={() => {}}
              onArrayItemAdd={() => {}}
              canEdit={canEdit}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
