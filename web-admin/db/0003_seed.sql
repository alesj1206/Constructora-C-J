-- Sample data for development/validation. Idempotent-ish via fixed codes/names.
USE constructora_cj;

INSERT INTO projects (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Proyecto Pompano')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO work_fronts (id, project_id, name)
VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Apartamento 501 - Drywall'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Cimentación Torre A')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO materials (id, code, description, unit, abc_class, reorder_point, safety_stock)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'MAT-001', 'Cemento Gris 50kg (Argos)', 'bultos', 'A', 75, 30),
  ('33333333-3333-3333-3333-333333333302', 'MAT-002', 'Varilla Corrugada 1/2" (6m)', 'un', 'A', 100, 40),
  ('33333333-3333-3333-3333-333333333303', 'MAT-003', 'Ladrillo Limpio 10x20x40', 'un', 'B', 500, 200),
  ('33333333-3333-3333-3333-333333333304', 'MAT-004', 'Placa de Yeso Drywall 1.22x2.44', 'un', 'B', 150, 60)
ON DUPLICATE KEY UPDATE description = VALUES(description), unit = VALUES(unit),
  abc_class = VALUES(abc_class), reorder_point = VALUES(reorder_point), safety_stock = VALUES(safety_stock);

INSERT INTO purchase_orders (id, oc_number, supplier, project_id, status)
VALUES ('44444444-4444-4444-4444-444444444401', 'OC-2026-089', 'Cementos Argos S.A.', '11111111-1111-1111-1111-111111111111', 'open')
ON DUPLICATE KEY UPDATE supplier = VALUES(supplier);

INSERT INTO purchase_order_items (id, purchase_order_id, material_id, expected_qty, unit_price)
VALUES
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 50, 28000),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333302', 60, 9500)
ON DUPLICATE KEY UPDATE expected_qty = VALUES(expected_qty), unit_price = VALUES(unit_price);

-- Opening balances via 'in' movements so the Kardex has stock to show.
INSERT INTO stock_movements (id, material_id, movement_type, quantity, unit_cost, remission_note)
VALUES
  ('66666666-6666-6666-6666-666666666601', '33333333-3333-3333-3333-333333333301', 'in', 25, 28000, 'Saldo inicial'),
  ('66666666-6666-6666-6666-666666666602', '33333333-3333-3333-3333-333333333302', 'in', 80, 9500, 'Saldo inicial'),
  ('66666666-6666-6666-6666-666666666603', '33333333-3333-3333-3333-333333333303', 'in', 1500, 900, 'Saldo inicial'),
  ('66666666-6666-6666-6666-666666666604', '33333333-3333-3333-3333-333333333304', 'in', 320, 32000, 'Saldo inicial')
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- A planned consumption for deviation demo (HU-05).
INSERT INTO planned_consumption (id, work_front_id, material_id, planned_qty)
VALUES ('77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222201', '33333333-3333-3333-3333-333333333304', 100)
ON DUPLICATE KEY UPDATE planned_qty = VALUES(planned_qty);
