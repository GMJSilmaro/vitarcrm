import { z } from 'zod';

export const CATEGORY = [
  'TEMPERATURE & HUMIDITY',
  'PRESSURE',
  'ELECTRICAL',
  'DIMENSIONAL',
  'VOLUMETRIC',
  'MASS',
];

const categoryEnum = z.enum(CATEGORY, {
  message: 'Please select a calibration category',
});

export const customerEquipmentSchema = z.object({
  equipmentId: z.string().min(1, { message: 'Equipment ID is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  category: z.union([categoryEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  make: z.string().default(''),
  model: z.string().default(''),
  serialNumber: z.string().min(1, { message: 'Serial Number is required' }),
  rangeMin: z.coerce.number().default(''),
  rangeMax: z.coerce.number().default(''),
  uom: z.string().default(''),
  tolerance: z.string().default(''),
  notes: z.string().default(''),
});
