'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createIssueAction } from '../actions/inventory-actions';
import { inventoryStrings } from '../strings/inventory-strings';
import { SignaturePad } from './signature-pad';
import type { Material } from '../../domain/entities/material';
import type { WorkFront } from '../../domain/entities/work-front';

/** HU-02: create a digital issue voucher with work front, operator, signature. */
export function IssueForm({
  materials,
  workFronts,
}: {
  materials: Material[];
  workFronts: WorkFront[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setMessage(null);

    if (signature.trim().length === 0) {
      setError('La firma es obligatoria.');
      return;
    }

    startTransition(async () => {
      const result = await createIssueAction({
        materialId: String(data.get('materialId') ?? ''),
        quantity: Number(data.get('quantity') ?? 0),
        workFrontId: String(data.get('workFrontId') ?? ''),
        operatorName: String(data.get('operatorName') ?? ''),
        signatureData: signature,
        observations: String(data.get('observations') ?? '').trim() || null,
      });
      if (result.ok) {
        setMessage(inventoryStrings.issueRegistered);
        form.reset();
        setSignature('');
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
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">{inventoryStrings.issueTitle}</h2>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.workFrontLabel}
        <select name="workFrontId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Seleccione...
          </option>
          {workFronts.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.projectName} · {wf.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.operatorLabel}
        <input
          name="operatorName"
          required
          placeholder="Juan Pérez - Oficial"
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
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
          {inventoryStrings.quantityLabel}
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            required
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.signatureLabel}
        <SignaturePad onChange={setSignature} />
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {inventoryStrings.observationsLabel}
        <input name="observations" className={inputClass} />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending ? inventoryStrings.saving : inventoryStrings.dispatch}
      </button>
    </form>
  );
}
