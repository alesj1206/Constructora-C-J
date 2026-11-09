-- Inventory schema for HU-00 .. HU-07.
-- Run after 0001_init.sql. Uses database constructora_cj.

USE constructora_cj;

-- HU-00: single material catalog with ABC classification.
CREATE TABLE IF NOT EXISTS materials (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  code         VARCHAR(40)  NOT NULL,
  description  VARCHAR(255) NOT NULL,
  unit         VARCHAR(20)  NOT NULL,          -- e.g. bultos, un, m3
  abc_class    ENUM('A','B','C') NOT NULL DEFAULT 'C',
  reorder_point DECIMAL(12,2) NOT NULL DEFAULT 0,  -- PP (HU-03)
  safety_stock  DECIMAL(12,2) NOT NULL DEFAULT 0,  -- SS (HU-03)
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_materials_code (code)
) ENGINE = InnoDB;

-- Projects / construction sites.
CREATE TABLE IF NOT EXISTS projects (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  name       VARCHAR(255) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_name (name)
) ENGINE = InnoDB;

-- Work fronts / activities inside a project (e.g. "Apartamento 501 - Drywall").
CREATE TABLE IF NOT EXISTS work_fronts (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  project_id CHAR(36)     NOT NULL,
  name       VARCHAR(255) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_work_fronts_project (project_id),
  CONSTRAINT fk_work_fronts_project FOREIGN KEY (project_id) REFERENCES projects (id)
) ENGINE = InnoDB;

-- Purchase orders (HU-01). Status moves to 'received' when entries complete it.
CREATE TABLE IF NOT EXISTS purchase_orders (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  oc_number   VARCHAR(40)  NOT NULL,
  supplier    VARCHAR(255) NOT NULL,
  project_id  CHAR(36)     NULL,
  status      ENUM('open','received','cancelled') NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_po_number (oc_number),
  CONSTRAINT fk_po_project FOREIGN KEY (project_id) REFERENCES projects (id)
) ENGINE = InnoDB;

-- Lines of a purchase order (material + expected qty + unit price for costing).
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  purchase_order_id CHAR(36)      NOT NULL,
  material_id       CHAR(36)      NOT NULL,
  expected_qty      DECIMAL(12,2) NOT NULL,
  unit_price        DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_poi_po (purchase_order_id),
  KEY idx_poi_material (material_id),
  CONSTRAINT fk_poi_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
  CONSTRAINT fk_poi_material FOREIGN KEY (material_id) REFERENCES materials (id)
) ENGINE = InnoDB;

-- Stock movements: single source of truth for the Kardex (HU-01, HU-02, HU-04).
-- 'in'     -> material receipt against a PO
-- 'out'    -> issue voucher (vale)
-- 'adjust' -> reconciliation adjustment (physical count difference)
CREATE TABLE IF NOT EXISTS stock_movements (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  material_id       CHAR(36)      NOT NULL,
  movement_type     ENUM('in','out','adjust') NOT NULL,
  quantity          DECIMAL(12,2) NOT NULL,       -- always > 0; sign implied by type
  unit_cost         DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_order_id CHAR(36)      NULL,            -- for 'in'
  work_front_id     CHAR(36)      NULL,            -- for 'out'
  operator_name     VARCHAR(255)  NULL,            -- for 'out' (HU-02)
  signature_data    MEDIUMTEXT    NULL,            -- data URL of the on-screen signature
  remission_note    VARCHAR(500)  NULL,            -- HU-01 novelty / HU-02 observations
  created_by        CHAR(36)      NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sm_material (material_id),
  KEY idx_sm_type (movement_type),
  KEY idx_sm_front (work_front_id),
  CONSTRAINT chk_sm_qty CHECK (quantity > 0),
  CONSTRAINT fk_sm_material FOREIGN KEY (material_id) REFERENCES materials (id),
  CONSTRAINT fk_sm_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
  CONSTRAINT fk_sm_front FOREIGN KEY (work_front_id) REFERENCES work_fronts (id),
  CONSTRAINT fk_sm_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE = InnoDB;

-- Planned consumption per work front + material (HU-05).
CREATE TABLE IF NOT EXISTS planned_consumption (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  work_front_id CHAR(36)      NOT NULL,
  material_id   CHAR(36)      NOT NULL,
  planned_qty   DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_front_material (work_front_id, material_id),
  CONSTRAINT fk_plan_front FOREIGN KEY (work_front_id) REFERENCES work_fronts (id),
  CONSTRAINT fk_plan_material FOREIGN KEY (material_id) REFERENCES materials (id)
) ENGINE = InnoDB;

-- Kardex view: current balance per material = sum(in) - sum(out) + sum(adjust-as-signed).
-- Adjustments are stored as 'adjust' with quantity > 0 and a sign convention via
-- a companion column is avoided; instead we store the adjustment delta as a
-- regular in/out. For simplicity here, 'adjust' increases stock; negative
-- corrections are recorded as 'out'. (Reconciliation use case decides the type.)
CREATE OR REPLACE VIEW material_balances AS
SELECT
  m.id   AS material_id,
  m.code AS code,
  m.description AS description,
  m.unit AS unit,
  m.abc_class AS abc_class,
  m.reorder_point AS reorder_point,
  m.safety_stock AS safety_stock,
  COALESCE(SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity
                    WHEN sm.movement_type = 'adjust' THEN sm.quantity
                    WHEN sm.movement_type = 'out' THEN -sm.quantity
                    ELSE 0 END), 0) AS balance
FROM materials m
LEFT JOIN stock_movements sm ON sm.material_id = m.id
WHERE m.is_active = TRUE
GROUP BY m.id, m.code, m.description, m.unit, m.abc_class, m.reorder_point, m.safety_stock;
