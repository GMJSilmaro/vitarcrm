import { z } from 'zod';
import { categoryEnum, dateReceivedRequested, dueDateRequested } from './common-enums';
import { STATUS } from './common-constant';

//* Calibration Summary Form Schema
export const calibrationSummarySchema = z
  .object({
    jobId: z.string().min(1, 'Job ID is required'),
    calibrateId: z.string().min(1, 'Calibrate ID is required'),
    certificateNumber: z.string().min(1, 'Certificate No is required'),
    serialNumber: z.string().default(''),
    status: z.union([z.enum(STATUS), z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
    category: z.union([categoryEnum, z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
    variant: z
      .union([z.string().min(1, 'Variant is required'), z.record(z.string(), z.any())])
      .transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
    approvedSignatory: z
      .record(z.string(), z.any(), {
        message: 'Please select approved signatory',
        required_error: 'Please select approved signatory',
        invalid_type_error: 'Please select approved signatory',
      })
      .transform((formData) => {
        if (typeof formData === 'object') {
          return { uid: formData.uid, id: formData.id, name: formData.name };
        }
        return null;
      }),
    calibratedBy: z
      .record(z.string(), z.any(), {
        message: 'Please select calibrated by',
        required_error: 'Please select calibrated by',
        invalid_type_error: 'Please select calibrated by',
      })
      .transform((formData) => {
        if (typeof formData === 'object') {
          return { id: formData.id, name: formData.name };
        }
        return null;
      }),
    description: z
      .record(z.string(), z.any(), {
        message: 'Please select equipment',
        required_error: 'Please select equipment',
      })
      .transform((formData) => {
        if (typeof formData === 'object') {
          return { id: formData.id, name: formData.description };
        }
        return null;
      }),
    dateReceivedRequested: z
      .union([dateReceivedRequested, z.record(z.string(), z.any())])
      .transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
    dueDateRequested: z
      .union([dueDateRequested, z.record(z.string(), z.any())])
      .transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
    dueDateDuration: z.coerce
      .number()
      .max(60, { message: 'Please enter a duration of at most 60 months' })
      .nullish(),
    dueDate: z.string().nullish(),
    dateIssued: z.string().default(''),
    dateReceived: z.string().nullish(),
    dateCalibrated: z.string().min(1, { message: 'Date Calibrated is required' }),
  })
  .refine(
    (formObj) => {
      if (formObj.dueDateRequested === 'no') return true;

      //** value is yes
      return (
        formObj.dueDateRequested === 'yes' &&
        (formObj.dueDateDuration || formObj.dueDateDuration > 1)
      );
    },
    { message: 'Due Date Duration is required', path: ['dueDateDuration'] }
  )
  .refine(
    (formObj) => {
      if (formObj.dateReceivedRequested === 'no') return true;

      //** value is yes
      return formObj.dateReceivedRequested === 'yes' && formObj.dateReceived;
    },
    { message: 'Date Received is required', path: ['dateReceived'] }
  )
  .refine(
    (formObj) => {
      if (formObj.dueDateRequested === 'no') return true;

      //** value is yes
      return formObj.dueDateRequested === 'yes' && formObj.dueDate;
    },
    { message: 'Due date is required', path: ['dueDate'] }
  );

//* Calibration Reference Instruments Form Schema
export const calibrationReferenceInstrumentsSchema = z.object({
  instruments: z
    .union([
      z.array(z.string()).min(1, {
        message:
          'Reference instrument is required, plese update the job and add at atleast one equipment',
      }),
      z.array(z.record(z.string(), z.any())),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.map((instrument) => instrument.id);
      return formData;
    }),
  cocInstruments: z.array(z.string()),
});
