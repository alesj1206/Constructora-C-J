import type { StockStatus } from '../../domain/entities/stock';
import { inventoryStrings } from '../strings/inventory-strings';

/** Semaphore badge for a material's stock status (HU-03). */
export function StockStatusBadge({ status }: { status: StockStatus }) {
  const config: Record<StockStatus, { bg: string; dot: string; text: string; label: string }> = {
    ok: {
      bg: 'bg-green-100',
      dot: 'bg-green-600',
      text: 'text-green-700',
      label: inventoryStrings.statusOk,
    },
    reorder: {
      bg: 'bg-amber-100',
      dot: 'bg-amber-600',
      text: 'text-amber-700',
      label: inventoryStrings.statusReorder,
    },
    critical: {
      bg: 'bg-red-100',
      dot: 'bg-red-600',
      text: 'text-red-700',
      label: inventoryStrings.statusCritical,
    },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${c.bg} ${c.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
