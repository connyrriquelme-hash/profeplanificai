import { describe, it, expect } from 'vitest';
import {
  getLevelProfile,
  getSubjectProfile,
  isLowerLevel,
  getAllLevelProfiles,
  getAllSubjectProfiles,
  type LevelCycle,
} from '../src/utils/pedagogicalProductProfiles';

describe('pedagogicalProductProfiles', () => {
  describe('getLevelProfile', () => {
    it('returns parvularia for pre-kinder', () => {
      const p = getLevelProfile('Pre-Kinder');
      expect(p.cycle).toBe('parvularia');
    });

    it('returns parvularia for kinder', () => {
      const p = getLevelProfile('Kinder');
      expect(p.cycle).toBe('parvularia');
    });

    it('returns basico_1_2 for 1° básico', () => {
      const p = getLevelProfile('1° Básico');
      expect(p.cycle).toBe('basico_1_2');
    });

    it('returns basico_3_4 for 4° básico', () => {
      const p = getLevelProfile('4° Básico');
      expect(p.cycle).toBe('basico_3_4');
    });

    it('returns basico_5_6 for 6° básico', () => {
      const p = getLevelProfile('6° Básico');
      expect(p.cycle).toBe('basico_5_6');
    });

    it('returns basico_7_8 for 7° básico', () => {
      const p = getLevelProfile('7° Básico');
      expect(p.cycle).toBe('basico_7_8');
    });

    it('returns medio_1_2 for 1° medio', () => {
      const p = getLevelProfile('1° Medio');
      expect(p.cycle).toBe('medio_1_2');
    });

    it('returns medio_3_4 for 3° medio', () => {
      const p = getLevelProfile('3° Medio');
      expect(p.cycle).toBe('medio_3_4');
    });

    it('returns medio_3_4 for 4° medio', () => {
      const p = getLevelProfile('4° Medio');
      expect(p.cycle).toBe('medio_3_4');
    });

    it('defaults to basico_5_6 for unknown level', () => {
      const p = getLevelProfile('Desconocido');
      expect(p.cycle).toBe('basico_5_6');
    });
  });

  describe('isLowerLevel', () => {
    it('returns true for pre-kinder', () => {
      expect(isLowerLevel('Pre-Kinder')).toBe(true);
    });

    it('returns true for kinder', () => {
      expect(isLowerLevel('Kinder')).toBe(true);
    });

    it('returns true for 1° básico', () => {
      expect(isLowerLevel('1° Básico')).toBe(true);
    });

    it('returns true for 4° básico', () => {
      expect(isLowerLevel('4° Básico')).toBe(true);
    });

    it('returns false for 5° básico', () => {
      expect(isLowerLevel('5° Básico')).toBe(false);
    });

    it('returns false for 8° básico', () => {
      expect(isLowerLevel('8° Básico')).toBe(false);
    });

    it('returns false for 1° medio', () => {
      expect(isLowerLevel('1° Medio')).toBe(false);
    });

    it('returns false for 4° medio', () => {
      expect(isLowerLevel('4° Medio')).toBe(false);
    });
  });

  describe('getAllLevelProfiles', () => {
    it('returns 7 level cycles', () => {
      const profiles = getAllLevelProfiles();
      expect(profiles.length).toBe(7);
    });

    it('each profile has a cycle', () => {
      const profiles = getAllLevelProfiles();
      profiles.forEach(p => {
        expect(p.cycle).toBeDefined();
        expect(p.label).toBeDefined();
      });
    });
  });

  describe('getSubjectProfile', () => {
    it('returns lenguaje profile', () => {
      const p = getSubjectProfile('Lenguaje y Comunicación');
      expect(p.id).toBe('lenguaje');
      expect(p.displayName).toBeDefined();
    });

    it('returns matematica profile', () => {
      const p = getSubjectProfile('Matemática');
      expect(p.id).toBe('matematica');
    });

    it('returns ciencias profile', () => {
      const p = getSubjectProfile('Ciencias Naturales');
      expect(p.id).toBe('ciencias');
    });

    it('returns historia profile', () => {
      const p = getSubjectProfile('Historia y Geografía');
      expect(p.id).toBe('historia');
    });

    it('returns musica profile', () => {
      const p = getSubjectProfile('Música');
      expect(p.id).toBe('musica');
    });

    it('returns edufisica profile', () => {
      const p = getSubjectProfile('Educación Física');
      expect(p.id).toBe('edufisica');
    });

    it('returns filosofia profile', () => {
      const p = getSubjectProfile('Filosofía');
      expect(p.id).toBe('filosofia');
    });

    it('returns ciencias profile for biologia', () => {
      const p = getSubjectProfile('Biología');
      expect(p.id).toBe('ciencias');
    });

    it('returns fisica profile', () => {
      const p = getSubjectProfile('Física');
      expect(p.id).toBe('fisica');
    });

    it('returns quimica profile', () => {
      const p = getSubjectProfile('Química');
      expect(p.id).toBe('quimica');
    });

    it('returns ciencias_ciudadania profile', () => {
      const p = getSubjectProfile('Ciencias para la Ciudadanía');
      expect(p.id).toBe('ciencias_ciudadania');
    });

    it('returns parvularia profile', () => {
      const p = getSubjectProfile('Educación Parvularia');
      expect(p.id).toBe('parvularia');
    });

    it('returns defaults for unknown subject', () => {
      const p = getSubjectProfile('Materia Exótica');
      expect(p.id).toBeDefined();
      expect(p.aliases).toBeDefined();
    });
  });

  describe('getAllSubjectProfiles', () => {
    it('returns at least 15 subject profiles', () => {
      const profiles = getAllSubjectProfiles();
      expect(profiles.length).toBeGreaterThanOrEqual(15);
    });

    it('each profile has required fields', () => {
      const profiles = getAllSubjectProfiles();
      profiles.forEach(p => {
        expect(p.id).toBeDefined();
        expect(p.displayName).toBeDefined();
        expect(p.pptVisualStyle).toBeDefined();
        expect(p.pptTableType).toBeDefined();
      });
    });
  });
});
