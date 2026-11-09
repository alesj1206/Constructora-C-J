/** Purchase order status (HU-01). */
export type PurchaseOrderStatus = 'open' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  readonly id: string;
  readonly materialId: string;
  readonly materialCode: string;
  readonly materialDescription: string;
  readonly unit: string;
  readonly expectedQty: number;
  readonly unitPrice: number;
}

export interface PurchaseOrder {
  readonly id: string;
  readonly ocNumber: string;
  readonly supplier: string;
  readonly projectId: string | null;
  readonly status: PurchaseOrderStatus;
  readonly items: readonly PurchaseOrderItem[];
}
