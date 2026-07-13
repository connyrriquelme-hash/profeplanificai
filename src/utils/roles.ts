const ADMIN_ROLES = new Set(['admin', 'administrator', 'super_admin', 'owner']);
const LEGACY_ADMIN_ROLES = new Set(['admin', 'administrator', 'super_admin', 'owner', 'institution_admin']);

export function isAdminUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const obj = user as Record<string, unknown>;
  
  // Priority 1: institutionalRole (new authorization system)
  const institutionalRole = String(obj.institutionalRole ?? '').toLowerCase();
  if (['super_admin', 'institution_admin'].includes(institutionalRole)) {
    return true;
  }
  
  // Priority 2: permissions (new authorization system)
  const permissions = obj.permissions as string[] | undefined;
  if (permissions && permissions.some(p => p.startsWith('institution:') || p === 'institution:*' || p.startsWith('user:'))) {
    return true;
  }
  
  // Priority 3: legacy rol fallback (deprecated)
  const legacyRole = String(obj.role ?? obj.perfil ?? obj.userRole ?? obj.rol ?? '').toLowerCase();
  return LEGACY_ADMIN_ROLES.has(legacyRole);
}

export function canAccessAdminTeachingTools(user: unknown): boolean {
  // Check new authorization system first
  if (!user || typeof user !== 'object') return false;
  const obj = user as Record<string, unknown>;
  
  const institutionalRole = String(obj.institutionalRole ?? '').toLowerCase();
  if (['super_admin', 'institution_admin'].includes(institutionalRole)) {
    return true;
  }
  
  const permissions = obj.permissions as string[] | undefined;
  if (permissions && permissions.some(p => p.startsWith('course:') || p.startsWith('plan:'))) {
    return true;
  }
  
  // Legacy fallback
  return isAdminUser(user);
}

export const ADMIN_ONLY_VIEW_IDS = new Set(['mis-clases', 'unidades-didacticas']);
