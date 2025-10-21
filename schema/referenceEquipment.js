import { z } from 'zod';

export const CATEGORY_INVENTORY_ID_PREFIX_MAP = {
  'TEMPERATURE & HUMIDITY': 'T',
  PRESSURE: 'P',
  ELECTRICAL: 'E',
  DIMENSIONAL: 'D',
  VOLUMETRIC: 'V',
  MASS: 'M',
};

export const referenceEquipmentSchema = z.object({
  inventoryId: z.string().min(1, 'Inventory ID is required'),
  category: z.string().min(1, 'Category is required'),
  tagId: z.string().min(1, 'Tag ID is required'),
  description: z.string().min(1, 'Description is required'),
  make: z.string().default(''),
  model: z.string().default(''),
  serialNumber: z.string().default(''),
  type: z.string().default(''),
  qty: z.coerce.number().default(1),
  rangeMin: z.string().default(''),
  rangeMax: z.string().default(''),
  rangeMinPercent: z.string().default(''),
  rangeMaxPercent: z.string().default(''),
  certificateNo: z.string().default(''),
  traceability: z.string().default(''),
  uncertainty: z.string().default(''),
  uncertaintyUnit: z.string().default(''),
  k: z.string().default(''),
  dueDate: z.string().default(''),
});
