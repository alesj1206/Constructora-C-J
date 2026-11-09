import type { Result } from '@/core/result';
import type { AbcClass, Material } from '../entities/material';
import type { MaterialBalance } from '../entities/stock';
import type { RecentMovement } from '../entities/movement';
import type { PurchaseOrder } from '../entities/purchase-order';
import type { WorkFront } from '../entities/work-front';
import type {
  ConsumptionDeviation,
  CostReportRow,
  CountDifference,
} from '../entities/reconciliation';

export interface CreateMaterialInput {
  code: string;
  description: string;
  unit: string;
  abcClass: AbcClass;
  reorderPoint: number;
  safetyStock: number;
}

export interface RegisterEntryInput {
  purchaseOrderId: string;
  materialId: string;
  quantity: number;
  unitCost: number;
  remissionNote: string | null;
  createdBy: string | null;
}

export interface CreateIssueInput {
  materialId: string;
  quantity: number;
  workFrontId: string;
  operatorName: string;
  signatureData: string;
  observations: string | null;
  createdBy: string | null;
}

/**
 * Lightweight issue from the mobile app (MVP). No signature; the operator is
 * the authenticated user and the work front is optional. Still writes an 'out'
 * movement through the same transactional path, preserving Kardex integrity.
 */
export interface QuickIssueInput {
  materialId: string;
  quantity: number;
  operatorName: string;
  workFrontId: string | null;
  note: string | null;
  createdBy: string | null;
}

/** Result returned to the mobile client after a quick movement. */
export interface QuickMovementResult {
  materialCode: string;
  materialDescription: string;
  unit: string;
  type: 'in' | 'out';
  quantity: number;
  newBalance: number;
}

export interface RegisterCountInput {
  materialId: string;
  countedQty: number;
  createdBy: string | null;
}

/** All inventory operations. Implemented by the data layer against MySQL. */
export interface InventoryRepository {
  // HU-00
  listMaterials(): Promise<Result<Material[]>>;
  createMaterial(input: CreateMaterialInput): Promise<Result<Material>>;

  // HU-03
  listBalances(): Promise<Result<MaterialBalance[]>>;

  // Pantalla A: recent movements feed
  listRecentMovements(limit: number): Promise<Result<RecentMovement[]>>;

  // HU-01
  findPurchaseOrderByNumber(ocNumber: string): Promise<Result<PurchaseOrder | null>>;
  registerEntry(input: RegisterEntryInput): Promise<Result<void>>;

  // HU-02
  listWorkFronts(): Promise<Result<WorkFront[]>>;
  createIssue(input: CreateIssueInput): Promise<Result<void>>;

  // Mobile API (MVP): quick movement without signature.
  createQuickIssue(input: QuickIssueInput): Promise<Result<QuickMovementResult>>;

  // HU-04
  registerCount(input: RegisterCountInput): Promise<Result<CountDifference>>;

  // HU-05
  getConsumptionDeviation(workFrontId: string): Promise<Result<ConsumptionDeviation[]>>;

  // HU-06 / HU-07
  getCostReport(projectId: string, from: string, to: string): Promise<Result<CostReportRow[]>>;
  listProjects(): Promise<Result<{ id: string; name: string }[]>>;
}
