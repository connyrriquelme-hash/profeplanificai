export async function onRequestPost(): Promise<Response> {
  return Response.json(
    { success: false, error: 'El registro público está deshabilitado. Solicita acceso al administrador.' },
    { status: 403 },
  );
}
