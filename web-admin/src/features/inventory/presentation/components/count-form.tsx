'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registerCountAction } from '../actions/inventory-actions';
import { inventoryStrings } from '../strings/inventory-strings';
import type { Material } from '../../domain/entities/material';
import type { CountDifference } from '../../domain/entities/reconciliation';

/** HU-04: register a physical count and show the difference vs the system. */
export function CountForm({ materials }: { materials: Material[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CountDifference | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await registerCountAction({
        materialId: String(data.get('materialId') ?? ''),
        countedQty: Number(data.get('countedQty') ?? 0),
      });
      if (res.ok && res.difference) {
        setResult(res.difference);
        router.refresh();
      } else {
        setError(res.error ?? inventoryStrings.genericError);
      }
    });
  }

  const inputClass =
    'rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">{inventoryStrings.countTitle}</h2>

      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">
          {inventoryStrings.materialLabel}
          <select name="materialId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Seleccione...
            </option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.description}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.countedLabel}
          <input
            name="countedQty"
            type="number"
            min="0"
            step="0.01"
            required
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? inventoryStrings.saving : inventoryStrings.save}
      </button>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            {result.code} · {result.description}
          </p>
          <p className="mt-1">
            {inventoryStrings.systemBalance}: <strong>{result.systemBalance}</strong> ·{' '}
            {inventoryStrings.countedLabel}: <strong>{result.countedQty}</strong> ·{' '}
            {inventoryStrings.difference}:{' '}
            <strong className={result.difference === 0 ? 'text-green-700' : 'text-amber-700'}>
              {result.difference > 0 ? '+' : ''}
              {result.difference} {result.unit}
            </strong>
          </p>
        </div>
      ) : null}
    </form>
  );
}
