import type { Result } from '@/core/result';
import type { MaterialBalance } from '../entities/stock';
import type { RecentMovement } from '../entities/movement';
import type { InventoryRepository } from '../repositories/inventory-repository';

/** HU-03: list balances with semaphore status for the Kardex dashboard. */
export class ListBalances {
  constructor(private readonly repo: InventoryRepository) {}
  execute(): Promise<Result<MaterialBalance[]>> {
    return this.repo.listBalances();
  }
}

/** Pantalla A: recent movements feed ("últimos movimientos"). */
export class ListRecentMovements {
  constructor(private readonly repo: InventoryRepository) {}
  execute(limit = 8): Promise<Result<RecentMovement[]>> {
    return this.repo.listRecentMovements(limit);
  }
}
