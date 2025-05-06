//* roles
//* admin
//* supervisor
//* technician
//* sales

import { z } from 'zod';

export const ROLES = ['admin', 'supervisor', 'technician', 'sales'];
export const GENDER = ['male', 'female'];
export const EMERGENCY_CONTACT_RELATIONSHIP = ['parent', 'spouse', 'sibling', 'child', 'other'];

export const CATEGORY = [
  'TEMPERATURE & HUMIDITY',
  'PRESSURE',
  'ELECTRICAL',
  'DIMENSIONAL',
  'VOLUMETRIC',
  'MASS',
];

export const genderEnum = z.enum(GENDER, {
  message: 'Please select a gender',
});

export const roleEnum = z.enum(ROLES, {
  message: 'Please select a role',
});

const addressSchema = z.object({
  postalCode: z.string().default(''),
  stateProvince: z.string().default(''),
  streetAddress: z.string().default(''),
});

export const personalInfoSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }).min(1, 'Email is required'),
  workerId: z.string().min(1, 'Worker ID is required'),
  profilePicture: z.string().default(''),
  shortBio: z.string().default(''),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  middleName: z.string().default(''),
  isFieldWorker: z.boolean().default(false),
  categories: z
    .array(z.union([z.record(z.string(), z.any())]))
    .default([])
    .transform((formData) => {
      if (typeof formData === 'object') {
        if (formData !== null && formData.length < 1) return [];
        if (formData === null) return [];

        return formData.map((el) => {
          if (typeof el === 'object') return el.value;
          return el;
        });
      }
      return [];
    }),
  isActive: z.boolean().default(false),
  dateOfBirth: z.string().default(''),
  expirationDate: z.string().default(''),
  gender: genderEnum,
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.union([roleEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
});

export const contactInfoSchema = z.object({
  primaryPhone: z.string().min(1, 'Primary Phone is required'),
  secondaryPhone: z.string().default(''),
  isPrimaryPhoneActive: z.boolean().default(false),
  isSecondaryPhoneActive: z.boolean().default(false),
  address: addressSchema,
  emergencyContactName: z.string().default(''),
  emergencyContactPhone: z.string().default(''),
  emergencyRelationship: z
    .union([z.string(), z.record(z.string(), z.any())])
    .nullish()
    .default('')
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return '';
    }),
});

export const skillsSchemn = z.object({
  skills: z.array(z.string().min(1, 'Skill is required')).default([]),
});

export const userSchema = z
  .object({})
  .merge(personalInfoSchema)
  .merge(contactInfoSchema)
  .merge(skillsSchemn);
