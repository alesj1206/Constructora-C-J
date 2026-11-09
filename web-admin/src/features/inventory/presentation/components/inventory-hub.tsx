'use client';

import { useMemo, useState } from 'react';
import { StockStatusBadge } from './stock-status-badge';
import { EntryModal } from './entry-modal';
import { IssueModal } from './issue-modal';
import { inventoryStrings } from '../strings/inventory-strings';
import type { MaterialBalance } from '../../domain/entities/stock';
import type { WorkFront } from '../../domain/entities/work-front';
import type { RecentMovement } from '../../domain/entities/movement';

type ModalKind = 'entry' | 'issue' | null;

/**
 * Pantalla A: the inventory hub. Kardex table with inline +/- actions that open
 * the entry/issue modals (material pre-selected). Status strip on top and a
 * collapsible "últimos movimientos" feed below.
 */
export function InventoryHub({
  balances,
  workFronts,
  recent,
}: {
  balances: MaterialBalance[];
  workFronts: WorkFront[];
  recent: RecentMovement[];
}) {
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState<MaterialBalance | null>(null);
  const [showFeed, setShowFeed] = useState(false);

  const criticalCount = balances.filter((b) => b.status === 'critical').length;
  const reorderCount = balances.filter((b) => b.status === 'reorder').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return balances;
    }
    return balances.filter(
      (b) => b.code.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
    );
  }, [balances, query]);

  function openEntry(material: MaterialBalance) {
    setSelected(material);
    setModal('entry');
  }
  function openIssue(material: MaterialBalance) {
    setSelected(material);
    setModal('issue');
  }
  function close() {
    setModal(null);
    setSelected(null);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* status strip */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          {criticalCount} en alerta — comprar ya
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          {reorderCount} en punto de pedido
        </span>
        <span className="ml-auto text-xs text-slate-400">Actualizado en vivo</span>
      </div>

      {/* search + two actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍  Buscar material..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {/* kardex table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.materialId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-800">{b.description}</span>
                  <span className="ml-2 text-xs text-slate-400">{b.code}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {b.balance} {b.unit}
                </td>
                <td className="px-4 py-3">
                  <StockStatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEntry(b)}
                      aria-label={`Entrada de ${b.description}`}
                      className="h-9 w-9 rounded-md border border-blue-200 bg-blue-50 text-lg font-bold text-blue-600 hover:bg-blue-100"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => openIssue(b)}
                      aria-label={`Salida de ${b.description}`}
                      className="h-9 w-9 rounded-md border border-slate-300 bg-slate-50 text-lg font-bold text-slate-700 hover:bg-slate-100"
                    >
                      –
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No hay materiales que coincidan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* recent movements (collapsible) */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowFeed((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <span className="text-sm font-semibold text-slate-700">
            {showFeed ? '▾' : '▸'} Últimos movimientos
          </span>
          <span className="text-xs text-slate-400">{recent.length} recientes</span>
        </button>
        {showFeed ? (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {recent.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    m.type === 'in'
                      ? 'bg-blue-100 text-blue-700'
                      : m.type === 'out'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Salida' : 'Ajuste'}
                </span>
                <span className="font-medium text-slate-700">{m.materialDescription}</span>
                <span className="text-slate-500">
                  {m.type === 'out' ? '−' : '+'}
                  {m.quantity} {m.unit}
                </span>
                {m.reference ? (
                  <span className="text-xs text-slate-400">· {m.reference}</span>
                ) : null}
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(m.createdAt).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
            {recent.length === 0 ? (
              <li className="px-5 py-4 text-center text-sm text-slate-400">Sin movimientos aún.</li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <p className="rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-500">
        {inventoryStrings.formulaNote}
      </p>

      {/* modals */}
      {modal === 'entry' && selected ? <EntryModal material={selected} onClose={close} /> : null}
      {modal === 'issue' && selected ? (
        <IssueModal material={selected} workFronts={workFronts} onClose={close} />
      ) : null}
    </div>
  );
}
