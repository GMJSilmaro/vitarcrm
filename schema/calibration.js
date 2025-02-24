import { z } from 'zod';

export const CATEGORY = [
  'TEMPERATURE & HUMIDITY',
  'PRESSURE',
  'ELECTRICAL',
  'DIMENSIONAL',
  'VOLUMETRIC',
  'MECHANICAL',
  'MASS',
];

export const RANGE_TYPE = ['single', 'multiple'];
export const TRACEABILITY_TYPE = ['1', '2', '3'];
export const RESOLUTION = [
  '0.000001',
  '0.00001',
  '0.0001',
  '0.0002',
  '0.0005',
  '0.001',
  '0.002',
  '0.005',
  '0.01',
  '0.02',
  '0.05',
  '0.1',
  '0.2',
  '0.5',
  '1',
  '2',
  '5',
  '10',
  '20',
  '25',
  '50',
  '100',
  '200',
  '250',
  '500',
  '1000',
  '2000',
  '2500',
  '5000',
  '10000',
];
export const UNIT_USED_FOR_COC = ['gram', 'kilogram'];
export const CALIBRATION_POINT_NO = ['6', '7', '8', '9', '10', '11', '12'];
export const CALIBRATED_AT = ['site'];
export const DUE_DATE_REQUESTED = ['yes', 'no'];

export const NOMINAL_VALUE = [
  10000, 20000, 30000, 60000, 90000, 120000, 150000, 180000, 210000, 240000, 270000, 300000,
];

export const dueDateRequested = z.enum(DUE_DATE_REQUESTED, {
  message: 'Please select due date requested',
});

export const calibratedAtEnum = z.enum(CALIBRATED_AT, {
  message: 'Please select a calibrated at',
});

const categoryEnum = z.enum(CATEGORY, {
  message: 'Please select a calibration category',
});

export const rangeTypeEnum = z.enum(RANGE_TYPE, {
  message: 'Please select a range type',
});

export const traceabilityTypeEnum = z.enum(TRACEABILITY_TYPE, {
  message: 'Please select a traceability type',
});

export const resolutionEnum = z.enum(RESOLUTION, {
  message: 'Please select a resolution',
});

export const unitUsedForCOCEnum = z.enum(UNIT_USED_FOR_COC, {
  message: 'Please select a unit used for COC',
});

export const calibrationPointNoEnum = z.enum(CALIBRATION_POINT_NO, {
  message: 'Please select a calibration point no',
});

export const calibrationInfoSchema = z
  .object({
    jobId: z.string().min(1, 'Job ID is required'),
    calibrateId: z.string().min(1, 'Calibrate ID is required'),
    certificateNumber: z.string().min(1, 'Certificate No is required'),
    location: z.object({ id: z.string(), name: z.string() }, { message: 'Location is required' }),
    category: z.union([categoryEnum, z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
    submittedBy: z
      .record(z.string(), z.any(), {
        message: 'Submitted By is required',
        required_error: 'Submitted By is required',
        invalid_type_error: 'Submitted By is required',
      })
      .transform((formData) => {
        if (typeof formData === 'object') {
          return { id: formData.id, name: formData.name };
        }
        return null;
      }),
    approvedSignatory: z
      .record(z.string(), z.any(), {
        message: 'Please select approved signatory',
        required_error: 'Please select approved signatory',
        invalid_type_error: 'Please select approved signatory',
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
    make: z.string(),
    model: z.string().nullish(),
    serialNumber: z.string().nullish(),
    dueDateRequested: z
      .union([dueDateRequested, z.record(z.string(), z.any())])
      .transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
    dueDateDuration: z.coerce.number().nullish(),
    dueDate: z.string().nullish(),
    dateIssued: z.string().min(1, { message: 'Date Issued is required' }),
    dateReceived: z.string().min(1, { message: 'Date Received is required' }),
    dateCalibrated: z.string().min(1, { message: 'Date Calibrated is required' }),
    calibratedAt: z
      .union([calibratedAtEnum, z.record(z.string(), z.any())])
      .transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
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
      if (formObj.dueDateRequested === 'no') return true;

      //** value is yes
      return formObj.dueDateRequested === 'yes' && formObj.dueDate;
    },
    { message: 'Due date is required', path: ['dueDate'] }
  );

export const calibrationMeasurementSchema = z.object({
  rangeType: z.union([rangeTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  traceabilityType: z
    .union([traceabilityTypeEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  resolution: z.union([resolutionEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  unitUsedForCOC: z
    .union([unitUsedForCOCEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  calibrationPointNo: z
    .union([calibrationPointNoEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  rangeMaxCalibration: z.coerce.number({ message: 'Maximum Range Calibration is required' }),
  rangeMinCalibration: z.coerce.number({ message: ' Minimum Range Calibration is required' }),
  rangeMaxRHumidity: z.coerce.number({ message: ' Maximum Range R. Humidity is required' }),
  rangeMinRHumidity: z.coerce.number({ message: ' Minimum Range R. Humidity is required' }),
  maxTemperature: z.coerce.number({ message: 'Maximum Temperature is required' }),
  minTemperature: z.coerce.number({ message: 'Minimum Temperature is required' }),
});

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
});

export const testInputDataSchema = z.object({
  data: z.coerce.number({ message: 'Please enter a value' }).refine((value) => value > 0, {
    message: 'Please enter a value',
  }),
});

export const calibrationMassPointSchema = z.object({
  nominalValue: z.coerce.number(),
  data: z.array(z.array(z.coerce.number()).default([])).default([]),
});

export const calibrationMassEntrySchema = z.object({
  equipmentId: z.string(),
  tagId: z.string(),
  description: z.string(),
  calibrationPoints: z.array(calibrationMassPointSchema),
});

export const calibrationMassSchema = z.object({
  dfnv: z.array(calibrationMassEntrySchema),
});

export const calibrationSchema = z
  .object({})
  .merge(calibrationInfoSchema._def.schema._def.schema)
  .merge(calibrationReferenceInstrumentsSchema)
  .merge(calibrationMeasurementSchema)
  .merge(calibrationMassSchema);
