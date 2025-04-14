import { z } from 'zod';

export const STATUS = ['created', 'approved', 'cancelled', 'incomplete'];

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
0;
export const summarySchema = z.object({
  jobRequestId: z.string().min(1, { message: 'Job Request ID is required' }),
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
  supervisor: z
    .record(z.string(), z.any(), {
      message: 'Please select supervisor',
      required_error: 'Please select supervisor',
      invalid_type_error: 'Please select supervisor',
    })
    .transform((formData) => {
      if (typeof formData === 'object') {
        return { id: formData.id, name: formData.name };
      }
      return null;
    }),
  status: z.enum(STATUS).default('created'),
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

export const jobRequestSchema = z
  .object({})
  .merge(summarySchema)
  .merge(customerEquipmentSchema)
  .merge(tasksSchema);
