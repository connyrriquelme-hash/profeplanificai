const ADMIN_ROLES = new Set(['admin', 'administrator', 'super_admin', 'owner']);

export function isAdminUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  const obj = user as Record<string, unknown>;
  const role = String(obj.role ?? obj.perfil ?? obj.userRole ?? obj.rol ?? '').toLowerCase();
  return ADMIN_ROLES.has(role);
}

export function canAccessAdminTeachingTools(user: unknown): boolean {
  return isAdminUser(user);
}

export const ADMIN_ONLY_VIEW_IDS = new Set(['mis-clases', 'unidades-didacticas']);
