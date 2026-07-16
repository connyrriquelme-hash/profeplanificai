type InstitutionalRole = 'super_admin' | 'institution_admin' | 'coordinator' | 'teacher' | 'student';

interface AuthUser {
  id: string;
  institutionalRole?: InstitutionalRole;
  permissions?: string[];
  rol?: string;
}

export function canViewClassbook(user: AuthUser | null): boolean {
  if (!user) return false;
  const role = user.institutionalRole;
  if (role === 'super_admin' || role === 'institution_admin' || role === 'coordinator' || role === 'teacher') return true;
  if (user.permissions?.some(p => p.startsWith('classbook:'))) return true;
  return false;
}

export function canCreateSession(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:create') ?? false;
}

export function canEditSession(user: AuthUser | null, sessionTeacherId: string, userId: string): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  if (user.permissions?.includes('classbook:update')) return true;
  if (user.permissions?.includes('classbook:update_own') && sessionTeacherId === userId) return true;
  return false;
}

export function canCompleteSession(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:complete') ?? false;
}

export function canManageAttendance(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:attendance') ?? false;
}

export function canCreateObservation(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:observe') ?? false;
}

export function canReviewPlanning(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:review') ?? false;
}

export function canViewSignatureStatus(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:read') ?? false;
}

export function canSignSession(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:sign') ?? false;
}

export function canReadClassbook(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.institutionalRole === 'super_admin' || user.institutionalRole === 'institution_admin') return true;
  return user.permissions?.includes('classbook:read') ?? user.permissions?.includes('classbook:read_own') ?? false;
}
