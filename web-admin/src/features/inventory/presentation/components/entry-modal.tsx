'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { findPurchaseOrderAction, registerEntryAction } from '../actions/inventory-actions';
import { inventoryStrings } from '../strings/inventory-strings';
import { Modal } from './modal';
import type { MaterialBalance } from '../../domain/entities/stock';
import type { PurchaseOrder } from '../../domain/entities/purchase-order';

/**
 * HU-01: material entry modal, opened from a row (material pre-selected).
 * Finds the PO, then registers the real received quantity + novelty.
 */
export function EntryModal({
  material,
  onClose,
}: {
  material: MaterialBalance;
  onClose: () => void;
}) {
  const router = useRouter();
  const [ocNumber, setOcNumber] = useState('');
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSaving, startSave] = useTransition();

  function search() {
    setError(null);
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

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!po) {
      return;
    }
    const data = new FormData(e.currentTarget);
    const item = po.items.find((i) => i.materialId === material.materialId) ?? po.items[0];
    setError(null);
    startSave(async () => {
      const result = await registerEntryAction({
        purchaseOrderId: po.id,
        materialId: material.materialId,
        quantity: Number(data.get('quantity') ?? 0),
        unitCost: item ? item.unitPrice : 0,
        remissionNote: String(data.get('note') ?? '').trim() || null,
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
    <Modal title="Entrada de material" subtitle="Ingreso contra orden de compra" onClose={onClose}>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
        <span className="text-sm font-bold text-blue-800">{material.description}</span>
        <span className="text-xs text-blue-600">
          {material.balance} {material.unit}
        </span>
      </div>

      <div className="mb-4 flex items-end gap-2">
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
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSearching ? '...' : inventoryStrings.searchOc}
        </button>
      </div>

      {notFound ? <p className="mb-2 text-sm text-red-600">{inventoryStrings.ocNotFound}</p> : null}

      {po ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {inventoryStrings.supplierLabel}: <strong>{po.supplier}</strong>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
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
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {inventoryStrings.noveltyLabel}
            <input name="note" placeholder="Ej. bultos dañados" className={inputClass} />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSaving}
            className="mt-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? inventoryStrings.saving : inventoryStrings.confirmEntry}
          </button>
        </form>
      ) : null}
      {!po && error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Modal>
  );
}
