import 'server-only';
import { failure, success, type Result } from '@/core/result';
import type { Material } from '../../domain/entities/material';
import { computeStockStatus, type MaterialBalance } from '../../domain/entities/stock';
import type { RecentMovement } from '../../domain/entities/movement';
import type { PurchaseOrder } from '../../domain/entities/purchase-order';
import type { WorkFront } from '../../domain/entities/work-front';
import type {
  ConsumptionDeviation,
  CostReportRow,
  CountDifference,
} from '../../domain/entities/reconciliation';
import type {
  CreateIssueInput,
  CreateMaterialInput,
  InventoryRepository,
  QuickIssueInput,
  QuickMovementResult,
  RegisterCountInput,
  RegisterEntryInput,
} from '../../domain/repositories/inventory-repository';
import {
  InventoryError,
  MysqlInventoryDataSource,
  type BalanceRow,
  type MaterialRow,
} from '../datasources/mysql-inventory.datasource';

export class InventoryRepositoryImpl implements InventoryRepository {
  constructor(private readonly ds: MysqlInventoryDataSource) {}

  async listMaterials(): Promise<Result<Material[]>> {
    try {
      const rows = await this.ds.selectMaterials();
      return success(rows.map(toMaterial));
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async createMaterial(input: CreateMaterialInput): Promise<Result<Material>> {
    try {
      const row = await this.ds.insertMaterial(
        input.code,
        input.description,
        input.unit,
        input.abcClass,
        input.reorderPoint,
        input.safetyStock,
      );
      return success(toMaterial(row));
    } catch (error) {
      if (isDuplicate(error)) {
        return failure('INVALID_INPUT', 'A material with that code already exists.');
      }
      return failure('UNKNOWN', msg(error));
    }
  }

  async listBalances(): Promise<Result<MaterialBalance[]>> {
    try {
      const rows = await this.ds.selectBalances();
      return success(rows.map(toBalance));
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async listRecentMovements(limit: number): Promise<Result<RecentMovement[]>> {
    try {
      const rows = await this.ds.selectRecentMovements(limit);
      return success(
        rows.map((r) => ({
          id: r.id,
          type: r.movement_type,
          materialCode: r.material_code,
          materialDescription: r.material_description,
          quantity: Number(r.quantity),
          unit: r.unit,
          reference: r.reference,
          createdAt: new Date(r.created_at).toISOString(),
        })),
      );
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async findPurchaseOrderByNumber(ocNumber: string): Promise<Result<PurchaseOrder | null>> {
    try {
      const found = await this.ds.selectPurchaseOrder(ocNumber);
      if (!found) {
        return success(null);
      }
      const po: PurchaseOrder = {
        id: found.po.id,
        ocNumber: found.po.oc_number,
        supplier: found.po.supplier,
        projectId: found.po.project_id,
        status: found.po.status,
        items: found.items.map((it) => ({
          id: it.id,
          materialId: it.material_id,
          materialCode: it.material_code,
          materialDescription: it.material_description,
          unit: it.unit,
          expectedQty: Number(it.expected_qty),
          unitPrice: Number(it.unit_price),
        })),
      };
      return success(po);
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async registerEntry(input: RegisterEntryInput): Promise<Result<void>> {
    try {
      await this.ds.insertEntry(input);
      return success(undefined);
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async listWorkFronts(): Promise<Result<WorkFront[]>> {
    try {
      const rows = await this.ds.selectWorkFronts();
      return success(
        rows.map((r) => ({
          id: r.id,
          projectId: r.project_id,
          projectName: r.project_name,
          name: r.name,
        })),
      );
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async createIssue(input: CreateIssueInput): Promise<Result<void>> {
    try {
      await this.ds.insertIssue(input);
      return success(undefined);
    } catch (error) {
      if (error instanceof InventoryError && error.code === 'INSUFFICIENT_STOCK') {
        return failure('INVALID_INPUT', 'Stock insuficiente para el despacho.');
      }
      return failure('UNKNOWN', msg(error));
    }
  }

  async createQuickIssue(input: QuickIssueInput): Promise<Result<QuickMovementResult>> {
    try {
      const meta = await this.ds.selectMaterialMeta(input.materialId);
      if (!meta) {
        return failure('INVALID_INPUT', 'MATERIAL_NOT_FOUND');
      }
      // Reuse the same transactional 'out' path (guards balance, no signature).
      await this.ds.insertIssue({
        materialId: input.materialId,
        quantity: input.quantity,
        workFrontId: input.workFrontId ?? '',
        operatorName: input.operatorName,
        signatureData: '',
        observations: input.note,
        createdBy: input.createdBy,
      });
      const newBalance = await this.ds.selectBalanceFor(input.materialId);
      return success({
        materialCode: meta.code,
        materialDescription: meta.description,
        unit: meta.unit,
        type: 'out',
        quantity: input.quantity,
        newBalance,
      });
    } catch (error) {
      if (error instanceof InventoryError && error.code === 'INSUFFICIENT_STOCK') {
        return failure('INVALID_INPUT', 'INSUFFICIENT_STOCK');
      }
      return failure('UNKNOWN', msg(error));
    }
  }

  async registerCount(input: RegisterCountInput): Promise<Result<CountDifference>> {
    try {
      const meta = await this.ds.selectMaterialMeta(input.materialId);
      if (!meta) {
        return failure('INVALID_INPUT', 'Material not found.');
      }
      const systemBalance = await this.ds.selectBalanceFor(input.materialId);
      const difference = round2(input.countedQty - systemBalance);
      await this.ds.insertAdjustment(input.materialId, difference, input.createdBy);
      return success({
        materialId: input.materialId,
        code: meta.code,
        description: meta.description,
        unit: meta.unit,
        systemBalance,
        countedQty: input.countedQty,
        difference,
      });
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async getConsumptionDeviation(workFrontId: string): Promise<Result<ConsumptionDeviation[]>> {
    try {
      const rows = await this.ds.selectDeviation(workFrontId);
      return success(
        rows.map((r) => {
          const planned = Number(r.planned_qty);
          const real = Number(r.real_qty);
          const deviationPct = planned === 0 ? 0 : round2(((real - planned) / planned) * 100);
          return {
            materialId: r.material_id,
            code: r.code,
            description: r.description,
            unit: r.unit,
            plannedQty: planned,
            realQty: real,
            deviationPct,
          };
        }),
      );
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async getCostReport(
    projectId: string,
    from: string,
    to: string,
  ): Promise<Result<CostReportRow[]>> {
    try {
      const rows = await this.ds.selectCostReport(projectId, from, to);
      return success(
        rows.map((r) => ({
          materialId: r.material_id,
          code: r.code,
          description: r.description,
          unit: r.unit,
          consumedQty: Number(r.consumed_qty),
          totalCost: Number(r.total_cost),
        })),
      );
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }

  async listProjects(): Promise<Result<{ id: string; name: string }[]>> {
    try {
      return success(await this.ds.selectProjects());
    } catch (error) {
      return failure('UNKNOWN', msg(error));
    }
  }
}

function toMaterial(row: MaterialRow): Material {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    unit: row.unit,
    abcClass: row.abc_class,
    reorderPoint: Number(row.reorder_point),
    safetyStock: Number(row.safety_stock),
    isActive: row.is_active === 1,
  };
}

function toBalance(row: BalanceRow): MaterialBalance {
  const balance = Number(row.balance);
  const reorderPoint = Number(row.reorder_point);
  const safetyStock = Number(row.safety_stock);
  return {
    materialId: row.material_id,
    code: row.code,
    description: row.description,
    unit: row.unit,
    abcClass: row.abc_class,
    reorderPoint,
    safetyStock,
    balance,
    status: computeStockStatus(balance, reorderPoint, safetyStock),
  };
}

function isDuplicate(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function msg(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error.';
}
