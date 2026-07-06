import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Plus, X, CheckCircle2 } from 'lucide-react';
import { useCurriculumSelection, type CurriculumSelection } from '../hooks/useCurriculumSelection';

export type { CurriculumSelection };

interface CurriculumSelectorProps {
  value: CurriculumSelection;
  onChange: (selection: CurriculumSelection) => void;
  required?: boolean;
  compact?: boolean;
  showObjectives?: boolean;
  showCriteria?: boolean;
  showSkills?: boolean;
  className?: string;
}

const selectClass =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 disabled:cursor-not-allowed';

export function CurriculumSelector({
  value,
  onChange,
  required = false,
  compact = false,
  showObjectives = true,
  showCriteria = true,
  showSkills = true,
  className = '',
}: CurriculumSelectorProps) {
  const {
    levels, subjects, objectives, indicators, skills,
    selection, loading,
    setLevel, setSubject, setObjective,
    setIndicatorsSelection, setSkillsSelection,
    addCriteria, removeCriteria,
  } = useCurriculumSelection({
    initialLevel: value.level,
    initialSubject: value.subject,
  });

  const [criteriaInput, setCriteriaInput] = useState('');
  const [expandedOa, setExpandedOa] = useState(false);

  const handleChange = (patch: Partial<CurriculumSelection>) => {
    onChange({ ...selection, ...patch });
  };

  const handleLevelChange = (level: string) => {
    setLevel(level);
    handleChange({ level, subject: '', objectiveCode: '', objectiveText: '', indicators: [], skills: [], criteria: [] });
  };

  const handleSubjectChange = (subject: string) => {
    setSubject(subject);
    handleChange({ subject, objectiveCode: '', objectiveText: '', indicators: [], skills: [], criteria: [] });
  };

  const handleObjectiveSelect = (codigo_oa: string, descripcion: string) => {
    setObjective(codigo_oa, descripcion);
    handleChange({ objectiveCode: codigo_oa, objectiveText: descripcion, indicators: [], skills: [], curricularSkills: [] });
  };

  const handleIndicatorToggle = (ind: string) => {
    const current = selection.indicators || [];
    const next = current.includes(ind) ? current.filter(i => i !== ind) : [...current, ind];
    setIndicatorsSelection(next);
    handleChange({ indicators: next });
  };

  const handleSkillToggle = (skillText: string) => {
    const current = selection.skills || [];
    const next = current.includes(skillText) ? current.filter(s => s !== skillText) : [...current, skillText];
    setSkillsSelection(next);
    handleChange({ skills: next });
  };

  const handleAddCriteria = () => {
    if (!criteriaInput.trim()) return;
    addCriteria(criteriaInput.trim());
    const newCriteria = [...(selection.criteria || []), criteriaInput.trim()];
    handleChange({ criteria: newCriteria });
    setCriteriaInput('');
  };

  const handleRemoveCriteria = (index: number) => {
    removeCriteria(index);
    const newCriteria = (selection.criteria || []).filter((_, i) => i !== index);
    handleChange({ criteria: newCriteria });
  };

  const handleCriteriaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCriteria();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Nivel {required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={selection.level || ''}
            onChange={(e) => handleLevelChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar nivel</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Asignatura {required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={selection.subject || ''}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className={selectClass}
            disabled={!selection.level}
          >
            <option value="">{selection.level ? 'Seleccionar asignatura' : 'Primero elige nivel'}</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {showObjectives && selection.level && selection.subject && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Objetivo de Aprendizaje {required && <span className="text-red-400">*</span>}
          </label>
          {objectives.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {objectives.map((obj) => {
                const isSelected = selection.objectiveCode === obj.codigo_oa;
                return (
                  <button
                    key={obj.id || obj.codigo_oa}
                    type="button"
                    onClick={() => handleObjectiveSelect(obj.codigo_oa, obj.descripcion)}
                    className={`w-full text-left px-3.5 py-2.5 border-b border-slate-100 last:border-b-0 transition text-sm ${
                      isSelected
                        ? 'bg-violet-50 border-l-2 border-l-violet-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs font-bold text-violet-600 mt-0.5 flex-shrink-0">{obj.codigo_oa}</span>
                      <span className="text-slate-700 leading-relaxed">{obj.descripcion}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-violet-500 mt-0.5 flex-shrink-0 ml-auto" />}
                    </div>
                    {obj.habilidades_csv && (
                      <p className="text-[10px] text-slate-400 mt-1 ml-6">Habilidades: {obj.habilidades_csv}</p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No se encontraron OA para esta combinación.
            </p>
          )}
        </div>
      )}

      {selection.objectiveCode && indicators.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpandedOa(!expandedOa)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition mb-1.5"
          >
            {expandedOa ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Indicadores ({indicators.length})
          </button>
          {expandedOa && (
            <div className="space-y-1 pl-4 max-h-40 overflow-y-auto">
              {indicators.map((ind, i) => (
                <label key={i} className="flex items-start gap-2 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(selection.indicators || []).includes(ind)}
                    onChange={() => handleIndicatorToggle(ind)}
                    className="mt-0.5 accent-violet-600"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-900">{ind}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {showSkills && selection.objectiveCode && skills.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Habilidades</label>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((sk) => {
              const active = (selection.skills || []).includes(sk.official_text);
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => handleSkillToggle(sk.official_text)}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                    active
                      ? 'bg-violet-100 border-violet-300 text-violet-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {sk.code && <span className="font-mono opacity-60">{sk.code}</span>}
                  {sk.official_text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSkills && selection.objectiveCode && (selection.curricularSkills || []).length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Habilidades curriculares sugeridas
            <span className="text-slate-400 font-normal ml-1">(del currículum por OA)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(selection.curricularSkills || []).map((cs) => {
              const active = (selection.skills || []).includes(cs.title);
              return (
                <button
                  key={cs.id}
                  type="button"
                  onClick={() => handleSkillToggle(cs.title)}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                    active
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {active ? <CheckCircle2 size={10} className="text-emerald-500" /> : null}
                  {cs.title}
                  {cs.unidadNombre && <span className="text-slate-400 font-normal ml-0.5">({cs.unidadNombre})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSkills && selection.objectiveCode && selection.indicators && selection.indicators.length === 0 && skills.length === 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Habilidades {selection.skills && selection.skills.length > 0 && `(${selection.skills.length} seleccionadas)`}
          </label>
          <p className="text-[11px] text-slate-400 italic mb-1">No hay habilidades en la base. Puedes agregarlas manualmente:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={(selection.skills || []).join(', ')}
              onChange={(e) => handleChange({ skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Separadas por coma: Inferir, Analizar, Comunicar"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
        </div>
      )}

      {showCriteria && selection.objectiveCode && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Criterios de aprendizaje {selection.criteria && selection.criteria.length > 0 && `(${selection.criteria.length})`}
          </label>
          <p className="text-[11px] text-slate-400 italic mb-2">
            Puedes continuar sin criterios o agregarlos manualmente.
          </p>
          {selection.criteria && selection.criteria.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {selection.criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                  <span className="text-xs text-slate-700 flex-1">{c}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriteria(i)}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={criteriaInput}
              onChange={(e) => setCriteriaInput(e.target.value)}
              onKeyDown={handleCriteriaKeyDown}
              placeholder="Escribir criterio y presionar Enter"
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={handleAddCriteria}
              disabled={!criteriaInput.trim()}
              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-50"
            >
              <Plus size={12} />
              Agregar
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Loader2 size={12} className="animate-spin" />
          Cargando datos curriculares...
        </div>
      )}
    </div>
  );
}
