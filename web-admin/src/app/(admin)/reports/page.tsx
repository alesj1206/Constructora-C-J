import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { GetCostReport, ListProjects } from '@/features/inventory/domain/usecases/report-usecases';
import { inventoryStrings } from '@/features/inventory/presentation/strings/inventory-strings';

export const instant = false;

/**
 * HU-06: biweekly cost report per project/period (generated without manual
 * typing). HU-07: one-click Excel export via the API route.
 */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; from?: string; to?: string }>;
}) {
  const repo = provideInventoryRepository();
  const params = await searchParams;

  const projectsResult = await new ListProjects(repo).execute();
  const projects = projectsResult.ok ? projectsResult.value : [];

  const project = params.project ?? projects[0]?.id ?? '';
  const from = params.from ?? '';
  const to = params.to ?? '';

  const hasPeriod = project && from && to;
  const reportResult = hasPeriod ? await new GetCostReport(repo).execute(project, from, to) : null;
  const rows = reportResult && reportResult.ok ? reportResult.value : [];
  const grandTotal = rows.reduce((sum, r) => sum + r.totalCost, 0);

  const exportQuery = new URLSearchParams({ project, from, to }).toString();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">{inventoryStrings.reportTitle}</h1>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-6"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.projectLabel}
          <select
            name="project"
            defaultValue={project}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.fromLabel}
          <input
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.toLabel}
          <input
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {inventoryStrings.generate}
        </button>
        {hasPeriod ? (
          <a
            href={`/api/reports/export?${exportQuery}`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {inventoryStrings.exportExcel}
          </a>
        ) : null}
      </form>

      {hasPeriod ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">{inventoryStrings.consumedQty}</th>
                <th className="px-4 py-3">{inventoryStrings.totalCost}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.materialId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-700">{r.code}</td>
                  <td className="px-4 py-3 text-slate-700">{r.description}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.consumedQty} {r.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.totalCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Sin consumos en el periodo seleccionado.
                  </td>
                </tr>
              ) : (
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-3">
                    {grandTotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Selecciona una obra y un periodo para generar el informe.
        </p>
      )}
    </section>
  );
}
