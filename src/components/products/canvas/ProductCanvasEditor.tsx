import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Text as KonvaText, Rect, Ellipse, Line, Image as KonvaImageShape, Transformer } from 'react-konva';
import type Konva from 'konva';
import {
  Type, ImagePlus, Square, Circle, Trash2, Download, Save, Plus, Minus,
} from 'lucide-react';
import type { PedagogicalProduct } from '../types';
import { uploadAssetDataUrl } from '../../../services/assetUploadService';
import { useKonvaImage } from './useKonvaImage';
import { autoLayoutFromProduct } from './autoLayout';
import {
  type CanvasLayout, type CanvasElement, type CanvasTextElement,
  newElementId,
} from './types';

interface ProductCanvasEditorProps {
  product: PedagogicalProduct;
  onProductChange?: (updated: PedagogicalProduct) => void;
  className?: string;
}

const COLORS = ['#1E293B', '#B5471F', '#0F766E', '#7C3AED', '#B45309', '#DC2626', '#FFFFFF'];

function CanvasImage({ el, ...shapeProps }: { el: CanvasElement } & Record<string, unknown>) {
  const src = el.type === 'image' ? el.src : undefined;
  const image = useKonvaImage(src);
  return <KonvaImageShape image={image} {...shapeProps} />;
}

export function ProductCanvasEditor({ product, onProductChange, className }: ProductCanvasEditorProps) {
  const initialLayout = useMemo<CanvasLayout>(() => {
    const stored = product.data?.canvasLayout as CanvasLayout | undefined;
    return stored && Array.isArray(stored.elements) ? stored : autoLayoutFromProduct(product);
  }, [product]);

  const [layout, setLayout] = useState<CanvasLayout>(initialLayout);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);

  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? nodeRefs.current.get(selectedId) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, layout.elements.length]);

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setSaved(false);
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.map(el => (el.id === id ? { ...el, ...patch } as CanvasElement : el)),
    }));
  }, []);

  const addElement = useCallback((el: CanvasElement) => {
    setSaved(false);
    setLayout(prev => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setSaved(false);
    setLayout(prev => ({ ...prev, elements: prev.elements.filter(el => el.id !== selectedId) }));
    setSelectedId(null);
  }, [selectedId]);

  const handleAddText = () => {
    addElement({
      id: newElementId('text'), type: 'text', x: 80, y: 80, width: 240, height: 40, rotation: 0,
      zIndex: layout.elements.length, text: 'Nuevo texto', fontSize: 16, fontFamily: 'Outfit, sans-serif',
      fontWeight: 'normal', fontStyle: 'normal', color: '#1E293B', align: 'left',
    });
  };

  const handleAddShape = (shape: 'rect' | 'ellipse') => {
    addElement({
      id: newElementId('shape'), type: 'shape', x: 100, y: 100, width: 160, height: 100, rotation: 0,
      zIndex: layout.elements.length, shape: shape === 'ellipse' ? 'line' : 'rect',
      fill: '#F6E7DE', stroke: '#B5471F', strokeWidth: 2,
    });
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageFile = (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') { setUploadingImage(false); return; }
      try {
        const url = await uploadAssetDataUrl(reader.result, file.name);
        addElement({
          id: newElementId('img'), type: 'image', x: 80, y: 80, width: 240, height: 180, rotation: 0,
          zIndex: layout.elements.length, src: url,
        });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onProductChange?.({ ...product, data: { ...product.data, canvasLayout: layout } });
    setSaved(true);
  };

  const handleDownload = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = uri;
    a.download = `${product.metadata.title || 'material'}.png`;
    a.click();
  };

  const selectedEl = layout.elements.find(el => el.id === selectedId);
  const selectedText = selectedEl?.type === 'text' ? (selectedEl as CanvasTextElement) : null;

  return (
    <div className={`flex flex-col gap-3 ${className || ''}`}>
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-[var(--border)] bg-white sticky top-0 z-10 print:hidden">
        <ToolbarBtn onClick={handleAddText} title="Agregar texto"><Type className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Agregar imagen" disabled={uploadingImage}><ImagePlus className="w-4 h-4" /></ToolbarBtn>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageFile(e.target.files?.[0] || null)} />
        {uploadingImage && <span className="text-[11px] text-[var(--ink-mute)]">Subiendo…</span>}
        {uploadError && <span className="text-[11px] text-red-600">{uploadError}</span>}
        <ToolbarBtn onClick={() => handleAddShape('rect')} title="Agregar rectángulo"><Square className="w-4 h-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => handleAddShape('ellipse')} title="Agregar línea"><Circle className="w-4 h-4" /></ToolbarBtn>

        <div className="w-px h-5 bg-[var(--border)] mx-1" />

        {selectedText && (
          <>
            <ToolbarBtn onClick={() => updateElement(selectedText.id, { fontSize: Math.max(8, selectedText.fontSize - 2) })} title="Reducir tamaño"><Minus className="w-4 h-4" /></ToolbarBtn>
            <span className="text-xs w-6 text-center">{selectedText.fontSize}</span>
            <ToolbarBtn onClick={() => updateElement(selectedText.id, { fontSize: selectedText.fontSize + 2 })} title="Aumentar tamaño"><Plus className="w-4 h-4" /></ToolbarBtn>
            <div className="flex items-center gap-1 ml-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateElement(selectedText.id, { color: c })}
                  title={c}
                  className={`w-5 h-5 rounded-full border ${selectedText.color === c ? 'ring-2 ring-[var(--primary)]' : 'border-[var(--border)]'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </>
        )}

        {selectedEl && (
          <ToolbarBtn onClick={deleteSelected} title="Eliminar elemento" danger><Trash2 className="w-4 h-4" /></ToolbarBtn>
        )}

        <div className="flex-1" />

        <span className="text-[11px] text-[var(--ink-mute)] mr-1">{saved ? 'Guardado' : 'Cambios sin guardar'}</span>
        <ToolbarBtn onClick={handleDownload} title="Descargar como imagen"><Download className="w-4 h-4" /></ToolbarBtn>
        {onProductChange && (
          <ToolbarBtn onClick={handleSave} title="Guardar diseño" primary><Save className="w-4 h-4" /></ToolbarBtn>
        )}
      </div>

      <div className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
        <Stage
          ref={stageRef}
          width={layout.width}
          height={layout.height}
          className="mx-auto bg-white shadow-md"
          onMouseDown={e => { if (e.target === e.target.getStage()) setSelectedId(null); }}
        >
          <Layer>
            <Rect x={0} y={0} width={layout.width} height={layout.height} fill={layout.background} listening={false} />
            {[...layout.elements].sort((a, b) => a.zIndex - b.zIndex).map(el => {
              const common = {
                key: el.id,
                x: el.x,
                y: el.y,
                rotation: el.rotation,
                draggable: true,
                ref: (node: Konva.Node | null) => {
                  if (node) nodeRefs.current.set(el.id, node);
                  else nodeRefs.current.delete(el.id);
                },
                onClick: () => setSelectedId(el.id),
                onTap: () => setSelectedId(el.id),
                onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => updateElement(el.id, { x: e.target.x(), y: e.target.y() }),
                onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  updateElement(el.id, {
                    x: node.x(), y: node.y(), rotation: node.rotation(),
                    width: Math.max(20, node.width() * scaleX),
                    height: Math.max(20, node.height() * scaleY),
                  });
                },
              };

              if (el.type === 'text') {
                return (
                  <KonvaText
                    {...common}
                    width={el.width}
                    height={el.height}
                    text={el.text}
                    fontSize={el.fontSize}
                    fontFamily={el.fontFamily}
                    fontStyle={`${el.fontWeight === 'bold' ? 'bold ' : ''}${el.fontStyle === 'italic' ? 'italic' : ''}`.trim() || 'normal'}
                    fill={el.color}
                    align={el.align}
                    onDblClick={() => setEditingId(el.id)}
                    onDblTap={() => setEditingId(el.id)}
                  />
                );
              }
              if (el.type === 'image') {
                return <CanvasImage {...common} el={el} width={el.width} height={el.height} />;
              }
              if (el.shape === 'line') {
                return <Ellipse {...common} radiusX={el.width / 2} radiusY={el.height / 2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} />;
              }
              return <Rect {...common} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} cornerRadius={6} />;
            })}
            <Transformer ref={trRef} rotateEnabled flipEnabled={false} boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)} />
          </Layer>
        </Stage>
      </div>

      {editingId && (
        <TextEditOverlay
          element={layout.elements.find(el => el.id === editingId) as CanvasTextElement}
          onCommit={(text) => { updateElement(editingId, { text }); setEditingId(null); }}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function TextEditOverlay({ element, onCommit, onCancel }: {
  element: CanvasTextElement;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(element.text);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 print:hidden" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <label className="block text-xs font-semibold text-[var(--ink-mid)] mb-2">Editar texto</label>
        <textarea
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-[var(--border)] p-2 text-sm"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink-mid)] hover:bg-[var(--surface-soft)]">Cancelar</button>
          <button type="button" onClick={() => onCommit(value)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">Aplicar</button>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ onClick, title, children, danger, primary, disabled }: {
  onClick: () => void; title: string; children: React.ReactNode; danger?: boolean; primary?: boolean; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        primary ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
        : danger ? 'text-red-600 hover:bg-red-50'
        : 'text-[var(--ink-mid)] hover:bg-[var(--surface-soft)]'
      }`}
    >
      {children}
    </button>
  );
}
