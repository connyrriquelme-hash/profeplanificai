import { resolveEffectiveInstitutionId, requirePermissionContext } from '../../../_lib/auth-adapter';
import { PlanningReviewService } from '../../../services/classbook';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:review');

    const reviewService = new PlanningReviewService(env);
    const filters = {
      institution_id: institutionId,
      planning_id: context.query.planning_id,
      reviewer_id: context.query.reviewer_id,
      status: context.query.status,
    };
    const { results } = await reviewService.list(filters, { limit: 100, offset: 0 });

    return Response.json({ ok: true, data: results, total: results.length });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { institutionId, authContext } = await resolveEffectiveInstitutionId(context.request, env);
    await requirePermissionContext(context.request, env, 'classbook:review');

    const body = await context.request.json() as {
      planning_id: string;
      reviewer_id?: string;
    };

    if (!body.planning_id) {
      return Response.json({ ok: false, error: 'Falta planning_id' }, { status: 422 });
    }

    const reviewService = new PlanningReviewService(env);
    const reviewerId = body.reviewer_id || authContext.userId;

    const review = await reviewService.create({
      institution_id: institutionId,
      planning_id: body.planning_id,
      reviewer_id: reviewerId,
    }, institutionId);

    return Response.json({ ok: true, data: review }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}