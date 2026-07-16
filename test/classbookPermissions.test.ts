import { describe, it, expect } from 'vitest';
import { canViewClassbook, canCreateSession, canEditSession, canCompleteSession, canManageAttendance, canCreateObservation, canReviewPlanning, canReadClassbook, canSignSession, canViewSignatureStatus } from '../src/utils/classbookPermissions';

describe('classbookPermissions', () => {
  describe('canViewClassbook', () => {
    it('allows super_admin', () => {
      expect(canViewClassbook({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canViewClassbook({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows coordinator', () => {
      expect(canViewClassbook({ id: '1', institutionalRole: 'coordinator' })).toBe(true);
    });
    it('allows teacher', () => {
      expect(canViewClassbook({ id: '1', institutionalRole: 'teacher' })).toBe(true);
    });
    it('denies student without permission', () => {
      expect(canViewClassbook({ id: '1', institutionalRole: 'student' })).toBe(false);
    });
    it('denies null user', () => {
      expect(canViewClassbook(null)).toBe(false);
    });
    it('allows user with classbook permission', () => {
      expect(canViewClassbook({ id: '1', permissions: ['classbook:read'] })).toBe(true);
    });
    it('allows user with any classbook: permission', () => {
      expect(canViewClassbook({ id: '1', permissions: ['classbook:create'] })).toBe(true);
    });
  });

  describe('canCreateSession', () => {
    it('allows super_admin', () => {
      expect(canCreateSession({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canCreateSession({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows teacher with classbook:create', () => {
      expect(canCreateSession({ id: '1', institutionalRole: 'teacher', permissions: ['classbook:create'] })).toBe(true);
    });
    it('denies teacher without permission', () => {
      expect(canCreateSession({ id: '1', institutionalRole: 'teacher' })).toBe(false);
    });
    it('denies coordinator without permission', () => {
      expect(canCreateSession({ id: '1', institutionalRole: 'coordinator' })).toBe(false);
    });
  });

  describe('canEditSession', () => {
    it('allows super_admin', () => {
      expect(canEditSession({ id: '1', institutionalRole: 'super_admin' }, 'teacher-1', '1')).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canEditSession({ id: '1', institutionalRole: 'institution_admin' }, 'teacher-1', '1')).toBe(true);
    });
    it('allows teacher with classbook:update', () => {
      expect(canEditSession({ id: '1', permissions: ['classbook:update'] }, 'teacher-1', '1')).toBe(true);
    });
    it('allows teacher with classbook:update_own for own session', () => {
      expect(canEditSession({ id: '1', permissions: ['classbook:update_own'] }, 'teacher-1', 'teacher-1')).toBe(true);
    });
    it('denies teacher with classbook:update_own for other session', () => {
      expect(canEditSession({ id: '1', permissions: ['classbook:update_own'] }, 'teacher-1', 'other')).toBe(false);
    });
    it('denies user without permission', () => {
      expect(canEditSession({ id: '1', institutionalRole: 'student' }, 'teacher-1', '1')).toBe(false);
    });
  });

  describe('canCompleteSession', () => {
    it('allows super_admin', () => {
      expect(canCompleteSession({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canCompleteSession({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:complete', () => {
      expect(canCompleteSession({ id: '1', permissions: ['classbook:complete'] })).toBe(true);
    });
    it('denies teacher without permission', () => {
      expect(canCompleteSession({ id: '1', institutionalRole: 'teacher' })).toBe(false);
    });
  });

  describe('canManageAttendance', () => {
    it('allows super_admin', () => {
      expect(canManageAttendance({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canManageAttendance({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:attendance', () => {
      expect(canManageAttendance({ id: '1', permissions: ['classbook:attendance'] })).toBe(true);
    });
    it('denies user without permission', () => {
      expect(canManageAttendance({ id: '1', institutionalRole: 'student' })).toBe(false);
    });
  });

  describe('canCreateObservation', () => {
    it('allows super_admin', () => {
      expect(canCreateObservation({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canCreateObservation({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:observe', () => {
      expect(canCreateObservation({ id: '1', permissions: ['classbook:observe'] })).toBe(true);
    });
    it('denies user without permission', () => {
      expect(canCreateObservation({ id: '1', institutionalRole: 'student' })).toBe(false);
    });
  });

  describe('canReviewPlanning', () => {
    it('allows super_admin', () => {
      expect(canReviewPlanning({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canReviewPlanning({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:review', () => {
      expect(canReviewPlanning({ id: '1', permissions: ['classbook:review'] })).toBe(true);
    });
    it('denies coordinator without permission', () => {
      expect(canReviewPlanning({ id: '1', institutionalRole: 'coordinator' })).toBe(false);
    });
    it('denies teacher without permission', () => {
      expect(canReviewPlanning({ id: '1', institutionalRole: 'teacher' })).toBe(false);
    });
  });

  describe('canViewSignatureStatus', () => {
    it('allows super_admin', () => {
      expect(canViewSignatureStatus({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canViewSignatureStatus({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:read', () => {
      expect(canViewSignatureStatus({ id: '1', permissions: ['classbook:read'] })).toBe(true);
    });
    it('denies teacher without permission', () => {
      expect(canViewSignatureStatus({ id: '1', institutionalRole: 'teacher' })).toBe(false);
    });
  });

  describe('canReadClassbook', () => {
    it('allows super_admin', () => {
      expect(canReadClassbook({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canReadClassbook({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:read', () => {
      expect(canReadClassbook({ id: '1', permissions: ['classbook:read'] })).toBe(true);
    });
    it('denies teacher without permission', () => {
      expect(canReadClassbook({ id: '1', institutionalRole: 'teacher' })).toBe(false);
    });
  });

  describe('canSignSession', () => {
    it('allows super_admin', () => {
      expect(canSignSession({ id: '1', institutionalRole: 'super_admin' })).toBe(true);
    });
    it('allows institution_admin', () => {
      expect(canSignSession({ id: '1', institutionalRole: 'institution_admin' })).toBe(true);
    });
    it('allows with classbook:sign', () => {
      expect(canSignSession({ id: '1', permissions: ['classbook:sign'] })).toBe(true);
    });
    it('denies teacher without permission', () => {
      expect(canSignSession({ id: '1', institutionalRole: 'teacher' })).toBe(false);
    });
  });
});
