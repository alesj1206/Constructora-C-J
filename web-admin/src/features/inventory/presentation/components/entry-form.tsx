'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { findPurchaseOrderAction, registerEntryAction } from '../actions/inventory-actions';
import { inventoryStrings } from '../strings/inventory-strings';
import type { PurchaseOrder } from '../../domain/entities/purchase-order';

/** HU-01: find a PO, then register the real received quantity per item. */
export function EntryForm() {
  const router = useRouter();
  const [ocNumber, setOcNumber] = useState('');
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSaving, startSave] = useTransition();

  function search() {
    setError(null);
    setMessage(null);
    setNotFound(false);
    setPo(null);
    startSearch(async () => {
      const result = await findPurchaseOrderAction(ocNumber);
      if (!result.ok) {
        setError(result.error ?? inventoryStrings.genericError);
        return;
      }
      if (!result.po) {
        setNotFound(true);
        return;
      }
      setPo(result.po);
    });
  }

  function registerItem(form: HTMLFormElement, itemMaterialId: string, unitPrice: number) {
    const data = new FormData(form);
    const quantity = Number(data.get('quantity') ?? 0);
    const note = String(data.get('note') ?? '').trim();
    setError(null);
    setMessage(null);
    startSave(async () => {
      if (!po) {
        return;
      }
      const result = await registerEntryAction({
        purchaseOrderId: po.id,
        materialId: itemMaterialId,
        quantity,
        unitCost: unitPrice,
        remissionNote: note.length > 0 ? note : null,
      });
      if (result.ok) {
        setMessage(inventoryStrings.entryRegistered);
        router.refresh();
      } else {
        setError(result.error ?? inventoryStrings.genericError);
      }
    });
  }

  const inputClass =
    'rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">{inventoryStrings.entriesTitle}</h2>

      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          {inventoryStrings.ocLabel}
          <input
            value={ocNumber}
            onChange={(e) => setOcNumber(e.target.value)}
            placeholder="OC-2026-089"
            className={inputClass}
          />
        </label>
        <button
          type="button"
          onClick={search}
          disabled={isSearching || ocNumber.trim().length === 0}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSearching ? inventoryStrings.saving : inventoryStrings.searchOc}
        </button>
      </div>

      {notFound ? <p className="text-sm text-red-600">{inventoryStrings.ocNotFound}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      {po ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <span className="font-medium text-slate-700">{inventoryStrings.supplierLabel}:</span>{' '}
            <span className="text-slate-600">{po.supplier}</span>
            <span className="ml-3 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
              {po.status}
            </span>
          </div>

          {po.items.map((item) => (
            <form
              key={item.id}
              onSubmit={(e) => {
                e.preventDefault();
                registerItem(e.currentTarget, item.materialId, item.unitPrice);
              }}
              className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-4"
            >
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-slate-800">
                  {item.materialCode} · {item.materialDescription}
                </p>
                <p className="text-xs text-slate-500">
                  Esperado: {item.expectedQty} {item.unit} · Precio unit.: {item.unitPrice}
                </p>
              </div>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                {inventoryStrings.realQtyLabel}
                <input
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                {inventoryStrings.noveltyLabel}
                <input name="note" placeholder="Ej. bultos dañados" className={inputClass} />
              </label>
              <div className="sm:col-span-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {inventoryStrings.confirmEntry}
                </button>
              </div>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
