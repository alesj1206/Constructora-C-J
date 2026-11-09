import { failure, type Result } from '@/core/result';
import type {
  InventoryRepository,
  QuickIssueInput,
  QuickMovementResult,
} from '../repositories/inventory-repository';

/**
 * Mobile MVP: register a quick material issue (salida) from the field.
 * The operator is the authenticated user; the work front is optional and there
 * is no signature. Validates material + quantity, then reuses the same
 * transactional 'out' path that guards the Kardex balance.
 */
export class RegisterQuickIssue {
  constructor(private readonly repo: InventoryRepository) {}

  execute(input: QuickIssueInput): Promise<Result<QuickMovementResult>> {
    if (input.materialId.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'MATERIAL_REQUIRED'));
    }
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'QUANTITY_INVALID'));
    }
    if (input.operatorName.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'OPERATOR_REQUIRED'));
    }
    return this.repo.createQuickIssue(input);
  }
}
