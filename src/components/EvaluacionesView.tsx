import { useState, useEffect } from 'react';
import type { MaterialSaved } from '../types';
import { NIVELES, ASIGNATURAS, EVAL_TIPOS, DIFICULTADES, HABILIDADES } from '../types';
import { generarConIA } from '../services/aiService';
import { getMaterials, saveMaterial, deleteMaterial, saveDriveItem, generateId } from '../services/storageService';
import { getSelectedCurriculumItem, setSelectedCurriculumItem } from '../services/curriculumService';
import { generateEvalAvanzado } from '../services/localGenerator';
import type { CurriculumItem } from '../types';
import { buildCurriculumHeaderFromItem } from '../utils/curriculum';
import { StatusBar } from './shared/StatusBar';
import { MaterialList } from './shared/MaterialList';
import { Stepper } from './shared/Stepper';
import { BookOpen, Sparkles, Send, Printer, Download, Copy, Check, CopyPlus, Edit3, FileText, ClipboardEdit, ArrowRight, ArrowLeft } from 'lucide-react';
import { AdaptarPanel } from './AdaptarPanel';

interface EvaluacionesViewProps {
  onNavigate: (view: string) => void;
}

const STEPS = ['Configuración', 'Contenido', 'Personalización'];

export function EvaluacionesView({ onNavigate }: EvaluacionesViewProps) {
  const [step, setStep] = useState(1);
  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);
  const [tipo, setTipo] = useState('Evaluación formativa');
  const [nivel, setNivel] = useState('2° básico');
  const [asignatura, setAsignatura] = useState('Lenguaje y Comunicación');
  const [oa, setOa] = useState('');
  const [habilidad, setHabilidad] = useState('Inferir');
  const [indicadores, setIndicadores] = useState<string[]>([]);
  const [selectedInds, setSelectedInds] = useState<Set<number>>(new Set());
  const [dificultad, setDificultad] = useState('Progresiva');
  const [texto, setTexto] = useState('');

  const [nPreguntas, setNPreguntas] = useState(5);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Selecciona un OA desde el Banco Curricular, elige indicadores y genera.');
  const [statusType, setStatusType] = useState('');
  const [savedMaterials, setSavedMaterials] = useState<MaterialSaved[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    setSavedMaterials(
      getMaterials().filter((m) =>
        ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
      )
    );
  }, []);

  useEffect(() => {
    const item = getSelectedCurriculumItem();
    if (item) {
      applyCurriculumItem(item);
    }
  }, []);

  const applyCurriculumItem = (item: CurriculumItem) => {
    setSelectedItem(item);
    setNivel(item.curso);
    setAsignatura(item.asignatura);
    setOa(item.oa);
    setHabilidad(item.habilidad);
    setIndicadores(item.indicadores);
    setSelectedInds(new Set(item.indicadores.map((_, i) => i)));
    setStatus(`OA cargado: ${item.id} — ${item.asignatura} — ${item.curso}`);
    setStatusType('ok');
  };

  const toggleIndicador = (idx: number) => {
    setSelectedInds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAllInds = () => {
    setSelectedInds(new Set(indicadores.map((_, i) => i)));
  };

  const deselectAllInds = () => {
    setSelectedInds(new Set());
  };

  const handleBuscarOA = () => {
    onNavigate('banco');
  };

  const buildPrompt = () => {
    const selectedIndsArray = Array.from(selectedInds).sort().map((i) => indicadores[i]);
    const isSIMCE = tipo.toLowerCase().includes('simce');
    return [
      `Eres un/una docente chileno/a experto/a en evaluación educativa. Genera ${isSIMCE ? 'una evaluación tipo SIMCE completa' : `un/una ${tipo.toLowerCase()}`} para el currículum chileno.`,
      '',
      `Nivel: ${nivel}`,
      `Asignatura: ${asignatura}`,
      `OA evaluado: ${oa}`,
      `Habilidad principal: ${habilidad}`,
      ...(selectedIndsArray.length ? [`Indicadores a evaluar:`, ...selectedIndsArray.map((ind) => `- ${ind}`)] : []),
      `Dificultad: ${dificultad}`,
      ...(isSIMCE ? [`Número de preguntas: ${nPreguntas}`, `Texto base: ${texto || 'No especificado'}`] : []),
      '',
      ...(isSIMCE ? [
        'Formato SIMCE estricto:',
        '- Cada pregunta con 4 alternativas (A, B, C, D)',
        '- Distractores plausibles y una respuesta correcta',
        '- Cada pregunta debe indicar: indicador evaluado, habilidad medida, dificultad',
        '- Incluir tabla de especificaciones al final',
        '- Incluir pauta de corrección con respuestas correctas y explicación',
        '- Incluir análisis por habilidad',
        '- Incluir retroalimentación para cada alternativa',
      ] : [
        'La evaluación debe incluir:',
        '- Cada pregunta/criterio debe mostrar: indicador evaluado, habilidad evaluada, nivel de dificultad, respuesta esperada, puntaje sugerido, retroalimentación',
        '- Instrucciones claras para el/la estudiante',
        '- Pauta de corrección o rúbrica',
        '- Retroalimentación por nivel de logro',
      ]),
      '',
      'Formato Markdown con secciones ## y **negritas**. Lenguaje claro y aplicable al aula chilena.',
    ].filter(Boolean).join('\n');
  };

  const withHeader = (texto: string): string => {
    if (!selectedItem) return texto;
    return buildCurriculumHeaderFromItem(selectedItem) + '\n' + texto;
  };

  const handleGenerar = async () => {
    if (!oa.trim()) {
      setStatus('Primero selecciona un OA o completa el campo manualmente.');
      setStatusType('bad');
      return;
    }
    if (selectedInds.size === 0) {
      setStatus('Selecciona al menos un indicador de evaluación.');
      setStatusType('bad');
      return;
    }

    setStatus('Generando...');
    setStatusType('');
    setOutput('');

    const selectedIndsArray = Array.from(selectedInds).sort().map((i) => indicadores[i]);

    try {
      const result = await generarConIA({
        tipo: tipo.toLowerCase().includes('simce') ? 'simce' : 'evaluacion',
        nivel,
        asignatura,
        oa,
        promptExt: buildPrompt(),
        onStatus: (msg, type) => { setStatus(msg); setStatusType(type || ''); },
      });

      if (result.ok && result.texto) {
        setOutput(withHeader(result.texto));
        setStatus('Evaluación generada con IA.');
        setStatusType('ok');
      } else {
        setOutput(withHeader(generateEvalAvanzado({
          tipo,
          nivel,
          asignatura,
          oa,
          habilidad,
          indicadores: selectedIndsArray,
          dificultad,
          texto,
        })));
        setStatus('Generado en modo local.');
        setStatusType('ok');
      }
    } catch {
      setOutput(withHeader(generateEvalAvanzado({
        tipo,
        nivel,
        asignatura,
        oa,
        habilidad,
        indicadores: selectedIndsArray,
        dificultad,
        texto,
      })));
      setStatus('Generado en modo local (fallback).');
      setStatusType('ok');
    }
  };

  const handleGuardar = () => {
    if (!output) return;
    const tipoKey = tipo.toLowerCase().includes('simce') ? 'simce'
      : tipo.toLowerCase().includes('rubrica') ? 'rubrica'
      : tipo.toLowerCase().includes('ticket') ? 'ticket'
      : 'evaluacion';
    const material: MaterialSaved = {
      id: generateId(),
      tipo: tipoKey as MaterialSaved['tipo'],
      titulo: `${tipo} - ${nivel} ${asignatura}`,
      contenido: output,
      nivel,
      asignatura,
      oa,
      fecha: new Date().toISOString(),
      etiquetas: [dificultad, habilidad],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) =>
      ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
    ));
    setStatus('Instrumento guardado en Mis materiales.');
    setStatusType('ok');
  };

  const handleEnviarDrive = () => {
    if (!output) return;
    saveDriveItem({
      id: generateId(),
      nombre: `${tipo} - ${nivel} ${asignatura}`,
      contenido: output,
      tipo: 'texto',
      nivel,
      asignatura,
      oa,
      fecha: new Date().toISOString(),
    });
    setStatus('Evaluación enviada a Drive personal.');
    setStatusType('ok');
  };

  const handleImprimir = () => {
    if (!output) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto;">${output}</pre>`);
    win.document.close();
    win.print();
  };

  const handleExportar = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion-${nivel}-${asignatura}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopiar = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleDuplicar = () => {
    if (!output) return;
    const dupKey = tipo.toLowerCase().includes('simce') ? 'simce'
      : tipo.toLowerCase().includes('rubrica') ? 'rubrica'
      : tipo.toLowerCase().includes('ticket') ? 'ticket'
      : 'evaluacion';
    const material: MaterialSaved = {
      id: generateId(),
      tipo: dupKey as MaterialSaved['tipo'],
      titulo: `${tipo} (copia) - ${nivel} ${asignatura}`,
      contenido: output,
      nivel,
      asignatura,
      oa,
      fecha: new Date().toISOString(),
      etiquetas: [dificultad, habilidad],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) =>
      ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
    ));
    setStatus('Instrumento duplicado en Mis materiales.');
    setStatusType('ok');
  };

  const handleEditar = () => {
    setEditando(!editando);
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar este instrumento?')) return;
    deleteMaterial(id);
    setSavedMaterials(getMaterials().filter((m) =>
      ['evaluacion', 'rubrica', 'ticket', 'simce'].includes(m.tipo)
    ));
  };

  const cargarMaterial = (m: MaterialSaved) => {
    setOutput(m.contenido);
    setNivel(m.nivel);
    setAsignatura(m.asignatura);
    setOa(m.oa || '');
    setShowSaved(false);
  };

  const isSIMCE = tipo.toLowerCase().includes('simce');

  return (
    <div className="view" id="evaluaciones">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={18} /> Evaluaciones
        </h2>
        <button className="secondary small" onClick={() => setShowSaved(!showSaved)}>
          {showSaved ? 'Ocultar' : `Mis instrumentos (${savedMaterials.length})`}
        </button>
      </div>

      {showSaved && (
        <div className="card">
          <h3>Instrumentos guardados</h3>
          <MaterialList items={savedMaterials} onCargar={cargarMaterial} onEliminar={handleEliminar} />
        </div>
      )}

      <Stepper steps={STEPS} current={step} />

      {step === 1 && (
        <div className="card">
          <h3>Paso 1: Configuración</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Define el tipo, nivel y asignatura de la evaluación.</p>
          <div className="grid">
            <div>
              <label>Tipo de evaluación</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {EVAL_TIPOS.map((t) => <option key={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label>Nivel</label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
                {NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label>Asignatura</label>
              <select value={asignatura} onChange={(e) => setAsignatura(e.target.value)}>
                {ASIGNATURAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label>Habilidad principal</label>
              <select value={habilidad} onChange={(e) => setHabilidad(e.target.value)}>
                {HABILIDADES.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="btnrow" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="primary" onClick={() => setStep(2)}>
              Siguiente <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="two-col">
          <div className="card">
            <h3>Paso 2: Contenido (OA e Indicadores)</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Selecciona un OA desde el Banco Curricular o completa el campo manualmente.</p>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              OA / habilidad
              <button className="small ghost" onClick={handleBuscarOA} style={{ fontSize: 11 }}>
                <BookOpen size={10} /> Buscar en banco OA
              </button>
            </label>
            <textarea
              value={oa}
              onChange={(e) => setOa(e.target.value)}
              placeholder="Pega el OA aquí o selecciona desde el Banco OA..."
              style={{ minHeight: 50, fontSize: 13 }}
            />
            {selectedItem && (
              <div style={{ marginTop: 8, padding: 8, background: 'var(--surface)', borderRadius: 6, fontSize: 12 }}>
                <code>{selectedItem.id}</code>
                <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{selectedItem.curso} · {selectedItem.eje}</span>
              </div>
            )}
            <div className="btnrow" style={{ justifyContent: 'space-between', marginTop: 16 }}>
              <button className="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={14} /> Atrás
              </button>
              <button className="primary" onClick={() => setStep(3)}>
                Siguiente <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="card">
            <h3>Indicadores de evaluación</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                Selecciona al menos un indicador a evaluar ({selectedInds.size} de {indicadores.length} seleccionados)
              </p>
              <div className="btnrow" style={{ gap: 4 }}>
                <button className="small ghost" onClick={selectAllInds} style={{ fontSize: 11 }}>Todo</button>
                <button className="small ghost" onClick={deselectAllInds} style={{ fontSize: 11 }}>Ninguno</button>
              </div>
            </div>
            {indicadores.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, fontStyle: 'italic' }}>
                Selecciona un OA desde el Banco OA para ver sus indicadores.
              </p>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {indicadores.map((ind, i) => (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
                    borderBottom: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedInds.has(i)}
                      onChange={() => toggleIndicador(i)}
                      style={{ marginTop: 2 }}
                    />
                    <span style={{ color: selectedInds.has(i) ? 'var(--ink)' : 'var(--muted)' }}>
                      {ind}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="two-col">
          <div className="card">
            <h3>Paso 3: Personalización y DUA</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Configura dificultad, preguntas SIMCE (si aplica) y genera la evaluación.</p>
            <label>Dificultad</label>
            <select value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
              {DIFICULTADES.map((d) => <option key={d}>{d}</option>)}
            </select>
            {isSIMCE && (
              <>
                <label style={{ marginTop: 12 }}><b>Evaluación tipo SIMCE</b></label>
                <label>Número de preguntas</label>
                <input type="number" min={3} max={20} value={nPreguntas}
                  onChange={(e) => setNPreguntas(parseInt(e.target.value) || 5)} />
                <label>Texto base o tema para contextualizar las preguntas</label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Texto breve, situación o tema..."
                  style={{ minHeight: 60, fontSize: 13, marginTop: 8 }}
                />
              </>
            )}
            <div className="btnrow" style={{ justifyContent: 'space-between', marginTop: 16 }}>
              <button className="ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={14} /> Atrás
              </button>
              <button className="primary" onClick={handleGenerar} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Generar {isSIMCE ? 'SIMCE' : 'evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2>Resultado</h2>
          {output && (
            <div className="btnrow" style={{ gap: 4 }}>
              <button className="small secondary" onClick={handleGuardar} title="Guardar en Mis materiales">
                <Sparkles size={12} /> Guardar
              </button>
              <button className="small ghost" onClick={handleEnviarDrive} title="Enviar a Drive personal">
                <Send size={12} /> Drive
              </button>
              <button className="small ghost" onClick={() => { onNavigate('planificador'); }} title="Convertir en planificación">
                <ClipboardEdit size={12} /> Planificar
              </button>
              <button className="small ghost" onClick={handleImprimir} title="Imprimir">
                <Printer size={12} /> Imprimir
              </button>
              <button className="small ghost" onClick={handleExportar} title="Exportar como .md">
                <Download size={12} /> Exportar
              </button>
              <button className="small ghost" onClick={handleDuplicar} title="Duplicar y guardar">
                <CopyPlus size={12} /> Duplicar
              </button>
              <button className="small ghost" onClick={handleEditar} title="Activar/desactivar edición">
                <Edit3 size={12} /> {editando ? 'Listo' : 'Editar'}
              </button>
              <button className="small ghost" onClick={handleCopiar} title="Copiar al portapapeles">
                {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </div>
        <StatusBar message={status} type={statusType} />
        {editando && output ? (
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            style={{
              width: '100%', minHeight: 400, fontFamily: 'monospace', fontSize: 13,
              padding: 12, borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--ink)',
            }}
          />
        ) : (
          <div style={{
            background: 'var(--surface)', borderRadius: 8, padding: 14,
            maxHeight: 500, overflowY: 'auto', fontSize: 13, lineHeight: 1.6,
            whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif',
          }}>
            {output || <p className="muted" style={{ fontStyle: 'italic' }}>La evaluación generada aparecerá aquí...</p>}
          </div>
        )}
      </div>

      <AdaptarPanel
        item={selectedItem}
        contenidoOriginal={output}
        onStatus={(msg, type) => { setStatus(msg); setStatusType(type || ''); }}
      />
    </div>
  );
}
