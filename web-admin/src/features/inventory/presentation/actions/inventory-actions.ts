'use server';

import { readSession } from '@/lib/session';
import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import type { AbcClass } from '../../domain/entities/material';
import type { CountDifference } from '../../domain/entities/reconciliation';
import { CreateMaterial } from '../../domain/usecases/material-usecases';
import { FindPurchaseOrder, RegisterEntry } from '../../domain/usecases/entry-usecases';
import { CreateIssue } from '../../domain/usecases/issue-usecases';
import { RegisterCount } from '../../domain/usecases/report-usecases';
import type { PurchaseOrder } from '../../domain/entities/purchase-order';

/**
 * Server Actions for inventory mutations/lookups invoked by Client Components.
 * They run the use cases on the server (MySQL stays server-side).
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function currentUserId(): Promise<string | null> {
  const session = await readSession();
  return session?.sub ?? null;
}

// HU-00
export async function createMaterialAction(input: {
  code: string;
  description: string;
  unit: string;
  abcClass: AbcClass;
  reorderPoint: number;
  safetyStock: number;
}): Promise<ActionResult> {
  const useCase = new CreateMaterial(provideInventoryRepository());
  const result = await useCase.execute(input);
  return result.ok ? { ok: true } : { ok: false, error: result.error.message };
}

// HU-01
export async function findPurchaseOrderAction(
  ocNumber: string,
): Promise<{ ok: boolean; po?: PurchaseOrder | null; error?: string }> {
  const useCase = new FindPurchaseOrder(provideInventoryRepository());
  const result = await useCase.execute(ocNumber);
  return result.ok ? { ok: true, po: result.value } : { ok: false, error: result.error.message };
}

export async function registerEntryAction(input: {
  purchaseOrderId: string;
  materialId: string;
  quantity: number;
  unitCost: number;
  remissionNote: string | null;
}): Promise<ActionResult> {
  const useCase = new RegisterEntry(provideInventoryRepository());
  const result = await useCase.execute({ ...input, createdBy: await currentUserId() });
  return result.ok ? { ok: true } : { ok: false, error: result.error.message };
}

// HU-02
export async function createIssueAction(input: {
  materialId: string;
  quantity: number;
  workFrontId: string;
  operatorName: string;
  signatureData: string;
  observations: string | null;
}): Promise<ActionResult> {
  const useCase = new CreateIssue(provideInventoryRepository());
  const result = await useCase.execute({ ...input, createdBy: await currentUserId() });
  return result.ok ? { ok: true } : { ok: false, error: result.error.message };
}

// HU-04
export async function registerCountAction(input: {
  materialId: string;
  countedQty: number;
}): Promise<{ ok: boolean; difference?: CountDifference; error?: string }> {
  const useCase = new RegisterCount(provideInventoryRepository());
  const result = await useCase.execute({ ...input, createdBy: await currentUserId() });
  return result.ok
    ? { ok: true, difference: result.value }
    : { ok: false, error: result.error.message };
}
