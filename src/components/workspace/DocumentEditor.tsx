/**
 * DocumentEditor — A4 paper editor with Tiptap
 *
 * Renders the product content on a white A4-like paper
 * with a full Tiptap rich text editor for inline editing.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Highlighter,
  Undo2,
  Redo2,
  Plus,
} from 'lucide-react';
import type { PedagogicalProduct } from '../products/types';

interface DocumentEditorProps {
  product: PedagogicalProduct;
  onProductChange?: (updated: PedagogicalProduct) => void;
  className?: string;
}

const PALETTE = {
  turquoise: '#06BFAD',
  turquoiseDark: '#059E8F',
  purple: '#7F58A6',
} as const;

/** Convert product data to HTML for Tiptap */
function productToHtml(product: PedagogicalProduct): string {
  const { metadata, data, type } = product;
  const lines: string[] = [];

  // Title block
  lines.push(`<h1 style="text-align:center;font-size:1.5rem;font-weight:700;color:#1E293B;margin-bottom:4px">${metadata.title || 'Sin titulo'}</h1>`);
  if (metadata.subtitle) {
    lines.push(`<p style="text-align:center;color:#64748B;margin-bottom:16px">${metadata.subtitle}</p>`);
  }

  // Metadata badges
  const badges: string[] = [];
  if (metadata.level) badges.push(`<span style="background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600">${metadata.level}</span>`);
  if (metadata.subject) badges.push(`<span style="background:#ECFDF5;color:#059669;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600">${metadata.subject}</span>`);
  if (metadata.oaCode) badges.push(`<span style="background:#F5F3FF;color:#7C3AED;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:600;font-family:monospace">${metadata.oaCode}</span>`);
  if (badges.length) {
    lines.push(`<p style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${badges.join('')}</p>`);
  }

  // Sections
  const SKIP = new Set(['ai_model', 'generated_at', 'template_id', 'templateName', 'generatedBy']);
  for (const [key, value] of Object.entries(data)) {
    if (SKIP.has(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;

    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`<h2 style="font-size:0.85rem;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #E2E8F0;padding-bottom:4px;margin-top:20px;margin-bottom:8px">${label}</h2>`);
    lines.push(htmlFromValue(value));
  }

  // Footer
  lines.push(`<hr style="margin-top:32px;border:none;border-top:1px solid #E2E8F0"/>`);
  lines.push(`<p style="text-align:center;font-size:0.6rem;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em">Generado por ProfePlanificAI</p>`);

  return lines.join('\n');
}

function htmlFromValue(value: unknown): string {
  if (typeof value === 'string') {
    return `<p style="font-size:0.85rem;color:#334155;line-height:1.7;white-space:pre-wrap">${escapeHtml(value)}</p>`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `<p style="font-size:0.85rem;color:#334155">${String(value)}</p>`;
  }
  if (Array.isArray(value)) {
    const items = value.filter(v => v !== null && v !== undefined && v !== '').map(item => {
      if (typeof item === 'string' || typeof item === 'number') {
        return `<li style="font-size:0.85rem;color:#334155;line-height:1.6">${escapeHtml(String(item))}</li>`;
      }
      if (typeof item === 'object' && item !== null) {
        const entries = Object.entries(item as Record<string, unknown>)
          .filter(([, v]) => v !== null && v !== undefined && v !== '');
        return entries.map(([k, v]) => {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const val = Array.isArray(v) ? v.map(i => escapeHtml(String(i))).join(', ') : escapeHtml(String(v));
          return `<li style="font-size:0.85rem;color:#334155;line-height:1.6"><strong>${label}:</strong> ${val}</li>`;
        }).join('');
      }
      return '';
    }).filter(Boolean).join('');
    if (!items) return '';
    return `<ul style="margin:4px 0;padding-left:20px">${items}</ul>`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && v !== '');
    return entries.map(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `<div style="margin-bottom:8px"><span style="font-size:0.7rem;font-weight:600;color:#64748B;text-transform:uppercase">${label}:</span><div style="margin-top:2px">${htmlFromValue(v)}</div></div>`;
    }).join('');
  }
  return '';
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Toolbar button helper */
function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

export function DocumentEditor({ product, onProductChange, className }: DocumentEditorProps) {
  const initialHtml = useMemo(() => productToHtml(product), [product]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'tiptap-document-editor',
        style: 'min-height:100%;outline:none;padding:0;font-family:inherit',
      },
    },
  });

  // Sync external product changes to editor
  useEffect(() => {
    if (editor) {
      const newHtml = productToHtml(product);
      if (editor.getHTML() !== newHtml) {
        editor.commands.setContent(newHtml, false);
      }
    }
  }, [product, editor]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!editor) return null;

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* ── Floating toolbar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center gap-0.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex-wrap print:hidden">
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Subrayado">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titulo 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titulo 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titulo 3">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista con viñetas">
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinear izquierda">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrar">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Resaltar">
          <Highlighter className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <div className="flex-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      {/* ── A4 Paper ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white shadow-xl mx-auto p-12 max-w-3xl min-h-[1056px] rounded-sm relative"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <EditorContent editor={editor} />

          {/* Floating "+ Añadir bloque" button */}
          <div className="flex justify-center mt-8 print:hidden">
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().insertContent('<p><br></p>').run();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 hover:border-gray-400 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir bloque
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
