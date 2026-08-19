/**
 * DocumentPreview — Word-like structured renderer
 *
 * Renders any PedagogicalProduct in a clean, document-style layout
 * with proper headings, sections, and editable appearance.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { PedagogicalProduct } from './types';
import { formatProductLabel } from './ProductPremiumBlocks';

interface DocumentPreviewProps {
  product: PedagogicalProduct;
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

function renderArrayItems(items: unknown[]): React.ReactNode {
  const validItems = items.filter(item => {
    if (item === null || item === undefined || item === '') return false;
    if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item as object).length === 0) return false;
    return true;
  });

  if (validItems.length === 0) return null;

  return (
    <ul className="space-y-1.5 ml-1">
      {validItems.map((item, i) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return (
            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700 leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              <span>{String(item)}</span>
            </li>
          );
        }
        if (isRecord(item)) {
          const entries = Object.entries(item).filter(([, v]) => v !== null && v !== undefined && v !== '');
          return (
            <li key={i} className="pl-4 border-l-2 border-gray-200 py-1">
              {entries.map(([k, v]) => (
                <p key={k} className="text-[13px] text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">{formatProductLabel(k)}: </span>
                  {Array.isArray(v) ? renderArrayItems(v) : formatValue(v)}
                </p>
              ))}
            </li>
          );
        }
        return null;
      })}
    </ul>
  );
}

function renderSectionContent(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    return (
      <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return (
      <p className="text-[13px] text-gray-700 leading-relaxed">
        {String(value)}
      </p>
    );
  }

  if (Array.isArray(value)) {
    return renderArrayItems(value);
  }

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
            {renderSectionContent(k, v)}
          </div>
        ))}
      </div>
    );
  }

  return null;
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

export function DocumentPreview({ product, className, style }: DocumentPreviewProps) {
  const { metadata, data, type } = product;

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
      {/* Document container — mimics a Word page */}
      <div className="bg-white rounded-lg shadow-[0_1px_8px_rgba(0,0,0,0.08)] border border-gray-200 max-w-4xl mx-auto">
        {/* Header area */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
          {/* Product type badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500">
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

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
            {metadata.title}
          </h1>
          {metadata.subtitle && (
            <p className="mt-2 text-base text-gray-500 leading-relaxed">
              {metadata.subtitle}
            </p>
          )}

          {/* Metadata line */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {metadata.oaCode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 font-mono font-semibold text-gray-500">
                {metadata.oaCode}
              </span>
            )}
            {metadata.oaText && (
              <span className="text-gray-500">{metadata.oaText}</span>
            )}
            {metadata.topic && !metadata.oaCode && (
              <span>Tema: <strong className="text-gray-600">{metadata.topic}</strong></span>
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

        {/* Content body */}
        <div className="px-8 py-6">
          {sections.length === 0 ? (
            <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">Sin contenido disponible</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map(([key, value], idx) => {
                const icon = getSectionIcon(key);
                const label = formatProductLabel(key);
                const content = renderSectionContent(key, value);

                if (!content) return null;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="group"
                  >
                    {/* Section heading */}
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                      <span className="text-sm" aria-hidden="true">{icon}</span>
                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        {label}
                      </h2>
                    </div>

                    {/* Section content */}
                    <div className="pl-1">
                      {content}
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
