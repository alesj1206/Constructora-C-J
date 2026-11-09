'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Minimal modal shell used by the entry/issue actions on the inventory hub.
 * Closes on Escape and on backdrop click. Keeps the operator in context
 * instead of navigating to another page.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4"
      onClick={onClose}
    >
      <div
        className="mt-10 w-full max-w-sm rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between rounded-t-2xl bg-slate-900 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-xl leading-none text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
