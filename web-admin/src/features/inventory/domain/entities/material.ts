/** ABC classification by cost weight (HU-00). */
export type AbcClass = 'A' | 'B' | 'C';

/** A material in the single catalog (HU-00). Pure domain entity. */
export interface Material {
  readonly id: string;
  readonly code: string;
  readonly description: string;
  readonly unit: string;
  readonly abcClass: AbcClass;
  readonly reorderPoint: number; // PP (HU-03)
  readonly safetyStock: number; // SS (HU-03)
  readonly isActive: boolean;
}

export const ABC_CLASSES: readonly AbcClass[] = ['A', 'B', 'C'];

export function isAbcClass(value: unknown): value is AbcClass {
  return value === 'A' || value === 'B' || value === 'C';
}
