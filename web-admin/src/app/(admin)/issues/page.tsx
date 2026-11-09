import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { ListMaterials } from '@/features/inventory/domain/usecases/material-usecases';
import { ListWorkFronts } from '@/features/inventory/domain/usecases/issue-usecases';
import { IssueForm } from '@/features/inventory/presentation/components/issue-form';
import { inventoryStrings } from '@/features/inventory/presentation/strings/inventory-strings';

export const instant = false;

/** HU-02: digital issue voucher. */
export default async function IssuesPage() {
  const repo = provideInventoryRepository();
  const [materialsResult, frontsResult] = await Promise.all([
    new ListMaterials(repo).execute(),
    new ListWorkFronts(repo).execute(),
  ]);
  const materials = materialsResult.ok ? materialsResult.value : [];
  const workFronts = frontsResult.ok ? frontsResult.value : [];

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">{inventoryStrings.issueTitle}</h1>
      <IssueForm materials={materials} workFronts={workFronts} />
    </section>
  );
}
