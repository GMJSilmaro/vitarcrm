import { z } from 'zod';

export const PRIORITY_LEVELS = ['normal', 'urgent'];
export const SCOPE_TYPE = ['lab', 'site'];
export const STATUS = [
  'created',
  'confirmed',
  'in progress',
  'completed',
  'cancelled',
  'rejected',
  'validated',
];

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

export const ReferenceEquipmentSchema = z.object({
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
    .nullish(),
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
  name: z.string().min(1, { message: 'Task name is required.' }),
  description: z.string().min(1, { message: 'Task description is required.' }),
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

export const jobSchema = z
  .object({})
  .merge(summarySchema)
  .merge(customerEquipmentSchema)
  .merge(tasksSchema)
  .merge(ReferenceEquipmentSchema)
  .merge(scheduleSchema._def.schema._def.schema);
