import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Printer, FileDown, BookOpen,
  Trash, Accessibility, Loader2, AlertTriangle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';
import { api } from '../services/apiClient';
import type { UnidadDidactica, MetodologiaActiva } from '../../schemas/UnidadDidacticaSchema';

type NivelEducativo = '2 basico' | '5 basico' | '8 basico' | '1 medio' | '2 medio';
type Asignatura = 'Lenguaje y Comunicacion' | 'Matematica' | 'Ciencias Naturales' | 'Historia, Geografia y Cs. Sociales';

interface UnidadGuardada {
  id: string;
  createdAt: string;
  unidad: UnidadDidactica;
}

const NIVELES: NivelEducativo[] = ['2 basico', '5 basico', '8 basico', '1 medio', '2 medio'];
const METODOLOGIAS: { v: MetodologiaActiva; l: string }[] = [
  { v: 'Tradicional', l: 'Tradicional' },
  { v: 'ABP', l: 'Aprendizaje Basado en Proyectos (ABP)' },
  { v: 'Gamificacion', l: 'Gamificacion' },
  { v: 'Aula Invertida', l: 'Aula Invertida (Flipped Classroom)' },
  { v: 'Design Thinking', l: 'Design Thinking' },
];

const FALLBACK_ASIGNATURAS = ['Lenguaje y Comunicacion', 'Matematica', 'Ciencias Naturales', 'Historia, Geografia y Cs. Sociales'];

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
  const [generateError, setGenerateError] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const [unidad, setUnidad] = useState<UnidadDidactica | null>(null);
  const [unidadesGuardadas, setUnidadesGuardadas] = useState<UnidadGuardada[]>([]);
  const [loadingGuardadas, setLoadingGuardadas] = useState(false);
  const [errorGuardadas, setErrorGuardadas] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'generador' | 'organizador'>('generador');
  const [filtroAsignatura, setFiltroAsignatura] = useState('Matematica');
  const [d1Subjects, setD1Subjects] = useState<{name: string; objective_count: number}[]>([]);
  const [loadingD1, setLoadingD1] = useState(false);
  const [d1Error, setD1Error] = useState('');

  // Load D1 courses and subjects on mount
  useEffect(() => {
    setLoadingD1(true);
    Promise.all([
      fetch('/api/courses').then(r => r.json()).catch(() => {}),
      fetch('/api/subjects').then(r => r.json()).then(d => {
        const withObj = (d.data || []).filter((s: any) => s.objective_count > 0);
        setD1Subjects(withObj);
      }).catch(() => setD1Error('No se pudieron cargar asignaturas desde D1. Se usará lista local de emergencia.')),
    ]).finally(() => setLoadingD1(false));
  }, []);

  const cargarUnidadesGuardadas = useCallback(async () => {
    setLoadingGuardadas(true);
    setErrorGuardadas('');
    try {
      const res = await api.get<{ ok: boolean; data: UnidadGuardada[] }>('/api/materials/unidad-didactica');
      setUnidadesGuardadas(res.data || []);
    } catch (err) {
      setErrorGuardadas(err instanceof Error ? err.message : 'No se pudieron cargar las unidades guardadas.');
    } finally {
      setLoadingGuardadas(false);
    }
  }, []);

  // Load previously generated units (persisted in D1) on mount
  useEffect(() => {
    cargarUnidadesGuardadas();
  }, [cargarUnidadesGuardadas]);

  // Available subjects: D1 if available, fallback if empty
  const availableSubjects = d1Subjects.length > 0
    ? d1Subjects.map(s => s.name)
    : FALLBACK_ASIGNATURAS;

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
    setGenerateError('');
    setUsedFallback(false);

    try {
      const res = await api.post<{ ok: boolean; id: string; unidad: UnidadDidactica; usedFallback: boolean }>(
        '/api/materials/unidad-didactica',
        {
          titulo: unitName || undefined,
          nivel,
          metodologiaActiva: metodologia,
          oas,
          instructions: instructions || undefined,
        },
      );

      setUnidad(res.unidad);
      setUsedFallback(res.usedFallback);
      setVistaActiva('generador');
      // Refresca la lista guardada para que la unidad recién generada
      // aparezca en el Organizador sin tener que recargar la página.
      cargarUnidadesGuardadas();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'No se pudo generar la unidad. Intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const getFaseColor = (fase: string) => {
    if (fase.toLowerCase().includes('inicio')) return 'text-emerald-600 border-emerald-400';
    if (fase.toLowerCase().includes('desarrollo')) return 'text-[var(--primary)] border-[var(--primary)]';
    if (fase.toLowerCase().includes('cierre')) return 'text-rose-600 border-rose-400';
    return 'text-gray-600 border-gray-400';
  };

  return (
    <div className="w-full animate-fade-in">
      <SectionHeader
        icon={BookOpen}
        iconColor="#B5471F"
        title="Unidades Didacticas"
        description="Planifica unidades integradas con metodologias activas alineadas al MINEDUC."
      />

      <div className="flex flex-col xl:flex-row gap-5 mt-5">
        {/* Left: Config */}
        <aside className="w-full xl:w-[380px] shrink-0">
          <Card className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-theme-text">
              <Sparkles size={16} className="text-[var(--primary)]" />
              Configurar Unidad
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Nombre de la Unidad</label>
              <input
                type="text"
                value={unitName}
                onChange={e => setUnitName(e.target.value)}
                placeholder="Ej: Unidad 1: Mision Salvar el Ecosistema"
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Metodologia Activa</label>
              <select
                value={metodologia}
                onChange={e => setMetodologia(e.target.value as MetodologiaActiva)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
              >
                {METODOLOGIAS.map(m => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Nivel Educativo</label>
              <select
                value={nivel}
                onChange={e => setNivel(e.target.value as NivelEducativo)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
              >
                {NIVELES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--ink-soft)]">OAs por Asignatura</label>
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
                      className="w-full p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20"
                    >
                      {availableSubjects.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      {loadingD1 && <option disabled>Cargando asignaturas...</option>}
                      {d1Error && <option disabled>{d1Error}</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-0.5">Objetivo Curricular (OA)</label>
                    <textarea
                      value={oa.objective}
                      onChange={e => updateOa(index, 'objective', e.target.value)}
                      rows={2}
                      placeholder="Ej: OA 08: Mostrar que comprenden las proporciones..."
                      className="w-full p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1">Instrucciones Adicionales</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                rows={3}
                placeholder="Ej: Enfatizar problemas diarios con analogias sencillas..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200/80 bg-white text-sm text-theme-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-3 bg-[var(--success-bg)] border border-transparent rounded-xl p-3">
              <div className="flex items-center gap-2">
                <Accessibility size={16} className="text-[var(--success)]" />
                <span className="text-xs font-semibold text-[var(--success-ink)]">DUA:</span>
              </div>
              <select
                value={includeDua ? 'si' : 'no'}
                onChange={e => setIncludeDua(e.target.value === 'si')}
                className="flex-1 p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20"
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
              {generating ? 'Generando con IA (puede tardar unos segundos)...' : 'Disenar Unidad con IA'}
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
                        onChange={e => setFiltroAsignatura(e.target.value)}
                        className="p-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-theme-text focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/20"
                      >
                        {availableSubjects.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                        {loadingD1 && <option disabled>Cargando...</option>}
                      </select>
                    </div>
                  </div>

                  {loadingGuardadas && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                      <Loader2 size={14} className="animate-spin" /> Cargando unidades guardadas...
                    </div>
                  )}
                  {errorGuardadas && (
                    <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
                      <AlertTriangle size={14} /> {errorGuardadas}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4].map(slotIndex => {
                      const unidadesFiltradas = unidadesGuardadas.filter(item =>
                        item.unidad.asignatura.includes(filtroAsignatura)
                      );
                      const item = unidadesFiltradas[slotIndex];

                      return (
                        <div key={slotIndex} className={`flex flex-col border rounded-xl overflow-hidden ${
                          item ? 'bg-white border-[var(--border)] shadow-sm' : 'bg-gray-50 border-dashed border-gray-300 items-center justify-center min-h-[200px]'
                        }`}>
                          {item ? (
                            <>
                              <div className="p-3 border-b border-gray-100 bg-[var(--primary-tint)]/50">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">Unidad {slotIndex + 1}</span>
                                <h3 className="font-bold text-theme-text text-sm mt-0.5 truncate">{item.unidad.titulo}</h3>
                              </div>
                              <div className="p-3 space-y-2 flex-1 text-xs">
                                <p className="text-gray-600">
                                  <strong className="text-gray-800 block mb-0.5">Nivel:</strong>
                                  {item.unidad.nivel}
                                </p>
                                <p className="text-gray-600 line-clamp-2">
                                  <strong className="text-gray-800 block mb-0.5">Metodologia:</strong>
                                  {item.unidad.metodologiaActiva}
                                </p>
                                <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                                  {item.unidad.clases.length} Clases
                                </span>
                              </div>
                              <div className="p-2 border-t border-gray-100">
                                <button
                                  onClick={() => { setUnidad(item.unidad); setUsedFallback(false); setVistaActiva('generador'); }}
                                  className="w-full py-1.5 bg-[var(--primary-tint)] hover:brightness-95 text-[var(--primary)] rounded-lg text-xs font-semibold transition-colors"
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
              ) : generateError ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6">
                  <AlertTriangle size={40} className="mb-3 text-rose-400" />
                  <p className="text-sm font-semibold text-rose-600 mb-1">No se pudo generar la unidad</p>
                  <p className="text-xs text-gray-500 max-w-md">{generateError}</p>
                  <Button variant="ghost" size="sm" className="mt-4" onClick={handleGenerate}>Reintentar</Button>
                </div>
              ) : unidad ? (
                <div className="space-y-5">
                  {usedFallback && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl px-3 py-2.5">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>
                        Esta unidad se generó con una plantilla de respaldo porque la IA no pudo completar la generación esta vez.
                        El contenido es genérico — revisalo o presioná "Disenar Unidad con IA" de nuevo para intentar con la IA real.
                      </span>
                    </div>
                  )}

                  <div className="border-b border-gray-200/60 pb-4">
                    <h1 className="text-xl font-bold text-theme-text">{unidad.titulo}</h1>
                    <p className="text-[var(--primary)] font-medium text-sm mt-1">
                      Asignatura: {unidad.asignatura} · Nivel: {unidad.nivel}
                    </p>
                    <div className="mt-3 p-3 bg-[var(--primary-tint)] border border-[var(--border)] rounded-xl">
                      <p className="font-bold text-[var(--primary-ink)] text-xs uppercase tracking-wider mb-1">Metodologia Activa</p>
                      <p className="text-[var(--primary)] text-sm leading-relaxed">{unidad.metodologiaActiva}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-theme-text">Fases de la Unidad</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[...unidad.fases].sort((a, b) => a.orden - b.orden).map((fase) => (
                        <div key={fase.nombre} className="bg-gray-50 border border-gray-200/80 rounded-lg p-3">
                          <p className="font-bold text-xs text-theme-text mb-0.5">{fase.nombre}</p>
                          <p className="text-gray-600 text-xs leading-relaxed">{fase.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-theme-text">Secuencia de Clases</h2>
                    {[...unidad.clases].sort((a, b) => a.numero - b.numero).map((clase) => (
                      <div key={clase.numero} className="border border-gray-200/80 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                          <h3 className="font-bold text-sm text-theme-text">Clase {clase.numero}: {clase.tema}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            <strong className="text-gray-700">Fase:</strong> {clase.faseAsociada}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            <strong className="text-gray-700">Objetivo:</strong> {clase.objetivoEspecifico}
                          </p>
                        </div>

                        <div className="p-4 space-y-4">
                          {[
                            { label: 'Inicio', data: clase.estructuraClase.inicio, borderClass: 'border-emerald-400' },
                            { label: 'Desarrollo', data: clase.estructuraClase.desarrollo, borderClass: 'border-[var(--primary)]' },
                            { label: 'Cierre', data: clase.estructuraClase.cierre, borderClass: 'border-rose-400' },
                          ].map(({ label, data, borderClass }) => (
                            <section key={label} className={`space-y-1.5 border-l-2 ${borderClass} pl-4 py-1`}>
                              <h4 className={`font-bold text-xs ${getFaseColor(label)} flex items-center gap-1.5`}>
                                {label} ({data.tiempoMinutos} min)
                              </h4>
                              <p className="text-gray-600 text-xs leading-relaxed">{data.descripcion}</p>
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
