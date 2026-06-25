import { useState, useEffect, useCallback } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { SelectorOA } from './SelectorOA';
import { FileText, Play, Target, Sparkles, Plus, Search, CheckCircle, Loader, X, List, Table, Layout } from 'lucide-react';
import { useProject, type ProjectData } from '../contexts/ProjectContext';
import { niveles, getAsignaturas, getOAs, type CurriculumItem } from '../data/curriculumData';

type SectionKey = 'inicio' | 'desarrollo' | 'cierre';

interface SuggestionModalState {
  section: SectionKey;
  suggestion: string;
  edited: string;
}

interface WorkspaceProps {
  onNavigate?: (view: string) => void;
}

type FormatoKey = 'narrativo' | 'lista' | 'tabla' | 'esquema';

const FORMATOS: { key: FormatoKey; label: string; icon: React.ReactNode }[] = [
  { key: 'narrativo', label: 'Narrativo (Párrafo)', icon: <FileText size={14} /> },
  { key: 'lista', label: 'Lista estructurada', icon: <List size={14} /> },
  { key: 'tabla', label: 'Tabla pedagógica', icon: <Table size={14} /> },
  { key: 'esquema', label: 'Esquema visual', icon: <Layout size={14} /> },
];

function formatSuggestion(section: SectionKey, format: FormatoKey): string {
  const base = MOCK_SUGGESTIONS[section];
  switch (format) {
    case 'narrativo':
      return base;
    case 'lista': {
      const lines = base.split('\n').filter(l => l.trim());
      return lines.map(l => l.replace(/^\d+[\.\)]\s*/, '• ')).join('\n');
    }
    case 'tabla': {
      if (section === 'inicio') {
        return `| Momento        | Duración | Actividad                                            |
|----------------|----------|------------------------------------------------------|
| Activación     | 5 min    | Lluvia de ideas sobre el tema                        |
| Problema       | 5 min    | Presentar situación problemática desafiante          |
| Objetivo       | 3 min    | Compartir objetivo de la clase                       |
| Organización   | 2 min    | Recordar normas y organizar grupos                   |`;
      }
      if (section === 'desarrollo') {
        return `| Momento           | Duración | Actividad                                            |
|-------------------|----------|------------------------------------------------------|
| Presentación      | 10 min   | Explicar conceptos con apoyo visual                  |
| Trabajo guiado    | 8 min    | Modelar procedimiento paso a paso                    |
| Trabajo grupal    | 10 min   | Resolver desafío en grupos de 3-4                    |
| Socialización     | 5 min    | Compartir resultados y discutir                      |`;
      }
      return `| Momento              | Duración | Actividad                                            |
|----------------------|----------|------------------------------------------------------|
| Ticket de salida     | 3 min    | Responder pregunta breve por escrito                 |
| Síntesis             | 3 min    | Construir organizador gráfico colaborativo           |
| Autoevaluación       | 2 min    | Reflexionar con escala semáforo                      |
| Conexión             | 2 min    | Anticipar tema de la próxima clase                   |`;
    }
    case 'esquema': {
      const label = { inicio: 'INICIO', desarrollo: 'DESARROLLO', cierre: 'CIERRE' }[section];
      if (section === 'inicio') {
        return `${label}
├── Activación (5 min)
│   └── Lluvia de ideas en pizarra
├── Problema motivador (5 min)
│   └── Situación problemática breve
├── Objetivo (3 min)
│   └── Explicar qué y cómo se evaluará
└── Organización (2 min)
    └── Normas y grupos de trabajo`;
      }
      if (section === 'desarrollo') {
        return `${label}
├── Presentación (10 min)
│   └── Conceptos clave con organizadores gráficos
├── Trabajo guiado (8 min)
│   └── Modelar procedimiento paso a paso
├── Trabajo colaborativo (10 min)
│   └── Grupos de 3-4 resuelven desafío
└── Socialización (5 min)
    └── Grupos comparten resultados`;
      }
      return `${label}
├── Ticket de salida (3 min)
│   └── Pregunta breve por escrito
├── Síntesis (3 min)
│   └── Organizador gráfico colaborativo
├── Autoevaluación (2 min)
│   └── Escala semáforo
└── Conexión (2 min)
    └── Anticipar próxima clase`;
    }
  }
}

const MOCK_SUGGESTIONS: Record<SectionKey, string> = {
  inicio: `Momento inicial de la clase (10-15 minutos):

1. Activación de conocimientos previos: Realizar una lluvia de ideas en la pizarra sobre el tema, preguntando "¿Qué sabemos sobre...?" y anotando las respuestas de los estudiantes.

2. Problema o pregunta desafiante: Presentar una situación problemática breve relacionada con el OA que despierte curiosidad y motive el aprendizaje.

3. Comunicación del objetivo: Compartir el objetivo de la clase de forma clara y visual, explicando qué aprenderán y cómo serán evaluados.

4. Organización: Recordar las normas de convivencia y organizar los grupos de trabajo si es necesario.`,
  desarrollo: `Momento de desarrollo de la clase (25-30 minutos):

1. Presentación de contenidos: Explicar los conceptos clave utilizando organizadores gráficos, ejemplos concretos y preguntas guía. Apoyarse en recursos visuales como imágenes, videos o esquemas.

2. Trabajo guiado: Modelar el procedimiento o estrategia paso a paso con la participación activa de los estudiantes, resolviendo dudas en el proceso.

3. Trabajo colaborativo: En grupos de 3-4 estudiantes, resolver una actividad práctica o desafío aplicando los contenidos. Cada grupo recibe una tarea específica con roles definidos.

4. Monitoreo y retroalimentación: Circular por los grupos para observar el progreso, hacer preguntas de profundización y ofrecer ayudas cuando sea necesario.

5. Socialización: Dos o tres grupos comparten sus resultados con el curso, fomentando la discusión y el pensamiento crítico.`,
  cierre: `Momento de cierre de la clase (5-10 minutos):

1. Ticket de salida: Cada estudiante responde por escrito una pregunta breve como "¿Qué aprendiste hoy?" o "¿Qué dificultad tuviste?".

2. Síntesis colaborativa: Construir un organizador gráfico en la pizarra con las ideas principales de la clase, aportadas por los estudiantes.

3. Autoevaluación: Los estudiantes reflexionan sobre su propio aprendizaje usando una escala sencilla (pulgar arriba/abajo o semáforo).

4. Conexión con la próxima clase: Anticipar brevemente el tema de la siguiente sesión para mantener el interés y la continuidad.`,
};

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
  borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink)',
  fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer',
  outline: 'none', transition: 'border-color .15s',
};

function FloatingAssistant({
  section,
  onAction,
  onClose,
}: {
  section: SectionKey;
  onAction: (s: SectionKey) => void;
  onClose: () => void;
}) {
  const label = { inicio: 'Inicio', desarrollo: 'Desarrollo', cierre: 'Cierre' }[section];
  const suggestions: { label: string; hint: string }[] = {
    inicio: [
      { label: 'Sugerir activación', hint: 'Conocimientos previos' },
      { label: 'Problema motivador', hint: 'Situación desafiante' },
      { label: 'Ticket de entrada', hint: 'Pregunta diagnóstica' },
    ],
    desarrollo: [
      { label: 'Trabajo colaborativo', hint: 'Actividad en grupos' },
      { label: 'Preguntas guía', hint: 'Andamiaje' },
      { label: 'Modelaje guiado', hint: 'Paso a paso' },
    ],
    cierre: [
      { label: 'Sugerir actividad', hint: 'Cierre de clase' },
      { label: 'Ticket de salida', hint: 'Pregunta de reflexión' },
      { label: 'Autoevaluación', hint: 'Escala o semáforo' },
    ],
  }[section];

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 32, zIndex: 900,
      background: '#fff', border: '1px solid #e5e7eb',
      borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      padding: 16, minWidth: 200, maxWidth: 240,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#64748b' }}>
          {label}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8', lineHeight: 0 }}
          title="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {suggestions.map(s => (
          <button
            key={s.label}
            onClick={() => onAction(section)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc',
              cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#334155',
              textAlign: 'left', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#818cf8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <Sparkles size={12} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>{s.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, background: 'var(--success)', color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, animation: 'fadeIn .2s ease' }}>
      <CheckCircle size={18} />
      {message}
    </div>
  );
}

function SuggestionModal({
  state,
  onInsert,
  onCancel,
  onEdit,
}: {
  state: SuggestionModalState;
  onInsert: (text: string) => void;
  onCancel: () => void;
  onEdit: (text: string) => void;
}) {
  const [formato, setFormato] = useState<FormatoKey>('narrativo');
  const label = { inicio: 'Inicio', desarrollo: 'Desarrollo', cierre: 'Cierre' }[state.section];

  const handleFormatChange = (key: FormatoKey) => {
    setFormato(key);
    onEdit(formatSuggestion(state.section, key));
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal suggestion-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="suggestion-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} style={{ color: 'var(--brand)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Sugerencia IA — {label}</h3>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>Revisa y edita la propuesta antes de insertarla</p>
            </div>
          </div>
          <button className="ghost" onClick={onCancel} style={{ padding: 6 }}><X size={18} /></button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Formato</span>
          {FORMATOS.map(f => (
            <button
              key={f.key}
              onClick={() => handleFormatChange(f.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 10,
                border: `1px solid ${formato === f.key ? 'var(--brand)' : 'var(--line)'}`,
                background: formato === f.key ? 'var(--brand)' : 'var(--card)',
                color: formato === f.key ? '#fff' : 'var(--ink)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <textarea
            value={state.edited}
            onChange={e => onEdit(e.target.value)}
            style={{
              width: '100%', minHeight: 280, padding: 14, border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', fontFamily: 'monospace', fontSize: 13,
              lineHeight: 1.6, resize: 'vertical', background: '#fff', marginTop: 14,
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="secondary" onClick={onCancel}>Cancelar</button>
            <button className="primary" onClick={() => onInsert(state.edited)}>
              <Sparkles size={14} /> Insertar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Workspace({ onNavigate }: WorkspaceProps) {
  const { currentProject, updateProjectField, addToLibrary } = useProject();

  const [objetivos, setObjetivos] = useState(currentProject?.objetivos || '');
  const [indicadores, setIndicadores] = useState(currentProject?.indicadores || '');
  const [inicio, setInicio] = useState(currentProject?.inicio || '');
  const [desarrollo, setDesarrollo] = useState(currentProject?.desarrollo || '');
  const [cierre, setCierre] = useState(currentProject?.cierre || '');
  const [recursos, setRecursos] = useState(currentProject?.recursos || '');
  const [evaluacion, setEvaluacion] = useState(currentProject?.evaluacion || '');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestionModal, setSuggestionModal] = useState<SuggestionModalState | null>(null);
  const [focusedSection, setFocusedSection] = useState<SectionKey | null>(null);
  const [selectedNivel, setSelectedNivel] = useState('');
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  const [selectedOA, setSelectedOA] = useState<CurriculumItem | null>(null);
  const [selectedHabilidad, setSelectedHabilidad] = useState('');

  useEffect(() => {
    if (!currentProject) return;
    setObjetivos(currentProject.objetivos || '');
    setIndicadores(currentProject.indicadores || '');
    setInicio(currentProject.inicio || '');
    setDesarrollo(currentProject.desarrollo || '');
    setCierre(currentProject.cierre || '');
    setRecursos(currentProject.recursos || '');
    setEvaluacion(currentProject.evaluacion || '');
  }, [currentProject]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 3000);
    return () => clearTimeout(t);
  }, [toastVisible]);

  // Reset dependent selectors when parent changes
  useEffect(() => { setSelectedAsignatura(''); setSelectedOA(null); setSelectedHabilidad(''); }, [selectedNivel]);
  useEffect(() => { setSelectedOA(null); setSelectedHabilidad(''); }, [selectedAsignatura]);

  // Auto-fill OA text, indicadores, and habilidades when OA is selected
  useEffect(() => {
    if (!selectedOA) return;
    setObjetivos(selectedOA.oa_texto);
    updateProjectField('objetivos', selectedOA.oa_texto);
    setIndicadores(selectedOA.indicadores.map(i => `• ${i}`).join('\n'));
    updateProjectField('indicadores', selectedOA.indicadores.map(i => `• ${i}`).join('\n'));
    setSelectedHabilidad(selectedOA.habilidades[0] || '');
  }, [selectedOA]);

  const handleChange = (field: keyof ProjectData, setter: typeof setInicio) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    if (field) updateProjectField(field, e.target.value);
  };

  const handleSelectOA = (texto: string) => {
    if (texto) {
      const next = objetivos + (objetivos ? '\n\n' : '') + texto;
      setObjetivos(next);
      updateProjectField('objetivos', next);
    }
  };

  const handleGenerate = (section: SectionKey) => {
    setIsGenerating(true);
    setTimeout(() => {
      const suggestion = MOCK_SUGGESTIONS[section];
      setSuggestionModal({ section, suggestion, edited: suggestion });
      setIsGenerating(false);
    }, 900);
  };

  const handleInsertSuggestion = (text: string) => {
    if (!suggestionModal) return;
    const setter = { inicio: setInicio, desarrollo: setDesarrollo, cierre: setCierre }[suggestionModal.section];
    const field = suggestionModal.section as keyof ProjectData;
    setter(text);
    updateProjectField(field, text);
    setSuggestionModal(null);
    showToast('Contenido insertado correctamente.');
  };

  const handleEditSuggestion = (text: string) => {
    setSuggestionModal(prev => prev ? { ...prev, edited: text } : null);
  };

  const handleSaveToLibrary = () => {
    if (!currentProject) return;
    addToLibrary();
    showToast('¡Planificación guardada con éxito!');
    setTimeout(() => onNavigate?.('agente'), 800);
  };

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <Toast message={toastMessage} visible={toastVisible} />

      {suggestionModal && (
        <SuggestionModal
          state={suggestionModal}
          onInsert={handleInsertSuggestion}
          onCancel={() => setSuggestionModal(null)}
          onEdit={handleEditSuggestion}
        />
      )}

      {focusedSection && (
        <FloatingAssistant
          section={focusedSection}
          onAction={s => { setFocusedSection(null); handleGenerate(s); }}
          onClose={() => setFocusedSection(null)}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* ── Cascading selectors ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nivel</label>
            <select
              value={selectedNivel}
              onChange={e => setSelectedNivel(e.target.value)}
              style={selectStyle}
            >
              <option value="">Seleccionar nivel</option>
              {niveles.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Asignatura</label>
            <select
              value={selectedAsignatura}
              onChange={e => setSelectedAsignatura(e.target.value)}
              style={selectStyle}
              disabled={!selectedNivel}
            >
              <option value="">{selectedNivel ? 'Seleccionar asignatura' : 'Primero elige nivel'}</option>
              {selectedNivel && getAsignaturas(selectedNivel).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Objetivo (OA)</label>
            <select
              value={selectedOA?.oa_id || ''}
              onChange={e => {
                const oas = getOAs(selectedNivel, selectedAsignatura);
                setSelectedOA(oas.find(o => o.oa_id === e.target.value) || null);
              }}
              style={selectStyle}
              disabled={!selectedAsignatura}
            >
              <option value="">{selectedAsignatura ? 'Seleccionar OA' : 'Primero elige asignatura'}</option>
              {selectedNivel && selectedAsignatura && getOAs(selectedNivel, selectedAsignatura).map(o => (
                <option key={o.oa_id} value={o.oa_id}>{o.oa_id} — {o.oa_texto.slice(0, 60)}…</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Habilidad</label>
            <select
              value={selectedHabilidad}
              onChange={e => setSelectedHabilidad(e.target.value)}
              style={selectStyle}
              disabled={!selectedOA}
            >
              <option value="">{selectedOA ? 'Seleccionar habilidad' : 'Primero elige OA'}</option>
              {selectedOA?.habilidades.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* ── OA card with auto-filled text ── */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20, background: 'var(--card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted2)' }}>OBJETIVO DE APRENDIZAJE (OA)</div>
            <button className="primary" onClick={() => setIsSelectorOpen(!isSelectorOpen)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}>
              <Search size={12} /> Buscar OA
            </button>
          </div>
          {isSelectorOpen && (
            <div style={{ marginBottom: 12, padding: 12, border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--bg2)' }}>
              <SelectorOA onSelect={(oa) => { handleSelectOA(oa); setIsSelectorOpen(false); }} />
            </div>
          )}
          <textarea
            className="output"
            value={objetivos}
            onChange={handleChange('objetivos', setObjetivos)}
            placeholder="Haz clic en 'Buscar OA' o selecciona desde los filtros superiores..."
            style={{ minHeight: 60, fontSize: 16, fontWeight: 600, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
          />
          {selectedOA && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ fontSize: 11, background: 'var(--brand)', color: '#fff', padding: '2px 10px', borderRadius: 12, fontWeight: 500 }}>
                {selectedOA.oa_id}
              </span>
              {selectedOA.habilidades.map(h => (
                <span key={h} style={{ fontSize: 11, background: 'var(--bg2)', color: 'var(--ink2)', padding: '2px 10px', borderRadius: 12 }}>
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>



        <CollapsibleSection title="DETALLE DE ACTIVIDADES" icon={<Play size={20} />} defaultExpanded>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Inicio</label>
              <button
                className="small secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => handleGenerate('inicio')}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader size={12} className="spin" /> : <Sparkles size={12} />} IA
              </button>
            </div>
            <textarea
              className="output"
              value={inicio}
              onChange={handleChange('inicio', setInicio)}
              onFocus={() => setFocusedSection('inicio')}
              onBlur={() => setTimeout(() => setFocusedSection(null), 200)}
              style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Actividades de inicio, activación de conocimientos previos, motivación…"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Desarrollo</label>
              <button
                className="small secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => handleGenerate('desarrollo')}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader size={12} className="spin" /> : <Sparkles size={12} />} IA
              </button>
            </div>
            <textarea
              className="output"
              value={desarrollo}
              onChange={handleChange('desarrollo', setDesarrollo)}
              onFocus={() => setFocusedSection('desarrollo')}
              onBlur={() => setTimeout(() => setFocusedSection(null), 200)}
              style={{ minHeight: 200, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Estrategias de enseñanza, actividades principales, trabajo colaborativo…"
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>Cierre</label>
              <button
                className="small secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={() => handleGenerate('cierre')}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader size={12} className="spin" /> : <Sparkles size={12} />} IA
              </button>
            </div>
            <textarea
              className="output"
              value={cierre}
              onChange={handleChange('cierre', setCierre)}
              onFocus={() => setFocusedSection('cierre')}
              onBlur={() => setTimeout(() => setFocusedSection(null), 200)}
              style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
              placeholder="Síntesis, ticket de salida, retroalimentación, conexión con próxima clase…"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="RECURSOS Y MATERIALES" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={recursos}
            onChange={handleChange('recursos', setRecursos)}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Enlaces, archivos, referencias, materiales didácticos…"
          />
        </CollapsibleSection>

        <CollapsibleSection title="INSTRUMENTO DE EVALUACIÓN" icon={<FileText size={20} />}>
          <textarea
            className="output"
            value={evaluacion}
            onChange={handleChange('evaluacion', setEvaluacion)}
            style={{ minHeight: 120, fontFamily: 'sans-serif', resize: 'vertical', background: '#fff' }}
            placeholder="Criterios de evaluación, rúbrica, lista de cotejo, pauta de observación…"
          />
          <div className="btnrow" style={{ marginTop: 12 }}>
            <button className="primary"><Sparkles size={14} /> Generar plan completo</button>
            <button className="secondary" onClick={handleSaveToLibrary}><Plus size={14} /> Guardar en Biblioteca</button>
          </div>
        </CollapsibleSection>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 40px 20px; overflow-y: auto; }
        .modal { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); max-width: 680px; width: 100%; }
        .suggestion-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px; border-bottom: 1px solid var(--line); }
      `}</style>
    </div>
  );
}
