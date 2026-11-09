import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { RegisterQuickIssue } from '@/features/inventory/domain/usecases/quick-movement-usecases';

export const instant = false;

/**
 * POST /api/mobile/movements
 * Registers a quick material issue (salida) from the field app.
 *
 * Body: { "materialId": string, "quantity": number, "workFrontId"?: string, "note"?: string }
 * Auth: Authorization: Bearer <jwt>
 *
 * MVP scope (decision 1 + option A): type is "out", the operator is the
 * authenticated user, work front is optional and there is no signature.
 */
interface MovementBody {
  materialId?: unknown;
  quantity?: unknown;
  workFrontId?: unknown;
  note?: unknown;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json(
      { ok: false, message: 'Sesión expirada. Inicia sesión de nuevo.' },
      { status: 401 },
    );
  }

  let body: MovementBody;
  try {
    body = (await request.json()) as MovementBody;
  } catch {
    return NextResponse.json({ ok: false, message: 'La solicitud no es válida.' }, { status: 400 });
  }

  // Basic shape/type validation before touching the domain.
  const materialId = typeof body.materialId === 'string' ? body.materialId.trim() : '';
  if (materialId.length === 0) {
    return NextResponse.json({ ok: false, message: 'Selecciona un material.' }, { status: 400 });
  }
  const quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { ok: false, message: 'La cantidad debe ser un número mayor a cero.' },
      { status: 400 },
    );
  }
  const workFrontId =
    typeof body.workFrontId === 'string' && body.workFrontId.trim().length > 0
      ? body.workFrontId.trim()
      : null;
  const note =
    typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : null;

  const result = await new RegisterQuickIssue(provideInventoryRepository()).execute({
    materialId,
    quantity,
    operatorName: identity.fullName,
    workFrontId,
    note,
    createdBy: identity.userId,
  });

  if (result.ok) {
    const m = result.value;
    return NextResponse.json(
      {
        ok: true,
        message: `Salida registrada. Stock actualizado: ${m.newBalance} ${m.unit}.`,
        movement: {
          materialCode: m.materialCode,
          materialDescription: m.materialDescription,
          type: m.type,
          quantity: m.quantity,
          newBalance: m.newBalance,
          unit: m.unit,
        },
      },
      { status: 201 },
    );
  }

  // Map domain error codes to clear Spanish messages + HTTP status.
  switch (result.error.message) {
    case 'MATERIAL_NOT_FOUND':
    case 'MATERIAL_REQUIRED':
      return NextResponse.json(
        { ok: false, message: 'El material seleccionado no existe.' },
        { status: 404 },
      );
    case 'QUANTITY_INVALID':
      return NextResponse.json(
        { ok: false, message: 'La cantidad debe ser un número mayor a cero.' },
        { status: 400 },
      );
    case 'INSUFFICIENT_STOCK':
      return NextResponse.json(
        { ok: false, message: 'Stock insuficiente para el despacho.' },
        { status: 409 },
      );
    default:
      return NextResponse.json(
        { ok: false, message: 'No se pudo registrar. Intenta de nuevo.' },
        { status: 500 },
      );
  }
}
