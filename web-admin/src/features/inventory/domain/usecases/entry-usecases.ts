import { failure, type Result } from '@/core/result';
import type { PurchaseOrder } from '../entities/purchase-order';
import type { InventoryRepository, RegisterEntryInput } from '../repositories/inventory-repository';

/** HU-01: look up a purchase order by its number to confront the receipt. */
export class FindPurchaseOrder {
  constructor(private readonly repo: InventoryRepository) {}
  execute(ocNumber: string): Promise<Result<PurchaseOrder | null>> {
    if (ocNumber.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'OC number is required.'));
    }
    return this.repo.findPurchaseOrderByNumber(ocNumber.trim());
  }
}

/**
 * HU-01: register a material entry against a PO. Records the real quantity and
 * an optional novelty, updates the Kardex (the repository writes an 'in'
 * movement) and may complete the purchase order.
 */
export class RegisterEntry {
  constructor(private readonly repo: InventoryRepository) {}

  execute(input: RegisterEntryInput): Promise<Result<void>> {
    if (input.quantity <= 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Quantity must be greater than 0.'));
    }
    if (input.unitCost < 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Unit cost must be >= 0.'));
    }
    return this.repo.registerEntry(input);
  }
}
