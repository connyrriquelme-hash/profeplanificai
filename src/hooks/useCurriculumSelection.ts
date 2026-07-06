import { useState, useCallback, useEffect, useRef } from 'react';

export interface CurriculumSelection {
  level?: string;
  levelId?: string;
  subject?: string;
  subjectId?: string;
  objectiveId?: string;
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
  level_id: string;
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

interface CurriculumContextResponse {
  ok: boolean;
  data?: {
    indicators?: Array<{ description?: string; indicator_text?: string }>;
    skills?: Array<{ description?: string; official_text?: string }>;
  };
}

interface UseCurriculumSelectionOptions {
  initialLevel?: string;
  initialLevelId?: string;
  initialSubject?: string;
  initialSubjectId?: string;
  initialObjectiveId?: string;
  initialObjectiveCode?: string;
  initialObjectiveText?: string;
  initialIndicators?: string[];
  initialSkills?: string[];
  initialCriteria?: string[];
}

const LEVELS_FALLBACK = [
  'Pre-Kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
];

const _hookInstances = { current: 0 };

export function useCurriculumSelection(opts: UseCurriculumSelectionOptions = {}) {
  const instanceRef = useRef(++_hookInstances.current);
  const INST = instanceRef.current;

  const [levels, setLevels] = useState<string[]>([]);
  const [levelObjects, setLevelObjects] = useState<CurriculumLevel[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectObjects, setSubjectObjects] = useState<CurriculumSubject[]>([]);
  const [objectives, setObjectives] = useState<CurriculumObjective[]>([]);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [skills, setSkills] = useState<CurriculumSkill[]>([]);

  const [selection, setSelection] = useState<CurriculumSelection>({
    level: opts.initialLevel || '',
    levelId: opts.initialLevelId || '',
    subject: opts.initialSubject || '',
    subjectId: opts.initialSubjectId || '',
    objectiveId: opts.initialObjectiveId || '',
    objectiveCode: opts.initialObjectiveCode || '',
    objectiveText: opts.initialObjectiveText || '',
    indicators: opts.initialIndicators || [],
    skills: opts.initialSkills || [],
    criteria: opts.initialCriteria || [],
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
      console.debug(`[CURR-DBG#${INST}] fetchJSON → ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.debug(`[CURR-DBG#${INST}] fetchJSON ✗ ${url} status=${res.status}`);
        return null;
      }
      const json = await res.json();
      console.debug(`[CURR-DBG#${INST}] fetchJSON ✓ ${url} keys=${Object.keys(json || {})}`);
      return json;
    } catch (e) {
      console.debug(`[CURR-DBG#${INST}] fetchJSON CATCH ${url}`, e);
      return null;
    }
  }, [INST]);

  const parseCsv = useCallback((value?: string): string[] => {
    return (value || '').split(',').map((item) => item.trim()).filter(Boolean);
  }, []);

  // Load levels
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLevels(true);
      const json = await fetchJSON<{ data: CurriculumLevel[] }>('/api/curriculum/levels');
      if (!cancelled) {
        if (json?.data?.length) {
          console.debug(`[CURR-DBG#${INST}] LEVELS_LOADED count=${json.data.length}`, json.data.map(l => `${l.id}:${l.name}`));
          setLevelObjects(json.data);
          setLevels(json.data.map(l => l.name));
        } else {
          console.debug(`[CURR-DBG#${INST}] LEVELS_FALLBACK (API returned no data)`, json);
          setLevels(LEVELS_FALLBACK);
        }
        setLoadingLevels(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchJSON, INST]);

  // Load subjects when level changes (use level_id for exact match)
  useEffect(() => {
    const levelId = selection.levelId || levelObjects.find(l => l.name === selection.level)?.id || '';
    console.debug(`[CURR-DBG#${INST}] SUBJECTS_EFFECT triggered`, {
      selectionLevel: selection.level,
      selectionLevelId: selection.levelId,
      resolvedLevelId: levelId,
      levelObjectsCount: levelObjects.length,
    });
    if (!levelId) {
      console.debug(`[CURR-DBG#${INST}] SUBJECTS_EFFECT → BAIL: no levelId`);
      setSubjects([]);
      setSubjectObjects([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingSubjects(true);
      setError('');
      const url = `/api/curriculum/subjects?level_id=${encodeURIComponent(levelId)}`;
      console.debug(`[CURR-DBG#${INST}] SUBJECTS_FETCH → ${url}`);
      const json = await fetchJSON<{ data: CurriculumSubject[] }>(url);
      if (!cancelled) {
        const data = json?.data || [];
        console.debug(`[CURR-DBG#${INST}] SUBJECTS_RECEIVED`, {
          rawJsonKeys: Object.keys(json || {}),
          hasDataField: !!json?.data,
          dataLength: data.length,
          names: data.map(s => s.name),
          ids: data.map(s => s.id),
        });
        setSubjectObjects(data);
        setSubjects(data.map(s => s.name));
        setError(data.length === 0 ? 'No se encontraron asignaturas para este nivel' : '');
        setLoadingSubjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selection.levelId, selection.level, levelObjects, fetchJSON, INST]);

  // Load objectives when subject changes (use level_id + subject_id for exact match)
  useEffect(() => {
    const levelId = selection.levelId || levelObjects.find(l => l.name === selection.level)?.id || '';
    const subjectId = selection.subjectId || subjectObjects.find(s => s.name === selection.subject)?.id || '';
    console.debug(`[CURR-DBG#${INST}] OBJECTIVES_EFFECT triggered`, {
      selectionLevel: selection.level, selectionLevelId: selection.levelId, resolvedLevelId: levelId,
      selectionSubject: selection.subject, selectionSubjectId: selection.subjectId, resolvedSubjectId: subjectId,
    });
    if (!levelId || !subjectId) {
      console.debug(`[CURR-DBG#${INST}] OBJECTIVES_EFFECT → BAIL: missing levelId=${!!levelId} subjectId=${!!subjectId}`);
      setObjectives([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingObjectives(true);
      const url = `/api/curriculum/objectives?level_id=${encodeURIComponent(levelId)}&subject_id=${encodeURIComponent(subjectId)}&limit=200`;
      console.debug(`[CURR-DBG#${INST}] OBJECTIVES_FETCH → ${url}`);
      const json = await fetchJSON<{ data: CurriculumObjective[] }>(url);
      if (!cancelled) {
        const data = json?.data || [];
        console.debug(`[CURR-DBG#${INST}] OBJECTIVES_RECEIVED count=${data.length}`);
        setObjectives(data);
        setLoadingObjectives(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selection.levelId, selection.subjectId, selection.level, selection.subject, levelObjects, subjectObjects, fetchJSON, INST]);

  // Load exact OA context first; fallback to oa_code indicators for older data.
  const loadIndicators = useCallback(async (oaCode: string, objectiveId?: string) => {
    if (!oaCode) { setIndicators([]); return; }
    console.debug(`[CURR-DBG#${INST}] loadIndicators oa=${oaCode} objId=${objectiveId}`);
    setLoadingIndicators(true);
    if (objectiveId) {
      const contextJson = await fetchJSON<CurriculumContextResponse>(
        `/api/curriculum/context?objective_id=${encodeURIComponent(objectiveId)}`
      );
      const contextIndicators = contextJson?.data?.indicators
        ?.map((i) => i.description || i.indicator_text || '')
        .filter(Boolean) || [];
      const contextSkills = contextJson?.data?.skills
        ?.map((s) => s.description || s.official_text || '')
        .filter(Boolean) || [];
      if (contextSkills.length > 0) {
        setSelection(prev => ({ ...prev, skills: contextSkills }));
      }
      if (contextIndicators.length > 0) {
        console.debug(`[CURR-DBG#${INST}] loadIndicators from context: ${contextIndicators.length}`);
        setIndicators(contextIndicators);
        setLoadingIndicators(false);
        return;
      }
    }
    const json = await fetchJSON<{ indicators: CurriculumIndicator[] }>(
      `/api/curriculum/indicators?oa_code=${encodeURIComponent(oaCode)}`
    );
    const result = json?.indicators?.map(i => i.indicator_text) || [];
    console.debug(`[CURR-DBG#${INST}] loadIndicators from fallback: ${result.length}`);
    setIndicators(result);
    setLoadingIndicators(false);
  }, [fetchJSON, INST]);

  // Load skills by objective_id
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

  // Auto-select initial OA when objectives finish loading
  const initialOaRef = useRef(opts.initialObjectiveCode);
  useEffect(() => {
    if (!initialOaRef.current || objectives.length === 0) return;
    const code = initialOaRef.current;
    if (selection.objectiveCode && selection.objectiveCode !== code) return;
    const obj = objectives.find(o => o.codigo_oa === code);
    if (!obj) return;
    initialOaRef.current = undefined;
    setSelection(prev => ({
      ...prev,
      objectiveId: obj.id,
      objectiveCode: code,
      objectiveText: opts.initialObjectiveText || obj.descripcion,
      indicators: opts.initialIndicators || [],
      skills: opts.initialSkills || [],
      criteria: opts.initialCriteria || [],
    }));
    loadIndicators(code, obj.id);
    if (obj.id) {
      loadSkills(obj.id);
      loadCurricularSkills(obj.id);
    }
  }, [objectives, opts.initialObjectiveText, opts.initialIndicators, opts.initialSkills, opts.initialCriteria, loadIndicators, loadSkills, loadCurricularSkills, selection.objectiveCode]);

  const setLevel = useCallback((levelName: string) => {
    const obj = levelObjects.find(l => l.name === levelName);
    console.debug(`[CURR-DBG#${INST}] setLevel("${levelName}")`, {
      levelObjectsCount: levelObjects.length,
      foundObject: obj ? `${obj.id}:${obj.name}` : 'NOT_FOUND',
      resolvedId: obj?.id || '',
    });
    setSelection(prev => ({
      ...prev,
      level: levelName,
      levelId: obj?.id || '',
      subject: '',
      subjectId: '',
      objectiveId: '',
      objectiveCode: '',
      objectiveText: '',
      indicators: [],
      skills: [],
      criteria: [],
    }));
  }, [levelObjects, INST]);

  const setSubject = useCallback((subjectName: string) => {
    const obj = subjectObjects.find(s => s.name === subjectName);
    console.debug(`[CURR-DBG#${INST}] setSubject("${subjectName}")`, {
      subjectObjectsCount: subjectObjects.length,
      foundObject: obj ? `${obj.id}:${obj.name}` : 'NOT_FOUND',
    });
    setSelection(prev => ({
      ...prev,
      subject: subjectName,
      subjectId: obj?.id || '',
      objectiveId: '',
      objectiveCode: '',
      objectiveText: '',
      indicators: [],
      skills: [],
      criteria: [],
    }));
  }, [subjectObjects, INST]);

  const setObjective = useCallback((codigo_oa: string, descripcion: string, objectiveId?: string) => {
    const obj = objectives.find(o => o.codigo_oa === codigo_oa);
    const id = objectiveId || obj?.id || '';
    console.debug(`[CURR-DBG#${INST}] setObjective("${codigo_oa}")`, { id, objectivesCount: objectives.length });
    setSelection(prev => ({
      ...prev,
      objectiveId: id,
      objectiveCode: codigo_oa,
      objectiveText: descripcion,
      indicators: [],
      skills: parseCsv(obj?.habilidades_csv),
      criteria: [],
      curricularSkills: [],
    }));
    loadIndicators(codigo_oa, id);
    if (id) {
      loadSkills(id);
      loadCurricularSkills(id);
    }
  }, [objectives, parseCsv, loadIndicators, loadSkills, loadCurricularSkills, INST]);

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
    setSelection({ level: '', levelId: '', subject: '', subjectId: '', objectiveId: '', objectiveCode: '', objectiveText: '', indicators: [], skills: [], criteria: [], curricularSkills: [] });
    setIndicators([]);
    setSkills([]);
  }, []);

  const loading = loadingLevels || loadingSubjects || loadingObjectives || loadingIndicators || loadingSkills || loadingCurricular;

  return {
    levels, subjects, objectives, indicators, skills,
    levelObjects, subjectObjects,
    selection, loading, error,
    setLevel, setSubject, setObjective,
    setIndicatorsSelection, setSkillsSelection,
    setCriteria, addCriteria, removeCriteria,
    resetSelection,
    loadIndicators, loadSkills, loadCurricularSkills,
    updateSelection,
  };
}
