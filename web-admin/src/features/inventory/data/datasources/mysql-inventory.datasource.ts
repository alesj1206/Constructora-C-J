import 'server-only';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '@/lib/mysql';

/**
 * The only module in the inventory feature that talks to MySQL.
 * Returns raw rows; mapping to domain entities happens in the repository.
 */

export interface MaterialRow extends RowDataPacket {
  id: string;
  code: string;
  description: string;
  unit: string;
  abc_class: 'A' | 'B' | 'C';
  reorder_point: string | number;
  safety_stock: string | number;
  is_active: number;
}

export interface BalanceRow extends RowDataPacket {
  material_id: string;
  code: string;
  description: string;
  unit: string;
  abc_class: 'A' | 'B' | 'C';
  reorder_point: string | number;
  safety_stock: string | number;
  balance: string | number;
}

export interface PoRow extends RowDataPacket {
  id: string;
  oc_number: string;
  supplier: string;
  project_id: string | null;
  status: 'open' | 'received' | 'cancelled';
}

export interface PoItemRow extends RowDataPacket {
  id: string;
  material_id: string;
  material_code: string;
  material_description: string;
  unit: string;
  expected_qty: string | number;
  unit_price: string | number;
}

export interface WorkFrontRow extends RowDataPacket {
  id: string;
  project_id: string;
  project_name: string;
  name: string;
}

export interface DeviationRow extends RowDataPacket {
  material_id: string;
  code: string;
  description: string;
  unit: string;
  planned_qty: string | number;
  real_qty: string | number;
}

export interface CostRow extends RowDataPacket {
  material_id: string;
  code: string;
  description: string;
  unit: string;
  consumed_qty: string | number;
  total_cost: string | number;
}

export interface MovementRow extends RowDataPacket {
  id: string;
  movement_type: 'in' | 'out' | 'adjust';
  quantity: string | number;
  material_code: string;
  material_description: string;
  unit: string;
  reference: string | null;
  created_at: Date;
}

export class MysqlInventoryDataSource {
  async selectMaterials(): Promise<MaterialRow[]> {
    const [rows] = await getPool().query<MaterialRow[]>(
      'SELECT id, code, description, unit, abc_class, reorder_point, safety_stock, is_active FROM materials WHERE is_active = TRUE ORDER BY code',
    );
    return rows;
  }

  async insertMaterial(
    code: string,
    description: string,
    unit: string,
    abcClass: string,
    reorderPoint: number,
    safetyStock: number,
  ): Promise<MaterialRow> {
    const pool = getPool();
    await pool.execute(
      'INSERT INTO materials (code, description, unit, abc_class, reorder_point, safety_stock) VALUES (?,?,?,?,?,?)',
      [code, description, unit, abcClass, reorderPoint, safetyStock],
    );
    const [rows] = await pool.query<MaterialRow[]>(
      'SELECT id, code, description, unit, abc_class, reorder_point, safety_stock, is_active FROM materials WHERE code = ?',
      [code],
    );
    return rows[0];
  }

  async selectBalances(): Promise<BalanceRow[]> {
    const [rows] = await getPool().query<BalanceRow[]>(
      'SELECT material_id, code, description, unit, abc_class, reorder_point, safety_stock, balance FROM material_balances ORDER BY code',
    );
    return rows;
  }

  async selectRecentMovements(limit: number): Promise<MovementRow[]> {
    const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
    const [rows] = await getPool().query<MovementRow[]>(
      `SELECT sm.id, sm.movement_type, sm.quantity, m.code AS material_code,
              m.description AS material_description, m.unit AS unit,
              COALESCE(wf.name, sm.remission_note) AS reference,
              sm.created_at
       FROM stock_movements sm
       JOIN materials m ON m.id = sm.material_id
       LEFT JOIN work_fronts wf ON wf.id = sm.work_front_id
       ORDER BY sm.created_at DESC
       LIMIT ?`,
      [safeLimit],
    );
    return rows;
  }

  async selectPurchaseOrder(ocNumber: string): Promise<{ po: PoRow; items: PoItemRow[] } | null> {
    const pool = getPool();
    const [poRows] = await pool.query<PoRow[]>(
      'SELECT id, oc_number, supplier, project_id, status FROM purchase_orders WHERE oc_number = ? LIMIT 1',
      [ocNumber],
    );
    if (poRows.length === 0) {
      return null;
    }
    const po = poRows[0];
    const [itemRows] = await pool.query<PoItemRow[]>(
      `SELECT poi.id, poi.material_id, m.code AS material_code, m.description AS material_description,
              m.unit AS unit, poi.expected_qty, poi.unit_price
       FROM purchase_order_items poi
       JOIN materials m ON m.id = poi.material_id
       WHERE poi.purchase_order_id = ?`,
      [po.id],
    );
    return { po, items: itemRows };
  }

  /** HU-01: insert an 'in' movement; optionally mark the PO as received. */
  async insertEntry(params: {
    purchaseOrderId: string;
    materialId: string;
    quantity: number;
    unitCost: number;
    remissionNote: string | null;
    createdBy: string | null;
  }): Promise<void> {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `INSERT INTO stock_movements
           (material_id, movement_type, quantity, unit_cost, purchase_order_id, remission_note, created_by)
         VALUES (?, 'in', ?, ?, ?, ?, ?)`,
        [
          params.materialId,
          params.quantity,
          params.unitCost,
          params.purchaseOrderId,
          params.remissionNote,
          params.createdBy,
        ],
      );
      await conn.execute(`UPDATE purchase_orders SET status = 'received' WHERE id = ?`, [
        params.purchaseOrderId,
      ]);
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async selectWorkFronts(): Promise<WorkFrontRow[]> {
    const [rows] = await getPool().query<WorkFrontRow[]>(
      `SELECT wf.id, wf.project_id, p.name AS project_name, wf.name
       FROM work_fronts wf JOIN projects p ON p.id = wf.project_id
       WHERE wf.is_active = TRUE ORDER BY p.name, wf.name`,
    );
    return rows;
  }

  /** Current balance of a single material (from the view). */
  async selectBalanceFor(materialId: string): Promise<number> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT balance FROM material_balances WHERE material_id = ?',
      [materialId],
    );
    return rows.length > 0 ? Number(rows[0].balance) : 0;
  }

  /** HU-02: insert an 'out' movement inside a transaction (guards balance). */
  async insertIssue(params: {
    materialId: string;
    quantity: number;
    workFrontId: string;
    operatorName: string;
    signatureData: string;
    observations: string | null;
    createdBy: string | null;
  }): Promise<void> {
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Lock the material row, recompute balance, and reject if insufficient.
      const [balRows] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(CASE WHEN movement_type='in' THEN quantity
                                  WHEN movement_type='adjust' THEN quantity
                                  WHEN movement_type='out' THEN -quantity ELSE 0 END),0) AS balance
         FROM stock_movements WHERE material_id = ? FOR UPDATE`,
        [params.materialId],
      );
      const balance = Number(balRows[0].balance);
      if (params.quantity > balance) {
        throw new InventoryError('INSUFFICIENT_STOCK', 'Not enough stock for the issue.');
      }
      await conn.execute(
        `INSERT INTO stock_movements
           (material_id, movement_type, quantity, work_front_id, operator_name, signature_data, remission_note, created_by)
         VALUES (?, 'out', ?, ?, ?, ?, ?, ?)`,
        [
          params.materialId,
          params.quantity,
          // Optional columns: store NULL instead of empty string so the FK on
          // work_front_id stays valid and signature can be absent (mobile MVP).
          params.workFrontId.trim().length > 0 ? params.workFrontId : null,
          params.operatorName,
          params.signatureData.trim().length > 0 ? params.signatureData : null,
          params.observations,
          params.createdBy,
        ],
      );
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /** HU-04: insert an adjustment movement for the counted difference. */
  async insertAdjustment(
    materialId: string,
    delta: number,
    createdBy: string | null,
  ): Promise<void> {
    if (delta === 0) {
      return;
    }
    const type = delta > 0 ? 'adjust' : 'out';
    await getPool().execute(
      `INSERT INTO stock_movements (material_id, movement_type, quantity, remission_note, created_by)
       VALUES (?, ?, ?, 'Ajuste por conteo físico', ?)`,
      [materialId, type, Math.abs(delta), createdBy],
    );
  }

  async selectMaterialMeta(
    materialId: string,
  ): Promise<{ code: string; description: string; unit: string } | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT code, description, unit FROM materials WHERE id = ?',
      [materialId],
    );
    if (rows.length === 0) {
      return null;
    }
    return { code: rows[0].code, description: rows[0].description, unit: rows[0].unit };
  }

  /** HU-05: planned vs real consumption per work front. */
  async selectDeviation(workFrontId: string): Promise<DeviationRow[]> {
    const [rows] = await getPool().query<DeviationRow[]>(
      `SELECT pc.material_id, m.code, m.description, m.unit,
              pc.planned_qty,
              COALESCE((SELECT SUM(sm.quantity) FROM stock_movements sm
                        WHERE sm.material_id = pc.material_id
                          AND sm.work_front_id = pc.work_front_id
                          AND sm.movement_type = 'out'), 0) AS real_qty
       FROM planned_consumption pc
       JOIN materials m ON m.id = pc.material_id
       WHERE pc.work_front_id = ?`,
      [workFrontId],
    );
    return rows;
  }

  async selectProjects(): Promise<{ id: string; name: string }[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT id, name FROM projects WHERE is_active = TRUE ORDER BY name',
    );
    return rows.map((r) => ({ id: r.id as string, name: r.name as string }));
  }

  /** HU-06 / HU-07: consumed qty and cost per material for a project + period. */
  async selectCostReport(projectId: string, from: string, to: string): Promise<CostRow[]> {
    const [rows] = await getPool().query<CostRow[]>(
      `SELECT sm.material_id, m.code, m.description, m.unit,
              SUM(sm.quantity) AS consumed_qty,
              SUM(sm.quantity * sm.unit_cost) AS total_cost
       FROM stock_movements sm
       JOIN materials m ON m.id = sm.material_id
       JOIN work_fronts wf ON wf.id = sm.work_front_id
       WHERE wf.project_id = ?
         AND sm.movement_type = 'out'
         AND sm.created_at >= ?
         AND sm.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY sm.material_id, m.code, m.description, m.unit
       ORDER BY m.code`,
      [projectId, from, to],
    );
    return rows;
  }
}

export type InventoryErrorCode = 'INSUFFICIENT_STOCK' | 'DUPLICATE' | 'UNKNOWN';

export class InventoryError extends Error {
  constructor(
    readonly code: InventoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InventoryError';
  }
}
