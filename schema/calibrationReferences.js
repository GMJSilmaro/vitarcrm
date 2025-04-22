import { z } from 'zod';

export const CLASS_TYPE = ['E2', 'M1', 'F1'];

export const classTypeEnum = z.enum(CLASS_TYPE, {
  message: 'Please select a class',
});

export const cuswdSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  tagId: z.string().min(1, 'Tag ID is required'),
  class: z.union([classTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  nominalValue: z.string().min(1, 'Nominal Value (g) is required'),
  currentYearError: z.string().default(''),
  currentYearActualValue: z.string().default(''),
  eUncertainty: z.string().default(''),
  uCertg: z.string().default(''),
  uCert2g2: z.string().default(''),
  uCert4vG4: z.string().default(''),
  uInstg: z.string().default(''),
  uInst2g2: z.string().default(''),
  uInst4vG4: z.string().default(''),
  prKgMn3: z.string().default(''),
  uPrKgMn3: z.string().default(''),
  lastYearError: z.string().default(''),
  lastYearActualValue: z.string().default(''),
  driftg: z.string().min(1, 'Drift (g) is required'),
});

export const mpeSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  code: z.union([classTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  weight: z.string().min(1, 'Weight (g) is required'),
  mpe: z.string().min(1, 'MPE is required'),
  uncertainty: z.string().default(''),
});

export const ckSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  dof: z.string().min(1, 'DOF is required'),
  value: z.string().min(1, '95.45% is required'),
});
