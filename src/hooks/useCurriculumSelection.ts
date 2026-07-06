import { useState, useCallback, useEffect } from 'react';

export interface CurriculumSelection {
  level?: string;
  subject?: string;
  objectiveCode?: string;
  objectiveText?: string;
  indicators?: string[];
  skills?: string[];
  criteria?: string[];
  tema?: string;
  curricularSkills?: CurricularSkillItem[];
}

export interface CurricularSkillItem {
  id: string;
  title: string;
  source: string;
  unidadId?: string;
  unidadNombre?: string;
}

interface CurriculumLevel {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  level_name: string;
}

interface CurriculumObjective {
  id: string;
  codigo_oa: string;
  descripcion: string;
  habilidades_csv?: string;
}

interface CurriculumIndicator {
  indicator_text: string;
  oa_code: string;
}

interface CurriculumSkill {
  id: string;
  code: string;
  official_text: string;
}

interface UseCurriculumSelectionOptions {
  initialLevel?: string;
  initialSubject?: string;
}

const LEVELS_FALLBACK = [
  'Pre-Kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
];

export function useCurriculumSelection(opts: UseCurriculumSelectionOptions = {}) {
  const [levels, setLevels] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<CurriculumObjective[]>([]);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [skills, setSkills] = useState<CurriculumSkill[]>([]);

  const [selection, setSelection] = useState<CurriculumSelection>({
    level: opts.initialLevel || '',
    subject: opts.initialSubject || '',
    objectiveCode: '',
    objectiveText: '',
    indicators: [],
    skills: [],
    criteria: [],
  });

  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingObjectives, setLoadingObjectives] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingCurricular, setLoadingCurricular] = useState(false);
  const [error, setError] = useState('');

  const fetchJSON = useCallback(async <T,>(url: string): Promise<T | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const json = await res.json();
      return json;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLevels(true);
      const json = await fetchJSON<{ data: CurriculumLevel[] }>('/api/curriculum/levels');
      if (!cancelled) {
        if (json?.data?.length) {
          setLevels(json.data.map(l => l.name));
        } else {
          setLevels(LEVELS_FALLBACK);
        }
        setLoadingLevels(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchJSON]);

  useEffect(() => {
    if (!selection.level) { setSubjects([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingSubjects(true);
      const json = await fetchJSON<{ data: CurriculumSubject[] }>(
        `/api/curriculum/subjects?level=${encodeURIComponent(selection.level!)}`
      );
      if (!cancelled) {
        setSubjects(json?.data?.map(s => s.name) || []);
        setLoadingSubjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selection.level, fetchJSON]);

  useEffect(() => {
    if (!selection.level || !selection.subject) { setObjectives([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingObjectives(true);
      const json = await fetchJSON<{ data: CurriculumObjective[] }>(
        `/api/curriculum/objectives?nivel=${encodeURIComponent(selection.level!)}&asignatura=${encodeURIComponent(selection.subject!)}&limit=200`
      );
      if (!cancelled) {
        setObjectives(json?.data || []);
        setLoadingObjectives(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selection.level, selection.subject, fetchJSON]);

  const loadIndicators = useCallback(async (oaCode: string) => {
    if (!oaCode) { setIndicators([]); return; }
    setLoadingIndicators(true);
    const json = await fetchJSON<{ indicators: CurriculumIndicator[] }>(
      `/api/curriculum/indicators?oa_code=${encodeURIComponent(oaCode)}`
    );
    setIndicators(json?.indicators?.map(i => i.indicator_text) || []);
    setLoadingIndicators(false);
  }, [fetchJSON]);

  const loadSkills = useCallback(async (objectiveId: string) => {
    if (!objectiveId) { setSkills([]); return; }
    setLoadingSkills(true);
    const json = await fetchJSON<{ data: CurriculumSkill[] }>(
      `/api/curriculum/skills?objective_id=${encodeURIComponent(objectiveId)}`
    );
    setSkills(json?.data || []);
    setLoadingSkills(false);
  }, [fetchJSON]);

  const updateSelection = useCallback((patch: Partial<CurriculumSelection>) => {
    setSelection(prev => ({ ...prev, ...patch }));
  }, []);

  const loadCurricularSkills = useCallback(async (objectiveId: string) => {
    if (!objectiveId) { updateSelection({ curricularSkills: [] }); return; }
    setLoadingCurricular(true);
    const json = await fetchJSON<{ data: any[] }>(
      `/api/curriculum/skills?objective_id=${encodeURIComponent(objectiveId)}&include=curricular`
    );
    const items: CurricularSkillItem[] = (json?.data || []).map((row: any) => ({
      id: row.id,
      title: row.title || row.name,
      source: row.source || 'curricular_skill',
      unidadId: row.unidad_id,
      unidadNombre: row.unidad_nombre,
    }));
    updateSelection({ curricularSkills: items });
    setLoadingCurricular(false);
  }, [fetchJSON, updateSelection]);

  const setLevel = useCallback((level: string) => {
    setSelection(prev => ({
      ...prev,
      level,
      subject: '',
      objectiveCode: '',
      objectiveText: '',
      indicators: [],
      skills: [],
      criteria: [],
    }));
  }, []);

  const setSubject = useCallback((subject: string) => {
    setSelection(prev => ({
      ...prev,
      subject,
      objectiveCode: '',
      objectiveText: '',
      indicators: [],
      skills: [],
      criteria: [],
    }));
  }, []);

  const setObjective = useCallback((codigo_oa: string, descripcion: string) => {
    setSelection(prev => ({
      ...prev,
      objectiveCode: codigo_oa,
      objectiveText: descripcion,
      indicators: [],
      skills: [],
      criteria: [],
      curricularSkills: [],
    }));
    loadIndicators(codigo_oa);
    const obj = objectives.find(o => o.codigo_oa === codigo_oa);
    if (obj?.id) {
      loadSkills(obj.id);
      loadCurricularSkills(obj.id);
    }
  }, [objectives, loadIndicators, loadSkills, loadCurricularSkills]);

  const setIndicatorsSelection = useCallback((inds: string[]) => {
    setSelection(prev => ({ ...prev, indicators: inds }));
  }, []);

  const setSkillsSelection = useCallback((skls: string[]) => {
    setSelection(prev => ({ ...prev, skills: skls }));
  }, []);

  const setCriteria = useCallback((criterios: string[]) => {
    setSelection(prev => ({ ...prev, criteria: criterios }));
  }, []);

  const addCriteria = useCallback((text: string) => {
    if (!text.trim()) return;
    setSelection(prev => ({
      ...prev,
      criteria: [...(prev.criteria || []), text.trim()],
    }));
  }, []);

  const removeCriteria = useCallback((index: number) => {
    setSelection(prev => ({
      ...prev,
      criteria: prev.criteria?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  const resetSelection = useCallback(() => {
    setSelection({ level: '', subject: '', objectiveCode: '', objectiveText: '', indicators: [], skills: [], criteria: [], curricularSkills: [] });
    setIndicators([]);
    setSkills([]);
  }, []);

  const loading = loadingLevels || loadingSubjects || loadingObjectives || loadingIndicators || loadingSkills || loadingCurricular;

  return {
    levels, subjects, objectives, indicators, skills,
    selection, loading, error,
    setLevel, setSubject, setObjective,
    setIndicatorsSelection, setSkillsSelection,
    setCriteria, addCriteria, removeCriteria,
    resetSelection,
    loadIndicators, loadSkills, loadCurricularSkills,
    updateSelection,
  };
}
