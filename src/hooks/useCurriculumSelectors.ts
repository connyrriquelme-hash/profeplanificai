import { useState, useCallback, useEffect } from 'react';
import {
  getCourses, getSubjects, getSubjectsByCourse,
  getObjectives, getIndicatorsByObjective, getSkillsByObjective,
  findPreferredSubject,
} from '../services/curriculumD1Service';

interface UseCurriculumSelectorsOptions {
  autoLoadCourses?: boolean;
  autoLoadSubjects?: boolean;
  initialCourseId?: string;
  initialSubjectId?: string;
}

export function useCurriculumSelectors(opts: UseCurriculumSelectorsOptions = {}) {
  const { autoLoadCourses = true, autoLoadSubjects = true, initialCourseId, initialSubjectId } = opts;

  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUsed, setFallbackUsed] = useState(false);

  // Load courses on mount
  useEffect(() => {
    if (!autoLoadCourses) return;
    (async () => {
      setLoading(true);
      try {
        const c = await getCourses();
        setCourses(c);
      } catch {
        setError('No se pudieron cargar cursos desde D1.');
        setFallbackUsed(true);
      } finally { setLoading(false); }
    })();
  }, [autoLoadCourses]);

  // Load subjects on mount or when course changes
  useEffect(() => {
    if (!autoLoadSubjects) return;
    (async () => {
      setLoading(true);
      try {
        const s = selectedCourseId ? await getSubjectsByCourse(selectedCourseId) : await getSubjects();
        setSubjects(s);
      } catch {
        setError('No se pudieron cargar asignaturas desde D1.');
        setFallbackUsed(true);
      } finally { setLoading(false); }
    })();
  }, [autoLoadSubjects, selectedCourseId]);

  // Load objectives when course+subject change
  const loadObjectives = useCallback(async (courseId: string, subjectId: string) => {
    if (!courseId || !subjectId) { setObjectives([]); return; }
    setLoading(true);
    try {
      const o = await getObjectives(courseId, subjectId);
      setObjectives(o);
    } catch {
      setError('No se pudieron cargar objetivos desde D1.');
      setObjectives([]);
    } finally { setLoading(false); }
  }, []);

  // Load indicators for an objective
  const loadIndicators = useCallback(async (oaCode: string) => {
    if (!oaCode) { setIndicators([]); return; }
    setLoading(true);
    try {
      const i = await getIndicatorsByObjective(oaCode);
      setIndicators(i);
    } catch {
      setError('No se pudieron cargar indicadores desde D1.');
      setIndicators([]);
    } finally { setLoading(false); }
  }, []);

  // Load skills for an objective
  const loadSkills = useCallback(async (objectiveId: string) => {
    if (!objectiveId) { setSkills([]); return; }
    setLoading(true);
    try {
      const s = await getSkillsByObjective(objectiveId);
      setSkills(s);
    } catch {
      setError('No se pudieron cargar habilidades desde D1.');
      setSkills([]);
    } finally { setLoading(false); }
  }, []);

  // Reset all selections
  const resetSelection = useCallback(() => {
    setSelectedCourseId('');
    setSelectedSubjectId('');
    setSelectedObjectiveIds([]);
    setObjectives([]);
    setIndicators([]);
    setSkills([]);
    setError('');
  }, []);

  return {
    courses, subjects, objectives, indicators, skills,
    selectedCourseId, selectedSubjectId, selectedObjectiveIds,
    setSelectedCourseId, setSelectedSubjectId, setSelectedObjectiveIds,
    loading, error, fallbackUsed,
    loadObjectives, loadIndicators, loadSkills, resetSelection,
    findPreferredSubject,
  };
}
