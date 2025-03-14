import { z } from 'zod';

export const customerEquipmentSchema = z.object({
  equipmentId: z.string().min(1, { message: 'Equipment ID is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  make: z.string().default(''),
  model: z.string().default(''),
  serialNumber: z.string().min(1, { message: 'Serial Number is required' }),
  rangeMin: z.coerce.number().default(''),
  rangeMax: z.coerce.number().default(''),
  uom: z.string().default(''),
  notes: z.string().default(''),
});
