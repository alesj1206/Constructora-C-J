/** A recent stock movement for the "últimos movimientos" list (Pantalla A). */
export type MovementType = 'in' | 'out' | 'adjust';

export interface RecentMovement {
  readonly id: string;
  readonly type: MovementType;
  readonly materialCode: string;
  readonly materialDescription: string;
  readonly quantity: number;
  readonly unit: string;
  readonly reference: string | null; // work front (out) or OC note (in)
  readonly createdAt: string; // ISO string
}
