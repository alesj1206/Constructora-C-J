import 'server-only';
import { MysqlInventoryDataSource } from '@/features/inventory/data/datasources/mysql-inventory.datasource';
import { InventoryRepositoryImpl } from '@/features/inventory/data/repositories/inventory-repository.impl';
import type { InventoryRepository } from '@/features/inventory/domain/repositories/inventory-repository';

/** Server-side DI for the inventory feature (MySQL-backed). */
export function provideInventoryRepository(): InventoryRepository {
  return new InventoryRepositoryImpl(new MysqlInventoryDataSource());
}
