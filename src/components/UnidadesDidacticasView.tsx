import { useState, useEffect } from 'react';
import {
  Sparkles, Printer, FileDown, BookOpen, CheckCircle,
  ChevronLeft, ChevronRight, Trash, Accessibility, Loader2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';

type NivelEducativo = '2 basico' | '5 basico' | '8 basico' | '1 medio' | '2 medio';
type Asignatura = 'Lenguaje y Comunicacion' | 'Matematica' | 'Ciencias Naturales' | 'Historia, Geografia y Cs. Sociales';
type MetodologiaActiva = 'Tradicional' | 'ABP' | 'Gamificacion' | 'Aula Invertida' | 'Design Thinking';

interface UnidadGenerada {
  id: string;
  titulo: string;
  niveles: NivelEducativo[];
  oas: { subject: Asignatura; objective: string }[];
  enfoque: string;
  productoFinal: string;
  clases: ClaseUnidad[];
}

interface ClaseUnidad {
  id: string;
  numero: number;
  fase: string;
  asignaturas: string;
  inicio: FaseClase;
  desarrollo: FaseClase;
  cierre: FaseClase;
}

interface FaseClase {
  tiempo: number;
  dinamica: string;
  descripcion: string;
  rolDocente: string;
  rolEstudiante: string;
  evaluacion?: string;
}

const NIVELES: NivelEducativo[] = ['2 basico', '5 basico', '8 basico', '1 medio', '2 medio'];
const ASIGNATURAS: Asignatura[] = ['Lenguaje y Comunicacion', 'Matematica', 'Ciencias Naturales', 'Historia, Geografia y Cs. Sociales'];
const METODOLOGIAS: { v: MetodologiaActiva; l: string }[] = [
  { v: 'Tradicional', l: 'Tradicional' },
  { v: 'ABP', l: 'Aprendizaje Basado en Proyectos (ABP)' },
  { v: 'Gamificacion', l: 'Gamificacion' },
  { v: 'Aula Invertida', l: 'Aula Invertida (Flipped Classroom)' },
  { v: 'Design Thinking', l: 'Design Thinking' },
];

export function UnidadesDidacticasView() {
  const [unitName, setUnitName] = useState('');
  const [metodologia, setMetodologia] = useState<MetodologiaActiva>('Design Thinking');
  const [nivel, setNivel] = useState<NivelEducativo>('8 basico');
  const [oas, setOas] = useState<{ subject: Asignatura; objective: string }[]>([
    { subject: 'Matematica', objective: 'OA 08: Mostrar que comprenden las proporciones y fracciones...' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [includeDua, setIncludeDua] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [unidad, setUnidad] = useState<UnidadGenerada | null>(null);
  const [unidadesGuardadas, setUnidadesGuardadas] = useState<UnidadGenerada[]>([]);
  const [vistaActiva, setVistaActiva] = useState<'generador' | 'organizador'>('generador');
  const [filtroAsignatura, setFiltroAsignatura] = useState<Asignatura>('Matematica');

  useEffect(() => {}, []);

  const addOa = () => {
    setOas([...oas, { subject: 'Lenguaje y Comunicacion', objective: '' }]);
  };

  const updateOa = (index: number, field: 'subject' | 'objective', value: string) => {
    const newOas = [...oas];
    if (field === 'subject') newOas[index].subject = value as Asignatura;
    else newOas[index].objective = value;
    setOas(newOas);
  };

  const removeOa = (index: number) => {
    setOas(oas.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      await new Promise(r => setTimeout(r, 1500));

      let fases = ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4'];
      if (metodologia === 'Design Thinking') fases = ['Empatizar', 'Definir', 'Idear', 'Prototipar'];
      else if (metodologia === 'Gamificacion') fases = ['El Llamado', 'Mision 1', 'Mision 2', 'Jefe Final'];
      else if (metodologia === 'ABP') fases = ['Pregunta Guia', 'Investigacion', 'Desarrollo', 'Presentacion'];

      const newUnidad: UnidadGenerada = {
        id: `unidad-${Date.now()}`,
        titulo: unitName || `Unidad Integrada: ${oas.map(o => o.subject).join(', ')}`,
        niveles: [nivel],
        oas,
        enfoque: `Implementacion de ${metodologia} para lograr el aprendizaje integrado.`,
        productoFinal: 'Proyecto interdisciplinario final.',
        clases: fases.map((fase, idx) => ({
          id: `clase-${idx}`,
          numero: idx + 1,
          fase: `Clase ${idx + 1}: ${fase}`,
          asignaturas: oas.map(o => o.subject).join(', '),
          inicio: {
            tiempo: 15,
            dinamica: `Activacion ${metodologia}`,
            descripcion: 'Se presenta el desafio central o la narrativa al curso.',
            rolDocente: 'Facilitador.',
            rolEstudiante: 'Participante activo.',
          },
          desarrollo: {
            tiempo: 60,
            dinamica: 'Trabajo Colaborativo',
            descripcion: 'Desarrollo de actividades enfocadas en la fase metodologica. Uso intensivo de herramientas creativas.',
            rolDocente: 'Mediador.',
            rolEstudiante: 'Investigador y colaborador.',
          },
          cierre: {
            tiempo: 15,
            dinamica: 'Plenario',
            descripcion: 'Compartir avances.',
            evaluacion: 'Ticket de salida.',
            rolDocente: 'Moderador.',
            rolEstudiante: 'Expositor.',
          },
        })),
      };

      setUnidad(newUnidad);
      setUnidadesGuardadas(prev => [...prev, newUnidad]);
      setVistaActiva('generador');
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const getFaseColor = (fase: string) => {
    if (fase.toLowerCase().includes('inicio')) return 'text-emerald-600 border-emerald-400';
    if (fase.toLowerCase().includes('desarrollo')) return 'text-indigo-600 border-indigo-400';
    if (fase.toLowerCase().includes('cierre')) return 'text-rose-600 border-rose-400';
    return 'text-gray-600 border-gray-400';
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <SectionHeader
        icon={BookOpen}
        iconColor="#5F3475"
        title="Unidades Didacticas"
        description="Planifica unidades integradas con metodologias activas alineadas al MINEDUC."
      />

      <div className="flex flex-col xl:flex-row gap-5 mt-5">
        {/* Left: Config */}
        <aside className="w-full xl:w-[380px] shrink-0">
          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">
              <Sparkles size={16} className="text-theme-primary" />
              Configurar Unidad
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Nombre de la Unidad</label>
              <input
                type="text"
                value={unitName}
                onChange={e => setUnitName(e.target.value)}
                placeholder="Ej: Unidad 1: Mision Salvar el Ecosistema"
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Metodologia Activa</label>
              <select
                value={metodologia}
                onChange={e => setMetodologia(e.target.value as MetodologiaActiva)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              >
                {METODOLOGIAS.map(m => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Nivel Educativo</label>
              <select
                value={nivel}
                onChange={e => setNivel(e.target.value as NivelEducativo)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              >
                {NIVELES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-theme-secondary">OAs por Asignatura</label>
                <button onClick={addOa} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-lg transition-colors font-medium">
                  + Agregar OA
                </button>
              </div>

              {oas.map((oa, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200/80 p-3 rounded-xl space-y-2 relative group">
                  {oas.length > 1 && (
                    <button onClick={() => removeOa(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash size={14} />
                    </button>
                  )}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Asignatura</label>
                    <select
                      value={oa.subject}
                      onChange={e => updateOa(index, 'subject', e.target.value)}
                      className="w-full p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                    >
                      {ASIGNATURAS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Objetivo Curricular (OA)</label>
                    <textarea
                      value={oa.objective}
                      onChange={e => updateOa(index, 'objective', e.target.value)}
                      rows={2}
                      placeholder="Ej: OA 08: Mostrar que comprenden las proporciones..."
                      className="w-full p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-1">Instrucciones Adicionales</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={3}
                placeholder="Ej: Enfatizar problemas diarios con analogias sencillas..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-200/80 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Accessibility size={16} className="text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">DUA:</span>
              </div>
              <select
                value={includeDua ? 'si' : 'no'}
                onChange={e => setIncludeDua(e.target.value === 'si')}
                className="flex-1 p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              >
                <option value="no">Normal</option>
                <option value="si">Lectura Facil (Visual)</option>
              </select>
            </div>

            <Button
              variant="premium"
              size="lg"
              iconLeft={generating ? Loader2 : Sparkles}
              loading={generating}
              onClick={handleGenerate}
              className="w-full"
            >
              {generating ? 'Estructurando Fase...' : 'Disenar Unidad con IA'}
            </Button>
          </Card>
        </aside>

        {/* Right: Preview */}
        <section className="flex-1 min-w-0">
          <Card className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVistaActiva('generador')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    vistaActiva === 'generador' ? 'bg-gray-100 text-theme-text' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Generador
                </button>
                <button
                  onClick={() => setVistaActiva('organizador')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    vistaActiva === 'organizador' ? 'bg-gray-100 text-theme-text' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Organizador Visual
                </button>
              </div>

              <div className="flex items-center gap-2">
                {unidad && (
                  <span className="text-xs font-semibold text-theme-text max-w-[200px] truncate hidden sm:block">
                    {unidad.titulo}
                  </span>
                )}
                <Button variant="ghost" size="sm" iconLeft={Printer} onClick={handlePrint}>Imprimir</Button>
                <Button variant="ghost" size="sm" iconLeft={FileDown} onClick={handlePrint}>Exportar</Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {vistaActiva === 'organizador' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 border border-gray-200/80 p-4 rounded-xl">
                    <h2 className="text-base font-bold text-theme-text">Organizador Anual</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Asignatura:</span>
                      <select
                        value={filtroAsignatura}
                        onChange={e => setFiltroAsignatura(e.target.value as Asignatura)}
                        className="p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                      >
                        {ASIGNATURAS.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4].map(slotIndex => {
                      const unidadesFiltradas = unidadesGuardadas.filter(u =>
                        u.oas.some(o => o.subject === filtroAsignatura)
                      );
                      const unit = unidadesFiltradas[slotIndex];

                      return (
                        <div key={slotIndex} className={`flex flex-col border rounded-xl overflow-hidden ${
                          unit ? 'bg-white border-indigo-200 shadow-sm' : 'bg-gray-50 border-dashed border-gray-300 items-center justify-center min-h-[200px]'
                        }`}>
                          {unit ? (
                            <>
                              <div className="p-3 border-b border-gray-100 bg-indigo-50/50">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Unidad {slotIndex + 1}</span>
                                <h3 className="font-bold text-theme-text text-sm mt-0.5 truncate">{unit.titulo}</h3>
                              </div>
                              <div className="p-3 space-y-2 flex-1 text-xs">
                                <p className="text-gray-600">
                                  <strong className="text-gray-800 block mb-0.5">Niveles:</strong>
                                  {unit.niveles.join(', ')}
                                </p>
                                <p className="text-gray-600 line-clamp-2">
                                  <strong className="text-gray-800 block mb-0.5">Metodologia:</strong>
                                  {unit.enfoque}
                                </p>
                                <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                                  {unit.clases.length} Clases
                                </span>
                              </div>
                              <div className="p-2 border-t border-gray-100">
                                <button
                                  onClick={() => { setUnidad(unit); setVistaActiva('generador'); }}
                                  className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  Ver Unidad
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4 space-y-2 opacity-40">
                              <BookOpen size={24} className="mx-auto" />
                              <p className="text-[11px] font-semibold">Slot Disponible</p>
                              <p className="text-[10px]">Crea una unidad nueva.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : unidad ? (
                <div className="space-y-5">
                  <div className="border-b border-gray-200/60 pb-4">
                    <h1 className="text-xl font-bold text-theme-text">{unidad.titulo}</h1>
                    <p className="text-indigo-600 font-medium text-sm mt-1">
                      Asignaturas: {unidad.oas.map(o => o.subject).join(', ')} · Niveles: {unidad.niveles.join(', ')}
                    </p>
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200/60 rounded-xl">
                      <p className="font-bold text-indigo-700 text-xs uppercase tracking-wider mb-1">Enfoque Metodologico</p>
                      <p className="text-indigo-600 text-sm leading-relaxed">{unidad.enfoque}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-theme-text">Secuencia de Clases</h2>
                    {unidad.clases.map((clase) => (
                      <div key={clase.id} className="border border-gray-200/80 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                          <h3 className="font-bold text-sm text-theme-text">{clase.fase}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            <strong className="text-gray-700">Asignaturas:</strong> {clase.asignaturas}
                          </p>
                        </div>

                        <div className="p-4 space-y-4">
                          {[
                            { label: 'Inicio', data: clase.inicio, borderClass: 'border-emerald-400' },
                            { label: 'Desarrollo', data: clase.desarrollo, borderClass: 'border-indigo-400' },
                            { label: 'Cierre', data: clase.cierre, borderClass: 'border-rose-400' },
                          ].map(({ label, data, borderClass }) => (
                            <section key={label} className={`space-y-1.5 border-l-2 ${borderClass} pl-4 py-1`}>
                              <h4 className={`font-bold text-xs ${getFaseColor(label)} flex items-center gap-1.5`}>
                                {label} ({data.tiempo} min)
                              </h4>
                              <div className="space-y-0.5">
                                <p className="font-semibold text-gray-800 text-[11px]">{data.dinamica}</p>
                                <p className="text-gray-600 text-xs leading-relaxed">{data.descripcion}</p>
                                <div className="flex gap-4 mt-1.5 text-[10px] text-gray-500">
                                  <span><strong className="text-gray-700">Docente:</strong> {data.rolDocente}</span>
                                  <span><strong className="text-gray-700">Estudiante:</strong> {data.rolEstudiante}</span>
                                </div>
                                {data.evaluacion && (
                                  <div className="mt-1.5 text-[10px] text-rose-600 bg-rose-50 p-2 rounded border border-rose-200/60">
                                    <strong>Evaluacion Formativa:</strong> {data.evaluacion}
                                  </div>
                                )}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                  <BookOpen size={48} className="mb-3 opacity-20" />
                  <p className="text-sm">Configura y estructura tu unidad para comenzar.</p>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
