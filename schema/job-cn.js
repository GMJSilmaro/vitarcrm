import { z } from 'zod';

export const calibrationItemSchema = z.object({
  calibrateId: z.string(),
  certificateNumber: z.string(),
  equipmentId: z.string(),
  description: z.string(),
  serialNumber: z.union([z.string(), z.number()]).transform((value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  }),
  make: z.string().default(''),
  model: z.string().default(''),
  isBroken: z.boolean().default(false),
  isInOperative: z.boolean().default(false),
  isRequireAccessories: z.boolean().default(false),
  others: z.string().default(''),
  isSelected: z.boolean().default(false),
});

export const customerNotificationSchema = z.object({
  cnId: z.string().min(1, { message: 'CN ID is required' }),
  jobId: z.union([
    z.string({ message: 'Job is required' }).min(1, { message: 'Job is required' }),
    z
      .record(z.string(), z.any(), {
        message: 'Job is required',
        invalid_type_error: 'Job is required',
        required_error: 'Job is required',
      })
      .transform((formData) => {
        if (typeof formData === 'object' && formData !== null) return formData.value;
        return null;
      }),
  ]),
  to: z.string().min(1, { message: 'To is required' }),
  yourRef: z.string().default(''),
  attention: z.string().default(''),
  faxNo: z.string().default(''),
  isBeforeCalibration: z.boolean().default(false),
  isDuringCalibration: z.boolean().default(false),
  isAfterCalibration: z.boolean().default(false),
  calibrationItems: z
    .array(calibrationItemSchema)
    .min(1, { message: 'Calibrated instruments must be at least one' })
    .refine(
      (items) => {
        if (!items || items.length < 1) return false;
        const selectedItems = items.filter((item) => item.isSelected);
        return selectedItems.length > 0;
      },
      { message: 'Please select at least one calibration item' }
    ),
  isSendTheAccessories: z.boolean().default(false),
  isArrangeForCollection: z.boolean().default(false),
  isAcknowledgeConfirm: z.boolean().default(false),
  isOthers: z.boolean().default(false),
  others: z.string().default(''),
  worker: z.union([
    z.string({ message: 'Technician is required' }).min(1, { message: 'Technician is required' }),
    z
      .record(z.string(), z.any(), {
        message: 'Technician is required',
        invalid_type_error: 'Technician is required',
        required_error: 'Technician is required',
      })
      .transform((formData) => {
        if (typeof formData === 'object' && formData !== null) return formData.value;
        return null;
      }),
  ]),
  forVitarLabUseIsProceed: z.boolean().default(false),
  forVitarLabUseIsNoCalibrationRequired: z.boolean().default(false),
  forVitarLabUseIsOthers: z.boolean().default(false),
  forVitarLabUseOthers: z.string().default(''),
  forVitarLabUseAuthorizeBy: z.union([
    z
      .string({ message: 'Authorized by is required' })
      .min(1, { message: 'Authorized by is required' }),
    z
      .record(z.string(), z.any(), {
        message: 'Authorized by is required',
        invalid_type_error: 'Authorized by is required',
        required_error: 'Authorized by is required',
      })
      .transform((formData) => {
        if (typeof formData === 'object' && formData !== null) return formData.value;
        return null;
      }),
  ]),
  customerReplyRemarks: z.string().default(''),
  customerReplyAuthorizeSignature: z.string().min(1, { message: 'P.I.C signature is required' }),
});
