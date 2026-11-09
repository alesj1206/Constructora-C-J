/** Result of a physical count vs system balance (HU-04). */
export interface CountDifference {
  readonly materialId: string;
  readonly code: string;
  readonly description: string;
  readonly unit: string;
  readonly systemBalance: number;
  readonly countedQty: number;
  readonly difference: number; // countedQty - systemBalance
}

/** Consumption deviation for a work front + material (HU-05). */
export interface ConsumptionDeviation {
  readonly materialId: string;
  readonly code: string;
  readonly description: string;
  readonly unit: string;
  readonly plannedQty: number;
  readonly realQty: number;
  readonly deviationPct: number; // (real - planned) / planned * 100
}

/** A row of the biweekly cost report per project (HU-06). */
export interface CostReportRow {
  readonly materialId: string;
  readonly code: string;
  readonly description: string;
  readonly unit: string;
  readonly consumedQty: number;
  readonly totalCost: number;
}
