import { z } from 'zod';

export const STATUS = [
  'job-requested',
  'request-approved',
  'request-cancelled',
  'request-resubmit',
  'request-resubmission',
];

export const STATUS_COLOR = {
  'job-requested': 'info',
  'request-approved': 'success',
  'request-cancelled': 'danger',
  'request-resubmit': 'secondary',
  'request-resubmission': 'warning',
};

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

export const summarySchema = z
  .object({
    jobRequestId: z.string().min(1, { message: 'Job Request ID is required' }),
    customer: z
      .record(z.string(), z.any(), {
        message: 'Please select customer',
        required_error: 'Please select customer',
      })
      .transform((formData) => {
        if (typeof formData === 'object' && formData !== null) {
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
        if (typeof formData === 'object' && formData !== null) {
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
    supervisor: z
      .record(z.string(), z.any(), {
        message: 'Please select supervisor',
        required_error: 'Please select supervisor',
        invalid_type_error: 'Please select supervisor',
      })
      .transform((formData) => {
        if (typeof formData === 'object') {
          return { uid: formData.uid, id: formData.id, name: formData.name };
        }
        return null;
      }),
    status: z.enum(STATUS),
    startDate: z.string().default(''),
    startTime: z.string().default(''),
    endDate: z.string().default(''),
    endTime: z.string().default(''),
  })
  .refine(
    (formObj) => {
      if (!formObj.startDate || !formObj.endDate) return true;

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
      if (!formObj.startDate || !formObj.endDate || !formObj.startTime || !formObj.endTime)
        return true;

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

export const taskSchema = z.object({
  name: z.string().min(1, { message: 'Task title is required.' }),
  description: z.string().default(''),
  isCompleted: z.boolean().default(false),
  isPriority: z.boolean().default(false),
});

export const tasksSchema = z.object({
  tasks: z.array(taskSchema).default([]),
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

export const jobRequestSchema = z
  .object({})
  .merge(summarySchema._def.schema._def.schema)
  .merge(customerEquipmentSchema)
  .merge(tasksSchema)
  .merge(documentsSchema);
