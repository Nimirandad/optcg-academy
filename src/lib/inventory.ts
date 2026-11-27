import raw from '../../docs/coverage/rules-inventory.json';
import { inventorySchema } from './schemas';

/** Falla el build si el inventario no cumple el esquema. */
export const inventory = inventorySchema.parse(raw);
