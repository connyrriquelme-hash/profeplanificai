import { z } from 'zod';
import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionMatchContext } from '../../../../../_lib/auth-adapter';
import { logAdminAction } from '../../../../../_lib/roles';
import { ASSIGNABLE_MEMBER_ROLES } from '../../../../../core/authorization';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const UpdateMemberSchema = z.object({
  role: z.string().trim().min(1).max(40).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'user:update');
    await requireInstitutionMatchContext(context.request, env, context.params.id as string);

    const { id, memberId } = context.params;
    const parsed = UpdateMemberSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 });
    }
    const body = parsed.data;

    if (body.role !== undefined && !ASSIGNABLE_MEMBER_ROLES.includes(body.role)) {
      return Response.json({ error: 'Rol no permitido' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.role !== undefined) { updates.push('role = ?'); values.push(body.role); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }

    if (updates.length === 0) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    values.push(memberId as string);
    values.push(id as string);

    await context.env.DB.prepare(
      `UPDATE institution_members SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`
    ).bind(...values).run();

    await logAdminAction(context.env, authContext.userId, 'update_institution_member', 'institution_member', memberId as string, {
      institution_id: id,
      ...body,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
