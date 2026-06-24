import { useState, useEffect, useMemo } from 'react';
import type { MaterialSaved } from '../types';
import { NIVELES, ASIGNATURAS, RECURSOS_TIPOS } from '../types';
import { generarConIA } from '../services/aiService';
import { getMaterials, saveMaterial, deleteMaterial, saveDriveItem, generateId } from '../services/storageService';
import { getSelectedCurriculumItem, setSelectedCurriculumItem, getAutoSuggestions } from '../services/curriculumService';
import { generateRecursoAvanzado, generatePrompts } from '../services/localGenerator';
import type { CurriculumItem } from '../types';
import { buildCurriculumHeaderFromItem } from '../utils/curriculum';
import { StatusBar } from './shared/StatusBar';
import { ResultActions } from './shared/ResultActions';
import { MaterialList } from './shared/MaterialList';
import { BookOpen, Sparkles, Send, ClipboardEdit, FileText, Printer, Download, Copy, Check } from 'lucide-react';
import { AdaptarPanel } from './AdaptarPanel';

interface RecursosViewProps {
  onNavigate: (view: string) => void;
}

const MODOS = [
  { id: 'oa_seleccionado', label: 'OA seleccionado', icon: '📘' },
  { id: 'indicadores', label: 'Indicadores seleccionados', icon: '📋' },
  { id: 'habilidad', label: 'Habilidad específica', icon: '🎯' },
  { id: 'rezago', label: 'Estudiantes con rezago', icon: '🆘' },
  { id: 'simce', label: 'Evaluación tipo SIMCE', icon: '📝' },
  { id: 'dua', label: 'Actividad DUA', icon: '♿' },
  { id: 'reforzamiento', label: 'Reforzamiento', icon: '🔄' },
  { id: 'ampliacion', label: 'Ampliación para estudiantes avanzados', icon: '🚀' },
];

export function RecursosView({ onNavigate }: RecursosViewProps) {
  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);
  const [modo, setModo] = useState('oa_seleccionado');
  const [tipoRecurso, setTipoRecurso] = useState('Guía imprimible');
  const [nivel, setNivel] = useState('2° básico');
  const [asignatura, setAsignatura] = useState('Lenguaje y Comunicación');
  const [eje, setEje] = useState('');
  const [oa, setOa] = useState('');
  const [habilidad, setHabilidad] = useState('');
  const [indicadores, setIndicadores] = useState('');
  const [necesidad, setNecesidad] = useState('');
  const [dificultad, setDificultad] = useState('Progresiva');

  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Selecciona un OA desde el Banco Curricular o completa los campos manualmente.');
  const [statusType, setStatusType] = useState('');
  const [savedMaterials, setSavedMaterials] = useState<MaterialSaved[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestions = useMemo(() => {
    if (!selectedItem) return null;
    return getAutoSuggestions(selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'recurso'));
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
    setEje(item.eje);
    setOa(item.oa);
    setHabilidad(item.habilidad);
    setIndicadores(item.indicadores.join('\n'));
    setDificultad('Progresiva');
    setStatus(`OA cargado: ${item.id} — ${item.asignatura} — ${item.curso}`);
    setStatusType('ok');
  };

  const handleBuscarOA = () => {
    onNavigate('banco');
  };

  const buildPrompt = () => {
    const indArray = indicadores.split('\n').filter(Boolean);
    const prompt = [
      `Eres un/una docente chileno/a experto/a. Genera un recurso pedagógico COMPLETO en modo "${MODOS.find(m => m.id === modo)?.label}".`,
      '',
      `Nivel: ${nivel}`,
      `Asignatura: ${asignatura}`,
      `Eje: ${eje}`,
      `OA: ${oa}`,
      `Habilidad: ${habilidad}`,
      ...(indArray.length ? [`Indicadores:`, ...indArray.map(i => `- ${i}`)] : []),
      `Dificultad: ${dificultad}`,
      `Necesidad pedagógica: ${necesidad || 'No especificada'}`,
      '',
      'El recurso debe incluir OBLIGATORIAMENTE estos campos en secciones ##:',
      '1. Título',
      '2. Datos curriculares (nivel, asignatura, OA, habilidad, indicadores)',
      '3. Instrucciones para el/la docente',
      '4. Instrucciones para estudiantes',
      '5. Actividad principal',
      '6. Actividad diferenciada (descendidos, avanzados)',
      '7. Apoyo DUA (Representación, Acción, Participación)',
      '8. Preguntas de pensamiento (literal, inferencial, crítico, metacognición)',
      '9. Evidencia esperada',
      '10. Pauta breve de revisión (tabla)',
      '11. Retroalimentación sugerida por nivel de logro',
      '',
      'Usa **negritas** para énfasis. Sé práctico/a y aplicable al aula chilena.',
      modo === 'simce' ? 'Formato tipo SIMCE con alternativas A-D, habilidad y dificultad por pregunta.' : '',
      nivel === 'Prekinder' || nivel === 'Kinder' ? 'Adaptado a educación parvularia: lenguaje simple, actividades lúdicas, apoyos visuales.' : '',
    ].filter(Boolean).join('\n');
    return prompt;
  };

  const withHeader = (texto: string): string => {
    if (!selectedItem) return texto;
    return buildCurriculumHeaderFromItem(selectedItem) + '\n' + texto;
  };

  const handleGenerar = async () => {
    if (!oa.trim()) {
      setStatus('Primero selecciona un OA o completa el campo OA manualmente.');
      setStatusType('bad');
      return;
    }
    setStatus('Generando...');
    setStatusType('');
    setOutput('');

    const indArray = indicadores.split('\n').filter(Boolean);

    try {
      const result = await generarConIA({
        tipo: 'recurso',
        nivel,
        asignatura,
        oa,
        promptExt: buildPrompt(),
        onStatus: (msg, type) => { setStatus(msg); setStatusType(type || ''); },
      });

      if (result.ok && result.texto) {
        setOutput(withHeader(result.texto));
        setStatus('Recurso generado con IA.');
        setStatusType('ok');
      } else {
        const local = generateRecursoAvanzado({
          modo,
          nivel,
          asignatura,
          eje,
          oa,
          habilidad,
          indicadores: indArray,
          necesidad,
          dificultad,
        });
        setOutput(withHeader(local));
        setStatus('Generado en modo local.');
        setStatusType('ok');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      const local = generateRecursoAvanzado({
        modo,
        nivel,
        asignatura,
        eje,
        oa,
        habilidad,
        indicadores: indArray,
        necesidad,
        dificultad,
      });
      setOutput(withHeader(local));
      setStatus('Error de IA: ' + msg + '. Generado en modo local.');
      setStatusType('warn');
    }
  };

  const handleGuardarMaterial = () => {
    if (!output) return;
    const material: MaterialSaved = {
      id: generateId(),
      tipo: 'recurso',
      titulo: `${tipoRecurso} - ${nivel} ${asignatura}`,
      contenido: output,
      nivel,
      asignatura,
      oa,
      fecha: new Date().toISOString(),
      etiquetas: [tipoRecurso, modo],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'recurso'));
    setStatus('Recurso guardado en Mis materiales.');
    setStatusType('ok');
  };

  const handleEnviarDrive = () => {
    if (!output) return;
    saveDriveItem({
      id: generateId(),
      nombre: `${tipoRecurso} - ${nivel} ${asignatura}`,
      contenido: output,
      tipo: 'texto',
      nivel,
      asignatura,
      oa,
      fecha: new Date().toISOString(),
    });
    setStatus('Recurso enviado a Drive personal.');
    setStatusType('ok');
  };

  const handleConvertirEval = () => {
    if (!output || !selectedItem) return;
    setSelectedCurriculumItem(selectedItem);
    onNavigate('evaluaciones');
  };

  const handleConvertirPlan = () => {
    if (!output || !selectedItem) return;
    setSelectedCurriculumItem(selectedItem);
    onNavigate('planificador');
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
    a.download = `recurso-${nivel}-${asignatura}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopiar = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar este recurso?')) return;
    deleteMaterial(id);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'recurso'));
  };

  const cargarMaterial = (m: MaterialSaved) => {
    setOutput(m.contenido);
    setNivel(m.nivel);
    setAsignatura(m.asignatura);
    setOa(m.oa || '');
    setShowSaved(false);
  };

  return (
    <div className="view" id="recursos">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={18} /> Generador de recursos
        </h2>
        <button className="secondary small" onClick={() => setShowSaved(!showSaved)}>
          {showSaved ? 'Ocultar' : `Mis recursos (${savedMaterials.length})`}
        </button>
      </div>

      {showSaved && (
        <div className="card">
          <h3>Recursos guardados</h3>
          <MaterialList items={savedMaterials} onCargar={cargarMaterial} onEliminar={handleEliminar} />
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Crear recurso a partir de</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {MODOS.map((m) => (
              <button
                key={m.id}
                className={`small ${modo === m.id ? 'primary' : 'ghost'}`}
                onClick={() => setModo(m.id)}
                style={{ fontSize: 12 }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            <div>
              <label>Tipo de recurso</label>
              <select value={tipoRecurso} onChange={(e) => setTipoRecurso(e.target.value)}>
                {RECURSOS_TIPOS.map((t) => <option key={t.v}>{t.l}</option>)}
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
              <label>Eje</label>
              <input value={eje} onChange={(e) => setEje(e.target.value)} placeholder="Ej.: Lectura" />
            </div>
            <div>
              <label>Dificultad</label>
              <select value={dificultad} onChange={(e) => setDificultad(e.target.value)}>
                {['Progresiva', 'Básica', 'Intermedia', 'Avanzada'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            OA / contenido
            <button className="small ghost" onClick={handleBuscarOA} style={{ fontSize: 11 }}>
              <BookOpen size={10} /> Buscar en banco OA
            </button>
          </label>
          <textarea
            value={oa}
            onChange={(e) => setOa(e.target.value)}
            placeholder="Pega aquí el OA o descríbelo..."
            style={{ minHeight: 50, fontSize: 13 }}
          />

          <label>Habilidad</label>
          <input value={habilidad} onChange={(e) => setHabilidad(e.target.value)} placeholder="Ej.: Inferir, analizar, resolver..." />

          <label>Indicadores de evaluación (uno por línea)</label>
          <textarea
            value={indicadores}
            onChange={(e) => setIndicadores(e.target.value)}
            placeholder="Escribe cada indicador en una línea..."
            style={{ minHeight: 60, fontSize: 13 }}
          />

          <label>Necesidad pedagógica</label>
          <textarea
            value={necesidad}
            onChange={(e) => setNecesidad(e.target.value)}
            placeholder="Ej.: estudiantes con rezago lector, diversidad funcional, curso heterogéneo..."
            style={{ minHeight: 50, fontSize: 13 }}
          />

          <div className="btnrow">
            <button className="primary" onClick={handleGenerar}>
              <Sparkles size={14} /> Generar recurso
            </button>
          </div>
        </div>

        {suggestions && (
          <div className="card" style={{ fontSize: 13 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Sparkles size={14} /> Sugerencias desde OA
            </h3>
            {selectedItem && (
              <div style={{ marginBottom: 6 }}>
                <code style={{ fontSize: 11, color: 'var(--muted)' }}>{selectedItem.id}</code>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{selectedItem.curso}</span>
              </div>
            )}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontWeight: 600 }}>Propósito:</label>
              <p style={{ color: 'var(--ink)' }}>{suggestions.proposito}</p>
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontWeight: 600 }}>Recursos sugeridos:</label>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                {suggestions.recursosSugeridos.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontWeight: 600 }}>DUA:</label>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                {suggestions.adecuacionesDUA.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <button className="small secondary" onClick={handleBuscarOA}>
              <BookOpen size={12} /> Cambiar OA
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2>Resultado</h2>
          {output && (
            <div className="btnrow" style={{ gap: 4 }}>
              <button className="small secondary" onClick={handleGuardarMaterial} title="Guardar en Mis materiales">
                <Sparkles size={12} /> Guardar
              </button>
              <button className="small ghost" onClick={handleEnviarDrive} title="Enviar a Drive personal">
                <Send size={12} /> Drive
              </button>
              <button className="small ghost" onClick={handleConvertirEval} title="Convertir en evaluación">
                <FileText size={12} /> Evaluación
              </button>
              <button className="small ghost" onClick={handleConvertirPlan} title="Convertir en planificación">
                <ClipboardEdit size={12} /> Planificar
              </button>
              <button className="small ghost" onClick={handleImprimir} title="Imprimir">
                <Printer size={12} /> Imprimir
              </button>
              <button className="small ghost" onClick={handleExportar} title="Exportar como .md">
                <Download size={12} /> Exportar
              </button>
              <button className="small ghost" onClick={handleCopiar} title="Copiar al portapapeles">
                {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}
        </div>
        <StatusBar message={status} type={statusType} />
        <div style={{
          background: 'var(--surface)', borderRadius: 8, padding: 14,
          maxHeight: 500, overflowY: 'auto', fontSize: 13, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif',
        }}>
          {output || <p className="muted" style={{ fontStyle: 'italic' }}>El recurso generado aparecerá aquí...</p>}
        </div>
        <ResultActions
          contenido={output}
          titulo={asignatura}
          nivel={nivel}
          tipo={tipoRecurso}
          onGuardar={handleGuardarMaterial}
          onLimpiar={() => { setOutput(''); setStatus('Listo para generar un nuevo recurso.'); setStatusType(''); }}
        />
      </div>

      <AdaptarPanel
        item={selectedItem}
        contenidoOriginal={output}
        onStatus={(msg, type) => { setStatus(msg); setStatusType(type || ''); }}
      />
    </div>
  );
}


