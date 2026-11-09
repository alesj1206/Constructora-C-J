import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import {
  ListBalances,
  ListRecentMovements,
} from '@/features/inventory/domain/usecases/stock-usecases';
import { ListWorkFronts } from '@/features/inventory/domain/usecases/issue-usecases';
import { InventoryHub } from '@/features/inventory/presentation/components/inventory-hub';
import { inventoryStrings } from '@/features/inventory/presentation/strings/inventory-strings';

// Reads live data each request.
export const instant = false;

/**
 * Pantalla A (MVP hub): real-time Kardex + PP/SS semaphore (HU-03), with inline
 * entry (HU-01) and issue (HU-02) actions as modals, plus recent movements.
 */
export default async function InventoryPage() {
  const repo = provideInventoryRepository();
  const [balancesResult, frontsResult, recentResult] = await Promise.all([
    new ListBalances(repo).execute(),
    new ListWorkFronts(repo).execute(),
    new ListRecentMovements(repo).execute(8),
  ]);

  const balances = balancesResult.ok ? balancesResult.value : [];
  const workFronts = frontsResult.ok ? frontsResult.value : [];
  const recent = recentResult.ok ? recentResult.value : [];

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{inventoryStrings.kardexTitle}</h1>
        <p className="text-sm text-slate-500">Estado de almacén · existencias en tiempo real</p>
      </div>
      <InventoryHub balances={balances} workFronts={workFronts} recent={recent} />
    </section>
  );
}
