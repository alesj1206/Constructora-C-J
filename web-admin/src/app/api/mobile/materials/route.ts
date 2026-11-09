import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { ListBalances } from '@/features/inventory/domain/usecases/stock-usecases';

export const instant = false;

/**
 * GET /api/mobile/materials
 * Returns the material list with current balance to populate the mobile
 * selector (so the worker picks from a list, not a UUID). Bearer auth.
 */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json(
      { ok: false, message: 'Sesión expirada. Inicia sesión de nuevo.' },
      { status: 401 },
    );
  }

  const result = await new ListBalances(provideInventoryRepository()).execute();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: 'No se pudieron cargar los materiales. Intenta de nuevo.' },
      { status: 500 },
    );
  }

  const materials = result.value.map((b) => ({
    id: b.materialId,
    code: b.code,
    description: b.description,
    unit: b.unit,
    balance: b.balance,
    status: b.status,
  }));

  return NextResponse.json({ ok: true, materials });
}
