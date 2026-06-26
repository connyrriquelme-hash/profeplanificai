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
import { ClipboardCheck, Sparkles, Send, Printer, Download, Copy, Check, CopyPlus, Edit3, FileText, ClipboardEdit, ArrowRight, ArrowLeft, BookOpen, GraduationCap, FileCheck2, ClipboardList, ListChecks, BarChart3, Eye, Plus } from 'lucide-react';
import { AdaptarPanel } from './AdaptarPanel';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { IconBadge } from './ui/IconBadge';
import { EmptyState } from './ui/EmptyState';
import { SectionHeader } from './ui/SectionHeader';

interface EvaluacionesViewProps {
  onNavigate: (view: string) => void;
}

const STEPS = ['Configuración', 'Contenido', 'Personalización'];

const QUICK_ACTIONS = [
  { icon: FileCheck2, label: 'Crear prueba', tipo: 'Prueba', desc: 'Diseña una prueba escrita con preguntas de desarrollo y selección múltiple.', color: '#7c3aed' },
  { icon: ClipboardCheck, label: 'Crear rúbrica', tipo: 'Rúbrica', desc: 'Define criterios, niveles de logro y descriptores para evaluar.', color: '#0d9488' },
  { icon: ClipboardList, label: 'Ticket de salida', tipo: 'Ticket de salida', desc: 'Preguntas breves para cerrar la clase y verificar aprendizajes.', color: '#2563eb' },
  { icon: ListChecks, label: 'Evaluación formativa', tipo: 'Evaluación formativa', desc: 'Instrumento continuo para monitorear el progreso estudiantil.', color: '#ea580c' },
  { icon: BarChart3, label: 'Evaluación tipo SIMCE', tipo: 'Evaluación tipo SIMCE', desc: 'Preguntas con alternativas, tabla de especificaciones y pauta.', color: '#d97706' },
  { icon: FileText, label: 'Lista de cotejo', tipo: 'Lista de cotejo', desc: 'Indicadores de logro con cumplimiento sí/no y observaciones.', color: '#16a34a' },
];

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

  const handleQuickAction = (actionTipo: string) => {
    setTipo(actionTipo);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <Card className="bg-gradient-to-br from-violet-50 to-pink-50/50 border-violet-100/80 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconBadge icon={ClipboardCheck} size="xl" color="#7c3aed" variant="gradient" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Evaluaciones</h1>
                <Badge color="violet" size="md">Evaluación inteligente</Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
                Crea, organiza y adapta instrumentos evaluativos alineados al currículum chileno.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" iconLeft={Eye} onClick={() => setShowSaved(!showSaved)}>
              {showSaved ? 'Ocultar' : `Mis instrumentos`}
            </Button>
            {savedMaterials.length > 0 && (
              <Badge color="violet" size="sm">{savedMaterials.length}</Badge>
            )}
          </div>
        </div>
      </Card>

      <SectionHeader
        icon={Sparkles}
        iconColor="#7c3aed"
        title="Acciones rápidas"
        description="Selecciona el tipo de instrumento evaluativo que deseas crear."
        className="mb-4"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {QUICK_ACTIONS.map(action => (
          <Card
            key={action.tipo}
            variant="interactive"
            className="p-4"
            onClick={() => handleQuickAction(action.tipo)}
          >
            <div className="flex items-start gap-3">
              <IconBadge icon={action.icon} size="md" color={action.color} variant="soft" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{action.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100/80">
        <div className="flex items-start gap-4">
          <IconBadge icon={BarChart3} size="lg" color="#d97706" variant="gradient" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge color="amber" size="sm">SIMCE</Badge>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Preparación tipo SIMCE</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Diseña preguntas de selección múltiple, comprensión lectora, resolución de problemas y análisis de habilidades con tabla de especificaciones y pauta de corrección.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="primary" size="sm" iconLeft={Plus} onClick={() => handleQuickAction('Evaluación tipo SIMCE')}>
                Crear evaluación tipo SIMCE
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {showSaved && (
        <Card className="mb-6">
          <SectionHeader
            icon={Eye}
            iconColor="#7c3aed"
            title="Instrumentos guardados"
            description={`${savedMaterials.length} instrumento(s) en tu biblioteca personal.`}
          />
          <div className="mt-3">
            <MaterialList items={savedMaterials} onCargar={cargarMaterial} onEliminar={handleEliminar} />
          </div>
        </Card>
      )}

      <Stepper steps={STEPS} current={step} />

      {step === 1 && (
        <Card className="mb-6">
          <SectionHeader icon={FileText} iconColor="#7c3aed" title="Paso 1: Configuración" description="Define el tipo, nivel y asignatura de la evaluación." className="mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <FileCheck2 size={13} className="text-violet-600" strokeWidth={2.25} />
                Tipo de evaluación
              </label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm appearance-none cursor-pointer">
                {EVAL_TIPOS.map((t) => <option key={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <GraduationCap size={13} className="text-violet-600" strokeWidth={2.25} />
                Nivel
              </label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm appearance-none cursor-pointer">
                {NIVELES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <BookOpen size={13} className="text-violet-600" strokeWidth={2.25} />
                Asignatura
              </label>
              <select value={asignatura} onChange={(e) => setAsignatura(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm appearance-none cursor-pointer">
                {ASIGNATURAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <ClipboardCheck size={13} className="text-violet-600" strokeWidth={2.25} />
                Habilidad principal
              </label>
              <select value={habilidad} onChange={(e) => setHabilidad(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm appearance-none cursor-pointer">
                {HABILIDADES.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
            <Button variant="primary" iconRight={ArrowRight} onClick={() => setStep(2)}>Siguiente</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <Card>
            <SectionHeader icon={BookOpen} iconColor="#7c3aed" title="Paso 2: Contenido (OA e Indicadores)" description="Selecciona un OA desde el Banco Curricular o completa el campo manualmente." className="mb-4" />
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">OA / habilidad</label>
              <button onClick={handleBuscarOA} className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1">
                <BookOpen size={11} strokeWidth={2.25} /> Buscar en banco OA
              </button>
            </div>
            <textarea
              value={oa}
              onChange={(e) => setOa(e.target.value)}
              placeholder="Pega el OA aquí o selecciona desde el Banco OA..."
              className="w-full min-h-[50px] px-3 py-2 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm resize-y"
            />
            {selectedItem && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 text-xs text-gray-600">
                <code className="font-bold text-violet-700">{selectedItem.id}</code>
                <span className="text-gray-400 ml-2">{selectedItem.curso} · {selectedItem.eje}</span>
              </div>
            )}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => setStep(1)}>Atrás</Button>
              <Button variant="primary" iconRight={ArrowRight} onClick={() => setStep(3)}>Siguiente</Button>
            </div>
          </Card>
          <Card>
            <SectionHeader icon={ClipboardList} iconColor="#7c3aed" title="Indicadores de evaluación" className="mb-3" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{selectedInds.size} de {indicadores.length} seleccionados</span>
              <div className="flex items-center gap-1.5">
                <button onClick={selectAllInds} className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors px-2 py-1 rounded-lg hover:bg-violet-50">Todo</button>
                <button onClick={deselectAllInds} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">Ninguno</button>
              </div>
            </div>
            {indicadores.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">
                Selecciona un OA desde el Banco OA para ver sus indicadores.
              </p>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {indicadores.map((ind, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedInds.has(i) ? 'bg-violet-50 border border-violet-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInds.has(i)}
                      onChange={() => toggleIndicador(i)}
                      className="mt-0.5 accent-violet-600"
                    />
                    <span className={`text-xs leading-relaxed ${selectedInds.has(i) ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {ind}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card className="mb-6">
          <SectionHeader icon={Sparkles} iconColor="#7c3aed" title="Paso 3: Personalización y DUA" description="Configura dificultad, preguntas SIMCE (si aplica) y genera la evaluación." className="mb-5" />
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                <FileText size={13} className="text-violet-600" strokeWidth={2.25} />
                Dificultad
              </label>
              <select value={dificultad} onChange={(e) => setDificultad(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm appearance-none cursor-pointer">
                {DIFICULTADES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            {isSIMCE && (
              <>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <Badge color="amber" size="sm" className="mb-2">Evaluación tipo SIMCE</Badge>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Número de preguntas</label>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={nPreguntas}
                        onChange={(e) => setNPreguntas(parseInt(e.target.value) || 5)}
                        className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Texto base o tema</label>
                      <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Texto breve, situación o tema..."
                        className="w-full min-h-[60px] px-3 py-2 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all shadow-sm resize-y"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <Button variant="ghost" iconLeft={ArrowLeft} onClick={() => setStep(2)}>Atrás</Button>
            <Button variant="premium" iconLeft={Sparkles} onClick={handleGenerar}>
              Generar {isSIMCE ? 'SIMCE' : 'evaluación'}
            </Button>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900">Resultado</h2>
          {output && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button variant="secondary" size="sm" iconLeft={Sparkles} onClick={handleGuardar}>Guardar</Button>
              <Button variant="ghost" size="sm" iconLeft={Send} onClick={handleEnviarDrive}>Drive</Button>
              <Button variant="ghost" size="sm" iconLeft={ClipboardEdit} onClick={() => onNavigate('planificador')}>Planificar</Button>
              <Button variant="ghost" size="sm" iconLeft={Printer} onClick={handleImprimir}>Imprimir</Button>
              <Button variant="ghost" size="sm" iconLeft={Download} onClick={handleExportar}>Exportar</Button>
              <Button variant="ghost" size="sm" iconLeft={CopyPlus} onClick={handleDuplicar}>Duplicar</Button>
              <Button variant="ghost" size="sm" iconLeft={Edit3} onClick={handleEditar}>{editando ? 'Listo' : 'Editar'}</Button>
              <Button variant="ghost" size="sm" iconLeft={copied ? Check : Copy} onClick={handleCopiar}>
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          )}
        </div>
        <StatusBar message={status} type={statusType} />
        {editando && output ? (
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            className="w-full min-h-[400px] font-mono text-sm p-3 rounded-xl bg-white border border-gray-200/80 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm resize-y mt-3"
          />
        ) : (
          <div className="mt-3 bg-gray-50 rounded-xl p-4 max-h-[500px] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-sans">
            {output || <p className="text-gray-400 italic">La evaluación generada aparecerá aquí...</p>}
          </div>
        )}
      </Card>

      <AdaptarPanel
        item={selectedItem}
        contenidoOriginal={output}
        onStatus={(msg, type) => { setStatus(msg); setStatusType(type || ''); }}
      />
    </div>
  );
}
