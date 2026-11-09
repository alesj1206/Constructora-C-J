'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createMaterialAction } from '../actions/inventory-actions';
import { inventoryStrings } from '../strings/inventory-strings';
import type { AbcClass } from '../../domain/entities/material';

/** HU-00: form to create a catalog material. Presentational + local state. */
export function MaterialForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createMaterialAction({
        code: String(data.get('code') ?? ''),
        description: String(data.get('description') ?? ''),
        unit: String(data.get('unit') ?? ''),
        abcClass: String(data.get('abcClass') ?? 'C') as AbcClass,
        reorderPoint: Number(data.get('reorderPoint') ?? 0),
        safetyStock: Number(data.get('safetyStock') ?? 0),
      });
      if (result.ok) {
        setMessage(inventoryStrings.materialCreated);
        form.reset();
        router.refresh();
      } else {
        setError(result.error ?? inventoryStrings.genericError);
      }
    });
  }

  const inputClass =
    'rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
    >
      <h2 className="col-span-full text-lg font-semibold text-slate-900">
        {inventoryStrings.newMaterial}
      </h2>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.codeLabel}
        <input name="code" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.descriptionLabel}
        <input name="description" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.unitLabel}
        <input name="unit" required placeholder="bultos, un, m3" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.abcLabel}
        <select name="abcClass" defaultValue="C" className={inputClass}>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.reorderLabel}
        <input
          name="reorderPoint"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.safetyLabel}
        <input
          name="safetyStock"
          type="number"
          min="0"
          step="0.01"
          defaultValue="0"
          className={inputClass}
        />
      </label>

      {error ? (
        <p role="alert" className="col-span-full text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {message ? <p className="col-span-full text-sm text-green-700">{message}</p> : null}

      <div className="col-span-full">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? inventoryStrings.saving : inventoryStrings.save}
        </button>
      </div>
    </form>
  );
}
