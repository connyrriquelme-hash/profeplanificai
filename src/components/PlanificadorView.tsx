import { useState, useEffect } from 'react';
import type { PlanFormData, MaterialSaved, CurriculumItem } from '../types';
import { NIVELES, ASIGNATURAS, DURACIONES, ENFOQUES, SUGERENCIAS_OA } from '../types';
import { generatePlan } from '../services/localGenerator';
import { generarConIA } from '../services/aiService';
import { getMaterials, saveMaterial, deleteMaterial, generateId, saveDriveItem } from '../services/storageService';
import { buildOAContext, buildCurriculumHeaderFromItem } from '../utils/curriculum';
import { StatusBar } from './shared/StatusBar';
import { OutputEditor } from './shared/OutputEditor';
import { ResultActions } from './shared/ResultActions';
import { MaterialList } from './shared/MaterialList';
import { AdaptarPanel } from './AdaptarPanel';
import { Stepper } from './shared/Stepper';
import { WorkspaceView } from './WorkspaceView';
import { BookOpen, Send, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

import { getSelectedCurriculumItem } from '../services/curriculumService';

interface PlanificadorViewProps {
  onNavigate?: (view: string) => void;
}

const TABS = [
  { id: 1, label: 'Configuración', icon: '⚙️' },
  { id: 2, label: 'Contenido (OA)', icon: '📘' },
  { id: 3, label: 'Personalización y DUA', icon: '🎨' },
];

export function PlanificadorView({ onNavigate }: PlanificadorViewProps = {}) {
  const [tab, setTab] = useState(1);
  const [currentKind, setCurrentKind] = useState<'plan' | 'secuencia'>('plan');

  const printAndOpen = () => {
    if (!output) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre style="font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto;">${output}</pre>`);
    win.document.close();
    win.print();
  };

  const exportToWord = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planificacion-${form.nivel}-${form.asignatura}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);
  const [form, setForm] = useState<PlanFormData>(() => {
    const selected = getSelectedCurriculumItem();
    if (selected) {
      return {
        nivel: selected.curso,
        asignatura: selected.asignatura,
        duracion: '90 minutos',
        enfoque: selected.eje || 'Comprensión lectora',
        oa: selected.oa,
        contexto: '',
        extra: '',
      };
    }
    return {
      nivel: '2° básico',
      asignatura: 'Lenguaje y Comunicación',
      duracion: '90 minutos',
      enfoque: 'Comprensión lectora',
      oa: '',
      contexto: '',
      extra: '',
    };
  });

  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Completa los campos y presiona generar.');
  const [statusType, setStatusType] = useState('');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [savedMaterials, setSavedMaterials] = useState<MaterialSaved[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
    const item = getSelectedCurriculumItem();
    if (item) setSelectedItem(item);
  }, []);

  useEffect(() => {
    const arr = SUGERENCIAS_OA[form.asignatura] || SUGERENCIAS_OA['Interdisciplinario'] || [];
    setSugerencias(arr);
  }, [form.asignatura]);

  const updateField = (field: keyof PlanFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const usarSugerencia = (text: string) => {
    setForm((prev) => ({ ...prev, oa: text }));
  };

  const usarEjemplo = () => {
    setForm({
      nivel: '2° básico',
      asignatura: 'Lenguaje y Comunicación',
      duracion: '90 minutos',
      enfoque: 'Comprensión lectora',
      oa: 'Leer y comprender textos narrativos breves, localizando información explícita e infiriendo características de personajes a partir de sus acciones.',
      contexto: 'Curso con estudiantes que leen con distintos niveles de fluidez; se requiere apoyo visual, lectura coral y trabajo colaborativo.',
      extra: 'Agregar preguntas tipo SIMCE, roles de equipo y ticket de salida.',
    });
  };

  const withHeader = (texto: string): string => {
    if (!selectedItem) return texto;
    return buildCurriculumHeaderFromItem(selectedItem) + '\n' + texto;
  };

  const handleGenerar = async (kind: 'plan' | 'secuencia') => {
    setCurrentKind(kind);
    setStatus('Generando...');
    setStatusType('');
    setOutput('');

    const prompt = buildPrompt(kind, form);

    try {
      const result = await generarConIA({
        tipo: kind === 'plan' ? 'planificacion' : 'secuencia',
        nivel: form.nivel,
        asignatura: form.asignatura,
        oa: form.oa,
        promptExt: prompt,
        onStatus: (msg, type) => { setStatus(msg); setStatusType(type || ''); },
      });

      if (result.ok && result.texto) {
        setOutput(withHeader(result.texto));
      } else {
        setOutput(withHeader(generatePlan(kind, form)));
        setStatus('Generado en modo local.');
        setStatusType('ok');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      const local = generatePlan(kind, form);
      setOutput(withHeader(local));
      setStatus('Error de IA: ' + msg + '. Generado en modo local.');
      setStatusType('warn');
    }
  };

  const getInitialMessage = () => {
    const base = `¡Excelente! Tu ${currentKind === 'plan' ? 'planificación' : 'secuencia de unidad'} está lista.

**Resumen:**
• Curso: ${form.nivel} - ${form.asignatura}
• Duración: ${form.duracion}
• Tipo: ${form.enfoque}
• OA: ${form.oa}

¿Deseas hacer algún ajuste con la IA? Puedes pedirme que:
• Haga el texto más corto o más detallado
• Agregue adapaciones DUA (Accesibilidad)
• Mejore la redacción o el formato
• Añada ejemplos prácticos
• Ajuste la dificultad o tono

Solo escribe tu solicitud y generaré una versión mejorada para ti.`;
    return base;
  };

  const handleGuardar = () => {
    if (!output) return;
    const material: MaterialSaved = {
      id: generateId(),
      tipo: 'planificacion',
      titulo: `Planificación - ${form.nivel} ${form.asignatura}`,
      contenido: output,
      nivel: form.nivel,
      asignatura: form.asignatura,
      oa: form.oa,
      fecha: new Date().toISOString(),
      etiquetas: [form.enfoque],
    };
    saveMaterial(material);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
    setStatus('Planificación guardada en Mis materiales.');
    setStatusType('ok');
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar esta planificación?')) return;
    deleteMaterial(id);
    setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
  };

  const handleBuscarOA = () => {
    if (onNavigate) onNavigate('banco');
  };

  const handleEnviarDrive = () => {
    if (!output) return;
    saveDriveItem({
      id: generateId(),
      nombre: `Planificación - ${form.nivel} ${form.asignatura}`,
      contenido: output,
      tipo: 'texto',
      nivel: form.nivel,
      asignatura: form.asignatura,
      oa: form.oa,
      fecha: new Date().toISOString(),
    });
    setStatus('Planificación enviada a Drive personal.');
    setStatusType('ok');
  };

  const cargarMaterial = (m: MaterialSaved) => {
    setOutput(m.contenido);
    setForm({
      nivel: m.nivel,
      asignatura: m.asignatura,
      duracion: form.duracion,
      enfoque: form.enfoque,
      oa: m.oa,
      contexto: form.contexto,
      extra: form.extra,
    });
    setShowSaved(false);
  };

  return (
    <div className="view" id="planificador">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Planificador de clases</h2>
        <button className="secondary small" onClick={() => setShowSaved(!showSaved)}>
          {showSaved ? 'Ocultar materiales' : `Mis materiales (${savedMaterials.length})`}
        </button>
      </div>

      {showSaved && (
        <div className="card">
          <h3>Materiales guardados</h3>
          <MaterialList items={savedMaterials} onCargar={cargarMaterial} onEliminar={handleEliminar} />
        </div>
      )}

      <div className="tabs-wrapper">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span style={{ marginRight: 8 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 1 && (
        <div className="card tab-content">
          <h3>Configuración Inicial</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Define el nivel, asignatura y duración de tu planificación.</p>
          <div className="grid">
            <div>
              <label>Nivel</label>
              <select value={form.nivel} onChange={(e) => updateField('nivel', e.target.value)}>
                {NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label>Asignatura</label>
              <select value={form.asignatura} onChange={(e) => updateField('asignatura', e.target.value)}>
                {ASIGNATURAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label>Duración</label>
              <select value={form.duracion} onChange={(e) => updateField('duracion', e.target.value)}>
                {DURACIONES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Enfoque pedagógico</label>
              <select value={form.enfoque} onChange={(e) => updateField('enfoque', e.target.value)}>
                {ENFOQUES.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="btnrow" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="primary" onClick={() => setTab(2)}>
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="two-col">
          <div className="card tab-content">
            <h3>Contenido (OA)</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Pega el OA ministerial o selecciona uno sugerido.</p>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Objetivo de Aprendizaje / Indicador
              <button className="small ghost" onClick={handleBuscarOA} style={{ fontSize: 11 }}>
                <BookOpen size={10} /> Banco OA
              </button>
            </label>
            <textarea
              value={form.oa}
              onChange={(e) => updateField('oa', e.target.value)}
              placeholder="Pega aquí el OA ministerial o escribe tu objetivo..."
            />
            <div className="btnrow" style={{ justifyContent: 'space-between', marginTop: 20 }}>
              <button className="ghost" onClick={() => setTab(1)}>
                <ArrowLeft size={16} /> Anterior
              </button>
              <button className="primary" onClick={() => setTab(3)}>
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="card no-print">
            <h3>OA sugeridos/editables</h3>
            <div className="resource-list">
              {sugerencias.map((t, i) => (
                <div key={i} className="resource-item">
                  <b>OA sugerido</b>
                  <span>{t}</span>
                  <div className="btnrow">
                    <button className="small secondary" onClick={() => { usarSugerencia(t); }}>
                      Usar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div className="two-col">
          <div className="card tab-content">
            <h3>Personalización y DUA</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Añade contexto, instrucciones especiales y genera.</p>
            <label>Contexto del curso</label>
            <textarea
              value={form.contexto}
              onChange={(e) => updateField('contexto', e.target.value)}
              placeholder="Ej.: 2° básico, curso heterogéneo, algunos estudiantes descendidos en lectura..."
            />
            <label>Instrucciones especiales</label>
            <textarea
              value={form.extra}
              onChange={(e) => updateField('extra', e.target.value)}
              placeholder="Ej.: incorporar lectura guiada, trabajo en parejas, material imprimible..."
            />
            <div className="btnrow" style={{ justifyContent: 'space-between', marginTop: 20 }}>
              <button className="ghost" onClick={() => setTab(2)}>
                <ArrowLeft size={16} /> Anterior
              </button>
              <div className="btnrow" style={{ gap: 12 }}>
                <button className="secondary" onClick={() => handleGenerar('secuencia')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> Generar secuencia de unidad
                </button>
                <button className="primary" onClick={() => handleGenerar('plan')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> Generar planificación
                </button>
              </div>
              <button className="ghost" onClick={usarEjemplo} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Usar ejemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {output && (
        <div className="card workspace-section">
          <WorkspaceView
            output={output}
            onNavigate={onNavigate}
            onSave={() => {
              const material: MaterialSaved = {
                id: generateId(),
                tipo: 'planificacion',
                titulo: `Planificación - ${form.nivel} ${form.asignatura}`,
                contenido: output,
                nivel: form.nivel,
                asignatura: form.asignatura,
                oa: form.oa,
                fecha: new Date().toISOString(),
                etiquetas: [form.enfoque],
              };
              saveMaterial(material);
              setSavedMaterials(getMaterials().filter((m) => m.tipo === 'planificacion'));
              setStatus('Planificación guardada en Mis materiales.');
              setStatusType('ok');
            }}
            onCopy={() => {
              navigator.clipboard.writeText(output);
              setStatus('Contenido copiado al portapapeles.');
              setStatusType('ok');
            }}
            onPrint={() => {
              printAndOpen();
            }}
            onExportPDF={() => {
              import('../utils/exportPdf').then(({ exportToPDF }) => {
                exportToPDF('Planificación', output);
              });
            }}
            onExportWord={() => {
              exportToWord();
            }}
            onClose={() => {
              setOutput('');
              setStatus('Completa los campos y presiona generar.');
              setStatusType('');
            }}
            initialMessage={getInitialMessage()}
          />
        </div>
      )}

      <AdaptarPanel
        item={selectedItem}
        contenidoOriginal={output}
        onStatus={(msg, type) => { setStatus(msg); setStatusType(type || ''); }}
      />
    </div>
  );
}

function buildPrompt(kind: string, d: PlanFormData): string {
  const nivel = d.nivel;
  const esParvularia = nivel === 'Prekinder' || nivel === 'Kinder';
  const oaContext = buildOAContext(nivel, d.asignatura, d.oa);
  const formato = esParvularia
    ? 'Debe incluir: objetivo de aprendizaje, ámbito/s, experiencia de aprendizaje en tres momentos (inicio, desarrollo, cierre), estrategias de juego, DUA con apoyos concretos, evaluación formativa mediante observación y registro, y sugerencias para el hogar.'
    : 'Debe incluir: objetivo claro, habilidades, inicio-desarrollo-cierre con tiempos sugeridos, actividad colaborativa, DUA con apoyos explícitos, evaluación formativa con indicador y retroalimentación, recursos y adecuaciones curriculares.';
  const tipo = kind === 'plan' ? 'planificación de clase' : 'secuencia de unidad';
  const partes = [
    `Eres un docente experto del currículum chileno. Crea una ${tipo} completa y contextualizada.`,
    `Nivel: ${nivel}`,
    `Asignatura/Ámbito: ${d.asignatura}`,
    `Duración: ${d.duracion}`,
    `Enfoque pedagógico: ${d.enfoque}`,
    `Objetivo de Aprendizaje (OA): ${d.oa}`,
    `Contexto del curso: ${d.contexto || 'No especificado. Usa un contexto genérico realista.'}`,
    `Instrucciones adicionales: ${d.extra || 'Ninguna.'}`,
    formato,
    'Estructura la respuesta en secciones claras con encabezados (##). Usa **negritas** para énfasis. Sé específico, práctico y aplicable al aula chilena actual.',
  ];
  if (oaContext) {
    partes.unshift('', oaContext, '', '---', '');
  }
  return partes.join('\n');
}
