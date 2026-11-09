import type { AbcClass } from './material';

/** Semaphore state derived from balance vs PP/SS thresholds (HU-03). */
export type StockStatus = 'ok' | 'reorder' | 'critical';

/** A material with its current Kardex balance and semaphore status (HU-03). */
export interface MaterialBalance {
  readonly materialId: string;
  readonly code: string;
  readonly description: string;
  readonly unit: string;
  readonly abcClass: AbcClass;
  readonly reorderPoint: number;
  readonly safetyStock: number;
  readonly balance: number;
  readonly status: StockStatus;
}

/**
 * Pure business rule for the stock semaphore (HU-03, criterion 1):
 * - below safety stock  -> critical (red)
 * - below reorder point -> reorder  (yellow)
 * - otherwise           -> ok       (green)
 */
export function computeStockStatus(
  balance: number,
  reorderPoint: number,
  safetyStock: number,
): StockStatus {
  if (balance < safetyStock) {
    return 'critical';
  }
  if (balance < reorderPoint) {
    return 'reorder';
  }
  return 'ok';
}
