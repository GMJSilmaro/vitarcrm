//* roles
//* admin
//* supervisor
//* technician
//* sales

import { z } from 'zod';

export const ROLES = ['admin', 'supervisor', 'technician', 'sales'];
export const GENDER = ['male', 'female'];

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
  middleName: z.string().min(1, 'Middle Name is required'),
  isFieldWorker: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
  dateOfBirth: z.string().default(''),
  gender: z.union([genderEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  role: z.union([roleEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  password: z.string().min(1, 'Password is required'),
});

export const contactInfoSchema = z.object({
  primaryPhone: z.string().min(1, 'Primary Phone is required'),
  secondaryPhone: z.string().default(''),
  isPrimaryPhoneActive: z.boolean().default(false),
  isSecondaryPhoneActive: z.boolean().default(false),
});
