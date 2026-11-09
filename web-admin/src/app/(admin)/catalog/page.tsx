import Link from 'next/link';
import { provideInventoryRepository } from '@/core/di/inventory.di.server';
import { ListMaterials } from '@/features/inventory/domain/usecases/material-usecases';
import { MaterialForm } from '@/features/inventory/presentation/components/material-form';
import { inventoryStrings } from '@/features/inventory/presentation/strings/inventory-strings';

export const instant = false;

/** HU-00: material catalog with ABC classification (Pantalla B del MVP). */
export default async function CatalogPage() {
  const result = await new ListMaterials(provideInventoryRepository()).execute();
  const materials = result.ok ? result.value : [];

  return (
    <section className="flex flex-col gap-6">
      <Link href="/inventory" className="text-sm font-medium text-blue-600 hover:text-blue-700">
        ‹ Volver a Inventario
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{inventoryStrings.catalogTitle}</h1>
        <p className="text-sm text-slate-500">
          Nombre, unidad y umbrales de cada material · base del inventario
        </p>
      </div>

      <MaterialForm />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">ABC</th>
              <th className="px-4 py-3">PP</th>
              <th className="px-4 py-3">SS</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-slate-700">{m.code}</td>
                <td className="px-4 py-3 text-slate-700">{m.description}</td>
                <td className="px-4 py-3 text-slate-500">{m.unit}</td>
                <td className="px-4 py-3 text-slate-500">{m.abcClass}</td>
                <td className="px-4 py-3 text-slate-500">{m.reorderPoint}</td>
                <td className="px-4 py-3 text-slate-500">{m.safetyStock}</td>
              </tr>
            ))}
            {materials.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay materiales en el catálogo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
