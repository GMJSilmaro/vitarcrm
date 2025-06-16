import { z } from 'zod';

export const PRIORITY_LEVELS = ['normal', 'urgent'];
export const PRIORITY_LEVELS_COLOR = {
  normal: 'secondary',
  urgent: 'warning',
};
export const SCOPE_TYPE = ['lab', 'site'];
export const SCOPE_TYPE_COLOR = {
  lab: 'info',
  site: 'warning',
};
export const STATUS = [
  'job-confirm',
  'job-in-progress',
  'job-validation',
  'job-cancel',
  'job-complete',
  'job-reschedule',
];
export const STATUS_COLOR = {
  'job-confirm': 'info',
  'job-in-progress': 'primary',
  'job-validation': 'success',
  'job-cancel': 'danger',
  'job-complete': 'purple',
  'job-reschedule': 'warning',
};

//* Role
//* - Admin
//* - Technician
//* - Sales
//* - Supervisor

const priorityEnum = z.enum(PRIORITY_LEVELS, {
  message: 'Please select a job priority level.',
});
const scopeEnum = z.enum(SCOPE_TYPE, {
  message: 'Please select a job scope type.',
});

export const equipmentSchema = z.object({
  equipment: z
    .union([
      z.string({
        message: 'Please select equipment',
        required_error: 'Please select equipment',
        invalid_type_error: 'Please select equipment',
      }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
});

export const referenceEquipmentSchema = z.object({
  equipments: z
    .array(
      z.record(z.string(), z.any()).transform((formData) => {
        if (typeof formData === 'object') {
          return {
            id: formData.inventoryId,
            name: formData.description,
            certificateNo: formData.certificateNo,
          };
        }
        return null;
      })
    )
    .min(1, { message: 'Please select at least one equipment.' }),
});

export const customerEquipmentSchema = z.object({
  customerEquipments: z
    .array(
      z.record(z.string(), z.any(), {}).transform((formData) => {
        if (typeof formData === 'object') {
          return {
            id: formData?.id || '',
            description: formData?.description || '',
            make: formData?.make || '',
            model: formData?.model || '',
            serialNumber: formData?.serialNumber || '',
            category: formData?.category || '',
          };
        }
        return null;
      })
    )
    .default([]),
});

export const summarySchema = z.object({
  jobRequestId: z
    .union([z.string().nullish().default(null), z.record(z.string(), z.any())])
    .transform((formData) => {
      if (formData !== null && typeof formData === 'object') return formData.value;
      return null;
    }),
  customer: z
    .record(z.string(), z.any(), {
      message: 'Please select customer',
      required_error: 'Please select customer',
    })
    .transform((formData) => {
      if (typeof formData === 'object') {
        return { id: formData.id, name: formData.name };
      }
      return null;
    }),
  contact: z
    .record(z.string(), z.any(), {
      message: 'Please select contact',
      required_error: 'Please select contact',
    })
    .transform((formData) => {
      if (typeof formData === 'object') {
        return {
          id: formData.id,
          name: formData.firstName + ' ' + formData.lastName,
        };
      }
      return null;
    })
    .nullish()
    .default(null),
  location: z
    .record(z.string(), z.any(), {
      message: 'Please select location',
      required_error: 'Please select location',
    })
    .transform((formData) => {
      if (typeof formData === 'object') return { id: formData.siteId, name: formData.siteName };
      return null;
    }),
});

export const taskSchema = z.object({
  name: z.string().min(1, { message: 'Task title is required.' }),
  description: z.string().default(''),
  isCompleted: z.boolean().default(false),
  isPriority: z.boolean().default(false),
});

export const tasksSchema = z.object({
  tasks: z.array(taskSchema).default([]),
});

export const scheduleSchema = z
  .object({
    jobId: z.string().min(1, { message: 'Job No. is required.' }),
    status: z.union([z.enum(STATUS), z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
    workers: z
      .array(z.record(z.string(), z.any()))
      .min(1, { message: 'Please select at least 1 technician' })
      .transform((formData) => {
        if (typeof formData === 'object') {
          if (formData.length < 1) return [];
          return formData.map((el) => ({ id: el.id, name: el.name, uid: el.uid }));
        }
        return null;
      }),
    scope: z.union([scopeEnum, z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
    priority: z.union([priorityEnum, z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
    description: z.string().default(''),
    remarks: z.string().default(''),
    startDate: z
      .string({
        invalid_type_error: 'Start date is required.',
        required_error: 'Start date is required.',
      })
      .min(1, { message: 'Start date is required.' }),
    startTime: z
      .string({
        invalid_type_error: 'Start time is required.',
        required_error: 'Start time is required.',
      })
      .min(1, { message: 'Start time is required.' }),
    endDate: z
      .string({
        invalid_type_error: 'End date is required.',
        required_error: 'End date is required.',
      })
      .min(1, { message: 'End date is required.' }),
    endTime: z
      .string({
        invalid_type_error: 'End time is required.',
        required_error: 'End time is required.',
      })
      .min(1, { message: 'End time is required.' }),
    team: z
      .union([
        z
          .string({
            message: 'Please select team',
            required_error: 'Please select team',
          })
          .default(''),
        z.record(z.string(), z.any()),
      ])
      .transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
  })
  .refine(
    (formObj) => {
      const startDate = new Date(formObj.startDate);
      const endDate = new Date(formObj.endDate);

      return (
        startDate < endDate ||
        (startDate.getFullYear() === endDate.getFullYear() &&
          startDate.getMonth() === endDate.getMonth() &&
          startDate.getDate() === endDate.getDate())
      );
    },
    {
      message: 'End date must be greater than or equal to the start date.',
      path: ['endDate'],
    }
  )
  .refine(
    (formObj) => {
      const startDate = new Date(formObj.startDate);
      const endDate = new Date(formObj.endDate);

      const [startHours, startMinutes] = formObj.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formObj.endTime.split(':').map(Number);

      if (startDate < endDate) return true; // If end date is greater, time check is unnecessary

      if (startDate.getTime() === endDate.getTime()) {
        if (endHours > startHours || (endHours === startHours && endMinutes > startMinutes)) {
          return true;
        }
        return false;
      }

      return true;
    },
    {
      message: 'End time must be greater than start time when dates are the same.',
      path: ['endTime'],
    }
  );

const checklistEquipmentSchema = z.object({
  id: z.string(),
  tagId: z.string(),
  description: z.string(),
  nominalValue: z.string().default(''),
  acceptance: z.string().default(''),
  resultBefore: z.string().default(''),
  resultAfter: z.string().default(''),
});

export const calibrationChecklistSchema = z.object({
  takenByBefore: z.union([
    z.string().default(''),
    z.record(z.string(), z.any()).transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return '';
    }),
  ]),
  takenByAfter: z.union([
    z.string().default(''),
    z.record(z.string(), z.any()).transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return '';
    }),
  ]),
  verifiedByBefore: z.union([
    z.string().default(''),
    z.record(z.string(), z.any()).transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return '';
    }),
  ]),
  verifiedByAfter: z.union([
    z.string().default(''),
    z.record(z.string(), z.any()).transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return '';
    }),
  ]),
  checklistEquipments: z.array(checklistEquipmentSchema).default([]),
});

const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  type: z.string(),
  size: z.number(),
  uploadedAt: z.any(),
  path: z.string(),
});

export const documentsSchema = z.object({
  documents: z.array(documentSchema).default([]),
});

export const cmrSchema = z.object({
  pic: z.string().min(1, { message: 'P.I.C is required' }),
  recalibrationInterval: z.string().min(1, { message: 'Recalibration Interval is required' }),
  accessories: z.string().min(1, { message: 'Accessories is required' }),
  remark: z.string().min(1, { message: 'Remarks is required' }),
  conditionWhenReceived: z.string().min(1, { message: 'Condition When Received is required' }),
  isPartialRange: z.boolean().default(false),
  isNonAccredited: z.boolean().default(false),
  isOpenWiringConnection: z.boolean().default(false),
  isAdjustments: z.boolean().default(false),
  telFax: z.string().default(''),
  others: z.string().default(''),
  salesSignature: z.string().min(1, { message: 'Laboratory Representative Signature is required' }),
  workerSignature: z.string().min(1, { message: 'Reviewed By Signature is required' }),
  customerSignature: z.string().min(1, { message: 'Customer Signature is required' }),
});

export const jobSchema = z
  .object({})
  .merge(summarySchema)
  .merge(customerEquipmentSchema)
  .merge(tasksSchema)
  .merge(referenceEquipmentSchema)
  .merge(scheduleSchema._def.schema._def.schema)
  .merge(calibrationChecklistSchema)
  .merge(documentsSchema);
