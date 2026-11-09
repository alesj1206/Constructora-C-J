'use client';

import { useEffect, useRef } from 'react';
import { inventoryStrings } from '../strings/inventory-strings';

/**
 * On-screen signature capture (HU-02). Draws on a canvas and reports the
 * resulting PNG data URL to the parent via onChange. Supports mouse and touch.
 */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    function pos(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function start(event: PointerEvent) {
      drawing.current = true;
      hasInk.current = true;
      const p = pos(event);
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
    }
    function move(event: PointerEvent) {
      if (!drawing.current) {
        return;
      }
      const p = pos(event);
      ctx!.lineTo(p.x, p.y);
      ctx!.stroke();
    }
    function end() {
      if (!drawing.current) {
        return;
      }
      drawing.current = false;
      if (hasInk.current) {
        onChange(canvas!.toDataURL('image/png'));
      }
    }

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
    };
  }, [onChange]);

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInk.current = false;
      onChange('');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={360}
        height={120}
        className="touch-none rounded-md border border-dashed border-slate-400 bg-white"
      />
      <button
        type="button"
        onClick={clear}
        className="self-start text-xs text-slate-500 underline hover:text-slate-700"
      >
        {inventoryStrings.clearSignature}
      </button>
    </div>
  );
}
