import { verifyToken } from '../_lib/auth';

export interface AuthEnv {
  DB: D1Database;
  JWT_SECRET?: string;
}

export type InstitutionalRole =
  | 'super_admin'
  | 'institution_admin'
  | 'coordinator'
  | 'teacher'
  | 'student';

export interface CoordinatorScope {
  institutionId: string;
  courseIds: string[];
  subjectIds: string[];
  levelIds: string[];
  academicYearIds: string[];
}

export interface AuthenticatedUserContext {
  userId: string;
  institutionId: string | null;
  role: InstitutionalRole;
  isActive: boolean;
  email?: string;
  nombre?: string;
  permissions: string[];
  scope?: CoordinatorScope;
}

export class AuthorizationError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
    };
  }
}

export function unauthorized(message = 'No autenticado'): AuthorizationError {
  return new AuthorizationError(401, 'UNAUTHENTICATED', message);
}

export function forbidden(message = 'Sin permisos'): AuthorizationError {
  return new AuthorizationError(403, 'FORBIDDEN', message);
}

export function inactiveUser(message = 'Usuario inactivo'): AuthorizationError {
  return new AuthorizationError(409, 'INACTIVE_USER', message);
}

export function notFound(message = 'Recurso no encontrado'): AuthorizationError {
  return new AuthorizationError(404, 'NOT_FOUND', message);
}

export const ROLE_PERMISSIONS: Record<InstitutionalRole, string[]> = {
  super_admin: [
    'institution:*',
    'user:*',
    'course:*',
    'plan:*',
    'classbook:*',
    'report:*',
    'config:*',
    'audit:*',
  ],
  institution_admin: [
    'institution:read',
    'institution:update',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'course:create',
    'course:read',
    'course:update',
    'course:assign_teacher',
    'plan:read',
    'classbook:read',
    'classbook:create',
    'classbook:update',
    'classbook:complete',
    'classbook:attendance',
    'classbook:observe',
    'classbook:review',
    'classbook:sign',
    'classbook:configure',
    'student:read',
    'student:create',
    'student:update',
    'enrollment:manage',
    'report:institution',
    'audit:institution',
  ],
  coordinator: [
    'course:read',
    'plan:read',
    'plan:review',
    'plan:approve',
    'plan:observe',
    'classbook:read',
    'classbook:observe',
    'classbook:review',
    'classbook:sign_pending',
    'report:scope',
  ],
  teacher: [
    'course:read_own',
    'plan:create',
    'plan:read_own',
    'plan:update_own',
    'classbook:create',
    'classbook:read_own',
    'classbook:update_own',
    'classbook:sign_own',
    'classbook:attendance',
    'classbook:observe',
    'resource:create',
    'resource:read',
    'evaluation:create',
    'evaluation:read_own',
  ],
  student: [
    'classbook:read_own',
    'resource:read_assigned',
    'evaluation:take_assigned',
  ],
};

const VALID_INSTITUTIONAL_ROLES: InstitutionalRole[] = [
  'super_admin',
  'institution_admin',
  'coordinator',
  'teacher',
  'student',
];

function validateInstitutionalRole(role: string): InstitutionalRole {
  if (VALID_INSTITUTIONAL_ROLES.includes(role as InstitutionalRole)) {
    return role as InstitutionalRole;
  }
  throw forbidden(`Rol institucional inválido: ${role}`);
}

function mapLegacyRole(legacyRole: string, institutionId: string | null): InstitutionalRole {
  const role = legacyRole.toLowerCase();
  if (role === 'admin' && !institutionId) return 'super_admin';
  if (role === 'admin') return 'institution_admin';
  if (role === 'coordinator') return 'coordinator';
  if (role === 'student') return 'student';
  if (role === 'docente' || role === 'teacher') return 'teacher';
  throw forbidden(`Rol desconocido: ${legacyRole}`);
}

async function getUserPermissions(
  db: D1Database,
  userId: string,
  role: InstitutionalRole,
  institutionId: string | null
): Promise<string[]> {
  const basePermissions = ROLE_PERMISSIONS[role] || [];

  if (role === 'coordinator' && institutionId) {
    const scope = await getCoordinatorScope(db, userId, institutionId);
    if (scope) {
      return [...basePermissions, `scope:${JSON.stringify(scope)}`];
    }
  }

  if (role === 'teacher' && institutionId) {
    const courseIds = await getTeacherCourseIds(db, userId, institutionId);
    if (courseIds.length > 0) {
      return [...basePermissions, `courses:${courseIds.join(',')}`];
    }
  }

  return basePermissions;
}

async function getCoordinatorScope(
  db: D1Database,
  userId: string,
  institutionId: string
): Promise<CoordinatorScope | null> {
  try {
    const membership = await db.prepare(
      `SELECT course_ids, subject_ids, level_ids, academic_year_ids
       FROM coordinator_scopes WHERE user_id = ? AND institution_id = ?`
    ).bind(userId, institutionId).first<{
      course_ids: string | null;
      subject_ids: string | null;
      level_ids: string | null;
      academic_year_ids: string | null;
    }>();

    if (!membership) return null;

    return {
      institutionId,
      courseIds: membership.course_ids ? JSON.parse(membership.course_ids) : [],
      subjectIds: membership.subject_ids ? JSON.parse(membership.subject_ids) : [],
      levelIds: membership.level_ids ? JSON.parse(membership.level_ids) : [],
      academicYearIds: membership.academic_year_ids ? JSON.parse(membership.academic_year_ids) : [],
    };
  } catch {
    return null;
  }
}

async function getTeacherCourseIds(
  db: D1Database,
  userId: string,
  institutionId: string
): Promise<string[]> {
  try {
    const courses = await db.prepare(
      `SELECT tc.id FROM teacher_classes tc
       JOIN institution_members im ON im.user_id = tc.teacher_id
       WHERE tc.teacher_id = ? AND tc.is_active = 1
       AND im.institution_id = ? AND im.status = 'active'`
    ).bind(userId, institutionId).all<{ id: string }>();

    return courses.results?.map(c => c.id) || [];
  } catch {
    return [];
  }
}

export async function requireAuthenticatedUser(
  request: Request,
  env: AuthEnv
): Promise<AuthenticatedUserContext> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw unauthorized('Token requerido');
  }

  const secret = env.JWT_SECRET || '';
  if (!secret) {
    throw forbidden('Configuración de seguridad incompleta');
  }

  const payload = await verifyToken(auth.slice(7), secret);
  if (!payload?.sub) {
    throw unauthorized('Token inválido o expirado');
  }

  const user = await env.DB.prepare(
    'SELECT id, email, nombre, rol, active FROM usuarios WHERE id = ?'
  ).bind(payload.sub).first<{ id: string; email: string; nombre: string; rol: string; active: number }>();

  if (!user) {
    throw unauthorized('Usuario no encontrado');
  }

  if (!user.active) {
    throw inactiveUser('Usuario desactivado');
  }

  let institutionId: string | null = null;
  let institutionalRole: InstitutionalRole = 'teacher';

  if (user.rol === 'admin') {
    const globalAdmin = await env.DB.prepare(
      'SELECT 1 FROM usuarios WHERE id = ? AND rol = ? LIMIT 1'
    ).bind(user.id, 'admin').first();
    if (globalAdmin) {
      institutionalRole = 'super_admin';
      const membership = await env.DB.prepare(
        `SELECT institution_id, role FROM institution_members
         WHERE user_id = ? AND status = 'active'
         ORDER BY CASE role WHEN 'institution_admin' THEN 1 WHEN 'coordinator' THEN 2 ELSE 3 END
         LIMIT 1`
      ).bind(user.id).first<{ institution_id: string; role: string }>();

      if (membership) {
        institutionId = membership.institution_id;
      }
    } else {
      const membership = await env.DB.prepare(
        `SELECT institution_id, role FROM institution_members
         WHERE user_id = ? AND status = 'active'
         ORDER BY CASE role WHEN 'institution_admin' THEN 1 WHEN 'coordinator' THEN 2 ELSE 3 END
         LIMIT 1`
      ).bind(user.id).first<{ institution_id: string; role: string }>();

      if (membership) {
        institutionId = membership.institution_id;
        institutionalRole = validateInstitutionalRole(membership.role);
      }
    }
  } else {
    const membership = await env.DB.prepare(
      `SELECT institution_id, role FROM institution_members
       WHERE user_id = ? AND status = 'active'
       ORDER BY CASE role WHEN 'institution_admin' THEN 1 WHEN 'coordinator' THEN 2 ELSE 3 END
       LIMIT 1`
    ).bind(user.id).first<{ institution_id: string; role: string }>();

    if (membership) {
      institutionId = membership.institution_id;
      institutionalRole = validateInstitutionalRole(membership.role);
    } else {
      institutionalRole = mapLegacyRole(user.rol, null);
    }
  }

  const permissions = await getUserPermissions(env.DB, user.id, institutionalRole, institutionId);
  const scope = institutionalRole === 'coordinator' && institutionId
    ? await getCoordinatorScope(env.DB, user.id, institutionId)
    : undefined;

  return {
    userId: user.id,
    institutionId,
    role: institutionalRole,
    isActive: true,
    email: user.email,
    nombre: user.nombre,
    permissions,
    scope,
  };
}

export async function requireActiveUser(
  context: AuthenticatedUserContext
): Promise<AuthenticatedUserContext> {
  if (!context.isActive) {
    throw inactiveUser();
  }
  return context;
}

export async function requireInstitution(
  context: AuthenticatedUserContext
): Promise<AuthenticatedUserContext> {
  if (!context.institutionId) {
    throw forbidden('Usuario sin institución asignada');
  }
  return context;
}

export async function requirePermission(
  context: AuthenticatedUserContext,
  permission: string
): Promise<AuthenticatedUserContext> {
  const hasPermission = context.permissions.some(p => {
    if (p.endsWith('*')) {
      const prefix = p.slice(0, -1);
      return permission.startsWith(prefix);
    }
    return p === permission;
  });

  if (!hasPermission) {
    throw forbidden(`Permiso requerido: ${permission}`);
  }
  return context;
}

export async function requireAnyPermission(
  context: AuthenticatedUserContext,
  permissions: string[]
): Promise<AuthenticatedUserContext> {
  const hasAny = permissions.some(p =>
    context.permissions.some(cp => {
      if (cp.endsWith('*')) {
        const prefix = cp.slice(0, -1);
        return p.startsWith(prefix);
      }
      return cp === p;
    })
  );

  if (!hasAny) {
    throw forbidden(`Se requiere uno de los permisos: ${permissions.join(', ')}`);
  }
  return context;
}

export async function requireInstitutionMatch(
  context: AuthenticatedUserContext,
  institutionId: string
): Promise<AuthenticatedUserContext> {
  if (context.role === 'super_admin') return context;
  
  if (!context.institutionId || context.institutionId !== institutionId) {
    throw forbidden('Acceso denegado: institución distinta');
  }
  return context;
}

export async function requireRole(
  context: AuthenticatedUserContext,
  role: InstitutionalRole
): Promise<AuthenticatedUserContext> {
  const hierarchy: Record<InstitutionalRole, number> = {
    super_admin: 4,
    institution_admin: 3,
    coordinator: 2,
    teacher: 1,
    student: 0,
  };

  if (hierarchy[context.role] < hierarchy[role]) {
    throw forbidden(`Se requiere rol: ${role}`);
  }
  return context;
}

export async function requireAnyRole(
  context: AuthenticatedUserContext,
  roles: InstitutionalRole[]
): Promise<AuthenticatedUserContext> {
  if (!roles.includes(context.role)) {
    throw forbidden(`Se requiere uno de los roles: ${roles.join(', ')}`);
  }
  return context;
}

export async function requireCourseAccess(
  context: AuthenticatedUserContext,
  courseId: string,
  env: AuthEnv
): Promise<AuthenticatedUserContext> {
  await requireActiveUser(context);

  // SUPER_ADMIN: bypass everything
  if (context.role === 'super_admin') return context;

  await requireInstitution(context);

  // INSTITUTION_ADMIN: access all courses in their institution
  if (context.role === 'institution_admin') {
    if (!context.institutionId) {
      throw forbidden('Sin institución asignada');
    }
    const course = await env.DB.prepare(
      `SELECT id FROM teacher_classes WHERE id = ? AND institution_id = ? AND is_active = 1`
    ).bind(courseId, context.institutionId).first();
    if (!course) {
      throw notFound('Curso no encontrado');
    }
    return context;
  }

  // COORDINATOR: validate scope
  if (context.role === 'coordinator') {
    if (!context.institutionId) {
      throw forbidden('Coordinador sin institución');
    }
    // Verify course exists and belongs to institution
    const course = await env.DB.prepare(
      `SELECT id FROM teacher_classes WHERE id = ? AND institution_id = ? AND is_active = 1`
    ).bind(courseId, context.institutionId).first();
    if (!course) {
      throw notFound('Curso no encontrado');
    }
    // Validate scope
    if (!context.scope || !context.scope.courseIds.includes(courseId)) {
      throw forbidden('Curso fuera del alcance del coordinador');
    }
    return context;
  }

  // TEACHER: verify assignment and institution
  if (context.role === 'teacher') {
    const course = await env.DB.prepare(
      `SELECT id, teacher_id, institution_id FROM teacher_classes 
       WHERE id = ? AND is_active = 1`
    ).bind(courseId).first<{ id: string; teacher_id: string; institution_id: string }>();

    if (!course) {
      throw notFound('Curso no encontrado');
    }

    if (course.institution_id !== context.institutionId) {
      throw forbidden('Curso de otra institución');
    }

    if (course.teacher_id !== context.userId) {
      throw forbidden('No tienes acceso a este curso');
    }
    return context;
  }

  throw forbidden('Rol no autorizado para acceso a curso');
}

export async function requireTeacherAssignment(
  context: AuthenticatedUserContext,
  courseId: string,
  subjectId: string,
  env: AuthEnv
): Promise<AuthenticatedUserContext> {
  // SUPER_ADMIN: bypass everything
  if (context.role === 'super_admin') return context;

  // INSTITUTION_ADMIN: allowed for administration purposes
  if (context.role === 'institution_admin') {
    await requireCourseAccess(context, courseId, env);
    return context;
  }

  // COORDINATOR: must use requireCoordinatorScope, not this function
  if (context.role === 'coordinator') {
    throw forbidden('Coordinador debe usar requireCoordinatorScope');
  }

  // TEACHER: verify exact assignment
  if (context.role === 'teacher') {
    await requireCourseAccess(context, courseId, env);

    const assignment = await env.DB.prepare(
      `SELECT id FROM teacher_classes
       WHERE id = ? AND subject_id = ? AND teacher_id = ? AND is_active = 1`
    ).bind(courseId, subjectId, context.userId).first();

    if (!assignment) {
      throw forbidden('No enseñas esta asignatura en este curso');
    }
    return context;
  }

  throw forbidden('Rol no autorizado para asignación docente');
}

function parseScopeIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(v => String(v));
      }
    } catch {
      throw forbidden('JSON inválido en scope');
    }
  }
  return [];
}

export async function requireCoordinatorScope(
  context: AuthenticatedUserContext,
  courseId: string,
  subjectId: string | null,
  env: AuthEnv
): Promise<AuthenticatedUserContext> {
  // SUPER_ADMIN: bypass everything
  if (context.role === 'super_admin') return context;

  // INSTITUTION_ADMIN: bypass coordinator scope check
  if (context.role === 'institution_admin') {
    await requireCourseAccess(context, courseId, env);
    return context;
  }

  // Must be coordinator with permissions
  await requireAnyPermission(context, ['plan:review', 'plan:approve', 'classbook:sign_pending']);

  if (!context.institutionId) {
    throw forbidden('Coordinador sin institución');
  }

  // Verify course exists and belongs to institution
  const course = await env.DB.prepare(
    'SELECT id FROM teacher_classes WHERE id = ? AND institution_id = ? AND is_active = 1'
  ).bind(courseId, context.institutionId).first();

  if (!course) {
    throw notFound('Curso no encontrado');
  }

  // Use cached scope from context if available
  if (context.scope) {
    if (!context.scope.courseIds.includes(courseId)) {
      throw forbidden('Curso fuera del alcance del coordinador');
    }
    if (subjectId && context.scope.subjectIds.length > 0 && !context.scope.subjectIds.includes(subjectId)) {
      throw forbidden('Asignatura fuera del alcance del coordinador');
    }
    return context;
  }

  // Fallback: query coordinator_scopes
  const scopeRow = await env.DB.prepare(
    `SELECT course_ids, subject_ids, level_ids, academic_year_ids
     FROM coordinator_scopes WHERE user_id = ? AND institution_id = ?`
  ).bind(context.userId, context.institutionId).first<{
    course_ids: string | null;
    subject_ids: string | null;
    level_ids: string | null;
    academic_year_ids: string | null;
  }>();

  if (!scopeRow) {
    throw forbidden('Curso fuera del alcance del coordinador');
  }

  const courseIds = parseScopeIds(scopeRow.course_ids) || [];
  const subjectIds = parseScopeIds(scopeRow.subject_ids) || [];
  const levelIds = parseScopeIds(scopeRow.level_ids) || [];
  const academicYearIds = parseScopeIds(scopeRow.academic_year_ids) || [];

  if (courseIds.length === 0 || !courseIds.includes(courseId)) {
    throw forbidden('Curso fuera del alcance del coordinador');
  }
  if (subjectId && subjectIds.length > 0 && !subjectIds.includes(subjectId)) {
    throw forbidden('Asignatura fuera del alcance del coordinador');
  }
  // Note: levelIds and academicYearIds are validated at scope assignment time,
  // not at call time since the function doesn't receive those parameters.

  return context;
}