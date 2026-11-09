'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createIssueAction } from '../actions/inventory-actions';
import { inventoryStrings } from '../strings/inventory-strings';
import { Modal } from './modal';
import { SignaturePad } from './signature-pad';
import type { MaterialBalance } from '../../domain/entities/stock';
import type { WorkFront } from '../../domain/entities/work-front';

/**
 * HU-02: issue voucher modal, opened from a row (material pre-selected).
 * Requires work front, operator and on-screen signature; discounts stock.
 */
export function IssueModal({
  material,
  workFronts,
  onClose,
}: {
  material: MaterialBalance;
  workFronts: WorkFront[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [signature, setSignature] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    if (signature.trim().length === 0) {
      setError('La firma es obligatoria.');
      return;
    }
    startTransition(async () => {
      const result = await createIssueAction({
        materialId: material.materialId,
        quantity: Number(data.get('quantity') ?? 0),
        workFrontId: String(data.get('workFrontId') ?? ''),
        operatorName: String(data.get('operatorName') ?? ''),
        signatureData: signature,
        observations: String(data.get('observations') ?? '').trim() || null,
      });
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error ?? inventoryStrings.genericError);
      }
    });
  }

  const inputClass =
    'rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <Modal title="Salida de material" subtitle="Despacho rápido · frente de obra" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
          <span className="text-sm font-bold text-blue-800">{material.description}</span>
          <span className="text-xs text-blue-600">
            {material.balance} {material.unit} disp.
          </span>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.workFrontLabel} *
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
          {inventoryStrings.operatorLabel} *
          <input
            name="operatorName"
            required
            placeholder="Juan Pérez - Oficial"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.quantityLabel} *
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            required
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.signatureLabel} *
          <SignaturePad onChange={setSignature} />
        </div>

        {showNote ? (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {inventoryStrings.observationsLabel}
            <input name="observations" className={inputClass} />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="self-start text-sm font-medium text-blue-600"
          >
            + agregar observación
          </button>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isPending ? inventoryStrings.saving : inventoryStrings.dispatch}
        </button>
      </form>
    </Modal>
  );
}
