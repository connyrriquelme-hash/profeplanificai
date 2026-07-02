import { requireAdmin, type AdminEnv } from '../../_lib/roles';

interface Env extends AdminEnv {}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const admin = await requireAdmin(context.request, { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET });

    const [user, planes, recursos, evaluaciones, cursos, estudiantes, posts] = await Promise.all([
      context.env.DB.prepare('SELECT id, email, nombre, rol FROM usuarios WHERE id = ?').bind(admin.id).first(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM planes WHERE usuario_id = ?').bind(admin.id).first(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM recursos WHERE usuario_id = ?').bind(admin.id).first(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM evaluaciones WHERE usuario_id = ?').bind(admin.id).first(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM cursos WHERE usuario_id = ?').bind(admin.id).first(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM estudiantes WHERE usuario_id = ?').bind(admin.id).first(),
      context.env.DB.prepare('SELECT COUNT(*) as count FROM colaboracion_posts').first(),
    ]);

    return Response.json({
      user,
      stats: {
        planes: (planes as Record<string, number>)?.count || 0,
        recursos: (recursos as Record<string, number>)?.count || 0,
        evaluaciones: (evaluaciones as Record<string, number>)?.count || 0,
        cursos: (cursos as Record<string, number>)?.count || 0,
        estudiantes: (estudiantes as Record<string, number>)?.count || 0,
        postsColaboracion: (posts as Record<string, number>)?.count || 0,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
