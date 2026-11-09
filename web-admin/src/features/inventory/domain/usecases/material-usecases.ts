import { failure, type Result } from '@/core/result';
import type { Material } from '../entities/material';
import { isAbcClass } from '../entities/material';
import type {
  CreateMaterialInput,
  InventoryRepository,
} from '../repositories/inventory-repository';

/** HU-00: list the material catalog. */
export class ListMaterials {
  constructor(private readonly repo: InventoryRepository) {}
  execute(): Promise<Result<Material[]>> {
    return this.repo.listMaterials();
  }
}

/** HU-00: create a material with unique code, unit and ABC class. */
export class CreateMaterial {
  constructor(private readonly repo: InventoryRepository) {}

  execute(input: CreateMaterialInput): Promise<Result<Material>> {
    if (input.code.trim().length === 0 || input.description.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Code and description are required.'));
    }
    if (input.unit.trim().length === 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Unit is required.'));
    }
    if (!isAbcClass(input.abcClass)) {
      return Promise.resolve(failure('INVALID_INPUT', 'Invalid ABC class.'));
    }
    if (input.reorderPoint < 0 || input.safetyStock < 0) {
      return Promise.resolve(failure('INVALID_INPUT', 'Thresholds must be >= 0.'));
    }
    return this.repo.createMaterial({
      ...input,
      code: input.code.trim(),
      description: input.description.trim(),
      unit: input.unit.trim(),
    });
  }
}
