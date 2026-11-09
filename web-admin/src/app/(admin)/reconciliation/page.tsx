import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { ListMaterials } from '@/features/inventory/domain/usecases/material-usecases';
import { ListWorkFronts } from '@/features/inventory/domain/usecases/issue-usecases';
import { GetConsumptionDeviation } from '@/features/inventory/domain/usecases/report-usecases';
import { CountForm } from '@/features/inventory/presentation/components/count-form';
import { inventoryStrings } from '@/features/inventory/presentation/strings/inventory-strings';

export const instant = false;

/**
 * HU-04: physical count / reconciliation.
 * HU-05: consumption deviation per work front (first front shown by default,
 * selectable via the ?front= query param).
 */
export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ front?: string }>;
}) {
  const repo = provideInventoryRepository();
  const params = await searchParams;

  const [materialsResult, frontsResult] = await Promise.all([
    new ListMaterials(repo).execute(),
    new ListWorkFronts(repo).execute(),
  ]);
  const materials = materialsResult.ok ? materialsResult.value : [];
  const workFronts = frontsResult.ok ? frontsResult.value : [];

  const selectedFront = params.front ?? workFronts[0]?.id ?? '';
  const deviationResult = selectedFront
    ? await new GetConsumptionDeviation(repo).execute(selectedFront)
    : null;
  const deviations = deviationResult && deviationResult.ok ? deviationResult.value : [];

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-slate-900">Conciliación y desviaciones</h1>

      <CountForm materials={materials} />

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{inventoryStrings.deviationTitle}</h2>

        <form method="GET" className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {inventoryStrings.workFrontLabel}
            <select
              name="front"
              defaultValue={selectedFront}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {workFronts.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.projectName} · {wf.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Ver desviación
          </button>
        </form>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">{inventoryStrings.plannedQty}</th>
              <th className="px-4 py-3">{inventoryStrings.realQty}</th>
              <th className="px-4 py-3">{inventoryStrings.deviationPct}</th>
            </tr>
          </thead>
          <tbody>
            {deviations.map((d) => (
              <tr key={d.materialId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-slate-700">{d.code}</td>
                <td className="px-4 py-3 text-slate-700">{d.description}</td>
                <td className="px-4 py-3 text-slate-500">
                  {d.plannedQty} {d.unit}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {d.realQty} {d.unit}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${d.deviationPct > 0 ? 'text-red-600' : 'text-green-700'}`}
                >
                  {d.deviationPct > 0 ? '+' : ''}
                  {d.deviationPct}%
                </td>
              </tr>
            ))}
            {deviations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No hay consumo planificado para esta actividad.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
