import { useState, useMemo } from 'react';
import type { AdaptacionConfig, AdaptacionResult, CurriculumItem, NivelApoyo, FocoApoyo, FormatoApoyo } from '../types';
import { generarAdaptacionLocal, generarAdaptacionConIA } from '../services/adaptacionService';
import { useConfigOptions } from '../hooks/useConfigOptions';
import { StatusBar } from './shared/StatusBar';
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, Printer, Download } from 'lucide-react';

interface AdaptarPanelProps {
  item: CurriculumItem | null;
  contenidoOriginal: string;
  onStatus?: (msg: string, type?: string) => void;
}

const NIVELES_APOYO: { v: NivelApoyo; l: string }[] = [
  { v: 'bajo', l: 'Bajo (apoyo mínimo)' },
  { v: 'medio', l: 'Medio (apoyo moderado)' },
  { v: 'alto', l: 'Alto (apoyo intensivo)' },
];

const FOCOS_APOYO: { v: FocoApoyo; l: string }[] = [
  { v: 'lectura', l: 'Lectura' },
  { v: 'escritura', l: 'Escritura' },
  { v: 'comprensión', l: 'Comprensión' },
  { v: 'cálculo', l: 'Cálculo' },
  { v: 'atención', l: 'Atención' },
  { v: 'lenguaje oral', l: 'Lenguaje oral' },
  { v: 'motricidad', l: 'Motricidad' },
  { v: 'convivencia', l: 'Convivencia' },
];

const FORMATOS: { v: FormatoApoyo; l: string }[] = [
  { v: 'visual', l: 'Visual (imágenes, esquemas)' },
  { v: 'oral', l: 'Oral (audio, habla)' },
  { v: 'manipulativo', l: 'Manipulativo (concreto, movimiento)' },
  { v: 'digital', l: 'Digital (TIC, apps)' },
  { v: 'colaborativo', l: 'Colaborativo (equipos, pares)' },
];

const SECCIONES: { key: keyof AdaptacionResult; label: string; icon: string }[] = [
  { key: 'estandar', label: 'Versión estándar', icon: '📘' },
  { key: 'simplificada', label: 'Versión simplificada', icon: '📖' },
  { key: 'apoyoVisual', label: 'Versión con apoyo visual', icon: '👁️' },
  { key: 'colaborativo', label: 'Versión colaborativa', icon: '👥' },
  { key: 'profundizacion', label: 'Versión de profundización', icon: '🚀' },
  { key: 'sugerenciasDocente', label: 'Sugerencias para el docente', icon: '💡' },
  { key: 'criteriosLogro', label: 'Criterios de logro ajustados', icon: '🎯' },
];

export function AdaptarPanel({ item, contenidoOriginal, onStatus }: AdaptarPanelProps) {
  const { getOptions } = useConfigOptions();
  const cfgSupportLevels = getOptions('support_levels');
  const cfgSupportFocus = getOptions('support_focus');
  const cfgSupportFormats = getOptions('support_formats');
  const [nivelApoyo, setNivelApoyo] = useState<NivelApoyo>('medio');
  const [focoApoyo, setFocoApoyo] = useState<FocoApoyo>('comprensión');
  const [formato, setFormato] = useState<FormatoApoyo>('visual');
  const [tiempoAdicional, setTiempoAdicional] = useState(true);
  const [simplificacion, setSimplificacion] = useState(true);
  const [evalAlternativa, setEvalAlternativa] = useState(false);

  const [resultado, setResultado] = useState<AdaptacionResult | null>(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [seccionActiva, setSeccionActiva] = useState<keyof AdaptacionResult | 'all'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const config: AdaptacionConfig = useMemo(() => ({
    nivelApoyo, focoApoyo, formato, tiempoAdicional, simplificacion, evalAlternativa,
  }), [nivelApoyo, focoApoyo, formato, tiempoAdicional, simplificacion, evalAlternativa]);

  const showStatus = (msg: string, type = '') => {
    setStatus(msg);
    setStatusType(type);
    onStatus?.(msg, type);
  };

  const handleAdaptar = async () => {
    if (!item) {
      showStatus('Primero selecciona un OA desde el Banco Curricular.', 'bad');
      return;
    }
    showStatus('Generando adaptaciones...');
    setResultado(null);

    try {
      const ia = await generarAdaptacionConIA(item, config, contenidoOriginal);
      if (ia.ok && ia.resultado) {
        setResultado(ia.resultado);
        showStatus('Adaptaciones generadas con IA.', 'ok');
      } else {
        const local = generarAdaptacionLocal(item, config, contenidoOriginal);
        setResultado(local);
        showStatus('Adaptaciones generadas en modo local.', 'ok');
      }
    } catch {
      const local = generarAdaptacionLocal(item, config, contenidoOriginal);
      setResultado(local);
      showStatus('Adaptaciones generadas en modo local (fallback).', 'warn');
    }
  };

  const handleCopiar = async (key: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* fallback */ }
  };

  const handleImprimir = (texto: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto;">${texto}</pre>`);
    win.document.close();
    win.print();
  };

  const handleExportar = (texto: string, nombre: string) => {
    const blob = new Blob([texto], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSeccion = (key: keyof AdaptacionResult, label: string, icon: string) => {
    if (!resultado) return null;
    const texto = resultado[key];
    const abierta = seccionActiva === 'all' || seccionActiva === key;
    return (
      <div key={key} style={{
        marginBottom: 10, border: '1px solid var(--line)', borderRadius: 10,
        overflow: 'hidden', background: 'var(--card)',
      }}>
        <div
          onClick={() => setSeccionActiva(abierta ? key : 'all')}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', cursor: 'pointer',
            background: abierta ? 'var(--card2)' : 'transparent',
            borderBottom: abierta ? '1px solid var(--line)' : 'none',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {label}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="small ghost" onClick={(e) => { e.stopPropagation(); handleCopiar(key, texto); }} title="Copiar sección">
              {copiedKey === key ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
            </button>
            <button className="small ghost" onClick={(e) => { e.stopPropagation(); handleImprimir(texto); }} title="Imprimir sección">
              <Printer size={12} />
            </button>
            <button className="small ghost" onClick={(e) => { e.stopPropagation(); handleExportar(texto, label.toLowerCase().replace(/\s+/g, '-')); }} title="Exportar sección">
              <Download size={12} />
            </button>
            {abierta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
        {abierta && (
          <div style={{
            padding: 14, maxHeight: 400, overflowY: 'auto',
            fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            fontFamily: 'system-ui, sans-serif', color: 'var(--ink)',
          }}>
            {texto}
          </div>
        )}
      </div>
    );
  };

  if (!item) {
    return (
      <div className="card" id="adaptar-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Sparkles size={16} /> Adaptar actividad (DUA)
        </h3>
        <p className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
          Selecciona un OA desde el Banco Curricular para activar las adaptaciones DUA.
        </p>
      </div>
    );
  }

  return (
    <div className="card" id="adaptar-panel">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Sparkles size={16} /> Adaptar actividad — DUA y diferenciación
      </h3>

      <div style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, fontSize: 12 }}>
        <code>{item.id}</code>
        <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{item.curso} · {item.asignatura} · {item.eje}</span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12 }}>Nivel de apoyo</label>
          <select value={nivelApoyo} onChange={(e) => setNivelApoyo(e.target.value as NivelApoyo)} style={{ fontSize: 12 }}>
            {(cfgSupportLevels.length > 0 ? cfgSupportLevels : NIVELES_APOYO.map(n => ({ id: n.v, value: n.v, label: n.l }))).map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12 }}>Foco de apoyo</label>
          <select value={focoApoyo} onChange={(e) => setFocoApoyo(e.target.value as FocoApoyo)} style={{ fontSize: 12 }}>
            {(cfgSupportFocus.length > 0 ? cfgSupportFocus : FOCOS_APOYO.map(f => ({ id: f.v, value: f.v, label: f.l }))).map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12 }}>Formato</label>
          <select value={formato} onChange={(e) => setFormato(e.target.value as FormatoApoyo)} style={{ fontSize: 12 }}>
            {(cfgSupportFormats.length > 0 ? cfgSupportFormats : FORMATOS.map(f => ({ id: f.v, value: f.v, label: f.l }))).map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={tiempoAdicional} onChange={(e) => setTiempoAdicional(e.target.checked)} />
          Tiempo adicional
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={simplificacion} onChange={(e) => setSimplificacion(e.target.checked)} />
          Simplificar instrucciones
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={evalAlternativa} onChange={(e) => setEvalAlternativa(e.target.checked)} />
          Evaluación alternativa
        </label>
      </div>

      <div className="btnrow">
        <button className="primary" onClick={handleAdaptar}>
          <Sparkles size={14} /> Adaptar con IA
        </button>
      </div>

      <StatusBar message={status} type={statusType} />

      {resultado && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            <button
              className={`small ${seccionActiva === 'all' ? 'primary' : 'ghost'}`}
              onClick={() => setSeccionActiva('all')}
              style={{ fontSize: 11 }}
            >
              Todas
            </button>
            {SECCIONES.map((s) => (
              <button
                key={s.key}
                className={`small ${seccionActiva === s.key ? 'primary' : 'ghost'}`}
                onClick={() => setSeccionActiva(s.key)}
                style={{ fontSize: 11 }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          {SECCIONES.map((s) => renderSeccion(s.key, s.label, s.icon))}
        </div>
      )}
    </div>
  );
}
