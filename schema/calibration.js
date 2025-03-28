import { coerce, z } from 'zod';

export const CATEGORY = [
  'TEMPERATURE & HUMIDITY',
  'PRESSURE',
  'ELECTRICAL',
  'DIMENSIONAL',
  'VOLUMETRIC',
  'MECHANICAL',
];

export const RANGE_TYPE = ['single']; //* Temporay remove "multiple" type

export const TRACEABILITY_TYPE = ['1', '2', '3'];
export const TRACEABILITY_MAP = {
  1: 'The measurement results included in this document are traceable to Malaysian national measurement standards maintained by the National Metrology Institute of Malaysia ( NMIM ). NMIM is a signatory to the CIPM MRA.',
  2: 'The measurement results included in this document are traceable to the SI system of units and/or to units of measurement realised at the National Metrology Institute of Malaysia ( NMIM ) and other recognised national metrology institutes.',
  3: "The measurement results included in this document are traceable to Malaysia's national standards through SAMM 109, 011 and 088 via calibration	Certificate No. as indicated below. Standards Malaysia is a signatory to the ILAC MRA.",
};

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
export const TEST_LOADS = ['C1', 'E1', 'E2', 'E3', 'E4', 'C2'];

export const NOMINAL_VALUE = [
  10000, 20000, 30000, 60000, 90000, 120000, 150000, 180000, 210000, 240000, 270000, 300000,
];

export const EXPANDED_UNCERTAINTY = [
  '± 8.25387',
  '± 8.27607',
  '± 8.55097',
  '± 9.11629',
  '± 10.48890',
  '± 11.50768',
  '± 13.40877',
  '± 14.65014',
  '± 16.80634',
  '± 18.15783',
  '± 20.44483',
  '± 21.85559',
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
    serialNumber: z.string().default(''),
    category: z.union([categoryEnum, z.record(z.string(), z.any())]).transform((formData) => {
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
          return { id: formData.id, name: formData.name };
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
    dateReceived: z.string().min(1, { message: 'Date Received is required' }),
    dateCalibrated: z.string().min(1, { message: 'Date Calibrated is required' }),
  })
  .refine(
    (formObj) => {
      console.log({ formObj });

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
  typeOfBalance: z.string().default(''),
  calibrationLocation: z.string().default(''),
  rangeMaxCalibration: z.coerce.number({
    message: 'Maximum Range Calibration is required',
  }),
  rangeMinCalibration: z.coerce.number({
    message: ' Minimum Range Calibration is required',
  }),
  rangeMaxRHumidity: z.coerce.number({
    message: ' Maximum Range R. Humidity is required',
  }),
  rangeMinRHumidity: z.coerce.number({
    message: ' Minimum Range R. Humidity is required',
  }),
  maxTemperature: z.coerce.number({
    message: 'Maximum Temperature is required',
  }),
  minTemperature: z.coerce.number({
    message: 'Minimum Temperature is required',
  }),
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

export const dfnvCalibrationPointSchema = z.object({
  data: z.array(z.array(z.string().min(1, 'Please enter a value')).default([])).default([]),
});

export const dfnvSchema = z.object({
  calibrationPoints: z.array(dfnvCalibrationPointSchema),
  ids: z.array(z.array(z.string())),
});

export const rTestSchema = z.object({
  half: z.array(z.coerce.number()).default([]),
  max: z.array(z.coerce.number()).default([]),
  maxError: z.coerce.number().default(0),
  std: z.array(z.coerce.number()).default([]),
  maxDiffBetweenReadings: z.array(z.coerce.number()).default([]),
});

export const eTestSchema = z.object({
  testLoad: z.coerce.number().default(0),
  values: z.array(z.coerce.number()).default([]),
  maxError: z.coerce.number().default(0),
});

export const calibrationMassSchema = z.object({
  data: z.object({
    nominalValues: z.array(z.coerce.number()).default([]),
    measuredValuesM: z.array(z.coerce.number()).default([]),
    corrections: z.array(z.coerce.number()).default([]),
    expandedUncertainties: z.array(z.coerce.number()).default([]),
    measuredValues: z.array(z.array(z.coerce.number())).default([]),
    coverageFactors: z.array(z.coerce.number()).default([]),
    dfnv: z.array(dfnvSchema).default([]),
    rtest: rTestSchema,
    etest: eTestSchema,
    d1: z.coerce.number().default(0),
    d2: z.coerce.number().default(0),
  }),
});

export const calibrationSchema = z
  .object({})
  .merge(calibrationInfoSchema._def.schema._def.schema)
  .merge(calibrationReferenceInstrumentsSchema)
  .merge(calibrationMeasurementSchema)
  .merge(calibrationMassSchema);
