import { failure, type Result } from '@/core/result';
import type { WorkFront } from '../entities/work-front';
import type { CreateIssueInput, InventoryRepository } from '../repositories/inventory-repository';

/** HU-02: list work fronts to pick the activity receiving the material. */
export class ListWorkFronts {
  constructor(private readonly repo: InventoryRepository) {}
  execute(): Promise<Result<WorkFront[]>> {
    return this.repo.listWorkFronts();
  }
}

/**
 * HU-02: create a digital issue voucher. Requires a work front, operator name
 * and on-screen signature. The repository writes an 'out' movement which
 * immediately reduces the available stock.
 */
export class CreateIssue {
  constructor(private readonly repo: InventoryRepository) {}

  execute(input: CreateIssueInput): Promise<Result<void>> {
    if (input.quantity <= 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Quantity must be greater than 0.'));
    }
    if (input.workFrontId.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Work front is required.'));
    }
    if (input.operatorName.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Operator name is required.'));
    }
    if (input.signatureData.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Signature is required.'));
    }
    return this.repo.createIssue({
      ...input,
      operatorName: input.operatorName.trim(),
    });
  }
}
