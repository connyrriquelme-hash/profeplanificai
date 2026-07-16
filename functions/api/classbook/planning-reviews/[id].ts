import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionContext } from '../../../_lib/auth-adapter';
import { PlanningReviewService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:review');
    await requireInstitutionContext(context.request, env);

    const reviewService = new PlanningReviewService(env);
    const { id } = context.params;

    const review = await reviewService.getById(id);

    if (!review) {
      return Response.json({ ok: false, error: 'Revisión no encontrada' }, { status: 404 });
    }

    if (review.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta revisión' }, { status: 403 });
    }

    return Response.json({ ok: true, data: review });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:review');

    const { id } = context.params;
    const body = await context.request.json() as {
      status?: 'pending' | 'approved' | 'observed' | 'returned' | 'archived';
      comments?: string;
    };

    const reviewService = new PlanningReviewService(env);
    const review = await reviewService.getById(id);

    if (!review) {
      return Response.json({ ok: false, error: 'Revisión no encontrada' }, { status: 404 });
    }

    if (review.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta revisión' }, { status: 403 });
    }

    if (review.reviewer_id !== authContext.userId && body.status && body.status !== 'pending') {
      return Response.json({ ok: false, error: 'Solo el revisor asignado puede cambiar el estado' }, { status: 403 });
    }

    let updated: any = null;

    if (body.status === 'approved') {
      updated = await reviewService.approve(id, authContext.userId, body.comments);
    } else if (body.status === 'observed') {
      updated = await reviewService.observe(id, authContext.userId, body.comments);
    } else if (body.status === 'returned') {
      updated = await reviewService.return(id, authContext.userId, body.comments);
    } else if (body.status === 'archived') {
      updated = await reviewService.archive(id);
    } else if (body.status) {
      updated = await reviewService.update(id, { status: body.status, comments: body.comments });
    } else {
      updated = await reviewService.update(id, body);
    }

    if (!updated) {
      return Response.json({ ok: false, error: 'Revisión no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true, data: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:review');

    const { id } = context.params;

    const reviewService = new PlanningReviewService(env);
    const review = await reviewService.getById(id);

    if (!review) {
      return Response.json({ ok: false, error: 'Revisión no encontrada' }, { status: 404 });
    }

    if (review.institution_id !== authContext.institutionId) {
      return Response.json({ ok: false, error: 'No tienes acceso a esta revisión' }, { status: 403 });
    }

    const deleted = await reviewService.delete(id);

    if (!deleted) {
      return Response.json({ ok: false, error: 'Revisión no encontrada' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}