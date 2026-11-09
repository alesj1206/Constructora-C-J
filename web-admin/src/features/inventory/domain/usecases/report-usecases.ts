import { failure, type Result } from '@/core/result';
import type {
  ConsumptionDeviation,
  CostReportRow,
  CountDifference,
} from '../entities/reconciliation';
import type { InventoryRepository, RegisterCountInput } from '../repositories/inventory-repository';

/** HU-04: register a physical count and compute the difference vs the system. */
export class RegisterCount {
  constructor(private readonly repo: InventoryRepository) {}

  execute(input: RegisterCountInput): Promise<Result<CountDifference>> {
    if (input.countedQty < 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Counted quantity must be >= 0.'));
    }
    return this.repo.registerCount(input);
  }
}

/** HU-05: consumption deviation (real vs planned) per work front. */
export class GetConsumptionDeviation {
  constructor(private readonly repo: InventoryRepository) {}
  execute(workFrontId: string): Promise<Result<ConsumptionDeviation[]>> {
    if (workFrontId.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Work front is required.'));
    }
    return this.repo.getConsumptionDeviation(workFrontId);
  }
}

/** HU-06 / HU-07: biweekly cost report per project and period. */
export class GetCostReport {
  constructor(private readonly repo: InventoryRepository) {}
  execute(projectId: string, from: string, to: string): Promise<Result<CostReportRow[]>> {
    if (projectId.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Project is required.'));
    }
    if (from.trim().length === 0 || to.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Period is required.'));
    }
    return this.repo.getCostReport(projectId, from, to);
  }
}

/** Helper to list projects for the report filter. */
export class ListProjects {
  constructor(private readonly repo: InventoryRepository) {}
  execute(): Promise<Result<{ id: string; name: string }[]>> {
    return this.repo.listProjects();
  }
}
