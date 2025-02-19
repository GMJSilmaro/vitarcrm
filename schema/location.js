import { z } from 'zod';

export const STATUS = ['active', 'inactive'];

export const basicInfoSchema = z.object({
  siteId: z.string().min(1, { message: 'Site ID is required.' }),
  siteName: z.string().min(1, { message: 'Site name is required.' }),
  customer: z
    .record(z.string(), z.any(), {
      message: 'Please select customer.',
      required_error: 'Please select customer.',
    })
    .transform((formData) => {
      if (typeof formData === 'object') {
        return { id: formData.id, name: formData.name };
      }
      return null;
    }),
  status: z
    .union([
      z.enum(STATUS),
      z.record(z.string(), z.any(), { required_error: 'Please select status.' }),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
});

export const addressSchema = z.object({
  street1: z.string().min(1, { message: 'Street 1 is required.' }),
  street2: z.string().default(''),
  street3: z.string().default(''),
  province: z.string().min(1, { message: 'Province is required.' }),
  city: z.string().min(1, { message: 'City is required.' }),
  postalCode: z.string().min(1, { message: 'Postcode is required.' }),
  country: z
    .union([
      z.string({
        message: 'Please select a country.',
      }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  isDefault: z.boolean().default(false),
  longitude: z.string().default(''),
  latitude: z.string().default(''),
});

export const addressesSchema = z.object({
  addresses: z.array(addressSchema).min(1, { message: 'Please add at least one address.' }),
});

export const contactSchema = z.object({
  id: z
    .union([
      z.string().min(1, { message: 'Please select a contact or create a new contact.' }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  firstName: z.string().min(1, { message: 'First Name is required' }),
  lastName: z.string().min(1, { message: 'Last Name is required' }),
  phone: z.string().min(1, { message: 'Phone is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  isDefault: z.boolean().default(false),
  additionalInformation: z.record(z.string(), z.any()).default({}),
});

export const contactsSchema = z.object({
  contacts: z.array(contactSchema).default([]).nullish(),
});

export const locationSchema = z
  .object({})
  .merge(basicInfoSchema)
  .merge(addressesSchema)
  .merge(contactsSchema);
